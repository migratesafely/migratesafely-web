import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { withAuth, AuthenticatedRequest } from "@/lib/apiMiddleware";

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user's employee record to verify authorization
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, department, role_category, user_id")
      .eq("user_id", userId)
      .single();

    if (employeeError || !employee) {
      return res.status(403).json({ 
        error: "Access denied. Only authorized employees can submit expenses." 
      });
    }

    // Verify user is authorized to submit expenses
    const authorizedDepts = ["accounts", "hr"];
    const authorizedRoles = ["department_head", "general_manager", "managing_director", "chairman"];
    
    const dept = String(employee.department);
    const role = String(employee.role_category);
    
    const isAuthorized = 
      authorizedDepts.includes(dept) || 
      authorizedRoles.includes(role);

    if (!isAuthorized) {
      return res.status(403).json({ 
        error: "You are not authorized to submit expenses." 
      });
    }

    const {
      expense_category,
      description,
      amount,
      expense_date,
      receipt_urls,
      business_purpose,
      cost_centre
    } = req.body;

    // Validate required fields
    if (!expense_category || !description || !amount || !expense_date || !business_purpose) {
      return res.status(400).json({ 
        error: "Missing required fields. Please provide category, description, amount, expense date, and business purpose." 
      });
    }

    // Validate amount
    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ 
        error: "Amount must be a positive number." 
      });
    }

    // Validate receipt for non-petty-cash expenses
    if (expense_category !== "petty_cash" && (!receipt_urls || !Array.isArray(receipt_urls) || receipt_urls.length === 0)) {
      return res.status(400).json({ 
        error: "Receipt upload is required for all expenses except petty cash." 
      });
    }

    // Validate expense date is not in future
    const expenseDate = new Date(expense_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (expenseDate > today) {
      return res.status(400).json({ 
        error: "Expense date cannot be in the future." 
      });
    }

    // Get account mapping for the expense category
    // Using 'any' for table name as types might not be regenerated yet
    const { data: mapping, error: mappingError } = await supabase
      .from("expense_category_account_mapping" as any)
      .select("account_code, is_capex, asset_account_code")
      .eq("expense_category", expense_category)
      .single();

    if (mappingError || !mapping) {
      return res.status(400).json({ 
        error: "Invalid expense category. Please select a valid category." 
      });
    }

    // Cast mapping to any to access properties safely
    const mappingData = mapping as any;

    // Prepare insert data
    const insertData = {
      created_by: userId,
      expense_category,
      description,
      amount,
      expense_date,
      receipt_urls: receipt_urls || [],
      business_purpose,
      department: employee.department,
      cost_centre: cost_centre || String(employee.department),
      is_capex: mappingData.is_capex || false,
      status: "submitted"
    };

    // Create expense request
    const { data: expenseRequest, error: createError } = await supabase
      .from("expense_requests")
      .insert(insertData as any)
      .select()
      .single();

    if (createError) {
      console.error("Error creating expense request:", createError);
      return res.status(500).json({ 
        error: "Failed to submit expense request. Please try again." 
      });
    }

    // Create audit log entry
    await supabase
      .from("expense_approval_audit")
      .insert({
        expense_request_id: expenseRequest.id,
        action: "submitted",
        actor_id: userId,
        notes: `Expense submitted: ${expense_category} - ${description}`
      } as any);

    return res.status(200).json({
      success: true,
      message: "Expense request submitted successfully",
      expense_request: expenseRequest
    });

  } catch (error) {
    console.error("Error in expense submission:", error);
    return res.status(500).json({ 
      error: "An unexpected error occurred. Please try again." 
    });
  }
}

export default withAuth(handler);