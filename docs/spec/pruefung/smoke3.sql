-- smoke3.sql · Fälle zu den Befunden C1 bis C13 aus Prüferdurchgang 2 (pruefbericht_auftrag_2.md).
-- Selbstprüfend: pg_temp.pruefe() bricht beim ersten Fehler ab (ON_ERROR_STOP).
\set ON_ERROR_STOP 1
create function pg_temp.pruefe(fall text, ist text, soll text) returns text language plpgsql as $$
begin
  if ist is distinct from soll then
    raise exception 'FEHLER %: ist «%», soll «%»', fall, ist, soll;
  end if;
  return 'ok  ' || fall;
end $$;

-- Grundbestand
insert into auth.users values ('00000000-0000-0000-0000-00000000000a');
insert into zugang (user_id) values ('00000000-0000-0000-0000-00000000000a');
insert into einstellung (app_version) values ('t');
insert into quelle (quelle_id, titel, link, klasse, anbaumethode, app_version) values ('q1','Q','x','peer_review','dwc','t');
insert into art_schluessel (art_id) values ('lactuca_sativa');
insert into kulturgruppe (kulturgruppe_id, name, leitkultur_art_id, ec_obergrenze_validator, app_version)
  values ('blattsalat','Blattsalate','lactuca_sativa',2.0,'t');
insert into art (art_id, name_de, name_wiss, kulturgruppe_id, standard_keimfaehigkeit, systemeignung, umsetzen_ab_d, umsetzen_bis_d,
                 kulturformen_erlaubt, kulturform_vorgabe, quelldatei, zeile_id, commit, app_version)
  values ('lactuca_sativa','Salat','Lactuca sativa','blattsalat',0.80,'beide',10,18,'{schnitt,kopf,babyleaf}','schnitt',
          'art.csv','art.lactuca_sativa','c','t');
insert into herkunft (tabelle, zeile_id, feld, quelle_id, fundstelle, kurzzitat, evidenzklasse, app_version) values
  ('art','art.lactuca_sativa','systemeignung','q1','S.3','z','B1','t'),
  ('art','art.lactuca_sativa','umsetzen_ab_d','q1','S.4','z','B2','t'),
  ('art','art.lactuca_sativa','name_de','q1','S.1','z','C','t');
insert into art_kulturform (art_id, kulturform, ernte_ab_d, ernteart, ernteintervall_d, schnitte_max, kulturdauer_max_d, kulturdauer_typisch_d,
                            quelldatei, zeile_id, commit, app_version) values
  ('lactuca_sativa','schnitt',28,'mehrfach',7,3,70,56,'art.csv','ak.lactuca_sativa.schnitt','c','t'),
  ('lactuca_sativa','kopf',45,'einmalig',null,null,70,60,'art.csv','ak.lactuca_sativa.kopf','c','t');
insert into herkunft (tabelle, zeile_id, feld, quelle_id, fundstelle, kurzzitat, evidenzklasse, app_version) values
  ('art_kulturform','ak.lactuca_sativa.schnitt','ernte_ab_d','q1','S.5','z','B1','t');
insert into sorte_schluessel (sorte_key) values ('sorte-salat-lollo');
insert into sorte (sorte_id, name, art_id, kulturtyp, quelldatei, zeile_id, commit, app_version)
  select id,'Lollo','lactuca_sativa','blatt','sorten.csv','sorte-salat-lollo','c','t' from sorte_schluessel;
insert into messgeraet (modell, app_version) values ('P160','t'), ('Ersatz','t');
insert into anlage (name, kuerzel, datenart, app_version) values ('Regal','R','echt','t'), ('Demo','X','demo','t');
insert into platz (anlage_id, kennung, rolle, app_version) select id, k, 'gefaess', 't' from anlage, unnest(array['2.3','2.4','2.5']) k;
insert into platz (anlage_id, kennung, rolle, app_version) select id, 'A1', 'anzuchtort', 't' from anlage;
insert into gefaessmodell (name, form, innen_l_mm, innen_b_mm, innen_h_mm, betriebsvolumen_l, app_version) values ('Rako','rechteckig',400,300,170,9,'t');
insert into deckeltyp (name, topfdurchmesser_mm, loecher_je_reihe, app_version) values ('D2',80,'{2,2,2}','t');
insert into auswertung_fenster (name, von, bis, app_version)
  values ('testbetrieb', '2027-01-07 00:00 Europe/Zurich', '2027-04-01 00:00 Europe/Zurich', 't');
create temp view pl as select p.id, a.kuerzel || '-' || p.kennung as code from platz p join anlage a on a.id = p.anlage_id;
create temp view mg as select id, modell from messgeraet;

