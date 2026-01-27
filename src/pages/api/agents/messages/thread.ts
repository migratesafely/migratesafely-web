import type { NextApiRequest, NextApiResponse } from "next";
import { requireAgentRole } from "@/lib/apiMiddleware";
import { agentPermissionsService } from "@/services/agentPermissionsService";
import { messageService } from "@/services/messageService";

/**
 * API endpoint for agents to view a message thread with a specific member or admin
 * GET /api/agents/messages/thread?userId=<id>&userType=<member|admin>
 * 
 * Returns all messages in conversation with specified user
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Require approved agent authentication
  const auth = await requireAgentRole(req, res);
  if (!auth) return;

  try {
    const { userId, userType } = req.query;

    // Validate input
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!userType || !["member", "admin"].includes(userType as string)) {
      return res.status(400).json({ error: "Invalid user type. Must be 'member' or 'admin'" });
    }

    // If viewing member conversation, verify member is assigned to this agent
    if (userType === "member") {
      const permissionCheck = await agentPermissionsService.canViewMember(
        auth.userId,
        userId
      );

      if (!permissionCheck.allowed) {
        return res.status(403).json({
          error: "Forbidden",
          details: permissionCheck.reason,
          violationType: permissionCheck.violationType,
        });
      }
    }

    // Get message thread
    const result = await messageService.getMessageThread(auth.userId, userId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json({
      success: true,
      messages: result.messages,
    });
  } catch (error) {
    console.error("Error fetching message thread:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}