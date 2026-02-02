-- Create loyalty program tiers table
CREATE TABLE loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE,
  tier_level INTEGER NOT NULL UNIQUE,
  points_required INTEGER NOT NULL,
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  badge_icon_url TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Internal portal only
CREATE POLICY "Admins can manage loyalty tiers"
  ON loyalty_tiers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'manager_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'manager_admin')
    )
  );

CREATE POLICY "Members can view active loyalty tiers"
  ON loyalty_tiers
  FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'member'
    )
  );

-- Indexes
CREATE INDEX idx_loyalty_tiers_level ON loyalty_tiers(tier_level);
CREATE INDEX idx_loyalty_tiers_active ON loyalty_tiers(is_active);

COMMENT ON TABLE loyalty_tiers IS 'Defines the tier structure for the internal loyalty program - visible only in Member and Admin portals';