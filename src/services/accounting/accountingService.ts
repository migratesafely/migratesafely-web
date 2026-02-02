import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type GeneralLedgerInsert = Database["public"]["Tables"]["general_ledger"]["Insert"];

/**
 * Accounting Service - Prize Draw Pool & Financial Accounting
 * 
 * RULES:
 * 1. Prize Draw Pool (Account 2100) is a RESTRICTED LIABILITY
 * 2. 30% of all membership fees go to Prize Draw Pool
 * 3. 70% of membership fees are recognized as income
 * 4. Prize Draw Pool can ONLY be reduced by:
 *    - Prize payouts to winners
 *    - Community support reallocation (expired prizes)
 * 5. Prize creation is BLOCKED if insufficient pool balance
 */

// Account codes
export const ACCOUNTS = {
  // Assets
  CASH_BANK: "1000",
  STRIPE_CLEARING: "1100",
  WALLET_CLEARING: "1200",
  
  // Liabilities
  MEMBER_WALLET_LIABILITY: "2000",
  PRIZE_POOL_PAYABLE: "2100", // RESTRICTED
  PENDING_WITHDRAWALS: "2200",
  TAX_PAYABLE: "2300",
  
  // Equity
  RETAINED_EARNINGS: "3000",
  
  // Income
  MEMBERSHIP_FEES_NET: "4000", // 70% of gross
  AGENT_FEES: "4100",
  OTHER_SERVICE_INCOME: "4200",
  
  // Expenses
  REFERRAL_BONUSES: "5000",
  TIER_BONUSES: "5100",
  COMMUNITY_SUPPORT: "5200",
  OPERATIONAL_EXPENSES: "5300",
} as const;

// Prize pool split percentages
export const MEMBERSHIP_FEE_SPLIT = {
  INCOME_PERCENTAGE: 70,
  PRIZE_POOL_PERCENTAGE: 30,
} as const;

