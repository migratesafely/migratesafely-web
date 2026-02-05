import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { logAdminAction } from "@/services/auditLogService";
import { agentPermissionsService } from "@/services/agentPermissionsService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  const isSuperAdmin = await agentPermissionsService.isSuperAdmin(auth.userId);

  if (!isSuperAdmin) {
    return res.status(403).json({ error: "Forbidden: Super Admin access required" });
  }

  // Get current user session
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Get user profile to check role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return res.status(403).json({ error: "Profile not found" });
  }

  // Check if user has admin role (worker_admin, manager_admin, or super_admin)
  const allowedRoles = ["worker_admin", "manager_admin", "super_admin"];
  if (!allowedRoles.includes(profile.role)) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  try {
    // Extract body parameters
    const { embassyId, sourceUrl, contactSummary, contactDetails } = req.body;

    if (!embassyId) {
      return res.status(400).json({ error: "embassyId is required" });
    }

    // Build update object
    const updateData: {
      source_url?: string;
      contact_summary?: string;
      contact_details?: string;
      last_verified_at: string;
      last_verified_by: string;
    } = {
      last_verified_at: new Date().toISOString(),
      last_verified_by: user.id,
    };

    if (sourceUrl !== undefined) updateData.source_url = sourceUrl;
    if (contactSummary !== undefined) updateData.contact_summary = contactSummary;
    if (contactDetails !== undefined) updateData.contact_details = contactDetails;

    // Update embassy
    const { data: embassy, error: updateError } = await supabase
      .from("embassies")
      .update(updateData)
      .eq("id", embassyId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    return res.status(200).json({ embassy });
  } catch (error) {
    console.error("Embassy update error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}