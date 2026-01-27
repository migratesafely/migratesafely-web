-- Add optional scammer photo and last known address to scammer_reports table
ALTER TABLE scammer_reports
ADD COLUMN IF NOT EXISTS scammer_photo_url TEXT,
ADD COLUMN IF NOT EXISTS last_known_address TEXT;

-- Add comment for documentation
COMMENT ON COLUMN scammer_reports.scammer_photo_url IS 'Optional photo of the scammer (uploaded to storage)';
COMMENT ON COLUMN scammer_reports.last_known_address IS 'Optional last known address or location of the scammer';