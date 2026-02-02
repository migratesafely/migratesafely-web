-- Create function to get all tier information with translations for "How It Works" section
CREATE FUNCTION get_all_tiers_localized(
  p_language_code TEXT DEFAULT 'en'
)
RETURNS TABLE(
  tier_name TEXT,
  tier_name_translated TEXT,
  tier_level INTEGER,
  tier_description_translated TEXT,
  referral_threshold INTEGER,
  bonus_percentage DECIMAL(5,2),
  achievement_message_translated TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lt.tier_name,
    COALESCE(ltt.tier_name_translation, lt.tier_name) as tier_name_translated,
    lt.tier_level,
    COALESCE(ltt.tier_description, 'No description available') as tier_description_translated,
    COALESCE(ltc.referral_threshold, 0) as referral_threshold,
    COALESCE(ltc.bonus_percentage, 0.00) as bonus_percentage,
    COALESCE(ltt.achievement_message, 'Tier achieved!') as achievement_message_translated
  FROM loyalty_tiers lt
  LEFT JOIN loyalty_tier_translations ltt ON lt.id = ltt.tier_id AND ltt.language_code = p_language_code
  LEFT JOIN loyalty_tier_config ltc ON lt.id = ltc.tier_id AND ltc.is_active = true
  ORDER BY lt.tier_level ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_all_tiers_localized IS 'Gets all tier information with translations for "How It Works" section in Members Portal';