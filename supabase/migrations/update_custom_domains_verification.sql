ALTER TABLE custom_domains 
ADD COLUMN ownership_type TEXT DEFAULT 'txt',
ADD COLUMN ownership_name TEXT,
ADD COLUMN ownership_value TEXT,
ADD COLUMN ssl_name TEXT,
ADD COLUMN ssl_value TEXT;
