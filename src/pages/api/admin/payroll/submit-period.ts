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

    // Get user's employee record to verify HR authority
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, department, role_category")
      .eq("user_id", userId)
      .single();

    if (employeeError || !employee) {
      return res.status(403).json({ 
        error: "Access denied. Only HR staff can submit payroll." 
      });
    }

    const dept = String(employee.department);
    const role = String(employee.role_category);

    const hasHRAuthority = 
      dept === "hr" ||
      ["chairman", "managing_director", "general_manager"].includes(role);

    if (!hasHRAuthority) {
      return res.status(403).json({ 
        error: "You do not have authority to submit payroll." 
      });
    }

    // Verify period exists and is in draft status
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

    if (period.status !== "draft") {
      return res.status(400).json({ 
        error: `Cannot submit. Period status is: ${period.status}. Only draft periods can be submitted.` 
      });
    }

    // Verify runs exist for this period
    const { data: runs, error: runsError } = await (supabase
      .from("payroll_run_snapshots") as any)
      .select("id")
      .eq("payroll_period_id", payroll_period_id);

    if (runsError) {
      console.error("Error checking runs:", runsError);
      return res.status(500).json({ 
        error: "Failed to check payroll runs" 
      });
    }

    if (!runs || runs.length === 0) {
      return res.status(400).json({ 
        error: "No payroll runs found. Generate runs before submitting." 
      });
    }

    // Update period status to submitted
    const { data: updatedPeriod, error: updateError } = await supabase
      .from("payroll_periods")
      .update({ status: "submitted" })
      .eq("id", payroll_period_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating period:", updateError);
      return res.status(500).json({ 
        error: "Failed to submit payroll period" 
      });
    }

    // Create audit log
    const auditEntry = {
      table_name: "payroll_periods",
      record_id: payroll_period_id,
      action: "submit",
      actor_id: userId,
      changes: { status: "draft → submitted" }
    };

    const { error: auditError } = await supabase
      .from("audit_logs")
      .insert(auditEntry);

    if (auditError) {
      console.error("Error creating audit log:", auditError);
      // Don't fail the submission if audit log fails
    }

    return res.status(200).json({
      success: true,
      message: `Payroll submitted for approval: ${period.period_name}`,
      period: updatedPeriod
    });

  } catch (error) {
    console.error("Error in submit period:", error);
    return res.status(500).json({ 
      error: "An unexpected error occurred" 
    });
  }
}

export default withAuth(handler);