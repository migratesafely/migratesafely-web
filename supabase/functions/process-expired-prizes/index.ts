import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting expired prize processing...");

    // Health check
    const body = await req.json().catch(() => ({}));
    if (body.healthCheck) {
      return new Response(
        JSON.stringify({ 
          status: "healthy", 
          timestamp: new Date().toISOString() 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Process expired prizes with proper rollover (Random → Random, Community → Community)
    const { data: result, error: processError } = await supabase.rpc(
      "process_expired_prizes_with_rollover"
    );

    if (processError) {
      console.error("Error processing expired prizes:", processError);
      throw processError;
    }

    console.log("Expired prizes processed successfully:", result);

    // Extract results
    const processedResult = result as {
      success: boolean;
      total_expired?: number;
      total_rollover_amount?: number;
      draws_affected?: string[];
      processed_at?: string;
      error?: string;
    };

    if (!processedResult.success) {
      throw new Error(processedResult.error || "Failed to process expired prizes");
    }

    // Log audit entry
    await supabase.from("audit_logs").insert({
      action: "process_expired_prizes_automated",
      target_type: "prize_draw_system",
      details: {
        total_expired: processedResult.total_expired || 0,
        total_rollover: processedResult.total_rollover_amount || 0,
        draws_affected: processedResult.draws_affected || [],
        timestamp: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        total_expired: processedResult.total_expired || 0,
        total_rollover_amount: processedResult.total_rollover_amount || 0,
        draws_affected: processedResult.draws_affected || [],
        processed_at: processedResult.processed_at || new Date().toISOString(),
        message: `Processed ${processedResult.total_expired || 0} expired prizes`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("Error processing expired prizes:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});