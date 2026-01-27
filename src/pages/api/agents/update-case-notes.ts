import type { NextApiRequest, NextApiResponse } from "next";
import { requireAgentRole } from "@/lib/apiMiddleware";
import { agentPermissionsService } from "@/services/agentPermissionsService";
import { supabase } from "@/integrations/supabase/client";

/**
 * API endpoint for agents to update case notes on their assigned requests
 * POST /api/agents/update-case-notes
 * 
 * Agents CAN:
 * - Update case notes for requests assigned to them
 * 
 * Agents CANNOT:
 * - Update notes for unassigned requests
 * - Modify request status
 * - Update other request fields
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Require approved agent authentication
  const auth = await requireAgentRole(req, res);
  if (!auth) return;

  try {
    const { requestId, notes } = req.body;

    // Validate input
    if (!requestId || typeof requestId !== "string") {
      return res.status(400).json({ error: "Invalid request ID" });
    }

    if (!notes || typeof notes !== "string") {
      return res.status(400).json({ error: "Notes are required" });
    }

    // Check permission to update case notes for this request
    const permissionCheck = await agentPermissionsService.canUpdateCaseNotes(
      auth.userId,
      requestId
    );

    if (!permissionCheck.allowed) {
      return res.status(403).json({
        error: "Forbidden",
        details: permissionCheck.reason,
        violationType: permissionCheck.violationType,
      });
    }

    // Update only the notes field (agent cannot modify other fields)
    const { data, error } = await supabase
      .from("agent_requests")
      .update({
        notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .eq("assigned_agent_id", auth.userId) // Double-check assignment
      .select()
      .single();

    if (error) {
      console.error("Error updating case notes:", error);
      return res.status(500).json({ error: "Failed to update case notes" });
    }

    return res.status(200).json({
      success: true,
      message: "Case notes updated successfully",
      data: {
        requestId: data.id,
        notes: data.notes,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error("Error in update-case-notes:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}