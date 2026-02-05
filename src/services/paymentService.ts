import { supabase } from "@/integrations/supabase/client";
import { notificationService } from "./notificationService";

export interface BankDetails {
  accountHolderName: string;
  bankName: string;
  branchName?: string;
  accountNumber: string;
  countryCode: string;
  isVerified: boolean;
  verifiedAt?: string;
}

export interface PaymentRequest {
  id: string;
  memberId: string;
  memberEmail: string;
  memberFullName: string;
  paymentType: "referral_bonus" | "tier_bonus" | "withdrawal";
  amount: number;
  currencyCode: string;
  bankDetails: {
    account_holder_name: string;
    bank_name: string;
    branch_name?: string;
    account_number: string;
    country_code: string;
  };
  walletBalance: number;
  walletPendingBalance: number;
  status: "pending" | "approved" | "rejected" | "completed" | "failed";
  requestedAt: string;
}

export const paymentService = {
  /**
   * Get member's bank details
   */
  async getMemberBankDetails(memberId: string): Promise<BankDetails | null> {
    try {
      const { data, error } = await supabase
        .from("member_bank_details")
        .select("*")
        .eq("member_id", memberId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        accountHolderName: data.account_holder_name,
        bankName: data.bank_name,
        branchName: data.branch_name || undefined,
        accountNumber: data.account_number,
        countryCode: data.country_code,
        isVerified: data.is_verified,
        verifiedAt: data.verified_at || undefined,
      };
    } catch (error) {
      console.error("Error fetching bank details:", error);
      return null;
    }
  },

  /**
   * Save or update member's bank details
   */
  async saveBankDetails(
    memberId: string,
    bankDetails: Omit<BankDetails, "isVerified" | "verifiedAt">
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("member_bank_details")
        .upsert({
          member_id: memberId,
          account_holder_name: bankDetails.accountHolderName,
          bank_name: bankDetails.bankName,
          branch_name: bankDetails.branchName || null,
          account_number: bankDetails.accountNumber,
          country_code: bankDetails.countryCode,
          is_verified: false, // Reset verification on update
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error("Error saving bank details:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in saveBankDetails:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  },

  /**
   * Request payment approval
   */
  async requestPaymentApproval(
    memberId: string,
    paymentType: "referral_bonus" | "tier_bonus" | "withdrawal",
    amount: number,
    currencyCode: string,
    sourceTransactionId?: string
  ): Promise<{ success: boolean; paymentRequestId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("request_payment_approval", {
        p_member_id: memberId,
        p_payment_type: paymentType,
        p_amount: amount,
        p_currency_code: currencyCode,
        p_source_transaction_id: sourceTransactionId || null,
      });

      if (error || !data) {
        console.error("Failed to create payment request:", error);
        return { success: false, error: "Failed to create payment request" };
      }

      // Notify Super Admin
      await notificationService.notifyAdmins(
        "super_admin",
        "wallet_credit", // Closest type for payment request
        "New Payment Request",
        `Payment request (${paymentType}) of ${currencyCode} ${amount}`,
        {
          referenceId: data, // data is the ID string
          referenceType: "payment_request"
        }
      );

      return { success: true, paymentRequestId: data };
    } catch (error) {
      console.error("Error in requestPaymentApproval:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  },

  /**
   * Get pending payment requests (Admin)
   */
  async getPendingPaymentRequests(): Promise<PaymentRequest[]> {
    try {
      const { data, error } = await supabase.rpc("get_pending_payment_requests");

      if (error) {
        console.error("Error fetching payment requests:", error);
        return [];
      }

      return (data || []).map((req: any) => ({
        id: req.payment_request_id,
        memberId: req.member_id,
        memberEmail: req.member_email,
        memberFullName: req.member_full_name,
        paymentType: req.payment_type,
        amount: req.amount,
        currencyCode: req.currency_code,
        bankDetails: req.bank_details,
        walletBalance: req.wallet_balance,
        walletPendingBalance: req.wallet_pending_balance,
        status: req.status,
        requestedAt: req.requested_at,
      }));
    } catch (error) {
      console.error("Error in getPendingPaymentRequests:", error);
      return [];
    }
  },

  /**
   * Approve payment request (Manager Admin or Super Admin)
   */
  async approvePaymentRequest(
    paymentRequestId: string,
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("approve_payment_request", {
        p_payment_request_id: paymentRequestId,
        p_admin_notes: adminNotes || null,
      });

      if (error) {
        console.error("Error approving payment request:", error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: "Approval failed - insufficient permissions or invalid request" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in approvePaymentRequest:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  },

  /**
   * Reject payment request (Manager Admin or Super Admin)
   */
  async rejectPaymentRequest(
    paymentRequestId: string,
    rejectionReason: string,
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("reject_payment_request", {
        p_payment_request_id: paymentRequestId,
        p_rejection_reason: rejectionReason,
        p_admin_notes: adminNotes || null,
      });

      if (error) {
        console.error("Error rejecting payment request:", error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: "Rejection failed - insufficient permissions or invalid request" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in rejectPaymentRequest:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  },

  /**
   * Get member's payment request history
   */
  async getMemberPaymentHistory(memberId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("member_id", memberId)
        .order("requested_at", { ascending: false });

      if (error) {
        console.error("Error fetching payment history:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getMemberPaymentHistory:", error);
      return [];
    }
  },
};