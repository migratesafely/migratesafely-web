import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { prizeDrawService } from "@/services/prizeDrawService";

interface EnterDrawResponse {
  entered: boolean;
  enteredAt?: string;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<EnterDrawResponse>) {
  if (req.method !== "POST") {
    return res.status(405).json({ entered: false, error: "Method not allowed" });
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ entered: false, error: "Unauthorized" });
    }

    const userId = user.id;

    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("status")
      .eq("user_id", userId)
      .single();

    if (membershipError || !membership || membership.status !== "active") {
      return res.status(403).json({ entered: false, error: "Active membership required" });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("country_code")
      .eq("id", userId)
      .single();

    if (profileError || !profile || !profile.country_code) {
      return res.status(400).json({ entered: false, error: "User country not found" });
    }

    const countryCode = profile.country_code;

    const entryResult = await prizeDrawService.ensureEntryForCurrentDraw(userId, countryCode);

    if (!entryResult.success) {
      return res.status(500).json({ entered: false, error: entryResult.error || "Failed to create entry" });
    }

    return res.status(200).json({
      entered: entryResult.entered || false,
      enteredAt: entryResult.enteredAt,
    });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ entered: false, error: "Internal server error" });
  }
}