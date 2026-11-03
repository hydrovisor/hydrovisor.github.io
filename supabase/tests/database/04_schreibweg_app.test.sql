-- 04_schreibweg_app.test.sql · Schreibweg der App in Wissenstabellen: wissen_app_schreiben() als Tim
-- (UC4, Konzept 8.1 Regel 4 und 6, R1.3, R12.3; 06_tests.md Abschnitt 9; smoke3.sql C5, C9, C10; Plan 9)
begin;
create extension if not exists pgtap with schema extensions;
-- Die Datenbank läuft in UTC wie in Supabase; alle Zeitpunkte stehen ausdrücklich in Europe/Zurich.
set local timezone to 'UTC';
select plan(13);

-- ---------------------------------------------------------------------
-- Fixtures als postgres: Leitkultur pgtap_leit der Kulturgruppe pgtap_kg mit Herkunft
-- ---------------------------------------------------------------------

insert into auth.users (id) values ('00000000-0000-4000-8000-00000000000a') on conflict (id) do nothing;
insert into public.zugang (user_id, app_version) values ('00000000-0000-4000-8000-00000000000a', 'pgtap');
insert into public.quelle (quelle_id, titel, link, klasse, anbaumethode, app_version)
  values ('pgtap-q1', 'Testquelle', 'https://example.invalid/q1', 'peer_review', 'dwc', 'pgtap');
insert into public.art_schluessel (art_id) values ('pgtap_leit');
insert into public.kulturgruppe (kulturgruppe_id, name, leitkultur_art_id, ec_obergrenze_validator, app_version)
  values ('pgtap_kg', 'Testgruppe', 'pgtap_leit', 2.0, 'pgtap');
insert into public.art (art_id, name_de, name_wiss, kulturgruppe_id, standard_keimfaehigkeit, systemeignung, umsetzen_ab_d,
                        umsetzen_bis_d, kulturformen_erlaubt, kulturform_vorgabe, quelldatei, zeile_id, commit, app_version)
  values ('pgtap_leit', 'Leitart', 'Testus ducens', 'pgtap_kg', 0.80, 'beide', 10, 18, '{schnitt,kopf,babyleaf}', 'schnitt',
          'art.csv', 'art.pgtap_leit', 'pgtap', 'pgtap');
insert into public.herkunft (tabelle, zeile_id, feld, quelle_id, fundstelle, kurzzitat, evidenzklasse, app_version) values
  ('art', 'art.pgtap_leit', 'systemeignung', 'pgtap-q1', 'S. 3', 'Zitat', 'B1', 'pgtap'),
  ('art', 'art.pgtap_leit', 'umsetzen_ab_d', 'pgtap-q1', 'S. 4', 'Zitat', 'B2', 'pgtap'),
  ('art', 'art.pgtap_leit', 'name_de', 'pgtap-q1', 'S. 1', 'Zitat', 'C', 'pgtap');
insert into public.art_kulturform (art_id, kulturform, ernte_ab_d, ernteart, ernteintervall_d, schnitte_max, kulturdauer_max_d,
                                   kulturdauer_typisch_d, quelldatei, zeile_id, commit, app_version) values
  ('pgtap_leit', 'schnitt', 28, 'mehrfach', 7, 3, 70, 56, 'art.csv', 'ak.pgtap_leit.schnitt', 'pgtap', 'pgtap'),
  ('pgtap_leit', 'kopf', 45, 'einmalig', null, null, 70, 60, 'art.csv', 'ak.pgtap_leit.kopf', 'pgtap', 'pgtap');
insert into public.herkunft (tabelle, zeile_id, feld, quelle_id, fundstelle, kurzzitat, evidenzklasse, app_version)
  values ('art_kulturform', 'ak.pgtap_leit.schnitt', 'ernte_ab_d', 'pgtap-q1', 'S. 5', 'Zitat', 'B1', 'pgtap');

-- ---------------------------------------------------------------------
-- Aufrufe als Tim (authenticated)
-- ---------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);

select isnt(
  public.wissen_app_schreiben('art_neu', '{"art_id":"pgtap_neu","name_de":"Neuart","name_wiss":"Testus novus","kulturgruppe_id":"pgtap_kg"}'),
  null, 'smoke3 C5 art_neu legt die Art an (UC4, neue Art über die Kulturgruppe)');
select is(
  public.wissen_app_schreiben('sorte_neu', '{"sorte_id":"f4000000-0000-4000-8000-000000000001","name":"Testsorte Neu","art_id":"pgtap_neu","kulturtyp":"blatt"}')::text,
  'f4000000-0000-4000-8000-000000000001', 'smoke3 C9 sorte_neu übernimmt die sorte_id des Clients');
select is(
  public.wissen_app_schreiben('sorte_neu', '{"sorte_id":"f4000000-0000-4000-8000-000000000001","name":"Testsorte Neu","art_id":"pgtap_neu","kulturtyp":"blatt"}')::text,
  'f4000000-0000-4000-8000-000000000001', 'smoke3 C9 zweiter Aufruf sorte_neu liefert dieselbe ID (Warteschlange)');
select isnt(
  public.wissen_app_schreiben('tuetenwert', '{"sorte_id":"f4000000-0000-4000-8000-000000000001","groesse":"keimtemp","wert_min":15,"wert_typ":18,"wert_max":20}'),
  null, 'smoke3 C10 erster Tütenwert gespeichert');
select isnt(
  public.wissen_app_schreiben('tuetenwert', '{"sorte_id":"f4000000-0000-4000-8000-000000000001","groesse":"keimtemp","wert_min":16,"wert_typ":18,"wert_max":21}'),
  null, 'smoke3 C10 zweiter Tütenwert derselben Grösse gespeichert');
