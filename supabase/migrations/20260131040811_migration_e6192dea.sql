-- ====================================================================
-- PROMPT A4.2: HR PORTAL ACCESS, JOB TITLES & ESCALATION GOVERNANCE
-- (PART 2: Main Migration - Fixed Version)
-- ====================================================================

-- 1. UPDATE employees table to support flexible job titles
-- ====================================================================
ALTER TABLE employees 
  DROP COLUMN IF EXISTS role_title CASCADE;

ALTER TABLE employees 
  ADD COLUMN IF NOT EXISTS job_title TEXT NOT NULL DEFAULT 'Staff Member';

COMMENT ON COLUMN employees.job_title IS 'Free text job title (e.g., "Senior Accounts Officer", "HR Operations Lead")';

-- Add employment lifecycle tracking fields
ALTER TABLE employees 
  ADD COLUMN IF NOT EXISTS employment_start_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS employment_end_date DATE,
  ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'permanent' CHECK (contract_type IN ('permanent', 'fixed_term', 'probation', 'support')),
  ADD COLUMN IF NOT EXISTS probation_status TEXT CHECK (probation_status IN ('active', 'passed', 'failed', 'not_applicable')),
  ADD COLUMN IF NOT EXISTS employment_status_reason TEXT,
  ADD COLUMN IF NOT EXISTS last_status_change_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS last_status_change_at TIMESTAMP WITH TIME ZONE;

-- Update existing employees to have job_title based on role_category (migration helper)
UPDATE employees 
SET job_title = CASE role_category
  WHEN 'chairman' THEN 'Chairman'
  WHEN 'managing_director' THEN 'Managing Director'
  WHEN 'general_manager' THEN 'General Manager'
  WHEN 'department_head' THEN 'Department Head'
  WHEN 'hr_manager' THEN 'HR Manager'
  WHEN 'staff' THEN 'Staff Member'
  WHEN 'support_staff' THEN 'Support Staff'
  ELSE 'Employee'
END
WHERE job_title = 'Staff Member';

-- 2. CREATE hr_escalations table
-- ====================================================================
CREATE TABLE IF NOT EXISTS hr_escalations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  escalation_type TEXT NOT NULL CHECK (escalation_type IN (
    'salary_not_received',
    'contract_not_issued',
    'final_settlement_delayed',
    'bonus_not_applied',
    'leave_approval_delayed',
    'payment_dispute',
    'other'
  )),
  description TEXT NOT NULL,
  raised_by TEXT NOT NULL CHECK (raised_by IN ('employee', 'hr', 'manager', 'system')),
  current_level TEXT NOT NULL DEFAULT 'hr' CHECK (current_level IN ('hr', 'department_head', 'general_manager', 'managing_director', 'chairman')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'escalated', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  escalated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  escalated_to_level TEXT CHECK (escalated_to_level IN ('hr', 'department_head', 'general_manager', 'managing_director', 'chairman')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  auto_escalate_days INTEGER DEFAULT 3,
  last_escalation_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_escalations_employee ON hr_escalations(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_escalations_status ON hr_escalations(status);
CREATE INDEX IF NOT EXISTS idx_hr_escalations_level ON hr_escalations(current_level);
CREATE INDEX IF NOT EXISTS idx_hr_escalations_type ON hr_escalations(escalation_type);

COMMENT ON TABLE hr_escalations IS 'Employee HR escalations with hierarchical routing (HR → Dept Head → GM → MD → Chairman)';

-- 3. CREATE escalation_history table
-- ====================================================================
CREATE TABLE IF NOT EXISTS escalation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escalation_id UUID NOT NULL REFERENCES hr_escalations(id) ON DELETE CASCADE,
  from_level TEXT NOT NULL,
  to_level TEXT NOT NULL,
  escalated_by UUID REFERENCES profiles(id),
  escalation_reason TEXT,
  escalated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escalation_history_escalation ON escalation_history(escalation_id);

COMMENT ON TABLE escalation_history IS 'Audit trail for escalation level changes';

-- 4. EXTEND employee_salaries table for payment tracking
-- ====================================================================
ALTER TABLE employee_salaries 
  ADD COLUMN IF NOT EXISTS effective_to DATE,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'escalated', 'disputed')),
  ADD COLUMN IF NOT EXISTS last_payment_run_id UUID,
  ADD COLUMN IF NOT EXISTS payment_issue_flag BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS payment_issue_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_employee_salaries_payment_status ON employee_salaries(payment_status);
CREATE INDEX IF NOT EXISTS idx_employee_salaries_issue_flag ON employee_salaries(payment_issue_flag) WHERE payment_issue_flag = TRUE;

-- 5. CREATE employee_role_permissions table
-- ====================================================================
CREATE TABLE IF NOT EXISTS employee_role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_category TEXT NOT NULL,
  permission_name TEXT NOT NULL,
  can_create BOOLEAN DEFAULT FALSE,
  can_read BOOLEAN DEFAULT FALSE,
  can_update BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  scope_restriction TEXT, -- 'all', 'department', 'subordinates_only'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_category, permission_name)
);

