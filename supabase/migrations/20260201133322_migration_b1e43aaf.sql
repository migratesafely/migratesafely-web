-- STEP 6: Update audit log action types documentation
COMMENT ON TABLE expense_approval_audit IS 'PROMPT A1.1: Immutable audit trail for all expense approval actions. Super Admin is final authority for expenses > 50k BDT. No updates or deletes allowed.';

-- Update CHECK constraint on expense_approval_audit
ALTER TABLE expense_approval_audit DROP CONSTRAINT IF EXISTS expense_approval_audit_action_type_check;
ALTER TABLE expense_approval_audit ADD CONSTRAINT expense_approval_audit_action_type_check
  CHECK (action_type IN (
    'submitted',
    'dept_head_approved', 'dept_head_rejected',
    'gm_approved', 'gm_rejected',
    'md_approved', 'md_rejected',
    'super_admin_approved', 'super_admin_rejected',
    'payment_completed',
    'cancelled'
  ));

COMMENT ON COLUMN expense_approval_audit.action_type IS 'Escalation chain: dept_head → gm → md → super_admin (for >50k BDT)';