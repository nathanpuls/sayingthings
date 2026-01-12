-- Run this in your Supabase SQL Editor to apply changes

-- 1. Add missing columns for GitHub Projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS github_repo_id bigint,
ADD COLUMN IF NOT EXISTS stargazers_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS language text;

-- 2. Wipe old profile data (Bio, Location, Website) so it can be cleanly re-synced from GitHub
UPDATE public.profiles 
SET 
  bio = NULL, 
  location = NULL, 
  website = NULL;

-- 3. Verify changes
SELECT * FROM public.projects LIMIT 1;
