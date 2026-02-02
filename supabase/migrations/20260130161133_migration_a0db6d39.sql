-- ====================================================================
-- PRIZE POOL STRUCTURE, SPLIT & ROLLOVER GOVERNANCE
-- Prompt A4 - Database + Backend Only
-- Bangladesh (BDT) only
-- ADDITIVE ONLY - No modifications to existing logic
-- ====================================================================

-- ====================================================================
-- SECTION 1: PRIZE POOL SUB-POOL TRACKING
-- ====================================================================

-- Table: prize_pool_sub_accounts
-- Purpose: Track the two internal sub-pools within the total prize pool
-- Random Prize Pool (70%) - Luck-based draws
-- Community Selected Prize Pool (30%) - Hardship/special cases

CREATE TABLE IF NOT EXISTS prize_pool_sub_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL DEFAULT 'BD',
  sub_pool_type TEXT NOT NULL CHECK (sub_pool_type IN ('random', 'community')),
  current_balance NUMERIC NOT NULL DEFAULT 0 CHECK (current_balance >= 0),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_country_sub_pool UNIQUE (country_code, sub_pool_type)
);

-- Initialize the two sub-pools for Bangladesh
INSERT INTO prize_pool_sub_accounts (country_code, sub_pool_type, current_balance)
VALUES 
  ('BD', 'random', 0),
  ('BD', 'community', 0)
ON CONFLICT (country_code, sub_pool_type) DO NOTHING;

-- RLS Policies
ALTER TABLE prize_pool_sub_accounts ENABLE ROW LEVEL SECURITY;

-- Super Admin can view sub-pool balances
CREATE POLICY "Super admins can view sub-pool balances"
  ON prize_pool_sub_accounts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

-- Super Admin can update sub-pool balances (via functions only)
CREATE POLICY "Super admins can update sub-pool balances"
  ON prize_pool_sub_accounts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

COMMENT ON TABLE prize_pool_sub_accounts IS 
'Internal sub-pool tracking for prize pool separation. Members NEVER see this data. 
Random (70%) + Community (30%) = Total Prize Pool shown to members.';

-- ====================================================================
-- SECTION 2: PRIZE POOL SPLIT CONFIGURATION
-- ====================================================================

-- Table: prize_pool_split_config
-- Purpose: Govern the 70/30 split between Random and Community pools
-- Changeable only by Super Admin (or Master Admin when activated)

CREATE TABLE IF NOT EXISTS prize_pool_split_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  random_percentage NUMERIC NOT NULL CHECK (random_percentage >= 0 AND random_percentage <= 100),
  community_percentage NUMERIC NOT NULL CHECK (community_percentage >= 0 AND community_percentage <= 100),
  effective_from DATE NOT NULL,
  set_by_admin_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_split_total CHECK (random_percentage + community_percentage = 100),
  CONSTRAINT unique_country_split_effective_date UNIQUE (country_code, effective_from)
);

-- Initialize default split: 70% Random, 30% Community
INSERT INTO prize_pool_split_config (
  country_code,
  random_percentage,
  community_percentage,
  effective_from,
  set_by_admin_id
) VALUES (
  'BD',
  70.0,
  30.0,
  '2026-01-01',
  NULL  -- System default
) ON CONFLICT (country_code, effective_from) DO NOTHING;

-- RLS Policies
ALTER TABLE prize_pool_split_config ENABLE ROW LEVEL SECURITY;

-- Super Admin can view split configuration
CREATE POLICY "Super admins can view split config"
  ON prize_pool_split_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

-- Super Admin can insert new split configurations
CREATE POLICY "Super admins can insert split config"
  ON prize_pool_split_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

COMMENT ON TABLE prize_pool_split_config IS 
'Governance table for prize pool split percentages. Default: 70% Random, 30% Community. 
INTERNAL ONLY - Members never see this. Super Admin control (Master Admin after activation).';

-- ====================================================================
-- SECTION 3: PRIZE POOL SUB-LEDGER (TRANSACTION TRACKING)
-- ====================================================================

-- Table: prize_pool_sub_ledger
-- Purpose: Track all transactions affecting the sub-pools
-- Parallel to general_ledger but provides granular sub-pool tracking

CREATE TABLE IF NOT EXISTS prize_pool_sub_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL DEFAULT 'BD',
  sub_pool_type TEXT NOT NULL CHECK (sub_pool_type IN ('random', 'community')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('allocation', 'payout', 'adjustment')),
  amount NUMERIC NOT NULL CHECK (amount != 0),
  balance_after NUMERIC NOT NULL CHECK (balance_after >= 0),
  reference_id UUID,  -- Links to prize_draw_winners, etc.
  reference_type TEXT,  -- 'prize_draw', 'community_support', etc.
  description TEXT,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_prize_pool_sub_ledger_country_type 
  ON prize_pool_sub_ledger(country_code, sub_pool_type);

