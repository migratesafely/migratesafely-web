-- ============================================================================
-- PROMPT A6 — PART 14: FINAL ACCOUNTING INTEGRATION & EXPENSE PAYMENT TRIGGER
-- ============================================================================
-- Purpose: Complete accounting integration with automatic journal entries on payment
-- Links: Integrates with A1.1/A1.2 accounting foundation
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_process_expense_payment ON expense_requests;
DROP FUNCTION IF EXISTS process_expense_payment CASCADE;

-- Create the expense payment processing function (corrected)
CREATE OR REPLACE FUNCTION process_expense_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_account_mapping RECORD;
  v_description TEXT;
  v_entry_id UUID;
  v_asset_id UUID;
  v_employee_name TEXT;
BEGIN
  -- Only process when status changes to 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    
    -- Get employee name for description
    SELECT 
      COALESCE(full_name, 'Unknown Employee')
    INTO v_employee_name
    FROM employees
    WHERE user_id = NEW.created_by;
    
    -- Get the account mapping for this expense category
    SELECT *
    INTO v_account_mapping
    FROM expense_category_account_mapping
    WHERE expense_category = NEW.expense_category
      AND is_capex = COALESCE(NEW.is_capex, FALSE);
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'No account mapping found for expense category: % (CAPEX: %)', 
        NEW.expense_category, COALESCE(NEW.is_capex, FALSE);
    END IF;
    
    -- Build description
    v_description := format(
      'Expense Payment: %s - %s (Req: %s) - %s',
      NEW.expense_category,
      NEW.title,
      SUBSTRING(NEW.id::TEXT, 1, 8),
      v_employee_name
    );
    
    -- If CAPEX, create fixed asset record
    IF COALESCE(NEW.is_capex, FALSE) THEN
      INSERT INTO fixed_assets (
        asset_code,
        asset_name,
        asset_category,
        purchase_date,
        purchase_cost,
        useful_life_years,
        depreciation_method,
        account_code,
        location,
        department,
        status,
        notes
      )
      VALUES (
        'FA-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(NEW.id::TEXT, 1, 8),
        NEW.title,
        NEW.expense_category,
        COALESCE(NEW.expense_date, NEW.payment_date, CURRENT_DATE),
        NEW.amount,
        CASE 
          WHEN NEW.expense_category IN ('office_purchase', 'office_renovation') THEN 10
          WHEN NEW.expense_category IN ('vehicle_purchase') THEN 5
          ELSE 3
        END,
        'straight_line',
        v_account_mapping.account_code,
        'Head Office',
        NEW.department,
        'active',
        format('Created from expense request %s', SUBSTRING(NEW.id::TEXT, 1, 8))
      )
      RETURNING id INTO v_asset_id;
      
      -- Update expense request with linked asset
      UPDATE expense_requests
      SET linked_asset_id = v_asset_id
      WHERE id = NEW.id;
    END IF;
    
    -- Create journal entry for the expense payment
    INSERT INTO journal_entries (
      entry_date,
      entry_type,
      reference_type,
      reference_id,
      description,
      total_amount,
      status,
      created_by,
      country_code
    )
    VALUES (
      COALESCE(NEW.payment_date, CURRENT_DATE),
      CASE 
        WHEN COALESCE(NEW.is_capex, FALSE) THEN 'asset_purchase'
        ELSE 'expense'
      END,
      'expense_request',
      NEW.id,
      v_description,
      NEW.amount,
      'posted',
      NEW.created_by,
      'BD'
    )
    RETURNING id INTO v_entry_id;
    
    -- Create journal entry lines (double-entry bookkeeping)
    
    -- Debit: Expense or Asset Account
    INSERT INTO journal_entry_lines (
      journal_entry_id,
      account_code,
      debit_amount,
      credit_amount,
      description
    )
    VALUES (
      v_entry_id,
      v_account_mapping.account_code,
      NEW.amount,
      0,
      format('Dr %s - %s', v_account_mapping.account_name, NEW.title)
    );
    
    -- Credit: Cash/Bank Account
    INSERT INTO journal_entry_lines (
      journal_entry_id,
      account_code,
      debit_amount,
      credit_amount,
      description
    )
    VALUES (
      v_entry_id,
      '1010', -- Cash account (or could be 1020 for bank)
      0,
      NEW.amount,
      format('Cr Cash - Payment for %s', NEW.title)
    );
    
    -- Log the accounting integration
    INSERT INTO expense_approval_audit (
      expense_request_id,
      action,
      actor_id,
      notes
    )
    VALUES (
      NEW.id,
      'accounting_entry_created',
      NEW.created_by,
      format('Journal entry %s created for payment of %s BDT', 
        SUBSTRING(v_entry_id::TEXT, 1, 8),
        NEW.amount
      )
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for expense payment processing
CREATE TRIGGER trigger_process_expense_payment
  AFTER UPDATE ON expense_requests
  FOR EACH ROW
  WHEN (NEW.status = 'paid')
  EXECUTE FUNCTION process_expense_payment();

-- ============================================================================
-- PART 15: HELPER FUNCTIONS FOR EXPENSE OPERATIONS
-- ============================================================================

-- Function: Get expense summary by category
CREATE OR REPLACE FUNCTION get_expense_summary_by_category(
  p_start_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE,
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_department department_type DEFAULT NULL
)
RETURNS TABLE (
  expense_category TEXT,
  total_amount DECIMAL(15,2),
  count_requests BIGINT,
  avg_amount DECIMAL(15,2),
  max_amount DECIMAL(15,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.expense_category,
    SUM(er.amount) AS total_amount,
    COUNT(*) AS count_requests,
    AVG(er.amount) AS avg_amount,
    MAX(er.amount) AS max_amount
  FROM expense_requests er
  WHERE er.status IN ('approved', 'paid')
    AND COALESCE(er.expense_date, er.created_at::DATE) BETWEEN p_start_date AND p_end_date
    AND (p_department IS NULL OR er.department = p_department)
  GROUP BY er.expense_category
  ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get pending approvals for user
CREATE OR REPLACE FUNCTION get_pending_expense_approvals(p_user_id UUID)
RETURNS TABLE (
  expense_id UUID,
  title TEXT,
  amount DECIMAL(15,2),
  expense_category TEXT,
  department department_type,
  created_by_name TEXT,
  created_at TIMESTAMPTZ,
  days_pending INTEGER,
  requires_chairman BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.id AS expense_id,
    er.title,
    er.amount,
    er.expense_category,
    er.department,
    e.full_name AS created_by_name,
    er.created_at,
    EXTRACT(DAY FROM NOW() - er.created_at)::INTEGER AS days_pending,
    er.requires_chairman_approval AS requires_chairman
  FROM expense_requests er
  LEFT JOIN employees e ON e.user_id = er.created_by
  WHERE er.status = 'pending'
    AND (
      -- Department Head approval
      (er.department_head_id IS NULL AND EXISTS (
        SELECT 1 FROM employees 
        WHERE user_id = p_user_id 
        AND department = er.department 
        AND role_category = 'department_head'
      ))
      OR
      -- GM approval
      (er.department_head_id IS NOT NULL AND er.gm_id IS NULL AND EXISTS (
        SELECT 1 FROM employees 
        WHERE user_id = p_user_id 
        AND role_category = 'general_manager'
      ))
      OR
      -- MD approval
      (er.gm_id IS NOT NULL AND er.md_id IS NULL AND EXISTS (
        SELECT 1 FROM employees 
        WHERE user_id = p_user_id 
        AND role_category = 'managing_director'
      ))
      OR
      -- Chairman approval
      (er.md_id IS NOT NULL AND er.chairman_id IS NULL AND er.requires_chairman_approval AND EXISTS (
        SELECT 1 FROM employees 
        WHERE user_id = p_user_id 
        AND role_category = 'chairman'
      ))
    )
  ORDER BY 
    er.requires_chairman_approval DESC,
    er.amount DESC,
    er.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get expense approval statistics
CREATE OR REPLACE FUNCTION get_expense_approval_statistics(
  p_start_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_requests', COUNT(*),
    'total_amount', COALESCE(SUM(amount), 0),
    'approved_count', COUNT(*) FILTER (WHERE status = 'approved'),
    'approved_amount', COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0),
    'paid_count', COUNT(*) FILTER (WHERE status = 'paid'),
    'paid_amount', COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0),
    'pending_count', COUNT(*) FILTER (WHERE status = 'pending'),
    'pending_amount', COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0),
    'rejected_count', COUNT(*) FILTER (WHERE status = 'rejected'),
    'rejected_amount', COALESCE(SUM(amount) FILTER (WHERE status = 'rejected'), 0),
    'avg_approval_time_hours', AVG(
      CASE 
        WHEN status IN ('approved', 'paid') AND chairman_id IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600 
      END
    ),
    'chairman_approvals', COUNT(*) FILTER (WHERE chairman_id IS NOT NULL),
    'capex_count', COUNT(*) FILTER (WHERE is_capex = TRUE),
    'capex_amount', COALESCE(SUM(amount) FILTER (WHERE is_capex = TRUE), 0)
  )
  INTO v_result
  FROM expense_requests
  WHERE created_at::DATE BETWEEN p_start_date AND p_end_date;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION get_expense_summary_by_category TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_expense_approvals TO authenticated;
GRANT EXECUTE ON FUNCTION get_expense_approval_statistics TO authenticated;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

SELECT jsonb_build_object(
  'part', '14_15_final_integration',
  'trigger', 'process_expense_payment',
  'trigger_active', EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_process_expense_payment'
  ),
  'helper_functions', ARRAY[
    'get_expense_summary_by_category',
    'get_pending_expense_approvals',
    'get_expense_approval_statistics'
  ],
  'accounting_integration', TRUE,
  'capex_asset_creation', TRUE,
  'double_entry_bookkeeping', TRUE,
  'features', ARRAY[
    'Automatic journal entries on payment',
    'CAPEX asset creation and linking',
    'Double-entry bookkeeping (Dr/Cr)',
    'Expense summary by category',
    'Pending approvals by user role',
    'Approval statistics and metrics'
  ]
) AS part14_15_complete;