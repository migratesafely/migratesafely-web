import { supabase } from "@/integrations/supabase/client";

export interface TierBonusApproval {
  id: string;
  memberId: string;
  memberEmail: string;
  memberFullName: string;
  tierId: string;
  tierName: string;
  tierLevel: number;
  bonusPercentage: number;
  baseReferralBonus: number;
  calculatedBonusAmount: number;
  currencyCode: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByEmail?: string;
  adminNotes?: string;
  rejectionReason?: string;
}

export interface MemberTierBonusHistory {
  id: string;
  tierName: string;
  tierLevel: number;
  bonusAmount: number;
  currencyCode: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  reviewedAt?: string;
}

export const tierBonusApprovalService = {
  /**
   * Request tier bonus approval when member achieves new tier
   * Called automatically by the tier upgrade system
   */
  async requestTierBonusApproval(
    memberId: string,
    tierId: string,
    baseReferralBonus: number,
    currencyCode: string
  ): Promise<{ success: boolean; approvalId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("request_tier_bonus_approval", {
        p_member_id: memberId,
        p_tier_id: tierId,
        p_base_referral_bonus_amount: baseReferralBonus,
        p_currency_code: currencyCode,
      });

      if (error) {
        console.error("Error requesting tier bonus approval:", error);
        return { success: false, error: error.message };
      }

      return { success: true, approvalId: data };
    } catch (error) {
      console.error("Error in requestTierBonusApproval:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  },

  /**
   * Get pending tier bonus approvals for admin review
   * Manager Admin, Super Admin: Can approve/reject
   * Worker Admin: View only
   */
  async getPendingApprovals(): Promise<TierBonusApproval[]> {
    try {
      const { data, error } = await supabase.rpc("get_pending_tier_bonus_approvals");

      if (error) {
        console.error("Error fetching pending approvals:", error);
        return [];
      }

      return (data || []).map((approval: any) => ({
        id: approval.approval_id,
        memberId: approval.member_id,
        memberEmail: approval.member_email,
        memberFullName: approval.member_full_name,
        tierId: approval.tier_id,
        tierName: approval.tier_name,
        tierLevel: approval.tier_level,
        bonusPercentage: approval.bonus_percentage,
        baseReferralBonus: approval.base_referral_bonus,
        calculatedBonusAmount: approval.calculated_bonus_amount,
        currencyCode: approval.currency_code,
        status: approval.status,
        requestedAt: approval.requested_at,
        reviewedAt: approval.reviewed_at,
        reviewedBy: approval.reviewed_by,
        reviewedByEmail: approval.reviewed_by_email,
        adminNotes: approval.admin_notes,
        rejectionReason: approval.rejection_reason,
      }));
    } catch (error) {
      console.error("Error in getPendingApprovals:", error);
      return [];
    }
  },

  /**
   * Approve tier bonus and credit to member wallet
   * Manager Admin or Super Admin only
   */
  async approveTierBonus(
    approvalId: string,
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("approve_tier_bonus", {
        p_approval_id: approvalId,
        p_admin_notes: adminNotes || null,
      });

      if (error) {
        console.error("Error approving tier bonus:", error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: "Approval failed - insufficient permissions or invalid request" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in approveTierBonus:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  },

  /**
   * Reject tier bonus request
   * Manager Admin or Super Admin only
   */
  async rejectTierBonus(
    approvalId: string,
    rejectionReason: string,
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("reject_tier_bonus", {
        p_approval_id: approvalId,
        p_rejection_reason: rejectionReason,
        p_admin_notes: adminNotes || null,
      });

      if (error) {
        console.error("Error rejecting tier bonus:", error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: "Rejection failed - insufficient permissions or invalid request" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in rejectTierBonus:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  },

  /**
   * Get member's tier bonus history (member view)
   * Member can only view their own history
   * NO internal admin details exposed
   */
  async getMemberTierBonusHistory(memberId: string): Promise<MemberTierBonusHistory[]> {
    try {
      const { data, error } = await supabase.rpc("get_member_tier_bonus_history", {
        p_member_id: memberId,
      });

      if (error) {
        console.error("Error fetching member tier bonus history:", error);
        return [];
      }

      return (data || []).map((item: any) => ({
        id: item.approval_id,
        tierName: item.tier_name,
        tierLevel: item.tier_level,
        bonusAmount: item.bonus_amount,
        currencyCode: item.currency_code,
        status: item.status,
        requestedAt: item.requested_at,
        reviewedAt: item.reviewed_at,
      }));
    } catch (error) {
      console.error("Error in getMemberTierBonusHistory:", error);
      return [];
    }
  },

  /**
   * Get audit log for tier bonus approvals (Admin only)
   * Immutable audit trail
   */
  async getTierBonusAuditLog(
    approvalId?: string
  ): Promise<any[]> {
    try {
      if (approvalId) {
        const { data, error } = await supabase
          .from("tier_bonus_audit_log")
          .select("*")
          .eq("tier_bonus_approval_id", approvalId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching audit log:", error);
          return [];
        }
        return data || [];
      }

      const { data, error } = await supabase
        .from("tier_bonus_audit_log")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching audit log:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getTierBonusAuditLog:", error);
      return [];
    }
  },
};