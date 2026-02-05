import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { agentPermissionsService } from "@/services/agentPermissionsService";

/**
 * Admin Conversation Management: View full conversation thread
 * Access: super_admin, manager_admin, worker_admin
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

  const isSuperAdmin = await agentPermissionsService.isSuperAdmin(auth.userId);

  if (!isSuperAdmin) {
    return res.status(403).json({ error: "Forbidden: Super Admin access required" });
  }

  try {
    const { request_id } = req.query;

    if (!request_id || typeof request_id !== "string") {
      return res.status(400).json({ error: "request_id is required" });
    }

    // Get agent request details
    const { data: request, error: requestError } = await supabase
      .from("agent_requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (requestError || !request) {
      return res.status(404).json({ error: "Agent request not found" });
    }

    // Get messages
    // Cast supabase to any to avoid deep type instantiation error
    const { data: messages, error: messagesError } = await (supabase as any)
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_user_id_fkey(full_name, email, role),
        recipients:message_recipients(recipient_user_id, is_read, read_at)
      `)
      .eq("agent_request_id", request_id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return res.status(500).json({ error: "Failed to fetch messages" });
    }

    // Get participants info
    const participantIds = [request.member_user_id];
    if (request.assigned_agent_id) {
      participantIds.push(request.assigned_agent_id);
    }

    const { data: participants } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .in("id", participantIds);

    const participantsMap = (participants || []).reduce((acc: any, p: any) => {
      acc[p.id] = p;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      request: {
        ...request,
        member: participantsMap[request.member_user_id] || null,
        agent: request.assigned_agent_id ? participantsMap[request.assigned_agent_id] : null,
      },
      messages: messages || [],
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}