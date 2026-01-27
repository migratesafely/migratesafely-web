-- =====================================================
-- CREATE CORRECTED ADMIN DASHBOARD VIEW
-- =====================================================

DROP VIEW IF EXISTS admin_dashboard_stats;

CREATE VIEW admin_dashboard_stats AS
SELECT 
  COUNT(DISTINCT m.id) as total_memberships,
  COUNT(DISTINCT CASE WHEN m.status = 'active' AND m.end_date > NOW() THEN m.id END) as active_memberships,
  COUNT(DISTINCT CASE WHEN m.status = 'expired' THEN m.id END) as expired_memberships,
  COUNT(DISTINCT CASE WHEN m.status = 'pending_payment' THEN m.id END) as pending_memberships,
  SUM(CASE WHEN p.status = 'confirmed' THEN p.amount ELSE 0 END) as total_revenue,
  COUNT(DISTINCT CASE WHEN r.is_paid = false THEN r.id END) as pending_referrals,
  COUNT(DISTINCT CASE WHEN wr.status = 'pending' THEN wr.id END) as pending_withdrawals,
  COUNT(DISTINCT CASE WHEN a.status = 'pending_approval' THEN a.id END) as pending_agent_applications,
  COUNT(DISTINCT CASE WHEN sr.status = 'under_review' THEN sr.id END) as pending_scam_reports
FROM memberships m
LEFT JOIN payments p ON m.id = p.membership_id
LEFT JOIN referrals r ON m.id = r.membership_id
LEFT JOIN withdrawal_requests wr ON m.user_id = wr.user_id
LEFT JOIN agents a ON m.user_id = a.user_id
LEFT JOIN scammer_reports sr ON m.user_id = sr.reported_by;

GRANT SELECT ON admin_dashboard_stats TO authenticated;