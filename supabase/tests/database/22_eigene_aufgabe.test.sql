-- 22_eigene_aufgabe.test.sql · Tabelle eigene_aufgabe mit ersetzt_id (Issue #249, Plan 249 Testliste SQL; EA-AK5;
-- Konzept 8.1 Regeln 2 und 6, 11.6; Migration 20261118120000_eigene_aufgabe_ersetzt.sql). Muster 21_vorrat.test.sql
-- (ausfuehren_als, zaehle_als, ausfuehren_dann). Konten nur synthetisch (UUID ohne E-Mail-Adresse): Tim …000a mit
-- Eintrag in zugang, fremdes Konto …000b ohne. Anlagen QQA (echt), QQB (echt) und QQC (demo) mit eigenen IDs
-- f2490000-…. Alles in einer Transaktion mit rollback. Die Datenbank läuft in UTC.
begin;
create extension if not exists pgtap with schema extensions;
set local timezone to 'UTC';

-- ---------------------------------------------------------------------
-- Hilfsfunktionen (nur in dieser Sitzung, wie 21_vorrat.test.sql)
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

-- Einfügen einer Zeile eigene_aufgabe als Text (id = client_id; Anlage QQA, ohne Vorgänger)
create function pg_temp.einfuegen(id text,
                                  anlage_id text default 'f2490000-0000-4000-8000-000000000001',
                                  ersetzt_id text default null,
                                  intervall_d int default 30,
                                  name text default 'Zelt und Luftsteine reinigen') returns text
language sql immutable as $$
  select format('insert into public.eigene_aufgabe (id, client_id, anlage_id, name, intervall_d, ersetzt_id, app_version) '
                'values (%L, %L, %L, %L, %s, %L, %L)', id, id, anlage_id, name, intervall_d, ersetzt_id, 'pgtap')
$$;

select plan(25);

-- ---------------------------------------------------------------------
-- Fixture als postgres
-- ---------------------------------------------------------------------

insert into auth.users (id) values
  ('00000000-0000-4000-8000-00000000000a'), ('00000000-0000-4000-8000-00000000000b')
  on conflict (id) do nothing;
insert into public.zugang (user_id, app_version) values ('00000000-0000-4000-8000-00000000000a', 'pgtap')
  on conflict (user_id) do nothing;
insert into public.anlage (id, name, kuerzel, datenart, app_version) values
  ('f2490000-0000-4000-8000-000000000001', 'Testregal eins', 'QQA', 'echt', 'pgtap'),
  ('f2490000-0000-4000-8000-000000000002', 'Testregal zwei', 'QQB', 'echt', 'pgtap'),
  ('f2490000-0000-4000-8000-000000000003', 'Demoregal', 'QQC', 'demo', 'pgtap');

-- ---------------------------------------------------------------------
-- EA-AK5 Spalte, Fremdschlüssel, Check, Index
-- ---------------------------------------------------------------------

select has_column('public', 'eigene_aufgabe', 'ersetzt_id', 'EA-AK5 ersetzt_id nullable: Spalte besteht');
select col_type_is('public', 'eigene_aufgabe', 'ersetzt_id', 'uuid', 'EA-AK5 ersetzt_id nullable: Typ uuid');
select col_is_null('public', 'eigene_aufgabe', 'ersetzt_id', 'EA-AK5 ersetzt_id nullable: ohne not null');

select ok(exists (select 1 from pg_constraint
                   where conrelid = 'public.eigene_aufgabe'::regclass and contype = 'f'
                     and conname = 'eigene_aufgabe_ersetzt_fk'
                     and pg_get_constraintdef(oid)
                         ~ 'FOREIGN KEY \(ersetzt_id, anlage_id\) REFERENCES (public\.)?eigene_aufgabe\(id, anlage_id\)'),
          'EA-AK5 ersetzt_id nullable mit Fremdschlüssel eigene_aufgabe_ersetzt_fk auf (id, anlage_id) derselben Anlage');

