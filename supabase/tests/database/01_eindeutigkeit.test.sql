-- 01_eindeutigkeit.test.sql · UC1-AK7 Kennungen, Netztöpfe, Kürzel, Etikett-Code, Timer-Push
-- (Konzept 8.1 Regel 1, R8.3, R9.1; 06_tests.md Abschnitt 9 «Eindeutigkeit»; Plan 9)
begin;
create extension if not exists pgtap with schema extensions;
-- Die Datenbank läuft in UTC wie in Supabase; alle Zeitpunkte stehen ausdrücklich in Europe/Zurich.
set local timezone to 'UTC';
select plan(21);

-- ---------------------------------------------------------------------
-- Fixtures als postgres
-- ---------------------------------------------------------------------

insert into public.anlage (id, name, kuerzel, datenart, app_version) values
  ('f1000000-0000-4000-8000-000000000001', 'Testregal', 'R', 'echt', 'pgtap'),
  ('f1000000-0000-4000-8000-000000000002', 'Zweitanlage', 'T', 'echt', 'pgtap'),
  ('f1000000-0000-4000-8000-000000000003', 'Kuerzelprobe', 'PK', 'echt', 'pgtap');
insert into public.platz (id, anlage_id, kennung, rolle, app_version) values
  ('f1000000-0000-4000-8000-000000000011', 'f1000000-0000-4000-8000-000000000001', '2.3', 'gefaess', 'pgtap'),
  ('f1000000-0000-4000-8000-000000000012', 'f1000000-0000-4000-8000-000000000001', '2.4', 'gefaess', 'pgtap'),
  ('f1000000-0000-4000-8000-000000000013', 'f1000000-0000-4000-8000-000000000003', '1.1', 'gefaess', 'pgtap');
insert into public.gefaessmodell (id, name, form, innen_l_mm, innen_b_mm, innen_h_mm, betriebsvolumen_l, app_version)
  values ('f1000000-0000-4000-8000-000000000021', 'Testbox', 'rechteckig', 400, 300, 170, 9, 'pgtap');
insert into public.deckeltyp (id, name, topfdurchmesser_mm, loecher_je_reihe, app_version)
  values ('f1000000-0000-4000-8000-000000000022', 'Testdeckel', 80, '{2,2,2}', 'pgtap');
-- Gefäss G1 auf R-2.4, am 5.1. entfernt und geschlossen; G2 übernimmt den Platz am 6.1.
insert into public.gefaess (id, platz_id, gefaessmodell_id, deckeltyp_id, betriebsart, betriebsvolumen_l, intervall_messen_d,
                            intervall_wechseln_d, gueltig_von, gueltig_bis, app_version)
  values ('f1000000-0000-4000-8000-000000000031', 'f1000000-0000-4000-8000-000000000012', 'f1000000-0000-4000-8000-000000000021',
          'f1000000-0000-4000-8000-000000000022', 'dwc', 9, 2, 14, '2027-01-01 10:00 Europe/Zurich',
          '2027-01-05 10:00 Europe/Zurich', 'pgtap');
insert into public.ereignis (client_id, typ, platz_id, gilt_ab, app_version) values
  (gen_random_uuid(), 'gefaess_erfasst', 'f1000000-0000-4000-8000-000000000012', '2027-01-01 10:00 Europe/Zurich', 'pgtap'),
  (gen_random_uuid(), 'entfernt', 'f1000000-0000-4000-8000-000000000012', '2027-01-05 10:00 Europe/Zurich', 'pgtap');
insert into public.gefaess (id, platz_id, gefaessmodell_id, deckeltyp_id, betriebsart, betriebsvolumen_l, intervall_messen_d,
                            intervall_wechseln_d, gueltig_von, app_version)
  values ('f1000000-0000-4000-8000-000000000032', 'f1000000-0000-4000-8000-000000000012', 'f1000000-0000-4000-8000-000000000021',
          'f1000000-0000-4000-8000-000000000022', 'dwc', 9, 2, 14, '2027-01-06 10:00 Europe/Zurich', 'pgtap');
insert into public.netztopf (id, anlage_id, kennung, groesse_mm, heim_platz_id, heim_loch_nr, app_version) values
  ('f1000000-0000-4000-8000-000000000041', 'f1000000-0000-4000-8000-000000000001', '2.3.1', 80, 'f1000000-0000-4000-8000-000000000011', 1, 'pgtap'),
  ('f1000000-0000-4000-8000-000000000042', 'f1000000-0000-4000-8000-000000000001', '2.3.2', 80, 'f1000000-0000-4000-8000-000000000011', 2, 'pgtap');
insert into public.etikett (id, code, platz_id, app_version)
  values ('f1000000-0000-4000-8000-000000000051', 'PK-1.1', 'f1000000-0000-4000-8000-000000000013', 'pgtap');

-- ---------------------------------------------------------------------
-- UC1-AK7 Kennungen der Plätze
-- ---------------------------------------------------------------------