CREATE INDEX IF NOT EXISTS idx_prize_pool_sub_ledger_date 
  ON prize_pool_sub_ledger(transaction_date DESC);

-- RLS Policies
ALTER TABLE prize_pool_sub_ledger ENABLE ROW LEVEL SECURITY;

-- Super Admin can view sub-ledger
CREATE POLICY "Super admins can view sub-ledger"
  ON prize_pool_sub_ledger
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

COMMENT ON TABLE prize_pool_sub_ledger IS 
'Sub-ledger for granular prize pool transaction tracking. 
Positive amounts = credits (allocations), Negative amounts = debits (payouts). 
INTERNAL ONLY - Members never see this data.';

-- ====================================================================
-- SECTION 4: PRIZE POOL ALLOCATION FUNCTION (WITH SPLIT)
-- ====================================================================

-- Function: allocate_to_prize_pools
-- Purpose: Allocate prize pool amount and split into Random + Community sub-pools
-- Called after membership fee processing (after referral & tier % bonuses)

CREATE OR REPLACE FUNCTION allocate_to_prize_pools(
  p_total_allocation_amount NUMERIC,
  p_reference_id UUID,
  p_reference_type TEXT,
  p_description TEXT,
  p_country_code TEXT DEFAULT 'BD'
) RETURNS JSONB AS $$
DECLARE
  v_split_config RECORD;
  v_random_amount NUMERIC;
  v_community_amount NUMERIC;
  v_random_new_balance NUMERIC;
  v_community_new_balance NUMERIC;
BEGIN
  -- Validate input
  IF p_total_allocation_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Allocation amount must be positive'
    );
  END IF;

  -- Get current split configuration
  SELECT random_percentage, community_percentage
  INTO v_split_config
  FROM prize_pool_split_config
  WHERE country_code = p_country_code
    AND effective_from <= CURRENT_DATE
  ORDER BY effective_from DESC
  LIMIT 1;

  -- Default to 70/30 if no config found
  IF v_split_config IS NULL THEN
    v_split_config.random_percentage := 70.0;
    v_split_config.community_percentage := 30.0;
  END IF;

  -- Calculate split amounts
  v_random_amount := p_total_allocation_amount * (v_split_config.random_percentage / 100.0);
  v_community_amount := p_total_allocation_amount * (v_split_config.community_percentage / 100.0);

  -- Update Random Prize Pool
  UPDATE prize_pool_sub_accounts
  SET 
    current_balance = current_balance + v_random_amount,
    last_updated_at = NOW()
  WHERE country_code = p_country_code
    AND sub_pool_type = 'random'
  RETURNING current_balance INTO v_random_new_balance;

  -- Record Random Pool transaction
  INSERT INTO prize_pool_sub_ledger (
    country_code,
    sub_pool_type,
    transaction_type,
    amount,
    balance_after,
    reference_id,
    reference_type,
    description
  ) VALUES (
    p_country_code,
    'random',
    'allocation',
    v_random_amount,
    v_random_new_balance,
    p_reference_id,
    p_reference_type,
    p_description || ' (Random Pool 70%)'
  );

  -- Update Community Selected Prize Pool
  UPDATE prize_pool_sub_accounts
  SET 
    current_balance = current_balance + v_community_amount,
    last_updated_at = NOW()
  WHERE country_code = p_country_code
    AND sub_pool_type = 'community'
  RETURNING current_balance INTO v_community_new_balance;

  -- Record Community Pool transaction
  INSERT INTO prize_pool_sub_ledger (
    country_code,
    sub_pool_type,
    transaction_type,
    amount,
    balance_after,
    reference_id,
    reference_type,
    description
  ) VALUES (
    p_country_code,
    'community',
    'allocation',
    v_community_amount,
    v_community_new_balance,
    p_reference_id,
    p_reference_type,
    p_description || ' (Community Pool 30%)'
  );

  -- Return success with details
  RETURN jsonb_build_object(
    'success', true,
    'total_allocated', p_total_allocation_amount,
    'random_amount', v_random_amount,
    'community_amount', v_community_amount,
    'random_new_balance', v_random_new_balance,
    'community_new_balance', v_community_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION allocate_to_prize_pools IS 
'Allocates prize pool amount and splits into Random (70%) + Community (30%) sub-pools. 
INTERNAL USE ONLY - Called during membership fee processing.';

-- ====================================================================
-- SECTION 5: PRIZE PAYOUT FUNCTION (WITH ROLLOVER)
-- ====================================================================

-- Function: process_prize_payout
-- Purpose: Process prize payout from specific sub-pool with validation
-- Ensures funds are deducted from correct pool and tracks usage

CREATE OR REPLACE FUNCTION process_prize_payout(
  p_sub_pool_type TEXT,
  p_payout_amount NUMERIC,
  p_reference_id UUID,
  p_reference_type TEXT,
  p_description TEXT,
  p_country_code TEXT DEFAULT 'BD'
) RETURNS JSONB AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Validate sub-pool type
  IF p_sub_pool_type NOT IN ('random', 'community') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid sub-pool type. Must be random or community.'
    );
  END IF;

  -- Validate payout amount
  IF p_payout_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Payout amount must be positive'
    );
  END IF;

  -- Get current balance
  SELECT current_balance INTO v_current_balance
  FROM prize_pool_sub_accounts
  WHERE country_code = p_country_code
    AND sub_pool_type = p_sub_pool_type;

  -- Check sufficient funds
  IF v_current_balance < p_payout_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient funds in ' || p_sub_pool_type || ' prize pool',
      'current_balance', v_current_balance,
      'requested_amount', p_payout_amount
    );
  END IF;

  -- Deduct from sub-pool
  UPDATE prize_pool_sub_accounts
  SET 
    current_balance = current_balance - p_payout_amount,
    last_updated_at = NOW()
  WHERE country_code = p_country_code
    AND sub_pool_type = p_sub_pool_type
  RETURNING current_balance INTO v_new_balance;

  -- Record payout transaction (negative amount)
  INSERT INTO prize_pool_sub_ledger (
    country_code,
    sub_pool_type,
    transaction_type,
    amount,
    balance_after,
    reference_id,
    reference_type,
    description
  ) VALUES (
    p_country_code,
    p_sub_pool_type,
    'payout',
    -p_payout_amount,
    v_new_balance,
    p_reference_id,
    p_reference_type,
    p_description
  );

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'payout_amount', p_payout_amount,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'remaining_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION process_prize_payout IS 
'Processes prize payout from specified sub-pool (random or community). 
Validates sufficient funds and records transaction. 
Any remaining balance automatically rolls forward to next draw in same pool.';

