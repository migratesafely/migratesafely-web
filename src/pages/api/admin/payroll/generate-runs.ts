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
        error: "Access denied. Only HR staff can generate payroll runs." 
      });
    }

    const dept = String(employee.department);
    const role = String(employee.role_category);

    const hasHRAuthority = 
      dept === "hr" ||
      ["chairman", "managing_director", "general_manager"].includes(role);

    if (!hasHRAuthority) {
      return res.status(403).json({ 
        error: "You do not have authority to generate payroll runs." 
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
        error: `Cannot generate runs. Period status is: ${period.status}. Only draft periods can have runs generated.` 
      });
    }

    // Check if runs already exist for this period
    const { data: existingRuns, error: existingError } = await supabase
      .from("payroll_run_snapshots")
      .select("id")
      .eq("payroll_period_id", payroll_period_id)
      .limit(1);

    if (existingError) {
      console.error("Error checking existing runs:", existingError);
      return res.status(500).json({ 
        error: "Failed to check existing runs" 
      });
    }

    if (existingRuns && existingRuns.length > 0) {
      return res.status(400).json({ 
        error: "Payroll runs already generated for this period" 
      });
    }

    // Get all active employees with payroll profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("employee_payroll_profiles")
      .select(`
        *,
        employee:employees!employee_payroll_profiles_employee_id_fkey(
          id,
          user_id,
          department,
          role_category,
          profile:profiles!employees_user_id_fkey(
            full_name,
            email
          )
        )
      `)
      .eq("status", "active");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return res.status(500).json({ 
        error: "Failed to fetch employee profiles" 
      });
    }

    if (!profiles || profiles.length === 0) {
      return res.status(400).json({ 
        error: "No active employees with payroll profiles found" 
      });
    }

    // Generate payroll snapshots for each employee
    // Using 'any' cast to avoid TS issues with dynamic table
    const payrollRuns = profiles.map((profile: any) => ({
      payroll_period_id,
      employee_id: profile.employee_id,
      gross_salary: profile.basic_salary_bdt,
      deductions_total: 0, // Placeholder for future tax/deductions
      net_pay: profile.basic_salary_bdt,
      status: "pending"
    }));

    const { data: createdRuns, error: createError } = await (supabase
      .from("payroll_run_snapshots") as any)
      .insert(payrollRuns)
      .select();

    if (createError) {
      console.error("Error creating runs:", createError);
      return res.status(500).json({ 
        error: "Failed to create payroll runs" 
      });
    }

    return res.status(200).json({
      success: true,
      message: `Generated ${createdRuns.length} payroll runs for ${period.period_name}`,
      runs: createdRuns
    });

  } catch (error) {
    console.error("Error in generate runs:", error);
    return res.status(500).json({ 
      error: "An unexpected error occurred" 
    });
  }
}

export default withAuth(handler);