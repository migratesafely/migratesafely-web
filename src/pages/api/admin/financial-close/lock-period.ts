import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminRole } from "@/lib/apiMiddleware";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  const { supabase, user, profile } = auth;

  // SUPER ADMIN SAFE OVERRIDE: Super admin can lock any financial period immediately
  const isSuperAdmin = profile?.role === "super_admin";

  const { periodId } = req.body;

  if (!periodId) {
    return res.status(400).json({ error: "Period ID is required" });
  }

  try {
    const { data: updatedPeriod, error } = await supabase
      .from("monthly_close_periods" as any)
      .update({
        status: "locked",
        locked_at: new Date().toISOString(),
        locked_by: user.id
      })
      .eq("id", periodId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      message: `Financial period locked successfully`,
      period: updatedPeriod,
    });
  } catch (error) {
    console.error("Error locking financial period:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}