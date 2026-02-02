-- Drop all existing loyalty tier functions
DROP FUNCTION IF EXISTS get_active_tier_config(uuid, date);
DROP FUNCTION IF EXISTS calculate_member_tier(integer);
DROP FUNCTION IF EXISTS calculate_member_tier(uuid);
DROP FUNCTION IF EXISTS get_tier_bonus_at_renewal(uuid, date);
DROP FUNCTION IF EXISTS get_tier_bonus_percentage(uuid);