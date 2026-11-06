-- 15_sorten_erfassung.test.sql · Sorte aus der App und Recherche über wissen_app_schreiben() (Issue #37, Plan 37
-- Testliste SQL; UC4-AK4, UC4-AK8; Konzept 8.1 Regel 6, 11.3, R1.3, R1.4, R12.3, Erratum E8; EK1).
-- Ohne Personendaten; alles in einer Transaktion mit rollback. Die Datenbank läuft in UTC.
--
-- Vorausgesetzt (Plan 37, Migration):
--   Enum vermerk mit 'recherche'; ki_aufruf.zweck text null check in ('tuete', 'recherche', 'quellenpruefer');
--   wissen_app_schreiben(aktion, daten) mit den neuen Aktionen
--     recherche_wert:  daten = { art_id, phase, groesse, wert_min, wert_typ, wert_max, text_wert,
--                                ec_min_quelle, ec_max_quelle, ec_einheit_quelle, ec_basis_quelle,
--                                system_quelle, umgebung_quelle, fundstelle, kurzzitat, evidenzklasse, app_version,
--                                quelle: { quelle_id, titel, link, klasse, anbaumethode, abgerufen_am } }
--       → id der neuen profilwert-Zeile (Ebene art, Vermerk recherche, quelldatei app, freigegeben_am leer,
--         zeile_id pw.recherche.<art_id>.<phase>.<groesse>) oder null, wenn schon eine gültige Zeile besteht.
--     recherche_saatempfehlung: daten = { sorte_id, kulturform, samen_je_schwamm, obergrenze_samen,
--                                pflanzen_stehen_lassen, klasse_saatmenge, substrat_passung, begruendung,
--                                fundstelle, kurzzitat, app_version, quelle: { … wie oben } }
--       → id mit bestaetigt_am = kalendertag(now()); Ebene art, sonst sorte, sonst null (A5); nur Klasse B oder C.
--     sorte_neu mit katalog_link: Quelle katalog-<sorte_key> (Klasse katalog, Anbaumethode keine), Herkunft C katalog.
--
-- Fixture als postgres: Kulturgruppe pgtap15_kg mit Leitkultur pgtap15_leit; Art pgtap15_salat (Kulturform schnitt)
-- mit W0-Zeilen für keimung und anzucht und wachstum ohne Dauer und EC; Art pgtap15_kraut (Kulturform kopf) mit einer
-- unbestätigten W0-Saatempfehlung auf Ebene Art; anwendbar für keimung, anzucht, wachstum auf Ebene Kulturgruppe
-- (Klasse D, Prüfauftrag); pflichtgroesse nach 03_import_w0.md Abschnitt 9.
begin;
create extension if not exists pgtap with schema extensions;
set local timezone to 'UTC';
select plan(27);

-- ---------------------------------------------------------------------
-- Hilfen
-- ---------------------------------------------------------------------

