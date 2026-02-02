-- Create payroll_run_snapshots table (renamed from payroll_runs in prompt to avoid conflict)
CREATE TABLE IF NOT EXISTS payroll_run_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  gross_salary DECIMAL(15,2) NOT NULL,
  deductions_total DECIMAL(15,2) DEFAULT 0,
  net_pay DECIMAL(15,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_employee_run_per_period UNIQUE (payroll_period_id, employee_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payroll_snapshots_period ON payroll_run_snapshots(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_snapshots_employee ON payroll_run_snapshots(employee_id);

-- RLS
ALTER TABLE payroll_run_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and above can manage snapshots" ON payroll_run_snapshots
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
        AND (e.department = 'hr' 
         OR e.role_category IN ('chairman', 'managing_director', 'general_manager'))
    )
  );

COMMENT ON TABLE payroll_run_snapshots IS 'Snapshot of employee payroll data for a specific period. Immutable record of what was calculated/paid.';