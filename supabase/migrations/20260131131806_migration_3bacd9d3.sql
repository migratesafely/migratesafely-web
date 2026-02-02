-- ============================================================================
-- PROMPT A1.2: MONTHLY PROFIT & LOSS REPORTING (COUNTRY LEVEL)
-- Backend + Database ONLY | Bangladesh (BDT) only | ADDITIVE ONLY
-- ============================================================================

-- ============================================================================
-- 1. MONTHLY P&L STORAGE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS monthly_profit_loss (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL DEFAULT 'BD',
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  
  -- Revenue breakdown
  total_revenue NUMERIC(15, 2) NOT NULL DEFAULT 0,
  revenue_breakdown JSONB NOT NULL DEFAULT '{}', -- {membership_fees, agent_fees, other_income}
  
  -- Expense breakdown
  total_expenses NUMERIC(15, 2) NOT NULL DEFAULT 0,
  expense_breakdown JSONB NOT NULL DEFAULT '{}', -- {referral_bonuses, tier_bonuses, salaries, office_costs, etc}
  
  -- Net profit/loss
  net_profit NUMERIC(15, 2) NOT NULL DEFAULT 0, -- total_revenue - total_expenses
  
  -- Metadata
  currency TEXT NOT NULL DEFAULT 'BDT',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized')),
  
  -- Governance
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES profiles(id),
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES profiles(id),
  
  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(country_code, period_year, period_month),
  FOREIGN KEY (period_year, period_month) REFERENCES monthly_close_periods(period_year, period_month)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_pl_period ON monthly_profit_loss(period_year DESC, period_month DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_pl_status ON monthly_profit_loss(status);
CREATE INDEX IF NOT EXISTS idx_monthly_pl_country ON monthly_profit_loss(country_code);

-- ============================================================================
-- 2. RLS POLICIES FOR MONTHLY P&L
-- ============================================================================

ALTER TABLE monthly_profit_loss ENABLE ROW LEVEL SECURITY;

-- Only Super Admin and Chairman can view P&L reports
CREATE POLICY "super_admin_chairman_view_pl"
ON monthly_profit_loss FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.user_id = auth.uid()
    AND e.role_category IN ('chairman', 'managing_director')
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'super_admin'
  )
);

-- Only Super Admin can generate P&L reports
CREATE POLICY "super_admin_generate_pl"
ON monthly_profit_loss FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'super_admin'
  )
);

-- Only Super Admin can finalize P&L reports
CREATE POLICY "super_admin_finalize_pl"
ON monthly_profit_loss FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'super_admin'
  )
);

