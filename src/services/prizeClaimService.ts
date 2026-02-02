import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getMemberCommunityPrizes } from "./communityPrizeAwardService";

type PrizeDrawWinner = Database["public"]["Tables"]["prize_draw_winners"]["Row"];
type PrizeClaimReport = Database["public"]["Tables"]["prize_claim_reports"]["Row"];

export interface ClaimablePrize {
  winner_id: string;
  draw_id: string;
  draw_name: string;
  prize_title: string;
  prize_amount: number;
  claim_deadline: string;
  days_remaining: number;
  can_claim: boolean;
  blocked_reason: string | null;
  eligibility_details: any;
}

/**
 * Prize Claim Service
 * Handles prize claim workflow, KYC validation, and rollover processing
 */

// ============================================================================
// MEMBER CLAIM FUNCTIONS
// ============================================================================

/**
 * Get claimable prizes for a member
 */
export async function getMemberClaimablePrizes(userId: string) {
  try {
    const { data, error } = await supabase.rpc("get_member_claimable_prizes", {
      p_user_id: userId
    });

    if (error) throw error;

    return {
      success: true,
      prizes: (data || []) as ClaimablePrize[]
    };
  } catch (error: any) {
    console.error("Error getting claimable prizes:", error);
    return {
      success: false,
      error: error.message,
      prizes: []
    };
  }
}

/**
 * Validate if member can claim a prize
 */
export async function validatePrizeClaimEligibility(
  winnerId: string,
  userId: string
): Promise<{
  eligible: boolean;
  reason?: string;
  blocked_reasons?: string[];
  prize_amount?: number;
  claim_deadline?: string;
  days_remaining?: number;
}> {
  try {
    const { data, error } = await supabase.rpc("validate_prize_claim_eligibility", {
      p_winner_id: winnerId,
      p_user_id: userId
    });

    if (error) throw error;

    return data as any;
  } catch (error: any) {
    console.error("Error validating claim eligibility:", error);
    return {
      eligible: false,
      reason: error.message
    };
  }
}

/**
 * Process prize claim
 */
