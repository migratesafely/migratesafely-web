-- =====================================================
-- PHASE 4: MEMBERSHIPS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  membership_number INTEGER NOT NULL,
  status membership_status NOT NULL DEFAULT 'pending_payment',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  fee_amount DECIMAL(10,2) NOT NULL,
  fee_currency TEXT NOT NULL,
  is_renewal BOOLEAN DEFAULT FALSE,
  previous_membership_id UUID REFERENCES memberships(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_status ON memberships(status);
CREATE INDEX idx_memberships_end_date ON memberships(end_date);
CREATE INDEX idx_memberships_number ON memberships(membership_number);

-- RLS Policies
CREATE POLICY "Users can view their own memberships" ON memberships
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all memberships" ON memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'manager_admin', 'worker_admin')
    )
  );

CREATE POLICY "Admins can insert memberships" ON memberships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'manager_admin', 'worker_admin')
    )
  );

CREATE POLICY "Admins can update memberships" ON memberships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'manager_admin', 'worker_admin')
    )
  );