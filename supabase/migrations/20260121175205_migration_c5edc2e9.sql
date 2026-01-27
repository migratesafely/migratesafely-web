-- ==========================================
-- PRIZE DRAW PHASE 1A: DATABASE FOUNDATION
-- ==========================================

-- 1) Extend existing prize_draws table
ALTER TABLE prize_draws
ADD COLUMN announcement_status text NOT NULL DEFAULT 'COMING_SOON',
ADD COLUMN announced_at timestamp with time zone,
ADD COLUMN estimated_prize_pool_percentage numeric(5,2) DEFAULT 30,
ADD COLUMN forecast_member_count integer DEFAULT 0,
ADD COLUMN estimated_prize_pool_amount numeric(10,2) DEFAULT 0,
ADD COLUMN estimated_prize_pool_currency text DEFAULT 'BDT',
ADD COLUMN disclaimer_text text;

-- Add check constraint for announcement_status
ALTER TABLE prize_draws
ADD CONSTRAINT prize_draws_announcement_status_check 
CHECK (announcement_status IN ('COMING_SOON', 'ANNOUNCED', 'COMPLETED'));

-- Add comments for documentation
COMMENT ON COLUMN prize_draws.announcement_status IS 'Status of prize draw announcement: COMING_SOON, ANNOUNCED, or COMPLETED';
COMMENT ON COLUMN prize_draws.announced_at IS 'Timestamp when the draw was publicly announced';
COMMENT ON COLUMN prize_draws.estimated_prize_pool_percentage IS 'Percentage of revenue allocated to prize pool (default 30%)';
COMMENT ON COLUMN prize_draws.forecast_member_count IS 'Forecasted number of eligible members for prize pool calculation';
COMMENT ON COLUMN prize_draws.estimated_prize_pool_amount IS 'Calculated estimated total prize pool amount';
COMMENT ON COLUMN prize_draws.estimated_prize_pool_currency IS 'Currency for estimated prize pool';
COMMENT ON COLUMN prize_draws.disclaimer_text IS 'Legal disclaimer text for the prize draw';

-- 2) Create prize_draw_prizes table
CREATE TABLE prize_draw_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id uuid NOT NULL REFERENCES prize_draws(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  prize_type text NOT NULL,
  award_type text NOT NULL,
  prize_value_amount numeric(10,2) NOT NULL,
  currency_code text NOT NULL DEFAULT 'BDT',
  number_of_winners integer NOT NULL DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Add check constraints
ALTER TABLE prize_draw_prizes
ADD CONSTRAINT prize_draw_prizes_type_check 
CHECK (prize_type IN ('EUROPE_PACKAGE', 'MIDDLE_EAST_PACKAGE', 'CASH_SUPPORT', 'OTHER'));

ALTER TABLE prize_draw_prizes
ADD CONSTRAINT prize_draw_prizes_award_type_check 
CHECK (award_type IN ('RANDOM_DRAW', 'COMMUNITY_SUPPORT'));

ALTER TABLE prize_draw_prizes
ADD CONSTRAINT prize_draw_prizes_winners_positive 
CHECK (number_of_winners > 0);

ALTER TABLE prize_draw_prizes
ADD CONSTRAINT prize_draw_prizes_value_positive 
CHECK (prize_value_amount > 0);

-- Create indexes
CREATE INDEX idx_prize_draw_prizes_draw_id ON prize_draw_prizes(draw_id);
CREATE INDEX idx_prize_draw_prizes_type ON prize_draw_prizes(prize_type);
CREATE INDEX idx_prize_draw_prizes_active ON prize_draw_prizes(is_active);

-- Add comments
COMMENT ON TABLE prize_draw_prizes IS 'Defines prizes available for each prize draw';
COMMENT ON COLUMN prize_draw_prizes.prize_type IS 'Type of prize: EUROPE_PACKAGE, MIDDLE_EAST_PACKAGE, CASH_SUPPORT, OTHER';
COMMENT ON COLUMN prize_draw_prizes.award_type IS 'How prize is awarded: RANDOM_DRAW or COMMUNITY_SUPPORT';
COMMENT ON COLUMN prize_draw_prizes.number_of_winners IS 'Number of winners for this specific prize';

-- 3) Create prize_draw_winners table
CREATE TABLE prize_draw_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id uuid NOT NULL REFERENCES prize_draws(id) ON DELETE CASCADE,
  prize_id uuid NOT NULL REFERENCES prize_draw_prizes(id) ON DELETE CASCADE,
  winner_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  award_type text NOT NULL,
  selected_at timestamp with time zone DEFAULT now(),
  selected_by_admin_id uuid REFERENCES profiles(id),
  admin_reason text,
  payout_status text NOT NULL DEFAULT 'PENDING',
  paid_at timestamp with time zone
);

-- Add check constraints
ALTER TABLE prize_draw_winners
ADD CONSTRAINT prize_draw_winners_award_type_check 
CHECK (award_type IN ('RANDOM_DRAW', 'COMMUNITY_SUPPORT'));

ALTER TABLE prize_draw_winners
ADD CONSTRAINT prize_draw_winners_payout_status_check 
CHECK (payout_status IN ('PENDING', 'PAID'));

-- Create indexes
CREATE INDEX idx_prize_draw_winners_draw_id ON prize_draw_winners(draw_id);
CREATE INDEX idx_prize_draw_winners_prize_id ON prize_draw_winners(prize_id);
CREATE INDEX idx_prize_draw_winners_user_id ON prize_draw_winners(winner_user_id);
CREATE INDEX idx_prize_draw_winners_payout_status ON prize_draw_winners(payout_status);
CREATE INDEX idx_prize_draw_winners_award_type ON prize_draw_winners(award_type);

-- Add comments
COMMENT ON TABLE prize_draw_winners IS 'Records all prize draw winners and their payout status';
COMMENT ON COLUMN prize_draw_winners.award_type IS 'Type of award: RANDOM_DRAW or COMMUNITY_SUPPORT';
COMMENT ON COLUMN prize_draw_winners.selected_by_admin_id IS 'Admin who selected the winner (for COMMUNITY_SUPPORT awards)';
COMMENT ON COLUMN prize_draw_winners.admin_reason IS 'Internal admin reason for selection (not shown to public)';
COMMENT ON COLUMN prize_draw_winners.payout_status IS 'Payment status: PENDING or PAID';

-- Enable RLS on new tables
ALTER TABLE prize_draw_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prize_draw_winners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prize_draw_prizes
CREATE POLICY "Super admins can manage prizes"
ON prize_draw_prizes FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

CREATE POLICY "Members can view active prizes"
ON prize_draw_prizes FOR SELECT
TO public
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'member'
  )
);

CREATE POLICY "Admins can view all prizes"
ON prize_draw_prizes FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'manager_admin', 'worker_admin')
  )
);

-- RLS Policies for prize_draw_winners
CREATE POLICY "Super admins can manage winners"
ON prize_draw_winners FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

CREATE POLICY "Manager admins can view winners"
ON prize_draw_winners FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'manager_admin')
  )
);

CREATE POLICY "Users can view their own wins"
ON prize_draw_winners FOR SELECT
TO public
USING (
  auth.uid() = winner_user_id
);