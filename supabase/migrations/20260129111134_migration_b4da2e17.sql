-- PROMPT 3.4: Tier Achievement Lump-Sum Bonuses (Bangladesh)
-- ADDITIVE ONLY - Does NOT modify existing tier percentage bonuses

-- Add achievement bonus columns to loyalty_tiers table
ALTER TABLE loyalty_tiers
ADD COLUMN IF NOT EXISTS achievement_bonus_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS achievement_bonus_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS requires_enhanced_kyc BOOLEAN DEFAULT false;

-- Set achievement bonus amounts for Bangladesh tiers
UPDATE loyalty_tiers SET 
  achievement_bonus_amount = 0,
  achievement_bonus_enabled = false,
  requires_enhanced_kyc = false
WHERE tier_name = 'Blue';

UPDATE loyalty_tiers SET 
  achievement_bonus_amount = 1500.00,
  achievement_bonus_enabled = true,
  requires_enhanced_kyc = false
WHERE tier_name = 'Bronze';

UPDATE loyalty_tiers SET 
  achievement_bonus_amount = 5000.00,
  achievement_bonus_enabled = true,
  requires_enhanced_kyc = false
WHERE tier_name = 'Silver';

UPDATE loyalty_tiers SET 
  achievement_bonus_amount = 10000.00,
  achievement_bonus_enabled = true,
  requires_enhanced_kyc = false
WHERE tier_name = 'Gold';

UPDATE loyalty_tiers SET 
  achievement_bonus_amount = 50000.00,
  achievement_bonus_enabled = true,
  requires_enhanced_kyc = true
WHERE tier_name = 'Platinum';

-- Create tier achievement bonus approvals table
CREATE TABLE IF NOT EXISTS tier_achievement_bonus_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES loyalty_tiers(id),
  bonus_amount DECIMAL(10,2) NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'BDT',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id),
  admin_notes TEXT,
  rejection_reason TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, tier_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tier_achievement_approvals_status ON tier_achievement_bonus_approvals(status);
CREATE INDEX IF NOT EXISTS idx_tier_achievement_approvals_member ON tier_achievement_bonus_approvals(member_id);

-- Enable RLS
ALTER TABLE tier_achievement_bonus_approvals ENABLE ROW LEVEL SECURITY;

-- RLS: Members can view their own approvals
CREATE POLICY "Members can view their own tier achievement approvals"
ON tier_achievement_bonus_approvals FOR SELECT
TO authenticated
USING (auth.uid() = member_id);

-- RLS: Admins can view all approvals
CREATE POLICY "Admins can view all tier achievement approvals"
ON tier_achievement_bonus_approvals FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('worker_admin', 'manager_admin', 'super_admin')
  )
);

