import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { agentRequestService } from "@/services/agentRequestService";
import { agentRequestTimelineService } from "@/services/agentRequestTimelineService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Strict role enforcement: Only super_admin and manager_admin can update agent request status
    if (!["super_admin", "manager_admin"].includes(profile.role)) {
      // Log unauthorized attempt in audit_logs
      await supabase.from("audit_logs").insert({
        admin_id: session.user.id,
        action: "AGENT_STATUS_UPDATE_ATTEMPT_DENIED",
        entity_type: "agent_request",
        entity_id: req.body.requestId,
        changes: {
          attempted_role: profile.role,
          attempted_status: req.body.newStatus,
          reason: "Worker admins are not authorized to update agent request status",
        },
      });

      return res.status(403).json({ 
        error: "Forbidden: Only Super Admins and Manager Admins can update agent request status. Worker Admins do not have this authority." 
      });
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
        session.user.id,
        "admin",
        profile.role,
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