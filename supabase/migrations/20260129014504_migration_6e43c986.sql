-- Create function to get active tier configuration for a specific tier
CREATE FUNCTION get_active_tier_config(
  p_tier_id UUID,
  p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  config_id UUID,
  tier_id UUID,
  referral_threshold INTEGER,
  bonus_percentage DECIMAL(5,2),
  effective_from TIMESTAMPTZ,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ltc.id,
    ltc.tier_id,
    ltc.referral_threshold,
    ltc.bonus_percentage,
    ltc.created_at,
    ltc.is_active
  FROM loyalty_tier_config ltc
  WHERE ltc.tier_id = p_tier_id
    AND ltc.is_active = true
    AND ltc.created_at <= p_as_of_date
  ORDER BY ltc.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_active_tier_config IS 'Gets the active tier configuration for a specific tier as of a given date';