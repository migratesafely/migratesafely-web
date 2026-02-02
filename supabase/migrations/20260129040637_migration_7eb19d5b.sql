-- Create audit log table for reports
CREATE TABLE IF NOT EXISTS admin_report_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES profiles(id),
  admin_role TEXT NOT NULL,
  report_type TEXT NOT NULL,
  action TEXT NOT NULL, -- 'viewed' or 'exported'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_report_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can insert (via function) and view
CREATE POLICY "Admins can view report logs" ON admin_report_access_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'manager_admin')
    )
  );

-- 1. Log Report Access Function
CREATE OR REPLACE FUNCTION log_report_access(
  p_report_type TEXT,
  p_action TEXT
) RETURNS VOID AS $$
DECLARE
  v_admin_role TEXT;
BEGIN
  -- Get current user role
  SELECT role INTO v_admin_role FROM profiles WHERE id = auth.uid();
  
  -- Check permission
  IF v_admin_role NOT IN ('super_admin', 'manager_admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  INSERT INTO admin_report_access_logs (admin_id, admin_role, report_type, action)
  VALUES (auth.uid(), v_admin_role, p_report_type, p_action);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Tier Overview Report
CREATE OR REPLACE FUNCTION get_tier_overview_report()
RETURNS TABLE (
  tier_name TEXT,
  tier_level INTEGER,
  total_members BIGINT,
  upgraded_this_month BIGINT,
  pending_approvals BIGINT,
  required_referrals INTEGER,
  bonus_percentage NUMERIC
) AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'manager_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    t.name::TEXT,
    t.level,
    COUNT(DISTINCT p.id)::BIGINT as total_members,
    COUNT(DISTINCT CASE 
      WHEN mt.achieved_at >= date_trunc('month', CURRENT_DATE) 
      THEN p.id 
    END)::BIGINT as upgraded_this_month,
    (
      SELECT COUNT(*)::BIGINT 
      FROM tier_bonus_approvals tba 
      WHERE tba.tier_id = t.id AND tba.status = 'pending'
    ) as pending_approvals,
    t.required_referrals,
    t.bonus_percentage
  FROM loyalty_tiers t
  LEFT JOIN member_tiers mt ON mt.current_tier_id = t.id
  LEFT JOIN profiles p ON p.id = mt.member_id
  GROUP BY t.id, t.name, t.level, t.required_referrals, t.bonus_percentage
  ORDER BY t.level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Tier Bonus Financial Summary
CREATE OR REPLACE FUNCTION get_tier_bonus_financial_summary(
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_country_code TEXT DEFAULT NULL
)
RETURNS TABLE (
  month TEXT,
  country_code TEXT,
  tier_name TEXT,
  pending_approval_amount NUMERIC,
  approved_unpaid_amount NUMERIC,
  paid_amount NUMERIC,
  currency_code TEXT,
  count BIGINT
) AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'manager_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    to_char(tba.requested_at, 'YYYY-MM') as month,
    p.country_code,
    lt.name::TEXT as tier_name,
    COALESCE(SUM(CASE WHEN tba.status = 'pending' THEN tba.calculated_bonus_amount ELSE 0 END), 0) as pending_approval_amount,
    COALESCE(SUM(CASE WHEN tba.status = 'approved' AND wt.id IS NULL THEN tba.calculated_bonus_amount ELSE 0 END), 0) as approved_unpaid_amount, -- Simplification: checks if linked transaction exists if we had that link, but for now just approved
    COALESCE(SUM(CASE WHEN tba.status = 'approved' THEN tba.calculated_bonus_amount ELSE 0 END), 0) as paid_amount, -- Assuming approved = paid for reporting simplification as wallet credit is immediate on approval
    tba.currency_code,
    COUNT(*)::BIGINT
  FROM tier_bonus_approvals tba
  JOIN profiles p ON p.id = tba.member_id
  JOIN loyalty_tiers lt ON lt.id = tba.tier_id
  LEFT JOIN wallet_transactions wt ON wt.reference_id = tba.id::TEXT AND wt.transaction_type = 'tier_bonus_credit'
  WHERE 
    (p_country_code IS NULL OR p.country_code = p_country_code)
    AND (p_start_date IS NULL OR tba.requested_at >= p_start_date)
    AND (p_end_date IS NULL OR tba.requested_at <= p_end_date)
  GROUP BY 1, 2, 3, 7
  ORDER BY 1 DESC, 2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Referral Bonus Summary
CREATE OR REPLACE FUNCTION get_referral_bonus_summary(
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  month TEXT,
  total_bonus_paid NUMERIC,
  total_referrals BIGINT,
  currency_code TEXT
) AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'manager_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    to_char(created_at, 'YYYY-MM') as month,
    SUM(amount) as total_bonus_paid,
    COUNT(*) as total_referrals,
    currency_code
  FROM wallet_transactions
  WHERE 
    transaction_type = 'referral_bonus'
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date)
  GROUP BY 1, 4
  ORDER BY 1 DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Top Referrers (Anonymized)
CREATE OR REPLACE FUNCTION get_top_referrers(
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  member_id_anonymized TEXT,
  total_successful_referrals BIGINT,
  total_earned NUMERIC,
  currency_code TEXT
) AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'manager_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    LEFT(p.id::TEXT, 8) || '...' as member_id_anonymized,
    COUNT(r.id) as total_successful_referrals,
    COALESCE(SUM(wt.amount), 0) as total_earned,
    mc.referral_bonus_currency as currency_code
  FROM profiles p
  JOIN referrals r ON r.referrer_id = p.id AND r.status = 'completed'
  LEFT JOIN wallet_transactions wt ON wt.user_id = p.id AND wt.transaction_type = 'referral_bonus'
  LEFT JOIN membership_config mc ON mc.country_code = p.country_code
  GROUP BY p.id, mc.referral_bonus_currency
  ORDER BY total_successful_referrals DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;