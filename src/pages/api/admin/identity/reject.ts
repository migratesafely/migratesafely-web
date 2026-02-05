import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminRole } from "@/lib/apiMiddleware";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  const { supabase, profile, user } = auth;

  // SUPER ADMIN SAFE OVERRIDE: Super admin can reject any identity verification immediately
  const isSuperAdmin = profile?.role === "super_admin";

  const { verificationId, reason } = req.body;

  if (!verificationId) {
    return res.status(400).json({ error: "Verification ID is required" });
  }

  try {
    // Update verification status
    const { data: verification, error: updateError } = await supabase
      .from("identity_verifications")
      .update({
        status: "rejected",
        verified_by: user.id,
        verified_at: new Date().toISOString(),
        rejection_reason: reason || "Identity verification rejected by Super Admin",
      })
      .eq("id", verificationId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({ 
      message: "Identity verification rejected",
      verification 
    });
  } catch (error) {
    console.error("Error rejecting identity verification:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}