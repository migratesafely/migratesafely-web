-- PROMPT 9: Document Verification Request (Ticket-Based, NO UPLOADS)
-- ADDITIVE ONLY - Completely separate from agent verification system

-- ============================================================================
-- 1. DOCUMENT VERIFICATION REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS document_verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ticket_reference TEXT NOT NULL UNIQUE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'sponsorship_letter',
    'invitation_letter',
    'student_confirmation',
    'employment_offer',
    'other'
  )),
  document_type_other TEXT,
  country_related TEXT NOT NULL,
  explanation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted',
    'under_review',
    'verified',
    'inconclusive',
    'rejected'
  )),
  admin_response TEXT,
  internal_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_doc_ver_member ON document_verification_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_doc_ver_status ON document_verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_doc_ver_ticket ON document_verification_requests(ticket_reference);

-- ============================================================================
-- 2. TICKET REFERENCE SEQUENCE
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS doc_verification_ticket_seq START 1;

-- ============================================================================
-- 3. IMMUTABLE AUDIT LOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS document_verification_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_verification_request_id UUID NOT NULL REFERENCES document_verification_requests(id) ON DELETE CASCADE,
  ticket_reference TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'submitted',
    'status_changed',
    'note_added',
    'response_sent',
    'reviewed'
  )),
  performed_by UUID NOT NULL REFERENCES profiles(id),
  admin_role TEXT,
  old_status TEXT,
  new_status TEXT,
  action_details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_doc_ver_audit_request ON document_verification_audit_log(doc_verification_request_id);
CREATE INDEX IF NOT EXISTS idx_doc_ver_audit_performed ON document_verification_audit_log(performed_by);

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE document_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_verification_audit_log ENABLE ROW LEVEL SECURITY;

-- Members can view their own requests
DROP POLICY IF EXISTS "Members can view own document verification requests" ON document_verification_requests;
CREATE POLICY "Members can view own document verification requests"
ON document_verification_requests FOR SELECT
TO authenticated
USING (member_id = auth.uid());

-- Members can create requests
DROP POLICY IF EXISTS "Members can create document verification requests" ON document_verification_requests;
CREATE POLICY "Members can create document verification requests"
ON document_verification_requests FOR INSERT
TO authenticated
WITH CHECK (member_id = auth.uid());

-- Admins can view all requests
DROP POLICY IF EXISTS "Admins can view all document verification requests" ON document_verification_requests;
CREATE POLICY "Admins can view all document verification requests"
ON document_verification_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('worker_admin', 'manager_admin', 'super_admin')
  )
);

-- Admins can update requests
DROP POLICY IF EXISTS "Admins can update document verification requests" ON document_verification_requests;
CREATE POLICY "Admins can update document verification requests"
ON document_verification_requests FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('worker_admin', 'manager_admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('worker_admin', 'manager_admin', 'super_admin')
  )
);

-- Audit log: Insert only
DROP POLICY IF EXISTS "Audit log is insert-only" ON document_verification_audit_log;
CREATE POLICY "Audit log is insert-only"
ON document_verification_audit_log FOR INSERT
TO authenticated
WITH CHECK (true);

-- Audit log: Admins can read
DROP POLICY IF EXISTS "Admins can read audit log" ON document_verification_audit_log;
CREATE POLICY "Admins can read audit log"
ON document_verification_audit_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('worker_admin', 'manager_admin', 'super_admin')
  )
);

-- Audit log: No updates or deletes
DROP POLICY IF EXISTS "No updates to audit log" ON document_verification_audit_log;
CREATE POLICY "No updates to audit log"
ON document_verification_audit_log FOR UPDATE
TO authenticated
USING (false);

DROP POLICY IF EXISTS "No deletes from audit log" ON document_verification_audit_log;
CREATE POLICY "No deletes from audit log"
ON document_verification_audit_log FOR DELETE
TO authenticated
USING (false);

-- ============================================================================
-- 5. RPC FUNCTION: SUBMIT DOCUMENT VERIFICATION REQUEST
-- ============================================================================
-- FIX: Reordered parameters to place default value at the end
CREATE OR REPLACE FUNCTION submit_document_verification_request(
  p_document_type TEXT,
  p_country_related TEXT,
  p_explanation TEXT,
  p_document_type_other TEXT DEFAULT NULL
)
RETURNS TABLE (
  request_id UUID,
  ticket_reference TEXT
) AS $$
DECLARE
  v_member_id UUID;
  v_ticket_number INTEGER;
  v_ticket_ref TEXT;
  v_request_id UUID;
BEGIN
  -- Get current user
  v_member_id := auth.uid();

  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Generate unique ticket reference
  v_ticket_number := nextval('doc_verification_ticket_seq');
  v_ticket_ref := 'DOC-VER-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_ticket_number::TEXT, 6, '0');

  -- Insert request
  INSERT INTO document_verification_requests (
    member_id,
    ticket_reference,
    document_type,
    document_type_other,
    country_related,
    explanation,
    status
  ) VALUES (
    v_member_id,
    v_ticket_ref,
    p_document_type,
    p_document_type_other,
    p_country_related,
    p_explanation,
    'submitted'
  ) RETURNING id INTO v_request_id;

  -- Log in audit trail
  INSERT INTO document_verification_audit_log (
    doc_verification_request_id,
    ticket_reference,
    action_type,
    performed_by,
    admin_role,
    new_status,
    action_details
  ) VALUES (
    v_request_id,
    v_ticket_ref,
    'submitted',
    v_member_id,
    'member',
    'submitted',
    'Document verification request submitted'
  );

  -- Return ticket info
  RETURN QUERY SELECT v_request_id, v_ticket_ref;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. RPC FUNCTION: GET MEMBER'S DOCUMENT VERIFICATION REQUESTS
