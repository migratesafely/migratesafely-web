import { supabase } from "@/integrations/supabase/client";

export interface TierAchievementBonus {
  id: string;
  memberId: string;
  memberEmail: string;
  memberFullName: string;
  tierId: string;
  tierName: string;
  tierLevel: number;
  bonusAmount: number;
  currencyCode: string;
  requiresEnhancedKyc: boolean;
  status: "pending" | "approved" | "rejected" | "paid";
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByEmail?: string;
  adminNotes?: string;
  rejectionReason?: string;
}

export interface MemberAchievementHistory {
  id: string;
  tierName: string;
  tierLevel: number;
  bonusAmount: number;
  currencyCode: string;
  status: "pending" | "approved" | "rejected" | "paid";
  requestedAt: string;
  reviewedAt?: string;
}

export const tierAchievementBonusService = {
  /**
   * Request tier achievement bonus approval (triggered on tier upgrade)
   */
  async requestTierAchievementBonus(
    memberId: string,
    tierId: string
  ): Promise<{ success: boolean; approvalId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("request_tier_achievement_bonus_approval", {
        p_member_id: memberId,
        p_tier_id: tierId,
      });

      if (error) {
        console.error("Error requesting tier achievement bonus:", error);
        return { success: false, error: error.message };
      }

      return { success: true, approvalId: data };
    } catch (error) {
      console.error("Error in requestTierAchievementBonus:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  },

  /**
   * Get pending tier achievement bonus approvals (Admin)
   * Bronze/Silver/Gold: Manager Admin or Super Admin
   * Platinum: Super Admin only
   */
  async getPendingApprovals(): Promise<TierAchievementBonus[]> {
    try {
      const { data, error } = await supabase.rpc("get_pending_tier_achievement_approvals");

      if (error) {
        console.error("Error fetching pending achievement approvals:", error);
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
        bonusAmount: approval.bonus_amount,
        currencyCode: approval.currency_code,
        requiresEnhancedKyc: approval.requires_enhanced_kyc,
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
   * Approve tier achievement bonus and credit to wallet
   * Bronze/Silver/Gold: Manager Admin or Super Admin
   * Platinum: Super Admin only (enforced by database)
   */
  async approveAchievementBonus(
    approvalId: string,
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("approve_tier_achievement_bonus", {
        p_approval_id: approvalId,
        p_admin_notes: adminNotes || null,
      });

      if (error) {
        console.error("Error approving tier achievement bonus:", error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: "Approval failed - insufficient permissions or invalid request" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in approveAchievementBonus:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  },

  /**
   * Reject tier achievement bonus
   * Manager Admin or Super Admin
   */
  async rejectAchievementBonus(
    approvalId: string,
    rejectionReason: string,
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("reject_tier_achievement_bonus", {
        p_approval_id: approvalId,
        p_rejection_reason: rejectionReason,
        p_admin_notes: adminNotes || null,
      });

      if (error) {
        console.error("Error rejecting tier achievement bonus:", error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: "Rejection failed - insufficient permissions or invalid request" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in rejectAchievementBonus:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  },

  /**
   * Get member's tier achievement bonus history
   * Member can only view their own history
   * NO internal admin details exposed
   */
  async getMemberAchievementHistory(memberId: string): Promise<MemberAchievementHistory[]> {
    try {
      const { data, error } = await supabase.rpc("get_member_tier_achievement_history", {
        p_member_id: memberId,
      });

      if (error) {
        console.error("Error fetching member achievement history:", error);
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
      console.error("Error in getMemberAchievementHistory:", error);
      return [];
    }
  },
};