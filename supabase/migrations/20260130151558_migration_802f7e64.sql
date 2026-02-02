-- ====================================================================
-- MASTER ADMIN READINESS - STRUCTURAL PREPARATION ONLY
-- Status: Bangladesh ONLY, No role activation, No UI changes
-- Purpose: Prepare data structures for future multi-country expansion
-- ====================================================================

-- ====================================================================
-- 1. COUNTRY FINANCIAL SUMMARIES TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS country_financial_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Country Identification
  country_code TEXT NOT NULL, -- ISO 3166-1 alpha-2 (BD, IN, PK, etc.)
  country_name TEXT NOT NULL, -- Bangladesh, India, Pakistan, etc.
  
  -- Period Identification
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  period_name TEXT NOT NULL, -- "January 2026"
  
  -- Financial Summary (JSONB for flexibility)
  revenue_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  expense_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  prize_pool_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  member_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Calculated Totals (for quick aggregation)
  total_revenue NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_expenses NUMERIC(15, 2) NOT NULL DEFAULT 0,
  net_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
  prize_pool_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  active_members_count INTEGER NOT NULL DEFAULT 0,
  
  -- Currency
  local_currency TEXT NOT NULL DEFAULT 'BDT', -- Local currency code
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft', -- draft, finalized, locked
  
  -- Audit Trail
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by UUID REFERENCES auth.users(id),
  finalized_at TIMESTAMP WITH TIME ZONE,
  finalized_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_country_period UNIQUE (country_code, period_year, period_month),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'finalized', 'locked'))
);

-- Index for efficient querying
CREATE INDEX idx_country_summaries_country_period 
  ON country_financial_summaries(country_code, period_year DESC, period_month DESC);

CREATE INDEX idx_country_summaries_status 
  ON country_financial_summaries(status);

CREATE INDEX idx_country_summaries_generated_at 
  ON country_financial_summaries(generated_at DESC);

-- Enable RLS
ALTER TABLE country_financial_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only super_admin can access (future: master_admin)
CREATE POLICY "Super admins can view country summaries"
  ON country_financial_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage country summaries"
  ON country_financial_summaries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

COMMENT ON TABLE country_financial_summaries IS 
  'Country-level financial summaries for future Master Admin consolidated reporting. Currently Bangladesh only.';

COMMENT ON COLUMN country_financial_summaries.revenue_summary IS 
  'JSONB: {membership_income, referral_income, other_revenue, breakdown_by_category}';

COMMENT ON COLUMN country_financial_summaries.expense_summary IS 
  'JSONB: {prize_expenses, referral_bonuses, tier_bonuses, community_support, breakdown_by_category}';

COMMENT ON COLUMN country_financial_summaries.prize_pool_summary IS 
  'JSONB: {opening_balance, contributions, disbursements, closing_balance, reconciliation_status}';

COMMENT ON COLUMN country_financial_summaries.member_summary IS 
  'JSONB: {active_members, new_members, churned_members, total_members, tier_distribution}';

-- ====================================================================
-- 2. CONSOLIDATED MASTER SUMMARIES TABLE (FUTURE USE)
-- ====================================================================

CREATE TABLE IF NOT EXISTS consolidated_master_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Period Identification
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  period_name TEXT NOT NULL, -- "January 2026"
  
  -- Consolidated Financial Data (JSONB)
  consolidated_revenue JSONB NOT NULL DEFAULT '{}'::jsonb,
  consolidated_expenses JSONB NOT NULL DEFAULT '{}'::jsonb,
  consolidated_prize_pools JSONB NOT NULL DEFAULT '{}'::jsonb,
  consolidated_members JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Country Breakdown
  countries_included TEXT[] NOT NULL DEFAULT ARRAY['BD']::TEXT[], -- ISO codes
  country_summaries JSONB NOT NULL DEFAULT '{}'::jsonb, -- Individual country data
  
  -- Calculated Totals (across all countries)
  total_revenue_all_countries NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_expenses_all_countries NUMERIC(15, 2) NOT NULL DEFAULT 0,
  net_income_all_countries NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_prize_pools_all_countries NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_active_members_all_countries INTEGER NOT NULL DEFAULT 0,
  
  -- Reporting Currency (for conversion)
  reporting_currency TEXT NOT NULL DEFAULT 'BDT', -- Future: USD for consolidation
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft', -- draft, finalized, sent
  
  -- Distribution
  sent_to_master_admin BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit Trail
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_consolidated_period UNIQUE (period_year, period_month),
  CONSTRAINT valid_consolidated_status CHECK (status IN ('draft', 'finalized', 'sent'))
);

-- Index for efficient querying
CREATE INDEX idx_consolidated_summaries_period 
  ON consolidated_master_summaries(period_year DESC, period_month DESC);

CREATE INDEX idx_consolidated_summaries_status 
  ON consolidated_master_summaries(status);

