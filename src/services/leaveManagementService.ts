import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type EmployeeLeave = Database["public"]["Tables"]["employee_leave_requests"]["Row"];
type HolidayBonusConfig = Database["public"]["Tables"]["holiday_bonus_config"]["Row"];
type EmergencyClosure = Database["public"]["Tables"]["emergency_closures"]["Row"];

/**
 * Leave Management Service
 * Handles employee leave, holidays, and Eid bonuses
 */

/**
 * Request employee leave
 */
export async function requestLeave(
  employeeId: string,
  leaveType: "annual" | "sick" | "emergency" | "unpaid",
  startDate: string,
  endDate: string,
  reason: string
) {
  try {
    // Calculate leave balance
    const currentYear = new Date().getFullYear();
    const { data: balance } = await supabase.rpc("calculate_leave_balance", {
      p_employee_id: employeeId,
      p_year: currentYear
    });

    const daysRequested = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    if (leaveType === "annual" && balance && daysRequested > (balance[0]?.remaining_annual || 0)) {
      return {
        success: false,
        error: `Insufficient leave balance.`
      };
    }

    const { data: leave, error } = await supabase
      .from("employee_leave_requests")
      .insert({
        employee_id: employeeId,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        total_days: daysRequested,
        reason,
        status: "pending"
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit trail
    await supabase.from("audit_logs").insert({
      action: "leave_requested",
      target_type: "employee_leave",
      target_id: leave.id,
      performed_by: employeeId,
      details: {
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        days_requested: daysRequested
      }
    });

    return {
      success: true,
      leave,
      days_requested: daysRequested
    };
  } catch (error: any) {
    console.error("Error requesting leave:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Approve or reject leave request
 */
export async function processLeaveRequest(
  leaveId: string,
  decision: "approved" | "rejected",
  approvedBy: string,
  notes?: string
) {
  try {
    const { data: leave, error } = await supabase
      .from("employee_leave_requests")
      .update({
        status: decision,
        approved_by_admin_id: approvedBy,
        approved_at: new Date().toISOString(),
        rejection_reason: decision === 'rejected' ? notes : null
      })
      .eq("id", leaveId)
      .select()
      .single();

    if (error) throw error;

    // Log audit trail
    await supabase.from("audit_logs").insert({
      action: `leave_${decision}`,
      target_type: "employee_leave",
      target_id: leaveId,
      performed_by: approvedBy,
      details: {
        decision,
        notes
      }
    });

    return {
      success: true,
      leave
    };
  } catch (error: any) {
    console.error("Error processing leave request:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get leave balance for employee
 */
export async function getLeaveBalance(employeeId: string, asOfDate?: string) {
  try {
    const year = asOfDate ? new Date(asOfDate).getFullYear() : new Date().getFullYear();
    const { data: balance, error } = await supabase.rpc("calculate_leave_balance", {
      p_employee_id: employeeId,
      p_year: year
    });

    if (error) throw error;

    // Handle single row return from RPC
    const balanceData = Array.isArray(balance) ? balance[0] : balance;

    return {
      success: true,
      balance: balanceData || {
        total_annual_days: 15,
        used_days: 0,
        available_days: 15
      }
    };
  } catch (error: any) {
    console.error("Error fetching leave balance:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get employee leave history
 */
export async function getEmployeeLeaves(employeeId: string, year?: number) {
  try {
    let query = supabase
      .from("employee_leave_requests")
      .select(`
        *,
        approver:employees!employee_leave_requests_approved_by_admin_id_fkey(
          full_name,
          employee_number,
          job_title
        )
      `)
      .eq("employee_id", employeeId)
      .order("start_date", { ascending: false });

    if (year) {
      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;
      query = query.gte("start_date", startOfYear).lte("start_date", endOfYear);
    }

    const { data: leaves, error } = await query;

    if (error) throw error;

    return {
      success: true,
      leaves: leaves || []
    };
  } catch (error: any) {
    console.error("Error fetching employee leaves:", error);
    return {
      success: false,
      error: error.message,
      leaves: []
    };
  }
}

/**
 * Configure Eid bonus (Chairman only)
 */
export async function configureEidBonus(
  year: number,
  eidType: "eid-ul-fitr" | "eid-ul-adha",
  bonusDate: string,
  bonusPercentage: number,
  configuredBy: string
) {
  try {
    // Validate configurer is Chairman
    const { data: chairman } = await supabase
      .from("employees")
      .select("role_category")
      .eq("id", configuredBy)
      .single();

    if (!chairman || chairman.role_category !== "chairman") {
      return {
        success: false,
        error: "Only Chairman can configure Eid bonuses"
      };
    }

    const { data: bonus, error } = await supabase
      .from("holiday_bonus_config")
      .insert({
        year,
        bonus_name: eidType,
        bonus_date: bonusDate,
        bonus_percentage: bonusPercentage,
        approved_by_admin_id: configuredBy
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit trail
    await supabase.from("audit_logs").insert({
      action: "eid_bonus_configured",
      target_type: "holiday_bonus",
      target_id: bonus.id,
      performed_by: configuredBy,
      details: {
        year,
        holiday_type: eidType,
        bonus_date: bonusDate,
        bonus_percentage: bonusPercentage
      }
    });

    return {
      success: true,
      bonus
    };
  } catch (error: any) {
    console.error("Error configuring Eid bonus:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get Eid bonus configuration for year
 */
export async function getEidBonusConfig(year: number) {
  try {
    const { data: bonuses, error } = await supabase
      .from("holiday_bonus_config")
      .select(`
        *,
        configurer:employees!holiday_bonus_config_configured_by_fkey(
          full_name,
          employee_number
        )
      `)
      .eq("year", year)
      .order("bonus_date", { ascending: true });

    if (error) throw error;

    return {
      success: true,
      bonuses: bonuses || []
    };
  } catch (error: any) {
    console.error("Error fetching Eid bonus config:", error);
    return {
      success: false,
      error: error.message,
      bonuses: []
    };
  }
}

/**
 * Declare emergency closure (Chairman or MD only)
 */
export async function declareEmergencyClosure(
  closureDate: string,
  closureType: "emergency" | "strike" | "force_majeure",
  reason: string,
  declaredBy: string
) {
  try {
    // Validate declarer authority
    const { data: declarer } = await supabase
      .from("employees")
      .select("role_category")
      .eq("id", declaredBy)
      .single();

    if (!declarer || !["chairman", "managing_director"].includes(declarer.role_category)) {
      return {
        success: false,
        error: "Only Chairman or Managing Director can declare emergency closures"
      };
    }

    const { data: closure, error } = await supabase
      .from("emergency_closures")
      .insert({
        closure_date: closureDate,
        closure_type: closureType,
        reason,
        declared_by_admin_id: declaredBy
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit trail
    await supabase.from("audit_logs").insert({
      action: "emergency_closure_declared",
      target_type: "emergency_closure",
      target_id: closure.id,
      performed_by: declaredBy,
      details: {
        closure_date: closureDate,
        closure_type: closureType,
        reason
      }
    });

    return {
      success: true,
      closure
    };
  } catch (error: any) {
    console.error("Error declaring emergency closure:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get emergency closures for date range
 */
export async function getEmergencyClosures(startDate: string, endDate: string) {
  try {
    const { data: closures, error } = await supabase
      .from("emergency_closures")
      .select(`
        *,
        declarer:employees!emergency_closures_declared_by_admin_id_fkey(
          full_name,
          employee_number,
          job_title
        )
      `)
      .gte("closure_date", startDate)
      .lte("closure_date", endDate)
      .order("closure_date", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      closures: closures || []
    };
  } catch (error: any) {
    console.error("Error fetching emergency closures:", error);
    return {
      success: false,
      error: error.message,
      closures: []
    };
  }
}