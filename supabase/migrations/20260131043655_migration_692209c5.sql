-- ====================================================================
-- PROMPT A5.7A: EMPLOYEE ATTENDANCE & LATENESS LOGGING (FOUNDATION)
-- ====================================================================
-- This migration creates attendance tracking infrastructure
-- NO penalties, NO enforcement, FOUNDATION ONLY
-- Status: ADDITIVE ONLY - Does not modify existing systems
-- ====================================================================

-- ====================================================================
-- 1. CREATE ATTENDANCE STATUS ENUM
-- ====================================================================

DO $$ BEGIN
  CREATE TYPE employee_attendance_status AS ENUM (
    'on_time',
    'late',
    'absent',
    'excused'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE employee_attendance_status IS 'Employee attendance status for daily tracking';

-- ====================================================================
-- 2. EMPLOYEE ATTENDANCE LOGS TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS employee_attendance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  role_category TEXT NOT NULL,
  department TEXT NOT NULL,
  attendance_date DATE NOT NULL,
  expected_login_time TIME NOT NULL,
  actual_login_time TIME,
  status employee_attendance_status NOT NULL DEFAULT 'absent',
  lateness_minutes INTEGER,
  logged_from_ip TEXT,
  logged_from_location TEXT,
  manual_entry BOOLEAN DEFAULT FALSE,
  manual_entry_reason TEXT,
  recorded_by_admin_id UUID REFERENCES profiles(id),
  recorded_by_system BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_employee_attendance_date UNIQUE (employee_id, attendance_date),
  CONSTRAINT lateness_minutes_positive CHECK (lateness_minutes >= 0),
  CONSTRAINT manual_entry_requires_reason CHECK (
    (manual_entry = FALSE) OR 
    (manual_entry = TRUE AND manual_entry_reason IS NOT NULL AND recorded_by_admin_id IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON employee_attendance_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON employee_attendance_logs(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON employee_attendance_logs(status);
CREATE INDEX IF NOT EXISTS idx_attendance_department ON employee_attendance_logs(department);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON employee_attendance_logs(employee_id, attendance_date);

COMMENT ON TABLE employee_attendance_logs IS 'Employee attendance tracking with automatic lateness detection (FOUNDATION - no penalties)';
COMMENT ON COLUMN employee_attendance_logs.employee_id IS 'Employee being tracked (all employee types including guards/cleaners)';
COMMENT ON COLUMN employee_attendance_logs.role_category IS 'Employee role at time of attendance';
COMMENT ON COLUMN employee_attendance_logs.department IS 'Employee department at time of attendance';
COMMENT ON COLUMN employee_attendance_logs.expected_login_time IS 'Expected login time based on business hours config';
COMMENT ON COLUMN employee_attendance_logs.actual_login_time IS 'Actual login time recorded';
COMMENT ON COLUMN employee_attendance_logs.status IS 'Attendance status: on_time, late, absent, excused';
COMMENT ON COLUMN employee_attendance_logs.lateness_minutes IS 'Minutes late (NULL if on time or absent)';
COMMENT ON COLUMN employee_attendance_logs.manual_entry IS 'TRUE if manually entered by admin/HR (for guards, cleaners, non-digital staff)';
COMMENT ON COLUMN employee_attendance_logs.manual_entry_reason IS 'Required reason for manual entries';
COMMENT ON COLUMN employee_attendance_logs.recorded_by_system IS 'TRUE if automatically recorded, FALSE if manual correction';

-- ====================================================================
-- 3. BUSINESS HOURS CONFIGURATION TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS business_hours_config (
  country_code TEXT PRIMARY KEY,
  business_start_time TIME NOT NULL DEFAULT '09:00:00',
  business_end_time TIME NOT NULL DEFAULT '18:00:00',
  grace_period_minutes INTEGER NOT NULL DEFAULT 30,
  timezone TEXT NOT NULL DEFAULT 'Asia/Dhaka',
  active BOOLEAN DEFAULT TRUE,
  updated_by_admin_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT grace_period_valid CHECK (grace_period_minutes >= 0 AND grace_period_minutes <= 120),
  CONSTRAINT business_hours_valid CHECK (business_end_time > business_start_time)
);

-- Insert default Bangladesh config
INSERT INTO business_hours_config (country_code, business_start_time, grace_period_minutes, timezone, active)
VALUES ('BD', '09:00:00', 30, 'Asia/Dhaka', TRUE)
ON CONFLICT (country_code) DO NOTHING;

COMMENT ON TABLE business_hours_config IS 'Business hours configuration per country (editable by Super Admin only)';
COMMENT ON COLUMN business_hours_config.business_start_time IS 'Standard business start time';
COMMENT ON COLUMN business_hours_config.grace_period_minutes IS 'Grace period before marking late (applies uniformly to all employees)';
COMMENT ON COLUMN business_hours_config.timezone IS 'Timezone for attendance calculations';

-- ====================================================================
-- 4. ATTENDANCE CORRECTION HISTORY TABLE
-- ====================================================================
-- For audit trail when attendance records need correction

CREATE TABLE IF NOT EXISTS attendance_corrections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_attendance_id UUID NOT NULL REFERENCES employee_attendance_logs(id),
  corrected_attendance_id UUID NOT NULL REFERENCES employee_attendance_logs(id),
  correction_reason TEXT NOT NULL,
  corrected_by_admin_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT different_records CHECK (original_attendance_id != corrected_attendance_id)
);

CREATE INDEX IF NOT EXISTS idx_corrections_original ON attendance_corrections(original_attendance_id);
CREATE INDEX IF NOT EXISTS idx_corrections_corrected ON attendance_corrections(corrected_attendance_id);

COMMENT ON TABLE attendance_corrections IS 'Audit trail for attendance record corrections (immutable records - corrections create new entries)';

-- ====================================================================
-- 5. RPC FUNCTION: CALCULATE LATENESS STATUS
-- ====================================================================

CREATE OR REPLACE FUNCTION calculate_attendance_status(
  p_expected_time TIME,
  p_actual_time TIME,
  p_grace_minutes INTEGER
)
RETURNS TABLE (
  status employee_attendance_status,
  lateness_minutes INTEGER
) AS $$
DECLARE
  v_grace_end_time TIME;
  v_lateness_interval INTERVAL;
BEGIN
  -- Calculate grace period end time
  v_grace_end_time := p_expected_time + (p_grace_minutes || ' minutes')::INTERVAL;
  
  -- If no actual login time provided, status is absent
  IF p_actual_time IS NULL THEN
    RETURN QUERY SELECT 'absent'::employee_attendance_status, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check if on time (within grace period)
  IF p_actual_time <= v_grace_end_time THEN
    RETURN QUERY SELECT 'on_time'::employee_attendance_status, 0;
    RETURN;
  END IF;
  
  -- Calculate lateness
  v_lateness_interval := p_actual_time - v_grace_end_time;
  
  -- Return late status with minutes
  RETURN QUERY SELECT 
    'late'::employee_attendance_status,
    EXTRACT(EPOCH FROM v_lateness_interval)::INTEGER / 60;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_attendance_status IS 'Calculate attendance status and lateness minutes based on business hours and grace period';

-- ====================================================================
-- 6. RPC FUNCTION: LOG EMPLOYEE ATTENDANCE
-- ====================================================================

CREATE OR REPLACE FUNCTION log_employee_attendance(
  p_employee_id UUID,
  p_attendance_date DATE,
  p_actual_login_time TIME,
  p_logged_from_ip TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_employee RECORD;
  v_business_hours RECORD;
  v_attendance_status RECORD;
  v_attendance_id UUID;
BEGIN
  -- Get employee details
  SELECT id, role_category, department, status
  INTO v_employee
  FROM employees
  WHERE id = p_employee_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Employee not found'
    );
  END IF;
  
  IF v_employee.status != 'active' THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Employee is not active'
    );
  END IF;
  
  -- Get business hours config
  SELECT business_start_time, grace_period_minutes
  INTO v_business_hours
  FROM business_hours_config
  WHERE country_code = 'BD' AND active = TRUE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Business hours not configured'
    );
  END IF;
  
  -- Calculate attendance status
  SELECT status, lateness_minutes
  INTO v_attendance_status
  FROM calculate_attendance_status(
    v_business_hours.business_start_time,
    p_actual_login_time,
    v_business_hours.grace_period_minutes
  );
  
  -- Insert attendance log
  INSERT INTO employee_attendance_logs (
    employee_id,
    role_category,
    department,
    attendance_date,
    expected_login_time,
    actual_login_time,
    status,
    lateness_minutes,
    logged_from_ip,
    recorded_by_system
  )
  VALUES (
    p_employee_id,
    v_employee.role_category,
    v_employee.department,
    p_attendance_date,
    v_business_hours.business_start_time,
    p_actual_login_time,
    v_attendance_status.status,
    v_attendance_status.lateness_minutes,
    p_logged_from_ip,
    TRUE
  )
  ON CONFLICT (employee_id, attendance_date) 
  DO UPDATE SET
    actual_login_time = EXCLUDED.actual_login_time,
    status = EXCLUDED.status,
    lateness_minutes = EXCLUDED.lateness_minutes,
    logged_from_ip = EXCLUDED.logged_from_ip,
    updated_at = NOW()
  RETURNING id INTO v_attendance_id;
  
  RETURN json_build_object(
    'success', TRUE,
    'attendance_id', v_attendance_id,
    'status', v_attendance_status.status,
    'lateness_minutes', v_attendance_status.lateness_minutes
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_employee_attendance IS 'Automatic attendance logging with lateness detection (called on employee login)';

-- ====================================================================
-- 7. RPC FUNCTION: MANUAL ATTENDANCE ENTRY
-- ====================================================================

CREATE OR REPLACE FUNCTION manual_attendance_entry(
  p_employee_id UUID,
  p_attendance_date DATE,
  p_actual_login_time TIME,
  p_status employee_attendance_status,
  p_reason TEXT,
  p_recorded_by_admin_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_employee RECORD;
  v_business_hours RECORD;
  v_attendance_id UUID;
  v_lateness_minutes INTEGER;
BEGIN
  -- Validate admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_recorded_by_admin_id 
    AND role IN ('super_admin', 'manager_admin')
  ) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Insufficient permissions - only Super Admin or Manager Admin can manually enter attendance'
    );
  END IF;
  
  -- Get employee details
  SELECT id, role_category, department, status
  INTO v_employee
  FROM employees
  WHERE id = p_employee_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Employee not found'
    );
  END IF;
  
  -- Get business hours config
  SELECT business_start_time, grace_period_minutes
  INTO v_business_hours
  FROM business_hours_config
  WHERE country_code = 'BD' AND active = TRUE;
  
  -- Calculate lateness if status is 'late'
  IF p_status = 'late' AND p_actual_login_time IS NOT NULL THEN
    SELECT lateness_minutes
    INTO v_lateness_minutes
    FROM calculate_attendance_status(
      v_business_hours.business_start_time,
      p_actual_login_time,
      v_business_hours.grace_period_minutes
    );
  END IF;
  
  -- Insert manual attendance log
  INSERT INTO employee_attendance_logs (
    employee_id,
    role_category,
    department,
    attendance_date,
    expected_login_time,
    actual_login_time,
    status,
    lateness_minutes,
    manual_entry,
    manual_entry_reason,
    recorded_by_admin_id,
    recorded_by_system
  )
  VALUES (
    p_employee_id,
    v_employee.role_category,
    v_employee.department,
    p_attendance_date,
    v_business_hours.business_start_time,
    p_actual_login_time,
    p_status,
    v_lateness_minutes,
    TRUE,
    p_reason,
    p_recorded_by_admin_id,
    FALSE
  )
  ON CONFLICT (employee_id, attendance_date) 
  DO UPDATE SET
    actual_login_time = EXCLUDED.actual_login_time,
    status = EXCLUDED.status,
    lateness_minutes = EXCLUDED.lateness_minutes,
    manual_entry = TRUE,
    manual_entry_reason = EXCLUDED.manual_entry_reason,
    recorded_by_admin_id = EXCLUDED.recorded_by_admin_id,
    recorded_by_system = FALSE,
    updated_at = NOW()
  RETURNING id INTO v_attendance_id;
  
  RETURN json_build_object(
    'success', TRUE,
    'attendance_id', v_attendance_id,
    'status', p_status,
    'manual_entry', TRUE
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION manual_attendance_entry IS 'Manual attendance entry by HR/Manager Admin for guards, cleaners, non-digital staff';

-- ====================================================================
-- 8. RPC FUNCTION: GET EMPLOYEE ATTENDANCE RECORDS
-- ====================================================================

CREATE OR REPLACE FUNCTION get_employee_attendance(
  p_employee_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_viewer_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  attendance_date DATE,
  expected_login_time TIME,
  actual_login_time TIME,
  status employee_attendance_status,
  lateness_minutes INTEGER,
  manual_entry BOOLEAN,
  manual_entry_reason TEXT
) AS $$
DECLARE
  v_viewer_role TEXT;
  v_viewer_employee RECORD;
BEGIN
  -- Get viewer role and employee details if applicable
  SELECT role INTO v_viewer_role FROM profiles WHERE id = p_viewer_id;
  
  IF v_viewer_role IS NULL THEN
    RAISE EXCEPTION 'Viewer not found';
  END IF;
  
  -- Super Admin and Chairman can see all
  IF v_viewer_role = 'super_admin' THEN
    RETURN QUERY
    SELECT 
      eal.id,
      eal.attendance_date,
      eal.expected_login_time,
      eal.actual_login_time,
      eal.status,
      eal.lateness_minutes,
      eal.manual_entry,
      eal.manual_entry_reason
    FROM employee_attendance_logs eal
    WHERE eal.employee_id = p_employee_id
      AND eal.attendance_date BETWEEN p_start_date AND p_end_date
    ORDER BY eal.attendance_date DESC;
    RETURN;
  END IF;
  
  -- Get viewer's employee record if they are an employee
  SELECT e.id, e.role_category, e.department
  INTO v_viewer_employee
  FROM employees e
  WHERE e.created_by_admin_id = p_viewer_id OR e.id IN (
    SELECT id FROM employees WHERE created_by_admin_id = p_viewer_id
  );
  
  -- Employees can only see their own records
  IF p_viewer_id::TEXT = p_employee_id::TEXT THEN
    RETURN QUERY
    SELECT 
      eal.id,
      eal.attendance_date,
      eal.expected_login_time,
      eal.actual_login_time,
      eal.status,
      eal.lateness_minutes,
      eal.manual_entry,
      eal.manual_entry_reason
    FROM employee_attendance_logs eal
    WHERE eal.employee_id = p_employee_id
      AND eal.attendance_date BETWEEN p_start_date AND p_end_date
    ORDER BY eal.attendance_date DESC;
    RETURN;
  END IF;
  
  -- Department Heads can see their department (read-only)
  IF v_viewer_employee.role_category IN ('department_head', 'general_manager', 'managing_director', 'chairman') THEN
    RETURN QUERY
    SELECT 
      eal.id,
      eal.attendance_date,
      eal.expected_login_time,
      eal.actual_login_time,
      eal.status,
      eal.lateness_minutes,
      eal.manual_entry,
      eal.manual_entry_reason
    FROM employee_attendance_logs eal
    JOIN employees e ON eal.employee_id = e.id
    WHERE eal.employee_id = p_employee_id
      AND eal.attendance_date BETWEEN p_start_date AND p_end_date
      AND (
        v_viewer_employee.role_category IN ('general_manager', 'managing_director', 'chairman')
        OR e.department = v_viewer_employee.department
      )
    ORDER BY eal.attendance_date DESC;
    RETURN;
  END IF;
  
  -- No access
  RAISE EXCEPTION 'Insufficient permissions to view attendance records';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_employee_attendance IS 'Get employee attendance records with role-based visibility';

-- ====================================================================
-- 9. ROW LEVEL SECURITY POLICIES
-- ====================================================================

ALTER TABLE employee_attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_corrections ENABLE ROW LEVEL SECURITY;

-- Attendance Logs Policies
CREATE POLICY "Super admins can view all attendance logs"
  ON employee_attendance_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Manager admins can view all attendance logs"
  ON employee_attendance_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager_admin'
    )
  );

