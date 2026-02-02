-- Update member_loyalty_status to track referral count and tier lock dates
ALTER TABLE member_loyalty_status
ADD COLUMN IF NOT EXISTS successful_referrals INTEGER DEFAULT 0 CHECK (successful_referrals >= 0),
ADD COLUMN IF NOT EXISTS tier_locked_until DATE,
ADD COLUMN IF NOT EXISTS next_tier_evaluation_date DATE;

-- Add comments for new columns
COMMENT ON COLUMN member_loyalty_status.successful_referrals IS 'Count of successful referrals made by this member';
COMMENT ON COLUMN member_loyalty_status.tier_locked_until IS 'Date until which current tier is locked (membership expiry date)';
COMMENT ON COLUMN member_loyalty_status.next_tier_evaluation_date IS 'Next date when tier can be re-evaluated (next renewal date)';