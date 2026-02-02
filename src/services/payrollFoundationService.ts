import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PayrollRun = Database["public"]["Tables"]["payroll_runs"]["Row"];
type PayrollItem = Database["public"]["Tables"]["payroll_items"]["Row"];

/**
 * Payroll Foundation Service
 * Handles payroll structure and salary-in-hand calculations
 * NOTE: Payroll execution is NOT in scope for A4.1
 */

/**
 * Calculate net salary after deductions
 */
export function calculateNetSalary(grossSalary: number, deductions?: {
  tax?: number;
  providentFund?: number;
  other?: number;
}) {
  const totalDeductions = (deductions?.tax || 0) + 
                         (deductions?.providentFund || 0) + 
                         (deductions?.other || 0);
  
  return {
    gross_salary: grossSalary,
    total_deductions: totalDeductions,
    net_salary: grossSalary - totalDeductions
  };
}

/**
 * Calculate salary-in-hand deduction (first month retention spread over 6 months)
 */
export function calculateSalaryInHandDeduction(grossSalary: number, monthNumber: number) {
  if (monthNumber === 1) {
    // First month: full salary retained
    return {
      month: monthNumber,
      gross_salary: grossSalary,
      retention_amount: grossSalary,
      monthly_deduction: 0,
      net_payable: 0,
      note: "First month salary retained (salary-in-hand policy)"
    };
  } else if (monthNumber >= 2 && monthNumber <= 7) {
    // Months 2-7: deduct 1/6 of first month salary
    const monthlyDeduction = grossSalary / 6;
    return {
      month: monthNumber,
      gross_salary: grossSalary,
      retention_amount: 0,
      monthly_deduction: monthlyDeduction,
      net_payable: grossSalary - monthlyDeduction,
      note: `Month ${monthNumber}: Deducting ${(1/6 * 100).toFixed(2)}% of first month salary`
    };
  } else {
    // Month 8+: no deduction
    return {
      month: monthNumber,
      gross_salary: grossSalary,
      retention_amount: 0,
      monthly_deduction: 0,
      net_payable: grossSalary,
      note: "Regular salary payment (retention period complete)"
    };
  }
}

/**
 * Get employee salary history
 */
export async function getEmployeeSalaryHistory(employeeId: string) {
  try {
    const { data: salaries, error } = await supabase
      .from("employee_salaries")
      .select(`
        *,
        approver:employees!employee_salaries_approved_by_fkey(
          full_name,
          employee_number,
          role_title
        )
      `)
      .eq("employee_id", employeeId)
      .order("effective_from", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      salaries: salaries || []
    };
  } catch (error: any) {
    console.error("Error fetching salary history:", error);
    return {
      success: false,
      error: error.message,
      salaries: []
    };
  }
}

/**
 * Get current salary for employee
 */
export async function getCurrentSalary(employeeId: string) {
  try {
    const { data: employee, error } = await supabase
      .from("employees")
      .select("monthly_salary_gross, salary_currency")
      .eq("id", employeeId)
      .single();

    if (error) throw error;

    return {
      success: true,
      salary: {
        gross_salary: employee.monthly_salary_gross,
        currency: employee.salary_currency
      }
    };
  } catch (error: any) {
    console.error("Error fetching current salary:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Calculate Eid bonus amount (50% of net salary)
 */
export function calculateEidBonus(
  grossSalary: number,
  taxAmount: number = 0,
  bonusPercentage: number = 50
) {
  const netSalary = grossSalary - taxAmount;
  const bonusAmount = (netSalary * bonusPercentage) / 100;

  return {
    gross_salary: grossSalary,
    tax_deducted: taxAmount,
    net_salary: netSalary,
    bonus_percentage: bonusPercentage,
    bonus_amount: bonusAmount
  };
}

/**
 * Preview payroll for employee (foundation only)
 */
export async function previewEmployeePayroll(
  employeeId: string,
  payrollMonth: string,
  employmentMonthNumber: number
) {
  try {
    // Get employee current salary
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("monthly_salary_gross, start_date")
      .eq("id", employeeId)
      .single();

    if (empError) throw empError;

    // Calculate salary-in-hand deduction
    const salaryInHand = calculateSalaryInHandDeduction(
      employee.monthly_salary_gross,
      employmentMonthNumber
    );

    // Calculate net salary (placeholder for tax - actual tax calculation out of scope)
    const estimatedTax = employee.monthly_salary_gross * 0.05; // 5% placeholder
    const netCalculation = calculateNetSalary(employee.monthly_salary_gross, {
      tax: estimatedTax
    });

    return {
      success: true,
      preview: {
        employee_id: employeeId,
        payroll_month: payrollMonth,
        employment_month: employmentMonthNumber,
        gross_salary: employee.monthly_salary_gross,
        salary_in_hand_deduction: salaryInHand.monthly_deduction,
        estimated_tax: estimatedTax,
        net_salary: netCalculation.net_salary - salaryInHand.monthly_deduction,
        salary_in_hand_note: salaryInHand.note
      }
    };
  } catch (error: any) {
    console.error("Error previewing payroll:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get payroll runs (foundation - execution not in scope)
 */
export async function getPayrollRuns(filters?: {
  status?: string;
  year?: number;
  month?: number;
}) {
  try {
    let query = supabase
      .from("payroll_runs")
      .select(`
        *,
        created_by_employee:employees!payroll_runs_created_by_fkey(
          full_name,
          employee_number,
          role_title
        ),
        approved_by_employee:employees!payroll_runs_approved_by_fkey(
          full_name,
          employee_number,
          role_title
        )
      `)
      .order("payroll_month", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status as any);
    }

    const { data: runs, error } = await query;

    if (error) throw error;

    return {
      success: true,
      runs: runs || []
    };
  } catch (error: any) {
    console.error("Error fetching payroll runs:", error);
    return {
      success: false,
      error: error.message,
      runs: []
    };
  }
}