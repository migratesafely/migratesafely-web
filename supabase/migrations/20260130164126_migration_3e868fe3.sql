-- ====================================================================
-- PRIZE DRAW CONFIGURATION, EXECUTION & FAIRNESS LOCK (FIXED)
-- Prompt A5 Implementation
-- Bangladesh (BDT) only
-- ADDITIVE ONLY - Does not break existing prize draw logic
-- ====================================================================

-- ====================================================================
-- PART 1: ENHANCE PRIZE DRAW TABLE STRUCTURE
-- ====================================================================

-- Add new columns to prize_draws table for A5 requirements
ALTER TABLE prize_draws 
ADD COLUMN IF NOT EXISTS draw_name TEXT,
ADD COLUMN IF NOT EXISTS draw_time TIME,
ADD COLUMN IF NOT EXISTS pool_type TEXT CHECK (pool_type IN ('random', 'community')),
ADD COLUMN IF NOT EXISTS entry_cutoff_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS fairness_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_executed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS execution_report JSONB,
ADD COLUMN IF NOT EXISTS leftover_amount NUMERIC DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN prize_draws.draw_name IS 'Human-readable draw name (e.g., "Europe Migration Support Package")';
COMMENT ON COLUMN prize_draws.draw_time IS 'Exact time of draw execution (HH:MM local Bangladesh time)';
COMMENT ON COLUMN prize_draws.pool_type IS 'Which sub-pool to use: random or community';
COMMENT ON COLUMN prize_draws.entry_cutoff_time IS 'Calculated: draw_date + draw_time - 1 hour';
COMMENT ON COLUMN prize_draws.fairness_locked IS 'TRUE after cutoff time - no new entries allowed';
COMMENT ON COLUMN prize_draws.auto_executed IS 'TRUE if draw was executed automatically';
COMMENT ON COLUMN prize_draws.execution_report IS 'Immutable draw completion report';
COMMENT ON COLUMN prize_draws.leftover_amount IS 'Unused funds that roll forward to next draw';

-- ====================================================================
-- PART 2: ENHANCE PRIZE DRAW PRIZES TABLE
-- ====================================================================

-- Add sub-pool tracking to prizes
ALTER TABLE prize_draw_prizes
ADD COLUMN IF NOT EXISTS sub_pool_type TEXT CHECK (sub_pool_type IN ('random', 'community')),
ADD COLUMN IF NOT EXISTS deducted_from_pool BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pool_deduction_timestamp TIMESTAMPTZ;

COMMENT ON COLUMN prize_draw_prizes.sub_pool_type IS 'Which sub-pool this prize was deducted from';
COMMENT ON COLUMN prize_draw_prizes.deducted_from_pool IS 'TRUE if amount was deducted from sub-pool balance';
COMMENT ON COLUMN prize_draw_prizes.pool_deduction_timestamp IS 'When the deduction occurred';

-- ====================================================================
-- PART 3: CREATE DRAW REPORTS TABLE (IMMUTABLE AUDIT RECORDS)
-- ====================================================================

CREATE TABLE IF NOT EXISTS prize_draw_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES prize_draws(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL DEFAULT 'BD',
  
  -- Draw metadata
  draw_name TEXT NOT NULL,
  draw_date DATE NOT NULL,
  draw_time TIME NOT NULL,
  pool_type TEXT NOT NULL CHECK (pool_type IN ('random', 'community')),
  
  -- Financial summary
  total_prize_amount NUMERIC NOT NULL,
  total_awarded NUMERIC NOT NULL,
  leftover_amount NUMERIC NOT NULL DEFAULT 0,
  pool_balance_before NUMERIC NOT NULL,
  pool_balance_after NUMERIC NOT NULL,
  
  -- Execution metadata
  total_entries INTEGER NOT NULL DEFAULT 0,
  total_winners INTEGER NOT NULL DEFAULT 0,
  execution_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  executed_by UUID REFERENCES profiles(id),
  auto_executed BOOLEAN DEFAULT FALSE,
  
  -- Winner summary (member IDs only for privacy)
  winner_ids UUID[] NOT NULL DEFAULT '{}',
  
  -- System signature (for audit trail)
  report_signature TEXT NOT NULL,
  
  -- Immutability timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicates
  CONSTRAINT unique_draw_report UNIQUE (draw_id)
);

-- Enable RLS
ALTER TABLE prize_draw_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin access only
CREATE POLICY "Super admins and managers can view draw reports"
  ON prize_draw_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'manager_admin')
    )
  );

