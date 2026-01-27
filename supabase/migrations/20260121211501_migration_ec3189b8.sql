-- Create message_recipients table
CREATE TABLE IF NOT EXISTS message_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  folder TEXT NOT NULL DEFAULT 'INBOX' CHECK (folder IN ('INBOX', 'SENT', 'TRASH')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_recipients table

-- Users can view their own message recipients
CREATE POLICY "Users can view own message recipients" ON message_recipients
FOR SELECT USING (
  auth.uid() = recipient_user_id
);

-- Users can update their own message recipients (mark as read, move to trash)
CREATE POLICY "Users can update own message recipients" ON message_recipients
FOR UPDATE USING (
  auth.uid() = recipient_user_id
)
WITH CHECK (
  auth.uid() = recipient_user_id
);

-- Admins can view all message recipients
CREATE POLICY "Admins can view all message recipients" ON message_recipients
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = ANY(ARRAY['super_admin'::user_role, 'manager_admin'::user_role, 'worker_admin'::user_role])
  )
);

-- System can create message recipients (for broadcast messages)
CREATE POLICY "System can create message recipients" ON message_recipients
FOR INSERT WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_message_recipients_message_id ON message_recipients(message_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_recipient_folder ON message_recipients(recipient_user_id, folder);
CREATE INDEX IF NOT EXISTS idx_message_recipients_recipient_read ON message_recipients(recipient_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_message_recipients_created_at ON message_recipients(created_at);