import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { agentPermissionsService } from "@/services/agentPermissionsService";

/**
 * API Middleware for role-based access control
 * Enforces permission boundaries for agents and admins
 * CRITICAL: MASTER_ADMIN is READ-ONLY - blocks all mutations
 */

export interface AuthenticatedRequest extends NextApiRequest {
  userId?: string;
  userRole?: string;
  userEmail?: string;
  adminId?: string;
}

/**
 * Verify user is authenticated
 */
export async function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ userId: string; userRole: string; userEmail: string } | null> {
  try {
    // Get session from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized - No token provided" });
      return null;
    }

    const token = authHeader.substring(7);
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: "Unauthorized - Invalid token" });
      return null;
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, email")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      res.status(401).json({ error: "Unauthorized - Profile not found" });
      return null;
    }

    return {
      userId: user.id,
      userRole: profile.role || "member",
      userEmail: profile.email || user.email || "",
    };
  } catch (error) {
    console.error("Error in requireAuth:", error);
    res.status(500).json({ error: "Internal server error" });
    return null;
  }
}

/**
 * CRITICAL: Block MASTER_ADMIN from all mutation operations
 * Master Admin is READ-ONLY - can only view data, never modify
 */
function blockMasterAdminMutations(
  req: NextApiRequest,
  res: NextApiResponse,
  userRole: string
): boolean {
  if (userRole === "master_admin") {
    // Allow only GET requests (read-only)
    if (req.method !== "GET") {
      res.status(403).json({
        error: "Forbidden - Master Admin access is read-only",
        details: "Master Admin cannot create, update, or delete data. This role is for oversight and auditing only.",
        allowedMethods: ["GET"],
        blockedMethod: req.method,
      });
      return true; // Blocked
    }
  }
  return false; // Not blocked
}

/**
 * Require admin role - blocks agents and members
 * CRITICAL: Also enforces Master Admin read-only restrictions
 */
export async function requireAdminRole(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ userId: string; userRole: string; userEmail: string } | null> {
  const auth = await requireAuth(req, res);
  
  if (!auth) {
    return null;
  }

  // CRITICAL: Block Master Admin mutations before other checks
  if (blockMasterAdminMutations(req, res, auth.userRole)) {
    return null;
  }

  // Check if user is admin
  const isAdmin = await agentPermissionsService.isAdmin(auth.userId);

  if (!isAdmin) {
    // Log violation
    await agentPermissionsService.logPermissionViolation(
      auth.userId,
      "ADMIN_API_ACCESS",
      {
        endpoint: req.url,
        method: req.method,
        role: auth.userRole,
        reason: "Non-admin attempted to access admin API endpoint",
      },
      getClientIp(req),
      req.headers["user-agent"]
    );

    res.status(403).json({ 
      error: "Forbidden - Admin access required",
      details: "Only administrators can access this endpoint" 
    });
    return null;
  }

  return auth;
}

/**
 * Require approved agent role
 */
export async function requireAgentRole(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ userId: string; userRole: string; userEmail: string } | null> {
  const auth = await requireAuth(req, res);
  
  if (!auth) {
    return null;
  }

  // Check if user is approved agent
  const isAgent = await agentPermissionsService.isApprovedAgent(auth.userId);

  if (!isAgent) {
    // Log violation
    await agentPermissionsService.logPermissionViolation(
      auth.userId,
      "AGENT_API_ACCESS",
      {
        endpoint: req.url,
        method: req.method,
        role: auth.userRole,
        reason: "Non-agent attempted to access agent API endpoint",
      },
      getClientIp(req),
      req.headers["user-agent"]
    );

    res.status(403).json({ 
      error: "Forbidden - Approved agent access required",
      details: "Only approved agents can access this endpoint" 
    });
    return null;
  }

  return auth;
}

/**
 * Require admin or agent role
 */
export async function requireAdminOrAgent(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ userId: string; userRole: string; userEmail: string; isAdmin: boolean; isAgent: boolean } | null> {
  const auth = await requireAuth(req, res);
  
  if (!auth) {
    return null;
  }

  const isAdmin = await agentPermissionsService.isAdmin(auth.userId);
  const isAgent = await agentPermissionsService.isApprovedAgent(auth.userId);

  if (!isAdmin && !isAgent) {
    // Log violation
    await agentPermissionsService.logPermissionViolation(
      auth.userId,
      "PROTECTED_API_ACCESS",
      {
        endpoint: req.url,
        method: req.method,
        role: auth.userRole,
        reason: "Unauthorized user attempted to access protected endpoint",
      },
      getClientIp(req),
      req.headers["user-agent"]
    );

    res.status(403).json({ 
      error: "Forbidden - Admin or agent access required",
      details: "Only administrators and approved agents can access this endpoint" 
    });
    return null;
  }

  return {
    ...auth,
    isAdmin,
    isAgent,
  };
}

/**
 * Get client IP address from request
 */
function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string" 
    ? forwarded.split(",")[0] 
    : req.socket.remoteAddress || "unknown";
  
  return ip;
}

/**
 * Check specific permission and return 403 if denied
 */
export async function checkPermission(
  userId: string,
  permissionCheck: () => Promise<{ allowed: boolean; reason?: string; violationType?: string }>,
  res: NextApiResponse
): Promise<boolean> {
  const result = await permissionCheck();

  if (!result.allowed) {
    res.status(403).json({
      error: "Forbidden - Insufficient permissions",
      details: result.reason,
      violationType: result.violationType,
    });
    return false;
  }

  return true;
}

/**
 * Higher-order function for API middleware
 * CRITICAL: Enforces Master Admin read-only restrictions
 */
export function apiMiddleware(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void | unknown>,
  options: {
    requireAuth?: boolean;
    requireAdmin?: boolean;
    allowedRoles?: string[];
  } = {}
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // Check authentication if required
      if (options.requireAuth || options.requireAdmin || options.allowedRoles) {
        const auth = await requireAuth(req, res);
        if (!auth) return; // Response already sent

        req.userId = auth.userId;
        req.userRole = auth.userRole;
        req.userEmail = auth.userEmail;

        // CRITICAL: Block Master Admin mutations for ALL authenticated routes
        if (blockMasterAdminMutations(req, res, auth.userRole)) {
          return; // Response already sent (403 Forbidden)
        }

        // Check admin requirement
        if (options.requireAdmin) {
          const isAdmin = await agentPermissionsService.isAdmin(auth.userId);
          if (!isAdmin) {
            return res.status(403).json({ error: "Forbidden - Admin access required" });
          }
          
          // For backward compatibility with some services that might check req.adminId
          (req as any).adminId = auth.userId;
        }

        // Check specific allowed roles
        if (options.allowedRoles && options.allowedRoles.length > 0) {
          if (!options.allowedRoles.includes(auth.userRole)) {
            return res.status(403).json({ 
              error: "Forbidden - Insufficient permissions",
              details: `Required one of: ${options.allowedRoles.join(", ")}`
            });
          }
        }
      }

      // Execute handler
      await handler(req, res);
    } catch (error) {
      console.error("API Middleware Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}

/**
 * Convenience wrapper for authenticated routes
 */
export const withAuth = (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void | unknown>) => 
  apiMiddleware(handler, { requireAuth: true });
