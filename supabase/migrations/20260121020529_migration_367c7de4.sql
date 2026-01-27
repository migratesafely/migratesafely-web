-- =====================================================
-- PHASE 9: PRIZE DRAWS TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS prize_draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  prize_value DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  number_of_winners INTEGER NOT NULL DEFAULT 1,
  draw_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status prize_draw_status NOT NULL DEFAULT 'upcoming',
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Enable RLS
ALTER TABLE prize_draws ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_prize_draws_status ON prize_draws(status);
CREATE INDEX idx_prize_draws_draw_date ON prize_draws(draw_date);

-- RLS Policies
CREATE POLICY "Members can view active and completed draws" ON prize_draws
  FOR SELECT USING (
    status IN ('active', 'completed') AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'member'
    )
  );

CREATE POLICY "Admins can view all draws" ON prize_draws
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'manager_admin', 'worker_admin')
    )
  );

CREATE POLICY "Super admins can manage draws" ON prize_draws
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Prize draw entries table (automatic for paid members)
CREATE TABLE IF NOT EXISTS prize_draw_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prize_draw_id UUID NOT NULL REFERENCES prize_draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  is_winner BOOLEAN DEFAULT FALSE,
  won_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prize_draw_id, user_id)
);

-- Enable RLS
ALTER TABLE prize_draw_entries ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_prize_entries_draw_id ON prize_draw_entries(prize_draw_id);
CREATE INDEX idx_prize_entries_user_id ON prize_draw_entries(user_id);
CREATE INDEX idx_prize_entries_winner ON prize_draw_entries(is_winner);

-- RLS Policies
CREATE POLICY "Users can view their own entries" ON prize_draw_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all entries" ON prize_draw_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'manager_admin', 'worker_admin')
    )
  );

CREATE POLICY "System can create entries" ON prize_draw_entries
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can update entries" ON prize_draw_entries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'manager_admin')
    )
  );