-- 03_zustaende.test.sql · Zustände als Sichten, Caches aus Ereignissen
-- (Konzept 8.1 Regel 2 und 7, R1.3, R1.5, R1.7, R4.7, R5.3, R5.4, R8.3, R9.3, R10.3, G2, G5;
--  06_tests.md Abschnitte 5 und 9; smoke.sql, smoke2.sql, smoke3.sql C1 bis C3, C6, D2, D3; Plan 9)
begin;
create extension if not exists pgtap with schema extensions;
-- Die Datenbank läuft in UTC wie in Supabase; alle Zeitpunkte stehen ausdrücklich in Europe/Zurich.
set local timezone to 'UTC';
select plan(52);

-- ---------------------------------------------------------------------
-- Fixtures als postgres
-- ---------------------------------------------------------------------

-- Einstellung einzeilig: nur anlegen, wenn keine besteht; feste Kalibriertermine wie im Entwurf (R5.2)
insert into public.einstellung (app_version) values ('pgtap') on conflict do nothing;
update public.einstellung set feste_kalibriertermine = '{2027-01-01,2027-01-31,2027-02-24,2027-03-24}';

insert into public.quelle (quelle_id, titel, link, klasse, anbaumethode, app_version)
  values ('pgtap-q1', 'Testquelle', 'https://example.invalid/q1', 'peer_review', 'dwc', 'pgtap');
insert into public.art_schluessel (art_id) values ('pgtap_art_a');
insert into public.kulturgruppe (kulturgruppe_id, name, leitkultur_art_id, ec_obergrenze_validator, app_version)
  values ('pgtap_kg', 'Testgruppe', 'pgtap_art_a', 2.0, 'pgtap');
insert into public.art (art_id, name_de, name_wiss, kulturgruppe_id, quelldatei, zeile_id, commit, app_version)
  values ('pgtap_art_a', 'Testart A', 'Testus primus', 'pgtap_kg', 'art.csv', 'art.pgtap_art_a', 'pgtap', 'pgtap');
insert into public.sorte_schluessel (id, sorte_key) values ('f3000000-0000-4000-8000-000000000101', 'pgtap-sorte-a');
insert into public.sorte (sorte_id, name, art_id, kulturtyp, quelldatei, zeile_id, commit, app_version)
  values ('f3000000-0000-4000-8000-000000000101', 'Testsorte A', 'pgtap_art_a', 'blatt', 'sorten.csv', 'pgtap-sorte-a', 'pgtap', 'pgtap');
insert into public.profilwert (ebene, sorte_id, art_id, kulturgruppe_id, phase, groesse, wert_min, wert_typ, wert_max,
                               ec_einheit_quelle, ec_basis_quelle, quelle_id, fundstelle, kurzzitat, evidenzklasse, vermerk,
                               quelldatei, zeile_id, commit, app_version) values
  ('art', null, 'pgtap_art_a', null, 'wachstum', 'ph', 5.8, null, 6.5, null, null, 'pgtap-q1', 'S. 1', 'Zitat', 'B1', 'keine',
   'profilwert.csv', 'pw.pgtap_art_a.wachstum.ph', 'pgtap', 'pgtap'),
  ('kulturgruppe', null, null, 'pgtap_kg', 'wachstum', 'ph', 5.5, null, 6.0, null, null, 'pgtap-q1', 'S. 2', 'Zitat', 'B1', 'keine',
   'profilwert.csv', 'pw.pgtap_kg.wachstum.ph', 'pgtap', 'pgtap'),
  ('kulturgruppe', null, null, 'pgtap_kg', 'wachstum', 'ec', 1.0, null, 1.4, 'mS/cm', 'gesamt', 'pgtap-q1', 'S. 3', 'Zitat', 'B1', 'keine',
   'profilwert.csv', 'pw.pgtap_kg.wachstum.ec', 'pgtap', 'pgtap'),
  ('sorte', 'f3000000-0000-4000-8000-000000000101', null, null, 'keimung', 'keimtemp', 15, 18, 20, null, null, 'pgtap-q1', 'Tüte',
   'Zitat', 'C', 'tuete', 'app', 'pw.pgtap-sorte-a.keimung.keimtemp', 'pgtap', 'pgtap');
-- Standardprofil: nur anlegen, wenn der Seed keines hat (geprüft wird nur Ebene und Klasse)
insert into public.profilwert (ebene, phase, groesse, wert_min, wert_max, quelle_id, fundstelle, kurzzitat, evidenzklasse,
                               quelldatei, zeile_id, commit, app_version)
  select 'standard', 'wachstum', 'wassertemp', 18, 22, 'pgtap-q1', 'S. 4', 'Zitat', 'C', 'profilwert.csv',
         'pw.pgtap.standard.wachstum.wassertemp', 'pgtap', 'pgtap'
   where not exists (select 1 from public.profilwert where ebene = 'standard' and phase = 'wachstum'
                        and groesse = 'wassertemp' and gueltig_bis is null);

insert into public.messgeraet (id, modell, app_version) values
  ('f3000000-0000-4000-8000-000000000201', 'TZ-Geraet', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000202', 'nie kalibriert', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000203', 'smoke2-Geraet', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000204', 'P160', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000205', 'Ersatz', 'pgtap');