select ok(exists (select 1 from pg_constraint
                   where conrelid = 'public.eigene_aufgabe'::regclass and contype = 'f'
                     and conname = 'eigene_aufgabe_ersetzt_fk'
                     and pg_get_constraintdef(oid) ~ 'ON DELETE SET NULL \(ersetzt_id\)'),
          'EA-AK5 Fremdschlüssel setzt beim Löschen nur ersetzt_id auf null');

select ok(exists (select 1 from pg_constraint
                   where conrelid = 'public.eigene_aufgabe'::regclass and contype = 'c'
                     and conname = 'eigene_aufgabe_ersetzt_nicht_selbst'),
          'EA-AK5 ersetzt_id nullable mit Check eigene_aufgabe_ersetzt_nicht_selbst');

select ok(exists (select 1 from pg_indexes
                   where schemaname = 'public' and tablename = 'eigene_aufgabe'
                     and indexname = 'eigene_aufgabe_ersetzt_id_idx'
                     and indexdef ~ '\(ersetzt_id\)'),
          'EA-AK5 Index eigene_aufgabe_ersetzt_id_idx auf ersetzt_id besteht');

select ok((select relrowsecurity from pg_class where oid = 'public.eigene_aufgabe'::regclass),
          'EA-AK5 RLS ist auf eigene_aufgabe aktiv');

select is((select count(*)::int from pg_policies
            where schemaname = 'public' and tablename = 'eigene_aufgabe' and cmd in ('DELETE', 'ALL')),
          0, 'EA-AK5 keine Policy für delete und keine für all');

-- ---------------------------------------------------------------------
-- EA-AK5 Tim liest, legt an und storniert; anon sieht nichts; Löschen ohne Wirkung
-- ---------------------------------------------------------------------

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2490000-0000-4000-8000-0000000000a1')),
          'ok 1', 'EA-AK5 Tim legt eine eigene Aufgabe an');

select is(pg_temp.zaehle_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            $q$select name || ' ' || intervall_d || ' ' || coalesce(ersetzt_id::text, 'ohne') from public.eigene_aufgabe
                where id = 'f2490000-0000-4000-8000-0000000000a1'$q$),
          'Zelt und Luftsteine reinigen 30 ohne', 'EA-AK5 Tim liest die Zeile, ersetzt_id leer');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2490000-0000-4000-8000-0000000000a2', intervall_d => 28,
                              ersetzt_id => 'f2490000-0000-4000-8000-0000000000a1')),
          'ok 1', 'EA-AK5 Tim legt einen Nachfolger derselben Anlage an');

select is(pg_temp.ausfuehren_dann('authenticated', '00000000-0000-4000-8000-00000000000a',
            $q$update public.eigene_aufgabe set storniert_am = now()
                where client_id = 'f2490000-0000-4000-8000-0000000000a1' and storniert_am is null$q$,
            $q$select (storniert_am is not null)::text from public.eigene_aufgabe
                where id = 'f2490000-0000-4000-8000-0000000000a1'$q$),
          'ok 1, true', 'EA-AK5 Tim storniert den Vorgänger über update storniert_am');

select ok(pg_temp.zaehle_als('anon', null, 'select count(*)::text from public.eigene_aufgabe')
            in ('0', 'Fehler 42501'),
          'EA-AK5 anon sieht keine Zeile (0 Zeilen oder 42501)');

select is(pg_temp.zaehle_als('authenticated', '00000000-0000-4000-8000-00000000000b',
            'select count(*)::text from public.eigene_aufgabe'),
          '0', 'EA-AK5 fremdes Konto liest 0 Zeilen');

select is(pg_temp.ausfuehren_dann('authenticated', '00000000-0000-4000-8000-00000000000a',
            $q$delete from public.eigene_aufgabe where anlage_id = 'f2490000-0000-4000-8000-000000000001'$q$,
            $q$select count(*)::text from public.eigene_aufgabe where anlage_id = 'f2490000-0000-4000-8000-000000000001'$q$),
          'ok 0, 2', 'EA-AK5 Löschen durch authenticated ohne Wirkung: delete ergibt 0 Zeilen, beide bleiben');

