-- =====================================================
-- STOP AND REMOVE PROBLEMATIC TRIGGERS
-- =====================================================

-- Drop all triggers that might be looping
DROP TRIGGER IF EXISTS trg_process_referral ON memberships;
DROP TRIGGER IF EXISTS trg_audit_memberships ON memberships;
DROP TRIGGER IF EXISTS trg_audit_payments ON payments;
DROP TRIGGER IF EXISTS trg_audit_agents ON agents;
DROP TRIGGER IF EXISTS trg_audit_withdrawals ON withdrawal_requests;

-- Drop trigger functions
DROP FUNCTION IF EXISTS log_audit_trail() CASCADE;

-- Keep the referral bonus trigger as it's simple and non-looping
-- But make it more robust
DROP TRIGGER IF EXISTS trg_process_referral ON memberships;
DROP FUNCTION IF EXISTS process_referral_bonus() CASCADE;

-- Recreate simplified referral bonus function (no recursion risk)
CREATE OR REPLACE FUNCTION process_referral_bonus()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'active' and there's a referrer
  IF NEW.status = 'active' AND OLD.status != 'active' AND NEW.referred_by IS NOT NULL THEN
    -- Get the referral bonus amount from config
    DECLARE
      bonus_amount NUMERIC;
    BEGIN
      SELECT referral_bonus INTO bonus_amount 
      FROM membership_config 
      WHERE country_code = NEW.country_code 
      LIMIT 1;
      
      -- Update referral wallet
      INSERT INTO referral_wallets (user_id, total_earned, available_balance, currency)
      VALUES (NEW.referred_by, bonus_amount, bonus_amount, NEW.currency)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        total_earned = referral_wallets.total_earned + bonus_amount,
        available_balance = referral_wallets.available_balance + bonus_amount,
        updated_at = NOW();
      
      -- Create referral record
      INSERT INTO referrals (referrer_id, referred_user_id, membership_id, bonus_amount, currency, status)
      VALUES (NEW.referred_by, NEW.user_id, NEW.id, bonus_amount, NEW.currency, 'completed');
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER trg_process_referral
AFTER UPDATE ON memberships
FOR EACH ROW
EXECUTE FUNCTION process_referral_bonus();