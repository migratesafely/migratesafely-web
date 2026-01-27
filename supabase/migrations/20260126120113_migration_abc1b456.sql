-- Add archive functionality to job_listings table for PHASE HR-3A

-- Add archived_at column to track when a job was archived
ALTER TABLE job_listings
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add comment to document the archive fields
COMMENT ON COLUMN job_listings.archived_at IS 'Timestamp when the job was archived - archived jobs are hidden from public and read-only in admin panel';
COMMENT ON COLUMN job_listings.archived_by IS 'Admin user who archived the job';

-- Update the public read policy to also exclude archived jobs
DROP POLICY IF EXISTS "Public can view published open jobs" ON job_listings;

CREATE POLICY "Public can view published open non-archived jobs"
ON job_listings
FOR SELECT
USING (status = 'open' AND is_published = true AND archived_at IS NULL);

-- Add policy comment
COMMENT ON POLICY "Public can view published open non-archived jobs" ON job_listings IS 'Public can only see jobs that are open, published, and not archived';