import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { agentPermissionsService } from "@/services/agentPermissionsService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  const isSuperAdmin = await agentPermissionsService.isSuperAdmin(auth.userId);

  if (!isSuperAdmin) {
    return res.status(403).json({ error: "Forbidden: Super Admin access required" });
  }

  // Fetch all jobs including archived ones
  // We need to fetch all jobs to show in admin dashboard
  // Use explicit typing to avoid complex type errors
  const { data, error } = await (supabase as any)
    .from("job_listings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("List jobs error:", error);
    return res.status(500).json({ error: "Failed to fetch jobs" });
  }

  return res.status(200).json({ jobs: data });
}