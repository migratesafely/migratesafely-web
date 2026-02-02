-- Create member_bank_details table for verified bank account information
CREATE TABLE IF NOT EXISTS member_bank_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_holder_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  branch_name TEXT,
  account_number TEXT NOT NULL,
  country_code TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES profiles(id),
  verification_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(member_id)
);

CREATE INDEX idx_member_bank_details_member_id ON member_bank_details(member_id);
CREATE INDEX idx_member_bank_details_verified ON member_bank_details(is_verified);

COMMENT ON TABLE member_bank_details IS 'Stores member bank account details for payout processing';
COMMENT ON COLUMN member_bank_details.account_holder_name IS 'Must match member legal name in profile';
COMMENT ON COLUMN member_bank_details.is_verified IS 'Admin verification required before payouts allowed';