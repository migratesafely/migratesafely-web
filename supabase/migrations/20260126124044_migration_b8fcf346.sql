-- PHASE AGENT-ONBOARD-1A: Agent approval audit logging and enforcement

-- Create audit log table for all agent status changes
CREATE TABLE IF NOT EXISTS agent_approval_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_role user_role NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('approve', 'reject', 'suspend', 'reinstate', 'apply')),
  previous_role user_role,
  new_role user_role NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_agent_approval_audit_agent ON agent_approval_audit_log(agent_user_id);
CREATE INDEX IF NOT EXISTS idx_agent_approval_audit_admin ON agent_approval_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_agent_approval_audit_created ON agent_approval_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_approval_audit_action ON agent_approval_audit_log(action_type);

-- Enable RLS
ALTER TABLE agent_approval_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super_admin and manager_admin can view audit logs
CREATE POLICY "Only senior admins can view agent approval audit logs"
ON agent_approval_audit_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'manager_admin')
  )
);

-- Only super_admin and manager_admin can insert audit logs (via API)
CREATE POLICY "Only senior admins can create audit log entries"
ON agent_approval_audit_log FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'manager_admin')
  )
);

-- Add helpful comment
COMMENT ON TABLE agent_approval_audit_log IS 'Audit trail for all agent approval, rejection, suspension, and reinstatement actions. Only super_admin and manager_admin can perform these actions.';

-- Add trigger to prevent worker_admin from changing agent roles (database-level enforcement)
CREATE OR REPLACE FUNCTION enforce_agent_approval_authority()
RETURNS TRIGGER AS $$
DECLARE
  admin_role user_role;
BEGIN
  -- Get the role of the user making the change
  SELECT role INTO admin_role FROM profiles WHERE id = auth.uid();
  
  -- Check if the role change involves agent roles
  IF (OLD.role IN ('agent_pending', 'agent', 'agent_suspended') 
      OR NEW.role IN ('agent_pending', 'agent', 'agent_suspended'))
     AND OLD.role != NEW.role THEN
    
    -- Only super_admin and manager_admin can change agent roles
    IF admin_role NOT IN ('super_admin', 'manager_admin') THEN
      RAISE EXCEPTION 'Only super_admin and manager_admin can approve, reject, suspend, or reinstate agents'
        USING ERRCODE = '42501'; -- insufficient_privilege
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS enforce_agent_approval_authority_trigger ON profiles;
CREATE TRIGGER enforce_agent_approval_authority_trigger
  BEFORE UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION enforce_agent_approval_authority();

COMMENT ON FUNCTION enforce_agent_approval_authority() IS 'Database-level enforcement: Only super_admin and manager_admin can change agent roles (approve, reject, suspend, reinstate). Prevents worker_admin from modifying agent status.';