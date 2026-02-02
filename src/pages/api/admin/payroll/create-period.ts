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

    const { year, month } = req.body;

    if (!year || !month) {
      return res.status(400).json({ 
        error: "Missing required fields: year, month" 
      });
    }

    // Validate month
    if (month < 1 || month > 12) {
      return res.status(400).json({ 
        error: "Invalid month. Must be between 1 and 12." 
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
        error: "Access denied. Only HR staff can create payroll periods." 
      });
    }

    const dept = String(employee.department);
    const role = String(employee.role_category);

    // Check if user has HR authority
    const hasHRAuthority = 
      dept === "hr" ||
      ["chairman", "managing_director", "general_manager"].includes(role);

    if (!hasHRAuthority) {
      return res.status(403).json({ 
        error: "You do not have authority to create payroll periods." 
      });
    }

    // Check if period already exists
    const { data: existingPeriod, error: checkError } = await supabase
      .from("payroll_periods")
      .select("id, status")
      .eq("year", year)
      .eq("month", month)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing period:", checkError);
      return res.status(500).json({ 
        error: "Failed to check existing period" 
      });
    }

    if (existingPeriod) {
      return res.status(400).json({ 
        error: `Payroll period for ${year}-${String(month).padStart(2, "0")} already exists with status: ${existingPeriod.status}` 
      });
    }

    // Create month name
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const periodName = `${monthNames[month - 1]} ${year}`;

    // Create payroll period
    const { data: period, error: createError } = await supabase
      .from("payroll_periods")
      .insert({
        year,
        month,
        period_name: periodName,
        status: "draft"
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating period:", createError);
      return res.status(500).json({ 
        error: "Failed to create payroll period" 
      });
    }

    return res.status(200).json({
      success: true,
      message: `Payroll period created: ${periodName}`,
      period
    });

  } catch (error) {
    console.error("Error in create period:", error);
    return res.status(500).json({ 
      error: "An unexpected error occurred" 
    });
  }
}

export default withAuth(handler);