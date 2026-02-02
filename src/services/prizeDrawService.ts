import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PrizeDraw = Database["public"]["Tables"]["prize_draws"]["Row"];

type PrizeDrawPrizeLite = {
  id: string;
  draw_id: string;
  title: string;
  description: string | null;
  prize_type: string;
  award_type: string;
  prize_value_amount: number;
  currency_code: string;
  number_of_winners: number;
  status: string;
  created_at: string;
};

interface ForecastResult {
  forecastMemberCount: number;
  currentMemberCount: number;
  growthRate: number;
}

interface PrizePoolEstimate {
  amount: number;
  currencyCode: string;
  percent: number;
  forecastMemberCount: number;
}

/**
 * A5: Deduct prize amount from sub-pool (Random or Community)
 */
export async function deductPrizeFromSubPool(
  prizeId: string,
  subPoolType: "random" | "community",
  prizeAmount: number,
  countryCode: string = "BD"
) {
  try {
    const { data, error } = await supabase.rpc("deduct_prize_from_sub_pool", {
      p_prize_id: prizeId,
      p_sub_pool_type: subPoolType,
      p_prize_amount: prizeAmount,
      p_country_code: countryCode
    });

    if (error) throw error;

    const result = data as any;
    
    if (!result.success) {
      throw new Error(result.error || "Failed to deduct from sub-pool");
    }

    return {
      success: true,
      previousBalance: result.previous_balance,
      deductedAmount: result.deducted_amount,
      newBalance: result.new_balance,
      subPoolType: result.sub_pool_type
    };
  } catch (error: any) {
    console.error("Error deducting from sub-pool:", error);
    throw new Error(error.message || "Failed to deduct prize from sub-pool");
  }
}

/**
 * A5: Check if draw is within fairness lock period (1 hour before draw time)
 */
export async function checkDrawFairnessLock(drawId: string) {
  try {
    const { data: draw, error } = await supabase
      .from("prize_draws")
      .select("draw_date, draw_time, entry_cutoff_time, fairness_locked, status")
      .eq("id", drawId)
      .single();

    if (error) throw error;
    if (!draw) throw new Error("Prize draw not found");

    const now = new Date();
    const cutoffTime = draw.entry_cutoff_time ? new Date(draw.entry_cutoff_time) : null;

    return {
      isLocked: draw.fairness_locked || (cutoffTime && now >= cutoffTime) || false,
      cutoffTime: cutoffTime,
      status: draw.status,
      canEnter: !draw.fairness_locked && (!cutoffTime || now < cutoffTime) && draw.status === "active"
    };
  } catch (error: any) {
    console.error("Error checking fairness lock:", error);
    throw error;
  }
}

/**
 * A5: Generate immutable draw report after execution
 */
export async function generateDrawReport(
  drawId: string,
  executedBy?: string,
  autoExecuted: boolean = false
) {
  try {
    const { data, error } = await supabase.rpc("generate_draw_report", {
      p_draw_id: drawId,
      p_executed_by: executedBy || null,
      p_auto_executed: autoExecuted
    });

    if (error) throw error;

    const result = data as any;
    
    if (!result.success) {
      throw new Error(result.error || "Failed to generate draw report");
    }

    return {
      success: true,
      reportId: result.report_id,
      totalPrizeAmount: result.total_prize_amount,
      totalAwarded: result.total_awarded,
      leftoverAmount: result.leftover_amount,
      totalWinners: result.total_winners,
      reportSignature: result.report_signature
    };
  } catch (error: any) {
    console.error("Error generating draw report:", error);
    throw new Error(error.message || "Failed to generate draw report");
  }
}

/**
 * A5: Queue automated notifications for winners
 */
export async function queueWinnerNotifications(drawId: string) {
  try {
    const { data, error } = await supabase.rpc("queue_winner_notifications", {
      p_draw_id: drawId
    });

    if (error) throw error;

    const result = data as any;
    
    if (!result.success) {
      throw new Error(result.error || "Failed to queue notifications");
    }

    return {
      success: true,
      notificationsQueued: result.notifications_queued
    };
  } catch (error: any) {
    console.error("Error queueing notifications:", error);
    throw new Error(error.message || "Failed to queue winner notifications");
  }
}

/**
 * A5: Get draw report by ID (admin only)
 */
export async function getDrawReport(drawId: string) {
  try {
    const { data, error } = await supabase
      .from("prize_draw_reports")
      .select("*")
      .eq("draw_id", drawId)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error("Error fetching draw report:", error);
    throw error;
  }
}

