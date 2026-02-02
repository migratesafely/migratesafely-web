-- Create trigger to initialize loyalty status on profile creation
DROP TRIGGER IF EXISTS trigger_initialize_loyalty_status ON profiles;

CREATE TRIGGER trigger_initialize_loyalty_status
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION initialize_member_loyalty_status();

COMMENT ON TRIGGER trigger_initialize_loyalty_status ON profiles IS 'Automatically initializes loyalty status with Blue tier for new members';