import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { agentRequestService } from "@/services/agentRequestService";

interface UpdateFeedbackBody {
  requestId: string;
  feedback: string;
  outcomeStatus: "SUCCESS" | "FAILED" | "UNKNOWN";
}

interface UpdateFeedbackResponse {
  success: boolean;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateFeedbackResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const { requestId, feedback, outcomeStatus } = req.body as UpdateFeedbackBody;

    if (!requestId || !feedback || !outcomeStatus) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const validOutcomes = ["SUCCESS", "FAILED", "UNKNOWN"];
    if (!validOutcomes.includes(outcomeStatus)) {
      return res.status(400).json({ success: false, error: "Invalid outcome status" });
    }

    const result = await agentRequestService.updateMemberFeedback(
      requestId,
      user.id,
      feedback,
      outcomeStatus
    );

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error || "Failed to update feedback" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in update feedback API:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}