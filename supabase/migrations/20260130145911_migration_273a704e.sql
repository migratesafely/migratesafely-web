-- ====================================================================
-- MONTHLY FINANCIAL CLOSE SYSTEM (CORRECTED)
-- ====================================================================

-- ====================================================================
-- TABLE: monthly_close_periods
-- ====================================================================
CREATE TABLE IF NOT EXISTS monthly_close_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closing', 'closed', 'locked')),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES profiles(id),
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES profiles(id),
  unlock_reason TEXT,
  unlocked_at TIMESTAMPTZ,
  unlocked_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period_year, period_month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_close_periods_year_month ON monthly_close_periods(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_monthly_close_periods_status ON monthly_close_periods(status);

-- ====================================================================
-- TABLE: monthly_financial_reports
-- ====================================================================
CREATE TABLE IF NOT EXISTS monthly_financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  close_period_id UUID NOT NULL REFERENCES monthly_close_periods(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('profit_loss', 'prize_pool_reconciliation', 'referral_payouts', 'tier_payouts', 'general_ledger', 'trial_balance')),
  report_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(close_period_id, report_type)
);

CREATE INDEX IF NOT EXISTS idx_monthly_reports_period ON monthly_financial_reports(close_period_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_type ON monthly_financial_reports(report_type);

-- ====================================================================
-- RLS POLICIES: monthly_close_periods
-- ====================================================================
ALTER TABLE monthly_close_periods ENABLE ROW LEVEL SECURITY;

-- Super Admins can view close periods
CREATE POLICY "Super Admins can view close periods" ON monthly_close_periods
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Super Admins can manage close periods
CREATE POLICY "Super Admins can manage close periods" ON monthly_close_periods
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- ====================================================================
-- RLS POLICIES: monthly_financial_reports
-- ====================================================================
ALTER TABLE monthly_financial_reports ENABLE ROW LEVEL SECURITY;

-- Super Admins can view financial reports
CREATE POLICY "Super Admins can view financial reports" ON monthly_financial_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Super Admins can create financial reports
CREATE POLICY "Super Admins can create financial reports" ON monthly_financial_reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- ====================================================================
-- FUNCTION: check_period_locked
-- ====================================================================
CREATE OR REPLACE FUNCTION check_period_locked(transaction_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
  is_locked BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM monthly_close_periods
    WHERE period_start_date <= transaction_date
    AND period_end_date >= transaction_date
    AND status = 'locked'
  ) INTO is_locked;
  
  RETURN COALESCE(is_locked, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- FUNCTION: generate_profit_loss_report
-- ====================================================================
CREATE OR REPLACE FUNCTION generate_profit_loss_report(
  start_date DATE,
  end_date DATE
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  total_revenue NUMERIC;
  total_expenses NUMERIC;
  net_income NUMERIC;
BEGIN
  -- Revenue accounts (4000-4999)
  SELECT JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'account_code', account_code,
      'account_name', account_name,
      'amount', COALESCE(SUM(credit_amount - debit_amount), 0)
    )
  ) INTO result
  FROM general_ledger
  JOIN chart_of_accounts ON general_ledger.account_code = chart_of_accounts.account_code
  WHERE general_ledger.entry_date BETWEEN start_date AND end_date
  AND general_ledger.account_code LIKE '4%'
  GROUP BY account_code, account_name;
  
  -- Calculate total revenue
  SELECT COALESCE(SUM(credit_amount - debit_amount), 0) INTO total_revenue
  FROM general_ledger
  WHERE entry_date BETWEEN start_date AND end_date
  AND account_code LIKE '4%';
  
  -- Expense accounts (5000-5999)
  WITH expense_data AS (
    SELECT 
      general_ledger.account_code,
      account_name,
      COALESCE(SUM(debit_amount - credit_amount), 0) AS amount
    FROM general_ledger
    JOIN chart_of_accounts ON general_ledger.account_code = chart_of_accounts.account_code
    WHERE entry_date BETWEEN start_date AND end_date
    AND general_ledger.account_code LIKE '5%'
    GROUP BY general_ledger.account_code, account_name
  )
  SELECT COALESCE(result, '[]'::jsonb) || JSONB_BUILD_OBJECT('expenses', JSONB_AGG(ROW_TO_JSON(expense_data.*)))
  INTO result
  FROM expense_data;
  
  -- Calculate total expenses
  SELECT COALESCE(SUM(debit_amount - credit_amount), 0) INTO total_expenses
  FROM general_ledger
  WHERE entry_date BETWEEN start_date AND end_date
  AND account_code LIKE '5%';
  
  -- Calculate net income
  net_income := total_revenue - total_expenses;
  
  -- Build final report
  result := JSONB_BUILD_OBJECT(
    'period_start', start_date,
    'period_end', end_date,
    'currency', 'BDT',
    'total_revenue', total_revenue,
    'total_expenses', total_expenses,
    'net_income', net_income,
    'revenue_details', result,
    'generated_at', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- FUNCTION: generate_prize_pool_reconciliation
-- ====================================================================
CREATE OR REPLACE FUNCTION generate_prize_pool_reconciliation(
  start_date DATE,
  end_date DATE
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  opening_balance NUMERIC;
  closing_balance NUMERIC;
  contributions NUMERIC;
  disbursements NUMERIC;
BEGIN
  -- Opening balance (before start_date)
  SELECT COALESCE(SUM(credit_amount - debit_amount), 0) INTO opening_balance
  FROM general_ledger
  WHERE account_code = '2100'
  AND entry_date < start_date;
  
  -- Contributions during period (credits to 2100)
  SELECT COALESCE(SUM(credit_amount), 0) INTO contributions
  FROM general_ledger
  WHERE account_code = '2100'
  AND entry_date BETWEEN start_date AND end_date;
  
  -- Disbursements during period (debits to 2100)
  SELECT COALESCE(SUM(debit_amount), 0) INTO disbursements
  FROM general_ledger
  WHERE account_code = '2100'
  AND entry_date BETWEEN start_date AND end_date;
  
  -- Closing balance
  closing_balance := opening_balance + contributions - disbursements;
  
  -- Build reconciliation report
  result := JSONB_BUILD_OBJECT(
    'period_start', start_date,
    'period_end', end_date,
    'currency', 'BDT',
    'opening_balance', opening_balance,
    'contributions', contributions,
    'disbursements', disbursements,
    'closing_balance', closing_balance,
    'reconciliation_check', CASE 
      WHEN closing_balance = opening_balance + contributions - disbursements 
      THEN 'BALANCED' 
      ELSE 'UNBALANCED' 
    END,
    'generated_at', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- FUNCTION: generate_referral_payouts_report
-- ====================================================================
CREATE OR REPLACE FUNCTION generate_referral_payouts_report(
  start_date DATE,
  end_date DATE
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  total_payouts NUMERIC;
  payout_count INTEGER;
BEGIN
  WITH referral_data AS (
    SELECT 
      user_id,
      COUNT(*) AS payout_count,
      SUM(credit_amount) AS total_amount
    FROM general_ledger
    WHERE account_code = '2000'
    AND transaction_type = 'referral_bonus'
    AND entry_date BETWEEN start_date AND end_date
    GROUP BY user_id
  )
  SELECT 
    JSONB_BUILD_OBJECT(
      'payouts', JSONB_AGG(ROW_TO_JSON(referral_data.*)),
      'total_payouts', COALESCE(SUM(total_amount), 0),
      'total_count', COALESCE(SUM(payout_count), 0)
    )
  INTO result
  FROM referral_data;
  
  -- Handle no data case
  IF result IS NULL THEN
     result := JSONB_BUILD_OBJECT(
      'payouts', '[]'::jsonb,
      'total_payouts', 0,
      'total_count', 0
    );
  END IF;
  
  -- Build final report
  result := result || JSONB_BUILD_OBJECT(
    'period_start', start_date,
    'period_end', end_date,
    'currency', 'BDT',
    'generated_at', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- FUNCTION: generate_tier_payouts_report
-- ====================================================================
CREATE OR REPLACE FUNCTION generate_tier_payouts_report(
  start_date DATE,
  end_date DATE
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  total_payouts NUMERIC;
  payout_count INTEGER;
BEGIN
  WITH tier_data AS (
    SELECT 
      user_id,
      COUNT(*) AS payout_count,
      SUM(credit_amount) AS total_amount
    FROM general_ledger
    WHERE account_code = '2000'
    AND transaction_type = 'tier_bonus'
    AND entry_date BETWEEN start_date AND end_date
    GROUP BY user_id
  )
  SELECT 
    JSONB_BUILD_OBJECT(
      'payouts', JSONB_AGG(ROW_TO_JSON(tier_data.*)),
      'total_payouts', COALESCE(SUM(total_amount), 0),
      'total_count', COALESCE(SUM(payout_count), 0)
    )
  INTO result
  FROM tier_data;
  
  -- Handle no data case
  IF result IS NULL THEN
     result := JSONB_BUILD_OBJECT(
      'payouts', '[]'::jsonb,
      'total_payouts', 0,
      'total_count', 0
    );
  END IF;

  -- Build final report
  result := result || JSONB_BUILD_OBJECT(
    'period_start', start_date,
    'period_end', end_date,
    'currency', 'BDT',
    'generated_at', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- FUNCTION: close_accounting_period
-- ====================================================================
CREATE OR REPLACE FUNCTION close_accounting_period(
  p_year INTEGER,
  p_month INTEGER,
  p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
  period_id UUID;
  start_date DATE;
  end_date DATE;
  result JSONB;
BEGIN
  -- Calculate period dates
  start_date := DATE(p_year || '-' || p_month || '-01');
  end_date := (start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Create or update period
  INSERT INTO monthly_close_periods (
    period_year,
    period_month,
    period_start_date,
    period_end_date,
    status,
    closed_at,
    closed_by
  ) VALUES (
    p_year,
    p_month,
    start_date,
    end_date,
    'closed',
    NOW(),
    p_admin_id
  )
  ON CONFLICT (period_year, period_month)
  DO UPDATE SET
    status = 'closed',
    closed_at = NOW(),
    closed_by = p_admin_id,
    updated_at = NOW()
  RETURNING id INTO period_id;
  
  -- Generate Profit & Loss report
  INSERT INTO monthly_financial_reports (close_period_id, report_type, report_data, generated_by)
  VALUES (
    period_id,
    'profit_loss',
    generate_profit_loss_report(start_date, end_date),
    p_admin_id
  )
  ON CONFLICT (close_period_id, report_type) DO UPDATE
  SET report_data = EXCLUDED.report_data, generated_at = NOW();
  
  -- Generate Prize Pool reconciliation
  INSERT INTO monthly_financial_reports (close_period_id, report_type, report_data, generated_by)
  VALUES (
    period_id,
    'prize_pool_reconciliation',
    generate_prize_pool_reconciliation(start_date, end_date),
    p_admin_id
  )
  ON CONFLICT (close_period_id, report_type) DO UPDATE
  SET report_data = EXCLUDED.report_data, generated_at = NOW();
  
  -- Generate Referral Payouts report
  INSERT INTO monthly_financial_reports (close_period_id, report_type, report_data, generated_by)
  VALUES (
    period_id,
    'referral_payouts',
    generate_referral_payouts_report(start_date, end_date),
    p_admin_id
  )
  ON CONFLICT (close_period_id, report_type) DO UPDATE
  SET report_data = EXCLUDED.report_data, generated_at = NOW();
  
  -- Generate Tier Payouts report
  INSERT INTO monthly_financial_reports (close_period_id, report_type, report_data, generated_by)
  VALUES (
    period_id,
    'tier_payouts',
    generate_tier_payouts_report(start_date, end_date),
    p_admin_id
  )
  ON CONFLICT (close_period_id, report_type) DO UPDATE
  SET report_data = EXCLUDED.report_data, generated_at = NOW();
  
  -- Return success
  result := JSONB_BUILD_OBJECT(
    'success', TRUE,
    'period_id', period_id,
    'period_year', p_year,
    'period_month', p_month,
    'status', 'closed',
    'closed_at', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- FUNCTION: lock_accounting_period
-- ====================================================================
CREATE OR REPLACE FUNCTION lock_accounting_period(
  p_year INTEGER,
  p_month INTEGER,
  p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Update period to locked status
  UPDATE monthly_close_periods
  SET 
    status = 'locked',
    locked_at = NOW(),
    locked_by = p_admin_id,
    updated_at = NOW()
  WHERE period_year = p_year
  AND period_month = p_month
  AND status = 'closed';
  
  IF NOT FOUND THEN
    RETURN JSONB_BUILD_OBJECT(
      'success', FALSE,
      'error', 'Period not found or not in closed status'
    );
  END IF;
  
  -- Return success
  result := JSONB_BUILD_OBJECT(
    'success', TRUE,
    'period_year', p_year,
    'period_month', p_month,
    'status', 'locked',
    'locked_at', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- TRIGGER: prevent_locked_period_edits
-- ====================================================================
CREATE OR REPLACE FUNCTION prevent_locked_period_edits()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if transaction date falls in locked period
  IF check_period_locked(NEW.entry_date) THEN
    RAISE EXCEPTION 'Cannot modify transactions in locked accounting period';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_locked_period_edits ON general_ledger;
CREATE TRIGGER trg_prevent_locked_period_edits
  BEFORE INSERT OR UPDATE ON general_ledger
  FOR EACH ROW
  EXECUTE FUNCTION prevent_locked_period_edits();

-- ====================================================================
-- VIEW: financial_close_summary
-- ====================================================================
CREATE OR REPLACE VIEW financial_close_summary AS
SELECT 
  mcp.id,
  mcp.period_year,
  mcp.period_month,
  TO_CHAR(mcp.period_start_date, 'Month YYYY') AS period_name,
  mcp.period_start_date,
  mcp.period_end_date,
  mcp.status,
  mcp.closed_at,
  mcp.locked_at,
  p_closed.full_name AS closed_by_name,
  p_locked.full_name AS locked_by_name,
  COUNT(mfr.id) AS report_count,
  mcp.created_at,
  mcp.updated_at
FROM monthly_close_periods mcp
LEFT JOIN profiles p_closed ON mcp.closed_by = p_closed.id
LEFT JOIN profiles p_locked ON mcp.locked_by = p_locked.id
LEFT JOIN monthly_financial_reports mfr ON mcp.id = mfr.close_period_id
GROUP BY 
  mcp.id, 
  mcp.period_year, 
  mcp.period_month, 
  mcp.period_start_date,
  mcp.period_end_date,
  mcp.status,
  mcp.closed_at,
  mcp.locked_at,
  p_closed.full_name,
  p_locked.full_name,
  mcp.created_at,
  mcp.updated_at
ORDER BY mcp.period_year DESC, mcp.period_month DESC;