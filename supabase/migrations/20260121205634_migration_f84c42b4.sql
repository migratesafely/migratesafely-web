-- Create agent_requests table
CREATE TABLE IF NOT EXISTS agent_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_country_code TEXT NOT NULL,
  destination_country_code TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('WORK', 'STUDENT', 'FAMILY', 'VISIT', 'OTHER')),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'COMPLETED', 'REJECTED')),
  assigned_agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_by_admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  member_feedback TEXT,
  outcome_status TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK (outcome_status IN ('SUCCESS', 'FAILED', 'UNKNOWN')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agent_requests ENABLE ROW LEVEL SECURITY;

-- Members can view their own requests
CREATE POLICY "Members can view own requests" ON agent_requests
  FOR SELECT
  USING (auth.uid() = member_user_id);

-- Members can create their own requests
CREATE POLICY "Members can create requests" ON agent_requests
  FOR INSERT
  WITH CHECK (auth.uid() = member_user_id);

-- Members can update their own feedback
CREATE POLICY "Members can update own feedback" ON agent_requests
  FOR UPDATE
  USING (auth.uid() = member_user_id)
  WITH CHECK (auth.uid() = member_user_id);

-- Admins can view all requests (using correct enum values)
CREATE POLICY "Admins can view all requests" ON agent_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = ANY (ARRAY['super_admin'::user_role, 'manager_admin'::user_role, 'worker_admin'::user_role])
    )
  );

-- Admins can update all requests
CREATE POLICY "Admins can update all requests" ON agent_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = ANY (ARRAY['super_admin'::user_role, 'manager_admin'::user_role, 'worker_admin'::user_role])
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_requests_member_user_id ON agent_requests(member_user_id);
CREATE INDEX IF NOT EXISTS idx_agent_requests_status ON agent_requests(status);
CREATE INDEX IF NOT EXISTS idx_agent_requests_assigned_agent_id ON agent_requests(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_requests_created_at ON agent_requests(created_at DESC);