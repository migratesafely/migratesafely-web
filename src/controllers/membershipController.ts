import type { NextApiRequest, NextApiResponse } from "next";
import { membershipService } from "@/services/membership/membershipService";
import { supabase } from "@/integrations/supabase/client";

/**
 * MEMBERSHIP CONTROLLER
 * API handlers for membership operations
 */

// ============================================
// GET /membership/me
// Get current user's membership status
// ============================================
export async function getMembershipStatus(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get membership status
    const result = await membershipService.getMembershipStatus(user.id);

    if (!result.success) {
      return res.status(500).json({ error: result.message });
    }

    return res.status(200).json({
      status: result.status,
      endDate: result.endDate,
      remainingDays: result.remainingDays,
      message: result.message,
    });
  } catch (error) {
    console.error("Error in getMembershipStatus:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ============================================
// POST /membership/activate
// Activate membership after payment confirmation
// Admin/internal use only
// ============================================
export async function activateMembership(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate request body
    const { userId, paymentId, paymentConfirmedAtIso } = req.body;

    if (!userId || !paymentId || !paymentConfirmedAtIso) {
      return res.status(400).json({
        error: "Missing required fields: userId, paymentId, paymentConfirmedAtIso",
      });
    }

    // Activate membership
    const result = await membershipService.activateMembershipFromPayment({
      userId,
      paymentId,
      paymentConfirmedAtIso,
    });

    if (!result.success) {
      return res.status(500).json({ error: result.message });
    }

    return res.status(200).json({
      success: true,
      membership: result.membership,
      message: result.message,
    });
  } catch (error) {
    console.error("Error in activateMembership:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}