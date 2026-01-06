-- Create custom_domains table
CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster domain lookups
CREATE INDEX idx_custom_domains_domain ON custom_domains(domain);
CREATE INDEX idx_custom_domains_user_id ON custom_domains(user_id);

-- Enable RLS
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own domains"
  ON custom_domains FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own domains"
  ON custom_domains FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own domains"
  ON custom_domains FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own domains"
  ON custom_domains FOR DELETE
  USING (auth.uid() = user_id);

-- Allow public read access for domain verification (needed for routing)
CREATE POLICY "Public can read verified domains"
  ON custom_domains FOR SELECT
  USING (verified = true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER custom_domains_updated_at
  BEFORE UPDATE ON custom_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_domains_updated_at();
