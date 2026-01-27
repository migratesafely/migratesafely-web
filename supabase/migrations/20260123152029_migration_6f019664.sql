ALTER TABLE embassies
ADD COLUMN source_url text,
ADD COLUMN contact_summary text,
ADD COLUMN contact_details text,
ADD COLUMN last_verified_at timestamp with time zone,
ADD COLUMN last_verified_by uuid REFERENCES profiles(id);