import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type CommunityPrizeAward = Database["public"]["Tables"]["community_prize_awards"]["Row"];
type CommunityPrizeAwardInsert = Database["public"]["Tables"]["community_prize_awards"]["Insert"];

/**
 * Community Prize Award Service
 * Handles manual community prize selection and awards
 */

// ============================================================================
// ADMIN AWARD FUNCTIONS
// ============================================================================

/**
 * Award a community prize to a specific member
 */
export async function awardCommunityPrize(
  prizeDrawId: string,
  prizeName: string,
  prizeAmount: number,
  memberNumber: string,
  awardedByAdminId: string
): Promise<{
  success: boolean;
  awardId?: string;
  error?: string;
}> {
  try {
    // 1. Find member by membership number
    const { data: membership, error: memberError } = await supabase
      .from("memberships")
      .select("user_id, membership_number, status")
      .eq("membership_number", parseInt(memberNumber))
      .single();

    if (memberError || !membership) {
      return {
        success: false,
        error: `Member #${memberNumber} not found`
      };
    }

    if (membership.status !== "active") {
      return {
        success: false,
        error: `Member #${memberNumber} is not active (status: ${membership.status})`
      };
    }

    // 2. Check if member already received this prize
    const { data: existingAward, error: checkError } = await supabase
      .from("community_prize_awards")
      .select("id")
      .eq("prize_draw_id", prizeDrawId)
      .eq("member_id", membership.user_id)
      .single();

    if (existingAward) {
      return {
        success: false,
        error: `Member #${memberNumber} has already been awarded a prize in this draw`
      };
    }

    // 3. Create award record
    const claimDeadline = new Date();
    claimDeadline.setDate(claimDeadline.getDate() + 14); // 14 days from now

    const { data: award, error: insertError } = await supabase
      .from("community_prize_awards")
      .insert({
        prize_draw_id: prizeDrawId,
        prize_name: prizeName,
        prize_amount: prizeAmount,
        member_id: membership.user_id,
        member_number: memberNumber,
        awarded_by_admin_id: awardedByAdminId,
        claim_status: "pending",
        claim_deadline: claimDeadline.toISOString()
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    // 4. Send internal notification to member
    await notifyMemberOfAward(membership.user_id, prizeName, prizeAmount);

    return {
      success: true,
      awardId: award.id
    };
  } catch (error: any) {
    console.error("Error awarding community prize:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get all awards for a draw
 */
export async function getDrawAwards(drawId: string): Promise<{
  success: boolean;
  awards: CommunityPrizeAward[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("community_prize_awards")
      .select(`
        *,
        member:profiles!member_id(full_name, email),
        awarded_by:profiles!awarded_by_admin_id(full_name)
      `)
      .eq("prize_draw_id", drawId)
      .order("awarded_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      awards: data || []
    };
  } catch (error: any) {
    console.error("Error getting draw awards:", error);
    return {
      success: false,
      awards: [],
      error: error.message
    };
  }
}

/**
 * Get member's claimable community prizes
 */
export async function getMemberCommunityPrizes(memberId: string): Promise<{
  success: boolean;
  prizes: CommunityPrizeAward[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("community_prize_awards")
      .select(`
        *,
        draw:prize_draws(draw_name, draw_date)
      `)
      .eq("member_id", memberId)
      .eq("claim_status", "pending")
      .order("awarded_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      prizes: data || []
    };
  } catch (error: any) {
    console.error("Error getting member community prizes:", error);
    return {
      success: false,
      prizes: [],
      error: error.message
    };
  }
}

// ============================================================================
// MEMBER CLAIM FUNCTIONS
// ============================================================================

/**
 * Process member claim for community prize
 */
export async function claimCommunityPrize(
  awardId: string,
  memberId: string
): Promise<{
  success: boolean;
  error?: string;
  walletCredited?: boolean;
}> {
  try {
    // 1. Get award details
    const { data: award, error: fetchError } = await supabase
      .from("community_prize_awards")
      .select("*")
      .eq("id", awardId)
      .eq("member_id", memberId)
      .single();

    if (fetchError || !award) {
      return {
        success: false,
        error: "Award not found or does not belong to you"
      };
    }

    // 2. Validate claim eligibility
    if (award.claim_status !== "pending") {
      return {
        success: false,
        error: `Cannot claim: Prize is ${award.claim_status}`
      };
    }

    const now = new Date();
    const deadline = new Date(award.claim_deadline);
    if (now > deadline) {
      return {
        success: false,
        error: "Claim deadline has passed"
      };
    }

    // 3. Validate KYC and bank details
    const { data: identity } = await supabase
      .from("identity_verifications")
      .select("status")
      .eq("user_id", memberId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .single();

    if (!identity || identity.status !== "APPROVED") {
      return {
        success: false,
        error: "Identity verification required. Please complete KYC first."
      };
    }

    const { data: bankDetails } = await supabase
      .from("member_bank_details")
      .select("is_verified")
      .eq("member_id", memberId)
      .single();

    if (!bankDetails || !bankDetails.is_verified) {
      return {
        success: false,
        error: "Bank account verification required. Please submit and verify bank details."
      };
    }

    // 4. Credit wallet
    const { error: walletError } = await supabase.rpc("credit_wallet", {
      p_user_id: memberId,
      p_amount: award.prize_amount,
      p_transaction_type: "community_prize_claim",
      p_description: `Community Prize: ${award.prize_name}`,
      p_reference_id: awardId
    });

    if (walletError) {
      return {
        success: false,
        error: "Failed to credit wallet: " + walletError.message
      };
    }

    // 5. Mark as claimed
    const { error: updateError } = await supabase
      .from("community_prize_awards")
      .update({
        claim_status: "claimed",
        claimed_at: new Date().toISOString()
      })
      .eq("id", awardId);

    if (updateError) throw updateError;

    return {
      success: true,
      walletCredited: true
    };
  } catch (error: any) {
    console.error("Error claiming community prize:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

/**
 * Send award notification to member
 */
async function notifyMemberOfAward(
  memberId: string,
  prizeName: string,
  prizeAmount: number
): Promise<void> {
  try {
    // Get admin user for "from" field
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "super_admin")
      .limit(1)
      .single();

    if (!adminProfile) {
      console.error("No super admin found for notification");
      return;
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        sender_user_id: adminProfile.id,
        subject: "🎉 Congratulations! You Won a Community Prize",
        body: `Dear Member,

Congratulations! You have been selected to receive a Community Prize.

Prize: ${prizeName}
Amount: ${prizeAmount.toLocaleString()} BDT

To claim your prize:
1. Complete identity verification (KYC) if not done
2. Add and verify your bank account details
3. Click the "Claim Prize" button in your dashboard

You have 14 days from today to claim this prize.

Best regards,
MigrateSafely Team`,
        message_type: "system",
        sender_role: "admin"
      })
      .select("id")
      .single();

    if (messageError) {
      console.error("Error creating message:", messageError);
      return;
    }

    // Create recipient record
    await supabase
      .from("message_recipients")
      .insert({
        message_id: message.id,
        recipient_user_id: memberId,
        is_read: false
      });

  } catch (error) {
    console.error("Error sending award notification:", error);
  }
}

// ============================================================================
// ADMIN REPORTING
// ============================================================================

/**
 * Get draw closure report
 */
export async function getDrawClosureReport(drawId: string): Promise<{
  success: boolean;
  report?: any;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("prize_draw_closure_reports")
      .select("*")
      .eq("draw_id", drawId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return {
      success: true,
      report: data || null
    };
  } catch (error: any) {
    console.error("Error getting closure report:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get all closure reports
 */
export async function getAllClosureReports(limit: number = 50): Promise<{
  success: boolean;
  reports: any[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("prize_draw_closure_reports")
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
    console.error("Error getting closure reports:", error);
    return {
      success: false,
      reports: [],
      error: error.message
    };
  }
}