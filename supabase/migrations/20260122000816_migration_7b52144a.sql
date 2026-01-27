-- Create identity_verifications table
CREATE TABLE identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  nationality TEXT NOT NULL,
  id_number TEXT NOT NULL,
  id_type TEXT NOT NULL CHECK (id_type IN ('national_id', 'passport', 'driving_license')),
  id_front_url TEXT NOT NULL,
  id_back_url TEXT,
  selfie_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own verification" 
  ON identity_verifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification" 
  ON identity_verifications FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending/rejected verification" 
  ON identity_verifications FOR UPDATE 
  USING (auth.uid() = user_id AND status IN ('PENDING', 'REJECTED'));

CREATE POLICY "Admins can view all verifications" 
  ON identity_verifications FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'manager_admin')
    )
  );

CREATE POLICY "Admins can update verifications" 
  ON identity_verifications FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'manager_admin')
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_identity_verifications_user_id ON identity_verifications(user_id);
CREATE INDEX idx_identity_verifications_status ON identity_verifications(status);