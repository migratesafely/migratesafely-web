import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { agentRequestTimelineService } from "@/services/agentRequestTimelineService";

/**
 * Admin Conversation Management: Send admin message into conversation thread
 * Access: super_admin, manager_admin, worker_admin
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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, full_name, email")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!["super_admin", "manager_admin", "worker_admin"].includes(profile.role)) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { request_id, message_body, message_type, recipient_ids } = req.body;

    // Validation
    if (!request_id) {
      return res.status(400).json({ error: "request_id is required" });
    }

    if (!message_body || message_body.trim().length === 0) {
      return res.status(400).json({ error: "message_body is required" });
    }

    if (message_body.trim().length < 10) {
      return res.status(400).json({ error: "Message must be at least 10 characters" });
    }

    if (!recipient_ids || !Array.isArray(recipient_ids) || recipient_ids.length === 0) {
      return res.status(400).json({ error: "recipient_ids array is required" });
    }

    const validMessageTypes = ["admin_message", "system_message", "admin_note"];
    const finalMessageType = validMessageTypes.includes(message_type) 
      ? message_type 
      : "admin_message";

    // Get agent request details
    const { data: request, error: requestError } = await supabase
      .from("agent_requests")
      .select("id, member_user_id, assigned_agent_id, status")
      .eq("id", request_id)
      .single();

    if (requestError || !request) {
      return res.status(404).json({ error: "Agent request not found" });
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        sender_user_id: user.id,
        sender_role: profile.role,
        subject: `Admin Message - Request ${request_id.slice(0, 8)}`,
        body: message_body.trim(),
        message_type: finalMessageType,
        agent_request_id: request_id,
      })
      .select()
      .single();

    if (messageError || !message) {
      console.error("Error creating message:", messageError);
      return res.status(500).json({ error: "Failed to send message" });
    }

    // Create message recipients
    const recipients = recipient_ids.map((recipientId: string) => ({
      message_id: message.id,
      recipient_user_id: recipientId,
      folder: "INBOX",
      is_read: false,
    }));

    const { error: recipientsError } = await supabase
      .from("message_recipients")
      .insert(recipients);

    if (recipientsError) {
      console.error("Error creating recipients:", recipientsError);
      // Don't fail - message was created, just notify
    }

    // Log timeline event
    try {
      await agentRequestTimelineService.logMessageSent(
        request_id,
        message_body.trim(),
        user.id,
        "admin"
      );
    } catch (timelineError) {
      console.error("Failed to log timeline event:", timelineError);
    }

    // Log audit entry
    await supabase.from("audit_logs").insert({
      admin_id: user.id,
      action: "ADMIN_MESSAGE_SENT",
      entity_type: "agent_request",
      entity_id: request_id,
      changes: {
        admin_role: profile.role,
        message_type: finalMessageType,
        recipient_ids: recipient_ids,
        message_length: message_body.trim().length,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Admin message sent successfully",
      message_id: message.id,
      sent_to: recipient_ids.length,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}