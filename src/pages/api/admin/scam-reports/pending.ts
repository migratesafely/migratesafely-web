import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { scamReportService } from "@/services/scamReportService";

/**
 * GET /api/admin/scam-reports/pending
 * Returns pending scam reports (submitted or under_review)
 * Requires Manager Admin or Super Admin role
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if user is Manager Admin or Super Admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["manager_admin", "super_admin"].includes(profile.role)) {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }

    // Fetch pending reports
    const result = await scamReportService.listPendingReports();

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json({ reports: result.reports });
  } catch (error) {
    console.error("Pending reports API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}