-- C1 Kalibrierung, Sonde gereinigt und «als unsicher markiert» je Messgerät und Datenart
insert into kalibrierung (client_id, messgeraet_id, datenart, gilt_ab, app_version)
  select gen_random_uuid(), mg.id, d::datenart, '2027-01-01 09:00+01', 't' from mg, unnest(array['echt','demo']) d where mg.modell = 'P160';
insert into kalibrierung (client_id, messgeraet_id, datenart, gilt_ab, app_version)
  select gen_random_uuid(), mg.id, 'echt', '2027-01-01 09:00+01', 't' from mg where mg.modell = 'Ersatz';
insert into messung (client_id, platz_id, messgeraet_id, messart, ec, gilt_ab, app_version)
  select gen_random_uuid(), pl.id, mg.id, 'aufgabe', 1.2, '2027-01-10 10:00+01', 't'
    from pl, mg where pl.code in ('R-2.3', 'X-2.3') and mg.modell = 'P160';
insert into ereignis (client_id, typ, messgeraet_id, daten, gilt_ab, app_version)
  select gen_random_uuid(), 'sonde_gereinigt', mg.id, '{"datenart":"demo"}', '2027-01-05 09:00+01', 't' from mg where mg.modell = 'P160';
create temp view mu as
  select pl.code, kalendertag(m.gilt_ab) as tag, u.unsicher from messung m join pl on pl.id = m.platz_id
    join v_messung_unsicher u on u.messung_id = m.id;
select pg_temp.pruefe('C1 Demo-Sonde gereinigt: echte Messung sicher', (select unsicher::text from mu where code = 'R-2.3'), 'false');
select pg_temp.pruefe('C1 Demo-Sonde gereinigt: Demo-Messung unsicher', (select unsicher::text from mu where code = 'X-2.3'), 'true');
select pg_temp.pruefe('C1 Fälligkeit echt unberührt, demo sofort',
  (select string_agg(datenart || ' ' || coalesce(faellig_am::text, 'nie'), ', ' order by datenart)
     from v_kalibrierung_faellig f join mg on mg.id = f.messgeraet_id where mg.modell = 'P160' and datenart <> 'test'),
  'echt 2027-01-31, demo 2027-01-05');
-- Markierung seit der Kalibrierung des anderen Geräts wirkt nicht auf P160
insert into ereignis (client_id, typ, messgeraet_id, daten, gilt_ab, app_version)
  select gen_random_uuid(), 'als_unsicher_markiert', mg.id,
         jsonb_build_object('seit_kalibrierung_id', k.id, 'datenart', 'echt'), '2027-01-12 09:00+01', 't'
    from mg join kalibrierung k on k.messgeraet_id = mg.id where mg.modell = 'Ersatz';
select pg_temp.pruefe('C1 Markierung anderes Gerät: echte Messung sicher', (select unsicher::text from mu where code = 'R-2.3'), 'false');
-- Demo-Markierung mit echter Kalibrierung X (Datenart passt nicht) wirkt nicht
insert into ereignis (client_id, typ, messgeraet_id, daten, gilt_ab, app_version)
  select gen_random_uuid(), 'als_unsicher_markiert', mg.id,
         jsonb_build_object('seit_kalibrierung_id', k.id, 'datenart', 'demo'), '2027-01-12 09:00+01', 't'
    from mg join kalibrierung k on k.messgeraet_id = mg.id and k.datenart = 'echt' where mg.modell = 'P160';
select pg_temp.pruefe('C1 Demo-Markierung auf echte Kalibrierung: echte Messung sicher', (select unsicher::text from mu where code = 'R-2.3'), 'false');
-- Echte Markierung seit der echten Kalibrierung wirkt nur auf die echte Messung
insert into ereignis (client_id, typ, messgeraet_id, daten, gilt_ab, app_version)
  select gen_random_uuid(), 'als_unsicher_markiert', mg.id,
         jsonb_build_object('seit_kalibrierung_id', k.id, 'datenart', 'echt'), '2027-01-12 09:00+01', 't'
    from mg join kalibrierung k on k.messgeraet_id = mg.id and k.datenart = 'echt' where mg.modell = 'P160';
select pg_temp.pruefe('C1 echte Markierung: echte Messung unsicher', (select unsicher::text from mu where code = 'R-2.3'), 'true');
do $$ begin
  insert into ereignis (client_id, typ, messgeraet_id, gilt_ab, app_version)
    select gen_random_uuid(), 'sonde_gereinigt', id, now(), 't' from messgeraet limit 1;
  raise exception 'FEHLER C1: Sonde gereinigt ohne Datenart angenommen';
exception when check_violation then raise notice 'ok  C1 Sonde gereinigt ohne Datenart abgelehnt'; end $$;

