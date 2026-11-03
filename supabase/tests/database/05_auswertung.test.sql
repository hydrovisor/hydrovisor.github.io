-- 05_auswertung.test.sql · Auswertungssichten C4-AK1 und C4-AK3
-- (Use Cases F4 C4; Konzept 8.3, 8.6, 8.1 Regel 7; Plan 9 Ä3, Ä4, A10; smoke3.sql C12, C13)
-- «Auswertungssicht» = die elf Sichten aus Konzept 8.3 (A10). Jede Sicht erhält ihre eigenen Fixtures in
-- einem Unterblock, der nach der Abfrage zurückgerollt wird, damit sich die Sichten nicht gegenseitig zählen.
-- Fixture je Sicht: echt im Fenster, echt am 6.1.2027 23:59, echt am 1.4.2027 00:00, Demo im Fenster.
begin;
create extension if not exists pgtap with schema extensions;
-- Die Datenbank läuft in UTC wie in Supabase; alle Zeitpunkte stehen ausdrücklich in Europe/Zurich.
set local timezone to 'UTC';
select plan(39);

-- ---------------------------------------------------------------------
-- Hilfsfunktion: Fixture ausführen, Abfrage lesen, alles zurückrollen
-- ---------------------------------------------------------------------

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

-- ---------------------------------------------------------------------
-- Gemeinsame Fixtures als postgres: Anlage R (echt), XP (demo), Fenster testbetrieb
-- ---------------------------------------------------------------------

insert into public.auswertung_fenster (name, von, bis, app_version)
  values ('testbetrieb', '2027-01-07 00:00 Europe/Zurich', '2027-04-01 00:00 Europe/Zurich', 'pgtap')
  on conflict (name) do nothing;
insert into public.quelle (quelle_id, titel, link, klasse, anbaumethode, app_version)
  values ('pgtap-q1', 'Testquelle', 'https://example.invalid/q1', 'peer_review', 'dwc', 'pgtap');
insert into public.art_schluessel (art_id) values ('pgtap_art_a');
insert into public.kulturgruppe (kulturgruppe_id, name, leitkultur_art_id, ec_obergrenze_validator, app_version)
  values ('pgtap_kg', 'Testgruppe', 'pgtap_art_a', 2.0, 'pgtap');
insert into public.art (art_id, name_de, name_wiss, kulturgruppe_id, quelldatei, zeile_id, commit, app_version)
  values ('pgtap_art_a', 'Testart A', 'Testus primus', 'pgtap_kg', 'art.csv', 'art.pgtap_art_a', 'pgtap', 'pgtap');
insert into public.sorte_schluessel (id, sorte_key) values ('f5000000-0000-4000-8000-000000000101', 'pgtap-sorte-a');
insert into public.sorte (sorte_id, name, art_id, kulturtyp, quelldatei, zeile_id, commit, app_version)
  values ('f5000000-0000-4000-8000-000000000101', 'Testsorte A', 'pgtap_art_a', 'blatt', 'sorten.csv', 'pgtap-sorte-a', 'pgtap', 'pgtap');
insert into public.messgeraet (id, modell, app_version) values ('f5000000-0000-4000-8000-000000000201', 'Testgeraet', 'pgtap');
insert into public.anlage (id, name, kuerzel, datenart, app_version) values
  ('f5000000-0000-4000-8000-000000000301', 'Testregal', 'R', 'echt', 'pgtap'),
  ('f5000000-0000-4000-8000-000000000302', 'Demo', 'XP', 'demo', 'pgtap');
-- …311 R-2.3, …312 R-A1, …321 XP-2.3, …322 XP-A1
insert into public.platz (id, anlage_id, kennung, rolle, app_version) values
  ('f5000000-0000-4000-8000-000000000311', 'f5000000-0000-4000-8000-000000000301', '2.3', 'gefaess', 'pgtap'),
  ('f5000000-0000-4000-8000-000000000312', 'f5000000-0000-4000-8000-000000000301', 'A1', 'anzuchtort', 'pgtap'),
  ('f5000000-0000-4000-8000-000000000321', 'f5000000-0000-4000-8000-000000000302', '2.3', 'gefaess', 'pgtap'),
  ('f5000000-0000-4000-8000-000000000322', 'f5000000-0000-4000-8000-000000000302', 'A1', 'anzuchtort', 'pgtap');

-- Messung am Platz (Hilfsfunktion für die Fixtures)
create function pg_temp.messung(platz uuid, gilt timestamptz, messart public.messart, ec numeric, temperatur numeric,
                                dauer_s integer, bewertung_ph public.bewertung) returns uuid language sql as $$
  insert into public.messung (client_id, platz_id, messgeraet_id, messart, ec, temperatur, erfassungsdauer_s, bewertung_ph,
                              schnappschuss, gilt_ab, app_version)
  values (gen_random_uuid(), platz, 'f5000000-0000-4000-8000-000000000201', messart, ec, temperatur, dauer_s, bewertung_ph,
          '{"betriebsart":"dwc"}', gilt, 'pgtap')
  returning id
