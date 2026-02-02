-- Create audit log table for tier configuration changes
CREATE TABLE IF NOT EXISTS loyalty_tier_config_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES loyalty_tier_config(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES loyalty_tiers(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('CREATED', 'UPDATED', 'DEACTIVATED')),
  old_referral_threshold INTEGER,
  new_referral_threshold INTEGER,
  old_bonus_percentage NUMERIC(5,2),
  new_bonus_percentage NUMERIC(5,2),
  old_effective_date DATE,
  new_effective_date DATE,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reason TEXT NOT NULL,
  notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tier_config_audit_config ON loyalty_tier_config_audit(config_id);
CREATE INDEX IF NOT EXISTS idx_tier_config_audit_tier ON loyalty_tier_config_audit(tier_id);
CREATE INDEX IF NOT EXISTS idx_tier_config_audit_changed_at ON loyalty_tier_config_audit(changed_at);
CREATE INDEX IF NOT EXISTS idx_tier_config_audit_changed_by ON loyalty_tier_config_audit(changed_by);

-- Enable RLS
ALTER TABLE loyalty_tier_config_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only Super Admin can view audit logs
CREATE POLICY "Super Admin can view tier config audit"
  ON loyalty_tier_config_audit
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- System can insert audit records
CREATE POLICY "System can create tier config audit"
  ON loyalty_tier_config_audit
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE loyalty_tier_config_audit IS 'Audit trail for all loyalty tier configuration changes - Super Admin access only';
COMMENT ON COLUMN loyalty_tier_config_audit.action_type IS 'Type of change: CREATED, UPDATED, or DEACTIVATED';