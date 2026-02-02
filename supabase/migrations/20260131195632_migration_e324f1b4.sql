-- ============================================================================
-- PROMPT A6 - PART 13: PETTY CASH RECONCILIATION
-- Complete petty cash management with reconciliation
-- ============================================================================

-- Create petty cash spend tracking table
CREATE TABLE IF NOT EXISTS petty_cash_spends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES petty_cash_wallets(id) ON DELETE CASCADE,
  expense_request_id UUID REFERENCES expense_requests(id) ON DELETE SET NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  spend_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  receipt_url TEXT,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_petty_cash_spends_wallet ON petty_cash_spends(wallet_id);
CREATE INDEX IF NOT EXISTS idx_petty_cash_spends_date ON petty_cash_spends(spend_date);
CREATE INDEX IF NOT EXISTS idx_petty_cash_spends_expense ON petty_cash_spends(expense_request_id);

-- Enable RLS
ALTER TABLE petty_cash_spends ENABLE ROW LEVEL SECURITY;

-- RLS Policies for petty cash spends
CREATE POLICY "petty_cash_spends_select_policy" ON petty_cash_spends
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.user_id = auth.uid()
    AND (e.department = 'accounts' OR e.role_category IN ('chairman', 'managing_director'))
    AND e.status = 'active'
  )
);

CREATE POLICY "petty_cash_spends_insert_policy" ON petty_cash_spends
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.user_id = auth.uid()
    AND e.department = 'accounts'
    AND e.status = 'active'
  )
);

-- Create petty cash reconciliation function
CREATE OR REPLACE FUNCTION reconcile_petty_cash_wallet(
  p_wallet_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet petty_cash_wallets%ROWTYPE;
  v_total_spends DECIMAL(15,2);
  v_calculated_balance DECIMAL(15,2);
  v_discrepancy DECIMAL(15,2);
  v_result jsonb;
BEGIN
  -- Get wallet
  SELECT * INTO v_wallet
  FROM petty_cash_wallets
  WHERE id = p_wallet_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Petty cash wallet not found';
  END IF;
  
  -- Calculate total spends
  SELECT COALESCE(SUM(amount), 0) INTO v_total_spends
  FROM petty_cash_spends
  WHERE wallet_id = p_wallet_id;
  
  -- Calculate expected balance
  v_calculated_balance := v_wallet.total_amount - v_total_spends;
  
  -- Calculate discrepancy
  v_discrepancy := v_wallet.current_balance - v_calculated_balance;
  
  -- Update wallet balance
  UPDATE petty_cash_wallets
  SET 
    current_balance = v_calculated_balance,
    last_reconciliation_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = p_wallet_id;
  
  -- Build result
  v_result := jsonb_build_object(
    'wallet_id', p_wallet_id,
    'total_allocated', v_wallet.total_amount,
    'total_spent', v_total_spends,
    'calculated_balance', v_calculated_balance,
    'previous_balance', v_wallet.current_balance,
    'discrepancy', v_discrepancy,
    'reconciliation_date', CURRENT_DATE,
    'status', CASE 
      WHEN v_discrepancy = 0 THEN 'balanced'
      WHEN ABS(v_discrepancy) < 10 THEN 'minor_discrepancy'
      ELSE 'major_discrepancy'
    END
  );
  
  RETURN v_result;
END;
$$;

-- ============================================================================
-- PART 13 COMPLETE
-- ============================================================================

SELECT jsonb_build_object(
  'part', '13_petty_cash_reconciliation',
  'table', 'petty_cash_spends',
  'function', 'reconcile_petty_cash_wallet',
  'features', ARRAY[
    'Individual spend tracking',
    'Receipt upload support',
    'Automatic reconciliation',
    'Discrepancy detection',
    'Balance verification'
  ]
) AS part13_complete;