$$;
-- Satz mit einer Pflanzung am Anzuchtort (Hilfsfunktion für die Fixtures)
create function pg_temp.satz(satz uuid, pflanzung uuid, platz uuid, saatdatum date, gilt timestamptz) returns void language sql as $$
  insert into public.satz (id, client_id, sorte_id, kulturform, anzuchtort_platz_id, anzahl_schwaemme, samen_je_schwamm,
                           schwaemme_vorschlag, samen_vorschlag, saatdatum, gilt_ab, app_version)
  values (satz, gen_random_uuid(), 'f5000000-0000-4000-8000-000000000101', 'schnitt', platz, 2, 1, 3, 1, saatdatum, gilt, 'pgtap');
  insert into public.pflanzung (id, client_id, satz_id, einstufung, gilt_ab, app_version)
  values (pflanzung, gen_random_uuid(), satz, 'nicht_empfohlen', gilt, 'pgtap');
$$;

-- ---------------------------------------------------------------------
-- C4-AK1 Jede Auswertungssicht beantwortet genau eine Frage des Messplans (Ä3: Kommentar «Messplan <Frage>: …»)
-- ---------------------------------------------------------------------

create temp table auswertungssicht (sicht text primary key, frage text not null);
insert into auswertungssicht values
  ('v_termintreue', 'Termintreue'), ('v_ek6_messdauer', 'EK6'), ('v_sollbereichsquote', 'Sollbereichsquote'),
  ('v_rechnerguete', 'Rechnergüte'), ('v_phasenprognose', 'Phasenprognose'), ('v_keimdauer', 'Phasenprognose'),
  ('v_ki_guete', 'KI-Güte( UC4)?'), ('v_uebersteuerungen', 'Übersteuerungen'), ('v_etikett_scans', 'Etiketten'),
  ('v_klima', 'Klima'), ('v_pflegezeit', 'Pflegezeit');

create function pg_temp.messplan_je_sicht() returns setof text language plpgsql as $$
declare
  r record;
  kommentar text;
begin
  for r in select * from auswertungssicht order by sicht loop
    kommentar := obj_description(to_regclass('public.' || r.sicht), 'pg_class');
    return next ok(coalesce(kommentar ~ ('^Messplan ' || r.frage || ': ')
                            and (select count(*) from regexp_matches(kommentar, 'Messplan ', 'g')) = 1, false),
                   'C4-AK1 ' || r.sicht || ' nennt genau eine Frage des Messplans (' || replace(r.frage, '( UC4)?', '') || ')');
  end loop;
end $$;
select * from pg_temp.messplan_je_sicht();

select is(
  (select coalesce(string_agg(c.relname, ', ' order by c.relname), '')
     from pg_class c
    where c.relnamespace = 'public'::regnamespace and c.relkind = 'v'
      and obj_description(c.oid, 'pg_class') ~ '^Messplan '
      and c.relname not in (select sicht from auswertungssicht)),
  '', 'C4-AK1 jede Sicht mit Messplan-Kommentar gehört zur Liste aus 8.3');
select ok(coalesce(obj_description('public.v_auswertung_platz'::regclass, 'pg_class') ~ '^Hilfssicht', false),
          'C4-AK1 v_auswertung_platz ist als Hilfssicht kommentiert, nicht als Auswertung');

-- smoke3 C12/C13: Pflegezeit löst die Anlage über Satz, Pflanzung, Netztopf und daten.datenart auf
select is(pg_temp.isoliert($f$
  select pg_temp.satz('f5000000-0000-4000-8000-000000000501', 'f5000000-0000-4000-8000-000000000511',
                      'f5000000-0000-4000-8000-000000000312', '2027-01-08', '2027-01-08 09:00 Europe/Zurich');
  insert into public.netztopf (id, anlage_id, kennung, groesse_mm, heim_platz_id, heim_loch_nr, app_version)
    values ('f5000000-0000-4000-8000-000000000521', 'f5000000-0000-4000-8000-000000000301', '2.3.1', 80,
            'f5000000-0000-4000-8000-000000000311', 1, 'pgtap');
  insert into public.ereignis (client_id, typ, satz_id, pflanzung_id, netztopf_id, messgeraet_id, daten, dauer_s, gilt_ab, app_version)
  values
    (gen_random_uuid(), 'beobachtung', 'f5000000-0000-4000-8000-000000000501', null, null, null, '{"kategorie":"sonstiges"}', 60, '2027-01-10 10:00 Europe/Zurich', 'pgtap'),
    (gen_random_uuid(), 'beobachtung', null, 'f5000000-0000-4000-8000-000000000511', null, null, '{"kategorie":"sonstiges"}', 60, '2027-01-10 10:00 Europe/Zurich', 'pgtap'),
    (gen_random_uuid(), 'verschieben', null, null, 'f5000000-0000-4000-8000-000000000521', null, '{}', 60, '2027-01-10 10:00 Europe/Zurich', 'pgtap'),
    (gen_random_uuid(), 'sonde_gereinigt', null, null, null, 'f5000000-0000-4000-8000-000000000201', '{"datenart":"echt"}', 60, '2027-01-10 10:00 Europe/Zurich', 'pgtap'),
    (gen_random_uuid(), 'sonde_gereinigt', null, null, null, 'f5000000-0000-4000-8000-000000000201', '{"datenart":"demo"}', 60, '2027-01-10 10:00 Europe/Zurich', 'pgtap'),
    (gen_random_uuid(), 'beobachtung', 'f5000000-0000-4000-8000-000000000501', null, null, null, '{"kategorie":"sonstiges"}', 60, '2027-03-31 23:59 Europe/Zurich', 'pgtap'),
    (gen_random_uuid(), 'beobachtung', 'f5000000-0000-4000-8000-000000000501', null, null, null, '{"kategorie":"sonstiges"}', 60, '2027-04-01 00:00 Europe/Zurich', 'pgtap');
  $f$,
  $q$select string_agg(woche::date || ' ' || round(stunden * 3600), ', ' order by woche) from public.v_pflegezeit$q$),
  '2027-01-04 240, 2027-03-29 60',
  'C4-AK1 smoke3 C12 Pflegezeit löst die Anlage über Satz, Pflanzung, Netztopf und Datenart auf; 31.3. 23:59 ja, 1.4. 00:00 nein');

