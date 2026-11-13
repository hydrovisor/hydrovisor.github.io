-- 21_vorrat.test.sql · Tabelle vorrat_ereignis (Issue #215, Plan 215 Testliste SQL; VR1-AK1, TO2; Konzept 8.1 Regeln
-- 2, 3 und 6, 11.4). Muster 20_tuetenfoto.test.sql (ausfuehren_als, zaehle_als, ausfuehren_dann). Konten nur
-- synthetisch (UUID ohne E-Mail-Adresse): Tim …000a mit Eintrag in zugang, fremdes Konto …000b ohne. Sorte und
-- Packung mit eigenen IDs f2150000-…. Alles in einer Transaktion mit rollback. Die Datenbank läuft in UTC.
begin;
create extension if not exists pgtap with schema extensions;
set local timezone to 'UTC';

-- ---------------------------------------------------------------------
-- Hilfsfunktionen (nur in dieser Sitzung, wie 20_tuetenfoto.test.sql)
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

-- Einfügen einer Zeile vorrat_ereignis als Text (client_id, typ; Sorte aus der Fixture, saatgut_id leer)
create function pg_temp.einfuegen(client_id text, typ text,
                                  sorte_id text default 'f2150000-0000-4000-8000-000000000001',
                                  saatgut_id text default null,
                                  gilt_ab text default '2027-01-15 09:00:00+00') returns text
language sql immutable as $$
  select format('insert into public.vorrat_ereignis (client_id, sorte_id, saatgut_id, typ, gilt_ab, app_version) '
                'values (%L, %L, %L, %L, %L, %L)', client_id, sorte_id, saatgut_id, typ, gilt_ab, 'pgtap')
$$;

select plan(33);

-- ---------------------------------------------------------------------
-- Fixture als postgres
-- ---------------------------------------------------------------------

insert into auth.users (id) values
  ('00000000-0000-4000-8000-00000000000a'), ('00000000-0000-4000-8000-00000000000b')
  on conflict (id) do nothing;
insert into public.zugang (user_id, app_version) values ('00000000-0000-4000-8000-00000000000a', 'pgtap')
  on conflict (user_id) do nothing;
insert into public.sorte_schluessel (id, sorte_key) values ('f2150000-0000-4000-8000-000000000001', 'pgtap-215-sorte');
insert into public.saatgut (id, sorte_id, app_version)
  values ('f2150000-0000-4000-8000-000000000002', 'f2150000-0000-4000-8000-000000000001', 'pgtap');

-- ---------------------------------------------------------------------
-- VR1-AK1 RLS, Policies, Rechte, Index
-- ---------------------------------------------------------------------

select ok((select relrowsecurity from pg_class where oid = 'public.vorrat_ereignis'::regclass),
          'VR1-AK1 RLS ist auf vorrat_ereignis aktiv');

select is((select string_agg(policyname || ':' || cmd, ',' order by policyname)
             from pg_policies where schemaname = 'public' and tablename = 'vorrat_ereignis'
              and 'authenticated' = any (roles)),
          'tim_aendern:UPDATE,tim_einfuegen:INSERT,tim_lesen:SELECT',
          'VR1-AK1 Policies tim_lesen, tim_einfuegen, tim_aendern für authenticated');

select is((select count(*)::int from pg_policies
            where schemaname = 'public' and tablename = 'vorrat_ereignis' and 'authenticated' = any (roles)
              and coalesce(qual, '') || coalesce(with_check, '') !~ 'ist_tim\(\)'),
          0, 'VR1-AK1 jede Policy für authenticated prüft ist_tim()');

select is((select count(*)::int from pg_policies
            where schemaname = 'public' and tablename = 'vorrat_ereignis' and cmd in ('DELETE', 'ALL')),
          0, 'VR1-AK1 keine Policy für delete und keine für all');

select ok(not has_table_privilege('anon', 'public.vorrat_ereignis', 'TRUNCATE')
          and not has_table_privilege('authenticated', 'public.vorrat_ereignis', 'TRUNCATE'),
          'VR1-AK1 kein TRUNCATE für anon und authenticated');

select ok(has_table_privilege('backup_leser', 'public.vorrat_ereignis', 'SELECT'),
          'VR1-AK1 select für backup_leser (Backup, Konzept 11.6)');

select ok(not has_table_privilege('anon', 'public.vorrat_ereignis', 'SELECT')
          and not has_table_privilege('anon', 'public.vorrat_ereignis', 'INSERT'),
          'VR1-AK1 anon hat weder select noch insert');

