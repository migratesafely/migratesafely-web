-- STEP 3: Rename chairman approval columns in expense_requests to super_admin
ALTER TABLE expense_requests 
  RENAME COLUMN chairman_approval_required TO super_admin_approval_required;

ALTER TABLE expense_requests
  RENAME COLUMN chairman_approved TO super_admin_approved;

ALTER TABLE expense_requests
  RENAME COLUMN chairman_approved_by TO super_admin_approved_by;

ALTER TABLE expense_requests
  RENAME COLUMN chairman_approved_at TO super_admin_approved_at;

ALTER TABLE expense_requests
  RENAME COLUMN chairman_notes TO super_admin_notes;

-- Update foreign key constraint name
ALTER TABLE expense_requests 
  DROP CONSTRAINT IF EXISTS expense_requests_chairman_approved_by_fkey;

ALTER TABLE expense_requests
  ADD CONSTRAINT expense_requests_super_admin_approved_by_fkey
  FOREIGN KEY (super_admin_approved_by) REFERENCES employees(id);

-- Update index name  
DROP INDEX IF EXISTS idx_expense_requests_chairman_pending;
CREATE INDEX idx_expense_requests_super_admin_pending 
  ON expense_requests(super_admin_approval_required, super_admin_approved);

COMMENT ON COLUMN expense_requests.super_admin_approval_required IS 'TRUE if amount > 50,000 BDT - Super Admin approval is MANDATORY';
COMMENT ON COLUMN expense_requests.super_admin_approved IS 'TRUE if Super Admin has approved the expense';
COMMENT ON COLUMN expense_requests.super_admin_approved_by IS 'Employee ID of Super Admin who approved (must have super_admin user_role)';
COMMENT ON COLUMN expense_requests.super_admin_notes IS 'Super Admin approval notes';