-- ---------------------------------------------------------------------
-- C4-AK3 Jede Auswertungssicht zählt nur echt im Fenster testbetrieb (halboffen [7.1. 00:00, 1.4. 00:00))
-- ---------------------------------------------------------------------

select is(pg_temp.isoliert($f$
  insert into public.aufgabe_tagesliste (tag, aufgabe_schluessel, typ, platz_id, faellig_am, app_version) values
    ('2027-01-06', 'pgtap|vor', 'messen', 'f5000000-0000-4000-8000-000000000311', '2027-01-06', 'pgtap'),
    ('2027-02-10', 'pgtap|im', 'messen', 'f5000000-0000-4000-8000-000000000311', '2027-02-10', 'pgtap'),
    ('2027-04-01', 'pgtap|nach', 'messen', 'f5000000-0000-4000-8000-000000000311', '2027-04-01', 'pgtap'),
    ('2027-02-10', 'pgtap|demo', 'messen', 'f5000000-0000-4000-8000-000000000321', '2027-02-10', 'pgtap');
  $f$,
  $q$select string_agg(tag || ' ' || faellig, ', ' order by tag) from public.v_termintreue$q$),
  '2027-02-10 1', 'C4-AK3 v_termintreue zählt echt im Fenster, nicht demo, nicht vor 7.1., nicht ab 1.4. 00:00');

select is(pg_temp.isoliert($f$
  insert into public.aufgabe_tagesliste (tag, aufgabe_schluessel, typ, platz_id, faellig_am, app_version) values
    ('2027-01-06', 'pgtap|0106', 'eigene', null, '2027-01-06', 'pgtap'),
    ('2027-01-07', 'pgtap|0107', 'eigene', null, '2027-01-07', 'pgtap'),
    ('2027-03-31', 'pgtap|0331', 'eigene', null, '2027-03-31', 'pgtap'),
    ('2027-04-01', 'pgtap|0401', 'eigene', null, '2027-04-01', 'pgtap');
  $f$,
  $q$select string_agg(tag::text, ',' order by tag) from public.v_termintreue$q$),
  '2027-01-07,2027-03-31', 'C4-AK3 smoke3 C13 Termintreue: Tage 7.1. bis 31.3., ohne den Tag 1.4.');

select is(pg_temp.isoliert($f$
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-01-07 08:00 Europe/Zurich', 'aufgabe', 1.2, null, 10, null);
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-01-06 23:59 Europe/Zurich', 'aufgabe', 1.2, null, 90, null);
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-04-01 00:00 Europe/Zurich', 'aufgabe', 1.2, null, 70, null);
  select pg_temp.messung('f5000000-0000-4000-8000-000000000321', '2027-01-07 09:00 Europe/Zurich', 'aufgabe', 1.2, null, 50, null);
  $f$,
  $q$select string_agg(woche::date || ' ' || anzahl || ' ' || median_s, ', ' order by woche) from public.v_ek6_messdauer$q$),
  '2027-01-04 1 10', 'C4-AK3 v_ek6_messdauer zählt echt im Fenster, nicht demo, nicht vor 7.1., nicht ab 1.4. 00:00');

select is(pg_temp.isoliert($f$
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-02-10 10:00 Europe/Zurich', 'aufgabe', 1.2, null, null, 'gruen');
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-01-06 23:59 Europe/Zurich', 'aufgabe', 1.2, null, null, 'knapp');
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-04-01 00:00 Europe/Zurich', 'aufgabe', 1.2, null, null, 'ausserhalb');
  select pg_temp.messung('f5000000-0000-4000-8000-000000000321', '2027-02-10 10:00 Europe/Zurich', 'aufgabe', 1.2, null, null, 'gruen');
  $f$,
  $q$select string_agg(betriebsart || ' ' || messgroesse || ' ' || bewertung || ' ' || anzahl, ', ' order by bewertung)
       from public.v_sollbereichsquote$q$),
  'dwc ph gruen 1', 'C4-AK3 v_sollbereichsquote zählt echt im Fenster, nicht demo, nicht vor 7.1., nicht ab 1.4. 00:00');

