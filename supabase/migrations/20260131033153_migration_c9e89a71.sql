-- ====================================================================
-- PROMPT A4.1: EMPLOYEE RECORDS, HR GOVERNANCE & PAYROLL FOUNDATION
-- ADDITIVE ONLY - NO OVERWRITES
-- ====================================================================

-- ============================================================
-- 1️⃣ EMPLOYEE MASTER RECORD SYSTEM
-- ============================================================

-- Employee categories and status
CREATE TYPE employee_role_category AS ENUM (
  'chairman',
  'managing_director',
  'general_manager',
  'department_head',
  'staff',
  'support_staff'
);

CREATE TYPE employee_status AS ENUM (
  'active',
  'probation',
  'resigned',
  'terminated',
  'suspended',
  'inactive'
);

CREATE TYPE employment_type AS ENUM (
  'full_time',
  'contract',
  'support'
);

CREATE TYPE department_type AS ENUM (
  'executive',
  'hr',
  'accounts',
  'pr',
  'member_relations',
  'operations',
  'it',
  'support'
);

-- Employees table (non-agent staff)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_number TEXT UNIQUE NOT NULL, -- EMP-BD-000001
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  -- Role & Hierarchy
  role_title TEXT NOT NULL,
  role_category employee_role_category NOT NULL,
  department department_type NOT NULL,
  reports_to_employee_id UUID REFERENCES employees(id),
  
  -- Employment Details
  employment_type employment_type NOT NULL DEFAULT 'full_time',
  start_date DATE NOT NULL,
  probation_end_date DATE,
  notice_period_days INTEGER NOT NULL DEFAULT 60,
  
  -- Salary
  monthly_salary_gross NUMERIC(15, 2) NOT NULL,
  salary_currency TEXT NOT NULL DEFAULT 'BDT',
  
  -- Status
  status employee_status NOT NULL DEFAULT 'active',
  termination_date DATE,
  termination_type TEXT,
  termination_reason TEXT,
  
  -- Metadata
  created_by_admin_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_probation_period CHECK (
    probation_end_date IS NULL OR probation_end_date > start_date
  ),
  CONSTRAINT valid_salary CHECK (monthly_salary_gross > 0),
  CONSTRAINT valid_notice_period CHECK (notice_period_days >= 30)
);

-- Indexes
CREATE INDEX idx_employees_number ON employees(employee_number);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_reports_to ON employees(reports_to_employee_id);

-- RLS Policies (Admin-only access)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin can manage all employees" ON employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- ============================================================
-- 2️⃣ ROLE & APPROVAL HIERARCHY
-- ============================================================

-- Approval thresholds by role
CREATE TABLE employee_approval_thresholds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_category employee_role_category NOT NULL UNIQUE,
  max_payment_approval_amount NUMERIC(15, 2),
  can_approve_terminations BOOLEAN DEFAULT false,
  can_approve_salary_changes BOOLEAN DEFAULT false,
  can_approve_emergency_overrides BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default thresholds
INSERT INTO employee_approval_thresholds (
  role_category,
  max_payment_approval_amount,
  can_approve_terminations,
  can_approve_salary_changes,
  can_approve_emergency_overrides
) VALUES
  ('chairman', NULL, true, true, true), -- No limit
  ('managing_director', 1000000, true, true, true),
  ('general_manager', 100000, false, false, false),
  ('department_head', 50000, false, false, false),
  ('staff', 10000, false, false, false),
  ('support_staff', 0, false, false, false);

-- RLS
ALTER TABLE employee_approval_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view approval thresholds" ON employee_approval_thresholds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'manager_admin')
    )
  );

-- ============================================================
-- 3️⃣ PAYROLL STRUCTURE (FOUNDATION ONLY)
-- ============================================================

-- Employee salary records (tracks changes over time)
CREATE TABLE employee_salaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  monthly_gross_salary NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  
  -- Deductions
  tax_deduction NUMERIC(15, 2) DEFAULT 0,
  provident_fund NUMERIC(15, 2) DEFAULT 0,
  other_deductions NUMERIC(15, 2) DEFAULT 0,
  
  -- Net calculation
  monthly_net_salary NUMERIC(15, 2) GENERATED ALWAYS AS (
    monthly_gross_salary - COALESCE(tax_deduction, 0) - COALESCE(provident_fund, 0) - COALESCE(other_deductions, 0)
  ) STORED,
  
  -- One-month salary-in-hand tracking
  initial_retained_amount NUMERIC(15, 2) DEFAULT 0,
  monthly_retention_deduction NUMERIC(15, 2) DEFAULT 0,
  
  approved_by_admin_id UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_effective_date CHECK (effective_date IS NOT NULL),
  CONSTRAINT valid_gross_salary CHECK (monthly_gross_salary > 0)
);

