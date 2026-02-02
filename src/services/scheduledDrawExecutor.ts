import { supabase } from "@/integrations/supabase/client";

/**
 * Scheduled Draw Executor Service
 * Provides monitoring and manual execution capabilities for prize draws
 * 
 * NOTE: Automated execution happens via Edge Function (execute-scheduled-draws)
 * This service provides admin tools for monitoring and manual intervention
 */

export interface DrawExecutionStatus {
  drawId: string;
  drawName: string;
  status: string;
  scheduledTime: string;
  executedAt?: string;
  isDue: boolean;
  isOverdue: boolean;
}

/**
 * Get all draws that are due for execution
 */
export async function getDueDraws(): Promise<DrawExecutionStatus[]> {
  try {
    const { data: draws, error } = await supabase
      .from("prize_draws")
      .select("id, draw_name, draw_date, draw_time, status, executed_at")
      .eq("status", "active")
      .is("executed_at", null)
      .order("draw_date", { ascending: true })
      .order("draw_time", { ascending: true });

    if (error) throw error;

    const now = new Date();
    
    return (draws || []).map(draw => {
      const scheduledTime = new Date(`${draw.draw_date}T${draw.draw_time}`);
      const isDue = now >= scheduledTime;
      const isOverdue = isDue && now.getTime() - scheduledTime.getTime() > 60 * 60 * 1000; // >1 hour late

      return {
        drawId: draw.id,
        drawName: draw.draw_name || `Draw on ${draw.draw_date}`,
        status: draw.status,
        scheduledTime: scheduledTime.toISOString(),
        executedAt: draw.executed_at || undefined,
        isDue,
        isOverdue
      };
    });
  } catch (error) {
    console.error("Error getting due draws:", error);
    return [];
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

    const checkResult = safetyCheck as any;
    if (!checkResult?.safe) {
      return { success: false, error: checkResult?.error || "Draw execution not safe" };
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

/**
 * Check if Edge Function is responsive
 */
export async function healthCheckExecutor(): Promise<{
  healthy: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase.functions.invoke(
      "execute-scheduled-draws",
      { body: { healthCheck: true } }
    );

    if (error) {
      return { healthy: false, error: error.message };
    }

    return { healthy: true };
  } catch (error: any) {
    return { healthy: false, error: error.message };
  }
}

/**
 * Get execution history
 */
export async function getExecutionHistory(limit: number = 20): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("prize_draws")
      .select("id, draw_name, draw_date, draw_time, status, executed_at, leftover_amount")
      .not("executed_at", "is", null)
      .order("executed_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error getting execution history:", error);
    return [];
  }
}