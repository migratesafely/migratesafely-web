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

  // Get current status
  const { data: job, error: fetchError } = await supabase
    .from("job_listings")
    .select("status")
    .eq("id", jobId)
    .single();

  if (fetchError || !job) {
    return res.status(404).json({ error: "Job not found" });
  }

  const newStatus = job.status === "open" ? "closed" : "open";

  const { data, error } = await supabase
    .from("job_listings")
    .update({
      status: newStatus,
      updated_by: auth.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .select()
    .single();

  if (error) {
    console.error("Toggle job status error:", error);
    return res.status(500).json({ error: "Failed to toggle job status" });
  }

  return res.status(200).json({ 
    message: `Job status updated to ${newStatus}`,
    job: data 
  });
}