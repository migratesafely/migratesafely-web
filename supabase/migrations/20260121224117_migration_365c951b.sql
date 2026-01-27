-- PHASE UA-2: Add member agreement acceptance fields to profiles table

ALTER TABLE profiles
ADD COLUMN accepted_member_agreement BOOLEAN DEFAULT false,
ADD COLUMN accepted_member_agreement_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN accepted_member_agreement_version TEXT;

COMMENT ON COLUMN profiles.accepted_member_agreement IS 'Whether user has accepted the Member User Agreement';
COMMENT ON COLUMN profiles.accepted_member_agreement_at IS 'Timestamp when user accepted the Member User Agreement';
COMMENT ON COLUMN profiles.accepted_member_agreement_version IS 'Version of Member User Agreement accepted (e.g., "2026-01-21")';