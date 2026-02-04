import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { scamReportService } from "@/services/scamReportService";
import { agentPermissionsService } from "@/services/agentPermissionsService";
import { requireAdminRole } from "@/lib/apiMiddleware";

/**
 * GET /api/admin/scam-reports/pending
 * Returns pending scam reports (submitted or under_review)
 * Requires Chairman access
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const auth = await requireAdminRole(req, res);
    if (!auth) return;

    // AUTHORITY: Only Chairman can view/manage scam reports
    const isChairman = await agentPermissionsService.isChairman(auth.userId);

    if (!isChairman) {
      return res.status(403).json({ error: "Forbidden - Chairman access required" });
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