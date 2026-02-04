import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { agentPermissionsService } from "@/services/agentPermissionsService";
import { prizeDrawService } from "@/services/prizeDrawService";

interface Prize {
  id: string;
  drawId: string;
  title: string;
  description: string | null;
  prizeType: string;
  awardType: string;
  prizeValueAmount: number;
  currencyCode: string;
  numberOfWinners: number;
  status: string;
  createdAt: string;
}

interface ListPrizesResponse {
  success: boolean;
  prizes?: Prize[];
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ListPrizesResponse>) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Require admin role
  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  try {
    // AUTHORITY: Chairman only (for managing)
    // Note: Other admins might need read access, but creating/managing is Chairman only.
    // For listing, we might allow other admins if needed, but for now enforcing Chairman to be safe per instructions.
    const isChairman = await agentPermissionsService.isChairman(auth.userId);
    
    if (!isChairman) {
      return res.status(403).json({ success: false, error: "Forbidden: Chairman access required" });
    }

    // Get drawId from query
    const { drawId } = req.query;

    if (!drawId || typeof drawId !== "string") {
      return res.status(400).json({ success: false, error: "Missing required query parameter: drawId" });
    }

    // Call service to list prizes
    const result = await prizeDrawService.listPrizesForDraw(drawId);

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error || "Failed to fetch prizes" });
    }

    // Map prizes to response format
    const prizes: Prize[] = (result.prizes || []).map((p: any) => ({
      id: p.id,
      drawId: p.draw_id,
      title: p.title,
      description: p.description,
      prizeType: p.prize_type,
      awardType: p.award_type,
      prizeValueAmount: p.prize_value_amount,
      currencyCode: p.currency_code,
      numberOfWinners: p.number_of_winners,
      status: p.status,
      createdAt: p.created_at,
    }));

    return res.status(200).json({
      success: true,
      prizes,
    });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}