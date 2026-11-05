-- 14_umsetzen.test.sql · Umsetzen, Tausch und In der Station lassen gegen die echten Sichten (Plan 33 Testliste SQL;
-- UC5-AK3, UC6-AK3, R6.2, R8.3, R1-3 aus #90; Konzept 8.1 Regel 2 und 10). Semantik-Anker für die Nachbildung in
-- tests/fixtures/sichten.ts (umsetzSichtenNachrechnen). Keine Migration im Paket: die Sichten bestehen; die Fälle
-- halten fest, worauf src/domain und die E2E rechnen.
-- Eigene Anlage UM (Datenart test), angelegt als postgres. Ohne Personendaten. Alles in einer Transaktion mit rollback.
--
-- Fixture: Testart (Umsetzen ab 21, bis 28) mit profilwert Anzucht pH 5.8–6.2, EC 0.8–1.2 (gesamt).
--   2.3 (DWC, 3 × 2 × 80 mm) mit Töpfen 2.3.1 bis 2.3.4; Station 4.4 (Konstantpegel, feste Dosis, 13 × 50 mm);
--   Station 4.2 (Konstantpegel, feste Dosis, 4 × 80 mm); Anzuchtbox A1.
--   Satz S1 gesät 7.1. in A1: P1 und P2 auf 4.4 Loch 1 und 2 (Stationseintritt 11.1.), Zieltöpfe 2.3.1 und 2.3.2;
--   P4 in der Box mit Zieltopf 2.3.4; Phase anzucht ab 15.1. (phase_antwort am Satz).
--   Satz S2 gesät 7.1. in A1: P3 mit 8-cm-Zieltopf 2.3.3, mit dem Topf auf 4.2 Loch 1 (Stationseintritt mit netztopf_id).
begin;
create extension if not exists pgtap with schema extensions;
set local timezone to 'UTC';
select plan(20);

insert into public.quelle (quelle_id, titel, link, klasse, anbaumethode, app_version)
  values ('pgtap-um-q', 'Testquelle Umsetzen', 'https://example.invalid/um', 'peer_review', 'dwc', 'pgtap');
insert into public.art_schluessel (art_id) values ('pgtap_um_art');
insert into public.kulturgruppe (kulturgruppe_id, name, leitkultur_art_id, ec_obergrenze_validator, app_version)
  values ('pgtap_um_kg', 'Testgruppe Umsetzen', 'pgtap_um_art', 2.0, 'pgtap');
insert into public.art (art_id, name_de, name_wiss, kulturgruppe_id, umsetzen_ab_d, umsetzen_bis_d, quelldatei, zeile_id,
                        commit, app_version)
  values ('pgtap_um_art', 'Testart Umsetzen', 'Testus transplantatus', 'pgtap_um_kg', 21, 28, 'art.csv',
          'art.pgtap_um_art', 'pgtap', 'pgtap');
insert into public.sorte_schluessel (id, sorte_key) values ('14000000-0000-4000-8000-000000000101', 'pgtap-um-sorte');
insert into public.sorte (sorte_id, name, art_id, kulturtyp, quelldatei, zeile_id, commit, app_version)
  values ('14000000-0000-4000-8000-000000000101', 'Testsorte Umsetzen', 'pgtap_um_art', 'blatt', 'sorten.csv',
          'pgtap-um-sorte', 'pgtap', 'pgtap');
insert into public.profilwert (ebene, sorte_id, art_id, kulturgruppe_id, phase, groesse, wert_min, wert_typ, wert_max,
                               ec_einheit_quelle, ec_basis_quelle, quelle_id, fundstelle, kurzzitat, evidenzklasse, vermerk,
                               quelldatei, zeile_id, commit, app_version) values
  ('art', null, 'pgtap_um_art', null, 'anzucht', 'ph', 5.8, null, 6.2, null, null, 'pgtap-um-q', 'S. 1', 'Zitat', 'B1',
   'keine', 'profilwert.csv', 'pw.pgtap_um_art.anzucht.ph', 'pgtap', 'pgtap'),
  ('art', null, 'pgtap_um_art', null, 'anzucht', 'ec', 0.8, null, 1.2, 'mS/cm', 'gesamt', 'pgtap-um-q', 'S. 2', 'Zitat',
   'B1', 'keine', 'profilwert.csv', 'pw.pgtap_um_art.anzucht.ec', 'pgtap', 'pgtap');

insert into public.anlage (id, name, kuerzel, datenart, app_version)
  values ('14000000-0000-4000-8000-000000000201', 'Testanlage Umsetzen', 'UM', 'test', 'pgtap');
insert into public.platz (id, anlage_id, kennung, rolle, app_version) values
  ('14000000-0000-4000-8000-000000000223', '14000000-0000-4000-8000-000000000201', '2.3', 'gefaess', 'pgtap'),
  ('14000000-0000-4000-8000-000000000242', '14000000-0000-4000-8000-000000000201', '4.2', 'gefaess', 'pgtap'),
  ('14000000-0000-4000-8000-000000000244', '14000000-0000-4000-8000-000000000201', '4.4', 'gefaess', 'pgtap'),
  ('14000000-0000-4000-8000-000000000251', '14000000-0000-4000-8000-000000000201', 'A1', 'anzuchtort', 'pgtap');
insert into public.gefaessmodell (id, name, form, innen_l_mm, innen_b_mm, innen_h_mm, betriebsvolumen_l, app_version)
  values ('14000000-0000-4000-8000-000000000301', 'Testbox Umsetzen', 'rechteckig', 365, 265, 200, 9, 'pgtap');
insert into public.deckeltyp (id, name, topfdurchmesser_mm, loecher_je_reihe, app_version) values
  ('14000000-0000-4000-8000-000000000311', 'UM-D2', 80, '{2,2,2}', 'pgtap'),
  ('14000000-0000-4000-8000-000000000312', 'UM-S5', 50, '{1,2,1,2,1,2,1,2,1}', 'pgtap'),
  ('14000000-0000-4000-8000-000000000313', 'UM-S8', 80, '{4}', 'pgtap');
insert into public.gefaess (platz_id, gefaessmodell_id, deckeltyp_id, betriebsart, feste_dosis, betriebsvolumen_l,
                            intervall_messen_d, intervall_wechseln_d, gueltig_von, app_version) values
  ('14000000-0000-4000-8000-000000000223', '14000000-0000-4000-8000-000000000301', '14000000-0000-4000-8000-000000000311',
   'dwc', false, 9, 2, 14, '2026-12-01 10:00 Europe/Zurich', 'pgtap'),
  ('14000000-0000-4000-8000-000000000242', '14000000-0000-4000-8000-000000000301', '14000000-0000-4000-8000-000000000313',
   'konstantpegel', true, 2.3, 2, 14, '2026-12-01 10:00 Europe/Zurich', 'pgtap'),
  ('14000000-0000-4000-8000-000000000244', '14000000-0000-4000-8000-000000000301', '14000000-0000-4000-8000-000000000312',
   'konstantpegel', true, 2.3, 2, 14, '2026-12-01 10:00 Europe/Zurich', 'pgtap');
insert into public.netztopf (id, anlage_id, kennung, groesse_mm, heim_platz_id, heim_loch_nr, app_version)
  select ('14000000-0000-4000-8000-00000000040' || n)::uuid, '14000000-0000-4000-8000-000000000201', '2.3.' || n, 80,
         '14000000-0000-4000-8000-000000000223', n, 'pgtap'
    from generate_series(1, 4) n;

insert into public.satz (id, client_id, sorte_id, kulturform, anzuchtort_platz_id, anzahl_schwaemme, samen_je_schwamm,
                         saatdatum, gilt_ab, app_version) values
  ('14000000-0000-4000-8000-000000000501', gen_random_uuid(), '14000000-0000-4000-8000-000000000101', 'kopf',
   '14000000-0000-4000-8000-000000000251', 3, 2, '2027-01-07', '2027-01-07 12:00 Europe/Zurich', 'pgtap'),
  ('14000000-0000-4000-8000-000000000502', gen_random_uuid(), '14000000-0000-4000-8000-000000000101', 'kopf',
   '14000000-0000-4000-8000-000000000251', 1, 1, '2027-01-07', '2027-01-07 12:00 Europe/Zurich', 'pgtap');
insert into public.pflanzung (id, client_id, satz_id, gilt_ab, app_version) values
  ('14000000-0000-4000-8000-000000000601', gen_random_uuid(), '14000000-0000-4000-8000-000000000501', '2027-01-07 12:00 Europe/Zurich', 'pgtap'),
  ('14000000-0000-4000-8000-000000000602', gen_random_uuid(), '14000000-0000-4000-8000-000000000501', '2027-01-07 12:00 Europe/Zurich', 'pgtap'),
  ('14000000-0000-4000-8000-000000000604', gen_random_uuid(), '14000000-0000-4000-8000-000000000501', '2027-01-07 12:00 Europe/Zurich', 'pgtap'),
  ('14000000-0000-4000-8000-000000000603', gen_random_uuid(), '14000000-0000-4000-8000-000000000502', '2027-01-07 12:00 Europe/Zurich', 'pgtap');
insert into public.reservierung (client_id, pflanzung_id, netztopf_id, umsetzen_vorgabe_am, gilt_ab, app_version) values
  (gen_random_uuid(), '14000000-0000-4000-8000-000000000601', '14000000-0000-4000-8000-000000000401', '2027-01-28',
   '2027-01-07 12:00 Europe/Zurich', 'pgtap'),
  (gen_random_uuid(), '14000000-0000-4000-8000-000000000602', '14000000-0000-4000-8000-000000000402', '2027-01-28',
   '2027-01-07 12:00 Europe/Zurich', 'pgtap'),
  (gen_random_uuid(), '14000000-0000-4000-8000-000000000603', '14000000-0000-4000-8000-000000000403', '2027-01-28',
   '2027-01-07 12:00 Europe/Zurich', 'pgtap'),
  (gen_random_uuid(), '14000000-0000-4000-8000-000000000604', '14000000-0000-4000-8000-000000000404', '2027-01-28',
   '2027-01-07 12:00 Europe/Zurich', 'pgtap');

-- Ereignis an einer Pflanzung (optional mit Topf)
create function pg_temp.an_pflanzung(id uuid, typ public.ereignis_typ, pflanzung uuid, topf uuid, daten jsonb,
                                     gilt timestamptz) returns void language sql as $$
  insert into public.ereignis (client_id, typ, pflanzung_id, netztopf_id, daten, gilt_ab, app_version)
  values (id, typ, pflanzung, topf, daten, gilt, 'pgtap')
$$;
-- Ort einer Pflanzung als «Platz Loch Topf»
create function pg_temp.ort(pflanzung uuid) returns text language sql stable as $$
  select coalesce(p.kennung, '-') || ' ' || coalesce(z.loch_nr::text, '-') || ' ' || coalesce(t.kennung, '-')
    from public.v_pflanzung_zustand z
    left join public.platz p on p.id = z.platz_id
    left join public.netztopf t on t.id = z.netztopf_id
   where z.pflanzung_id = pflanzung
$$;
-- aktueller Platz eines Topfs als «Platz Loch ausser_heim»
create function pg_temp.topf(topf_id uuid) returns text language sql stable as $$
  select p.kennung || ' ' || v.loch_nr || ' ' || v.ausser_heim
    from public.v_netztopf_platz v join public.platz p on p.id = v.platz_id
   where v.netztopf_id = topf_id
$$;

-- Keimung und Stationseintritt am 11.1. (5 cm ohne Topf, 8 cm mit Zieltopf), Phase anzucht ab 15.1.
select pg_temp.an_pflanzung(gen_random_uuid(), 'verschieben', '14000000-0000-4000-8000-000000000601', null,
  '{"von_platz_id":"14000000-0000-4000-8000-000000000251","nach_platz_id":"14000000-0000-4000-8000-000000000244","nach_loch_nr":1}',
  '2027-01-11 09:00 Europe/Zurich');
select pg_temp.an_pflanzung(gen_random_uuid(), 'verschieben', '14000000-0000-4000-8000-000000000602', null,
  '{"von_platz_id":"14000000-0000-4000-8000-000000000251","nach_platz_id":"14000000-0000-4000-8000-000000000244","nach_loch_nr":2}',
  '2027-01-11 09:00 Europe/Zurich');
select pg_temp.an_pflanzung(gen_random_uuid(), 'verschieben', '14000000-0000-4000-8000-000000000603',
  '14000000-0000-4000-8000-000000000403',
  '{"von_platz_id":"14000000-0000-4000-8000-000000000251","nach_platz_id":"14000000-0000-4000-8000-000000000242","nach_loch_nr":1}',
  '2027-01-11 09:00 Europe/Zurich');
insert into public.ereignis (client_id, typ, satz_id, daten, gilt_ab, app_version)
  values (gen_random_uuid(), 'phase_antwort', '14000000-0000-4000-8000-000000000501', '{"phase":"anzucht","antwort":"ja"}',
          '2027-01-15 09:00 Europe/Zurich', 'pgtap');

-- ---------------------------------------------------------------------
-- Vor dem Umsetzen
-- ---------------------------------------------------------------------

select is(pg_temp.ort('14000000-0000-4000-8000-000000000601'), '4.4 1 -',
          'UC5-AK3 Stationseintritt 5 cm: Pflanzung auf 4.4 Loch 1 ohne Topf');
select is((select zaehlende_pflanzungen::int from public.v_zielbereich where platz_id = '14000000-0000-4000-8000-000000000244'),
          2, 'UC5-AK3 v_zielbereich zählt vor dem Umsetzen 2 Pflanzungen auf 4.4');
select is((select count(*)::int from public.v_zielbereich where platz_id = '14000000-0000-4000-8000-000000000223'),
          0, 'UC5-AK3 v_zielbereich hat vor dem Umsetzen keine Zeile für 2.3');
select is(pg_temp.topf('14000000-0000-4000-8000-000000000403'), '4.2 1 true',
          'UC5-AK3 R1-3 Stationseintritt mit netztopf_id: v_netztopf_platz zeigt den 8-cm-Zieltopf auf 4.2 (ausser_heim)');

-- ---------------------------------------------------------------------
-- UC5-AK3 Wie geplant umsetzen am 19.1.
-- ---------------------------------------------------------------------

select pg_temp.an_pflanzung('14000000-0000-4000-8000-000000000701', 'umsetzen', '14000000-0000-4000-8000-000000000601',
  '14000000-0000-4000-8000-000000000401',
  '{"von_platz_id":"14000000-0000-4000-8000-000000000244","von_loch_nr":1,"nach_platz_id":"14000000-0000-4000-8000-000000000223","nach_loch_nr":1}',
  '2027-01-19 09:00 Europe/Zurich');
select pg_temp.an_pflanzung('14000000-0000-4000-8000-000000000702', 'umsetzen', '14000000-0000-4000-8000-000000000602',
  '14000000-0000-4000-8000-000000000402',
  '{"von_platz_id":"14000000-0000-4000-8000-000000000244","von_loch_nr":2,"nach_platz_id":"14000000-0000-4000-8000-000000000223","nach_loch_nr":2}',
  '2027-01-19 09:00 Europe/Zurich');

select is((select count(*)::int from public.v_reservierung_aktiv
            where pflanzung_id in ('14000000-0000-4000-8000-000000000601', '14000000-0000-4000-8000-000000000602')),
          0, 'UC5-AK3 umsetzen beendet die Reservierung');
select is((select count(*)::int from public.v_reservierung_aktiv where pflanzung_id = '14000000-0000-4000-8000-000000000604'),
          1, 'UC5-AK3 die Reservierung des nicht umgesetzten Schwamms bleibt');
select is(pg_temp.ort('14000000-0000-4000-8000-000000000601') || ', ' || pg_temp.ort('14000000-0000-4000-8000-000000000602'),
          '2.3 1 2.3.1, 2.3 2 2.3.2', 'UC5-AK3 umsetzen setzt Platz und Topf in v_pflanzung_zustand');
select is((select saatdatum::text from public.satz where id = '14000000-0000-4000-8000-000000000501'), '2027-01-07',
          'UC5-AK3 satz.saatdatum bleibt nach dem Umsetzen');
select is((select string_agg(phase::text, ',' order by pflanzung_id) from public.v_pflanzung_zustand
            where satz_id = '14000000-0000-4000-8000-000000000501'),
          'anzucht,anzucht,anzucht', 'UC5-AK3 Phase bleibt nach dem Umsetzen');
select is((select zaehlende_pflanzungen::int || ' ' || ph_min || '-' || ph_max || ' ' || ec_min || '-' || ec_max
             from public.v_zielbereich where platz_id = '14000000-0000-4000-8000-000000000223'),
          '2 5.800-6.200 0.800-1.200', 'UC5-AK3 v_zielbereich zählt die umgesetzten Pflanzungen in 2.3');
select is((select count(*)::int from public.v_zielbereich where platz_id = '14000000-0000-4000-8000-000000000244'),
          0, 'UC5-AK3 v_zielbereich zählt sie nicht mehr in 4.4');

-- 8-cm-Zieltopf von der Station an den Heimplatz
select pg_temp.an_pflanzung('14000000-0000-4000-8000-000000000703', 'umsetzen', '14000000-0000-4000-8000-000000000603',
  '14000000-0000-4000-8000-000000000403',
  '{"von_platz_id":"14000000-0000-4000-8000-000000000242","von_loch_nr":1,"nach_platz_id":"14000000-0000-4000-8000-000000000223","nach_loch_nr":3}',
  '2027-01-19 09:00 Europe/Zurich');
select is(pg_temp.topf('14000000-0000-4000-8000-000000000403'), '2.3 3 false',
          'UC5-AK3 R1-3 nach umsetzen steht der 8-cm-Zieltopf wieder am Heimplatz');
select is(pg_temp.ort('14000000-0000-4000-8000-000000000603'), '2.3 3 2.3.3',
          'UC5-AK3 R1-3 die Pflanzung steht mit ihrem Topf in 2.3 Loch 3');

-- ---------------------------------------------------------------------
-- UC6-AK3 Tausch 2.3.1 ↔ 2.3.2 am 20.1.: zwei Ereignisse mit gemeinsamer vorgang_id
-- ---------------------------------------------------------------------

select pg_temp.an_pflanzung('14000000-0000-4000-8000-000000000711', 'tausch', '14000000-0000-4000-8000-000000000601',
  '14000000-0000-4000-8000-000000000401',
  '{"von_platz_id":"14000000-0000-4000-8000-000000000223","von_loch_nr":1,"nach_platz_id":"14000000-0000-4000-8000-000000000223","nach_loch_nr":2,"vorgang_id":"14000000-0000-4000-8000-000000000719"}',
  '2027-01-20 09:00 Europe/Zurich');
select pg_temp.an_pflanzung('14000000-0000-4000-8000-000000000712', 'tausch', '14000000-0000-4000-8000-000000000602',
  '14000000-0000-4000-8000-000000000402',
  '{"von_platz_id":"14000000-0000-4000-8000-000000000223","von_loch_nr":2,"nach_platz_id":"14000000-0000-4000-8000-000000000223","nach_loch_nr":1,"vorgang_id":"14000000-0000-4000-8000-000000000719"}',
  '2027-01-20 09:00 Europe/Zurich');
select is(pg_temp.topf('14000000-0000-4000-8000-000000000401') || ', ' || pg_temp.topf('14000000-0000-4000-8000-000000000402'),
          '2.3 2 true, 2.3 1 true', 'UC6-AK3 zwei tausch vertauschen v_netztopf_platz');
select is(pg_temp.ort('14000000-0000-4000-8000-000000000601') || ', ' || pg_temp.ort('14000000-0000-4000-8000-000000000602'),
          '2.3 2 2.3.1, 2.3 1 2.3.2', 'UC6-AK3 zwei tausch vertauschen v_pflanzung_zustand');
-- Rückgängig: Storno in umgekehrter Reihenfolge
update public.ereignis set storniert_am = '2027-01-20 09:01 Europe/Zurich', storno_grund = 'rueckgaengig'
 where client_id = '14000000-0000-4000-8000-000000000712';
update public.ereignis set storniert_am = '2027-01-20 09:01 Europe/Zurich', storno_grund = 'rueckgaengig'
 where client_id = '14000000-0000-4000-8000-000000000711';
select is(pg_temp.topf('14000000-0000-4000-8000-000000000401') || ', ' || pg_temp.topf('14000000-0000-4000-8000-000000000402'),
          '2.3 1 false, 2.3 2 false', 'UC6-AK3 Storno des Tauschs stellt v_netztopf_platz zurück');
select is(pg_temp.ort('14000000-0000-4000-8000-000000000601') || ', ' || pg_temp.ort('14000000-0000-4000-8000-000000000602'),
          '2.3 1 2.3.1, 2.3 2 2.3.2', 'UC6-AK3 Storno des Tauschs stellt v_pflanzung_zustand zurück');

-- ---------------------------------------------------------------------
-- R6.2 In der Station lassen (P4, Vorgabe 28.1., bis Saat + 28 = 4.2.)
-- ---------------------------------------------------------------------

select pg_temp.an_pflanzung('14000000-0000-4000-8000-000000000721', 'umsetzdatum_geaendert',
  '14000000-0000-4000-8000-000000000604', null,
  '{"von":"2027-01-28","nach":"2027-02-04","grund":"in_station_lassen"}', '2027-01-28 09:00 Europe/Zurich');
select is((select umsetzen_geplant_am::text from public.reservierung where pflanzung_id = '14000000-0000-4000-8000-000000000604'),
          '2027-02-04', 'R6.2 umsetzdatum_geaendert in_station_lassen setzt reservierung.umsetzen_geplant_am');
select is((select umsetzen_vorgabe_am::text from public.reservierung where pflanzung_id = '14000000-0000-4000-8000-000000000604'),
          '2027-01-28', 'R6.2 umsetzen_vorgabe_am bleibt');
update public.ereignis set storniert_am = '2027-01-28 09:01 Europe/Zurich', storno_grund = 'rueckgaengig'
 where client_id = '14000000-0000-4000-8000-000000000721';
select is((select umsetzen_geplant_am::text from public.reservierung where pflanzung_id = '14000000-0000-4000-8000-000000000604'),
          '2027-01-28', 'R6.2 Storno von in_station_lassen fällt auf die Vorgabe zurück');

select * from finish();
rollback;