select throws_ok(
  $$insert into public.platz (anlage_id, kennung, rolle, app_version)
    values ('f1000000-0000-4000-8000-000000000001', '2.3', 'gefaess', 'pgtap')$$,
  '23505'::bpchar, null::text, 'UC1-AK7 Kennung 2.3 doppelt aktiv in R scheitert');

select lives_ok(
  $$insert into public.platz (id, anlage_id, kennung, rolle, app_version)
    values ('f1000000-0000-4000-8000-000000000014', 'f1000000-0000-4000-8000-000000000002', '2.3', 'gefaess', 'pgtap')$$,
  'UC1-AK7 2.3 in T neben 2.3 in R anlegbar');
select is(
  (select string_agg(a.kuerzel || '-' || p.kennung, ', ' order by a.kuerzel) || ', ' || count(distinct p.id) || ' Plätze'
     from public.platz p join public.anlage a on a.id = p.anlage_id
    where p.kennung = '2.3' and a.id in ('f1000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000002')),
  'R-2.3, T-2.3, 2 Plätze', 'UC1-AK7 2.3 in R und 2.3 in T sind verschiedene Plätze');

-- ein entferntes Gefäss behält seine Kennung, ein neues am selben Platz übernimmt sie
select is(
  (select string_agg(p.kennung || case when g.gueltig_bis is null then ' aktiv' else ' geschlossen' end, ', '
                     order by g.gueltig_von)
     from public.gefaess g join public.platz p on p.id = g.platz_id
    where g.id in ('f1000000-0000-4000-8000-000000000031', 'f1000000-0000-4000-8000-000000000032')),
  '2.4 geschlossen, 2.4 aktiv', 'UC1-AK7 entferntes Gefäss behält die Kennung, neues am selben Platz übernimmt sie');
select is(
  (select status::text from public.v_gefaess_status where gefaess_id = 'f1000000-0000-4000-8000-000000000032'),
  'in_pruefung', 'UC1-AK7 neues Gefäss am Platz eines entfernten startet in Prüfung');

select throws_ok(
  $$insert into public.gefaess (platz_id, gefaessmodell_id, deckeltyp_id, betriebsart, betriebsvolumen_l, intervall_messen_d,
                                intervall_wechseln_d, gueltig_von, app_version)
    values ('f1000000-0000-4000-8000-000000000012', 'f1000000-0000-4000-8000-000000000021', 'f1000000-0000-4000-8000-000000000022',
            'dwc', 9, 2, 14, '2027-01-07 10:00 Europe/Zurich', 'pgtap')$$,
  '23505'::bpchar, null::text, 'UC1-AK7 ein aktives Gefäss je Platz');

update public.platz set aktiv = false where id = 'f1000000-0000-4000-8000-000000000011';
select lives_ok(
  $$insert into public.platz (anlage_id, kennung, rolle, app_version)
    values ('f1000000-0000-4000-8000-000000000001', '2.3', 'gefaess', 'pgtap')$$,
  'UC1-AK7 inaktiver Platz gibt die Kennung frei');

-- ---------------------------------------------------------------------
-- R8.3 Netztopf-Kennung unter aktiven Töpfen, aufschiebbar für topf_neu_beschriften()
-- ---------------------------------------------------------------------

select is(
  (select format('aufschiebbar %s, anfangs aufgeschoben %s', condeferrable::text, condeferred::text)
     from pg_constraint where conrelid = 'public.netztopf'::regclass and conname = 'netztopf_kennung_aktiv'),
  'aufschiebbar true, anfangs aufgeschoben true', 'R8.3 Ausschlussregel netztopf_kennung_aktiv aufschiebbar');

create function pg_temp.netztopf_doppelt() returns void language plpgsql as $$
begin
  insert into public.netztopf (anlage_id, kennung, groesse_mm, heim_platz_id, heim_loch_nr, app_version)
    values ('f1000000-0000-4000-8000-000000000001', '2.3.1', 80, 'f1000000-0000-4000-8000-000000000011', 3, 'pgtap');
  set constraints public.netztopf_kennung_aktiv immediate;
  set constraints public.netztopf_kennung_aktiv deferred;
end $$;
select throws_ok('select pg_temp.netztopf_doppelt()', '23P01'::bpchar, null::text,
                 'R8.3 Netztopf-Kennung je Anlage unter aktiven Töpfen eindeutig');

create function pg_temp.tauschen() returns void language plpgsql as $$
begin
  perform public.topf_neu_beschriften('f1000000-0000-4000-8000-000000000041', 'f1000000-0000-4000-8000-000000000042');
  set constraints public.netztopf_kennung_aktiv immediate;
  set constraints public.netztopf_kennung_aktiv deferred;
end $$;
select lives_ok('select pg_temp.tauschen()', 'R8.3 topf_neu_beschriften tauscht in einer Transaktion ohne Verletzung');
select is(
  (select string_agg(right(id::text, 2) || ' ' || kennung || ' Loch ' || heim_loch_nr, ', ' order by id)
     from public.netztopf where id in ('f1000000-0000-4000-8000-000000000041', 'f1000000-0000-4000-8000-000000000042')),
  '41 2.3.2 Loch 2, 42 2.3.1 Loch 1', 'R8.3 topf_neu_beschriften tauscht Kennung und Heimloch');

