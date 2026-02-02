-- Add preferred_language column to profiles table for member language persistence
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'es', 'fr', 'bn'));

COMMENT ON COLUMN profiles.preferred_language IS 'Member-selected language preference for Members Portal (persists across sessions)';