-- ============================================================================
-- 3. P&L GENERATION RPC FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_monthly_pl(
  p_year INTEGER,
  p_month INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
  v_period_status TEXT;
  v_period_start DATE;
  v_period_end DATE;
  v_total_revenue NUMERIC(15, 2) := 0;
  v_total_expenses NUMERIC(15, 2) := 0;
  v_net_profit NUMERIC(15, 2) := 0;
  v_revenue_breakdown JSONB := '{}';
  v_expense_breakdown JSONB := '{}';
  v_pl_id UUID;
BEGIN
  -- 1. Verify user is Super Admin
  SELECT role INTO v_user_role
  FROM profiles
  WHERE id = auth.uid();

  IF v_user_role != 'super_admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only Super Admin can generate P&L reports'
    );
  END IF;

  -- 2. Verify period is CLOSED
  SELECT status, period_start_date, period_end_date
  INTO v_period_status, v_period_start, v_period_end
  FROM monthly_close_periods
  WHERE period_year = p_year
    AND period_month = p_month;

  IF v_period_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Period does not exist'
    );
  END IF;

  IF v_period_status NOT IN ('closed', 'locked') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Period must be CLOSED before generating P&L'
    );
  END IF;

  -- 3. Calculate Revenue (SUM of credits to Income accounts 4000-4999)
  SELECT 
    COALESCE(SUM(credit_amount), 0)
  INTO v_total_revenue
  FROM general_ledger
  WHERE entry_date BETWEEN v_period_start AND v_period_end
    AND account_code >= '4000'
    AND account_code < '5000'
    AND credit_amount > 0;

  -- Revenue breakdown by account
  v_revenue_breakdown := (
    SELECT jsonb_object_agg(
      coa.account_name,
      COALESCE(SUM(gl.credit_amount), 0)
    )
    FROM chart_of_accounts coa
    LEFT JOIN general_ledger gl ON gl.account_code = coa.account_code
      AND gl.entry_date BETWEEN v_period_start AND v_period_end
      AND gl.credit_amount > 0
    WHERE coa.account_code >= '4000'
      AND coa.account_code < '5000'
      AND coa.is_active = true
    GROUP BY coa.account_name
  );

  -- 4. Calculate Expenses (SUM of debits to Expense accounts 5000-5999)
  SELECT 
    COALESCE(SUM(debit_amount), 0)
  INTO v_total_expenses
  FROM general_ledger
  WHERE entry_date BETWEEN v_period_start AND v_period_end
    AND account_code >= '5000'
    AND account_code < '6000'
    AND debit_amount > 0;

  -- Expense breakdown by account
  v_expense_breakdown := (
    SELECT jsonb_object_agg(
      coa.account_name,
      COALESCE(SUM(gl.debit_amount), 0)
    )
    FROM chart_of_accounts coa
    LEFT JOIN general_ledger gl ON gl.account_code = coa.account_code
      AND gl.entry_date BETWEEN v_period_start AND v_period_end
      AND gl.debit_amount > 0
    WHERE coa.account_code >= '5000'
      AND coa.account_code < '6000'
      AND coa.is_active = true
    GROUP BY coa.account_name
  );

  -- 5. Calculate Net Profit/Loss
  v_net_profit := v_total_revenue - v_total_expenses;

  -- 6. Insert or Update P&L record
  INSERT INTO monthly_profit_loss (
    country_code,
    period_year,
    period_month,
    period_start_date,
    period_end_date,
    total_revenue,
    revenue_breakdown,
    total_expenses,
    expense_breakdown,
    net_profit,
    currency,
    status,
    generated_by,
    generated_at
  ) VALUES (
    'BD',
    p_year,
    p_month,
    v_period_start,
    v_period_end,
    v_total_revenue,
    COALESCE(v_revenue_breakdown, '{}'),
    v_total_expenses,
    COALESCE(v_expense_breakdown, '{}'),
    v_net_profit,
    'BDT',
    'draft',
    auth.uid(),
    NOW()
  )
  ON CONFLICT (country_code, period_year, period_month)
  DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    revenue_breakdown = EXCLUDED.revenue_breakdown,
    total_expenses = EXCLUDED.total_expenses,
    expense_breakdown = EXCLUDED.expense_breakdown,
    net_profit = EXCLUDED.net_profit,
    generated_by = EXCLUDED.generated_by,
    generated_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_pl_id;

  -- 7. Log P&L generation in audit_logs
  INSERT INTO audit_logs (action, actor_id, details, timestamp)
  VALUES (
    'pl_report_generated',
    auth.uid(),
    jsonb_build_object(
      'pl_id', v_pl_id,
      'period_year', p_year,
      'period_month', p_month,
      'total_revenue', v_total_revenue,
      'total_expenses', v_total_expenses,
      'net_profit', v_net_profit,
      'currency', 'BDT'
    ),
    NOW()
  );

  -- 8. Return success with P&L summary
  RETURN jsonb_build_object(
    'success', true,
    'message', 'P&L report generated successfully',
    'pl_id', v_pl_id,
    'period', p_year || '-' || LPAD(p_month::TEXT, 2, '0'),
    'total_revenue', v_total_revenue,
    'total_expenses', v_total_expenses,
    'net_profit', v_net_profit,
    'status', 'draft'
  );
END;
$$;

-- ============================================================================
-- 4. P&L FINALIZATION RPC FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION finalize_monthly_pl(
  p_pl_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
  v_current_status TEXT;
  v_period_year INTEGER;
  v_period_month INTEGER;
BEGIN
  -- 1. Verify user is Super Admin
  SELECT role INTO v_user_role
  FROM profiles
  WHERE id = auth.uid();

  IF v_user_role != 'super_admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only Super Admin can finalize P&L reports'
    );
  END IF;

  -- 2. Get current status
  SELECT status, period_year, period_month
  INTO v_current_status, v_period_year, v_period_month
  FROM monthly_profit_loss
  WHERE id = p_pl_id;

  IF v_current_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'P&L report not found'
    );
  END IF;

  IF v_current_status = 'finalized' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'P&L report is already finalized'
    );
  END IF;

  -- 3. Finalize the P&L report (immutable after this)
  UPDATE monthly_profit_loss
  SET 
    status = 'finalized',
    finalized_by = auth.uid(),
    finalized_at = NOW(),
    updated_at = NOW()
  WHERE id = p_pl_id;

  -- 4. Log finalization in audit_logs
  INSERT INTO audit_logs (action, actor_id, details, timestamp)
  VALUES (
    'pl_report_finalized',
    auth.uid(),
    jsonb_build_object(
      'pl_id', p_pl_id,
      'period_year', v_period_year,
      'period_month', v_period_month
    ),
    NOW()
  );

  -- 5. Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'P&L report finalized successfully',
    'pl_id', p_pl_id,
    'period', v_period_year || '-' || LPAD(v_period_month::TEXT, 2, '0'),
    'status', 'finalized'
  );
