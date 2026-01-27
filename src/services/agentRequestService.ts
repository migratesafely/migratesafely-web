import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Helper types for casting since exact DB types might not be generated yet
type AgentRequestRow = {
  id: string;
  member_user_id: string;
  member_country_code: string;
  destination_country_code: string;
  request_type: string;
  notes: string | null;
  status: string;
  assigned_agent_id: string | null;
  assigned_by_admin_id: string | null;
  assigned_at: string | null;
  admin_notes: string | null;
  member_feedback: string | null;
  outcome_status: string;
  created_at: string;
  updated_at: string;
};

type AgentRequestMessageRow = {
  id: string;
  request_id: string;
  sender_user_id: string;
  sender_role: string;
  message: string;
  created_at: string;
};

export type RequestType = "WORK" | "STUDENT" | "FAMILY" | "VISIT" | "OTHER";
export type RequestStatus = "SUBMITTED" | "UNDER_REVIEW" | "ASSIGNED" | "COMPLETED" | "REJECTED";
export type OutcomeStatus = "SUCCESS" | "FAILED" | "UNKNOWN";
export type SenderRole = "MEMBER" | "ADMIN";

interface SubmitRequestPayload {
  memberCountryCode: string;
  destinationCountryCode: string;
  requestType: RequestType;
  notes?: string;
}

interface AgentRequestWithProfile extends AgentRequestRow {
  member_profile?: {
    full_name: string;
    email: string;
    country_code: string;
  };
  assigned_agent?: {
    full_name: string;
    email: string;
  };
  assigned_by_admin?: {
    full_name: string;
  };
}

