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

    const {
      title,
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      nationality,
      idNumber,
      idType,
      idFrontUrl,
      idBackUrl,
      selfieUrl,
    } = req.body;

    if (!title || !firstName || !lastName || !dateOfBirth || !nationality || !idNumber || !idType || !idFrontUrl) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const { data: membership } = await supabase
      .from("memberships")
      .select("status")
      .eq("user_id", session.user.id)
      .single();

    if (!membership || membership.status !== "active") {
      return res.status(403).json({ success: false, error: "Active membership required" });
    }

    const { data: existing } = await supabase
      .from("identity_verifications")
      .select("id, status")
      .eq("user_id", session.user.id)
      .single();

    if (existing) {
      if (existing.status === "APPROVED") {
        return res.status(400).json({ success: false, error: "Identity already verified" });
      }

      const { error: updateError } = await supabase
        .from("identity_verifications")
        .update({
          title,
          first_name: firstName,
          middle_name: middleName || null,
          last_name: lastName,
          date_of_birth: dateOfBirth,
          nationality,
          id_number: idNumber,
          id_type: idType,
          id_front_url: idFrontUrl,
          id_back_url: idBackUrl || null,
          selfie_url: selfieUrl || null,
          status: "PENDING",
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from("identity_verifications")
        .insert({
          user_id: session.user.id,
          title,
          first_name: firstName,
          middle_name: middleName || null,
          last_name: lastName,
          date_of_birth: dateOfBirth,
          nationality,
          id_number: idNumber,
          id_type: idType,
          id_front_url: idFrontUrl,
          id_back_url: idBackUrl || null,
          selfie_url: selfieUrl || null,
          status: "PENDING",
        });

      if (insertError) throw insertError;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Identity submit error:", error);
    return res.status(500).json({ success: false, error: "Failed to submit verification" });
  }
}