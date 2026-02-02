import { supabase } from "@/integrations/supabase/client";

/**
 * Prize Notification Service
 * Handles automated notification dispatch for prize draws
 */

export type NotificationType = 
  | "winner_announcement" 
  | "non_winner" 
  | "admin_summary" 
  | "next_draw_teaser";

export interface NotificationTemplate {
  subject: string;
  body: string;
  category: string;
  priority: "LOW" | "NORMAL" | "HIGH";
}

/**
 * Get notification template for a specific type
 */
export function getNotificationTemplate(
  type: NotificationType,
  data: any
): NotificationTemplate {
  switch (type) {
    case "winner_announcement":
      return {
        subject: `🎉 Congratulations! You Won ${data.prize_title}`,
        body: `Congratulations ${data.winner_name}!\n\nYou are a winner of ${data.prize_title} (${data.prize_amount} BDT) in the ${data.draw_name || "prize draw"}.\n\nThe prize amount has been credited to your wallet and is ready to use.\n\nThank you for being part of our community!`,
        category: "PRIZE_DRAW",
        priority: "HIGH"
      };

    case "non_winner":
      return {
        subject: `Prize Draw Results: ${data.draw_name}`,
        body: `Thank you for participating in the ${data.draw_name}!\n\nWhile you were not selected as a winner this time, you are automatically entered into the next draw at no additional cost.\n\nStay active and keep your membership current for more chances to win!`,
        category: "PRIZE_DRAW",
        priority: "NORMAL"
      };

    case "admin_summary":
      return {
        subject: `Prize Draw Completed: ${data.draw_name}`,
        body: `Draw "${data.draw_name}" has been executed successfully.\n\n📊 Summary:\n- Winners Selected: ${data.total_winners}\n- Total Awarded: ${data.total_awarded} BDT\n- Leftover Amount: ${data.leftover_amount} BDT\n\nLeftover funds will roll forward to the next draw.`,
        category: "ADMIN",
        priority: "NORMAL"
      };

    case "next_draw_teaser":
      return {
        subject: `Next Prize Draw Coming Soon!`,
        body: `A new prize draw is scheduled!\n\nStay active and keep your membership current to be automatically entered.\n\nGood luck!`,
        category: "PRIZE_DRAW",
        priority: "LOW"
      };

    default:
      return {
        subject: "Prize Draw Notification",
        body: "You have a new notification from the prize draw system.",
        category: "PRIZE_DRAW",
        priority: "NORMAL"
      };
  }
}

/**
 * Queue notification for a user
 */
export async function queueNotification(
  drawId: string,
  recipientUserId: string,
  notificationType: NotificationType,
  templateData: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("prize_notification_queue")
      .insert({
        draw_id: drawId,
        recipient_user_id: recipientUserId,
        notification_type: notificationType,
        template_data: templateData,
        status: "pending"
      });

    if (error) {
      console.error("Error queueing notification:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error queueing notification:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send internal notification (immediate)
 */
export async function sendInternalNotification(
  recipientUserId: string,
  notificationType: NotificationType,
  templateData: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const template = getNotificationTemplate(notificationType, templateData);

    // 1. Create the message content
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        sender_role: "SYSTEM",
        subject: template.subject,
        body: template.body,
        category: template.category,
        priority: template.priority,
        message_type: "SYSTEM"
      })
      .select()
      .single();

    if (messageError) {
      console.error("Error creating system message:", messageError);
      return { success: false, error: messageError.message };
    }

    // 2. Assign to recipient
    const { error: recipientError } = await supabase
      .from("message_recipients")
      .insert({
        message_id: message.id,
        recipient_user_id: recipientUserId,
        folder: "INBOX",
        is_read: false
      });

    if (recipientError) {
      console.error("Error creating message recipient:", recipientError);
      return { success: false, error: recipientError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error sending internal notification:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get pending notifications
 */
export async function getPendingNotifications(limit: number = 100): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc("get_pending_notifications", {
      p_limit: limit
    });

    if (error) {
      console.error("Error getting pending notifications:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error getting pending notifications:", error);
    return [];
  }
}

/**
 * Mark notification as sent
 */
export async function markNotificationSent(
  notificationId: string,
  success: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc("mark_notification_sent", {
      p_notification_id: notificationId,
      p_success: success
    });

    if (error) {
      console.error("Error marking notification as sent:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error marking notification as sent:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Process notification queue (batch processing)
 */
export async function processNotificationQueue(
  batchSize: number = 50
): Promise<{ processed: number; failed: number }> {
  try {
    const notifications = await getPendingNotifications(batchSize);
    let processed = 0;
    let failed = 0;

    for (const notification of notifications) {
      const result = await sendInternalNotification(
        notification.recipient_user_id,
        notification.notification_type,
        notification.template_data
      );

      if (result.success) {
        await markNotificationSent(notification.notification_id, true);
        processed++;
      } else {
        await markNotificationSent(notification.notification_id, false);
        failed++;
      }
    }

    return { processed, failed };
  } catch (error) {
    console.error("Error processing notification queue:", error);
    return { processed: 0, failed: 0 };
  }
}

/**
 * Email-ready notification export (for external email service)
 */
export async function exportEmailReadyNotifications(): Promise<{
  notifications: Array<{
    recipient_email: string;
    subject: string;
    body: string;
    template_type: string;
  }>;
}> {
  try {
    const pending = await getPendingNotifications(100);
    const emailNotifications: any[] = [];

    for (const notification of pending) {
      // Get recipient email
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", notification.recipient_user_id)
        .single();

      if (error || !profile) {
        console.error("Error getting profile for notification:", error);
        continue;
      }

      const template = getNotificationTemplate(
        notification.notification_type,
        notification.template_data
      );

      emailNotifications.push({
        recipient_email: profile.email,
        subject: template.subject,
        body: template.body,
        template_type: notification.notification_type
      });
    }

    return { notifications: emailNotifications };
  } catch (error) {
    console.error("Error exporting email-ready notifications:", error);
    return { notifications: [] };
  }
}