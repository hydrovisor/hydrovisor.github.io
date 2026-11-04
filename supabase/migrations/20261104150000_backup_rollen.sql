-- 20261104150000_backup_rollen.sql · Rollen für das nächtliche Backup (I0-11, Issue #16, Plan 16 Abschnitt Migration;
-- Konzept 8.1 Regel 6, 11.7, Erratum E7; 04_architektur.md Abschnitt 9; 02_datenmodell.sql A8).
--
-- Additiv: nur Rollen, Rechte und Policies; keine Tabelle, Spalte, Sicht oder Funktion.
--   backup_leser           liest alles in public und die Migrationsliste; einziger Schreibweg backup_status_melden.
--                          Mit BYPASSRLS, wenn Supabase das zulässt; sonst Rückfall E7 mit Policies backup_lesen.
--   backup_speicher_leser  liest in storage.objects nur den Bucket saattueten (Storage-Token für backup.yml).
-- Beide Rollen ohne Anmeldung und ohne Passwort: In der Produktion setzt Tim Anmeldung und Passwort von backup_leser
-- mit scripts/backup-einrichten.mjs (Plan 16 Handgriff 3). Kein Geheimnis und keine Projekt-Referenz in dieser Datei.
--
-- Wiederholbar: Rollen gelten clusterweit und überleben supabase db reset; sie entstehen nur, wenn sie fehlen, und
-- eine bestehende Rolle (z. B. mit Tims Passwort) bleibt unverändert. Grants und Policies sind wiederholbar.
-- Rückweg (Folgemigration oder Tim im SQL-Editor): drop policy backup_lesen je Tabelle, drop policy
-- backup_speicher_lesen on storage.objects, revoke der Rechte, drop role; die Tabellen bleiben unberührt.

-- ---------------------------------------------------------------------
-- 1. Rolle backup_leser: zuerst mit BYPASSRLS, bei insufficient_privilege ohne (E7); andere Fehler brechen ab
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'backup_leser') then
    raise notice 'backup_leser besteht bereits (BYPASSRLS %), unverändert',
      (select rolbypassrls from pg_roles where rolname = 'backup_leser');
    return;
  end if;
  begin
    create role backup_leser nologin nosuperuser nocreatedb nocreaterole noreplication noinherit bypassrls;
    raise notice 'backup_leser angelegt, Modus: BYPASSRLS';
  exception when insufficient_privilege then
    raise notice 'BYPASSRLS nicht erlaubt (%), Rückfall E7', sqlerrm;
    create role backup_leser nologin nosuperuser nocreatedb nocreaterole noreplication noinherit;
    raise notice 'backup_leser angelegt, Modus: Zeilensicherheit (backup_lesen)';
  end;
end $$;
comment on role backup_leser is
  'Nächtliches Backup (backup.yml, Konzept 11.7): liest public und supabase_migrations.schema_migrations, schreibt nur über backup_status_melden; Anmeldung und Passwort setzt Tim (Plan 16).';

-- ---------------------------------------------------------------------
-- 2. Lesen: public samt Standardrechten für künftige Tabellen der Rolle postgres (Migrationen laufen als postgres, A5)
-- ---------------------------------------------------------------------
grant usage on schema public to backup_leser;
grant select on all tables in schema public to backup_leser;
grant select on all sequences in schema public to backup_leser;
alter default privileges for role postgres in schema public grant select on tables to backup_leser;
alter default privileges for role postgres in schema public grant select on sequences to backup_leser;

-- Migrationsliste für migrationen.txt, nur wenn Schema und Tabelle bestehen
do $$
begin
  if to_regclass('supabase_migrations.schema_migrations') is not null then
    grant usage on schema supabase_migrations to backup_leser;
    grant select on supabase_migrations.schema_migrations to backup_leser;
  else
    raise notice 'supabase_migrations.schema_migrations fehlt, kein Leserecht vergeben';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 3. Einziger Schreibweg: backup_status_melden (security definer, sonst niemandem erlaubt). Kein insert, update,
--    delete, truncate und kein EXECUTE auf eine andere security definer-Funktion (06_tests.md 9 «Push und KI»).
-- ---------------------------------------------------------------------
grant execute on function public.backup_status_melden(bigint) to backup_leser;

-- ---------------------------------------------------------------------
-- 4. Rückfall E7: ohne BYPASSRLS je Tabelle in public genau eine Policy backup_lesen (benannte Prüftor-Ausnahme,
--    nur select, nur backup_leser); mit BYPASSRLS keine. Jede künftige Migration mit neuer Tabelle legt im Rückfall
--    backup_lesen an; das prüfen 11_backup.test.sql («Modus stimmig») und die Rechteprüfung in backup.yml.
--    Dieselbe Anweisung steht in 11_backup.test.sql (Plan 16 A8).
-- ---------------------------------------------------------------------
do $$
declare
  t text;
  mit_bypass boolean := (select rolbypassrls from pg_roles where rolname = 'backup_leser');
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('drop policy if exists backup_lesen on public.%I', t);
    if not mit_bypass then
      execute format('create policy backup_lesen on public.%I for select to backup_leser using (true)', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 5. Rolle backup_speicher_leser: liest nur Objekte im Bucket saattueten, ohne Bypass und ohne Rechte in public.
--    authenticator wird Mitglied, damit der Storage-Dienst (supabase_storage_admin ist Mitglied von authenticator)
--    bei einem JWT mit role backup_speicher_leser auf diese Rolle wechselt, wie bei anon und authenticated (A3).
--    backup_leser erhält diese Mitgliedschaft nie: Ein Storage-Token öffnet höchstens die Tütenfotos.
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'backup_speicher_leser') then
    create role backup_speicher_leser nologin nosuperuser nocreatedb nocreaterole noreplication noinherit nobypassrls;
  end if;
end $$;
comment on role backup_speicher_leser is
  'Storage-Token für backup.yml (scripts/backup-storage.mjs): liest in storage.objects nur den Bucket saattueten, keine Tabelle in public (Plan 16).';

grant backup_speicher_leser to authenticator;
grant usage on schema storage to backup_speicher_leser;
grant select on storage.objects to backup_speicher_leser;
-- Kein Recht und keine Policy auf storage.buckets: Liste (POST object/list) und Download (GET object/authenticated)
-- gelingen lokal ohne (A3, geprüft mit einem lokal signierten Token).

drop policy if exists backup_speicher_lesen on storage.objects;
create policy backup_speicher_lesen on storage.objects for select to backup_speicher_leser
  using (bucket_id = 'saattueten');
comment on policy backup_speicher_lesen on storage.objects is
  'Backup der Tütenfotos: backup_speicher_leser liest nur den Bucket saattueten (Plan 16).';
