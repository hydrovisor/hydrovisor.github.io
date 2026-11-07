-- 19_termintreue.test.sql · Termintreue zählt jeden Schlüssel einmal, EK5 zählt vorgezogene Zeilen
-- (Plan 118 Abschnitt Migration und Testliste «pgTAP»; Konzept 8.6 Termintreue, 2.3 EK5, R5.6; C4-AK1, C4-AK3,
-- UC8-AK7; Plan 31 A7; Annahmen A3, A4).
-- Alles in einer Transaktion mit rollback; jeder Fall hat eigene Fixtures in einem Unterblock, der nach der Abfrage
-- zurückgerollt wird (wie 05_auswertung.test.sql). Eigene Anlagen TT (echt) und TX (demo) mit festen IDs, Fenster
-- testbetrieb 7.1. bis 1.4.2027. Erledigung über messung bzw. naehrloesungsansatz mit aufgabe_schluessel und
-- erfasst_am = gilt_ab (nacherfasst = false). Keine Personendaten.
-- Vorausgesetzt (Plan 118 Migration):
-- - v_termintreue: Fenster- und Platzfilter zuerst, dann je aufgabe_schluessel nur die Zeile mit dem frühesten tag,
--   darüber die bisherige Zählung je tag; Spalten tag, faellig, erledigt_bis_folgetag unverändert.
-- - Kommentar von v_termintreue beginnt mit «Messplan Termintreue: », enthält «Messplan » genau einmal und
--   «je Schlüssel einmal».
-- - v_push_zustellung: neue letzte Spalte vor_faelligkeitstag (Zeilen mit faellig_am > tag); aufgaben und
--   am_faelligkeitstag unverändert.
begin;
create extension if not exists pgtap with schema extensions;
-- Die Datenbank läuft in UTC wie in Supabase; alle Zeitpunkte stehen ausdrücklich in Europe/Zurich.
set local timezone to 'UTC';
select plan(10);

-- ---------------------------------------------------------------------
-- Hilfsfunktionen
-- ---------------------------------------------------------------------

-- Fixture ausführen, Abfrage lesen, alles zurückrollen (wie 05_auswertung.test.sql)
create function pg_temp.isoliert(fixture text, abfrage text) returns text language plpgsql as $$
declare
  ergebnis text;
begin
  begin
    execute fixture;
    execute abfrage into ergebnis;
    ergebnis := coalesce(ergebnis, '(leer)');
    raise exception using errcode = 'HV001', message = 'Fixture zurückrollen';
  exception
    when sqlstate 'HV001' then
      return ergebnis;
    when others then
      return 'Fehler ' || sqlstate || ': ' || sqlerrm;
  end;
end $$;

-- Zeile der Tagesliste
create function pg_temp.liste(tag date, schluessel text, platz uuid, faellig date) returns void language sql as $$
  insert into public.aufgabe_tagesliste (tag, aufgabe_schluessel, typ, platz_id, faellig_am, app_version)
  values (tag, schluessel, split_part(schluessel, '|', 1), platz, faellig, 'pgtap');
$$;

-- Erledigung über eine Messung mit aufgabe_schluessel (nicht nacherfasst)
create function pg_temp.erledigt(platz uuid, schluessel text, gilt timestamptz) returns void language sql as $$
  insert into public.messung (client_id, platz_id, messgeraet_id, messart, ec, schnappschuss, aufgabe_schluessel,
                              gilt_ab, erfasst_am, app_version)
  values (gen_random_uuid(), platz, '19000000-0000-4000-8000-000000000201', 'aufgabe', 1.2, '{"betriebsart":"dwc"}',
          schluessel, gilt, gilt, 'pgtap');
$$;

-- Zählung der Termintreue als Text «tag faellig erledigt, …»
create function pg_temp.termintreue() returns text language sql as $$
  select string_agg(tag || ' ' || faellig || ' ' || erledigt_bis_folgetag, ', ' order by tag) from public.v_termintreue
$$;

-- ---------------------------------------------------------------------
-- Gemeinsame Fixtures: Anlage TT (echt), TX (demo), Messgerät, Fenster testbetrieb
-- ---------------------------------------------------------------------

insert into public.auswertung_fenster (name, von, bis, app_version)
  values ('testbetrieb', '2027-01-07 00:00 Europe/Zurich', '2027-04-01 00:00 Europe/Zurich', 'pgtap')
  on conflict (name) do nothing;
insert into public.messgeraet (id, modell, app_version) values ('19000000-0000-4000-8000-000000000201', 'Testgeraet', 'pgtap');
insert into public.anlage (id, name, kuerzel, datenart, app_version) values
  ('19000000-0000-4000-8000-000000000301', 'Testregal', 'TT', 'echt', 'pgtap'),
  ('19000000-0000-4000-8000-000000000302', 'Demo', 'TX', 'demo', 'pgtap');
