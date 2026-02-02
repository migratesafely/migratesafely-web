-- ====================================================================
-- PRIZE POOL VISIBILITY, CALCULATION & GOVERNANCE FIX (CORRECTED)
-- Scope: Accounting logic, Prize draw pool governance, Member visibility
-- Rule: ADDITIVE ONLY - No existing functionality modified
-- Bangladesh (BDT) only
-- ====================================================================

-- ====================================================================
-- 1. MEMBER VISIBILITY RESTRICTION (PRIZE POOL)
-- ====================================================================
-- Create member-safe view that exposes ONLY total prize pool balance
-- NO percentage, NO allocation rules, NO future projections, NO history

CREATE OR REPLACE VIEW member_prize_pool_view AS
SELECT
  'BD' AS country_code,
  COALESCE(
    SUM(CASE WHEN account_code = '2100' THEN credit_amount - debit_amount ELSE 0 END),
    0
  ) AS total_prize_pool_balance,
  NOW() AS last_updated_at
FROM general_ledger
WHERE account_code = '2100';

COMMENT ON VIEW member_prize_pool_view IS 
  'MEMBER-SAFE VIEW: Exposes ONLY total prize pool balance. NO allocation rules, NO percentages, NO history, NO projections. Bangladesh only.';

-- Grant SELECT to authenticated users (members)
GRANT SELECT ON member_prize_pool_view TO authenticated;

-- ====================================================================
-- 2. PRIZE POOL CONFIGURATION GOVERNANCE
-- ====================================================================
-- Create prize pool configuration table for Super Admin control

CREATE TABLE IF NOT EXISTS prize_pool_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  allocation_percentage NUMERIC(5,2) NOT NULL CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
  effective_from DATE NOT NULL,
  set_by_admin_id UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(country_code, effective_from)
);

COMMENT ON TABLE prize_pool_config IS 
  'Prize pool allocation percentage governance. Super Admin only (future: Master Admin only). NO retroactive changes allowed.';

COMMENT ON COLUMN prize_pool_config.allocation_percentage IS 
  'Percentage of NET membership income allocated to prize pool (after referral & tier bonuses). Default: 30%';

COMMENT ON COLUMN prize_pool_config.effective_from IS 
  'Date from which this allocation applies. NO retroactive application. Historical balances remain untouched.';

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_prize_pool_config_country_effective 
  ON prize_pool_config(country_code, effective_from DESC);

-- Enable RLS
ALTER TABLE prize_pool_config ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Super Admins can manage prize pool config
DROP POLICY IF EXISTS "Super Admins can manage prize pool config" ON prize_pool_config;
CREATE POLICY "Super Admins can manage prize pool config"
  ON prize_pool_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

-- Insert default configuration for Bangladesh (30% allocation)
INSERT INTO prize_pool_config (country_code, allocation_percentage, effective_from, notes)
VALUES (
  'BD',
  30.00,
  '2026-01-01',
  'Default prize pool allocation: 30% of NET membership income (after referral & tier bonuses)'
)
ON CONFLICT (country_code, effective_from) DO NOTHING;

-- ====================================================================
-- 3. PRIZE POOL ALLOCATION ORDER VALIDATION
-- ====================================================================
-- Create function to get current allocation percentage for a country and date

CREATE OR REPLACE FUNCTION get_prize_pool_allocation_percentage(
  p_country_code TEXT,
  p_effective_date DATE DEFAULT CURRENT_DATE
) RETURNS NUMERIC AS $$
DECLARE
  v_allocation_percentage NUMERIC(5,2);
BEGIN
  -- Get the most recent allocation percentage that is effective on or before the given date
  SELECT allocation_percentage
  INTO v_allocation_percentage
  FROM prize_pool_config
  WHERE country_code = p_country_code
    AND effective_from <= p_effective_date
  ORDER BY effective_from DESC
  LIMIT 1;
  
  -- Return 30% as default if no configuration found
  RETURN COALESCE(v_allocation_percentage, 30.00);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_prize_pool_allocation_percentage IS 
  'Returns current prize pool allocation percentage for given country and date. Defaults to 30% if not configured.';

-- ====================================================================
-- 4. PRIZE POOL ALLOCATION AUDIT LOG
-- ====================================================================
-- Create audit log table for prize pool configuration changes

