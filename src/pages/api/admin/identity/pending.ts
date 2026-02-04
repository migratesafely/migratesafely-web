import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { agentPermissionsService } from "@/services/agentPermissionsService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const auth = await requireAdminRole(req, res);
    if (!auth) return; // Middleware handles rejection

    // AUTHORITY: Only Chairman can view pending identity verifications
    const isChairman = await agentPermissionsService.isChairman(auth.userId);

    if (!isChairman) {
      return res.status(403).json({ error: "Forbidden - Chairman access required" });
    }

    // Get pending verifications
    const { data: verifications, error } = await supabase
      .from("identity_verifications")
      .select(`
        *,
        profiles!identity_verifications_user_id_fkey (email)
      `)
      .eq("status", "PENDING")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return res.status(200).json({ success: true, verifications: verifications || [] });
  } catch (error) {
    console.error("Pending verifications error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch pending verifications" });
  }
}