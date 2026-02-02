import { supabase } from "@/integrations/supabase/client";

/**
 * PROMPT A5.7B: Employee Attendance Dashboard & Late Alerts
 * SCOPE: Visibility + Informational Alerts ONLY
 * NO penalties, NO enforcement, NO payroll impact
 */

export interface AttendanceSummary {
  date: string;
  total_employees: number;
  on_time: number;
  late: number;
  absent: number;
  excused: number;
  average_lateness_minutes: number;
}

export interface LateEmployee {
  employee_id: string;
  employee_name: string;
  role: string;
  department: string;
  expected_login_time: string;
  actual_login_time: string;
  lateness_minutes: number;
  logged_from_ip: string | null;
}

export interface AbsentEmployee {
  employee_id: string;
  employee_name: string;
  role: string;
  department: string;
  expected_login_time: string;
}

export interface AttendanceHistory {
  attendance_date: string;
  expected_login_time: string;
  actual_login_time: string | null;
  status: "on_time" | "late" | "absent" | "excused";
  lateness_minutes: number | null;
  manual_entry_reason: string | null;
}

/**
 * Get today's attendance summary
 * Role-based filtering:
 * - Department Head: Own department only
 * - GM/Chairman: All departments
 */
export async function getAttendanceSummary(
  date?: string,
  department?: string
): Promise<{ success: boolean; data?: AttendanceSummary; error?: string }> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase.rpc("get_attendance_summary", {
      p_date: date || new Date().toISOString().split("T")[0],
      p_department: department || null,
      p_admin_id: session.session.user.id
    });

    if (error) {
      console.error("Error fetching attendance summary:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as unknown as AttendanceSummary };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error in getAttendanceSummary:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Get list of late employees
 * Role-based filtering applied automatically
 */
export async function getLateEmployees(
  date?: string,
  department?: string
): Promise<{ success: boolean; data?: LateEmployee[]; error?: string }> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase.rpc("get_late_employees", {
      p_date: date || new Date().toISOString().split("T")[0],
      p_department: department || null,
      p_admin_id: session.session.user.id
    });

    if (error) {
      console.error("Error fetching late employees:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: (data as LateEmployee[]) || [] };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error in getLateEmployees:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Get list of absent employees
 * Role-based filtering applied automatically
 */
export async function getAbsentEmployees(
  date?: string,
  department?: string
): Promise<{ success: boolean; data?: AbsentEmployee[]; error?: string }> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase.rpc("get_absent_employees", {
      p_date: date || new Date().toISOString().split("T")[0],
      p_department: department || null,
      p_admin_id: session.session.user.id
    });

    if (error) {
      console.error("Error fetching absent employees:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: (data as AbsentEmployee[]) || [] };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error in getAbsentEmployees:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Get employee's personal attendance history
 * Employees can only view their own records
 * Admins can view any employee's records
 */
export async function getEmployeeAttendanceHistory(
  employeeId: string,
  startDate?: string,
  endDate?: string
): Promise<{ success: boolean; data?: AttendanceHistory[]; error?: string }> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      return { success: false, error: "Not authenticated" };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase.rpc("get_employee_attendance_history", {
      p_employee_id: employeeId,
      p_start_date: startDate || thirtyDaysAgo.toISOString().split("T")[0],
      p_end_date: endDate || new Date().toISOString().split("T")[0]
    });

    if (error) {
      console.error("Error fetching attendance history:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: (data as AttendanceHistory[]) || [] };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error in getEmployeeAttendanceHistory:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Get unique departments for filter dropdown
 */
export async function getDepartments(): Promise<{
  success: boolean;
  data?: string[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("employees")
      .select("department")
      .order("department");

    if (error) {
      console.error("Error fetching departments:", error);
      return { success: false, error: error.message };
    }

    const uniqueDepartments = [
      ...new Set(data.map((d) => d.department).filter(Boolean))
    ] as string[];

    return { success: true, data: uniqueDepartments };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error in getDepartments:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Record manual attendance entry
 * (From A5.7A - imported for dashboard use)
 */
export async function recordManualAttendance(
  employeeId: string,
  attendanceDate: string,
  actualLoginTime: string,
  reason: string
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      return { success: false, error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.rpc("record_manual_attendance" as any, {
      p_employee_id: employeeId,
      p_attendance_date: attendanceDate,
      p_actual_login_time: actualLoginTime,
      p_admin_id: session.session.user.id,
      p_reason: reason
    });

    if (error) {
      console.error("Error recording manual attendance:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error in recordManualAttendance:", err);
    return { success: false, error: err.message };
  }
}

/**
 * PROMPT A5.7D-1: Attendance Export Audit Logging
 * Log attendance data exports for audit trail
 * 
 * @param exportType - Format of export (csv or xlsx)
 * @param metadata - Export details (filters, count, etc.)
 * @returns Success status
 */
export async function logAttendanceExport(
  exportType: "csv" | "xlsx",
  metadata: {
    startDate?: string;
    endDate?: string;
    department?: string;
    role?: string;
    status?: string;
    exceptionApplied?: boolean;
    recordCount: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      return { success: false, error: "Not authenticated" };
    }

    // Get user's role from employees table
    const { data: employee } = await supabase
      .from("employees")
      .select("role_category")
      .eq("user_id", session.session.user.id)
      .single();

    const userRole = employee?.role_category || "unknown";

    // Prepare audit log entry
    const auditEntry = {
      action: "attendance_export",
      actor_id: session.session.user.id,
      details: {
        export_type: exportType.toUpperCase(),
        exported_by_role: userRole,
        applied_filters: {
          start_date: metadata.startDate,
          end_date: metadata.endDate,
          department: metadata.department,
          role: metadata.role,
          status: metadata.status,
          exception_applied: metadata.exceptionApplied
        },
        record_count: metadata.recordCount,
        export_timestamp: new Date().toISOString(),
        ip_address: null // Client IP not available in browser context
      },
      timestamp: new Date().toISOString()
    };

    // Insert audit log
    const { error: auditError } = await supabase
      .from("audit_logs")
      .insert(auditEntry);

    if (auditError) {
      console.error("Error logging attendance export:", auditError);
      return { success: false, error: auditError.message };
    }

    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error in logAttendanceExport:", err);
    return { success: false, error: err.message };
  }
}