import { membershipRepository } from "./membership.repository";
import { isMembershipActive, type Membership } from "./membership.types";

/**
 * MEMBERSHIP SERVICE - BUSINESS LOGIC LAYER
 * Handles membership activation, status checks, and access control
 */

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Add days to an ISO date string
 */
function dateAddDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/**
 * Get days remaining between two ISO dates
 */
function getDaysRemaining(endDateIso: string): number {
  const endDate = new Date(endDateIso);
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get today's date in ISO format
 */
function getTodayIso(): string {
  return new Date().toISOString();
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

export const membershipService = {
  /**
   * 1) Activate membership from payment confirmation
   * Rule: Membership validity = exactly 365 days from paymentConfirmedAt
   */
  async activateMembershipFromPayment(params: {
    userId: string;
    paymentId: string;
    paymentConfirmedAtIso: string;
  }): Promise<{
    success: boolean;
    membership: Membership | null;
    message: string;
  }> {
    try {
      const { userId, paymentId, paymentConfirmedAtIso } = params;

      // Calculate dates: membership valid for exactly 365 days from payment confirmation
      const startDate = paymentConfirmedAtIso;
      const endDate = dateAddDays(startDate, 365);

      // Create or replace membership
      const createResult = await membershipRepository.createOrReplaceMembership(userId, {
        status: "active",
        start_date: startDate,
        end_date: endDate,
        is_renewal: false,
      });

      if (!createResult.success || !createResult.membership) {
        return {
          success: false,
          membership: null,
          message: "Failed to activate membership",
        };
      }

      // Map to application-level Membership type
      const membership: Membership = {
        userId: createResult.membership.user_id,
        plan: "ANNUAL",
        status: "ACTIVE",
        startDate: createResult.membership.start_date || startDate,
        endDate: createResult.membership.end_date || endDate,
        paymentId,
        lastPaymentConfirmedAt: paymentConfirmedAtIso,
        createdAt: createResult.membership.created_at || getTodayIso(),
        updatedAt: createResult.membership.updated_at || getTodayIso(),
      };

      return {
        success: true,
        membership,
        message: "Membership activated successfully",
      };
    } catch (error) {
      console.error("Error activating membership:", error);
      return {
        success: false,
        membership: null,
        message: "Error activating membership",
      };
    }
  },

  /**
   * 2) Get membership status with remaining days
   */
  async getMembershipStatus(userId: string): Promise<{
    success: boolean;
    status: string | null;
    endDate: string | null;
    remainingDays: number;
    message: string;
  }> {
    try {
      const result = await membershipRepository.getMembershipByUserId(userId);

      if (!result.success || !result.membership) {
        return {
          success: true,
          status: null,
          endDate: null,
          remainingDays: 0,
          message: "No membership found",
        };
      }

      const membership = result.membership;
      const endDate = membership.end_date || "";
      const remainingDays = endDate ? getDaysRemaining(endDate) : 0;

      return {
        success: true,
        status: membership.status,
        endDate,
        remainingDays: Math.max(0, remainingDays),
        message: "Membership status retrieved",
      };
    } catch (error) {
      console.error("Error getting membership status:", error);
      return {
        success: false,
        status: null,
        endDate: null,
        remainingDays: 0,
        message: "Error getting membership status",
      };
    }
  },

  /**
   * 3) Check if member is currently active
   * Returns true only if status = ACTIVE and endDate >= today
   */
  async isMemberActive(userId: string): Promise<boolean> {
    try {
      const result = await membershipRepository.getMembershipByUserId(userId);

      if (!result.success || !result.membership) {
        return false;
      }

      const membership = result.membership;
      const isStatusActive = membership.status === "active";
      const isNotExpired = membership.end_date ? isMembershipActive(membership.end_date) : false;

      return isStatusActive && isNotExpired;
    } catch (error) {
      console.error("Error checking member active status:", error);
      return false;
    }
  },

  /**
   * 4) Expire memberships job
   * Marks expired memberships as EXPIRED (runs daily via cron/scheduler)
   */
  async expireMembershipsJob(): Promise<{
    success: boolean;
    expiredCount: number;
    message: string;
  }> {
    try {
      const todayIso = getTodayIso();
      const result = await membershipRepository.markExpiredMemberships(todayIso);

      return {
        success: result.success,
        expiredCount: result.count,
        message: result.message,
      };
    } catch (error) {
      console.error("Error running expire memberships job:", error);
      return {
        success: false,
        expiredCount: 0,
        message: "Error running expire memberships job",
      };
    }
  },

  /**
   * 5) Access control guard
   * Throws error if membership not active (use in protected routes/functions)
   */
  async accessControlGuard(
    userId: string,
    requiredActiveMembership = true
  ): Promise<void> {
    if (!requiredActiveMembership) {
      return; // No check needed
    }

    const isActive = await this.isMemberActive(userId);

    if (!isActive) {
      throw new Error("ACCESS_DENIED: Active membership required");
    }
  },
};