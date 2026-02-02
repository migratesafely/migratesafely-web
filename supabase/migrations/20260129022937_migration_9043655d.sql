-- Create function to get member tier details with translations
CREATE FUNCTION get_member_tier_details_localized(
  p_member_id UUID,
  p_language_code TEXT DEFAULT 'en'
)
RETURNS TABLE(
  tier_name TEXT,
  tier_name_translated TEXT,
  tier_level INTEGER,
  tier_description_translated TEXT,
  current_referrals INTEGER,
  bonus_percentage DECIMAL(5,2),
  next_tier_name TEXT,
  next_tier_name_translated TEXT,
  referrals_needed INTEGER,
  tier_locked_until DATE,
  achievement_message_translated TEXT,
  progress_percentage INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lt.tier_name,
    COALESCE(ltt.tier_name_translation, lt.tier_name) as tier_name_translated,
    lt.tier_level,
    COALESCE(ltt.tier_description, 'No description available') as tier_description_translated,
    mls.successful_referrals as current_referrals,
    COALESCE(ltc.bonus_percentage, 0.00) as bonus_percentage,
    next_tier.tier_name as next_tier_name,
    COALESCE(next_tier_trans.tier_name_translation, next_tier.tier_name) as next_tier_name_translated,
    GREATEST(0, COALESCE(next_tier_config.referral_threshold, 999999) - mls.successful_referrals) as referrals_needed,
    mls.tier_locked_until,
    COALESCE(ltt.achievement_message, 'Tier achieved!') as achievement_message_translated,
    CASE 
      WHEN next_tier.tier_level IS NULL THEN 100
      ELSE LEAST(100, (mls.successful_referrals * 100) / NULLIF(next_tier_config.referral_threshold, 0))
    END as progress_percentage
  FROM member_loyalty_status mls
  JOIN loyalty_tiers lt ON mls.current_tier_id = lt.id
  LEFT JOIN loyalty_tier_translations ltt ON lt.id = ltt.tier_id AND ltt.language_code = p_language_code
  LEFT JOIN loyalty_tier_config ltc ON lt.id = ltc.tier_id AND ltc.is_active = true
  LEFT JOIN loyalty_tiers next_tier ON next_tier.tier_level = lt.tier_level + 1
  LEFT JOIN loyalty_tier_translations next_tier_trans ON next_tier.id = next_tier_trans.tier_id AND next_tier_trans.language_code = p_language_code
  LEFT JOIN loyalty_tier_config next_tier_config ON next_tier.id = next_tier_config.tier_id AND next_tier_config.is_active = true
  WHERE mls.user_id = p_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_member_tier_details_localized IS 'Gets member tier details with translations in specified language for Members Portal display';