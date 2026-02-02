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

    const { payroll_period_id, approval_level } = req.body;

    if (!payroll_period_id || !approval_level) {
      return res.status(400).json({ 
        error: "Missing required fields: payroll_period_id, approval_level" 
      });
    }

    // Get user's employee record to verify authority
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, department, role_category")
      .eq("user_id", userId)
      .single();

    if (employeeError || !employee) {
      return res.status(403).json({ 
        error: "Access denied. Only authorized staff can approve payroll." 
      });
    }

    const role = String(employee.role_category);

    // Verify approval authority based on level
    let hasAuthority = false;
    let newStatus = "";

    if (approval_level === "gm") {
      hasAuthority = ["general_manager", "managing_director", "chairman"].includes(role);
      newStatus = "gm_approved";
    } else if (approval_level === "md") {
      hasAuthority = ["managing_director", "chairman"].includes(role);
      newStatus = "md_approved";
    } else if (approval_level === "chairman") {
      hasAuthority = role === "chairman";
      newStatus = "approved";
    } else {
      return res.status(400).json({ 
        error: "Invalid approval_level. Must be: gm, md, or chairman" 
      });
    }

    if (!hasAuthority) {
      return res.status(403).json({ 
        error: `You do not have ${approval_level.toUpperCase()} approval authority.` 
      });
    }

    // Verify period exists and is in correct status
    const { data: period, error: periodError } = await supabase
      .from("payroll_periods")
      .select("*")
      .eq("id", payroll_period_id)
      .single();

    if (periodError || !period) {
      return res.status(404).json({ 
        error: "Payroll period not found" 
      });
    }

    // Check status flow
    const validTransitions: Record<string, string[]> = {
      "submitted": ["gm_approved"],
      "gm_approved": ["md_approved"],
      "md_approved": ["approved"]
    };

    // Chairman can override at any stage
    if (role === "chairman") {
      if (period.status === "locked") {
        return res.status(400).json({ 
          error: "Cannot modify locked payroll period" 
        });
      }
    } else {
      const allowedNextStatuses = validTransitions[period.status] || [];
      if (!allowedNextStatuses.includes(newStatus)) {
        return res.status(400).json({ 
          error: `Invalid status transition. Current: ${period.status}, Requested: ${newStatus}` 
        });
      }
    }

    // Update period status
    const { data: updatedPeriod, error: updateError } = await supabase
      .from("payroll_periods")
      .update({ 
        status: newStatus,
        approved_by: userId,
        approved_at: new Date().toISOString()
      })
      .eq("id", payroll_period_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating period:", updateError);
      return res.status(500).json({ 
        error: "Failed to approve payroll period" 
      });
    }

    // Create audit log
    const auditEntry = {
      table_name: "payroll_periods",
      record_id: payroll_period_id,
      action: `approve_${approval_level}`,
      actor_id: userId,
      changes: { 
        status: `${period.status} → ${newStatus}`,
        approved_by: userId,
        approval_level
      }
    };

    const { error: auditError } = await supabase
      .from("audit_logs")
      .insert(auditEntry);

    if (auditError) {
      console.error("Error creating audit log:", auditError);
    }

    return res.status(200).json({
      success: true,
      message: `Payroll approved by ${approval_level.toUpperCase()}: ${period.period_name}`,
      period: updatedPeriod
    });

  } catch (error) {
    console.error("Error in approve period:", error);
    return res.status(500).json({ 
      error: "An unexpected error occurred" 
    });
  }
}

export default withAuth(handler);