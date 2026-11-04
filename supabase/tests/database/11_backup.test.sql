-- 11_backup.test.sql · Prüftor-Ausnahme `backup_lesen` (Konzept 8.1 Regel 6, 11.7, E7; 04_architektur.md 9 und 11;
-- 06_tests.md 9 «Zugriff» und «Push und KI»; smoke3 C11; Plan 16 Testliste)
-- Rolle backup_leser: liest alles in public (mit BYPASSRLS oder im Rückfall über Policies backup_lesen), schreibt nur
-- über backup_status_melden. Rolle backup_speicher_leser: liest in storage.objects nur den Bucket saattueten.
-- Schleifen über information_schema.tables und pg_proc wie in 00_zugriff.test.sql: künftige Tabellen und Funktionen
-- werden ohne Teständerung mitgeprüft; die Planzahl folgt aus denselben Zählungen.
-- Fehlt eine Rolle, schlagen die Tests einzeln fehl («Rolle fehlt» oder «Fehler <SQLSTATE>»), die Datei bricht nicht ab.
-- Konten nur synthetisch (UUID ohne E-Mail-Adresse): Tim …000a, fremdes Konto …000b. Alles in einer Transaktion.
begin;
create extension if not exists pgtap with schema extensions;
-- Die Datenbank läuft in UTC wie in Supabase; alle Zeitpunkte stehen ausdrücklich in Europe/Zurich.
set local timezone to 'UTC';
set local row_security = on;

-- ---------------------------------------------------------------------
-- Hilfsfunktionen (nur in dieser Sitzung)
-- ---------------------------------------------------------------------

create function pg_temp.rolle_da(rolle text) returns boolean language sql stable as $$
  select exists (select 1 from pg_roles where rolname = rolle)
$$;

-- postgres darf ohne Superuser nur mit SET-Recht in eine Rolle wechseln; das Recht gilt nur in dieser Transaktion
-- (inherit false: postgres erbt keine Rechte der Rolle). Fehlt die Rolle, bleibt es bei einer Meldung.
create function pg_temp.wechsel_erlauben(rolle text) returns void language plpgsql as $$
begin
  if pg_temp.rolle_da(rolle) then
    execute format('grant %I to postgres with inherit false, set true', rolle);
  end if;
exception when others then
  raise notice 'SET-Recht auf % nicht vergeben: %', rolle, sqlerrm;
end $$;

-- Abfrage (ein Wert) als Rolle; Fehler (auch fehlende Rolle) ergeben «Fehler <SQLSTATE>»
create function pg_temp.zaehle_als(rolle text, abfrage text) returns text language plpgsql as $$
declare
  ergebnis text;
begin
  begin
    perform set_config('request.jwt.claims', jsonb_build_object('role', rolle)::text, true);
    execute format('set local role %I', rolle);
    execute abfrage into ergebnis;
  exception when others then
    ergebnis := 'Fehler ' || sqlstate;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return ergebnis;
end $$;

-- Anweisung als Rolle; «ok <Zeilen>» oder der SQLSTATE. Gelingt sie, wird sie zurückgerollt (Fixtures bleiben).
create function pg_temp.versuch_als(rolle text, anweisung text) returns text language plpgsql as $$
declare
  ergebnis text;
  n bigint;
begin
  begin
    perform set_config('request.jwt.claims', jsonb_build_object('role', rolle)::text, true);
    execute format('set local role %I', rolle);
    execute anweisung;
    get diagnostics n = row_count;
    ergebnis := 'ok ' || n;
    raise exception using errcode = 'HV001', message = 'Versuch zurückrollen';
  exception
    when sqlstate 'HV001' then null;
    when others then ergebnis := sqlstate;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return ergebnis;
end $$;

-- Anweisung als Rolle, bleibt bestehen; «ok <Zeilen>» oder der SQLSTATE
create function pg_temp.ausfuehren_als(rolle text, anweisung text) returns text language plpgsql as $$
declare
  ergebnis text;
  n bigint;
