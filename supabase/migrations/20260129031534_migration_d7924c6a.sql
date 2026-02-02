-- Enable RLS on member_bank_details
ALTER TABLE member_bank_details ENABLE ROW LEVEL SECURITY;

-- Members can view and update their own bank details
CREATE POLICY "Members can view own bank details"
  ON member_bank_details FOR SELECT
  USING (auth.uid() = member_id);

CREATE POLICY "Members can insert own bank details"
  ON member_bank_details FOR INSERT
  WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Members can update own bank details"
  ON member_bank_details FOR UPDATE
  USING (auth.uid() = member_id);

-- Admins can view all bank details
CREATE POLICY "Admins can view all bank details"
  ON member_bank_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('worker_admin', 'manager_admin', 'super_admin')
    )
  );

-- Only Manager Admin and Super Admin can verify bank details
CREATE POLICY "Manager/Super Admin can verify bank details"
  ON member_bank_details FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager_admin', 'super_admin')
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_member_bank_details_updated_at
  BEFORE UPDATE ON member_bank_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();