import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { agentPermissionsService } from "@/services/agentPermissionsService";

interface Winner {
  id: string;
  winnerUserId: string;
  winnerName: string | null;
  winnerEmail: string | null;
  selectedAt: string;
  claimStatus: string;
  payoutStatus: string;
  awardType: string;
}

interface PrizeWithWinners {
  prizeId: string;
  prizeTitle: string;
  prizeType: string;
  awardType: string;
  prizeValueAmount: number;
  currencyCode: string;
  numberOfWinners: number;
  winners: Winner[];
}

interface WinnersResponse {
  success: boolean;
  prizeWinners?: PrizeWithWinners[];
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<WinnersResponse>) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Require admin role
  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  try {
    // Authority: Chairman only for administrative winner view
    const isChairman = await agentPermissionsService.isChairman(auth.userId);
    
    if (!isChairman) {
      return res.status(403).json({ success: false, error: "Forbidden: Chairman access required" });
    }

    const { drawId } = req.query;

    if (!drawId || typeof drawId !== "string") {
      return res.status(400).json({ success: false, error: "Missing required query parameter: drawId" });
    }

    // Cast to any to avoid TS2589 (excessively deep type instantiation)
    const { data: prizes, error: prizesError } = await (supabase as any)
      .from("prize_draw_prizes")
      .select("id, title, prize_type, award_type, prize_value_amount, currency_code, number_of_winners")
      .eq("draw_id", drawId)
      .eq("status", "active")
      .order("award_type", { ascending: false })
      .order("prize_value_amount", { ascending: false });

    if (prizesError) {
      console.error("Error fetching prizes:", prizesError);
      return res.status(500).json({ success: false, error: "Failed to fetch prizes" });
    }

    if (!prizes || prizes.length === 0) {
      return res.status(200).json({ success: true, prizeWinners: [] });
    }

    const prizeWinnersData: PrizeWithWinners[] = [];

    for (const prize of prizes) {
      // Cast to any to avoid TS2589 (excessively deep type instantiation)
      const { data: winners, error: winnersError } = await (supabase as any)
        .from("prize_draw_winners")
        .select(`
          id,
          winner_user_id,
          selected_at,
          claim_status,
          payout_status,
          award_type,
          profiles!prize_draw_winners_winner_user_id_fkey (
            full_name,
            email
          )
        `)
        .eq("draw_id", drawId)
        .eq("prize_id", prize.id)
        .order("selected_at", { ascending: true });

      if (winnersError) {
        console.error(`Error fetching winners for prize ${prize.id}:`, winnersError);
        continue;
      }

      const winnersFormatted: Winner[] = (winners || []).map((w: any) => ({
        id: w.id,
        winnerUserId: w.winner_user_id,
        winnerName: w.profiles?.full_name || null,
        winnerEmail: w.profiles?.email || null,
        selectedAt: w.selected_at,
        claimStatus: w.claim_status || "PENDING",
        payoutStatus: w.payout_status || "PENDING",
        awardType: w.award_type,
      }));

      prizeWinnersData.push({
        prizeId: prize.id,
        prizeTitle: prize.title,
        prizeType: prize.prize_type,
        awardType: prize.award_type,
        prizeValueAmount: prize.prize_value_amount,
        currencyCode: prize.currency_code,
        numberOfWinners: prize.number_of_winners,
        winners: winnersFormatted,
      });
    }

    return res.status(200).json({
      success: true,
      prizeWinners: prizeWinnersData,
    });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}