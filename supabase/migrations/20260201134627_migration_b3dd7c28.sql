-- Step 1: Drop old chairman columns from expense_requests
ALTER TABLE expense_requests 
  DROP COLUMN IF EXISTS requires_chairman_approval,
  DROP COLUMN IF EXISTS chairman_approved,
  DROP COLUMN IF EXISTS chairman_approved_by,
  DROP COLUMN IF EXISTS chairman_approved_at,
  DROP COLUMN IF EXISTS chairman_notes;

COMMENT ON TABLE expense_requests IS 'Approval hierarchy: dept_head → gm → md → super_admin (highest local authority)';