CREATE TABLE IF NOT EXISTS prize_pool_config_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES prize_pool_config(id),
  country_code TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('created', 'updated', 'deleted')),
  old_allocation_percentage NUMERIC(5,2),
  new_allocation_percentage NUMERIC(5,2),
  old_effective_from DATE,
  new_effective_from DATE,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  change_reason TEXT,
  notes TEXT
);

COMMENT ON TABLE prize_pool_config_audit IS 
  'Audit log for all prize pool configuration changes. Immutable record for compliance.';

CREATE INDEX IF NOT EXISTS idx_prize_pool_config_audit_country 
  ON prize_pool_config_audit(country_code, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_prize_pool_config_audit_changed_by 
  ON prize_pool_config_audit(changed_by);

-- Enable RLS
ALTER TABLE prize_pool_config_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Super Admins can view audit logs
DROP POLICY IF EXISTS "Super Admins can view prize pool config audit" ON prize_pool_config_audit;
CREATE POLICY "Super Admins can view prize pool config audit"
  ON prize_pool_config_audit
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

-- RLS Policy: System can insert audit logs
DROP POLICY IF EXISTS "System can insert prize pool config audit" ON prize_pool_config_audit;
CREATE POLICY "System can insert prize pool config audit"
  ON prize_pool_config_audit
  FOR INSERT
  WITH CHECK (true);

-- ====================================================================
-- 5. TRIGGER: AUDIT PRIZE POOL CONFIG CHANGES
-- ====================================================================
-- Automatically log all configuration changes

CREATE OR REPLACE FUNCTION log_prize_pool_config_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO prize_pool_config_audit (
      config_id,
      country_code,
      action_type,
      new_allocation_percentage,
      new_effective_from,
      changed_by,
      change_reason,
      notes
    ) VALUES (
      NEW.id,
      NEW.country_code,
      'created',
      NEW.allocation_percentage,
      NEW.effective_from,
      NEW.set_by_admin_id,
      'New prize pool configuration created',
      NEW.notes
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO prize_pool_config_audit (
      config_id,
      country_code,
      action_type,
      old_allocation_percentage,
      new_allocation_percentage,
      old_effective_from,
      new_effective_from,
      changed_by,
      change_reason,
      notes
    ) VALUES (
      NEW.id,
      NEW.country_code,
      'updated',
      OLD.allocation_percentage,
      NEW.allocation_percentage,
      OLD.effective_from,
      NEW.effective_from,
      NEW.set_by_admin_id,
      'Prize pool configuration updated',
      NEW.notes
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO prize_pool_config_audit (
      config_id,
      country_code,
      action_type,
      old_allocation_percentage,
      old_effective_from,
      changed_by,
      change_reason,
      notes
    ) VALUES (
      OLD.id,
      OLD.country_code,
      'deleted',
      OLD.allocation_percentage,
      OLD.effective_from,
      OLD.set_by_admin_id,
      'Prize pool configuration deleted',
      OLD.notes
    );
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_log_prize_pool_config_change ON prize_pool_config;
CREATE TRIGGER trigger_log_prize_pool_config_change
  AFTER INSERT OR UPDATE OR DELETE ON prize_pool_config
  FOR EACH ROW
  EXECUTE FUNCTION log_prize_pool_config_change();

-- ====================================================================
-- 6. SAFETY & COMPLIANCE DOCUMENTATION
-- ====================================================================

-- Document the restricted nature of member access
COMMENT ON VIEW member_prize_pool_view IS 
  'CRITICAL SECURITY: This view is the ONLY data source allowed for member dashboards. 
  Exposes ONLY: total_prize_pool_balance, country_code, last_updated_at.
  Does NOT expose: allocation_percentage, allocation_rules, timing_logic, future_prize_dates, 
  prize_breakdown, contribution_history, projections, or any admin-only data.
  
  Purpose: Transparency for members while protecting business logic and governance rules.
  
  Usage: Member dashboard MUST use this view ONLY. Direct queries to general_ledger or 
  prize_pool_config tables by members are BLOCKED by RLS.';

-- ====================================================================
-- END OF MIGRATION
-- ====================================================================