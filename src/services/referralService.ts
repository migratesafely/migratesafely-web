import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Referral = Database["public"]["Tables"]["referrals"]["Row"];
type ReferralInsert = Database["public"]["Tables"]["referrals"]["Insert"];
type Membership = Database["public"]["Tables"]["memberships"]["Row"];
type MembershipConfig = Database["public"]["Tables"]["membership_config"]["Row"];

/**
 * REFERRAL SERVICE - APPLICATION LAYER LOGIC
 * No database triggers - all logic handled in TypeScript
 */

export const referralService = {
  /**
   * Validate if a referral code exists and belongs to an active member
   */
  async validateReferralCode(referralCode: string): Promise<{
    isValid: boolean;
    referrerId: string | null;
    message: string;
  }> {
    try {
      // Check if referral code exists
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, referral_code, role, is_verified")
        .eq("referral_code", referralCode)
        .single();

      if (error || !profile) {
        return {
          isValid: false,
          referrerId: null,
          message: "Invalid referral code",
        };
      }

      // Check if referrer is a verified member
      if (profile.role !== "member" || !profile.is_verified) {
        return {
          isValid: false,
          referrerId: null,
          message: "Referral code belongs to an inactive or unverified member",
        };
      }

      return {
        isValid: true,
        referrerId: profile.id,
        message: "Valid referral code",
      };
    } catch (error) {
      console.error("Error validating referral code:", error);
      return {
        isValid: false,
        referrerId: null,
        message: "Error validating referral code",
      };
    }
  },

  /**
   * Create a referral record when a new user signs up with a referral code
   * Called during user registration - before payment
   */
  async createReferralRecord(
    referredUserId: string,
    referralCode: string
  ): Promise<{
    success: boolean;
    referralId: string | null;
    message: string;
  }> {
    try {
      // Validate referral code first
      const validation = await this.validateReferralCode(referralCode);
      if (!validation.isValid || !validation.referrerId) {
        return {
          success: false,
          referralId: null,
          message: validation.message,
        };
      }

      // Get user's country code from profile
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("country_code")
        .eq("id", referredUserId)
        .single();

      if (profileError) {
        return {
          success: false,
          referralId: null,
          message: "Could not fetch user profile",
        };
      }

      const userCountryCode = userProfile?.country_code || null;

      // Try country-specific config first, then fallback to global
      let config: MembershipConfig | null = null;

      if (userCountryCode) {
        // Try country-specific config
        const { data: countryConfig, error: countryError } = await supabase
          .from("membership_config")
          .select("referral_bonus_amount, referral_bonus_currency")
          .eq("country_code", userCountryCode)
          .order("effective_from", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!countryError && countryConfig) {
          config = countryConfig as MembershipConfig;
        }
      }

      // Fallback to global config if no country-specific config found
      if (!config) {
        const { data: globalConfig, error: globalError } = await supabase
          .from("membership_config")
          .select("referral_bonus_amount, referral_bonus_currency")
          .is("country_code", null)
          .order("effective_from", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (globalError || !globalConfig) {
          return {
            success: false,
            referralId: null,
            message: "Could not fetch referral bonus configuration",
          };
        }

        config = globalConfig as MembershipConfig;
      }

      // Create referral record (bonus not paid yet)
      const referralData: ReferralInsert = {
        referrer_id: validation.referrerId,
        referred_user_id: referredUserId,
        referral_code: referralCode,
        bonus_amount: config.referral_bonus_amount,
        bonus_currency: config.referral_bonus_currency,
        is_paid: false,
        membership_id: null, // Will be updated when membership is created
      };

      const { data: referral, error: insertError } = await supabase
        .from("referrals")
        .insert(referralData)
        .select()
        .single();

      if (insertError || !referral) {
        return {
          success: false,
          referralId: null,
          message: "Failed to create referral record",
        };
      }

      // Update referred user's profile with referral code
      await supabase
        .from("profiles")
        .update({ referred_by_code: referralCode })
        .eq("id", referredUserId);

      return {
        success: true,
        referralId: referral.id,
        message: "Referral recorded successfully",
      };
    } catch (error) {
      console.error("Error creating referral record:", error);
      return {
        success: false,
        referralId: null,
        message: "Error creating referral record",
      };
    }
  },

  /**
   * Process referral bonus AFTER payment is confirmed AND admin approves
   * This is the critical MVP function - call this when membership becomes active
   */
  async processReferralBonus(membershipId: string): Promise<{
    success: boolean;
    bonusPaid: boolean;
    message: string;
  }> {
    try {
      // Get membership details
      const { data: membership, error: membershipError } = await supabase
        .from("memberships")
        .select("id, user_id, status")
        .eq("id", membershipId)
        .single();

      if (membershipError || !membership) {
        return {
          success: false,
          bonusPaid: false,
          message: "Membership not found",
        };
      }

      // Only process if membership is active
      if (membership.status !== "active") {
        return {
          success: false,
          bonusPaid: false,
          message: "Membership is not active yet",
        };
      }

      // Find referral record for this user
      const { data: referral, error: referralError } = await supabase
        .from("referrals")
        .select("*")
        .eq("referred_user_id", membership.user_id)
        .eq("is_paid", false)
        .single();

      // No referral found - this is fine (user didn't use a referral code)
      if (referralError || !referral) {
        return {
          success: true,
          bonusPaid: false,
          message: "No referral bonus to process",
        };
      }

      // Update referral record with membership_id and mark as paid
      const { error: updateReferralError } = await supabase
        .from("referrals")
        .update({
          membership_id: membershipId,
          is_paid: true,
        })
        .eq("id", referral.id);

      if (updateReferralError) {
        return {
          success: false,
          bonusPaid: false,
          message: "Failed to update referral record",
        };
      }

      // Add bonus to referrer's wallet
      const walletResult = await this.addBonusToWallet(
        referral.referrer_id,
        referral.bonus_amount,
        referral.bonus_currency
      );

      if (!walletResult.success) {
        return {
          success: false,
          bonusPaid: false,
          message: walletResult.message,
        };
      }

      return {
        success: true,
        bonusPaid: true,
        message: `Referral bonus of ${referral.bonus_amount} ${referral.bonus_currency} credited to referrer's wallet`,
      };
    } catch (error) {
      console.error("Error processing referral bonus:", error);
      return {
        success: false,
        bonusPaid: false,
        message: "Error processing referral bonus",
      };
    }
  },

  /**
   * Add referral bonus to wallet
   * Creates wallet if it doesn't exist
   */
  async addBonusToWallet(
    userId: string,
    amount: number,
    currency: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Check if wallet exists
      const { data: existingWallet, error: walletCheckError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (walletCheckError && walletCheckError.code !== "PGRST116") {
        // PGRST116 = no rows returned (wallet doesn't exist)
        return {
          success: false,
          message: "Error checking wallet",
        };
      }

      if (existingWallet) {
        // Update existing wallet
        const newBalance = Number(existingWallet.balance) + Number(amount);
        const newTotalEarned = Number(existingWallet.total_earned) + Number(amount);

        const { error: updateError } = await supabase
          .from("wallets")
          .update({
            balance: newBalance,
            total_earned: newTotalEarned,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (updateError) {
          return {
            success: false,
            message: "Failed to update wallet balance",
          };
        }
      } else {
        // Create new wallet
        const { error: createError } = await supabase.from("wallets").insert({
          user_id: userId,
          balance: amount,
          currency: currency,
          total_earned: amount,
          total_withdrawn: 0,
        });

        if (createError) {
          return {
            success: false,
            message: "Failed to create wallet",
          };
        }
      }

      return {
        success: true,
        message: "Bonus added to wallet successfully",
      };
    } catch (error) {
      console.error("Error adding bonus to wallet:", error);
      return {
        success: false,
        message: "Error adding bonus to wallet",
      };
    }
  },

  /**
   * Get referral statistics for a user
   */
  async getReferralStats(userId: string): Promise<{
    success: boolean;
    stats: {
      totalReferrals: number;
      paidReferrals: number;
      pendingReferrals: number;
      totalEarned: number;
      currency: string;
    } | null;
    message: string;
  }> {
    try {
      // Get all referrals for this user
      const { data: referrals, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", userId);

      if (error) {
        return {
          success: false,
          stats: null,
          message: "Error fetching referral statistics",
        };
      }

      const totalReferrals = referrals?.length || 0;
      const paidReferrals = referrals?.filter((r) => r.is_paid).length || 0;
      const pendingReferrals = totalReferrals - paidReferrals;
      const totalEarned = referrals
        ?.filter((r) => r.is_paid)
        .reduce((sum, r) => sum + Number(r.bonus_amount), 0) || 0;
      const currency = referrals?.[0]?.bonus_currency || "BDT";

      return {
        success: true,
        stats: {
          totalReferrals,
          paidReferrals,
          pendingReferrals,
          totalEarned,
          currency,
        },
        message: "Referral stats retrieved successfully",
      };
    } catch (error) {
      console.error("Error getting referral stats:", error);
      return {
        success: false,
        stats: null,
        message: "Error getting referral stats",
      };
    }
  },

  /**
   * Get referral code for a user
   */
  async getUserReferralCode(userId: string): Promise<{
    success: boolean;
    referralCode: string | null;
    message: string;
  }> {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", userId)
        .single();

      if (error || !profile) {
        return {
          success: false,
          referralCode: null,
          message: "Could not fetch referral code",
        };
      }

      return {
        success: true,
        referralCode: profile.referral_code,
        message: "Referral code retrieved successfully",
      };
    } catch (error) {
      console.error("Error getting referral code:", error);
      return {
        success: false,
        referralCode: null,
        message: "Error getting referral code",
      };
    }
  },
};