-- Create payment_audit_log table for immutable audit trail
CREATE TABLE IF NOT EXISTS payment_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_request_id UUID NOT NULL REFERENCES payment_requests(id),
  action TEXT NOT NULL CHECK (action IN ('requested', 'approved', 'rejected', 'completed', 'failed')),
  performed_by UUID REFERENCES profiles(id),
  performed_at TIMESTAMP DEFAULT NOW(),
  old_status TEXT,
  new_status TEXT,
  amount DECIMAL(10,2),
  currency_code TEXT,
  admin_notes TEXT,
  rejection_reason TEXT,
  metadata JSONB
);

CREATE INDEX idx_payment_audit_log_payment_request_id ON payment_audit_log(payment_request_id);
CREATE INDEX idx_payment_audit_log_performed_by ON payment_audit_log(performed_by);

-- Enable RLS on payment_audit_log (immutable, admin view only)
ALTER TABLE payment_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view payment audit log"
  ON payment_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('worker_admin', 'manager_admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert payment audit log"
  ON payment_audit_log FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE payment_audit_log IS 'Immutable audit trail of all payment actions';