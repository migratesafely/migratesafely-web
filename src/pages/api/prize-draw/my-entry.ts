import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { prizeDrawService } from "@/services/prizeDrawService";

interface MyEntryResponse {
  hasEntry: boolean;
  enteredAt?: string;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<MyEntryResponse>) {
  if (req.method !== "GET") {
    return res.status(405).json({ hasEntry: false, error: "Method not allowed" });
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ hasEntry: false, error: "Unauthorized" });
    }

    const userId = user.id;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("country_code")
      .eq("id", userId)
      .single();

    if (profileError || !profile || !profile.country_code) {
      return res.status(400).json({ hasEntry: false, error: "User country not found" });
    }

    const countryCode = profile.country_code;

    const entryResult = await prizeDrawService.getMyEntryForCurrentDraw(userId, countryCode);

    if (!entryResult.success) {
      return res.status(500).json({ hasEntry: false, error: entryResult.error || "Failed to fetch entry" });
    }

    return res.status(200).json({
      hasEntry: entryResult.hasEntry || false,
      enteredAt: entryResult.enteredAt,
    });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ hasEntry: false, error: "Internal server error" });
  }
}