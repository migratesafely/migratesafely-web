import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { logAdminAction } from "@/services/auditLogService";
import { agentPermissionsService } from "@/services/agentPermissionsService";
import { communityPrizeAwardService } from "@/services/communityPrizeAwardService";

interface AssignCommunitySupport {
  drawId: string;
  prizeId: string;
  winnerUserId: string;
  reason?: string;
}

interface AssignResponse {
  success: boolean;
  winnerId?: string;
  error?: string;
}

/**
 * Assign Community Support Prize to a specific member
 * ADMIN ONLY: Restricted to Chairman
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AssignResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Require admin role
  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  try {
    // Only Chairman can manually assign community prizes
    const isChairman = await agentPermissionsService.isChairman(auth.userId);
    
    if (!isChairman) {
      return res.status(403).json({ success: false, error: "Forbidden: Chairman access required" });
    }

    const { drawId, prizeId, winnerUserId, reason }: AssignCommunitySupport = req.body;

    if (!drawId || !prizeId || !winnerUserId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: drawId, prizeId, winnerUserId",
      });
    }

    // Validate draw exists and status
    const { data: draw, error: drawError } = await supabase
      .from("prize_draws")
      .select("id, announcement_status")
      .eq("id", drawId)
      .single();

    if (drawError || !draw) {
      return res.status(404).json({ success: false, error: "Draw not found" });
    }

    if (!["ANNOUNCED", "COMPLETED"].includes(draw.announcement_status)) {
      return res.status(400).json({
        success: false,
        error: "Draw must be ANNOUNCED or COMPLETED",
      });
    }

    // Validate prize exists and is COMMUNITY_SUPPORT
    const { data: prize, error: prizeError } = await supabase
      .from("prize_draw_prizes")
      .select("id, award_type, draw_id")
      .eq("id", prizeId)
      .eq("draw_id", drawId)
      .single();

    if (prizeError || !prize) {
      return res.status(404).json({ success: false, error: "Prize not found" });
    }

    if (prize.award_type !== "COMMUNITY_SUPPORT") {
      return res.status(400).json({
        success: false,
        error: "Prize must be of type COMMUNITY_SUPPORT",
      });
    }

    // Check if winner already exists for this prize
    const { data: existingWinner, error: existingError } = await supabase
      .from("prize_draw_winners")
      .select("id")
      .eq("draw_id", drawId)
      .eq("prize_id", prizeId)
      .eq("winner_user_id", winnerUserId)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing winner:", existingError);
      return res.status(500).json({ success: false, error: "Failed to check existing winner" });
    }

    if (existingWinner) {
      return res.status(400).json({
        success: false,
        error: "This user has already been assigned this prize",
      });
    }

    // Validate winner is eligible (active member with entry)
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("id, status, end_date")
      .eq("user_id", winnerUserId)
      .eq("status", "active")
      .maybeSingle();

    if (membershipError || !membership) {
      return res.status(400).json({
        success: false,
        error: "User must have active membership",
      });
    }

    // Check membership not expired
    const now = new Date();
    const endDate = new Date(membership.end_date);
    if (endDate < now) {
      return res.status(400).json({
        success: false,
        error: "User's membership has expired",
      });
    }

    // Check user has entry for this draw
    const { data: entry, error: entryError } = await supabase
      .from("prize_draw_entries")
      .select("id")
      .eq("prize_draw_id", drawId)
      .eq("user_id", winnerUserId)
      .maybeSingle();

    if (entryError || !entry) {
      return res.status(400).json({
        success: false,
        error: "User must have an entry in this draw",
      });
    }

    // Create winner record
    const claimDeadline = new Date();
    claimDeadline.setDate(claimDeadline.getDate() + 14);

    const { data: winner, error: insertError } = await supabase
      .from("prize_draw_winners")
      .insert({
        draw_id: drawId,
        prize_id: prizeId,
        winner_user_id: winnerUserId,
        award_type: "COMMUNITY_SUPPORT",
        selected_by_admin_id: auth.userId,
        selected_at: now.toISOString(),
        claim_status: "PENDING",
        claim_deadline_at: claimDeadline.toISOString(),
        payout_status: "PENDING",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error creating winner:", insertError);
      return res.status(500).json({ success: false, error: "Failed to assign winner" });
    }

    return res.status(200).json({ success: true, winnerId: winner.id });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}