select ok(exists (select 1 from pg_indexes
                   where schemaname = 'public' and tablename = 'vorrat_ereignis'
                     and indexname = 'vorrat_ereignis_sorte'
                     and indexdef ~ '\(sorte_id\) WHERE \(storniert_am IS NULL\)'),
          'VR1-AK1 Teilindex vorrat_ereignis_sorte auf sorte_id für nicht stornierte Zeilen besteht');

-- ---------------------------------------------------------------------
-- VR1-AK1 Tim fügt ein, liest, storniert; löscht nichts
-- ---------------------------------------------------------------------

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2150000-0000-4000-8000-0000000000c1', 'aufgebraucht')),
          'ok 1', 'VR1-AK1 Tim fügt aufgebraucht ein');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2150000-0000-4000-8000-0000000000c2', 'vorraetig', gilt_ab => '2027-01-15 10:00:00+00')),
          'ok 1', 'VR1-AK1 Tim fügt vorraetig ein');

select is(pg_temp.zaehle_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            $q$select string_agg(typ, ',' order by gilt_ab) from public.vorrat_ereignis
                where sorte_id = 'f2150000-0000-4000-8000-000000000001'$q$),
          'aufgebraucht,vorraetig', 'VR1-AK1 Tim liest beide Zeilen');

select is(pg_temp.ausfuehren_dann('authenticated', '00000000-0000-4000-8000-00000000000a',
            $q$update public.vorrat_ereignis set storniert_am = now(), storno_grund = 'fehleingabe'
                where client_id = 'f2150000-0000-4000-8000-0000000000c2' and storniert_am is null$q$,
            $q$select (storniert_am is not null)::text || ' ' || storno_grund::text from public.vorrat_ereignis
                where client_id = 'f2150000-0000-4000-8000-0000000000c2'$q$),
          'ok 1, true fehleingabe', 'VR1-AK1 Tim storniert über update storniert_am und storno_grund');

select is(pg_temp.ausfuehren_dann('authenticated', '00000000-0000-4000-8000-00000000000a',
            $q$delete from public.vorrat_ereignis where sorte_id = 'f2150000-0000-4000-8000-000000000001'$q$,
            $q$select count(*)::text from public.vorrat_ereignis where sorte_id = 'f2150000-0000-4000-8000-000000000001'$q$),
          'ok 0, 2', 'VR1-AK1 Tim löscht nichts: delete ergibt 0 Zeilen, die Zeilen bleiben');

-- ---------------------------------------------------------------------
-- VR1-AK1 fremdes Konto und anon
-- ---------------------------------------------------------------------

select is(pg_temp.zaehle_als('authenticated', '00000000-0000-4000-8000-00000000000b',
            'select count(*)::text from public.vorrat_ereignis'),
          '0', 'VR1-AK1 fremdes Konto liest 0 Zeilen');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000b',
            pg_temp.einfuegen('f2150000-0000-4000-8000-0000000000c3', 'aufgebraucht')),
          '42501', 'VR1-AK1 fremdes Konto fügt nicht ein (42501)');

select is(pg_temp.ausfuehren_dann('authenticated', '00000000-0000-4000-8000-00000000000b',
            $q$update public.vorrat_ereignis set storniert_am = now() where storniert_am is null$q$,
            $q$select count(*)::text from public.vorrat_ereignis where storniert_am is null
                and sorte_id = 'f2150000-0000-4000-8000-000000000001'$q$),
          'ok 0, 1', 'VR1-AK1 fremdes Konto storniert nichts (update 0 Zeilen)');

select is(pg_temp.ausfuehren_dann('authenticated', '00000000-0000-4000-8000-00000000000b',
            'delete from public.vorrat_ereignis',
            $q$select count(*)::text from public.vorrat_ereignis where sorte_id = 'f2150000-0000-4000-8000-000000000001'$q$),
          'ok 0, 2', 'VR1-AK1 fremdes Konto löscht nichts');

select is(pg_temp.zaehle_als('anon', null, 'select count(*)::text from public.vorrat_ereignis'),
          'Fehler 42501', 'VR1-AK1 anon liest nicht (42501)');

select is(pg_temp.ausfuehren_als('anon', null,
            pg_temp.einfuegen('f2150000-0000-4000-8000-0000000000c4', 'aufgebraucht')),
          '42501', 'VR1-AK1 anon schreibt nicht (42501)');