/**
 * A5: Get all draw reports (admin only)
 */
export async function getAllDrawReports(countryCode: string = "BD", limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from("prize_draw_reports")
      .select("*")
      .eq("country_code", countryCode)
      .order("execution_timestamp", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error("Error fetching draw reports:", error);
    throw error;
  }
}

/**
 * Manually trigger draw execution (admin fallback)
 * Used when automatic execution fails or for testing
 */
export async function manuallyExecuteDraw(drawId: string): Promise<{
  success: boolean;
  error?: string;
  winnersSelected?: number;
  totalAwarded?: number;
}> {
  try {
    // Validate execution safety
    const { data: safetyCheck, error: safetyError } = await supabase.rpc(
      "validate_draw_execution_safety",
      { p_draw_id: drawId }
    );

    if (safetyError) {
      return { success: false, error: safetyError.message };
    }

    const checkResult = safetyCheck as { safe: boolean; error?: string };
    if (!checkResult.safe) {
      return { success: false, error: checkResult.error };
    }

    // Call Edge Function to execute draw
    const { data, error } = await supabase.functions.invoke(
      "execute-scheduled-draws",
      {
        body: { manualDrawId: drawId }
      }
    );

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      winnersSelected: data?.winnersSelected || 0,
      totalAwarded: data?.totalAwarded || 0
    };
  } catch (error: any) {
    console.error("Error manually executing draw:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get draws ready for execution (monitoring)
 */
export async function getDrawsReadyForExecution(): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc("get_draws_ready_for_execution");

    if (error) {
      console.error("Error getting draws ready for execution:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error getting draws ready for execution:", error);
    return [];
  }
}

/**
 * Get execution status for a draw
 */
export async function getDrawExecutionStatus(drawId: string): Promise<{
  status: string;
  executedAt?: string;
  winnersSelected?: number;
  totalAwarded?: number;
  leftoverAmount?: number;
}> {
  try {
    const { data: draw, error } = await supabase
      .from("prize_draws")
      .select("status, executed_at, leftover_amount")
      .eq("id", drawId)
      .single();

    if (error) throw error;

    // Get winner count
    const { data: winners, error: winnersError } = await supabase
      .from("prize_draw_winners")
      .select("id, prize:prize_draw_prizes!prize_draw_winners_prize_id_fkey(prize_value_amount)")
      .eq("draw_id", drawId);

    if (winnersError) throw winnersError;

    const winnersSelected = winners?.length || 0;
    
    // Calculate total awarded from prize amounts
    const totalAwarded = winners?.reduce((sum, w: any) => {
      const prizeAmount = w.prize?.prize_value_amount || 0;
      return sum + prizeAmount;
    }, 0) || 0;

    return {
      status: draw.status,
      executedAt: draw.executed_at || undefined,
      winnersSelected,
      totalAwarded,
      leftoverAmount: draw.leftover_amount || undefined
    };
  } catch (error: any) {
    console.error("Error getting draw execution status:", error);
    return { status: "unknown" };
  }
}

export const prizeDrawService = {
  /**
   * Get active or upcoming prize draw for a country
   */
  async getActiveDraw(countryCode: string): Promise<{ success: boolean; draw?: PrizeDraw; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("prize_draws")
        .select("*")
        .eq("country_code", countryCode)
        .in("announcement_status", ["COMING_SOON", "ANNOUNCED"])
        .order("draw_date", { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching active draw:", error);
        return { success: false, error: "Failed to fetch draw" };
      }

      return { success: true, draw: data || undefined };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to fetch draw" };
    }
  },

  /**
   * Calculate forecast member count based on current members and growth rate
   */
  async calculateForecastMemberCount(countryCode: string, drawDate: string): Promise<{ success: boolean; result?: ForecastResult; error?: string }> {
    try {
      const drawDateObj = new Date(drawDate);
      const today = new Date();
      const daysUntilDraw = Math.ceil((drawDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const { data: currentMembers, error: currentError } = await supabase
        .from("memberships")
        .select("user_id, profiles!inner(country_code)")
        .eq("status", "active")
        .eq("profiles.country_code", countryCode)
        .gte("end_date", today.toISOString());

      if (currentError) {
        console.error("Error counting current members:", currentError);
        return { success: false, error: "Failed to count members" };
      }

      const currentMemberCount = currentMembers?.length || 0;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: newMembers, error: newMembersError } = await supabase
        .from("memberships")
        .select("user_id, profiles!inner(country_code)")
        .eq("status", "active")
        .eq("profiles.country_code", countryCode)
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (newMembersError) {
        console.error("Error counting new members:", newMembersError);
        return { success: false, error: "Failed to count new members" };
      }

      const newMembers30Days = newMembers?.length || 0;

      const dailyGrowthRate = newMembers30Days / 30;
      const growthRate = dailyGrowthRate;

      const expectedGrowth = Math.max(0, daysUntilDraw) * dailyGrowthRate;
      const forecastMemberCount = Math.round(currentMemberCount + expectedGrowth);

      return {
        success: true,
        result: {
          forecastMemberCount,
          currentMemberCount,
          growthRate: Math.round(growthRate * 100) / 100,
        },
      };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to calculate forecast" };
    }
  },

  /**
   * Calculate estimated prize pool based on forecast and membership fee
   */
  async calculateEstimatedPrizePool(
    countryCode: string,
    drawDate: string,
    percent: number = 30
  ): Promise<{ success: boolean; estimate?: PrizePoolEstimate; error?: string }> {
    try {
      const { data: countrySettings, error: settingsError } = await supabase
        .from("country_settings")
        .select("membership_fee_amount, currency_code")
        .eq("country_code", countryCode)
        .single();

      if (settingsError || !countrySettings) {
        console.error("Error fetching country settings:", settingsError);
        return { success: false, error: "Failed to fetch country settings" };
      }

      const membershipFee = countrySettings.membership_fee_amount || 0;
      const currencyCode = countrySettings.currency_code || "BDT";

      const forecastResult = await this.calculateForecastMemberCount(countryCode, drawDate);

      if (!forecastResult.success || !forecastResult.result) {
        return { success: false, error: "Failed to calculate forecast" };
      }

      const { forecastMemberCount } = forecastResult.result;

      const totalRevenue = forecastMemberCount * membershipFee;
      const prizePoolAmount = Math.round((totalRevenue * percent) / 100);

      return {
        success: true,
        estimate: {
          amount: prizePoolAmount,
          currencyCode,
          percent,
          forecastMemberCount,
        },
      };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to calculate prize pool" };
    }
  },

  /**
   * Announce a draw and snapshot forecast data
   */
  async announceDraw(drawId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: draw, error: fetchError } = await supabase
        .from("prize_draws")
        .select("country_code, draw_date, estimated_prize_pool_percentage")
        .eq("id", drawId)
        .single();

      if (fetchError || !draw) {
        console.error("Error fetching draw:", fetchError);
        return { success: false, error: "Draw not found" };
      }

      const forecastResult = await this.calculateForecastMemberCount(draw.country_code, draw.draw_date);
      if (!forecastResult.success || !forecastResult.result) {
        return { success: false, error: "Failed to calculate forecast" };
      }

      const prizePoolResult = await this.calculateEstimatedPrizePool(
        draw.country_code,
        draw.draw_date,
        draw.estimated_prize_pool_percentage || 30
      );

      if (!prizePoolResult.success || !prizePoolResult.estimate) {
        return { success: false, error: "Failed to calculate prize pool" };
      }

      const { error: updateError } = await supabase
        .from("prize_draws")
        .update({
          announcement_status: "ANNOUNCED",
          announced_at: new Date().toISOString(),
          forecast_member_count: forecastResult.result.forecastMemberCount,
          estimated_prize_pool_amount: prizePoolResult.estimate.amount,
          estimated_prize_pool_currency: prizePoolResult.estimate.currencyCode,
        })
        .eq("id", drawId);

      if (updateError) {
        console.error("Error updating draw:", updateError);
        return { success: false, error: "Failed to announce draw" };
      }

      return { success: true };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to announce draw" };
    }
  },

  /**
   * Create a prize for a draw
   */
  async createPrize(
    drawId: string,
    title: string,
    prizeType: string,
    awardType: string,
    prizeValueAmount: number,
    currencyCode: string,
    numberOfWinners: number,
    description?: string
  ): Promise<{ success: boolean; prize?: any; error?: string }> {
    try {
      const { data: prize, error: insertError } = await supabase
        .from("prize_draw_prizes")
        .insert({
          draw_id: drawId,
          title,
          description: description || null,
          prize_type: prizeType,
          award_type: awardType,
          prize_value_amount: prizeValueAmount,
          currency_code: currencyCode,
          number_of_winners: numberOfWinners,
          status: "active",
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating prize:", insertError);
        return { success: false, error: "Failed to create prize" };
      }

      return { success: true, prize };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to create prize" };
    }
  },

  /**
   * List all prizes for a draw (admin view)
   */
  async listPrizesForDraw(drawId: string): Promise<{ success: boolean; prizes?: any[]; error?: string }> {
    try {
      // Cast to any to avoid TS2589 (excessively deep type instantiation)
      const query: any = supabase
        .from("prize_draw_prizes")
        .select("*")
        .eq("draw_id", drawId);
      
      const { data: prizes, error: fetchError } = await query.order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching prizes:", fetchError);
        return { success: false, error: "Failed to fetch prizes" };
      }

      return { success: true, prizes: prizes || [] };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to fetch prizes" };
    }
  },

  /**
   * List active prizes for member's current draw
   */
  async listActivePrizesForMemberDraw(countryCode: string): Promise<{ success: boolean; prizes?: any[]; error?: string }> {
    try {
      const drawResult = await this.getActiveDraw(countryCode);
      if (!drawResult.success || !drawResult.draw) {
        return { success: true, prizes: [] };
      }

      const drawId = drawResult.draw.id;

      // Cast to any to avoid TS2589 deep instantiation error
      const { data, error: fetchError } = await (supabase.from("prize_draw_prizes") as any)
        .select(`
          id,
          draw_id,
          title,
          description,
          prize_type,
          award_type,
          prize_value_amount,
          currency_code,
          number_of_winners,
          status,
          created_at
        `)
        .eq("draw_id", drawId)
        .eq("status", "active")
        .order("prize_value_amount", { ascending: false });

      if (fetchError) {
        console.error("Error fetching prizes:", fetchError);
        return { success: false, error: "Failed to fetch prizes" };
      }

      return { success: true, prizes: data || [] };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to fetch prizes" };
    }
  },

  /**
   * Ensure user has an entry for their current announced draw
   */
  async ensureEntryForCurrentDraw(userId: string, countryCode: string): Promise<{ success: boolean; entered?: boolean; enteredAt?: string; error?: string }> {
    try {
      const drawResult = await this.getActiveDraw(countryCode);
      
      if (!drawResult.success || !drawResult.draw) {
        return { success: false, error: "No active draw found" };
      }

      const draw = drawResult.draw;

      if (draw.announcement_status !== "ANNOUNCED") {
        return { success: false, error: "Draw not announced yet" };
      }

      // Get user's active membership
      const { data: membership, error: membershipError } = await supabase
        .from("memberships")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "active")
        .single();

      if (membershipError || !membership) {
        return { success: false, error: "Active membership required" };
      }

      const { data: existingEntry, error: checkError } = await supabase
        .from("prize_draw_entries")
        .select("id, created_at")
        .eq("prize_draw_id", draw.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking entry:", checkError);
        return { success: false, error: "Failed to check entry" };
      }

      if (existingEntry) {
        return { 
          success: true, 
          entered: true, 
          enteredAt: existingEntry.created_at 
        };
      }

      const { data: newEntry, error: insertError } = await supabase
        .from("prize_draw_entries")
        .insert({
          prize_draw_id: draw.id,
          user_id: userId,
          membership_id: membership.id,
        })
        .select("id, created_at")
        .single();

      if (insertError) {
        console.error("Error creating entry:", insertError);
        return { success: false, error: "Failed to create entry" };
      }

      return { 
        success: true, 
        entered: true, 
        enteredAt: newEntry.created_at 
      };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to ensure entry" };
    }
  },

  /**
   * Get user's entry for their current announced draw
   */
  async getMyEntryForCurrentDraw(userId: string, countryCode: string): Promise<{ success: boolean; hasEntry?: boolean; enteredAt?: string; error?: string }> {
    try {
      const drawResult = await this.getActiveDraw(countryCode);
      
      if (!drawResult.success || !drawResult.draw) {
        return { success: true, hasEntry: false };
      }

      const draw = drawResult.draw;

      if (draw.announcement_status !== "ANNOUNCED") {
        return { success: true, hasEntry: false };
      }

      const { data: entry, error: fetchError } = await supabase
        .from("prize_draw_entries")
        .select("id, created_at")
        .eq("prize_draw_id", draw.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching entry:", fetchError);
        return { success: false, error: "Failed to fetch entry" };
      }

      if (!entry) {
        return { success: true, hasEntry: false };
      }

      return { 
        success: true, 
        hasEntry: true, 
        enteredAt: entry.created_at 
      };
    } catch (error) {
      console.error("Service error:", error);
      return { success: false, error: "Failed to fetch entry" };
    }
  },
};