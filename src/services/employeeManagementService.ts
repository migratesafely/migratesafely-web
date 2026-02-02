import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Employee = Database["public"]["Tables"]["employees"]["Row"];
type EmployeeInsert = Database["public"]["Tables"]["employees"]["Insert"];
type EmployeeUpdate = Database["public"]["Tables"]["employees"]["Update"];
type EmployeeLeave = Database["public"]["Tables"]["employee_leave_requests"]["Row"];
type EmployeeContract = Database["public"]["Tables"]["employee_contracts"]["Row"];

/**
 * Employee Management Service
 * Handles employee records, hierarchy, and governance
 */

/**
 * Create new employee record
 */
export async function createEmployee(employeeData: {
  full_name: string;
  job_title: string;
  department: string;
  employment_type: "full_time" | "contract" | "support";
  start_date: string;
  probation_end_date?: string;
  notice_period_days?: number;
  monthly_salary_gross: number;
  reports_to_employee_id?: string;
  created_by_admin: string;
  contract_type?: "permanent" | "fixed_term" | "probation";
  probation_status?: "active" | "passed" | "failed" | "not_applicable";
}) {
  try {
    // Generate employee number
    const { data: lastEmployee } = await supabase
      .from("employees")
      .select("employee_number")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let employeeNumber = "EMP-BD-000001";
    if (lastEmployee?.employee_number) {
      const lastNumber = parseInt(lastEmployee.employee_number.split("-")[2]);
      const newNumber = (lastNumber + 1).toString().padStart(6, "0");
      employeeNumber = `EMP-BD-${newNumber}`;
    }

    // Map job title keywords to category for initial setup
    // This logic should ideally be user-selectable, but for now we infer or default to 'staff'
    const titleLower = employeeData.job_title.toLowerCase();
    let roleCategory: "chairman" | "managing_director" | "general_manager" | "department_head" | "hr_manager" | "staff" | "support_staff" = "staff";

    if (titleLower.includes("chairman")) roleCategory = "chairman";
    else if (titleLower.includes("managing director") || titleLower.includes("md")) roleCategory = "managing_director";
    else if (titleLower.includes("general manager") || titleLower.includes("gm")) roleCategory = "general_manager";
    else if (titleLower.includes("head of") || titleLower.includes("director")) roleCategory = "department_head";
    else if (titleLower.includes("hr manager")) roleCategory = "hr_manager";
    else if (titleLower.includes("guard") || titleLower.includes("cleaner") || titleLower.includes("driver")) roleCategory = "support_staff";

    const { data: employee, error } = await supabase
      .from("employees")
      .insert({
        full_name: employeeData.full_name,
        job_title: employeeData.job_title, // Flexible free-text
        role_category: roleCategory, // Inferred for permissions
        department: employeeData.department as any,
        employment_type: employeeData.employment_type as any,
        start_date: employeeData.start_date,
        probation_end_date: employeeData.probation_end_date,
        notice_period_days: employeeData.notice_period_days,
        monthly_salary_gross: employeeData.monthly_salary_gross,
        reports_to_employee_id: employeeData.reports_to_employee_id,
        created_by_admin_id: employeeData.created_by_admin,
        employee_number: employeeNumber,
        salary_currency: "BDT",
        status: "active",
        contract_type: employeeData.contract_type || "permanent",
        probation_status: employeeData.probation_status || "not_applicable",
        employment_start_date: employeeData.start_date
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit trail
    await supabase.from("audit_logs").insert({
      action: "employee_created",
      target_type: "employee",
      target_id: employee.id,
      performed_by: employeeData.created_by_admin,
      details: {
        employee_number: employeeNumber,
        full_name: employeeData.full_name,
        job_title: employeeData.job_title,
        role_category: roleCategory,
        department: employeeData.department
      }
    });

    return {
      success: true,
      employee,
      employee_number: employeeNumber
    };
  } catch (error: any) {
    console.error("Error creating employee:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get employee by ID
 */
export async function getEmployee(employeeId: string) {
  try {
    const { data: employee, error } = await supabase
      .from("employees")
      .select(`
        *,
        manager:employees!employees_reports_to_employee_id_fkey(
          id,
          full_name,
          employee_number,
          job_title
        )
      `)
      .eq("id", employeeId)
      .single();

    if (error) throw error;

    return {
      success: true,
      employee
    };
  } catch (error: any) {
    console.error("Error fetching employee:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get all employees with filters
 */
export async function getEmployees(filters?: {
  status?: string;
  department?: string;
  employment_type?: string;
  search?: string;
}) {
  try {
    let query = supabase
      .from("employees")
      .select(`
        *,
        manager:employees!employees_reports_to_employee_id_fkey(
          id,
          full_name,
          employee_number,
          job_title
        )
      `)
      .order("created_at", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status as any);
    }

    if (filters?.department) {
      query = query.eq("department", filters.department as any);
    }

    if (filters?.employment_type) {
      query = query.eq("employment_type", filters.employment_type as any);
    }

    if (filters?.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,employee_number.ilike.%${filters.search}%`);
    }

    const { data: employees, error } = await query;

    if (error) throw error;

    return {
      success: true,
      employees: employees || []
    };
  } catch (error: any) {
    console.error("Error fetching employees:", error);
    return {
      success: false,
      error: error.message,
      employees: []
    };
  }
}

/**
 * Update employee record
 */
export async function updateEmployee(
  employeeId: string,
  updates: EmployeeUpdate,
  adminId: string
) {
  try {
    const { data: employee, error } = await supabase
      .from("employees")
      .update(updates)
      .eq("id", employeeId)
      .select()
      .single();

    if (error) throw error;

    // Log audit trail
    await supabase.from("audit_logs").insert({
      action: "employee_updated",
      target_type: "employee",
      target_id: employeeId,
      performed_by: adminId,
      details: updates
    });

    return {
      success: true,
      employee
    };
  } catch (error: any) {
    console.error("Error updating employee:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update employee salary
 */
export async function updateEmployeeSalary(
  employeeId: string,
  newSalary: number,
  effectiveFrom: string,
  approvedBy: string,
  reason?: string
) {
  try {
    // Record salary change
    const { data: salaryRecord, error: salaryError } = await supabase
      .from("employee_salaries")
      .insert({
        employee_id: employeeId,
        monthly_gross_salary: newSalary,
        currency: "BDT",
        effective_date: effectiveFrom,
        approved_by_admin_id: approvedBy,
        change_reason: reason
      })
      .select()
      .single();

    if (salaryError) throw salaryError;

    // Update employee record
    const { error: updateError } = await supabase
      .from("employees")
      .update({ monthly_salary_gross: newSalary })
      .eq("id", employeeId);

    if (updateError) throw updateError;

    // Log audit trail
    await supabase.from("audit_logs").insert({
      action: "employee_salary_updated",
      target_type: "employee",
      target_id: employeeId,
      performed_by: approvedBy,
      details: {
        new_salary: newSalary,
        effective_from: effectiveFrom,
        reason
      }
    });

    return {
      success: true,
      salary_record: salaryRecord
    };
  } catch (error: any) {
    console.error("Error updating employee salary:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process employee resignation
 */
export async function processResignation(
  employeeId: string,
  resignationDate: string,
  lastWorkingDate: string,
  reason: string,
  processedBy: string
) {
  try {
    // Create resignation record
    const { data: resignation, error: resignationError } = await supabase
      .from("employee_resignations")
      .insert({
        employee_id: employeeId,
        resignation_date: resignationDate,
        last_working_day: lastWorkingDate,
        reason,
        notice_period_days: 30 // Default, should be dynamic
      })
      .select()
      .single();

    if (resignationError) throw resignationError;

    // Update employee status
    const { error: updateError } = await supabase
      .from("employees")
      .update({ status: "resigned" })
      .eq("id", employeeId);

    if (updateError) throw updateError;

    // Log audit trail
    await supabase.from("audit_logs").insert({
      action: "employee_resignation",
      target_type: "employee",
      target_id: employeeId,
      performed_by: processedBy,
      details: {
        resignation_date: resignationDate,
        last_working_date: lastWorkingDate,
        reason
      }
    });

    return {
      success: true,
      resignation
    };
  } catch (error: any) {
    console.error("Error processing resignation:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process employee termination
 */
export async function processTermination(
  employeeId: string,
  terminationType: "redundancy" | "negligence" | "fraud" | "misconduct" | "awol",
  terminationDate: string,
  reason: string,
  approvedBy: string,
  immediateTermination: boolean = false
) {
  try {
    // Validate approval authority
    const { data: approver } = await supabase
      .from("employees")
      .select("role_category")
      .eq("id", approvedBy)
      .single();

    if (!approver || !["chairman", "managing_director"].includes(approver.role_category)) {
      return {
        success: false,
        error: "Only Chairman or Managing Director can approve terminations"
      };
    }

    // Create termination record
    const { data: termination, error: terminationError } = await supabase
      .from("employee_terminations")
      .insert({
        employee_id: employeeId,
        termination_type: terminationType,
        termination_date: terminationDate,
        effective_date: terminationDate,
        reason,
        approved_by_admin_id: approvedBy,
        requires_immediate_effect: immediateTermination,
        eligible_for_redundancy_pay: !["fraud", "misconduct", "negligence", "awol"].includes(terminationType)
      })
      .select()
      .single();

    if (terminationError) throw terminationError;

    // Update employee status
    const { error: updateError } = await supabase
      .from("employees")
      .update({ status: "terminated" })
      .eq("id", employeeId);

    if (updateError) throw updateError;

    // Log audit trail
    await supabase.from("audit_logs").insert({
      action: "employee_terminated",
      target_type: "employee",
      target_id: employeeId,
      performed_by: approvedBy,
      details: {
        termination_type: terminationType,
        termination_date: terminationDate,
        immediate: immediateTermination,
        reason
      }
    });

    return {
      success: true,
      termination
    };
  } catch (error: any) {
    console.error("Error processing termination:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Submit termination appeal
 */
export async function submitTerminationAppeal(
  terminationId: string,
  appealReason: string,
  employeeId: string
) {
  try {
    // Check if appeal already exists
    const { data: existingAppeal } = await supabase
      .from("termination_appeals")
      .select("id")
      .eq("termination_id", terminationId)
      .single();

    if (existingAppeal) {
      return {
        success: false,
        error: "Appeal already submitted"
      };
    }

    const { data: appeal, error } = await supabase
      .from("termination_appeals")
      .insert({
        termination_id: terminationId,
        employee_id: employeeId,
        appeal_reason: appealReason,
        status: "pending"
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit trail
    await supabase.from("audit_logs").insert({
      action: "termination_appeal_submitted",
      target_type: "employee_termination",
      target_id: terminationId,
      performed_by: employeeId,
      details: {
        appeal_reason: appealReason
      }
    });

    return {
      success: true,
      appeal
    };
  } catch (error: any) {
    console.error("Error submitting appeal:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process termination appeal decision
 */
export async function processAppealDecision(
  appealId: string,
  decision: "approved" | "rejected",
  reviewedBy: string,
  reviewNotes: string
) {
  try {
    // Validate reviewer authority
    const { data: reviewer } = await supabase
      .from("employees")
      .select("role_category")
      .eq("id", reviewedBy)
      .single();

    if (!reviewer || !["chairman", "managing_director"].includes(reviewer.role_category)) {
      return {
        success: false,
        error: "Only Chairman or Managing Director can review appeals"
      };
    }

    const { data: appeal, error } = await supabase
      .from("termination_appeals")
      .update({
        status: decision,
        reviewed_by_admin_id: reviewedBy,
        reviewed_at: new Date().toISOString(),
        decision: decision,
        decision_notes: reviewNotes
      })
      .eq("id", appealId)
      .select()
      .single();

    if (error) throw error;

    // If appeal approved, reactivate employee
    if (decision === "approved") {
      await supabase
        .from("employees")
        .update({ status: "active" })
        .eq("id", appeal.employee_id);
    }

    // Log audit trail
    await supabase.from("audit_logs").insert({
      action: "termination_appeal_reviewed",
      target_type: "employee_termination",
      target_id: appeal.termination_id,
      performed_by: reviewedBy,
      details: {
        decision,
        review_notes: reviewNotes
      }
    });

    return {
      success: true,
      appeal
    };
  } catch (error: any) {
    console.error("Error processing appeal decision:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get employee hierarchy (reporting structure)
 */
export async function getEmployeeHierarchy(employeeId?: string) {
  try {
    const { data, error } = await supabase.rpc("get_employee_hierarchy", {
      p_employee_id: employeeId || null
    });

    if (error) throw error;

    return {
      success: true,
      hierarchy: data
    };
  } catch (error: any) {
    console.error("Error fetching employee hierarchy:", error);
    return {
      success: false,
      error: error.message,
      hierarchy: []
    };
  }
}

/**
 * Check approval authority for action
 */
export async function checkApprovalAuthority(
  approverId: string,
  actionType: string,
  amount?: number
) {
  try {
    const { data: approver, error } = await supabase
      .from("employees")
      .select("role_category")
      .eq("id", approverId)
      .single();

    if (error) throw error;

    // Chairman can approve everything
    if (approver.role_category === "chairman") {
      return {
        success: true,
        can_approve: true,
        approver_role: "Chairman"
      };
    }

    // MD can approve most things except Chairman-level thresholds
    if (approver.role_category === "managing_director") {
      if (amount && amount > 50000) {
        return {
          success: true,
          can_approve: false,
          reason: "Amount exceeds MD approval threshold (50,000 BDT)",
          requires: "Chairman"
        };
      }
      return {
        success: true,
        can_approve: true,
        approver_role: "Managing Director"
      };
    }

    // Other roles have limited approval authority
    return {
      success: true,
      can_approve: false,
      reason: "Insufficient approval authority",
      requires: "Managing Director or Chairman"
    };
  } catch (error: any) {
    console.error("Error checking approval authority:", error);
    return {
      success: false,
      error: error.message,
      can_approve: false
    };
  }
}