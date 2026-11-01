\set ON_ERROR_STOP 1
insert into auth.users values ('00000000-0000-0000-0000-00000000000a');
insert into zugang (user_id) values ('00000000-0000-0000-0000-00000000000a');
insert into einstellung (app_version) values ('t');
insert into quelle (quelle_id, titel, link, klasse, anbaumethode, app_version) values ('q1','Q','x','peer_review','dwc','t');
insert into art_schluessel (art_id) values ('lactuca_sativa');
insert into kulturgruppe (kulturgruppe_id, name, leitkultur_art_id, ec_obergrenze_validator, app_version) values ('blattsalat','B','lactuca_sativa',2.0,'t');
insert into art (art_id, name_de, name_wiss, kulturgruppe_id, quelldatei, zeile_id, commit, app_version) values ('lactuca_sativa','Salat','L','blattsalat','a','art.l','c','t');
insert into sorte_schluessel (sorte_key) values ('s1');
insert into sorte (sorte_id, name, art_id, kulturtyp, quelldatei, zeile_id, commit, app_version) select id,'Lollo','lactuca_sativa','blatt','s','s1','c','t' from sorte_schluessel;
insert into messgeraet (modell, app_version) values ('P160','t');
insert into anlage (name, kuerzel, datenart, app_version) values ('Regal','R','echt','t'), ('Demo','X','demo','t');
insert into platz (anlage_id, kennung, rolle, app_version) select id, '2.3', 'gefaess', 't' from anlage;
insert into platz (anlage_id, kennung, rolle, app_version) select id, 'A1', 'anzuchtort', 't' from anlage;
insert into gefaessmodell (name, form, innen_l_mm, innen_b_mm, innen_h_mm, betriebsvolumen_l, app_version) values ('Rako','rechteckig',400,300,170,9,'t');
insert into deckeltyp (name, topfdurchmesser_mm, loecher_je_reihe, app_version) values ('D2',80,'{2,2,2}','t');
insert into gefaess (platz_id, gefaessmodell_id, deckeltyp_id, betriebsart, betriebsvolumen_l, intervall_messen_d, intervall_wechseln_d, app_version)
  select p.id, gm.id, d.id, 'dwc', 9, 2, 14, 't' from platz p, gefaessmodell gm, deckeltyp d where p.kennung = '2.3';

create temp view r23 as select p.id from platz p join anlage a on a.id = p.anlage_id where a.kuerzel = 'R' and p.kennung = '2.3';
insert into ereignis (client_id, typ, platz_id, gilt_ab, app_version) select gen_random_uuid(), 'gefaess_erfasst', id, '2027-01-01', 't' from r23;
insert into ereignis (client_id, typ, platz_id, gilt_ab, app_version) select gen_random_uuid(), 'entfernt', id, '2027-01-02', 't' from r23;
insert into ereignis (client_id, typ, platz_id, gilt_ab, app_version) select gen_random_uuid(), 'gefaess_erfasst', id, '2027-01-03', 't' from r23;
insert into ereignis (client_id, typ, platz_id, daten, gilt_ab, app_version)
  select gen_random_uuid(), 'gefaesspruefung', r23.id, jsonb_build_object('schritt', s, 'ok', true), '2027-01-04', 't' from r23, generate_series(1, 3) s;
select 'Status neues Gefaess, erwartet in_betrieb_volumen_offen' as test, s.status::text as wert
  from v_gefaess_status s join gefaess g on g.id = s.gefaess_id join r23 on r23.id = g.platz_id;
select 'Fuellzustand, erwartet leer' as test, fuellzustand as wert from v_fuellzustand f join r23 on r23.id = f.platz_id;

insert into satz (client_id, sorte_id, kulturform, anzuchtort_platz_id, anzahl_schwaemme, samen_je_schwamm, saatdatum, gilt_ab, app_version)
  select gen_random_uuid(), sk.id, 'schnitt', p.id, 2, 1, '2027-01-07', '2027-01-07', 't'
    from sorte_schluessel sk, platz p join anlage a on a.id = p.anlage_id where a.kuerzel = 'R' and p.kennung = 'A1';
insert into pflanzung (client_id, satz_id, gilt_ab, app_version) select gen_random_uuid(), id, '2027-01-07', 't' from satz;
insert into pflanzung (client_id, satz_id, gilt_ab, app_version) select gen_random_uuid(), id, '2027-01-07', 't' from satz;
insert into ereignis (client_id, typ, satz_id, daten, gilt_ab, app_version)
  select gen_random_uuid(), 'phase_antwort', id, '{"phase":"anzucht","antwort":"ja","erwartet_am":"2027-01-13"}', '2027-01-13', 't' from satz;
