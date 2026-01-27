import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || !["super_admin", "manager_admin"].includes(profile.role)) {
      return res.status(403).json({ success: false, error: "Admin access required" });
    }

    const { verificationId, rejectionReason } = req.body;

    if (!verificationId || !rejectionReason) {
      return res.status(400).json({ success: false, error: "Verification ID and rejection reason required" });
    }

    const { error: updateError } = await supabase
      .from("identity_verifications")
      .update({
        status: "REJECTED",
        rejection_reason: rejectionReason,
        reviewed_by: session.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", verificationId);

    if (updateError) throw updateError;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Reject verification error:", error);
    return res.status(500).json({ success: false, error: "Failed to reject verification" });
  }
}