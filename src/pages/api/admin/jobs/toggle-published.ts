import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
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

  try {
    // Only Chairman can toggle job published status
    const { id, published } = req.body;

    if (!id || typeof published !== "boolean") {
      return res.status(400).json({ error: "Valid job ID and published status (true/false) required" });
    }

    // Update published status
    const { data, error } = await supabase
      .from("job_listings")
      .update({
        published,
        updated_by: auth.userId,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating published status:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}