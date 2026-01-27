import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { scamReportService } from "@/services/scamReportService";

/**
 * POST /api/admin/scam-reports/verify
 * Verify a scam report
 * Requires Manager Admin or Super Admin role
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
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

    // Validate request body
    const { reportId, reviewNotes } = req.body;

    if (!reportId) {
      return res.status(400).json({ error: "Report ID is required" });
    }

    // Verify report
    const result = await scamReportService.verifyReport(reportId, user.id, reviewNotes);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Verify report API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}