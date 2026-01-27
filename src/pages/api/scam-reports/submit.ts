import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      scammerName,
      scammerCompany,
      scammerContact,
      description,
      amountLost,
      currency,
      incidentDate,
      evidenceFileUrls,
      scammerPhotoUrl,
      lastKnownAddress,
    } = req.body;

    if (!scammerName || !description || !evidenceFileUrls || evidenceFileUrls.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from("scammer_reports")
      .insert({
        reported_by: user.id,
        scammer_name: scammerName,
        scammer_company: scammerCompany || null,
        scammer_contact: scammerContact || null,
        incident_description: description,
        evidence_file_urls: evidenceFileUrls,
        amount_lost: amountLost || null,
        currency: currency || null,
        incident_date: incidentDate || null,
        scammer_photo_url: scammerPhotoUrl || null,
        last_known_address: lastKnownAddress || null,
        status: "submitted",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error submitting report:", error);
      return res.status(500).json({ error: "Failed to submit report" });
    }

    return res.status(200).json({ success: true, reportId: data.id });
  } catch (error) {
    console.error("Submit report API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}