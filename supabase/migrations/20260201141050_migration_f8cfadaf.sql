-- PHASE 2B: Add EXPLICIT DENY policies for remaining critical tables

-- ==========================
-- PAYROLL_PERIODS - DENY mutations
-- ==========================
DROP POLICY IF EXISTS master_admin_deny_insert_payroll_periods ON payroll_periods;
CREATE POLICY master_admin_deny_insert_payroll_periods ON payroll_periods
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'master_admin'
    )
  );

DROP POLICY IF EXISTS master_admin_deny_update_payroll_periods ON payroll_periods;
CREATE POLICY master_admin_deny_update_payroll_periods ON payroll_periods
  FOR UPDATE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'master_admin'
    )
  );

DROP POLICY IF EXISTS master_admin_deny_delete_payroll_periods ON payroll_periods;
CREATE POLICY master_admin_deny_delete_payroll_periods ON payroll_periods
  FOR DELETE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'master_admin'
    )
  );

-- ==========================
-- PAYROLL_RUNS - DENY mutations
-- ==========================
DROP POLICY IF EXISTS master_admin_deny_insert_payroll_runs ON payroll_runs;
CREATE POLICY master_admin_deny_insert_payroll_runs ON payroll_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'master_admin'
    )
  );

DROP POLICY IF EXISTS master_admin_deny_update_payroll_runs ON payroll_runs;
CREATE POLICY master_admin_deny_update_payroll_runs ON payroll_runs
  FOR UPDATE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'master_admin'
    )
  );

DROP POLICY IF EXISTS master_admin_deny_delete_payroll_runs ON payroll_runs;
CREATE POLICY master_admin_deny_delete_payroll_runs ON payroll_runs
  FOR DELETE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'master_admin'
    )
  );

-- ==========================
-- PRIZE_DRAWS - DENY mutations
-- ==========================
DROP POLICY IF EXISTS master_admin_deny_insert_prize_draws ON prize_draws;
CREATE POLICY master_admin_deny_insert_prize_draws ON prize_draws
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'master_admin'
    )
  );

DROP POLICY IF EXISTS master_admin_deny_update_prize_draws ON prize_draws;
CREATE POLICY master_admin_deny_update_prize_draws ON prize_draws
  FOR UPDATE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'master_admin'
    )
  );

DROP POLICY IF EXISTS master_admin_deny_delete_prize_draws ON prize_draws;
CREATE POLICY master_admin_deny_delete_prize_draws ON prize_draws
  FOR DELETE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'master_admin'
    )
  );

-- ==========================
-- AGENT_REQUESTS - DENY mutations
-- ==========================
DROP POLICY IF EXISTS master_admin_deny_insert_agent_requests ON agent_requests;
CREATE POLICY master_admin_deny_insert_agent_requests ON agent_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'master_admin'
    )
  );

DROP POLICY IF EXISTS master_admin_deny_update_agent_requests ON agent_requests;
CREATE POLICY master_admin_deny_update_agent_requests ON agent_requests
  FOR UPDATE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'master_admin'
    )
  );

DROP POLICY IF EXISTS master_admin_deny_delete_agent_requests ON agent_requests;
CREATE POLICY master_admin_deny_delete_agent_requests ON agent_requests
  FOR DELETE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'master_admin'
    )
  );

-- ==========================
-- PLATFORM_STATE - DENY mutations (Master Admin can view but NOT lock/unlock)
-- ==========================
DROP POLICY IF EXISTS master_admin_deny_update_platform_state ON platform_state;
CREATE POLICY master_admin_deny_update_platform_state ON platform_state
  FOR UPDATE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'master_admin'
    )
  );

COMMENT ON TABLE payroll_periods IS 'Master Admin: READ-ONLY (SELECT only) - Cannot INSERT/UPDATE/DELETE';
COMMENT ON TABLE payroll_runs IS 'Master Admin: READ-ONLY (SELECT only) - Cannot INSERT/UPDATE/DELETE';
COMMENT ON TABLE prize_draws IS 'Master Admin: READ-ONLY (SELECT only) - Cannot INSERT/UPDATE/DELETE';
COMMENT ON TABLE agent_requests IS 'Master Admin: READ-ONLY (SELECT only) - Cannot INSERT/UPDATE/DELETE';
COMMENT ON TABLE platform_state IS 'Master Admin: READ-ONLY (SELECT only) - Cannot lock/unlock platform';