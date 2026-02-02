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

    const { expense_request_id, rejection_reason } = req.body;

    if (!expense_request_id || !rejection_reason) {
      return res.status(400).json({ 
        error: "Missing required fields: expense_request_id, rejection_reason" 
      });
    }

    if (!rejection_reason.trim()) {
      return res.status(400).json({ 
        error: "Rejection reason cannot be empty" 
      });
    }

    // Get user's employee record to verify authority
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, department, role_category, user_id")
      .eq("user_id", userId)
      .single();

    if (employeeError || !employee) {
      return res.status(403).json({ 
        error: "Access denied. Only authorized employees can reject expenses." 
      });
    }

    const role = String(employee.role_category);

    // Verify user has approval authority (can reject)
    const authorizedRoles = ["department_head", "general_manager", "managing_director", "chairman"];
    if (!authorizedRoles.includes(role)) {
      return res.status(403).json({ 
        error: "You do not have authority to reject expense requests" 
      });
    }

    // Call the reject RPC function
    const { data, error: rejectError } = await supabase.rpc("reject_expense_request" as any, {
      p_request_id: expense_request_id,
      p_rejector_id: userId,
      p_rejection_reason: rejection_reason.trim()
    });

    if (rejectError) {
      console.error("Error in reject_expense_request:", rejectError);
      return res.status(400).json({ 
        error: rejectError.message || "Failed to reject expense request" 
      });
    }

    // Parse the JSONB response
    const result = data as any;

    if (!result.success) {
      return res.status(400).json({ 
        error: result.message || "Rejection failed" 
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      expense_request: result.expense_request
    });

  } catch (error) {
    console.error("Error in expense rejection:", error);
    return res.status(500).json({ 
      error: "An unexpected error occurred" 
    });
  }
}

export default withAuth(handler);