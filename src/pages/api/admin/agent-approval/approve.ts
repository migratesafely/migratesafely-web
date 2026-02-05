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

  // SUPER ADMIN SAFE OVERRIDE: Super admin can approve any agent immediately
  const isSuperAdmin = profile?.role === "super_admin";

  const { agentId, reason } = req.body;

  if (!agentId) {
    return res.status(400).json({ error: "Agent ID is required" });
  }

  try {
    // Update agent verification status
    const { data: verification, error: verifyError } = await supabase
      .from("agent_verifications" as any)
      .update({
        status: "approved",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        approval_notes: reason,
      })
      .eq("agent_id", agentId)
      .select()
      .single();

    if (verifyError) throw verifyError;

    // Update profile role to agent
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: "agent" })
      .eq("id", agentId);

    if (profileError) throw profileError;

    // Log audit entry
    await agentPermissionsService.logAgentApprovalAction(
      user.id,
      agentId,
      "approved",
      reason || "Agent verification approved"
    );

    return res.status(200).json({
      message: "Agent approved successfully",
      verification,
    });
  } catch (error) {
    console.error("Error approving agent:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}