-- C2 Gefässstatus ohne Ereignis gefaess_erfasst (Rückfall) und nach «entfernt»
insert into gefaess (platz_id, gefaessmodell_id, deckeltyp_id, betriebsart, betriebsvolumen_l, intervall_messen_d, intervall_wechseln_d, gueltig_von, app_version)
  select pl.id, gm.id, d.id, 'dwc', 9, 2, 14, '2027-01-01', 't' from pl, gefaessmodell gm, deckeltyp d where pl.code = 'R-2.4';
insert into ereignis (client_id, typ, platz_id, daten, gilt_ab, app_version)
  select gen_random_uuid(), 'gefaesspruefung', pl.id, jsonb_build_object('schritt', s, 'ok', true), '2027-01-02', 't'
    from pl, generate_series(1, 3) s where pl.code = 'R-2.4';
create temp view gs as select pl.code, s.status::text as status from v_gefaess_status s join gefaess g on g.id = s.gefaess_id join pl on pl.id = g.platz_id;
select pg_temp.pruefe('C2 ohne gefaess_erfasst: Rückfall gueltig_von', (select status from gs where code = 'R-2.4'), 'in_betrieb_volumen_offen');
-- 2.5: altes Gefäss geprüft und entfernt, neue Belegung ohne Ereignis → alte Prüfschritte zählen nicht
insert into gefaess (platz_id, gefaessmodell_id, deckeltyp_id, betriebsart, betriebsvolumen_l, intervall_messen_d, intervall_wechseln_d, gueltig_von, gueltig_bis, app_version)
  select pl.id, gm.id, d.id, 'dwc', 9, 2, 14, '2027-01-01', '2027-01-03', 't' from pl, gefaessmodell gm, deckeltyp d where pl.code = 'R-2.5';
insert into ereignis (client_id, typ, platz_id, daten, gilt_ab, app_version)
  select gen_random_uuid(), t, pl.id, d, g, 't' from pl, (values
    ('gefaess_erfasst'::ereignis_typ, '{}'::jsonb, '2027-01-01'::timestamptz),
    ('gefaesspruefung', '{"schritt":1,"ok":true}', '2027-01-01 10:00'), ('gefaesspruefung', '{"schritt":2,"ok":true}', '2027-01-01 10:00'),
    ('gefaesspruefung', '{"schritt":3,"ok":true}', '2027-01-01 10:00'), ('entfernt', '{}', '2027-01-03')) x(t, d, g)
   where pl.code = 'R-2.5';
insert into gefaess (platz_id, gefaessmodell_id, deckeltyp_id, betriebsart, betriebsvolumen_l, intervall_messen_d, intervall_wechseln_d, gueltig_von, app_version)
  select pl.id, gm.id, d.id, 'dwc', 9, 2, 14, '2027-01-04', 't' from pl, gefaessmodell gm, deckeltyp d where pl.code = 'R-2.5';
select pg_temp.pruefe('C2 neue Belegung nach entfernt ohne Ereignis: in Prüfung', (select status from gs where code = 'R-2.5'), 'in_pruefung');
insert into ereignis (client_id, typ, platz_id, gilt_ab, app_version) select gen_random_uuid(), 'gefaess_erfasst', pl.id, '2027-01-04', 't' from pl where pl.code = 'R-2.5';
select pg_temp.pruefe('C2 mit gefaess_erfasst: in Prüfung', (select status from gs where code = 'R-2.5'), 'in_pruefung');

-- C3 Fruchtgemüse: Antwort am Satz mit auslösender Pflanzung gilt für alle Pflanzungen
insert into satz (client_id, sorte_id, kulturform, anzuchtort_platz_id, anzahl_schwaemme, samen_je_schwamm, saatdatum, gilt_ab, app_version)
  select 'c3000000-0000-0000-0000-000000000001', sk.id, 'schnitt', pl.id, 2, 1, '2027-01-07', '2027-01-07 09:00+01', 't'
    from sorte_schluessel sk, pl where pl.code = 'R-A1';
insert into pflanzung (client_id, satz_id, gilt_ab, app_version)
  select gen_random_uuid(), s.id, '2027-01-07 09:00+01', 't' from satz s, generate_series(1, 2) where s.client_id = 'c3000000-0000-0000-0000-000000000001';
insert into ereignis (client_id, typ, satz_id, daten, gilt_ab, app_version)
  select gen_random_uuid(), 'phase_antwort', s.id,
         jsonb_build_object('phase', 'bluete', 'antwort', 'ja', 'erwartet_am', '2027-03-01',
                            'ausloesende_pflanzung_id', (select min(pf.id::text) from pflanzung pf where pf.satz_id = s.id)),
         '2027-03-02', 't'
    from satz s where s.client_id = 'c3000000-0000-0000-0000-000000000001';
select pg_temp.pruefe('C3 Fruchtgemüse-Antwort am Satz: beide Pflanzungen in Blüte',
  (select string_agg(z.phase::text, ',') from v_pflanzung_zustand z join satz s on s.id = z.satz_id
    where s.client_id = 'c3000000-0000-0000-0000-000000000001'), 'bluete,bluete');

