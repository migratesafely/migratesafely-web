import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { messageService } from "@/services/messageService";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { agentPermissionsService } from "@/services/agentPermissionsService";

/**
 * POST /api/admin/messages/broadcast
 * Broadcast a message to all users or a specific group
 * Requires Chairman access
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const auth = await requireAdminRole(req, res);
    if (!auth) return;

    const isSuperAdmin = await agentPermissionsService.isSuperAdmin(auth.userId);

    if (!isSuperAdmin) {
      return res.status(403).json({ error: "Forbidden: Super Admin access required" });
    }

    const { subject, content, targetRole, countryCode } = req.body;

    if (!subject || !content || !targetRole) {
      return res.status(400).json({ error: "Subject, content, and target role are required" });
    }

    // Determine target based on role and country
    let target: "ALL_MEMBERS" | "ALL_AGENTS" | "COUNTRY_MEMBERS" | "COUNTRY_AGENTS" = "ALL_MEMBERS";
    
    if (countryCode) {
      if (targetRole === "agent") target = "COUNTRY_AGENTS";
      else target = "COUNTRY_MEMBERS";
    } else {
      if (targetRole === "agent") target = "ALL_AGENTS";
      else target = "ALL_MEMBERS";
    }

    const result = await messageService.sendBroadcastMessage(
      auth.userId,
      {
        subject,
        body: content,
        target,
        countryCode
      }
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Broadcast queued successfully",
      recipientCount: result.recipientCount 
    });
  } catch (error) {
    console.error("Broadcast message API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}