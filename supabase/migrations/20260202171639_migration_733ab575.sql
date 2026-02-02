-- PHASE 1: Add test mode system setting and tracking columns

-- Add test_mode flag to system_settings
INSERT INTO system_settings (setting_key, setting_value, description, updated_by)
VALUES (
  'test_mode',
  'false',
  'Test mode enabled - allows simulated payments, prize draws, and tier progression for testing',
  (SELECT id FROM profiles WHERE role = 'super_admin' LIMIT 1)
)
ON CONFLICT (setting_key) DO NOTHING;

-- Add is_test_account column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_test_account BOOLEAN DEFAULT false;

-- Create index for efficient test account queries
CREATE INDEX IF NOT EXISTS idx_profiles_test_account ON profiles(is_test_account) WHERE is_test_account = true;

-- Add comment for documentation
COMMENT ON COLUMN profiles.is_test_account IS 'Identifies test accounts for bulk cleanup - all test data must have this flag';

-- Track test data generation metadata
CREATE TABLE IF NOT EXISTS test_data_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by UUID REFERENCES profiles(id),
  member_count INTEGER DEFAULT 0,
  agent_count INTEGER DEFAULT 0,
  admin_count INTEGER DEFAULT 0,
  is_cleaned_up BOOLEAN DEFAULT false,
  cleanup_timestamp TIMESTAMP WITH TIME ZONE,
  cleaned_up_by UUID REFERENCES profiles(id),
  CONSTRAINT fk_generated_by FOREIGN KEY (generated_by) REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT fk_cleaned_up_by FOREIGN KEY (cleaned_up_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Enable RLS on test_data_metadata
ALTER TABLE test_data_metadata ENABLE ROW LEVEL SECURITY;

-- Only Chairman can view/manage test data metadata
CREATE POLICY "Chairman can view test data metadata" ON test_data_metadata
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Chairman can insert test data metadata" ON test_data_metadata
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Chairman can update test data metadata" ON test_data_metadata
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );