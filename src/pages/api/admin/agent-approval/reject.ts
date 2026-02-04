import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { logAdminAction } from "@/services/auditLogService";
import { agentPermissionsService } from "@/services/agentPermissionsService";

/**
 * GOVERNANCE POLICY: Agent Rejection Endpoint
 * 
 * STRICT AUTHORITY RULES:
 * - ONLY super_admin and manager_admin roles can reject agents
 * - worker_admin, staff, agents, and members are PROHIBITED
 * 
 * RATIONALE:
 * Agent rejections are restricted to Admin/Super Admin to prevent:
 * 1. Conflicts of interest (agents rejecting competitors)
 * 2. Corruption or favoritism
 * 3. Unauthorized access escalation
 * 
 * This is a non-negotiable governance requirement for platform integrity.
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

    // STRICT ENFORCEMENT: Only Chairman can reject agent applications
    const isChairman = await agentPermissionsService.isChairman(auth.userId);
    if (!isChairman) {
      // Log unauthorized attempt
      await agentPermissionsService.logPermissionViolation(
        auth.userId,
        "AGENT_REJECTION_ATTEMPT",
        { agent_user_id, attempted_action: "reject", governance_policy: "Agent rejection is restricted to Chairman" },
        req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "unknown",
        req.headers["user-agent"]
      );
      return res.status(403).json({
        success: false,
        error: "Forbidden: Chairman access required",
        details: "Agent rejection is restricted to Chairman"
      });
    }

    // Validation
    if (!agent_user_id) {
      return res.status(400).json({ error: "Agent user ID is required" });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: "Reason is required for rejection" });
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
    const newStatus = "REJECTED";

    // Update agent status to rejected
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        role: "member", // Rejected agents return to member status
        agent_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", agent_user_id);

    if (updateError) {
      console.error("Error updating agent status:", updateError);
      return res.status(500).json({ error: "Failed to reject agent" });
    }

    // Create audit log entry with governance context
    await logAdminAction({
      actorId: auth.userId,
      action: "AGENT_REJECTED",
      targetUserId: agent_user_id,
      tableName: "profiles",
      recordId: agent_user_id,
      oldValues: { agent_status: previousStatus, role: agentProfile.role },
      newValues: { agent_status: newStatus, role: "member" },
      details: { 
        reason: reason.trim(),
        governance_policy: "STRICT_APPROVAL_AUTHORITY",
        rejected_by_role: auth.userRole
      },
    });

    console.log(`Agent rejected: ${agentProfile.email} by ${auth.userRole} ${auth.userEmail}`);

    return res.status(200).json({ 
      message: "Agent application rejected",
      agent: {
        id: agent_user_id,
        email: agentProfile.email,
        full_name: agentProfile.full_name,
        previous_status: previousStatus,
        new_status: newStatus
      },
      rejected_by: {
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