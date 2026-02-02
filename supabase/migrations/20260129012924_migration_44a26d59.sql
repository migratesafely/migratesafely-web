-- Create member loyalty status table
CREATE TABLE member_loyalty_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  current_tier_id UUID NOT NULL REFERENCES loyalty_tiers(id),
  total_points INTEGER NOT NULL DEFAULT 0,
  points_to_next_tier INTEGER NULL,
  tier_achieved_at TIMESTAMP WITH TIME ZONE NULL,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE member_loyalty_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Internal portal only
CREATE POLICY "Admins can view all member loyalty status"
  ON member_loyalty_status
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'manager_admin', 'worker_admin')
    )
  );

CREATE POLICY "Admins can update member loyalty status"
  ON member_loyalty_status
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'manager_admin')
    )
  );

CREATE POLICY "System can create member loyalty status"
  ON member_loyalty_status
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Members can view their own loyalty status"
  ON member_loyalty_status
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
CREATE INDEX idx_member_loyalty_user_id ON member_loyalty_status(user_id);
CREATE INDEX idx_member_loyalty_tier ON member_loyalty_status(current_tier_id);
CREATE INDEX idx_member_loyalty_points ON member_loyalty_status(total_points DESC);

COMMENT ON TABLE member_loyalty_status IS 'Tracks individual member loyalty status - internal portal only, not public';