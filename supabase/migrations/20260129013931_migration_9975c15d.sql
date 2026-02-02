-- Drop existing calculate_member_tier function completely
DROP FUNCTION IF EXISTS calculate_member_tier(integer);
DROP FUNCTION IF EXISTS calculate_member_tier(uuid, integer);

-- Recreate with correct signature
CREATE OR REPLACE FUNCTION calculate_member_tier(p_successful_referrals integer)
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_tier_id uuid;
BEGIN
  -- Get the highest tier the member qualifies for based on referral count
  -- Uses current active configuration
  SELECT lt.id INTO v_tier_id
  FROM loyalty_tiers lt
  INNER JOIN loyalty_tier_config ltc ON ltc.tier_id = lt.id
  WHERE ltc.is_active = true
    AND ltc.effective_from <= CURRENT_DATE
    AND p_successful_referrals >= ltc.referrals_required
  ORDER BY ltc.referrals_required DESC, lt.tier_level DESC
  LIMIT 1;
  
  -- If no tier found (shouldn't happen), return Blue tier
  IF v_tier_id IS NULL THEN
    SELECT id INTO v_tier_id
    FROM loyalty_tiers
    WHERE tier_level = 1
    LIMIT 1;
  END IF;
  
  RETURN v_tier_id;
END;
$$;

COMMENT ON FUNCTION calculate_member_tier IS 'Calculates appropriate tier for a member based on successful referral count';