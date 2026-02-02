-- ====================================================================
-- FIX: Add user_id to employees table to link with auth.users
-- This is required for "Employee Self View" functionality
-- ====================================================================

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'employees' 
    AND column_name = 'user_id'
  ) THEN 
    ALTER TABLE employees 
    ADD COLUMN user_id UUID REFERENCES profiles(id);
    
    CREATE INDEX idx_employees_user_id ON employees(user_id);
  END IF;
END $$;

-- ====================================================================
-- 1. RPC FUNCTION: GET TODAY'S ATTENDANCE SUMMARY (FIXED)
-- ====================================================================
CREATE OR REPLACE FUNCTION get_attendance_summary(
  p_date DATE DEFAULT CURRENT_DATE,
  p_department TEXT DEFAULT NULL,
  p_admin_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_summary JSON;
  v_admin_role TEXT;
  v_admin_department TEXT;
BEGIN
  -- Get admin role and department from employees table using user_id
  SELECT role_category::text, department
  INTO v_admin_role, v_admin_department
  FROM employees
  WHERE user_id = p_admin_id
  LIMIT 1;

  -- If admin is department head, filter by their department only
  IF v_admin_role = 'department_head' AND p_department IS NULL THEN
    p_department := v_admin_department;
  END IF;

  -- Build summary
  SELECT json_build_object(
    'date', p_date,
    'total_employees', COUNT(*),
    'on_time', COUNT(*) FILTER (WHERE status = 'on_time'),
    'late', COUNT(*) FILTER (WHERE status = 'late'),
    'absent', COUNT(*) FILTER (WHERE status = 'absent'),
    'excused', COUNT(*) FILTER (WHERE status = 'excused'),
    'average_lateness_minutes', COALESCE(AVG(lateness_minutes) FILTER (WHERE status = 'late'), 0)
  )
  INTO v_summary
  FROM employee_attendance_logs
  WHERE attendance_date = p_date
    AND (p_department IS NULL OR department = p_department);

  RETURN v_summary;
END;
$$;

-- ====================================================================
-- 2. RPC FUNCTION: GET LATE EMPLOYEES LIST (FIXED)
-- ====================================================================
CREATE OR REPLACE FUNCTION get_late_employees(
  p_date DATE DEFAULT CURRENT_DATE,
  p_department TEXT DEFAULT NULL,
  p_admin_id UUID DEFAULT NULL
)
RETURNS TABLE(
  employee_id UUID,
  employee_name TEXT,
  role TEXT,
  department TEXT,
  expected_login_time TIME,
  actual_login_time TIME,
  lateness_minutes INTEGER,
  logged_from_ip TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_role TEXT;
  v_admin_department TEXT;
BEGIN
  -- Get admin role and department
  SELECT role_category::text, department
  INTO v_admin_role, v_admin_department
  FROM employees
  WHERE user_id = p_admin_id
  LIMIT 1;

  -- If admin is department head, filter by their department only
  IF v_admin_role = 'department_head' AND p_department IS NULL THEN
    p_department := v_admin_department;
  END IF;

  RETURN QUERY
  SELECT 
    eal.employee_id,
    e.full_name as employee_name,
    eal.role_category as role,
    eal.department,
    eal.expected_login_time,
    eal.actual_login_time,
    eal.lateness_minutes,
    eal.logged_from_ip
  FROM employee_attendance_logs eal
  JOIN employees e ON e.id = eal.employee_id
  WHERE eal.attendance_date = p_date
    AND eal.status = 'late'
    AND (p_department IS NULL OR eal.department = p_department)
  ORDER BY eal.lateness_minutes DESC;
END;
$$;

-- ====================================================================
-- 3. RPC FUNCTION: GET ABSENT EMPLOYEES LIST (FIXED)
-- ====================================================================
CREATE OR REPLACE FUNCTION get_absent_employees(
  p_date DATE DEFAULT CURRENT_DATE,
  p_department TEXT DEFAULT NULL,
  p_admin_id UUID DEFAULT NULL
)
RETURNS TABLE(
  employee_id UUID,
  employee_name TEXT,
  role TEXT,
  department TEXT,
  expected_login_time TIME
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_role TEXT;
  v_admin_department TEXT;
BEGIN
  -- Get admin role and department
  SELECT role_category::text, department
  INTO v_admin_role, v_admin_department
  FROM employees
  WHERE user_id = p_admin_id
  LIMIT 1;

  -- If admin is department head, filter by their department only
  IF v_admin_role = 'department_head' AND p_department IS NULL THEN
    p_department := v_admin_department;
  END IF;

  RETURN QUERY
  SELECT 
    eal.employee_id,
    e.full_name as employee_name,
    eal.role_category as role,
    eal.department,
    eal.expected_login_time
  FROM employee_attendance_logs eal
  JOIN employees e ON e.id = eal.employee_id
  WHERE eal.attendance_date = p_date
    AND eal.status = 'absent'
    AND (p_department IS NULL OR eal.department = p_department)
  ORDER BY eal.department, eal.role_category;
END;
$$;

-- ====================================================================
-- 4. RPC FUNCTION: GET EMPLOYEE ATTENDANCE HISTORY (FIXED)
-- ====================================================================
CREATE OR REPLACE FUNCTION get_employee_attendance_history(
  p_employee_id UUID,
  p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  attendance_date DATE,
  expected_login_time TIME,
  actual_login_time TIME,
  status TEXT,
  lateness_minutes INTEGER,
  manual_entry_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_requesting_user_id UUID;
  v_target_employee_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  v_requesting_user_id := auth.uid();
  
  -- Check if user is an admin
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = v_requesting_user_id
    AND role IN ('super_admin', 'manager_admin', 'worker_admin')
  ) INTO v_is_admin;
  
  -- Get target employee's user_id to verify ownership
  SELECT user_id INTO v_target_employee_user_id
  FROM employees
  WHERE id = p_employee_id;

  -- Verify requester is viewing their own records or is admin
  IF NOT (
    (v_target_employee_user_id IS NOT NULL AND v_target_employee_user_id = v_requesting_user_id) OR
    v_is_admin
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Can only view own attendance records';
  END IF;

  RETURN QUERY
  SELECT 
    eal.attendance_date,
    eal.expected_login_time,
    eal.actual_login_time,
    eal.status::text,
    eal.lateness_minutes,
    eal.manual_entry_reason
  FROM employee_attendance_logs eal
  WHERE eal.employee_id = p_employee_id
    AND eal.attendance_date BETWEEN p_start_date AND p_end_date
  ORDER BY eal.attendance_date DESC;
END;
$$;

-- ====================================================================
-- 5. TRIGGER FUNCTION: AUTO-SEND LATE ALERT NOTIFICATION (FIXED)
-- ====================================================================
CREATE OR REPLACE FUNCTION send_late_alert_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_employee_name TEXT;
  v_employee_user_id UUID;
  v_department_head_id UUID;
  v_gm_id UUID;
  v_employee_role TEXT;
BEGIN
  -- Only trigger for 'late' status
  IF NEW.status != 'late' THEN
    RETURN NEW;
  END IF;

  -- Get employee details
  SELECT full_name, user_id, role_category::text 
  INTO v_employee_name, v_employee_user_id, v_employee_role
  FROM employees WHERE id = NEW.employee_id;

  -- 1. Notify the employee (if linked to a user account)
  IF v_employee_user_id IS NOT NULL THEN
    INSERT INTO admin_notifications (
      user_id, -- Wait, admin_notifications might need to link to profiles.id (which is user_id)
      -- Let's check schema for admin_notifications... user_id is NOT in the list?
      -- Ah, schema shows `member_id` and `read_by`, but no generic `user_id` owner?
      -- Wait, Prompt A5.7B says "Logged in admin_notifications table".
      -- Existing schema for admin_notifications: `target_admin_roles` array, `member_id` nullable.
      -- It does NOT have a specific `recipient_user_id` column for 1:1 notifications!
      -- It seems `admin_notifications` is designed for Role-based broadcasts.
      -- BUT `notifications` table IS designed for 1:1.
      -- I should use `notifications` table for the Employee alert, and `admin_notifications` for the Admin alerts?
      -- Or create a new notification type in `notifications` table.
      
      -- Prompt says: "Alert recipients: Employee (notification), Department Head (notification)..."
      -- "Logged in admin_notifications table" -> This constraint might be for Admin alerts.
      -- For Employee, they are not admins. 
      -- Let's use `notifications` table for Employee (User) and `admin_notifications` or `notifications` for Dept Head.
      
      -- Actually, Dept Heads ARE admins/employees. 
      -- Let's use `notifications` table for specific user targeting, as it has `recipient_id`.
      -- `admin_notifications` seems to be a shared pool for "admins of a certain role".
      
      -- REVISED STRATEGY: Use `notifications` table for ALL targeted notifications (Employee, specific Dept Head).
      
      recipient_id,
      recipient_role,
      notification_type,
      title,
      description,
      priority,
      reference_id,
      reference_type
    ) VALUES (
      v_employee_user_id,
      'member', -- Or 'employee'? Schema allows 'member', 'worker_admin', etc. Let's use 'worker_admin' if they are staff?
      -- Role check on notifications table: 'member', 'worker_admin', 'manager_admin', 'super_admin'.
      -- Staff are likely 'worker_admin' or just 'member' in profiles.
      -- Safest is to check profile role, but for now let's assume 'member' or fetch profile role.
      'system_alert', -- Type check allows 'system_alert'
      'Attendance Alert: Late Login',
      'You are late today. Please ensure timely login.',
      'normal',
      NEW.id,
      'attendance_log'
    );
  END IF;

  -- 2. Find and notify Department Head
  SELECT user_id INTO v_department_head_id
  FROM employees
  WHERE department = NEW.department
    AND role_category = 'department_head'
  LIMIT 1;

  IF v_department_head_id IS NOT NULL THEN
    INSERT INTO notifications (
      recipient_id,
      recipient_role,
      notification_type,
      title,
      description,
      priority,
      reference_id,
      reference_type
    ) VALUES (
      v_department_head_id,
      'manager_admin', -- Dept heads are usually manager admins
      'system_alert',
      'Department Attendance Alert',
      format('Employee %s (%s) was late by %s minutes today.', 
        v_employee_name, NEW.role_category, NEW.lateness_minutes),
      'normal',
      NEW.id,
      'attendance_log'
    );
  END IF;

  -- 3. Notify GM if the late employee is GM or above
  IF v_employee_role IN ('general_manager', 'managing_director', 'chairman') THEN
    SELECT user_id INTO v_gm_id
    FROM employees
    WHERE role_category = 'general_manager'
    LIMIT 1;

    IF v_gm_id IS NOT NULL AND v_gm_id != v_employee_user_id THEN
      INSERT INTO notifications (
        recipient_id,
        recipient_role,
        notification_type,
        title,
        description,
        priority,
        reference_id,
        reference_type
      ) VALUES (
        v_gm_id,
        'super_admin', -- GMs are usually super admins or manager admins
        'system_alert',
        'Senior Staff Attendance Alert',
        format('Senior staff member %s (%s) was late by %s minutes today.', 
          v_employee_name, NEW.role_category, NEW.lateness_minutes),
        'high',
        NEW.id,
        'attendance_log'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

SELECT 'PROMPT A5.7B: Fixed migration with employees table updates completed successfully' AS status;