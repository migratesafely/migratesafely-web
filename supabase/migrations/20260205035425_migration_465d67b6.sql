-- MASTER ADMIN AUDIT SUPPRESSION
-- CRITICAL: All master_admin actions must be invisible in audit/activity/history systems

-- ============================================================
-- STEP 1: CREATE AUDIT SUPPRESSION HELPER FUNCTIONS
-- ============================================================

-- Function to check if current user is master_admin
CREATE OR REPLACE FUNCTION is_current_user_master_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'master_admin'
  );
END;
$$;

COMMENT ON FUNCTION is_current_user_master_admin IS 'Returns TRUE if current user has master_admin role. Used for audit suppression.';

-- ============================================================
-- STEP 2: APPLY SUPPRESSION TO ALL AUDIT TABLES
-- ============================================================

-- AUDIT_LOGS: Suppress master_admin entries
CREATE OR REPLACE FUNCTION suppress_master_admin_audit_logs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Block INSERT if user is master_admin
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.user_id
    AND role = 'master_admin'
  ) THEN
    RETURN NULL; -- Suppress the insert
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_suppress_master_admin_audit ON audit_logs;
CREATE TRIGGER trigger_suppress_master_admin_audit
  BEFORE INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION suppress_master_admin_audit_logs();

-- AGENT_APPROVAL_AUDIT_LOG: Suppress master_admin entries
CREATE OR REPLACE FUNCTION suppress_master_admin_agent_approval_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Block INSERT if admin is master_admin
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.admin_user_id
    AND role = 'master_admin'
  ) THEN
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_suppress_master_admin_agent_approval ON agent_approval_audit_log;
CREATE TRIGGER trigger_suppress_master_admin_agent_approval
  BEFORE INSERT ON agent_approval_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION suppress_master_admin_agent_approval_audit();

-- ADMIN_REPORT_ACCESS_LOGS: Suppress master_admin entries
CREATE OR REPLACE FUNCTION suppress_master_admin_report_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Block INSERT if admin is master_admin
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.admin_id
    AND role = 'master_admin'
  ) THEN
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_suppress_master_admin_report_access ON admin_report_access_logs;
CREATE TRIGGER trigger_suppress_master_admin_report_access
  BEFORE INSERT ON admin_report_access_logs
  FOR EACH ROW
  EXECUTE FUNCTION suppress_master_admin_report_access();

-- TIER_BONUS_AUDIT_LOG: Suppress master_admin entries
CREATE OR REPLACE FUNCTION suppress_master_admin_tier_bonus_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Block INSERT if performed_by is master_admin
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.performed_by
    AND role = 'master_admin'
  ) THEN
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_suppress_master_admin_tier_bonus_audit ON tier_bonus_audit_log;
CREATE TRIGGER trigger_suppress_master_admin_tier_bonus_audit
  BEFORE INSERT ON tier_bonus_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION suppress_master_admin_tier_bonus_audit();

-- PAYMENT_AUDIT_LOG: Suppress master_admin entries
CREATE OR REPLACE FUNCTION suppress_master_admin_payment_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Block INSERT if performed_by is master_admin
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.performed_by
    AND role = 'master_admin'
  ) THEN
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_suppress_master_admin_payment_audit ON payment_audit_log;
CREATE TRIGGER trigger_suppress_master_admin_payment_audit
  BEFORE INSERT ON payment_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION suppress_master_admin_payment_audit();

-- BANK_DETAILS_CHANGE_LOG: Suppress master_admin entries
CREATE OR REPLACE FUNCTION suppress_master_admin_bank_change_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Block INSERT if changed_by is master_admin
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.changed_by
    AND role = 'master_admin'
  ) THEN
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_suppress_master_admin_bank_change ON bank_details_change_log;
CREATE TRIGGER trigger_suppress_master_admin_bank_change
  BEFORE INSERT ON bank_details_change_log
  FOR EACH ROW
  EXECUTE FUNCTION suppress_master_admin_bank_change_log();

-- EXPENSE_APPROVAL_AUDIT: Suppress master_admin entries
CREATE OR REPLACE FUNCTION suppress_master_admin_expense_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Block INSERT if performed_by is master_admin
  IF NEW.performed_by_employee_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM employees e
    JOIN profiles p ON e.user_id = p.id
    WHERE e.id = NEW.performed_by_employee_id
    AND p.role = 'master_admin'
  ) THEN
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_suppress_master_admin_expense_audit ON expense_approval_audit;
CREATE TRIGGER trigger_suppress_master_admin_expense_audit
  BEFORE INSERT ON expense_approval_audit
  FOR EACH ROW
  EXECUTE FUNCTION suppress_master_admin_expense_audit();

