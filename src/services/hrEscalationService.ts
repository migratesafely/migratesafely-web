import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type HREscalation = Database["public"]["Tables"]["hr_escalations"]["Row"];
type EscalationHistory = Database["public"]["Tables"]["escalation_history"]["Row"];

export type EscalationType = 
  | "salary_not_received"
  | "contract_not_issued"
  | "final_settlement_delayed"
  | "bonus_not_applied"
  | "leave_approval_delayed"
  | "payment_dispute"
  | "other";

/**
 * Create a new HR escalation
 */
export async function createHREscalation(
  employeeId: string,
  type: EscalationType,
  description: string,
  raisedBy: "employee" | "hr" | "manager" | "system",
  raisedByUserId?: string
) {
  try {
    const { data: escalation, error } = await supabase
      .from("hr_escalations")
      .insert({
        employee_id: employeeId,
        escalation_type: type,
        description,
        raised_by: raisedBy,
        raised_by_user_id: raisedByUserId, // Added field to table def
        current_level: "hr",
        status: "open",
        priority: "normal"
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      escalation
    };
  } catch (error: any) {
    console.error("Error creating escalation:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get escalations for the current user/admin based on permissions
 */
export async function getEscalations(filters?: {
  status?: string;
  level?: string;
}) {
  try {
    let query = supabase
      .from("hr_escalations")
      .select(`
        *,
        employee:employees!hr_escalations_employee_id_fkey(
          full_name,
          employee_number,
          job_title,
          department
        )
      `)
      .order("created_at", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status as any);
    }
    
    if (filters?.level) {
      query = query.eq("current_level", filters.level as any);
    }

    const { data: escalations, error } = await query;

    if (error) throw error;

    return {
      success: true,
      escalations: escalations || []
    };
  } catch (error: any) {
    console.error("Error fetching escalations:", error);
    return {
      success: false,
      error: error.message,
      escalations: []
    };
  }
}

/**
 * Resolve or escalate an issue
 */
export async function processEscalation(
  escalationId: string,
  action: "resolve" | "escalate",
  processedBy: string,
  notes: string,
  nextLevel?: "department_head" | "general_manager" | "managing_director" | "chairman"
) {
  try {
    // Check permission first (using new RPC)
    const { data: permissionData } = await supabase.rpc("check_hr_permission", {
      p_admin_id: processedBy,
      p_permission_name: "escalation_management",
      p_action: "update"
    });

    const permission = permissionData as { has_permission: boolean; reason: string } | null;

    if (!permission?.has_permission) {
      return { success: false, error: permission?.reason || "Permission denied" };
    }

    if (action === "resolve") {
      const { data: escalation, error } = await supabase
        .from("hr_escalations")
        .update({
          status: "resolved",
          resolved_by: processedBy, // Assuming field exists or using generic admin field
          resolved_at: new Date().toISOString(),
          resolution_notes: notes
        })
        .eq("id", escalationId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, escalation };
    } else {
      // Escalate to next level
      const { data: current } = await supabase
        .from("hr_escalations")
        .select("current_level")
        .eq("id", escalationId)
        .single();
        
      if (!nextLevel) {
        // Auto-determine next level
        const levels = ["hr", "department_head", "general_manager", "managing_director", "chairman"];
        const currentIndex = levels.indexOf(current?.current_level || "hr");
        nextLevel = (levels[currentIndex + 1] || "chairman") as any;
      }

      const { data: escalation, error } = await supabase
        .from("hr_escalations")
        .update({
          current_level: nextLevel,
          status: "escalated",
          last_escalation_at: new Date().toISOString()
        })
        .eq("id", escalationId)
        .select()
        .single();

      if (error) throw error;

      // Log history
      await supabase.from("escalation_history").insert({
        escalation_id: escalationId,
        from_level: current?.current_level || "hr",
        to_level: nextLevel || "chairman",
        escalated_by: processedBy,
        escalation_reason: notes
      });

      return { success: true, escalation };
    }
  } catch (error: any) {
    console.error("Error processing escalation:", error);
    return {
      success: false,
      error: error.message
    };
  }
}