-- Enable RLS on language_availability
ALTER TABLE language_availability ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view language availability
CREATE POLICY "Members can view language availability"
  ON language_availability FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy: Only Super Admin can manage language availability
CREATE POLICY "Only super admin can manage languages"
  ON language_availability FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );