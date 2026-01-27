-- Create compliance_settings table
CREATE TABLE IF NOT EXISTS compliance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT UNIQUE NOT NULL,
  trade_license_no TEXT NOT NULL DEFAULT 'PENDING',
  trade_license_expiry DATE NULL,
  tin_no TEXT NULL DEFAULT 'PENDING',
  company_registration_no TEXT NULL DEFAULT 'PENDING',
  display_on_home BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE compliance_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public can view compliance settings where display_on_home is true
CREATE POLICY "Anyone can view public compliance settings"
  ON compliance_settings
  FOR SELECT
  USING (display_on_home = true);

-- Only super admins can insert compliance settings
CREATE POLICY "Super admins can insert compliance settings"
  ON compliance_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Only super admins can update compliance settings
CREATE POLICY "Super admins can update compliance settings"
  ON compliance_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Seed Bangladesh compliance settings
INSERT INTO compliance_settings (
  country_code,
  trade_license_no,
  tin_no,
  company_registration_no,
  display_on_home
)
VALUES (
  'BD',
  'PENDING',
  'PENDING',
  'PENDING',
  true
)
ON CONFLICT (country_code) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_compliance_settings_country_code 
  ON compliance_settings(country_code);

-- Create index for display_on_home queries
CREATE INDEX IF NOT EXISTS idx_compliance_settings_display 
  ON compliance_settings(display_on_home) 
  WHERE display_on_home = true;