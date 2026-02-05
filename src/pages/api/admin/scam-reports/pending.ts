import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { scamReportService } from "@/services/scamReportService";
import { requireAuth } from "@/lib/apiMiddleware";
import { agentPermissionsService } from "@/services/agentPermissionsService";

/**
 * List Pending Scam Reports
 * Requires Chairman access
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { auth } = await requireAuth(req, res);
  if (!auth) return;

  try {
    const { data: employee } = await supabase
      .from("employees")
      .select("role_category")
      .eq("user_id", auth.userId)
      .single();

    // Super Admin override: Can view without chairman role
    const isChairman = employee?.role_category === "chairman";
    const isSuperAdmin = await agentPermissionsService.isSuperAdmin(auth.userId);
    
    if (!isChairman && !isSuperAdmin) {
      return res.status(403).json({ error: "Forbidden: Chairman or Super Admin access required" });
    }

    // Fetch pending reports
    const reportResult = await scamReportService.listPendingReports();

    if (!reportResult.success) {
      return res.status(500).json({ error: reportResult.error });
    }

    return res.status(200).json({ reports: reportResult.reports });
  } catch (error) {
    console.error("Pending reports API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}