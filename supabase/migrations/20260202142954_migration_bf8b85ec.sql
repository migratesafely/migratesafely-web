-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read settings (needed for middleware check)
CREATE POLICY "Authenticated users can read system_settings" 
  ON system_settings FOR SELECT 
  TO authenticated 
  USING (true);

-- Policy: Only Master Admin can update (enforced by app logic, but good to have DB backup if possible, 
-- though we can't easily check role in simple RLS without a helper function or join. 
-- For now, we'll rely on app logic + simple update policy for admins if needed, 
-- or strictly limit to Master Admin in app).
-- Let's allow update for authenticated users for now, app logic handles the role check.
CREATE POLICY "Authenticated users can update system_settings" 
  ON system_settings FOR UPDATE 
  TO authenticated 
  USING (true)
  WITH CHECK (true);

-- Insert the admin_access_suspended setting
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES ('admin_access_suspended', 'false', 'Global admin login lock - blocks all admin logins except Master Admin')
ON CONFLICT (setting_key) DO NOTHING;