END;
$$;

-- ============================================================================
-- 5. IMMUTABILITY ENFORCEMENT
-- ============================================================================

-- Prevent modification of finalized P&L reports
CREATE OR REPLACE FUNCTION prevent_finalized_pl_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'finalized' AND (
    NEW.total_revenue != OLD.total_revenue OR
    NEW.total_expenses != OLD.total_expenses OR
    NEW.net_profit != OLD.net_profit OR
    NEW.revenue_breakdown != OLD.revenue_breakdown OR
    NEW.expense_breakdown != OLD.expense_breakdown
  ) THEN
    RAISE EXCEPTION 'Cannot modify finalized P&L report %', OLD.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_pl_immutability
BEFORE UPDATE ON monthly_profit_loss
FOR EACH ROW EXECUTE FUNCTION prevent_finalized_pl_modification();

-- ============================================================================
-- 6. AUDIT LOGGING FOR ALL P&L ACTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION log_pl_actions()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (action, actor_id, details, timestamp)
    VALUES (
      'pl_report_created',
      auth.uid(),
      jsonb_build_object(
        'pl_id', NEW.id,
        'period_year', NEW.period_year,
        'period_month', NEW.period_month,
        'total_revenue', NEW.total_revenue,
        'total_expenses', NEW.total_expenses,
        'net_profit', NEW.net_profit
      ),
      NOW()
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'finalized' AND OLD.status = 'draft' THEN
    -- Already logged by finalize_monthly_pl function
    NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_pl_actions_trigger
AFTER INSERT OR UPDATE ON monthly_profit_loss
FOR EACH ROW EXECUTE FUNCTION log_pl_actions();

-- ============================================================================
-- 7. HELPER FUNCTION: GET LATEST P&L FOR PERIOD
-- ============================================================================

CREATE OR REPLACE FUNCTION get_monthly_pl(
  p_year INTEGER,
  p_month INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pl_record RECORD;
BEGIN
  -- Verify user has access (Super Admin or Chairman)
  IF NOT EXISTS (
    SELECT 1 FROM employees e
    WHERE e.user_id = auth.uid()
    AND e.role_category IN ('chairman', 'managing_director')
  ) AND NOT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'super_admin'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Access denied'
    );
  END IF;

  -- Get P&L record
  SELECT * INTO v_pl_record
  FROM monthly_profit_loss
  WHERE period_year = p_year
    AND period_month = p_month
    AND country_code = 'BD';

  IF v_pl_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'P&L report not found for this period'
    );
  END IF;

  -- Return P&L data
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'id', v_pl_record.id,
      'period_year', v_pl_record.period_year,
      'period_month', v_pl_record.period_month,
      'period_start_date', v_pl_record.period_start_date,
      'period_end_date', v_pl_record.period_end_date,
      'total_revenue', v_pl_record.total_revenue,
      'revenue_breakdown', v_pl_record.revenue_breakdown,
      'total_expenses', v_pl_record.total_expenses,
      'expense_breakdown', v_pl_record.expense_breakdown,
      'net_profit', v_pl_record.net_profit,
      'currency', v_pl_record.currency,
      'status', v_pl_record.status,
      'generated_at', v_pl_record.generated_at,
      'finalized_at', v_pl_record.finalized_at
    )
  );
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON monthly_profit_loss TO authenticated;
GRANT INSERT ON monthly_profit_loss TO authenticated;
GRANT UPDATE ON monthly_profit_loss TO authenticated;

-- ============================================================================
-- PROMPT A1.2 IMPLEMENTATION COMPLETE
-- ============================================================================

COMMENT ON TABLE monthly_profit_loss IS 'PROMPT A1.2: Monthly Profit & Loss reports. Generated ONLY after period is CLOSED. Immutable once finalized. Super Admin governance.';
COMMENT ON FUNCTION generate_monthly_pl IS 'PROMPT A1.2: Generate P&L report from closed period ledger. Super Admin only.';
COMMENT ON FUNCTION finalize_monthly_pl IS 'PROMPT A1.2: Finalize P&L report (immutable). Super Admin only.';
COMMENT ON FUNCTION get_monthly_pl IS 'PROMPT A1.2: Retrieve P&L report. Super Admin and Chairman access.';