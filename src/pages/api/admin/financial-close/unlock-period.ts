import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminRole } from "@/lib/apiMiddleware";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  const { supabase, user, profile } = auth;

  // SUPER ADMIN SAFE OVERRIDE: Super admin can unlock any financial period immediately
  const isSuperAdmin = profile?.role === "super_admin";

  const { periodId, unlockReason } = req.body;

  if (!periodId) {
    return res.status(400).json({ error: "Period is required (format: YYYY-MM)" });
  }

  try {
    // Unlock the financial period
    const { data, error } = await supabase
      .from("financial_close_periods" as any)
      .update({
        status: "closed",
        locked_by: null,
        locked_at: null,
      })
      .eq("period", periodId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      message: `Financial period ${periodId} unlocked successfully`,
      period: data,
    });
  } catch (error) {
    console.error("Error unlocking financial period:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}