export async function processPrizeClaim(
  winnerId: string,
  userId: string,
  claimMethod: "wallet_credit" | "bank_transfer" = "wallet_credit"
): Promise<{
  success: boolean;
  error?: string;
  blocked_reasons?: string[];
  prize_amount?: number;
  claim_method?: string;
  claimed_at?: string;
}> {
  try {
    const { data, error } = await supabase.rpc("process_prize_claim", {
      p_winner_id: winnerId,
      p_user_id: userId,
      p_claim_method: claimMethod
    });

    if (error) throw error;

    return data as any;
  } catch (error: any) {
    console.error("Error processing prize claim:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// ADMIN ROLLOVER FUNCTIONS
// ============================================================================

/**
 * Process expired unclaimed prizes (admin/automated)
 */
export async function processExpiredUnclaimedPrizes(): Promise<{
  success: boolean;
  total_expired?: number;
  total_rollover_amount?: number;
  draws_affected?: string[];
  processed_at?: string;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.rpc("process_expired_unclaimed_prizes");

    if (error) throw error;

    return data as any;
  } catch (error: any) {
    console.error("Error processing expired prizes:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate final claim report for a draw
 */
export async function generateFinalClaimReport(drawId: string): Promise<{
  success: boolean;
  report_id?: string;
  report_data?: any;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.rpc("generate_final_claim_report", {
      p_draw_id: drawId
    });

    if (error) throw error;

    return data as any;
  } catch (error: any) {
    console.error("Error generating final claim report:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get final claim reports for admin dashboard
 */
export async function getClaimReports(limit: number = 50): Promise<{
  success: boolean;
  reports: PrizeClaimReport[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("prize_claim_reports")
      .select(`
        *,
        draw:prize_draws(draw_name, draw_date, pool_type)
      `)
      .order("generated_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      success: true,
      reports: data || []
    };
  } catch (error: any) {
    console.error("Error getting claim reports:", error);
    return {
      success: false,
      reports: [],
      error: error.message
    };
  }
}

/**
 * Get claim report for a specific draw
 */
export async function getClaimReportForDraw(drawId: string): Promise<{
  success: boolean;
  report?: PrizeClaimReport;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("prize_claim_reports")
      .select(`
        *,
        draw:prize_draws(draw_name, draw_date, pool_type)
      `)
      .eq("draw_id", drawId)
      .eq("report_type", "final_claim_summary")
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return {
      success: true,
      report: data || undefined
    };
  } catch (error: any) {
    console.error("Error getting claim report for draw:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all winners for a draw with claim status
 */
export async function getDrawWinnersWithClaimStatus(drawId: string) {
  try {
    const { data, error } = await supabase
      .from("prize_draw_winners")
      .select(`
        *,
        winner:profiles!winner_user_id(full_name, email)
      `)
      .eq("draw_id", drawId)
      .order("assigned_at", { ascending: true });

    if (error) throw error;

    return {
      success: true,
      winners: data || []
    };
  } catch (error: any) {
    console.error("Error getting winners with claim status:", error);
    return {
      success: false,
      winners: [],
      error: error.message
    };
  }
}

/**
 * Get all claimable prizes for a member (Random + Community)
 */
export async function getAllMemberPrizes(userId: string) {
  try {
    // Get random draw prizes
    const randomResult = await getMemberClaimablePrizes(userId);
    
    // Get community prizes
    const communityResult = await getMemberCommunityPrizes(userId);
    
    return {
      success: true,
      randomPrizes: randomResult.prizes,
      communityPrizes: communityResult.success ? communityResult.prizes : [],
      totalPrizes: randomResult.prizes.length + (communityResult.success ? communityResult.prizes.length : 0)
    };
  } catch (error: any) {
    console.error("Error getting all member prizes:", error);
    return {
      success: false,
      randomPrizes: [],
      communityPrizes: [],
      totalPrizes: 0,
      error: error.message
    };
  }
}

/**
 * Get expired unclaimed prizes (for monitoring)
 */
export async function getExpiredUnclaimedPrizes() {
  try {
    const { data, error } = await supabase
      .from("prize_draw_winners")
      .select(`
        *,
        draw:prize_draws(draw_name, draw_date, pool_type),
        winner:profiles!winner_user_id(full_name, email)
      `)
      .is("claimed_at", null)
      .lt("claim_deadline", new Date().toISOString())
      .eq("rollover_processed", false)
      .order("claim_deadline", { ascending: true });

    if (error) throw error;

    return {
      success: true,
      expired_prizes: data || []
    };
  } catch (error: any) {
    console.error("Error getting expired unclaimed prizes:", error);
    return {
      success: false,
      expired_prizes: [],
      error: error.message
    };
  }
}

/**
 * Check member KYC and bank verification status
 */
export async function checkMemberVerificationStatus(userId: string): Promise<{
  kyc_approved: boolean;
  bank_details_exist: boolean;
  bank_verified: boolean;
  ready_to_claim: boolean;
  missing_requirements: string[];
}> {
  try {
    // Get bank details from member_bank_details table
    const { data: bankDetails, error: bankError } = await supabase
      .from("member_bank_details")
      .select("account_holder_name, bank_name, account_number, is_verified")
      .eq("member_id", userId)
      .single();

    // Get identity verification
    const { data: identity, error: identityError } = await supabase
      .from("identity_verifications")
      .select("status")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .single();

    const kycApproved = identity && identity.status === "APPROVED";
    const bankDetailsExist = !!(
      bankDetails?.account_holder_name &&
      bankDetails?.bank_name &&
      bankDetails?.account_number
    );
    const bankVerified = bankDetails?.is_verified === true;

    const missingRequirements: string[] = [];
    if (!kycApproved) missingRequirements.push("Identity verification (KYC) not approved");
    if (!bankDetailsExist) missingRequirements.push("Bank account details not provided");
    if (!bankVerified) missingRequirements.push("Bank account not verified by admin");

    return {
      kyc_approved: kycApproved,
      bank_details_exist: bankDetailsExist,
      bank_verified: bankVerified,
      ready_to_claim: kycApproved && bankDetailsExist && bankVerified,
      missing_requirements: missingRequirements
    };
  } catch (error: any) {
    console.error("Error checking verification status:", error);
    return {
      kyc_approved: false,
      bank_details_exist: false,
      bank_verified: false,
      ready_to_claim: false,
      missing_requirements: ["Error checking status: " + error.message]
    };
  }
}

/**
 * Format claim deadline for display
 */
export function formatClaimDeadline(claimDeadline: string): {
  formatted: string;
  isExpiringSoon: boolean;
  daysRemaining: number;
} {
  const deadline = new Date(claimDeadline);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return {
    formatted: deadline.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }),
    isExpiringSoon: daysRemaining <= 3 && daysRemaining >= 0,
    daysRemaining: Math.max(0, daysRemaining)
  };
}