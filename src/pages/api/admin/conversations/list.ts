import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { agentPermissionsService } from "@/services/agentPermissionsService";

/**
 * Admin Conversation Management: List all agent-member conversations
 * Access: super_admin, manager_admin, worker_admin (view-only for worker)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  try {
    // Only Chairman can list conversations
    const isChairman = await agentPermissionsService.isChairman(auth.userId);
    
    if (!isChairman) {
      return res.status(403).json({ success: false, error: "Forbidden: Chairman access required" });
    }

    // Get query parameters for filtering
    const { agent_id, member_id, request_id, status } = req.query;

    // Build base query
    let queryBuilder = supabase
      .from("agent_requests")
      .select("*")
      .not("assigned_agent_id", "is", null)
      .order("updated_at", { ascending: false });

    // Apply filters
    if (agent_id && typeof agent_id === "string") {
      queryBuilder = queryBuilder.eq("assigned_agent_id", agent_id);
    }
    if (member_id && typeof member_id === "string") {
      queryBuilder = queryBuilder.eq("member_user_id", member_id);
    }
    if (request_id && typeof request_id === "string") {
      queryBuilder = queryBuilder.eq("id", request_id);
    }
    if (status && typeof status === "string") {
      queryBuilder = queryBuilder.eq("status", status);
    }

    const { data: requests, error: queryError } = await queryBuilder;

    if (queryError) {
      console.error("Error fetching conversations:", queryError);
      return res.status(500).json({ error: "Failed to fetch conversations" });
    }

    // Enrich with related data
    const conversationsWithStats = await Promise.all(
      (requests || []).map(async (conv) => {
        // Get member info
        const { data: member } = await supabase
          .from("profiles")
          .select("id, email, full_name, country_code")
          .eq("id", conv.member_user_id)
          .single();

        // Get agent info
        const { data: agent } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .eq("id", conv.assigned_agent_id)
          .single();

        // Get message count using aggregation
        // Cast supabase to any to avoid deep type instantiation error
        const messageCountQuery = await (supabase as any)
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("agent_request_id", conv.id);
        
        const messageCount = messageCountQuery.count || 0;

        // Get last message
        const { data: lastMessage } = await (supabase as any)
          .from("messages")
          .select("created_at, body, sender_user_id")
          .eq("agent_request_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        return {
          ...conv,
          member,
          agent,
          message_count: messageCount,
          last_message: lastMessage,
        };
      })
    );

    return res.status(200).json({
      success: true,
      conversations: conversationsWithStats,
      total: conversationsWithStats.length,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}