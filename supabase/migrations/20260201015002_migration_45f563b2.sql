-- Create payslips storage bucket safely
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payslips',
  'payslips',
  false,
  52428800, -- 50MB limit
  ARRAY['text/html', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to ensure clean state (if any partial creation happened)
DROP POLICY IF EXISTS "Admin and HR can upload payslips" ON storage.objects;
DROP POLICY IF EXISTS "Admin and HR can view payslips" ON storage.objects;
DROP POLICY IF EXISTS "Employees can view their own payslips" ON storage.objects;

-- Create RLS policies for payslips bucket
CREATE POLICY "Admin and HR can upload payslips"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payslips' AND
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.user_id = auth.uid()
    AND (
      e.department = 'hr' OR
      e.role_category IN ('chairman', 'managing_director', 'general_manager')
    )
  )
);

CREATE POLICY "Admin and HR can view payslips"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payslips' AND
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.user_id = auth.uid()
    AND (
      e.department = 'hr' OR
      e.role_category IN ('chairman', 'managing_director', 'general_manager')
    )
  )
);

CREATE POLICY "Employees can view their own payslips"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payslips' AND
  (storage.foldername(name))[3] = (
    SELECT e.id::text FROM employees e WHERE e.user_id = auth.uid()
  )
);