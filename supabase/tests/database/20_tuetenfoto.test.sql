-- 20_tuetenfoto.test.sql · Tabelle tuetenfoto (Issue #207, Plan 207 Testliste SQL; TF1-AK1, TO2; Konzept 8.1 Regeln 2,
-- 3 und 6, 11.3, 11.6 Punkt 3; Plan 37 A16). Muster 00_zugriff.test.sql (ausfuehren_als, zaehle_als) und
-- 15_sorten_erfassung.test.sql (Fixture als postgres). Konten nur synthetisch (UUID ohne E-Mail-Adresse):
-- Tim …000a mit Eintrag in zugang, fremdes Konto …000b ohne. Sorte und Packung mit eigenen IDs f2070000-….
-- Alles in einer Transaktion mit rollback. Die Datenbank läuft in UTC.
begin;
create extension if not exists pgtap with schema extensions;
set local timezone to 'UTC';

-- ---------------------------------------------------------------------
-- Hilfsfunktionen (nur in dieser Sitzung, wie 00_zugriff.test.sql)
-- ---------------------------------------------------------------------

create function pg_temp.als(rolle text, sub uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub', sub, 'role', rolle)::text, true);
  execute format('set local role %I', rolle);
end $$;

-- Anweisung als Rolle ausführen; Ergebnis «ok <Zeilen>» oder der SQLSTATE des Fehlers
create function pg_temp.ausfuehren_als(rolle text, sub uuid, anweisung text) returns text language plpgsql as $$
declare
  ergebnis text;
  n bigint;
begin
  perform pg_temp.als(rolle, sub);
  begin
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

-- Abfrage (ein Wert) als Rolle; Fehler ergeben «Fehler <SQLSTATE>»
create function pg_temp.zaehle_als(rolle text, sub uuid, abfrage text) returns text language plpgsql as $$
declare
  ergebnis text;
begin
  perform pg_temp.als(rolle, sub);
  begin
    execute abfrage into ergebnis;
  exception when others then
    ergebnis := 'Fehler ' || sqlstate;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return ergebnis;
end $$;

-- Anweisung als Rolle, danach Abfrage als postgres (feste Reihenfolge)
create function pg_temp.ausfuehren_dann(rolle text, sub uuid, anweisung text, abfrage text) returns text language plpgsql as $$
declare
  ergebnis text;
  danach text;
begin
  ergebnis := pg_temp.ausfuehren_als(rolle, sub, anweisung);
  execute abfrage into danach;
  return ergebnis || ', ' || coalesce(danach, '(leer)');
end $$;

-- Einfügen einer Zeile tuetenfoto als Text (client_id, seite, pfad; Sorte und Packung aus der Fixture)
create function pg_temp.einfuegen(client_id text, seite text, pfad text,
                                  sorte_id text default 'f2070000-0000-4000-8000-000000000001',
                                  saatgut_id text default 'f2070000-0000-4000-8000-000000000002') returns text
language sql immutable as $$
  select format('insert into public.tuetenfoto (client_id, sorte_id, saatgut_id, seite, pfad, app_version) '
                'values (%L, %L, %L, %L, %L, %L)', client_id, sorte_id, saatgut_id, seite, pfad, 'pgtap')
$$;

select plan(30);

-- ---------------------------------------------------------------------
-- Fixture als postgres
-- ---------------------------------------------------------------------

insert into auth.users (id) values
  ('00000000-0000-4000-8000-00000000000a'), ('00000000-0000-4000-8000-00000000000b')
  on conflict (id) do nothing;
insert into public.zugang (user_id, app_version) values ('00000000-0000-4000-8000-00000000000a', 'pgtap')
  on conflict (user_id) do nothing;
insert into public.sorte_schluessel (id, sorte_key) values ('f2070000-0000-4000-8000-000000000001', 'pgtap-207-sorte');
insert into public.saatgut (id, sorte_id, app_version)
  values ('f2070000-0000-4000-8000-000000000002', 'f2070000-0000-4000-8000-000000000001', 'pgtap');

-- ---------------------------------------------------------------------
-- TF1-AK1 RLS, Policies, Rechte, Index
-- ---------------------------------------------------------------------

select ok((select relrowsecurity from pg_class where oid = 'public.tuetenfoto'::regclass),
          'TF1-AK1 RLS ist auf tuetenfoto aktiv');

select is((select string_agg(policyname || ':' || cmd, ',' order by policyname)
             from pg_policies where schemaname = 'public' and tablename = 'tuetenfoto'
              and 'authenticated' = any (roles)),
          'tim_aendern:UPDATE,tim_einfuegen:INSERT,tim_lesen:SELECT',
          'TF1-AK1 Policies tim_lesen, tim_einfuegen, tim_aendern für authenticated');

select is((select count(*)::int from pg_policies
            where schemaname = 'public' and tablename = 'tuetenfoto' and 'authenticated' = any (roles)
              and coalesce(qual, '') || coalesce(with_check, '') !~ 'ist_tim\(\)'),
          0, 'TF1-AK1 jede Policy für authenticated prüft ist_tim()');

select is((select count(*)::int from pg_policies
            where schemaname = 'public' and tablename = 'tuetenfoto' and cmd in ('DELETE', 'ALL')),
          0, 'TF1-AK1 keine Policy für delete und keine für all');

select ok(not has_table_privilege('anon', 'public.tuetenfoto', 'TRUNCATE')
          and not has_table_privilege('authenticated', 'public.tuetenfoto', 'TRUNCATE'),
          'TF1-AK1 kein TRUNCATE für anon und authenticated');

select ok(has_table_privilege('backup_leser', 'public.tuetenfoto', 'SELECT'),
          'TF1-AK1 select für backup_leser (Backup, Konzept 11.6)');

select ok(not has_table_privilege('anon', 'public.tuetenfoto', 'SELECT')
          and not has_table_privilege('anon', 'public.tuetenfoto', 'INSERT'),
          'TF1-AK1 anon hat weder select noch insert');

select ok(exists (select 1 from pg_indexes
                   where schemaname = 'public' and tablename = 'tuetenfoto' and indexname = 'tuetenfoto_sorte'
                     and indexdef ~ '\(sorte_id\) WHERE \(storniert_am IS NULL\)'),
          'TF1-AK1 Teilindex tuetenfoto_sorte auf sorte_id für nicht stornierte Zeilen besteht');

-- ---------------------------------------------------------------------
-- TF1-AK1 Tim fügt ein, liest, storniert; löscht nichts
-- ---------------------------------------------------------------------

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2070000-0000-4000-8000-0000000000c1', 'vorne',
                              'f2070000-0000-4000-8000-000000000001/f2070000-0000-4000-8000-0000000000f1.jpg')),
          'ok 1', 'TF1-AK1 Tim fügt eine Zeile ein');

