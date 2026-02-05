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
    const { data: periods, error } = await supabase
      .from("accounting_periods")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) throw error;

    return res.status(200).json(periods);
  } catch (error) {
    console.error("Error fetching financial periods:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}