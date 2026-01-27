import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { logAdminAction } from "@/services/auditLogService";

interface CreateDrawRequest {
  countryCode: string;
  drawDateIso: string;
}

interface CreateDrawResponse {
  success: boolean;
  draw?: {
    id: string;
    countryCode: string;
    drawDate: string;
    announcementStatus: string;
  };
  error?: string;
}

/**
 * Create prize draw
 * ADMIN ONLY - Agents cannot modify prize draws
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<CreateDrawResponse>) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Require admin role - blocks agents and members
  const auth = await requireAdminRole(req, res);
  if (!auth) return; // Middleware handles rejection

  try {
    // Only super admin can create prize draws
    if (auth.userRole !== "super_admin") {
      // Log unauthorized attempt
      await logAdminAction({
        actorId: auth.userId,
        action: "PRIZE_DRAW_CREATE_ATTEMPT_DENIED",
        details: {
          attempted_role: auth.userRole,
          reason: "Only Super Admin can create prize draws",
        },
      });

      return res.status(403).json({ success: false, error: "Forbidden: Super Admin access required" });
    }

    // Parse request body
    const { countryCode, drawDateIso }: CreateDrawRequest = req.body;

    if (!countryCode || !drawDateIso) {
      return res.status(400).json({ success: false, error: "Missing required fields: countryCode, drawDateIso" });
    }

    // Validate date
    const drawDate = new Date(drawDateIso);
    if (isNaN(drawDate.getTime())) {
      return res.status(400).json({ success: false, error: "Invalid date format" });
    }

    // Check if draw date is in the future
    if (drawDate <= new Date()) {
      return res.status(400).json({ success: false, error: "Draw date must be in the future" });
    }

    // Insert prize draw
    const { data: draw, error: insertError } = await supabase
      .from("prize_draws")
      .insert({
        country_code: countryCode,
        draw_date: drawDateIso,
        announcement_status: "COMING_SOON",
        disclaimer_text: "Estimated prize pool is not guaranteed and depends on membership forecast.",
        created_by: auth.userId,
        title: `Prize Draw - ${drawDateIso}`,
        prize_value: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating prize draw:", insertError);
      return res.status(500).json({ success: false, error: "Failed to create prize draw" });
    }

    // Log successful creation
    await logAdminAction({
      actorId: auth.userId,
      action: "PRIZE_DRAW_CREATED",
      tableName: "prize_draws",
      recordId: draw.id,
      newValues: { country_code: countryCode, draw_date: drawDateIso },
    });

    return res.status(201).json({
      success: true,
      draw: {
        id: draw.id,
        countryCode: draw.country_code || countryCode,
        drawDate: draw.draw_date,
        announcementStatus: draw.announcement_status || "COMING_SOON",
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}