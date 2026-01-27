-- =====================================================
-- PHASE 12: ADMIN HIERARCHY TABLE (FIXED)
-- =====================================================

-- Admin hierarchy tracking
CREATE TABLE IF NOT EXISTS admin_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT different_users CHECK (admin_id != created_by)
);

-- Indexes
CREATE INDEX idx_admin_hierarchy_admin ON admin_hierarchy(admin_id);
CREATE INDEX idx_admin_hierarchy_creator ON admin_hierarchy(created_by);

-- RLS Policies
ALTER TABLE admin_hierarchy ENABLE ROW LEVEL SECURITY;

-- Super admins can see all
CREATE POLICY "Super admins can view all hierarchies"
  ON admin_hierarchy FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Managers can see their workers
CREATE POLICY "Managers can view their workers"
  ON admin_hierarchy FOR SELECT
  USING (
    created_by = auth.uid() 
    OR admin_id = auth.uid()
  );

-- Super admins can create managers
CREATE POLICY "Super admins can create managers"
  ON admin_hierarchy FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Managers can create workers
CREATE POLICY "Managers can create workers"
  ON admin_hierarchy FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'manager_admin'
    )
  );