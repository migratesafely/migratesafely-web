import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { logAdminAction } from "@/services/auditLogService";
import { agentPermissionsService } from "@/services/agentPermissionsService";

/**
 * PHASE AGENT-ONBOARD-1A: Suspend agent
 * STRICT AUTHORITY: Only super_admin and manager_admin
 * worker_admin is PROHIBITED from suspending agents
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  try {
    // Only Chairman can suspend agents
    const isChairman = await agentPermissionsService.isChairman(auth.userId);
    
    if (!isChairman) {
      return res.status(403).json({ success: false, error: "Forbidden: Chairman access required" });
    }

    const { agent_user_id, reason } = req.body;

    // STRICT ENFORCEMENT: Only super_admin and manager_admin
    if (!["super_admin", "manager_admin"].includes(auth.userRole)) {
      // Log unauthorized attempt in audit_logs
      await supabase.from("audit_logs").insert({
        admin_id: auth.userId,
        action: "AGENT_SUSPEND_ATTEMPT_DENIED",
        entity_type: "agent_approval",
        entity_id: agent_user_id,
        changes: {
          attempted_role: auth.userRole,
          reason: "Worker admins are not authorized to suspend agents",
        },
      });

      return res.status(403).json({ 
        error: "Forbidden: Only Super Admins and Manager Admins can suspend agents" 
      });
    }

    // Validation
    if (!agent_user_id) {
      return res.status(400).json({ error: "Agent user ID is required" });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: "Reason is required for suspension" });
    }

    if (reason.trim().length < 20) {
      return res.status(400).json({ error: "Reason must be at least 20 characters for suspension" });
    }

    // Get current agent profile
    const { data: agentProfile, error: agentError } = await supabase
      .from("profiles")
      .select("role, email, full_name")
      .eq("id", agent_user_id)
      .single();

    if (agentError || !agentProfile) {
      return res.status(404).json({ error: "Agent profile not found" });
    }

    // Verify agent is currently active (not pending or already suspended)
    if (agentProfile.role !== "agent") {
      return res.status(400).json({ 
        error: `Can only suspend active agents. Current status: ${agentProfile.role}` 
      });
    }

    const previousRole = agentProfile.role;
    const newRole = "agent_suspended";

    // Update agent role to suspended
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq("id", agent_user_id);

    if (updateError) {
      console.error("Error suspending agent:", updateError);
      return res.status(500).json({ error: "Failed to suspend agent" });
    }

    // Create audit log entry
    const { error: auditError } = await supabase
      .from("agent_approval_audit_log")
      .insert({
        agent_user_id,
        admin_user_id: auth.userId,
        admin_role: auth.userRole as any,
        action_type: "suspend",
        previous_role: previousRole,
        new_role: newRole,
        reason: reason.trim()
      });

    if (auditError) {
      console.error("Error creating audit log:", auditError);
      // Continue even if audit log fails (agent is already suspended)
    }

    // Create audit log entry with governance context
    await logAdminAction({
      actorId: auth.userId,
      action: "AGENT_SUSPENDED",
      targetUserId: agent_user_id,
      tableName: "profiles",
      recordId: agent_user_id,
      oldValues: { agent_status: previousRole },
      newValues: { agent_status: newRole },
      details: { 
        reason: reason.trim(),
        governance_policy: "STRICT_APPROVAL_AUTHORITY",
        suspended_by_role: auth.userRole
      },
    });

    console.log(`Agent suspended: ${agentProfile.email} by ${auth.userRole} ${auth.userEmail}`);

    return res.status(200).json({ 
      message: "Agent suspended successfully",
      agent: {
        id: agent_user_id,
        email: agentProfile.email,
        full_name: agentProfile.full_name,
        previous_status: previousRole,
        new_status: newRole
      },
      suspended_by: {
        id: auth.userId,
        role: auth.userRole,
        email: auth.userEmail
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}