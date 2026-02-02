import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Get due draws
    // Logic: Active draws, not yet executed, where draw time has passed
    // Note: In production, we'd be more precise with timezones. 
    // Here we fetch active draws and filter in code for safety.
    const { data: draws, error: fetchError } = await supabaseClient
      .from("prize_draws")
      .select("*")
      .eq("status", "active")
      .is("executed_at", null);

    if (fetchError) throw fetchError;

    const now = new Date();
    const executedDraws = [];
    const errors = [];

    for (const draw of draws || []) {
      // Check if draw time has passed
      // draw_date is YYYY-MM-DD, draw_time is HH:MM:SS
      const drawDateTimeStr = `${draw.draw_date}T${draw.draw_time}`;
      const drawDateTime = new Date(drawDateTimeStr);
      
      // If draw time hasn't passed, skip
      if (now < drawDateTime) continue;

      console.log(`Executing draw: ${draw.id} (${draw.draw_name})`);

      // 2. Lock draw (Idempotency / Safety)
      const { error: lockError } = await supabaseClient
        .from("prize_draws")
        .update({ status: "executing" })
        .eq("id", draw.id)
        .eq("status", "active"); // Optimistic locking

      if (lockError) {
        console.error(`Failed to lock draw ${draw.id}:`, lockError);
        continue; // Likely picked up by another worker
      }

      try {
        // 3. Execute Winner Selection (This handles sub-pool deduction internally)
        // We use the existing RPC or service logic. 
        // Since we are in Edge Function, we might call another function or use direct DB calls.
        // For robustness, we'll use the 'run_winner_selection' RPC if it exists, 
        // or recreate the logic safely here.
        // Based on A5, we have 'manuallyExecuteDraw' in service which calls 'execute-scheduled-draws'.
        // So this IS the execution logic.

        // A. Select Winners
        // We'll call the `select_random_winners` RPC which encapsulates the selection logic
        const { data: selectionResult, error: selectionError } = await supabaseClient
          .rpc("select_random_winners", { p_draw_id: draw.id });

        if (selectionError) throw selectionError;

        // B. Generate Report
        const { error: reportError } = await supabaseClient
          .rpc("generate_draw_report", { 
            p_draw_id: draw.id,
            p_auto_executed: true 
          });

        if (reportError) throw reportError;

        // C. Calculate Leftover & Roll Forward
        // (Handled by generate_draw_report logic or implicit update)
        
        // D. Queue Notifications
        const { error: notifError } = await supabaseClient
          .rpc("queue_winner_notifications", { p_draw_id: draw.id });
          
        if (notifError) console.error("Notification queue error:", notifError); // Don't fail the draw

        // E. Mark Completed
        const { error: completeError } = await supabaseClient
          .from("prize_draws")
          .update({ 
            status: "completed",
            executed_at: new Date().toISOString()
          })
          .eq("id", draw.id);

        if (completeError) throw completeError;

        executedDraws.push({
          id: draw.id,
          name: draw.draw_name,
          winners: selectionResult?.winners_count || 0
        });

      } catch (err: any) {
        console.error(`Error executing draw ${draw.id}:`, err);
        errors.push({ id: draw.id, error: err.message });

        // Mark as failed so admin can intervene
        await supabaseClient
          .from("prize_draws")
          .update({ status: "failed" }) // Ensure 'failed' is in enum or revert to 'active'
          .eq("id", draw.id);
          
        // Notify admin of failure
        await supabaseClient.from("prize_notification_queue").insert({
            draw_id: draw.id,
            recipient_user_id: draw.created_by, // Fallback to creator or super admin
            notification_type: "admin_summary", // Reusing type
            template_data: { error: err.message, status: "FAILED" },
            status: "pending"
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        executed: executedDraws, 
        errors: errors,
        timestamp: new Date().toISOString() 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});