create function pg_temp.inaktiv_frei() returns void language plpgsql as $$
begin
  update public.netztopf set aktiv = false where id = 'f1000000-0000-4000-8000-000000000041';
  insert into public.netztopf (anlage_id, kennung, groesse_mm, heim_platz_id, heim_loch_nr, app_version)
    values ('f1000000-0000-4000-8000-000000000001', '2.3.2', 80, 'f1000000-0000-4000-8000-000000000011', 4, 'pgtap');
  set constraints public.netztopf_kennung_aktiv immediate;
  set constraints public.netztopf_kennung_aktiv deferred;
end $$;
select lives_ok('select pg_temp.inaktiv_frei()', 'R8.3 inaktiver Netztopf gibt die Kennung frei');

-- ---------------------------------------------------------------------
-- R9.1 Kürzel und Etikett-Code
-- ---------------------------------------------------------------------

select lives_ok(
  $$update public.anlage set kuerzel = 'PL' where id = 'f1000000-0000-4000-8000-000000000003'$$,
  'R9.1 Kürzel vor dem ersten Druck änderbar');
select lives_ok(
  $$update public.etikett set gedruckt_am = '2027-01-04 18:00 Europe/Zurich' where id = 'f1000000-0000-4000-8000-000000000051'$$,
  'R9.1 Ä6 Druckdatum am Etikett bleibt setzbar');
select throws_ok(
  $$update public.anlage set kuerzel = 'PM' where id = 'f1000000-0000-4000-8000-000000000003'$$,
  'P0001'::bpchar, null::text, 'R9.1 Kürzel nach dem ersten Druck fest (UC1-AK6)');

-- Ä6: Trigger etikett_code_fest
select throws_ok(
  $$update public.etikett set code = 'PK-9.9' where id = 'f1000000-0000-4000-8000-000000000051'$$,
  null::bpchar, null::text, 'R9.1 Ä6 Etikett-Code unveränderlich');
select is((select code from public.etikett where id = 'f1000000-0000-4000-8000-000000000051'), 'PK-1.1',
          'R9.1 Ä6 Etikett-Code nach dem Versuch unverändert');

-- ---------------------------------------------------------------------
-- R9.2 Ä7 Scan-Protokoll über schreiben() mit client_id (idempotent, 04 Abschnitt 4.1)
-- ---------------------------------------------------------------------

select lives_ok(
  $$insert into public.etikett_aufruf (code, ergebnis, app_version) values ('PK-1.1', 'gefunden', 'pgtap'), ('PK-1.1', 'gefunden', 'pgtap')$$,
  'R9.2 Ä7 Scans ohne client_id bleiben möglich (nullable)');
select throws_ok(
  $$insert into public.etikett_aufruf (client_id, code, ergebnis, app_version) values
      ('f1000000-0000-4000-8000-000000000081', 'PK-1.1', 'gefunden', 'pgtap'),
      ('f1000000-0000-4000-8000-000000000081', 'PK-1.1', 'gefunden', 'pgtap')$$,
  '23505'::bpchar, null::text, 'R9.2 Ä7 Scan mit derselben client_id nur einmal (etikett_aufruf.client_id unique)');

-- ---------------------------------------------------------------------
-- TP5 Timer-Push je (Abo, Ansatz, Timerende) genau einmal (smoke2)
-- ---------------------------------------------------------------------

insert into public.push_abo (id, geraet, endpoint, p256dh, auth_schluessel, app_version)
  values ('f1000000-0000-4000-8000-000000000061', 'Testgeraet', 'https://push.example.invalid/pgtap-01', 'p', 'a', 'pgtap');
insert into public.push_versand (abo_id, kanal, art, datum_lokal, bezug_id, timer_ende, app_version)
  values ('f1000000-0000-4000-8000-000000000061', 'push', 'timer', '2027-01-20', 'f1000000-0000-4000-8000-000000000071',
          '2027-01-20 19:12 Europe/Zurich', 'pgtap');
select throws_ok(
  $$insert into public.push_versand (abo_id, kanal, art, datum_lokal, bezug_id, timer_ende, app_version)
    values ('f1000000-0000-4000-8000-000000000061', 'push', 'timer', '2027-01-20', 'f1000000-0000-4000-8000-000000000071',
            '2027-01-20 19:12 Europe/Zurich', 'pgtap')$$,
  '23505'::bpchar, null::text, 'TP5 smoke2 Timer-Push je Abo, Ansatz und Timerende nur einmal');
select lives_ok(
  $$insert into public.push_versand (abo_id, kanal, art, datum_lokal, bezug_id, timer_ende, app_version)
    values ('f1000000-0000-4000-8000-000000000061', 'push', 'timer', '2027-01-20', 'f1000000-0000-4000-8000-000000000071',
            '2027-01-20 19:40 Europe/Zurich', 'pgtap')$$,
  'TP5 neuer Timer im selben Ansatz erhält eine eigene Push');

select * from finish();
rollback;