-- ---------------------------------------------------------------------
-- VR1-AK1 Checks: typ, Fremdschlüssel, Pflichtfelder, nacherfasst
-- ---------------------------------------------------------------------

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2150000-0000-4000-8000-0000000000d1', 'leer')),
          '23514', 'VR1-AK1 typ nur aufgebraucht oder vorraetig (leer: 23514)');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2150000-0000-4000-8000-0000000000d2', 'Aufgebraucht')),
          '23514', 'VR1-AK1 typ nur aufgebraucht oder vorraetig (Aufgebraucht: 23514)');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2150000-0000-4000-8000-0000000000d3', '')),
          '23514', 'VR1-AK1 typ nur aufgebraucht oder vorraetig (leerer Text: 23514)');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2150000-0000-4000-8000-0000000000d4', 'aufgebraucht',
                              sorte_id => 'f2150000-0000-4000-8000-000000000099')),
          '23503', 'VR1-AK1 sorte_id muss bestehen (23503)');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            format('insert into public.vorrat_ereignis (client_id, typ, gilt_ab, app_version) values (%L, %L, %L, %L)',
                   'f2150000-0000-4000-8000-0000000000d5', 'aufgebraucht', '2027-01-15 09:00:00+00', 'pgtap')),
          '23502', 'VR1-AK1 sorte_id ist Pflicht (23502)');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2150000-0000-4000-8000-0000000000d6', 'aufgebraucht',
                              saatgut_id => 'f2150000-0000-4000-8000-000000000002')),
          'ok 1', 'VR1-AK1 saatgut_id optional: bestehende Packung ok');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2150000-0000-4000-8000-0000000000d7', 'aufgebraucht',
                              saatgut_id => 'f2150000-0000-4000-8000-000000000098')),
          '23503', 'VR1-AK1 saatgut_id optional: unbekannte Packung 23503');

select is((select saatgut_id::text from public.vorrat_ereignis
            where client_id = 'f2150000-0000-4000-8000-0000000000c1'),
          null, 'VR1-AK1 saatgut_id optional: ohne Angabe null');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            format('insert into public.vorrat_ereignis (client_id, sorte_id, typ, app_version) values (%L, %L, %L, %L)',
                   'f2150000-0000-4000-8000-0000000000d8', 'f2150000-0000-4000-8000-000000000001',
                   'aufgebraucht', 'pgtap')),
          '23502', 'VR1-AK1 gilt_ab ist Pflicht (23502)');

-- nacherfasst ist berechnet: erfasst_am − gilt_ab > 2 Stunden (8.1 Regel 3)
select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2150000-0000-4000-8000-0000000000d9', 'aufgebraucht',
                              gilt_ab => (now() - interval '3 days')::text)),
          'ok 1', 'VR1-AK1 nacherfasst: Tim erfasst ein Ereignis drei Tage zurück');

select is((select string_agg(client_id::text || '=' || nacherfasst::text, ',' order by client_id)
             from public.vorrat_ereignis
            where client_id in ('f2150000-0000-4000-8000-0000000000d9', 'f2150000-0000-4000-8000-0000000000d6')),
          'f2150000-0000-4000-8000-0000000000d6=' || ((now() - '2027-01-15 09:00:00+00'::timestamptz) > interval '2 hours')::text
            || ',f2150000-0000-4000-8000-0000000000d9=true',
          'VR1-AK1 nacherfasst wird aus erfasst_am und gilt_ab berechnet');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            $q$update public.vorrat_ereignis set nacherfasst = false
                where client_id = 'f2150000-0000-4000-8000-0000000000d9'$q$),
          '428C9', 'VR1-AK1 nacherfasst ist generiert und nicht schreibbar (428C9)');

-- ---------------------------------------------------------------------
-- VR1-AK1 TO2 zweiter Upsert mit derselben client_id
-- ---------------------------------------------------------------------

select is(pg_temp.ausfuehren_dann('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2150000-0000-4000-8000-0000000000c1', 'aufgebraucht')
              || ' on conflict (client_id) do nothing',
            $q$select count(*)::text from public.vorrat_ereignis where client_id = 'f2150000-0000-4000-8000-0000000000c1'$q$),
          'ok 0, 1', 'VR1-AK1 TO2 zweiter Upsert mit derselben client_id ergibt keine zweite Zeile');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2150000-0000-4000-8000-0000000000c1', 'aufgebraucht')),
          '23505', 'VR1-AK1 TO2 ohne on conflict meldet die doppelte client_id (23505)');

select * from finish();
rollback;
