import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { agentPermissionsService } from "@/services/agentPermissionsService";
import { agentRequestTimelineService } from "@/services/agentRequestTimelineService";

/**
 * Admin Conversation Management: Reassign agent case
 * Access: super_admin, manager_admin only
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
    // Only Chairman can reassign conversations
    const isChairman = await agentPermissionsService.isChairman(auth.userId);
    if (!isChairman) {
      return res.status(403).json({ success: false, error: "Forbidden: Chairman access required" });
    }

    const { request_id, new_agent_id, reason } = req.body;

    // STRICT ENFORCEMENT: Only super_admin and manager_admin can reassign
    if (!["super_admin", "manager_admin"].includes(auth.userRole)) {
      // Log unauthorized attempt
      await supabase.from("audit_logs").insert({
        admin_id: auth.userId,
        action: "AGENT_REASSIGN_DENIED",
        entity_type: "agent_request",
        entity_id: request_id,
        changes: {
          attempted_role: auth.userRole,
          reason: "Worker admins cannot reassign agents",
        },
      });

      return res.status(403).json({
        error: "Forbidden: Only Super Admins and Manager Admins can reassign agents. Worker admins do not have this authority."
      });
    }

    // Validation
    if (!request_id) {
      return res.status(400).json({ error: "request_id is required" });
    }

    if (!new_agent_id) {
      return res.status(400).json({ error: "new_agent_id is required" });
    }

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ error: "Reason must be at least 10 characters" });
    }

    // Get current agent request
    const { data: request, error: requestError } = await supabase
      .from("agent_requests")
      .select("id, assigned_agent_id, member_user_id, status, admin_notes")
      .eq("id", request_id)
      .single();

    if (requestError || !request) {
      return res.status(404).json({ error: "Agent request not found" });
    }

    if (!request.assigned_agent_id) {
      return res.status(400).json({ error: "Request has no assigned agent" });
    }

    if (request.assigned_agent_id === new_agent_id) {
      return res.status(400).json({ error: "New agent is the same as current agent" });
    }

    const old_agent_id = request.assigned_agent_id;

    // Verify new agent exists and has agent role
    const { data: newAgent, error: agentError } = await supabase
      .from("profiles")
      .select("id, role, email, full_name")
      .eq("id", new_agent_id)
      .single();

    if (agentError || !newAgent) {
      return res.status(404).json({ error: "New agent not found" });
    }

    if (newAgent.role !== "agent") {
      return res.status(400).json({ error: "New agent must have 'agent' role" });
    }

    // Update agent assignment
    const { error: updateError } = await supabase
      .from("agent_requests")
      .update({
        assigned_agent_id: new_agent_id,
        admin_notes: `${request.admin_notes || ""}\n[Reassigned by admin: ${reason.trim()}]`.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", request_id);

    if (updateError) {
      console.error("Error reassigning agent:", updateError);
      return res.status(500).json({ error: "Failed to reassign agent" });
    }

    // Log timeline event
    try {
      await (supabase as any).from("agent_request_timeline").insert({
        agent_request_id: request_id,
        event_type: "AGENT_REASSIGNED",
        actor_id: auth.userId,
        actor_type: "admin",
        actor_role: auth.userRole,
        assigned_agent_id: new_agent_id,
        assigned_by_admin_id: auth.userId,
        notes: `Agent reassigned from ${old_agent_id} to ${new_agent_id}. Reason: ${reason.trim()}`,
        metadata: {
          old_agent_id,
          new_agent_id,
          reason: reason.trim(),
        },
      });
    } catch (timelineError) {
      console.error("Failed to log timeline event:", timelineError);
    }

    // Send system message to new agent
    const { data: systemMessage } = await supabase
      .from("messages")
      .insert({
        sender_role: "system",
        subject: "Agent Request Reassigned to You",
        body: `You have been assigned a request that was previously handled by another agent.\n\nReason for reassignment: ${reason.trim()}\n\nPlease review the conversation history and continue assisting the member.`,
        message_type: "system_message",
        agent_request_id: request_id,
      })
      .select()
      .single();

    if (systemMessage) {
      await supabase.from("message_recipients").insert({
        message_id: systemMessage.id,
        recipient_user_id: new_agent_id,
        folder: "INBOX",
        is_read: false,
      });
    }

    // Send notification to old agent
    const { data: oldAgentMessage } = await supabase
      .from("messages")
      .insert({
        sender_role: "system",
        subject: "Agent Request Reassigned",
        body: `The request you were handling has been reassigned to another agent.\n\nReason: ${reason.trim()}\n\nNo further action is required from you.`,
        message_type: "system_message",
        agent_request_id: request_id,
      })
      .select()
      .single();

    if (oldAgentMessage) {
      await supabase.from("message_recipients").insert({
        message_id: oldAgentMessage.id,
        recipient_user_id: old_agent_id,
        folder: "INBOX",
        is_read: false,
      });
    }

    // Log audit entry
    await supabase.from("audit_logs").insert({
      admin_id: auth.userId,
      action: "AGENT_REASSIGNED",
      entity_type: "agent_request",
      entity_id: request_id,
      changes: {
        admin_role: auth.userRole,
        old_agent_id,
        new_agent_id,
        reason: reason.trim(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Agent reassigned successfully",
      old_agent_id,
      new_agent_id,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}