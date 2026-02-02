-- ====================================================================
-- PROMPT A5.5: COMMUNITY PRIZE SELECTION, ROLLOVER & AWARD CONTROL
-- ====================================================================
-- Date: 2026-01-30
-- Description: Governance tables, community prize awards, and split rollover logic
-- ====================================================================

-- ============================================================================
-- 1. COMMUNITY PRIZE AWARDS TABLE (MANUAL SELECTION)
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_prize_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Draw & Prize Info
  prize_draw_id UUID NOT NULL REFERENCES prize_draws(id) ON DELETE CASCADE,
  prize_id UUID REFERENCES prize_draw_prizes(id) ON DELETE SET NULL,
  prize_name TEXT NOT NULL,
  prize_amount NUMERIC NOT NULL CHECK (prize_amount > 0),
  
  -- Member Info
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_number TEXT NOT NULL,
  
  -- Award Metadata
  awarded_by_admin_id UUID REFERENCES profiles(id),
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Claim Status
  claim_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    claim_status IN ('pending', 'claimed', 'expired')
  ),
  claim_deadline TIMESTAMPTZ NOT NULL,
  claimed_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate awards for same prize
  CONSTRAINT unique_community_prize_award UNIQUE (prize_id, member_id)
);

-- Indexes for performance
CREATE INDEX idx_community_prize_awards_member ON community_prize_awards(member_id);
CREATE INDEX idx_community_prize_awards_member_number ON community_prize_awards(member_number);
CREATE INDEX idx_community_prize_awards_draw ON community_prize_awards(prize_draw_id);
CREATE INDEX idx_community_prize_awards_status ON community_prize_awards(claim_status);
CREATE INDEX idx_community_prize_awards_deadline ON community_prize_awards(claim_deadline);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_community_prize_awards_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_prize_awards_updated_at
  BEFORE UPDATE ON community_prize_awards
  FOR EACH ROW
  EXECUTE FUNCTION update_community_prize_awards_timestamp();

-- ============================================================================
-- 2. DRAW CLOSURE REPORTS TABLE (ADMIN ONLY)
-- ============================================================================

CREATE TABLE IF NOT EXISTS prize_draw_closure_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Draw Info
  draw_id UUID NOT NULL REFERENCES prize_draws(id) ON DELETE CASCADE,
  draw_name TEXT NOT NULL,
  draw_type TEXT NOT NULL CHECK (draw_type IN ('random', 'community')),
  draw_date DATE NOT NULL,
  
  -- Summary Data
  total_prizes_created INTEGER NOT NULL DEFAULT 0,
  total_prizes_claimed INTEGER NOT NULL DEFAULT 0,
  total_prizes_expired INTEGER NOT NULL DEFAULT 0,
  
  total_amount_allocated NUMERIC NOT NULL DEFAULT 0,
  total_amount_claimed NUMERIC NOT NULL DEFAULT 0,
  total_amount_expired NUMERIC NOT NULL DEFAULT 0,
  
  -- Rollover Tracking
  rollover_to_random_pool NUMERIC NOT NULL DEFAULT 0,
  rollover_to_community_pool NUMERIC NOT NULL DEFAULT 0,
  
  -- Report Metadata
  report_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES profiles(id),
  is_final BOOLEAN DEFAULT TRUE,
  
  -- Immutability
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One report per draw
  CONSTRAINT unique_closure_report_per_draw UNIQUE (draw_id)
);

-- Indexes
CREATE INDEX idx_closure_reports_draw ON prize_draw_closure_reports(draw_id);
CREATE INDEX idx_closure_reports_type ON prize_draw_closure_reports(draw_type);
CREATE INDEX idx_closure_reports_date ON prize_draw_closure_reports(generated_at);

-- ============================================================================
-- 3. RLS POLICIES - SECURITY
-- ============================================================================

-- Community Prize Awards: Super Admin only
ALTER TABLE community_prize_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin full access to community prize awards"
  ON community_prize_awards
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Members can view their own community prize awards"
  ON community_prize_awards
  FOR SELECT
  USING (member_id = auth.uid());

-- Closure Reports: Super Admin + Manager Admin
ALTER TABLE prize_draw_closure_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view closure reports"
  ON prize_draw_closure_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'manager_admin')
    )
  );

CREATE POLICY "Super Admin can create closure reports"
  ON prize_draw_closure_reports
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

-- Closure reports are immutable (no updates or deletes)
CREATE POLICY "Closure reports are immutable"
  ON prize_draw_closure_reports
  FOR UPDATE
  USING (FALSE);

CREATE POLICY "Closure reports cannot be deleted"
  ON prize_draw_closure_reports
  FOR DELETE
  USING (FALSE);

