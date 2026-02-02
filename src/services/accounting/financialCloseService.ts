import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type MonthlyClosePeriod = Database["public"]["Tables"]["monthly_close_periods"]["Row"];
type MonthlyFinancialReport = Database["public"]["Tables"]["monthly_financial_reports"]["Row"];

export interface ClosePeriodParams {
  year: number;
  month: number;
  adminId: string;
}

export interface LockPeriodParams {
  year: number;
  month: number;
  adminId: string;
}

export interface UnlockPeriodParams {
  year: number;
  month: number;
  adminId: string;
  reason: string;
}

export interface ProfitLossReport {
  period_start: string;
  period_end: string;
  currency: string;
  total_revenue: number;
  total_expenses: number;
  net_income: number;
  revenue_details: Array<{
    account_code: string;
    account_name: string;
    amount: number;
  }>;
  expenses: Array<{
    account_code: string;
    account_name: string;
    amount: number;
  }>;
  generated_at: string;
}

export interface PrizePoolReconciliationReport {
  period_start: string;
  period_end: string;
  currency: string;
  opening_balance: number;
  contributions: number;
  disbursements: number;
  closing_balance: number;
  reconciliation_check: "BALANCED" | "UNBALANCED";
  generated_at: string;
}

export interface PayoutsReport {
  period_start: string;
  period_end: string;
  currency: string;
  payouts: Array<{
    user_id: string;
    payout_count: number;
    total_amount: number;
  }>;
  total_payouts: number;
  total_count: number;
  generated_at: string;
}

/**
 * Close an accounting period and generate all reports
 */
export async function closeAccountingPeriod(params: ClosePeriodParams) {
  try {
    const { data, error } = await supabase.rpc("close_accounting_period", {
      p_year: params.year,
      p_month: params.month,
      p_admin_id: params.adminId,
    });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("Error closing accounting period:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Lock a closed period to prevent retroactive edits
 */
export async function lockAccountingPeriod(params: LockPeriodParams) {
  try {
    const { data, error } = await supabase.rpc("lock_accounting_period", {
      p_year: params.year,
      p_month: params.month,
      p_admin_id: params.adminId,
    });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("Error locking accounting period:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Unlock a locked period (requires reason, Super Admin only)
 */
export async function unlockAccountingPeriod(params: UnlockPeriodParams) {
  try {
    const { error } = await supabase
      .from("monthly_close_periods")
      .update({
        status: "open",
        unlock_reason: params.reason,
        unlocked_at: new Date().toISOString(),
        unlocked_by: params.adminId,
        updated_at: new Date().toISOString(),
      })
      .eq("period_year", params.year)
      .eq("period_month", params.month)
      .eq("status", "locked");

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error unlocking accounting period:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get all financial close periods
 */
export async function getFinancialClosePeriods() {
  try {
    const { data, error } = await supabase
      .from("monthly_close_periods")
      .select("*")
      .order("period_year", { ascending: false })
      .order("period_month", { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching close periods:", error);
    return { data: null, error: String(error) };
  }
}

/**
 * Get financial close summary (includes report counts)
 */
export async function getFinancialCloseSummary() {
  try {
    const { data, error } = await supabase
      .from("financial_close_summary" as any)
      .select("*");

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching close summary:", error);
    return { data: null, error: String(error) };
  }
}

/**
 * Get reports for a specific period
 */
export async function getReportsForPeriod(periodId: string) {
  try {
    const { data, error } = await supabase
      .from("monthly_financial_reports")
      .select("*")
      .eq("close_period_id", periodId);

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching reports:", error);
    return { data: null, error: String(error) };
  }
}

/**
 * Get a specific report by type
 */
export async function getReportByType(
  periodId: string,
  reportType: "profit_loss" | "prize_pool_reconciliation" | "referral_payouts" | "tier_payouts"
) {
  try {
    const { data, error } = await supabase
      .from("monthly_financial_reports")
      .select("*")
      .eq("close_period_id", periodId)
      .eq("report_type", reportType)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching report:", error);
    return { data: null, error: String(error) };
  }
}

/**
 * Check if a period is locked
 */
export async function isPeriodLocked(year: number, month: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("monthly_close_periods")
      .select("status")
      .eq("period_year", year)
      .eq("period_month", month)
      .single();

    if (error) return false;

    return data?.status === "locked";
  } catch (error) {
    console.error("Error checking period lock:", error);
    return false;
  }
}

/**
 * Get current open period (current month if not closed)
 */
export async function getCurrentOpenPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  try {
    const { data, error } = await supabase
      .from("monthly_close_periods")
      .select("*")
      .eq("period_year", year)
      .eq("period_month", month)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching current period:", error);
    return { data: null, error: String(error) };
  }
}

/**
 * Export report to CSV format
 */
export function exportReportToCSV(
  reportData: ProfitLossReport | PrizePoolReconciliationReport | PayoutsReport,
  reportType: string
): string {
  let csv = "";

  if (reportType === "profit_loss") {
    const report = reportData as ProfitLossReport;
    csv += "Profit & Loss Statement\n";
    csv += `Period: ${report.period_start} to ${report.period_end}\n`;
    csv += `Currency: ${report.currency}\n\n`;
    csv += "REVENUE\n";
    csv += "Account Code,Account Name,Amount\n";
    report.revenue_details?.forEach((item) => {
      csv += `${item.account_code},${item.account_name},${item.amount}\n`;
    });
    csv += `\nTotal Revenue:,${report.total_revenue}\n\n`;
    csv += "EXPENSES\n";
    csv += "Account Code,Account Name,Amount\n";
    report.expenses?.forEach((item) => {
      csv += `${item.account_code},${item.account_name},${item.amount}\n`;
    });
    csv += `\nTotal Expenses:,${report.total_expenses}\n\n`;
    csv += `NET INCOME:,${report.net_income}\n`;
  } else if (reportType === "prize_pool_reconciliation") {
    const report = reportData as PrizePoolReconciliationReport;
    csv += "Prize Draw Pool Reconciliation\n";
    csv += `Period: ${report.period_start} to ${report.period_end}\n`;
    csv += `Currency: ${report.currency}\n\n`;
    csv += "Description,Amount\n";
    csv += `Opening Balance,${report.opening_balance}\n`;
    csv += `Contributions (30% of fees),${report.contributions}\n`;
    csv += `Disbursements (prizes + support),${report.disbursements}\n`;
    csv += `Closing Balance,${report.closing_balance}\n`;
    csv += `\nReconciliation Status:,${report.reconciliation_check}\n`;
  } else if (reportType === "referral_payouts" || reportType === "tier_payouts") {
    const report = reportData as PayoutsReport;
    csv += `${reportType === "referral_payouts" ? "Referral" : "Tier"} Payouts Report\n`;
    csv += `Period: ${report.period_start} to ${report.period_end}\n`;
    csv += `Currency: ${report.currency}\n\n`;
    csv += "User ID,Payout Count,Total Amount\n";
    report.payouts?.forEach((item) => {
      csv += `${item.user_id},${item.payout_count},${item.total_amount}\n`;
    });
    csv += `\nTotal Payouts:,${report.total_payouts}\n`;
    csv += `Total Count:,${report.total_count}\n`;
  }

  return csv;
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}