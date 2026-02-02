-- Create CORRECTED function: tier bonus calculated from referral bonus (NOT membership fee)
CREATE FUNCTION calculate_total_renewal_bonus(
  p_member_id UUID,
  p_renewal_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  referral_bonus_amount DECIMAL(10,2),
  tier_bonus_percentage DECIMAL(5,2),
  tier_bonus_amount DECIMAL(10,2),
  total_bonus_amount DECIMAL(10,2)
) AS $$
DECLARE
  v_referral_bonus DECIMAL(10,2);
  v_tier_bonus_pct DECIMAL(5,2);
  v_tier_bonus_amt DECIMAL(10,2);
BEGIN
  -- Get referral bonus amount from referral system (Super Admin defined)
  -- This retrieves the ORIGINAL referral bonus amount
  SELECT COALESCE(available_balance, 0)
  INTO v_referral_bonus
  FROM referral_wallet
  WHERE user_id = p_member_id;
  
  -- If no referral bonus, set to 0
  v_referral_bonus := COALESCE(v_referral_bonus, 0);
  
  -- Get tier bonus percentage from member's current tier
  -- Uses active config at renewal date
  SELECT COALESCE(ltc.bonus_percentage, 0)
  INTO v_tier_bonus_pct
  FROM member_loyalty_status mls
  JOIN loyalty_tiers lt ON mls.current_tier_id = lt.id
  LEFT JOIN loyalty_tier_config ltc ON lt.id = ltc.tier_id 
    AND ltc.is_active = true
    AND ltc.effective_from <= p_renewal_date
  WHERE mls.user_id = p_member_id
  ORDER BY ltc.effective_from DESC
  LIMIT 1;
  
  -- If no tier bonus config found, set to 0
  v_tier_bonus_pct := COALESCE(v_tier_bonus_pct, 0);
  
  -- CORRECT CALCULATION: Tier bonus = Referral bonus × Tier percentage
  -- NOT calculated from membership fee
  v_tier_bonus_amt := v_referral_bonus * (v_tier_bonus_pct / 100);
  
  -- Return complete bonus breakdown
  RETURN QUERY
  SELECT 
    v_referral_bonus as referral_bonus_amount,
    v_tier_bonus_pct as tier_bonus_percentage,
    v_tier_bonus_amt as tier_bonus_amount,
    (v_referral_bonus + v_tier_bonus_amt) as total_bonus_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_total_renewal_bonus IS 'Calculates total bonus: referral bonus + tier bonus (tier bonus = percentage of REFERRAL BONUS, NOT membership fee)';