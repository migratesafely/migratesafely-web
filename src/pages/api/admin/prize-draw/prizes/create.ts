import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { prizeDrawService } from "@/services/prizeDrawService";

interface CreatePrizeRequest {
  drawId: string;
  title: string;
  description?: string;
  prizeType: string;
  awardType: string;
  prizeValueAmount: number;
  currencyCode: string;
  numberOfWinners: number;
}

interface CreatePrizeResponse {
  success: boolean;
  prize?: {
    id: string;
    drawId: string;
    title: string;
    description: string | null;
    prizeType: string;
    awardType: string;
    prizeValueAmount: number;
    currencyCode: string;
    numberOfWinners: number;
    status: string;
  };
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<CreatePrizeResponse>) {
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
    const {
      drawId,
      title,
      description,
      prizeType,
      awardType,
      prizeValueAmount,
      currencyCode,
      numberOfWinners,
    }: CreatePrizeRequest = req.body;

    // Validate required fields
    if (!drawId || !title || !prizeType || !awardType || prizeValueAmount === undefined || !currencyCode || numberOfWinners === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: drawId, title, prizeType, awardType, prizeValueAmount, currencyCode, numberOfWinners",
      });
    }

    // Validate numberOfWinners is positive
    if (numberOfWinners < 1) {
      return res.status(400).json({ success: false, error: "numberOfWinners must be at least 1" });
    }

    // Call service to create prize
    const result = await prizeDrawService.createPrize(
      drawId,
      title,
      prizeType,
      awardType,
      prizeValueAmount,
      currencyCode,
      numberOfWinners,
      description
    );

    if (!result.success || !result.prize) {
      return res.status(500).json({ success: false, error: result.error || "Failed to create prize" });
    }

    const prize = result.prize;

    return res.status(201).json({
      success: true,
      prize: {
        id: prize.id,
        drawId: prize.draw_id,
        title: prize.title,
        description: prize.description,
        prizeType: prize.prize_type,
        awardType: prize.award_type,
        prizeValueAmount: prize.prize_value_amount,
        currencyCode: prize.currency_code,
        numberOfWinners: prize.number_of_winners,
        status: prize.status,
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}