select is(pg_temp.zaehle_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            $q$select count(*)::text from public.tuetenfoto where sorte_id = 'f2070000-0000-4000-8000-000000000001'$q$),
          '1', 'TF1-AK1 Tim liest seine Zeile');

-- Pfad unter fremder sorte_id (Plan 37 A16): die Zeile gilt für die bestehende Sorte
select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2070000-0000-4000-8000-0000000000c2', 'hinten',
                              'f2070000-0000-4000-8000-0000000000aa/f2070000-0000-4000-8000-0000000000f2.jpg')),
          'ok 1', 'TF1-AK1 Tim fügt eine Zeile mit Pfad unter fremder sorte_id ein (Plan 37 A16)');

select is(pg_temp.ausfuehren_dann('authenticated', '00000000-0000-4000-8000-00000000000a',
            $q$update public.tuetenfoto set storniert_am = now()
                where client_id = 'f2070000-0000-4000-8000-0000000000c1' and storniert_am is null$q$,
            $q$select (storniert_am is not null)::text from public.tuetenfoto
                where client_id = 'f2070000-0000-4000-8000-0000000000c1'$q$),
          'ok 1, true', 'TF1-AK1 Tim storniert über update storniert_am');

select is(pg_temp.ausfuehren_dann('authenticated', '00000000-0000-4000-8000-00000000000a',
            $q$delete from public.tuetenfoto where sorte_id = 'f2070000-0000-4000-8000-000000000001'$q$,
            $q$select count(*)::text from public.tuetenfoto where sorte_id = 'f2070000-0000-4000-8000-000000000001'$q$),
          'ok 0, 2', 'TF1-AK1 Tim löscht nichts: delete ergibt 0 Zeilen, die Zeilen bleiben');

-- ---------------------------------------------------------------------
-- TF1-AK1 fremdes Konto und anon
-- ---------------------------------------------------------------------

select is(pg_temp.zaehle_als('authenticated', '00000000-0000-4000-8000-00000000000b',
            'select count(*)::text from public.tuetenfoto'),
          '0', 'TF1-AK1 fremdes Konto liest 0 Zeilen');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000b',
            pg_temp.einfuegen('f2070000-0000-4000-8000-0000000000c3', 'vorne',
                              'f2070000-0000-4000-8000-000000000001/f2070000-0000-4000-8000-0000000000f3.jpg')),
          '42501', 'TF1-AK1 fremdes Konto fügt nicht ein (42501)');

select is(pg_temp.ausfuehren_dann('authenticated', '00000000-0000-4000-8000-00000000000b',
            $q$update public.tuetenfoto set storniert_am = now() where storniert_am is null$q$,
            $q$select count(*)::text from public.tuetenfoto where storniert_am is null
                and sorte_id = 'f2070000-0000-4000-8000-000000000001'$q$),
          'ok 0, 1', 'TF1-AK1 fremdes Konto storniert nichts (update 0 Zeilen)');

