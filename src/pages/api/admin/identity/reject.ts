import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { logAdminAction } from "@/services/auditLogService";
import { agentPermissionsService } from "@/services/agentPermissionsService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const auth = await requireAdminRole(req, res);
    if (!auth) return; // Middleware handles rejection

    // AUTHORITY: Only Chairman can reject identity verifications
    const isChairman = await agentPermissionsService.isChairman(auth.userId);

    if (!isChairman) {
      return res.status(403).json({ error: "Forbidden - Chairman access required" });
    }

    const { verificationId, reason } = req.body;

    if (!verificationId || !reason) {
      return res.status(400).json({ success: false, error: "Verification ID and rejection reason required" });
    }

    const { error: updateError } = await supabase
      .from("identity_verifications")
      .update({
        status: "REJECTED",
        rejection_reason: reason,
        reviewed_by: auth.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", verificationId);

    if (updateError) throw updateError;

    // Log action
    await logAdminAction({
        actorId: auth.userId,
        action: "IDENTITY_REJECTED",
        recordId: verificationId,
        tableName: "identity_verifications",
        details: { reason, rejected_by: auth.userRole }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Reject verification error:", error);
    return res.status(500).json({ success: false, error: "Failed to reject verification" });
  }
}