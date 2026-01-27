-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('SYSTEM', 'ADMIN', 'AGENT', 'MEMBER')),
  subject TEXT,
  body TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('DIRECT', 'BROADCAST', 'SYSTEM', 'SUPPORT')),
  target_group TEXT CHECK (target_group IN ('ALL_MEMBERS', 'ALL_AGENTS', 'COUNTRY_MEMBERS', 'COUNTRY_AGENTS', 'CUSTOM')),
  target_country_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages table

-- Users can view messages they sent
CREATE POLICY "Users can view own sent messages" ON messages
FOR SELECT USING (
  auth.uid() = sender_user_id
);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = ANY(ARRAY['super_admin'::user_role, 'manager_admin'::user_role, 'worker_admin'::user_role])
  )
);

-- Admins can create messages
CREATE POLICY "Admins can create messages" ON messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = ANY(ARRAY['super_admin'::user_role, 'manager_admin'::user_role, 'worker_admin'::user_role])
  )
);

-- Members can create DIRECT messages
CREATE POLICY "Members can create direct messages" ON messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_user_id AND
  message_type = 'DIRECT' AND
  sender_role = 'MEMBER'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_user_id ON messages(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);