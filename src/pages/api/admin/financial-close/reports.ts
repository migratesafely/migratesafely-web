import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminRole } from "@/lib/apiMiddleware";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  const { supabase } = auth;
  const { periodId } = req.query;

  if (!periodId || typeof periodId !== 'string') {
    return res.status(400).json({ error: "Period ID is required" });
  }

  try {
    // Fetch reports for the period
    const { data: reports, error } = await supabase
      .from("monthly_financial_reports" as any)
      .select("*")
      .eq("close_period_id", periodId);

    if (error) throw error;

    return res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching financial reports:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}