\set ON_ERROR_STOP 1
insert into auth.users values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b');
insert into zugang (user_id) values ('00000000-0000-0000-0000-00000000000a');
insert into einstellung (app_version) values ('t');
insert into quelle (quelle_id, titel, link, klasse, anbaumethode, app_version) values ('q1','Q','x','peer_review','dwc','t');
insert into art_schluessel (art_id) values ('lactuca_sativa');
insert into kulturgruppe (kulturgruppe_id, name, leitkultur_art_id, ec_obergrenze_validator, app_version) values ('blattsalat','Blattsalate','lactuca_sativa',2.0,'t');
insert into art (art_id, name_de, name_wiss, kulturgruppe_id, quelldatei, zeile_id, commit, app_version) values ('lactuca_sativa','Salat','Lactuca sativa','blattsalat','art.csv','art.lactuca_sativa','abc','t');
insert into sorte_schluessel (sorte_key) values ('sorte-salat-lollo') ;
insert into sorte (sorte_id, name, art_id, kulturtyp, quelldatei, zeile_id, commit, app_version) select id,'Lollo','lactuca_sativa','blatt','sorten.csv','sorte-salat-lollo','abc','t' from sorte_schluessel;
insert into profilwert (ebene, art_id, phase, groesse, wert_min, wert_max, quelle_id, fundstelle, kurzzitat, evidenzklasse, quelldatei, zeile_id, commit, app_version)
 values ('art','lactuca_sativa','wachstum','ph',5.8,6.5,'q1','S.1','z','B1','profilwert.csv','pw.lactuca_sativa.wachstum.ph','abc','t');
insert into profilwert (ebene, phase, groesse, wert_min, wert_max, quelle_id, fundstelle, kurzzitat, evidenzklasse, quelldatei, zeile_id, commit, app_version)
 values ('standard','wachstum','wassertemp',18,22,'q1','S.2','z','C','profilwert.csv','pw.standard.wachstum.wassertemp','abc','t');
select groesse, wert_min, wert_max, herkunft_ebene, evidenzklasse from v_sollwert order by groesse;
-- Prüfen: Standard mit EC muss scheitern
do $$ begin
  insert into profilwert (ebene, phase, groesse, wert_min, wert_max, ec_einheit_quelle, ec_basis_quelle, quelle_id, fundstelle, kurzzitat, evidenzklasse, quelldatei, zeile_id, commit, app_version)
  values ('standard','wachstum','ec',1.0,1.4,'mS/cm','gesamt','q1','x','z','C','f','pw.standard.wachstum.ec','abc','t');
  raise notice 'FEHLER: Standard-EC wurde angenommen';
exception when check_violation then raise notice 'ok: Standard-EC abgelehnt'; end $$;
-- Überschreiben einer Wissenszeile muss scheitern
do $$ begin update profilwert set wert_min = 5.9 where zeile_id = 'pw.lactuca_sativa.wachstum.ph';
  raise notice 'FEHLER: überschrieben';
exception when raise_exception then raise notice 'ok: Überschreiben abgelehnt'; end $$;
-- TZ1 bis TZ4
insert into messgeraet (modell, app_version) values ('P160 Pro2','t');
insert into anlage (name, kuerzel, app_version) values ('Regal','R','t');
insert into platz (anlage_id, kennung, rolle, app_version) select id,'2.3','gefaess','t' from anlage;
insert into messung (client_id, platz_id, messgeraet_id, messart, ec, gilt_ab, app_version)
 select gen_random_uuid(), p.id, m.id, 'aufgabe', 1.2, d, 't' from platz p, messgeraet m,
 unnest(array['2026-12-31 10:00+01','2027-01-30 10:00+01','2027-01-31 10:00+01','2027-02-01 10:00+01']::timestamptz[]) d;
insert into kalibrierung (client_id, messgeraet_id, gilt_ab, app_version) select gen_random_uuid(), id, '2027-01-01 09:00+01', 't' from messgeraet;
select kalendertag(m.gilt_ab) as tag, u.unsicher from messung m join v_messung_unsicher u on u.messung_id = m.id order by 1;
select faellig_am from v_kalibrierung_faellig;
-- RLS
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
select 'fremd sieht', count(*) from messung;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
select 'tim sieht', count(*) from messung;
reset role;
