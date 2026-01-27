-- Add last_hardship_request_year column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_hardship_request_year INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN profiles.last_hardship_request_year IS 'Tracks the year of the last Community Hardship Draw request submission (one per year limit)';