-- No INSERT/UPDATE/DELETE policies - reports are created by system functions only

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_draw_reports_draw_id ON prize_draw_reports(draw_id);
CREATE INDEX IF NOT EXISTS idx_draw_reports_country ON prize_draw_reports(country_code);
CREATE INDEX IF NOT EXISTS idx_draw_reports_execution ON prize_draw_reports(execution_timestamp DESC);

COMMENT ON TABLE prize_draw_reports IS 'Immutable draw completion reports for audit trail';

-- ====================================================================
-- PART 4: CREATE NOTIFICATION QUEUE TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('winner', 'non_winner', 'admin_draw_complete', 'draw_scheduled')),
  
  -- Notification content
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  failed_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Reference
  reference_id UUID,
  reference_type TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notification_queue FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
  ON notification_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'manager_admin')
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_new ON notification_queue(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notification_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notification_queue(created_at DESC);

COMMENT ON TABLE notification_queue IS 'Queue for automated prize draw notifications';

-- ====================================================================
-- PART 5: FAIRNESS LOCK ENFORCEMENT FUNCTION
-- ====================================================================

CREATE OR REPLACE FUNCTION enforce_draw_fairness_lock()
RETURNS TRIGGER AS $$
DECLARE
  v_draw_record RECORD;
  v_cutoff_time TIMESTAMPTZ;
BEGIN
  -- Get draw details
  SELECT draw_date, draw_time, entry_cutoff_time, fairness_locked, status
  INTO v_draw_record
  FROM prize_draws
  WHERE id = NEW.draw_id;
  
  -- Check if draw exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Prize draw not found';
  END IF;
  
  -- Calculate cutoff time if not set
  IF v_draw_record.entry_cutoff_time IS NOT NULL THEN
    v_cutoff_time := v_draw_record.entry_cutoff_time;
  ELSIF v_draw_record.draw_date IS NOT NULL AND v_draw_record.draw_time IS NOT NULL THEN
    v_cutoff_time := (v_draw_record.draw_date + v_draw_record.draw_time)::TIMESTAMPTZ - INTERVAL '1 hour';
  ELSE
    -- No cutoff set, allow entry
    RETURN NEW;
  END IF;
  
  -- Enforce fairness lock
  IF NOW() >= v_cutoff_time OR v_draw_record.fairness_locked = TRUE THEN
    RAISE EXCEPTION 'Draw entries are locked. Cutoff time has passed. You will be automatically entered into the next draw.';
  END IF;
  
  -- Check if draw is completed
  IF v_draw_record.status = 'completed' THEN
    RAISE EXCEPTION 'Cannot enter a completed draw';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for fairness lock enforcement
DROP TRIGGER IF EXISTS trigger_enforce_fairness_lock ON prize_draw_entries;
CREATE TRIGGER trigger_enforce_fairness_lock
  BEFORE INSERT ON prize_draw_entries
  FOR EACH ROW
  EXECUTE FUNCTION enforce_draw_fairness_lock();

COMMENT ON FUNCTION enforce_draw_fairness_lock() IS 'Prevents new entries 1 hour before draw time (fairness lock)';

-- ====================================================================
-- PART 6: AUTOMATIC ENTRY CUTOFF CALCULATION
-- ====================================================================

CREATE OR REPLACE FUNCTION calculate_entry_cutoff()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate entry cutoff if draw_date and draw_time are set
  IF NEW.draw_date IS NOT NULL AND NEW.draw_time IS NOT NULL THEN
    NEW.entry_cutoff_time := (NEW.draw_date + NEW.draw_time)::TIMESTAMPTZ - INTERVAL '1 hour';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic cutoff calculation
DROP TRIGGER IF EXISTS trigger_calculate_entry_cutoff ON prize_draws;
CREATE TRIGGER trigger_calculate_entry_cutoff
  BEFORE INSERT OR UPDATE OF draw_date, draw_time ON prize_draws
  FOR EACH ROW
  EXECUTE FUNCTION calculate_entry_cutoff();

COMMENT ON FUNCTION calculate_entry_cutoff() IS 'Automatically calculates entry cutoff time (draw time - 1 hour)';

-- ====================================================================
-- PART 7: SUB-POOL DEDUCTION FUNCTION
-- ====================================================================

CREATE OR REPLACE FUNCTION deduct_prize_from_sub_pool(
  p_prize_id UUID,
  p_sub_pool_type TEXT,
  p_prize_amount NUMERIC,
  p_country_code TEXT DEFAULT 'BD'
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_deduction_result JSONB;
BEGIN
  -- Validate sub_pool_type
  IF p_sub_pool_type NOT IN ('random', 'community') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid sub_pool_type. Must be random or community.'
    );
  END IF;
  
  -- Get current sub-pool balance
  SELECT current_balance INTO v_current_balance
  FROM prize_pool_sub_accounts
  WHERE country_code = p_country_code
    AND sub_pool_type = p_sub_pool_type
  FOR UPDATE;
  
  -- Check if sufficient funds
  IF v_current_balance < p_prize_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Insufficient funds in %s pool. Available: %s BDT, Required: %s BDT', 
                      p_sub_pool_type, v_current_balance, p_prize_amount),
      'current_balance', v_current_balance,
      'required_amount', p_prize_amount
    );
  END IF;
  
  -- Deduct from sub-pool balance
  v_new_balance := v_current_balance - p_prize_amount;
  
  UPDATE prize_pool_sub_accounts
  SET current_balance = v_new_balance,
      last_updated_at = NOW()
  WHERE country_code = p_country_code
    AND sub_pool_type = p_sub_pool_type;
  
  -- Record in sub-ledger
  INSERT INTO prize_pool_sub_ledger (
    country_code,
    sub_pool_type,
    transaction_type,
    amount,
    balance_after,
    reference_id,
    reference_type,
    description
  ) VALUES (
    p_country_code,
    p_sub_pool_type,
    'payout',
    -p_prize_amount,
    v_new_balance,
    p_prize_id,
    'prize_draw_prize',
    format('Prize deduction from %s pool', p_sub_pool_type)
  );
  
  -- Mark prize as deducted
  UPDATE prize_draw_prizes
  SET sub_pool_type = p_sub_pool_type,
      deducted_from_pool = TRUE,
      pool_deduction_timestamp = NOW()
  WHERE id = p_prize_id;
  
  -- Return success result
  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', v_current_balance,
    'deducted_amount', p_prize_amount,
    'new_balance', v_new_balance,
    'sub_pool_type', p_sub_pool_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION deduct_prize_from_sub_pool IS 'Deducts prize amount from specified sub-pool (random or community) and records in ledger';

