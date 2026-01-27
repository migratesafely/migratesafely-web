import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Payment = Database["public"]["Tables"]["payments"]["Row"];
type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];

export interface ConfirmPaymentInput {
  userId: string;
  membershipId: string;
  amount: number;
  currency: string;
  paymentProvider: string;
  paymentReference: string;
  confirmedBy: string;
  confirmedAtIso: string;
}

export interface PaymentResult {
  success: boolean;
  payment?: Payment;
  error?: string;
}

export const paymentService = {
  async createPaymentRecord(input: ConfirmPaymentInput): Promise<PaymentResult> {
    try {
      const paymentData: PaymentInsert = {
        user_id: input.userId,
        membership_id: input.membershipId,
        amount: input.amount,
        currency: input.currency,
        payment_gateway: input.paymentProvider,
        transaction_id: input.paymentReference,
        status: "confirmed", // Creating directly as confirmed
        confirmed_by: input.confirmedBy,
        confirmation_date: input.confirmedAtIso,
        payment_date: input.confirmedAtIso,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("payments")
        .insert(paymentData)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, payment: data };
    } catch (error) {
      console.error("Error creating payment record:", error);
      return { success: false, error: "Failed to create payment record" };
    }
  },

  async getPaymentByReference(reference: string): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("transaction_id", reference)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        console.error("Error fetching payment:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error fetching payment by reference:", error);
      return null;
    }
  },

  async getUserPayments(userId: string): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        return [];
      }
      return data || [];
    } catch (error) {
      console.error("Error fetching user payments:", error);
      return [];
    }
  }
};