-- Function: Request tier achievement bonus approval
CREATE OR REPLACE FUNCTION request_tier_achievement_bonus_approval(
  p_member_id UUID,
  p_tier_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_approval_id UUID;
  v_bonus_amount DECIMAL(10,2);
  v_tier_name TEXT;
  v_tier_enabled BOOLEAN;
  v_already_requested BOOLEAN;
BEGIN
  -- Check if tier achievement bonus is enabled
  SELECT achievement_bonus_amount, achievement_bonus_enabled, tier_name
  INTO v_bonus_amount, v_tier_enabled, v_tier_name
  FROM loyalty_tiers
  WHERE id = p_tier_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tier not found';
  END IF;

  IF NOT v_tier_enabled OR v_bonus_amount = 0 THEN
    RAISE EXCEPTION 'Achievement bonus not available for this tier';
  END IF;

  -- Check if already requested
  SELECT EXISTS(
    SELECT 1 FROM tier_achievement_bonus_approvals
    WHERE member_id = p_member_id AND tier_id = p_tier_id
  ) INTO v_already_requested;

  IF v_already_requested THEN
    RAISE EXCEPTION 'Achievement bonus already requested for this tier';
  END IF;

  -- Insert approval request
  INSERT INTO tier_achievement_bonus_approvals (
    member_id,
    tier_id,
    bonus_amount,
    currency_code,
    status
  ) VALUES (
    p_member_id,
    p_tier_id,
    v_bonus_amount,
    'BDT',
    'pending'
  )
  RETURNING id INTO v_approval_id;

  RETURN v_approval_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get pending tier achievement bonus approvals (Admin)
CREATE OR REPLACE FUNCTION get_pending_tier_achievement_approvals()
RETURNS TABLE (
  approval_id UUID,
  member_id UUID,
  member_email TEXT,
  member_full_name TEXT,
  tier_id UUID,
  tier_name TEXT,
  tier_level INTEGER,
  bonus_amount DECIMAL(10,2),
  currency_code TEXT,
  requires_enhanced_kyc BOOLEAN,
  status TEXT,
  requested_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  reviewed_by_email TEXT,
  admin_notes TEXT,
  rejection_reason TEXT
) AS $$
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('worker_admin', 'manager_admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    taba.id,
    taba.member_id,
    p.email,
    p.full_name,
    taba.tier_id,
    lt.tier_name,
    lt.tier_level,
    taba.bonus_amount,
    taba.currency_code,
    lt.requires_enhanced_kyc,
    taba.status,
    taba.requested_at,
    taba.reviewed_at,
    taba.reviewed_by,
    admin_p.email AS reviewed_by_email,
    taba.admin_notes,
    taba.rejection_reason
  FROM tier_achievement_bonus_approvals taba
  JOIN profiles p ON taba.member_id = p.id
  JOIN loyalty_tiers lt ON taba.tier_id = lt.id
  LEFT JOIN profiles admin_p ON taba.reviewed_by = admin_p.id
  WHERE taba.status = 'pending'
  ORDER BY 
    lt.requires_enhanced_kyc DESC,
    taba.requested_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Approve tier achievement bonus
CREATE OR REPLACE FUNCTION approve_tier_achievement_bonus(
  p_approval_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_member_id UUID;
  v_bonus_amount DECIMAL(10,2);
  v_tier_name TEXT;
  v_current_status TEXT;
BEGIN
  -- Verify Manager Admin or Super Admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('manager_admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: Manager Admin or Super Admin required';
  END IF;

  -- Get approval details
  SELECT member_id, bonus_amount, status
  INTO v_member_id, v_bonus_amount, v_current_status
  FROM tier_achievement_bonus_approvals
  WHERE id = p_approval_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Approval not found';
  END IF;

  IF v_current_status != 'pending' THEN
    RAISE EXCEPTION 'Approval already processed';
  END IF;

  -- Update approval status
  UPDATE tier_achievement_bonus_approvals
  SET 
    status = 'approved',
    reviewed_at = NOW(),
    reviewed_by = auth.uid(),
    admin_notes = p_admin_notes,
    updated_at = NOW()
  WHERE id = p_approval_id;

  -- Credit wallet (pending balance)
  INSERT INTO wallet_transactions (
    member_id,
    transaction_type,
    amount,
    currency_code,
    balance_type,
    description,
    metadata
  ) VALUES (
    v_member_id,
    'tier_achievement_bonus',
    v_bonus_amount,
    'BDT',
    'pending',
    'Tier achievement bonus - pending admin payment approval',
    jsonb_build_object(
      'approval_id', p_approval_id,
      'approved_by', auth.uid()
    )
  );

  -- Update member wallet pending balance
  UPDATE wallets
  SET 
    pending_balance = pending_balance + v_bonus_amount,
    updated_at = NOW()
  WHERE member_id = v_member_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Reject tier achievement bonus
CREATE OR REPLACE FUNCTION reject_tier_achievement_bonus(
  p_approval_id UUID,
  p_rejection_reason TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify Manager Admin or Super Admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('manager_admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: Manager Admin or Super Admin required';
  END IF;

  -- Update approval status
  UPDATE tier_achievement_bonus_approvals
  SET 
    status = 'rejected',
    reviewed_at = NOW(),
    reviewed_by = auth.uid(),
    rejection_reason = p_rejection_reason,
    admin_notes = p_admin_notes,
    updated_at = NOW()
  WHERE id = p_approval_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Approval not found or already processed';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get member tier achievement bonus history
CREATE OR REPLACE FUNCTION get_member_tier_achievement_history(
  p_member_id UUID
)
RETURNS TABLE (
  approval_id UUID,
  tier_name TEXT,
  tier_level INTEGER,
  bonus_amount DECIMAL(10,2),
  currency_code TEXT,
  status TEXT,
  requested_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    taba.id,
    lt.tier_name,
    lt.tier_level,
    taba.bonus_amount,
    taba.currency_code,
    taba.status,
    taba.requested_at,
    taba.reviewed_at
  FROM tier_achievement_bonus_approvals taba
  JOIN loyalty_tiers lt ON taba.tier_id = lt.id
  WHERE taba.member_id = p_member_id
  ORDER BY taba.requested_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE tier_achievement_bonus_approvals IS 'PROMPT 3.4: One-time lump-sum bonuses for tier achievements (separate from percentage bonuses)';
COMMENT ON FUNCTION request_tier_achievement_bonus_approval IS 'Request one-time tier achievement bonus approval';
COMMENT ON FUNCTION approve_tier_achievement_bonus IS 'Approve tier achievement bonus and credit to wallet (pending)';
COMMENT ON FUNCTION reject_tier_achievement_bonus IS 'Reject tier achievement bonus request';