-- Insert default permissions
INSERT INTO employee_role_permissions (role_category, permission_name, can_create, can_read, can_update, can_delete, scope_restriction) VALUES
  -- Super Admin permissions
  ('chairman', 'employee_management', TRUE, TRUE, TRUE, TRUE, 'all'),
  ('chairman', 'salary_management', TRUE, TRUE, TRUE, TRUE, 'all'),
  ('chairman', 'escalation_management', TRUE, TRUE, TRUE, TRUE, 'all'),
  ('chairman', 'hr_configuration', TRUE, TRUE, TRUE, TRUE, 'all'),
  
  -- MD permissions
  ('managing_director', 'employee_management', TRUE, TRUE, TRUE, TRUE, 'all'),
  ('managing_director', 'salary_management', TRUE, TRUE, TRUE, FALSE, 'all'),
  ('managing_director', 'escalation_management', TRUE, TRUE, TRUE, TRUE, 'all'),
  
  -- GM permissions
  ('general_manager', 'employee_management', TRUE, TRUE, TRUE, FALSE, 'department'),
  ('general_manager', 'salary_management', FALSE, TRUE, TRUE, FALSE, 'department'),
  ('general_manager', 'escalation_management', FALSE, TRUE, TRUE, FALSE, 'department'),
  
  -- HR Manager permissions
  ('hr_manager', 'employee_management', TRUE, TRUE, TRUE, FALSE, 'subordinates_only'),
  ('hr_manager', 'salary_management', FALSE, TRUE, TRUE, FALSE, 'subordinates_only'),
  ('hr_manager', 'escalation_management', TRUE, TRUE, TRUE, FALSE, 'all'),
  
  -- Department Head permissions
  ('department_head', 'employee_management', FALSE, TRUE, FALSE, FALSE, 'department'),
  ('department_head', 'salary_management', FALSE, TRUE, FALSE, FALSE, 'department'),
  ('department_head', 'escalation_management', TRUE, TRUE, TRUE, FALSE, 'department')
ON CONFLICT (role_category, permission_name) DO NOTHING;

