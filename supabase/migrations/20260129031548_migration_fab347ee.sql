-- Create bank_details_change_log table for audit trail
CREATE TABLE IF NOT EXISTS bank_details_change_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES profiles(id),
  bank_details_id UUID NOT NULL REFERENCES member_bank_details(id),
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'verified', 'unverified')),
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES profiles(id),
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bank_details_change_log_member_id ON bank_details_change_log(member_id);
CREATE INDEX idx_bank_details_change_log_bank_details_id ON bank_details_change_log(bank_details_id);

-- Enable RLS on bank_details_change_log (immutable, admin view only)
ALTER TABLE bank_details_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view bank details change log"
  ON bank_details_change_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('worker_admin', 'manager_admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert bank details change log"
  ON bank_details_change_log FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE bank_details_change_log IS 'Immutable audit trail of bank details changes';