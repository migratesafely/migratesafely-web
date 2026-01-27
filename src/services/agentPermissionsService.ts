import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "./auditLogService";

/**
 * Agent Permissions Service
 * Centralized permission checking and violation logging for agents
 */

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  violationType?: string;
}

export interface AgentPermissions {
  canViewAssignedMembers: boolean;
  canSendMessages: boolean;
  canUpdateCaseNotes: boolean;
  canApproveAgents: boolean;
  canAssignMembers: boolean;
  canModifyPrizeDraws: boolean;
  canModifyMemberEligibility: boolean;
  canModifyPayments: boolean;
  canAccessAdminSettings: boolean;
}

/**
 * Get agent permissions based on role
 */
export function getAgentPermissions(role: string): AgentPermissions {
  const isAgent = role === "agent";
  const isAdmin = ["worker_admin", "hr_admin", "manager_admin", "super_admin"].includes(role);
  
  return {
    // Agent CAN do these:
    canViewAssignedMembers: isAgent || isAdmin,
    canSendMessages: isAgent || isAdmin,
    canUpdateCaseNotes: isAgent || isAdmin,
    
    // Agent CANNOT do these (admin only):
    canApproveAgents: isAdmin,
    canAssignMembers: isAdmin,
    canModifyPrizeDraws: isAdmin,
    canModifyMemberEligibility: isAdmin,
    canModifyPayments: isAdmin,
    canAccessAdminSettings: isAdmin,
  };
}

/**
 * Check if user is an approved agent
 */
export async function isApprovedAgent(userId: string): Promise<boolean> {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, agent_status")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      return false;
    }

    return profile.role === "agent" && profile.agent_status === "ACTIVE";
  } catch (error) {
    console.error("Error checking agent status:", error);
    return false;
  }
}

/**
 * Check if user is any admin role
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      return false;
    }

    return ["worker_admin", "hr_admin", "manager_admin", "super_admin"].includes(profile.role || "");
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Log permission violation
 */
