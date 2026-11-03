-- 06_demo_loeschen.test.sql · Demo- und Testdaten löschen (Konzept 8.5, 8.1 Regel 7, 11.6; Entwurf A10; Plan 9 Ä4)
-- smoke2.sql Kaskade über anlage; smoke3.sql C7 datenart_loeschen() mit der Service-Rolle.
-- Zählungen nur über die eigenen Fixture-IDs; «demo 0» gilt global, weil datenart_loeschen('demo') alles Demo löscht.
begin;
create extension if not exists pgtap with schema extensions;
-- Die Datenbank läuft in UTC wie in Supabase; alle Zeitpunkte stehen ausdrücklich in Europe/Zurich.
set local timezone to 'UTC';
select plan(14);

-- ---------------------------------------------------------------------
-- Fixtures als postgres
-- Anlagen: …301 R echt, …302 XP demo, …303 YP test, …304 XK demo (nur smoke2-Kaskade)
-- Je Anlage n = 1, 2, 3, 4: Platz …3n1 (2.3), …3n2 (A1), Gefäss …3n3, Satz …3n4, Pflanzung …3n5,
-- Messung …3n6, Ansatz …3n7, Ereignis …3n8, Pflanzvorgang …3n9
-- ---------------------------------------------------------------------

insert into auth.users (id) values ('00000000-0000-4000-8000-00000000000a') on conflict (id) do nothing;
insert into public.zugang (user_id, app_version) values ('00000000-0000-4000-8000-00000000000a', 'pgtap');
insert into public.quelle (quelle_id, titel, link, klasse, anbaumethode, app_version)
  values ('pgtap-q1', 'Testquelle', 'https://example.invalid/q1', 'peer_review', 'dwc', 'pgtap');
insert into public.art_schluessel (art_id) values ('pgtap_art_a');
insert into public.kulturgruppe (kulturgruppe_id, name, leitkultur_art_id, ec_obergrenze_validator, app_version)
  values ('pgtap_kg', 'Testgruppe', 'pgtap_art_a', 2.0, 'pgtap');
insert into public.art (art_id, name_de, name_wiss, kulturgruppe_id, quelldatei, zeile_id, commit, app_version)
  values ('pgtap_art_a', 'Testart A', 'Testus primus', 'pgtap_kg', 'art.csv', 'art.pgtap_art_a', 'pgtap', 'pgtap');
insert into public.sorte_schluessel (id, sorte_key) values ('f6000000-0000-4000-8000-000000000101', 'pgtap-sorte-a');
insert into public.sorte (sorte_id, name, art_id, kulturtyp, quelldatei, zeile_id, commit, app_version)
  values ('f6000000-0000-4000-8000-000000000101', 'Testsorte A', 'pgtap_art_a', 'blatt', 'sorten.csv', 'pgtap-sorte-a', 'pgtap', 'pgtap');
insert into public.messgeraet (id, modell, app_version) values ('f6000000-0000-4000-8000-000000000201', 'Testgeraet', 'pgtap');
insert into public.gefaessmodell (id, name, form, innen_l_mm, innen_b_mm, innen_h_mm, betriebsvolumen_l, app_version)
  values ('f6000000-0000-4000-8000-000000000211', 'Testbox', 'rechteckig', 400, 300, 170, 9, 'pgtap');
insert into public.deckeltyp (id, name, topfdurchmesser_mm, loecher_je_reihe, app_version)
  values ('f6000000-0000-4000-8000-000000000212', 'Testdeckel', 80, '{2,2,2}', 'pgtap');
insert into public.anlage (id, name, kuerzel, datenart, app_version) values
  ('f6000000-0000-4000-8000-000000000301', 'Testregal', 'R', 'echt', 'pgtap'),
  ('f6000000-0000-4000-8000-000000000302', 'Demo', 'XP', 'demo', 'pgtap'),
  ('f6000000-0000-4000-8000-000000000303', 'Testanlage', 'YP', 'test', 'pgtap'),
  ('f6000000-0000-4000-8000-000000000304', 'Demo Kaskade', 'XK', 'demo', 'pgtap');

create function pg_temp.id(n int, teil int) returns uuid language sql immutable as $$
  select ('f6000000-0000-4000-8000-0000000003' || n || teil)::uuid
$$;