select is(pg_temp.isoliert($f$
  insert into public.naehrloesungsansatz (client_id, platz_id, typ, begonnen_am, stadium_vorschlag, ec_erwartet_final, volumen_l,
                                          endmessung_id, gilt_ab, app_version)
  select gen_random_uuid(), x.platz, 'neuansatz', x.gilt, 'wachstum', 1.20, 9,
         pg_temp.messung(x.platz, x.gilt + interval '30 minutes', 'end_ansatz', x.ec, null, null, null), x.gilt, 'pgtap'
    from (values ('f5000000-0000-4000-8000-000000000311'::uuid, '2027-02-10 10:00 Europe/Zurich'::timestamptz, 1.25),
                 ('f5000000-0000-4000-8000-000000000311', '2027-01-06 23:59 Europe/Zurich', 1.50),
                 ('f5000000-0000-4000-8000-000000000311', '2027-04-01 00:00 Europe/Zurich', 1.60),
                 ('f5000000-0000-4000-8000-000000000321', '2027-02-10 10:00 Europe/Zurich', 1.70)) x(platz, gilt, ec);
  $f$,
  $q$select string_agg(stadium || ' ' || ansaetze || ' ' || round(mittel_abweichung, 2), ', ' order by stadium)
       from public.v_rechnerguete$q$),
  'wachstum 1 0.05', 'C4-AK3 v_rechnerguete zählt echt im Fenster, nicht demo, nicht vor 7.1., nicht ab 1.4. 00:00');

select is(pg_temp.isoliert($f$
  select pg_temp.satz('f5000000-0000-4000-8000-000000000501', 'f5000000-0000-4000-8000-000000000511',
                      'f5000000-0000-4000-8000-000000000312', '2027-01-01', '2027-01-01 09:00 Europe/Zurich');
  select pg_temp.satz('f5000000-0000-4000-8000-000000000502', 'f5000000-0000-4000-8000-000000000512',
                      'f5000000-0000-4000-8000-000000000322', '2027-01-01', '2027-01-01 09:00 Europe/Zurich');
  insert into public.ereignis (client_id, typ, satz_id, daten, gilt_ab, app_version) values
    (gen_random_uuid(), 'phase_antwort', 'f5000000-0000-4000-8000-000000000501',
     '{"phase":"anzucht","antwort":"ja","erwartet_am":"2027-02-08"}', '2027-02-10 10:00 Europe/Zurich', 'pgtap'),
    (gen_random_uuid(), 'phase_antwort', 'f5000000-0000-4000-8000-000000000501',
     '{"phase":"anzucht","antwort":"ja","erwartet_am":"2027-01-01"}', '2027-01-06 23:59 Europe/Zurich', 'pgtap'),
    (gen_random_uuid(), 'phase_antwort', 'f5000000-0000-4000-8000-000000000501',
     '{"phase":"anzucht","antwort":"ja","erwartet_am":"2027-03-28"}', '2027-04-01 00:00 Europe/Zurich', 'pgtap'),
    (gen_random_uuid(), 'phase_antwort', 'f5000000-0000-4000-8000-000000000502',
     '{"phase":"anzucht","antwort":"ja","erwartet_am":"2027-02-01"}', '2027-02-10 10:00 Europe/Zurich', 'pgtap');
  $f$,
  $q$select string_agg(phase || ' ' || abweichung_tage, ', ' order by abweichung_tage) from public.v_phasenprognose$q$),
  'anzucht 2', 'C4-AK3 v_phasenprognose zählt echt im Fenster, nicht demo, nicht vor 7.1., nicht ab 1.4. 00:00');

select is(pg_temp.isoliert($f$
  select pg_temp.satz('f5000000-0000-4000-8000-000000000501', 'f5000000-0000-4000-8000-000000000511',
                      'f5000000-0000-4000-8000-000000000312', '2027-01-01', '2027-01-01 09:00 Europe/Zurich');
  select pg_temp.satz('f5000000-0000-4000-8000-000000000502', 'f5000000-0000-4000-8000-000000000512',
                      'f5000000-0000-4000-8000-000000000322', '2027-01-02', '2027-01-02 09:00 Europe/Zurich');
  insert into public.ereignis (client_id, typ, pflanzung_id, daten, gilt_ab, app_version) values
    (gen_random_uuid(), 'keimung', 'f5000000-0000-4000-8000-000000000511', '{"samen_gesaet":1,"samen_gekeimt":1}',
     '2027-02-10 10:00 Europe/Zurich', 'pgtap'),
    (gen_random_uuid(), 'keimung', 'f5000000-0000-4000-8000-000000000511', '{"samen_gesaet":1,"samen_gekeimt":1}',
     '2027-01-06 23:59 Europe/Zurich', 'pgtap'),
    (gen_random_uuid(), 'keimung', 'f5000000-0000-4000-8000-000000000511', '{"samen_gesaet":1,"samen_gekeimt":1}',
     '2027-04-01 00:00 Europe/Zurich', 'pgtap'),
    (gen_random_uuid(), 'keimung', 'f5000000-0000-4000-8000-000000000512', '{"samen_gesaet":1,"samen_gekeimt":1}',
     '2027-02-10 10:00 Europe/Zurich', 'pgtap');
  $f$,
  $q$select string_agg(keimdauer_bis_d::text, ', ' order by keimdauer_bis_d) from public.v_keimdauer$q$),
  '40', 'C4-AK3 v_keimdauer zählt echt im Fenster, nicht demo, nicht vor 7.1., nicht ab 1.4. 00:00');

