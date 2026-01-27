-- Add missing fields to job_listings table for PHASE HR-4 compliance

-- Add is_published boolean (in addition to published_at timestamp)
ALTER TABLE job_listings
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Add application_email with default
ALTER TABLE job_listings
ADD COLUMN IF NOT EXISTS application_email TEXT DEFAULT 'careers@migratesafely.com';

-- Add qualifications field (separate from requirements)
ALTER TABLE job_listings
ADD COLUMN IF NOT EXISTS qualifications TEXT;

-- Add qualifications_bn for bilingual support
ALTER TABLE job_listings
ADD COLUMN IF NOT EXISTS qualifications_bn TEXT;

-- Update existing open jobs to be published
UPDATE job_listings
SET is_published = true
WHERE status = 'open' AND published_at IS NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN job_listings.is_published IS 'Controls visibility on public careers page - independent of status';
COMMENT ON COLUMN job_listings.application_email IS 'Email address where applications should be sent - defaults to careers@migratesafely.com';
COMMENT ON COLUMN job_listings.qualifications IS 'Required qualifications and certifications for the position';