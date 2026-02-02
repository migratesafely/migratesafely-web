-- Create function to calculate member tier based on successful referrals
CREATE FUNCTION calculate_member_tier(p_successful_referrals INTEGER)
RETURNS UUID AS $$
DECLARE
  v_tier_id UUID;
BEGIN
  -- Find the highest tier the member qualifies for based on referral count
  SELECT lt.id INTO v_tier_id
  FROM loyalty_tiers lt
  INNER JOIN loyalty_tier_config ltc ON lt.id = ltc.tier_id
  WHERE ltc.is_active = true
    AND p_successful_referrals >= ltc.referral_threshold
  ORDER BY ltc.referral_threshold DESC
  LIMIT 1;
  
  -- If no tier found, return Blue tier (tier_level = 1)
  IF v_tier_id IS NULL THEN
    SELECT id INTO v_tier_id
    FROM loyalty_tiers
    WHERE tier_level = 1
    LIMIT 1;
  END IF;
  
  RETURN v_tier_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_member_tier IS 'Calculates appropriate tier for a member based on successful referral count';