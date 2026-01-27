-- =====================================================
-- PHASE 3: MEMBERSHIP CONFIGURATION TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS membership_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_fee_amount DECIMAL(10,2) NOT NULL,
  membership_fee_currency TEXT NOT NULL DEFAULT 'BDT',
  referral_bonus_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  referral_bonus_currency TEXT NOT NULL DEFAULT 'BDT',
  membership_duration_days INTEGER NOT NULL DEFAULT 365,
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE membership_config ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage config
CREATE POLICY "Super admins can view config" ON membership_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can insert config" ON membership_config
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Insert initial configuration
INSERT INTO membership_config (membership_fee_amount, membership_fee_currency, referral_bonus_amount, referral_bonus_currency, notes)
VALUES (1000.00, 'BDT', 100.00, 'BDT', 'Initial configuration for Bangladesh launch')
ON CONFLICT DO NOTHING;