-- Ä4: ki_feldprotokoll.datenart, Filter in v_ki_guete
select is(pg_temp.isoliert($f$
  insert into public.ki_feldprotokoll (client_id, sorte_id, feld, status, bewertung_eval, modell, datenart, erfasst_am, app_version) values
    (gen_random_uuid(), 'f5000000-0000-4000-8000-000000000101', 'name', 'uebernommen', 'richtig', 'testmodell', 'echt',
     '2027-02-10 10:00 Europe/Zurich', 'pgtap'),
    (gen_random_uuid(), 'f5000000-0000-4000-8000-000000000101', 'name', 'uebernommen', 'falsch', 'testmodell', 'echt',
     '2027-01-06 23:59 Europe/Zurich', 'pgtap'),
    (gen_random_uuid(), 'f5000000-0000-4000-8000-000000000101', 'name', 'uebernommen', 'fehlend', 'testmodell', 'echt',
     '2027-04-01 00:00 Europe/Zurich', 'pgtap'),
    (gen_random_uuid(), 'f5000000-0000-4000-8000-000000000101', 'name', 'uebernommen', 'erfunden', 'testmodell', 'demo',
     '2027-02-10 10:00 Europe/Zurich', 'pgtap');
  $f$,
  $q$select string_agg(feld || ' ' || bewertung_eval || ' ' || anzahl, ', ' order by bewertung_eval) from public.v_ki_guete$q$),
  'name richtig 1', 'C4-AK3 Ä4 v_ki_guete zählt echt im Fenster, nicht demo, nicht vor 7.1., nicht ab 1.4. 00:00');

select is(pg_temp.isoliert($f$
  insert into public.naehrloesungsansatz (client_id, platz_id, typ, begonnen_am, stadium_vorschlag, stadium_gewaehlt,
                                          ziel_ec_vorschlag, ziel_ec_gewaehlt, mischentscheid, k_uebernommen, volumen_l, gilt_ab, app_version)
  select gen_random_uuid(), x.platz, 'neuansatz', x.gilt, 'wachstum', 'vorbluete', 1.2, 1.3, 'leitkultur', true, 9, x.gilt, 'pgtap'
    from (values ('f5000000-0000-4000-8000-000000000311'::uuid, '2027-02-10 10:00 Europe/Zurich'::timestamptz),
                 ('f5000000-0000-4000-8000-000000000311', '2027-01-06 23:59 Europe/Zurich'),
                 ('f5000000-0000-4000-8000-000000000311', '2027-04-01 00:00 Europe/Zurich'),
                 ('f5000000-0000-4000-8000-000000000321', '2027-02-10 10:00 Europe/Zurich')) x(platz, gilt);
  select pg_temp.satz('f5000000-0000-4000-8000-000000000501', 'f5000000-0000-4000-8000-000000000511',
                      'f5000000-0000-4000-8000-000000000312', '2027-02-10', '2027-02-10 10:00 Europe/Zurich');
  select pg_temp.satz('f5000000-0000-4000-8000-000000000502', 'f5000000-0000-4000-8000-000000000512',
                      'f5000000-0000-4000-8000-000000000312', '2027-01-06', '2027-01-06 23:59 Europe/Zurich');
  select pg_temp.satz('f5000000-0000-4000-8000-000000000503', 'f5000000-0000-4000-8000-000000000513',
                      'f5000000-0000-4000-8000-000000000312', '2027-04-01', '2027-04-01 00:00 Europe/Zurich');
  select pg_temp.satz('f5000000-0000-4000-8000-000000000504', 'f5000000-0000-4000-8000-000000000514',
                      'f5000000-0000-4000-8000-000000000322', '2027-02-10', '2027-02-10 10:00 Europe/Zurich');
  $f$,
  $q$select string_agg(art || ' ' || anzahl, ', ' order by art) from public.v_uebersteuerungen where anzahl > 0$q$),
  'k_uebernommen 1, mischentscheid 1, nicht_empfohlen_gewaehlt 1, schwaemme_oder_samen 1, stadium 1, ziel_ec 1',
  'C4-AK3 v_uebersteuerungen zählt echt im Fenster, nicht demo, nicht vor 7.1., nicht ab 1.4. 00:00');

-- Ä4: Zweig ki_feld_korrigiert von v_uebersteuerungen nur echt
select is(pg_temp.isoliert($f$
  insert into public.ki_feldprotokoll (client_id, sorte_id, feld, status, modell, datenart, erfasst_am, app_version) values
    (gen_random_uuid(), 'f5000000-0000-4000-8000-000000000101', 'name', 'geaendert', 'testmodell', 'echt',
     '2027-02-10 10:00 Europe/Zurich', 'pgtap'),
    (gen_random_uuid(), 'f5000000-0000-4000-8000-000000000101', 'name', 'geaendert', 'testmodell', 'echt',
     '2027-01-06 23:59 Europe/Zurich', 'pgtap'),
    (gen_random_uuid(), 'f5000000-0000-4000-8000-000000000101', 'name', 'geaendert', 'testmodell', 'echt',
     '2027-04-01 00:00 Europe/Zurich', 'pgtap'),
    (gen_random_uuid(), 'f5000000-0000-4000-8000-000000000101', 'name', 'geaendert', 'testmodell', 'demo',
     '2027-02-10 10:00 Europe/Zurich', 'pgtap');
  $f$,
  $q$select string_agg(art || ' ' || anzahl, ', ' order by art) from public.v_uebersteuerungen where anzahl > 0$q$),
  'ki_feld_korrigiert 1', 'C4-AK3 Ä4 v_uebersteuerungen zählt korrigierte KI-Felder nur echt im Fenster');

