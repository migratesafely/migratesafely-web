import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

interface PublicWinner {
  drawCountry: string;
  drawDate: string;
  prizeTitle: string;
  winnerDisplayName: string;
  awardType: string;
}

interface PublicWinnersResponse {
  success: boolean;
  winners?: PublicWinner[];
  error?: string;
}

/**
 * Public Winners API
 * 
 * Returns winners for COMPLETED draws only with masked/safe information
 * No sensitive data exposed (no emails, user IDs, claim details)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicWinnersResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    // Fetch completed draws with their winners
    const { data: draws, error: drawsError } = await supabase
      .from("prize_draws")
      .select(`
        id,
        country_code,
        draw_date,
        announcement_status
      `)
      .eq("announcement_status", "COMPLETED")
      .order("draw_date", { ascending: false });

    if (drawsError) {
      console.error("Error fetching completed draws:", drawsError);
      return res.status(500).json({ success: false, error: "Failed to fetch draws" });
    }

    if (!draws || draws.length === 0) {
      return res.status(200).json({ success: true, winners: [] });
    }

    const allWinners: PublicWinner[] = [];

    // For each completed draw, fetch winners
    for (const draw of draws) {
      const { data: winners, error: winnersError } = await supabase
        .from("prize_draw_winners")
        .select(`
          id,
          winner_user_id,
          prize_id,
          award_type,
          prize_draw_prizes!inner (
            title
          ),
          profiles!inner (
            full_name,
            country_code
          )
        `)
        .eq("draw_id", draw.id)
        .eq("claim_status", "CLAIMED");

      if (winnersError) {
        console.error(`Error fetching winners for draw ${draw.id}:`, winnersError);
        continue; // Skip this draw, continue with others
      }

      if (!winners || winners.length === 0) {
        continue; // No claimed winners for this draw
      }

      // Transform each winner to public-safe format
      for (const winner of winners) {
        const profile = Array.isArray(winner.profiles) ? winner.profiles[0] : winner.profiles;
        const prize = Array.isArray(winner.prize_draw_prizes) ? winner.prize_draw_prizes[0] : winner.prize_draw_prizes;

        // Mask winner name for privacy
        const displayName = maskWinnerName(
          profile?.full_name || null,
          profile?.country_code || draw.country_code
        );

        allWinners.push({
          drawCountry: draw.country_code,
          drawDate: draw.draw_date,
          prizeTitle: prize?.title || "Prize",
          winnerDisplayName: displayName,
          awardType: winner.award_type,
        });
      }
    }

    return res.status(200).json({ success: true, winners: allWinners });
  } catch (error) {
    console.error("Error in public winners API:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

/**
 * Mask winner name for privacy
 * Shows first name + last initial (e.g., "Rahim A.")
 * If no name available, shows generic "Member from [Country]"
 */
function maskWinnerName(fullName: string | null, countryCode: string): string {
  if (!fullName || fullName.trim() === "") {
    return `Member from ${countryCode}`;
  }

  const nameParts = fullName.trim().split(" ");

  if (nameParts.length === 1) {
    // Only first name available
    return nameParts[0];
  }

  // First name + last initial
  const firstName = nameParts[0];
  const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();

  return `${firstName} ${lastInitial}.`;
}