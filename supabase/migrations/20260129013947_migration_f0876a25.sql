-- Drop existing get_tier_bonus_at_renewal function
DROP FUNCTION IF EXISTS get_tier_bonus_at_renewal(uuid, date);

-- Recreate get_tier_bonus_at_renewal function
CREATE OR REPLACE FUNCTION get_tier_bonus_at_renewal(p_tier_id uuid, p_renewal_date date)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_bonus_percentage numeric;
BEGIN
  -- Get the bonus percentage that will be active at the member's renewal date
  SELECT bonus_percentage INTO v_bonus_percentage
  FROM loyalty_tier_config
  WHERE tier_id = p_tier_id
    AND is_active = true
    AND effective_from <= p_renewal_date
  ORDER BY effective_from DESC
  LIMIT 1;
  
  RETURN COALESCE(v_bonus_percentage, 0.00);
END;
$$;

COMMENT ON FUNCTION get_tier_bonus_at_renewal IS 'Gets the bonus percentage for a member tier at their renewal date';