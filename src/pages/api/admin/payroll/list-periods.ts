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

    // Get user's employee record to verify authority
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, department, role_category")
      .eq("user_id", userId)
      .single();

    if (employeeError || !employee) {
      return res.status(403).json({ 
        error: "Access denied. Only authorized staff can view payroll periods." 
      });
    }

    const dept = String(employee.department);
    const role = String(employee.role_category);

    // Check if user has payroll viewing authority
    const hasAuthority = 
      dept === "hr" ||
      dept === "accounts" ||
      ["chairman", "managing_director", "general_manager"].includes(role);

    if (!hasAuthority) {
      return res.status(403).json({ 
        error: "You do not have authority to view payroll periods." 
      });
    }

    // Fetch payroll periods with run counts
    const { data: periods, error: periodsError } = await supabase
      .from("payroll_periods")
      .select(`
        *,
        approver:profiles!payroll_periods_approved_by_fkey(full_name, email)
      `)
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (periodsError) {
      console.error("Error fetching periods:", periodsError);
      return res.status(500).json({ 
        error: "Failed to fetch payroll periods" 
      });
    }

    // Get run counts for each period
    const periodsWithCounts = await Promise.all(
      (periods || []).map(async (period: any) => {
        const { count, error: countError } = await (supabase
          .from("payroll_run_snapshots") as any)
          .select("*", { count: "exact", head: true })
          .eq("payroll_period_id", period.id);

        return {
          ...period,
          run_count: countError ? 0 : (count || 0)
        };
      })
    );

    return res.status(200).json({
      success: true,
      periods: periodsWithCounts,
      userRole: role,
      userDepartment: dept
    });

  } catch (error) {
    console.error("Error in list periods:", error);
    return res.status(500).json({ 
      error: "An unexpected error occurred" 
    });
  }
}

export default withAuth(handler);