-- =====================================================
-- PHASE 2: EXTEND PROFILES TABLE
-- =====================================================

-- Drop existing policies to recreate with proper role-based access
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Add new columns to existing profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'member',
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS government_id_type TEXT,
ADD COLUMN IF NOT EXISTS government_id_number TEXT,
ADD COLUMN IF NOT EXISTS government_id_file_url TEXT,
ADD COLUMN IF NOT EXISTS selfie_file_url TEXT,
ADD COLUMN IF NOT EXISTS membership_number INTEGER UNIQUE,
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by_code TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'BD',
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'bn',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS created_by_admin_id UUID,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_membership_number ON profiles(membership_number);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_government_id ON profiles(government_id_number);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone_number);

-- Add unique constraint for government ID to prevent duplicate memberships
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_government_id ON profiles(government_id_number) WHERE deleted_at IS NULL;

-- Add unique constraint for email
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_email ON profiles(email) WHERE deleted_at IS NULL;