-- Bestand einer Anlage n anlegen
create function pg_temp.bestand(n int) returns void language plpgsql as $$
declare anlage uuid := ('f6000000-0000-4000-8000-00000000030' || n)::uuid;
begin
  insert into public.platz (id, anlage_id, kennung, rolle, app_version) values
    (pg_temp.id(n, 1), anlage, '2.3', 'gefaess', 'pgtap'),
    (pg_temp.id(n, 2), anlage, 'A1', 'anzuchtort', 'pgtap');
  insert into public.gefaess (id, platz_id, gefaessmodell_id, deckeltyp_id, betriebsart, betriebsvolumen_l, intervall_messen_d,
                              intervall_wechseln_d, gueltig_von, app_version)
    values (pg_temp.id(n, 3), pg_temp.id(n, 1), 'f6000000-0000-4000-8000-000000000211', 'f6000000-0000-4000-8000-000000000212',
            'dwc', 9, 2, 14, '2027-01-03 10:00 Europe/Zurich', 'pgtap');
  insert into public.pflanzvorgang (id, client_id, begonnen_am, gespeichert_am, einstieg, anzahl_pflanzungen, app_version)
    values (pg_temp.id(n, 9), gen_random_uuid(), '2027-01-08 09:00 Europe/Zurich', '2027-01-08 09:01 Europe/Zurich', 'heute', 1, 'pgtap');
  insert into public.satz (id, client_id, sorte_id, kulturform, anzuchtort_platz_id, anzahl_schwaemme, samen_je_schwamm,
                           saatdatum, gilt_ab, app_version)
    values (pg_temp.id(n, 4), gen_random_uuid(), 'f6000000-0000-4000-8000-000000000101', 'schnitt', pg_temp.id(n, 2), 1, 1,
            '2027-01-08', '2027-01-08 09:00 Europe/Zurich', 'pgtap');
  insert into public.pflanzung (id, client_id, satz_id, pflanzvorgang_id, gilt_ab, app_version)
    values (pg_temp.id(n, 5), gen_random_uuid(), pg_temp.id(n, 4), pg_temp.id(n, 9), '2027-01-08 09:00 Europe/Zurich', 'pgtap');
  insert into public.messung (id, client_id, platz_id, messgeraet_id, messart, ec, gilt_ab, app_version)
    values (pg_temp.id(n, 6), gen_random_uuid(), pg_temp.id(n, 1), 'f6000000-0000-4000-8000-000000000201', 'aufgabe', 1.2,
            '2027-01-10 10:00 Europe/Zurich', 'pgtap');
  insert into public.naehrloesungsansatz (id, client_id, platz_id, typ, begonnen_am, volumen_l, gilt_ab, app_version)
    values (pg_temp.id(n, 7), gen_random_uuid(), pg_temp.id(n, 1), 'neuansatz', '2027-01-09 10:00 Europe/Zurich', 9,
            '2027-01-09 10:00 Europe/Zurich', 'pgtap');
  insert into public.ereignis (id, client_id, typ, platz_id, gilt_ab, app_version)
    values (pg_temp.id(n, 8), gen_random_uuid(), 'gefaess_erfasst', pg_temp.id(n, 1), '2027-01-03 10:00 Europe/Zurich', 'pgtap');
end $$;
select pg_temp.bestand(n) from generate_series(1, 4) n;

-- Zeilen einer Anlage n in den Betriebstabellen zählen
create function pg_temp.zeilen(n int) returns text language sql as $$
  select concat_ws(' ',
    (select count(*) from public.platz where id in (pg_temp.id(n, 1), pg_temp.id(n, 2))),
    (select count(*) from public.gefaess where id = pg_temp.id(n, 3)),
    (select count(*) from public.satz where id = pg_temp.id(n, 4)),
    (select count(*) from public.pflanzung where id = pg_temp.id(n, 5)),
    (select count(*) from public.messung where id = pg_temp.id(n, 6)),
    (select count(*) from public.naehrloesungsansatz where id = pg_temp.id(n, 7)),
    (select count(*) from public.ereignis where id = pg_temp.id(n, 8)))
$$;

-- Zeilen mit eigener Datenart (8.1 Regel 7)
insert into public.kalibrierung (id, client_id, messgeraet_id, datenart, gilt_ab, app_version) values
  ('f6000000-0000-4000-8000-000000000401', gen_random_uuid(), 'f6000000-0000-4000-8000-000000000201', 'echt', '2027-01-01 09:00 Europe/Zurich', 'pgtap'),
  ('f6000000-0000-4000-8000-000000000402', gen_random_uuid(), 'f6000000-0000-4000-8000-000000000201', 'demo', '2027-01-01 09:00 Europe/Zurich', 'pgtap');
insert into public.push_abo (id, geraet, endpoint, p256dh, auth_schluessel, datenart, app_version) values
  ('f6000000-0000-4000-8000-000000000411', 'Testgeraet', 'https://push.example.invalid/pgtap-echt', 'p', 'a', 'echt', 'pgtap'),
  ('f6000000-0000-4000-8000-000000000412', 'Demogeraet', 'https://push.example.invalid/pgtap-demo', 'p', 'a', 'demo', 'pgtap');
