-- PROMPT 10: Centralized Notification System (Internal Only)
-- ADDITIVE ONLY - DO NOT overwrite existing prompts or logic

DO $$ 
BEGIN
  -- System setting for notification feature documentation
  IF NOT EXISTS (
    SELECT 1 FROM system_settings WHERE setting_key = 'centralized_notifications_enabled'
  ) THEN
    INSERT INTO system_settings (setting_key, setting_value, description)
    VALUES (
      'centralized_notifications_enabled',
      'true',
      'PROMPT 10: Centralized internal notification system for members and admins. All notifications are internal-only, no external emails triggered.'
    );
  END IF;
END $$;

-- Create notifications table (centralized for both members and admins)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('member', 'worker_admin', 'manager_admin', 'super_admin', 'agent', 'agent_pending', 'agent_suspended')),
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'agent_verification',
    'document_verification',
    'tier_achievement',
    'tier_bonus_pending',
    'tier_bonus_approved',
    'tier_achievement_bonus_pending',
    'tier_achievement_bonus_approved',
    'wallet_credit',
    'membership_event',
    'system_alert',
    'identity_verification',
    'scam_report_review',
    'prize_draw_entry',
    'prize_draw_winner'
  )),
  reference_id UUID,
  reference_type TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent', 'critical')),
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_reference ON notifications(reference_id);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Members can view their own notifications
CREATE POLICY "Members can view own notifications"
ON notifications FOR SELECT
TO authenticated
USING (recipient_id = auth.uid());

-- Members can mark their own notifications as read
CREATE POLICY "Members can mark own notifications as read"
ON notifications FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- System can insert notifications (via service role)
CREATE POLICY "System can insert notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- No one can delete notifications (immutable)
CREATE POLICY "No deletes allowed"
ON notifications FOR DELETE
TO authenticated
USING (false);

-- Function: Create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_recipient_id UUID,
  p_notification_type TEXT,
  p_title TEXT,
  p_description TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal',
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_recipient_role TEXT;
BEGIN
  -- Get recipient role
  SELECT role INTO v_recipient_role
  FROM profiles
  WHERE id = p_recipient_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recipient not found';
  END IF;

  -- Insert notification
  INSERT INTO notifications (
    recipient_id,
    recipient_role,
    notification_type,
    reference_id,
    reference_type,
    title,
    description,
    priority,
    action_url,
    metadata,
    is_read,
    created_at
  ) VALUES (
    p_recipient_id,
    v_recipient_role,
    p_notification_type,
    p_reference_id,
    p_reference_type,
    p_title,
    p_description,
    p_priority,
    p_action_url,
    p_metadata,
    FALSE,
    NOW()
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get unread notifications for user
CREATE OR REPLACE FUNCTION get_unread_notifications()
RETURNS TABLE (
  notification_id UUID,
  notification_type TEXT,
  reference_id UUID,
  reference_type TEXT,
  title TEXT,
  description TEXT,
  priority TEXT,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id AS notification_id,
    n.notification_type,
    n.reference_id,
    n.reference_type,
    n.title,
    n.description,
    n.priority,
    n.action_url,
    n.metadata,
    n.created_at
  FROM notifications n
  WHERE n.recipient_id = auth.uid()
  AND n.is_read = FALSE
  AND (n.expires_at IS NULL OR n.expires_at > NOW())
  ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get all notifications for user (with pagination)
CREATE OR REPLACE FUNCTION get_user_notifications(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_include_read BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  notification_id UUID,
  notification_type TEXT,
  reference_id UUID,
  reference_type TEXT,
  title TEXT,
  description TEXT,
  priority TEXT,
  action_url TEXT,
  metadata JSONB,
  is_read BOOLEAN,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id AS notification_id,
    n.notification_type,
    n.reference_id,
    n.reference_type,
    n.title,
    n.description,
    n.priority,
    n.action_url,
    n.metadata,
    n.is_read,
    n.read_at,
    n.created_at
  FROM notifications n
  WHERE n.recipient_id = auth.uid()
  AND (n.expires_at IS NULL OR n.expires_at > NOW())
  AND (p_include_read = TRUE OR n.is_read = FALSE)
  ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications
  SET 
    is_read = TRUE,
    read_at = NOW()
  WHERE id = p_notification_id
  AND recipient_id = auth.uid()
  AND is_read = FALSE;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET 
    is_read = TRUE,
    read_at = NOW()
  WHERE recipient_id = auth.uid()
  AND is_read = FALSE
  AND (expires_at IS NULL OR expires_at > NOW());

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get unread count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM notifications
  WHERE recipient_id = auth.uid()
  AND is_read = FALSE
  AND (expires_at IS NULL OR expires_at > NOW());

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Notify all admins by role
CREATE OR REPLACE FUNCTION notify_admins_by_role(
  p_min_role TEXT, -- 'worker_admin', 'manager_admin', or 'super_admin'
  p_notification_type TEXT,
  p_title TEXT,
  p_description TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal',
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_admin RECORD;
BEGIN
  -- Notify all admins with role >= min_role
  FOR v_admin IN 
    SELECT id, role FROM profiles
    WHERE CASE p_min_role
      WHEN 'worker_admin' THEN role IN ('worker_admin', 'manager_admin', 'super_admin')
      WHEN 'manager_admin' THEN role IN ('manager_admin', 'super_admin')
      WHEN 'super_admin' THEN role = 'super_admin'
      ELSE FALSE
    END
  LOOP
    PERFORM create_notification(
      v_admin.id,
      p_notification_type,
      p_title,
      p_description,
      p_reference_id,
      p_reference_type,
      p_priority,
      p_action_url,
      p_metadata
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit log for notification operations
CREATE TABLE IF NOT EXISTS notification_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID REFERENCES notifications(id),
  user_id UUID REFERENCES profiles(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('created', 'read', 'expired')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_notification_audit_log_notification ON notification_audit_log(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_audit_log_user ON notification_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_audit_log_timestamp ON notification_audit_log(timestamp DESC);

-- RLS for audit log
ALTER TABLE notification_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
ON notification_audit_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('worker_admin', 'manager_admin', 'super_admin')
  )
);

CREATE POLICY "System can insert audit log"
ON notification_audit_log FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "No updates on audit log"
ON notification_audit_log FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "No deletes on audit log"
ON notification_audit_log FOR DELETE
TO authenticated
USING (false);

-- Trigger: Log notification creation
CREATE OR REPLACE FUNCTION log_notification_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_audit_log (
    notification_id,
    user_id,
    action_type,
    metadata
  ) VALUES (
    NEW.id,
    NEW.recipient_id,
    'created',
    jsonb_build_object(
      'notification_type', NEW.notification_type,
      'priority', NEW.priority
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_notification_creation
AFTER INSERT ON notifications
FOR EACH ROW
EXECUTE FUNCTION log_notification_creation();

-- Trigger: Log notification read
CREATE OR REPLACE FUNCTION log_notification_read()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
    INSERT INTO notification_audit_log (
      notification_id,
      user_id,
      action_type,
      metadata
    ) VALUES (
      NEW.id,
      auth.uid(),
      'read',
      jsonb_build_object('read_at', NEW.read_at)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_notification_read
AFTER UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION log_notification_read();

COMMENT ON TABLE notifications IS 'PROMPT 10: Centralized internal notification system. All notifications are internal-only, no external emails triggered. Immutable (no deletes). Role-aware delivery for members and admins.';