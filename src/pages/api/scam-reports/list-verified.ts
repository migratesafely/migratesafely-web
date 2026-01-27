import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check active membership
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("status, end_date")
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ error: "Active membership required" });
    }

    if (membership.status !== "active") {
      return res.status(403).json({ error: "Active membership required" });
    }

    const today = new Date().toISOString().split("T")[0];
    if (membership.end_date && membership.end_date < today) {
      return res.status(403).json({ error: "Membership expired" });
    }

    // Get search query
    const { search } = req.query;

    // Build query for verified reports
    let query = supabase
      .from("scammer_reports")
      .select("id, scammer_name, scammer_company, scammer_contact, incident_description, amount_lost, currency, incident_date, evidence_file_urls, scammer_photo_url, last_known_address, created_at")
      .eq("status", "verified")
      .order("created_at", { ascending: false });

    // Apply search filter if provided
    if (search && typeof search === "string") {
      query = query.or(`scammer_name.ilike.%${search}%,scammer_company.ilike.%${search}%,scammer_contact.ilike.%${search}%`);
    }

    const { data: reports, error: reportsError } = await query;

    if (reportsError) {
      console.error("Error fetching verified reports:", reportsError);
      return res.status(500).json({ error: "Failed to fetch reports" });
    }

    return res.status(200).json({ reports: reports || [] });
  } catch (error) {
    console.error("List verified reports API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}