insert into public.push_versand (id, abo_id, kanal, art, datum_lokal, app_version) values
  ('f6000000-0000-4000-8000-000000000421', 'f6000000-0000-4000-8000-000000000411', 'push', 'sammel', '2027-01-10', 'pgtap'),
  ('f6000000-0000-4000-8000-000000000422', 'f6000000-0000-4000-8000-000000000412', 'push', 'sammel', '2027-01-10', 'pgtap');
insert into public.ereignis (id, client_id, typ, messgeraet_id, daten, gilt_ab, app_version) values
  ('f6000000-0000-4000-8000-000000000431', gen_random_uuid(), 'sonde_gereinigt', 'f6000000-0000-4000-8000-000000000201',
   '{"datenart":"echt"}', '2027-01-10 10:00 Europe/Zurich', 'pgtap'),
  ('f6000000-0000-4000-8000-000000000432', gen_random_uuid(), 'sonde_gereinigt', 'f6000000-0000-4000-8000-000000000201',
   '{"datenart":"demo"}', '2027-01-10 10:00 Europe/Zurich', 'pgtap');
insert into public.etikett_aufruf (id, code, ergebnis, app_version) values
  ('f6000000-0000-4000-8000-000000000441', 'R-2.3', 'gefunden', 'pgtap'),
  ('f6000000-0000-4000-8000-000000000442', 'XP-2.3', 'gefunden', 'pgtap');
insert into public.messung (id, client_id, messgeraet_id, messart, ph, datenart, gilt_ab, app_version) values
  ('f6000000-0000-4000-8000-000000000451', gen_random_uuid(), 'f6000000-0000-4000-8000-000000000201', 'ph_kontrolle', 6.9, 'echt',
   '2027-01-10 10:00 Europe/Zurich', 'pgtap'),
  ('f6000000-0000-4000-8000-000000000452', gen_random_uuid(), 'f6000000-0000-4000-8000-000000000201', 'ph_kontrolle', 6.9, 'demo',
   '2027-01-10 10:00 Europe/Zurich', 'pgtap');
insert into public.aufschub (id, client_id, aufgabe_schluessel, art, gesetzt_am, datenart, gilt_ab, app_version) values
  ('f6000000-0000-4000-8000-000000000461', gen_random_uuid(), 'messen|r|2027-01-10', 'morgen', '2027-01-10', 'echt',
   '2027-01-10 08:00 Europe/Zurich', 'pgtap'),
  ('f6000000-0000-4000-8000-000000000462', gen_random_uuid(), 'messen|xp|2027-01-10', 'morgen', '2027-01-10', 'demo',
   '2027-01-10 08:00 Europe/Zurich', 'pgtap');
-- Ä4: ki_feldprotokoll.datenart; die Demo-Zeile entsteht nur, wenn die Spalte besteht
insert into public.ki_feldprotokoll (id, client_id, sorte_id, feld, status, modell, app_version)
  values ('f6000000-0000-4000-8000-000000000471', gen_random_uuid(), 'f6000000-0000-4000-8000-000000000101', 'name',
          'uebernommen', 'testmodell', 'pgtap');
create temp table merker (name text primary key, wert text);
do $$
begin
  insert into public.ki_feldprotokoll (id, client_id, sorte_id, feld, status, modell, datenart, app_version)
    values ('f6000000-0000-4000-8000-000000000472', gen_random_uuid(), 'f6000000-0000-4000-8000-000000000101', 'name',
            'uebernommen', 'testmodell', 'demo', 'pgtap');
  insert into merker values ('ki_demo', 'angelegt');
exception when others then
  insert into merker values ('ki_demo', 'nicht angelegt (' || sqlstate || ')');
end $$;

-- ---------------------------------------------------------------------
-- smoke2: Kaskade über anlage
-- ---------------------------------------------------------------------

delete from public.anlage where id = 'f6000000-0000-4000-8000-000000000304';
select is(pg_temp.zeilen(4) || ' | ' || pg_temp.zeilen(1), '0 0 0 0 0 0 0 | 2 1 1 1 1 1 1',
          'smoke2 Kaskade über anlage: Plätze, Gefäss, Satz, Pflanzung, Messung, Ansatz, Ereignis weg, echte bleiben');

-- ---------------------------------------------------------------------
-- smoke3 C7: datenart_loeschen()
-- ---------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
select throws_ok($$select public.datenart_loeschen('demo')$$, '42501'::bpchar, null::text,
                 'smoke3 C7 als authenticated darf die App datenart_loeschen nicht aufrufen');
