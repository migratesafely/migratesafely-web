-- 1. Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Create job_listings table (IF NOT EXISTS to be safe)
CREATE TABLE IF NOT EXISTS job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_bn TEXT,
  department TEXT NOT NULL,
  department_bn TEXT,
  description TEXT NOT NULL,
  description_bn TEXT,
  requirements TEXT NOT NULL,
  requirements_bn TEXT,
  location_country TEXT NOT NULL,
  location_city TEXT,
  location_type TEXT NOT NULL CHECK (location_type IN ('remote', 'on-site', 'hybrid')),
  employment_type TEXT NOT NULL CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship')),
  salary_range TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
  published_at TIMESTAMP WITH TIME ZONE,
  closes_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Drop existing policies to avoid conflicts if re-running
DROP POLICY IF EXISTS "Anyone can view open job listings" ON job_listings;
DROP POLICY IF EXISTS "Admins can manage job listings" ON job_listings;

CREATE POLICY "Anyone can view open job listings" ON job_listings
  FOR SELECT
  USING (status = 'open' AND published_at IS NOT NULL AND published_at <= NOW());

CREATE POLICY "Admins can manage job listings" ON job_listings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'manager_admin')
    )
  );

-- 5. Trigger
DROP TRIGGER IF EXISTS update_job_listings_updated_at ON job_listings;
CREATE TRIGGER update_job_listings_updated_at
  BEFORE UPDATE ON job_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();