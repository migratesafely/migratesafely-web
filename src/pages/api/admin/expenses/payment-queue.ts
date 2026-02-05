import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminRole } from "@/lib/apiMiddleware";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  const { supabase } = auth;

  try {
    const { data: expenses, error } = await supabase
      .from("expense_requests" as any)
      .select("*, employees:submitted_by_employee_id(full_name, email)")
      .eq("status", "approved") // Ready for payment
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json(expenses);
  } catch (error) {
    console.error("Error fetching payment queue:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}