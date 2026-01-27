import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";

/**
 * AGENT APPROVAL AUDIT LOG ENDPOINT
 * 
 * READ-ONLY FEATURE
 * 
 * ACCESS CONTROL:
 * - ONLY super_admin and manager_admin can view agent approval audit logs
 * - worker_admin, staff, agents, members are BLOCKED
 * 
 * PURPOSE:
 * Provides complete traceability and accountability for all agent approvals/rejections
 * to ensure governance compliance and prevent corruption.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Require admin role
  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  try {
    // STRICT ACCESS CONTROL: Only super_admin and manager_admin
    if (!["super_admin", "manager_admin"].includes(auth.userRole)) {
      return res.status(403).json({ 
        error: "Forbidden: Agent approval audit logs are restricted to Admin and Super Admin roles only",
        governance_policy: "AUDIT_LOG_ACCESS_RESTRICTED"
      });
    }

    // Get query parameters
    const { 
      limit = "50", 
      offset = "0",
      action_filter,
      date_from,
      date_to,
      admin_id
    } = req.query;

    // Build query for agent approval/rejection actions using the generic audit_logs table
    // We filter specifically for agent approval related actions
    let query = supabase
      .from("audit_logs")
      .select(`
        *,
        actor:profiles!audit_logs_user_id_fkey(id, full_name, email, role),
        target:profiles!audit_logs_record_id_fkey(id, full_name, email, role, agent_status)
      `)
      .in("action", [
        "AGENT_APPROVED",
        "AGENT_REJECTED",
        "AGENT_SUSPENDED",
        "AGENT_REINSTATED",
        "AGENT_APPROVE_ATTEMPT_DENIED",
        "AGENT_REJECT_ATTEMPT_DENIED"
      ])
      .order("created_at", { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    // Apply filters
    if (action_filter) {
      query = query.eq("action", String(action_filter));
    }

    if (date_from) {
      query = query.gte("created_at", String(date_from));
    }

    if (date_to) {
      query = query.lte("created_at", String(date_to));
    }

    if (admin_id) {
      query = query.eq("user_id", String(admin_id)); // Changed from actor_id to user_id as per schema
    }

    const { data: rawLogs, error } = await query;

    if (error) {
      console.error("Error fetching agent approval audit logs:", error);
      return res.status(500).json({ error: "Failed to fetch audit logs" });
    }

    // Map the raw logs to the structure expected by the frontend
    // The audit_logs table uses 'user_id' for actor and 'record_id' for target
    const auditLogs = (rawLogs || []).map((log: any) => ({
      ...log,
      actor_id: log.user_id,
      target_user_id: log.record_id,
      // Handle array vs object response from Supabase joins
      actor: Array.isArray(log.actor) ? log.actor[0] : log.actor,
      target: Array.isArray(log.target) ? log.target[0] : log.target
    }));

    // Get total count for pagination
    let countQuery = supabase
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .in("action", [
        "AGENT_APPROVED",
        "AGENT_REJECTED",
        "AGENT_SUSPENDED",
        "AGENT_REINSTATED",
        "AGENT_APPROVE_ATTEMPT_DENIED",
        "AGENT_REJECT_ATTEMPT_DENIED"
      ]);

    if (action_filter) {
      countQuery = countQuery.eq("action", String(action_filter));
    }

    if (date_from) {
      countQuery = countQuery.gte("created_at", String(date_from));
    }

    if (date_to) {
      countQuery = countQuery.lte("created_at", String(date_to));
    }

    if (admin_id) {
      countQuery = countQuery.eq("user_id", String(admin_id));
    }

    const { count } = await countQuery;

    return res.status(200).json({
      audit_logs: auditLogs,
      pagination: {
        total: count || 0,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        has_more: (count || 0) > parseInt(offset as string) + parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}