-- Rechte wie in Supabase (dort vergeben durch die Plattform), damit RLS-Tests greifen.
grant usage on schema public, auth to authenticated, anon, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, anon, service_role;
