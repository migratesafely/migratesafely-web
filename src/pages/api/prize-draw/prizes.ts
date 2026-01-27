import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { prizeDrawService } from "@/services/prizeDrawService";

interface MemberPrize {
  id: string;
  title: string;
  description: string | null;
  prizeType: string;
  awardType: string;
  prizeValueAmount: number;
  currencyCode: string;
  numberOfWinners: number;
}

interface MemberPrizesResponse {
  success: boolean;
  prizes?: MemberPrize[];
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<MemberPrizesResponse>) {
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

    const userId = user.id;

    // Check active membership
    const { data: membershipData, error: membershipError } = await supabase
      .from("memberships")
      .select("status")
      .eq("user_id", userId)
      .single();

    if (membershipError || !membershipData || membershipData.status !== "active") {
      return res.status(403).json({ success: false, error: "Active membership required" });
    }

    // Fetch user's country_code from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("country_code")
      .eq("id", userId)
      .single();

    if (profileError || !profile || !profile.country_code) {
      return res.status(400).json({ success: false, error: "User country not found" });
    }

    const countryCode = profile.country_code;

    // Call service to get active prizes for member's draw
    const result = await prizeDrawService.listActivePrizesForMemberDraw(countryCode);

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error || "Failed to fetch prizes" });
    }

    // Map prizes to response format (excluding admin fields)
    const prizes: MemberPrize[] = (result.prizes || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      prizeType: p.prize_type,
      awardType: p.award_type,
      prizeValueAmount: p.prize_value_amount,
      currencyCode: p.currency_code,
      numberOfWinners: p.number_of_winners,
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