-- C6 Saatdatum und Umsetzdatum: Storno fällt auf die Vorgabe zurück, Satz-Ereignisse, nur aktive Reservierungen
create temp view s3 as select id from satz where client_id = 'c3000000-0000-0000-0000-000000000001';
insert into ereignis (client_id, typ, satz_id, daten, gilt_ab, app_version)
  select 'c6000000-0000-0000-0000-000000000001', 'aussaat', id, '{"saatdatum":"2027-01-06"}', '2027-01-08', 't' from s3;
select pg_temp.pruefe('C6 Saatdatum aus Ereignis', (select saatdatum::text from satz join s3 using (id)), '2027-01-06');
update ereignis set storniert_am = now(), storno_grund = 'fehleingabe' where client_id = 'c6000000-0000-0000-0000-000000000001';
select pg_temp.pruefe('C6 Storno des einzigen aussaat: Kalendertag von gilt_ab', (select saatdatum::text from satz join s3 using (id)), '2027-01-07');
insert into netztopf (anlage_id, kennung, groesse_mm, heim_platz_id, heim_loch_nr, app_version)
  select p.anlage_id, 'T' || n, 80, p.id, n, 't' from platz p join pl on pl.id = p.id, generate_series(1, 2) n where pl.code = 'R-2.3';
insert into reservierung (client_id, pflanzung_id, netztopf_id, umsetzen_vorgabe_am, gilt_ab, app_version)
  select gen_random_uuid(), pf.id, t.id, '2027-01-20', '2027-01-07 09:00+01', 't'
    from (select pf.id, row_number() over (order by pf.id) n from pflanzung pf join s3 on s3.id = pf.satz_id) pf
    join netztopf t on t.kennung = 'T' || pf.n;
create temp view rv as
  select t.kennung, r.umsetzen_geplant_am::text as am from reservierung r join netztopf t on t.id = r.netztopf_id;
select pg_temp.pruefe('C6 ohne Ereignis gilt die Vorgabe', (select string_agg(kennung || ' ' || am, ', ' order by kennung) from rv), 'T1 2027-01-20, T2 2027-01-20');
insert into ereignis (client_id, typ, satz_id, daten, gilt_ab, app_version)
  select 'c6000000-0000-0000-0000-000000000002', 'umsetzdatum_geaendert', id, '{"von":"2027-01-20","nach":"2027-01-21","grund":"morgen"}', '2027-01-20 08:00+01', 't' from s3;
select pg_temp.pruefe('C6 Morgen am Satz gilt für alle', (select string_agg(kennung || ' ' || am, ', ' order by kennung) from rv), 'T1 2027-01-21, T2 2027-01-21');
insert into ereignis (client_id, typ, pflanzung_id, daten, gilt_ab, app_version)
  select 'c6000000-0000-0000-0000-000000000003', 'umsetzdatum_geaendert', r.pflanzung_id, '{"von":"2027-01-21","nach":"2027-01-22","grund":"morgen"}', '2027-01-21 08:00+01', 't'
    from reservierung r join netztopf t on t.id = r.netztopf_id where t.kennung = 'T1';
select pg_temp.pruefe('C6 Ausnahme an der Pflanzung', (select string_agg(kennung || ' ' || am, ', ' order by kennung) from rv), 'T1 2027-01-22, T2 2027-01-21');
update ereignis set storniert_am = now(), storno_grund = 'rueckgaengig' where client_id = 'c6000000-0000-0000-0000-000000000003';
select pg_temp.pruefe('C6 Storno der Ausnahme: Satz-Ereignis gilt', (select string_agg(kennung || ' ' || am, ', ' order by kennung) from rv), 'T1 2027-01-21, T2 2027-01-21');
update ereignis set storniert_am = now(), storno_grund = 'rueckgaengig' where client_id = 'c6000000-0000-0000-0000-000000000002';
select pg_temp.pruefe('C6 Storno des einzigen Satz-Ereignisses: Vorgabe', (select string_agg(kennung || ' ' || am, ', ' order by kennung) from rv), 'T1 2027-01-20, T2 2027-01-20');
insert into ereignis (client_id, typ, pflanzung_id, netztopf_id, daten, gilt_ab, app_version)
  select gen_random_uuid(), 'umsetzen', r.pflanzung_id, r.netztopf_id, '{}', '2027-01-20 10:00+01', 't'
    from reservierung r join netztopf t on t.id = r.netztopf_id where t.kennung = 'T2';
insert into ereignis (client_id, typ, satz_id, daten, gilt_ab, app_version)
  select gen_random_uuid(), 'umsetzdatum_geaendert', id, '{"von":"2027-01-20","nach":"2027-01-25","grund":"ziel_spaeter"}', '2027-01-20 11:00+01', 't' from s3;
