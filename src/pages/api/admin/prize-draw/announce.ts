import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { prizeDrawService } from "@/services/prizeDrawService";

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

export default async function handler(req: NextApiRequest, res: NextApiResponse<AnnounceDrawResponse>) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Check if user is super admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "super_admin") {
      return res.status(403).json({ success: false, error: "Forbidden: Super Admin access required" });
    }

    // Parse request body
    const { drawId }: AnnounceDrawRequest = req.body;

    if (!drawId) {
      return res.status(400).json({ success: false, error: "Missing required field: drawId" });
    }

    // Call service to announce draw
    const announceResult = await prizeDrawService.announceDraw(drawId, user.id);

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