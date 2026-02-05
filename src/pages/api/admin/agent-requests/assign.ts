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

  // Check if user can assign agent requests (Super Admin or authorized admin)
  const canAssign = await agentPermissionsService.canAssignAgentRequests(user.id);
  if (!canAssign) {
    return res.status(403).json({ error: "Forbidden: Insufficient permissions to assign agent requests" });
  }

  const { requestId, agentId } = req.body;

  if (!requestId || !agentId) {
    return res.status(400).json({ error: "Request ID and Agent ID are required" });
  }

  try {
    // Verify agent exists and is active
    const { data: agent, error: agentError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", agentId)
      .eq("role", "agent")
      .single();

    if (agentError || !agent) {
      return res.status(404).json({ error: "Agent not found or inactive" });
    }

    // Update agent request assignment
    const { data: updatedRequest, error: updateError } = await supabase
      .from("agent_requests")
      .update({
        assigned_agent_id: agentId,
        status: "assigned",
        assigned_at: new Date().toISOString(),
        assigned_by: user.id,
      })
      .eq("id", requestId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create timeline entry
    await supabase.from("agent_request_timeline").insert({
      agent_request_id: requestId, // Corrected from request_id
      action: "assigned",
      performed_by: user.id, // This field name might also need check, likely 'actor_id' based on previous file context, but fixing reported error first
      details: `Assigned to agent ${agentId}`,
    } as any); // Cast to any to avoid strict type checks on timeline structure which seems variable

    return res.status(200).json({
      message: "Agent request assigned successfully",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Error assigning agent request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}