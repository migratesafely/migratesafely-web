import type { NextApiRequest, NextApiResponse } from "next";
import { embassyService } from "@/services/embassyService";
import { supabase } from "@/integrations/supabase/client";

/**
 * GET /api/embassies/list
 * Members-only endpoint - returns embassies for the member's own country only
 * Query params: search (optional)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Require authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized - Authentication required" });
    }

    // Fetch user's country from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("country_code")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.country_code) {
      return res.status(400).json({ error: "User country not found" });
    }

    const memberCountryCode = profile.country_code;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    // Fetch embassies for member's country only
    const embassies = await embassyService.listEmbassies({
      countryCode: memberCountryCode,
      search,
    });

    return res.status(200).json({ embassies, memberCountry: memberCountryCode });
  } catch (error) {
    console.error("Embassy list API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}