select is(pg_temp.isoliert($f$
  insert into public.etikett_aufruf (code, aufgerufen_am, ergebnis, app_version) values
    ('R-2.3', '2027-01-07 10:00 Europe/Zurich', 'gefunden', 'pgtap'),
    ('R-2.3', '2027-01-06 23:59 Europe/Zurich', 'unbekannt', 'pgtap'),
    ('R-2.3', '2027-04-01 00:00 Europe/Zurich', 'entfernt', 'pgtap'),
    ('XP-2.3', '2027-01-07 10:00 Europe/Zurich', 'gefunden', 'pgtap');
  $f$,
  $q$select string_agg(woche::date || ' ' || ergebnis || ' ' || anzahl, ', ' order by woche, ergebnis) from public.v_etikett_scans$q$),
  '2027-01-04 gefunden 1', 'C4-AK3 v_etikett_scans zählt echt im Fenster, nicht demo, nicht vor 7.1., nicht ab 1.4. 00:00');

-- v_klima wertet nur 18:00 bis 21:30 Ortszeit aus; die Fensterränder liegen deshalb am Abend des 6.1. und des 1.4.
select is(pg_temp.isoliert($f$
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-02-10 19:00 Europe/Zurich', 'rundgang', 1.2, 21.5, null, null);
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-01-06 21:00 Europe/Zurich', 'rundgang', 1.2, 19.0, null, null);
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-04-01 19:00 Europe/Zurich', 'rundgang', 1.2, 23.0, null, null);
  select pg_temp.messung('f5000000-0000-4000-8000-000000000321', '2027-02-10 19:00 Europe/Zurich', 'rundgang', 1.2, 24.5, null, null);
  $f$,
  $q$select string_agg(tag || ' ' || temperatur, ', ' order by tag) from public.v_klima$q$),
  '2027-02-10 21.5', 'C4-AK3 v_klima zählt echt im Fenster, nicht demo, nicht vor 7.1., nicht ab 1.4. 00:00');

select is(pg_temp.isoliert($f$
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-01-07 10:00 Europe/Zurich', 'aufgabe', 1.2, null, 60, null);
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-01-06 23:59 Europe/Zurich', 'aufgabe', 1.2, null, 600, null);
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-04-01 00:00 Europe/Zurich', 'aufgabe', 1.2, null, 6000, null);
  select pg_temp.messung('f5000000-0000-4000-8000-000000000321', '2027-01-07 10:00 Europe/Zurich', 'aufgabe', 1.2, null, 36000, null);
  $f$,
  $q$select string_agg(woche::date || ' ' || round(stunden * 3600), ', ' order by woche) from public.v_pflegezeit$q$),
  '2027-01-04 60', 'C4-AK3 v_pflegezeit zählt echt im Fenster, nicht demo, nicht vor 7.1., nicht ab 1.4. 00:00');

-- ---------------------------------------------------------------------
-- C4-AK3 Innenseite der Fensterränder: echte Zeile genau am 7.1. 00:00 und am 31.3. 23:59 zählt
-- (v_termintreue rechnet mit Kalendertagen und ist mit C13 oben abgedeckt; v_klima mit 7.1. 18:00 und 31.3. 21:30)
-- ---------------------------------------------------------------------

select is(pg_temp.isoliert($f$
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-01-07 00:00 Europe/Zurich', 'aufgabe', 1.2, null, 10, null);
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-03-31 23:59 Europe/Zurich', 'aufgabe', 1.2, null, 20, null);
  $f$,
  $q$select string_agg(woche::date || ' ' || anzahl || ' ' || median_s, ', ' order by woche) from public.v_ek6_messdauer$q$),
  '2027-01-04 1 10, 2027-03-29 1 20', 'C4-AK3 v_ek6_messdauer zählt echt am 7.1. 00:00 und am 31.3. 23:59');

select is(pg_temp.isoliert($f$
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-01-07 00:00 Europe/Zurich', 'aufgabe', 1.2, null, null, 'gruen');
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-03-31 23:59 Europe/Zurich', 'aufgabe', 1.2, null, null, 'knapp');
  $f$,
  $q$select string_agg(betriebsart || ' ' || messgroesse || ' ' || bewertung || ' ' || anzahl, ', ' order by bewertung::text)
       from public.v_sollbereichsquote$q$),
  'dwc ph gruen 1, dwc ph knapp 1', 'C4-AK3 v_sollbereichsquote zählt echt am 7.1. 00:00 und am 31.3. 23:59');

