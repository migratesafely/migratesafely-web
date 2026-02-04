import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { logRoleChange } from "@/services/auditLogService";
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

    // Check permissions - only Chairman can update admin roles
    const isChairman = await agentPermissionsService.isChairman(auth.userId);
    if (!isChairman) {
      return res.status(403).json({ success: false, error: "Forbidden: Chairman access required" });
    }

    // 4. Validate request body
    const { targetUserId, newRole } = req.body;

    if (!targetUserId || !newRole) {
      return res.status(400).json({
        error: "Missing required fields: targetUserId, newRole",
      });
    }

    // Validate newRole
    const validRoles: UserRole[] = ["manager_admin", "worker_admin"];
    if (!validRoles.includes(newRole as UserRole)) {
      return res.status(400).json({
        error: "Invalid newRole. Must be 'manager_admin' or 'worker_admin'",
      });
    }

    // 5. Cannot change own role
    if (targetUserId === user.id) {
      return res
        .status(403)
        .json({ error: "Forbidden: Cannot change your own role" });
    }

    // 6. Get target user profile
    const { data: targetProfile, error: targetError } = await supabase
      .from("profiles")
      .select("role, email, full_name")
      .eq("id", targetUserId)
      .single();

    if (targetError || !targetProfile) {
      return res.status(404).json({ error: "Target user not found" });
    }

    // 7. Cannot modify another super_admin
    if (targetProfile.role === "super_admin") {
      return res
        .status(403)
        .json({ error: "Forbidden: Cannot modify super_admin role" });
    }

    const oldRole = targetProfile.role;

    // 8. Update role in profiles table
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        role: newRole as UserRole,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetUserId);

    if (updateError) {
      console.error("Error updating role:", updateError);
      return res.status(500).json({
        error: "Failed to update role",
        details: updateError.message,
      });
    }

    // 9. Log the role change to audit log
    await logRoleChange(
      user.id,
      targetUserId,
      oldRole || "unknown",
      newRole,
      req.headers["x-forwarded-for"] as string,
      req.headers["user-agent"] as string
    );

    // 10. Return success
    return res.status(200).json({
      success: true,
      message: `Role updated from ${oldRole} to ${newRole}`,
      admin: {
        id: targetUserId,
        email: targetProfile.email,
        full_name: targetProfile.full_name,
        old_role: oldRole,
        new_role: newRole,
      },
    });
  } catch (error) {
    console.error("Error in update-role API:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}