export async function logPermissionViolation(
  userId: string,
  action: string,
  details: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await logAdminAction({
      actorId: userId,
      action: `PERMISSION_VIOLATION_${action}`,
      details: {
        ...details,
        violation: true,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("Error logging permission violation:", error);
  }
}

/**
 * Check if agent can approve other agents
 */
export async function canApproveAgents(userId: string): Promise<PermissionCheckResult> {
  const admin = await isAdmin(userId);
  
  if (!admin) {
    await logPermissionViolation(userId, "APPROVE_AGENTS", {
      reason: "Agent attempted to approve other agents",
    });
    
    return {
      allowed: false,
      reason: "Only administrators can approve agents",
      violationType: "APPROVE_AGENTS",
    };
  }
  
  return { allowed: true };
}

/**
 * Check if agent can assign members to themselves or others
 */
export async function canAssignMembers(userId: string): Promise<PermissionCheckResult> {
  const admin = await isAdmin(userId);
  
  if (!admin) {
    await logPermissionViolation(userId, "ASSIGN_MEMBERS", {
      reason: "Agent attempted to assign members",
    });
    
    return {
      allowed: false,
      reason: "Only administrators can assign members to agents",
      violationType: "ASSIGN_MEMBERS",
    };
  }
  
  return { allowed: true };
}

/**
 * Check if agent can modify prize draws
 */
export async function canModifyPrizeDraws(userId: string): Promise<PermissionCheckResult> {
  const admin = await isAdmin(userId);
  
  if (!admin) {
    await logPermissionViolation(userId, "MODIFY_PRIZE_DRAWS", {
      reason: "Agent attempted to modify prize draws",
    });
    
    return {
      allowed: false,
      reason: "Only administrators can modify prize draws",
      violationType: "MODIFY_PRIZE_DRAWS",
    };
  }
  
  return { allowed: true };
}

/**
 * Check if agent can modify member eligibility
 */
export async function canModifyMemberEligibility(userId: string): Promise<PermissionCheckResult> {
  const admin = await isAdmin(userId);
  
  if (!admin) {
    await logPermissionViolation(userId, "MODIFY_MEMBER_ELIGIBILITY", {
      reason: "Agent attempted to modify member eligibility",
    });
    
    return {
      allowed: false,
      reason: "Only administrators can modify member eligibility",
      violationType: "MODIFY_MEMBER_ELIGIBILITY",
    };
  }
  
  return { allowed: true };
}

/**
 * Check if agent can modify payments
 */
export async function canModifyPayments(userId: string): Promise<PermissionCheckResult> {
  const admin = await isAdmin(userId);
  
  if (!admin) {
    await logPermissionViolation(userId, "MODIFY_PAYMENTS", {
      reason: "Agent attempted to modify payments",
    });
    
    return {
      allowed: false,
      reason: "Only administrators can modify payments",
      violationType: "MODIFY_PAYMENTS",
    };
  }
  
  return { allowed: true };
}

/**
 * Check if agent can access admin settings
 */
export async function canAccessAdminSettings(userId: string): Promise<PermissionCheckResult> {
  const admin = await isAdmin(userId);
  
  if (!admin) {
    await logPermissionViolation(userId, "ACCESS_ADMIN_SETTINGS", {
      reason: "Agent attempted to access admin settings",
    });
    
    return {
      allowed: false,
      reason: "Only administrators can access admin settings",
      violationType: "ACCESS_ADMIN_SETTINGS",
    };
  }
  
  return { allowed: true };
}

/**
 * Check if user can view specific member
 * Agents can only view members assigned to them
 */
export async function canViewMember(
  userId: string,
  memberId: string
): Promise<PermissionCheckResult> {
  const admin = await isAdmin(userId);
  
  // Admins can view any member
  if (admin) {
    return { allowed: true };
  }
  
  const agent = await isApprovedAgent(userId);
  
  if (!agent) {
    await logPermissionViolation(userId, "VIEW_MEMBER", {
      reason: "Non-agent attempted to view member",
      memberId,
    });
    
    return {
      allowed: false,
      reason: "Only agents and administrators can view member details",
      violationType: "VIEW_MEMBER",
    };
  }
  
  // Check if member is assigned to this agent
  const { data: assignment, error } = await supabase
    .from("agent_requests")
    .select("id")
    .eq("assigned_agent_id", userId)
    .eq("member_user_id", memberId)
    .single();
  
  if (error || !assignment) {
    await logPermissionViolation(userId, "VIEW_UNASSIGNED_MEMBER", {
      reason: "Agent attempted to view member not assigned to them",
      memberId,
    });
    
    return {
      allowed: false,
      reason: "You can only view members assigned to you",
      violationType: "VIEW_UNASSIGNED_MEMBER",
    };
  }
  
  return { allowed: true };
}

/**
 * Check if user can update case notes for a request
 * Agents can only update notes for their assigned requests
 */
export async function canUpdateCaseNotes(
  userId: string,
  requestId: string
): Promise<PermissionCheckResult> {
  const admin = await isAdmin(userId);
  
  // Admins can update any case notes
  if (admin) {
    return { allowed: true };
  }
  
  const agent = await isApprovedAgent(userId);
  
  if (!agent) {
    await logPermissionViolation(userId, "UPDATE_CASE_NOTES", {
      reason: "Non-agent attempted to update case notes",
      requestId,
    });
    
    return {
      allowed: false,
      reason: "Only agents and administrators can update case notes",
      violationType: "UPDATE_CASE_NOTES",
    };
  }
  
  // Check if request is assigned to this agent
  const { data: request, error } = await supabase
    .from("agent_requests")
    .select("id")
    .eq("id", requestId)
    .eq("assigned_agent_id", userId)
    .single();
  
  if (error || !request) {
    await logPermissionViolation(userId, "UPDATE_UNASSIGNED_CASE_NOTES", {
      reason: "Agent attempted to update case notes for request not assigned to them",
      requestId,
    });
    
    return {
      allowed: false,
      reason: "You can only update case notes for requests assigned to you",
      violationType: "UPDATE_UNASSIGNED_CASE_NOTES",
    };
  }
  
  return { allowed: true };
}

/**
 * Verify user has admin role - throws error if not
 * Use this in API endpoints that should be admin-only
 */
export async function requireAdmin(userId: string): Promise<void> {
  const admin = await isAdmin(userId);
  
  if (!admin) {
    await logPermissionViolation(userId, "ADMIN_ENDPOINT_ACCESS", {
      reason: "Non-admin attempted to access admin endpoint",
    });
    
    throw new Error("Admin access required");
  }
}

/**
 * Verify user is an approved agent - throws error if not
 * Use this in API endpoints that should be agent-only
 */
export async function requireApprovedAgent(userId: string): Promise<void> {
  const agent = await isApprovedAgent(userId);
  
  if (!agent) {
    await logPermissionViolation(userId, "AGENT_ENDPOINT_ACCESS", {
      reason: "Non-agent attempted to access agent endpoint",
    });
    
    throw new Error("Approved agent access required");
  }
}

export const agentPermissionsService = {
  getAgentPermissions,
  isApprovedAgent,
  isAdmin,
  logPermissionViolation,
  canApproveAgents,
  canAssignMembers,
  canModifyPrizeDraws,
  canModifyMemberEligibility,
  canModifyPayments,
  canAccessAdminSettings,
  canViewMember,
  canUpdateCaseNotes,
  requireAdmin,
  requireApprovedAgent,
};