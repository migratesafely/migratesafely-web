import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminRole } from "@/lib/apiMiddleware";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  const { supabase, profile, user } = auth;

  // SUPER ADMIN SAFE OVERRIDE: Super admin can lock any payroll period immediately
  const isSuperAdmin = profile?.role === "super_admin";

  const { periodId } = req.body;

  if (!periodId) {
    return res.status(400).json({ error: "Period ID is required" });
  }

  try {
    // Verify period exists and is approved
    const { data: period, error: fetchError } = await supabase
      .from("payroll_periods")
      .select("*")
      .eq("id", periodId)
      .single();

    if (fetchError || !period) {
      return res.status(404).json({ error: "Payroll period not found" });
    }

    // Super admin can lock from any status (safe override)
    if (!isSuperAdmin && period.status !== "approved") {
      return res.status(400).json({ error: "Only approved periods can be locked" });
    }

    // Lock the period
    const { data: lockedPeriod, error: updateError } = await supabase
      .from("payroll_periods")
      .update({
        status: "locked",
        locked_by: user.id,
        locked_at: new Date().toISOString(),
      })
      .eq("id", periodId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      message: "Payroll period locked successfully",
      period: lockedPeriod,
    });
  } catch (error) {
    console.error("Error locking payroll period:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}