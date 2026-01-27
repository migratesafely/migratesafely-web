import type { NextApiRequest, NextApiResponse } from "next";
import { requireAgentRole } from "@/lib/apiMiddleware";
import { messageService } from "@/services/messageService";

/**
 * API endpoint for agents to view their message conversations
 * GET /api/agents/messages/conversations
 * 
 * Returns conversations with:
 * - Assigned members
 * - Admins
 * 
 * Conversations are grouped by member/admin
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
    const result = await messageService.getAgentConversations(auth.userId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json({
      success: true,
      conversations: result.conversations,
    });
  } catch (error) {
    console.error("Error fetching agent conversations:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}