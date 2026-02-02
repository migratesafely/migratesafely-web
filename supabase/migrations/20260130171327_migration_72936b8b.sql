-- Create prize_notification_queue table (missing from A5)
CREATE TABLE IF NOT EXISTS prize_notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES prize_draws(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'winner_announcement', 
    'non_winner', 
    'admin_summary', 
    'next_draw_teaser'
  )),
  template_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_pending
ON prize_notification_queue(status, created_at)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notification_queue_draw
ON prize_notification_queue(draw_id);

COMMENT ON TABLE prize_notification_queue IS 'Queue for automated prize draw notifications';

-- Now create the helper functions
CREATE OR REPLACE FUNCTION get_pending_notifications(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  notification_id UUID,
  draw_id UUID,
  recipient_user_id UUID,
  notification_type TEXT,
  template_data JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pnq.id AS notification_id,
    pnq.draw_id,
    pnq.recipient_user_id,
    pnq.notification_type,
    pnq.template_data,
    pnq.created_at
  FROM prize_notification_queue pnq
  WHERE pnq.status = 'pending'
  ORDER BY pnq.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_notification_sent(
  p_notification_id UUID,
  p_success BOOLEAN DEFAULT TRUE
)
RETURNS VOID AS $$
BEGIN
  UPDATE prize_notification_queue
  SET 
    status = CASE WHEN p_success THEN 'sent' ELSE 'failed' END,
    sent_at = CASE WHEN p_success THEN NOW() ELSE NULL END
  WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_pending_notifications(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION mark_notification_sent(UUID, BOOLEAN) TO service_role;

-- Create validation and execution helper functions
CREATE OR REPLACE FUNCTION get_draws_ready_for_execution()
RETURNS TABLE (
  draw_id UUID,
  draw_name TEXT,
  draw_date DATE,
  draw_time TIME,
  pool_type TEXT,
  estimated_prize_pool_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pd.id AS draw_id,
    pd.draw_name,
    pd.draw_date,
    pd.draw_time,
    pd.pool_type,
    pd.estimated_prize_pool_amount
  FROM prize_draws pd
  WHERE pd.announcement_status = 'ANNOUNCED'
    AND pd.status = 'active'
    AND pd.fairness_locked = FALSE
    AND pd.draw_time IS NOT NULL
    AND pd.draw_date <= CURRENT_DATE
    AND (pd.draw_date::timestamp + pd.draw_time) <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION validate_draw_execution_safety(p_draw_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_draw RECORD;
  v_prize_count INTEGER;
  v_entry_count INTEGER;
BEGIN
  SELECT * INTO v_draw FROM prize_draws WHERE id = p_draw_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('safe', FALSE, 'error', 'Draw not found');
  END IF;

  IF v_draw.status IN ('executing', 'completed', 'failed') THEN
    RETURN jsonb_build_object('safe', FALSE, 'error', 'Draw already processed', 'current_status', v_draw.status);
  END IF;

  SELECT COUNT(*) INTO v_prize_count FROM prize_draw_prizes WHERE draw_id = p_draw_id;
  IF v_prize_count = 0 THEN
    RETURN jsonb_build_object('safe', FALSE, 'error', 'No prizes configured');
  END IF;

  SELECT COUNT(*) INTO v_entry_count FROM prize_draw_entries WHERE draw_id = p_draw_id;
  IF v_entry_count = 0 THEN
    RETURN jsonb_build_object('safe', FALSE, 'error', 'No entries found');
  END IF;

  IF v_draw.entry_cutoff_time IS NOT NULL AND NOW() < v_draw.entry_cutoff_time THEN
    RETURN jsonb_build_object('safe', FALSE, 'error', 'Entry cutoff not yet passed');
  END IF;

  RETURN jsonb_build_object(
    'safe', TRUE,
    'prize_count', v_prize_count,
    'entry_count', v_entry_count,
    'draw_name', v_draw.draw_name,
    'pool_type', v_draw.pool_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_draws_ready_for_execution() TO service_role;
GRANT EXECUTE ON FUNCTION validate_draw_execution_safety(UUID) TO service_role;

SELECT 'Prize notification queue and execution helpers created successfully' AS status;