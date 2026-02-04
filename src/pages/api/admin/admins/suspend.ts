import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { logSuspension } from "@/services/auditLogService";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { logAdminAction } from "@/services/auditLogService";
import { agentPermissionsService } from "@/services/agentPermissionsService";

type UserRole = Database["public"]["Enums"]["user_role"];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only POST allowed
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  try {
    // 1. Verify authentication (already done by middleware, but kept for token extraction if needed, though middleware provides user info)
    // We can rely on 'auth' object from middleware
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

    // 3. Only super_admin or manager_admin can suspend
    if (
      !["super_admin", "manager_admin"].includes(requesterProfile.role || "")
    ) {
      return res.status(403).json({
        error: "Forbidden: Only super_admin or manager_admin can suspend admins",
      });
    }

    // 4. Validate request body
    const { targetUserId, suspend, reason } = req.body;
    const adminId = targetUserId; // Alias for consistency if needed

    if (!targetUserId || typeof suspend !== "boolean") {
      return res.status(400).json({
        error: "Missing required fields: targetUserId (string), suspend (boolean)",
      });
    }

    // 5. Cannot suspend self
    if (targetUserId === user.id) {
      return res
        .status(403)
        .json({ error: "Forbidden: Cannot suspend yourself" });
    }

    // 6. Get target user profile
    const { data: targetProfile, error: targetError } = await supabase
      .from("profiles")
      .select("role, email, full_name, deleted_at")
      .eq("id", targetUserId)
      .single();

    if (targetError || !targetProfile) {
      return res.status(404).json({ error: "Target user not found" });
    }
    const adminToSuspend = targetProfile;

    // 7. Cannot suspend super_admin
    if (targetProfile.role === "super_admin") {
      return res
        .status(403)
        .json({ error: "Forbidden: Cannot suspend super_admin" });
    }

    // 8. manager_admin can only suspend worker_admin
    if (
      requesterProfile.role === "manager_admin" &&
      targetProfile.role !== "worker_admin"
    ) {
      return res.status(403).json({
        error: "Forbidden: manager_admin can only suspend worker_admin",
      });
    }

    // 9. Update deleted_at field (soft delete/suspend)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (suspend) {
      // Suspend: Set deleted_at to current timestamp
      updateData.deleted_at = new Date().toISOString();
    } else {
      // Unsuspend: Set deleted_at to null
      updateData.deleted_at = null;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", targetUserId);

    if (updateError) {
      console.error("Error updating suspension status:", updateError);
      return res.status(500).json({
        error: "Failed to update suspension status",
        details: updateError.message,
      });
    }

    // 10. Log the suspension/unsuspension to audit log
    await logSuspension(
      user.id,
      targetUserId,
      suspend,
      reason,
      req.headers["x-forwarded-for"] as string,
      req.headers["user-agent"] as string
    );

    // Log suspension in audit trail
    const { error: auditError } = await supabase.from("audit_logs").insert({
      admin_id: auth.userId,
      action: "ADMIN_SUSPENDED",
      details: {
        suspended_admin_id: adminId,
        suspended_admin_email: adminToSuspend.email,
        reason: reason,
        suspended_by_role: "chairman"
      }
    });

    // 11. Return success
    return res.status(200).json({
      success: true,
      message: suspend
        ? `Admin suspended successfully${reason ? `: ${reason}` : ""}`
        : "Admin unsuspended successfully",
      admin: {
        id: targetUserId,
        email: targetProfile.email,
        full_name: targetProfile.full_name,
        role: targetProfile.role,
        suspended: suspend,
        reason: reason || null,
      },
    });
  } catch (error) {
    console.error("Error in suspend API:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}