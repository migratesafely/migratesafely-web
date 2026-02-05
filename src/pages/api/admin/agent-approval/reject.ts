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

  // SUPER ADMIN SAFE OVERRIDE: Super admin can reject any agent immediately
  const isSuperAdmin = profile?.role === "super_admin";

  // Check if user can reject agents
  const canReject = await agentPermissionsService.canRejectAgents(user.id);
  if (!canReject) {
    return res.status(403).json({ error: "Forbidden: Insufficient permissions to reject agents" });
  }

  const { agentId, reason } = req.body;

  if (!agentId) {
    return res.status(400).json({ error: "Agent ID is required" });
  }

  if (!reason) {
    return res.status(400).json({ error: "Rejection reason is required" });
  }

  try {
    // Update agent verification status
    const { data: verification, error: verifyError } = await supabase
      .from("agent_verifications" as any)
      .update({
        status: "rejected",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        approval_notes: reason,
      })
      .eq("agent_id", agentId)
      .select()
      .single();

    if (verifyError) throw verifyError;

    // Ensure profile role is set to member (not agent)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: "member" })
      .eq("id", agentId);

    if (profileError) throw profileError;

    // Log audit entry
    await agentPermissionsService.logAgentApprovalAction(
      user.id,
      agentId,
      "rejected",
      reason
    );

    return res.status(200).json({
      message: "Agent application rejected",
      verification,
    });
  } catch (error) {
    console.error("Error rejecting agent:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}