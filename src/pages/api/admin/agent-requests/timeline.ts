import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { agentRequestTimelineService } from "@/services/agentRequestTimelineService";

/**
 * GET /api/admin/agent-requests/timeline
 * 
 * Fetch full timeline for a specific agent request
 * Admin-only endpoint
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify admin role
    const { data: adminProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !adminProfile) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!["super_admin", "manager_admin", "worker_admin"].includes(adminProfile.role)) {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Get request_id from query
    const { request_id } = req.query;

    if (!request_id || typeof request_id !== "string") {
      return res.status(400).json({ error: "request_id is required" });
    }

    // Fetch timeline
    const timeline = await agentRequestTimelineService.getRequestTimeline(request_id);

    return res.status(200).json({
      success: true,
      timeline,
      total: timeline.length,
    });

  } catch (error) {
    console.error("Timeline fetch error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}