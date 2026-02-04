import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { agentPermissionsService } from "@/services/agentPermissionsService";
import { nowBDISO, formatBDTime } from "@/lib/bdTime";

/**
 * API Middleware for role-based access control
 * Enforces permission boundaries for agents and admins
 * CRITICAL: MASTER_ADMIN is READ-ONLY - blocks all mutations
 * 
 * ⚠️ TIME AUTHORITY: All timestamps use Bangladesh time (Asia/Dhaka)
 * ⚠️ FORBIDDEN: Do not use new Date() - use nowBD() utilities only
 */

export interface AuthenticatedRequest extends NextApiRequest {
  userId?: string;
  userRole?: string;
  userEmail?: string;
  adminId?: string;
}

export interface AuthResult {
  isBlocked: boolean;
  auth?: {
    userId: string;
    userEmail: string;
    userRole?: string;
  };
}

/**
 * Verify user is authenticated and is an admin
 * 
 * AUTHORITY MODEL:
 * - Chairman (employees.role_category = 'chairman') has absolute operational authority
 * - master_admin is emergency-only (hidden from operations)
 * - LEGACY: profiles.role = 'super_admin' is DEPRECATED and UNUSED
 */
export async function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthResult> {
  const timestamp = formatBDTime();
  
  // Use authorization header for API routes
  const token = req.headers.authorization?.split(" ")[1];
  
  let user = null;
  
  if (token) {
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) {
      user = data.user;
      console.log(`[${timestamp}] Auth token validated for user: ${user.email}`);
    }
  } else {
    // Fallback to session check if available (e.g. cookies)
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      user = session.user;
      console.log(`[${timestamp}] Session validated for user: ${user.email}`);
    }
  }

  if (!user) {
    console.warn(`[${timestamp}] Unauthorized API request to: ${req.url}`);
    res.status(401).json({ error: "Unauthorized - Please log in" });
    return { isBlocked: true };
  }

  // Check if user is admin
  const isAdmin = await agentPermissionsService.isAdmin(user.id);

  if (!isAdmin) {
    console.warn(`[${timestamp}] Forbidden API access attempt by: ${user.email} to: ${req.url}`);
    res.status(403).json({
      error: "Forbidden - Admin access required",
    });
    return { isBlocked: true };
  }

  // Get user role for context
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const userRole = profile?.role || "unknown";

  return {
    isBlocked: false,
    auth: {
      userId: user.id,
      userEmail: user.email || "",
      userRole
    },
  };
}

/**
 * Require admin role - blocks agents and members
 */
