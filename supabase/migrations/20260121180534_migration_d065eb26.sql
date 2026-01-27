-- Add country_code to prize_draws
ALTER TABLE prize_draws 
ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'BD';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_prize_draws_country_code ON prize_draws(country_code);