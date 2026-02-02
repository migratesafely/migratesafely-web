import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

/**
 * MASTER ADMIN READINESS SERVICE
 * 
 * Status: STRUCTURAL PREPARATION ONLY
 * - No UI exposure
 * - No role activation
 * - Bangladesh ONLY currently
 * 
 * Purpose: Prepare infrastructure for future Master Admin functionality
 * Future: Multi-country consolidated reporting and automated summaries
 */

type CountryFinancialSummary = Database["public"]["Tables"]["country_financial_summaries"]["Row"];
type ConsolidatedMasterSummary = Database["public"]["Tables"]["consolidated_master_summaries"]["Row"];

/**
 * Generate country-level financial summary for a closed period
 * Current: Bangladesh only
 * Future: Multiple countries
 */
export async function generateCountrySummary(
  year: number,
  month: number
): Promise<{ success: boolean; summary_id?: string; error?: string }> {
  try {
    // Call database function to auto-generate summary
    const { data, error } = await supabase.rpc("auto_generate_country_summary", {
      p_period_year: year,
      p_period_month: month,
    });

    if (error) {
      console.error("Error generating country summary:", error);
      return { success: false, error: error.message };
    }

    return { success: true, summary_id: data };
  } catch (error) {
    console.error("Generate country summary error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get all country summaries
 * Current: Returns Bangladesh only
 * Future: Filter by country, aggregate across countries
 */
export async function getCountrySummaries(): Promise<{
  summaries: CountryFinancialSummary[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("country_financial_summaries")
      .select("*")
      .order("period_year", { ascending: false })
      .order("period_month", { ascending: false });

    if (error) {
      console.error("Error fetching country summaries:", error);
      return { summaries: [], error: error.message };
    }

    return { summaries: data || [] };
  } catch (error) {
    console.error("Get country summaries error:", error);
    return { summaries: [], error: String(error) };
  }
}

/**
 * Get country summary for specific period
 * Current: Bangladesh only
 */
export async function getCountrySummaryForPeriod(
  countryCode: string,
  year: number,
  month: number
): Promise<{ summary: CountryFinancialSummary | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("country_financial_summaries")
      .select("*")
      .eq("country_code", countryCode)
      .eq("period_year", year)
      .eq("period_month", month)
      .single();

    if (error) {
      console.error("Error fetching country summary:", error);
      return { summary: null, error: error.message };
    }

    return { summary: data };
  } catch (error) {
    console.error("Get country summary error:", error);
    return { summary: null, error: String(error) };
  }
}

/**
 * Finalize country summary (lock it)
 * Current: Bangladesh only
 * Future: Trigger consolidated summary generation
 */
export async function finalizeCountrySummary(
  summaryId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("country_financial_summaries")
      .update({
        status: "finalized",
        finalized_at: new Date().toISOString(),
        finalized_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .eq("id", summaryId);

    if (error) {
      console.error("Error finalizing country summary:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Finalize country summary error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * FUTURE: Generate consolidated summary across all countries
 * Current: Not activated - Bangladesh only, no multi-country data
 * Future: Aggregate all country summaries for Master Admin view
 */
export async function generateConsolidatedSummary(
  year: number,
  month: number
): Promise<{ success: boolean; summary_id?: string; error?: string }> {
  try {
    // Get all finalized country summaries for this period
    const { data: countrySummaries, error: fetchError } = await supabase
      .from("country_financial_summaries")
      .select("*")
      .eq("period_year", year)
      .eq("period_month", month)
      .eq("status", "finalized");

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    if (!countrySummaries || countrySummaries.length === 0) {
      return { success: false, error: "No finalized country summaries found for this period" };
    }

    // Aggregate data across countries
    const consolidatedRevenue = countrySummaries.reduce(
      (acc, summary) => acc + Number(summary.total_revenue),
      0
    );
    const consolidatedExpenses = countrySummaries.reduce(
      (acc, summary) => acc + Number(summary.total_expenses),
      0
    );
    const consolidatedNetIncome = consolidatedRevenue - consolidatedExpenses;
    const consolidatedPrizePools = countrySummaries.reduce(
      (acc, summary) => acc + Number(summary.prize_pool_balance),
      0
    );
    const consolidatedMembers = countrySummaries.reduce(
      (acc, summary) => acc + summary.active_members_count,
      0
    );

    // Build country breakdown
    const countryBreakdown: Record<string, any> = {};
    countrySummaries.forEach((summary) => {
      countryBreakdown[summary.country_code] = {
        country_name: summary.country_name,
        total_revenue: summary.total_revenue,
        total_expenses: summary.total_expenses,
        net_income: summary.net_income,
        prize_pool_balance: summary.prize_pool_balance,
        active_members: summary.active_members_count,
        currency: summary.local_currency,
      };
    });

    // Calculate period dates
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);
    const periodName = periodStart.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    // Insert consolidated summary
    const { data: consolidatedSummary, error: insertError } = await supabase
      .from("consolidated_master_summaries")
      .insert({
        period_year: year,
        period_month: month,
        period_start_date: periodStart.toISOString().split("T")[0],
        period_end_date: periodEnd.toISOString().split("T")[0],
        period_name: periodName,
        countries_included: countrySummaries.map((s) => s.country_code),
        country_summaries: countryBreakdown,
        total_revenue_all_countries: consolidatedRevenue,
        total_expenses_all_countries: consolidatedExpenses,
        net_income_all_countries: consolidatedNetIncome,
        total_prize_pools_all_countries: consolidatedPrizePools,
        total_active_members_all_countries: consolidatedMembers,
        status: "draft",
        generated_at: new Date().toISOString(),
        generated_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true, summary_id: consolidatedSummary.id };
  } catch (error) {
    console.error("Generate consolidated summary error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * FUTURE: Get consolidated summaries for Master Admin
 * Current: Returns Bangladesh-only data
 * Future: Multi-country aggregated view
 */
export async function getConsolidatedSummaries(): Promise<{
  summaries: ConsolidatedMasterSummary[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("consolidated_master_summaries")
      .select("*")
      .order("period_year", { ascending: false })
      .order("period_month", { ascending: false });

    if (error) {
      console.error("Error fetching consolidated summaries:", error);
      return { summaries: [], error: error.message };
    }

    return { summaries: data || [] };
  } catch (error) {
    console.error("Get consolidated summaries error:", error);
    return { summaries: [], error: String(error) };
  }
}

/**
 * FUTURE: Queue automated monthly summary for Master Admin
 * Current: Not activated - no email automation
 * Future: Automatic email delivery on financial close
 */
export async function queueMasterAdminSummary(
  consolidatedSummaryId: string,
  recipientEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get consolidated summary details
    const { data: summary, error: fetchError } = await supabase
      .from("consolidated_master_summaries")
      .select("*")
      .eq("id", consolidatedSummaryId)
      .single();

    if (fetchError || !summary) {
      return { success: false, error: "Consolidated summary not found" };
    }

    // Calculate scheduled send date (1st of next month)
    const scheduledDate = new Date(summary.period_year, summary.period_month, 1);

    // Queue for delivery
    const { error: insertError } = await supabase
      .from("master_admin_summary_queue")
      .insert({
        consolidated_summary_id: consolidatedSummaryId,
        period_year: summary.period_year,
        period_month: summary.period_month,
        period_name: summary.period_name,
        recipient_email: recipientEmail,
        email_subject: `Monthly Financial Summary - ${summary.period_name}`,
        scheduled_send_date: scheduledDate.toISOString(),
        status: "pending",
      });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Queue master admin summary error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * FUTURE: Get data structure readiness status
 * Current: Returns Bangladesh-only status
 * Future: Multi-country expansion readiness check
 */
export async function getMasterAdminReadinessStatus(): Promise<{
  ready: boolean;
  current_countries: string[];
  pending_expansion: string[];
  infrastructure_status: {
    country_summaries_table: boolean;
    consolidated_summaries_table: boolean;
    summary_queue_table: boolean;
    auto_generation_function: boolean;
  };
  activation_status: {
    master_admin_role: boolean;
    email_automation: boolean;
    multi_country_support: boolean;
  };
}> {
  return {
    ready: true,
    current_countries: ["BD"], // Bangladesh only
    pending_expansion: [], // No expansion yet
    infrastructure_status: {
      country_summaries_table: true,
      consolidated_summaries_table: true,
      summary_queue_table: true,
      auto_generation_function: true,
    },
    activation_status: {
      master_admin_role: false, // NOT ACTIVATED
      email_automation: false, // NOT ACTIVATED
      multi_country_support: false, // NOT ACTIVATED
    },
  };
}

/**
 * INTEGRATION HOOK: Called after monthly close completion
 * Current: Auto-generates Bangladesh country summary
 * Future: Triggers consolidation and Master Admin notification
 */
export async function onMonthlyCloseComplete(
  year: number,
  month: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate country summary (Bangladesh only)
    const { success, error } = await generateCountrySummary(year, month);

    if (!success) {
      return { success: false, error };
    }

    // FUTURE: When multi-country is activated:
    // 1. Check if all countries have finalized summaries
    // 2. Generate consolidated summary
    // 3. Queue automated email to Master Admin

    return { success: true };
  } catch (error) {
    console.error("On monthly close complete error:", error);
    return { success: false, error: String(error) };
  }
}