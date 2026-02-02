-- ============================================================================
-- PROMPT A6: ACCOUNTS & EXPENDITURE OPERATIONS SYSTEM
-- Part 11: Payment Processing & Accounting Integration (FIXED)
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS process_expense_payment(UUID, UUID);

-- Create payment processing function with accounting integration
CREATE OR REPLACE FUNCTION process_expense_payment(
  p_expense_id UUID,
  p_processed_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expense RECORD;
  v_account_mapping RECORD;
  v_transaction_id UUID;
  v_debit_account TEXT;
  v_credit_account TEXT := '1010'; -- Cash account
  v_result JSONB;
BEGIN
  -- Get expense details
  SELECT * INTO v_expense
  FROM expense_requests
  WHERE id = p_expense_id
    AND status = 'approved'
    AND payment_date IS NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Expense not found, not approved, or already paid'
    );
  END IF;
  
  -- Get account mapping for this expense category
  SELECT * INTO v_account_mapping
  FROM expense_category_account_mapping
  WHERE expense_category = v_expense.expense_category
    AND is_capex = COALESCE(v_expense.is_capex, FALSE);
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'No account mapping found for expense category'
    );
  END IF;
  
  -- Determine debit account (expense or asset)
  v_debit_account := v_account_mapping.account_code;
  
  -- Create accounting transaction
  INSERT INTO accounting_transactions (
    transaction_date,
    description,
    reference_type,
    reference_id,
    total_amount,
    currency,
    country_code,
    created_by
  )
  VALUES (
    COALESCE(v_expense.expense_date, CURRENT_DATE),
    v_expense.description || ' - ' || v_expense.expense_category,
    'expense_payment',
    p_expense_id,
    v_expense.amount,
    'BDT',
    'BD',
    p_processed_by
  )
  RETURNING id INTO v_transaction_id;
  
  -- Create debit entry (expense or asset)
  INSERT INTO journal_entries (
    transaction_id,
    account_code,
    entry_type,
    amount,
    description
  )
  VALUES (
    v_transaction_id,
    v_debit_account,
    'debit',
    v_expense.amount,
    v_expense.description
  );
  
  -- Create credit entry (cash)
  INSERT INTO journal_entries (
    transaction_id,
    account_code,
    entry_type,
    amount,
    description
  )
  VALUES (
    v_transaction_id,
    v_credit_account,
    'credit',
    v_expense.amount,
    'Payment for ' || v_expense.description
  );
  
  -- If CAPEX, create fixed asset record
  IF v_expense.is_capex THEN
    INSERT INTO fixed_assets (
      asset_name,
      asset_category,
      purchase_date,
      purchase_amount,
      expense_request_id,
      depreciation_method,
      useful_life_years,
      status
    )
    VALUES (
      v_expense.description,
      v_expense.expense_category,
      COALESCE(v_expense.expense_date, CURRENT_DATE),
      v_expense.amount,
      p_expense_id,
      'straight_line',
      CASE 
        WHEN v_expense.expense_category LIKE '%vehicle%' THEN 5
        WHEN v_expense.expense_category LIKE '%office%' THEN 10
        ELSE 5
      END,
      'active'
    );
  END IF;
  
  -- Update expense request status
  UPDATE expense_requests
  SET 
    status = 'paid',
    payment_date = CURRENT_DATE,
    processed_by = p_processed_by,
    updated_at = NOW()
  WHERE id = p_expense_id;
  
  -- Create audit log
  INSERT INTO expense_approval_audit (
    expense_request_id,
    action,
    actor_id,
    notes
  )
  VALUES (
    p_expense_id,
    'paid',
    p_processed_by,
    jsonb_build_object(
      'transaction_id', v_transaction_id,
      'debit_account', v_debit_account,
      'credit_account', v_credit_account,
      'is_capex', COALESCE(v_expense.is_capex, FALSE)
    )::TEXT
  );
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'expense_id', p_expense_id,
    'transaction_id', v_transaction_id,
    'amount', v_expense.amount,
    'debit_account', v_debit_account,
    'credit_account', v_credit_account,
    'is_capex', COALESCE(v_expense.is_capex, FALSE)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_expense_payment TO authenticated;

SELECT jsonb_build_object(
  'part', '11_payment_processing_fixed',
  'function', 'process_expense_payment',
  'accounting_integration', TRUE,
  'capex_asset_creation', TRUE,
  'audit_logging', TRUE
) AS part11_complete;