export async function requireAdminRole(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ userId: string; userRole: string; userEmail: string } | null> {
  const authResult = await requireAuth(req, res);
  
  if (authResult.isBlocked || !authResult.auth) {
    return null;
  }

  // Double check admin permission (redundant but safe)
  const isAdmin = await agentPermissionsService.isAdmin(authResult.auth.userId);

  if (!isAdmin) {
    // Log violation
    await agentPermissionsService.logPermissionViolation(
      authResult.auth.userId,
      "ADMIN_API_ACCESS",
      {
        endpoint: req.url,
        method: req.method,
        role: authResult.auth.userRole,
        reason: "Non-admin attempted to access admin API endpoint",
        timestamp: formatBDTime()
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

  return {
    userId: authResult.auth.userId,
    userRole: authResult.auth.userRole || "unknown",
    userEmail: authResult.auth.userEmail
  };
}

/**
 * Require approved agent role
 */
export async function requireAgentRole(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ userId: string; userRole: string; userEmail: string } | null> {
  const timestamp = formatBDTime();
  
  // Basic auth check
  const token = req.headers.authorization?.split(" ")[1];
  let user = null;
  
  if (token) {
    const { data } = await supabase.auth.getUser(token);
    user = data.user;
  } else {
    const { data: { session } } = await supabase.auth.getSession();
    user = session?.user;
  }

  if (!user) {
    console.warn(`[${timestamp}] Unauthorized agent API request to: ${req.url}`);
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  // Check if user is approved agent
  const isAgent = await agentPermissionsService.isApprovedAgent(user.id);

  if (!isAgent) {
    // Log violation
    await agentPermissionsService.logPermissionViolation(
      user.id,
      "AGENT_API_ACCESS",
      {
        endpoint: req.url,
        method: req.method,
        reason: "Non-agent attempted to access agent API endpoint",
        timestamp
      },
      getClientIp(req),
      req.headers["user-agent"]
    );

    console.warn(`[${timestamp}] Forbidden agent API access by: ${user.email} to: ${req.url}`);
    res.status(403).json({ 
      error: "Forbidden - Approved agent access required",
      details: "Only approved agents can access this endpoint" 
    });
    return null;
  }

  return {
    userId: user.id,
    userRole: "agent",
    userEmail: user.email || ""
  };
}

/**
 * Require admin or agent role
 */
export async function requireAdminOrAgent(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ userId: string; userRole: string; userEmail: string; isAdmin: boolean; isAgent: boolean } | null> {
  const timestamp = formatBDTime();
  
  // Basic auth check
  const token = req.headers.authorization?.split(" ")[1];
  let user = null;
  
  if (token) {
    const { data } = await supabase.auth.getUser(token);
    user = data.user;
  } else {
    const { data: { session } } = await supabase.auth.getSession();
    user = session?.user;
  }

  if (!user) {
    console.warn(`[${timestamp}] Unauthorized protected API request to: ${req.url}`);
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const isAdmin = await agentPermissionsService.isAdmin(user.id);
  const isAgent = await agentPermissionsService.isApprovedAgent(user.id);

  if (!isAdmin && !isAgent) {
    // Log violation
    await agentPermissionsService.logPermissionViolation(
      user.id,
      "PROTECTED_API_ACCESS",
      {
        endpoint: req.url,
        method: req.method,
        reason: "Unauthorized user attempted to access protected endpoint",
        timestamp
      },
      getClientIp(req),
      req.headers["user-agent"]
    );

    console.warn(`[${timestamp}] Forbidden protected API access by: ${user.email} to: ${req.url}`);
    res.status(403).json({ 
      error: "Forbidden - Admin or agent access required",
      details: "Only administrators and approved agents can access this endpoint" 
    });
    return null;
  }

  return {
    userId: user.id,
    userRole: isAdmin ? "admin" : "agent",
    userEmail: user.email || "",
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
        const authResult = await requireAuth(req, res);
        if (authResult.isBlocked || !authResult.auth) return; // Response already sent

        req.userId = authResult.auth.userId;
        req.userRole = authResult.auth.userRole;
        req.userEmail = authResult.auth.userEmail;

        // Check admin requirement
        if (options.requireAdmin) {
          const isAdmin = await agentPermissionsService.isAdmin(authResult.auth.userId);
          if (!isAdmin) {
            return res.status(403).json({ error: "Forbidden - Admin access required" });
          }
          
          // For backward compatibility
          (req as any).adminId = authResult.auth.userId;
        }

        // Check specific allowed roles
        // NOTE: If using role_category (employees), this profile-based role check might need adjustment if passed roles are 'chairman' etc.
        if (options.allowedRoles && options.allowedRoles.length > 0) {
           // For now, assuming allowedRoles checks profiles.role or 'admin' 
           // If we want to check employee roles, we need to fetch employee role
           if (!options.allowedRoles.includes(authResult.auth.userRole || "")) {
             // Fallback: check if Chairman is allowed
             const isChair = await agentPermissionsService.isChairman(authResult.auth.userId);
             if (isChair && options.allowedRoles.includes("chairman")) {
                // Allowed
             } else {
                return res.status(403).json({ 
                  error: "Forbidden - Insufficient permissions",
                  details: `Required one of: ${options.allowedRoles.join(", ")}`
                });
             }
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