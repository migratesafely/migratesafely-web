import type { NextApiRequest, NextApiResponse } from "next";
import { requireAgentRole } from "@/lib/apiMiddleware";
import { agentPermissionsService } from "@/services/agentPermissionsService";
import { messageService } from "@/services/messageService";

/**
 * API endpoint for agents to send messages to assigned members or admins
 * POST /api/agents/messages/send
 * 
 * Agents CAN:
 * - Send messages to assigned members
 * - Send messages to admins
 * 
 * Agents CANNOT:
 * - Send messages to non-assigned members
 * - Edit or delete messages
 * - Send external messages
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Require approved agent authentication
  const auth = await requireAgentRole(req, res);
  if (!auth) return;

  try {
    const { recipientId, subject, body, recipientType } = req.body;

    // Validate input
    if (!recipientId || typeof recipientId !== "string") {
      return res.status(400).json({ error: "Invalid recipient ID" });
    }

    if (!subject || typeof subject !== "string") {
      return res.status(400).json({ error: "Subject is required" });
    }

    if (!body || typeof body !== "string") {
      return res.status(400).json({ error: "Message body is required" });
    }

    if (!recipientType || !["member", "admin"].includes(recipientType)) {
      return res.status(400).json({ error: "Invalid recipient type. Must be 'member' or 'admin'" });
    }

    // If sending to member, verify member is assigned to this agent
    if (recipientType === "member") {
      const permissionCheck = await agentPermissionsService.canViewMember(
        auth.userId,
        recipientId
      );

      if (!permissionCheck.allowed) {
        return res.status(403).json({
          error: "Forbidden",
          details: permissionCheck.reason,
        });
      }
    }

    // If sending to admin, verify recipient is actually an admin
    if (recipientType === "admin") {
      const isAdmin = await agentPermissionsService.isAdmin(recipientId);
      
      if (!isAdmin) {
        return res.status(400).json({
          error: "Invalid recipient",
          details: "Recipient is not an admin",
        });
      }
    }

    // Send message
    const result = await messageService.sendAgentMessage(
      auth.userId,
      recipientId,
      subject,
      body,
      recipientType
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("Error in agent send message:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}