select pg_temp.pruefe('C6 beendete Reservierung bleibt', (select string_agg(kennung || ' ' || am, ', ' order by kennung) from rv), 'T1 2027-01-25, T2 2027-01-20');
do $$ begin
  update reservierung set umsetzen_vorgabe_am = '2027-02-01';
  raise exception 'FEHLER C6: Vorgabe geändert';
exception when raise_exception then
  if sqlerrm like 'FEHLER%' then raise; end if;
  raise notice 'ok  C6 Vorgabe unveränderlich';
end $$;

-- D2 Korrektur der Reservierung nach «Morgen» behält das verschobene Datum
update reservierung set storniert_am = now(), storno_grund = 'korrektur'
 where netztopf_id = (select id from netztopf where kennung = 'T1') and storniert_am is null;
insert into reservierung (client_id, pflanzung_id, netztopf_id, umsetzen_vorgabe_am, umsetzen_geplant_am, gilt_ab, ersetzt_id, app_version)
  select 'd2000000-0000-0000-0000-000000000001', r.pflanzung_id, r.netztopf_id, r.umsetzen_vorgabe_am, '2027-01-20', '2027-01-20 12:00+01', r.id, 't'
    from reservierung r join netztopf t on t.id = r.netztopf_id where t.kennung = 'T1';
select pg_temp.pruefe('D2 Korrektur nach Morgen: Datum aus dem Satz-Ereignis, nicht Vorgabe oder Client-Wert',
  (select umsetzen_geplant_am::text from reservierung where client_id = 'd2000000-0000-0000-0000-000000000001'), '2027-01-25');

-- D3 Füllzustand eines neuen Gefässes am Platz eines entfernten ohne gefaess_erfasst
insert into platz (anlage_id, kennung, rolle, app_version) select id, '2.6', 'gefaess', 't' from anlage where kuerzel = 'R';
insert into gefaess (platz_id, gefaessmodell_id, deckeltyp_id, betriebsart, betriebsvolumen_l, intervall_messen_d, intervall_wechseln_d, gueltig_von, gueltig_bis, app_version)
  select pl.id, gm.id, d.id, 'dwc', 9, 2, 14, '2027-01-01', '2027-01-03', 't' from pl, gefaessmodell gm, deckeltyp d where pl.code = 'R-2.6';
insert into naehrloesungsansatz (client_id, platz_id, typ, begonnen_am, volumen_l, gilt_ab, app_version)
  select gen_random_uuid(), pl.id, 'neuansatz', '2027-01-02', 9, '2027-01-02', 't' from pl where pl.code = 'R-2.6';
insert into ereignis (client_id, typ, platz_id, gilt_ab, app_version) select gen_random_uuid(), 'entfernt', pl.id, '2027-01-03', 't' from pl where pl.code = 'R-2.6';
insert into gefaess (platz_id, gefaessmodell_id, deckeltyp_id, betriebsart, betriebsvolumen_l, intervall_messen_d, intervall_wechseln_d, gueltig_von, app_version)
  select pl.id, gm.id, d.id, 'dwc', 9, 2, 14, '2027-01-04', 't' from pl, gefaessmodell gm, deckeltyp d where pl.code = 'R-2.6';
select pg_temp.pruefe('D3 neues Gefäss nach entfernt ohne Ereignis: leer', (select fuellzustand from v_fuellzustand f join pl on pl.id = f.platz_id where pl.code = 'R-2.6'), 'leer');
insert into naehrloesungsansatz (client_id, platz_id, typ, begonnen_am, volumen_l, gilt_ab, app_version)
  select gen_random_uuid(), pl.id, 'neuansatz', '2027-01-05', 9, '2027-01-05', 't' from pl where pl.code = 'R-2.6';
select pg_temp.pruefe('D3 nach Neuansatz: Lösung', (select fuellzustand from v_fuellzustand f join pl on pl.id = f.platz_id where pl.code = 'R-2.6'), 'loesung');

-- D5 Phasenantwort nur am Satz
do $$ begin
  insert into ereignis (client_id, typ, satz_id, pflanzung_id, daten, gilt_ab, app_version)
    select gen_random_uuid(), 'phase_antwort', pf.satz_id, pf.id, '{"phase":"wachstum","antwort":"ja"}', now(), 't' from pflanzung pf limit 1;
  raise exception 'FEHLER D5: Phasenantwort an der Pflanzung angenommen';
exception when check_violation then raise notice 'ok  D5 Phasenantwort an der Pflanzung abgelehnt'; end $$;

