-- Drop existing functions with all their signatures
DROP FUNCTION IF EXISTS get_member_tier_details_localized(uuid, text);
DROP FUNCTION IF EXISTS get_all_tiers_localized(text);
DROP FUNCTION IF EXISTS get_loyalty_ui_translations(text);