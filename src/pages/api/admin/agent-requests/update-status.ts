import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { agentRequestService } from "@/services/agentRequestService";
import { agentRequestTimelineService } from "@/services/agentRequestTimelineService";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { logAdminAction } from "@/services/auditLogService";
import { agentPermissionsService } from "@/services/agentPermissionsService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  try {
    // Only Chairman can update agent request status
    const isChairman = await agentPermissionsService.isChairman(auth.userId);
    
    if (!isChairman) {
      return res.status(403).json({ success: false, error: "Forbidden: Chairman access required" });
    }

    const { requestId, newStatus, notes } = req.body;

    if (!requestId || !newStatus) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const validStatuses = ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "COMPLETED", "REJECTED"];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }

    // Get current status before update
    const { data: currentRequest } = await supabase
      .from("agent_requests")
      .select("status")
      .eq("id", requestId)
      .single();

    const oldStatus = currentRequest?.status || "unknown";

    // Update status
    const { error: updateError } = await supabase
      .from("agent_requests")
      .update({ status: newStatus })
      .eq("id", requestId);

    if (updateError) {
      return res.status(500).json({ error: "Failed to update status" });
    }

    // Log timeline event: STATUS_CHANGED
    try {
      await agentRequestTimelineService.logStatusChange(
        requestId,
        oldStatus,
        newStatus,
        auth.userId,
        "admin",
        auth.userRole,
        undefined
      );
    } catch (timelineError) {
      console.error("Failed to log STATUS_CHANGED event:", timelineError);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in update status API:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}