insert into ereignis (client_id, typ, pflanzung_id, daten, gilt_ab, app_version)
  select gen_random_uuid(), 'ernte', id, '{"art":"ab"}', '2027-02-20', 't' from (select id from pflanzung order by id limit 1) x;
select 'Phase und Status, erwartet anzucht aktiv und anzucht geerntet' as test, phase::text || ' ' || status as wert from v_pflanzung_zustand order by status;

do $$ begin
  update satz set saatdatum = '2027-01-08';
  raise notice 'FEHLER: Cache direkt geaendert';
exception when raise_exception then raise notice 'ok: Cache geschuetzt'; end $$;
insert into ereignis (client_id, typ, satz_id, daten, gilt_ab, app_version)
  select gen_random_uuid(), 'aussaat', id, '{"saatdatum":"2027-01-06"}', '2027-01-06', 't' from satz;
select 'Saatdatum aus Ereignis, erwartet 2027-01-06' as test, saatdatum::text as wert from satz;

insert into kalibrierung (client_id, messgeraet_id, gilt_ab, app_version) select gen_random_uuid(), id, '2027-01-01 09:00+01', 't' from messgeraet;
insert into messung (client_id, platz_id, messgeraet_id, messart, ec, gilt_ab, app_version)
  select gen_random_uuid(), r23.id, m.id, 'aufgabe', 1.2, d, 't'
    from r23, messgeraet m, unnest(array['2027-01-10 10:00+01', '2027-01-20 10:00+01']::timestamptz[]) d;
insert into kalibrierung (client_id, messgeraet_id, gilt_ab, app_version) select gen_random_uuid(), id, '2027-01-15 09:00+01', 't' from messgeraet;
insert into ereignis (client_id, typ, messgeraet_id, daten, gilt_ab, app_version)
  select gen_random_uuid(), 'als_unsicher_markiert', m.id, jsonb_build_object('seit_kalibrierung_id', k.id), '2027-01-15 09:05+01', 't'
    from messgeraet m, kalibrierung k where k.gilt_ab = '2027-01-01 09:00+01';
select 'unsicher, erwartet 10.1 true und 20.1 false' as test, kalendertag(m.gilt_ab)::text || ' ' || u.unsicher as wert
  from messung m join v_messung_unsicher u on u.messung_id = m.id order by 2;

insert into messung (client_id, platz_id, messgeraet_id, messart, ec, gilt_ab, app_version)
  select gen_random_uuid(), p.id, m.id, 'aufgabe', 1.2, '2027-01-20 11:00+01', 't'
    from platz p join anlage a on a.id = p.anlage_id, messgeraet m where a.kuerzel = 'X' and p.kennung = '2.3';
select 'Demo-Messung ohne Demo-Kalibrierung, erwartet true' as test, u.unsicher::text as wert
  from messung m join platz p on p.id = m.platz_id join anlage a on a.id = p.anlage_id
  join v_messung_unsicher u on u.messung_id = m.id where a.kuerzel = 'X';
select 'Faelligkeit je Datenart' as test, datenart::text || ' ' || coalesce(faellig_am::text, 'nie') as wert from v_kalibrierung_faellig order by 2;

insert into naehrloesungsansatz (client_id, platz_id, typ, begonnen_am, volumen_l, gilt_ab, app_version)
  select gen_random_uuid(), p.id, 'neuansatz', now(), 9, now(), 't' from platz p join anlage a on a.id = p.anlage_id where a.kuerzel = 'X' and p.kennung = '2.3';
delete from anlage where datenart = 'demo';
select 'nach Demo-Loeschen: Plaetze, Messungen, Ansaetze; erwartet 2, 2, 0' as test,
       (select count(*) from platz)::text || ', ' || (select count(*) from messung) || ', ' || (select count(*) from naehrloesungsansatz) as wert;

insert into push_abo (geraet, endpoint, p256dh, auth_schluessel, app_version) values ('Honor', 'https://x', 'p', 'a', 't');
insert into push_versand (abo_id, kanal, art, datum_lokal, bezug_id, timer_ende, app_version)
  select id, 'push', 'timer', '2027-01-20', gen_random_uuid(), '2027-01-20 19:12+01', 't' from push_abo;
do $$ begin
  insert into push_versand (abo_id, kanal, art, datum_lokal, bezug_id, timer_ende, app_version)
    select v.abo_id, 'push', 'timer', v.datum_lokal, v.bezug_id, v.timer_ende, 't' from push_versand v;
  raise notice 'FEHLER: Timer doppelt';
exception when unique_violation then raise notice 'ok: Timer-Push nur einmal'; end $$;
select backup_status_melden(1234);
select 'Backup-Status-Zeilen, erwartet 1' as test, count(*)::text as wert from backup_status;
