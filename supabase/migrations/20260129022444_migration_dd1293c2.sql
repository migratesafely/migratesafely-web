-- Create loyalty_ui_translations table for general UI text
CREATE TABLE IF NOT EXISTS loyalty_ui_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code TEXT NOT NULL,
  translation_key TEXT NOT NULL,
  translation_value TEXT NOT NULL,
  context TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(language_code, translation_key)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_ui_translations_language ON loyalty_ui_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_loyalty_ui_translations_key ON loyalty_ui_translations(translation_key);

-- Enable RLS
ALTER TABLE loyalty_ui_translations ENABLE ROW LEVEL SECURITY;

-- Members can view UI translations
CREATE POLICY "Members can view UI translations"
ON loyalty_ui_translations FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'member'
  )
);

-- Super Admins can manage UI translations
CREATE POLICY "Super Admins can manage UI translations"
ON loyalty_ui_translations FOR ALL
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

COMMENT ON TABLE loyalty_ui_translations IS 'Multilingual UI text for loyalty program interface (Members Portal)';