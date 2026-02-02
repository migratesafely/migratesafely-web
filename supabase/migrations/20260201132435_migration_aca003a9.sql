-- Create platform_state table for platform lock/freeze control
CREATE TABLE IF NOT EXISTS platform_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code TEXT NOT NULL DEFAULT 'BD',
  is_platform_locked BOOLEAN NOT NULL DEFAULT false,
  lock_reason TEXT,
  locked_by UUID REFERENCES profiles(id),
  locked_at TIMESTAMP WITH TIME ZONE,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  unlocked_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(country_code)
);

-- Enable RLS on platform_state
ALTER TABLE platform_state ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for platform_state (Master Admin only)
-- Note: We use auth.uid() directly or a role check function if preferred, but checking profile role is standard here.
-- Since we just added 'master_admin', we can use it.

CREATE POLICY "Master Admin can view platform state" ON platform_state
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'master_admin'
    )
  );

CREATE POLICY "Master Admin can update platform state" ON platform_state
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'master_admin'
    )
  );

CREATE POLICY "Master Admin can insert platform state" ON platform_state
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'master_admin'
    )
  );

-- Insert default platform state for Bangladesh
INSERT INTO platform_state (country_code, is_platform_locked, lock_reason)
VALUES ('BD', false, NULL)
ON CONFLICT (country_code) DO NOTHING;

-- Add governance audit action types (structure only - no triggers)
COMMENT ON TABLE audit_logs IS 'Audit log for all system actions including governance events: MASTER_ADMIN_CREATED, SUPER_ADMIN_CREATED, SUPER_ADMIN_REVOKED, PLATFORM_LOCKED, PLATFORM_UNLOCKED';