import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get authorization token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization token" });
    }

    // Verify user session
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!["super_admin", "manager_admin"].includes(profile.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const { job_id } = req.body;

    if (!job_id) {
      return res.status(400).json({ error: "Job ID is required" });
    }

    // Restore the job (clear archived_at and archived_by)
    const { data, error } = await supabase
      .from("job_listings")
      .update({
        archived_at: null,
        archived_by: null,
        updated_by: user.id,
      })
      .eq("id", job_id)
      .select()
      .single();

    if (error) {
      console.error("Restore job error:", error);
      return res.status(500).json({ error: "Failed to restore job" });
    }

    return res.status(200).json({ 
      message: "Job restored successfully",
      job: data 
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}