import { supabase } from "@/integrations/supabase/client";
import { randomInt } from "crypto";

interface EligibleEntry {
  userId: string;
  entryId: string;
  membershipId: string;
}

interface WinnerSelectionResult {
  success: boolean;
  winnersCreated?: number;
  error?: string;
}

export const prizeDrawWinnerService = {
  /**
   * List eligible entries for a draw
   * Rules:
   * - Active membership
   * - Has entry for this draw
   * - Not banned/suspended
   */
  async listEligibleEntries(drawId: string): Promise<{ success: boolean; entries?: EligibleEntry[]; error?: string }> {
    try {
      const { data: entries, error: entriesError } = await supabase
        .from("prize_draw_entries")
        .select(`
          id,
          user_id,
          membership_id,
          memberships!inner (
            status,
            end_date
          ),
          profiles!inner (
            role
          )
        `)
        .eq("prize_draw_id", drawId);

      if (entriesError) {
        console.error("Error fetching entries:", entriesError);
        return { success: false, error: "Failed to fetch entries" };
      }

      if (!entries || entries.length === 0) {
        return { success: true, entries: [] };
      }

      const now = new Date();

      const eligibleEntries: EligibleEntry[] = entries
        .filter((entry: any) => {
          const membership = entry.memberships;
          const profile = entry.profiles;

          if (!membership || !profile) {
            return false;
          }

          if (membership.status !== "active") {
            return false;
          }

          const endDate = new Date(membership.end_date);
          if (endDate < now) {
            return false;
          }

          if (profile.role === "banned" || profile.role === "suspended") {
            return false;
          }

          return true;
        })
        .map((entry: any) => ({
          userId: entry.user_id,
          entryId: entry.id,
          membershipId: entry.membership_id,
        }));

      return { success: true, entries: eligibleEntries };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to list eligible entries" };
    }
  },

  /**
   * Select random winners using cryptographically secure randomness
   * Prevents duplicate winners within same prize
   */
  async selectRandomWinners(
    drawId: string,
    prizeId: string,
    numberOfWinners: number
  ): Promise<{ success: boolean; winnerUserIds?: string[]; error?: string }> {
    try {
      const eligibleResult = await this.listEligibleEntries(drawId);

      if (!eligibleResult.success || !eligibleResult.entries) {
        return { success: false, error: eligibleResult.error || "Failed to get eligible entries" };
      }

      let availableEntries = eligibleResult.entries;

      if (availableEntries.length === 0) {
        return { success: false, error: "No eligible entries found" };
      }

      const { data: existingWinners, error: winnersError } = await supabase
        .from("prize_draw_winners")
        .select("winner_user_id")
        .eq("draw_id", drawId);

      if (winnersError) {
        console.error("Error fetching existing winners:", winnersError);
      }

      const alreadyWonUserIds = new Set(existingWinners?.map((w) => w.winner_user_id) || []);

      const notYetWonEntries = availableEntries.filter((entry) => !alreadyWonUserIds.has(entry.userId));

      if (notYetWonEntries.length > 0) {
        availableEntries = notYetWonEntries;
      }

      const actualNumberOfWinners = Math.min(numberOfWinners, availableEntries.length);

      const selectedUserIds: string[] = [];
      const selectedIndices = new Set<number>();

      while (selectedUserIds.length < actualNumberOfWinners) {
        const randomIndex = randomInt(0, availableEntries.length);

        if (!selectedIndices.has(randomIndex)) {
          selectedIndices.add(randomIndex);
          selectedUserIds.push(availableEntries[randomIndex].userId);
        }
      }

      return { success: true, winnerUserIds: selectedUserIds };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to select random winners" };
    }
  },

  /**
   * Save winners to prize_draw_winners table
   * Sets claim_status = "PENDING"
   * Sets claim_deadline_at = now + 14 days
   * Sets payout_status = "PENDING"
   */
  async saveWinners(
    drawId: string,
    prizeId: string,
    winnerUserIds: string[],
    awardType: string,
    selectedByAdminId?: string
  ): Promise<WinnerSelectionResult> {
    try {
      if (winnerUserIds.length === 0) {
        return { success: true, winnersCreated: 0 };
      }

      const now = new Date();
      const claimDeadline = new Date(now);
      claimDeadline.setDate(claimDeadline.getDate() + 14);

      const winnersToInsert = winnerUserIds.map((userId) => ({
        draw_id: drawId,
        prize_id: prizeId,
        winner_user_id: userId,
        award_type: awardType,
        selected_at: now.toISOString(),
        claim_status: "PENDING",
        claim_deadline_at: claimDeadline.toISOString(),
        payout_status: "PENDING",
        selected_by_admin_id: selectedByAdminId || null,
      }));

      const { data: insertedWinners, error: insertError } = await supabase
        .from("prize_draw_winners")
        .insert(winnersToInsert)
        .select();

      if (insertError) {
        console.error("Error inserting winners:", insertError);
        return { success: false, error: "Failed to save winners" };
      }

      return { success: true, winnersCreated: insertedWinners?.length || 0 };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to save winners" };
    }
  },

  /**
   * Run winner selection for all RANDOM_DRAW prizes in a draw
   */
  async runWinnerSelectionForDraw(drawId: string, adminId: string): Promise<WinnerSelectionResult> {
    try {
      // Cast supabase to any to avoid TS2589 (excessively deep type instantiation)
      const { data: prizes, error: prizesError } = await (supabase as any)
        .from("prize_draw_prizes")
        .select("id, award_type, number_of_winners, status")
        .eq("draw_id", drawId)
        .eq("status", "active");

      if (prizesError) {
        console.error("Error fetching prizes:", prizesError);
        return { success: false, error: "Failed to fetch prizes" };
      }

      if (!prizes || prizes.length === 0) {
        return { success: false, error: "No active prizes found for this draw" };
      }

      const randomDrawPrizes = prizes.filter((p: any) => p.award_type === "RANDOM_DRAW");

      if (randomDrawPrizes.length === 0) {
        return { success: true, winnersCreated: 0 };
      }

      let totalWinnersCreated = 0;

      for (const prize of randomDrawPrizes) {
        const selectionResult = await this.selectRandomWinners(drawId, prize.id, prize.number_of_winners);

        if (!selectionResult.success || !selectionResult.winnerUserIds) {
          console.error(`Failed to select winners for prize ${prize.id}:`, selectionResult.error);
          continue;
        }

        const saveResult = await this.saveWinners(drawId, prize.id, selectionResult.winnerUserIds, prize.award_type, adminId);

        if (!saveResult.success) {
          console.error(`Failed to save winners for prize ${prize.id}:`, saveResult.error);
          continue;
        }

        totalWinnersCreated += saveResult.winnersCreated || 0;
      }

      return { success: true, winnersCreated: totalWinnersCreated };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to run winner selection" };
    }
  },

  /**
   * Expire unclaimed prizes past deadline and redraw replacements for RANDOM_DRAW prizes
   */
  async expireAndRedraw(drawId: string): Promise<{
    success: boolean;
    numberExpired?: number;
    numberRedrawn?: number;
    error?: string;
  }> {
    try {
      const now = new Date();

      // Find all winners with PENDING claim status and expired deadline
      const { data: expiredWinners, error: fetchError } = await (supabase as any)
        .from("prize_draw_winners")
        .select(`
          id,
          draw_id,
          prize_id,
          winner_user_id,
          award_type,
          claim_deadline_at
        `)
        .eq("draw_id", drawId)
        .eq("claim_status", "PENDING")
        .lt("claim_deadline_at", now.toISOString());

      if (fetchError) {
        console.error("Error fetching expired winners:", fetchError);
        return { success: false, error: "Failed to fetch expired winners" };
      }

      if (!expiredWinners || expiredWinners.length === 0) {
        return { success: true, numberExpired: 0, numberRedrawn: 0 };
      }

      // Mark all expired winners as EXPIRED
      const expiredWinnerIds = expiredWinners.map((w: any) => w.id);
      const { error: updateError } = await supabase
        .from("prize_draw_winners")
        .update({ claim_status: "EXPIRED" })
        .in("id", expiredWinnerIds);

      if (updateError) {
        console.error("Error marking winners as expired:", updateError);
        return { success: false, error: "Failed to expire winners" };
      }

      const numberExpired = expiredWinners.length;
      let numberRedrawn = 0;

      // Redraw only for RANDOM_DRAW prizes
      const randomDrawExpired = expiredWinners.filter((w: any) => w.award_type === "RANDOM_DRAW");

      for (const expiredWinner of randomDrawExpired) {
        // Get all existing winners for this prize
        const { data: existingWinners, error: existingError } = await supabase
          .from("prize_draw_winners")
          .select("winner_user_id")
          .eq("draw_id", drawId)
          .eq("prize_id", expiredWinner.prize_id);

        if (existingError) {
          console.error("Error fetching existing winners:", existingError);
          continue;
        }

        const existingWinnerIds = existingWinners?.map((w) => w.winner_user_id) || [];

        // Get all eligible entries excluding existing winners
        let query = supabase
          .from("prize_draw_entries")
          .select(`
            id,
            user_id,
            membership_id,
            memberships!inner (
              status,
              end_date
            )
          `)
          .eq("prize_draw_id", drawId)
          .eq("memberships.status", "active")
          .gte("memberships.end_date", now.toISOString());

        if (existingWinnerIds.length > 0) {
          query = query.not("user_id", "in", `(${existingWinnerIds.join(",")})`);
        }

        const { data: eligibleEntries, error: entriesError } = await query;

        if (entriesError) {
          console.error("Error fetching eligible entries:", entriesError);
          continue;
        }

        if (!eligibleEntries || eligibleEntries.length === 0) {
          console.log(`No eligible entries for redraw for prize ${expiredWinner.prize_id}`);
          continue;
        }

        // Select replacement winner using crypto secure randomness
        const randomBytes = new Uint32Array(1);
        crypto.getRandomValues(randomBytes);
        const randomIndex = randomBytes[0] % eligibleEntries.length;
        const replacementEntry = eligibleEntries[randomIndex];

        // Set new claim deadline (14 days from now)
        const claimDeadline = new Date(now);
        claimDeadline.setDate(claimDeadline.getDate() + 14);

        // Insert new winner record
        const { error: insertError } = await supabase
          .from("prize_draw_winners")
          .insert({
            draw_id: drawId,
            prize_id: expiredWinner.prize_id,
            winner_user_id: replacementEntry.user_id,
            membership_id: replacementEntry.membership_id,
            award_type: "RANDOM_DRAW",
            selected_at: now.toISOString(),
            claim_status: "PENDING",
            claim_deadline_at: claimDeadline.toISOString(),
            payout_status: "PENDING",
          });

        if (insertError) {
          console.error("Error inserting replacement winner:", insertError);
          continue;
        }

        numberRedrawn++;
      }

      return { success: true, numberExpired, numberRedrawn };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to expire and redraw" };
    }
  },
};