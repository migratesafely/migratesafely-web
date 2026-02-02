import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type SubPoolType = "random" | "community";
type TransactionType = "allocation" | "payout" | "adjustment";

/**
 * Prize Pool Split Service
 * 
 * INTERNAL USE ONLY - NOT exposed to members
 * 
 * Manages the two-pool structure:
 * - Random Prize Pool (70%) - Luck-based draws
 * - Community Selected Prize Pool (30%) - Hardship/special cases
 * 
 * Members see ONLY total combined balance
 * Super Admin can view breakdown and manage split configuration
 */

// ====================================================================
// SUB-POOL BALANCE QUERIES
// ====================================================================

/**
 * Get current balances for both sub-pools
 * ADMIN ONLY - Members never see this breakdown
 */
export async function getSubPoolBalances(countryCode: string = "BD") {
  const { data, error } = await supabase
    .from("prize_pool_sub_accounts")
    .select("*")
    .eq("country_code", countryCode)
    .order("sub_pool_type");

  if (error) {
    console.error("Error fetching sub-pool balances:", error);
    return { success: false, error: error.message };
  }

  const randomPool = data?.find(p => p.sub_pool_type === "random");
  const communityPool = data?.find(p => p.sub_pool_type === "community");

  return {
    success: true,
    data: {
      random: {
        balance: randomPool?.current_balance || 0,
        last_updated: randomPool?.last_updated_at
      },
      community: {
        balance: communityPool?.current_balance || 0,
        last_updated: communityPool?.last_updated_at
      },
      total: (randomPool?.current_balance || 0) + (communityPool?.current_balance || 0)
    }
  };
}

/**
 * Get admin breakdown view
 * Shows full split with percentages
 * SUPER ADMIN ONLY
 */