-- C5, C9, C10 Schreibweg der App (als Tim)
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
select wissen_app_schreiben('art_neu', '{"art_id":"lactuca_serriola","name_de":"Kompasslattich","name_wiss":"Lactuca serriola","kulturgruppe_id":"blattsalat"}') is not null;
select wissen_app_schreiben('sorte_neu', '{"sorte_id":"c9000000-0000-0000-0000-000000000001","name":"Wilder","art_id":"lactuca_serriola","kulturtyp":"blatt"}');
select wissen_app_schreiben('sorte_neu', '{"sorte_id":"c9000000-0000-0000-0000-000000000001","name":"Wilder","art_id":"lactuca_serriola","kulturtyp":"blatt"}');
select wissen_app_schreiben('tuetenwert', '{"sorte_id":"c9000000-0000-0000-0000-000000000001","groesse":"keimtemp","wert_min":15,"wert_typ":18,"wert_max":20}') is not null;
select wissen_app_schreiben('tuetenwert', '{"sorte_id":"c9000000-0000-0000-0000-000000000001","groesse":"keimtemp","wert_min":16,"wert_typ":18,"wert_max":21}') is not null;
select wissen_app_schreiben('saatempfehlung_neu', '{"sorte_id":"c9000000-0000-0000-0000-000000000001","kulturform":"schnitt","samen_je_schwamm":3,"obergrenze_samen":4,"klasse_saatmenge":"C"}') is not null;
select wissen_app_schreiben('saatempfehlung_neu', '{"sorte_id":"c9000000-0000-0000-0000-000000000001","kulturform":"schnitt","samen_je_schwamm":2,"obergrenze_samen":4,"klasse_saatmenge":"C","bestaetigt":true}') is not null;
select wissen_app_schreiben('saatempfehlung_neu', '{"ebene":"art","art_id":"lactuca_serriola","kulturform":"kopf","samen_je_schwamm":2,"klasse_saatmenge":"D"}') is not null;
do $$ begin
  perform wissen_app_schreiben('saatempfehlung_neu', '{"sorte_id":"c9000000-0000-0000-0000-000000000001","kulturform":"kopf","samen_je_schwamm":2,"klasse_saatmenge":"A"}');
  raise exception 'FEHLER C5: Klasse A aus der App angenommen';
exception when raise_exception then
  if sqlerrm like 'FEHLER%' then raise; end if;
  raise notice 'ok  C5 Klasse A aus der App abgelehnt';
end $$;
reset role;
select pg_temp.pruefe('C5 art_neu übernimmt Merkmale der Leitkultur',
  (select concat_ws(' ', kulturformen_erlaubt::text, kulturform_vorgabe, systemeignung, umsetzen_ab_d, umsetzen_bis_d, standard_keimfaehigkeit)
     from art where art_id = 'lactuca_serriola'), '{schnitt,kopf,babyleaf} schnitt beide 10 18 0.80');
select pg_temp.pruefe('C5 art_neu übernimmt Kulturformen',
  (select string_agg(kulturform || ' ' || ernteart || ' ' || zeile_id, ', ' order by kulturform) from art_kulturform where art_id = 'lactuca_serriola'),
  'schnitt mehrfach ak.lactuca_serriola.schnitt, kopf einmalig ak.lactuca_serriola.kopf');
select pg_temp.pruefe('C5 Herkunft mit Vermerk leitkultur, ohne Stammfelder',
  (select string_agg(tabelle || '.' || feld || ' ' || evidenzklasse, ', ' order by tabelle, feld) from herkunft where vermerk = 'leitkultur'),
  'art.systemeignung B1, art.umsetzen_ab_d B2, art_kulturform.ernte_ab_d B1');
select pg_temp.pruefe('C9 sorte_neu: Schlüssel = Client-ID, sorte_key = zeile_id, idempotent',
  (select count(*) || ' ' || bool_and(sk.sorte_key = 'app-' || sk.id and so.zeile_id = sk.sorte_key)
     from sorte_schluessel sk join sorte so on so.sorte_id = sk.id where sk.id = 'c9000000-0000-0000-0000-000000000001'), '1 true');
select pg_temp.pruefe('C10 zweiter Tütenwert: eine gültige, eine geschlossene Fassung',
  (select count(*) filter (where gueltig_bis is null) || ' ' || count(*) filter (where gueltig_bis is not null) || ' '
          || max(wert_min) filter (where gueltig_bis is null)
     from profilwert where sorte_id = 'c9000000-0000-0000-0000-000000000001' and groesse = 'keimtemp'), '1 1 16.000');
select pg_temp.pruefe('C5 saatempfehlung_neu: Tüte Klasse C, neue Fassung schliesst alte, Art Klasse D',
  (select string_agg(ebene || ' ' || kulturform || ' ' || klasse_saatmenge || ' ' || samen_je_schwamm || ' ' || coalesce(quelle_id, '-') || ' '
                     || (bestaetigt_am is not null) || ' ' || zeile_id, ', ' order by ebene, kulturform)
     from saatempfehlung where gueltig_bis is null),
  'sorte schnitt C 2 tuete-app-c9000000-0000-0000-0000-000000000001 true se.app-c9000000-0000-0000-0000-000000000001.schnitt, '
  || 'art kopf D 2 - false se.lactuca_serriola.kopf');

