import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { logAdminAction } from "@/services/auditLogService";
import { agentPermissionsService } from "@/services/agentPermissionsService";

/**
 * GOVERNANCE POLICY: Agent Approval Endpoint
 * 
 * STRICT AUTHORITY RULES:
 * - ONLY Chairman (employees.role_category = 'chairman') can approve agents
 * - super_admin, manager_admin, worker_admin, staff, agents, and members are PROHIBITED
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Require admin role - blocks agents and members
  const auth = await requireAdminRole(req, res);
  if (!auth) return; // Middleware handles rejection

  try {
    const { agent_user_id, reason } = req.body;

    // STRICT ENFORCEMENT: Only Chairman can approve
    // LEGACY: super_admin/manager_admin checks removed
    const isChairman = await agentPermissionsService.isChairman(auth.userId);

    if (!isChairman) {
      // Log unauthorized attempt for audit trail
      await logAdminAction({
        actorId: auth.userId,
        action: "AGENT_APPROVE_ATTEMPT_DENIED",
        targetUserId: agent_user_id,
        details: {
          attempted_role: auth.userRole,
          reason: "Agent approvals are restricted to Chairman",
          governance_policy: "STRICT_APPROVAL_AUTHORITY"
        },
      });

      return res.status(403).json({ 
        error: "Forbidden: Agent approvals are restricted to Chairman only",
        governance_policy: "Agent approvals are restricted to Chairman"
      });
    }

    // Validation
    if (!agent_user_id) {
      return res.status(400).json({ error: "Agent user ID is required" });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: "Reason is required for approval" });
    }

    if (reason.trim().length < 10) {
      return res.status(400).json({ error: "Reason must be at least 10 characters" });
    }

    // Get current agent profile
    const { data: agentProfile, error: agentError } = await supabase
      .from("profiles")
      .select("role, email, full_name, agent_status")
      .eq("id", agent_user_id)
      .single();

    if (agentError || !agentProfile) {
      return res.status(404).json({ error: "Agent profile not found" });
    }

    // Verify agent is in pending status
    if (agentProfile.agent_status !== "PENDING") {
      return res.status(400).json({ 
        error: `Agent is not in pending status. Current status: ${agentProfile.agent_status}` 
      });
    }

    const previousStatus = agentProfile.agent_status;
    const newStatus = "ACTIVE";

    // Update agent status to approved
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        role: "agent",
        agent_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", agent_user_id);

    if (updateError) {
      console.error("Error updating agent status:", updateError);
      return res.status(500).json({ error: "Failed to approve agent" });
    }

    // Create audit log entry with governance context
    await logAdminAction({
      actorId: auth.userId,
      action: "AGENT_APPROVED",
      targetUserId: agent_user_id,
      tableName: "profiles",
      recordId: agent_user_id,
      oldValues: { agent_status: previousStatus },
      newValues: { agent_status: newStatus, role: "agent" },
      details: { 
        reason: reason.trim(),
        governance_policy: "STRICT_APPROVAL_AUTHORITY",
        approved_by_role: auth.userRole
      },
    });

    console.log(`Agent approved: ${agentProfile.email} by ${auth.userRole} ${auth.userEmail}`);

    return res.status(200).json({ 
      message: "Agent approved successfully",
      agent: {
        id: agent_user_id,
        email: agentProfile.email,
        full_name: agentProfile.full_name,
        previous_status: previousStatus,
        new_status: newStatus
      },
      approved_by: {
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