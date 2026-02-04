import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { agentPermissionsService } from "./agentPermissionsService";

type AdminNotification = Database["public"]["Tables"]["admin_notifications"]["Row"];

export type NotificationType =
  | "agent_verification"
  | "document_verification"
  | "tier_achievement"
  | "tier_bonus_pending"
  | "tier_bonus_approved"
  | "tier_achievement_bonus_pending"
  | "tier_achievement_bonus_approved"
  | "wallet_credit"
  | "membership_event"
  | "system_alert"
  | "identity_verification"
  | "scam_report_review"
  | "prize_draw_entry"
  | "prize_draw_winner";

export type NotificationPriority = "normal" | "high" | "urgent" | "critical";

export interface Notification {
  notificationId: string;
  notificationType: NotificationType;
  referenceId?: string;
  referenceType?: string;
  title: string;
  description: string;
  priority: NotificationPriority;
  actionUrl?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export const notificationService = {
  /**
   * Get unread notifications for current user
   */
  async getUnreadNotifications(): Promise<Notification[]> {
    try {
      const { data, error } = await supabase.rpc("get_unread_notifications");

      if (error) {
        console.error("Error fetching unread notifications:", error);
        return [];
      }

      return (data || []).map((n: any) => ({
        notificationId: n.notification_id,
        notificationType: n.notification_type,
        referenceId: n.reference_id,
        referenceType: n.reference_type,
        title: n.title,
        description: n.description,
        priority: n.priority,
        actionUrl: n.action_url,
        metadata: n.metadata,
        isRead: false,
        createdAt: n.created_at,
      }));
    } catch (error) {
      console.error("Error in getUnreadNotifications:", error);
      return [];
    }
  },

  /**
   * Get all notifications for current user (with pagination)
   */
  async getUserNotifications(
    limit: number = 50,
    offset: number = 0,
    includeRead: boolean = true
  ): Promise<Notification[]> {
    try {
      const { data, error } = await supabase.rpc("get_user_notifications", {
        p_limit: limit,
        p_offset: offset,
        p_include_read: includeRead,
      });

      if (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }

      return (data || []).map((n: any) => ({
        notificationId: n.notification_id,
        notificationType: n.notification_type,
        referenceId: n.reference_id,
        referenceType: n.reference_type,
        title: n.title,
        description: n.description,
        priority: n.priority,
        actionUrl: n.action_url,
        metadata: n.metadata,
        isRead: n.is_read,
        readAt: n.read_at,
        createdAt: n.created_at,
      }));
    } catch (error) {
      console.error("Error in getUserNotifications:", error);
      return [];
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc("get_unread_notification_count");

      if (error) {
        console.error("Error fetching unread count:", error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error("Error in getUnreadCount:", error);
      return 0;
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("mark_notification_read", {
        p_notification_id: notificationId,
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
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc("mark_all_notifications_read");

      if (error) {
        console.error("Error marking all as read:", error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error("Error in markAllAsRead:", error);
      return 0;
    }
  },

  /**
   * Create notification (admin/system use)
   */
  async createNotification(
    recipientId: string,
    notificationType: NotificationType,
    title: string,
    description: string,
    options?: {
      referenceId?: string;
      referenceType?: string;
      priority?: NotificationPriority;
      actionUrl?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("create_notification", {
        p_recipient_id: recipientId,
        p_notification_type: notificationType,
        p_title: title,
        p_description: description,
        p_reference_id: options?.referenceId || null,
        p_reference_type: options?.referenceType || null,
        p_priority: options?.priority || "normal",
        p_action_url: options?.actionUrl || null,
        p_metadata: options?.metadata || {},
      });

      if (error) {
        console.error("Error creating notification:", error);
        return { success: false, error: error.message };
      }

      return { success: true, notificationId: data };
    } catch (error) {
      console.error("Error in createNotification:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  },

  /**
   * Notify admins by role (manager_admin and above, or super_admin only)
   */
  async notifyAdmins(
    minRole: "worker_admin" | "manager_admin" | "super_admin",
    notificationType: NotificationType,
    title: string,
    description: string,
    options?: {
      referenceId?: string;
      referenceType?: string;
      priority?: NotificationPriority;
      actionUrl?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("notify_admins_by_role", {
        p_min_role: minRole,
        p_notification_type: notificationType,
        p_title: title,
        p_description: description,
        p_reference_id: options?.referenceId || null,
        p_reference_type: options?.referenceType || null,
        p_priority: options?.priority || "normal",
        p_action_url: options?.actionUrl || null,
        p_metadata: options?.metadata || {},
      });

      if (error) {
        console.error("Error notifying admins:", error);
        return { success: false, error: error.message };
      }

      return { success: true, count: data };
    } catch (error) {
      console.error("Error in notifyAdmins:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  },

  /**
   * Get priority badge color
   */
  getPriorityColor(priority: NotificationPriority): string {
    const colors: Record<NotificationPriority, string> = {
      normal: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
      high: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
      urgent: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
      critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
    };
    return colors[priority];
  },

  /**
   * Get notification type icon name
   */
  getNotificationIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      agent_verification: "UserCheck",
      document_verification: "FileText",
      tier_achievement: "Award",
      tier_bonus_pending: "Clock",
      tier_bonus_approved: "CheckCircle",
      tier_achievement_bonus_pending: "Clock",
      tier_achievement_bonus_approved: "Gift",
      wallet_credit: "Wallet",
      membership_event: "CreditCard",
      system_alert: "AlertTriangle",
      identity_verification: "Shield",
      scam_report_review: "AlertCircle",
      prize_draw_entry: "Ticket",
      prize_draw_winner: "Trophy",
    };
    return icons[type] || "Bell";
  },

  /**
   * Format relative time
   */
  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  },
};

export async function getAdminNotifications(userId: string): Promise<{
  success: boolean;
  error: string | null;
  notifications: any[];
}> {
  const isChairman = await agentPermissionsService.isChairman(userId);
  const isAdmin = await agentPermissionsService.isAdmin(userId);
  
  if (!isChairman && !isAdmin) {
    return {
      success: false,
      error: "User is not an admin",
      notifications: [],
    };
  }

  // Get notifications
  // Cast to any to avoid TS2589 excessively deep type instantiation
  const { data: notifications, error: notificationsError } = await (supabase as any)
    .from("admin_notifications")
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false });

  if (notificationsError) {
    console.error("Error fetching admin notifications:", notificationsError);
    return {
      success: false,
      error: "User is not an admin",
      notifications: [],
    };
  }

  return {
    success: true,
    error: null,
    notifications: (notifications || []).map((n: any) => ({
      notificationId: n.id,
      notificationType: n.notification_type,
      referenceId: n.reference_id,
      referenceType: n.reference_type,
      title: n.title,
      description: n.description,
      priority: n.priority,
      actionUrl: n.action_url,
      metadata: n.metadata,
      isRead: n.is_read,
      readAt: n.read_at,
      createdAt: n.created_at,
    })),
  };
}