-- Create tier_bonus_approvals table for approval workflow
CREATE TABLE IF NOT EXISTS tier_bonus_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES loyalty_tiers(id),
  tier_name TEXT NOT NULL,
  tier_level INTEGER NOT NULL,
  
  -- Bonus calculation details
  base_referral_bonus_amount DECIMAL(10, 2) NOT NULL,
  tier_bonus_percentage DECIMAL(5, 2) NOT NULL,
  calculated_tier_bonus_amount DECIMAL(10, 2) NOT NULL,
  currency_code TEXT NOT NULL,
  
  -- Approval workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP,
  rejection_reason TEXT,
  admin_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(member_id, tier_id)
);

CREATE INDEX idx_tier_bonus_approvals_member ON tier_bonus_approvals(member_id);
CREATE INDEX idx_tier_bonus_approvals_status ON tier_bonus_approvals(status);
CREATE INDEX idx_tier_bonus_approvals_reviewed_by ON tier_bonus_approvals(reviewed_by);

COMMENT ON TABLE tier_bonus_approvals IS 'Approval workflow for loyalty tier bonuses (strict separation from prize draw and referral systems)';
COMMENT ON COLUMN tier_bonus_approvals.base_referral_bonus_amount IS 'Base referral bonus amount used for tier bonus calculation (for audit trail)';
COMMENT ON COLUMN tier_bonus_approvals.calculated_tier_bonus_amount IS 'Calculated tier bonus amount = base_referral_bonus * (tier_bonus_percentage / 100)';
COMMENT ON COLUMN tier_bonus_approvals.status IS 'pending = awaiting admin approval, approved = credited to wallet, rejected = denied';