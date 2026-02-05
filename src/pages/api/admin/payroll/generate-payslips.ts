import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminRole } from "@/lib/apiMiddleware";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  const { supabase } = auth;
  const { periodId } = req.body;

  try {
    const { data, error } = await supabase
      .rpc("generate_payslips" as any, { period_id: periodId });

    if (error) throw error;

    return res.status(200).json({ message: "Payslips generated", data });
  } catch (error) {
    console.error("Error generating payslips:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}