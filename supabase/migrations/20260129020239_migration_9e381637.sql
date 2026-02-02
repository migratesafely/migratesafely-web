-- Create function to get member tier details with progress
CREATE FUNCTION get_member_tier_details(p_member_id UUID)
RETURNS TABLE(
  member_id UUID,
  current_tier_name VARCHAR(50),
  current_tier_level INTEGER,
  current_referral_count INTEGER,
  current_tier_bonus_percentage DECIMAL(5,2),
  next_tier_name VARCHAR(50),
  next_tier_threshold INTEGER,
  referrals_needed_for_next_tier INTEGER,
  progress_percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mls.user_id,
    lt_current.tier_name,
    lt_current.tier_level,
    mls.successful_referrals,
    COALESCE(ltc_current.bonus_percentage, 0.00),
    lt_next.tier_name,
    ltc_next.referral_threshold,
    GREATEST(0, ltc_next.referral_threshold - mls.successful_referrals),
    CASE 
      WHEN ltc_next.referral_threshold IS NULL THEN 100.00
      WHEN ltc_next.referral_threshold = 0 THEN 100.00
      ELSE LEAST(100.00, (mls.successful_referrals::DECIMAL / ltc_next.referral_threshold::DECIMAL) * 100)
    END
  FROM member_loyalty_status mls
  JOIN loyalty_tiers lt_current ON mls.current_tier_id = lt_current.id
  LEFT JOIN loyalty_tier_config ltc_current ON lt_current.id = ltc_current.tier_id 
    AND ltc_current.is_active = true
  LEFT JOIN loyalty_tiers lt_next ON lt_current.tier_level + 1 = lt_next.tier_level
  LEFT JOIN loyalty_tier_config ltc_next ON lt_next.id = ltc_next.tier_id 
    AND ltc_next.is_active = true
  WHERE mls.user_id = p_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_member_tier_details IS 'Gets comprehensive tier details for a member including progress to next tier';