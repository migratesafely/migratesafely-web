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

    const { payroll_period_id } = req.body;

    if (!payroll_period_id) {
      return res.status(400).json({ 
        error: "Missing required field: payroll_period_id" 
      });
    }

    // Get user's employee record to verify Chairman authority
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, department, role_category")
      .eq("user_id", userId)
      .single();

    if (employeeError || !employee) {
      return res.status(403).json({ 
        error: "Access denied. Only Chairman can lock payroll periods." 
      });
    }

    const role = String(employee.role_category);

    if (role !== "chairman") {
      return res.status(403).json({ 
        error: "Only Chairman can lock payroll periods." 
      });
    }

    // Verify period exists and is approved
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

    if (period.status !== "approved") {
      return res.status(400).json({ 
        error: `Cannot lock. Period must be approved first. Current status: ${period.status}` 
      });
    }

    // Lock period
    const { data: updatedPeriod, error: updateError } = await supabase
      .from("payroll_periods")
      .update({ status: "locked" })
      .eq("id", payroll_period_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error locking period:", updateError);
      return res.status(500).json({ 
        error: "Failed to lock payroll period" 
      });
    }

    // Update all payroll runs to approved status
    const { error: runsError } = await (supabase
      .from("payroll_run_snapshots") as any)
      .update({ status: "approved" })
      .eq("payroll_period_id", payroll_period_id)
      .eq("status", "pending");

    if (runsError) {
      console.error("Error updating runs:", runsError);
      return res.status(500).json({ 
        error: "Failed to update payroll runs status" 
      });
    }

    // Create audit log
    const auditEntry = {
      table_name: "payroll_periods",
      record_id: payroll_period_id,
      action: "lock",
      actor_id: userId,
      changes: { 
        status: "approved → locked",
        locked_by: "chairman"
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
      message: `Payroll period locked: ${period.period_name}. Payroll is now immutable.`,
      period: updatedPeriod
    });

  } catch (error) {
    console.error("Error in lock period:", error);
    return res.status(500).json({ 
      error: "An unexpected error occurred" 
    });
  }
}

export default withAuth(handler);