CREATE INDEX idx_employee_salaries_employee ON employee_salaries(employee_id);
CREATE INDEX idx_employee_salaries_effective_date ON employee_salaries(effective_date DESC);

-- Payroll run status
CREATE TYPE payroll_run_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'processing',
  'completed',
  'failed'
);

-- Payroll runs (monthly execution)
CREATE TABLE payroll_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_number TEXT UNIQUE NOT NULL, -- PAYROLL-2026-01
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  payment_date DATE NOT NULL,
  
  -- Status
  status payroll_run_status NOT NULL DEFAULT 'draft',
  
  -- Totals
  total_gross NUMERIC(15, 2) DEFAULT 0,
  total_deductions NUMERIC(15, 2) DEFAULT 0,
  total_net NUMERIC(15, 2) DEFAULT 0,
  employee_count INTEGER DEFAULT 0,
  
  -- Approvals
  created_by_admin_id UUID REFERENCES profiles(id),
  approved_by_admin_id UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Processing
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_pay_period CHECK (pay_period_end > pay_period_start),
  CONSTRAINT valid_payment_date CHECK (payment_date >= pay_period_end)
);

CREATE INDEX idx_payroll_runs_status ON payroll_runs(status);
CREATE INDEX idx_payroll_runs_payment_date ON payroll_runs(payment_date DESC);

-- Individual payroll items (per employee per run)
CREATE TABLE payroll_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  
  -- Salary components
  gross_salary NUMERIC(15, 2) NOT NULL,
  tax_deduction NUMERIC(15, 2) DEFAULT 0,
  provident_fund NUMERIC(15, 2) DEFAULT 0,
  retention_deduction NUMERIC(15, 2) DEFAULT 0, -- First month retention recovery
  other_deductions NUMERIC(15, 2) DEFAULT 0,
  
  -- Bonuses (if applicable)
  bonus_amount NUMERIC(15, 2) DEFAULT 0,
  bonus_type TEXT,
  
  -- Net calculation
  net_salary NUMERIC(15, 2) GENERATED ALWAYS AS (
    gross_salary - COALESCE(tax_deduction, 0) - COALESCE(provident_fund, 0) - 
    COALESCE(retention_deduction, 0) - COALESCE(other_deductions, 0) + COALESCE(bonus_amount, 0)
  ) STORED,
  
  -- Payment tracking
  payment_status TEXT DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(payroll_run_id, employee_id)
);

CREATE INDEX idx_payroll_items_run ON payroll_items(payroll_run_id);
CREATE INDEX idx_payroll_items_employee ON payroll_items(employee_id);

-- Payroll approval workflow
CREATE TABLE payroll_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  approver_admin_id UUID NOT NULL REFERENCES profiles(id),
  approver_role employee_role_category NOT NULL,
  
  action TEXT NOT NULL, -- 'approved', 'rejected', 'requested_changes'
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_action CHECK (action IN ('approved', 'rejected', 'requested_changes'))
);

CREATE INDEX idx_payroll_approvals_run ON payroll_approvals(payroll_run_id);

-- RLS for payroll tables
ALTER TABLE employee_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin can manage payroll" ON employee_salaries FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Super Admin can manage payroll runs" ON payroll_runs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Super Admin can manage payroll items" ON payroll_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Super Admin can manage payroll approvals" ON payroll_approvals FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- ============================================================
-- 4️⃣ LEAVE & HOLIDAY MANAGEMENT
-- ============================================================

-- Leave types
CREATE TYPE leave_type AS ENUM (
  'annual',
  'sick',
  'emergency',
  'unpaid',
  'maternity',
  'paternity'
);

-- Leave requests
CREATE TABLE employee_leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  
  reason TEXT,
  
  -- Approval
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  approved_by_admin_id UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_leave_period CHECK (end_date >= start_date),
  CONSTRAINT valid_total_days CHECK (total_days > 0),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'))
);

