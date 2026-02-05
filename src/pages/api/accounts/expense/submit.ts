import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth } from "@/lib/apiMiddleware";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authResult = await requireAuth(req, res);
  if (authResult.isBlocked || !authResult.auth) return;

  const { supabase, user } = authResult.auth;
  const { amount, description, category, date } = req.body;

  try {
    const { data: expense, error } = await supabase
      .from("expense_requests" as any)
      .insert({
        submitted_by_employee_id: user.id, // Assuming user.id maps to employee_id
        amount,
        description,
        expense_category: category,
        expense_date: date,
        status: "pending",
        currency: "BDT",
        account_code: "EXP001", // Default account code
        expense_number: `EXP-${Date.now()}`
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json(expense);
  } catch (error) {
    console.error("Error submitting expense:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}