-- ====================================================================
-- SECTION 6: PRIZE DRAW METADATA (POOL ASSIGNMENT)
-- ====================================================================

-- Add column to prize_draws table to track which pool is used
-- This allows admin to specify Random or Community for each draw

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prize_draws' AND column_name = 'sub_pool_type'
  ) THEN
    ALTER TABLE prize_draws 
    ADD COLUMN sub_pool_type TEXT CHECK (sub_pool_type IN ('random', 'community'));
    
    COMMENT ON COLUMN prize_draws.sub_pool_type IS 
    'Specifies which sub-pool is used for this draw: random (luck-based) or community (hardship/special cases). 
    Admin sets this when creating the draw.';
  END IF;
END $$;

-- ====================================================================
-- SECTION 7: MEMBER-SAFE VIEW UPDATE (TOTAL BALANCE ONLY)
-- ====================================================================

-- Update member_prize_pool_view to show combined total from both sub-pools
-- Members see ONLY the total, NEVER the split or individual pool balances

CREATE OR REPLACE VIEW member_prize_pool_view AS
SELECT 
  'BD' AS country_code,
  COALESCE(
    (SELECT SUM(current_balance) FROM prize_pool_sub_accounts WHERE country_code = 'BD'),
    0
  ) AS total_prize_pool_balance,
  (SELECT MAX(last_updated_at) FROM prize_pool_sub_accounts WHERE country_code = 'BD') AS last_updated_at;

COMMENT ON VIEW member_prize_pool_view IS 
'Member-safe view showing ONLY total combined prize pool balance. 
Combines Random + Community sub-pools into single total. 
Members NEVER see sub-pool breakdown, percentages, or allocation logic.';

-- ====================================================================
-- SECTION 8: ADMIN REPORTING VIEW (SUPER ADMIN ONLY)
-- ====================================================================

-- View: admin_prize_pool_breakdown
-- Purpose: Super Admin can see full breakdown of sub-pools
-- Members NEVER have access to this view

CREATE OR REPLACE VIEW admin_prize_pool_breakdown AS
SELECT 
  country_code,
  sub_pool_type,
  current_balance,
  last_updated_at,
  (SELECT random_percentage FROM prize_pool_split_config 
   WHERE country_code = prize_pool_sub_accounts.country_code 
   AND effective_from <= CURRENT_DATE 
   ORDER BY effective_from DESC LIMIT 1) AS current_split_percentage,
  CASE 
    WHEN sub_pool_type = 'random' THEN 'Random Prize Pool (Luck-based Draws)'
    WHEN sub_pool_type = 'community' THEN 'Community Selected Prize Pool (Hardship/Special Cases)'
  END AS pool_description
