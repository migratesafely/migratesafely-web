-- =====================================================
-- PHASE 10: FINANCIAL TRACKING TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS company_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL, -- 'income', 'expense', 'payroll', 'rent', 'prize_payout'
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  description TEXT,
  transaction_date DATE NOT NULL,
  reference_id UUID, -- Can reference payments, withdrawals, etc.
  reference_type TEXT, -- 'payment', 'withdrawal', 'prize', etc.
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE company_accounts ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_company_accounts_type ON company_accounts(transaction_type);
CREATE INDEX idx_company_accounts_date ON company_accounts(transaction_date);
CREATE INDEX idx_company_accounts_category ON company_accounts(category);

-- RLS Policies
CREATE POLICY "Only super admins can view company accounts" ON company_accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

CREATE POLICY "Super and manager admins can insert transactions" ON company_accounts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'manager_admin')
    )
  );

CREATE POLICY "Super admins can update transactions" ON company_accounts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Embassy directory table
CREATE TABLE IF NOT EXISTS embassies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  embassy_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  services_offered TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE embassies ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_embassies_country_code ON embassies(country_code);
CREATE INDEX idx_embassies_active ON embassies(is_active);

-- RLS Policies
CREATE POLICY "Members can view active embassies" ON embassies
  FOR SELECT USING (
    is_active = TRUE AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'member'
    )
  );

CREATE POLICY "Admins can view all embassies" ON embassies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'manager_admin', 'worker_admin')
    )
  );

CREATE POLICY "Admins can manage embassies" ON embassies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'manager_admin')
    )
  );