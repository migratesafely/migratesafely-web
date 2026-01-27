import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { countrySettingsService } from "@/services/settings/countrySettingsService";

/**
 * GET /api/settings/country?countryCode=BD
 * Fetch country-specific membership settings
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { countryCode } = req.query;

    if (!countryCode || typeof countryCode !== "string") {
      return res.status(400).json({ error: "Country code is required" });
    }

    const { data, error } = await supabase
      .from("country_settings")
      .select("*")
      .eq("country_code", countryCode)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Country settings not found" });
    }

    // Fetch referral bonus config for this country
    const { data: referralConfig } = await supabase
      .from("membership_config")
      .select("referral_bonus_amount, referral_bonus_currency")
      .eq("country_code", countryCode)
      .order("effective_from", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fallback to global config if no country-specific config
    let referralBonusAmount = 0;
    let referralBonusCurrency = data.currency_code;

    if (referralConfig) {
      referralBonusAmount = referralConfig.referral_bonus_amount;
      referralBonusCurrency = referralConfig.referral_bonus_currency;
    } else {
      const { data: globalConfig } = await supabase
        .from("membership_config")
        .select("referral_bonus_amount, referral_bonus_currency")
        .is("country_code", null)
        .order("effective_from", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (globalConfig) {
        referralBonusAmount = globalConfig.referral_bonus_amount;
        referralBonusCurrency = globalConfig.referral_bonus_currency;
      }
    }

    return res.status(200).json({
      membershipFeeAmount: data.membership_fee_amount,
      currencyCode: data.currency_code,
      currencySymbol: data.currency_symbol,
      countryName: data.country_name,
      referralBonusAmount,
      referralBonusCurrency,
    });
  } catch (error) {
    console.error("Error fetching country settings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}