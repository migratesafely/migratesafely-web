import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { agentPermissionsService } from "@/services/agentPermissionsService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only GET allowed
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  const isSuperAdmin = await agentPermissionsService.isSuperAdmin(auth.userId);
  if (!isSuperAdmin) {
    return res.status(403).json({ error: "Forbidden: Super Admin access required" });
  }

  try {
    // 1. Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // 2. Get requester profile and role
    const { data: requesterProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !requesterProfile) {
      return res
        .status(403)
        .json({ error: "Forbidden: Profile not found" });
    }

    // 3. Only super_admin and manager_admin can view audit logs
    if (
      !["super_admin", "manager_admin"].includes(requesterProfile.role || "")
    ) {
      return res.status(403).json({
        error: "Forbidden: Only super_admin or manager_admin can view audit logs",
      });
    }

    // 4. Parse query parameters
    const { q, limit = "100" } = req.query;
    const searchQuery = typeof q === "string" ? q.toLowerCase() : "";
    const limitNum = Math.min(parseInt(limit as string, 10) || 100, 300);

    // 5. Build query
    const query = supabase
      .from("audit_logs")
      .select(
        `
        id,
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        ip_address,
        user_agent,
        created_at,
        actor:profiles!audit_logs_user_id_fkey(id, full_name, email),
        target:profiles!audit_logs_record_id_fkey(id, full_name, email)
      `
      )
      .order("created_at", { ascending: false })
      .limit(limitNum);

    // 6. Execute query
    const { data: logs, error: logsError } = await query;

    if (logsError) {
      console.error("Error fetching audit logs:", logsError);
      return res.status(500).json({
        error: "Failed to fetch audit logs",
        details: logsError.message,
      });
    }

    // 7. Format results with actor/target info
    const formattedLogs = (logs || []).map((log: any) => {
      const actorInfo = Array.isArray(log.actor) ? log.actor[0] : log.actor;
      const targetInfo = Array.isArray(log.target) ? log.target[0] : log.target;

      return {
        id: log.id,
        actor_id: log.user_id,
        actor_name: actorInfo?.full_name || null,
        actor_email: actorInfo?.email || null,
        action: log.action,
        target_user_id: log.record_id,
        target_name: targetInfo?.full_name || null,
        target_email: targetInfo?.email || null,
        table_name: log.table_name,
        old_values: log.old_values,
        new_values: log.new_values,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.created_at,
      };
    });

    // 8. Apply search filter if provided
    let filteredLogs = formattedLogs;
    if (searchQuery) {
      filteredLogs = formattedLogs.filter((log: any) => {
        const searchText = [
          log.actor_name,
          log.actor_email,
          log.action,
          log.target_name,
          log.target_email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchText.includes(searchQuery);
      });
    }

    // 9. Return results
    return res.status(200).json({
      success: true,
      logs: filteredLogs,
      count: filteredLogs.length,
      total: formattedLogs.length,
    });
  } catch (error) {
    console.error("Error in audit-logs/list API:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}