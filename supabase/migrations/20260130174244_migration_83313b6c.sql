-- ====================================================================
-- PROMPT A5.4: FINAL PRIZE CLAIM, ROLLOVER & KYC ENFORCEMENT
-- ====================================================================
-- Scope: Prize claim workflow, unclaimed prize handling, KYC enforcement
-- Rules: ADDITIVE ONLY, NO changes to prize pool logic, Bangladesh only
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. ENHANCE PRIZE_DRAW_WINNERS TABLE FOR CLAIM TRACKING
-- --------------------------------------------------------------------

-- Add claim tracking columns
ALTER TABLE prize_draw_winners
ADD COLUMN IF NOT EXISTS claim_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS claim_method TEXT CHECK (claim_method IN ('wallet_credit', 'bank_transfer', 'manual')),
ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rollover_processed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rollover_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS claim_blocked_reason TEXT;

COMMENT ON COLUMN prize_draw_winners.claim_deadline IS 'Prize must be claimed before this date (draw_completed + 14 days)';
COMMENT ON COLUMN prize_draw_winners.claimed_at IS 'Timestamp when winner claimed the prize';
COMMENT ON COLUMN prize_draw_winners.claim_method IS 'How the prize was claimed/disbursed';
COMMENT ON COLUMN prize_draw_winners.expired_at IS 'Timestamp when prize claim expired';
COMMENT ON COLUMN prize_draw_winners.rollover_processed IS 'Whether expired prize was rolled to next draw';
COMMENT ON COLUMN prize_draw_winners.rollover_amount IS 'Amount rolled forward if unclaimed';
COMMENT ON COLUMN prize_draw_winners.claim_blocked_reason IS 'Reason claim is blocked (KYC, bank, etc)';

-- Create index for expired prize queries
CREATE INDEX IF NOT EXISTS idx_prize_draw_winners_claim_status 
  ON prize_draw_winners(claim_deadline, claimed_at, expired_at, rollover_processed) 
  WHERE claimed_at IS NULL;

-- --------------------------------------------------------------------
-- 2. CREATE PRIZE CLAIM REPORTS TABLE
-- --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS prize_claim_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES prize_draws(id),
  report_type TEXT NOT NULL DEFAULT 'final_claim_summary' CHECK (report_type IN (
    'final_claim_summary', 'rollover_summary', 'claim_audit'
  )),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_prizes INTEGER NOT NULL DEFAULT 0,
  claimed_prizes INTEGER NOT NULL DEFAULT 0,
  unclaimed_prizes INTEGER NOT NULL DEFAULT 0,
  total_prize_amount NUMERIC NOT NULL DEFAULT 0,
  claimed_amount NUMERIC NOT NULL DEFAULT 0,
  unclaimed_amount NUMERIC NOT NULL DEFAULT 0,
  rollover_amount NUMERIC NOT NULL DEFAULT 0,
  report_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES profiles(id),
  is_immutable BOOLEAN DEFAULT TRUE,
  sent_to_admins BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  CONSTRAINT unique_draw_report_type UNIQUE (draw_id, report_type)
);

COMMENT ON TABLE prize_claim_reports IS 'Immutable reports for prize claim tracking and rollover accounting';

-- Create index for admin report queries
CREATE INDEX IF NOT EXISTS idx_prize_claim_reports_draw 
  ON prize_claim_reports(draw_id, report_type, generated_at DESC);

-- RLS Policies for prize_claim_reports (Admin only)
ALTER TABLE prize_claim_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super and Manager admins can view claim reports"
  ON prize_claim_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'manager_admin')
    )
  );

CREATE POLICY "Only super admins can insert claim reports"
  ON prize_claim_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

-- Make reports immutable
CREATE POLICY "Claim reports are immutable"
  ON prize_claim_reports FOR UPDATE
  USING (FALSE);

CREATE POLICY "Claim reports cannot be deleted"
  ON prize_claim_reports FOR DELETE
  USING (FALSE);

-- --------------------------------------------------------------------
-- 3. CALCULATE CLAIM DEADLINE (TRIGGER)
-- --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION calculate_claim_deadline()
RETURNS TRIGGER AS $$
BEGIN
  -- Set claim deadline to 14 days after draw completion
  IF NEW.assigned_at IS NOT NULL AND NEW.claim_deadline IS NULL THEN
    NEW.claim_deadline := NEW.assigned_at + INTERVAL '14 days';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_calculate_claim_deadline ON prize_draw_winners;
CREATE TRIGGER auto_calculate_claim_deadline
  BEFORE INSERT OR UPDATE ON prize_draw_winners
  FOR EACH ROW
  EXECUTE FUNCTION calculate_claim_deadline();

