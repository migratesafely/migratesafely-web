-- Create language_availability table to control which languages are enabled
CREATE TABLE IF NOT EXISTS language_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  language_code TEXT NOT NULL UNIQUE,
  language_name_english TEXT NOT NULL,
  language_name_native TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  enabled_at TIMESTAMP WITH TIME ZONE,
  enabled_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_valid_language_code CHECK (language_code IN ('en', 'bn', 'es', 'fr'))
);

COMMENT ON TABLE language_availability IS 'Controls which languages are visible in member language selector (Super Admin only)';
COMMENT ON COLUMN language_availability.is_enabled IS 'If true, language appears in member selector; if false, hidden but supported';
COMMENT ON COLUMN language_availability.enabled_by IS 'Super Admin who enabled this language';