select is(pg_temp.isoliert($f$
  insert into public.naehrloesungsansatz (client_id, platz_id, typ, begonnen_am, stadium_vorschlag, ec_erwartet_final, volumen_l,
                                          endmessung_id, gilt_ab, app_version)
  select gen_random_uuid(), 'f5000000-0000-4000-8000-000000000311', 'neuansatz', x.gilt, 'wachstum', 1.20, 9,
         pg_temp.messung('f5000000-0000-4000-8000-000000000311', x.gilt + interval '30 minutes', 'end_ansatz', x.ec, null, null, null),
         x.gilt, 'pgtap'
    from (values ('2027-01-07 00:00 Europe/Zurich'::timestamptz, 1.25), ('2027-03-31 23:59 Europe/Zurich', 1.35)) x(gilt, ec);
  $f$,
  $q$select string_agg(stadium || ' ' || ansaetze || ' ' || round(mittel_abweichung, 2), ', ' order by stadium)
       from public.v_rechnerguete$q$),
  'wachstum 2 0.10', 'C4-AK3 v_rechnerguete zählt echt am 7.1. 00:00 und am 31.3. 23:59');

select is(pg_temp.isoliert($f$
  select pg_temp.satz('f5000000-0000-4000-8000-000000000501', 'f5000000-0000-4000-8000-000000000511',
                      'f5000000-0000-4000-8000-000000000312', '2027-01-01', '2027-01-01 09:00 Europe/Zurich');
  insert into public.ereignis (client_id, typ, satz_id, daten, gilt_ab, app_version) values
    (gen_random_uuid(), 'phase_antwort', 'f5000000-0000-4000-8000-000000000501',
     '{"phase":"anzucht","antwort":"ja","erwartet_am":"2027-01-05"}', '2027-01-07 00:00 Europe/Zurich', 'pgtap'),
    (gen_random_uuid(), 'phase_antwort', 'f5000000-0000-4000-8000-000000000501',
     '{"phase":"wachstum","antwort":"ja","erwartet_am":"2027-03-28"}', '2027-03-31 23:59 Europe/Zurich', 'pgtap');
  $f$,
  $q$select string_agg(phase || ' ' || abweichung_tage, ', ' order by abweichung_tage) from public.v_phasenprognose$q$),
  'anzucht 2, wachstum 3', 'C4-AK3 v_phasenprognose zählt echt am 7.1. 00:00 und am 31.3. 23:59');

select is(pg_temp.isoliert($f$
  select pg_temp.satz('f5000000-0000-4000-8000-000000000501', 'f5000000-0000-4000-8000-000000000511',
                      'f5000000-0000-4000-8000-000000000312', '2027-01-01', '2027-01-01 09:00 Europe/Zurich');
  insert into public.ereignis (client_id, typ, pflanzung_id, daten, gilt_ab, app_version) values
    (gen_random_uuid(), 'keimung', 'f5000000-0000-4000-8000-000000000511', '{"samen_gesaet":1,"samen_gekeimt":1}',
     '2027-01-07 00:00 Europe/Zurich', 'pgtap'),
    (gen_random_uuid(), 'keimung', 'f5000000-0000-4000-8000-000000000511', '{"samen_gesaet":1,"samen_gekeimt":1}',
     '2027-03-31 23:59 Europe/Zurich', 'pgtap');
  $f$,
  $q$select string_agg(keimdauer_bis_d::text, ', ' order by keimdauer_bis_d) from public.v_keimdauer$q$),
  '6, 89', 'C4-AK3 v_keimdauer zählt echt am 7.1. 00:00 und am 31.3. 23:59');

select is(pg_temp.isoliert($f$
  insert into public.ki_feldprotokoll (client_id, sorte_id, feld, status, bewertung_eval, modell, datenart, erfasst_am, app_version) values
    (gen_random_uuid(), 'f5000000-0000-4000-8000-000000000101', 'name', 'uebernommen', 'richtig', 'testmodell', 'echt',
     '2027-01-07 00:00 Europe/Zurich', 'pgtap'),
    (gen_random_uuid(), 'f5000000-0000-4000-8000-000000000101', 'name', 'uebernommen', 'falsch', 'testmodell', 'echt',
     '2027-03-31 23:59 Europe/Zurich', 'pgtap');
  $f$,
  $q$select string_agg(feld || ' ' || bewertung_eval || ' ' || anzahl, ', ' order by bewertung_eval::text) from public.v_ki_guete$q$),
  'name falsch 1, name richtig 1', 'C4-AK3 Ä4 v_ki_guete zählt echt am 7.1. 00:00 und am 31.3. 23:59');

