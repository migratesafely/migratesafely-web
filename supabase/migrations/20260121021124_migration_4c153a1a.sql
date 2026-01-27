-- =====================================================
-- CREATE SIMPLIFIED AGENT STATS VIEW
-- =====================================================

DROP VIEW IF EXISTS admin_agent_stats;

CREATE VIEW admin_agent_stats AS
SELECT 
  a.id,
  a.user_id,
  p.full_name,
  p.email,
  a.company_name,
  a.license_number,
  a.status,
  a.successful_migrations,
  a.total_fees_earned,
  COUNT(DISTINCT sr.id) as total_service_requests,
  COUNT(DISTINCT CASE WHEN sr.status = 'completed' THEN sr.id END) as completed_requests,
  AVG(sr.member_rating) as average_rating,
  a.approved_at,
  a.created_at
FROM agents a
JOIN profiles p ON a.user_id = p.id
LEFT JOIN service_requests sr ON a.id = sr.assigned_agent_id
GROUP BY a.id, a.user_id, p.full_name, p.email, a.company_name, a.license_number, 
         a.status, a.successful_migrations, a.total_fees_earned, a.approved_at, a.created_at;

GRANT SELECT ON admin_agent_stats TO authenticated;