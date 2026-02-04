import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { agentPermissionsService } from "@/services/agentPermissionsService";

/**
 * Admin Conversation Management: View specific conversation thread
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

  try {
    // Only Chairman can view conversations
    const isChairman = await agentPermissionsService.isChairman(auth.userId);
    
    if (!isChairman) {
      return res.status(403).json({ success: false, error: "Forbidden: Chairman access required" });
    }

    const { request_id } = req.query;

    if (!request_id || typeof request_id !== "string") {
      return res.status(400).json({ error: "request_id is required" });
    }

    // Get agent request details (Simplified query to avoid deep types)
    const { data: rawRequest, error: requestError } = await supabase
      .from("agent_requests")
      .select(`
        id,
        status,
        request_type,
        notes,
        admin_notes,
        created_at,
        updated_at,
        member_user_id,
        assigned_agent_id
      `)
      .eq("id", request_id)
      .single();

    if (requestError || !rawRequest) {
      return res.status(404).json({ error: "Agent request not found" });
    }

    // Fetch member and agent profiles separately
    let memberProfile = null;
    let agentProfile = null;

    if (rawRequest.member_user_id) {
      const { data: member } = await supabase
        .from("profiles")
        .select("id, email, full_name, country_code, phone")
        .eq("id", rawRequest.member_user_id)
        .single();
      memberProfile = member;
    }

    if (rawRequest.assigned_agent_id) {
      const { data: agent } = await supabase
        .from("profiles")
        .select("id, email, full_name, role")
        .eq("id", rawRequest.assigned_agent_id)
        .single();
      agentProfile = agent;
    }

    // specific type hack to match expected response structure
    const request = {
      ...rawRequest,
      member: memberProfile,
      agent: agentProfile
    };

    // Get all messages in the conversation
    // Cast to any to avoid "Type instantiation is excessively deep" error with complex Supabase types
    const { data: rawMessages, error: messagesError } = await (supabase as any)
      .from("messages")
      .select(`
        id,
        subject,
        body,
        message_type,
        created_at,
        sender_user_id,
        sender_role
      `)
      .eq("agent_request_id", request_id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return res.status(500).json({ error: "Failed to fetch messages" });
    }

    // Manually fetch sender profiles to avoid deep type instantiation issues
    const messages = [];
    if (rawMessages && rawMessages.length > 0) {
      const senderIds = [...new Set(rawMessages.map((m) => m.sender_user_id).filter(Boolean))];
      
      const sendersMap: Record<string, any> = {};
      
      if (senderIds.length > 0) {
        const { data: senders } = await supabase
          .from("profiles")
          .select("id, email, full_name, role")
          .in("id", senderIds as string[]);
          
        if (senders) {
          senders.forEach((s) => {
            sendersMap[s.id] = s;
          });
        }
      }

      // Combine messages with sender info
      for (const msg of rawMessages) {
        messages.push({
          ...msg,
          sender: msg.sender_user_id ? sendersMap[msg.sender_user_id] : null
        });
      }
    }

    // Log admin view action
    await supabase.from("audit_logs").insert({
      admin_id: auth.userId,
      action: "CONVERSATION_VIEWED",
      entity_type: "agent_request",
      entity_id: request_id,
      changes: {
        admin_role: auth.userRole,
        member_id: request.member_user_id,
        agent_id: request.assigned_agent_id,
      },
    });

    return res.status(200).json({
      success: true,
      request,
      messages: messages || [],
      message_count: messages?.length || 0,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}