-- Create loyalty rewards redemptions table
CREATE TABLE loyalty_rewards_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES loyalty_rewards_catalog(id),
  points_spent INTEGER NOT NULL,
  redemption_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (redemption_status IN ('PENDING', 'APPROVED', 'FULFILLED', 'REJECTED', 'CANCELLED')),
  redemption_code TEXT NULL UNIQUE,
  approved_by UUID NULL REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE NULL,
  fulfilled_at TIMESTAMP WITH TIME ZONE NULL,
  rejection_reason TEXT NULL,
  member_notes TEXT NULL,
  admin_notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE loyalty_rewards_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Internal portal only
CREATE POLICY "Admins can view all redemptions"
  ON loyalty_rewards_redemptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'manager_admin', 'worker_admin')
    )
  );

CREATE POLICY "Admins can update redemptions"
  ON loyalty_rewards_redemptions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'manager_admin')
    )
  );

CREATE POLICY "Members can create redemptions"
  ON loyalty_rewards_redemptions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'member'
    )
  );

CREATE POLICY "Members can view their own redemptions"
  ON loyalty_rewards_redemptions
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'member'
    )
  );

-- Indexes
CREATE INDEX idx_loyalty_redemptions_user_id ON loyalty_rewards_redemptions(user_id);
CREATE INDEX idx_loyalty_redemptions_reward_id ON loyalty_rewards_redemptions(reward_id);
CREATE INDEX idx_loyalty_redemptions_status ON loyalty_rewards_redemptions(redemption_status);
CREATE INDEX idx_loyalty_redemptions_created ON loyalty_rewards_redemptions(created_at DESC);

COMMENT ON TABLE loyalty_rewards_redemptions IS 'Tracks reward redemptions by members - internal portal only';