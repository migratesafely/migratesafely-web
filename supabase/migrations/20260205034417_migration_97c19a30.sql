-- MASTER_ADMIN BACK DOOR FOUNDATION
-- CRITICAL: This role has absolute authority and must remain completely invisible

-- Helper function to check if current user is master_admin
CREATE OR REPLACE FUNCTION is_master_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'master_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_master_admin IS 'Check if current user has master_admin role. Used for access control.';

-- Grant master_admin ABSOLUTE access to profiles table for super_admin management
CREATE POLICY "master_admin_absolute_profiles_access" ON profiles
FOR ALL
TO authenticated
USING (is_master_admin())
WITH CHECK (is_master_admin());

-- Ensure master_admin can modify ANY user's role (including super_admin)
CREATE POLICY "master_admin_role_override" ON profiles
FOR UPDATE
TO authenticated
USING (is_master_admin())
WITH CHECK (is_master_admin());

-- INVISIBILITY: Filter master_admin from ALL admin lists
-- This policy ensures master_admin users are NEVER returned in queries unless explicitly requested
CREATE POLICY "hide_master_admin_from_lists" ON profiles
FOR SELECT
TO authenticated
USING (
  role != 'master_admin' OR is_master_admin()
);