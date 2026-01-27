-- =====================================================
-- PHASE 7: AGENTS TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  license_number TEXT NOT NULL,
  license_file_url TEXT,
  id_file_url TEXT,
  company_name TEXT,
  services_offered TEXT[],
  countries_covered TEXT[],
  status agent_status NOT NULL DEFAULT 'pending_approval',
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  successful_migrations INTEGER DEFAULT 0,
  total_fees_earned DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_license ON agents(license_number);

-- RLS Policies
CREATE POLICY "Agents can view their own profile" ON agents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Agents can insert their application" ON agents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all agents" ON agents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'manager_admin', 'worker_admin')
    )
  );

CREATE POLICY "Admins can update agents" ON agents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'manager_admin', 'worker_admin')
    )
  );

-- Service requests table
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  description TEXT,
  status service_request_status NOT NULL DEFAULT 'submitted',
  assigned_agent_id UUID REFERENCES agents(id),
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  member_feedback TEXT,
  member_rating INTEGER CHECK (member_rating >= 1 AND member_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_service_requests_member_id ON service_requests(member_id);
CREATE INDEX idx_service_requests_agent_id ON service_requests(assigned_agent_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);

-- RLS Policies
CREATE POLICY "Members can view their own requests" ON service_requests
  FOR SELECT USING (auth.uid() = member_id);

CREATE POLICY "Members can create requests" ON service_requests
  FOR INSERT WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Members can update their own requests" ON service_requests
  FOR UPDATE USING (auth.uid() = member_id);

CREATE POLICY "Agents can view assigned requests" ON service_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agents 
      WHERE user_id = auth.uid() 
      AND id = service_requests.assigned_agent_id
    )
  );

CREATE POLICY "Admins can view all requests" ON service_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'manager_admin', 'worker_admin')
    )
  );

CREATE POLICY "Admins can update all requests" ON service_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'manager_admin', 'worker_admin')
    )
  );