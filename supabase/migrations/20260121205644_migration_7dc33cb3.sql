-- Create agent_request_messages table
CREATE TABLE IF NOT EXISTS agent_request_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES agent_requests(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('MEMBER', 'ADMIN')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agent_request_messages ENABLE ROW LEVEL SECURITY;

-- Members can view messages for their own requests
CREATE POLICY "Members can view own request messages" ON agent_request_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agent_requests
      WHERE agent_requests.id = agent_request_messages.request_id
      AND agent_requests.member_user_id = auth.uid()
    )
  );

-- Members can create messages for their own requests
CREATE POLICY "Members can create own messages" ON agent_request_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agent_requests
      WHERE agent_requests.id = agent_request_messages.request_id
      AND agent_requests.member_user_id = auth.uid()
    )
    AND sender_user_id = auth.uid()
    AND sender_role = 'MEMBER'
  );

-- Admins can view all messages
CREATE POLICY "Admins can view all messages" ON agent_request_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = ANY (ARRAY['super_admin'::user_role, 'manager_admin'::user_role, 'worker_admin'::user_role])
    )
  );

-- Admins can create messages
CREATE POLICY "Admins can create messages" ON agent_request_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = ANY (ARRAY['super_admin'::user_role, 'manager_admin'::user_role, 'worker_admin'::user_role])
    )
    AND sender_user_id = auth.uid()
    AND sender_role = 'ADMIN'
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_request_messages_request_id ON agent_request_messages(request_id);
CREATE INDEX IF NOT EXISTS idx_agent_request_messages_created_at ON agent_request_messages(created_at);