-- Add country_code column to membership_config for country-specific configurations
ALTER TABLE membership_config 
ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT NULL;

-- Add index for efficient country-based lookups
CREATE INDEX IF NOT EXISTS idx_membership_config_country 
ON membership_config(country_code, effective_from DESC);

-- Add comment explaining the logic
COMMENT ON COLUMN membership_config.country_code IS 
'Country code for country-specific config. NULL = global fallback config';