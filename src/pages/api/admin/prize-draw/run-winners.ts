import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { logAdminAction } from "@/services/auditLogService";
import { prizeDrawWinnerService } from "@/services/prizeDrawWinnerService";
import { agentPermissionsService } from "@/services/agentPermissionsService";
import { emailService } from "@/services/emailService";
import { prizeDrawEmailTemplates } from "@/services/prizeDrawEmailTemplates";

interface RunWinnersRequest {
  drawId: string;
}

interface RunWinnersResponse {
  success: boolean;
  winnersCreated?: number;
  error?: string;
}

/**
 * Run winner selection algorithm
 * ADMIN ONLY: Restricted to Chairman
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<RunWinnersResponse>) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Require admin role
  const auth = await requireAdminRole(req, res);
  if (!auth) return res.status(401).json({ success: false, error: "Unauthorized" });

  const isSuperAdmin = await agentPermissionsService.isSuperAdmin(auth.userId);

  if (!isSuperAdmin) {
    return res.status(403).json({ success: false, error: "Forbidden: Super Admin access required" });
  }

  try {
    const { drawId }: RunWinnersRequest = req.body;

    if (!drawId) {
      return res.status(400).json({ success: false, error: "Missing required field: drawId" });
    }

    const { data: draw, error: drawError } = await supabase
      .from("prize_draws")
      .select("id, announcement_status")
      .eq("id", drawId)
      .single();

    if (drawError || !draw) {
      return res.status(404).json({ success: false, error: "Draw not found" });
    }

    if (draw.announcement_status !== "ANNOUNCED") {
      return res.status(400).json({ success: false, error: "Draw must be ANNOUNCED before running winner selection" });
    }

    const result = await prizeDrawWinnerService.runWinnerSelectionForDraw(drawId, auth.userId);

    if (!result.success || !result.winnersCreated) {
      return res.status(500).json({ success: false, error: result.error || "Failed to select winners" });
    }

    // Send winner notification emails (non-blocking)
    try {
      const claimLink = "https://migratesafely.com/prize-draw";

      // Fetch the newly created winners to send emails
      // We look for winners of this draw that are pending and created recently
      const { data: winners, error: winnersError } = await supabase
        .from("prize_draw_winners")
        .select("*")
        .eq("draw_id", drawId)
        .eq("claim_status", "PENDING");
      
      if (winnersError) {
        console.error("Failed to fetch winners for email notification:", winnersError);
      } else if (winners && winners.length > 0) {
        for (const winner of winners) {
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

            // Fetch draw details
            const { data: drawData, error: drawError } = await supabase
              .from("prize_draws")
              .select("draw_date")
              .eq("id", winner.draw_id)
              .single();

            if (drawError || !drawData) {
              console.error(`Failed to fetch draw ${winner.draw_id}:`, drawError);
              continue;
            }

            // Format dates
            const drawDate = new Date(drawData.draw_date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            const claimDeadline = new Date(winner.claim_deadline_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            // Generate email
            const emailTemplate = prizeDrawEmailTemplates.winnerNotificationEmail({
              userName: profile.full_name || profile.email,
              prizeTitle: prize.title,
              drawDate,
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

            console.log(`Winner notification email sent to ${profile.email}`);
          } catch (emailError) {
            console.error(`Failed to send winner notification email:`, emailError);
            // Continue with next winner - don't block on email failures
          }
        }
      }
    } catch (error) {
      console.error("Error sending winner notification emails:", error);
      // Don't fail the request if email sending fails
    }

    return res.status(200).json({ success: true, winnersCreated: result.winnersCreated });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}