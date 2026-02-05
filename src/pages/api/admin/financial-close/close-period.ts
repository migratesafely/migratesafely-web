import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminRole } from "@/lib/apiMiddleware";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  const { supabase, user, profile } = auth;

  // SUPER ADMIN SAFE OVERRIDE: Super admin can close any financial period immediately
  const isSuperAdmin = profile?.role === "super_admin";

  const { periodId } = req.body;

  if (!periodId) {
    return res.status(400).json({ error: "Period is required (format: YYYY-MM)" });
  }

  try {
    // Close the financial period
    const { data, error } = await supabase
      .from("financial_close_periods" as any)
      .insert({
        period: periodId,
        status: "closed",
        closed_by: user.id,
        closed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      message: `Financial period ${periodId} closed successfully`,
      period: data,
    });
  } catch (error) {
    console.error("Error closing financial period:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}