begin
  begin
    perform set_config('request.jwt.claims', jsonb_build_object('role', rolle)::text, true);
    execute format('set local role %I', rolle);
    execute anweisung;
    get diagnostics n = row_count;
    ergebnis := 'ok ' || n;
  exception when others then
    ergebnis := sqlstate;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return ergebnis;
end $$;

create temp view tabellen as
  select table_name::text as name from information_schema.tables
   where table_schema = 'public' and table_type = 'BASE TABLE';
create temp view definer_funktionen as
  select p.oid, p.proname::text as name, pg_get_function_identity_arguments(p.oid) as argumente
    from pg_proc p
   where p.pronamespace = 'public'::regnamespace and p.prosecdef and p.proname <> 'backup_status_melden';

select plan(
    3 * (select count(*)::int from tabellen)
  + (select count(*)::int from definer_funktionen)
  + 11);

select pg_temp.wechsel_erlauben('backup_leser');
select pg_temp.wechsel_erlauben('backup_speicher_leser');

-- ---------------------------------------------------------------------
-- Fixtures als postgres: Zeilen in zugang (Tim und fremdes Konto), messung, ereignis, backup_status; Storage-Objekte
-- in saattueten und in einem zweiten Bucket
-- ---------------------------------------------------------------------

insert into auth.users (id) values
  ('00000000-0000-4000-8000-00000000000a'), ('00000000-0000-4000-8000-00000000000b')
  on conflict (id) do nothing;
insert into public.zugang (user_id, app_version) values
  ('00000000-0000-4000-8000-00000000000a', 'pgtap'), ('00000000-0000-4000-8000-00000000000b', 'pgtap')
  on conflict (user_id) do nothing;
insert into public.backup_status (letztes_backup_am, groesse_bytes, app_version)
  values ('2027-01-10 03:00 Europe/Zurich', 1000, 'pgtap');
insert into public.messgeraet (id, modell, app_version) values ('fb000000-0000-4000-8000-000000000201', 'Testgeraet B', 'pgtap');
insert into public.anlage (id, name, kuerzel, datenart, app_version)
  values ('fb000000-0000-4000-8000-000000000301', 'Backupregal', 'BKT', 'echt', 'pgtap');
insert into public.bereich (id, anlage_id, nummer, name, app_version)
  values ('fb000000-0000-4000-8000-000000000311', 'fb000000-0000-4000-8000-000000000301', 2, 'Ebene 2', 'pgtap');
insert into public.platz (id, anlage_id, bereich_id, kennung, rolle, app_version)
  values ('fb000000-0000-4000-8000-000000000321', 'fb000000-0000-4000-8000-000000000301',
          'fb000000-0000-4000-8000-000000000311', '2.3', 'gefaess', 'pgtap');
insert into public.gefaessmodell (id, name, form, innen_l_mm, innen_b_mm, innen_h_mm, betriebsvolumen_l, app_version)
  values ('fb000000-0000-4000-8000-000000000331', 'Backupbox', 'rechteckig', 400, 300, 170, 9, 'pgtap');
insert into public.deckeltyp (id, name, topfdurchmesser_mm, loecher_je_reihe, app_version)
  values ('fb000000-0000-4000-8000-000000000341', 'Backupdeckel', 80, '{2,2,2}', 'pgtap');
insert into public.gefaess (platz_id, gefaessmodell_id, deckeltyp_id, betriebsart, betriebsvolumen_l, intervall_messen_d,
                            intervall_wechseln_d, gueltig_von, app_version)
  values ('fb000000-0000-4000-8000-000000000321', 'fb000000-0000-4000-8000-000000000331',
          'fb000000-0000-4000-8000-000000000341', 'dwc', 9, 2, 14, '2027-01-03 10:00 Europe/Zurich', 'pgtap');
