import { supabase } from "@/integrations/supabase/client";

export interface AdminNotification {
  id: string;
  notificationType: "tier_bonus_approval" | "agent_verification" | "scam_report_review" | "identity_verification" | "system_alert";
  priority: "normal" | "high" | "critical" | "overdue";
  memberId: string;
  memberFullName: string;
  title: string;
  message: string;
  metadata: {
    tier_name?: string;
    tier_level?: number;
    bonus_percentage?: number;
    base_referral_bonus?: number;
    calculated_bonus_amount?: number;
    currency_code?: string;
    eligibility_date?: string;
  };
  isRead: boolean;
  createdAt: string;
  escalatedAt?: string;
  hoursPending: number;
}

export const adminNotificationService = {
  /**
   * Get unread notifications for current admin
   */
  async getUnreadNotifications(): Promise<AdminNotification[]> {
    try {
      const { data, error } = await supabase.rpc("get_admin_notifications", {
        p_admin_id: null, // Uses current auth.uid()
        p_include_read: false
      });

      if (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }

      return (data || []).map((n: any) => ({
        id: n.notification_id,
        notificationType: n.notification_type,
        priority: n.priority,
        memberId: n.member_id,
        memberFullName: n.member_full_name,
        title: n.title,
        message: n.message,
        metadata: n.metadata || {},
        isRead: n.is_read,
        createdAt: n.created_at,
        escalatedAt: n.escalated_at,
        hoursPending: n.hours_pending
      }));
    } catch (error) {
      console.error("Error in getUnreadNotifications:", error);
      return [];
    }
  },

  /**
   * Get all notifications (including read) for current admin
   */
  async getAllNotifications(): Promise<AdminNotification[]> {
    try {
      const { data, error } = await supabase.rpc("get_admin_notifications", {
        p_admin_id: null,
        p_include_read: true
      });

      if (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }

      return (data || []).map((n: any) => ({
        id: n.notification_id,
        notificationType: n.notification_type,
        priority: n.priority,
        memberId: n.member_id,
        memberFullName: n.member_full_name,
        title: n.title,
        message: n.message,
        metadata: n.metadata || {},
        isRead: n.is_read,
        createdAt: n.created_at,
        escalatedAt: n.escalated_at,
        hoursPending: n.hours_pending
      }));
    } catch (error) {
      console.error("Error in getAllNotifications:", error);
      return [];
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("mark_notification_read", {
        p_notification_id: notificationId
      });

      if (error) {
        console.error("Error marking notification as read:", error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error("Error in markAsRead:", error);
      return false;
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const notifications = await this.getUnreadNotifications();
      return notifications.length;
    } catch (error) {
      console.error("Error in getUnreadCount:", error);
      return 0;
    }
  },

  /**
   * Get tier bonus approval notifications only
   */
  async getTierBonusNotifications(): Promise<AdminNotification[]> {
    try {
      const notifications = await this.getUnreadNotifications();
      return notifications.filter(n => n.notificationType === "tier_bonus_approval");
    } catch (error) {
      console.error("Error in getTierBonusNotifications:", error);
      return [];
    }
  },

  /**
   * Escalate pending notifications (should be called via cron job or scheduled task)
   */
  async escalatePendingNotifications(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc("escalate_pending_tier_bonus_notifications" as any);

      if (error) {
        console.error("Error escalating notifications:", error);
        return 0;
      }

      return typeof data === 'number' ? data : 0;
    } catch (error) {
      console.error("Error in escalatePendingNotifications:", error);
      return 0;
    }
  }
};