CREATE INDEX idx_leave_requests_employee ON employee_leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON employee_leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON employee_leave_requests(start_date, end_date);

-- Leave balance tracking (15 days per year)
CREATE TABLE employee_leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  
  -- Annual leave (15 days)
  annual_leave_total INTEGER DEFAULT 15,
  annual_leave_used INTEGER DEFAULT 0,
  annual_leave_remaining INTEGER GENERATED ALWAYS AS (annual_leave_total - annual_leave_used) STORED,
  
  -- Other leave types (tracked separately)
  sick_leave_used INTEGER DEFAULT 0,
  unpaid_leave_used INTEGER DEFAULT 0,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(employee_id, year),
  CONSTRAINT valid_year CHECK (year >= 2020 AND year <= 2100),
  CONSTRAINT valid_leave_used CHECK (annual_leave_used >= 0 AND annual_leave_used <= annual_leave_total)
);

CREATE INDEX idx_leave_balances_employee ON employee_leave_balances(employee_id);
CREATE INDEX idx_leave_balances_year ON employee_leave_balances(year);

-- Holiday bonus configuration (Eid bonuses)
CREATE TABLE holiday_bonus_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  bonus_name TEXT NOT NULL, -- e.g., "Eid-ul-Fitr 2026"
  bonus_date DATE NOT NULL,
  bonus_percentage NUMERIC(5, 2) NOT NULL DEFAULT 50.00, -- 50% of net salary
  
  -- Eligibility
  eligible_categories employee_role_category[], -- NULL = all eligible
  min_employment_days INTEGER DEFAULT 0, -- Minimum days employed to be eligible
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  approved_by_admin_id UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_bonus_percentage CHECK (bonus_percentage > 0 AND bonus_percentage <= 100)
);

CREATE INDEX idx_holiday_bonus_year ON holiday_bonus_config(year);
CREATE INDEX idx_holiday_bonus_date ON holiday_bonus_config(bonus_date);

-- Emergency closures (strikes, force majeure)
CREATE TYPE closure_type AS ENUM (
  'emergency',
  'strike',
  'force_majeure',
  'public_holiday',
  'company_event'
);

CREATE TABLE emergency_closures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  closure_date DATE NOT NULL,
  closure_type closure_type NOT NULL,
  reason TEXT NOT NULL,
  
  -- Payroll impact
  is_paid BOOLEAN DEFAULT true, -- Whether employees are paid for this day
  affects_attendance BOOLEAN DEFAULT false, -- Whether this counts as absence
  
  declared_by_admin_id UUID REFERENCES profiles(id),
  declared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_closure_date UNIQUE(closure_date)
);

CREATE INDEX idx_emergency_closures_date ON emergency_closures(closure_date);

-- RLS for leave tables
ALTER TABLE employee_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_bonus_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin can manage leave" ON employee_leave_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Super Admin can manage leave balances" ON employee_leave_balances FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Super Admin can manage holiday bonuses" ON holiday_bonus_config FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Super Admin can manage closures" ON emergency_closures FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- ============================================================
-- 5️⃣ RESIGNATION & NOTICE PERIODS
-- ============================================================

-- Resignation tracking
CREATE TABLE employee_resignations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  resignation_date DATE NOT NULL, -- Date resignation was submitted
  notice_period_days INTEGER NOT NULL,
  last_working_day DATE NOT NULL,
  
  reason TEXT,
  early_exit_requested BOOLEAN DEFAULT false,
  early_exit_approved BOOLEAN,
  early_exit_approved_by_admin_id UUID REFERENCES profiles(id),
  early_exit_approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Final settlement
  final_settlement_amount NUMERIC(15, 2),
  final_settlement_calculated_at TIMESTAMP WITH TIME ZONE,
  final_settlement_paid BOOLEAN DEFAULT false,
  final_settlement_paid_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_last_working_day CHECK (last_working_day > resignation_date),
  CONSTRAINT valid_notice_period CHECK (notice_period_days >= 30)
);

CREATE INDEX idx_resignations_employee ON employee_resignations(employee_id);
CREATE INDEX idx_resignations_last_day ON employee_resignations(last_working_day);

-- RLS
ALTER TABLE employee_resignations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin can manage resignations" ON employee_resignations FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- ============================================================
-- 6️⃣ TERMINATION & FIRING GOVERNANCE
-- ============================================================

