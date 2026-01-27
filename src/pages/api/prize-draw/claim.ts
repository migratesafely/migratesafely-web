import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { emailService } from "@/services/emailService";
import { prizeDrawEmailTemplates } from "@/services/prizeDrawEmailTemplates";

interface ClaimRequest {
  winnerId: string;
}

interface ClaimResponse {
  success: boolean;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ClaimResponse>) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: "Missing authorization header" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, error: "Invalid authorization header" });
    }

    // Validate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Check active membership
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (membershipError || !membership) {
      return res.status(403).json({ success: false, error: "Active membership required" });
    }

    const { winnerId }: ClaimRequest = req.body;

    if (!winnerId) {
      return res.status(400).json({ success: false, error: "Missing required field: winnerId" });
    }

    // Fetch winner record
    const { data: winner, error: winnerError } = await supabase
      .from("prize_draw_winners")
      .select("id, winner_user_id, claim_status, claim_deadline_at, prize_id")
      .eq("id", winnerId)
      .single();

    if (winnerError || !winner) {
      return res.status(404).json({ success: false, error: "Winner record not found" });
    }

    if (winner.winner_user_id !== user.id) {
      return res.status(403).json({ success: false, error: "This winner record does not belong to you" });
    }

    if (winner.claim_status !== "PENDING") {
      return res.status(400).json({ success: false, error: "Prize has already been claimed or expired" });
    }

    const now = new Date();
    const claimDeadline = new Date(winner.claim_deadline_at);

    if (claimDeadline < now) {
      return res.status(400).json({ success: false, error: "Claim deadline has passed" });
    }

    // Update claim status
    const { error: updateError } = await supabase
      .from("prize_draw_winners")
      .update({
        claim_status: "CLAIMED",
        claimed_at: now.toISOString(),
      })
      .eq("id", winnerId);

    if (updateError) {
      console.error("Error updating claim status:", updateError);
      return res.status(500).json({ success: false, error: "Failed to claim prize" });
    }

    // Send claim confirmation email (non-blocking)
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        console.error("Failed to fetch user profile:", profileError);
      } else {
        // Fetch prize details
        const { data: prize, error: prizeError } = await supabase
          .from("prize_draw_prizes")
          .select("title")
          .eq("id", winner.prize_id)
          .single();

        if (prizeError || !prize) {
          console.error("Failed to fetch prize:", prizeError);
        } else {
          // Generate claim confirmation email
          const emailTemplate = prizeDrawEmailTemplates.claimConfirmationEmail({
            userName: profile.full_name || profile.email,
            prizeTitle: prize.title,
          });

          // Send email
          await emailService.sendEmail({
            to: profile.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
          });

          console.log(`Claim confirmation email sent to ${profile.email}`);
        }
      }
    } catch (error) {
      console.error("Error sending claim confirmation email:", error);
      // Don't fail the request if email sending fails
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}