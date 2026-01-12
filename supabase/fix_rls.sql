-- fix_rls.sql
-- Fix Missing RLS Policies for Projects
-- Currently you only have "select", so "insert" (Import) fails with 403.

-- 1. Allow users to add their own projects
CREATE POLICY "Users can insert their own projects"
ON public.projects FOR INSERT
WITH CHECK ( auth.uid() = user_id );

-- 2. Allow users to delete their own projects
CREATE POLICY "Users can delete their own projects"
ON public.projects FOR DELETE
USING ( auth.uid() = user_id );

-- 3. Force cache reload again just in case
NOTIFY pgrst, 'reload';