-- 6. CREATE RPC function for checking HR permissions
-- ====================================================================
CREATE OR REPLACE FUNCTION check_hr_permission(
  p_admin_id UUID,
  p_permission_name TEXT,
  p_action TEXT, -- 'create', 'read', 'update', 'delete'
  p_target_employee_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_employee RECORD;
  v_permission RECORD;
  v_target_employee RECORD;
  v_has_permission BOOLEAN := FALSE;
  v_reason TEXT;
BEGIN
  -- Get admin's employee record
  SELECT * INTO v_employee
  FROM employees
  WHERE created_by_admin_id = p_admin_id OR id IN (
    SELECT id FROM employees WHERE created_by_admin_id = p_admin_id
  )
  LIMIT 1;

  IF v_employee IS NULL THEN
    RETURN json_build_object(
      'has_permission', FALSE,
      'reason', 'Admin is not an employee'
    );
  END IF;

  -- Check if Super Admin (bypass all checks)
  IF EXISTS (SELECT 1 FROM profiles WHERE id = p_admin_id AND role = 'super_admin') THEN
    RETURN json_build_object(
      'has_permission', TRUE,
      'reason', 'Super Admin access'
    );
  END IF;

  -- Get permission record
  SELECT * INTO v_permission
  FROM employee_role_permissions
  WHERE role_category = v_employee.role_category
    AND permission_name = p_permission_name;

  IF v_permission IS NULL THEN
    RETURN json_build_object(
      'has_permission', FALSE,
      'reason', 'No permission record found'
    );
  END IF;

  -- Check action permission
  v_has_permission := CASE p_action
    WHEN 'create' THEN v_permission.can_create
    WHEN 'read' THEN v_permission.can_read
    WHEN 'update' THEN v_permission.can_update
    WHEN 'delete' THEN v_permission.can_delete
    ELSE FALSE
  END;

  IF NOT v_has_permission THEN
    RETURN json_build_object(
      'has_permission', FALSE,
      'reason', format('Role %s cannot %s %s', v_employee.role_category, p_action, p_permission_name)
    );
  END IF;

  -- Check scope restrictions for target employee
  IF p_target_employee_id IS NOT NULL THEN
    SELECT * INTO v_target_employee
    FROM employees
    WHERE id = p_target_employee_id;

    -- Scope: subordinates_only
    IF v_permission.scope_restriction = 'subordinates_only' THEN
      IF v_target_employee.role_category IN ('chairman', 'managing_director', 'general_manager', 'hr_manager') THEN
        RETURN json_build_object(
          'has_permission', FALSE,
          'reason', 'Cannot manage senior roles'
        );
      END IF;
    END IF;

    -- Scope: department
    IF v_permission.scope_restriction = 'department' THEN
      IF v_target_employee.department != v_employee.department THEN
        RETURN json_build_object(
          'has_permission', FALSE,
          'reason', 'Cannot manage employees outside department'
        );
      END IF;
    END IF;
  END IF;

  RETURN json_build_object(
    'has_permission', TRUE,
    'reason', 'Permission granted'
  );
END;
$$ LANGUAGE plpgsql;

-- 7. CREATE RPC function for auto-escalating unresolved issues
-- ====================================================================
CREATE OR REPLACE FUNCTION auto_escalate_hr_issues()
RETURNS JSON AS $$
DECLARE
  v_escalation RECORD;
  v_next_level TEXT;
  v_escalated_count INTEGER := 0;
BEGIN
  FOR v_escalation IN 
    SELECT * FROM hr_escalations
    WHERE status IN ('open', 'in_review')
      AND (
        (current_level = 'hr' AND escalated_at < NOW() - INTERVAL '3 days') OR
        (current_level = 'department_head' AND escalated_at < NOW() - INTERVAL '3 days') OR
        (current_level = 'general_manager' AND escalated_at < NOW() - INTERVAL '2 days') OR
        (current_level = 'managing_director' AND escalated_at < NOW() - INTERVAL '2 days')
      )
  LOOP
    -- Determine next level
    v_next_level := CASE v_escalation.current_level
      WHEN 'hr' THEN 'department_head'
      WHEN 'department_head' THEN 'general_manager'
      WHEN 'general_manager' THEN 'managing_director'
      WHEN 'managing_director' THEN 'chairman'
      ELSE 'chairman'
    END;

    -- Update escalation
    UPDATE hr_escalations
    SET 
      current_level = v_next_level,
      escalated_to_level = v_next_level,
      status = 'escalated',
      last_escalation_at = NOW(),
      updated_at = NOW()
    WHERE id = v_escalation.id;

    -- Log escalation history
    INSERT INTO escalation_history (escalation_id, from_level, to_level, escalation_reason)
    VALUES (v_escalation.id, v_escalation.current_level, v_next_level, 'Auto-escalated due to timeout');

    v_escalated_count := v_escalated_count + 1;
  END LOOP;

  RETURN json_build_object(
    'success', TRUE,
    'escalated_count', v_escalated_count
  );
END;
$$ LANGUAGE plpgsql;

-- 8. RLS policies for hr_escalations
-- ====================================================================
ALTER TABLE hr_escalations ENABLE ROW LEVEL SECURITY;

-- Super Admin can view all
CREATE POLICY "super_admin_view_all_escalations" ON hr_escalations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Employees can view their own escalations
CREATE POLICY "employees_view_own_escalations" ON hr_escalations
  FOR SELECT USING (
    employee_id IN (SELECT id FROM employees WHERE created_by_admin_id = auth.uid())
  );

-- HR Managers can view all escalations
CREATE POLICY "hr_managers_view_escalations" ON hr_escalations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE created_by_admin_id = auth.uid() 
        AND role_category IN ('hr_manager', 'general_manager', 'managing_director', 'chairman')
    )
  );

-- Only authorized roles can create escalations
CREATE POLICY "authorized_create_escalations" ON hr_escalations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'manager_admin'))
  );

-- Only authorized roles can update escalations
CREATE POLICY "authorized_update_escalations" ON hr_escalations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE created_by_admin_id = auth.uid() 
        AND role_category IN ('hr_manager', 'general_manager', 'managing_director', 'chairman')
    )
  );

-- 9. RLS policies for escalation_history
-- ====================================================================
ALTER TABLE escalation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_escalation_history" ON escalation_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'manager_admin'))
  );

-- 10. RLS policies for employee_role_permissions
-- ====================================================================
ALTER TABLE employee_role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_role_permissions" ON employee_role_permissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'manager_admin'))
  );

-- 11. Update triggers for updated_at
-- ====================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hr_escalations_updated_at
  BEFORE UPDATE ON hr_escalations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

SELECT 'PROMPT A4.2: HR Portal Access, Job Titles & Escalation Governance migration completed successfully' AS status;