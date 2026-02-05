import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { agentPermissionsService } from "@/services/agentPermissionsService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  const { supabase, profile, user } = auth;

  // SUPER ADMIN SAFE OVERRIDE: Super admin can suspend any agent immediately
  const isSuperAdmin = profile?.role === "super_admin";

  // Check if user can suspend agents
  const canSuspend = await agentPermissionsService.canSuspendAgents(user.id);
  if (!canSuspend) {
    return res.status(403).json({ error: "Forbidden: Insufficient permissions to suspend agents" });
  }

  const { agentId, reason } = req.body;

  if (!agentId) {
    return res.status(400).json({ error: "Agent ID is required" });
  }

  if (!reason) {
    return res.status(400).json({ error: "Suspension reason is required" });
  }

  try {
    // Update agent verification status to suspended
    const { data: verification, error: verifyError } = await supabase
      .from("agent_verifications" as any)
      .update({
        status: "suspended",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        approval_notes: reason,
      })
      .eq("agent_id", agentId)
      .select()
      .single();

    if (verifyError) throw verifyError;

    // Update profile role to agent_suspended
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: "agent_suspended" })
      .eq("id", agentId);

    if (profileError) throw profileError;

    // Log audit entry
    await agentPermissionsService.logAgentApprovalAction(
      user.id,
      agentId,
      "suspended",
      reason
    );

    // Create timeline entry
    await supabase.from("agent_request_timeline").insert({
      agent_request_id: agentId, 
      action: "suspended",
      actor_role: "agent_suspended", 
      actor_id: user.id,
      notes: reason,
    } as any);

    return res.status(200).json({
      message: "Agent suspended successfully",
      verification,
    });
  } catch (error) {
    console.error("Error suspending agent:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}