select is(pg_temp.isoliert($f$
  insert into public.naehrloesungsansatz (client_id, platz_id, typ, begonnen_am, stadium_vorschlag, stadium_gewaehlt,
                                          ziel_ec_vorschlag, ziel_ec_gewaehlt, mischentscheid, k_uebernommen, volumen_l, gilt_ab, app_version)
  select gen_random_uuid(), 'f5000000-0000-4000-8000-000000000311', 'neuansatz', x.gilt, 'wachstum', 'vorbluete', 1.2, 1.3,
         'leitkultur', true, 9, x.gilt, 'pgtap'
    from (values ('2027-01-07 00:00 Europe/Zurich'::timestamptz), ('2027-03-31 23:59 Europe/Zurich')) x(gilt);
  select pg_temp.satz('f5000000-0000-4000-8000-000000000501', 'f5000000-0000-4000-8000-000000000511',
                      'f5000000-0000-4000-8000-000000000312', '2027-01-07', '2027-01-07 00:00 Europe/Zurich');
  select pg_temp.satz('f5000000-0000-4000-8000-000000000502', 'f5000000-0000-4000-8000-000000000512',
                      'f5000000-0000-4000-8000-000000000312', '2027-03-31', '2027-03-31 23:59 Europe/Zurich');
  $f$,
  $q$select string_agg(art || ' ' || anzahl, ', ' order by art) from public.v_uebersteuerungen where anzahl > 0$q$),
  'k_uebernommen 2, mischentscheid 2, nicht_empfohlen_gewaehlt 2, schwaemme_oder_samen 2, stadium 2, ziel_ec 2',
  'C4-AK3 v_uebersteuerungen zählt Ansätze und Sätze echt am 7.1. 00:00 und am 31.3. 23:59');

select is(pg_temp.isoliert($f$
  insert into public.ki_feldprotokoll (client_id, sorte_id, feld, status, modell, datenart, erfasst_am, app_version) values
    (gen_random_uuid(), 'f5000000-0000-4000-8000-000000000101', 'name', 'geaendert', 'testmodell', 'echt',
     '2027-01-07 00:00 Europe/Zurich', 'pgtap'),
    (gen_random_uuid(), 'f5000000-0000-4000-8000-000000000101', 'name', 'geaendert', 'testmodell', 'echt',
     '2027-03-31 23:59 Europe/Zurich', 'pgtap');
  $f$,
  $q$select string_agg(art || ' ' || anzahl, ', ' order by art) from public.v_uebersteuerungen where anzahl > 0$q$),
  'ki_feld_korrigiert 2', 'C4-AK3 Ä4 v_uebersteuerungen zählt korrigierte KI-Felder echt am 7.1. 00:00 und am 31.3. 23:59');

select is(pg_temp.isoliert($f$
  insert into public.etikett_aufruf (code, aufgerufen_am, ergebnis, app_version) values
    ('R-2.3', '2027-01-07 00:00 Europe/Zurich', 'gefunden', 'pgtap'),
    ('R-2.3', '2027-03-31 23:59 Europe/Zurich', 'unbekannt', 'pgtap');
  $f$,
  $q$select string_agg(woche::date || ' ' || ergebnis || ' ' || anzahl, ', ' order by woche, ergebnis) from public.v_etikett_scans$q$),
  '2027-01-04 gefunden 1, 2027-03-29 unbekannt 1', 'C4-AK3 v_etikett_scans zählt echt am 7.1. 00:00 und am 31.3. 23:59');

select is(pg_temp.isoliert($f$
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-01-07 18:00 Europe/Zurich', 'rundgang', 1.2, 19.5, null, null);
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-03-31 21:30 Europe/Zurich', 'rundgang', 1.2, 22.5, null, null);
  $f$,
  $q$select string_agg(tag || ' ' || temperatur, ', ' order by tag) from public.v_klima$q$),
  '2027-01-07 19.5, 2027-03-31 22.5', 'C4-AK3 v_klima zählt echt am 7.1. 18:00 und am 31.3. 21:30');

select is(pg_temp.isoliert($f$
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-01-07 00:00 Europe/Zurich', 'aufgabe', 1.2, null, 60, null);
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-03-31 23:59 Europe/Zurich', 'aufgabe', 1.2, null, 120, null);
  $f$,
  $q$select string_agg(woche::date || ' ' || round(stunden * 3600), ', ' order by woche) from public.v_pflegezeit$q$),
  '2027-01-04 60, 2027-03-29 120', 'C4-AK3 v_pflegezeit zählt echt am 7.1. 00:00 und am 31.3. 23:59');

-- ---------------------------------------------------------------------
-- C4-AK1 v_klima: nur 18:00 bis 21:30 Ortszeit, je Gefäss und Tag die letzte Messung darin
-- (06_tests.md Abschnitt 9; Entscheid R12). 11.2.: 17:59, 18:00, 21:30, 21:31 → 21:30; 12.2.: 17:59, 18:00 → 18:00.
-- ---------------------------------------------------------------------

select is(pg_temp.isoliert($f$
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-02-11 17:59 Europe/Zurich', 'rundgang', 1.2, 20.0, null, null);
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-02-11 18:00 Europe/Zurich', 'rundgang', 1.2, 20.5, null, null);
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-02-11 21:30 Europe/Zurich', 'rundgang', 1.2, 21.0, null, null);
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-02-11 21:31 Europe/Zurich', 'rundgang', 1.2, 22.0, null, null);
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-02-12 17:59 Europe/Zurich', 'rundgang', 1.2, 19.0, null, null);
  select pg_temp.messung('f5000000-0000-4000-8000-000000000311', '2027-02-12 18:00 Europe/Zurich', 'rundgang', 1.2, 19.5, null, null);
  $f$,
  $q$select string_agg(tag || ' ' || temperatur, ', ' order by tag) from public.v_klima$q$),
  '2027-02-11 21.0, 2027-02-12 19.5', 'C4-AK1 v_klima nur 18:00 bis 21:30, letzte Messung je Tag (21:31 und 17:59 nicht)');

select * from finish();
rollback;
