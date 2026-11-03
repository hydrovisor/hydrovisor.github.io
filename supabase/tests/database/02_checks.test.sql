-- 02_checks.test.sql · Checks und Wissensversionierung
-- (Konzept 8.1 Regel 4 und 7, R1.3, R1.5, R9.3; 06_tests.md Abschnitt 9 «Checks»; smoke.sql, smoke3.sql C1, D4, D5)
begin;
create extension if not exists pgtap with schema extensions;
-- Die Datenbank läuft in UTC wie in Supabase; alle Zeitpunkte stehen ausdrücklich in Europe/Zurich.
set local timezone to 'UTC';
select plan(13);

-- ---------------------------------------------------------------------
-- Fixtures als postgres
-- ---------------------------------------------------------------------

insert into public.quelle (quelle_id, titel, link, klasse, anbaumethode, app_version)
  values ('pgtap-q1', 'Testquelle', 'https://example.invalid/q1', 'peer_review', 'dwc', 'pgtap');
insert into public.art_schluessel (art_id) values ('pgtap_art_a');
insert into public.kulturgruppe (kulturgruppe_id, name, leitkultur_art_id, ec_obergrenze_validator, app_version)
  values ('pgtap_kg', 'Testgruppe', 'pgtap_art_a', 2.0, 'pgtap');
insert into public.art (art_id, name_de, name_wiss, kulturgruppe_id, quelldatei, zeile_id, commit, app_version)
  values ('pgtap_art_a', 'Testart A', 'Testus primus', 'pgtap_kg', 'art.csv', 'art.pgtap_art_a', 'pgtap', 'pgtap');
insert into public.sorte_schluessel (id, sorte_key) values ('f2000000-0000-4000-8000-000000000101', 'pgtap-sorte-a');
insert into public.sorte (sorte_id, name, art_id, kulturtyp, quelldatei, zeile_id, commit, app_version)
  values ('f2000000-0000-4000-8000-000000000101', 'Testsorte A', 'pgtap_art_a', 'blatt', 'sorten.csv', 'pgtap-sorte-a', 'pgtap', 'pgtap');
insert into public.profilwert (id, ebene, art_id, phase, groesse, wert_min, wert_max, quelle_id, fundstelle, kurzzitat,
                               evidenzklasse, quelldatei, zeile_id, commit, app_version)
  values ('f2000000-0000-4000-8000-000000000111', 'art', 'pgtap_art_a', 'wachstum', 'ph', 5.8, 6.5, 'pgtap-q1', 'S. 1', 'Zitat',
          'B1', 'profilwert.csv', 'pw.pgtap_art_a.wachstum.ph', 'pgtap', 'pgtap');
insert into public.messgeraet (id, modell, app_version) values ('f2000000-0000-4000-8000-000000000201', 'Testgeraet', 'pgtap');
insert into public.anlage (id, name, kuerzel, datenart, app_version)
  values ('f2000000-0000-4000-8000-000000000301', 'Testregal', 'R', 'echt', 'pgtap');
insert into public.platz (id, anlage_id, kennung, rolle, app_version) values
  ('f2000000-0000-4000-8000-000000000321', 'f2000000-0000-4000-8000-000000000301', '2.3', 'gefaess', 'pgtap'),
  ('f2000000-0000-4000-8000-000000000322', 'f2000000-0000-4000-8000-000000000301', 'A1', 'anzuchtort', 'pgtap');
insert into public.satz (id, client_id, sorte_id, kulturform, anzuchtort_platz_id, anzahl_schwaemme, samen_je_schwamm,
                         saatdatum, gilt_ab, app_version)
  values ('f2000000-0000-4000-8000-000000000381', gen_random_uuid(), 'f2000000-0000-4000-8000-000000000101', 'schnitt',
          'f2000000-0000-4000-8000-000000000322', 1, 2, '2027-01-08', '2027-01-08 09:00 Europe/Zurich', 'pgtap');
insert into public.pflanzung (id, client_id, satz_id, gilt_ab, app_version)
  values ('f2000000-0000-4000-8000-000000000391', gen_random_uuid(), 'f2000000-0000-4000-8000-000000000381',
          '2027-01-08 09:00 Europe/Zurich', 'pgtap');

-- ---------------------------------------------------------------------
-- Wissen (smoke.sql, 8.1 Regel 4)
-- ---------------------------------------------------------------------

select throws_ok(
  $$insert into public.profilwert (ebene, phase, groesse, wert_min, wert_max, ec_einheit_quelle, ec_basis_quelle, quelle_id,
                                   fundstelle, kurzzitat, evidenzklasse, quelldatei, zeile_id, commit, app_version)
    values ('standard', 'wachstum', 'ec', 1.0, 1.4, 'mS/cm', 'gesamt', 'pgtap-q1', 'S. 2', 'Zitat', 'C', 'profilwert.csv',
            'pw.pgtap.standard.wachstum.ec', 'pgtap', 'pgtap')$$,
  '23514'::bpchar, null::text, 'smoke Standardprofil mit EC abgelehnt (R1.3)');
select throws_ok(
  $$update public.profilwert set wert_min = 5.9 where id = 'f2000000-0000-4000-8000-000000000111'$$,
  'P0001'::bpchar, null::text, 'smoke Überschreiben einer Wissenszeile abgelehnt (8.1 Regel 4)');
