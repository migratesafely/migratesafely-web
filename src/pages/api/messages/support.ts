import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { messageService } from "@/services/messageService";

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

    const { subject, body } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ success: false, error: "Missing subject or body" });
    }

    const result = await messageService.sendSupportMessage(
      session.user.id,
      subject,
      body
    );

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    return res.status(200).json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error("Error in support message API:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}