export async function getAdminPrizePoolBreakdown() {
  const { data, error } = await supabase
    .from("admin_prize_pool_breakdown")
    .select("*");

  if (error) {
    console.error("Error fetching admin breakdown:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// ====================================================================
// SPLIT CONFIGURATION MANAGEMENT
// ====================================================================

/**
 * Get current split configuration
 * Returns the active 70/30 (or custom) split percentages
 * ADMIN ONLY
 */
export async function getCurrentSplitConfig(countryCode: string = "BD") {
  const { data, error } = await supabase
    .from("prize_pool_split_config")
    .select("*")
    .eq("country_code", countryCode)
    .lte("effective_from", new Date().toISOString().split("T")[0])
    .order("effective_from", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching split config:", error);
    // Return default if not found
    return {
      success: true,
      data: {
        random_percentage: 70,
        community_percentage: 30,
        effective_from: "2026-01-01"
      }
    };
  }

  return { success: true, data };
}

/**
 * Update split configuration
 * Changes the Random/Community percentage split
 * SUPER ADMIN ONLY (Master Admin after activation)
 * 
 * @param randomPercentage - Percentage for Random Prize Pool (0-100)
 * @param communityPercentage - Percentage for Community Prize Pool (0-100)
 * @param effectiveFrom - Date when new split takes effect (ISO format)
 * @param adminId - ID of admin making the change
 */
export async function updateSplitConfig(
  randomPercentage: number,
  communityPercentage: number,
  effectiveFrom: string,
  adminId: string,
  countryCode: string = "BD"
) {
  // Validate percentages
  if (randomPercentage + communityPercentage !== 100) {
    return {
      success: false,
      error: "Random and Community percentages must sum to 100"
    };
  }

  if (randomPercentage < 0 || randomPercentage > 100 || communityPercentage < 0 || communityPercentage > 100) {
    return {
      success: false,
      error: "Percentages must be between 0 and 100"
    };
  }

  // Validate effective date is not in the past
  const effectiveDate = new Date(effectiveFrom);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (effectiveDate < today) {
    return {
      success: false,
      error: "Effective date cannot be in the past (no retroactive changes allowed)"
    };
  }

  const { data, error } = await supabase
    .from("prize_pool_split_config")
    .insert({
      country_code: countryCode,
      random_percentage: randomPercentage,
      community_percentage: communityPercentage,
      effective_from: effectiveFrom,
      set_by_admin_id: adminId
    })
    .select()
    .single();

  if (error) {
    console.error("Error updating split config:", error);
    return { success: false, error: error.message };
  }

  // Audit log is automatically created by trigger
  return { success: true, data };
}

/**
 * Get split configuration history
 * Shows all past and future split configurations
 * ADMIN ONLY
 */
export async function getSplitConfigHistory(countryCode: string = "BD") {
  const { data, error } = await supabase
    .from("prize_pool_split_config")
    .select("*")
    .eq("country_code", countryCode)
    .order("effective_from", { ascending: false });

  if (error) {
    console.error("Error fetching split config history:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// ====================================================================
// PRIZE POOL ALLOCATION (WITH SPLIT)
// ====================================================================

/**
 * Allocate amount to prize pools with automatic split
 * 
 * Called after membership fee processing (after referral & tier % bonuses)
 * Automatically splits into Random (70%) + Community (30%) pools
 * 
 * INTERNAL USE ONLY - Called by accounting service
 * 
 * @param totalAmount - Total amount to allocate to prize pool
 * @param referenceId - Reference to membership payment or transaction
 * @param referenceType - Type of reference (e.g., 'membership_payment')
 * @param description - Transaction description
 */
export async function allocateToPrizePools(
  totalAmount: number,
  referenceId: string,
  referenceType: string,
  description: string,
  countryCode: string = "BD"
) {
  if (totalAmount <= 0) {
    return { success: false, error: "Allocation amount must be positive" };
  }

  const { data, error } = await supabase.rpc("allocate_to_prize_pools", {
    p_total_allocation_amount: totalAmount,
    p_reference_id: referenceId,
    p_reference_type: referenceType,
    p_description: description,
    p_country_code: countryCode
  });

  if (error) {
    console.error("Error allocating to prize pools:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// ====================================================================
// PRIZE PAYOUT PROCESSING
// ====================================================================

/**
 * Process prize payout from specific sub-pool
 * 
 * Deducts amount from Random or Community pool
 * Validates sufficient funds before processing
 * Remaining funds automatically roll forward to next draw
 * 
 * @param subPoolType - Which pool to use: 'random' or 'community'
 * @param payoutAmount - Amount to pay out
 * @param referenceId - Reference to prize draw winner
 * @param referenceType - Type of reference (e.g., 'prize_draw')
 * @param description - Payout description
 */
export async function processPrizePayout(
  subPoolType: SubPoolType,
  payoutAmount: number,
  referenceId: string,
  referenceType: string,
  description: string,
  countryCode: string = "BD"
) {
  if (payoutAmount <= 0) {
    return { success: false, error: "Payout amount must be positive" };
  }

  if (subPoolType !== "random" && subPoolType !== "community") {
    return { success: false, error: "Invalid sub-pool type. Must be 'random' or 'community'" };
  }

  const { data, error } = await supabase.rpc("process_prize_payout", {
    p_sub_pool_type: subPoolType,
    p_payout_amount: payoutAmount,
    p_reference_id: referenceId,
    p_reference_type: referenceType,
    p_description: description,
    p_country_code: countryCode
  });

  if (error) {
    console.error("Error processing prize payout:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// ====================================================================
// SUB-LEDGER QUERIES
// ====================================================================

/**
 * Get sub-ledger transactions for a specific pool
 * Shows allocation and payout history
 * ADMIN ONLY
 */
export async function getSubLedgerTransactions(
  subPoolType: SubPoolType,
  countryCode: string = "BD",
  limit: number = 50
) {
  const { data, error } = await supabase
    .from("prize_pool_sub_ledger")
    .select("*")
    .eq("country_code", countryCode)
    .eq("sub_pool_type", subPoolType)
    .order("transaction_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching sub-ledger transactions:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Get recent transactions across all sub-pools
 * ADMIN ONLY
 */
export async function getAllSubLedgerTransactions(
  countryCode: string = "BD",
  limit: number = 100
) {
  const { data, error } = await supabase
    .from("prize_pool_sub_ledger")
    .select("*")
    .eq("country_code", countryCode)
    .order("transaction_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching all sub-ledger transactions:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// ====================================================================
// VALIDATION & INTEGRITY CHECKS
// ====================================================================

/**
 * Validate prize pool integrity
 * 
 * Ensures that:
 * 1. Random + Community sub-pools = Total Prize Pool (Account 2100)
 * 2. Sub-ledger balances match sub-pool accounts
 * 3. No discrepancies in accounting
 * 
 * ADMIN ONLY - Used for monthly reconciliation
 */
export async function validatePrizePoolIntegrity(countryCode: string = "BD") {
  const { data, error } = await supabase.rpc("validate_prize_pool_integrity", {
    p_country_code: countryCode
  });

  if (error) {
    console.error("Error validating prize pool integrity:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// ====================================================================
// HELPER FUNCTIONS
// ====================================================================

/**
 * Get pool type description
 * INTERNAL USE ONLY
 */
export function getPoolTypeDescription(subPoolType: SubPoolType): string {
  const descriptions = {
    random: "Random Prize Pool (Luck-based Draws)",
    community: "Community Selected Prize Pool (Hardship/Special Cases)"
  };
  return descriptions[subPoolType] || "Unknown Pool";
}

/**
 * Format pool balance for display
 * ADMIN ONLY - Members never see sub-pool balances
 */
export function formatPoolBalance(balance: number, currency: string = "BDT"): string {
  return `${balance.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })} ${currency}`;
}

/**
 * Calculate expected split amounts
 * Given a total allocation, calculate how much goes to each pool
 * INTERNAL USE ONLY
 */
export async function calculateExpectedSplit(
  totalAmount: number,
  countryCode: string = "BD"
): Promise<{ random: number; community: number }> {
  const configResult = await getCurrentSplitConfig(countryCode);
  
  const randomPct = configResult.data?.random_percentage || 70;
  const communityPct = configResult.data?.community_percentage || 30;

  return {
    random: totalAmount * (randomPct / 100),
    community: totalAmount * (communityPct / 100)
  };
}