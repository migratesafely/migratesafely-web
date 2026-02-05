import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { agentPermissionsService } from "./agentPermissionsService";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
type MessageRecipientRow = Database["public"]["Tables"]["message_recipients"]["Row"];

type SenderRole = "SYSTEM" | "ADMIN" | "AGENT" | "MEMBER";
type MessageType = "DIRECT" | "BROADCAST" | "SYSTEM" | "SUPPORT";
type TargetGroup = "ALL_MEMBERS" | "ALL_AGENTS" | "COUNTRY_MEMBERS" | "COUNTRY_AGENTS" | "CUSTOM";

interface MessageWithRecipient extends MessageRow {
  recipient_info?: MessageRecipientRow;
  sender_profile?: {
    full_name: string;
    email: string;
  };
}

interface BroadcastPayload {
  target: TargetGroup | "SELECTED_USERS";
  countryCode?: string;
  selectedUserIds?: string[];
  subject: string;
  body: string;
}

export const messageService = {
  async sendDirectMessage(
    senderId: string,
    recipientId: string,
    subject: string,
    body: string,
    senderRole: SenderRole
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { data: message, error: messageError } = await supabase
        .from("messages")
        .insert({
          sender_user_id: senderId,
          sender_role: senderRole,
          subject: subject,
          body: body,
          message_type: "DIRECT",
          target_group: null,
          target_country_code: null,
        })
        .select()
        .single();

      if (messageError) {
        console.error("Error creating message:", messageError);
        return { success: false, error: "Failed to create message" };
      }

      const { error: recipientError } = await supabase
        .from("message_recipients")
        .insert({
          message_id: message.id,
          recipient_user_id: recipientId,
          folder: "INBOX",
          is_read: false,
        });

      if (recipientError) {
        console.error("Error creating recipient:", recipientError);
        return { success: false, error: "Failed to deliver message" };
      }

      const { error: senderRecipientError } = await supabase
        .from("message_recipients")
        .insert({
          message_id: message.id,
          recipient_user_id: senderId,
          folder: "SENT",
          is_read: true,
        });

      if (senderRecipientError) {
        console.error("Error creating sender record:", senderRecipientError);
      }

      return { success: true, messageId: message.id };
    } catch (error) {
      console.error("Error in sendDirectMessage:", error);
      return { success: false, error: "Failed to send message" };
    }
  },

  async sendSupportMessage(
    userId: string,
    subject: string,
    body: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { data: message, error: messageError } = await supabase
        .from("messages")
        .insert({
          sender_user_id: userId,
          sender_role: "MEMBER",
          subject: subject,
          body: body,
          message_type: "SUPPORT",
          target_group: null,
          target_country_code: null,
        })
        .select()
        .single();

      if (messageError) {
        console.error("Error creating support message:", messageError);
        return { success: false, error: "Failed to create support message" };
      }

      const isSuperAdmin = await agentPermissionsService.isSuperAdmin(userId);
      if (!isSuperAdmin) {
        return { success: false, error: "Forbidden: Chairman access required" };
      }

      const { data: admins, error: adminsError } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["super_admin", "manager_admin"]);

      if (adminsError || !admins || admins.length === 0) {
        console.error("Error fetching admins:", adminsError);
        return { success: false, error: "No admins available to receive support message" };
      }

      const recipientRecords = admins.map((admin) => ({
        message_id: message.id,
        recipient_user_id: admin.id,
        folder: "INBOX",
        is_read: false,
      }));

      const { error: recipientsError } = await supabase
        .from("message_recipients")
        .insert(recipientRecords);

      if (recipientsError) {
        console.error("Error creating recipients:", recipientsError);
        return { success: false, error: "Failed to deliver support message" };
      }

      const { error: senderRecipientError } = await supabase
        .from("message_recipients")
        .insert({
          message_id: message.id,
          recipient_user_id: userId,
          folder: "SENT",
          is_read: true,
        });

      if (senderRecipientError) {
        console.error("Error creating sender record:", senderRecipientError);
      }

      return { success: true, messageId: message.id };
    } catch (error) {
      console.error("Error in sendSupportMessage:", error);
      return { success: false, error: "Failed to send support message" };
    }
  },

  async sendBroadcastMessage(
    adminId: string,
    payload: BroadcastPayload
  ): Promise<{ success: boolean; messageId?: string; recipientCount?: number; error?: string }> {
    try {
      const targetGroup = payload.target === "SELECTED_USERS" ? "CUSTOM" : payload.target;

      const { data: message, error: messageError } = await supabase
        .from("messages")
        .insert({
          sender_user_id: adminId,
          sender_role: "ADMIN",
          subject: payload.subject,
          body: payload.body,
          message_type: "BROADCAST",
          target_group: targetGroup,
          target_country_code: payload.countryCode || null,
        })
        .select()
        .single();

      if (messageError) {
        console.error("Error creating broadcast message:", messageError);
        return { success: false, error: "Failed to create broadcast message" };
      }

      // 1. Check authority
      const isSuperAdmin = await agentPermissionsService.isSuperAdmin(adminId);
      if (!isSuperAdmin) {
        return { success: false, error: "Only Chairman can send broadcast messages" };
      }

      let recipientIds: string[] = [];

      if (payload.target === "SELECTED_USERS" && payload.selectedUserIds) {
        recipientIds = payload.selectedUserIds;
      } else if (payload.target === "ALL_MEMBERS") {
        const { data: members, error: membersError } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "member");

        if (membersError) {
          console.error("Error fetching members:", membersError);
          return { success: false, error: "Failed to fetch members" };
        }

        recipientIds = members?.map((m) => m.id) || [];
      } else if (payload.target === "ALL_AGENTS") {
        const { data: agents, error: agentsError } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "agent");

        if (agentsError) {
          console.error("Error fetching agents:", agentsError);
          return { success: false, error: "Failed to fetch agents" };
        }

        recipientIds = agents?.map((a) => a.id) || [];
      } else if (payload.target === "COUNTRY_MEMBERS" && payload.countryCode) {
        const { data: members, error: membersError } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "member")
          .eq("country_code", payload.countryCode);

        if (membersError) {
          console.error("Error fetching country members:", membersError);
          return { success: false, error: "Failed to fetch country members" };
        }

        recipientIds = members?.map((m) => m.id) || [];
      } else if (payload.target === "COUNTRY_AGENTS" && payload.countryCode) {
        const { data: agents, error: agentsError } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "agent")
          .eq("country_code", payload.countryCode);

        if (agentsError) {
          console.error("Error fetching country agents:", agentsError);
          return { success: false, error: "Failed to fetch country agents" };
        }

        recipientIds = agents?.map((a) => a.id) || [];
      }

      if (recipientIds.length === 0) {
        return { success: false, error: "No recipients found for broadcast" };
      }

      const recipientRecords = recipientIds.map((id) => ({
        message_id: message.id,
        recipient_user_id: id,
        folder: "INBOX",
        is_read: false,
      }));

      const { error: recipientsError } = await supabase
        .from("message_recipients")
        .insert(recipientRecords);

      if (recipientsError) {
        console.error("Error creating recipients:", recipientsError);
        return { success: false, error: "Failed to deliver broadcast message" };
      }

      return { success: true, messageId: message.id, recipientCount: recipientIds.length };
    } catch (error) {
      console.error("Error in sendBroadcastMessage:", error);
      return { success: false, error: "Failed to send broadcast message" };
    }
  },

  async listInbox(userId: string): Promise<{ success: boolean; messages?: MessageWithRecipient[]; error?: string }> {
    try {
      const { data: recipients, error: recipientsError } = await supabase
        .from("message_recipients")
        .select(`
          *,
          messages (
            *,
            sender_profile:profiles!messages_sender_user_id_fkey (
              full_name,
              email
            )
          )
        `)
        .eq("recipient_user_id", userId)
        .eq("folder", "INBOX")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (recipientsError) {
        console.error("Error fetching inbox:", recipientsError);
        return { success: false, error: "Failed to fetch inbox" };
      }

      const messages = recipients?.map((r: any) => ({
        ...r.messages,
        recipient_info: {
          id: r.id,
          message_id: r.message_id,
          recipient_user_id: r.recipient_user_id,
          folder: r.folder,
          is_read: r.is_read,
          read_at: r.read_at,
          deleted_at: r.deleted_at,
          created_at: r.created_at,
        },
        sender_profile: r.messages.sender_profile,
      })) || [];

      return { success: true, messages };
    } catch (error) {
      console.error("Error in listInbox:", error);
      return { success: false, error: "Failed to fetch inbox" };
    }
  },

  async listSent(userId: string): Promise<{ success: boolean; messages?: MessageWithRecipient[]; error?: string }> {
    try {
      const { data: recipients, error: recipientsError } = await supabase
        .from("message_recipients")
        .select(`
          *,
          messages (*)
        `)
        .eq("recipient_user_id", userId)
        .eq("folder", "SENT")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (recipientsError) {
        console.error("Error fetching sent messages:", recipientsError);
        return { success: false, error: "Failed to fetch sent messages" };
      }

      const messages = recipients?.map((r: any) => ({
        ...r.messages,
        recipient_info: {
          id: r.id,
          message_id: r.message_id,
          recipient_user_id: r.recipient_user_id,
          folder: r.folder,
          is_read: r.is_read,
          read_at: r.read_at,
          deleted_at: r.deleted_at,
          created_at: r.created_at,
        },
      })) || [];

      return { success: true, messages };
    } catch (error) {
      console.error("Error in listSent:", error);
      return { success: false, error: "Failed to fetch sent messages" };
    }
  },

  async markAsRead(
    userId: string,
    recipientRecordId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: recipient, error: fetchError } = await supabase
        .from("message_recipients")
        .select("*")
        .eq("id", recipientRecordId)
        .eq("recipient_user_id", userId)
        .single();

      if (fetchError || !recipient) {
        console.error("Error fetching recipient:", fetchError);
        return { success: false, error: "Recipient not found" };
      }

      const { error: updateError } = await supabase
        .from("message_recipients")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", recipientRecordId)
        .eq("recipient_user_id", userId);

      if (updateError) {
        console.error("Error marking as read:", updateError);
        return { success: false, error: "Failed to mark as read" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in markAsRead:", error);
      return { success: false, error: "Failed to mark as read" };
    }
  },

  async moveToTrash(
    userId: string,
    recipientRecordId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: recipient, error: fetchError } = await supabase
        .from("message_recipients")
        .select("*")
        .eq("id", recipientRecordId)
        .eq("recipient_user_id", userId)
        .single();

      if (fetchError || !recipient) {
        console.error("Error fetching recipient:", fetchError);
        return { success: false, error: "Recipient not found" };
      }

      const { error: updateError } = await supabase
        .from("message_recipients")
        .update({
          folder: "TRASH",
          deleted_at: new Date().toISOString(),
        })
        .eq("id", recipientRecordId)
        .eq("recipient_user_id", userId);

      if (updateError) {
        console.error("Error moving to trash:", updateError);
        return { success: false, error: "Failed to move to trash" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in moveToTrash:", error);
      return { success: false, error: "Failed to move to trash" };
    }
  },

  async deleteForever(
    userId: string,
    recipientRecordId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: recipient, error: fetchError } = await supabase
        .from("message_recipients")
        .select("*")
        .eq("id", recipientRecordId)
        .eq("recipient_user_id", userId)
        .single();

      if (fetchError || !recipient) {
        console.error("Error fetching recipient:", fetchError);
        return { success: false, error: "Recipient not found" };
      }

      const { error: deleteError } = await supabase
        .from("message_recipients")
        .delete()
        .eq("id", recipientRecordId)
        .eq("recipient_user_id", userId);

      if (deleteError) {
        console.error("Error deleting message:", deleteError);
        return { success: false, error: "Failed to delete message" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in deleteForever:", error);
      return { success: false, error: "Failed to delete message" };
    }
  },

  async sendMembershipWelcomeMessage(params: {
    userId: string;
    fullName?: string | null;
    referralCode: string;
    membershipNumber: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { userId, fullName, referralCode, membershipNumber } = params;

      const subject = "Welcome to MigrateSafely — Your Membership is Active ✅";
      
      const body = `Hi ${fullName || "Member"},

Welcome to MigrateSafely.com — your membership has been successfully activated ✅

Membership Number: ${membershipNumber}
Your Referral Code: ${referralCode}

How referrals work:
Share your referral code with friends and family. If they use your code during signup and become active paid members, you may receive a referral reward (subject to our policy).

Referral rewards are promotional and may expire or change.
Misuse may result in forfeiture.

Go to Dashboard: /dashboard

Support: support@migratesafely.com
— MigrateSafely Team`;

      const { data: message, error: messageError } = await supabase
        .from("messages")
        .insert({
          sender_user_id: null,
          sender_role: "SYSTEM",
          message_type: "DIRECT",
          subject,
          body,
        })
        .select()
        .single();

      if (messageError || !message) {
        console.error("Error creating welcome message:", messageError);
        return { success: false, error: "Failed to create message" };
      }

      const { error: recipientError } = await supabase
        .from("message_recipients")
        .insert({
          message_id: message.id,
          recipient_user_id: userId,
          folder: "INBOX",
          is_read: false,
        });

      if (recipientError) {
        console.error("Error creating message recipient:", recipientError);
        return { success: false, error: "Failed to deliver message" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in sendMembershipWelcomeMessage:", error);
      return { success: false, error: "Failed to send welcome message" };
    }
  },

  /**
   * Send message from agent to assigned member or admin
   * Agent-specific messaging with relationship validation
   */
  async sendAgentMessage(
    agentId: string,
    recipientId: string,
    subject: string,
    body: string,
    recipientType: "member" | "admin"
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Create message with AGENT sender role
      const { data: message, error: messageError } = await supabase
        .from("messages")
        .insert({
          sender_user_id: agentId,
          sender_role: "AGENT",
          subject: subject,
          body: body,
          message_type: "DIRECT",
          target_group: null,
          target_country_code: null,
        })
        .select()
        .single();

      if (messageError) {
        console.error("Error creating agent message:", messageError);
        return { success: false, error: "Failed to create message" };
      }

      // Create recipient record for the recipient (inbox)
      const { error: recipientError } = await supabase
        .from("message_recipients")
        .insert({
          message_id: message.id,
          recipient_user_id: recipientId,
          folder: "INBOX",
          is_read: false,
        });

      if (recipientError) {
        console.error("Error creating recipient record:", recipientError);
        return { success: false, error: "Failed to deliver message" };
      }

      // Create sender copy (sent folder)
      const { error: senderRecipientError } = await supabase
        .from("message_recipients")
        .insert({
          message_id: message.id,
          recipient_user_id: agentId,
          folder: "SENT",
          is_read: true,
        });

      if (senderRecipientError) {
        console.error("Error creating sender record:", senderRecipientError);
      }

      return { success: true, messageId: message.id };
    } catch (error) {
      console.error("Error in sendAgentMessage:", error);
      return { success: false, error: "Failed to send agent message" };
    }
  },

  /**
   * Get all conversations for an agent (grouped by member/admin)
   */
  async getAgentConversations(
    agentId: string
  ): Promise<{ success: boolean; conversations?: any[]; error?: string }> {
    try {
      // Get all messages where agent is sender or recipient
      const { data: messageRecipients, error: recipientsError } = await supabase
        .from("message_recipients")
        .select(`
          *,
          messages (
            *,
            sender_profile:profiles!messages_sender_user_id_fkey (
              id,
              full_name,
              email,
              role
            )
          )
        `)
        .eq("recipient_user_id", agentId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (recipientsError) {
        console.error("Error fetching agent conversations:", recipientsError);
        return { success: false, error: "Failed to fetch conversations" };
      }

      // Group messages by conversation partner (other user)
      const conversationsMap = new Map<string, any>();

      for (const record of messageRecipients || []) {
        const message = (record as any).messages;
        if (!message) continue;

        // Determine conversation partner
        const partnerId = message.sender_user_id === agentId 
          ? null // This shouldn't happen in inbox
          : message.sender_user_id;

        if (!partnerId) continue;

        if (!conversationsMap.has(partnerId)) {
          conversationsMap.set(partnerId, {
            partnerId,
            partnerName: message.sender_profile?.full_name || "Unknown",
            partnerEmail: message.sender_profile?.email || "",
            partnerRole: message.sender_profile?.role || "member",
            lastMessage: message.subject || "No subject",
            lastMessageDate: message.created_at,
            unreadCount: 0,
            messages: [],
          });
        }

        const conversation = conversationsMap.get(partnerId);
        conversation.messages.push(message);
        
        if (!record.is_read) {
          conversation.unreadCount++;
        }
      }

      // Get sent messages to include in conversations
      const { data: sentRecipients, error: sentError } = await supabase
        .from("message_recipients")
        .select(`
          *,
          messages (
            *,
            recipient_profile:profiles (
              id,
              full_name,
              email,
              role
            )
          )
        `)
        .eq("recipient_user_id", agentId)
        .eq("folder", "SENT")
        .is("deleted_at", null);

      if (!sentError && sentRecipients) {
        for (const record of sentRecipients) {
          const message = (record as any).messages;
          if (!message) continue;

          // Find recipient from message_recipients table
          const { data: recipientData } = await supabase
            .from("message_recipients")
            .select("recipient_user_id")
            .eq("message_id", message.id)
            .neq("recipient_user_id", agentId)
            .single();

          if (recipientData) {
            const partnerId = recipientData.recipient_user_id;

            if (!conversationsMap.has(partnerId)) {
              // Get partner profile
              const { data: partnerProfile } = await supabase
                .from("profiles")
                .select("id, full_name, email, role")
                .eq("id", partnerId)
                .single();

              conversationsMap.set(partnerId, {
                partnerId,
                partnerName: partnerProfile?.full_name || "Unknown",
                partnerEmail: partnerProfile?.email || "",
                partnerRole: partnerProfile?.role || "member",
                lastMessage: message.subject || "No subject",
                lastMessageDate: message.created_at,
                unreadCount: 0,
                messages: [],
              });
            }

            const conversation = conversationsMap.get(partnerId);
            conversation.messages.push(message);
          }
        }
      }

      const conversations = Array.from(conversationsMap.values());

      return { success: true, conversations };
    } catch (error) {
      console.error("Error in getAgentConversations:", error);
      return { success: false, error: "Failed to fetch agent conversations" };
    }
  },

  /**
   * Get message thread between agent and specific user (member or admin)
   */
  async getMessageThread(
    agentId: string,
    otherUserId: string
  ): Promise<{ success: boolean; messages?: any[]; error?: string }> {
    try {
      // Get all messages between agent and other user
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select(`
          *,
          sender_profile:profiles!messages_sender_user_id_fkey (
            id,
            full_name,
            email,
            role
          )
        `)
        .or(`sender_user_id.eq.${agentId},sender_user_id.eq.${otherUserId}`)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Error fetching message thread:", messagesError);
        return { success: false, error: "Failed to fetch message thread" };
      }

      // Filter messages where either agent or other user is recipient
      const filteredMessages = [];

      for (const message of messages || []) {
        const { data: recipients } = await supabase
          .from("message_recipients")
          .select("recipient_user_id")
          .eq("message_id", message.id);

        const recipientIds = recipients?.map(r => r.recipient_user_id) || [];
        
        // Include message if it involves both agent and other user
        if (
          (message.sender_user_id === agentId && recipientIds.includes(otherUserId)) ||
          (message.sender_user_id === otherUserId && recipientIds.includes(agentId))
        ) {
          filteredMessages.push(message);
        }
      }

      return { success: true, messages: filteredMessages };
    } catch (error) {
      console.error("Error in getMessageThread:", error);
      return { success: false, error: "Failed to fetch message thread" };
    }
  },
};