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

  const { jobId } = req.body;

  if (!jobId) {
    return res.status(400).json({ error: "Job ID is required" });
  }

  // Archive the job (set archived_at timestamp and archived_by)
  const { data, error } = await supabase
    .from("job_listings")
    .update({
      archived_at: new Date().toISOString(),
      archived_by: auth.userId,
      is_published: false, // Auto-unpublish when archiving
      updated_by: auth.userId,
    })
    .eq("id", jobId)
    .select()
    .single();

  if (error) {
    console.error("Archive job error:", error);
    return res.status(500).json({ error: "Failed to archive job" });
  }

  return res.status(200).json({ 
    message: "Job archived successfully",
    job: data 
  });
}