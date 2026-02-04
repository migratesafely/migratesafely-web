import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { messageService } from "@/services/messageService";
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
    // Only Chairman can broadcast messages
    const isChairman = await agentPermissionsService.isChairman(auth.userId);
    
    if (!isChairman) {
      return res.status(403).json({ success: false, error: "Forbidden: Chairman access required" });
    }

    const { target, countryCode, selectedUserIds, subject, body } = req.body;

    if (!target || !subject || !body) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const validTargets = ["ALL_MEMBERS", "ALL_AGENTS", "COUNTRY_MEMBERS", "COUNTRY_AGENTS", "SELECTED_USERS"];
    if (!validTargets.includes(target)) {
      return res.status(400).json({ success: false, error: "Invalid target" });
    }

    if ((target === "COUNTRY_MEMBERS" || target === "COUNTRY_AGENTS") && !countryCode) {
      return res.status(400).json({ success: false, error: "Country code required for country-specific broadcasts" });
    }

    if (target === "SELECTED_USERS" && (!selectedUserIds || selectedUserIds.length === 0)) {
      return res.status(400).json({ success: false, error: "Selected user IDs required for custom broadcasts" });
    }

    const result = await messageService.sendBroadcastMessage(auth.userId, {
      target,
      countryCode,
      selectedUserIds,
      subject,
      body,
    });

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    return res.status(200).json({ 
      success: true, 
      messageId: result.messageId,
      recipientCount: result.recipientCount 
    });
  } catch (error) {
    console.error("Error in broadcast API:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}