insert into public.messung (client_id, platz_id, messgeraet_id, messart, ec, gilt_ab, app_version)
  select gen_random_uuid(), 'fb000000-0000-4000-8000-000000000321', 'fb000000-0000-4000-8000-000000000201', 'aufgabe', 1.2, d, 'pgtap'
    from unnest(array['2027-01-10 10:00 Europe/Zurich', '2027-01-12 10:00 Europe/Zurich']::timestamptz[]) d;
insert into public.ereignis (client_id, typ, platz_id, gilt_ab, app_version)
  values (gen_random_uuid(), 'gefaess_erfasst', 'fb000000-0000-4000-8000-000000000321',
          '2027-01-03 10:00 Europe/Zurich', 'pgtap');

-- Storage: ein Tütenfoto und ein Objekt in einem zweiten Bucket (Pfad saattueten/{sorte_id}/{uuid}.jpg)
do $$
begin
  insert into storage.buckets (id, name, public) values ('pgtap-anderer', 'pgtap-anderer', false)
    on conflict (id) do nothing;
  insert into storage.objects (id, bucket_id, name) values
    ('fb000000-0000-4000-8000-000000000401', 'saattueten',
     'fb000000-0000-4000-8000-000000000101/fb000000-0000-4000-8000-000000000402.jpg'),
    ('fb000000-0000-4000-8000-000000000403', 'pgtap-anderer', 'pgtap/fremd.jpg');
exception when others then
  raise notice 'Storage-Fixture nicht angelegt: %', sqlerrm;
end $$;

-- ---------------------------------------------------------------------
-- Katalog: benannte Ausnahme und Modus
-- ---------------------------------------------------------------------

select is(
  (select coalesce(string_agg(tablename || '.' || policyname || ' ' || cmd || ' ' || roles::text, ', '
                              order by tablename, policyname), '')
     from pg_policies
    where schemaname = 'public' and (qual = 'true' or with_check = 'true')
      and not (policyname = 'backup_lesen' and cmd = 'SELECT' and roles = '{backup_leser}'::name[])),
  '', 'Prüftor-Ausnahme `backup_lesen` using (true) nur als backup_lesen, nur SELECT, nur backup_leser');

select is(
  (select case
     when not pg_temp.rolle_da('backup_leser') then 'Rolle backup_leser fehlt'
     when (select rolbypassrls from pg_roles where rolname = 'backup_leser') then
       coalesce('Policies backup_lesen trotz BYPASSRLS: '
                || (select string_agg(tablename, ', ' order by tablename) from pg_policies
                     where schemaname = 'public' and policyname = 'backup_lesen'), 'ok')
     else
       coalesce('ohne Policy backup_lesen: '
                || (select string_agg(t.name, ', ' order by t.name) from tabellen t
                     where (select count(*) from pg_policies p
                             where p.schemaname = 'public' and p.tablename = t.name
                               and p.policyname = 'backup_lesen') <> 1), 'ok')
   end),
  'ok', 'Prüftor-Ausnahme `backup_lesen` Modus stimmig');

-- ---------------------------------------------------------------------
-- Lesen und Schreiben als backup_leser (im Modus, den die Migration gesetzt hat)
-- ---------------------------------------------------------------------

create function pg_temp.liest_vollstaendig() returns setof text language plpgsql as $$
declare
  t text;
  soll text;
begin
  for t in select name from tabellen order by name loop
    execute format('select count(*)::text from public.%I', t) into soll;
    return next is(pg_temp.zaehle_als('backup_leser', format('select count(*)::text from public.%I', t)), soll,
                   'Prüftor-Ausnahme `backup_lesen` liest vollständig: ' || t);
  end loop;
end $$;
select * from pg_temp.liest_vollstaendig();

create function pg_temp.schreibt_nicht() returns setof text language plpgsql as $$
declare
  t text;
  spalte text;
