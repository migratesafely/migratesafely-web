import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Membership = Database["public"]["Tables"]["memberships"]["Row"];
type MembershipInsert = Database["public"]["Tables"]["memberships"]["Insert"];
type MembershipUpdate = Database["public"]["Tables"]["memberships"]["Update"];

/**
 * MEMBERSHIP REPOSITORY - DB ACCESS LAYER
 * Clean database operations for memberships
 */

export const membershipRepository = {
  /**
   * Get active membership for a user
   */
  async getMembershipByUserId(userId: string): Promise<{
    success: boolean;
    membership: Membership | null;
    message: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        return { success: false, membership: null, message: "Error fetching membership" };
      }

      return {
        success: true,
        membership: data || null,
        message: data ? "Membership found" : "No membership found",
      };
    } catch (error) {
      console.error("Error getting membership:", error);
      return { success: false, membership: null, message: "Error getting membership" };
    }
  },

  /**
   * Create or replace membership for a user
   */
  async createOrReplaceMembership(
    userId: string,
    membershipData: Partial<MembershipInsert>
  ): Promise<{
    success: boolean;
    membership: Membership | null;
    message: string;
  }> {
    try {
      const insertData: MembershipInsert = {
        user_id: userId,
        ...membershipData,
      } as MembershipInsert;

      const { data, error } = await supabase
        .from("memberships")
        .insert(insertData)
        .select()
        .single();

      if (error || !data) {
        return { success: false, membership: null, message: "Failed to create membership" };
      }

      return { success: true, membership: data, message: "Membership created successfully" };
    } catch (error) {
      console.error("Error creating membership:", error);
      return { success: false, membership: null, message: "Error creating membership" };
    }
  },

  /**
   * Update membership status
   */
  async updateMembershipStatus(
    userId: string,
    status: "suspended" | "pending_payment" | "active" | "expired"
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const { error } = await supabase
        .from("memberships")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (error) {
        return { success: false, message: "Failed to update status" };
      }

      return { success: true, message: "Status updated successfully" };
    } catch (error) {
      console.error("Error updating status:", error);
      return { success: false, message: "Error updating status" };
    }
  },

  /**
   * Set membership start and end dates
   */
  async setMembershipDates(
    userId: string,
    startDateIso: string,
    endDateIso: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const { error } = await supabase
        .from("memberships")
        .update({
          start_date: startDateIso,
          end_date: endDateIso,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) {
        return { success: false, message: "Failed to set dates" };
      }

      return { success: true, message: "Dates set successfully" };
    } catch (error) {
      console.error("Error setting dates:", error);
      return { success: false, message: "Error setting dates" };
    }
  },

  /**
   * Mark expired memberships (batch update)
   */
  async markExpiredMemberships(todayIso: string): Promise<{
    success: boolean;
    count: number;
    message: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("memberships")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("status", "active")
        .lt("end_date", todayIso)
        .select("id");

      if (error) {
        return { success: false, count: 0, message: "Failed to mark expired memberships" };
      }

      return {
        success: true,
        count: data?.length || 0,
        message: `Marked ${data?.length || 0} memberships as expired`,
      };
    } catch (error) {
      console.error("Error marking expired memberships:", error);
      return { success: false, count: 0, message: "Error marking expired memberships" };
    }
  },
};