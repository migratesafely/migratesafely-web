import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminRole } from "@/lib/apiMiddleware";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  const { supabase, profile } = auth;

  // Only Super Admin can access identity verifications
  const isSuperAdmin = profile?.role === "super_admin";
  if (!isSuperAdmin) {
    return res.status(403).json({ error: "Forbidden: Super Admin access required" });
  }

  try {
    const { data, error } = await supabase
      .from("identity_verifications")
      .select("*, profiles(id, email, full_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({ verifications: data || [] });
  } catch (error) {
    console.error("Error fetching pending verifications:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}