select lives_ok(
  $$update public.profilwert set gueltig_bis = '2027-01-15 00:00 Europe/Zurich' where id = 'f2000000-0000-4000-8000-000000000111'$$,
  'smoke Schliessen einer Wissenszeile über gueltig_bis erlaubt (8.1 Regel 4)');

-- ---------------------------------------------------------------------
-- R9.3 Topfgrösse und Betriebsvolumen
-- ---------------------------------------------------------------------

select throws_ok(
  $$insert into public.netztopf (anlage_id, kennung, groesse_mm, heim_platz_id, heim_loch_nr, app_version)
    values ('f2000000-0000-4000-8000-000000000301', '2.3.1', 60, 'f2000000-0000-4000-8000-000000000321', 1, 'pgtap')$$,
  '23514'::bpchar, null::text, 'R9.3 Topfgrösse nur 50 oder 80 mm: netztopf 60 abgelehnt');
select throws_ok(
  $$insert into public.deckeltyp (name, topfdurchmesser_mm, loecher_je_reihe, app_version)
    values ('Deckel 60', 60, '{2,2}', 'pgtap')$$,
  '23514'::bpchar, null::text, 'R9.3 Topfgrösse nur 50 oder 80 mm: deckeltyp 60 abgelehnt');
select lives_ok(
  $$insert into public.netztopf (anlage_id, kennung, groesse_mm, heim_platz_id, heim_loch_nr, app_version)
    values ('f2000000-0000-4000-8000-000000000301', '2.3.1', 50, 'f2000000-0000-4000-8000-000000000321', 1, 'pgtap'),
           ('f2000000-0000-4000-8000-000000000301', '2.3.2', 80, 'f2000000-0000-4000-8000-000000000321', 2, 'pgtap')$$,
  'R9.3 Topfgrösse 50 und 80 mm erlaubt');
-- 400 × 300 × 170 mm = 20.4 l
select throws_ok(
  $$insert into public.gefaessmodell (name, form, innen_l_mm, innen_b_mm, innen_h_mm, betriebsvolumen_l, app_version)
    values ('Box voll', 'rechteckig', 400, 300, 170, 20.4, 'pgtap')$$,
  '23514'::bpchar, null::text, 'R9.3 Betriebsvolumen gleich L × B × H abgelehnt (UC3-AK2)');
select lives_ok(
  $$insert into public.gefaessmodell (name, form, innen_l_mm, innen_b_mm, innen_h_mm, betriebsvolumen_l, app_version)
    values ('Box knapp', 'rechteckig', 400, 300, 170, 20.3, 'pgtap')$$,
  'R9.3 Betriebsvolumen kleiner als L × B × H erlaubt');

-- ---------------------------------------------------------------------
-- Datenart an Ereignissen und pH-Kontrolle (8.1 Regel 7), Phasenantwort am Satz (R1.5)
-- ---------------------------------------------------------------------

select throws_ok(
  $$insert into public.ereignis (client_id, typ, messgeraet_id, gilt_ab, app_version)
    values (gen_random_uuid(), 'sonde_gereinigt', 'f2000000-0000-4000-8000-000000000201', '2027-01-10 10:00 Europe/Zurich', 'pgtap')$$,
  '23514'::bpchar, null::text, 'smoke3 C1 Sonde gereinigt ohne Datenart abgelehnt');
select throws_ok(
  $$insert into public.ereignis (client_id, typ, messgeraet_id, daten, gilt_ab, app_version)
    values (gen_random_uuid(), 'als_unsicher_markiert', 'f2000000-0000-4000-8000-000000000201',
            '{"seit_kalibrierung_id":"f2000000-0000-4000-8000-000000000999"}', '2027-01-10 10:00 Europe/Zurich', 'pgtap')$$,
  '23514'::bpchar, null::text, 'smoke3 C1 als unsicher markiert ohne Datenart abgelehnt');
select lives_ok(
  $$insert into public.ereignis (client_id, typ, messgeraet_id, daten, gilt_ab, app_version)
    values (gen_random_uuid(), 'sonde_gereinigt', 'f2000000-0000-4000-8000-000000000201', '{"datenart":"echt"}',
            '2027-01-10 10:00 Europe/Zurich', 'pgtap')$$,
  'smoke3 C1 Sonde gereinigt mit Datenart erlaubt');
select throws_ok(
  $$insert into public.messung (client_id, messgeraet_id, messart, ph, gilt_ab, app_version)
    values (gen_random_uuid(), 'f2000000-0000-4000-8000-000000000201', 'ph_kontrolle', 6.9, '2027-01-10 10:00 Europe/Zurich', 'pgtap')$$,
  '23514'::bpchar, null::text, 'smoke3 D4 pH-Kontrolle ohne Datenart abgelehnt');
select throws_ok(
  $$insert into public.ereignis (client_id, typ, satz_id, pflanzung_id, daten, gilt_ab, app_version)
    values (gen_random_uuid(), 'phase_antwort', 'f2000000-0000-4000-8000-000000000381', 'f2000000-0000-4000-8000-000000000391',
            '{"phase":"wachstum","antwort":"ja"}', '2027-01-20 10:00 Europe/Zurich', 'pgtap')$$,
  '23514'::bpchar, null::text, 'smoke3 D5 Phasenantwort an der Pflanzung abgelehnt (R1.5)');

select * from finish();
rollback;