export const agentRequestService = {
  /**
   * Submit a new agent request
   */
  async submitRequest(
    userId: string,
    payload: SubmitRequestPayload
  ): Promise<{ success: boolean; request?: AgentRequestRow; error?: string }> {
    try {
      // Verify active membership
      const { data: membership, error: membershipError } = await supabase
        .from("memberships")
        .select("id, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .gte("end_date", new Date().toISOString())
        .single();

      if (membershipError || !membership) {
        return { success: false, error: "Active membership required to submit agent requests" };
      }

      // Cast to any to avoid type errors before generation
      const { data: request, error: insertError } = await (supabase
        .from("agent_requests") as any)
        .insert({
          member_user_id: userId,
          member_country_code: payload.memberCountryCode,
          destination_country_code: payload.destinationCountryCode,
          request_type: payload.requestType,
          notes: payload.notes || null,
          status: "SUBMITTED",
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error submitting agent request:", insertError);
        return { success: false, error: "Failed to submit request" };
      }

      return { success: true, request };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to submit request" };
    }
  },

  /**
   * List all requests for a specific member
   */
  async listMyRequests(userId: string): Promise<{ success: boolean; requests?: AgentRequestWithProfile[]; error?: string }> {
    try {
      // Cast to any to avoid complex relationship type errors
      const { data: requests, error: fetchError } = await (supabase
        .from("agent_requests") as any)
        .select(`
          *,
          assigned_agent:assigned_agent_id (
            full_name,
            email
          ),
          assigned_by_admin:assigned_by_admin_id (
            full_name
          )
        `)
        .eq("member_user_id", userId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching member requests:", fetchError);
        return { success: false, error: "Failed to fetch requests" };
      }

      return { success: true, requests: requests || [] };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to fetch requests" };
    }
  },

  /**
   * Get a specific request by ID (member view)
   */
  async getRequestById(
    requestId: string,
    userId: string
  ): Promise<{ success: boolean; request?: AgentRequestWithProfile; error?: string }> {
    try {
      const { data: request, error: fetchError } = await (supabase
        .from("agent_requests") as any)
        .select(`
          *,
          assigned_agent:assigned_agent_id (
            full_name,
            email
          ),
          assigned_by_admin:assigned_by_admin_id (
            full_name
          )
        `)
        .eq("id", requestId)
        .eq("member_user_id", userId)
        .single();

      if (fetchError) {
        console.error("Error fetching request:", fetchError);
        return { success: false, error: "Request not found" };
      }

      return { success: true, request };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to fetch request" };
    }
  },

  /**
   * Update member feedback and outcome status
   */
  async updateMemberFeedback(
    requestId: string,
    userId: string,
    feedback: string,
    outcomeStatus: OutcomeStatus
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error: updateError } = await (supabase
        .from("agent_requests") as any)
        .update({
          member_feedback: feedback,
          outcome_status: outcomeStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("member_user_id", userId);

      if (updateError) {
        console.error("Error updating feedback:", updateError);
        return { success: false, error: "Failed to update feedback" };
      }

      return { success: true };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to update feedback" };
    }
  },

  /**
   * List all pending requests for admin
   */
  async listPendingRequestsForAdmin(): Promise<{ success: boolean; requests?: AgentRequestWithProfile[]; error?: string }> {
    try {
      const { data: requests, error: fetchError } = await (supabase
        .from("agent_requests") as any)
        .select(`
          *,
          member_profile:member_user_id (
            full_name,
            email,
            country_code
          ),
          assigned_agent:assigned_agent_id (
            full_name,
            email
          ),
          assigned_by_admin:assigned_by_admin_id (
            full_name
          )
        `)
        .in("status", ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED"])
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching pending requests:", fetchError);
        return { success: false, error: "Failed to fetch requests" };
      }

      return { success: true, requests: requests || [] };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to fetch requests" };
    }
  },

  /**
   * Assign an agent to a request (admin only)
   */
  async assignAgentToRequest(
    requestId: string,
    agentId: string,
    adminId: string,
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error: updateError } = await (supabase
        .from("agent_requests") as any)
        .update({
          assigned_agent_id: agentId,
          assigned_by_admin_id: adminId,
          assigned_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
          status: "ASSIGNED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("Error assigning agent:", updateError);
        return { success: false, error: "Failed to assign agent" };
      }

      return { success: true };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to assign agent" };
    }
  },

  /**
   * Update request status (admin only)
   */
  async updateRequestStatus(
    requestId: string,
    status: RequestStatus,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error: updateError } = await (supabase
        .from("agent_requests") as any)
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("Error updating status:", updateError);
        return { success: false, error: "Failed to update status" };
      }

      return { success: true };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to update status" };
    }
  },

  /**
   * Get messages for a specific request
   */
  async getRequestMessages(requestId: string): Promise<{ success: boolean; messages?: AgentRequestMessageRow[]; error?: string }> {
    try {
      const { data: messages, error: fetchError } = await (supabase
        .from("agent_request_messages") as any)
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });

      if (fetchError) {
        console.error("Error fetching messages:", fetchError);
        return { success: false, error: "Failed to fetch messages" };
      }

      return { success: true, messages: messages || [] };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to fetch messages" };
    }
  },

  /**
   * Send a message to a request
   */
  async sendMessage(
    requestId: string,
    userId: string,
    message: string,
    senderRole: SenderRole
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error: insertError } = await (supabase
        .from("agent_request_messages") as any)
        .insert({
          request_id: requestId,
          sender_user_id: userId,
          sender_role: senderRole,
          message,
        });

      if (insertError) {
        console.error("Error sending message:", insertError);
        return { success: false, error: "Failed to send message" };
      }

      return { success: true };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to send message" };
    }
  },

  /**
   * Get all requests for admin (with filters)
   */
  async listAllRequestsForAdmin(
    statusFilter?: RequestStatus[]
  ): Promise<{ success: boolean; requests?: AgentRequestWithProfile[]; error?: string }> {
    try {
      let query = (supabase
        .from("agent_requests") as any)
        .select(`
          *,
          member_profile:member_user_id (
            full_name,
            email,
            country_code
          ),
          assigned_agent:assigned_agent_id (
            full_name,
            email
          ),
          assigned_by_admin:assigned_by_admin_id (
            full_name
          )
        `);

      if (statusFilter && statusFilter.length > 0) {
        query = query.in("status", statusFilter);
      }

      const { data: requests, error: fetchError } = await query.order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching all requests:", fetchError);
        return { success: false, error: "Failed to fetch requests" };
      }

      return { success: true, requests: requests || [] };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to fetch requests" };
    }
  },
};