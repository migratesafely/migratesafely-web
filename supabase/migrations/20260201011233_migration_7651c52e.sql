-- PROMPT A7.2 - PAYROLL CORE SYSTEM (FOUNDATION)
-- Create missing tables: employee_payroll_profiles, payroll_periods, payslips
-- WITH CORRECTED RLS POLICIES (using auth.uid() instead of uid())

-- ============================================================================
-- 1. EMPLOYEE PAYROLL PROFILES
-- ============================================================================
-- Per-employee payroll configuration including bank details and pay frequency

CREATE TABLE IF NOT EXISTS employee_payroll_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  basic_salary_bdt DECIMAL(15,2) NOT NULL,
  pay_frequency TEXT NOT NULL CHECK (pay_frequency IN ('monthly')),
  bank_account_details JSONB NOT NULL,
  employment_start_date DATE NOT NULL,
  employment_end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'exited')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  CONSTRAINT unique_employee_payroll_profile UNIQUE (employee_id)
);

-- Indexes for employee_payroll_profiles
CREATE INDEX IF NOT EXISTS idx_employee_payroll_profiles_employee_id ON employee_payroll_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_payroll_profiles_status ON employee_payroll_profiles(status);
CREATE INDEX IF NOT EXISTS idx_employee_payroll_profiles_employment_dates ON employee_payroll_profiles(employment_start_date, employment_end_date);

-- RLS for employee_payroll_profiles
ALTER TABLE employee_payroll_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and above can view payroll profiles" ON employee_payroll_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
        AND (e.department = 'hr' 
         OR e.role_category IN ('chairman', 'managing_director', 'general_manager'))
    )
  );

CREATE POLICY "HR and above can create payroll profiles" ON employee_payroll_profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
        AND (e.department = 'hr' 
         OR e.role_category IN ('chairman', 'managing_director', 'general_manager'))
    )
  );

CREATE POLICY "HR and above can update payroll profiles" ON employee_payroll_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
        AND (e.department = 'hr' 
         OR e.role_category IN ('chairman', 'managing_director', 'general_manager'))
    )
  );

COMMENT ON TABLE employee_payroll_profiles IS 'Per-employee payroll configuration including salary, bank details, and employment dates. Bank account details required before employee can be included in payroll.';
COMMENT ON COLUMN employee_payroll_profiles.bank_account_details IS 'JSONB structure: {bank_name, account_number, account_holder_name, branch_name, routing_number}. REQUIRED before payroll inclusion.';
COMMENT ON COLUMN employee_payroll_profiles.pay_frequency IS 'Currently only "monthly" supported. Future: weekly, bi-weekly.';
COMMENT ON COLUMN employee_payroll_profiles.status IS 'active = included in payroll, suspended = temporarily excluded, exited = employment ended.';

-- ============================================================================
-- 2. PAYROLL PERIODS
-- ============================================================================
-- Monthly payroll cycles with approval workflow

CREATE TABLE IF NOT EXISTS payroll_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  period_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'locked')),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by UUID REFERENCES profiles(id),
  submitted_at TIMESTAMP WITH TIME ZONE,
  submitted_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  locked_by UUID REFERENCES profiles(id),
  locked_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  CONSTRAINT unique_payroll_period UNIQUE (year, month)
);

-- Indexes for payroll_periods
CREATE INDEX IF NOT EXISTS idx_payroll_periods_year_month ON payroll_periods(year, month);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_status ON payroll_periods(status);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_generated_at ON payroll_periods(generated_at);

-- RLS for payroll_periods
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and above can view payroll periods" ON payroll_periods
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
        AND (e.department = 'hr' 
         OR e.role_category IN ('chairman', 'managing_director', 'general_manager'))
    )
  );

CREATE POLICY "HR and above can create payroll periods" ON payroll_periods
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
        AND (e.department = 'hr' 
         OR e.role_category IN ('chairman', 'managing_director', 'general_manager'))
    )
  );

CREATE POLICY "HR and above can update payroll periods" ON payroll_periods
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
        AND (e.department = 'hr' 
         OR e.role_category IN ('chairman', 'managing_director', 'general_manager'))
    )
  );

COMMENT ON TABLE payroll_periods IS 'Monthly payroll cycles with approval workflow. Only ONE period per month allowed. Status flow: draft → submitted → approved → locked (immutable).';
COMMENT ON COLUMN payroll_periods.status IS 'draft = being prepared, submitted = ready for review, approved = management approved, locked = immutable final state.';
COMMENT ON COLUMN payroll_periods.period_name IS 'Human-readable period name (e.g., "January 2026"). Generated from year and month.';

-- ============================================================================
-- 3. PAYSLIPS
-- ============================================================================
-- Individual employee payslip records

CREATE TABLE IF NOT EXISTS payslips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  gross_salary DECIMAL(15,2) NOT NULL,
  deductions_total DECIMAL(15,2) DEFAULT 0,
  net_pay DECIMAL(15,2) NOT NULL,
  payslip_pdf_url TEXT,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_employee_payslip_per_period UNIQUE (payroll_period_id, employee_id)
);

-- Indexes for payslips
CREATE INDEX IF NOT EXISTS idx_payslips_payroll_period_id ON payslips(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payslips_employee_id ON payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_issued_at ON payslips(issued_at);
CREATE INDEX IF NOT EXISTS idx_payslips_delivery_status ON payslips(delivery_status);

-- RLS for payslips
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and above can view all payslips" ON payslips
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
        AND (e.department = 'hr' 
         OR e.role_category IN ('chairman', 'managing_director', 'general_manager'))
    )
  );

CREATE POLICY "Employees can view their own payslips" ON payslips
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = payslips.employee_id
        AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "HR and above can create payslips" ON payslips
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
        AND (e.department = 'hr' 
         OR e.role_category IN ('chairman', 'managing_director', 'general_manager'))
    )
  );

CREATE POLICY "HR and above can update payslips" ON payslips
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
        AND (e.department = 'hr' 
         OR e.role_category IN ('chairman', 'managing_director', 'general_manager'))
    )
  );

COMMENT ON TABLE payslips IS 'Individual employee payslip records. Generated from payroll periods. Employees can view their own payslips.';
COMMENT ON COLUMN payslips.deductions_total IS 'Placeholder for future deductions (EPF, tax, etc.). Currently defaults to 0.';
COMMENT ON COLUMN payslips.net_pay IS 'Net pay = gross_salary - deductions_total. This is the amount to be paid to employee.';
COMMENT ON COLUMN payslips.payslip_pdf_url IS 'URL to generated payslip PDF. Nullable until PDF is generated.';
COMMENT ON COLUMN payslips.delivery_status IS 'pending = not yet sent to employee, sent = delivered to employee (future notification system).';