-- C12 und C13 Pflegezeit und Fenstergrenzen
insert into ereignis (client_id, typ, satz_id, pflanzung_id, netztopf_id, messgeraet_id, daten, dauer_s, gilt_ab, app_version)
  select gen_random_uuid(), x.typ, x.sid, x.pid, x.tid, x.mid, x.d, 60, x.g, 't' from (
    select 'beobachtung'::ereignis_typ as typ, (select id from s3) as sid, null::uuid as pid, null::uuid as tid, null::uuid as mid,
           '{"kategorie":"sonstiges"}'::jsonb as d, '2027-01-10 10:00+01'::timestamptz as g
    union all select 'beobachtung', null, (select min(pf.id::text)::uuid from pflanzung pf join s3 on s3.id = pf.satz_id), null, null, '{"kategorie":"sonstiges"}', '2027-01-10 10:00+01'
    union all select 'verschieben', null, null, (select id from netztopf where kennung = 'T1'), null, '{}', '2027-01-10 10:00+01'
    union all select 'sonde_gereinigt', null, null, null, (select id from mg where modell = 'Ersatz'), '{"datenart":"echt"}', '2027-01-10 10:00+01'
    union all select 'sonde_gereinigt', null, null, null, (select id from mg where modell = 'Ersatz'), '{"datenart":"demo"}', '2027-01-10 10:00+01'
    union all select 'beobachtung', (select id from s3), null, null, null, '{"kategorie":"sonstiges"}', '2027-03-31 23:59+02'
    union all select 'beobachtung', (select id from s3), null, null, null, '{"kategorie":"sonstiges"}', '2027-04-01 00:00+02') x;
select pg_temp.pruefe('C12/C13 Pflegezeit: Satz, Pflanzung, Netztopf, echtes Messgerät; 31.3. 23:59 ja, 1.4. 00:00 nein',
  (select string_agg(woche::date || ' ' || round(stunden * 3600), ', ' order by woche) from v_pflegezeit), '2027-01-04 240, 2027-03-29 60');
insert into aufgabe_tagesliste (tag, aufgabe_schluessel, typ, faellig_am, app_version) values
  ('2027-01-06', 'a|x|0106', 'eigene', '2027-01-06', 't'), ('2027-01-07', 'a|x|0107', 'eigene', '2027-01-07', 't'),
  ('2027-03-31', 'a|x|0331', 'eigene', '2027-03-31', 't'), ('2027-04-01', 'a|x|0401', 'eigene', '2027-04-01', 't');
select pg_temp.pruefe('C13 Termintreue: Tage 7.1. bis 31.3., ohne 1.4.', (select string_agg(tag::text, ',' order by tag) from v_termintreue), '2027-01-07,2027-03-31');

-- C7 Demo löschen mit Kalibrierungen, Abos, Pflanzvorgängen, Messgerät-Ereignissen, Scans
insert into satz (client_id, sorte_id, kulturform, anzuchtort_platz_id, anzahl_schwaemme, samen_je_schwamm, saatdatum, gilt_ab, app_version)
  select 'c7000000-0000-0000-0000-000000000001', sk.id, 'schnitt', pl.id, 1, 1, '2027-01-07', '2027-01-07 09:00+01', 't'
    from sorte_schluessel sk, pl where pl.code = 'X-A1' and sk.sorte_key = 'sorte-salat-lollo';
insert into pflanzvorgang (client_id, begonnen_am, gespeichert_am, einstieg, anzahl_pflanzungen, app_version)
  values ('c7000000-0000-0000-0000-000000000002', '2027-01-07 09:00+01', '2027-01-07 09:01+01', 'heute', 1, 't'),
         ('c7000000-0000-0000-0000-000000000003', '2027-01-07 09:00+01', '2027-01-07 09:01+01', 'heute', 1, 't');
insert into pflanzung (client_id, satz_id, pflanzvorgang_id, gilt_ab, app_version)
  select gen_random_uuid(), s.id, pv.id, '2027-01-07 09:00+01', 't' from satz s, pflanzvorgang pv
   where s.client_id = 'c7000000-0000-0000-0000-000000000001' and pv.client_id = 'c7000000-0000-0000-0000-000000000002';
update pflanzung set pflanzvorgang_id = (select id from pflanzvorgang where client_id = 'c7000000-0000-0000-0000-000000000003')
 where id = (select min(pf.id::text)::uuid from pflanzung pf join s3 on s3.id = pf.satz_id);
insert into push_abo (geraet, endpoint, p256dh, auth_schluessel, datenart, app_version) values
  ('Honor', 'https://echt', 'p', 'a', 'echt', 't'), ('Demo', 'https://demo', 'p', 'a', 'demo', 't');
