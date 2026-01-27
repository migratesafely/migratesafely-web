-- =====================================================
-- PHASE 11: DATABASE FUNCTIONS
-- =====================================================

-- Function to generate unique membership number
CREATE OR REPLACE FUNCTION generate_membership_number()
RETURNS INTEGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(membership_number), 1000) + 1 INTO next_number FROM profiles;
  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    code := 'MS' || LPAD(floor(random() * 1000000)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to check if membership is active
CREATE OR REPLACE FUNCTION is_membership_active(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  active_membership BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM memberships 
    WHERE user_id = user_uuid 
    AND status = 'active' 
    AND end_date > NOW()
  ) INTO active_membership;
  RETURN active_membership;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate wallet balance
CREATE OR REPLACE FUNCTION calculate_wallet_balance(user_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_earned DECIMAL;
  total_withdrawn DECIMAL;
BEGIN
  SELECT COALESCE(SUM(bonus_amount), 0) INTO total_earned
  FROM referrals WHERE referrer_id = user_uuid AND is_paid = TRUE;
  
  SELECT COALESCE(SUM(amount), 0) INTO total_withdrawn
  FROM withdrawal_requests WHERE user_id = user_uuid AND status = 'paid';
  
  RETURN total_earned - total_withdrawn;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-assign membership number on profile creation
CREATE OR REPLACE FUNCTION assign_membership_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.membership_number IS NULL THEN
    NEW.membership_number := generate_membership_number();
  END IF;
  
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_membership_number
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION assign_membership_number();

-- Trigger to create wallet when user is created
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, balance, currency)
  VALUES (NEW.id, 0, 'BDT')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_user_wallet
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION create_user_wallet();

-- Trigger to update membership dates when payment is confirmed
CREATE OR REPLACE FUNCTION activate_membership_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    UPDATE memberships
    SET status = 'active',
        start_date = NEW.payment_date,
        end_date = NEW.payment_date + INTERVAL '365 days',
        updated_at = NOW()
    WHERE id = NEW.membership_id;
    
    -- Create company account income record
    INSERT INTO company_accounts (
      transaction_type, category, amount, currency, 
      description, transaction_date, reference_id, reference_type, created_by
    ) VALUES (
      'income', 'membership_fee', NEW.amount, NEW.currency,
      'Membership fee payment', NEW.payment_date::DATE, NEW.membership_id, 'payment', NEW.confirmed_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_activate_membership
AFTER UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION activate_membership_on_payment();

-- Trigger to process referral bonus
CREATE OR REPLACE FUNCTION process_referral_bonus()
RETURNS TRIGGER AS $$
DECLARE
  referrer_uuid UUID;
  bonus_config RECORD;
BEGIN
  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    -- Get referrer from profiles
    SELECT id, referred_by_code INTO referrer_uuid
    FROM profiles 
    WHERE id = NEW.user_id AND referred_by_code IS NOT NULL;
    
    IF referrer_uuid IS NOT NULL THEN
      -- Get bonus configuration
      SELECT referral_bonus_amount, referral_bonus_currency 
      INTO bonus_config
      FROM membership_config 
      ORDER BY effective_from DESC 
      LIMIT 1;
      
      -- Get actual referrer ID
      SELECT id INTO referrer_uuid 
      FROM profiles 
      WHERE referral_code = (SELECT referred_by_code FROM profiles WHERE id = NEW.user_id);
      
      IF referrer_uuid IS NOT NULL THEN
        -- Create referral record
        INSERT INTO referrals (referrer_id, referred_user_id, referral_code, bonus_amount, bonus_currency, is_paid, membership_id)
        VALUES (referrer_uuid, NEW.user_id, (SELECT referred_by_code FROM profiles WHERE id = NEW.user_id), 
                bonus_config.referral_bonus_amount, bonus_config.referral_bonus_currency, TRUE, NEW.id);
        
        -- Update wallet
        UPDATE wallets
        SET balance = balance + bonus_config.referral_bonus_amount,
            total_earned = total_earned + bonus_config.referral_bonus_amount,
            updated_at = NOW()
        WHERE user_id = referrer_uuid;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_referral
AFTER UPDATE ON memberships
FOR EACH ROW
EXECUTE FUNCTION process_referral_bonus();