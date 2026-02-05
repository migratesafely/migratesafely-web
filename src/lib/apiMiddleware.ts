import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { agentPermissionsService } from "@/services/agentPermissionsService";
import { nowBD } from "@/lib/bdTime";

/**
 * SERVER-SIDE TIME ZONE HANDLING
 * ALL API ENDPOINTS MUST USE BANGLADESH TIME (Asia/Dhaka)
 * 
 * CRITICAL RULES:
 * - Use nowBD() from @/lib/bdTime for current timestamp
 * - Use formatDateBD() for date formatting
 * - NEVER use new Date() directly
 * - All database timestamps stored in ISO format
 * - All comparisons done in Bangladesh time (Asia/Dhaka)
 * 
 * ⚠️ FORBIDDEN: Do not use new Date() - use nowBD() utilities only
 */

/**
 * Authentication result type
 */
interface AuthResult {
  isBlocked: boolean;
  auth: {
    supabase: ReturnType<typeof createClient<Database>>;
    user: { id: string; email?: string };
    profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
    userId: string;
    userRole: string | null;
    userEmail: string;
  } | null;
}

/**
 * Core authentication middleware
 * Validates JWT and returns user context
 */
export async function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthResult> {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ error: "Unauthorized - No token provided" });
    return { isBlocked: true, auth: null };
  }

  // Create server-side supabase client with user's token
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const userSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // Verify token and get user
  const {
    data: { user },
    error: authError,
  } = await userSupabase.auth.getUser();

  if (authError || !user) {
    res.status(401).json({ error: "Unauthorized - Invalid token" });
    return { isBlocked: true, auth: null };
  }

  // Get user profile with role
  const { data: profile, error: profileError } = await userSupabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
  }

  return {
    isBlocked: false,
    auth: {
      supabase: userSupabase,
      user,
      profile,
      userId: user.id,
      userRole: profile?.role || null,
      userEmail: user.email || "",
    },
  };
}

/**
 * Require admin role - blocks agents and members
 */
export async function requireAdminRole(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{
  supabase: ReturnType<typeof createClient<Database>>;
  user: { id: string; email?: string };
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  userId: string;
  userRole: string | null;
  userEmail: string;
} | null> {
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
      req.url || "unknown",
      "Non-admin attempted to access admin API endpoint"
    );

    res.status(403).json({
      error: "Forbidden - Admin access required",
      details: "Only administrators can access this endpoint",
    });
    return null;
  }

  return authResult.auth;
}

/**
 * Require approved agent role
 */
export async function requireAgentRole(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{
  supabase: ReturnType<typeof createClient<Database>>;
  user: { id: string; email?: string };
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  userId: string;
  userRole: string | null;
  userEmail: string;
} | null> {
  const authResult = await requireAuth(req, res);

  if (authResult.isBlocked || !authResult.auth) {
    return null;
  }

  // Check if user is an approved agent
  const isAgent = await agentPermissionsService.isApprovedAgent(authResult.auth.userId);

  if (!isAgent) {
    // Log violation
    await agentPermissionsService.logPermissionViolation(
      authResult.auth.userId,
      "AGENT_API_ACCESS",
      req.url || "unknown",
      "Non-agent attempted to access agent API endpoint"
    );

    res.status(403).json({
      error: "Forbidden - Approved agent access required",
      details: "Only approved agents can access this endpoint",
    });
    return null;
  }

  return authResult.auth;
}

/**
 * Flexible role-based access control
 * Supports multiple role types and custom validation
 */
interface RoleCheckOptions {
  allowedRoles?: string[];
  requireSuperAdmin?: boolean;
  requireAgent?: boolean;
  customValidator?: (auth: AuthResult["auth"]) => Promise<boolean>;
}

export async function requireRole(
  req: NextApiRequest,
  res: NextApiResponse,
  options: RoleCheckOptions = {}
): Promise<AuthResult["auth"]> {
  const authResult = await requireAuth(req, res);

  if (authResult.isBlocked || !authResult.auth) {
    return null;
  }

  const { auth } = authResult;

  // Super admin bypass (if enabled)
  if (options.requireSuperAdmin) {
    const isSuperAdmin = await agentPermissionsService.isSuperAdmin(auth.userId);
    if (!isSuperAdmin) {
      await agentPermissionsService.logPermissionViolation(
        auth.userId,
        "SUPER_ADMIN_ACCESS",
        req.url || "unknown",
        "Unauthorized user attempted to access super admin endpoint"
      );

      res.status(403).json({
        error: "Forbidden - Super Admin access required",
      });
      return null;
    }
    return auth;
  }

  // Agent role check
  if (options.requireAgent) {
    const isAgent = await agentPermissionsService.isApprovedAgent(auth.userId);
    if (!isAgent) {
      await agentPermissionsService.logPermissionViolation(
        auth.userId,
        "AGENT_ACCESS",
        req.url || "unknown",
        "Non-agent attempted to access agent-only endpoint"
      );

      res.status(403).json({
        error: "Forbidden - Approved agent access required",
      });
      return null;
    }
    return auth;
  }

  // Check specific allowed roles
  if (options.allowedRoles && options.allowedRoles.length > 0) {
    // NOTE: If using role_category (employees table), adjust this logic
    const userRole = auth.profile?.role;
    if (!userRole || !options.allowedRoles.includes(userRole)) {
      await agentPermissionsService.logPermissionViolation(
        auth.userId,
        "ROLE_ACCESS",
        req.url || "unknown",
        `Required role: ${options.allowedRoles.join(", ")}`
      );

      res.status(403).json({
        error: "Forbidden - Insufficient role permissions",
        requiredRoles: options.allowedRoles,
      });
      return null;
    }
  }

  // Custom validator
  if (options.customValidator) {
    const isValid = await options.customValidator(auth);
    if (!isValid) {
      await agentPermissionsService.logPermissionViolation(
        auth.userId,
        "CUSTOM_VALIDATION",
        req.url || "unknown",
        "Failed custom validation check"
      );

      res.status(403).json({
        error: "Forbidden - Custom validation failed",
      });
      return null;
    }
  }

  return auth;
}