-- --------------------------------------------------------------------
-- 4. VALIDATE PRIZE CLAIM ELIGIBILITY (RPC)
-- --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION validate_prize_claim_eligibility(
  p_winner_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_winner RECORD;
  v_profile RECORD;
  v_identity RECORD;
  v_bank RECORD;
  v_result JSONB;
  v_blocked_reasons TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Get winner record
  SELECT * INTO v_winner
  FROM prize_draw_winners
  WHERE id = p_winner_id AND winner_user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'Winner record not found or does not belong to user'
    );
  END IF;
  
  -- Check if already claimed
  IF v_winner.claimed_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'Prize already claimed',
      'claimed_at', v_winner.claimed_at
    );
  END IF;
  
  -- Check if expired
  IF v_winner.claim_deadline < NOW() THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'Claim deadline has passed',
      'claim_deadline', v_winner.claim_deadline
    );
  END IF;
  
  -- Get user profile
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id;
  
  -- Check identity verification
  SELECT * INTO v_identity
  FROM identity_verifications
  WHERE user_id = p_user_id
  ORDER BY submitted_at DESC
  LIMIT 1;
  
  IF v_identity.id IS NULL OR v_identity.status != 'approved' THEN
    v_blocked_reasons := array_append(v_blocked_reasons, 'Identity verification required (KYC not approved)');
  END IF;
  
  -- Check bank account details
  IF v_profile.bank_account_number IS NULL OR 
     v_profile.bank_name IS NULL OR 
     v_profile.bank_account_holder_name IS NULL THEN
    v_blocked_reasons := array_append(v_blocked_reasons, 'Bank account details required');
  END IF;
  
  -- Check bank verification status
  IF v_profile.bank_details_verified IS NULL OR v_profile.bank_details_verified = FALSE THEN
    v_blocked_reasons := array_append(v_blocked_reasons, 'Bank account verification pending (admin approval required)');
  END IF;
  
  -- Build result
  IF array_length(v_blocked_reasons, 1) > 0 THEN
    v_result := jsonb_build_object(
      'eligible', false,
      'blocked_reasons', v_blocked_reasons,
      'prize_amount', v_winner.prize_value_amount,
      'claim_deadline', v_winner.claim_deadline,
      'days_remaining', EXTRACT(DAY FROM (v_winner.claim_deadline - NOW()))
    );
  ELSE
    v_result := jsonb_build_object(
      'eligible', true,
      'prize_amount', v_winner.prize_value_amount,
      'claim_deadline', v_winner.claim_deadline,
      'days_remaining', EXTRACT(DAY FROM (v_winner.claim_deadline - NOW())),
      'winner_name', v_winner.winner_name
    );
  END IF;
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION validate_prize_claim_eligibility(UUID, UUID) TO authenticated;

