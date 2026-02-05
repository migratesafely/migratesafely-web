import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminRole } from "@/lib/apiMiddleware";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  const { supabase, profile, user } = auth;

  // SUPER ADMIN SAFE OVERRIDE: Super admin can approve any expense immediately
  const isSuperAdmin = profile?.role === "super_admin";

  const { expenseId } = req.body;

  if (!expenseId) {
    return res.status(400).json({ error: "Expense ID is required" });
  }

  try {
    // Verify expense exists and is pending
    const { data: expense, error: fetchError } = await supabase
      .from("expense_requests" as any)
      .select("*")
      .eq("id", expenseId)
      .single();

    if (fetchError || !expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const expenseData = expense as any;

    // Super admin can approve from any status (safe override)
    if (!isSuperAdmin && expenseData.status !== "pending") {
      return res.status(400).json({ error: "Only pending expenses can be approved" });
    }

    // Approve the expense
    const { data: approvedExpense, error: updateError } = await supabase
      .from("expense_requests" as any)
      .update({
        status: "approved",
        super_admin_approved: true,
        super_admin_approved_by: user.id,
        super_admin_approved_at: new Date().toISOString(),
        super_admin_notes: req.body.notes,
      })
      .eq("id", expenseId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      message: "Expense approved successfully",
      expense: approvedExpense,
    });
  } catch (error) {
    console.error("Error approving expense:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}