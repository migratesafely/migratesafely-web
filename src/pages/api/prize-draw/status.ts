import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { prizeDrawService } from "@/services/prizeDrawService";

type DrawStatus = "COMING_SOON" | "ANNOUNCED" | "NONE";

interface DrawStatusResponse {
  status: DrawStatus;
  draw?: {
    id: string;
    countryCode: string;
    drawDate: string;
    announcementStatus: string;
    estimatedPrizePoolAmount: number;
    estimatedPrizePoolCurrency: string;
    estimatedPrizePoolPercentage: number;
    forecastMemberCount: number;
    disclaimerText: string | null;
  };
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<DrawStatusResponse>) {
  if (req.method !== "GET") {
    return res.status(405).json({ status: "NONE", error: "Method not allowed" });
  }

  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(200).json({ status: "NONE" });
    }

    const userId = user.id;

    // Fetch user's country_code from profiles table (server-side only)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("country_code")
      .eq("id", userId)
      .single();

    if (profileError || !profile || !profile.country_code) {
      return res.status(400).json({ status: "NONE", error: "User country not found" });
    }

    const countryCode = profile.country_code;

    // Get active draw for user's country
    const drawResult = await prizeDrawService.getActiveDraw(countryCode);

    if (!drawResult.success) {
      return res.status(500).json({ status: "NONE", error: drawResult.error || "Failed to fetch draw" });
    }

    // No active draw found
    if (!drawResult.draw) {
      return res.status(200).json({ status: "NONE" });
    }

    const draw = drawResult.draw;

    // Map announcement_status to response status
    const status: DrawStatus = draw.announcement_status === "COMING_SOON" ? "COMING_SOON" : draw.announcement_status === "ANNOUNCED" ? "ANNOUNCED" : "NONE";

    // Return structured response
    return res.status(200).json({
      status,
      draw: {
        id: draw.id,
        countryCode: draw.country_code || countryCode,
        drawDate: draw.draw_date,
        announcementStatus: draw.announcement_status || "COMING_SOON",
        estimatedPrizePoolAmount: draw.estimated_prize_pool_amount || 0,
        estimatedPrizePoolCurrency: draw.estimated_prize_pool_currency || "BDT",
        estimatedPrizePoolPercentage: draw.estimated_prize_pool_percentage || 30,
        forecastMemberCount: draw.forecast_member_count || 0,
        disclaimerText: draw.disclaimer_text || null,
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ status: "NONE", error: "Internal server error" });
  }
}