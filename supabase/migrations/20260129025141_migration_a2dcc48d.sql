-- Create tier_bonus_audit_log table for immutable audit trail
CREATE TABLE IF NOT EXISTS tier_bonus_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier_bonus_approval_id UUID NOT NULL REFERENCES tier_bonus_approvals(id) ON DELETE CASCADE,
  
  -- Tier details
  tier_id UUID NOT NULL REFERENCES loyalty_tiers(id),
  tier_name TEXT NOT NULL,
  tier_level INTEGER NOT NULL,
  
  -- Bonus calculation details
  base_referral_bonus_amount DECIMAL(10, 2) NOT NULL,
  tier_bonus_percentage DECIMAL(5, 2) NOT NULL,
  calculated_tier_bonus_amount DECIMAL(10, 2) NOT NULL,
  currency_code TEXT NOT NULL,
  
  -- Action details
  action TEXT NOT NULL CHECK (action IN ('created', 'approved', 'rejected', 'wallet_credited')),
  performed_by UUID REFERENCES profiles(id),
  performed_by_email TEXT,
  performed_by_role TEXT,
  rejection_reason TEXT,
  admin_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tier_bonus_audit_member ON tier_bonus_audit_log(member_id);
CREATE INDEX idx_tier_bonus_audit_approval ON tier_bonus_audit_log(tier_bonus_approval_id);
CREATE INDEX idx_tier_bonus_audit_performed_by ON tier_bonus_audit_log(performed_by);
CREATE INDEX idx_tier_bonus_audit_action ON tier_bonus_audit_log(action);

COMMENT ON TABLE tier_bonus_audit_log IS 'Immutable audit trail for all loyalty tier bonus actions (compliance and governance)';
COMMENT ON COLUMN tier_bonus_audit_log.action IS 'created = approval request created, approved = admin approved, rejected = admin rejected, wallet_credited = bonus added to wallet';