-- Create loyalty_tier_translations table for multilingual tier content
CREATE TABLE IF NOT EXISTS loyalty_tier_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id UUID NOT NULL REFERENCES loyalty_tiers(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  tier_name_translated TEXT NOT NULL,
  description TEXT NOT NULL,
  benefits_description TEXT NULL,
  how_to_achieve TEXT NOT NULL,
  achievement_message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tier_id, language_code)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_loyalty_tier_translations_tier_id ON loyalty_tier_translations(tier_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tier_translations_language ON loyalty_tier_translations(language_code);

-- Enable RLS
ALTER TABLE loyalty_tier_translations ENABLE ROW LEVEL SECURITY;

-- Members can view tier translations
CREATE POLICY "Members can view tier translations"
ON loyalty_tier_translations FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'member'
  )
);

-- Super Admins can manage translations
CREATE POLICY "Super Admins can manage tier translations"
ON loyalty_tier_translations FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

COMMENT ON TABLE loyalty_tier_translations IS 'Multilingual translations for loyalty tier names, descriptions, and achievement messages (Members Portal)';