-- STEP 4: Rename chairman approval columns in payroll_runs to super_admin
ALTER TABLE payroll_runs
  RENAME COLUMN chairman_approval_required TO super_admin_approval_required;

ALTER TABLE payroll_runs
  RENAME COLUMN chairman_approved TO super_admin_approved;

ALTER TABLE payroll_runs
  RENAME COLUMN chairman_approved_by TO super_admin_approved_by;

ALTER TABLE payroll_runs
  RENAME COLUMN chairman_approved_at TO super_admin_approved_at;

-- Update foreign key constraint name
ALTER TABLE payroll_runs
  DROP CONSTRAINT IF EXISTS payroll_runs_chairman_approved_by_fkey;

ALTER TABLE payroll_runs
  ADD CONSTRAINT payroll_runs_super_admin_approved_by_fkey
  FOREIGN KEY (super_admin_approved_by) REFERENCES employees(id);

-- Update index name
DROP INDEX IF EXISTS idx_payroll_runs_chairman_approval;
CREATE INDEX idx_payroll_runs_super_admin_approval
  ON payroll_runs(super_admin_approval_required, super_admin_approved);

COMMENT ON COLUMN payroll_runs.super_admin_approval_required IS 'PROMPT A2.1: TRUE if total_gross > 50,000 BDT. Super Admin approval is MANDATORY.';
COMMENT ON COLUMN payroll_runs.super_admin_approved IS 'TRUE if Super Admin has approved payroll';
COMMENT ON COLUMN payroll_runs.super_admin_approved_by IS 'Employee ID of Super Admin who approved (must have super_admin user_role)';
COMMENT ON COLUMN payroll_runs.super_admin_approved_at IS 'Timestamp when Super Admin approved payroll';