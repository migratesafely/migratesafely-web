import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminRole } from "@/lib/apiMiddleware";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  const { supabase, user } = auth;
  const { periodId } = req.body;

  try {
    const { data: period, error } = await supabase
      .from("payroll_periods")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        submitted_by: user.id
      })
      .eq("id", periodId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json(period);
  } catch (error) {
    console.error("Error submitting payroll period:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}