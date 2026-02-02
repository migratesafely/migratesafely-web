-- Fix loyalty_tier_config table to allow NULL for created_by during initial setup
ALTER TABLE loyalty_tier_config
ALTER COLUMN created_by DROP NOT NULL;

COMMENT ON COLUMN loyalty_tier_config.created_by IS 'Super Admin who created/updated this configuration (NULL for system-generated initial config)';