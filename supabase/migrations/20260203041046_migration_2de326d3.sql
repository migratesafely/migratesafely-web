-- SYSTEM GOVERNANCE RESET: Update RLS policies (Retry without admin_suspensions)

-- 1. profiles table - Update super_admin policy to use Chairman authority
DROP POLICY IF EXISTS "Super Admin can manage all profiles" ON profiles;
CREATE POLICY "Chairman can manage all profiles" ON profiles
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM employees 
      WHERE employees.user_id = auth.uid() 
      AND employees.role_category = 'chairman'
    )
  );

-- 2. employees table - Update super_admin policy
DROP POLICY IF EXISTS "Super Admin can manage all employees" ON employees;
CREATE POLICY "Chairman can manage all employees" ON employees
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM employees 
      WHERE employees.user_id = auth.uid() 
      AND employees.role_category = 'chairman'
    )
  );

-- 3. prize_draws table - Update super_admin policy
DROP POLICY IF EXISTS "Super Admin can manage prize draws" ON prize_draws;
CREATE POLICY "Chairman can manage prize draws" ON prize_draws
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM employees 
      WHERE employees.user_id = auth.uid() 
      AND employees.role_category = 'chairman'
    )
  );

-- 4. prize_draw_prizes table - Update super_admin policy
DROP POLICY IF EXISTS "Super Admin can manage prizes" ON prize_draw_prizes;
CREATE POLICY "Chairman can manage prizes" ON prize_draw_prizes
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM employees 
      WHERE employees.user_id = auth.uid() 
      AND employees.role_category = 'chairman'
    )
  );

-- 5. system_settings table - Update super_admin policy
DROP POLICY IF EXISTS "Super Admin can manage system settings" ON system_settings;
CREATE POLICY "Chairman can manage system settings" ON system_settings
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM employees 
      WHERE employees.user_id = auth.uid() 
      AND employees.role_category = 'chairman'
    )
  );

-- 6. country_settings table - Update super_admin policy
DROP POLICY IF EXISTS "Super Admin can manage country settings" ON country_settings;
CREATE POLICY "Chairman can manage country settings" ON country_settings
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM employees 
      WHERE employees.user_id = auth.uid() 
      AND employees.role_category = 'chairman'
    )
  );

-- 7. audit_logs table - Update super_admin policy
DROP POLICY IF EXISTS "Super Admin can view audit logs" ON audit_logs;
CREATE POLICY "Chairman can view audit logs" ON audit_logs
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM employees 
      WHERE employees.user_id = auth.uid() 
      AND employees.role_category = 'chairman'
    )
  );