import { supabase } from "@/integrations/supabase/client";
import {
  recordMembershipPayment,
  recordPrizePayout,
  recordCommunitySupport,
  getPrizePoolBalance,
  canCreatePrizeDraw,
} from "./accountingService";

/**
 * Prize Pool Integration Service
 * 
 * Connects existing prize draw system with accounting foundation.
 * ADDITIVE ONLY - Does not modify existing prize draw logic.
 */

/**
 * Integration Hook: Called after successful membership payment
 * 
 * Automatically records 70/30 split:
 * - 70% → Membership Income (available for operations)
 * - 30% → Prize Draw Pool Payable (restricted)
 */
export async function onMembershipPaymentSuccess(
  amount: number,
  user_id: string,
  payment_id: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; transaction_id?: string; error?: string }> {
  console.log(`[Accounting] Recording membership payment: ${amount} BDT for user ${user_id}`);
  
  const result = await recordMembershipPayment(
    amount,
    user_id,
    payment_id,
    `Membership payment - ${metadata?.description || "Standard membership"}`
  );

  if (result.success) {
    console.log(`[Accounting] Membership payment recorded successfully. Transaction ID: ${result.transaction_id}`);
    console.log(`[Accounting] Split: ${amount * 0.7} BDT → Income, ${amount * 0.3} BDT → Prize Pool`);
  } else {
    console.error(`[Accounting] Failed to record membership payment: ${result.error}`);
  }

  return result;
}

/**
 * Integration Hook: Called when prize is claimed by winner
 * 
 * Records prize payout from restricted pool to member wallet
 */
export async function onPrizeClaimed(
  prize_amount: number,
  winner_id: string,
  prize_id: string,
  draw_id: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; transaction_id?: string; error?: string }> {
  console.log(`[Accounting] Recording prize payout: ${prize_amount} BDT to winner ${winner_id}`);
  
  const result = await recordPrizePayout(
    prize_amount,
    winner_id,
    prize_id,
    draw_id,
    `Prize payout - ${metadata?.prize_name || "Prize"} (Draw ID: ${draw_id})`
  );

  if (result.success) {
    console.log(`[Accounting] Prize payout recorded successfully. Transaction ID: ${result.transaction_id}`);
    
    // Log updated pool balance
    const { balance } = await getPrizePoolBalance();
    console.log(`[Accounting] Prize Pool balance after payout: ${balance} BDT`);
  } else {
    console.error(`[Accounting] Failed to record prize payout: ${result.error}`);
  }

  return result;
}

/**
 * Integration Hook: Called when expired prize is reallocated to community support
 * 
 * Records reallocation from Prize Pool to Community Support expense
 */
export async function onExpiredPrizeReallocated(
  amount: number,
  original_winner_id: string,
  new_recipient_id: string,
  prize_id: string,
  draw_id: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; transaction_id?: string; error?: string }> {
  console.log(`[Accounting] Recording community support reallocation: ${amount} BDT`);
  console.log(`[Accounting] Original winner: ${original_winner_id}, New recipient: ${new_recipient_id}`);
  
  const result = await recordCommunitySupport(
    amount,
    original_winner_id,
    new_recipient_id,
    prize_id,
    draw_id,
    `Community support reallocation - Expired prize from Draw ${draw_id}`
  );

  if (result.success) {
    console.log(`[Accounting] Community support recorded successfully. Transaction ID: ${result.transaction_id}`);
    
    // Log updated pool balance
    const { balance } = await getPrizePoolBalance();
    console.log(`[Accounting] Prize Pool balance after reallocation: ${balance} BDT`);
  } else {
    console.error(`[Accounting] Failed to record community support: ${result.error}`);
  }

  return result;
}

/**
 * Validation Hook: Check if prize draw can be created
 * 
 * BLOCKS prize creation if insufficient pool balance
 */
export async function validatePrizeDrawCreation(
  prizes: Array<{ amount: number; name: string }>
): Promise<{
  allowed: boolean;
  current_balance: number;
  required: number;
  shortfall?: number;
  error?: string;
}> {
  const totalPrizeValue = prizes.reduce((sum, prize) => sum + prize.amount, 0);
  
  console.log(`[Accounting] Validating prize draw creation: Total value ${totalPrizeValue} BDT`);
  
  const validation = await canCreatePrizeDraw(totalPrizeValue);

  if (!validation.allowed) {
    const shortfall = validation.required - validation.current_balance;
    console.warn(`[Accounting] BLOCKED: Insufficient prize pool balance`);
    console.warn(`[Accounting] Required: ${validation.required} BDT, Available: ${validation.current_balance} BDT, Shortfall: ${shortfall} BDT`);
    
    return {
      allowed: false,
      current_balance: validation.current_balance,
      required: validation.required,
      shortfall,
      error: `Insufficient Prize Draw Pool balance. Need ${shortfall} BDT more.`,
    };
  }

  console.log(`[Accounting] Validation PASSED: Prize draw can be created`);
  console.log(`[Accounting] Pool balance: ${validation.current_balance} BDT, Required: ${validation.required} BDT`);
  
  return {
    allowed: true,
    current_balance: validation.current_balance,
    required: validation.required,
  };
}

/**
 * Get Prize Pool status summary
 */
export async function getPrizePoolStatus(): Promise<{
  balance: number;
  total_contributions: number;
  total_disbursements: number;
  available_for_prizes: number;
  currency: string;
}> {
  try {
    const { data, error } = await supabase
      .from("prize_pool_summary")
      .select("*")
      .single();

    if (error || !data) {
      console.error("Prize pool summary error:", error);
      return {
        balance: 0,
        total_contributions: 0,
        total_disbursements: 0,
        available_for_prizes: 0,
        currency: "BDT",
      };
    }

    return {
      balance: data.current_balance || 0,
      total_contributions: data.total_contributions || 0,
      total_disbursements: data.total_disbursements || 0,
      available_for_prizes: data.current_balance || 0,
      currency: data.currency || "BDT",
    };
  } catch (error) {
    console.error("Prize pool status error:", error);
    return {
      balance: 0,
      total_contributions: 0,
      total_disbursements: 0,
      available_for_prizes: 0,
      currency: "BDT",
    };
  }
}

/**
 * Database function wrapper: Check if prize draw can be created
 */
export async function checkPrizeDrawBalance(
  totalPrizeValue: number
): Promise<{
  allowed: boolean;
  current_balance: number;
  required_balance: number;
  shortfall: number;
}> {
  try {
    const { data, error } = await supabase.rpc("can_create_prize_draw", {
      total_prize_value: totalPrizeValue,
    });

    if (error) {
      console.error("Prize draw balance check error:", error);
      return {
        allowed: false,
        current_balance: 0,
        required_balance: totalPrizeValue,
        shortfall: totalPrizeValue,
      };
    }

    // RPC returns an array with single row
    const result = Array.isArray(data) ? data[0] : data;

    return {
      allowed: result.allowed || false,
      current_balance: result.current_balance || 0,
      required_balance: result.required_balance || totalPrizeValue,
      shortfall: result.shortfall || 0,
    };
  } catch (error) {
    console.error("Prize draw balance check error:", error);
    return {
      allowed: false,
      current_balance: 0,
      required_balance: totalPrizeValue,
      shortfall: totalPrizeValue,
    };
  }
}