-- Step 1: Drop the dependent policy
DROP POLICY IF EXISTS hr_managers_view_escalations ON hr_escalations;