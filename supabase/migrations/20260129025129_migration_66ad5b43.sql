-- Enable RLS on tier_bonus_approvals
ALTER TABLE tier_bonus_approvals ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view their own tier bonus approvals
CREATE POLICY "Members can view own tier bonus approvals"
  ON tier_bonus_approvals FOR SELECT
  USING (auth.uid() = member_id);

-- Policy: Manager Admin and Super Admin can view all tier bonus approvals
CREATE POLICY "Admin can view all tier bonus approvals"
  ON tier_bonus_approvals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager_admin', 'super_admin')
    )
  );

-- Policy: Manager Admin and Super Admin can update tier bonus approvals (approve/reject)
CREATE POLICY "Admin can update tier bonus approvals"
  ON tier_bonus_approvals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager_admin', 'super_admin')
    )
  );

-- Policy: System can insert tier bonus approvals (via function only)
CREATE POLICY "System can insert tier bonus approvals"
  ON tier_bonus_approvals FOR INSERT
  WITH CHECK (true);

-- Trigger: Update updated_at on row change
CREATE OR REPLACE FUNCTION update_tier_bonus_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tier_bonus_approvals_updated_at
  BEFORE UPDATE ON tier_bonus_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_tier_bonus_approvals_updated_at();