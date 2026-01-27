import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type TimelineEvent = Database["public"]["Tables"]["agent_request_timeline"]["Insert"];
type TimelineEventRow = Database["public"]["Tables"]["agent_request_timeline"]["Row"];

/**
 * Agent Request Timeline Service
 * 
 * Handles immutable timeline tracking for all agent request events.
 * Once created, timeline records CANNOT be edited or deleted.
 */
export const agentRequestTimelineService = {
  /**
   * Log when a new agent request is created by a member
   */
  async logRequestCreated(
    agentRequestId: string,
    memberId: string,
    requestDetails?: any
  ): Promise<void> {
    const { error } = await supabase
      .from("agent_request_timeline")
      .insert({
        agent_request_id: agentRequestId,
        event_type: "REQUEST_CREATED",
        actor_id: memberId,
        actor_type: "member",
        new_status: "pending",
        notes: "Agent request submitted by member",
        metadata: requestDetails || {},
      });

    if (error) {
      console.error("Failed to log REQUEST_CREATED event:", error);
      throw error;
    }
  },

  /**
   * Log when an agent is assigned to a request by an admin
   */
  async logAgentAssigned(
    agentRequestId: string,
    agentId: string,
    adminId: string,
    adminRole: string
  ): Promise<void> {
    const { error } = await supabase
      .from("agent_request_timeline")
      .insert({
        agent_request_id: agentRequestId,
        event_type: "AGENT_ASSIGNED",
        actor_id: adminId,
        actor_type: "admin",
        actor_role: adminRole as any,
        assigned_agent_id: agentId,
        assigned_by_admin_id: adminId,
        old_status: "pending",
        new_status: "assigned",
        notes: "Agent assigned by admin",
      });

    if (error) {
      console.error("Failed to log AGENT_ASSIGNED event:", error);
      throw error;
    }
  },

  /**
   * Log when request status changes
   */
  async logStatusChange(
    agentRequestId: string,
    oldStatus: string,
    newStatus: string,
    actorId: string,
    actorType: "member" | "agent" | "admin",
    actorRole?: string,
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from("agent_request_timeline")
      .insert({
        agent_request_id: agentRequestId,
        event_type: "STATUS_CHANGED",
        actor_id: actorId,
        actor_type: actorType,
        actor_role: actorRole as any,
        old_status: oldStatus,
        new_status: newStatus,
        notes: notes || `Status changed from ${oldStatus} to ${newStatus}`,
      });

    if (error) {
      console.error("Failed to log STATUS_CHANGED event:", error);
      throw error;
    }
  },

  /**
   * Log when a message is sent between agent and member
   */
  async logMessageSent(
    agentRequestId: string,
    messageContent: string,
    senderId: string,
    senderType: "member" | "agent" | "admin" | "system"
  ): Promise<void> {
    const { error } = await supabase
      .from("agent_request_timeline")
      .insert({
        agent_request_id: agentRequestId,
        event_type: "MESSAGE_SENT",
        actor_id: senderId,
        actor_type: senderType,
        message_content: messageContent,
        message_sender_id: senderId,
        message_sender_type: senderType,
        notes: `Message sent by ${senderType}`,
      });

    if (error) {
      console.error("Failed to log MESSAGE_SENT event:", error);
      throw error;
    }
  },

  /**
   * Log system-generated messages to agent
   */
  async logSystemMessage(
    agentRequestId: string,
    messageContent: string,
    recipientId: string,
    recipientType: "agent" | "member"
  ): Promise<void> {
    const { error } = await supabase
      .from("agent_request_timeline")
      .insert({
        agent_request_id: agentRequestId,
        event_type: "SYSTEM_MESSAGE",
        message_content: messageContent,
        notes: `System message sent to ${recipientType}`,
        metadata: {
          recipient_id: recipientId,
          recipient_type: recipientType,
        },
      });

    if (error) {
      console.error("Failed to log SYSTEM_MESSAGE event:", error);
      throw error;
    }
  },

  /**
   * Log when admin adds a note
   */
  async logAdminNote(
    agentRequestId: string,
    adminId: string,
    adminRole: string,
    note: string
  ): Promise<void> {
    const { error } = await supabase
      .from("agent_request_timeline")
      .insert({
        agent_request_id: agentRequestId,
        event_type: "ADMIN_NOTE",
        actor_id: adminId,
        actor_type: "admin",
        actor_role: adminRole as any,
        notes: note,
      });

    if (error) {
      console.error("Failed to log ADMIN_NOTE event:", error);
      throw error;
    }
  },

  /**
   * Log when request is escalated
   */
  async logEscalated(
    agentRequestId: string,
    escalatedBy: string,
    escalatedByType: "member" | "agent" | "admin",
    reason: string,
    adminRole?: string
  ): Promise<void> {
    const { error } = await supabase
      .from("agent_request_timeline")
      .insert({
        agent_request_id: agentRequestId,
        event_type: "ESCALATED",
        actor_id: escalatedBy,
        actor_type: escalatedByType,
        actor_role: adminRole as any,
        old_status: "in_progress",
        new_status: "escalated",
        notes: reason,
      });

    if (error) {
      console.error("Failed to log ESCALATED event:", error);
      throw error;
    }
  },

  /**
   * Get full timeline for a specific agent request
   * Returns events in chronological order
   */
  async getRequestTimeline(agentRequestId: string): Promise<TimelineEventRow[]> {
    const { data, error } = await supabase
      .from("agent_request_timeline")
      .select(`
        *,
        actor:actor_id (
          id,
          full_name,
          email,
          role
        ),
        assigned_agent:assigned_agent_id (
          id,
          full_name,
          email
        ),
        assigned_by_admin:assigned_by_admin_id (
          id,
          full_name,
          email,
          role
        )
      `)
      .eq("agent_request_id", agentRequestId)
      .order("event_timestamp", { ascending: true });

    if (error) {
      console.error("Failed to fetch timeline:", error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get timeline events by type
   */
  async getTimelineByEventType(
    agentRequestId: string,
    eventType: string
  ): Promise<TimelineEventRow[]> {
    const { data, error } = await supabase
      .from("agent_request_timeline")
      .select("*")
      .eq("agent_request_id", agentRequestId)
      .eq("event_type", eventType)
      .order("event_timestamp", { ascending: true });

    if (error) {
      console.error("Failed to fetch timeline by type:", error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get all messages in timeline
   */
  async getTimelineMessages(agentRequestId: string): Promise<TimelineEventRow[]> {
    const { data, error } = await supabase
      .from("agent_request_timeline")
      .select(`
        *,
        message_sender:message_sender_id (
          id,
          full_name,
          email
        )
      `)
      .eq("agent_request_id", agentRequestId)
      .in("event_type", ["MESSAGE_SENT", "SYSTEM_MESSAGE"])
      .order("event_timestamp", { ascending: true });

    if (error) {
      console.error("Failed to fetch timeline messages:", error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get status change history
   */
  async getStatusHistory(agentRequestId: string): Promise<TimelineEventRow[]> {
    const { data, error } = await supabase
      .from("agent_request_timeline")
      .select(`
        *,
        actor:actor_id (
          id,
          full_name,
          email,
          role
        )
      `)
      .eq("agent_request_id", agentRequestId)
      .eq("event_type", "STATUS_CHANGED")
      .order("event_timestamp", { ascending: true });

    if (error) {
      console.error("Failed to fetch status history:", error);
      throw error;
    }

    return data || [];
  },
};