-- ============================================================================
-- 4. RPC: AWARD COMMUNITY PRIZE (SUPER ADMIN)
-- ============================================================================

CREATE OR REPLACE FUNCTION award_community_prize(
  p_prize_draw_id UUID,
  p_prize_id UUID,
  p_prize_name TEXT,
  p_prize_amount NUMERIC,
  p_member_number TEXT,
  p_awarded_by_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member_id UUID;
  v_award_id UUID;
  v_claim_deadline TIMESTAMPTZ;
BEGIN
  -- Validate admin is Super Admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_awarded_by_admin_id 
    AND role = 'super_admin'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Only Super Admin can award community prizes'
    );
  END IF;

  -- Find member by member number
  SELECT m.user_id INTO v_member_id
  FROM memberships m
  WHERE m.membership_number::TEXT = p_member_number
  AND m.status = 'active';

  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Member not found or inactive'
    );
  END IF;

  -- Check if prize already awarded
  IF EXISTS (
    SELECT 1 FROM community_prize_awards
    WHERE prize_id = p_prize_id
    AND member_id = v_member_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Prize already awarded to this member'
    );
  END IF;

  -- Set claim deadline (14 days from now)
  v_claim_deadline := NOW() + INTERVAL '14 days';

  -- Insert community prize award
  INSERT INTO community_prize_awards (
    prize_draw_id,
    prize_id,
    prize_name,
    prize_amount,
    member_id,
    member_number,
    awarded_by_admin_id,
    claim_deadline
  ) VALUES (
    p_prize_draw_id,
    p_prize_id,
    p_prize_name,
    p_prize_amount,
    v_member_id,
    p_member_number,
    p_awarded_by_admin_id,
    v_claim_deadline
  ) RETURNING id INTO v_award_id;

  -- Send internal notification to member
  INSERT INTO messages (
    sender_id,
    content,
    is_broadcast,
    created_at
  ) VALUES (
    p_awarded_by_admin_id,
    format(
      'Congratulations! You have been awarded a Community Prize: %s (%s BDT). Please claim it by %s.',
      p_prize_name,
      p_prize_amount,
      v_claim_deadline::DATE
    ),
    false,
    NOW()
  ) RETURNING id INTO v_award_id;

  INSERT INTO message_recipients (
    message_id,
    recipient_id,
    status
  ) VALUES (
    v_award_id,
    v_member_id,
    'unread'
  );

  -- Log in audit_logs
  INSERT INTO audit_logs (
    action,
    target_type,
    target_id,
    details,
    user_id
  ) VALUES (
    'community_prize_awarded',
    'community_prize_award',
    v_award_id,
    jsonb_build_object(
      'prize_name', p_prize_name,
      'prize_amount', p_prize_amount,
      'member_number', p_member_number,
      'member_id', v_member_id,
      'claim_deadline', v_claim_deadline
    ),
    p_awarded_by_admin_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'award_id', v_award_id,
    'member_id', v_member_id,
    'claim_deadline', v_claim_deadline
  );
END;
$$;

GRANT EXECUTE ON FUNCTION award_community_prize TO service_role;

-- ============================================================================
-- 5. RPC: PROCESS EXPIRED PRIZES WITH SPLIT ROLLOVER
-- ============================================================================

CREATE OR REPLACE FUNCTION process_expired_prizes_split_rollover()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired_random_total NUMERIC := 0;
  v_expired_community_total NUMERIC := 0;
  v_expired_count INTEGER := 0;
  v_draw_record RECORD;
