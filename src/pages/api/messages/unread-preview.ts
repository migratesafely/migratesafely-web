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

    const { data: recipients, error: recipientsError } = await supabase
      .from("message_recipients")
      .select(`
        id,
        message_id,
        messages (
          id,
          subject,
          body,
          sender_role,
          created_at
        )
      `)
      .eq("recipient_user_id", session.user.id)
      .eq("folder", "INBOX")
      .eq("is_read", false)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recipientsError) {
      console.error("Error fetching unread preview:", recipientsError);
      return res.status(500).json({ success: false, error: "Failed to fetch unread messages" });
    }

    const messages = recipients?.map((r: any) => ({
      recipientId: r.id,
      messageId: r.messages.id,
      subject: r.messages.subject,
      bodyPreview: r.messages.body.substring(0, 80) + (r.messages.body.length > 80 ? "..." : ""),
      senderRole: r.messages.sender_role,
      createdAt: r.messages.created_at,
    })) || [];

    return res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("Error in unread preview API:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}