insert into push_versand (abo_id, kanal, art, datum_lokal, app_version) select id, 'push', 'sammel', '2027-01-10', 't' from push_abo;
insert into etikett_aufruf (code, ergebnis, app_version) values ('X-2.3', 'gefunden', 't'), ('R-2.3', 'gefunden', 't');
-- D4 pH-Kontrolle ohne Platz und Aufschub tragen die Datenart
insert into messung (client_id, messgeraet_id, messart, ph, datenart, gilt_ab, app_version)
  select gen_random_uuid(), id, 'ph_kontrolle', 6.9, 'demo', '2027-01-10 10:00+01', 't' from mg where modell = 'P160';
insert into aufschub (client_id, aufgabe_schluessel, art, gesetzt_am, datenart, gilt_ab, app_version) values
  (gen_random_uuid(), 'messen|x|2027-01-10', 'morgen', '2027-01-10', 'demo', '2027-01-10', 't'),
  (gen_random_uuid(), 'messen|r|2027-01-10', 'morgen', '2027-01-10', 'echt', '2027-01-10', 't');
do $$ begin
  insert into messung (client_id, messgeraet_id, messart, ph, gilt_ab, app_version) select gen_random_uuid(), id, 'ph_kontrolle', 6.9, now(), 't' from messgeraet limit 1;
  raise exception 'FEHLER D4: pH-Kontrolle ohne Datenart angenommen';
exception when check_violation then raise notice 'ok  D4 pH-Kontrolle ohne Datenart abgelehnt'; end $$;
-- D1 security-definer-Funktionen trotz Default-Privileges nicht für anon und authenticated
do $$ declare r text; begin
  foreach r in array array['anon', 'authenticated'] loop
    begin
      execute format('set local role %I', r);
      perform datenart_loeschen('demo');
      raise exception 'FEHLER D1: % darf datenart_loeschen', r;
    exception when insufficient_privilege then raise notice 'ok  D1 % darf datenart_loeschen nicht', r; end;
    begin
      execute format('set local role %I', r);
      perform backup_status_melden(1);
      raise exception 'FEHLER D1: % darf backup_status_melden', r;
    exception when insufficient_privilege then raise notice 'ok  D1 % darf backup_status_melden nicht', r; end;
  end loop;
  reset role;
end $$;
do $$ begin
  set local role authenticated;
  perform datenart_loeschen('demo');
  raise exception 'FEHLER C7: App darf löschen';
exception when insufficient_privilege then raise notice 'ok  C7 App darf datenart_loeschen nicht aufrufen'; end $$;
do $$ begin
  perform datenart_loeschen('echt');
  raise exception 'FEHLER C7: echt gelöscht';
exception when raise_exception then
  if sqlerrm like 'FEHLER%' then raise; end if;
  raise notice 'ok  C7 echte Daten nicht löschbar';
end $$;
set role service_role;
select datenart_loeschen('demo');
reset role;
select pg_temp.pruefe('C7 nach Demo löschen: Anlagen, Kalibrierungen, Abos, Versand, Pflanzvorgänge, Demo-Ereignisse, Scans',
  concat_ws(' ', (select count(*) from anlage), (select count(*) from kalibrierung), (select count(*) from push_abo),
            (select count(*) from push_versand), (select count(*) from pflanzvorgang),
            (select count(*) from ereignis where daten ->> 'datenart' = 'demo'), (select count(*) from etikett_aufruf),
            (select count(*) from messung), (select count(*) from aufschub)),
  '1 2 1 1 1 0 1 1 1');

-- C11 Rückfall Backup: Lese-Policies für backup_leser, Dump mit Zeilensicherheit (pg_dump in lauf.sh)
grant usage on schema public to backup_leser;
grant select on all tables in schema public to backup_leser;
do $b$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('create policy backup_lesen on public.%I for select to backup_leser using (true)', t);
  end loop; end $b$;
set role backup_leser;
select pg_temp.pruefe('C11 backup_leser liest mit RLS alle Messungen', (select count(*)::text from messung), '1');
do $$ begin
  insert into backup_status (app_version) values ('x');
  raise exception 'FEHLER C11: backup_leser schreibt';
exception when insufficient_privilege then raise notice 'ok  C11 backup_leser schreibt nicht direkt'; end $$;
reset role;
select pg_temp.pruefe('C11 Prüftor: using (true) nur als benannte Ausnahme',
  (select count(*)::text from pg_policies where schemaname = 'public' and qual = 'true'
      and not (policyname = 'backup_lesen' and cmd = 'SELECT' and roles = '{backup_leser}')), '0');
select pg_temp.pruefe('C11 jede Tabelle hat RLS',
  (select count(*)::text from pg_tables where schemaname = 'public' and not rowsecurity), '0');
