import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Employee = Database["public"]["Tables"]["employees"]["Row"];

/**
 * AUTHORITY TRANSFER: super_admin replaces chairman as FINAL OPERATIONAL AUTHORITY
 * 
 * super_admin = SINGLE FINAL AUTHORITY for ALL operations
 * chairman = LEGACY role, NO operational authority
 */

/**
 * Check if user is Super Admin (FINAL OPERATIONAL AUTHORITY)
 * Replaces chairman as the highest authority in the system
 */
export async function isSuperAdmin(userId?: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const { data: employee, error } = await supabase
      .from("employees")
      .select("role_category")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error checking super admin status:", error);
      return false;
    }

    // Cast to string to avoid TypeScript enum overlap error
    return (employee?.role_category as string) === "super_admin";
  } catch (error) {
    console.error("Error checking super admin status:", error);
    return false;
  }
}

/**
 * Check if user is an Admin (any admin role)
 */
export async function isAdmin(userId?: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) return false;

    return ["super_admin", "manager_admin", "worker_admin"].includes(
      profile?.role || ""
    );
  } catch (error) {
    return false;
  }
}

/**
 * Check if user is an Approved Agent
 */
export async function isApprovedAgent(userId?: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, agent_status")
      .eq("id", userId)
      .maybeSingle();

    return profile?.role === "agent" && profile?.agent_status === "approved";
  } catch (error) {
    return false;
  }
}

/**
 * Check if admin has permission to view scam reports
 * AUTHORITY: Super Admin (replaces chairman)
 */
export async function canViewScamReports(userId?: string): Promise<boolean> {
  if (!userId) return false;

  const uid = userId;
  
  // Check if super admin (FINAL AUTHORITY)
  if (await isSuperAdmin(uid)) return true;

  // Check for manager/worker admin roles
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", uid)
    .maybeSingle();

  return ["manager_admin", "worker_admin"].includes(profile?.role || "");
}

/**
 * Check if user can view agent requests
 * AUTHORITY: Super Admin, Manager Admin, Worker Admin
 */
export async function canViewAgentRequests(userId?: string): Promise<boolean> {
  if (!userId) return false;

  // Super Admin has full access
  if (await isSuperAdmin(userId)) return true;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return ["manager_admin", "worker_admin"].includes(profile?.role || "");
}

/**
 * Check if user can view member details
 * AUTHORITY: Super Admin OR assigned agent
 */
export async function canViewMember(
  userId?: string,
  memberId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  if (!userId) {
    return { allowed: false, reason: "User ID required" };
  }

  const uid = userId;

  try {
    // Verify agent assignment
    // CASTING SUPABASE TO ANY TO AVOID DEEP TYPE INSTANTIATION ERROR
    const { data } = await (supabase as any)
      .from("agent_requests")
      .select("assigned_agent_id")
      .eq("user_id", memberId)
      .maybeSingle();
      
    if (data) {
      return { allowed: true };
    }

    return { allowed: false, reason: "Not assigned to this member" };
  } catch (error) {
    console.error("Error checking member view permission:", error);
    return { allowed: false, reason: "Permission check failed" };
  }
}

/**
 * AUTHORITY: Super Admin only (replaces chairman)
 */
export async function canAssignAgentRequests(userId?: string): Promise<boolean> {
  return await isSuperAdmin(userId);
}

/**
 * AUTHORITY: Super Admin only (replaces chairman)
 */
export async function canApproveIdentityVerifications(userId?: string): Promise<boolean> {
  return await isSuperAdmin(userId);
}

/**
 * AUTHORITY: Super Admin only (replaces chairman)
 */
export async function canRejectAgents(userId?: string): Promise<boolean> {
  return await isSuperAdmin(userId);
}

/**
 * AUTHORITY: Super Admin only (replaces chairman)
 */
export async function canSuspendAgents(userId?: string): Promise<boolean> {
  return await isSuperAdmin(userId);
}

/**
 * AUTHORITY: Super Admin only (replaces chairman)
 */
export async function canReinstateAgents(userId?: string): Promise<boolean> {
  return await isSuperAdmin(userId);
}

/**
 * AUTHORITY: Super Admin only (replaces chairman)
 */
export async function canApproveAgents(userId?: string): Promise<boolean> {
  return await isSuperAdmin(userId);
}

/**
 * AUTHORITY: Super Admin and Manager Admin
 */
export async function canViewAgentApprovalAudit(userId?: string): Promise<boolean> {
  if (!userId) return false;

  const uid = userId;
  const superAdmin = await isSuperAdmin(uid);
  if (superAdmin) return true;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", uid)
    .maybeSingle();

  return profile?.role === "manager_admin";
}

/**
 * AUTHORITY: Super Admin only (replaces chairman)
 */
export async function canVerifyScamReports(userId?: string): Promise<boolean> {
  return await isSuperAdmin(userId);
}

/**
 * AUTHORITY: Super Admin and admin roles
 */
export async function canUpdateCaseNotes(
  userId?: string,
  requestId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  if (!userId) return { allowed: false, reason: "User ID required" };

  const uid = userId;
  const superAdmin = await isSuperAdmin(uid);
  if (superAdmin) return { allowed: true };

  try {
    // CASTING SUPABASE TO ANY TO AVOID DEEP TYPE INSTANTIATION ERROR
    const { data } = await (supabase as any)
      .from("agent_requests")
      .select("assigned_agent_id")
      .eq("id", requestId)
      .maybeSingle();
    
    const request = data as { assigned_agent_id: string | null } | null;
      
    if (request?.assigned_agent_id === userId) {
      return { allowed: true };
    }

    return { allowed: false, reason: "Not assigned to this request" };
  } catch (error) {
    console.error("Error checking case notes permission:", error);
    return { allowed: false, reason: "Permission check failed" };
  }
}

/**
 * Log permission violations (audit trail)
 */
export async function logPermissionViolation(
  userId: string,
  action: string,
  resource: string,
  reason: string
): Promise<void> {
  try {
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: `PERMISSION_VIOLATION: ${action}`,
      resource_type: resource,
      details: { reason, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error("Failed to log permission violation:", error);
  }
}

/**
 * Log agent approval actions (audit trail)
 */
export async function logAgentApprovalAction(
  adminId: string,
  agentId: string,
  action: string,
  notes: string
): Promise<void> {
  try {
    await supabase.from("audit_logs").insert({
      user_id: adminId,
      action: `AGENT_APPROVAL: ${action}`,
      resource_type: "agent_verification",
      resource_id: agentId,
      details: { 
        action, 
        notes, 
        agentId,
        timestamp: new Date().toISOString() 
      },
    });
  } catch (error) {
    console.error("Failed to log agent approval action:", error);
  }
}

export const agentPermissionsService = {
  isSuperAdmin,
  isAdmin,
  isApprovedAgent,
  canViewScamReports,
  canViewAgentRequests,
  canAssignAgentRequests,
  canApproveIdentityVerifications,
  canApproveAgents,
  canRejectAgents,
  canSuspendAgents,
  canReinstateAgents,
  canViewAgentApprovalAudit,
  canVerifyScamReports,
  canViewMember,
  canUpdateCaseNotes,
  logPermissionViolation,
  logAgentApprovalAction
};