begin
  for t in select name from tabellen order by name loop
    select c.column_name::text into spalte from information_schema.columns c
     where c.table_schema = 'public' and c.table_name = t order by c.ordinal_position limit 1;
    return next is(
      format('insert %s, update %s, delete %s, truncate %s',
             pg_temp.versuch_als('backup_leser', format('insert into public.%I default values', t)),
             pg_temp.versuch_als('backup_leser', format('update public.%I set %I = %I', t, spalte, spalte)),
             pg_temp.versuch_als('backup_leser', format('delete from public.%I', t)),
             pg_temp.versuch_als('backup_leser', format('truncate public.%I', t))),
      'insert 42501, update 42501, delete 42501, truncate 42501',
      'Prüftor-Ausnahme `backup_lesen` schreibt nicht: ' || t);
  end loop;
end $$;
select * from pg_temp.schreibt_nicht();

-- Aufruf und Zählung in getrennten Anweisungen (sonst sieht die Zählung die neue Zeile nicht, gleicher Schnappschuss)
create function pg_temp.melden_als_backup_leser() returns text language plpgsql as $$
declare
  ergebnis text;
  neu bigint;
begin
  ergebnis := pg_temp.ausfuehren_als('backup_leser', 'select public.backup_status_melden(424242)');
  select count(*) into neu from public.backup_status where groesse_bytes = 424242 and app_version = 'backup.yml';
  return ergebnis || ', neu ' || neu;
end $$;
select is(
  pg_temp.melden_als_backup_leser(),
  'ok 1, neu 1', 'Prüftor-Ausnahme `backup_lesen` einziger Schreibweg backup_status_melden: Aufruf legt eine Zeile an');

create function pg_temp.kein_definer() returns setof text language plpgsql as $$
declare r record;
begin
  for r in select * from definer_funktionen order by name, argumente loop
    return next is(
      case when pg_temp.rolle_da('backup_leser')
           then has_function_privilege('backup_leser', r.oid, 'EXECUTE')::text
           else 'Rolle backup_leser fehlt' end,
      'false',
      'Prüftor-Ausnahme `backup_lesen` einziger Schreibweg backup_status_melden: kein EXECUTE auf '
        || r.name || '(' || r.argumente || ')');
  end loop;
end $$;
select * from pg_temp.kein_definer();

-- ---------------------------------------------------------------------
-- Rolle, Standardrechte, Migrationsliste
-- ---------------------------------------------------------------------

select is(
  coalesce((select format('super %s, createrole %s, createdb %s, replication %s',
                          rolsuper::text, rolcreaterole::text, rolcreatedb::text, rolreplication::text)
              from pg_roles where rolname = 'backup_leser'), 'Rolle backup_leser fehlt'),
  'super false, createrole false, createdb false, replication false',
  'Prüftor-Ausnahme `backup_lesen` Rolle ohne Sonderrechte: Attribute');

select is(
  case when pg_temp.rolle_da('backup_leser')
       then format('authenticator %s, postgres %s, service_role %s',
                   pg_has_role('backup_leser', 'authenticator', 'MEMBER')::text,
                   pg_has_role('backup_leser', 'postgres', 'MEMBER')::text,
                   pg_has_role('backup_leser', 'service_role', 'MEMBER')::text)
       else 'Rolle backup_leser fehlt' end,
  'authenticator false, postgres false, service_role false',
  'Prüftor-Ausnahme `backup_lesen` Rolle ohne Sonderrechte: keine Mitgliedschaft');

-- Neue Tabelle als postgres (wie eine künftige Migration); gleich wieder entfernt, damit die Schleifen sie nicht sehen
create table public.pgtap_backup_neu (id int);
select is(
  case when pg_temp.rolle_da('backup_leser')
       then has_table_privilege('backup_leser', 'public.pgtap_backup_neu', 'SELECT')::text
       else 'Rolle backup_leser fehlt' end,
  'true', 'Prüftor-Ausnahme `backup_lesen` Standardrechte für neue Tabellen');
drop table public.pgtap_backup_neu;

select is(
  pg_temp.zaehle_als('backup_leser', 'select count(*)::text from supabase_migrations.schema_migrations'),
  (select count(*)::text from supabase_migrations.schema_migrations),
  'Prüftor-Ausnahme `backup_lesen` Migrationsliste lesbar');