reset role;

set local role service_role;
select throws_ok($$select public.datenart_loeschen('echt')$$, 'P0001'::bpchar, null::text,
                 'smoke3 C7 datenart_loeschen(echt) scheitert');
select lives_ok($$select public.datenart_loeschen('demo')$$, 'smoke3 C7 datenart_loeschen(demo) mit service_role');
reset role;

select is(
  format('demo %s, echt %s, test %s',
         (select count(*) from public.anlage where datenart = 'demo'),
         (select count(*) from public.anlage where id = 'f6000000-0000-4000-8000-000000000301'),
         (select count(*) from public.anlage where id = 'f6000000-0000-4000-8000-000000000303')),
  'demo 0, echt 1, test 1', 'smoke3 C7 Anlage: Demo gelöscht, echte und Testanlage bleiben');
select is(pg_temp.zeilen(2) || ' | ' || pg_temp.zeilen(1) || ' | ' || pg_temp.zeilen(3),
          '0 0 0 0 0 0 0 | 2 1 1 1 1 1 1 | 2 1 1 1 1 1 1',
          'smoke3 C7 Betriebstabellen der Demo-Anlage leer, echte und Testanlage unverändert');
select is(
  format('demo %s, echt %s', (select count(*) from public.kalibrierung where datenart = 'demo'),
         (select count(*) from public.kalibrierung where id = 'f6000000-0000-4000-8000-000000000401')),
  'demo 0, echt 1', 'smoke3 C7 Kalibrierung: Demo gelöscht, echte bleibt');
select is(
  format('Abo demo %s, Versand demo %s, Abo echt %s, Versand echt %s',
         (select count(*) from public.push_abo where datenart = 'demo'),
         (select count(*) from public.push_versand where id = 'f6000000-0000-4000-8000-000000000422'),
         (select count(*) from public.push_abo where id = 'f6000000-0000-4000-8000-000000000411'),
         (select count(*) from public.push_versand where id = 'f6000000-0000-4000-8000-000000000421')),
  'Abo demo 0, Versand demo 0, Abo echt 1, Versand echt 1', 'smoke3 C7 Push-Abo mit Versand: Demo gelöscht, echtes bleibt');
select is(
  format('demo %s, echt %s', (select count(*) from public.pflanzvorgang where id = pg_temp.id(2, 9)),
         (select count(*) from public.pflanzvorgang where id = pg_temp.id(1, 9))),
  'demo 0, echt 1', 'smoke3 C7 Pflanzvorgang ohne Pflanzung gelöscht, echter bleibt');
select is(
  format('demo %s, echt %s', (select count(*) from public.ereignis where daten ->> 'datenart' = 'demo'),
         (select count(*) from public.ereignis where id = 'f6000000-0000-4000-8000-000000000431')),
  'demo 0, echt 1', 'smoke3 C7 Ereignis mit daten.datenart: Demo gelöscht, echtes bleibt');
select is(
  format('XP %s, R %s', (select count(*) from public.etikett_aufruf where id = 'f6000000-0000-4000-8000-000000000442'),
         (select count(*) from public.etikett_aufruf where id = 'f6000000-0000-4000-8000-000000000441')),
  'XP 0, R 1', 'smoke3 C7 Scan mit Kürzel der Demo-Anlage gelöscht, echter bleibt');
select is(
  format('demo %s, echt %s', (select count(*) from public.messung where messart = 'ph_kontrolle' and datenart = 'demo'),
         (select count(*) from public.messung where id = 'f6000000-0000-4000-8000-000000000451')),
  'demo 0, echt 1', 'smoke3 C7 pH-Kontrolle ohne Platz: Demo gelöscht, echte bleibt');
select is(
  format('demo %s, echt %s', (select count(*) from public.aufschub where datenart = 'demo'),
         (select count(*) from public.aufschub where id = 'f6000000-0000-4000-8000-000000000461')),
  'demo 0, echt 1', 'smoke3 C7 Aufschub: Demo gelöscht, echter bleibt');
select is(
  format('Spalte %s, Demo-Zeile %s, demo %s, echt %s',
         exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'ki_feldprotokoll' and column_name = 'datenart')::text,
         (select wert from merker where name = 'ki_demo'),
         (select count(*) from public.ki_feldprotokoll where id = 'f6000000-0000-4000-8000-000000000472'),
         (select count(*) from public.ki_feldprotokoll where id = 'f6000000-0000-4000-8000-000000000471')),
  'Spalte true, Demo-Zeile angelegt, demo 0, echt 1', 'smoke3 C7 Ä4 ki_feldprotokoll: Demo gelöscht, echtes bleibt');

select * from finish();
rollback;