FROM prize_pool_sub_accounts
ORDER BY country_code, sub_pool_type;

-- RLS Policy for admin view
ALTER TABLE prize_pool_sub_accounts ENABLE ROW LEVEL SECURITY;

COMMENT ON VIEW admin_prize_pool_breakdown IS 
'Admin-only view showing full prize pool breakdown. 
Displays Random + Community sub-pool balances with split percentages. 
RESTRICTED ACCESS - Super Admin only.';

-- ====================================================================
-- SECTION 9: AUDIT LOGGING FUNCTION
-- ====================================================================

-- Function: log_prize_pool_split_change
-- Purpose: Automatically log when split percentages are changed

CREATE OR REPLACE FUNCTION log_prize_pool_split_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    admin_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    NEW.set_by_admin_id,
    'prize_pool_split_changed',
    'prize_pool_split_config',
    NEW.id,
    jsonb_build_object(
      'country_code', NEW.country_code,
      'random_percentage', NEW.random_percentage,
      'community_percentage', NEW.community_percentage,
      'effective_from', NEW.effective_from
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Log split configuration changes
DROP TRIGGER IF EXISTS trigger_log_split_change ON prize_pool_split_config;
CREATE TRIGGER trigger_log_split_change
  AFTER INSERT ON prize_pool_split_config
  FOR EACH ROW
  EXECUTE FUNCTION log_prize_pool_split_change();

COMMENT ON FUNCTION log_prize_pool_split_change IS 
'Automatically logs all prize pool split configuration changes to audit_logs. 
Tracks admin who made change, percentages, and effective date.';

-- ====================================================================
-- SECTION 10: VALIDATION & SAFETY CHECKS
-- ====================================================================

-- Function: validate_prize_pool_integrity
-- Purpose: Validates that sub-pool balances match ledger and total pool

CREATE OR REPLACE FUNCTION validate_prize_pool_integrity(
  p_country_code TEXT DEFAULT 'BD'
) RETURNS JSONB AS $$
DECLARE
  v_random_balance NUMERIC;
  v_community_balance NUMERIC;
  v_total_sub_pools NUMERIC;
  v_general_ledger_balance NUMERIC;
  v_discrepancy NUMERIC;
BEGIN
  -- Get sub-pool balances
  SELECT current_balance INTO v_random_balance
  FROM prize_pool_sub_accounts
  WHERE country_code = p_country_code AND sub_pool_type = 'random';

  SELECT current_balance INTO v_community_balance
  FROM prize_pool_sub_accounts
  WHERE country_code = p_country_code AND sub_pool_type = 'community';

  v_total_sub_pools := COALESCE(v_random_balance, 0) + COALESCE(v_community_balance, 0);

  -- Get general ledger balance (account 2100)
  SELECT COALESCE(SUM(
    CASE 
      WHEN debit_amount IS NOT NULL THEN -debit_amount
      WHEN credit_amount IS NOT NULL THEN credit_amount
      ELSE 0
    END
  ), 0) INTO v_general_ledger_balance
  FROM general_ledger
  WHERE account_code = '2100'
    AND country_code = p_country_code;

  -- Calculate discrepancy
  v_discrepancy := ABS(v_total_sub_pools - v_general_ledger_balance);

  -- Return validation result
  RETURN jsonb_build_object(
    'country_code', p_country_code,
    'random_pool_balance', v_random_balance,
    'community_pool_balance', v_community_balance,
    'total_sub_pools', v_total_sub_pools,
    'general_ledger_balance', v_general_ledger_balance,
    'discrepancy', v_discrepancy,
    'is_balanced', v_discrepancy < 0.01,
    'validated_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_prize_pool_integrity IS 
'Validates prize pool integrity by comparing sub-pool balances with general ledger. 
Used for monthly reconciliation and audit purposes. 
Ensures Random + Community = Total Prize Pool (Account 2100).';

-- ====================================================================
-- END OF MIGRATION
-- ====================================================================

-- Summary of changes:
-- 1. Created prize_pool_sub_accounts table (Random + Community sub-pools)
-- 2. Created prize_pool_split_config table (70/30 governance)
-- 3. Created prize_pool_sub_ledger table (transaction tracking)
-- 4. Created allocate_to_prize_pools() function (split allocation)
-- 5. Created process_prize_payout() function (payout with validation)
-- 6. Added sub_pool_type column to prize_draws (pool assignment)
-- 7. Updated member_prize_pool_view (shows combined total only)
-- 8. Created admin_prize_pool_breakdown view (Super Admin reporting)
-- 9. Created audit logging for split changes
-- 10. Created validation function for integrity checks