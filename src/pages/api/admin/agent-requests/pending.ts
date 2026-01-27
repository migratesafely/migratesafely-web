import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { agentRequestService } from "@/services/agentRequestService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ success: false, error: "Profile not found" });
    }

    if (!["super_admin", "manager_admin"].includes(profile.role)) {
      return res.status(403).json({ success: false, error: "Admin access required" });
    }

    const result = await agentRequestService.listPendingRequestsForAdmin();

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    return res.status(200).json({ success: true, requests: result.requests });
  } catch (error) {
    console.error("Error in pending agent requests API:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}