-- …311 TT-1.1, …312 TT-1.2, …321 TX-1.1
insert into public.platz (id, anlage_id, kennung, rolle, app_version) values
  ('19000000-0000-4000-8000-000000000311', '19000000-0000-4000-8000-000000000301', '1.1', 'gefaess', 'pgtap'),
  ('19000000-0000-4000-8000-000000000312', '19000000-0000-4000-8000-000000000301', '1.2', 'gefaess', 'pgtap'),
  ('19000000-0000-4000-8000-000000000321', '19000000-0000-4000-8000-000000000302', '1.1', 'gefaess', 'pgtap');

-- ---------------------------------------------------------------------
-- R5.6-AK9 v_termintreue zählt jeden Schlüssel einmal (Konzept 8.6, A3)
-- ---------------------------------------------------------------------

select is(pg_temp.isoliert($f$
  -- ein Schlüssel an drei Tagen (fällig 14.1.), nicht erledigt; Demo-Schlüssel an zwei Tagen zählt nicht
  select pg_temp.liste('2027-01-13', 'loesung_wechseln|pgtap-311|2027-01-14', '19000000-0000-4000-8000-000000000311', '2027-01-14');
  select pg_temp.liste('2027-01-14', 'loesung_wechseln|pgtap-311|2027-01-14', '19000000-0000-4000-8000-000000000311', '2027-01-14');
  select pg_temp.liste('2027-01-15', 'loesung_wechseln|pgtap-311|2027-01-14', '19000000-0000-4000-8000-000000000311', '2027-01-14');
  select pg_temp.liste('2027-01-13', 'loesung_wechseln|pgtap-321|2027-01-14', '19000000-0000-4000-8000-000000000321', '2027-01-14');
  select pg_temp.liste('2027-01-14', 'loesung_wechseln|pgtap-321|2027-01-14', '19000000-0000-4000-8000-000000000321', '2027-01-14');
  $f$,
  $q$select pg_temp.termintreue()$q$),
  '2027-01-13 1 0',
  'R5.6-AK9 Schlüssel an drei Tagen zählt einmal am frühesten Tag; Demo-Platz zählt nicht');

select is(pg_temp.isoliert($f$
  -- nach R5.6 am Mi 13.1. vorgezogen (fällig 14.1.), am 13.1. erledigt; steht zusätzlich am Fälligkeitstag in der Liste
  select pg_temp.liste('2027-01-13', 'loesung_wechseln|pgtap-311|2027-01-14', '19000000-0000-4000-8000-000000000311', '2027-01-14');
  select pg_temp.liste('2027-01-14', 'loesung_wechseln|pgtap-311|2027-01-14', '19000000-0000-4000-8000-000000000311', '2027-01-14');
  insert into public.naehrloesungsansatz (client_id, platz_id, typ, status, begonnen_am, volumen_l, aufgabe_schluessel,
                                          gilt_ab, erfasst_am, app_version)
  values (gen_random_uuid(), '19000000-0000-4000-8000-000000000311', 'neuansatz', 'abgeschlossen',
          '2027-01-13 18:00 Europe/Zurich', 9, 'loesung_wechseln|pgtap-311|2027-01-14',
          '2027-01-13 18:00 Europe/Zurich', '2027-01-13 18:00 Europe/Zurich', 'pgtap');
  $f$,
  $q$select pg_temp.termintreue()$q$),
  '2027-01-13 1 1',
  'R5.6-AK9 vorgezogen und vor fällig erledigt zählt als erledigt (einmal, am 13.1.)');

select is(pg_temp.isoliert($f$
  -- …311 fällig 14.1., gelistet 14.1. und 15.1., erledigt 15.1. 23:30 (fällig + 1) → erledigt
  -- …312 fällig 14.1., gelistet 14.1., erledigt 16.1. 00:10 → nicht erledigt
  select pg_temp.liste('2027-01-14', 'messen|pgtap-311|2027-01-14', '19000000-0000-4000-8000-000000000311', '2027-01-14');
  select pg_temp.liste('2027-01-15', 'messen|pgtap-311|2027-01-14', '19000000-0000-4000-8000-000000000311', '2027-01-14');
  select pg_temp.liste('2027-01-14', 'messen|pgtap-312|2027-01-14', '19000000-0000-4000-8000-000000000312', '2027-01-14');
  select pg_temp.erledigt('19000000-0000-4000-8000-000000000311', 'messen|pgtap-311|2027-01-14', '2027-01-15 23:30 Europe/Zurich');
  select pg_temp.erledigt('19000000-0000-4000-8000-000000000312', 'messen|pgtap-312|2027-01-14', '2027-01-16 00:10 Europe/Zurich');
  $f$,
  $q$select pg_temp.termintreue()$q$),
  '2027-01-14 2 1',
  'R5.6-AK9 erledigt bis fällig + 1, nicht danach; Schlüssel am Folgetag nicht ein zweites Mal');

