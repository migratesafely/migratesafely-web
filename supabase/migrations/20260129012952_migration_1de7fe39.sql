-- Create loyalty rewards catalog table
CREATE TABLE loyalty_rewards_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_name TEXT NOT NULL,
  reward_description TEXT NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('DISCOUNT', 'SERVICE', 'GIFT', 'PRIORITY_ACCESS', 'OTHER')),
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),
  value_amount NUMERIC(10,2) NULL,
  value_currency TEXT NULL DEFAULT 'BDT',
  stock_quantity INTEGER NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  terms_conditions TEXT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE loyalty_rewards_catalog ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Internal portal only
CREATE POLICY "Admins can manage loyalty rewards"
  ON loyalty_rewards_catalog
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

CREATE POLICY "Members can view active loyalty rewards"
  ON loyalty_rewards_catalog
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
CREATE INDEX idx_loyalty_rewards_active ON loyalty_rewards_catalog(is_active);
CREATE INDEX idx_loyalty_rewards_type ON loyalty_rewards_catalog(reward_type);
CREATE INDEX idx_loyalty_rewards_points_cost ON loyalty_rewards_catalog(points_cost);

COMMENT ON TABLE loyalty_rewards_catalog IS 'Catalog of optional rewards members can redeem - internal portal only';