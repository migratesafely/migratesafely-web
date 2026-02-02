-- ============================================================================
-- PROMPT A1.1: FORMAL ACCOUNTING FOUNDATION
-- SCOPE: Backend/Database ONLY - NO UI changes
-- PURPOSE: Complete accounting foundation with COA, expenses, approvals
-- ============================================================================

-- ============================================================================
-- 1. POPULATE CHART OF ACCOUNTS (COA)
-- Assets (1000-1999), Liabilities (2000-2999), Income (4000-4999), Expenses (5000-5999)
-- ============================================================================

-- Assets (1000-1999)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, description, is_restricted, is_active) VALUES
('1000', 'Assets', 'ASSET', 'Root asset account', true, true),
('1100', 'Cash and Cash Equivalents', 'ASSET', 'Cash and bank accounts', false, true),
('1110', 'Cash on Hand', 'ASSET', 'Physical cash in office', false, true),
('1120', 'Bank Account - Operating', 'ASSET', 'Primary operating bank account', false, true),
('1200', 'Receivables', 'ASSET', 'Amounts owed to company', false, true),
('1210', 'Membership Fees Receivable', 'ASSET', 'Unpaid membership fees', false, true),
('1220', 'Agent Fees Receivable', 'ASSET', 'Unpaid agent commissions', false, true)
ON CONFLICT (account_code) DO NOTHING;

-- Liabilities (2000-2999)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, description, is_restricted, is_active) VALUES
('2000', 'Liabilities', 'LIABILITY', 'Root liability account', true, true),
('2100', 'Prize Draw Pool Payable', 'LIABILITY', 'Allocated prize pool awaiting distribution', true, true),
('2110', 'Random Prize Pool Payable', 'LIABILITY', 'Random draw sub-pool liability', true, true),
('2120', 'Community Prize Pool Payable', 'LIABILITY', 'Community support sub-pool liability', true, true),
('2200', 'Accrued Expenses', 'LIABILITY', 'Expenses incurred but not yet paid', false, true),
('2210', 'Accrued Salaries', 'LIABILITY', 'Salaries earned but not paid', false, true),
('2220', 'Accrued Bonuses', 'LIABILITY', 'Bonuses approved but not paid', false, true),
('2300', 'Payroll Payable', 'LIABILITY', 'Pending payroll payments', false, true),
('2310', 'Employee Salaries Payable', 'LIABILITY', 'Salaries pending payment', false, true),
('2320', 'Tax Deductions Payable', 'LIABILITY', 'Employee tax withholdings', false, true)
ON CONFLICT (account_code) DO NOTHING;

-- Income (4000-4999)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, description, is_restricted, is_active) VALUES
('4000', 'Income', 'INCOME', 'Root income account', true, true),
('4100', 'Membership Fees', 'INCOME', 'Annual membership subscription revenue', false, true),
('4110', 'New Membership Fees', 'INCOME', 'Revenue from new member sign-ups', false, true),
('4120', 'Renewal Membership Fees', 'INCOME', 'Revenue from membership renewals', false, true),
('4200', 'Agent Fees', 'INCOME', 'Revenue from agent partnerships', false, true),
('4300', 'Other Operating Income', 'INCOME', 'Miscellaneous operational revenue', false, true)
ON CONFLICT (account_code) DO NOTHING;

-- Expenses (5000-5999)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, description, is_restricted, is_active) VALUES
('5000', 'Expenses', 'EXPENSE', 'Root expense account', true, true),
('5100', 'Referral Bonus Expense', 'EXPENSE', 'Bonuses paid to referring members', false, true),
('5200', 'Tier Percentage Bonus Expense', 'EXPENSE', 'Tier-based percentage bonuses on renewals', false, true),
('5300', 'Tier Lump-Sum Achievement Bonus', 'EXPENSE', 'One-time tier achievement bonuses', false, true),
('5400', 'Salaries and Wages', 'EXPENSE', 'Employee compensation', false, true),
('5410', 'Executive Salaries', 'EXPENSE', 'Chairman, MD, GM salaries', false, true),
('5420', 'Staff Salaries', 'EXPENSE', 'Regular staff salaries', false, true),
('5430', 'Support Staff Wages', 'EXPENSE', 'Guards, cleaners, support wages', false, true),
('5500', 'Office Rent', 'EXPENSE', 'Monthly office rental expense', false, true),
('5600', 'Utilities', 'EXPENSE', 'Electricity, water, internet', false, true),
('5610', 'Electricity', 'EXPENSE', 'Power bills', false, true),
('5620', 'Water and Sanitation', 'EXPENSE', 'Water utility bills', false, true),
('5630', 'Internet and Telecommunications', 'EXPENSE', 'Internet, phone bills', false, true),
('5700', 'Petty Cash Expenses', 'EXPENSE', 'Small miscellaneous expenses', false, true),
('5800', 'Marketing and Advertising', 'EXPENSE', 'Promotional expenses', false, true),
('5900', 'Professional Fees', 'EXPENSE', 'Legal, accounting, consulting fees', false, true),
('5910', 'Legal Fees', 'EXPENSE', 'Legal services and compliance', false, true),
('5920', 'Accounting Fees', 'EXPENSE', 'Bookkeeping and audit services', false, true)
ON CONFLICT (account_code) DO NOTHING;

