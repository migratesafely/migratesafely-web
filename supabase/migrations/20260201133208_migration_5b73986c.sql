-- STEP 2: Update hr_escalations table - remove chairman from escalation levels
-- Update CHECK constraints to remove chairman references

ALTER TABLE hr_escalations DROP CONSTRAINT IF EXISTS hr_escalations_current_level_check;
ALTER TABLE hr_escalations ADD CONSTRAINT hr_escalations_current_level_check 
  CHECK (current_level IN ('hr', 'department_head', 'general_manager', 'managing_director', 'super_admin'));

ALTER TABLE hr_escalations DROP CONSTRAINT IF EXISTS hr_escalations_escalated_to_level_check;
ALTER TABLE hr_escalations ADD CONSTRAINT hr_escalations_escalated_to_level_check
  CHECK (escalated_to_level IN ('hr', 'department_head', 'general_manager', 'managing_director', 'super_admin'));

COMMENT ON TABLE hr_escalations IS 'Employee HR escalations with hierarchical routing (HR → Dept Head → GM → MD → Super Admin). Super Admin is final authority.';