-- ---------------------------------------------------------------------
-- Storage-Rolle backup_speicher_leser
-- ---------------------------------------------------------------------

select is(
  pg_temp.zaehle_als('backup_speicher_leser',
    $$select format('saattueten %s, andere %s', count(*) filter (where bucket_id = 'saattueten'),
                    count(*) filter (where bucket_id <> 'saattueten')) from storage.objects$$),
  format('saattueten %s, andere 0', (select count(*) from storage.objects where bucket_id = 'saattueten')),
  'Prüftor-Ausnahme `backup_lesen` Storage-Rolle nur saattueten: liest nur Objekte aus saattueten');

select is(
  format('insert %s, update %s, delete %s',
    pg_temp.versuch_als('backup_speicher_leser',
      $$insert into storage.objects (bucket_id, name) values ('saattueten', 'pgtap/neu.jpg')$$),
    pg_temp.versuch_als('backup_speicher_leser', $$update storage.objects set name = name where bucket_id = 'saattueten'$$),
    pg_temp.versuch_als('backup_speicher_leser', $$delete from storage.objects where bucket_id = 'saattueten'$$)),
  'insert 42501, update 42501, delete 42501',
  'Prüftor-Ausnahme `backup_lesen` Storage-Rolle nur saattueten: schreibt nicht in storage.objects');

create function pg_temp.speicher_liest_public() returns text language plpgsql as $$
declare
  t text;
  ergebnis text;
  lesbar text[] := '{}';
begin
  if not pg_temp.rolle_da('backup_speicher_leser') then
    return 'Rolle backup_speicher_leser fehlt';
  end if;
  for t in select name from tabellen order by name loop
    ergebnis := pg_temp.zaehle_als('backup_speicher_leser', format('select count(*)::text from public.%I', t));
    if ergebnis not in ('0', 'Fehler 42501') then
      lesbar := lesbar || (t || ' ' || ergebnis);
    end if;
  end loop;
  return coalesce(nullif(array_to_string(lesbar, ', '), ''), 'keine');
end $$;
select is(pg_temp.speicher_liest_public(), 'keine',
  'Prüftor-Ausnahme `backup_lesen` Storage-Rolle nur saattueten: liest keine Tabelle in public');

select is(
  coalesce((select rolbypassrls::text from pg_roles where rolname = 'backup_speicher_leser'),
           'Rolle backup_speicher_leser fehlt'),
  'false', 'Prüftor-Ausnahme `backup_lesen` Storage-Rolle nur saattueten: ohne BYPASSRLS');

-- ---------------------------------------------------------------------
-- Rückfall (E7): Rolle ohne BYPASSRLS, Policies wie in der Migration (Plan A8); gilt auch, wenn lokal Bypass gilt
-- ---------------------------------------------------------------------

do $$
declare t text;
begin
  alter role backup_leser nobypassrls;
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('drop policy if exists backup_lesen on public.%I', t);
    execute format('create policy backup_lesen on public.%I for select to backup_leser using (true)', t);
  end loop;
exception when others then
  raise notice 'Rückfall nicht eingerichtet: % %', sqlstate, sqlerrm;
end $$;

create function pg_temp.rueckfall() returns setof text language plpgsql as $$
declare
  t text;
  soll text;
begin
  for t in select name from tabellen order by name loop
    execute format('select count(*)::text from public.%I', t) into soll;
    return next is(
      case when coalesce((select not rolbypassrls from pg_roles where rolname = 'backup_leser'), false)
           then pg_temp.zaehle_als('backup_leser', format('select count(*)::text from public.%I', t))
           else 'Rolle backup_leser fehlt' end,
      soll, 'Prüftor-Ausnahme `backup_lesen` Rückfall: ' || t);
  end loop;
end $$;
select * from pg_temp.rueckfall();

select * from finish();
rollback;
