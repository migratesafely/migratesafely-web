import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { prizeDrawService } from "@/services/prizeDrawService";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { logAdminAction } from "@/services/auditLogService";
import { agentPermissionsService } from "@/services/agentPermissionsService";

interface AnnounceDrawRequest {
  drawId: string;
}

interface AnnounceDrawResponse {
  success: boolean;
  draw?: {
    id: string;
    countryCode: string;
    drawDate: string;
    announcementStatus: string;
    estimatedPrizePoolAmount: number;
    estimatedPrizePoolCurrency: string;
    forecastMemberCount: number;
    announcedAt: string;
  };
  error?: string;
}

/**
 * Announce prize draw winners
 * ADMIN ONLY: Restricted to Chairman
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<AnnounceDrawResponse>) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Require admin role
  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  try {
    // Only Chairman can announce winners
    const isChairman = await agentPermissionsService.isChairman(auth.userId);
    
    if (!isChairman) {
      return res.status(403).json({ success: false, error: "Forbidden: Chairman access required" });
    }

    // Parse request body
    const { drawId }: AnnounceDrawRequest = req.body;

    if (!drawId) {
      return res.status(400).json({ success: false, error: "Missing required field: drawId" });
    }

    // Call service to announce draw
    const announceResult = await prizeDrawService.announceDraw(drawId, auth.userId);

    if (!announceResult.success) {
      return res.status(500).json({ success: false, error: announceResult.error || "Failed to announce draw" });
    }

    // Fetch updated draw
    const { data: updatedDraw, error: fetchError } = await supabase
      .from("prize_draws")
      .select("*")
      .eq("id", drawId)
      .single();

    if (fetchError || !updatedDraw) {
      return res.status(500).json({ success: false, error: "Failed to fetch updated draw" });
    }

    return res.status(200).json({
      success: true,
      draw: {
        id: updatedDraw.id,
        countryCode: updatedDraw.country_code || "",
        drawDate: updatedDraw.draw_date,
        announcementStatus: updatedDraw.announcement_status || "ANNOUNCED",
        estimatedPrizePoolAmount: updatedDraw.estimated_prize_pool_amount || 0,
        estimatedPrizePoolCurrency: updatedDraw.estimated_prize_pool_currency || "BDT",
        forecastMemberCount: updatedDraw.forecast_member_count || 0,
        announcedAt: updatedDraw.announced_at || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}