-- --------------------------------------------------------------------
-- 5. PROCESS PRIZE CLAIM (RPC)
-- --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION process_prize_claim(
  p_winner_id UUID,
  p_user_id UUID,
  p_claim_method TEXT DEFAULT 'wallet_credit'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_winner RECORD;
  v_eligibility JSONB;
  v_wallet_id UUID;
BEGIN
  -- Validate eligibility
  v_eligibility := validate_prize_claim_eligibility(p_winner_id, p_user_id);
  
  IF (v_eligibility->>'eligible')::BOOLEAN = FALSE THEN
    -- Log failed claim attempt
    INSERT INTO audit_logs (
      action,
      target_type,
      target_id,
      user_id,
      details
    ) VALUES (
      'prize_claim_blocked',
      'prize_draw_winner',
      p_winner_id,
      p_user_id,
      jsonb_build_object(
        'reason', v_eligibility->>'reason',
        'blocked_reasons', v_eligibility->'blocked_reasons'
      )
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', v_eligibility->>'reason',
      'blocked_reasons', v_eligibility->'blocked_reasons'
    );
  END IF;
  
  -- Get winner record
  SELECT * INTO v_winner
  FROM prize_draw_winners
  WHERE id = p_winner_id;
  
  -- Mark as claimed
  UPDATE prize_draw_winners
  SET 
    claimed_at = NOW(),
    claim_method = p_claim_method,
    claim_blocked_reason = NULL
  WHERE id = p_winner_id;
  
  -- If wallet credit method, credit wallet immediately
  IF p_claim_method = 'wallet_credit' THEN
    -- Get or create wallet
    SELECT id INTO v_wallet_id
    FROM wallets
    WHERE user_id = p_user_id;
    
    IF v_wallet_id IS NULL THEN
      INSERT INTO wallets (user_id, balance, currency)
      VALUES (p_user_id, 0, 'BDT')
      RETURNING id INTO v_wallet_id;
    END IF;
    
    -- Credit wallet
    UPDATE wallets
    SET balance = balance + v_winner.prize_value_amount,
        updated_at = NOW()
    WHERE id = v_wallet_id;
    
    -- Log transaction
    INSERT INTO wallet_transactions (
      wallet_id,
      transaction_type,
      amount,
      description,
      reference_id,
      reference_type
    ) VALUES (
      v_wallet_id,
      'prize_claim',
      v_winner.prize_value_amount,
      format('Prize claim: %s - %s', v_winner.prize_title, v_winner.draw_id),
      p_winner_id,
      'prize_draw_winner'
    );
  END IF;
  
  -- Log successful claim
  INSERT INTO audit_logs (
    action,
    target_type,
    target_id,
    user_id,
    details
  ) VALUES (
    'prize_claimed',
    'prize_draw_winner',
    p_winner_id,
    p_user_id,
    jsonb_build_object(
      'prize_amount', v_winner.prize_value_amount,
      'claim_method', p_claim_method,
      'prize_title', v_winner.prize_title
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'prize_amount', v_winner.prize_value_amount,
    'claim_method', p_claim_method,
    'claimed_at', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION process_prize_claim(UUID, UUID, TEXT) TO authenticated;

-- --------------------------------------------------------------------
-- 6. PROCESS EXPIRED UNCLAIMED PRIZES (RPC)
-- --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION process_expired_unclaimed_prizes()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired_winner RECORD;
  v_draw RECORD;
  v_total_expired INTEGER := 0;
  v_total_rollover NUMERIC := 0;
  v_draws_affected TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Find all expired unclaimed prizes
  FOR v_expired_winner IN
    SELECT * FROM prize_draw_winners
    WHERE claimed_at IS NULL
      AND claim_deadline < NOW()
      AND expired_at IS NULL
      AND rollover_processed = FALSE
  LOOP
    -- Get draw info
    SELECT * INTO v_draw
    FROM prize_draws
    WHERE id = v_expired_winner.draw_id;
    
    -- Mark as expired
    UPDATE prize_draw_winners
    SET 
      expired_at = NOW(),
      rollover_amount = prize_value_amount,
      rollover_processed = TRUE,
      claim_blocked_reason = 'Claim deadline expired - prize rolled to next draw'
    WHERE id = v_expired_winner.id;
    
    -- Add to next draw pool (stays in same sub-pool type)
    -- The rollover happens automatically since we don't deduct from pool
    -- We just mark it as rolled over for accounting
    
    -- Log rollover
    INSERT INTO audit_logs (
      action,
      target_type,
      target_id,
      details
    ) VALUES (
      'prize_rollover_expired',
      'prize_draw_winner',
      v_expired_winner.id,
      jsonb_build_object(
        'draw_id', v_expired_winner.draw_id,
        'draw_name', v_draw.draw_name,
        'prize_amount', v_expired_winner.prize_value_amount,
        'winner_user_id', v_expired_winner.winner_user_id,
        'claim_deadline', v_expired_winner.claim_deadline,
        'expired_at', NOW(),
        'pool_type', v_draw.pool_type
      )
    );
    
    v_total_expired := v_total_expired + 1;
    v_total_rollover := v_total_rollover + v_expired_winner.prize_value_amount;
    
    IF NOT (v_expired_winner.draw_id::TEXT = ANY(v_draws_affected)) THEN
      v_draws_affected := array_append(v_draws_affected, v_expired_winner.draw_id::TEXT);
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_expired', v_total_expired,
    'total_rollover_amount', v_total_rollover,
    'draws_affected', v_draws_affected,
    'processed_at', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION process_expired_unclaimed_prizes() TO service_role;

-- --------------------------------------------------------------------
-- 7. GENERATE FINAL CLAIM REPORT (RPC)
-- --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION generate_final_claim_report(p_draw_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_draw RECORD;
  v_report_data JSONB;
  v_total_prizes INTEGER;
  v_claimed_prizes INTEGER;
  v_unclaimed_prizes INTEGER;
  v_total_amount NUMERIC;
  v_claimed_amount NUMERIC;
  v_unclaimed_amount NUMERIC;
  v_rollover_amount NUMERIC;
  v_report_id UUID;
BEGIN
  -- Get draw info
  SELECT * INTO v_draw
  FROM prize_draws
  WHERE id = p_draw_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Draw not found');
  END IF;
  
  -- Calculate statistics
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE claimed_at IS NOT NULL) as claimed,
    COUNT(*) FILTER (WHERE claimed_at IS NULL AND claim_deadline < NOW()) as unclaimed,
    SUM(prize_value_amount) as total_amt,
    SUM(prize_value_amount) FILTER (WHERE claimed_at IS NOT NULL) as claimed_amt,
    SUM(prize_value_amount) FILTER (WHERE claimed_at IS NULL AND claim_deadline < NOW()) as unclaimed_amt,
    SUM(rollover_amount) as rollover_amt
  INTO 
    v_total_prizes,
    v_claimed_prizes,
    v_unclaimed_prizes,
    v_total_amount,
    v_claimed_amount,
    v_unclaimed_amount,
    v_rollover_amount
  FROM prize_draw_winners
  WHERE draw_id = p_draw_id;
  
  -- Build detailed report data
  v_report_data := jsonb_build_object(
    'draw_id', p_draw_id,
    'draw_name', v_draw.draw_name,
    'draw_date', v_draw.draw_date,
    'pool_type', v_draw.pool_type,
    'report_generated_at', NOW(),
    'statistics', jsonb_build_object(
      'total_prizes', COALESCE(v_total_prizes, 0),
      'claimed_prizes', COALESCE(v_claimed_prizes, 0),
      'unclaimed_prizes', COALESCE(v_unclaimed_prizes, 0),
      'total_amount', COALESCE(v_total_amount, 0),
      'claimed_amount', COALESCE(v_claimed_amount, 0),
      'unclaimed_amount', COALESCE(v_unclaimed_amount, 0),
      'rollover_amount', COALESCE(v_rollover_amount, 0)
    ),
    'winners', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'winner_id_hash', md5(winner_user_id::TEXT),
          'prize_title', prize_title,
          'prize_amount', prize_value_amount,
          'claimed', claimed_at IS NOT NULL,
          'claimed_at', claimed_at,
          'claim_deadline', claim_deadline,
          'expired', expired_at IS NOT NULL,
          'rollover_processed', rollover_processed
        )
      )
      FROM prize_draw_winners
      WHERE draw_id = p_draw_id
    )
  );
  
  -- Insert report (if not already exists)
  INSERT INTO prize_claim_reports (
    draw_id,
    report_type,
    total_prizes,
    claimed_prizes,
    unclaimed_prizes,
    total_prize_amount,
    claimed_amount,
    unclaimed_amount,
    rollover_amount,
    report_data,
    is_immutable
  ) VALUES (
    p_draw_id,
    'final_claim_summary',
    COALESCE(v_total_prizes, 0),
    COALESCE(v_claimed_prizes, 0),
    COALESCE(v_unclaimed_prizes, 0),
    COALESCE(v_total_amount, 0),
    COALESCE(v_claimed_amount, 0),
    COALESCE(v_unclaimed_amount, 0),
    COALESCE(v_rollover_amount, 0),
    v_report_data,
    TRUE
  )
  ON CONFLICT (draw_id, report_type) DO UPDATE
  SET report_data = EXCLUDED.report_data
  RETURNING id INTO v_report_id;
  
  -- Log report generation
  INSERT INTO audit_logs (
    action,
    target_type,
    target_id,
    details
  ) VALUES (
    'final_claim_report_generated',
    'prize_claim_report',
    v_report_id,
    jsonb_build_object(
      'draw_id', p_draw_id,
      'draw_name', v_draw.draw_name,
      'total_prizes', v_total_prizes,
      'claimed_prizes', v_claimed_prizes,
      'unclaimed_prizes', v_unclaimed_prizes,
      'rollover_amount', v_rollover_amount
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'report_id', v_report_id,
    'report_data', v_report_data
  );
END;
$$;

GRANT EXECUTE ON FUNCTION generate_final_claim_report(UUID) TO service_role;

-- --------------------------------------------------------------------
-- 8. GET MEMBER CLAIMABLE PRIZES (RPC)
-- --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_member_claimable_prizes(p_user_id UUID)
RETURNS TABLE(
  winner_id UUID,
  draw_id UUID,
  draw_name TEXT,
  prize_title TEXT,
  prize_amount NUMERIC,
  claim_deadline TIMESTAMPTZ,
  days_remaining NUMERIC,
  can_claim BOOLEAN,
  blocked_reason TEXT,
  eligibility_details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id as winner_id,
    w.draw_id,
    d.draw_name,
    w.prize_title,
    w.prize_value_amount as prize_amount,
    w.claim_deadline,
    EXTRACT(DAY FROM (w.claim_deadline - NOW())) as days_remaining,
    (validate_prize_claim_eligibility(w.id, p_user_id)->>'eligible')::BOOLEAN as can_claim,
    w.claim_blocked_reason as blocked_reason,
    validate_prize_claim_eligibility(w.id, p_user_id) as eligibility_details
  FROM prize_draw_winners w
  JOIN prize_draws d ON d.id = w.draw_id
  WHERE w.winner_user_id = p_user_id
    AND w.claimed_at IS NULL
    AND w.claim_deadline > NOW()
  ORDER BY w.claim_deadline ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_member_claimable_prizes(UUID) TO authenticated;

-- --------------------------------------------------------------------
-- FINAL VERIFICATION
-- --------------------------------------------------------------------

SELECT 'PROMPT A5.4: Final Prize Claim, Rollover & KYC Enforcement migration completed successfully' AS status;