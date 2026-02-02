-- Enable RLS on tier_bonus_audit_log (read-only for admins)
ALTER TABLE tier_bonus_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view audit logs
CREATE POLICY "Admin can view tier bonus audit logs"
  ON tier_bonus_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('worker_admin', 'manager_admin', 'super_admin')
    )
  );

-- Policy: System can insert audit logs (via function only)
CREATE POLICY "System can insert tier bonus audit logs"
  ON tier_bonus_audit_log FOR INSERT
  WITH CHECK (true);

-- NO UPDATE OR DELETE POLICIES (immutable audit trail)