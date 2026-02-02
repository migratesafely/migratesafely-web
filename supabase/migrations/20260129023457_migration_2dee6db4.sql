-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Members can update own language preference" ON profiles;

CREATE POLICY "Members can update own language preference"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);