-- ====================================================================
-- PART 8: ROLLOVER LEFTOVER FUNDS FUNCTION
-- ====================================================================

CREATE OR REPLACE FUNCTION rollover_leftover_funds(
  p_draw_id UUID,
  p_leftover_amount NUMERIC,
  p_sub_pool_type TEXT,
  p_country_code TEXT DEFAULT 'BD'
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Validate sub_pool_type
  IF p_sub_pool_type NOT IN ('random', 'community') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid sub_pool_type'
    );
  END IF;
  
  -- If no leftover, nothing to rollover
  IF p_leftover_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'No leftover funds to rollover',
      'leftover_amount', 0
    );
  END IF;
  
  -- Get current sub-pool balance
  SELECT current_balance INTO v_current_balance
  FROM prize_pool_sub_accounts
  WHERE country_code = p_country_code
    AND sub_pool_type = p_sub_pool_type
  FOR UPDATE;
  
  -- Add leftover back to pool
  v_new_balance := v_current_balance + p_leftover_amount;
  
  UPDATE prize_pool_sub_accounts
  SET current_balance = v_new_balance,
      last_updated_at = NOW()
  WHERE country_code = p_country_code
    AND sub_pool_type = p_sub_pool_type;
  
  -- Record in sub-ledger
  INSERT INTO prize_pool_sub_ledger (
    country_code,
    sub_pool_type,
    transaction_type,
    amount,
    balance_after,
    reference_id,
    reference_type,
    description
  ) VALUES (
    p_country_code,
    p_sub_pool_type,
    'adjustment',
    p_leftover_amount,
    v_new_balance,
    p_draw_id,
    'prize_draw_rollover',
    format('Leftover funds rolled forward from completed draw')
  );
  
  -- Update draw record with leftover amount
  UPDATE prize_draws
  SET leftover_amount = p_leftover_amount
  WHERE id = p_draw_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'leftover_amount', p_leftover_amount,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'sub_pool_type', p_sub_pool_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION rollover_leftover_funds IS 'Rolls leftover funds back into the same sub-pool for next draw';

-- ====================================================================
-- PART 9: GENERATE DRAW REPORT FUNCTION
-- ====================================================================

