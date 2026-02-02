-- PHASE 1: Create global read-only RLS policies for Master Admin (CORRECTED SYNTAX)
-- Drop existing policies if they exist, then create new ones

-- =============================
-- PROFILES TABLE
-- =============================
DROP POLICY IF EXISTS master_admin_read_all_profiles ON profiles;
CREATE POLICY master_admin_read_all_profiles
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'master_admin'
    )
  );
COMMENT ON POLICY master_admin_read_all_profiles ON profiles IS 'Master Admin can view all profiles globally (read-only)';

-- =============================
-- EMPLOYEES TABLE
-- =============================
DROP POLICY IF EXISTS master_admin_read_all_employees ON employees;
CREATE POLICY master_admin_read_all_employees
  ON employees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'master_admin'
    )
  );
COMMENT ON POLICY master_admin_read_all_employees ON employees IS 'Master Admin can view all employees globally (read-only)';

-- =============================
-- EXPENSE_REQUESTS TABLE
-- =============================
DROP POLICY IF EXISTS master_admin_read_expense_requests ON expense_requests;
CREATE POLICY master_admin_read_expense_requests
  ON expense_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'master_admin'
    )
  );
COMMENT ON POLICY master_admin_read_expense_requests ON expense_requests IS 'Master Admin can view all expense requests globally (read-only)';

-- =============================
-- PAYROLL_PERIODS TABLE
-- =============================
DROP POLICY IF EXISTS master_admin_read_payroll_periods ON payroll_periods;
CREATE POLICY master_admin_read_payroll_periods
  ON payroll_periods FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'master_admin'
    )
  );
COMMENT ON POLICY master_admin_read_payroll_periods ON payroll_periods IS 'Master Admin can view all payroll periods globally (read-only)';

-- =============================
-- PAYROLL_RUNS TABLE
-- =============================
DROP POLICY IF EXISTS master_admin_read_payroll_runs ON payroll_runs;
CREATE POLICY master_admin_read_payroll_runs
  ON payroll_runs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'master_admin'
    )
  );
COMMENT ON POLICY master_admin_read_payroll_runs ON payroll_runs IS 'Master Admin can view all payroll runs globally (read-only)';

-- =============================
-- MONTHLY_PROFIT_LOSS TABLE
-- =============================
DROP POLICY IF EXISTS master_admin_read_profit_loss ON monthly_profit_loss;
CREATE POLICY master_admin_read_profit_loss
  ON monthly_profit_loss FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'master_admin'
    )
  );
COMMENT ON POLICY master_admin_read_profit_loss ON monthly_profit_loss IS 'Master Admin can view all P&L reports globally (read-only)';

-- =============================
-- EMPLOYEE_WELFARE_RESERVE TABLE
-- =============================
DROP POLICY IF EXISTS master_admin_read_welfare_reserve ON employee_welfare_reserve;
CREATE POLICY master_admin_read_welfare_reserve
  ON employee_welfare_reserve FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'master_admin'
    )
  );
COMMENT ON POLICY master_admin_read_welfare_reserve ON employee_welfare_reserve IS 'Master Admin can view welfare reserves globally (read-only)';