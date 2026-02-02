-- Update loyalty_tiers table to add referral_threshold and bonus_percentage columns
ALTER TABLE loyalty_tiers
ADD COLUMN IF NOT EXISTS referral_threshold integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_percentage numeric(5,2) NOT NULL DEFAULT 0.00;

COMMENT ON COLUMN loyalty_tiers.referral_threshold IS 'Number of successful referrals required to achieve this tier';
COMMENT ON COLUMN loyalty_tiers.bonus_percentage IS 'Percentage bonus on renewal for this tier (e.g., 5.00 = 5%)';

-- Drop points_required column as we're using referrals instead
ALTER TABLE loyalty_tiers
DROP COLUMN IF EXISTS points_required;