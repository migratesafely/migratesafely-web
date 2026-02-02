-- Create function to get UI translations for loyalty program
CREATE FUNCTION get_loyalty_ui_translations(
  p_language_code TEXT DEFAULT 'en'
)
RETURNS TABLE(
  translation_key TEXT,
  translation_value TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(user_lang.translation_key, en_lang.translation_key) as translation_key,
    COALESCE(user_lang.translation_value, en_lang.translation_value) as translation_value
  FROM loyalty_ui_translations en_lang
  LEFT JOIN loyalty_ui_translations user_lang 
    ON en_lang.translation_key = user_lang.translation_key 
    AND user_lang.language_code = p_language_code
  WHERE en_lang.language_code = 'en'
  ORDER BY en_lang.translation_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_loyalty_ui_translations IS 'Gets all UI translations for loyalty program in specified language with English fallback';