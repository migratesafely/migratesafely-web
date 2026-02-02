-- ====================================================================
-- PROMPT A5.7C: Fix - Update functions to use correct role categories
-- ====================================================================

-- Drop and recreate the override request function with correct role checks
DROP FUNCTION IF EXISTS request_attendance_override CASCADE;

CREATE OR REPLACE FUNCTION request_attendance_override(
  p_log_id uuid,
  p_new_status employee_attendance_status,
  p_reason text,
  p_requested_by_admin_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_requester_role employee_role_category;
  v_override_id uuid;
  v_log_record RECORD;
BEGIN
  -- Get requester's role
  SELECT role_category INTO v_requester_role
  FROM employees
  WHERE user_id = p_requested_by_admin_id;

  IF v_requester_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Get attendance log details
  SELECT * INTO v_log_record
  FROM employee_attendance_logs
  WHERE id = p_log_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Attendance log not found');
  END IF;

  -- Determine if auto-approved based on role
  -- Chairman and Managing Director have full override authority
  IF v_requester_role IN ('chairman', 'managing_director') THEN
    -- Auto-approve and apply immediately
    INSERT INTO attendance_overrides (
      attendance_log_id,
      original_status,
      new_status,
      override_reason,
      requested_by_admin_id,
      approved_by_admin_id,
      status,
      applied_at
    ) VALUES (
      p_log_id,
      v_log_record.status,
      p_new_status,
      p_reason,
      p_requested_by_admin_id,
      p_requested_by_admin_id,
      'approved',
      NOW()
    ) RETURNING id INTO v_override_id;

    -- Apply the override immediately
    UPDATE employee_attendance_logs
    SET 
      status = p_new_status,
      lateness_minutes = CASE WHEN p_new_status = 'on_time' THEN 0 ELSE lateness_minutes END
    WHERE id = p_log_id;

    -- Log in audit_logs
    INSERT INTO audit_logs (
      admin_id,
      action,
      resource_type,
      resource_id,
      details
    ) VALUES (
      p_requested_by_admin_id,
      'attendance_override_approved',
      'attendance_override',
      v_override_id,
      jsonb_build_object(
        'log_id', p_log_id,
        'original_status', v_log_record.status,
        'new_status', p_new_status,
        'reason', p_reason,
        'auto_approved', true
      )
    );

    RETURN jsonb_build_object(
      'success', true,
      'override_id', v_override_id,
      'status', 'approved',
      'message', 'Override approved and applied immediately'
    );

  ELSIF v_requester_role = 'general_manager' THEN
    -- GM can suggest, requires chairman approval
    INSERT INTO attendance_overrides (
      attendance_log_id,
      original_status,
      new_status,
      override_reason,
      requested_by_admin_id,
      status
    ) VALUES (
      p_log_id,
      v_log_record.status,
      p_new_status,
      p_reason,
      p_requested_by_admin_id,
      'pending'
    ) RETURNING id INTO v_override_id;

    -- Notify chairman
    INSERT INTO admin_notifications (
      recipient_id,
      notification_type,
      title,
      message,
      priority,
      metadata
    )
    SELECT 
      e.user_id,
      'attendance_override_request',
      'Attendance Override Request from GM',
      format('GM has requested to override attendance for %s on %s. Reason: %s',
        v_log_record.role, v_log_record.attendance_date, p_reason),
      'high',
      jsonb_build_object('override_id', v_override_id, 'log_id', p_log_id)
    FROM employees e
    WHERE e.role_category = 'chairman';

    RETURN jsonb_build_object(
      'success', true,
      'override_id', v_override_id,
      'status', 'pending',
      'message', 'Override request submitted for chairman approval'
    );

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the approve override function
DROP FUNCTION IF EXISTS approve_attendance_override CASCADE;

CREATE OR REPLACE FUNCTION approve_attendance_override(
  p_override_id uuid,
  p_approved_by_admin_id uuid,
  p_decision text -- 'approve' or 'reject'
) RETURNS jsonb AS $$
DECLARE
  v_approver_role employee_role_category;
  v_override_record RECORD;
BEGIN
  -- Get approver's role (must be chairman or managing_director)
  SELECT role_category INTO v_approver_role
  FROM employees
  WHERE user_id = p_approved_by_admin_id;

  IF v_approver_role NOT IN ('chairman', 'managing_director') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only Chairman or MD can approve overrides');
  END IF;

  -- Get override details
  SELECT * INTO v_override_record
  FROM attendance_overrides
  WHERE id = p_override_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Override not found or already processed');
  END IF;

  IF p_decision = 'approve' THEN
    -- Approve and apply
    UPDATE attendance_overrides
    SET 
      status = 'approved',
      approved_by_admin_id = p_approved_by_admin_id,
      applied_at = NOW()
    WHERE id = p_override_id;

    -- Apply to attendance log
    UPDATE employee_attendance_logs
    SET 
      status = v_override_record.new_status,
      lateness_minutes = CASE WHEN v_override_record.new_status = 'on_time' THEN 0 ELSE lateness_minutes END
    WHERE id = v_override_record.attendance_log_id;

    -- Log approval
    INSERT INTO audit_logs (
      admin_id,
      action,
      resource_type,
      resource_id,
      details
    ) VALUES (
      p_approved_by_admin_id,
      'attendance_override_approved',
      'attendance_override',
      p_override_id,
      jsonb_build_object(
        'log_id', v_override_record.attendance_log_id,
        'original_status', v_override_record.original_status,
        'new_status', v_override_record.new_status,
        'approved_by_role', v_approver_role
      )
    );

    -- Notify requester
    INSERT INTO admin_notifications (
      recipient_id,
      notification_type,
      title,
      message,
      priority
    ) VALUES (
      v_override_record.requested_by_admin_id,
      'attendance_override_approved',
      'Attendance Override Approved',
      'Your attendance override request has been approved.',
      'medium'
    );

    RETURN jsonb_build_object('success', true, 'message', 'Override approved and applied');

  ELSIF p_decision = 'reject' THEN
    -- Reject
    UPDATE attendance_overrides
    SET 
      status = 'rejected',
      approved_by_admin_id = p_approved_by_admin_id
    WHERE id = p_override_id;

    -- Log rejection
    INSERT INTO audit_logs (
      admin_id,
      action,
      resource_type,
      resource_id,
      details
    ) VALUES (
      p_approved_by_admin_id,
      'attendance_override_rejected',
      'attendance_override',
      p_override_id,
      jsonb_build_object('log_id', v_override_record.attendance_log_id)
    );

    -- Notify requester
    INSERT INTO admin_notifications (
      recipient_id,
      notification_type,
      title,
      message,
      priority
    ) VALUES (
      v_override_record.requested_by_admin_id,
      'attendance_override_rejected',
      'Attendance Override Rejected',
      'Your attendance override request has been rejected.',
      'medium'
    );

    RETURN jsonb_build_object('success', true, 'message', 'Override rejected');

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid decision');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION request_attendance_override TO authenticated;
GRANT EXECUTE ON FUNCTION approve_attendance_override TO authenticated;

SELECT 'PROMPT A5.7C: Fix - Functions updated with correct role categories' AS status;