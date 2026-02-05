import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminRole } from "@/lib/apiMiddleware";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  const { supabase } = auth;

  try {
    // Fetch all admins
    const { data: admins, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, email, created_at")
      .in("role", ["super_admin", "manager_admin", "worker_admin"])
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Organize into hierarchy
    const hierarchy = {
      super_admin: admins?.filter(a => a.role === "super_admin") || [],
      manager_admin: admins?.filter(a => a.role === "manager_admin") || [],
      worker_admin: admins?.filter(a => a.role === "worker_admin") || [],
    };

    return res.status(200).json(hierarchy);
  } catch (error) {
    console.error("Error fetching admin hierarchy:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}