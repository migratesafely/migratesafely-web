import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { withAuth } from "@/lib/apiMiddleware";
import type { AuthenticatedRequest } from "@/lib/apiMiddleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user's employee record to determine payment authority
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, department, role_category, user_id")
      .eq("user_id", userId)
      .single();

    if (employeeError || !employee) {
      return res.status(403).json({ 
        error: "Access denied. Only authorized employees can view payment queue." 
      });
    }

    const role = String(employee.role_category);
    const dept = String(employee.department);

    // Check if user has payment authority
    const hasPaymentAuthority = 
      dept === "accounts" ||
      ["chairman", "managing_director", "general_manager"].includes(role);

    if (!hasPaymentAuthority) {
      return res.status(403).json({ 
        error: "You do not have payment processing authority." 
      });
    }

    // Get query parameters for filtering
    const { 
      status = "approved", 
      start_date, 
      end_date, 
      expense_category 
    } = req.query;

    // Build query for approved expenses
    let query = (supabase.from("expense_requests") as any).select(`
      *,
      created_by_profile:profiles!expense_requests_created_by_fkey(id, full_name, email),
      created_by_employee:employees!expense_requests_created_by_fkey(department, role_category)
    `);

    // Filter by payment status
    if (status === "approved") {
      // Approved but not yet paid
      query = query
        .eq("status", "approved")
        .is("payment_date", null);
    } else if (status === "paid") {
      // Already paid
      query = query.eq("status", "paid");
    }

    // Filter by date range (approval date or payment date)
    if (start_date) {
      query = query.gte("created_at", start_date);
    }
    if (end_date) {
      query = query.lte("created_at", end_date);
    }

    // Filter by expense category
    if (expense_category && expense_category !== "all") {
      query = query.eq("expense_category", expense_category);
    }

    query = query.order("created_at", { ascending: false });

    const { data: expenses, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching payment queue:", fetchError);
      return res.status(500).json({ 
        error: "Failed to fetch payment queue" 
      });
    }

    return res.status(200).json({
      success: true,
      expenses: expenses || [],
      userRole: role,
      userDepartment: dept,
      hasPaymentAuthority
    });

  } catch (error) {
    console.error("Error in payment queue:", error);
    return res.status(500).json({ 
      error: "An unexpected error occurred" 
    });
  }
}

export default withAuth(handler);