-- ============================================================================
CREATE OR REPLACE FUNCTION get_member_document_verification_requests()
RETURNS TABLE (
  request_id UUID,
  ticket_reference TEXT,
  document_type TEXT,
  document_type_other TEXT,
  country_related TEXT,
  explanation TEXT,
  status TEXT,
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dvr.id,
    dvr.ticket_reference,
    dvr.document_type,
    dvr.document_type_other,
    dvr.country_related,
    dvr.explanation,
    dvr.status,
    dvr.admin_response,
    dvr.created_at,
    dvr.updated_at,
    dvr.reviewed_at
  FROM document_verification_requests dvr
  WHERE dvr.member_id = auth.uid()
  ORDER BY dvr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. RPC FUNCTION: GET PENDING DOCUMENT VERIFICATION REQUESTS (ADMIN)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_pending_document_verification_requests()
RETURNS TABLE (
  request_id UUID,
  member_id UUID,
  member_email TEXT,
  member_full_name TEXT,
  membership_number INTEGER,
  ticket_reference TEXT,
  document_type TEXT,
  document_type_other TEXT,
  country_related TEXT,
  explanation TEXT,
  status TEXT,
  admin_response TEXT,
  internal_notes TEXT,
  reviewed_by UUID,
  reviewed_by_email TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Verify admin access
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('worker_admin', 'manager_admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    dvr.id,
    dvr.member_id,
    p.email,
    p.full_name,
    m.membership_number,
    dvr.ticket_reference,
    dvr.document_type,
    dvr.document_type_other,
    dvr.country_related,
    dvr.explanation,
    dvr.status,
    dvr.admin_response,
    dvr.internal_notes,
    dvr.reviewed_by,
    reviewer.email,
    dvr.reviewed_at,
    dvr.created_at,
    dvr.updated_at
  FROM document_verification_requests dvr
  JOIN profiles p ON dvr.member_id = p.id
  LEFT JOIN memberships m ON dvr.member_id = m.user_id
  LEFT JOIN profiles reviewer ON dvr.reviewed_by = reviewer.id
  -- Show all requests to admins, ordered by date
  ORDER BY 
    CASE WHEN dvr.status = 'submitted' THEN 1
         WHEN dvr.status = 'under_review' THEN 2
         ELSE 3
    END,
    dvr.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. RPC FUNCTION: UPDATE DOCUMENT VERIFICATION STATUS (ADMIN)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_document_verification_status(
  p_request_id UUID,
  p_new_status TEXT,
  p_admin_response TEXT DEFAULT NULL,
  p_internal_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_id UUID;
  v_admin_role TEXT;
  v_old_status TEXT;
  v_ticket_ref TEXT;
BEGIN
  -- Verify admin access
  SELECT id, role INTO v_admin_id, v_admin_role
  FROM profiles
  WHERE id = auth.uid();

  IF v_admin_role NOT IN ('worker_admin', 'manager_admin', 'super_admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Get old status
  SELECT status, ticket_reference INTO v_old_status, v_ticket_ref
  FROM document_verification_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  -- Update request
  UPDATE document_verification_requests
  SET
    status = p_new_status,
    admin_response = COALESCE(p_admin_response, admin_response),
    internal_notes = COALESCE(p_internal_notes, internal_notes),
    reviewed_by = v_admin_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_request_id;

  -- Log in audit trail
  INSERT INTO document_verification_audit_log (
    doc_verification_request_id,
    ticket_reference,
    action_type,
    performed_by,
    admin_role,
    old_status,
    new_status,
    action_details
  ) VALUES (
    p_request_id,
    v_ticket_ref,
    'status_changed',
    v_admin_id,
    v_admin_role,
    v_old_status,
    p_new_status,
    'Status updated from ' || v_old_status || ' to ' || p_new_status
  );

  -- If response provided, log separately
  IF p_admin_response IS NOT NULL THEN
    INSERT INTO document_verification_audit_log (
      doc_verification_request_id,
      ticket_reference,
      action_type,
      performed_by,
      admin_role,
      action_details
    ) VALUES (
      p_request_id,
      v_ticket_ref,
      'response_sent',
      v_admin_id,
      v_admin_role,
      'Admin response sent to member'
    );
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. SYSTEM SETTING: DOCUMENT VERIFICATION FEATURE
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'document_verification_enabled') THEN
    INSERT INTO system_settings (setting_key, setting_value, description)
    VALUES (
      'document_verification_enabled',
      'true',
      'Enable document verification request system (ticket-based, no uploads)'
    );
  END IF;
END $$;

COMMENT ON TABLE document_verification_requests IS 'Document verification requests - ticket-based system (NO file uploads). Completely separate from agent verification system.';
COMMENT ON TABLE document_verification_audit_log IS 'Immutable audit trail for document verification requests. All actions logged with admin ID, role, and timestamp.';