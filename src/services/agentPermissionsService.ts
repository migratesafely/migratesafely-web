import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

/**
 * Agent Permissions Service
 * 
 * AUTHORITY MODEL:
 * - Chairman (employees.role_category = 'chairman') has ABSOLUTE authority over all operations
 * - Managing Director, General Manager, Department Heads have subordinate authority
 * - master_admin is emergency-only, hidden from operations
 * 
 * LEGACY NOTE:
 * - profiles.role = 'super_admin' is DEPRECATED and UNUSED
 * - All operational authority flows through employees.role_category
 */

interface PermissionResult {
  allowed: boolean;
  reason?: string;
  violationType?: string;
}

/**
 * Check if user is Chairman (absolute operational authority)
 */
export async function isChairman(userId: string): Promise<boolean> {
  const { data: employee } = await supabase
    .from("employees")
    .select("role_category")
    .eq("user_id", userId)
    .single();

  return employee?.role_category === "chairman";
}

/**
 * Check if user is an admin (has any admin role OR is Chairman)
 * Updated to include Chairman as a valid admin for permission checks
 */
export async function isAdmin(userId: string): Promise<boolean> {
  // Check if Chairman (highest admin authority)
  if (await isChairman(userId)) {
    return true;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (!profile) return false;

  // Admin roles: master_admin (emergency only), manager_admin, worker_admin
  // LEGACY: super_admin is DEPRECATED - not checked here
  return ["master_admin", "manager_admin", "worker_admin"].includes(profile.role);
}

/**
 * Check if user has operational authority (Chairman, MD, GM, Dept Head)
 */
export async function hasOperationalAuthority(userId: string): Promise<boolean> {
  const { data: employee } = await supabase
    .from("employees")
    .select("role_category")
    .eq("user_id", userId)
    .single();

  if (!employee) return false;

  return ["chairman", "managing_director", "general_manager", "department_head"].includes(
    employee.role_category
  );
}

/**
 * Get user's employee role category
 */
export async function getEmployeeRole(userId: string): Promise<string | null> {
  const { data: employee } = await supabase
    .from("employees")
    .select("role_category")
    .eq("user_id", userId)
    .single();

  return employee?.role_category || null;
}

/**
 * Check if user is an approved agent
 */
export async function isApprovedAgent(userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, agent_status")
    .eq("id", userId)
    .single();

  return profile?.role === "agent" && profile?.agent_status === "ACTIVE";
}

/**
 * Log a permission violation
 */
export async function logPermissionViolation(
  userId: string,
  violationType: string,
  details: any,
  ipAddress: string,
  userAgent?: string
): Promise<void> {
  console.warn(`PERMISSION VIOLATION [${violationType}] User: ${userId}`, details);
  
  try {
    // Attempt to log to audit logs if table exists, otherwise just console
    await supabase.from("audit_logs").insert({
      actor_id: userId,
      action: "PERMISSION_VIOLATION",
      details: {
        violation_type: violationType,
        ...details,
        ip: ipAddress,
        user_agent: userAgent
      }
    });
  } catch (err) {
    console.error("Failed to log permission violation to DB", err);
  }
}

/**
 * Check if user can manage prize draws
 * AUTHORITY: Chairman only
 */
export async function canManagePrizeDraws(userId: string): Promise<boolean> {
  return await isChairman(userId);
}

/**
 * Check if user can manage agents
 * AUTHORITY: Chairman only
 */
export async function canManageAgents(userId: string): Promise<boolean> {
  return await isChairman(userId);
}

/**
 * Check if user can manage system settings
 * AUTHORITY: Chairman only
 */
export async function canManageSystemSettings(userId: string): Promise<boolean> {
  return await isChairman(userId);
}

/**
 * Check if user can manage admins
 * AUTHORITY: Chairman only
 */
export async function canManageAdmins(userId: string): Promise<boolean> {
  return await isChairman(userId);
}

/**
 * Check if user can approve identity verifications
 * AUTHORITY: Chairman only
 */
export async function canApproveIdentityVerifications(userId: string): Promise<boolean> {
  return await isChairman(userId);
}

/**
 * Check if user can verify scam reports
 * AUTHORITY: Chairman only
 */
export async function canVerifyScamReports(userId: string): Promise<boolean> {
  return await isChairman(userId);
}

/**
 * Check if user can view member details
 * AUTHORITY: Admins and Chairman (Always allowed)
 * AGENTS: Only if assigned
 */
export async function canViewMember(userId: string, targetMemberId?: string): Promise<PermissionResult> {
  if (await isAdmin(userId)) {
    return { allowed: true };
  }

  if (await isApprovedAgent(userId)) {
    if (!targetMemberId) return { allowed: false, reason: "Target member ID required", violationType: "MISSING_PARAM" };
    
    // Check assignment - Split query to avoid deep type instantiation
    // Cast to any to avoid TS2589 "excessively deep and possibly infinite" error
    const { data: assignment } = await (supabase as any)
      .from("agent_requests")
      .select("id")
      .eq("assigned_agent_id", userId)
      .eq("user_id", targetMemberId)
      .eq("status", "assigned")
      .maybeSingle();

    if (assignment) return { allowed: true };
    return { allowed: false, reason: "Member not assigned to agent", violationType: "UNAUTHORIZED_ACCESS" };
  }

  return { allowed: false, reason: "User not authorized", violationType: "UNAUTHORIZED_ROLE" };
}

/**
 * Check if user can update case notes
 * AUTHORITY: Admins, Chairman (Always allowed)
 * AGENTS: Only for their assigned requests
 */
export async function canUpdateCaseNotes(userId: string, requestId?: string): Promise<PermissionResult> {
  if (await isAdmin(userId)) {
    return { allowed: true };
  }

  if (await isApprovedAgent(userId)) {
    if (!requestId) return { allowed: false, reason: "Request ID required", violationType: "MISSING_PARAM" };

    const { data: request } = await supabase
      .from("agent_requests")
      .select("id")
      .eq("id", requestId)
      .eq("assigned_agent_id", userId)
      .single();

    if (request) return { allowed: true };
    return { allowed: false, reason: "Request not assigned to agent", violationType: "UNAUTHORIZED_ACCESS" };
  }

  return { allowed: false, reason: "User not authorized", violationType: "UNAUTHORIZED_ROLE" };
}

export const agentPermissionsService = {
  isAdmin,
  isChairman,
  hasOperationalAuthority,
  getEmployeeRole,
  isApprovedAgent,
  logPermissionViolation,
  canManagePrizeDraws,
  canManageAgents,
  canManageSystemSettings,
  canManageAdmins,
  canApproveIdentityVerifications,
  canVerifyScamReports,
  canViewMember,
  canUpdateCaseNotes
};