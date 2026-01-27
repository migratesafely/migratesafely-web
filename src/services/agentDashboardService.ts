import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AgentRequest = Database["public"]["Tables"]["agent_requests"]["Row"];
type Message = Database["public"]["Tables"]["messages"]["Row"];
type MessageRecipient = Database["public"]["Tables"]["message_recipients"]["Row"];

export interface AgentStats {
  status: string;
  assignedMembersCount: number;
  activeRequestsCount: number;
  completedRequestsCount: number;
}

export interface AssignedMember {
  requestId: string;
  memberId: string;
  memberName: string | null;
  memberEmail: string | null;
  membershipNumber: number | null;
  requestType: string;
  status: string;
  destinationCountry: string;
  assignedAt: string | null;
  notes: string | null;
  outcomeStatus: string;
}

export interface AgentMessage {
  id: string;
  subject: string | null;
  body: string;
  senderName: string | null;
  senderRole: string;
  createdAt: string;
  isRead: boolean;
  messageType: string;
}

export const agentDashboardService = {
  /**
   * Get agent profile and verify they are approved
   */
  async getAgentProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching agent profile:", error);
      return null;
    }

    return data;
  },

  /**
   * Check if user is an approved agent
   */
  async isApprovedAgent(userId: string): Promise<boolean> {
    const profile = await this.getAgentProfile(userId);
    return profile?.role === "agent" && profile?.agent_status === "ACTIVE";
  },

  /**
   * Get agent dashboard statistics
   */
  async getAgentStats(userId: string): Promise<AgentStats | null> {
    try {
      const profile = await this.getAgentProfile(userId);
      
      if (!profile) {
        return null;
      }

      // Count assigned members (total unique agent requests)
      const { count: totalAssigned } = await supabase
        .from("agent_requests")
        .select("*", { count: "exact", head: true })
        .eq("assigned_agent_id", userId);

      // Count active requests
      const { count: activeRequests } = await supabase
        .from("agent_requests")
        .select("*", { count: "exact", head: true })
        .eq("assigned_agent_id", userId)
        .in("status", ["ASSIGNED", "IN_PROGRESS"]);

      // Count completed requests
      const { count: completedRequests } = await supabase
        .from("agent_requests")
        .select("*", { count: "exact", head: true })
        .eq("assigned_agent_id", userId)
        .eq("status", "COMPLETED");

      return {
        status: profile.agent_status || "UNKNOWN",
        assignedMembersCount: totalAssigned || 0,
        activeRequestsCount: activeRequests || 0,
        completedRequestsCount: completedRequests || 0,
      };
    } catch (error) {
      console.error("Error fetching agent stats:", error);
      return null;
    }
  },

  /**
   * Get list of assigned members with their request details
   */
  async getAssignedMembers(userId: string): Promise<AssignedMember[]> {
    try {
      const { data, error } = await supabase
        .from("agent_requests")
        .select(`
          id,
          member_user_id,
          member_country_code,
          destination_country_code,
          request_type,
          status,
          assigned_at,
          notes,
          outcome_status,
          profiles!agent_requests_member_user_id_fkey (
            id,
            full_name,
            email,
            membership_number
          )
        `)
        .eq("assigned_agent_id", userId)
        .order("assigned_at", { ascending: false });

      if (error) {
        console.error("Error fetching assigned members:", error);
        return [];
      }

      return (data || []).map((request: any) => ({
        requestId: request.id,
        memberId: request.member_user_id,
        memberName: request.profiles?.full_name || null,
        memberEmail: request.profiles?.email || null,
        membershipNumber: request.profiles?.membership_number || null,
        requestType: request.request_type,
        status: request.status,
        destinationCountry: request.destination_country_code,
        assignedAt: request.assigned_at,
        notes: request.notes,
        outcomeStatus: request.outcome_status,
      }));
    } catch (error) {
      console.error("Error fetching assigned members:", error);
      return [];
    }
  },

  /**
   * Get messages for the agent (inbox)
   */
  async getAgentMessages(userId: string, limit: number = 50): Promise<AgentMessage[]> {
    try {
      const { data, error } = await supabase
        .from("message_recipients")
        .select(`
          id,
          is_read,
          folder,
          read_at,
          deleted_at,
          messages!inner (
            id,
            subject,
            body,
            sender_role,
            message_type,
            created_at,
            sender_user_id,
            profiles!messages_sender_user_id_fkey (
              full_name
            )
          )
        `)
        .eq("recipient_user_id", userId)
        .eq("folder", "INBOX")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching agent messages:", error);
        return [];
      }

      return (data || []).map((recipient: any) => ({
        id: recipient.messages.id,
        subject: recipient.messages.subject,
        body: recipient.messages.body,
        senderName: recipient.messages.profiles?.full_name || "System",
        senderRole: recipient.messages.sender_role,
        createdAt: recipient.messages.created_at,
        isRead: recipient.is_read,
        messageType: recipient.messages.message_type,
      }));
    } catch (error) {
      console.error("Error fetching agent messages:", error);
      return [];
    }
  },

  /**
   * Mark message as read
   */
  async markMessageAsRead(userId: string, messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("message_recipients")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("recipient_user_id", userId)
        .eq("message_id", messageId);

      if (error) {
        console.error("Error marking message as read:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error marking message as read:", error);
      return false;
    }
  },

  /**
   * Get unread message count
   */
  async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("message_recipients")
        .select("*", { count: "exact", head: true })
        .eq("recipient_user_id", userId)
        .eq("folder", "INBOX")
        .eq("is_read", false)
        .is("deleted_at", null);

      if (error) {
        console.error("Error fetching unread count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      return 0;
    }
  },
};