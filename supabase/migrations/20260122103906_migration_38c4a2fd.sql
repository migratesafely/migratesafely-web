-- Add agent_number column to profiles table (nullable, unique)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS agent_number TEXT UNIQUE;

-- Add agent_status column to profiles table with default PENDING
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS agent_status TEXT DEFAULT 'PENDING';

-- Create index on agent_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_agent_number ON profiles(agent_number);

-- Create index on agent_status for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_agent_status ON profiles(agent_status);

-- Add check constraint to ensure agent_status is valid
ALTER TABLE profiles 
ADD CONSTRAINT check_agent_status 
CHECK (agent_status IS NULL OR agent_status IN ('PENDING', 'APPROVED', 'REJECTED', 'BANNED'));

-- Add comment to clarify usage
COMMENT ON COLUMN profiles.agent_number IS 'Agent identification number - only for profiles with role=agent';
COMMENT ON COLUMN profiles.agent_status IS 'Agent approval status - only for profiles with role=agent (PENDING/APPROVED/REJECTED/BANNED)';