select public.wissen_app_schreiben('saatempfehlung_neu', '{"sorte_id":"f4000000-0000-4000-8000-000000000001","kulturform":"schnitt","samen_je_schwamm":3,"obergrenze_samen":4,"klasse_saatmenge":"C"}') is not null as c5_tuete;
select public.wissen_app_schreiben('saatempfehlung_neu', '{"sorte_id":"f4000000-0000-4000-8000-000000000001","kulturform":"schnitt","samen_je_schwamm":2,"obergrenze_samen":4,"klasse_saatmenge":"C","bestaetigt":true}') is not null as c5_tuete_bestaetigt;
select public.wissen_app_schreiben('saatempfehlung_neu', '{"ebene":"art","art_id":"pgtap_neu","kulturform":"kopf","samen_je_schwamm":2,"klasse_saatmenge":"D"}') is not null as c5_art_d;
select throws_ok(
  $$select public.wissen_app_schreiben('saatempfehlung_neu', '{"sorte_id":"f4000000-0000-4000-8000-000000000001","kulturform":"kopf","samen_je_schwamm":2,"klasse_saatmenge":"A"}')$$,
  'P0001'::bpchar, null::text, 'smoke3 C5 saatempfehlung_neu Klasse A aus der App abgelehnt (R12.3)');
reset role;

-- ---------------------------------------------------------------------
-- Ergebnis als postgres
-- ---------------------------------------------------------------------

select is(
  (select concat_ws(' ', kulturformen_erlaubt::text, kulturform_vorgabe, systemeignung, umsetzen_ab_d, umsetzen_bis_d,
                    standard_keimfaehigkeit, quelldatei)
     from public.art where art_id = 'pgtap_neu' and gueltig_bis is null),
  '{schnitt,kopf,babyleaf} schnitt beide 10 18 0.80 app', 'smoke3 C5 art_neu übernimmt die Merkmale der Leitkultur (A11)');
select is(
  (select string_agg(kulturform || ' ' || ernteart || ' ' || zeile_id, ', ' order by kulturform)
     from public.art_kulturform where art_id = 'pgtap_neu' and gueltig_bis is null),
  'schnitt mehrfach ak.pgtap_neu.schnitt, kopf einmalig ak.pgtap_neu.kopf', 'smoke3 C5 art_neu übernimmt die Kulturformen');
select is(
  (select string_agg(tabelle || '.' || feld || ' ' || evidenzklasse, ', ' order by tabelle, feld)
     from public.herkunft
    where vermerk = 'leitkultur' and zeile_id in ('art.pgtap_neu', 'ak.pgtap_neu.schnitt', 'ak.pgtap_neu.kopf')),
  'art.systemeignung B1, art.umsetzen_ab_d B2, art_kulturform.ernte_ab_d B1',
  'smoke3 C5 Herkunft mit Vermerk leitkultur, ohne Stammfelder (R1.3)');
select is(
  (select count(*) || ' ' || bool_and(sk.sorte_key = 'app-' || sk.id and so.zeile_id = sk.sorte_key)
     from public.sorte_schluessel sk join public.sorte so on so.sorte_id = sk.id
    where sk.id = 'f4000000-0000-4000-8000-000000000001'),
  '1 true', 'smoke3 C9 sorte_neu: sorte_key = zeile_id = app-<sorte_id>, idempotent');
select is(
  (select count(*) filter (where gueltig_bis is null) || ' ' || count(*) filter (where gueltig_bis is not null) || ' '
          || max(wert_min) filter (where gueltig_bis is null) || ' ' || max(evidenzklasse::text) || ' ' || max(vermerk::text)
     from public.profilwert where sorte_id = 'f4000000-0000-4000-8000-000000000001' and groesse = 'keimtemp'),
  '1 1 16.000 C tuete', 'smoke3 C10 zweiter Tütenwert schliesst den ersten (8.1 Regel 4)');
select is(
  (select string_agg(ebene || ' ' || kulturform || ' ' || klasse_saatmenge || ' ' || samen_je_schwamm || ' '
                     || coalesce(quelle_id, '-') || ' ' || (bestaetigt_am is not null) || ' ' || zeile_id, ', '
                     order by ebene, kulturform)
     from public.saatempfehlung
    where gueltig_bis is null and (sorte_id = 'f4000000-0000-4000-8000-000000000001' or art_id = 'pgtap_neu')),
  'sorte schnitt C 2 tuete-app-f4000000-0000-4000-8000-000000000001 true se.app-f4000000-0000-4000-8000-000000000001.schnitt, '
  || 'art kopf D 2 - false se.pgtap_neu.kopf',
  'smoke3 C5 saatempfehlung_neu: Tüte Klasse C nur Sorte, neue Fassung schliesst alte, Art Klasse D (R12.3)');

-- Bestätigung einer bestehenden Saatempfehlung als neue Version (R12.3)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
select public.wissen_app_schreiben('saatempfehlung_bestaetigen', jsonb_build_object('saatempfehlung_id', se.id)) is not null as r12_3
  from public.saatempfehlung se where se.art_id = 'pgtap_neu' and se.kulturform = 'kopf' and se.gueltig_bis is null;
reset role;
select is(
  (select count(*) filter (where gueltig_bis is null and bestaetigt_am is not null) || ' gültig bestätigt, '
          || count(*) filter (where gueltig_bis is not null and bestaetigt_am is null) || ' geschlossen unbestätigt'
     from public.saatempfehlung where art_id = 'pgtap_neu' and kulturform = 'kopf'),
  '1 gültig bestätigt, 1 geschlossen unbestätigt', 'smoke3 C5 saatempfehlung_bestaetigen legt eine bestätigte Fassung an (R12.3)');

select * from finish();
rollback;