select is(pg_temp.isoliert($f$
  -- gelistet am 6.1. (vor dem Fenster) und am 8.1. → zählt im Fenster einmal, am 8.1.
  select pg_temp.liste('2027-01-06', 'gefaess_pruefen|pgtap-311|2027-01-06', '19000000-0000-4000-8000-000000000311', '2027-01-06');
  select pg_temp.liste('2027-01-08', 'gefaess_pruefen|pgtap-311|2027-01-06', '19000000-0000-4000-8000-000000000311', '2027-01-06');
  select pg_temp.liste('2027-01-09', 'gefaess_pruefen|pgtap-311|2027-01-06', '19000000-0000-4000-8000-000000000311', '2027-01-06');
  $f$,
  $q$select pg_temp.termintreue()$q$),
  '2027-01-08 1 0',
  'R5.6-AK9 vor dem Fenster gelistet zählt im Fenster einmal');

select ok(coalesce(obj_description('public.v_termintreue'::regclass, 'pg_class') ~ '^Messplan Termintreue: '
                   and (select count(*) from regexp_matches(obj_description('public.v_termintreue'::regclass, 'pg_class'),
                                                            'Messplan ', 'g')) = 1
                   and strpos(obj_description('public.v_termintreue'::regclass, 'pg_class'), 'je Schlüssel einmal') > 0,
                   false),
          'R5.6-AK9 Kommentar bleibt Messplan Termintreue und nennt «je Schlüssel einmal»');

select is(
  (select string_agg(a.attname || ' ' || format_type(a.atttypid, a.atttypmod), ', ' order by a.attnum)
     from pg_attribute a
    where a.attrelid = 'public.v_termintreue'::regclass and a.attnum > 0 and not a.attisdropped),
  'tag date, faellig bigint, erledigt_bis_folgetag bigint',
  'R5.6-AK9 Spalten von v_termintreue unverändert in Name, Typ und Reihenfolge');

-- ---------------------------------------------------------------------
-- R5.6-AK11 v_push_zustellung zählt vorgezogene Zeilen (EK5, A4)
-- ---------------------------------------------------------------------

select is(pg_temp.isoliert($f$
  select pg_temp.liste('2027-01-20', 'loesung_wechseln|pgtap-311|2027-01-21', '19000000-0000-4000-8000-000000000311', '2027-01-21');
  $f$,
  $q$select aufgaben || ',' || am_faelligkeitstag || ',' || vor_faelligkeitstag
       from public.v_push_zustellung where datum_lokal = '2027-01-20'$q$),
  '1,0,1',
  'R5.6-AK11 v_push_zustellung zählt vorgezogene Zeilen in vor_faelligkeitstag');

select is(pg_temp.isoliert($f$
  -- vorgezogen (fällig 21.1.), am Fälligkeitstag (20.1.) und überfällig (18.1.)
  select pg_temp.liste('2027-01-20', 'loesung_wechseln|pgtap-311|2027-01-21', '19000000-0000-4000-8000-000000000311', '2027-01-21');
  select pg_temp.liste('2027-01-20', 'kurzpruefung|pgtap-311|2027-01-20', '19000000-0000-4000-8000-000000000311', '2027-01-20');
  select pg_temp.liste('2027-01-20', 'gefaess_pruefen|pgtap-312|2027-01-18', '19000000-0000-4000-8000-000000000312', '2027-01-18');
  $f$,
  $q$select aufgaben || ',' || am_faelligkeitstag || ',' || vor_faelligkeitstag
       from public.v_push_zustellung where datum_lokal = '2027-01-20'$q$),
  '3,1,1',
  'R5.6-AK11 v_push_zustellung: aufgaben und am_faelligkeitstag unverändert, überfällige Zeile nicht vorgezogen');

select is(
  (select a.attname::text
     from pg_attribute a
    where a.attrelid = 'public.v_push_zustellung'::regclass and a.attnum > 0 and not a.attisdropped
    order by a.attnum desc limit 1),
  'vor_faelligkeitstag',
  'R5.6-AK11 vor_faelligkeitstag ist die letzte Spalte von v_push_zustellung');

select ok(coalesce(obj_description('public.v_push_zustellung'::regclass, 'pg_class') !~ '^Messplan ', false),
          'R5.6-AK11 Kommentar von v_push_zustellung beginnt nicht mit «Messplan » (C4-AK1)');

select * from finish();
rollback;
