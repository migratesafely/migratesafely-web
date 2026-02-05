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

  const jobData = req.body;

  // Validate required fields
  if (!jobData.title || !jobData.location_country || !jobData.department) {
    return res.status(400).json({ error: "Missing required fields: title, location_country, department" });
  }

  // Create job listing
  const { data, error } = await supabase
    .from("job_listings")
    .insert({
      ...jobData,
      created_by: auth.userId,
      updated_by: auth.userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating job listing:", error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(data);
}