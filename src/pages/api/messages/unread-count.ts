import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { count, error: countError } = await supabase
      .from("message_recipients")
      .select("*", { count: "exact", head: true })
      .eq("recipient_user_id", session.user.id)
      .eq("folder", "INBOX")
      .eq("is_read", false)
      .is("deleted_at", null);

    if (countError) {
      console.error("Error fetching unread count:", countError);
      return res.status(500).json({ success: false, error: "Failed to fetch unread count" });
    }

    return res.status(200).json({ success: true, unreadCount: count || 0 });
  } catch (error) {
    console.error("Error in unread count API:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}