-- NOTIFICATION_AUDIT_LOG: Suppress master_admin entries
CREATE OR REPLACE FUNCTION suppress_master_admin_notification_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Block INSERT if user is master_admin
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.user_id
    AND role = 'master_admin'
  ) THEN
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_suppress_master_admin_notification_audit ON notification_audit_log;
CREATE TRIGGER trigger_suppress_master_admin_notification_audit
  BEFORE INSERT ON notification_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION suppress_master_admin_notification_audit();

-- DOCUMENT_VERIFICATION_AUDIT_LOG: Suppress master_admin entries
CREATE OR REPLACE FUNCTION suppress_master_admin_doc_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Block INSERT if performed_by is master_admin
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.performed_by
    AND role = 'master_admin'
  ) THEN
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_suppress_master_admin_doc_audit ON document_verification_audit_log;
CREATE TRIGGER trigger_suppress_master_admin_doc_audit
  BEFORE INSERT ON document_verification_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION suppress_master_admin_doc_audit();

-- LOYALTY_TIER_CONFIG_AUDIT: Suppress master_admin entries
CREATE OR REPLACE FUNCTION suppress_master_admin_tier_config_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Block INSERT if changed_by is master_admin
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.changed_by
    AND role = 'master_admin'
  ) THEN
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_suppress_master_admin_tier_config_audit ON loyalty_tier_config_audit;
CREATE TRIGGER trigger_suppress_master_admin_tier_config_audit
  BEFORE INSERT ON loyalty_tier_config_audit
  FOR EACH ROW
  EXECUTE FUNCTION suppress_master_admin_tier_config_audit();

-- PRIZE_POOL_CONFIG_AUDIT: Suppress master_admin entries
CREATE OR REPLACE FUNCTION suppress_master_admin_prize_pool_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Block INSERT if changed_by is master_admin
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.changed_by
    AND role = 'master_admin'
  ) THEN
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_suppress_master_admin_prize_pool_audit ON prize_pool_config_audit;
CREATE TRIGGER trigger_suppress_master_admin_prize_pool_audit
  BEFORE INSERT ON prize_pool_config_audit
  FOR EACH ROW
  EXECUTE FUNCTION suppress_master_admin_prize_pool_audit();

-- SYSTEM_SETTINGS_AUDIT_LOG: Suppress master_admin entries
CREATE OR REPLACE FUNCTION suppress_master_admin_system_settings_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Block INSERT if changed_by is master_admin
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.changed_by
    AND role = 'master_admin'
  ) THEN
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_suppress_master_admin_system_settings_audit ON system_settings_audit_log;
CREATE TRIGGER trigger_suppress_master_admin_system_settings_audit
  BEFORE INSERT ON system_settings_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION suppress_master_admin_system_settings_audit();

-- TIER_ACHIEVEMENT_BONUS_CONFIG_AUDIT: Suppress master_admin entries
CREATE OR REPLACE FUNCTION suppress_master_admin_achievement_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Block INSERT if changed_by is master_admin
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.changed_by
    AND role = 'master_admin'
  ) THEN
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_suppress_master_admin_achievement_audit ON tier_achievement_bonus_config_audit;
CREATE TRIGGER trigger_suppress_master_admin_achievement_audit
  BEFORE INSERT ON tier_achievement_bonus_config_audit
  FOR EACH ROW
  EXECUTE FUNCTION suppress_master_admin_achievement_audit();

-- ESCALATION_HISTORY: Suppress master_admin entries
CREATE OR REPLACE FUNCTION suppress_master_admin_escalation_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Block INSERT if escalated_by is master_admin
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.escalated_by
    AND role = 'master_admin'
  ) THEN
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_suppress_master_admin_escalation ON escalation_history;
CREATE TRIGGER trigger_suppress_master_admin_escalation
  BEFORE INSERT ON escalation_history
  FOR EACH ROW
  EXECUTE FUNCTION suppress_master_admin_escalation_history();

-- ATTENDANCE_CORRECTIONS: Suppress master_admin entries
CREATE OR REPLACE FUNCTION suppress_master_admin_attendance_corrections()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Block INSERT if corrected_by is master_admin
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.corrected_by_admin_id
    AND role = 'master_admin'
  ) THEN
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_suppress_master_admin_attendance_corrections ON attendance_corrections;
CREATE TRIGGER trigger_suppress_master_admin_attendance_corrections
  BEFORE INSERT ON attendance_corrections
  FOR EACH ROW
  EXECUTE FUNCTION suppress_master_admin_attendance_corrections();

-- ============================================================
-- VERIFICATION QUERY
-- ============================================================

-- Verify all triggers are created
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%suppress_master_admin%'
ORDER BY event_object_table;