BEGIN
  -- Process expired RANDOM draw prizes
  FOR v_draw_record IN 
    SELECT DISTINCT pdw.draw_id, pd.pool_type
    FROM prize_draw_winners pdw
    JOIN prize_draws pd ON pd.id = pdw.draw_id
    WHERE pdw.claim_deadline < NOW()
    AND pdw.claimed_at IS NULL
    AND pdw.rollover_processed = FALSE
    AND pd.pool_type = 'random'
  LOOP
    -- Sum expired prizes for this draw
    SELECT COALESCE(SUM(pdw.prize_value_amount), 0)
    INTO v_expired_random_total
    FROM prize_draw_winners pdw
    WHERE pdw.draw_id = v_draw_record.draw_id
    AND pdw.claimed_at IS NULL
    AND pdw.rollover_processed = FALSE;

    -- Mark as processed
    UPDATE prize_draw_winners
    SET rollover_processed = TRUE
    WHERE draw_id = v_draw_record.draw_id
    AND claimed_at IS NULL
    AND rollover_processed = FALSE;

    v_expired_count := v_expired_count + 1;
  END LOOP;

  -- Process expired COMMUNITY prize awards
  FOR v_draw_record IN 
    SELECT DISTINCT cpa.prize_draw_id, pd.pool_type
    FROM community_prize_awards cpa
    JOIN prize_draws pd ON pd.id = cpa.prize_draw_id
    WHERE cpa.claim_deadline < NOW()
    AND cpa.claim_status = 'pending'
    AND pd.pool_type = 'community'
  LOOP
    -- Sum expired community prizes
    SELECT COALESCE(SUM(cpa.prize_amount), 0)
    INTO v_expired_community_total
    FROM community_prize_awards cpa
    WHERE cpa.prize_draw_id = v_draw_record.prize_draw_id
    AND cpa.claim_status = 'pending';

    -- Mark as expired
    UPDATE community_prize_awards
    SET claim_status = 'expired'
    WHERE prize_draw_id = v_draw_record.prize_draw_id
    AND claim_status = 'pending'
    AND claim_deadline < NOW();

    v_expired_count := v_expired_count + 1;
  END LOOP;

  -- Funds automatically remain in respective sub-pools (no explicit transfer needed)
  -- The sub-pool ledger tracks this as "unclaimed prize rollover"

  RETURN jsonb_build_object(
    'success', true,
    'expired_draws_processed', v_expired_count,
    'random_pool_rollover', v_expired_random_total,
    'community_pool_rollover', v_expired_community_total,
    'processed_at', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION process_expired_prizes_split_rollover TO service_role;

-- ============================================================================
-- 6. RPC: GENERATE FINAL CLOSURE REPORT
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_draw_closure_report(p_draw_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_draw RECORD;
  v_total_claimed INTEGER := 0;
  v_total_expired INTEGER := 0;
  v_amount_claimed NUMERIC := 0;
  v_amount_expired NUMERIC := 0;
  v_random_rollover NUMERIC := 0;
  v_community_rollover NUMERIC := 0;
  v_report_id UUID;
BEGIN
  -- Get draw info
  SELECT * INTO v_draw
  FROM prize_draws
  WHERE id = p_draw_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Draw not found');
  END IF;

  -- Check if report already exists
  IF EXISTS (SELECT 1 FROM prize_draw_closure_reports WHERE draw_id = p_draw_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Closure report already exists for this draw'
    );
  END IF;

  -- Calculate statistics based on draw type
  IF v_draw.pool_type = 'random' THEN
    -- Random draw statistics
    SELECT 
      COUNT(*) FILTER (WHERE claimed_at IS NOT NULL),
      COUNT(*) FILTER (WHERE claimed_at IS NULL AND claim_deadline < NOW()),
      COALESCE(SUM(prize_value_amount) FILTER (WHERE claimed_at IS NOT NULL), 0),
      COALESCE(SUM(prize_value_amount) FILTER (WHERE claimed_at IS NULL AND claim_deadline < NOW()), 0)
    INTO v_total_claimed, v_total_expired, v_amount_claimed, v_amount_expired
    FROM prize_draw_winners
    WHERE draw_id = p_draw_id;

    v_random_rollover := v_amount_expired;
    v_community_rollover := 0;

  ELSIF v_draw.pool_type = 'community' THEN
    -- Community draw statistics
    SELECT 
      COUNT(*) FILTER (WHERE claim_status = 'claimed'),
      COUNT(*) FILTER (WHERE claim_status = 'expired'),
      COALESCE(SUM(prize_amount) FILTER (WHERE claim_status = 'claimed'), 0),
      COALESCE(SUM(prize_amount) FILTER (WHERE claim_status = 'expired'), 0)
    INTO v_total_claimed, v_total_expired, v_amount_claimed, v_amount_expired
    FROM community_prize_awards
    WHERE prize_draw_id = p_draw_id;

    v_random_rollover := 0;
    v_community_rollover := v_amount_expired;
  END IF;

  -- Insert closure report
  INSERT INTO prize_draw_closure_reports (
    draw_id,
    draw_name,
    draw_type,
    draw_date,
    total_prizes_created,
    total_prizes_claimed,
    total_prizes_expired,
    total_amount_allocated,
    total_amount_claimed,
    total_amount_expired,
    rollover_to_random_pool,
    rollover_to_community_pool,
    report_data,
    generated_by
  ) VALUES (
    p_draw_id,
    v_draw.draw_name,
    v_draw.pool_type,
    v_draw.draw_date,
    v_total_claimed + v_total_expired,
    v_total_claimed,
    v_total_expired,
    v_draw.estimated_prize_pool_amount,
    v_amount_claimed,
    v_amount_expired,
    v_random_rollover,
    v_community_rollover,
    jsonb_build_object(
      'draw_name', v_draw.draw_name,
      'draw_date', v_draw.draw_date,
      'draw_type', v_draw.pool_type,
      'summary', jsonb_build_object(
        'total_prizes', v_total_claimed + v_total_expired,
        'claimed', v_total_claimed,
        'expired', v_total_expired
      ),
      'amounts', jsonb_build_object(
        'allocated', v_draw.estimated_prize_pool_amount,
        'claimed', v_amount_claimed,
        'expired', v_amount_expired
      ),
      'rollover', jsonb_build_object(
        'random_pool', v_random_rollover,
        'community_pool', v_community_rollover
      )
    ),
    auth.uid()
  ) RETURNING id INTO v_report_id;

  -- Log in audit_logs
  INSERT INTO audit_logs (
    action,
    target_type,
    target_id,
    details,
    user_id
  ) VALUES (
    'draw_closure_report_generated',
    'prize_draw',
    p_draw_id,
    jsonb_build_object(
      'report_id', v_report_id,
      'claimed', v_total_claimed,
      'expired', v_total_expired,
      'random_rollover', v_random_rollover,
      'community_rollover', v_community_rollover
    ),
    auth.uid()
  );

  RETURN jsonb_build_object(
    'success', true,
    'report_id', v_report_id,
    'summary', jsonb_build_object(
      'total_prizes', v_total_claimed + v_total_expired,
      'claimed', v_total_claimed,
      'expired', v_total_expired,
      'amount_claimed', v_amount_claimed,
      'amount_expired', v_amount_expired,
      'random_rollover', v_random_rollover,
      'community_rollover', v_community_rollover
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION generate_draw_closure_report TO service_role;

-- ============================================================================
-- 7. RPC: CLAIM COMMUNITY PRIZE (MEMBER)
-- ============================================================================

CREATE OR REPLACE FUNCTION claim_community_prize(
  p_award_id UUID,
  p_member_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_award RECORD;
  v_kyc_approved BOOLEAN;
  v_bank_verified BOOLEAN;
BEGIN
  -- Get award details
  SELECT * INTO v_award
  FROM community_prize_awards
  WHERE id = p_award_id
  AND member_id = p_member_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Award not found');
  END IF;

  -- Check claim status
  IF v_award.claim_status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Prize already claimed or expired'
    );
  END IF;

  -- Check deadline
  IF v_award.claim_deadline < NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Claim deadline has passed'
    );
  END IF;

  -- Validate KYC
  SELECT (status = 'APPROVED') INTO v_kyc_approved
  FROM identity_verifications
  WHERE user_id = p_member_id
  ORDER BY submitted_at DESC
  LIMIT 1;

  IF NOT COALESCE(v_kyc_approved, FALSE) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Identity verification (KYC) not approved'
    );
  END IF;

  -- Validate bank details
  SELECT is_verified INTO v_bank_verified
  FROM member_bank_details
  WHERE member_id = p_member_id;

  IF NOT COALESCE(v_bank_verified, FALSE) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Bank details not verified by admin'
    );
  END IF;

  -- Update claim status
  UPDATE community_prize_awards
  SET 
    claim_status = 'claimed',
    claimed_at = NOW()
  WHERE id = p_award_id;

  -- Credit wallet
  INSERT INTO wallet_transactions (
    user_id,
    transaction_type,
    amount,
    currency_code,
    description,
    reference_type,
    reference_id,
    status
  ) VALUES (
    p_member_id,
    'prize_claim',
    v_award.prize_amount,
    'BDT',
    format('Community Prize Claim: %s', v_award.prize_name),
    'community_prize_award',
    p_award_id,
    'completed'
  );

  -- Update wallet balance
  UPDATE wallets
  SET 
    balance = balance + v_award.prize_amount,
    updated_at = NOW()
  WHERE user_id = p_member_id;

  -- Log in audit_logs
  INSERT INTO audit_logs (
    action,
    target_type,
    target_id,
    details,
    user_id
  ) VALUES (
    'community_prize_claimed',
    'community_prize_award',
    p_award_id,
    jsonb_build_object(
      'prize_name', v_award.prize_name,
      'prize_amount', v_award.prize_amount,
      'member_number', v_award.member_number
    ),
    p_member_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'prize_name', v_award.prize_name,
    'prize_amount', v_award.prize_amount,
    'claimed_at', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION claim_community_prize TO service_role;

-- ============================================================================
-- SUCCESS
-- ============================================================================

SELECT 'PROMPT A5.5: Community Prize Selection, Rollover & Award Control migration completed successfully' AS status;