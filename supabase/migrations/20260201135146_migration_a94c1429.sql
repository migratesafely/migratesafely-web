-- Also update hr_escalations table role_category column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hr_escalations' 
    AND column_name = 'role_category'
    AND data_type = 'USER-DEFINED'
  ) THEN
    -- Add temporary column
    ALTER TABLE hr_escalations ADD COLUMN role_category_new employee_role_category;
    
    -- Copy data
    UPDATE hr_escalations 
    SET role_category_new = CASE 
      WHEN role_category::text = 'chairman' THEN 'management'::employee_role_category
      ELSE role_category::text::employee_role_category
    END;
    
    -- Drop old and rename
    ALTER TABLE hr_escalations DROP COLUMN role_category;
    ALTER TABLE hr_escalations RENAME COLUMN role_category_new TO role_category;
  END IF;
END $$;