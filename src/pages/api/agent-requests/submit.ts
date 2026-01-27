import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { agentRequestService } from "@/services/agentRequestService";
import { agentRequestTimelineService } from "@/services/agentRequestTimelineService";

interface SubmitRequestBody {
  memberCountryCode: string;
  destinationCountryCode: string;
  requestType: "WORK" | "STUDENT" | "FAMILY" | "VISIT" | "OTHER";
  notes?: string;
}

interface SubmitRequestResponse {
  success: boolean;
  requestId?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubmitRequestResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const { memberCountryCode, destinationCountryCode, requestType, notes } = req.body as SubmitRequestBody;

    if (!memberCountryCode || !destinationCountryCode || !requestType) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const validRequestTypes = ["WORK", "STUDENT", "FAMILY", "VISIT", "OTHER"];
    if (!validRequestTypes.includes(requestType)) {
      return res.status(400).json({ success: false, error: "Invalid request type" });
    }

    const { data: agentRequest, error: insertError } = await supabase
      .from("agent_requests")
      .insert({
        member_user_id: user.id,
        request_type: requestType,
        notes: notes,
        member_country_code: memberCountryCode,
        destination_country_code: destinationCountryCode,
        status: "SUBMITTED"
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return res.status(500).json({ success: false, error: "Failed to create agent request" });
    }

    // Log timeline event: REQUEST_CREATED
    try {
      await agentRequestTimelineService.logRequestCreated(
        agentRequest.id,
        user.id,
        {
          request_type: requestType,
          country: memberCountryCode,
          description: notes?.substring(0, 100) || null, // Store first 100 chars in metadata
        }
      );
    } catch (timelineError) {
      console.error("Failed to log timeline event:", timelineError);
      // Don't fail the request if timeline logging fails
    }

    return res.status(200).json({ success: true, requestId: agentRequest.id });
  } catch (error) {
    console.error("Error in submit agent request API:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}