interface LedgerEntry {
  account_code: string;
  debit_amount?: number;
  credit_amount?: number;
  description: string;
  reference_type?: string;
  reference_id?: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a double-entry accounting transaction
 */
export async function createLedgerTransaction(
  entries: LedgerEntry[],
  transaction_type: string,
  posting_date?: Date,
  created_by?: string
): Promise<{ success: boolean; transaction_id?: string; error?: string }> {
  try {
    // Validate double-entry (total debits = total credits)
    const totalDebits = entries.reduce((sum, e) => sum + (e.debit_amount || 0), 0);
    const totalCredits = entries.reduce((sum, e) => sum + (e.credit_amount || 0), 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return {
        success: false,
        error: `Unbalanced entry: Debits ${totalDebits} != Credits ${totalCredits}`,
      };
    }

    // Generate transaction ID to link all entries
    const transaction_id = crypto.randomUUID();
    const posting_date_str = posting_date ? posting_date.toISOString().split("T")[0] : new Date().toISOString().split("T")[0];

    // Prepare ledger entries
    const ledgerEntries: GeneralLedgerInsert[] = entries.map((entry) => ({
      transaction_id,
      transaction_type,
      posting_date: posting_date_str,
      account_code: entry.account_code,
      debit_amount: entry.debit_amount || 0,
      credit_amount: entry.credit_amount || 0,
      description: entry.description,
      reference_type: entry.reference_type,
      reference_id: entry.reference_id,
      user_id: entry.user_id,
      created_by: created_by,
      metadata: entry.metadata || {},
    }));

    // Insert all entries in a single operation
    const { error: insertError } = await supabase
      .from("general_ledger")
      .insert(ledgerEntries);

    if (insertError) {
      console.error("Ledger insert error:", insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true, transaction_id };
  } catch (error) {
    console.error("Ledger transaction error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * RULE 1: Record membership payment with 70/30 split
 * 
 * Journal Entry:
 * DR Cash/Bank (1000)              100 BDT
 *    CR Membership Income (4000)        70 BDT (70%)
 *    CR Prize Pool Payable (2100)       30 BDT (30% RESTRICTED)
 */
export async function recordMembershipPayment(
  amount: number,
  user_id: string,
  payment_id: string,
  description?: string
): Promise<{ success: boolean; transaction_id?: string; error?: string }> {
  const incomeAmount = (amount * MEMBERSHIP_FEE_SPLIT.INCOME_PERCENTAGE) / 100;
  const prizePoolAmount = (amount * MEMBERSHIP_FEE_SPLIT.PRIZE_POOL_PERCENTAGE) / 100;

  return createLedgerTransaction([
    {
      account_code: ACCOUNTS.CASH_BANK,
      debit_amount: amount,
      credit_amount: 0,
      description: description || `Membership payment received - ${amount} BDT`,
      reference_type: "payment",
      reference_id: payment_id,
      user_id,
      metadata: { gross_amount: amount, currency: "BDT" },
    },
    {
      account_code: ACCOUNTS.MEMBERSHIP_FEES_NET,
      debit_amount: 0,
      credit_amount: incomeAmount,
      description: `Membership income (70% of ${amount} BDT)`,
      reference_type: "payment",
      reference_id: payment_id,
      user_id,
      metadata: { percentage: 70, gross_amount: amount },
    },
    {
      account_code: ACCOUNTS.PRIZE_POOL_PAYABLE,
      debit_amount: 0,
      credit_amount: prizePoolAmount,
      description: `Prize pool allocation (30% of ${amount} BDT) - RESTRICTED`,
      reference_type: "payment",
      reference_id: payment_id,
      user_id,
      metadata: { 
        percentage: 30, 
        gross_amount: amount,
        restricted: true,
        purpose: "prize_draw_pool",
      },
    },
  ], "membership_payment");
}

/**
 * RULE 2: Record prize payout to winner
 * 
 * Journal Entry:
 * DR Prize Pool Payable (2100)     X BDT
 *    CR Member Wallet Liability (2000)  X BDT
 */
export async function recordPrizePayout(
  amount: number,
  winner_id: string,
  prize_id: string,
  draw_id: string,
  description?: string
): Promise<{ success: boolean; transaction_id?: string; error?: string }> {
  return createLedgerTransaction([
    {
      account_code: ACCOUNTS.PRIZE_POOL_PAYABLE,
      debit_amount: amount,
      credit_amount: 0,
      description: description || `Prize payout from restricted pool - ${amount} BDT`,
      reference_type: "prize_payout",
      reference_id: prize_id,
      user_id: winner_id,
      metadata: { 
        draw_id,
        prize_id,
        amount,
        currency: "BDT",
        pool_usage: "prize_payout",
      },
    },
    {
      account_code: ACCOUNTS.MEMBER_WALLET_LIABILITY,
      debit_amount: 0,
      credit_amount: amount,
      description: `Member wallet credit for prize win - ${amount} BDT`,
      reference_type: "prize_payout",
      reference_id: prize_id,
      user_id: winner_id,
      metadata: { 
        draw_id,
        prize_id,
        source: "prize_pool",
      },
    },
  ], "prize_payout");
}

/**
 * RULE 3: Record expired prize → community support reallocation
 * 
 * Journal Entry:
 * DR Prize Pool Payable (2100)          X BDT
 *    CR Community Support Expense (5200)   X BDT
 */
export async function recordCommunitySupport(
  amount: number,
  original_winner_id: string,
  new_recipient_id: string,
  prize_id: string,
  draw_id: string,
  description?: string
): Promise<{ success: boolean; transaction_id?: string; error?: string }> {
  return createLedgerTransaction([
    {
      account_code: ACCOUNTS.PRIZE_POOL_PAYABLE,
      debit_amount: amount,
      credit_amount: 0,
      description: description || `Community support reallocation (expired prize) - ${amount} BDT`,
      reference_type: "community_support",
      reference_id: prize_id,
      user_id: original_winner_id,
      metadata: { 
        draw_id,
        prize_id,
        original_winner: original_winner_id,
        new_recipient: new_recipient_id,
        reason: "expired_prize",
        pool_usage: "community_support",
      },
    },
    {
      account_code: ACCOUNTS.COMMUNITY_SUPPORT,
      debit_amount: 0,
      credit_amount: amount,
      description: `Community support payment - ${amount} BDT`,
      reference_type: "community_support",
      reference_id: prize_id,
      user_id: new_recipient_id,
      metadata: { 
        draw_id,
        prize_id,
        source: "expired_prize",
        original_winner: original_winner_id,
      },
    },
  ], "community_support_reallocation");
}

/**
 * RULE 4: Get current Prize Draw Pool balance
 * 
 * Balance = Total Credits - Total Debits on Account 2100
 */
export async function getPrizePoolBalance(): Promise<{ balance: number; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("general_ledger")
      .select("credit_amount, debit_amount")
      .eq("account_code", ACCOUNTS.PRIZE_POOL_PAYABLE);

    if (error) {
      console.error("Prize pool balance query error:", error);
      return { balance: 0, error: error.message };
    }

    if (!data || data.length === 0) {
      return { balance: 0 };
    }

    // Calculate balance (Credits - Debits for liability account)
    const totalCredits = data.reduce((sum, entry) => sum + (entry.credit_amount || 0), 0);
    const totalDebits = data.reduce((sum, entry) => sum + (entry.debit_amount || 0), 0);
    const balance = totalCredits - totalDebits;

    return { balance: Math.max(0, balance) };
  } catch (error) {
    console.error("Prize pool balance error:", error);
    return { balance: 0, error: String(error) };
  }
}

/**
 * RULE 4: Check if prize draw can be created (sufficient pool balance)
 * 
 * Returns true if Prize Pool Balance >= Total Prize Value
 */
export async function canCreatePrizeDraw(
  totalPrizeValue: number
): Promise<{ allowed: boolean; current_balance: number; required: number; error?: string }> {
  const { balance, error } = await getPrizePoolBalance();

  if (error) {
    return {
      allowed: false,
      current_balance: 0,
      required: totalPrizeValue,
      error,
    };
  }

  return {
    allowed: balance >= totalPrizeValue,
    current_balance: balance,
    required: totalPrizeValue,
  };
}

/**
 * Record referral bonus payout
 * 
 * Journal Entry:
 * DR Referral Bonus Expense (5000)      X BDT
 *    CR Member Wallet Liability (2000)     X BDT
 */
export async function recordReferralBonus(
  amount: number,
  user_id: string,
  referral_id: string,
  description?: string
): Promise<{ success: boolean; transaction_id?: string; error?: string }> {
  return createLedgerTransaction([
    {
      account_code: ACCOUNTS.REFERRAL_BONUSES,
      debit_amount: amount,
      credit_amount: 0,
      description: description || `Referral bonus expense - ${amount} BDT`,
      reference_type: "referral_bonus",
      reference_id: referral_id,
      user_id,
      metadata: { amount, currency: "BDT" },
    },
    {
      account_code: ACCOUNTS.MEMBER_WALLET_LIABILITY,
      debit_amount: 0,
      credit_amount: amount,
      description: `Member wallet credit for referral bonus - ${amount} BDT`,
      reference_type: "referral_bonus",
      reference_id: referral_id,
      user_id,
      metadata: { amount },
    },
  ], "referral_bonus");
}

/**
 * Record tier achievement bonus payout
 * 
 * Journal Entry:
 * DR Tier Bonus Expense (5100)          X BDT
 *    CR Member Wallet Liability (2000)     X BDT
 */
export async function recordTierBonus(
  amount: number,
  user_id: string,
  bonus_id: string,
  tier: string,
  description?: string
): Promise<{ success: boolean; transaction_id?: string; error?: string }> {
  return createLedgerTransaction([
    {
      account_code: ACCOUNTS.TIER_BONUSES,
      debit_amount: amount,
      credit_amount: 0,
      description: description || `Tier bonus expense (${tier}) - ${amount} BDT`,
      reference_type: "tier_bonus",
      reference_id: bonus_id,
      user_id,
      metadata: { amount, currency: "BDT", tier },
    },
    {
      account_code: ACCOUNTS.MEMBER_WALLET_LIABILITY,
      debit_amount: 0,
      credit_amount: amount,
      description: `Member wallet credit for tier bonus (${tier}) - ${amount} BDT`,
      reference_type: "tier_bonus",
      reference_id: bonus_id,
      user_id,
      metadata: { amount, tier },
    },
  ], "tier_bonus");
}

/**
 * Record member wallet withdrawal
 * 
 * Journal Entry:
 * DR Member Wallet Liability (2000)     X BDT
 *    CR Cash/Bank (1000)                   X BDT
 */
export async function recordWalletWithdrawal(
  amount: number,
  user_id: string,
  withdrawal_id: string,
  description?: string
): Promise<{ success: boolean; transaction_id?: string; error?: string }> {
  return createLedgerTransaction([
    {
      account_code: ACCOUNTS.MEMBER_WALLET_LIABILITY,
      debit_amount: amount,
      credit_amount: 0,
      description: description || `Member wallet withdrawal - ${amount} BDT`,
      reference_type: "withdrawal",
      reference_id: withdrawal_id,
      user_id,
      metadata: { amount, currency: "BDT" },
    },
    {
      account_code: ACCOUNTS.CASH_BANK,
      debit_amount: 0,
      credit_amount: amount,
      description: `Cash payment for wallet withdrawal - ${amount} BDT`,
      reference_type: "withdrawal",
      reference_id: withdrawal_id,
      user_id,
      metadata: { amount },
    },
  ], "wallet_withdrawal");
}

/**
 * Get account balance for any account
 * 
 * For Assets/Expenses: Balance = Debits - Credits
 * For Liabilities/Income/Equity: Balance = Credits - Debits
 */
export async function getAccountBalance(
  account_code: string
): Promise<{ balance: number; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("general_ledger")
      .select("credit_amount, debit_amount")
      .eq("account_code", account_code);

    if (error) {
      console.error("Account balance query error:", error);
      return { balance: 0, error: error.message };
    }

    if (!data || data.length === 0) {
      return { balance: 0 };
    }

    const totalCredits = data.reduce((sum, entry) => sum + (entry.credit_amount || 0), 0);
    const totalDebits = data.reduce((sum, entry) => sum + (entry.debit_amount || 0), 0);

    // Get account type to determine balance calculation
    const { data: accountData } = await supabase
      .from("chart_of_accounts")
      .select("account_type")
      .eq("account_code", account_code)
      .single();

    const accountType = accountData?.account_type;

    // Calculate balance based on account type
    let balance = 0;
    if (accountType === "Asset" || accountType === "Expense") {
      balance = totalDebits - totalCredits; // Normal debit balance
    } else {
      balance = totalCredits - totalDebits; // Normal credit balance
    }

    return { balance };
  } catch (error) {
    console.error("Account balance error:", error);
    return { balance: 0, error: String(error) };
  }
}