-- Termination types
CREATE TYPE termination_type AS ENUM (
  'resignation',
  'redundancy',
  'negligence',
  'fraud',
  'misconduct',
  'awol',
  'performance',
  'contract_end'
);

-- Termination records
CREATE TABLE employee_terminations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  termination_type termination_type NOT NULL,
  termination_date DATE NOT NULL,
  effective_date DATE NOT NULL,
  
  reason TEXT NOT NULL,
  detailed_notes TEXT,
  
  -- Approval (MD or Chairman required)
  requires_immediate_effect BOOLEAN DEFAULT false,
  approved_by_admin_id UUID NOT NULL REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Redundancy pay eligibility
  eligible_for_redundancy_pay BOOLEAN DEFAULT true,
  redundancy_pay_amount NUMERIC(15, 2),
  redundancy_pay_paid BOOLEAN DEFAULT false,
  
  -- Final settlement
  final_settlement_amount NUMERIC(15, 2),
  final_settlement_paid BOOLEAN DEFAULT false,
  final_settlement_paid_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_termination_dates CHECK (effective_date >= termination_date)
);

CREATE INDEX idx_terminations_employee ON employee_terminations(employee_id);
CREATE INDEX idx_terminations_type ON employee_terminations(termination_type);
CREATE INDEX idx_terminations_date ON employee_terminations(termination_date);

-- Termination appeals
CREATE TABLE termination_appeals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  termination_id UUID NOT NULL REFERENCES employee_terminations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  appeal_reason TEXT NOT NULL,
  supporting_documents TEXT[], -- URLs or file paths
  
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Review
  status TEXT NOT NULL DEFAULT 'pending', -- pending, under_review, approved, rejected
  reviewed_by_admin_id UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  decision TEXT,
  decision_notes TEXT,
  
  CONSTRAINT valid_appeal_status CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  CONSTRAINT one_appeal_per_termination UNIQUE(termination_id)
);

CREATE INDEX idx_appeals_termination ON termination_appeals(termination_id);
CREATE INDEX idx_appeals_status ON termination_appeals(status);

-- RLS
ALTER TABLE employee_terminations ENABLE ROW LEVEL SECURITY;
ALTER TABLE termination_appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin can manage terminations" ON employee_terminations FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Super Admin can manage appeals" ON termination_appeals FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- ============================================================
-- 7️⃣ EMPLOYEE CONTRACT GENERATION
-- ============================================================

-- Contract templates and versions
CREATE TABLE employee_contract_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name TEXT NOT NULL,
  version TEXT NOT NULL,
  
  -- Template content (HTML or Markdown)
  template_content TEXT NOT NULL,
  
  -- Applicability
  applicable_roles employee_role_category[],
  applicable_departments department_type[],
  
  is_active BOOLEAN DEFAULT true,
  created_by_admin_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(template_name, version)
);

-- Employee contracts (generated and signed)
CREATE TABLE employee_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  template_id UUID REFERENCES employee_contract_templates(id),
  
  contract_number TEXT UNIQUE NOT NULL, -- CONTRACT-EMP-BD-000001-2026
  version TEXT NOT NULL DEFAULT '1.0',
  
  -- Contract details
  start_date DATE NOT NULL,
  end_date DATE, -- NULL for permanent contracts
  
  -- Generated content (immutable once signed)
  contract_content TEXT NOT NULL,
  contract_hash TEXT, -- SHA256 hash for integrity
  
  -- Signing
  is_signed BOOLEAN DEFAULT false,
  signed_by_employee_at TIMESTAMP WITH TIME ZONE,
  signed_by_admin_id UUID REFERENCES profiles(id),
  signed_by_admin_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, superseded, terminated
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_contract_status CHECK (status IN ('draft', 'active', 'superseded', 'terminated'))
);

CREATE INDEX idx_contracts_employee ON employee_contracts(employee_id);
CREATE INDEX idx_contracts_status ON employee_contracts(status);
CREATE INDEX idx_contracts_number ON employee_contracts(contract_number);

-- RLS
ALTER TABLE employee_contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin can manage contract templates" ON employee_contract_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Super Admin can manage contracts" ON employee_contracts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- ============================================================
-- 8️⃣ HELPER FUNCTIONS & AUTOMATION
-- ============================================================

