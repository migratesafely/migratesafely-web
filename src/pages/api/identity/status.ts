import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { data: verification } = await supabase
      .from("identity_verifications")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    return res.status(200).json({
      success: true,
      verification: verification || null,
      isVerified: verification?.status === "APPROVED",
    });
  } catch (error) {
    console.error("Identity status error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch status" });
  }
}