CREATE OR REPLACE FUNCTION generate_draw_report(
  p_draw_id UUID,
  p_executed_by UUID DEFAULT NULL,
  p_auto_executed BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
  v_draw_record RECORD;
  v_total_prize_amount NUMERIC := 0;
  v_total_awarded NUMERIC := 0;
  v_leftover_amount NUMERIC := 0;
  v_pool_balance_before NUMERIC;
  v_pool_balance_after NUMERIC;
  v_total_entries INTEGER;
  v_total_winners INTEGER;
  v_winner_ids UUID[];
  v_report_signature TEXT;
  v_report_id UUID;
BEGIN
  -- Get draw details
  SELECT * INTO v_draw_record
  FROM prize_draws
  WHERE id = p_draw_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Prize draw not found'
    );
  END IF;
  
  -- Calculate total prize amount
  SELECT COALESCE(SUM(prize_value * number_of_winners), 0)
  INTO v_total_prize_amount
  FROM prize_draw_prizes
  WHERE draw_id = p_draw_id;
  
  -- Calculate total awarded (winners only)
  SELECT COALESCE(SUM(p.prize_value), 0)
  INTO v_total_awarded
  FROM prize_draw_winners w
  JOIN prize_draw_prizes p ON w.prize_id = p.id
  WHERE w.draw_id = p_draw_id
    AND w.status != 'expired';
  
  -- Calculate leftover
  v_leftover_amount := v_total_prize_amount - v_total_awarded;
  
  -- Get pool balances (before = current + awarded, after = current)
  SELECT current_balance INTO v_pool_balance_after
  FROM prize_pool_sub_accounts
  WHERE country_code = v_draw_record.country_code
    AND sub_pool_type = v_draw_record.pool_type;
  
  v_pool_balance_before := v_pool_balance_after + v_total_awarded;
  
  -- Count entries and winners
  SELECT COUNT(*) INTO v_total_entries
  FROM prize_draw_entries
  WHERE draw_id = p_draw_id;
  
  SELECT COUNT(*), ARRAY_AGG(user_id)
  INTO v_total_winners, v_winner_ids
  FROM prize_draw_winners
  WHERE draw_id = p_draw_id
    AND status != 'expired';
  
  -- Generate report signature (hash of key data)
  v_report_signature := encode(
    digest(
      format('%s|%s|%s|%s|%s', 
             p_draw_id, v_total_awarded, v_total_winners, NOW(), random()
      ),
      'sha256'
    ),
    'hex'
  );
  
  -- Create immutable report
  INSERT INTO prize_draw_reports (
    draw_id,
    country_code,
    draw_name,
    draw_date,
    draw_time,
    pool_type,
    total_prize_amount,
    total_awarded,
    leftover_amount,
    pool_balance_before,
    pool_balance_after,
    total_entries,
    total_winners,
    execution_timestamp,
    executed_by,
    auto_executed,
    winner_ids,
    report_signature
  ) VALUES (
    p_draw_id,
    v_draw_record.country_code,
    v_draw_record.draw_name,
    v_draw_record.draw_date,
    v_draw_record.draw_time,
    v_draw_record.pool_type,
    v_total_prize_amount,
    v_total_awarded,
    v_leftover_amount,
    v_pool_balance_before,
    v_pool_balance_after,
    v_total_entries,
    v_total_winners,
    NOW(),
    p_executed_by,
    p_auto_executed,
    COALESCE(v_winner_ids, '{}'),
    v_report_signature
  )
  RETURNING id INTO v_report_id;
  
  -- Update draw record
  UPDATE prize_draws
  SET auto_executed = p_auto_executed,
      execution_report = jsonb_build_object(
        'report_id', v_report_id,
        'total_awarded', v_total_awarded,
        'leftover_amount', v_leftover_amount,
        'total_winners', v_total_winners,
        'executed_at', NOW()
      )
  WHERE id = p_draw_id;
  
  -- Rollover leftover funds if any
  IF v_leftover_amount > 0 THEN
    PERFORM rollover_leftover_funds(
      p_draw_id,
      v_leftover_amount,
      v_draw_record.pool_type,
      v_draw_record.country_code
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'report_id', v_report_id,
    'total_prize_amount', v_total_prize_amount,
    'total_awarded', v_total_awarded,
    'leftover_amount', v_leftover_amount,
    'total_winners', v_total_winners,
    'report_signature', v_report_signature
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_draw_report IS 'Generates immutable draw completion report and handles leftover rollover';

-- ====================================================================
-- PART 10: QUEUE WINNER NOTIFICATIONS FUNCTION
-- ====================================================================

CREATE OR REPLACE FUNCTION queue_winner_notifications(
  p_draw_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_winner_record RECORD;
  v_draw_name TEXT;
  v_notification_count INTEGER := 0;
BEGIN
  -- Get draw name
  SELECT draw_name INTO v_draw_name
  FROM prize_draws
  WHERE id = p_draw_id;
  
  -- Queue notifications for each winner
  FOR v_winner_record IN
    SELECT 
      w.user_id,
      w.prize_id,
      p.title AS prize_title,
      p.prize_value,
      u.email
    FROM prize_draw_winners w
    JOIN prize_draw_prizes p ON w.prize_id = p.id
    JOIN profiles u ON w.user_id = u.id
    WHERE w.draw_id = p_draw_id
      AND w.status = 'pending'
  LOOP
    -- Insert winner notification
    INSERT INTO notification_queue (
      recipient_id,
      notification_type,
      subject,
      message,
      metadata,
      reference_id,
      reference_type
    ) VALUES (
      v_winner_record.user_id,
      'winner',
      format('🎉 Congratulations! You won %s BDT!', v_winner_record.prize_value),
      format(
        E'Congratulations! You are a winner of the %s draw!

' ||
        'Prize: %s
' ||
        'Amount: %s BDT

' ||
        'Your prize has been credited to your wallet. Log in to view your balance.',
        v_draw_name,
        v_winner_record.prize_title,
        v_winner_record.prize_value
      ),
      jsonb_build_object(
        'draw_id', p_draw_id,
        'prize_id', v_winner_record.prize_id,
        'prize_value', v_winner_record.prize_value
      ),
      p_draw_id,
      'prize_draw_winner'
    );
    
    v_notification_count := v_notification_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'notifications_queued', v_notification_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION queue_winner_notifications IS 'Queues automated notifications for all draw winners';

-- ====================================================================
-- PART 11: HUMAN-READABLE AMOUNT FORMATTING (LAKHS/CRORES)
-- ====================================================================

CREATE OR REPLACE FUNCTION format_bdt_amount(
  p_amount NUMERIC
)
RETURNS TEXT AS $$
DECLARE
  v_formatted TEXT;
  v_crores NUMERIC;
  v_lakhs NUMERIC;
  v_thousands NUMERIC;
BEGIN
  -- Handle zero and negative
  IF p_amount = 0 THEN
    RETURN '0 BDT';
  END IF;
  
  IF p_amount < 0 THEN
    RETURN '-' || format_bdt_amount(ABS(p_amount));
  END IF;
  
  -- Crores (10,000,000)
  IF p_amount >= 10000000 THEN
    v_crores := FLOOR(p_amount / 10000000);
    v_lakhs := FLOOR((p_amount - (v_crores * 10000000)) / 100000);
    
    IF v_lakhs > 0 THEN
      RETURN format('%s Crore %s Lakh BDT', v_crores, v_lakhs);
    ELSE
      RETURN format('%s Crore BDT', v_crores);
    END IF;
  END IF;
  
  -- Lakhs (100,000)
  IF p_amount >= 100000 THEN
    v_lakhs := FLOOR(p_amount / 100000);
    v_thousands := FLOOR((p_amount - (v_lakhs * 100000)) / 1000);
    
    IF v_thousands > 0 THEN
      RETURN format('%s Lakh %s Thousand BDT', v_lakhs, v_thousands);
    ELSE
      RETURN format('%s Lakh BDT', v_lakhs);
    END IF;
  END IF;
  
  -- Thousands (1,000)
  IF p_amount >= 1000 THEN
    v_thousands := FLOOR(p_amount / 1000);
    RETURN format('%s Thousand BDT', v_thousands);
  END IF;
  
  -- Less than 1000
  RETURN format('%s BDT', p_amount);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION format_bdt_amount IS 'Formats BDT amounts in human-readable Bangladeshi format (Lakhs/Crores)';

-- Test the function
SELECT format_bdt_amount(2000000) AS formatted;  -- Should return "20 Lakh BDT"
SELECT format_bdt_amount(15000000) AS formatted; -- Should return "1 Crore 50 Lakh BDT"
SELECT format_bdt_amount(500000) AS formatted;   -- Should return "5 Lakh BDT"

-- ====================================================================
-- MIGRATION COMPLETE
-- ====================================================================

SELECT 'Prize Draw Configuration, Execution & Fairness Lock migration completed successfully' AS status;