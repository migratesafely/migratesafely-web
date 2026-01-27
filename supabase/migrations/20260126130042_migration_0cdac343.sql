-- PHASE AGENT-REQUEST-TIMELINE: Immutable timeline tracking for agent requests

-- Create agent request timeline table
CREATE TABLE agent_request_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_request_id UUID NOT NULL REFERENCES agent_requests(id) ON DELETE CASCADE,
  
  -- Event metadata
  event_type TEXT NOT NULL, -- 'REQUEST_CREATED', 'AGENT_ASSIGNED', 'STATUS_CHANGED', 'MESSAGE_SENT', 'ADMIN_NOTE', 'ESCALATED'
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Actor information
  actor_id UUID, -- User who triggered the event (member, agent, or admin)
  actor_type TEXT, -- 'member', 'agent', 'admin'
  actor_role user_role, -- Specific role if admin
  
  -- Event details
  old_status TEXT, -- Previous status for status changes
  new_status TEXT, -- New status for status changes
  assigned_agent_id UUID, -- Agent ID when assigned
  assigned_by_admin_id UUID, -- Admin who assigned the agent
  
  -- Message content (if event_type = 'MESSAGE_SENT')
  message_content TEXT,
  message_sender_id UUID,
  message_sender_type TEXT, -- 'member' or 'agent'
  
  -- Additional context
  notes TEXT, -- Admin notes or system messages
  metadata JSONB, -- Flexible field for additional data
  
  -- Immutability enforcement
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_event_type CHECK (
    event_type IN (
      'REQUEST_CREATED',
      'AGENT_ASSIGNED',
      'STATUS_CHANGED',
      'MESSAGE_SENT',
      'ADMIN_NOTE',
      'ESCALATED',
      'SYSTEM_MESSAGE'
    )
  )
);

-- Create indexes for efficient queries
CREATE INDEX idx_agent_request_timeline_request_id ON agent_request_timeline(agent_request_id);
CREATE INDEX idx_agent_request_timeline_event_type ON agent_request_timeline(event_type);
CREATE INDEX idx_agent_request_timeline_timestamp ON agent_request_timeline(event_timestamp DESC);
CREATE INDEX idx_agent_request_timeline_actor ON agent_request_timeline(actor_id);

-- Enable RLS
ALTER TABLE agent_request_timeline ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read timeline
CREATE POLICY "Only admins can read timeline"
ON agent_request_timeline FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('super_admin', 'manager_admin', 'worker_admin')
  )
);

-- Policy: System can insert timeline events (via service role or authenticated users)
CREATE POLICY "Authenticated users can insert timeline events"
ON agent_request_timeline FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Policy: NO UPDATE allowed (immutable records)
-- No update policy = no updates allowed

-- Policy: NO DELETE allowed (immutable records)
-- No delete policy = no deletes allowed

COMMENT ON TABLE agent_request_timeline IS 'Immutable audit trail of all agent request events. No updates or deletes allowed.';
COMMENT ON COLUMN agent_request_timeline.event_type IS 'Type of event: REQUEST_CREATED, AGENT_ASSIGNED, STATUS_CHANGED, MESSAGE_SENT, ADMIN_NOTE, ESCALATED, SYSTEM_MESSAGE';
COMMENT ON COLUMN agent_request_timeline.metadata IS 'Flexible JSONB field for additional event context and data';