-- ---------------------------------------------------------------------
-- EA-AK5 ersetzt_id: andere Anlage 23503, sich selbst 23514
-- ---------------------------------------------------------------------

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2490000-0000-4000-8000-0000000000b1',
                              anlage_id => 'f2490000-0000-4000-8000-000000000002',
                              ersetzt_id => 'f2490000-0000-4000-8000-0000000000a2')),
          '23503', 'EA-AK5 ersetzt_id einer anderen Anlage scheitert (23503)');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2490000-0000-4000-8000-0000000000b2',
                              ersetzt_id => 'f2490000-0000-4000-8000-0000000000b2')),
          '23514', 'EA-AK5 ersetzt_id auf sich selbst scheitert (23514)');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2490000-0000-4000-8000-0000000000b3',
                              ersetzt_id => 'f2490000-0000-4000-8000-0000000000ff')),
          '23503', 'EA-AK5 ersetzt_id auf eine unbekannte Zeile scheitert (23503)');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2490000-0000-4000-8000-0000000000a3', intervall_d => 14,
                              ersetzt_id => 'f2490000-0000-4000-8000-0000000000a2')),
          'ok 1', 'EA-AK5 dritter Eintrag der Kette an derselben Anlage gelingt');

select is(pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2490000-0000-4000-8000-0000000000b4', intervall_d => 366)),
          '23514', 'EA-AK5 Intervall bleibt 1 bis 365 (366: 23514)');

-- TO2: zweiter Upsert mit derselben client_id ergibt keine zweite Zeile
select is(pg_temp.ausfuehren_dann('authenticated', '00000000-0000-4000-8000-00000000000a',
            pg_temp.einfuegen('f2490000-0000-4000-8000-0000000000a3', intervall_d => 14,
                              ersetzt_id => 'f2490000-0000-4000-8000-0000000000a2')
              || ' on conflict (client_id) do nothing',
            $q$select count(*)::text from public.eigene_aufgabe where client_id = 'f2490000-0000-4000-8000-0000000000a3'$q$),
          'ok 0, 1', 'EA-AK5 TO2 zweiter Upsert mit derselben client_id ergibt keine zweite Zeile');

-- ---------------------------------------------------------------------
-- EA-AK5 Löschen der Anlage entfernt die Kette ohne Fehler
-- ---------------------------------------------------------------------

select is(pg_temp.ausfuehren_dann('service_role', null,
            $q$delete from public.anlage where id = 'f2490000-0000-4000-8000-000000000001'$q$,
            $q$select count(*)::text from public.eigene_aufgabe where anlage_id = 'f2490000-0000-4000-8000-000000000001'$q$),
          'ok 1, 0', 'EA-AK5 Löschen der Anlage (Service-Rolle) entfernt Vorgänger und Nachfolger ohne Fehler');

-- Kette an der Demo-Anlage, danach datenart_loeschen('demo')
insert into public.eigene_aufgabe (id, client_id, anlage_id, name, intervall_d, app_version) values
  ('f2490000-0000-4000-8000-0000000000c1', 'f2490000-0000-4000-8000-0000000000c1',
   'f2490000-0000-4000-8000-000000000003', 'Luftfilter wechseln', 90, 'pgtap');
insert into public.eigene_aufgabe (id, client_id, anlage_id, name, intervall_d, ersetzt_id, app_version) values
  ('f2490000-0000-4000-8000-0000000000c2', 'f2490000-0000-4000-8000-0000000000c2',
   'f2490000-0000-4000-8000-000000000003', 'Luftfilter wechseln', 60, 'f2490000-0000-4000-8000-0000000000c1', 'pgtap');

set local role service_role;
select lives_ok($$select public.datenart_loeschen('demo')$$,
                'EA-AK5 Löschen der Anlage: datenart_loeschen(demo) läuft mit einer Kette durch');
reset role;

select is((select count(*)::text from public.eigene_aufgabe
            where id in ('f2490000-0000-4000-8000-0000000000c1', 'f2490000-0000-4000-8000-0000000000c2')),
          '0', 'EA-AK5 Löschen der Anlage: datenart_loeschen(demo) entfernt die Kette der Demo-Anlage');

select * from finish();
rollback;