-- Enable RLS
ALTER TABLE consolidated_master_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only super_admin can access (future: master_admin)
CREATE POLICY "Super admins can view consolidated summaries"
  ON consolidated_master_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage consolidated summaries"
  ON consolidated_master_summaries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

COMMENT ON TABLE consolidated_master_summaries IS 
  'Multi-country consolidated financial summaries for Master Admin (future). Prepared for expansion beyond Bangladesh.';

-- ====================================================================
-- 3. MONTHLY AUTOMATED SUMMARY QUEUE (FUTURE USE)
-- ====================================================================

CREATE TABLE IF NOT EXISTS master_admin_summary_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Summary Reference
  consolidated_summary_id UUID REFERENCES consolidated_master_summaries(id),
  
  -- Period
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  period_name TEXT NOT NULL,
  
  -- Delivery Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed
  
  -- Email Details (future automation)
  recipient_email TEXT, -- Future: master_admin email
  email_subject TEXT,
  email_body TEXT,
  
  -- Delivery Tracking
  scheduled_send_date TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivery_attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_summary_queue_status CHECK (status IN ('pending', 'sent', 'failed'))
);

-- Index for efficient querying
CREATE INDEX idx_summary_queue_status 
  ON master_admin_summary_queue(status, scheduled_send_date);

CREATE INDEX idx_summary_queue_period 
  ON master_admin_summary_queue(period_year DESC, period_month DESC);

-- Enable RLS
ALTER TABLE master_admin_summary_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only super_admin can access (future: master_admin + super_admin)
CREATE POLICY "Super admins can view summary queue"
  ON master_admin_summary_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage summary queue"
  ON master_admin_summary_queue FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

COMMENT ON TABLE master_admin_summary_queue IS 
  'Queue for automated monthly summary delivery to Master Admin (future). Email automation not yet implemented.';

-- ====================================================================
-- 4. VIEW: COUNTRY SUMMARY OVERVIEW (CURRENT STATE)
-- ====================================================================

CREATE OR REPLACE VIEW country_summary_overview AS
SELECT 
  cfs.id,
  cfs.country_code,
  cfs.country_name,
  cfs.period_year,
  cfs.period_month,
  cfs.period_name,
  cfs.total_revenue,
  cfs.total_expenses,
  cfs.net_income,
  cfs.prize_pool_balance,
  cfs.active_members_count,
  cfs.local_currency,
  cfs.status,
  cfs.generated_at,
  p_gen.full_name AS generated_by_name,
  cfs.finalized_at,
  p_fin.full_name AS finalized_by_name
FROM 
  country_financial_summaries cfs
LEFT JOIN 
  profiles p_gen ON cfs.generated_by = p_gen.id
LEFT JOIN 
  profiles p_fin ON cfs.finalized_by = p_fin.id
ORDER BY 
  cfs.period_year DESC, 
  cfs.period_month DESC,
  cfs.country_code;

COMMENT ON VIEW country_summary_overview IS 
  'Overview of country-level financial summaries with admin names. Currently Bangladesh only.';

-- ====================================================================
-- 5. FUNCTION: AUTO-GENERATE COUNTRY SUMMARY FROM MONTHLY CLOSE
-- ====================================================================