create function pg_temp.als(rolle text, sub uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub', sub, 'role', rolle)::text, true);
  execute format('set local role %I', rolle);
end $$;

-- wissen_app_schreiben als Rolle; Ergebnis: id als Text, «null» oder «fehler <SQLSTATE>: <Meldung>»
create function pg_temp.wissen(rolle text, sub uuid, aktion text, daten jsonb) returns text language plpgsql as $$
declare
  r text;
begin
  perform pg_temp.als(rolle, sub);
  begin
    r := coalesce(public.wissen_app_schreiben(aktion, daten)::text, 'null');
  exception when others then
    r := 'fehler ' || sqlstate || ': ' || sqlerrm;
  end;
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
  return r;
end $$;

create function pg_temp.tim(aktion text, daten jsonb) returns text language sql as $$
  select pg_temp.wissen('authenticated', '00000000-0000-4000-8000-00000000000a', aktion, daten)
$$;

-- Fehler, aber nicht «unbekannte Aktion» (sonst wäre die Ablehnung kein Beleg für den Check)
create function pg_temp.abgelehnt(r text) returns boolean language sql as $$
  select r like 'fehler %' and r not like '%unbekannte Aktion%'
$$;

-- Anweisung als postgres; Ergebnis «ok» oder der SQLSTATE
create function pg_temp.sqlstate_von(anweisung text) returns text language plpgsql as $$
begin
  execute anweisung;
  return 'ok';
exception when others then
  return sqlstate;
end $$;

-- Quelle der Recherche als jsonb (erfunden, keine Personendaten)
create function pg_temp.rq(id text, klasse text default 'peer_review', methode text default 'dwc') returns jsonb
language sql as $$
  select jsonb_build_object('quelle_id', id, 'titel', 'Hydroponik-Versuch ' || id,
                            'link', 'https://forschung.example.invalid/' || id, 'klasse', klasse,
                            'anbaumethode', methode, 'abgerufen_am', '2027-01-15')
$$;

-- Recherche-Wert als jsonb
create function pg_temp.rw(art text, phase text, groesse text, wmin numeric, wtyp numeric, wmax numeric,
                           q jsonb, evidenz text default 'B1', extra jsonb default '{}') returns jsonb
language sql as $$
  select jsonb_build_object('art_id', art, 'phase', phase, 'groesse', groesse, 'wert_min', wmin, 'wert_typ', wtyp,
                            'wert_max', wmax, 'system_quelle', 'dwc', 'umgebung_quelle', 'indoor_led',
                            'fundstelle', 'Tabelle 2', 'kurzzitat', 'Im DWC-Versuch lag der Wert im Band.',
                            'evidenzklasse', evidenz, 'app_version', 'pgtap', 'quelle', q) || extra
$$;

-- Recherche-Saatempfehlung als jsonb
create function pg_temp.rs(sorte uuid, kulturform text, klasse text, q jsonb) returns jsonb language sql as $$
  select jsonb_build_object('sorte_id', sorte, 'kulturform', kulturform, 'samen_je_schwamm', 3,
                            'obergrenze_samen', 4, 'pflanzen_stehen_lassen', 1, 'klasse_saatmenge', klasse,
                            'substrat_passung', 'Steinwollwürfel 2.5 cm', 'begruendung', 'Hydroponische Quelle',
                            'fundstelle', 'Abschnitt 3', 'kurzzitat', 'Drei Samen je Würfel im NFT-Versuch.',
                            'app_version', 'pgtap', 'quelle', q)
$$;

-- ---------------------------------------------------------------------
-- Fixtures als postgres
-- ---------------------------------------------------------------------

insert into auth.users (id) values
  ('00000000-0000-4000-8000-00000000000a'), ('00000000-0000-4000-8000-00000000000b')
  on conflict (id) do nothing;
insert into public.zugang (user_id, app_version) values ('00000000-0000-4000-8000-00000000000a', 'pgtap')
  on conflict do nothing;

insert into public.pflichtgroesse (phase, groesse, mindestens_art, app_version) values
  ('keimung', 'anwendbar', false, 'pgtap'), ('keimung', 'dauer', true, 'pgtap'), ('keimung', 'bbch', false, 'pgtap'),
  ('keimung', 'wechselmerkmal', false, 'pgtap'), ('keimung', 'keimart', false, 'pgtap'),
  ('keimung', 'keimtemp', false, 'pgtap'),
  ('anzucht', 'anwendbar', false, 'pgtap'), ('anzucht', 'dauer', true, 'pgtap'), ('anzucht', 'bbch', false, 'pgtap'),
  ('anzucht', 'wechselmerkmal', false, 'pgtap'), ('anzucht', 'ph', true, 'pgtap'), ('anzucht', 'ec', true, 'pgtap'),
  ('wachstum', 'anwendbar', false, 'pgtap'), ('wachstum', 'dauer', true, 'pgtap'), ('wachstum', 'bbch', false, 'pgtap'),
  ('wachstum', 'wechselmerkmal', false, 'pgtap'), ('wachstum', 'ph', true, 'pgtap'), ('wachstum', 'ec', true, 'pgtap')
  on conflict (phase, groesse) do nothing;

insert into public.quelle (quelle_id, titel, link, klasse, anbaumethode, app_version) values
  ('pgtap15-w0', 'Testquelle W0', 'https://example.invalid/w0', 'peer_review', 'dwc', 'pgtap');
insert into public.art_schluessel (art_id) values ('pgtap15_leit'), ('pgtap15_salat'), ('pgtap15_kraut');
insert into public.kulturgruppe (kulturgruppe_id, name, leitkultur_art_id, ec_obergrenze_validator, app_version)
  values ('pgtap15_kg', 'Testgruppe Blatt', 'pgtap15_leit', 2.0, 'pgtap');
insert into public.art (art_id, name_de, name_wiss, kulturgruppe_id, kulturformen_erlaubt, kulturform_vorgabe,
                        quelldatei, zeile_id, commit, app_version) values
  ('pgtap15_leit', 'Leitblatt', 'Testus ducens', 'pgtap15_kg', '{schnitt}', 'schnitt', 'art.csv', 'art.pgtap15_leit',
   'pgtap', 'pgtap'),
  ('pgtap15_salat', 'Testsalat', 'Testus lactucoides', 'pgtap15_kg', '{schnitt}', 'schnitt', 'art.csv',
   'art.pgtap15_salat', 'pgtap', 'pgtap'),
  ('pgtap15_kraut', 'Testkraut', 'Testus herbaceus', 'pgtap15_kg', '{kopf}', 'kopf', 'art.csv', 'art.pgtap15_kraut',
   'pgtap', 'pgtap');

-- anwendbar auf Ebene Kulturgruppe (Klasse D in v_sollwert → Prüfauftrag)
insert into public.profilwert (ebene, kulturgruppe_id, phase, groesse, text_wert, quelle_id, fundstelle, kurzzitat,
                               evidenzklasse, quelldatei, zeile_id, commit, app_version) values
  ('kulturgruppe', 'pgtap15_kg', 'keimung', 'anwendbar', 'ja', 'pgtap15-w0', 'S. 1', 'Zitat', 'C', 'profilwert.csv',
   'pw.pgtap15_kg.keimung.anwendbar', 'pgtap', 'pgtap'),
  ('kulturgruppe', 'pgtap15_kg', 'anzucht', 'anwendbar', 'ja', 'pgtap15-w0', 'S. 1', 'Zitat', 'C', 'profilwert.csv',
   'pw.pgtap15_kg.anzucht.anwendbar', 'pgtap', 'pgtap'),
  ('kulturgruppe', 'pgtap15_kg', 'wachstum', 'anwendbar', 'ja', 'pgtap15-w0', 'S. 1', 'Zitat', 'C', 'profilwert.csv',
   'pw.pgtap15_kg.wachstum.anwendbar', 'pgtap', 'pgtap');
-- Dauer und EC Wachstum nur auf Ebene Kulturgruppe: für die Pflicht «mindestens Art» fehlend (R1.4)
insert into public.profilwert (ebene, kulturgruppe_id, phase, groesse, wert_min, wert_typ, wert_max, ec_einheit_quelle,
                               ec_basis_quelle, quelle_id, fundstelle, kurzzitat, evidenzklasse, quelldatei, zeile_id,
                               commit, app_version) values
  ('kulturgruppe', 'pgtap15_kg', 'wachstum', 'dauer', 14, 21, 28, null, null, 'pgtap15-w0', 'S. 2', 'Zitat', 'C',
   'profilwert.csv', 'pw.pgtap15_kg.wachstum.dauer', 'pgtap', 'pgtap'),
  ('kulturgruppe', 'pgtap15_kg', 'wachstum', 'ec', 1.0, 1.3, 1.6, 'mS/cm', 'gesamt', 'pgtap15-w0', 'S. 2', 'Zitat', 'C',
   'profilwert.csv', 'pw.pgtap15_kg.wachstum.ec', 'pgtap', 'pgtap');

-- W0-Zeilen der Art pgtap15_salat und pgtap15_kraut (B1, ohne Vermerk)
insert into public.profilwert (ebene, art_id, phase, groesse, wert_min, wert_typ, wert_max, text_wert,
                               ec_einheit_quelle, ec_basis_quelle, quelle_id, fundstelle, kurzzitat, evidenzklasse,
                               quelldatei, zeile_id, commit, app_version)
select 'art', a.art_id, z.phase::public.phase, z.groesse::public.groesse, z.wmin, z.wtyp, z.wmax, z.txt, z.einheit::public.ec_einheit,
       z.basis::public.ec_basis, 'pgtap15-w0', 'S. 3', 'Zitat', 'B1', 'profilwert.csv',
       'pw.' || a.art_id || '.' || z.phase || '.' || z.groesse, 'pgtap', 'pgtap'
  from (values ('pgtap15_salat'), ('pgtap15_kraut')) a(art_id),
       (values ('keimung', 'dauer', 3.0, 5.0, 8.0, null, null, null),
               ('keimung', 'bbch', 0.0, null, 9.0, null, null, null),
               ('keimung', 'wechselmerkmal', null, null, null, 'Keimblätter offen', null, null),
               ('keimung', 'keimart', null, null, null, 'licht', null, null),
               ('keimung', 'keimtemp', 15.0, 18.0, 20.0, null, null, null),
               ('anzucht', 'dauer', 10.0, 14.0, 18.0, null, null, null),
               ('anzucht', 'bbch', 10.0, null, 12.0, null, null, null),
               ('anzucht', 'wechselmerkmal', null, null, null, 'zweites echtes Blatt', null, null),
               ('anzucht', 'ph', 5.8, null, 6.2, null, null, null),
               ('anzucht', 'ec', 0.8, null, 1.2, null, 'mS/cm', 'gesamt'),
               ('wachstum', 'bbch', 13.0, null, 19.0, null, null, null),
               ('wachstum', 'ph', 5.8, null, 6.4, null, null, null))
         z(phase, groesse, wmin, wtyp, wmax, txt, einheit, basis);

-- Unbestätigte W0-Saatempfehlung der Art pgtap15_kraut (für A5)
insert into public.saatempfehlung (ebene, art_id, kulturform, samen_je_schwamm, obergrenze_samen, klasse_saatmenge,
                                   begruendung, quelle_id, fundstelle, kurzzitat, quelldatei, zeile_id, commit, app_version)
  values ('art', 'pgtap15_kraut', 'kopf', 2, 3, 'C', 'W0', 'pgtap15-w0', 'S. 4', 'Zitat', 'saatempfehlung.csv',
          'se.pgtap15_kraut.kopf', 'pgtap', 'pgtap');

-- ---------------------------------------------------------------------
-- UC4-AK4 Sorte aus der App mit Packung und Feldprotokoll
-- ---------------------------------------------------------------------

select is(
  pg_temp.tim('sorte_neu', '{"sorte_id":"15000000-0000-4000-8000-000000000001","name":"Testsorte Rot","art_id":"pgtap15_salat","kulturtyp":"blatt","app_version":"pgtap"}'),
  '15000000-0000-4000-8000-000000000001', 'UC4-AK4 sorte_neu legt die Sorte mit Art und Kulturtyp an');
select matches(
  pg_temp.tim('tuetenwert', '{"sorte_id":"15000000-0000-4000-8000-000000000001","groesse":"keimart","text_wert":"licht","app_version":"pgtap"}'),
  '^[0-9a-f-]{36}$', 'UC4-AK4 tuetenwert Keimart der Tüte gespeichert (Klasse C, Vermerk tuete)');

select pg_temp.als('authenticated', '00000000-0000-4000-8000-00000000000a');
insert into public.saatgut (id, client_id, sorte_id, kaufdatum, bestand_korn, keimfaehigkeit_packung, app_version)
  values ('15000000-0000-4000-8000-000000000101', '15000000-0000-4000-8000-000000000111',
          '15000000-0000-4000-8000-000000000001', '2027-01-10', 180, 0.85, 'pgtap');
insert into public.ki_feldprotokoll (client_id, sorte_id, saatgut_id, feld, wert_ki, wert_final, status, modell, dauer_ms,
                                     fotopfad, app_version)
select ('15000000-0000-4000-8000-0000000002' || lpad(n::text, 2, '0'))::uuid, '15000000-0000-4000-8000-000000000001',
       '15000000-0000-4000-8000-000000000101', f::public.ki_feld,
       case when f = 'aussaatfenster' then null else 'KI ' || f end,
       case when f = 'aussaatfenster' then null when f = 'hersteller' then 'Beispiel Saaten' else 'KI ' || f end,
       case when f = 'aussaatfenster' then 'leer' when f = 'hersteller' then 'geaendert' else 'uebernommen' end::public.ki_status,
       'claude-haiku-5-5', 4200, '15000000-0000-4000-8000-000000000001/15000000-0000-4000-8000-000000000301.jpg', 'pgtap'
  from unnest(enum_range(null::public.ki_feld)::text[]) with ordinality u(f, n);
reset role;

select is(
  (select fehlende_groessen || ' fehlend, vollständig ' || vollstaendig
     from public.v_vollstaendigkeit where sorte_id = '15000000-0000-4000-8000-000000000001'),
  '2 fehlend, vollständig false',
  'UC4-AK4 vor der Recherche: Dauer und EC Wachstum fehlen, ohne Saatempfehlung unvollständig (R1.4)');

select matches(
  pg_temp.tim('recherche_wert', pg_temp.rw('pgtap15_salat', 'wachstum', 'dauer', 21, 28, 35, pg_temp.rq('recherche-0000a001'))),
  '^[0-9a-f-]{36}$', 'UC4-AK8 recherche_wert Dauer Wachstum ergänzt');
select matches(
  pg_temp.tim('recherche_wert', pg_temp.rw('pgtap15_salat', 'wachstum', 'ec', 1.2, 1.4, 1.6, pg_temp.rq('recherche-0000a001'),
              'B1', '{"ec_min_quelle":1200,"ec_max_quelle":1600,"ec_einheit_quelle":"µS/cm","ec_basis_quelle":"gesamt"}')),
  '^[0-9a-f-]{36}$', 'UC4-AK8 recherche_wert EC Wachstum mit derselben Quelle ergänzt (Quelle nur einmal)');

select is(
  (select fehlende_groessen || ' fehlend, vollständig ' || vollstaendig
     from public.v_vollstaendigkeit where sorte_id = '15000000-0000-4000-8000-000000000001'),
  '0 fehlend, vollständig false',
  'UC4-AK4 nach recherche_wert keine Lücke mehr, ohne bestätigte Saatempfehlung weiter unvollständig');

-- Zweite Sorte derselben Art: Saatempfehlung D von Hand
select is(
  pg_temp.tim('sorte_neu', '{"sorte_id":"15000000-0000-4000-8000-000000000002","name":"Testsorte Gruen","art_id":"pgtap15_salat","kulturtyp":"blatt","app_version":"pgtap"}'),
  '15000000-0000-4000-8000-000000000002', 'UC4-AK4 zweite Sorte derselben Art angelegt');
select pg_temp.als('authenticated', '00000000-0000-4000-8000-00000000000a');
insert into public.saatgut (client_id, sorte_id, kaufdatum, bestand_korn, keimfaehigkeit_packung, app_version)
  values ('15000000-0000-4000-8000-000000000112', '15000000-0000-4000-8000-000000000002', '2027-01-10', 200, 0.9, 'pgtap');
reset role;
select matches(
  pg_temp.tim('saatempfehlung_neu', '{"sorte_id":"15000000-0000-4000-8000-000000000002","kulturform":"schnitt","samen_je_schwamm":3,"klasse_saatmenge":"D","app_version":"pgtap"}'),
  '^[0-9a-f-]{36}$', 'UC4-AK4 Saatempfehlung D von Hand ohne Bestätigung angelegt');
select is(
  (select vollstaendig from public.v_vollstaendigkeit where sorte_id = '15000000-0000-4000-8000-000000000002'),
  false, 'UC4-AK4 Saatempfehlung D von Hand ohne Bestätigung → unvollständig');
select matches(
  pg_temp.tim('saatempfehlung_bestaetigen', (select jsonb_build_object('saatempfehlung_id', se.id, 'app_version', 'pgtap')
                                               from public.saatempfehlung se
                                              where se.sorte_id = '15000000-0000-4000-8000-000000000002'
                                                and se.gueltig_bis is null)),
  '^[0-9a-f-]{36}$', 'UC4-AK4 saatempfehlung_bestaetigen');
select is(
  (select vollstaendig from public.v_vollstaendigkeit where sorte_id = '15000000-0000-4000-8000-000000000002'),
  true, 'UC4-AK4 Saatempfehlung D von Hand nach saatempfehlung_bestaetigen vollständig');

-- Saatempfehlung aus der Recherche für die erste Sorte: Art ohne gültige Zeile → Ebene Art, bestätigt
select matches(
  pg_temp.tim('recherche_saatempfehlung', pg_temp.rs('15000000-0000-4000-8000-000000000001', 'schnitt', 'B',
                                                     pg_temp.rq('recherche-0000a002', 'universitaet_beratung', 'nft'))),
  '^[0-9a-f-]{36}$', 'UC4-AK8 recherche_saatempfehlung Klasse B angelegt');

select is(
  (select format('vollständig %s, %s fehlend, Prüfaufträge = Werte mit Klasse D %s, mindestens die drei anwendbar %s',
                 v.vollstaendig::text, v.fehlende_groessen, (v.pruefauftraege = d.n)::text, (v.pruefauftraege >= 3)::text)
     from public.v_vollstaendigkeit v,
          lateral (select count(*) as n from public.v_sollwert s
                    where s.sorte_id = v.sorte_id and s.evidenzklasse = 'D'
                      and s.phase in ('keimung', 'anzucht', 'wachstum')
                      and (s.groesse in ('wassertemp', 'licht_h')
                           or exists (select 1 from public.pflichtgroesse pg where pg.phase = s.phase and pg.groesse = s.groesse))
                      and not (s.phase = 'wachstum' and s.groesse = 'wechselmerkmal')) d
    where v.sorte_id = '15000000-0000-4000-8000-000000000001'),
  'vollständig true, 0 fehlend, Prüfaufträge = Werte mit Klasse D true, mindestens die drei anwendbar true',
  'UC4-AK4 Sorte aus der App mit Art, Kulturtyp, Packung, Feldprotokoll und Saatempfehlung aus der Recherche ist vollständig, ohne bestätigte Saatempfehlung nicht; Prüfaufträge gezählt');

select is(
  (select string_agg(format('%s %s %s %s %s %s', so.name, so.art_id, so.kulturtyp,
                            (select string_agg(se.klasse_saatmenge || ' ' || coalesce(se.quelle_id, '-'), ',' order by se.ebene)
                               from public.saatempfehlung se
                              where se.gueltig_bis is null and se.bestaetigt_am is not null
                                and (se.sorte_id = so.sorte_id or se.art_id = so.art_id)),
                            (select count(*) from public.saatgut sg where sg.sorte_id = so.sorte_id and sg.storniert_am is null),
                            (select count(*) from public.ki_feldprotokoll kf where kf.sorte_id = so.sorte_id)),
                     '; ' order by so.name)
     from public.sorte so
    where so.sorte_id in ('15000000-0000-4000-8000-000000000001', '15000000-0000-4000-8000-000000000002')
      and so.gueltig_bis is null),
  'Testsorte Gruen pgtap15_salat blatt D -,B recherche-0000a002 1 0; '
  || 'Testsorte Rot pgtap15_salat blatt B recherche-0000a002 1 8',
  'UC4-AK4 jede Sorte der Fixture: Art, Kulturtyp, bestätigte Saatempfehlung mit Klasse und Quelle bei A bis C, Packung; Feldprotokoll mit acht Feldern bei KI');

-- ---------------------------------------------------------------------
-- UC4-AK8 recherche_wert
-- ---------------------------------------------------------------------

select is(
  (select format('%s %s %s %s %s %s %s %s | %s %s %s', pw.ebene, pw.art_id, pw.vermerk::text, pw.evidenzklasse,
                 pw.quelldatei, pw.zeile_id, coalesce(pw.freigegeben_am::text, 'leer'), pw.wert_typ,
                 q.klasse, q.anbaumethode, q.link)
     from public.profilwert pw join public.quelle q on q.quelle_id = pw.quelle_id
    where pw.art_id = 'pgtap15_salat' and pw.phase = 'wachstum' and pw.groesse = 'dauer' and pw.gueltig_bis is null),
  'art pgtap15_salat recherche B1 app pw.recherche.pgtap15_salat.wachstum.dauer leer 28.000 | peer_review dwc https://forschung.example.invalid/recherche-0000a001',
  'UC4-AK8 recherche_wert legt Quelle und profilwert Ebene Art mit Vermerk recherche, quelldatei app, freigegeben_am leer an');

select is(
  pg_temp.tim('recherche_wert', pg_temp.rw('pgtap15_salat', 'keimung', 'dauer', 2, 4, 6, pg_temp.rq('recherche-0000a003')))
  || ' | ' || (select count(*) || ' gültig, ' || string_agg(vermerk::text || ' ' || wert_typ, ',')
                 from public.profilwert where art_id = 'pgtap15_salat' and phase = 'keimung' and groesse = 'dauer'
                  and gueltig_bis is null),
  'null | 1 gültig, keine 5.000',
  'UC4-AK8 recherche_wert bei bestehender W0-Zeile derselben Grösse: null, W0-Zeile unverändert gültig');

select is(
  pg_temp.tim('recherche_wert', pg_temp.rw('pgtap15_salat', 'wachstum', 'dauer', 20, 25, 30, pg_temp.rq('recherche-0000a004')))
  || ' | ' || (select count(*) || ' gültig, ' || string_agg(vermerk::text || ' ' || wert_typ, ',')
                 from public.profilwert where art_id = 'pgtap15_salat' and phase = 'wachstum' and groesse = 'dauer'
                  and ebene = 'art' and gueltig_bis is null),
  'null | 1 gültig, recherche 28.000',
  'UC4-AK8 zweiter recherche_wert derselben Grösse: null, eine gültige Zeile');

select ok(
  pg_temp.abgelehnt(pg_temp.tim('recherche_wert', pg_temp.rw('pgtap15_kraut', 'wachstum', 'dauer', 21, 28, 35,
                                                             pg_temp.rq('recherche-0000a005'), 'A')))
  and pg_temp.abgelehnt(pg_temp.tim('recherche_wert', pg_temp.rw('pgtap15_kraut', 'wachstum', 'dauer', 21, 28, 35,
                                                                 pg_temp.rq('recherche-0000a006', 'tuete', 'dwc'))))
  and pg_temp.abgelehnt(pg_temp.tim('recherche_wert', pg_temp.rw('pgtap15_kraut', 'wachstum', 'dauer', 21, 28, 35,
                                                                 pg_temp.rq('recherche-0000a007', 'praxis', 'keine'))))
  and (select count(*) from public.profilwert where art_id = 'pgtap15_kraut' and phase = 'wachstum' and groesse = 'dauer'
          and ebene = 'art') = 0
  and (select count(*) from public.quelle where quelle_id in ('recherche-0000a005', 'recherche-0000a006', 'recherche-0000a007')) = 0,
  'UC4-AK8 recherche_wert mit Evidenz A, Quellenklasse tuete oder Anbaumethode keine scheitert');

select is(
  (select r like 'fehler 23514%' or (pg_temp.abgelehnt(r) and r like '%ph%')
     from (select pg_temp.tim('recherche_wert', pg_temp.rw('pgtap15_kraut', 'wachstum', 'ph', 4.8, 5.2, 5.6,
                                                           pg_temp.rq('recherche-0000a008'))) as r) x)
  and (select count(*) from public.profilwert where art_id = 'pgtap15_kraut' and phase = 'wachstum' and groesse = 'ph'
          and vermerk::text = 'recherche') = 0,
  true, 'UC4-AK8 recherche_wert mit pH 4.8 scheitert am Check (Validator 9.4)');

-- ---------------------------------------------------------------------
-- UC4-AK8 recherche_saatempfehlung
-- ---------------------------------------------------------------------

select is(
  (select format('%s %s %s %s %s', se.ebene, se.klasse_saatmenge, (se.bestaetigt_am = public.kalendertag(now()))::text,
                 se.quelle_id, se.kurzzitat)
     from public.saatempfehlung se
    where se.art_id = 'pgtap15_salat' and se.kulturform = 'schnitt' and se.gueltig_bis is null),
  'art B true recherche-0000a002 Drei Samen je Würfel im NFT-Versuch.',
  'UC4-AK8 recherche_saatempfehlung setzt bestaetigt_am auf den Zürcher Kalendertag');

select is(
  pg_temp.tim('sorte_neu', '{"sorte_id":"15000000-0000-4000-8000-000000000003","name":"Testsorte Kraut","art_id":"pgtap15_kraut","kulturtyp":"blatt","app_version":"pgtap"}'),
  '15000000-0000-4000-8000-000000000003', 'UC4-AK8 Sorte der Art mit unbestätigter W0-Saatempfehlung angelegt');

select ok(
  pg_temp.abgelehnt(pg_temp.tim('recherche_saatempfehlung', pg_temp.rs('15000000-0000-4000-8000-000000000003', 'kopf', 'A',
                                                                       pg_temp.rq('recherche-0000a009'))))
  and pg_temp.abgelehnt(pg_temp.tim('recherche_saatempfehlung', pg_temp.rs('15000000-0000-4000-8000-000000000003', 'kopf', 'D',
                                                                           pg_temp.rq('recherche-0000a009'))))
  and (select count(*) from public.saatempfehlung where sorte_id = '15000000-0000-4000-8000-000000000003') = 0
  -- Gegenprobe: dieselbe Anfrage mit Klasse C gelingt (sonst wäre die Ablehnung kein Beleg)
  and pg_temp.tim('recherche_saatempfehlung', pg_temp.rs('15000000-0000-4000-8000-000000000003', 'kopf', 'C',
                                                        pg_temp.rq('recherche-0000a009'))) ~ '^[0-9a-f-]{36}$',
  'UC4-AK8 recherche_saatempfehlung Klasse A und D scheitern, Klasse C gelingt');

select is(
  (select string_agg(format('%s %s %s %s', se.ebene, se.klasse_saatmenge, (se.bestaetigt_am is not null)::text, se.zeile_id), ', '
                     order by se.ebene)
     from public.saatempfehlung se
    where se.gueltig_bis is null and se.kulturform = 'kopf'
      and (se.art_id = 'pgtap15_kraut' or se.sorte_id = '15000000-0000-4000-8000-000000000003')),
  'sorte C true se.app-15000000-0000-4000-8000-000000000003.kopf, art C false se.pgtap15_kraut.kopf',
  'UC4-AK8 recherche_saatempfehlung bei unbestätigter Art-Zeile aus W0 → Ebene Sorte, W0-Zeile unverändert (A5)');

-- ---------------------------------------------------------------------
-- UC4-AK8 Katalogquelle bei sorte_neu (A12)
-- ---------------------------------------------------------------------

-- eigener Aufruf vorab, damit die Prüfung danach die Schreibvorgänge sieht
create temp table pgtap15_katalog as select pg_temp.tim('sorte_neu', '{"sorte_id":"15000000-0000-4000-8000-000000000004","name":"Testsorte Katalog","art_id":"pgtap15_salat","kulturtyp":"blatt","wuchshoehe_max_mm":450,"wuchsform":"rosette","katalog_link":"https://katalog.example.invalid/testsorte","app_version":"pgtap"}') as r;

select is(
  (select r from pgtap15_katalog)
  || ' | ' || coalesce((select q.klasse || ' ' || q.anbaumethode || ' ' || q.link from public.quelle q
                         where q.quelle_id = 'katalog-app-15000000-0000-4000-8000-000000000004'), 'keine Quelle')
  || ' | ' || coalesce((select string_agg(h.feld || ' ' || h.evidenzklasse || ' ' || h.vermerk || ' ' || h.quelle_id, ', '
                                          order by h.feld)
                          from public.herkunft h
                         where h.tabelle = 'sorte' and h.zeile_id = 'app-15000000-0000-4000-8000-000000000004'
                           and h.gueltig_bis is null), 'keine Herkunft'),
  '15000000-0000-4000-8000-000000000004 | katalog keine https://katalog.example.invalid/testsorte | '
  || 'wuchsform C katalog katalog-app-15000000-0000-4000-8000-000000000004, '
  || 'wuchshoehe_max_mm C katalog katalog-app-15000000-0000-4000-8000-000000000004',
  'UC4-AK8 sorte_neu mit katalog_link legt Quelle katalog-<sorte_key> und Herkunft Klasse C Vermerk katalog an (A12)');

-- ---------------------------------------------------------------------
-- UC4-AK8 Zugriff und ki_aufruf.zweck
-- ---------------------------------------------------------------------

select ok(
  pg_temp.wissen('anon', null, 'recherche_wert',
                 pg_temp.rw('pgtap15_kraut', 'wachstum', 'dauer', 21, 28, 35, pg_temp.rq('recherche-0000a010'))) like 'fehler 42501%'
  and pg_temp.wissen('authenticated', '00000000-0000-4000-8000-00000000000b', 'recherche_wert',
                     pg_temp.rw('pgtap15_kraut', 'wachstum', 'dauer', 21, 28, 35, pg_temp.rq('recherche-0000a010'))) like 'fehler P0001: nicht erlaubt%'
  and pg_temp.wissen('authenticated', '00000000-0000-4000-8000-00000000000b', 'recherche_saatempfehlung',
                     pg_temp.rs('15000000-0000-4000-8000-000000000003', 'kopf', 'B', pg_temp.rq('recherche-0000a010'))) like 'fehler P0001: nicht erlaubt%'
  and (select count(*) from public.quelle where quelle_id = 'recherche-0000a010') = 0,
  'UC4-AK8 wissen_app_schreiben als anon und als zweites Konto scheitert');

select is(
  concat_ws(' ',
    pg_temp.sqlstate_von($$insert into public.ki_aufruf (modell, status, zweck, app_version) values ('claude-sonnet-5-5', 'gestartet', 'recherche', 'pgtap')$$),
    pg_temp.sqlstate_von($$insert into public.ki_aufruf (modell, status, zweck, app_version) values ('claude-sonnet-5-5', 'gestartet', 'quellenpruefer', 'pgtap')$$),
    pg_temp.sqlstate_von($$insert into public.ki_aufruf (modell, status, zweck, app_version) values ('claude-haiku-5-5', 'gestartet', 'tuete', 'pgtap')$$),
    pg_temp.sqlstate_von($$insert into public.ki_aufruf (modell, status, zweck, app_version) values ('claude-haiku-5-5', 'gestartet', null, 'pgtap')$$),
    pg_temp.sqlstate_von($$insert into public.ki_aufruf (modell, status, zweck, app_version) values ('claude-haiku-5-5', 'gestartet', 'andere', 'pgtap')$$)),
  'ok ok ok ok 23514',
  'UC4-AK8 ki_aufruf.zweck nimmt nur tuete, recherche, quellenpruefer oder leer');

select is(
  (select count(*)::int from pg_enum e join pg_type t on t.oid = e.enumtypid
    where t.typname = 'vermerk' and t.typnamespace = 'public'::regnamespace and e.enumlabel = 'recherche'),
  1, 'UC4-AK8 Enum vermerk kennt recherche (E8)');

select * from finish();
rollback;
