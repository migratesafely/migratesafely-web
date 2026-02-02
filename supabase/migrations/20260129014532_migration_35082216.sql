-- Create function to get tier bonus percentage at member renewal date
CREATE FUNCTION get_tier_bonus_at_renewal(
  p_member_user_id UUID,
  p_renewal_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_tier_id UUID;
  v_bonus_percentage DECIMAL(5,2);
BEGIN
  -- Get member's current tier
  SELECT current_tier_id INTO v_tier_id
  FROM member_loyalty_status
  WHERE user_id = p_member_user_id;
  
  -- If no tier found, return 0
  IF v_tier_id IS NULL THEN
    RETURN 0.00;
  END IF;
  
  -- Get the bonus percentage from the active config as of renewal date
  SELECT ltc.bonus_percentage INTO v_bonus_percentage
  FROM loyalty_tier_config ltc
  WHERE ltc.tier_id = v_tier_id
    AND ltc.is_active = true
    AND ltc.created_at <= p_renewal_date
  ORDER BY ltc.created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_bonus_percentage, 0.00);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_tier_bonus_at_renewal IS 'Gets the bonus percentage for a member tier at their renewal date';