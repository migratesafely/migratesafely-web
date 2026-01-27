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
    // Get session token from Authorization header
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify session and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["manager_admin", "super_admin"].includes(profile.role)) {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }

    const { id, status } = req.body;

    if (!id || !status || !["open", "closed"].includes(status)) {
      return res.status(400).json({ error: "Valid job ID and status (open/closed) required" });
    }

    // Update job status and closes_at if closing
    const updates: any = {
      status,
      updated_by: user.id,
    };

    if (status === "closed") {
      updates.closes_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("job_listings")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating job status:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}