import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { agentPermissionsService } from "@/services/agentPermissionsService";

/**
 * API Middleware for role-based access control
 * Enforces permission boundaries for agents and admins
 */

export interface AuthenticatedRequest extends NextApiRequest {
  userId?: string;
  userRole?: string;
  userEmail?: string;
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
 * Require admin role - blocks agents and members
 */
export async function requireAdminRole(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ userId: string; userRole: string; userEmail: string } | null> {
  const auth = await requireAuth(req, res);
  
  if (!auth) {
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