-- Update RLS policies to ensure proper access control per PHASE HR-4 requirements

-- Drop the existing public read policy
DROP POLICY IF EXISTS "Anyone can view open job listings" ON job_listings;

-- Create new public read policy: ONLY published jobs visible to public
CREATE POLICY "Public can view published open jobs"
ON job_listings
FOR SELECT
TO public
USING (
  status = 'open' 
  AND is_published = true
  AND (published_at IS NULL OR published_at <= now())
);

-- Ensure admin policies are correct
DROP POLICY IF EXISTS "Admins can manage job listings" ON job_listings;

CREATE POLICY "Admins can manage all job listings"
ON job_listings
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'manager_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'manager_admin')
  )
);

-- Add index on is_published for better query performance
CREATE INDEX IF NOT EXISTS idx_job_listings_published ON job_listings(is_published);
CREATE INDEX IF NOT EXISTS idx_job_listings_status_published ON job_listings(status, is_published);

COMMENT ON TABLE job_listings IS 'Job postings for HR/Careers page - public read access only for published open jobs, admin write access only';