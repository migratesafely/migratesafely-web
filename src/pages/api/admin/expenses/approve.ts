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

    const { expense_request_id, approval_level } = req.body;

    if (!expense_request_id || !approval_level) {
      return res.status(400).json({ 
        error: "Missing required fields: expense_request_id, approval_level" 
      });
    }

    // Validate approval level
    const validLevels = ["dept_head", "gm", "md", "chairman"];
    if (!validLevels.includes(approval_level)) {
      return res.status(400).json({ 
        error: "Invalid approval level. Must be: dept_head, gm, md, or chairman" 
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
        error: "Access denied. Only authorized employees can approve expenses." 
      });
    }

    const role = String(employee.role_category);

    // Verify user has authority for this approval level
    const roleMapping: Record<string, string[]> = {
      dept_head: ["department_head"],
      gm: ["general_manager"],
      md: ["managing_director"],
      chairman: ["chairman"]
    };

    if (!roleMapping[approval_level]?.includes(role)) {
      return res.status(403).json({ 
        error: `You do not have authority to approve at the ${approval_level} level` 
      });
    }

    // Call the appropriate RPC function
    const functionName = `approve_expense_${approval_level}`;
    
    const { data, error: approveError } = await supabase.rpc(functionName as any, {
      p_request_id: expense_request_id,
      p_approver_id: userId
    });

    if (approveError) {
      console.error(`Error in ${functionName}:`, approveError);
      return res.status(400).json({ 
        error: approveError.message || `Failed to approve expense at ${approval_level} level` 
      });
    }

    // Parse the JSONB response
    const result = data as any;

    if (!result.success) {
      return res.status(400).json({ 
        error: result.message || "Approval failed" 
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      expense_request: result.expense_request
    });

  } catch (error) {
    console.error("Error in expense approval:", error);
    return res.status(500).json({ 
      error: "An unexpected error occurred" 
    });
  }
}

export default withAuth(handler);