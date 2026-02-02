-- Create admin_notifications table for tier bonus approval alerts
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('tier_bonus_approval', 'agent_verification', 'scam_report_review', 'identity_verification', 'system_alert')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'critical', 'overdue')),
  target_admin_roles TEXT[] NOT NULL,
  reference_id UUID NOT NULL,
  member_id UUID REFERENCES profiles(id),
  member_full_name TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  read_by UUID REFERENCES profiles(id),
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  escalated_at TIMESTAMP
);

CREATE INDEX idx_admin_notifications_type ON admin_notifications(notification_type);
CREATE INDEX idx_admin_notifications_priority ON admin_notifications(priority);
CREATE INDEX idx_admin_notifications_read ON admin_notifications(is_read);
CREATE INDEX idx_admin_notifications_created ON admin_notifications(created_at);
CREATE INDEX idx_admin_notifications_reference ON admin_notifications(reference_id);

COMMENT ON TABLE admin_notifications IS 'Admin notifications for tier bonus approvals and other urgent actions';
COMMENT ON COLUMN admin_notifications.notification_type IS 'Type of notification (tier_bonus_approval for tier bonus payouts)';
COMMENT ON COLUMN admin_notifications.priority IS 'normal = initial, high = 48h+ pending, critical = urgent, overdue = 72h+ pending';
COMMENT ON COLUMN admin_notifications.target_admin_roles IS 'Admin roles that should see this notification (manager_admin, super_admin)';
COMMENT ON COLUMN admin_notifications.reference_id IS 'ID of the related record (tier_bonus_approval_id)';
COMMENT ON COLUMN admin_notifications.metadata IS 'Additional data (tier_name, bonus_amount, bonus_percentage, currency_code, tier_level)';