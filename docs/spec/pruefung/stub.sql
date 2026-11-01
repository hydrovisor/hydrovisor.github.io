-- Stubs für den Prüflauf ausserhalb von Supabase: auth.users, auth.uid() und die Rollen.
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname = 'backup_leser') then create role backup_leser login password 'test'; end if;
end $$;
-- wie Supabase: EXECUTE auf neue Funktionen im Schema public direkt an die API-Rollen (Befund D1)
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
