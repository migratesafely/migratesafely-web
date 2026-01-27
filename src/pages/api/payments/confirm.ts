import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { messageService } from "@/services/messageService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { userId, paymentMethod, transactionId } = req.body;

    if (!userId || !paymentMethod || !transactionId) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (membershipError || !membership) {
      return res.status(404).json({ success: false, error: "Membership not found" });
    }

    if (membership.status === "active") {
      return res.status(400).json({ success: false, error: "Membership already active" });
    }

    const activatedAt = new Date().toISOString();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 365);

    const { error: updateError } = await supabase
      .from("memberships")
      .update({
        status: "active",
        payment_method: paymentMethod,
        transaction_id: transactionId,
        activated_at: activatedAt,
        expires_at: expiresAt.toISOString(),
      })
      .eq("id", membership.id);

    if (updateError) {
      console.error("Error updating membership:", updateError);
      return res.status(500).json({ success: false, error: "Failed to activate membership" });
    }

    // Fetch profile with referral code
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, referral_code")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return res.status(200).json({ 
        success: true, 
        message: "Membership activated but welcome message not sent" 
      });
    }

    let referralCode = profile?.referral_code;

    // Generate referral code if missing
    if (!referralCode) {
      const namePart = (profile?.full_name || "MEMBER")
        .split(" ")[0]
        .toUpperCase()
        .substring(0, 6);
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      referralCode = `${namePart}-${randomPart}`;

      const { error: updateReferralError } = await supabase
        .from("profiles")
        .update({ referral_code: referralCode })
        .eq("id", userId);

      if (updateReferralError) {
        console.error("Error updating referral code:", updateReferralError);
      }
    }

    // Fetch membership with membership_number
    const { data: updatedMembership, error: fetchMembershipError } = await supabase
      .from("memberships")
      .select("membership_number")
      .eq("user_id", userId)
      .single();

    if (fetchMembershipError) {
      console.error("Error fetching membership:", fetchMembershipError);
      return res.status(200).json({ 
        success: true, 
        message: "Membership activated but welcome message not sent" 
      });
    }

    let membershipNumber = updatedMembership?.membership_number;

    // Generate membership number if missing
    if (!membershipNumber) {
      membershipNumber = Math.floor(100000 + Math.random() * 900000);

      const { error: updateMembershipNumberError } = await supabase
        .from("memberships")
        .update({ membership_number: membershipNumber })
        .eq("user_id", userId);

      if (updateMembershipNumberError) {
        console.error("Error updating membership number:", updateMembershipNumberError);
        return res.status(200).json({ 
          success: true, 
          message: "Membership activated but welcome message not sent" 
        });
      }
    }

    // Check for existing welcome message to prevent duplicates
    const welcomeSubject = "Welcome to MigrateSafely — Your Membership is Active ✅";

    const { data: existingMessages, error: checkError } = await supabase
      .from("message_recipients")
      .select(`
        id,
        messages!inner (
          subject
        )
      `)
      .eq("recipient_user_id", userId)
      .eq("messages.subject", welcomeSubject)
      .limit(1);

    if (checkError) {
      console.error("Error checking for existing welcome message:", checkError);
    }

    // Send welcome message only if not already sent
    if (!existingMessages || existingMessages.length === 0) {
      const messageResult = await messageService.sendMembershipWelcomeMessage({
        userId: userId,
        fullName: profile?.full_name,
        referralCode: referralCode,
        membershipNumber: `${membershipNumber}`,
      });

      if (!messageResult.success) {
        console.error("Failed to send welcome message:", messageResult.error);
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: "Membership activated successfully" 
    });
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return res.status(500).json({ success: false, error: "Payment confirmation failed" });
  }
}