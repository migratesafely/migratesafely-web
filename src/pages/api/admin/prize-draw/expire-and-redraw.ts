import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { prizeDrawWinnerService } from "@/services/prizeDrawWinnerService";
import { emailService } from "@/services/emailService";
import { prizeDrawEmailTemplates } from "@/services/prizeDrawEmailTemplates";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Verify super admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        error: "Forbidden: Super Admin access required",
      });
    }

    // Get request body
    const { drawId } = req.body;

    if (!drawId) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: drawId",
      });
    }

    // Verify draw exists
    const { data: draw, error: drawError } = await supabase
      .from("prize_draws")
      .select("id, announcement_status")
      .eq("id", drawId)
      .single();

    if (drawError || !draw) {
      return res.status(404).json({
        success: false,
        error: "Draw not found",
      });
    }

    // Draw should be ANNOUNCED or COMPLETED
    if (!["ANNOUNCED", "COMPLETED"].includes(draw.announcement_status)) {
      return res.status(400).json({
        success: false,
        error: "Draw must be ANNOUNCED or COMPLETED",
      });
    }

    // Call service to expire and redraw
    const result = await prizeDrawWinnerService.expireAndRedraw(drawId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || "Failed to expire and redraw winners",
      });
    }

    // Send redraw winner notification emails (non-blocking)
    if (result.numberRedrawn && result.numberRedrawn > 0) {
      try {
        const claimLink = "https://migratesafely.com/prize-draw";

        // Fetch newly created winners from this operation
        const { data: redrawnWinners, error: winnersError } = await supabase
          .from("prize_draw_winners")
          .select(`
            id,
            winner_user_id,
            prize_id,
            draw_id,
            claim_deadline_at,
            selected_at
          `)
          .eq("draw_id", drawId)
          .eq("award_type", "RANDOM_DRAW")
          .eq("claim_status", "PENDING")
          .gte("selected_at", new Date(Date.now() - 60000).toISOString()); // Winners selected in last minute

        if (winnersError || !redrawnWinners) {
          console.error("Failed to fetch redrawn winners:", winnersError);
        } else {
          for (const winner of redrawnWinners) {
            try {
              // Fetch winner profile
              const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("email, full_name")
                .eq("id", winner.winner_user_id)
                .single();

              if (profileError || !profile) {
                console.error(`Failed to fetch profile for winner ${winner.winner_user_id}:`, profileError);
                continue;
              }

              // Fetch prize details
              const { data: prize, error: prizeError } = await supabase
                .from("prize_draw_prizes")
                .select("title")
                .eq("id", winner.prize_id)
                .single();

              if (prizeError || !prize) {
                console.error(`Failed to fetch prize ${winner.prize_id}:`, prizeError);
                continue;
              }

              // Format claim deadline
              const claimDeadline = new Date(winner.claim_deadline_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              // Generate redraw winner email
              const emailTemplate = prizeDrawEmailTemplates.redrawWinnerNotificationEmail({
                userName: profile.full_name || profile.email,
                prizeTitle: prize.title,
                claimDeadline,
                claimLink,
              });

              // Send email (non-blocking)
              await emailService.sendEmail({
                to: profile.email,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
                text: emailTemplate.text,
              });

              console.log(`Redraw winner notification email sent to ${profile.email}`);
            } catch (emailError) {
              console.error(`Failed to send redraw winner notification email:`, emailError);
              // Continue with next winner - don't block on email failures
            }
          }
        }
      } catch (error) {
        console.error("Error sending redraw winner notification emails:", error);
        // Don't fail the request if email sending fails
      }
    }

    return res.status(200).json({
      success: true,
      numberExpired: result.numberExpired || 0,
      numberRedrawn: result.numberRedrawn || 0,
    });
  } catch (error) {
    console.error("Error in expire-and-redraw handler:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}