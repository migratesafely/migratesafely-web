import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminRole } from "@/lib/apiMiddleware";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  const { supabase, user } = auth;
  const { expenseId, transactionReference } = req.body;

  try {
    const { data: expense, error } = await supabase
      .from("expense_requests" as any)
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        paid_by_admin_id: user.id,
        payment_reference: transactionReference
      })
      .eq("id", expenseId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json(expense);
  } catch (error) {
    console.error("Error marking expense as paid:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}