-- ====================================================================
-- PROMPT A3.1a: PRIZE POOL VISIBILITY & GOVERNANCE (SCHEMA-ALIGNED)
-- Scope: Database only, Additive only
-- Source of Truth: general_ledger (account_code 2100)
-- ====================================================================

-- 1. MEMBER-SAFE PRIZE POOL VIEW (READ-ONLY)
-- Drops existing view to ensure strict definition match
DROP VIEW IF EXISTS member_prize_pool_view;

CREATE VIEW member_prize_pool_view AS
SELECT
  'BD'::text AS country_code, -- Hardcoded for Bangladesh-only phase
  COALESCE(
    SUM(credit_amount - debit_amount),
    0
  ) AS total_prize_pool_balance,
  NOW() AS last_updated_at
FROM general_ledger
WHERE account_code = '2100'; -- STRICTLY Prize Draw Pool Payable

COMMENT ON VIEW member_prize_pool_view IS 
  'MEMBER-SAFE VIEW: Exposes ONLY total prize pool balance derived from Account 2100. 
   NO percentage fields. NO allocation metadata. NO history. NO projections.';

-- RLS: Authenticated users only (read-only)
GRANT SELECT ON member_prize_pool_view TO authenticated;


-- 2. PRIZE POOL CONFIG GOVERNANCE
-- Ensure table exists with strict governance columns
CREATE TABLE IF NOT EXISTS prize_pool_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL DEFAULT 'BD',
  allocation_percentage NUMERIC(5,2) NOT NULL DEFAULT 30.00 CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  set_by_admin_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: Only one active config per date per country
  UNIQUE(country_code, effective_from)
);

-- RLS: Only Super Admin can modify
ALTER TABLE prize_pool_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin manage config" ON prize_pool_config
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Everyone (system) can read for calculation
CREATE POLICY "System read config" ON prize_pool_config
  FOR SELECT USING (true);


-- 3. CALCULATION SAFEGUARD (RULE ENFORCEMENT)
-- Function to calculate the EXACT amount to be credited to Account 2100
-- Enforces: Fee - Operational Costs = Net -> Apply %
CREATE OR REPLACE FUNCTION calculate_strict_prize_allocation(
  p_membership_fee NUMERIC,
  p_referral_cost NUMERIC,       -- Deduct FIRST
  p_tier_percent_cost NUMERIC,   -- Deduct FIRST
  p_transaction_date DATE DEFAULT CURRENT_DATE
) RETURNS NUMERIC AS $$
DECLARE
  v_net_amount NUMERIC;
  v_allocation_pct NUMERIC;
  v_allocation_amount NUMERIC;
BEGIN
  -- 1. Calculate NET Amount (Order of Operations Rule)
  -- Lump-sum bonuses are EXCLUDED from this deduction logic (handled as pure expense)
  v_net_amount := p_membership_fee - COALESCE(p_referral_cost, 0) - COALESCE(p_tier_percent_cost, 0);

  -- Safety: No allocation on negative/zero net
  IF v_net_amount <= 0 THEN
    RETURN 0;
  END IF;

  -- 2. Fetch Effective Allocation % from Governance Table
  SELECT allocation_percentage INTO v_allocation_pct
  FROM prize_pool_config
  WHERE country_code = 'BD' -- Bangladesh only
    AND effective_from <= p_transaction_date
  ORDER BY effective_from DESC
  LIMIT 1;

  -- Fallback to system default (30%) if no specific config found
  IF v_allocation_pct IS NULL THEN
    v_allocation_pct := 30.00;
  END IF;

  -- 3. Calculate Liability Amount
  v_allocation_amount := v_net_amount * (v_allocation_pct / 100.0);

  -- Return rounded amount (2 decimal places)
  RETURN ROUND(v_allocation_amount, 2);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION calculate_strict_prize_allocation IS
  'Source of Truth for Prize Pool Liability calculation. 
   Enforces deduction of operational costs BEFORE allocation. 
   Uses audited prize_pool_config table.';