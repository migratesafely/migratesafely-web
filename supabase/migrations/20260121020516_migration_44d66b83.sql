-- =====================================================
-- PHASE 8: SCAMMER REPORTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS scammer_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scammer_name TEXT NOT NULL,
  scammer_contact TEXT,
  scammer_company TEXT,
  incident_description TEXT NOT NULL,
  evidence_file_urls TEXT[],
  incident_date DATE,
  amount_lost DECIMAL(10,2),
  currency TEXT,
  status report_status NOT NULL DEFAULT 'submitted',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE scammer_reports ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_scammer_reports_reported_by ON scammer_reports(reported_by);
CREATE INDEX idx_scammer_reports_status ON scammer_reports(status);
CREATE INDEX idx_scammer_reports_published ON scammer_reports(is_published);

-- RLS Policies
CREATE POLICY "Users can view their own reports" ON scammer_reports
  FOR SELECT USING (auth.uid() = reported_by);

CREATE POLICY "Members can view published reports" ON scammer_reports
  FOR SELECT USING (
    is_published = TRUE AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'member'
    )
  );

CREATE POLICY "Users can create reports" ON scammer_reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Admins can view all reports" ON scammer_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'manager_admin', 'worker_admin')
    )
  );

CREATE POLICY "Admins can update reports" ON scammer_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'manager_admin', 'worker_admin')
    )
  );