CREATE POLICY "System can insert attendance logs"
  ON employee_attendance_logs FOR INSERT
  TO authenticated
  WITH CHECK (recorded_by_system = TRUE);

CREATE POLICY "Admins can manually insert attendance"
  ON employee_attendance_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    manual_entry = TRUE AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'manager_admin')
    )
  );

-- Business Hours Config Policies
CREATE POLICY "Anyone can view business hours"
  ON business_hours_config FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Only super admins can update business hours"
  ON business_hours_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Attendance Corrections Policies
CREATE POLICY "Admins can view corrections"
  ON attendance_corrections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'manager_admin')
    )
  );

CREATE POLICY "Admins can create corrections"
  ON attendance_corrections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'manager_admin')
    )
  );

-- ====================================================================
-- 10. UPDATED_AT TRIGGER
-- ====================================================================

CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS attendance_updated_at ON employee_attendance_logs;
CREATE TRIGGER attendance_updated_at
  BEFORE UPDATE ON employee_attendance_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_updated_at();

DROP TRIGGER IF EXISTS business_hours_updated_at ON business_hours_config;
CREATE TRIGGER business_hours_updated_at
  BEFORE UPDATE ON business_hours_config
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_updated_at();

-- ====================================================================
-- MIGRATION COMPLETE
-- ====================================================================

SELECT 'PROMPT A5.7A: Employee Attendance & Lateness Logging (FOUNDATION) migration completed successfully' AS status;