insert into public.anlage (id, name, kuerzel, datenart, app_version) values
  ('f3000000-0000-4000-8000-000000000301', 'Testregal', 'R', 'echt', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000302', 'Demo', 'XP', 'demo', 'pgtap');
insert into public.platz (id, anlage_id, kennung, rolle, app_version)
  select ('f3000000-0000-4000-8000-0000000003' || n)::uuid, 'f3000000-0000-4000-8000-000000000301', k, r::public.platz_rolle, 'pgtap'
    from (values ('11', '2.1', 'gefaess'), ('12', '2.2', 'gefaess'), ('13', '2.3', 'gefaess'), ('14', '2.4', 'gefaess'),
                 ('15', '2.5', 'gefaess'), ('16', '2.6', 'gefaess'), ('17', '2.7', 'gefaess'), ('18', '2.8', 'gefaess'),
                 ('19', '2.9', 'gefaess'), ('21', 'A1', 'anzuchtort'), ('22', 'A2', 'anzuchtort'), ('23', 'A3', 'anzuchtort'),
                 ('24', 'A4', 'anzuchtort')) x(n, k, r);
insert into public.platz (id, anlage_id, kennung, rolle, app_version) values
  ('f3000000-0000-4000-8000-000000000332', 'f3000000-0000-4000-8000-000000000302', '2.2', 'gefaess', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000333', 'f3000000-0000-4000-8000-000000000302', '2.3', 'gefaess', 'pgtap');
insert into public.gefaessmodell (id, name, form, innen_l_mm, innen_b_mm, innen_h_mm, betriebsvolumen_l, app_version)
  values ('f3000000-0000-4000-8000-000000000341', 'Testbox', 'rechteckig', 400, 300, 170, 9, 'pgtap');
insert into public.deckeltyp (id, name, topfdurchmesser_mm, loecher_je_reihe, app_version)
  values ('f3000000-0000-4000-8000-000000000342', 'Testdeckel', 80, '{2,2,2}', 'pgtap');

-- Gefäss anlegen (Hilfsfunktion, nur Platz und Zeitraum variieren)
create function pg_temp.gefaess(platz uuid, von timestamptz, bis timestamptz) returns void language sql as $$
  insert into public.gefaess (platz_id, gefaessmodell_id, deckeltyp_id, betriebsart, betriebsvolumen_l, intervall_messen_d,
                              intervall_wechseln_d, gueltig_von, gueltig_bis, app_version)
  values (platz, 'f3000000-0000-4000-8000-000000000341', 'f3000000-0000-4000-8000-000000000342', 'dwc', 9, 2, 14, von, bis, 'pgtap')
$$;
-- Ereignis am Platz
create function pg_temp.am_platz(typ public.ereignis_typ, platz uuid, daten jsonb, gilt timestamptz) returns void language sql as $$
  insert into public.ereignis (client_id, typ, platz_id, daten, gilt_ab, app_version)
  values (gen_random_uuid(), typ, platz, daten, gilt, 'pgtap')
$$;
-- Unsicher-Wert einer Messung
create function pg_temp.unsicher(messung uuid) returns text language sql as $$
  select unsicher::text from public.v_messung_unsicher where messung_id = messung
$$;
-- Geplante Umsetzdaten der Reservierungen eines Satzes je Topfkennung
create function pg_temp.geplant(satz uuid) returns text language sql as $$
  select string_agg(t.kennung || ' ' || r.umsetzen_geplant_am, ', ' order by t.kennung)
    from public.reservierung r
    join public.netztopf t on t.id = r.netztopf_id
    join public.pflanzung pf on pf.id = r.pflanzung_id
   where pf.satz_id = satz and r.storniert_am is null
$$;

-- ---------------------------------------------------------------------
-- TZ1 bis TZ4 gegen v_messung_unsicher und v_kalibrierung_faellig (R10.3, G2)
-- ---------------------------------------------------------------------

insert into public.kalibrierung (client_id, messgeraet_id, datenart, gilt_ab, app_version)
  values (gen_random_uuid(), 'f3000000-0000-4000-8000-000000000201', 'echt', '2027-01-01 09:00 Europe/Zurich', 'pgtap');
insert into public.messung (id, client_id, platz_id, messgeraet_id, messart, ec, gilt_ab, app_version) values
  ('f3000000-0000-4000-8000-000000000401', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000311',
   'f3000000-0000-4000-8000-000000000201', 'aufgabe', 1.2, '2027-01-30 10:00 Europe/Zurich', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000402', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000311',
   'f3000000-0000-4000-8000-000000000201', 'aufgabe', 1.2, '2027-01-31 10:00 Europe/Zurich', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000403', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000311',
   'f3000000-0000-4000-8000-000000000201', 'aufgabe', 1.2, '2027-02-01 10:00 Europe/Zurich', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000404', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000311',
   'f3000000-0000-4000-8000-000000000202', 'aufgabe', 1.2, '2027-01-10 10:00 Europe/Zurich', 'pgtap');

select is(pg_temp.unsicher('f3000000-0000-4000-8000-000000000401'), 'false',
          'TZ1 Kalibrierung 1.1., Messung 30.1. (Tag 29) nicht unsicher');
select is(pg_temp.unsicher('f3000000-0000-4000-8000-000000000402'), 'false',
          'TZ2 Messung 31.1. (Tag 30) nicht unsicher');
select is((select faellig_am::text from public.v_kalibrierung_faellig
            where messgeraet_id = 'f3000000-0000-4000-8000-000000000201' and datenart = 'echt'),
          '2027-01-31', 'TZ2 Kalibrierung fällig am 31.1.');
select is(pg_temp.unsicher('f3000000-0000-4000-8000-000000000403'), 'true',
          'TZ3 Messung 1.2. (Tag 31) unsicher');
select is(format('unsicher %s, fällig %s', pg_temp.unsicher('f3000000-0000-4000-8000-000000000404'),
                 coalesce((select faellig_am::text from public.v_kalibrierung_faellig
                            where messgeraet_id = 'f3000000-0000-4000-8000-000000000202' and datenart = 'echt'),
                          'Erstkalibrierung')),
          'unsicher true, fällig Erstkalibrierung', 'TZ4 nie kalibriert: Messung unsicher, Erstkalibrierung');

-- 30-Tage-Regel (R10.3) und fester Termin (R5.2) getrennt; feste Termine aus der Fixture oben:
-- 1.1., 31.1., 24.2., 24.3. Gerät …206: Kalibrierung 25.3., kein fester Termin danach → 25.3. + 30 = 24.4.
-- Gerät …207: Kalibrierung 2.2., fester Termin 24.2. vor 2.2. + 30 = 4.3.
insert into public.messgeraet (id, modell, app_version) values
  ('f3000000-0000-4000-8000-000000000206', 'TZ-30-Tage', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000207', 'TZ-Termin', 'pgtap');
insert into public.kalibrierung (client_id, messgeraet_id, datenart, gilt_ab, app_version) values
  (gen_random_uuid(), 'f3000000-0000-4000-8000-000000000206', 'echt', '2027-03-25 09:00 Europe/Zurich', 'pgtap'),
  (gen_random_uuid(), 'f3000000-0000-4000-8000-000000000207', 'echt', '2027-02-02 09:00 Europe/Zurich', 'pgtap');
insert into public.messung (id, client_id, platz_id, messgeraet_id, messart, ec, gilt_ab, app_version) values
  ('f3000000-0000-4000-8000-000000000405', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000311',
   'f3000000-0000-4000-8000-000000000206', 'aufgabe', 1.2, '2027-04-24 23:30 Europe/Zurich', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000406', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000311',
   'f3000000-0000-4000-8000-000000000206', 'aufgabe', 1.2, '2027-04-25 00:30 Europe/Zurich', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000407', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000311',
   'f3000000-0000-4000-8000-000000000207', 'aufgabe', 1.2, '2027-02-24 23:30 Europe/Zurich', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000408', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000311',
   'f3000000-0000-4000-8000-000000000207', 'aufgabe', 1.2, '2027-02-25 00:30 Europe/Zurich', 'pgtap');

select is((select array_to_string(feste_kalibriertermine, ',') from public.einstellung),
          '2027-01-01,2027-01-31,2027-02-24,2027-03-24', 'R5.2 feste Kalibriertermine der Fixture (Grundlage der Fälle unten)');
select is((select faellig_am::text from public.v_kalibrierung_faellig
            where messgeraet_id = 'f3000000-0000-4000-8000-000000000206' and datenart = 'echt'),
          '2027-04-24', 'R10.3 Kalibrierung 25.3. ohne folgenden festen Termin: fällig 24.4. (30 Tage)');
select is(pg_temp.unsicher('f3000000-0000-4000-8000-000000000405'), 'false',
          'R10.3 Kalibrierung 25.3., Messung 24.4. 23:30 (Tag 30) nicht unsicher');
select is(pg_temp.unsicher('f3000000-0000-4000-8000-000000000406'), 'true',
          'R10.3 Kalibrierung 25.3., Messung 25.4. 00:30 (Tag 31) unsicher');
select is((select faellig_am::text from public.v_kalibrierung_faellig
            where messgeraet_id = 'f3000000-0000-4000-8000-000000000207' and datenart = 'echt'),
          '2027-02-24', 'R5.2 Kalibrierung 2.2.: fällig am festen Termin 24.2., nicht am 4.3.');
select is(pg_temp.unsicher('f3000000-0000-4000-8000-000000000407'), 'false',
          'R5.2 Kalibrierung 2.2., Messung 24.2. 23:30 (fester Termin) nicht unsicher');
select is(pg_temp.unsicher('f3000000-0000-4000-8000-000000000408'), 'true',
          'R5.2 Kalibrierung 2.2., Messung 25.2. 00:30 nach dem festen Termin unsicher (vor Tag 30)');

-- ---------------------------------------------------------------------
-- smoke v_sollwert: Vererbung Sorte → Art → Kulturgruppe → Standard, Klasse D (R1.3)
-- ---------------------------------------------------------------------

create function pg_temp.sollwert(phase public.phase, groesse public.groesse) returns text language sql as $$
  select concat_ws(' ', herkunft_ebene, evidenzklasse, vermerk, wert_min, wert_max)
    from public.v_sollwert v
   where v.sorte_id = 'f3000000-0000-4000-8000-000000000101' and v.phase = sollwert.phase and v.groesse = sollwert.groesse
$$;
select is(pg_temp.sollwert('wachstum', 'ph'), 'art B1 keine 5.800 6.500',
          'smoke v_sollwert Art vor Kulturgruppe: pH aus der Art mit Klasse B1');
select is(left(pg_temp.sollwert('wachstum', 'ec'), 14), 'kulturgruppe D',
          'R1.3 v_sollwert Herkunft Kulturgruppe gilt als Klasse D');
select is(left(pg_temp.sollwert('wachstum', 'wassertemp'), 10), 'standard D',
          'smoke v_sollwert Herkunft Standard gilt als Klasse D');
select is(pg_temp.sollwert('keimung', 'keimtemp'), 'sorte C tuete 15.000 20.000',
          'R1.3 v_sollwert Sorte übersteuert die Keimtemperatur (Tüte, Klasse C)');

-- ---------------------------------------------------------------------
-- smoke2: Gefässstatus, Füllzustand, Phase, Caches, unsicher, Demo
-- ---------------------------------------------------------------------

select pg_temp.gefaess('f3000000-0000-4000-8000-000000000312', '2027-01-03 10:00 Europe/Zurich', null);
select pg_temp.am_platz('gefaess_erfasst', 'f3000000-0000-4000-8000-000000000312', '{}', '2027-01-01 10:00 Europe/Zurich');
select pg_temp.am_platz('entfernt', 'f3000000-0000-4000-8000-000000000312', '{}', '2027-01-02 10:00 Europe/Zurich');
select pg_temp.am_platz('gefaess_erfasst', 'f3000000-0000-4000-8000-000000000312', '{}', '2027-01-03 10:00 Europe/Zurich');
select pg_temp.am_platz('gefaesspruefung', 'f3000000-0000-4000-8000-000000000312', jsonb_build_object('schritt', s, 'ok', true),
                        '2027-01-04 10:00 Europe/Zurich')
  from generate_series(1, 3) s;
select is((select s.status::text from public.v_gefaess_status s join public.gefaess g on g.id = s.gefaess_id
            where g.platz_id = 'f3000000-0000-4000-8000-000000000312'),
          'in_betrieb_volumen_offen', 'smoke2 Status nach Schritt 1 bis 3: in Betrieb, Volumen offen (R9.3)');
select is((select fuellzustand from public.v_fuellzustand where platz_id = 'f3000000-0000-4000-8000-000000000312'),
          'leer', 'smoke2 Füllzustand eines neu erfassten Gefässes: leer (R5.4)');

insert into public.satz (id, client_id, sorte_id, kulturform, anzuchtort_platz_id, anzahl_schwaemme, samen_je_schwamm,
                         saatdatum, gilt_ab, app_version)
  values ('f3000000-0000-4000-8000-000000000501', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000101', 'schnitt',
          'f3000000-0000-4000-8000-000000000321', 2, 1, '2027-01-07', '2027-01-07 09:00 Europe/Zurich', 'pgtap');
insert into public.pflanzung (id, client_id, satz_id, gilt_ab, app_version) values
  ('f3000000-0000-4000-8000-000000000511', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000501', '2027-01-07 09:00 Europe/Zurich', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000512', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000501', '2027-01-07 09:00 Europe/Zurich', 'pgtap');
insert into public.ereignis (client_id, typ, satz_id, daten, gilt_ab, app_version)
  values (gen_random_uuid(), 'phase_antwort', 'f3000000-0000-4000-8000-000000000501',
          '{"phase":"anzucht","antwort":"ja","erwartet_am":"2027-01-13"}', '2027-01-13 10:00 Europe/Zurich', 'pgtap');
insert into public.ereignis (client_id, typ, pflanzung_id, daten, gilt_ab, app_version)
  values (gen_random_uuid(), 'ernte', 'f3000000-0000-4000-8000-000000000511', '{"art":"ab"}', '2027-02-20 10:00 Europe/Zurich', 'pgtap');
select is((select string_agg(phase || ' ' || status, ', ' order by status) from public.v_pflanzung_zustand
            where satz_id = 'f3000000-0000-4000-8000-000000000501'),
          'anzucht aktiv, anzucht geerntet', 'smoke2 Phase und Status nach Ernte ab (R1.7)');

select throws_ok(
  $$update public.satz set saatdatum = '2027-01-08' where id = 'f3000000-0000-4000-8000-000000000501'$$,
  'P0001'::bpchar, null::text, 'smoke2 Cache satz.saatdatum direkt geändert scheitert (8.1 Regel 2)');
insert into public.ereignis (client_id, typ, satz_id, daten, gilt_ab, app_version)
  values (gen_random_uuid(), 'aussaat', 'f3000000-0000-4000-8000-000000000501', '{"saatdatum":"2027-01-06"}',
          '2027-01-07 10:00 Europe/Zurich', 'pgtap');
select is((select saatdatum::text from public.satz where id = 'f3000000-0000-4000-8000-000000000501'),
          '2027-01-06', 'smoke2 Saatdatum aus Ereignis aussaat');

insert into public.kalibrierung (id, client_id, messgeraet_id, datenart, gilt_ab, app_version) values
  ('f3000000-0000-4000-8000-000000000601', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000203', 'echt',
   '2027-01-01 09:00 Europe/Zurich', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000602', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000203', 'echt',
   '2027-01-15 09:00 Europe/Zurich', 'pgtap');
insert into public.messung (id, client_id, platz_id, messgeraet_id, messart, ec, gilt_ab, app_version) values
  ('f3000000-0000-4000-8000-000000000611', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000312',
   'f3000000-0000-4000-8000-000000000203', 'aufgabe', 1.2, '2027-01-10 10:00 Europe/Zurich', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000612', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000312',
   'f3000000-0000-4000-8000-000000000203', 'aufgabe', 1.2, '2027-01-20 10:00 Europe/Zurich', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000613', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000332',
   'f3000000-0000-4000-8000-000000000203', 'aufgabe', 1.2, '2027-01-20 11:00 Europe/Zurich', 'pgtap');
insert into public.ereignis (client_id, typ, messgeraet_id, daten, gilt_ab, app_version)
  values (gen_random_uuid(), 'als_unsicher_markiert', 'f3000000-0000-4000-8000-000000000203',
          '{"seit_kalibrierung_id":"f3000000-0000-4000-8000-000000000601","datenart":"echt"}',
          '2027-01-15 09:05 Europe/Zurich', 'pgtap');
select is(pg_temp.unsicher('f3000000-0000-4000-8000-000000000611') || ', ' || pg_temp.unsicher('f3000000-0000-4000-8000-000000000612'),
          'true, false', 'smoke2 als unsicher markiert: 10.1. unsicher, 20.1. nach neuer Kalibrierung sicher (R4.7)');
select is(pg_temp.unsicher('f3000000-0000-4000-8000-000000000613'), 'true',
          'smoke2 G5 Demo-Messung ohne Demo-Kalibrierung unsicher (8.1 Regel 7)');

-- ---------------------------------------------------------------------
-- smoke3 C1: Kalibrierung, Sonde gereinigt und Markierung je Messgerät und Datenart
-- ---------------------------------------------------------------------

insert into public.kalibrierung (id, client_id, messgeraet_id, datenart, gilt_ab, app_version) values
  ('f3000000-0000-4000-8000-000000000701', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000204', 'echt',
   '2027-01-01 09:00 Europe/Zurich', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000702', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000204', 'demo',
   '2027-01-01 09:00 Europe/Zurich', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000703', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000205', 'echt',
   '2027-01-01 09:00 Europe/Zurich', 'pgtap');
insert into public.messung (id, client_id, platz_id, messgeraet_id, messart, ec, gilt_ab, app_version) values
  ('f3000000-0000-4000-8000-000000000711', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000313',
   'f3000000-0000-4000-8000-000000000204', 'aufgabe', 1.2, '2027-01-10 10:00 Europe/Zurich', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000712', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000333',
   'f3000000-0000-4000-8000-000000000204', 'aufgabe', 1.2, '2027-01-10 10:00 Europe/Zurich', 'pgtap');
insert into public.ereignis (client_id, typ, messgeraet_id, daten, gilt_ab, app_version)
  values (gen_random_uuid(), 'sonde_gereinigt', 'f3000000-0000-4000-8000-000000000204', '{"datenart":"demo"}',
          '2027-01-05 09:00 Europe/Zurich', 'pgtap');
select is(pg_temp.unsicher('f3000000-0000-4000-8000-000000000711'), 'false',
          'smoke3 C1 Demo-Sonde gereinigt: echte Messung sicher');
select is(pg_temp.unsicher('f3000000-0000-4000-8000-000000000712'), 'true',
          'smoke3 C1 Demo-Sonde gereinigt: Demo-Messung unsicher');
select is((select string_agg(datenart || ' ' || coalesce(faellig_am::text, 'nie'), ', ' order by datenart)
             from public.v_kalibrierung_faellig
            where messgeraet_id = 'f3000000-0000-4000-8000-000000000204' and datenart <> 'test'),
          'echt 2027-01-31, demo 2027-01-05', 'smoke3 C1 Fälligkeit echt unberührt, demo sofort');
insert into public.ereignis (client_id, typ, messgeraet_id, daten, gilt_ab, app_version)
  values (gen_random_uuid(), 'als_unsicher_markiert', 'f3000000-0000-4000-8000-000000000205',
          '{"seit_kalibrierung_id":"f3000000-0000-4000-8000-000000000703","datenart":"echt"}',
          '2027-01-12 09:00 Europe/Zurich', 'pgtap');
select is(pg_temp.unsicher('f3000000-0000-4000-8000-000000000711'), 'false',
          'smoke3 C1 Markierung des anderen Geräts: echte Messung sicher');
insert into public.ereignis (client_id, typ, messgeraet_id, daten, gilt_ab, app_version)
  values (gen_random_uuid(), 'als_unsicher_markiert', 'f3000000-0000-4000-8000-000000000204',
          '{"seit_kalibrierung_id":"f3000000-0000-4000-8000-000000000701","datenart":"demo"}',
          '2027-01-12 09:00 Europe/Zurich', 'pgtap');
select is(pg_temp.unsicher('f3000000-0000-4000-8000-000000000711'), 'false',
          'smoke3 C1 Demo-Markierung auf echte Kalibrierung: echte Messung sicher');
insert into public.ereignis (client_id, typ, messgeraet_id, daten, gilt_ab, app_version)
  values (gen_random_uuid(), 'als_unsicher_markiert', 'f3000000-0000-4000-8000-000000000204',
          '{"seit_kalibrierung_id":"f3000000-0000-4000-8000-000000000701","datenart":"echt"}',
          '2027-01-12 09:00 Europe/Zurich', 'pgtap');
select is(pg_temp.unsicher('f3000000-0000-4000-8000-000000000711'), 'true',
          'smoke3 C1 echte Markierung: echte Messung unsicher');

-- ---------------------------------------------------------------------
-- smoke3 C2: Gefässstatus ohne gefaess_erfasst (Rückfall) und nach «entfernt»
-- ---------------------------------------------------------------------

select pg_temp.gefaess('f3000000-0000-4000-8000-000000000314', '2027-01-01 10:00 Europe/Zurich', null);
select pg_temp.am_platz('gefaesspruefung', 'f3000000-0000-4000-8000-000000000314', jsonb_build_object('schritt', s, 'ok', true),
                        '2027-01-02 10:00 Europe/Zurich')
  from generate_series(1, 3) s;
select is((select s.status::text from public.v_gefaess_status s join public.gefaess g on g.id = s.gefaess_id
            where g.platz_id = 'f3000000-0000-4000-8000-000000000314'),
          'in_betrieb_volumen_offen', 'smoke3 C2 ohne gefaess_erfasst: Rückfall auf gueltig_von');

select pg_temp.gefaess('f3000000-0000-4000-8000-000000000315', '2027-01-01 10:00 Europe/Zurich', '2027-01-03 10:00 Europe/Zurich');
select pg_temp.am_platz('gefaess_erfasst', 'f3000000-0000-4000-8000-000000000315', '{}', '2027-01-01 10:00 Europe/Zurich');
select pg_temp.am_platz('gefaesspruefung', 'f3000000-0000-4000-8000-000000000315', jsonb_build_object('schritt', s, 'ok', true),
                        '2027-01-01 11:00 Europe/Zurich')
  from generate_series(1, 3) s;
select pg_temp.am_platz('entfernt', 'f3000000-0000-4000-8000-000000000315', '{}', '2027-01-03 10:00 Europe/Zurich');
select pg_temp.gefaess('f3000000-0000-4000-8000-000000000315', '2027-01-04 10:00 Europe/Zurich', null);
select is((select s.status::text from public.v_gefaess_status s join public.gefaess g on g.id = s.gefaess_id
            where g.platz_id = 'f3000000-0000-4000-8000-000000000315'),
          'in_pruefung', 'smoke3 C2 neue Belegung nach entfernt ohne Ereignis: in Prüfung');
select pg_temp.am_platz('gefaess_erfasst', 'f3000000-0000-4000-8000-000000000315', '{}', '2027-01-04 10:00 Europe/Zurich');
select is((select s.status::text from public.v_gefaess_status s join public.gefaess g on g.id = s.gefaess_id
            where g.platz_id = 'f3000000-0000-4000-8000-000000000315'),
          'in_pruefung', 'smoke3 C2 neue Belegung mit gefaess_erfasst: in Prüfung');

-- ---------------------------------------------------------------------
-- smoke3 C3: Fruchtgemüse-Antwort am Satz mit auslösender Pflanzung (R1.5)
-- ---------------------------------------------------------------------

insert into public.satz (id, client_id, sorte_id, kulturform, anzuchtort_platz_id, anzahl_schwaemme, samen_je_schwamm,
                         saatdatum, gilt_ab, app_version)
  values ('f3000000-0000-4000-8000-000000000801', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000101', 'schnitt',
          'f3000000-0000-4000-8000-000000000322', 2, 1, '2027-01-07', '2027-01-07 09:00 Europe/Zurich', 'pgtap');
insert into public.pflanzung (id, client_id, satz_id, gilt_ab, app_version) values
  ('f3000000-0000-4000-8000-000000000811', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000801', '2027-01-07 09:00 Europe/Zurich', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000812', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000801', '2027-01-07 09:00 Europe/Zurich', 'pgtap');
insert into public.ereignis (client_id, typ, satz_id, daten, gilt_ab, app_version)
  values (gen_random_uuid(), 'phase_antwort', 'f3000000-0000-4000-8000-000000000801',
          '{"phase":"bluete","antwort":"ja","erwartet_am":"2027-03-01","ausloesende_pflanzung_id":"f3000000-0000-4000-8000-000000000811"}',
          '2027-03-02 10:00 Europe/Zurich', 'pgtap');
select is((select string_agg(phase::text, ', ' order by pflanzung_id) from public.v_pflanzung_zustand
            where satz_id = 'f3000000-0000-4000-8000-000000000801'),
          'bluete, bluete', 'smoke3 C3 Fruchtgemüse-Antwort am Satz gilt für alle Pflanzungen');

-- ---------------------------------------------------------------------
-- smoke3 C6, D2: Saatdatum und Umsetzdatum als Cache (R5.3)
-- ---------------------------------------------------------------------

insert into public.ereignis (client_id, typ, satz_id, daten, gilt_ab, app_version)
  values ('f3000000-0000-4000-8000-000000000c61', 'aussaat', 'f3000000-0000-4000-8000-000000000801',
          '{"saatdatum":"2027-01-06"}', '2027-01-08 10:00 Europe/Zurich', 'pgtap');
select is((select saatdatum::text from public.satz where id = 'f3000000-0000-4000-8000-000000000801'),
          '2027-01-06', 'smoke3 C6 Saatdatum aus Ereignis');
update public.ereignis set storniert_am = '2027-01-08 11:00 Europe/Zurich', storno_grund = 'fehleingabe'
 where client_id = 'f3000000-0000-4000-8000-000000000c61';
select is((select saatdatum::text from public.satz where id = 'f3000000-0000-4000-8000-000000000801'),
          '2027-01-07', 'smoke3 C6 Storno des einzigen aussaat: Kalendertag von gilt_ab');

insert into public.netztopf (id, anlage_id, kennung, groesse_mm, heim_platz_id, heim_loch_nr, app_version) values
  ('f3000000-0000-4000-8000-000000000821', 'f3000000-0000-4000-8000-000000000301', '2.3.1', 80, 'f3000000-0000-4000-8000-000000000313', 1, 'pgtap'),
  ('f3000000-0000-4000-8000-000000000822', 'f3000000-0000-4000-8000-000000000301', '2.3.2', 80, 'f3000000-0000-4000-8000-000000000313', 2, 'pgtap');
insert into public.reservierung (id, client_id, pflanzung_id, netztopf_id, umsetzen_vorgabe_am, gilt_ab, app_version) values
  ('f3000000-0000-4000-8000-000000000831', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000811',
   'f3000000-0000-4000-8000-000000000821', '2027-01-20', '2027-01-07 09:00 Europe/Zurich', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000832', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000812',
   'f3000000-0000-4000-8000-000000000822', '2027-01-20', '2027-01-07 09:00 Europe/Zurich', 'pgtap');
select is(pg_temp.geplant('f3000000-0000-4000-8000-000000000801'), '2.3.1 2027-01-20, 2.3.2 2027-01-20',
          'smoke3 C6 ohne Ereignis gilt die Vorgabe');
insert into public.ereignis (client_id, typ, satz_id, daten, gilt_ab, app_version)
  values ('f3000000-0000-4000-8000-000000000c62', 'umsetzdatum_geaendert', 'f3000000-0000-4000-8000-000000000801',
          '{"von":"2027-01-20","nach":"2027-01-21","grund":"morgen"}', '2027-01-20 08:00 Europe/Zurich', 'pgtap');
select is(pg_temp.geplant('f3000000-0000-4000-8000-000000000801'), '2.3.1 2027-01-21, 2.3.2 2027-01-21',
          'smoke3 C6 Morgen am Satz gilt für alle Reservierungen des Satzes');
insert into public.ereignis (client_id, typ, pflanzung_id, daten, gilt_ab, app_version)
  values ('f3000000-0000-4000-8000-000000000c63', 'umsetzdatum_geaendert', 'f3000000-0000-4000-8000-000000000811',
          '{"von":"2027-01-21","nach":"2027-01-22","grund":"morgen"}', '2027-01-21 08:00 Europe/Zurich', 'pgtap');
select is(pg_temp.geplant('f3000000-0000-4000-8000-000000000801'), '2.3.1 2027-01-22, 2.3.2 2027-01-21',
          'smoke3 C6 Ausnahme an der Pflanzung');
update public.ereignis set storniert_am = '2027-01-21 09:00 Europe/Zurich', storno_grund = 'rueckgaengig'
 where client_id = 'f3000000-0000-4000-8000-000000000c63';
select is(pg_temp.geplant('f3000000-0000-4000-8000-000000000801'), '2.3.1 2027-01-21, 2.3.2 2027-01-21',
          'smoke3 C6 Storno der Ausnahme: Satz-Ereignis gilt');
update public.ereignis set storniert_am = '2027-01-21 09:10 Europe/Zurich', storno_grund = 'rueckgaengig'
 where client_id = 'f3000000-0000-4000-8000-000000000c62';
select is(pg_temp.geplant('f3000000-0000-4000-8000-000000000801'), '2.3.1 2027-01-20, 2.3.2 2027-01-20',
          'smoke3 C6 Storno des einzigen Satz-Ereignisses: Vorgabe');
insert into public.ereignis (client_id, typ, pflanzung_id, netztopf_id, daten, gilt_ab, app_version)
  values (gen_random_uuid(), 'umsetzen', 'f3000000-0000-4000-8000-000000000812', 'f3000000-0000-4000-8000-000000000822',
          '{}', '2027-01-20 10:00 Europe/Zurich', 'pgtap');
insert into public.ereignis (client_id, typ, satz_id, daten, gilt_ab, app_version)
  values (gen_random_uuid(), 'umsetzdatum_geaendert', 'f3000000-0000-4000-8000-000000000801',
          '{"von":"2027-01-20","nach":"2027-01-25","grund":"ziel_spaeter"}', '2027-01-20 11:00 Europe/Zurich', 'pgtap');
select is(pg_temp.geplant('f3000000-0000-4000-8000-000000000801'), '2.3.1 2027-01-25, 2.3.2 2027-01-20',
          'smoke3 C6 beendete Reservierung bleibt');
select throws_ok(
  $$update public.reservierung set umsetzen_vorgabe_am = '2027-02-01' where id = 'f3000000-0000-4000-8000-000000000831'$$,
  'P0001'::bpchar, null::text, 'smoke3 C6 umsetzen_vorgabe_am unveränderlich');
select throws_ok(
  $$update public.reservierung set umsetzen_geplant_am = '2027-02-01' where id = 'f3000000-0000-4000-8000-000000000831'$$,
  'P0001'::bpchar, null::text, 'smoke2 Cache reservierung.umsetzen_geplant_am direkt geändert scheitert (8.1 Regel 2)');

update public.reservierung set storniert_am = '2027-01-20 12:00 Europe/Zurich', storno_grund = 'korrektur'
 where id = 'f3000000-0000-4000-8000-000000000831';
insert into public.reservierung (client_id, pflanzung_id, netztopf_id, umsetzen_vorgabe_am, umsetzen_geplant_am, gilt_ab,
                                 ersetzt_id, app_version)
  values ('f3000000-0000-4000-8000-000000000d21', 'f3000000-0000-4000-8000-000000000811', 'f3000000-0000-4000-8000-000000000821',
          '2027-01-20', '2027-01-20', '2027-01-20 12:00 Europe/Zurich', 'f3000000-0000-4000-8000-000000000831', 'pgtap');
select is((select umsetzen_geplant_am::text from public.reservierung where client_id = 'f3000000-0000-4000-8000-000000000d21'),
          '2027-01-25', 'smoke3 D2 Korrektur nach Morgen: Datum aus dem Satz-Ereignis, nicht Vorgabe oder Client-Wert');

-- ---------------------------------------------------------------------
-- smoke3 D3: Füllzustand eines neuen Gefässes am Platz eines entfernten
-- ---------------------------------------------------------------------

select pg_temp.gefaess('f3000000-0000-4000-8000-000000000316', '2027-01-01 10:00 Europe/Zurich', '2027-01-03 10:00 Europe/Zurich');
insert into public.naehrloesungsansatz (client_id, platz_id, typ, begonnen_am, volumen_l, gilt_ab, app_version)
  values (gen_random_uuid(), 'f3000000-0000-4000-8000-000000000316', 'neuansatz', '2027-01-02 10:00 Europe/Zurich', 9,
          '2027-01-02 10:00 Europe/Zurich', 'pgtap');
select pg_temp.am_platz('entfernt', 'f3000000-0000-4000-8000-000000000316', '{}', '2027-01-03 10:00 Europe/Zurich');
select pg_temp.gefaess('f3000000-0000-4000-8000-000000000316', '2027-01-04 10:00 Europe/Zurich', null);
select is((select fuellzustand from public.v_fuellzustand where platz_id = 'f3000000-0000-4000-8000-000000000316'),
          'leer', 'smoke3 D3 neues Gefäss nach entfernt ohne Ereignis: leer');
insert into public.naehrloesungsansatz (client_id, platz_id, typ, begonnen_am, volumen_l, gilt_ab, app_version)
  values (gen_random_uuid(), 'f3000000-0000-4000-8000-000000000316', 'neuansatz', '2027-01-05 10:00 Europe/Zurich', 9,
          '2027-01-05 10:00 Europe/Zurich', 'pgtap');
select is((select fuellzustand from public.v_fuellzustand where platz_id = 'f3000000-0000-4000-8000-000000000316'),
          'loesung', 'smoke3 D3 nach Neuansatz: Lösung');

-- ---------------------------------------------------------------------
-- 8.1 Regel 2: dieselben Ereignisse in vertauschter Erfassungsreihenfolge
-- Satz A erfasst e1, e2, p1, p2, v1, v2; Satz B dieselben Ereignisse rückwärts.
-- ---------------------------------------------------------------------

insert into public.satz (id, client_id, sorte_id, kulturform, anzuchtort_platz_id, anzahl_schwaemme, samen_je_schwamm,
                         saatdatum, gilt_ab, app_version) values
  ('f3000000-0000-4000-8000-000000000901', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000101', 'schnitt',
   'f3000000-0000-4000-8000-000000000323', 1, 1, '2027-01-07', '2027-01-07 09:00 Europe/Zurich', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000902', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000101', 'schnitt',
   'f3000000-0000-4000-8000-000000000324', 1, 1, '2027-01-07', '2027-01-07 09:00 Europe/Zurich', 'pgtap');
insert into public.pflanzung (id, client_id, satz_id, gilt_ab, app_version) values
  ('f3000000-0000-4000-8000-000000000911', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000901', '2027-01-07 09:00 Europe/Zurich', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000912', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000902', '2027-01-07 09:00 Europe/Zurich', 'pgtap');
insert into public.netztopf (id, anlage_id, kennung, groesse_mm, heim_platz_id, heim_loch_nr, app_version) values
  ('f3000000-0000-4000-8000-000000000921', 'f3000000-0000-4000-8000-000000000301', '2.7.1', 80, 'f3000000-0000-4000-8000-000000000317', 1, 'pgtap'),
  ('f3000000-0000-4000-8000-000000000922', 'f3000000-0000-4000-8000-000000000301', '2.7.2', 80, 'f3000000-0000-4000-8000-000000000317', 2, 'pgtap');

create temp table reihenfolge_ereignisse (nr int, typ public.ereignis_typ, daten jsonb, gilt timestamptz, ort boolean);
insert into reihenfolge_ereignisse values
  (1, 'aussaat', '{"saatdatum":"2027-01-06"}', '2027-01-08 10:00 Europe/Zurich', false),
  (2, 'aussaat', '{"saatdatum":"2027-01-05"}', '2027-01-09 10:00 Europe/Zurich', false),
  (3, 'phase_antwort', '{"phase":"anzucht","antwort":"ja","erwartet_am":"2027-01-13"}', '2027-01-13 10:00 Europe/Zurich', false),
  (4, 'phase_antwort', '{"phase":"wachstum","antwort":"ja","erwartet_am":"2027-01-20"}', '2027-01-20 10:00 Europe/Zurich', false),
  (5, 'verschieben', '{"nach_platz_id":"f3000000-0000-4000-8000-000000000318"}', '2027-01-21 10:00 Europe/Zurich', true),
  (6, 'verschieben', '{"nach_platz_id":"f3000000-0000-4000-8000-000000000319"}', '2027-01-22 10:00 Europe/Zurich', true);

create function pg_temp.erfassen(satz uuid, pflanzung uuid, topf uuid, loch int, rueckwaerts boolean) returns void
language plpgsql as $$
declare r record;
begin
  for r in select * from reihenfolge_ereignisse
            order by case when rueckwaerts then -nr else nr end loop
    insert into public.ereignis (client_id, typ, satz_id, pflanzung_id, netztopf_id, daten, gilt_ab, erfasst_am, app_version)
    values (gen_random_uuid(), r.typ,
            case when r.ort then null else satz end,
            case when r.ort then pflanzung end,
            case when r.ort then topf end,
            case when r.ort then r.daten || jsonb_build_object('nach_loch_nr', loch) else r.daten end,
            r.gilt,
            '2027-01-23 10:00 Europe/Zurich'::timestamptz + make_interval(mins => case when rueckwaerts then 7 - r.nr else r.nr end),
            'pgtap');
  end loop;
end $$;
select pg_temp.erfassen('f3000000-0000-4000-8000-000000000901', 'f3000000-0000-4000-8000-000000000911',
                        'f3000000-0000-4000-8000-000000000921', 1, false);
select pg_temp.erfassen('f3000000-0000-4000-8000-000000000902', 'f3000000-0000-4000-8000-000000000912',
                        'f3000000-0000-4000-8000-000000000922', 2, true);

select is((select string_agg(saatdatum::text, ' | ' order by id) from public.satz
            where id in ('f3000000-0000-4000-8000-000000000901', 'f3000000-0000-4000-8000-000000000902')),
          '2027-01-05 | 2027-01-05', '8.1 Regel 2 Ereignisse in vertauschter Erfassungsreihenfolge ergeben dasselbe Saatdatum');
select is((select string_agg(phase::text, ' | ' order by satz_id) from public.v_pflanzung_zustand
            where satz_id in ('f3000000-0000-4000-8000-000000000901', 'f3000000-0000-4000-8000-000000000902')),
          'wachstum | wachstum', '8.1 Regel 2 Ereignisse in vertauschter Erfassungsreihenfolge ergeben dieselbe Phase');
select is((select string_agg(p.kennung, ' | ' order by v.netztopf_id) from public.v_netztopf_platz v
             join public.platz p on p.id = v.platz_id
            where v.netztopf_id in ('f3000000-0000-4000-8000-000000000921', 'f3000000-0000-4000-8000-000000000922')),
          '2.9 | 2.9', '8.1 Regel 2 Ereignisse in vertauschter Erfassungsreihenfolge ergeben denselben Netztopf-Platz');

-- ---------------------------------------------------------------------
-- R8.3 Tausch zweier Töpfe: zwei Ereignisse mit gemeinsamer vorgang_id (A9 des Entwurfs)
-- ---------------------------------------------------------------------

insert into public.netztopf (id, anlage_id, kennung, groesse_mm, heim_platz_id, heim_loch_nr, app_version) values
  ('f3000000-0000-4000-8000-000000000931', 'f3000000-0000-4000-8000-000000000301', '2.5.1', 80, 'f3000000-0000-4000-8000-000000000315', 1, 'pgtap'),
  ('f3000000-0000-4000-8000-000000000932', 'f3000000-0000-4000-8000-000000000301', '2.5.2', 80, 'f3000000-0000-4000-8000-000000000315', 2, 'pgtap');
insert into public.ereignis (client_id, typ, netztopf_id, daten, gilt_ab, app_version) values
  (gen_random_uuid(), 'tausch', 'f3000000-0000-4000-8000-000000000931',
   '{"von_platz_id":"f3000000-0000-4000-8000-000000000315","von_loch_nr":1,"nach_platz_id":"f3000000-0000-4000-8000-000000000315","nach_loch_nr":2,"vorgang_id":"f3000000-0000-4000-8000-000000000939"}',
   '2027-01-25 10:00 Europe/Zurich', 'pgtap'),
  (gen_random_uuid(), 'tausch', 'f3000000-0000-4000-8000-000000000932',
   '{"von_platz_id":"f3000000-0000-4000-8000-000000000315","von_loch_nr":2,"nach_platz_id":"f3000000-0000-4000-8000-000000000315","nach_loch_nr":1,"vorgang_id":"f3000000-0000-4000-8000-000000000939"}',
   '2027-01-25 10:00 Europe/Zurich', 'pgtap');
select is((select string_agg(kennung || ' Loch ' || loch_nr || ' ausser Heim ' || ausser_heim, ', ' order by kennung)
             from public.v_netztopf_platz
            where netztopf_id in ('f3000000-0000-4000-8000-000000000931', 'f3000000-0000-4000-8000-000000000932')),
          '2.5.1 Loch 2 ausser Heim true, 2.5.2 Loch 1 ausser Heim true', 'R8.3 Tausch setzt beide Töpfe um');

-- ---------------------------------------------------------------------
-- v_keimrate nur echt, nur eingehaltene Keimtemperatur (8.1 Regel 7, R12.2; 06_tests.md Abschnitt 9)
-- Packung …a01 (Keimfähigkeit 0.80). Gezählt: …a21 echt, eingehalten, 10 gesät, 9 gekeimt.
-- Nicht gezählt: …a22 echt, keimtemp_eingehalten false; …a23 echt, ohne Angabe; …a24 Demo-Anzuchtort, eingehalten.
-- Erwartet 10/9, geglättet (9 + 10 · 0.80) / (10 + 10) = 0.85.
-- ---------------------------------------------------------------------

insert into public.platz (id, anlage_id, kennung, rolle, app_version)
  values ('f3000000-0000-4000-8000-000000000334', 'f3000000-0000-4000-8000-000000000302', 'A1', 'anzuchtort', 'pgtap');
insert into public.saatgut (id, sorte_id, keimfaehigkeit_packung, app_version)
  values ('f3000000-0000-4000-8000-000000000a01', 'f3000000-0000-4000-8000-000000000101', 0.80, 'pgtap');
insert into public.satz (id, client_id, sorte_id, saatgut_id, kulturform, anzuchtort_platz_id, anzahl_schwaemme,
                         samen_je_schwamm, saatdatum, gilt_ab, app_version) values
  ('f3000000-0000-4000-8000-000000000a11', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000101',
   'f3000000-0000-4000-8000-000000000a01', 'schnitt', 'f3000000-0000-4000-8000-000000000322', 3, 10, '2027-02-01',
   '2027-02-01 09:00 Europe/Zurich', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000a12', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000101',
   'f3000000-0000-4000-8000-000000000a01', 'schnitt', 'f3000000-0000-4000-8000-000000000334', 1, 10, '2027-02-01',
   '2027-02-01 09:00 Europe/Zurich', 'pgtap');
insert into public.pflanzung (id, client_id, satz_id, gilt_ab, app_version) values
  ('f3000000-0000-4000-8000-000000000a21', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000a11', '2027-02-01 09:00 Europe/Zurich', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000a22', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000a11', '2027-02-01 09:00 Europe/Zurich', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000a23', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000a11', '2027-02-01 09:00 Europe/Zurich', 'pgtap'),
  ('f3000000-0000-4000-8000-000000000a24', gen_random_uuid(), 'f3000000-0000-4000-8000-000000000a12', '2027-02-01 09:00 Europe/Zurich', 'pgtap');
insert into public.ereignis (client_id, typ, pflanzung_id, daten, gilt_ab, app_version) values
  (gen_random_uuid(), 'keimung', 'f3000000-0000-4000-8000-000000000a21',
   '{"samen_gesaet":10,"samen_gekeimt":9,"keimtemp_eingehalten":true}', '2027-02-08 10:00 Europe/Zurich', 'pgtap'),
  (gen_random_uuid(), 'keimung', 'f3000000-0000-4000-8000-000000000a22',
   '{"samen_gesaet":10,"samen_gekeimt":0,"keimtemp_eingehalten":false}', '2027-02-08 10:00 Europe/Zurich', 'pgtap'),
  (gen_random_uuid(), 'keimung', 'f3000000-0000-4000-8000-000000000a23',
   '{"samen_gesaet":10,"samen_gekeimt":0}', '2027-02-08 10:00 Europe/Zurich', 'pgtap'),
  (gen_random_uuid(), 'keimung', 'f3000000-0000-4000-8000-000000000a24',
   '{"samen_gesaet":10,"samen_gekeimt":0,"keimtemp_eingehalten":true}', '2027-02-08 10:00 Europe/Zurich', 'pgtap');
select is((select format('gesät %s, gekeimt %s, Rate %s', gesaet, gekeimt, round(rate_geglaettet, 2))
             from public.v_keimrate where saatgut_id = 'f3000000-0000-4000-8000-000000000a01'),
          'gesät 10, gekeimt 9, Rate 0.85',
          '8.1 Regel 7 v_keimrate nur echt, nur eingehaltene Keimtemperatur (Demo und nicht eingehalten nicht gezählt)');

-- ---------------------------------------------------------------------
-- smoke2 letzter Fall: backup_status_melden(1234) als postgres schreibt genau eine Zeile
-- ---------------------------------------------------------------------

create temp table backup_vorher as select count(*) as n from public.backup_status;
select public.backup_status_melden(1234);
select is((select format('%s neue Zeilen, davon %s mit 1234 Bytes aus backup.yml',
                         (select count(*) from public.backup_status) - (select n from backup_vorher),
                         (select count(*) from public.backup_status where groesse_bytes = 1234 and app_version = 'backup.yml'))),
          '1 neue Zeilen, davon 1 mit 1234 Bytes aus backup.yml',
          'smoke2 backup_status_melden(1234) als postgres schreibt genau eine Zeile');

select * from finish();
rollback;
