import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { data: unreadRecipients, error: fetchError } = await supabase
      .from("message_recipients")
      .select("id")
      .eq("recipient_user_id", session.user.id)
      .eq("folder", "INBOX")
      .eq("is_read", false)
      .is("deleted_at", null);

    if (fetchError) {
      console.error("Error fetching unread messages:", fetchError);
      return res.status(500).json({ success: false, error: "Failed to fetch unread messages" });
    }

    const updatedCount = unreadRecipients?.length || 0;

    if (updatedCount === 0) {
      return res.status(200).json({ success: true, updatedCount: 0 });
    }

    const { error: updateError } = await supabase
      .from("message_recipients")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("recipient_user_id", session.user.id)
      .eq("folder", "INBOX")
      .eq("is_read", false)
      .is("deleted_at", null);

    if (updateError) {
      console.error("Error marking all as read:", updateError);
      return res.status(500).json({ success: false, error: "Failed to mark all as read" });
    }

    return res.status(200).json({ success: true, updatedCount });
  } catch (error) {
    console.error("Error in mark all as read API:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}