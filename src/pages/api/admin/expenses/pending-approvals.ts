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

    // Get user's employee record to determine approval authority
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, department, role_category, user_id")
      .eq("user_id", userId)
      .single();

    if (employeeError || !employee) {
      return res.status(403).json({ 
        error: "Access denied. Only authorized employees can view pending approvals." 
      });
    }

    const role = String(employee.role_category);
    const dept = String(employee.department);

    // Build query based on role
    let query = (supabase.from("expense_requests") as any).select(`
      *,
      created_by_profile:profiles!expense_requests_created_by_fkey(id, full_name, email),
      created_by_employee:employees!expense_requests_created_by_fkey(department, role_category)
    `);

    // Filter based on approval authority
    if (role === "department_head") {
      // Department heads see submitted expenses from their department
      query = query
        .eq("status", "submitted")
        .eq("department", dept);
    } else if (role === "general_manager") {
      // GM sees dept head approved expenses
      query = query.eq("status", "dept_head_approved");
    } else if (role === "managing_director") {
      // MD sees GM approved expenses
      query = query.eq("status", "gm_approved");
    } else if (role === "chairman") {
      // Chairman sees MD approved expenses OR can override any status
      query = query.in("status", ["md_approved", "gm_approved", "dept_head_approved", "submitted"]);
    } else {
      // No approval authority
      return res.status(200).json({
        success: true,
        expenses: [],
        message: "You do not have approval authority"
      });
    }

    query = query.order("created_at", { ascending: false });

    const { data: expenses, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching pending approvals:", fetchError);
      return res.status(500).json({ 
        error: "Failed to fetch pending approvals" 
      });
    }

    return res.status(200).json({
      success: true,
      expenses: expenses || [],
      userRole: role,
      userDepartment: dept
    });

  } catch (error) {
    console.error("Error in pending approvals:", error);
    return res.status(500).json({ 
      error: "An unexpected error occurred" 
    });
  }
}

export default withAuth(handler);