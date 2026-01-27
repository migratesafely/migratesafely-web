import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Wallet = Database["public"]["Tables"]["wallets"]["Row"];
type WithdrawalRequest = Database["public"]["Tables"]["withdrawal_requests"]["Row"];
type WithdrawalInsert = Database["public"]["Tables"]["withdrawal_requests"]["Insert"];

/**
 * WALLET SERVICE - APPLICATION LAYER LOGIC
 * Manages wallet operations and withdrawal requests
 */

export const walletService = {
  /**
   * Get wallet details for a user
   */
  async getWallet(userId: string): Promise<{
    success: boolean;
    wallet: Wallet | null;
    message: string;
  }> {
    try {
      const { data: wallet, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        return {
          success: false,
          wallet: null,
          message: "Error fetching wallet",
        };
      }

      if (!wallet) {
        // Create wallet if it doesn't exist
        const { data: newWallet, error: createError } = await supabase
          .from("wallets")
          .insert({
            user_id: userId,
            balance: 0,
            currency: "BDT",
            total_earned: 0,
            total_withdrawn: 0,
          })
          .select()
          .single();

        if (createError || !newWallet) {
          return {
            success: false,
            wallet: null,
            message: "Error creating wallet",
          };
        }

        return {
          success: true,
          wallet: newWallet,
          message: "Wallet created successfully",
        };
      }

      return {
        success: true,
        wallet: wallet,
        message: "Wallet retrieved successfully",
      };
    } catch (error) {
      console.error("Error getting wallet:", error);
      return {
        success: false,
        wallet: null,
        message: "Error getting wallet",
      };
    }
  },

  /**
   * Get wallet balance for a user
   */
  async getBalance(userId: string): Promise<{
    success: boolean;
    balance: number;
    currency: string;
    message: string;
  }> {
    const walletResult = await this.getWallet(userId);

    if (!walletResult.success || !walletResult.wallet) {
      return {
        success: false,
        balance: 0,
        currency: "BDT",
        message: walletResult.message,
      };
    }

    return {
      success: true,
      balance: Number(walletResult.wallet.balance),
      currency: walletResult.wallet.currency,
      message: "Balance retrieved successfully",
    };
  },

  /**
   * Create a withdrawal request
   * Member requests to withdraw funds from their wallet
   */
  async createWithdrawalRequest(
    userId: string,
    amount: number,
    paymentMethod: string,
    paymentDetails: Record<string, string | number | boolean | null>
  ): Promise<{
    success: boolean;
    withdrawalId: string | null;
    message: string;
  }> {
    try {
      // Check wallet balance
      const balanceResult = await this.getBalance(userId);
      if (!balanceResult.success) {
        return {
          success: false,
          withdrawalId: null,
          message: balanceResult.message,
        };
      }

      if (balanceResult.balance < amount) {
        return {
          success: false,
          withdrawalId: null,
          message: "Insufficient balance",
        };
      }

      // Check for pending withdrawal requests
      const { data: pendingRequests, error: checkError } = await supabase
        .from("withdrawal_requests")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "pending");

      if (checkError) {
        return {
          success: false,
          withdrawalId: null,
          message: "Error checking pending requests",
        };
      }

      if (pendingRequests && pendingRequests.length > 0) {
        return {
          success: false,
          withdrawalId: null,
          message: "You already have a pending withdrawal request",
        };
      }

      // Create withdrawal request
      // Cast paymentDetails to any to satisfy the complex Json type union from Supabase
      const withdrawalData: WithdrawalInsert = {
        user_id: userId,
        amount: amount,
        currency: balanceResult.currency,
        status: "pending",
        payment_method: paymentMethod,
        payment_details: paymentDetails as any, 
      };

      const { data: withdrawal, error: insertError } = await supabase
        .from("withdrawal_requests")
        .insert(withdrawalData)
        .select()
        .single();

      if (insertError || !withdrawal) {
        return {
          success: false,
          withdrawalId: null,
          message: "Failed to create withdrawal request",
        };
      }

      return {
        success: true,
        withdrawalId: withdrawal.id,
        message: "Withdrawal request created successfully. Awaiting admin approval.",
      };
    } catch (error) {
      console.error("Error creating withdrawal request:", error);
      return {
        success: false,
        withdrawalId: null,
        message: "Error creating withdrawal request",
      };
    }
  },

  /**
   * Get withdrawal requests for a user
   */
  async getUserWithdrawals(userId: string): Promise<{
    success: boolean;
    withdrawals: WithdrawalRequest[];
    message: string;
  }> {
    try {
      const { data: withdrawals, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("user_id", userId)
        .order("requested_at", { ascending: false });

      if (error) {
        return {
          success: false,
          withdrawals: [],
          message: "Error fetching withdrawal requests",
        };
      }

      return {
        success: true,
        withdrawals: withdrawals || [],
        message: "Withdrawal requests retrieved successfully",
      };
    } catch (error) {
      console.error("Error getting withdrawals:", error);
      return {
        success: false,
        withdrawals: [],
        message: "Error getting withdrawals",
      };
    }
  },

  /**
   * Admin: Approve withdrawal request
   * This is called by admin after reviewing the request
   */
  async approveWithdrawal(
    withdrawalId: string,
    adminId: string,
    notes?: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Get withdrawal details
      const { data: withdrawal, error: fetchError } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("id", withdrawalId)
        .single();

      if (fetchError || !withdrawal) {
        return {
          success: false,
          message: "Withdrawal request not found",
        };
      }

      if (withdrawal.status !== "pending") {
        return {
          success: false,
          message: "Withdrawal request has already been processed",
        };
      }

      // Check wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", withdrawal.user_id)
        .single();

      if (walletError || !wallet) {
        return {
          success: false,
          message: "Wallet not found",
        };
      }

      if (Number(wallet.balance) < Number(withdrawal.amount)) {
        return {
          success: false,
          message: "Insufficient wallet balance",
        };
      }

      // Deduct from wallet balance
      const newBalance = Number(wallet.balance) - Number(withdrawal.amount);
      const newTotalWithdrawn = Number(wallet.total_withdrawn) + Number(withdrawal.amount);

      const { error: updateWalletError } = await supabase
        .from("wallets")
        .update({
          balance: newBalance,
          total_withdrawn: newTotalWithdrawn,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", withdrawal.user_id);

      if (updateWalletError) {
        return {
          success: false,
          message: "Failed to update wallet",
        };
      }

      // Update withdrawal request status
      const { error: updateError } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "approved",
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || "Approved by admin",
        })
        .eq("id", withdrawalId);

      if (updateError) {
        return {
          success: false,
          message: "Failed to update withdrawal status",
        };
      }

      return {
        success: true,
        message: "Withdrawal approved successfully",
      };
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      return {
        success: false,
        message: "Error approving withdrawal",
      };
    }
  },

  /**
   * Admin: Reject withdrawal request
   */
  async rejectWithdrawal(
    withdrawalId: string,
    adminId: string,
    notes: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "rejected",
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          review_notes: notes,
        })
        .eq("id", withdrawalId)
        .eq("status", "pending");

      if (error) {
        return {
          success: false,
          message: "Failed to reject withdrawal",
        };
      }

      return {
        success: true,
        message: "Withdrawal rejected successfully",
      };
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
      return {
        success: false,
        message: "Error rejecting withdrawal",
      };
    }
  },

  /**
   * Admin: Mark withdrawal as paid
   * Called after admin has physically transferred money to user
   */
  async markAsPaid(
    withdrawalId: string,
    adminId: string,
    notes?: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "paid",
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          paid_at: new Date().toISOString(),
          review_notes: notes || "Payment completed",
        })
        .eq("id", withdrawalId)
        .eq("status", "approved");

      if (error) {
        return {
          success: false,
          message: "Failed to mark withdrawal as paid",
        };
      }

      return {
        success: true,
        message: "Withdrawal marked as paid successfully",
      };
    } catch (error) {
      console.error("Error marking withdrawal as paid:", error);
      return {
        success: false,
        message: "Error marking withdrawal as paid",
      };
    }
  },
};