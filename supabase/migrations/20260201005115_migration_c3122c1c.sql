-- PROMPT A7.1A - EMPLOYEE WELFARE RESERVE (EWCR) - ACCOUNTING CORE
-- Create employer-funded welfare reserve system for discretionary staff support

-- =====================================================
-- TABLE 1: employee_welfare_reserve
-- Individual employee welfare balances
-- =====================================================
CREATE TABLE employee_welfare_reserve (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  balance DECIMAL(15,2) DEFAULT 0 CHECK (balance >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'forfeited')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id)
);

-- Index for quick balance lookups
CREATE INDEX idx_welfare_reserve_employee ON employee_welfare_reserve(employee_id);
CREATE INDEX idx_welfare_reserve_status ON employee_welfare_reserve(status);

-- =====================================================
-- TABLE 2: welfare_reserve_ledger
-- Complete transaction history for welfare reserve
-- =====================================================
CREATE TABLE welfare_reserve_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('contribution', 'interest', 'disbursement', 'forfeiture')),
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  reference_period TEXT,  -- e.g., "2026-01" for monthly contributions
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  journal_entry_id UUID,  -- Link to accounting entry (if applicable)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for reporting and lookups
CREATE INDEX idx_welfare_ledger_employee ON welfare_reserve_ledger(employee_id);
CREATE INDEX idx_welfare_ledger_entry_type ON welfare_reserve_ledger(entry_type);
CREATE INDEX idx_welfare_ledger_period ON welfare_reserve_ledger(reference_period);
CREATE INDEX idx_welfare_ledger_created_at ON welfare_reserve_ledger(created_at);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE employee_welfare_reserve ENABLE ROW LEVEL SECURITY;
ALTER TABLE welfare_reserve_ledger ENABLE ROW LEVEL SECURITY;

-- Only employees with admin roles can view welfare reserve data
-- (NO employee visibility - employees cannot see their own welfare balance)
CREATE POLICY welfare_reserve_admin_access ON employee_welfare_reserve
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.user_id = auth.uid()
    AND employees.role_category IN ('chairman', 'managing_director', 'general_manager', 'hr_manager')
  )
);

CREATE POLICY welfare_ledger_admin_access ON welfare_reserve_ledger
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.user_id = auth.uid()
    AND employees.role_category IN ('chairman', 'managing_director', 'general_manager', 'hr_manager')
  )
);

-- =====================================================
-- FUNCTION: Initialize welfare reserve for new employee
-- =====================================================
CREATE OR REPLACE FUNCTION initialize_welfare_reserve()
RETURNS TRIGGER AS $$
BEGIN
  -- Create welfare reserve record for new employee
  INSERT INTO employee_welfare_reserve (employee_id, balance, status)
  VALUES (NEW.id, 0, 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create welfare reserve when employee is created
CREATE TRIGGER trigger_initialize_welfare_reserve
AFTER INSERT ON employees
FOR EACH ROW
EXECUTE FUNCTION initialize_welfare_reserve();

-- =====================================================
-- FUNCTION: Update welfare reserve balance
-- =====================================================
CREATE OR REPLACE FUNCTION update_welfare_reserve_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update employee welfare reserve balance based on ledger entry
  IF NEW.entry_type IN ('contribution', 'interest') THEN
    -- Increase balance for contributions and interest
    UPDATE employee_welfare_reserve
    SET balance = balance + NEW.amount,
        updated_at = NOW()
    WHERE employee_id = NEW.employee_id;
  ELSIF NEW.entry_type IN ('disbursement', 'forfeiture') THEN
    -- Decrease balance for disbursements and forfeitures
    UPDATE employee_welfare_reserve
    SET balance = GREATEST(balance - NEW.amount, 0),
        updated_at = NOW()
    WHERE employee_id = NEW.employee_id;
    
    -- If forfeiture, update status
    IF NEW.entry_type = 'forfeiture' THEN
      UPDATE employee_welfare_reserve
      SET status = 'forfeited',
          updated_at = NOW()
      WHERE employee_id = NEW.employee_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update balance when ledger entry is created
CREATE TRIGGER trigger_update_welfare_balance
AFTER INSERT ON welfare_reserve_ledger
FOR EACH ROW
EXECUTE FUNCTION update_welfare_reserve_balance();

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================
COMMENT ON TABLE employee_welfare_reserve IS 'Employer-funded welfare reserve for individual employees. Contributes 2% of gross payroll monthly. NOT deducted from employee salary.';
COMMENT ON TABLE welfare_reserve_ledger IS 'Complete transaction history for employee welfare reserve. Tracks contributions, interest, disbursements, and forfeitures.';

COMMENT ON COLUMN employee_welfare_reserve.balance IS 'Current welfare reserve balance in BDT. Automatically updated by trigger.';
COMMENT ON COLUMN employee_welfare_reserve.status IS 'active = eligible for welfare reserve, forfeited = balance forfeited (e.g., termination)';

COMMENT ON COLUMN welfare_reserve_ledger.entry_type IS 'contribution = employer monthly contribution (2% gross payroll), interest = accrued interest, disbursement = payment to employee, forfeiture = balance forfeited';
COMMENT ON COLUMN welfare_reserve_ledger.amount IS 'Transaction amount in BDT. Always positive (direction determined by entry_type).';
COMMENT ON COLUMN welfare_reserve_ledger.reference_period IS 'Reference period for contribution (e.g., "2026-01" for January 2026). Used for monthly contribution tracking.';
COMMENT ON COLUMN welfare_reserve_ledger.journal_entry_id IS 'Link to accounting journal entry (Debit: Staff Welfare Expense, Credit: Employee Welfare Reserve).';