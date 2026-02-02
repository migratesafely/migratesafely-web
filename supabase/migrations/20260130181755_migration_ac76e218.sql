-- ====================================================================
-- PROMPT A5.6: MEMBER EXPERIENCE POLISH (PUBLIC TEASER + PERSONALIZED WELCOME)
-- ====================================================================
-- Scope: UX messaging, welcome detection, public page teasers
-- Rules: ADDITIVE ONLY, NO business logic changes
-- ====================================================================

-- Add welcome_seen flag to profiles (lightweight tracking)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS welcome_seen BOOLEAN DEFAULT false;

-- Create index for efficient welcome check queries
CREATE INDEX IF NOT EXISTS idx_profiles_welcome_seen 
ON profiles(id, welcome_seen) 
WHERE welcome_seen = false;

-- Add comment for documentation
COMMENT ON COLUMN profiles.welcome_seen IS 'Tracks if member has seen their first-login welcome message';

-- RLS policies remain unchanged (welcome_seen follows existing profile RLS)

SELECT 'PROMPT A5.6: Member Experience Polish migration completed successfully' AS status;