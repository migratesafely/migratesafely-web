import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { scamReportService } from "@/services/scamReportService";
import { agentPermissionsService } from "@/services/agentPermissionsService";
import { requireAdminRole } from "@/lib/apiMiddleware";

/**
 * POST /api/admin/scam-reports/verify
 * Verify a scam report
 * Requires Chairman access
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const auth = await requireAdminRole(req, res);
    if (!auth) return;

    // AUTHORITY: Only Chairman can verify scam reports
    const isChairman = await agentPermissionsService.isChairman(auth.userId);

    if (!isChairman) {
      return res.status(403).json({ error: "Forbidden - Chairman access required" });
    }

    // Validate request body
    const { reportId, status, notes } = req.body;

    if (!reportId) {
      return res.status(400).json({ error: "Report ID is required" });
    }

    // Verify report
    const result = await scamReportService.verifyReport(reportId, auth.userId, notes);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Verify report API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}