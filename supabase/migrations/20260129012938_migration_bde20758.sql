-- Create loyalty points transactions table
CREATE TABLE loyalty_points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('EARNED', 'REDEEMED', 'EXPIRED', 'ADJUSTED', 'BONUS')),
  points_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_type TEXT NULL,
  reference_id UUID NULL,
  notes TEXT NULL,
  created_by UUID NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE loyalty_points_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Internal portal only
CREATE POLICY "Admins can view all loyalty transactions"
  ON loyalty_points_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'manager_admin', 'worker_admin')
    )
  );

CREATE POLICY "Admins can create loyalty transactions"
  ON loyalty_points_transactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'manager_admin')
    )
  );

CREATE POLICY "System can create loyalty transactions"
  ON loyalty_points_transactions
  FOR INSERT
  WITH CHECK (created_by IS NULL);

CREATE POLICY "Members can view their own loyalty transactions"
  ON loyalty_points_transactions
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'member'
    )
  );

-- Indexes
CREATE INDEX idx_loyalty_transactions_user_id ON loyalty_points_transactions(user_id);
CREATE INDEX idx_loyalty_transactions_type ON loyalty_points_transactions(transaction_type);
CREATE INDEX idx_loyalty_transactions_created ON loyalty_points_transactions(created_at DESC);
CREATE INDEX idx_loyalty_transactions_reference ON loyalty_points_transactions(reference_type, reference_id);

COMMENT ON TABLE loyalty_points_transactions IS 'Tracks all loyalty points transactions - internal audit trail only';