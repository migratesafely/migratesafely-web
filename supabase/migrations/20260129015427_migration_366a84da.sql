-- Create trigger to update member tier on referral count change
DROP TRIGGER IF EXISTS trigger_update_member_tier ON member_loyalty_status;

CREATE TRIGGER trigger_update_member_tier
  BEFORE UPDATE OF successful_referrals ON member_loyalty_status
  FOR EACH ROW
  WHEN (NEW.successful_referrals IS DISTINCT FROM OLD.successful_referrals)
  EXECUTE FUNCTION update_member_tier_on_referral();

COMMENT ON TRIGGER trigger_update_member_tier ON member_loyalty_status IS 'Automatically updates member tier when referral count changes';