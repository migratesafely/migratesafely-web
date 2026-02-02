-- PROMPT 3.6: Super Admin Controls for Tier Achievement Bonus Management
-- ADDITIVE ONLY - Enables Super Admin to configure achievement bonus amounts

-- Add audit log for tier achievement bonus configuration changes
CREATE TABLE IF NOT EXISTS tier_achievement_bonus_config_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier_id UUID REFERENCES loyalty_tiers(id) NOT NULL,
  tier_name TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id) NOT NULL,
  old_bonus_amount NUMERIC(10,2),
  new_bonus_amount NUMERIC(10,2),
  old_status TEXT,
  new_status TEXT,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE tier_achievement_bonus_config_audit IS 'Immutable audit log for tier achievement bonus configuration changes';

-- RLS policies for audit table
ALTER TABLE tier_achievement_bonus_config_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit log insert only for super admin"
ON tier_achievement_bonus_config_audit FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Audit log read for all admins"
ON tier_achievement_bonus_config_audit FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('worker_admin', 'manager_admin', 'super_admin')
  )
);

-- Function to update tier achievement bonus amount (Super Admin only)
CREATE OR REPLACE FUNCTION update_tier_achievement_bonus_amount(
  p_tier_id UUID,
  p_new_bonus_amount NUMERIC,
  p_change_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier_name TEXT;
  v_old_bonus_amount NUMERIC;
BEGIN
  -- Verify Super Admin role
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions: Super Admin only';
  END IF;

  -- Get current values
  SELECT tier_name, tier_achievement_bonus_amount
  INTO v_tier_name, v_old_bonus_amount
  FROM loyalty_tiers
  WHERE id = p_tier_id;

  IF v_tier_name IS NULL THEN
    RAISE EXCEPTION 'Tier not found';
  END IF;

  -- Validate new amount (cannot be negative)
  IF p_new_bonus_amount < 0 THEN
    RAISE EXCEPTION 'Bonus amount cannot be negative';
  END IF;

  -- Update tier achievement bonus amount
  UPDATE loyalty_tiers
  SET 
    tier_achievement_bonus_amount = p_new_bonus_amount,
    updated_at = NOW()
  WHERE id = p_tier_id;

  -- Log change to audit table
  INSERT INTO tier_achievement_bonus_config_audit (
    tier_id,
    tier_name,
    changed_by,
    old_bonus_amount,
    new_bonus_amount,
    change_reason
  ) VALUES (
    p_tier_id,
    v_tier_name,
    auth.uid(),
    v_old_bonus_amount,
    p_new_bonus_amount,
    p_change_reason
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_tier_achievement_bonus_amount IS 'Super Admin only: Update tier achievement bonus amount with audit logging';

-- Function to get tier achievement bonus configuration (Admin view)
CREATE OR REPLACE FUNCTION get_tier_achievement_bonus_config()
RETURNS TABLE (
  tier_id UUID,
  tier_name TEXT,
  tier_level INTEGER,
  required_referrals INTEGER,
  bonus_percentage NUMERIC,
  achievement_bonus_amount NUMERIC,
  requires_enhanced_kyc BOOLEAN,
  is_active BOOLEAN,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('worker_admin', 'manager_admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions: Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    lt.id AS tier_id,
    lt.tier_name,
    lt.tier_level,
    lt.required_referrals,
    lt.bonus_percentage,
    lt.tier_achievement_bonus_amount AS achievement_bonus_amount,
    lt.requires_enhanced_kyc,
    lt.is_active,
    lt.updated_at
  FROM loyalty_tiers lt
  ORDER BY lt.tier_level ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_tier_achievement_bonus_config IS 'Get tier achievement bonus configuration for admin view';

-- Function to get tier achievement bonus audit log
CREATE OR REPLACE FUNCTION get_tier_achievement_bonus_audit_log(
  p_tier_id UUID DEFAULT NULL
)
RETURNS TABLE (
  audit_id UUID,
  tier_name TEXT,
  changed_by_id UUID,
  changed_by_email TEXT,
  changed_by_name TEXT,
  old_bonus_amount NUMERIC,
  new_bonus_amount NUMERIC,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('worker_admin', 'manager_admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions: Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    tal.id AS audit_id,
    tal.tier_name,
    tal.changed_by AS changed_by_id,
    p.email AS changed_by_email,
    p.full_name AS changed_by_name,
    tal.old_bonus_amount,
    tal.new_bonus_amount,
    tal.change_reason,
    tal.created_at
  FROM tier_achievement_bonus_config_audit tal
  LEFT JOIN profiles p ON p.id = tal.changed_by
  WHERE (p_tier_id IS NULL OR tal.tier_id = p_tier_id)
  ORDER BY tal.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_tier_achievement_bonus_audit_log IS 'Get tier achievement bonus configuration audit log';

-- Add comment to system settings
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES (
  'tier_achievement_bonus_management',
  'super_admin_only',
  'Only Super Admin can modify tier achievement bonus amounts. Changes apply to future achievements only.'
)
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = EXCLUDED.setting_value,
    description = EXCLUDED.description;