select is(pg_temp.ausfuehren_dann('authenticated', '00000000-0000-4000-8000-00000000000b',
            'delete from public.tuetenfoto',
            $q$select count(*)::text from public.tuetenfoto where sorte_id = 'f2070000-0000-4000-8000-000000000001'$q$),
          'ok 0, 2', 'TF1-AK1 fremdes Konto löscht nichts');

select is(pg_temp.zaehle_als('anon', null, 'select count(*)::text from public.tuetenfoto'),
          'Fehler 42501', 'TF1-AK1 anon liest nicht (42501)');

select is(pg_temp.ausfuehren_als('anon', null,
            pg_temp.einfuegen('f2070000-0000-4000-8000-0000000000c4', 'vorne',
                              'f2070000-0000-4000-8000-000000000001/f2070000-0000-4000-8000-0000000000f4.jpg')),
          '42501', 'TF1-AK1 anon schreibt nicht (42501)');

-- ---------------------------------------------------------------------
-- TF1-AK1 Checks: seite, pfad, Fremdschlüssel
-- ---------------------------------------------------------------------

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2070000-0000-4000-8000-0000000000d1', 'oben',
                              'f2070000-0000-4000-8000-000000000001/f2070000-0000-4000-8000-0000000000e1.jpg')),
          '23514', 'TF1-AK1 seite nur vorne oder hinten (oben: 23514)');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2070000-0000-4000-8000-0000000000d2', 'vorne', 'foto.jpg')),
          '23514', 'TF1-AK1 pfad nur <uuid>/<uuid>.jpg (foto.jpg: 23514)');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2070000-0000-4000-8000-0000000000d3', 'vorne', '../x/y.jpg')),
          '23514', 'TF1-AK1 pfad nur <uuid>/<uuid>.jpg (../x/y.jpg: 23514)');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2070000-0000-4000-8000-0000000000d4', 'vorne',
                              'f2070000-0000-4000-8000-000000000001/f2070000-0000-4000-8000-0000000000e4.png')),
          '23514', 'TF1-AK1 pfad nur <uuid>/<uuid>.jpg (.png: 23514)');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2070000-0000-4000-8000-0000000000d5', 'vorne',
                              'F2070000-0000-4000-8000-000000000001/F2070000-0000-4000-8000-0000000000E5.jpg')),
          '23514', 'TF1-AK1 pfad nur <uuid>/<uuid>.jpg (Grossbuchstaben: 23514)');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2070000-0000-4000-8000-0000000000d6', 'vorne',
                              'f2070000-0000-4000-8000-000000000001/f2070000-0000-4000-8000-0000000000e6.jpg/x.jpg')),
          '23514', 'TF1-AK1 pfad nur <uuid>/<uuid>.jpg (dritte Ebene: 23514)');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2070000-0000-4000-8000-0000000000d7', 'vorne',
                              'f2070000-0000-4000-8000-000000000099/f2070000-0000-4000-8000-0000000000e7.jpg',
                              'f2070000-0000-4000-8000-000000000099')),
          '23503', 'TF1-AK1 sorte_id muss bestehen (23503)');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2070000-0000-4000-8000-0000000000d8', 'vorne',
                              'f2070000-0000-4000-8000-000000000001/f2070000-0000-4000-8000-0000000000e8.jpg',
                              'f2070000-0000-4000-8000-000000000001', 'f2070000-0000-4000-8000-000000000098')),
          '23503', 'TF1-AK1 saatgut_id muss bestehen (23503)');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            format('insert into public.tuetenfoto (client_id, sorte_id, seite, pfad, app_version) values (%L, %L, %L, %L, %L)',
                   'f2070000-0000-4000-8000-0000000000d9', 'f2070000-0000-4000-8000-000000000001', 'hinten',
                   'f2070000-0000-4000-8000-000000000001/f2070000-0000-4000-8000-0000000000e9.jpg', 'pgtap')),
          'ok 1', 'TF1-AK1 saatgut_id darf leer sein («Tütenfoto ergänzen» im Detail der Sorte)');

-- ---------------------------------------------------------------------
-- TF1-AK1 TO2 zweiter Upsert mit derselben client_id
-- ---------------------------------------------------------------------

select is(pg_temp.ausfuehren_dann('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2070000-0000-4000-8000-0000000000c2', 'hinten',
                              'f2070000-0000-4000-8000-0000000000aa/f2070000-0000-4000-8000-0000000000f2.jpg')
              || ' on conflict (client_id) do nothing',
            $q$select count(*)::text from public.tuetenfoto where client_id = 'f2070000-0000-4000-8000-0000000000c2'$q$),
          'ok 0, 1', 'TF1-AK1 TO2 zweiter Upsert mit derselben client_id ergibt keine zweite Zeile');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2070000-0000-4000-8000-0000000000c2', 'hinten',
                              'f2070000-0000-4000-8000-0000000000aa/f2070000-0000-4000-8000-0000000000f2.jpg')),
          '23505', 'TF1-AK1 TO2 ohne on conflict meldet die doppelte client_id (23505)');

select * from finish();
rollback;
