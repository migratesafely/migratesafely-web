import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || !["super_admin", "manager_admin"].includes(profile.role)) {
      return res.status(403).json({ success: false, error: "Admin access required" });
    }

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