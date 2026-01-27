import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { referralService } from "./referralService";

type Membership = Database["public"]["Tables"]["memberships"]["Row"];
type MembershipInsert = Database["public"]["Tables"]["memberships"]["Insert"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];

/**
 * MEMBERSHIP SERVICE - APPLICATION LAYER LOGIC
 * Handles membership creation and activation
 * Integrates with referral system
 */

export const membershipService = {
  /**
   * Create a new membership for a user
   * Called during registration after payment initiation
   */
  async createMembership(
    userId: string,
    membershipNumber: number,
    feeAmount: number,
    feeCurrency: string
  ): Promise<{
    success: boolean;
    membershipId: string | null;
    message: string;
  }> {
    try {
      const membershipData: MembershipInsert = {
        user_id: userId,
        membership_number: membershipNumber,
        status: "pending_payment",
        fee_amount: feeAmount,
        fee_currency: feeCurrency,
        is_renewal: false,
      };

      const { data: membership, error } = await supabase
        .from("memberships")
        .insert(membershipData)
        .select()
        .single();

      if (error || !membership) {
        return {
          success: false,
          membershipId: null,
          message: "Failed to create membership",
        };
      }

      return {
        success: true,
        membershipId: membership.id,
        message: "Membership created successfully",
      };
    } catch (error) {
      console.error("Error creating membership:", error);
      return {
        success: false,
        membershipId: null,
        message: "Error creating membership",
      };
    }
  },

  /**
   * Activate membership after payment confirmation
   * This is the critical function that triggers referral bonus
   */
  async activateMembership(
    membershipId: string,
    adminId: string
  ): Promise<{
    success: boolean;
    referralBonusPaid: boolean;
    message: string;
  }> {
    try {
      // Calculate start and end dates (365 days from now)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 365);

      // Update membership status to active
      const { data: membership, error: updateError } = await supabase
        .from("memberships")
        .update({
          status: "active",
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", membershipId)
        .eq("status", "pending_payment")
        .select()
        .single();

      if (updateError || !membership) {
        return {
          success: false,
          referralBonusPaid: false,
          message: "Failed to activate membership",
        };
      }

      // Update user verification status
      await supabase
        .from("profiles")
        .update({ is_verified: true })
        .eq("id", membership.user_id);

      // Process referral bonus (if applicable)
      const referralResult = await referralService.processReferralBonus(membershipId);

      return {
        success: true,
        referralBonusPaid: referralResult.bonusPaid,
        message: `Membership activated successfully. ${referralResult.message}`,
      };
    } catch (error) {
      console.error("Error activating membership:", error);
      return {
        success: false,
        referralBonusPaid: false,
        message: "Error activating membership",
      };
    }
  },

  /**
   * Check if membership is active
   */
  async checkMembershipStatus(userId: string): Promise<{
    success: boolean;
    isActive: boolean;
    membership: Membership | null;
    daysRemaining: number;
    message: string;
  }> {
    try {
      const { data: membership, error } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("end_date", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        return {
          success: false,
          isActive: false,
          membership: null,
          daysRemaining: 0,
          message: "Error checking membership status",
        };
      }

      if (!membership) {
        return {
          success: true,
          isActive: false,
          membership: null,
          daysRemaining: 0,
          message: "No active membership found",
        };
      }

      // Check if membership has expired
      const now = new Date();
      const endDate = new Date(membership.end_date || "");

      if (endDate < now) {
        // Mark as expired
        await supabase
          .from("memberships")
          .update({ status: "expired" })
          .eq("id", membership.id);

        return {
          success: true,
          isActive: false,
          membership: membership,
          daysRemaining: 0,
          message: "Membership has expired",
        };
      }

      // Calculate days remaining
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        success: true,
        isActive: true,
        membership: membership,
        daysRemaining: daysRemaining,
        message: "Membership is active",
      };
    } catch (error) {
      console.error("Error checking membership status:", error);
      return {
        success: false,
        isActive: false,
        membership: null,
        daysRemaining: 0,
        message: "Error checking membership status",
      };
    }
  },

  /**
   * Get membership history for a user
   */
  async getMembershipHistory(userId: string): Promise<{
    success: boolean;
    memberships: Membership[];
    message: string;
  }> {
    try {
      const { data: memberships, error } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        return {
          success: false,
          memberships: [],
          message: "Error fetching membership history",
        };
      }

      return {
        success: true,
        memberships: memberships || [],
        message: "Membership history retrieved successfully",
      };
    } catch (error) {
      console.error("Error getting membership history:", error);
      return {
        success: false,
        memberships: [],
        message: "Error getting membership history",
      };
    }
  },
};