-- Create loyalty_tier_config table for Super Admin configuration management
CREATE TABLE IF NOT EXISTS loyalty_tier_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id UUID NOT NULL REFERENCES loyalty_tiers(id) ON DELETE CASCADE,
  referral_threshold INTEGER NOT NULL CHECK (referral_threshold >= 0),
  bonus_percentage NUMERIC(5,2) NOT NULL CHECK (bonus_percentage >= 0 AND bonus_percentage <= 100),
  effective_from_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_tier_config_tier ON loyalty_tier_config(tier_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tier_config_effective ON loyalty_tier_config(effective_from_date);
CREATE INDEX IF NOT EXISTS idx_loyalty_tier_config_active ON loyalty_tier_config(is_active);

-- Enable RLS
ALTER TABLE loyalty_tier_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only Super Admin can manage tier configuration
CREATE POLICY "Super Admin can manage tier config"
  ON loyalty_tier_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Admins can view tier config"
  ON loyalty_tier_config
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'manager_admin', 'worker_admin')
    )
  );

COMMENT ON TABLE loyalty_tier_config IS 'Loyalty tier configuration history - only Super Admin can create/modify thresholds and percentages';
COMMENT ON COLUMN loyalty_tier_config.effective_from_date IS 'Date when this configuration becomes effective (applied at member renewal)';
COMMENT ON COLUMN loyalty_tier_config.bonus_percentage IS 'Percentage bonus on membership renewal (e.g., 5.00 = 5% discount)';