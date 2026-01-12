-- reload_schema.sql
-- Force Supabase to refresh its API cache so it sees the new columns
NOTIFY pgrst, 'reload';
