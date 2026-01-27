-- =====================================================
-- FIX: ADD MISSING COLUMN TO EMBASSIES TABLE
-- =====================================================

ALTER TABLE embassies ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Now insert the default Bangladesh embassy
INSERT INTO embassies (country_code, country_name, embassy_name, address, phone, email, website, display_order)
VALUES ('BD', 'Bangladesh', 'Bangladesh High Commission (Default)', 'To be configured by admin', NULL, NULL, NULL, 1)
ON CONFLICT DO NOTHING;