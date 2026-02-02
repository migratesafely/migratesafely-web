-- Enable RLS on payment_requests
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Members can view their own payment requests
CREATE POLICY "Members can view own payment requests"
  ON payment_requests FOR SELECT
  USING (auth.uid() = member_id);

-- Admins can view all payment requests
CREATE POLICY "Admins can view all payment requests"
  ON payment_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('worker_admin', 'manager_admin', 'super_admin')
    )
  );

-- System can create payment requests
CREATE POLICY "System can create payment requests"
  ON payment_requests FOR INSERT
  WITH CHECK (true);

-- Only Manager Admin and Super Admin can approve/reject
CREATE POLICY "Manager/Super Admin can approve payment requests"
  ON payment_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager_admin', 'super_admin')
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_payment_requests_updated_at
  BEFORE UPDATE ON payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();