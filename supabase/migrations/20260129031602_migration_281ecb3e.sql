-- Create payment_requests table for payout approvals
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES profiles(id),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('referral_bonus', 'tier_bonus', 'withdrawal')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency_code TEXT NOT NULL,
  source_transaction_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'failed')),
  requested_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES profiles(id),
  admin_notes TEXT,
  rejection_reason TEXT,
  bank_details_snapshot JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_requests_member_id ON payment_requests(member_id);
CREATE INDEX idx_payment_requests_status ON payment_requests(status);
CREATE INDEX idx_payment_requests_payment_type ON payment_requests(payment_type);

COMMENT ON TABLE payment_requests IS 'Tracks all payout requests requiring admin approval';
COMMENT ON COLUMN payment_requests.bank_details_snapshot IS 'Snapshot of bank details at time of request (immutable)';
COMMENT ON COLUMN payment_requests.source_transaction_id IS 'Links to wallet_transactions table';