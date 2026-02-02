-- Create system settings table for feature flags
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Super Admin can manage settings
CREATE POLICY "Super Admin can manage system settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Insert default settings for registration locks
INSERT INTO system_settings (setting_key, setting_value, description) 
VALUES 
  ('member_registration_enabled', 'false', 'Controls whether new member registrations are allowed'),
  ('agent_applications_enabled', 'false', 'Controls whether new agent applications are allowed')
ON CONFLICT (setting_key) DO NOTHING;

-- Create audit log for settings changes
CREATE TABLE IF NOT EXISTS system_settings_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE system_settings_audit_log ENABLE ROW LEVEL SECURITY;

-- Super Admin can view audit logs
CREATE POLICY "Super Admin can view settings audit" ON system_settings_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Function to update system settings with audit logging
CREATE OR REPLACE FUNCTION update_system_setting(
  p_setting_key TEXT,
  p_new_value TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_old_value TEXT;
  v_admin_role TEXT;
BEGIN
  -- Check if user is Super Admin
  SELECT role INTO v_admin_role
  FROM profiles
  WHERE id = auth.uid();

  IF v_admin_role != 'super_admin' THEN
    RAISE EXCEPTION 'Access denied: Super Admin required';
  END IF;

  -- Get old value
  SELECT setting_value INTO v_old_value
  FROM system_settings
  WHERE setting_key = p_setting_key;

  -- Update setting
  UPDATE system_settings
  SET 
    setting_value = p_new_value,
    updated_by = auth.uid(),
    updated_at = NOW()
  WHERE setting_key = p_setting_key;

  -- Log the change
  INSERT INTO system_settings_audit_log (
    setting_key,
    old_value,
    new_value,
    changed_by
  ) VALUES (
    p_setting_key,
    v_old_value,
    p_new_value,
    auth.uid()
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system setting value
CREATE OR REPLACE FUNCTION get_system_setting(
  p_setting_key TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_value TEXT;
BEGIN
  SELECT setting_value INTO v_value
  FROM system_settings
  WHERE setting_key = p_setting_key;

  RETURN v_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;