CREATE OR REPLACE FUNCTION auto_generate_country_summary(
  p_period_year INTEGER,
  p_period_month INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_summary_id UUID;
  v_period_start DATE;
  v_period_end DATE;
  v_period_name TEXT;
  v_revenue_data JSONB;
  v_expense_data JSONB;
  v_prize_pool_data JSONB;
  v_member_data JSONB;
  v_total_revenue NUMERIC;
  v_total_expenses NUMERIC;
  v_net_income NUMERIC;
  v_prize_pool_balance NUMERIC;
  v_active_members INTEGER;
BEGIN
  -- Calculate period dates
  v_period_start := DATE(p_period_year || '-' || LPAD(p_period_month::TEXT, 2, '0') || '-01');
  v_period_end := (v_period_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  v_period_name := TO_CHAR(v_period_start, 'Month YYYY');
  
  -- Collect revenue data from monthly_financial_reports
  SELECT 
    jsonb_build_object(
      'membership_income', COALESCE((report_data->'revenue'->>'membership_income')::NUMERIC, 0),
      'referral_income', COALESCE((report_data->'revenue'->>'referral_income')::NUMERIC, 0),
      'total_revenue', COALESCE((report_data->'revenue'->>'total_revenue')::NUMERIC, 0)
    )
  INTO v_revenue_data
  FROM monthly_financial_reports mfr
  JOIN monthly_close_periods mcp ON mfr.close_period_id = mcp.id
  WHERE mcp.period_year = p_period_year
    AND mcp.period_month = p_period_month
    AND mfr.report_type = 'profit_loss'
  LIMIT 1;
  
  -- Collect expense data
  SELECT 
    jsonb_build_object(
      'prize_expenses', COALESCE((report_data->'expenses'->>'prize_expenses')::NUMERIC, 0),
      'referral_bonuses', COALESCE((report_data->'expenses'->>'referral_bonuses')::NUMERIC, 0),
      'tier_bonuses', COALESCE((report_data->'expenses'->>'tier_bonuses')::NUMERIC, 0),
      'community_support', COALESCE((report_data->'expenses'->>'community_support')::NUMERIC, 0),
      'total_expenses', COALESCE((report_data->'expenses'->>'total_expenses')::NUMERIC, 0)
    )
  INTO v_expense_data
  FROM monthly_financial_reports mfr
  JOIN monthly_close_periods mcp ON mfr.close_period_id = mcp.id
  WHERE mcp.period_year = p_period_year
    AND mcp.period_month = p_period_month
    AND mfr.report_type = 'profit_loss'
  LIMIT 1;
  
  -- Collect prize pool data
  SELECT 
    report_data
  INTO v_prize_pool_data
  FROM monthly_financial_reports mfr
  JOIN monthly_close_periods mcp ON mfr.close_period_id = mcp.id
  WHERE mcp.period_year = p_period_year
    AND mcp.period_month = p_period_month
    AND mfr.report_type = 'prize_pool_reconciliation'
  LIMIT 1;
  
  -- Calculate totals
  v_total_revenue := COALESCE((v_revenue_data->>'total_revenue')::NUMERIC, 0);
  v_total_expenses := COALESCE((v_expense_data->>'total_expenses')::NUMERIC, 0);
  v_net_income := v_total_revenue - v_total_expenses;
  v_prize_pool_balance := COALESCE((v_prize_pool_data->>'closing_balance')::NUMERIC, 0);
  
  -- Get active members count
  SELECT COUNT(*)
  INTO v_active_members
  FROM memberships
  WHERE status = 'active'
    AND created_at <= v_period_end;
  
  -- Build member summary
  v_member_data := jsonb_build_object(
    'active_members', v_active_members,
    'total_members', (SELECT COUNT(*) FROM memberships WHERE created_at <= v_period_end)
  );
  
  -- Insert country summary (Bangladesh only for now)
  INSERT INTO country_financial_summaries (
    country_code,
    country_name,
    period_year,
    period_month,
    period_start_date,
    period_end_date,
    period_name,
    revenue_summary,
    expense_summary,
    prize_pool_summary,
    member_summary,
    total_revenue,
    total_expenses,
    net_income,
    prize_pool_balance,
    active_members_count,
    local_currency,
    status,
    generated_at,
    generated_by
  ) VALUES (
    'BD',
    'Bangladesh',
    p_period_year,
    p_period_month,
    v_period_start,
    v_period_end,
    v_period_name,
    v_revenue_data,
    v_expense_data,
    v_prize_pool_data,
    v_member_data,
    v_total_revenue,
    v_total_expenses,
    v_net_income,
    v_prize_pool_balance,
    v_active_members,
    'BDT',
    'draft',
    NOW(),
    auth.uid()
  )
  ON CONFLICT (country_code, period_year, period_month) 
  DO UPDATE SET
    revenue_summary = EXCLUDED.revenue_summary,
    expense_summary = EXCLUDED.expense_summary,
    prize_pool_summary = EXCLUDED.prize_pool_summary,
    member_summary = EXCLUDED.member_summary,
    total_revenue = EXCLUDED.total_revenue,
    total_expenses = EXCLUDED.total_expenses,
    net_income = EXCLUDED.net_income,
    prize_pool_balance = EXCLUDED.prize_pool_balance,
    active_members_count = EXCLUDED.active_members_count,
    updated_at = NOW()
  RETURNING id INTO v_summary_id;
  
  RETURN v_summary_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_generate_country_summary IS 
  'Automatically generate country-level summary from monthly close reports. Currently Bangladesh only. Future: called after monthly close completion.';

-- ====================================================================
-- 6. BOOTSTRAP: CREATE BANGLADESH COUNTRY ENTRY
-- ====================================================================

-- Note: Country summaries will be auto-generated when monthly close is performed
-- This is just structural preparation

-- ====================================================================
-- 7. FUTURE ROLE PREPARATION (NOT ACTIVATED)
-- ====================================================================

-- Note: master_admin role is NOT added to user_role enum yet
-- When needed in future, will run:
-- ALTER TYPE user_role ADD VALUE 'master_admin';

-- For now, super_admin has access to all master admin features

COMMENT ON TABLE country_financial_summaries IS 
  'FUTURE READINESS: Country-level summaries for Master Admin consolidation. Current: Bangladesh only. Future: Multi-country expansion.';

COMMENT ON TABLE consolidated_master_summaries IS 
  'FUTURE READINESS: Consolidated multi-country summaries. Current: Single country (BD). Future: Master Admin consolidated reporting.';

COMMENT ON TABLE master_admin_summary_queue IS 
  'FUTURE READINESS: Automated monthly summary delivery queue. Current: Not activated. Future: Email automation to Master Admin.';