import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * PHASE AGENT-ONBOARD-1A: Reinstate suspended agent
 * STRICT AUTHORITY: Only super_admin and manager_admin
 * worker_admin is PROHIBITED from reinstating agents
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get authorization token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization token" });
    }

    // Verify user session
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Check if user is admin with APPROVAL AUTHORITY
    const { data: adminProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !adminProfile) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { agent_user_id, reason } = req.body;

    // STRICT ENFORCEMENT: Only super_admin and manager_admin
    if (!["super_admin", "manager_admin"].includes(adminProfile.role)) {
      // Log unauthorized attempt in audit_logs
      await supabase.from("audit_logs").insert({
        admin_id: user.id,
        action: "AGENT_REINSTATE_ATTEMPT_DENIED",
        entity_type: "agent_approval",
        entity_id: agent_user_id,
        changes: {
          attempted_role: adminProfile.role,
          reason: "Worker admins are not authorized to reinstate agents",
        },
      });

      return res.status(403).json({ 
        error: "Forbidden: Only Super Admins and Manager Admins can reinstate agents" 
      });
    }

    // Validation
    if (!agent_user_id) {
      return res.status(400).json({ error: "Agent user ID is required" });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: "Reason is required for reinstatement" });
    }

    if (reason.trim().length < 20) {
      return res.status(400).json({ error: "Reason must be at least 20 characters for reinstatement" });
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

    // Verify agent is currently suspended
    if (agentProfile.role !== "agent_suspended") {
      return res.status(400).json({ 
        error: `Can only reinstate suspended agents. Current status: ${agentProfile.role}` 
      });
    }

    const previousRole = agentProfile.role;
    const newRole = "agent";

    // Update agent role back to active
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq("id", agent_user_id);

    if (updateError) {
      console.error("Error reinstating agent:", updateError);
      return res.status(500).json({ error: "Failed to reinstate agent" });
    }

    // Create audit log entry
    const { error: auditError } = await supabase
      .from("agent_approval_audit_log")
      .insert({
        agent_user_id,
        admin_user_id: user.id,
        admin_role: adminProfile.role,
        action_type: "reinstate",
        previous_role: previousRole,
        new_role: newRole,
        reason: reason.trim()
      });

    if (auditError) {
      console.error("Error creating audit log:", auditError);
      // Continue even if audit log fails (agent is already reinstated)
    }

    console.log(`Agent reinstated: ${agentProfile.email} by ${adminProfile.role} ${user.email}`);

    return res.status(200).json({ 
      message: "Agent reinstated successfully",
      agent: {
        id: agent_user_id,
        email: agentProfile.email,
        full_name: agentProfile.full_name,
        previous_role: previousRole,
        new_role: newRole
      },
      reinstated_by: {
        id: user.id,
        role: adminProfile.role
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}