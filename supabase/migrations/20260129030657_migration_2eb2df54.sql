-- Create function to dismiss notification when tier bonus is approved/rejected
CREATE OR REPLACE FUNCTION dismiss_tier_bonus_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark notification as read when tier bonus is approved or rejected
  IF NEW.status IN ('approved', 'rejected') AND OLD.status = 'pending' THEN
    UPDATE admin_notifications
    SET 
      is_read = true,
      read_by = NEW.reviewed_by,
      read_at = NOW()
    WHERE 
      notification_type = 'tier_bonus_approval'
      AND reference_id = NEW.id
      AND is_read = false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to dismiss notification when tier bonus is actioned
CREATE TRIGGER trigger_dismiss_tier_bonus_notification
  AFTER UPDATE ON tier_bonus_approvals
  FOR EACH ROW
  WHEN (NEW.status != OLD.status)
  EXECUTE FUNCTION dismiss_tier_bonus_notification();

COMMENT ON FUNCTION dismiss_tier_bonus_notification IS 'Marks tier bonus notification as read when admin approves or rejects';