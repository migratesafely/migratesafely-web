import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminRole } from "@/lib/apiMiddleware";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  const { supabase, profile, user } = auth;

  // SUPER ADMIN SAFE OVERRIDE: Super admin can approve any identity verification immediately
  const isSuperAdmin = profile?.role === "super_admin";

  const { verificationId } = req.body;

  if (!verificationId) {
    return res.status(400).json({ error: "Verification ID is required" });
  }

  try {
    // Update verification status
    const { data: verification, error: updateError } = await supabase
      .from("identity_verifications")
      .update({
        status: "verified",
        verified_by: user.id,
        verified_at: new Date().toISOString(),
      })
      .eq("id", verificationId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({ 
      message: "Identity verification approved",
      verification 
    });
  } catch (error) {
    console.error("Error approving identity verification:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}