import { supabase } from "@/integrations/supabase/client";

export interface TierOverviewReport {
  tierName: string;
  tierLevel: number;
  totalMembers: number;
  upgradedThisMonth: number;
  pendingApprovals: number;
  requiredReferrals: number;
  bonusPercentage: number;
}

export interface TierBonusFinancialSummary {
  month: string;
  countryCode: string;
  tierName: string;
  pendingApprovalAmount: number;
  approvedUnpaidAmount: number;
  paidAmount: number;
  currencyCode: string;
  count: number;
}

export interface ReferralBonusSummary {
  month: string;
  totalBonusPaid: number;
  totalReferrals: number;
  currencyCode: string;
}

export interface TopReferrer {
  memberIdAnonymized: string;
  totalSuccessfulReferrals: number;
  totalEarned: number;
  currencyCode: string;
}

export const adminReportingService = {
  /**
   * Get tier overview report (Super Admin, Manager Admin only)
   */
  async getTierOverviewReport(): Promise<TierOverviewReport[]> {
    try {
      const { data, error } = await supabase.rpc("get_tier_overview_report" as any);

      if (error) {
        console.error("Error fetching tier overview report:", error);
        return [];
      }

      return (data || []).map((item: any) => ({
        tierName: item.tier_name,
        tierLevel: item.tier_level,
        totalMembers: item.total_members,
        upgradedThisMonth: item.upgraded_this_month,
        pendingApprovals: item.pending_approvals,
        requiredReferrals: item.required_referrals,
        bonusPercentage: item.bonus_percentage,
      }));
    } catch (error) {
      console.error("Error in getTierOverviewReport:", error);
      return [];
    }
  },

  /**
   * Get tier bonus financial summary (Super Admin, Manager Admin only)
   */
  async getTierBonusFinancialSummary(
    startDate?: string,
    endDate?: string,
    countryCode?: string
  ): Promise<TierBonusFinancialSummary[]> {
    try {
      const { data, error } = await supabase.rpc("get_tier_bonus_financial_summary" as any, {
        p_start_date: startDate || null,
        p_end_date: endDate || null,
        p_country_code: countryCode || null,
      });

      if (error) {
        console.error("Error fetching tier bonus financial summary:", error);
        return [];
      }

      return (data || []).map((item: any) => ({
        month: item.month,
        countryCode: item.country_code,
        tierName: item.tier_name,
        pendingApprovalAmount: item.pending_approval_amount,
        approvedUnpaidAmount: item.approved_unpaid_amount,
        paidAmount: item.paid_amount,
        currencyCode: item.currency_code,
        count: item.count,
      }));
    } catch (error) {
      console.error("Error in getTierBonusFinancialSummary:", error);
      return [];
    }
  },

  /**
   * Get referral bonus summary (Super Admin, Manager Admin only)
   */
  async getReferralBonusSummary(
    startDate?: string,
    endDate?: string
  ): Promise<ReferralBonusSummary[]> {
    try {
      const { data, error } = await supabase.rpc("get_referral_bonus_summary" as any, {
        p_start_date: startDate || null,
        p_end_date: endDate || null,
      });

      if (error) {
        console.error("Error fetching referral bonus summary:", error);
        return [];
      }

      return (data || []).map((item: any) => ({
        month: item.month,
        totalBonusPaid: item.total_bonus_paid,
        totalReferrals: item.total_referrals,
        currencyCode: item.currency_code,
      }));
    } catch (error) {
      console.error("Error in getReferralBonusSummary:", error);
      return [];
    }
  },

  /**
   * Get top referrers (Super Admin, Manager Admin only)
   * Member IDs are anonymized for privacy
   */
  async getTopReferrers(limit: number = 10): Promise<TopReferrer[]> {
    try {
      const { data, error } = await supabase.rpc("get_top_referrers" as any, {
        p_limit: limit,
      });

      if (error) {
        console.error("Error fetching top referrers:", error);
        return [];
      }

      return (data || []).map((item: any) => ({
        memberIdAnonymized: item.member_id_anonymized,
        totalSuccessfulReferrals: item.total_successful_referrals,
        totalEarned: item.total_earned,
        currencyCode: item.currency_code,
      }));
    } catch (error) {
      console.error("Error in getTopReferrers:", error);
      return [];
    }
  },

  /**
   * Log report access (audit trail)
   */
  async logReportAccess(reportType: string, action: "viewed" | "exported"): Promise<void> {
    try {
      await supabase.rpc("log_report_access" as any, {
        p_report_type: reportType,
        p_action: action,
      });
    } catch (error) {
      console.error("Error logging report access:", error);
    }
  },

  /**
   * Export report to CSV format
   */
  exportToCSV(data: any[], filename: string): void {
    if (data.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => JSON.stringify(row[header] || "")).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};