-- Function to generate employee number
CREATE OR REPLACE FUNCTION generate_employee_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  new_employee_number TEXT;
BEGIN
  -- Get the next sequence number
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_number FROM 8) AS INTEGER)), 0) + 1
  INTO next_number
  FROM employees
  WHERE employee_number LIKE 'EMP-BD-%';
  
  -- Format as EMP-BD-000001
  new_employee_number := 'EMP-BD-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN new_employee_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate leave balance for an employee
CREATE OR REPLACE FUNCTION calculate_leave_balance(
  p_employee_id UUID,
  p_year INTEGER
)
RETURNS TABLE(
  total_annual INTEGER,
  used_annual INTEGER,
  remaining_annual INTEGER,
  used_sick INTEGER,
  used_unpaid INTEGER
) AS $$
DECLARE
  v_balance RECORD;
  v_date_check DATE;
BEGIN
  v_date_check := (p_year || '-01-01')::DATE;
  
  -- Ensure balance record exists
  INSERT INTO employee_leave_balances (employee_id, year)
  VALUES (p_employee_id, p_year)
  ON CONFLICT (employee_id, year) DO NOTHING;
  
  -- Get current balance
  SELECT 
    annual_leave_total,
    annual_leave_used,
    annual_leave_remaining,
    sick_leave_used,
    unpaid_leave_used
  INTO v_balance
  FROM employee_leave_balances
  WHERE employee_id = p_employee_id
  AND year = p_year;
  
  RETURN QUERY SELECT 
    v_balance.annual_leave_total,
    v_balance.annual_leave_used,
    v_balance.annual_leave_remaining,
    v_balance.sick_leave_used,
    v_balance.unpaid_leave_used;
END;
$$ LANGUAGE plpgsql;

-- Function to check approval authority
CREATE OR REPLACE FUNCTION check_approval_authority(
  p_admin_id UUID,
  p_action_type TEXT,
  p_amount NUMERIC DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_employee RECORD;
  v_threshold RECORD;
BEGIN
  -- Get employee details
  SELECT role_category INTO v_employee
  FROM employees
  WHERE id = p_admin_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Get threshold for role
  SELECT * INTO v_threshold
  FROM employee_approval_thresholds
  WHERE role_category = v_employee.role_category;
  
  -- Check based on action type
  CASE p_action_type
    WHEN 'payment' THEN
      IF v_threshold.max_payment_approval_amount IS NULL THEN
        RETURN true; -- No limit (Chairman)
      END IF;
      RETURN p_amount <= v_threshold.max_payment_approval_amount;
    
    WHEN 'termination' THEN
      RETURN v_threshold.can_approve_terminations;
    
    WHEN 'salary_change' THEN
      RETURN v_threshold.can_approve_salary_changes;
    
    WHEN 'emergency_override' THEN
      RETURN v_threshold.can_approve_emergency_overrides;
    
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update employee status on termination
CREATE OR REPLACE FUNCTION update_employee_status_on_termination()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE employees
  SET 
    status = 'terminated',
    termination_date = NEW.effective_date,
    termination_type = NEW.termination_type::TEXT,
    termination_reason = NEW.reason,
    updated_at = NOW()
  WHERE id = NEW.employee_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_employee_status_on_termination
AFTER INSERT ON employee_terminations
FOR EACH ROW
EXECUTE FUNCTION update_employee_status_on_termination();

-- Trigger to update employee status on resignation
CREATE OR REPLACE FUNCTION update_employee_status_on_resignation()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE employees
  SET 
    status = 'resigned',
    termination_date = NEW.last_working_day,
    updated_at = NOW()
  WHERE id = NEW.employee_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_employee_status_on_resignation
AFTER INSERT ON employee_resignations
FOR EACH ROW
EXECUTE FUNCTION update_employee_status_on_resignation();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_employees_updated_at
BEFORE UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- AUDIT LOGGING INTEGRATION
-- ============================================================

-- All employee actions are logged via existing audit_logs table
-- Examples of actions to log:
-- - employee_created
-- - employee_updated
-- - salary_changed
-- - leave_approved
-- - leave_rejected
-- - bonus_configured
-- - termination_initiated
-- - termination_appeal_submitted
-- - contract_generated
-- - contract_signed
-- - payroll_run_created
-- - payroll_run_approved

SELECT 'PROMPT A4.1: Employee Records, HR Governance & Payroll Foundation migration completed successfully' AS status;