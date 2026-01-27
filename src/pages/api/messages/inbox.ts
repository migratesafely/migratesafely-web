import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { messageService } from "@/services/messageService";

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

    const result = await messageService.listInbox(session.user.id);

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    return res.status(200).json({ success: true, messages: result.messages });
  } catch (error) {
    console.error("Error in inbox API:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}