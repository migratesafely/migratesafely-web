import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { withAuth } from "@/lib/apiMiddleware";
import type { AuthenticatedRequest } from "@/lib/apiMiddleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { 
      expense_request_id, 
      payment_method,
      payment_reference,
      payment_notes 
    } = req.body;

    if (!expense_request_id) {
      return res.status(400).json({ 
        error: "Missing required field: expense_request_id" 
      });
    }

    // Get user's employee record to verify payment authority
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, department, role_category, user_id")
      .eq("user_id", userId)
      .single();

    if (employeeError || !employee) {
      return res.status(403).json({ 
        error: "Access denied. Only authorized employees can mark expenses as paid." 
      });
    }

    const role = String(employee.role_category);
    const dept = String(employee.department);

    // Check payment authority
    const hasPaymentAuthority = 
      dept === "accounts" ||
      ["chairman", "managing_director", "general_manager"].includes(role);

    if (!hasPaymentAuthority) {
      return res.status(403).json({ 
        error: "You do not have payment processing authority." 
      });
    }

    // Verify expense is approved and not already paid
    const { data: expense, error: expenseError } = await (supabase
      .from("expense_requests") as any)
      .select("*")
      .eq("id", expense_request_id)
      .single();

    if (expenseError || !expense) {
      return res.status(404).json({ 
        error: "Expense request not found" 
      });
    }

    if (expense.status !== "approved") {
      return res.status(400).json({ 
        error: `Cannot mark as paid. Current status: ${expense.status}. Only approved expenses can be paid.` 
      });
    }

    if (expense.payment_date) {
      return res.status(400).json({ 
        error: "Expense already marked as paid" 
      });
    }

    // Update expense to paid status
    const updateData: any = {
      status: "paid",
      payment_date: new Date().toISOString(),
      payment_method: payment_method || "bank_transfer",
      payment_reference: payment_reference || null,
      payment_notes: payment_notes || null
    };

    const { data: updatedExpense, error: updateError } = await (supabase
      .from("expense_requests") as any)
      .update(updateData)
      .eq("id", expense_request_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating expense:", updateError);
      return res.status(500).json({ 
        error: "Failed to mark expense as paid" 
      });
    }

    // Create audit log entry
    const auditEntry = {
      expense_request_id,
      action: "marked_as_paid",
      actor_id: userId,
      notes: `Payment processed by ${role}${payment_reference ? `. Reference: ${payment_reference}` : ""}${payment_notes ? `. Notes: ${payment_notes}` : ""}`
    };

    const { error: auditError } = await (supabase
      .from("expense_approval_audit") as any)
      .insert(auditEntry);

    if (auditError) {
      console.error("Error creating audit log:", auditError);
      // Don't fail the payment if audit log fails, just log it
    }

    return res.status(200).json({
      success: true,
      message: "Expense marked as paid successfully",
      expense: updatedExpense
    });

  } catch (error) {
    console.error("Error in mark paid:", error);
    return res.status(500).json({ 
      error: "An unexpected error occurred" 
    });
  }
}

export default withAuth(handler);