-- ============================================================================
-- 2. CREATE EXPENSE TRACKING SYSTEM
-- Supports: pending → approved → paid workflow with approval thresholds
-- ============================================================================

CREATE TABLE IF NOT EXISTS expense_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic expense details
  expense_number TEXT NOT NULL UNIQUE,
  expense_category TEXT NOT NULL, -- COA account code (e.g., '5500' for Office Rent)
  account_code TEXT NOT NULL REFERENCES chart_of_accounts(account_code),
  
  -- Amounts and vendor
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'BDT',
  vendor_name TEXT NOT NULL,
  vendor_contact TEXT,
  description TEXT NOT NULL,
  
  -- Status and approval workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid', 'cancelled')),
  
  -- Approval chain (Dept Head → GM → MD → Chairman)
  submitted_by_employee_id UUID NOT NULL REFERENCES employees(id),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Department Head approval
  dept_head_approved BOOLEAN DEFAULT false,
  dept_head_approved_by UUID REFERENCES employees(id),
  dept_head_approved_at TIMESTAMP WITH TIME ZONE,
  dept_head_notes TEXT,
  
  -- GM approval (if required by threshold)
  gm_approved BOOLEAN DEFAULT false,
  gm_approved_by UUID REFERENCES employees(id),
  gm_approved_at TIMESTAMP WITH TIME ZONE,
  gm_notes TEXT,
  
  -- MD approval (if required by threshold)
  md_approved BOOLEAN DEFAULT false,
  md_approved_by UUID REFERENCES employees(id),
  md_approved_at TIMESTAMP WITH TIME ZONE,
  md_notes TEXT,
  
  -- Chairman approval (MANDATORY for > 50,000 BDT)
  chairman_approval_required BOOLEAN NOT NULL DEFAULT false,
  chairman_approved BOOLEAN DEFAULT false,
  chairman_approved_by UUID REFERENCES employees(id),
  chairman_approved_at TIMESTAMP WITH TIME ZONE,
  chairman_notes TEXT,
  
  -- Payment tracking
  payment_method TEXT, -- 'bank_transfer', 'cash', 'check'
  payment_reference TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_by_admin_id UUID REFERENCES profiles(id),
  
  -- Audit trail
  rejection_reason TEXT,
  rejected_by UUID REFERENCES employees(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  
  -- Supporting documents
  attachment_urls TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expense_requests_status ON expense_requests(status);
CREATE INDEX IF NOT EXISTS idx_expense_requests_submitted_by ON expense_requests(submitted_by_employee_id);
CREATE INDEX IF NOT EXISTS idx_expense_requests_account_code ON expense_requests(account_code);
CREATE INDEX IF NOT EXISTS idx_expense_requests_submitted_at ON expense_requests(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_expense_requests_chairman_pending ON expense_requests(chairman_approval_required, chairman_approved) WHERE status = 'pending';

COMMENT ON TABLE expense_requests IS 'PROMPT A1.1: Expense tracking with approval workflow. Chairman approval MANDATORY for > 50,000 BDT.';
COMMENT ON COLUMN expense_requests.chairman_approval_required IS 'TRUE if amount > 50,000 BDT - Chairman approval is MANDATORY';
COMMENT ON COLUMN expense_requests.account_code IS 'Links to chart_of_accounts for expense categorization';

-- ============================================================================
-- 3. EXPENSE APPROVAL AUDIT LOG
-- Immutable record of all approval/rejection actions
-- ============================================================================

CREATE TABLE IF NOT EXISTS expense_approval_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  expense_request_id UUID NOT NULL REFERENCES expense_requests(id) ON DELETE CASCADE,
  expense_number TEXT NOT NULL,
  
  -- Approval action details
  action_type TEXT NOT NULL CHECK (action_type IN ('submitted', 'dept_head_approved', 'dept_head_rejected', 'gm_approved', 'gm_rejected', 'md_approved', 'md_rejected', 'chairman_approved', 'chairman_rejected', 'payment_completed', 'cancelled')),
  
  -- Who performed the action
  performed_by_employee_id UUID REFERENCES employees(id),
  performed_by_role TEXT, -- employee.role_category at time of action
  
  -- Action details
  old_status TEXT,
  new_status TEXT,
  amount NUMERIC(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  notes TEXT,
  
  -- Timestamp (immutable)
  action_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_expense_audit_expense_id ON expense_approval_audit(expense_request_id);
CREATE INDEX IF NOT EXISTS idx_expense_audit_performed_by ON expense_approval_audit(performed_by_employee_id);
CREATE INDEX IF NOT EXISTS idx_expense_audit_action_type ON expense_approval_audit(action_type);
CREATE INDEX IF NOT EXISTS idx_expense_audit_timestamp ON expense_approval_audit(action_timestamp DESC);

COMMENT ON TABLE expense_approval_audit IS 'PROMPT A1.1: Immutable audit trail for all expense approval actions. No updates or deletes allowed.';

-- ============================================================================
-- 4. RLS POLICIES FOR EXPENSE TABLES
-- ============================================================================

-- Enable RLS
ALTER TABLE expense_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_approval_audit ENABLE ROW LEVEL SECURITY;

-- Super Admin full access to expense requests
CREATE POLICY "Super Admin can manage expense requests"
ON expense_requests
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Employees can view their own expense requests
CREATE POLICY "Employees can view own expense requests"
ON expense_requests
FOR SELECT
TO public
USING (
  submitted_by_employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

-- Employees can submit expense requests
CREATE POLICY "Employees can submit expense requests"
ON expense_requests
FOR INSERT
TO public
WITH CHECK (
  submitted_by_employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

-- Dept Heads, GM, MD, Chairman can view expense requests
CREATE POLICY "Managers can view expense requests"
ON expense_requests
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.user_id = auth.uid()
    AND employees.role_category IN ('chairman', 'managing_director', 'general_manager', 'department_head', 'hr_manager')
  )
);

-- Super Admin full access to expense audit log
CREATE POLICY "Super Admin can view expense audit"
ON expense_approval_audit
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- System can insert expense audit logs
CREATE POLICY "System can insert expense audit"
ON expense_approval_audit
FOR INSERT
TO public
WITH CHECK (true);

-- No updates or deletes on audit log
CREATE POLICY "No updates on expense audit"
ON expense_approval_audit
FOR UPDATE
TO public
USING (false);

CREATE POLICY "No deletes on expense audit"
ON expense_approval_audit
FOR DELETE
TO public
USING (false);

-- ============================================================================
-- 5. HELPER FUNCTION: ENFORCE PERIOD CLOSE
-- Prevents posting journal entries to closed periods
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_period_close()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the entry_date falls in a closed period
  IF EXISTS (
    SELECT 1 FROM monthly_close_periods
    WHERE NEW.entry_date BETWEEN period_start_date AND period_end_date
    AND status IN ('closed', 'locked')
  ) THEN
    RAISE EXCEPTION 'Cannot post entries to closed period. Entry date: %', NEW.entry_date;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to general_ledger
DROP TRIGGER IF EXISTS enforce_period_close_trigger ON general_ledger;
CREATE TRIGGER enforce_period_close_trigger
  BEFORE INSERT OR UPDATE ON general_ledger
  FOR EACH ROW
  EXECUTE FUNCTION enforce_period_close();

COMMENT ON FUNCTION enforce_period_close IS 'PROMPT A1.1: Prevents posting journal entries to closed or locked accounting periods. Enforces monthly close governance.';

-- ============================================================================
-- 6. HELPER FUNCTION: AUTO-LOG EXPENSE SUBMISSIONS
-- Automatically creates audit log when expense is submitted
-- ============================================================================

CREATE OR REPLACE FUNCTION log_expense_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the expense submission
  INSERT INTO expense_approval_audit (
    expense_request_id,
    expense_number,
    action_type,
    performed_by_employee_id,
    performed_by_role,
    old_status,
    new_status,
    amount,
    currency,
    notes
  )
  SELECT
    NEW.id,
    NEW.expense_number,
    'submitted',
    NEW.submitted_by_employee_id,
    e.role_category::text,
    NULL,
    NEW.status,
    NEW.amount,
    NEW.currency,
    'Expense request submitted for approval'
  FROM employees e
  WHERE e.id = NEW.submitted_by_employee_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS log_expense_submission_trigger ON expense_requests;
CREATE TRIGGER log_expense_submission_trigger
  AFTER INSERT ON expense_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_expense_submission();

COMMENT ON FUNCTION log_expense_submission IS 'PROMPT A1.1: Automatically logs expense submission to audit trail.';

-- ============================================================================
-- 7. HELPER FUNCTION: ENFORCE CHAIRMAN APPROVAL THRESHOLD
-- Validates Chairman approval for expenses > 50,000 BDT
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_chairman_approval_threshold()
RETURNS TRIGGER AS $$
BEGIN
  -- If amount > 50,000 BDT, Chairman approval is MANDATORY
  IF NEW.amount > 50000 AND NEW.currency = 'BDT' THEN
    NEW.chairman_approval_required := true;
    
    -- If marking as 'approved', ensure Chairman has approved
    IF NEW.status = 'approved' AND (NEW.chairman_approved IS NULL OR NEW.chairman_approved = false) THEN
      RAISE EXCEPTION 'Chairman approval is MANDATORY for expenses over 50,000 BDT. Current amount: % %', NEW.amount, NEW.currency;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS enforce_chairman_approval_trigger ON expense_requests;
CREATE TRIGGER enforce_chairman_approval_trigger
  BEFORE INSERT OR UPDATE ON expense_requests
  FOR EACH ROW
  EXECUTE FUNCTION enforce_chairman_approval_threshold();

COMMENT ON FUNCTION enforce_chairman_approval_threshold IS 'PROMPT A1.1: Enforces Chairman approval for expenses > 50,000 BDT. No exceptions.';

-- ============================================================================
-- 8. HELPER FUNCTION: AUTO-GENERATE EXPENSE NUMBER
-- Generates sequential expense numbers: EXP-2026-0001
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_expense_number()
RETURNS TRIGGER AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  new_expense_number TEXT;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Get next sequential number for this year
  SELECT COALESCE(MAX(
    CASE 
      WHEN expense_number LIKE 'EXP-' || current_year || '-%'
      THEN CAST(SUBSTRING(expense_number FROM 'EXP-[0-9]{4}-([0-9]+)') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_number
  FROM expense_requests;
  
  -- Generate expense number: EXP-2026-0001
  new_expense_number := 'EXP-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  NEW.expense_number := new_expense_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger (only on INSERT, before other triggers)
DROP TRIGGER IF EXISTS generate_expense_number_trigger ON expense_requests;
CREATE TRIGGER generate_expense_number_trigger
  BEFORE INSERT ON expense_requests
  FOR EACH ROW
  WHEN (NEW.expense_number IS NULL OR NEW.expense_number = '')
  EXECUTE FUNCTION generate_expense_number();

COMMENT ON FUNCTION generate_expense_number IS 'PROMPT A1.1: Auto-generates sequential expense numbers (EXP-YYYY-####).';

-- ============================================================================
-- 9. AUDIT LOG INTEGRATION
-- All journal entries must be logged in audit_logs table
-- ============================================================================

CREATE OR REPLACE FUNCTION log_journal_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Log journal entry creation to audit_logs
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    new_values
  ) VALUES (
    NEW.created_by,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'journal_entry_created'
      WHEN TG_OP = 'UPDATE' THEN 'journal_entry_updated'
      ELSE 'journal_entry_modified'
    END,
    'general_ledger',
    NEW.id,
    jsonb_build_object(
      'transaction_id', NEW.transaction_id,
      'transaction_type', NEW.transaction_type,
      'account_code', NEW.account_code,
      'debit_amount', NEW.debit_amount,
      'credit_amount', NEW.credit_amount,
      'entry_date', NEW.entry_date,
      'description', NEW.description
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to general_ledger
DROP TRIGGER IF EXISTS log_journal_entry_trigger ON general_ledger;
CREATE TRIGGER log_journal_entry_trigger
  AFTER INSERT OR UPDATE ON general_ledger
  FOR EACH ROW
  EXECUTE FUNCTION log_journal_entry();

COMMENT ON FUNCTION log_journal_entry IS 'PROMPT A1.1: Logs all journal entries to audit_logs table for compliance tracking.';

-- ============================================================================
-- VERIFICATION QUERIES (for confirmation)
-- ============================================================================

-- Count COA accounts by type
SELECT 
  account_type,
  COUNT(*) as account_count,
  MIN(account_code) as first_code,
  MAX(account_code) as last_code
FROM chart_of_accounts
GROUP BY account_type
ORDER BY account_type;

-- Verify expense tracking tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name IN ('expense_requests', 'expense_approval_audit')
AND table_schema = 'public';

-- Verify triggers are active
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name IN (
  'enforce_period_close_trigger',
  'log_expense_submission_trigger',
  'enforce_chairman_approval_trigger',
  'generate_expense_number_trigger',
  'log_journal_entry_trigger'
)
ORDER BY trigger_name;

-- ============================================================================
-- END OF PROMPT A1.1 IMPLEMENTATION
-- ============================================================================