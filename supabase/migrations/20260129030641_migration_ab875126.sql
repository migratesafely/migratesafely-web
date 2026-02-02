-- Create function to notify admins when tier bonus approval is created
CREATE OR REPLACE FUNCTION notify_admins_tier_bonus_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_member_name TEXT;
  v_tier_name TEXT;
  v_tier_level INTEGER;
BEGIN
  -- Get member name
  SELECT full_name INTO v_member_name
  FROM profiles
  WHERE id = NEW.member_id;

  -- Get tier details
  SELECT tier_name, tier_level INTO v_tier_name, v_tier_level
  FROM loyalty_tiers
  WHERE id = NEW.tier_id;

  -- Create urgent notification for Manager Admin and Super Admin
  INSERT INTO admin_notifications (
    notification_type,
    priority,
    target_admin_roles,
    reference_id,
    member_id,
    member_full_name,
    title,
    message,
    metadata
  ) VALUES (
    'tier_bonus_approval',
    'normal',
    ARRAY['manager_admin', 'super_admin'],
    NEW.id,
    NEW.member_id,
    v_member_name,
    '⚠️ Pending Tier Bonus Approval – Action Required',
    format('Member %s has achieved %s tier and is eligible for a tier bonus payout of %s %s (%s%% bonus). Approval required.',
      COALESCE(v_member_name, 'Unknown'),
      v_tier_name,
      NEW.calculated_bonus_amount,
      NEW.currency_code,
      NEW.bonus_percentage
    ),
    jsonb_build_object(
      'tier_name', v_tier_name,
      'tier_level', v_tier_level,
      'bonus_percentage', NEW.bonus_percentage,
      'base_referral_bonus', NEW.base_referral_bonus_amount,
      'calculated_bonus_amount', NEW.calculated_bonus_amount,
      'currency_code', NEW.currency_code,
      'eligibility_date', NEW.requested_at
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notification when tier bonus approval is requested
CREATE TRIGGER trigger_notify_tier_bonus_approval
  AFTER INSERT ON tier_bonus_approvals
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_admins_tier_bonus_approval();

COMMENT ON FUNCTION notify_admins_tier_bonus_approval IS 'Creates urgent admin notification when member becomes eligible for tier bonus payout';