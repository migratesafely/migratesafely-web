import { supabase } from "@/integrations/supabase/client";

export interface TierAchievementBonusConfig {
  tierId: string;
  tierName: string;
  tierLevel: number;
  requiredReferrals: number;
  bonusPercentage: number;
  achievementBonusAmount: number;
  requiresEnhancedKyc: boolean;
  isActive: boolean;
  updatedAt: string;
}

export interface TierAchievementBonusAuditLog {
  auditId: string;
  tierName: string;
  changedById: string;
  changedByEmail: string;
  changedByName: string;
  oldBonusAmount: number;
  newBonusAmount: number;
  changeReason?: string;
  createdAt: string;
}

export const tierAchievementConfigService = {
  /**
   * Get tier achievement bonus configuration (All Admins)
   */
  async getTierAchievementBonusConfig(): Promise<TierAchievementBonusConfig[]> {
    try {
      const { data, error } = await supabase.rpc("get_tier_achievement_bonus_config");

      if (error) {
        console.error("Error fetching tier achievement bonus config:", error);
        return [];
      }

      return (data || []).map((config: any) => ({
        tierId: config.tier_id,
        tierName: config.tier_name,
        tierLevel: config.tier_level,
        requiredReferrals: config.required_referrals,
        bonusPercentage: config.bonus_percentage,
        achievementBonusAmount: config.achievement_bonus_amount || 0,
        requiresEnhancedKyc: config.requires_enhanced_kyc,
        isActive: config.is_active,
        updatedAt: config.updated_at,
      }));
    } catch (error) {
      console.error("Error in getTierAchievementBonusConfig:", error);
      return [];
    }
  },

  /**
   * Update tier achievement bonus amount (Super Admin only)
   */
  async updateTierAchievementBonusAmount(
    tierId: string,
    newBonusAmount: number,
    changeReason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("update_tier_achievement_bonus_amount", {
        p_tier_id: tierId,
        p_new_bonus_amount: newBonusAmount,
        p_change_reason: changeReason || null,
      });

      if (error) {
        console.error("Error updating tier achievement bonus amount:", error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: "Update failed - insufficient permissions or invalid request" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in updateTierAchievementBonusAmount:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  },

  /**
   * Get tier achievement bonus audit log (All Admins)
   */
  async getTierAchievementBonusAuditLog(tierId?: string): Promise<TierAchievementBonusAuditLog[]> {
    try {
      const { data, error } = await supabase.rpc("get_tier_achievement_bonus_audit_log", {
        p_tier_id: tierId || null,
      });

      if (error) {
        console.error("Error fetching tier achievement bonus audit log:", error);
        return [];
      }

      return (data || []).map((log: any) => ({
        auditId: log.audit_id,
        tierName: log.tier_name,
        changedById: log.changed_by_id,
        changedByEmail: log.changed_by_email,
        changedByName: log.changed_by_name,
        oldBonusAmount: log.old_bonus_amount,
        newBonusAmount: log.new_bonus_amount,
        changeReason: log.change_reason,
        createdAt: log.created_at,
      }));
    } catch (error) {
      console.error("Error in getTierAchievementBonusAuditLog:", error);
      return [];
    }
  },
};