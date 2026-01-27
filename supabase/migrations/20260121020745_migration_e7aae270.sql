-- =====================================================
-- PHASE 16: CREATE STORAGE BUCKETS FOR FILE UPLOADS
-- =====================================================

-- Create storage buckets (Note: These are Supabase storage buckets, not SQL tables)
-- Bucket for government IDs and passports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'identity-documents',
  'identity-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket for live selfies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-selfies',
  'verification-selfies',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket for agent licenses
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent-licenses',
  'agent-licenses',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket for scammer report evidence
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'scammer-evidence',
  'scammer-evidence',
  false,
  20971520, -- 20MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for identity-documents bucket
CREATE POLICY "Users can upload their own identity documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'identity-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own identity documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'identity-documents' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'manager_admin', 'worker_admin')
    )
  )
);

-- Storage policies for verification-selfies bucket
CREATE POLICY "Users can upload their own selfies"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'verification-selfies' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own selfies"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-selfies' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'manager_admin', 'worker_admin')
    )
  )
);

-- Storage policies for agent-licenses bucket
CREATE POLICY "Agents can upload their licenses"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'agent-licenses' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view agent licenses"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'agent-licenses' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'manager_admin', 'worker_admin')
  )
);

-- Storage policies for scammer-evidence bucket
CREATE POLICY "Members can upload scammer evidence"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'scammer-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins and report owners can view evidence"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'scammer-evidence' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'manager_admin', 'worker_admin')
    )
  )
);