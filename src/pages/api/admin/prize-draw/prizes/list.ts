import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { prizeDrawService } from "@/services/prizeDrawService";

interface Prize {
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
  createdAt: string;
}

interface ListPrizesResponse {
  success: boolean;
  prizes?: Prize[];
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ListPrizesResponse>) {
  if (req.method !== "GET") {
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

    // Get drawId from query
    const { drawId } = req.query;

    if (!drawId || typeof drawId !== "string") {
      return res.status(400).json({ success: false, error: "Missing required query parameter: drawId" });
    }

    // Call service to list prizes
    const result = await prizeDrawService.listPrizesForDraw(drawId);

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error || "Failed to fetch prizes" });
    }

    // Map prizes to response format
    const prizes: Prize[] = (result.prizes || []).map((p: any) => ({
      id: p.id,
      drawId: p.draw_id,
      title: p.title,
      description: p.description,
      prizeType: p.prize_type,
      awardType: p.award_type,
      prizeValueAmount: p.prize_value_amount,
      currencyCode: p.currency_code,
      numberOfWinners: p.number_of_winners,
      status: p.status,
      createdAt: p.created_at,
    }));

    return res.status(200).json({
      success: true,
      prizes,
    });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}