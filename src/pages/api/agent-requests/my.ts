import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { agentRequestService } from "@/services/agentRequestService";

interface MyRequestsResponse {
  success: boolean;
  requests?: any[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MyRequestsResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const result = await agentRequestService.listMyRequests(user.id);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error || "Failed to fetch requests" });
    }

    return res.status(200).json({ success: true, requests: result.requests || [] });
  } catch (error) {
    console.error("Error in my agent requests API:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}