-- Create updated get_member_tier_details function with correct bonus description
CREATE FUNCTION get_member_tier_details(p_member_id UUID)
RETURNS TABLE(
  tier_name VARCHAR(50),
  tier_level INTEGER,
  current_referrals INTEGER,
  tier_bonus_percentage DECIMAL(5,2),
  next_tier_name VARCHAR(50),
  referrals_needed_for_next INTEGER,
  tier_locked_until DATE,
  achieved_tier_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lt.tier_name,
    lt.tier_level,
    mls.successful_referrals as current_referrals,
    COALESCE(ltc.bonus_percentage, 0) as tier_bonus_percentage,
    next_tier.tier_name as next_tier_name,
    GREATEST(0, COALESCE(next_config.referral_threshold, 0) - mls.successful_referrals) as referrals_needed_for_next,
    mls.tier_locked_until,
    mls.achieved_tier_at
  FROM member_loyalty_status mls
  JOIN loyalty_tiers lt ON mls.current_tier_id = lt.id
  LEFT JOIN loyalty_tier_config ltc ON lt.id = ltc.tier_id AND ltc.is_active = true
  LEFT JOIN loyalty_tiers next_tier ON next_tier.tier_level = lt.tier_level + 1
  LEFT JOIN loyalty_tier_config next_config ON next_tier.id = next_config.tier_id AND next_config.is_active = true
  WHERE mls.user_id = p_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_member_tier_details IS 'Gets comprehensive tier details - tier bonus is percentage of referral bonus, NOT membership fee';