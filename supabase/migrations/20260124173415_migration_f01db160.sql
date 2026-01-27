-- Create agent_verification_requests table
CREATE TABLE agent_verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_number TEXT NOT NULL,
  
  -- Agent details
  agent_name TEXT NOT NULL,
  company_name TEXT,
  phone_number TEXT NOT NULL,
  whatsapp_number TEXT,
  email TEXT,
  website_or_social TEXT,
  agent_country TEXT NOT NULL,
  
  -- Contact context
  contact_method TEXT NOT NULL,
  services JSONB NOT NULL DEFAULT '[]',
  
  -- Risk indicators
  asked_upfront_payment BOOLEAN NOT NULL,
  promised_guarantee BOOLEAN NOT NULL,
  asked_documents_early BOOLEAN NOT NULL,
  refused_license BOOLEAN NOT NULL,
  private_comm_only BOOLEAN NOT NULL,
  
  -- Additional info
  additional_details TEXT,
  evidence_files JSONB DEFAULT '[]',
  
  -- Admin fields
  status TEXT NOT NULL DEFAULT 'pending',
  outcome TEXT,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agent_verification_requests ENABLE ROW LEVEL SECURITY;

-- Members can view their own requests
CREATE POLICY "Members can view their own verification requests"
  ON agent_verification_requests
  FOR SELECT
  USING (auth.uid() = member_id);

-- Members can insert their own requests
CREATE POLICY "Members can submit verification requests"
  ON agent_verification_requests
  FOR INSERT
  WITH CHECK (auth.uid() = member_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all verification requests"
  ON agent_verification_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'manager_admin', 'worker_admin')
    )
  );

-- Admins can update requests
CREATE POLICY "Admins can update verification requests"
  ON agent_verification_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'manager_admin', 'worker_admin')
    )
  );

-- Create index for efficient queries
CREATE INDEX idx_agent_verification_member ON agent_verification_requests(member_id);
CREATE INDEX idx_agent_verification_status ON agent_verification_requests(status);
CREATE INDEX idx_agent_verification_created ON agent_verification_requests(created_at DESC);

COMMENT ON TABLE agent_verification_requests IS 'Member-submitted agent verification requests for scam prevention';
COMMENT ON COLUMN agent_verification_requests.status IS 'Status: pending, under_review, completed';
COMMENT ON COLUMN agent_verification_requests.outcome IS 'Outcome: appears_legitimate, high_risk, unable_to_verify';