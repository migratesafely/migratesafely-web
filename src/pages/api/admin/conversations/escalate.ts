import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { agentPermissionsService } from "@/services/agentPermissionsService";
import { agentRequestTimelineService } from "@/services/agentRequestTimelineService";

/**
 * Admin Conversation Management: Escalate agent case
 * Access: super_admin, manager_admin, worker_admin
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

  const isSuperAdmin = await agentPermissionsService.isSuperAdmin(auth.userId);

  if (!isSuperAdmin) {
    return res.status(403).json({ error: "Forbidden: Super Admin access required" });
  }

  try {
    const { request_id, reason, escalation_notes } = req.body;

    // Validation
    if (!request_id) {
      return res.status(400).json({ error: "request_id is required" });
    }

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ error: "Reason must be at least 10 characters" });
    }

    // Get current agent request
    const { data: request, error: requestError } = await supabase
      .from("agent_requests")
      .select("id, status, assigned_agent_id, member_user_id, admin_notes")
      .eq("id", request_id)
      .single();

    if (requestError || !request) {
      return res.status(404).json({ error: "Agent request not found" });
    }

    if (request.status === "ESCALATED") {
      return res.status(400).json({ error: "Request is already escalated" });
    }

    const old_status = request.status;

    // Update request status to ESCALATED
    const { error: updateError } = await supabase
      .from("agent_requests")
      .update({
        status: "ESCALATED",
        admin_notes: `${request.admin_notes || ""}\n[Escalated by ${auth.userRole} on ${new Date().toISOString()}: ${reason.trim()}]${escalation_notes ? `\nNotes: ${escalation_notes.trim()}` : ""}`.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", request_id);

    if (updateError) {
      console.error("Error escalating request:", updateError);
      return res.status(500).json({ error: "Failed to escalate request" });
    }

    // Log timeline event
    try {
      await agentRequestTimelineService.logEscalated(
        request_id,
        auth.userId,
        "admin",
        reason.trim(),
        auth.userRole
      );
    } catch (timelineError) {
      console.error("Failed to log timeline event:", timelineError);
    }

    // Send notification to assigned agent (if any)
    if (request.assigned_agent_id) {
      const { data: agentMessage } = await supabase
        .from("messages")
        .insert({
          sender_role: "system",
          subject: "Request Escalated by Admin",
          body: `The request you were handling has been escalated by ${auth.userRole}.\n\nReason: ${reason.trim()}${escalation_notes ? `\n\nAdditional Notes: ${escalation_notes.trim()}` : ""}\n\nA senior admin will review and may provide further instructions.`,
          message_type: "system_message",
          agent_request_id: request_id,
        })
        .select()
        .single();

      if (agentMessage) {
        await supabase.from("message_recipients").insert({
          message_id: agentMessage.id,
          recipient_user_id: request.assigned_agent_id,
          folder: "INBOX",
          is_read: false,
        });
      }
    }

    // Send notification to member
    const { data: memberMessage } = await supabase
      .from("messages")
      .insert({
        sender_role: "system",
        subject: "Your Request Has Been Escalated",
        body: `Your request has been escalated for senior review to ensure the best possible assistance.\n\nA senior team member will review your case and provide guidance shortly.\n\nThank you for your patience.`,
        message_type: "system_message",
        agent_request_id: request_id,
      })
      .select()
      .single();

    if (memberMessage) {
      await supabase.from("message_recipients").insert({
        message_id: memberMessage.id,
        recipient_user_id: request.member_user_id,
        folder: "INBOX",
        is_read: false,
      });
    }

    // Log audit entry
    await supabase.from("audit_logs").insert({
      admin_id: auth.userId,
      action: "REQUEST_ESCALATED",
      entity_type: "agent_request",
      entity_id: request_id,
      changes: {
        admin_role: auth.userRole,
        old_status,
        new_status: "ESCALATED",
        reason: reason.trim(),
        escalation_notes: escalation_notes?.trim() || null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Request escalated successfully",
      old_status,
      new_status: "ESCALATED",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}