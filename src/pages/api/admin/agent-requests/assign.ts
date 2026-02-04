import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { agentRequestService } from "@/services/agentRequestService";
import { agentRequestTimelineService } from "@/services/agentRequestTimelineService";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { logAdminAction } from "@/services/auditLogService";
import { agentPermissionsService } from "@/services/agentPermissionsService";

/**
 * Assign agent to member request
 * STRICT AUTHORITY: Only super_admin and manager_admin
 * AGENTS ARE BLOCKED from assigning themselves or others
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Require admin role - blocks agents and members
  const auth = await requireAdminRole(req, res);
  if (!auth) return; // Middleware handles rejection

  try {
    // Only Chairman can assign agent requests
    const isChairman = await agentPermissionsService.isChairman(auth.userId);
    
    if (!isChairman) {
      return res.status(403).json({ success: false, error: "Forbidden: Chairman access required" });
    }

    const { requestId, agentId, adminNotes } = req.body;

    if (!requestId || !agentId) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const result = await agentRequestService.assignAgentToRequest(
      requestId,
      agentId,
      auth.userId,
      adminNotes
    );

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    const { error: updateError } = await supabase
      .from("agent_requests")
      .update({
        assigned_agent_id: agentId,
        status: "assigned",
      })
      .eq("id", requestId);

    if (updateError) {
      return res.status(500).json({ error: "Failed to assign agent" });
    }

    // Send system message to agent
    const { data: messageData, error: messageError } = await supabase
      .from("messages")
      .insert({
        sender_user_id: auth.userId,
        sender_role: "ADMIN",
        subject: `New Agent Request Assignment`,
        body: `You have been assigned a new agent request. Please review the details and contact the member.`,
        message_type: "DIRECT",
        target_group: "AGENT",
      })
      .select()
      .single();

    if (messageError) {
      console.error("Failed to create message:", messageError);
    } else if (messageData) {
      // Create recipient entry
      const { error: recipientError } = await supabase
        .from("message_recipients")
        .insert({
          message_id: messageData.id,
          recipient_user_id: agentId,
          folder: "INBOX",
          is_read: false
        });
        
      if (recipientError) {
        console.error("Failed to add message recipient:", recipientError);
      }
    }

    // Log timeline event
    try {
      await agentRequestTimelineService.logSystemMessage(
        requestId,
        `You have been assigned a new agent request. Please review the details and contact the member.`,
        agentId,
        "agent"
      );
    } catch (timelineError) {
      console.error("Failed to log SYSTEM_MESSAGE event:", timelineError);
    }

    // Log successful assignment
    await logAdminAction({
      actorId: auth.userId,
      action: "AGENT_ASSIGNED_TO_REQUEST",
      targetUserId: agentId,
      tableName: "agent_requests",
      recordId: requestId,
      newValues: { assigned_agent_id: agentId, status: "assigned" },
      details: { admin_notes: adminNotes },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in assign agent API:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}