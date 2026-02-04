import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { agentRequestTimelineService } from "@/services/agentRequestTimelineService";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { agentPermissionsService } from "@/services/agentPermissionsService";

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

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  try {
    // Only Chairman can view agent request timeline
    const isChairman = await agentPermissionsService.isChairman(auth.userId);
    
    if (!isChairman) {
      return res.status(403).json({ success: false, error: "Forbidden: Chairman access required" });
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