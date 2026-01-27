-- Create country_settings table
CREATE TABLE country_settings (
  country_code TEXT PRIMARY KEY,
  country_name TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  currency_symbol TEXT NOT NULL,
  membership_fee_amount NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT false,
  payment_gateway_provider TEXT,
  updated_by_admin_id UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE country_settings ENABLE ROW LEVEL SECURITY;

-- Create policies

-- 1. Public read access for active countries (needed for registration)
CREATE POLICY "Public read access for active countries" ON country_settings
  FOR SELECT USING (is_active = true);

-- 2. Authenticated read access for all countries (admins need to see inactive ones)
CREATE POLICY "Authenticated read access" ON country_settings
  FOR SELECT TO authenticated USING (true);

-- 3. Super Admin update access
CREATE POLICY "Super Admin update access" ON country_settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- 4. Super Admin insert access (for seeding/adding new countries)
CREATE POLICY "Super Admin insert access" ON country_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );