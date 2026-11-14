-- 00_zugriff.test.sql · UC0-AK2 Zugriff (Konzept 8.1 Regel 6, 11.6; 06_tests.md Abschnitt 9; Plan 9)
-- Schleifen über information_schema.tables und pg_proc: jede künftige Tabelle, Sicht oder Funktion
-- wird ohne Teständerung mitgeprüft; die Planzahl folgt aus denselben Zählungen.
-- Konten nur synthetisch (UUID ohne E-Mail-Adresse): Tim …000a, fremdes Konto …000b.
begin;
create extension if not exists pgtap with schema extensions;
-- Die Datenbank läuft in UTC wie in Supabase; alle Zeitpunkte stehen ausdrücklich in Europe/Zurich.
set local timezone to 'UTC';

-- ---------------------------------------------------------------------
-- Hilfsfunktionen (nur in dieser Sitzung)
-- ---------------------------------------------------------------------

-- Rolle und Nutzer setzen (bis zum Ende der Testtransaktion oder bis reset role)
create function pg_temp.als(rolle text, sub uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub', sub, 'role', rolle)::text, true);
  execute format('set local role %I', rolle);
end $$;

-- Anweisung als Rolle ausführen; Ergebnis «ok <Zeilen>» oder der SQLSTATE des Fehlers
create function pg_temp.ausfuehren_als(rolle text, sub uuid, anweisung text) returns text language plpgsql as $$
declare
  ergebnis text;
  n bigint;
begin
  perform pg_temp.als(rolle, sub);
  begin
    execute anweisung;
    get diagnostics n = row_count;
    ergebnis := 'ok ' || n;
  exception when others then
    ergebnis := sqlstate;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return ergebnis;
end $$;

-- Abfrage (ein Wert) als Rolle; Fehler ergeben «Fehler <SQLSTATE>»
create function pg_temp.zaehle_als(rolle text, sub uuid, abfrage text) returns text language plpgsql as $$
declare
  ergebnis text;
begin
  perform pg_temp.als(rolle, sub);
  begin
    execute abfrage into ergebnis;
  exception when others then
    ergebnis := 'Fehler ' || sqlstate;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return ergebnis;
end $$;

-- Anweisung als Rolle, danach Abfrage als postgres (feste Reihenfolge)
create function pg_temp.ausfuehren_dann(rolle text, sub uuid, anweisung text, abfrage text) returns text language plpgsql as $$
declare
  ergebnis text;
  danach text;
begin
  ergebnis := pg_temp.ausfuehren_als(rolle, sub, anweisung);
  execute abfrage into danach;
  return ergebnis || ', ' || coalesce(danach, '(leer)');
end $$;

-- Kern eines Policy-Ausdrucks: «ist_tim()» und «( SELECT ist_tim() AS ist_tim)» ergeben «ist_tim»
create function pg_temp.kern(ausdruck text) returns text language sql immutable as $$
  select regexp_replace(regexp_replace(replace(replace(ausdruck, 'public.', ''), ' ', ''), '[()]', '', 'g'),
                        '^SELECT|ASist_tim$', '', 'g')
$$;

create temp view tabellen as
  select table_name::text as name from information_schema.tables
   where table_schema = 'public' and table_type = 'BASE TABLE';
create temp view sichten as
  select table_name::text as name from information_schema.tables
   where table_schema = 'public' and table_type = 'VIEW';
create temp view funktionen as
  select p.oid, p.proname::text as name, pg_get_function_identity_arguments(p.oid) as argumente,
         p.prosecdef, p.proconfig
    from pg_proc p where p.pronamespace = 'public'::regnamespace;
-- Wissenstabellen und Serverprotokolle: für Tim nur lesbar (Entwurf Abschnitt 8, Plan 9 «RLS»)
create temp table wissen (name text primary key);
insert into wissen values
  ('quelle'), ('art_schluessel'), ('kulturgruppe'), ('art'), ('art_kulturform'), ('kulturform_profilende'),
  ('herkunft'), ('sorte_schluessel'), ('sorte'), ('profilwert'), ('pflichtgroesse'), ('saatempfehlung'),
  ('produkt'), ('duengerschema'), ('wissenseintrag'), ('auswertung_fenster'), ('aufgabe_tagesliste'),
  ('backup_status'), ('zugang'), ('ki_aufruf');

select plan(
    7 * (select count(*)::int from tabellen)
  + (select count(*)::int from sichten)
  + (select count(*)::int from funktionen where prosecdef)
  + (select count(*)::int from funktionen)
  + (select count(*)::int from wissen)
  + 15);

-- ---------------------------------------------------------------------
-- Fixtures als postgres: mindestens eine Zeile je Tabelle, damit «0 Zeilen» etwas aussagt
-- ---------------------------------------------------------------------

insert into auth.users (id) values
  ('00000000-0000-4000-8000-00000000000a'), ('00000000-0000-4000-8000-00000000000b')
  on conflict (id) do nothing;
insert into public.zugang (user_id, app_version) values ('00000000-0000-4000-8000-00000000000a', 'pgtap');

-- Wissen (eigene Schlüssel, damit spätere Seed-Daten nicht kollidieren)
insert into public.quelle (quelle_id, titel, link, klasse, anbaumethode, app_version)
  values ('pgtap-q1', 'Testquelle', 'https://example.invalid/q1', 'peer_review', 'dwc', 'pgtap');
insert into public.art_schluessel (art_id) values ('pgtap_art_a');
insert into public.kulturgruppe (kulturgruppe_id, name, leitkultur_art_id, ec_obergrenze_validator, app_version)
  values ('pgtap_kg', 'Testgruppe', 'pgtap_art_a', 2.0, 'pgtap');
insert into public.art (art_id, name_de, name_wiss, kulturgruppe_id, quelldatei, zeile_id, commit, app_version)
  values ('pgtap_art_a', 'Testart A', 'Testus primus', 'pgtap_kg', 'art.csv', 'art.pgtap_art_a', 'pgtap', 'pgtap');
insert into public.art_kulturform (art_id, kulturform, ernteart, quelldatei, zeile_id, commit, app_version)
  values ('pgtap_art_a', 'schnitt', 'mehrfach', 'art.csv', 'ak.pgtap_art_a.schnitt', 'pgtap', 'pgtap');
insert into public.kulturform_profilende (kulturform, profil_ende, app_version)
  values ('schnitt', 'wachstum', 'pgtap') on conflict (kulturform) do nothing;
insert into public.herkunft (tabelle, zeile_id, feld, quelle_id, fundstelle, kurzzitat, evidenzklasse, app_version)
  values ('art', 'art.pgtap_art_a', 'name_de', 'pgtap-q1', 'S. 1', 'Zitat', 'C', 'pgtap');
insert into public.sorte_schluessel (id, sorte_key) values ('f0000000-0000-4000-8000-000000000101', 'pgtap-sorte-a');
insert into public.sorte (sorte_id, name, art_id, kulturtyp, quelldatei, zeile_id, commit, app_version)
  values ('f0000000-0000-4000-8000-000000000101', 'Testsorte A', 'pgtap_art_a', 'blatt', 'sorten.csv', 'pgtap-sorte-a', 'pgtap', 'pgtap');
insert into public.profilwert (ebene, art_id, phase, groesse, wert_min, wert_max, quelle_id, fundstelle, kurzzitat,
                               evidenzklasse, quelldatei, zeile_id, commit, app_version)
  values ('art', 'pgtap_art_a', 'wachstum', 'ph', 5.8, 6.5, 'pgtap-q1', 'S. 2', 'Zitat', 'B1', 'profilwert.csv',
          'pw.pgtap_art_a.wachstum.ph', 'pgtap', 'pgtap');
insert into public.pflichtgroesse (phase, groesse, app_version) values ('wachstum', 'ph', 'pgtap')
  on conflict (phase, groesse) do nothing;
insert into public.saatempfehlung (ebene, art_id, kulturform, samen_je_schwamm, obergrenze_samen, klasse_saatmenge,
                                   begruendung, quelldatei, zeile_id, commit, app_version)
  values ('art', 'pgtap_art_a', 'schnitt', 2, 3, 'D', 'Standard, nicht belegt', 'saatempfehlung.csv',
          'se.pgtap_art_a.schnitt', 'pgtap', 'pgtap');
insert into public.produkt (produkt_id, name, app_version) values ('grow', 'Grow', 'pgtap')
  on conflict (produkt_id) do nothing;
-- geschlossene Fassung, damit der Teilindex je Stadium nie mit dem Seed kollidiert
insert into public.duengerschema (stadium, grow_ml_l, micro_ml_l, bloom_ml_l, summe_ml_l, herkunft, quelle_id, fundstelle,
                                  kurzzitat, quelldatei, zeile_id, commit, gueltig_ab, gueltig_bis, app_version)
  values ('wachstum', 1, 1, 1, 3, 'hersteller', 'pgtap-q1', 'Tabelle', 'Zitat', 'duengerschema.csv', 'ds.pgtap', 'pgtap',
          '2027-01-01 00:00 Europe/Zurich', '2027-01-02 00:00 Europe/Zurich', 'pgtap');
insert into public.wissenseintrag (ebene, typ, text, quelle_id, fundstelle, kurzzitat, evidenzklasse, quelldatei, zeile_id,
                                   commit, app_version)
  values ('allgemein', 'sondenpflege', 'Testtext', 'pgtap-q1', 'S. 3', 'Zitat', 'C', 'wissenseintrag.csv', 'we.pgtap.1',
          'pgtap', 'pgtap');
insert into public.k_faktor (produkt_id, wert, gilt_ab, quelle, app_version)
  values ('grow', 0.3, '2027-01-07 00:00 Europe/Zurich', 'startwert', 'pgtap');
insert into public.auswertung_fenster (name, von, bis, app_version)
  values ('testbetrieb', '2027-01-07 00:00 Europe/Zurich', '2027-04-01 00:00 Europe/Zurich', 'pgtap')
  on conflict (name) do nothing;
insert into public.einstellung (app_version) values ('pgtap') on conflict do nothing;
insert into public.backup_status (letztes_backup_am, app_version) values ('2027-01-10 03:00 Europe/Zurich', 'pgtap');
insert into public.ki_aufruf (modell, status, app_version) values ('testmodell', 'ok', 'pgtap');

-- Betrieb (Anlage R, echt)
insert into public.messgeraet (id, modell, app_version) values ('f0000000-0000-4000-8000-000000000201', 'Testgeraet', 'pgtap');
insert into public.anlage (id, name, kuerzel, datenart, app_version)
  values ('f0000000-0000-4000-8000-000000000301', 'Testregal', 'R', 'echt', 'pgtap');
insert into public.bereich (id, anlage_id, nummer, name, app_version)
  values ('f0000000-0000-4000-8000-000000000311', 'f0000000-0000-4000-8000-000000000301', 2, 'Ebene 2', 'pgtap');
insert into public.platz (id, anlage_id, bereich_id, kennung, rolle, app_version) values
  ('f0000000-0000-4000-8000-000000000321', 'f0000000-0000-4000-8000-000000000301', 'f0000000-0000-4000-8000-000000000311', '2.3', 'gefaess', 'pgtap'),
  ('f0000000-0000-4000-8000-000000000322', 'f0000000-0000-4000-8000-000000000301', null, 'A1', 'anzuchtort', 'pgtap');
insert into public.etikett (code, platz_id, app_version) values ('R-2.3', 'f0000000-0000-4000-8000-000000000321', 'pgtap');
insert into public.gefaessmodell (id, name, form, innen_l_mm, innen_b_mm, innen_h_mm, betriebsvolumen_l, app_version)
  values ('f0000000-0000-4000-8000-000000000331', 'Testbox', 'rechteckig', 400, 300, 170, 9, 'pgtap');
insert into public.deckeltyp (id, name, topfdurchmesser_mm, loecher_je_reihe, app_version)
  values ('f0000000-0000-4000-8000-000000000341', 'Testdeckel', 80, '{2,2,2}', 'pgtap');
insert into public.gefaess (platz_id, gefaessmodell_id, deckeltyp_id, betriebsart, betriebsvolumen_l, intervall_messen_d,
                            intervall_wechseln_d, gueltig_von, app_version)
  values ('f0000000-0000-4000-8000-000000000321', 'f0000000-0000-4000-8000-000000000331', 'f0000000-0000-4000-8000-000000000341',
          'dwc', 9, 2, 14, '2027-01-03 10:00 Europe/Zurich', 'pgtap');
insert into public.anzuchtort (platz_id, typ, position, app_version)
  values ('f0000000-0000-4000-8000-000000000322', 'box_licht', 'vorne', 'pgtap');
insert into public.netztopf (id, anlage_id, kennung, groesse_mm, heim_platz_id, heim_loch_nr, app_version)
  values ('f0000000-0000-4000-8000-000000000351', 'f0000000-0000-4000-8000-000000000301', '2.3.1', 80,
          'f0000000-0000-4000-8000-000000000321', 1, 'pgtap');
insert into public.saatgut (id, sorte_id, app_version)
  values ('f0000000-0000-4000-8000-000000000361', 'f0000000-0000-4000-8000-000000000101', 'pgtap');
insert into public.pflanzvorgang (id, client_id, begonnen_am, gespeichert_am, einstieg, anzahl_pflanzungen, app_version)
  values ('f0000000-0000-4000-8000-000000000371', 'f0000000-0000-4000-8000-000000000372',
          '2027-01-08 09:00 Europe/Zurich', '2027-01-08 09:01 Europe/Zurich', 'heute', 1, 'pgtap');
insert into public.satz (id, client_id, sorte_id, saatgut_id, kulturform, anzuchtort_platz_id, anzahl_schwaemme,
                         samen_je_schwamm, saatdatum, gilt_ab, app_version)
  values ('f0000000-0000-4000-8000-000000000381', 'f0000000-0000-4000-8000-000000000382', 'f0000000-0000-4000-8000-000000000101',
          'f0000000-0000-4000-8000-000000000361', 'schnitt', 'f0000000-0000-4000-8000-000000000322', 1, 2,
          '2027-01-08', '2027-01-08 09:00 Europe/Zurich', 'pgtap');
insert into public.pflanzung (id, client_id, satz_id, pflanzvorgang_id, gilt_ab, app_version)
  values ('f0000000-0000-4000-8000-000000000391', 'f0000000-0000-4000-8000-000000000392', 'f0000000-0000-4000-8000-000000000381',
          'f0000000-0000-4000-8000-000000000371', '2027-01-08 09:00 Europe/Zurich', 'pgtap');
insert into public.reservierung (client_id, pflanzung_id, netztopf_id, umsetzen_vorgabe_am, umsetzen_geplant_am, gilt_ab, app_version)
  values ('f0000000-0000-4000-8000-000000000393', 'f0000000-0000-4000-8000-000000000391', 'f0000000-0000-4000-8000-000000000351',
          '2027-01-20', '2027-01-20', '2027-01-08 09:00 Europe/Zurich', 'pgtap');
insert into public.messung (client_id, platz_id, messgeraet_id, messart, ec, gilt_ab, app_version)
  select gen_random_uuid(), 'f0000000-0000-4000-8000-000000000321', 'f0000000-0000-4000-8000-000000000201', 'aufgabe', 1.2, d, 'pgtap'
    from unnest(array['2027-01-10 10:00 Europe/Zurich', '2027-01-12 10:00 Europe/Zurich',
                      '2027-01-14 10:00 Europe/Zurich', '2027-01-16 10:00 Europe/Zurich']::timestamptz[]) d;
insert into public.kalibrierung (client_id, messgeraet_id, gilt_ab, app_version)
  values (gen_random_uuid(), 'f0000000-0000-4000-8000-000000000201', '2027-01-01 09:00 Europe/Zurich', 'pgtap');
insert into public.naehrloesungsansatz (id, client_id, platz_id, typ, begonnen_am, volumen_l, gilt_ab, app_version)
  values ('f0000000-0000-4000-8000-0000000003a1', gen_random_uuid(), 'f0000000-0000-4000-8000-000000000321', 'neuansatz',
          '2027-01-09 10:00 Europe/Zurich', 9, '2027-01-09 10:00 Europe/Zurich', 'pgtap');
insert into public.ansatz_position (client_id, ansatz_id, produkt_id, soll_ml, bezugsvolumen_l, app_version)
  values (gen_random_uuid(), 'f0000000-0000-4000-8000-0000000003a1', 'grow', 8, 9, 'pgtap');
insert into public.ansatz_schritt (client_id, ansatz_id, nr, schritt, app_version)
  values (gen_random_uuid(), 'f0000000-0000-4000-8000-0000000003a1', 0, 'kalibrierung_pruefen', 'pgtap');
insert into public.ereignis (client_id, typ, platz_id, gilt_ab, app_version)
  values (gen_random_uuid(), 'gefaess_erfasst', 'f0000000-0000-4000-8000-000000000321', '2027-01-03 10:00 Europe/Zurich', 'pgtap');
insert into public.aufschub (client_id, aufgabe_schluessel, art, gesetzt_am, gilt_ab, app_version)
  values (gen_random_uuid(), 'messen|pgtap|2027-01-10', 'morgen', '2027-01-10', '2027-01-10 08:00 Europe/Zurich', 'pgtap');
insert into public.aufgabe_tagesliste (tag, aufgabe_schluessel, typ, platz_id, faellig_am, app_version)
  values ('2027-01-10', 'messen|pgtap|2027-01-10', 'messen', 'f0000000-0000-4000-8000-000000000321', '2027-01-10', 'pgtap');
insert into public.push_abo (id, geraet, endpoint, p256dh, auth_schluessel, app_version)
  values ('f0000000-0000-4000-8000-0000000003b1', 'Testgeraet', 'https://push.example.invalid/pgtap-1', 'p', 'a', 'pgtap');
insert into public.push_versand (abo_id, kanal, art, datum_lokal, app_version)
  values ('f0000000-0000-4000-8000-0000000003b1', 'push', 'sammel', '2027-01-10', 'pgtap');
insert into public.etikett_aufruf (code, ergebnis, app_version) values ('R-2.3', 'gefunden', 'pgtap');
insert into public.ki_feldprotokoll (client_id, sorte_id, feld, wert_ki, status, modell, app_version)
  values (gen_random_uuid(), 'f0000000-0000-4000-8000-000000000101', 'name', 'Testsorte A', 'uebernommen', 'testmodell', 'pgtap');
-- #219 NB1-AK12: je eine Zeile tuetenfoto und vorrat_ereignis (Tabellen aus #207 und #215)
insert into public.tuetenfoto (client_id, sorte_id, seite, pfad, app_version)
  values ('f0000000-0000-4000-8000-0000000003d1', 'f0000000-0000-4000-8000-000000000101', 'vorne',
          'f0000000-0000-4000-8000-000000000101/f0000000-0000-4000-8000-0000000003d2.jpg', 'pgtap');
insert into public.vorrat_ereignis (client_id, sorte_id, typ, gilt_ab, app_version)
  values ('f0000000-0000-4000-8000-0000000003d3', 'f0000000-0000-4000-8000-000000000101', 'aufgebraucht',
          '2027-01-10 10:00 Europe/Zurich', 'pgtap');
insert into public.eigene_aufgabe (anlage_id, name, intervall_d, app_version)
  values ('f0000000-0000-4000-8000-000000000301', 'Filter reinigen', 30, 'pgtap');

-- ---------------------------------------------------------------------
-- Prüftor-Regeln über den Katalog (smoke3 C11, 04 Abschnitt 11)
-- ---------------------------------------------------------------------

create function pg_temp.rls_je_tabelle() returns setof text language plpgsql as $$
declare t text;
begin
  for t in select name from tabellen order by name loop
    return next ok((select c.relrowsecurity from pg_class c where c.oid = format('public.%I', t)::regclass),
                   'UC0-AK2 RLS aktiv: ' || t);
  end loop;
end $$;
select * from pg_temp.rls_je_tabelle();

select is(
  (select coalesce(string_agg(tablename || '.' || policyname, ', ' order by tablename, policyname), '')
     from pg_policies
    where schemaname = 'public' and (qual = 'true' or with_check = 'true')
      and not (policyname = 'backup_lesen' and cmd = 'SELECT' and roles = '{backup_leser}'::name[])),
  '', 'UC0-AK2 keine Policy mit using (true) ausser backup_lesen (smoke3 C11)');

create function pg_temp.policies_je_tabelle() returns setof text language plpgsql as $$
declare
  t text;
  abweichung text;
begin
  for t in select name from tabellen order by name loop
    if not exists (select 1 from pg_policies p
                    where p.schemaname = 'public' and p.tablename = t and p.policyname <> 'backup_lesen') then
      abweichung := 'keine Policy';
    else
      select coalesce(string_agg(p.policyname || ' ' || p.cmd, ', ' order by p.policyname), 'ok') into abweichung
        from pg_policies p
       where p.schemaname = 'public' and p.tablename = t and p.policyname <> 'backup_lesen'
         and not (p.roles = '{authenticated}'::name[]
                  and (p.qual is null or pg_temp.kern(p.qual) = 'ist_tim')
                  and (p.with_check is null or pg_temp.kern(p.with_check) = 'ist_tim'));
    end if;
    return next is(abweichung, 'ok', 'UC0-AK2 Policies nur über ist_tim(): ' || t);
  end loop;
end $$;
select * from pg_temp.policies_je_tabelle();

-- Ä1: (select public.ist_tim()) wertet die Funktion einmal je Abfrage aus
select is(
  (select count(*) || ' Abweichungen' || coalesce(': ' || array_to_string((array_agg(tablename || '.' || policyname
                                                                          order by tablename, policyname))[1:5], ', '), '')
     from pg_policies
    where schemaname = 'public' and policyname <> 'backup_lesen'
      and ((qual is not null and qual !~ '^\(\s*SELECT\s+(public\.)?ist_tim\(\)\s+AS\s+ist_tim\)$')
        or (with_check is not null and with_check !~ '^\(\s*SELECT\s+(public\.)?ist_tim\(\)\s+AS\s+ist_tim\)$'))),
  '0 Abweichungen', 'UC0-AK2 Ä1 Policies rufen ist_tim() als Unterabfrage (select public.ist_tim())');

create function pg_temp.sichten_invoker() returns setof text language plpgsql as $$
declare t text;
begin
  for t in select name from sichten order by name loop
    return next ok(exists (select 1 from pg_class c, unnest(c.reloptions) o
                            where c.oid = format('public.%I', t)::regclass
                              and o ~* '^security_invoker=(true|on|yes|1)$'),
                   'UC0-AK2 Sicht security_invoker: ' || t);
  end loop;
end $$;
select * from pg_temp.sichten_invoker();

-- ---------------------------------------------------------------------
-- Ohne Anmeldung (anon): kein Recht, Lesen und Insert scheitern mit 42501 (#67); fremdes Konto: 0 Zeilen, Insert 42501
-- ---------------------------------------------------------------------

create function pg_temp.lesen_je_tabelle(rolle text, sub uuid, beschreibung text) returns setof text language plpgsql as $$
declare t text;
begin
  for t in select name from tabellen order by name loop
    return next is(pg_temp.zaehle_als(rolle, sub, format('select count(*) from public.%I', t)), '0', beschreibung || t);
  end loop;
end $$;

create function pg_temp.einfuegen_je_tabelle(rolle text, sub uuid, beschreibung text) returns setof text language plpgsql as $$
declare t text;
begin
  for t in select name from tabellen order by name loop
    return next is(pg_temp.ausfuehren_als(rolle, sub, format('insert into public.%I default values', t)), '42501',
                   beschreibung || t);
  end loop;
end $$;

-- #67: anon hat in public keine Tabellenrechte (lokal wie gehostet), Lesen scheitert mit 42501
create function pg_temp.lesen_verweigert_je_tabelle(rolle text, sub uuid, beschreibung text) returns setof text language plpgsql as $$
declare t text;
begin
  for t in select name from tabellen order by name loop
    return next is(pg_temp.ausfuehren_als(rolle, sub, format('select count(*) from public.%I', t)), '42501',
                   beschreibung || t);
  end loop;
end $$;
select * from pg_temp.lesen_verweigert_je_tabelle('anon', null, 'UC0-AK2 anon darf nicht lesen (42501): ');
select is(
  (select coalesce(string_agg(c.relname, ', ' order by c.relname), '')
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'S')
      and (has_table_privilege('anon', c.oid, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN')
           or (c.relkind = 'S' and has_sequence_privilege('anon', c.oid, 'USAGE, SELECT, UPDATE')))),
  '', 'UC0-AK2 #67 anon hat in public kein Recht auf Tabellen, Sichten und Sequenzen');
select * from pg_temp.einfuegen_je_tabelle('anon', null, 'UC0-AK2 anon Insert scheitert: ');
select * from pg_temp.lesen_je_tabelle('authenticated', '00000000-0000-4000-8000-00000000000b',
                                       'UC0-AK2 fremdes Konto liest 0 Zeilen: ');
select * from pg_temp.einfuegen_je_tabelle('authenticated', '00000000-0000-4000-8000-00000000000b',
                                           'UC0-AK2 fremdes Konto Insert scheitert: ');

-- ---------------------------------------------------------------------
-- Tim
-- ---------------------------------------------------------------------

select is(
  pg_temp.zaehle_als('authenticated', '00000000-0000-4000-8000-00000000000a',
    $$select format('%s Messungen, %s Anlage, %s Zugang',
                    (select count(*) from public.messung where messgeraet_id = 'f0000000-0000-4000-8000-000000000201'),
                    (select count(*) from public.anlage where id = 'f0000000-0000-4000-8000-000000000301'),
                    (select count(*) from public.zugang where user_id = '00000000-0000-4000-8000-00000000000a'))$$),
  '4 Messungen, 1 Anlage, 1 Zugang', 'UC0-AK2 Tim liest seine Zeilen (smoke: tim sieht n)');

-- #219 NB1-AK12: Fixture-Zeilen tuetenfoto und vorrat_ereignis für Tim lesbar, für das fremde Konto nicht
create temp view nb1_ak12 as select
  $$select format('%s tuetenfoto, %s vorrat_ereignis',
                  (select count(*) from public.tuetenfoto where client_id = 'f0000000-0000-4000-8000-0000000003d1'),
                  (select count(*) from public.vorrat_ereignis
                    where client_id = 'f0000000-0000-4000-8000-0000000003d3'))$$::text as abfrage;
select is(
  pg_temp.zaehle_als('authenticated', '00000000-0000-4000-8000-00000000000a', (select abfrage from nb1_ak12)),
  '1 tuetenfoto, 1 vorrat_ereignis', 'NB1-AK12 Tim liest die Fixture-Zeilen tuetenfoto und vorrat_ereignis');
select is(
  pg_temp.zaehle_als('authenticated', '00000000-0000-4000-8000-00000000000b', (select abfrage from nb1_ak12)),
  '0 tuetenfoto, 0 vorrat_ereignis', 'NB1-AK12 fremdes Konto liest 0 Zeilen tuetenfoto und vorrat_ereignis');

create function pg_temp.wissen_nur_lesen() returns setof text language plpgsql as $$
declare
  t text;
  einfuegen text;
  aendern text;
  lesen text;
begin
  for t in select name from wissen order by name loop
    einfuegen := pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
                                        format('insert into public.%I default values', t));
    aendern := pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
                                      format('update public.%I set id = id', t));
    lesen := pg_temp.zaehle_als('authenticated', '00000000-0000-4000-8000-00000000000a',
                                format('select (count(*) > 0)::text from public.%I', t));
    return next is(format('Einfügen %s, Ändern %s, Lesen %s', einfuegen, aendern, lesen),
                   'Einfügen 42501, Ändern ok 0, Lesen true', 'UC0-AK2 Wissen für Tim nur lesbar: ' || t);
  end loop;
end $$;
select * from pg_temp.wissen_nur_lesen();

select is(
  format('Ändern %s, Einfügen %s',
    pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
      $$update public.messgeraet set u_ec = 0.12 where id = 'f0000000-0000-4000-8000-000000000201'$$),
    pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
      $$insert into public.messgeraet (modell, app_version) values ('Zweitgeraet', 'pgtap')$$)),
  'Ändern ok 1, Einfügen 42501', 'UC0-AK2 messgeraet für Tim änderbar, nicht einfügbar');

-- ---------------------------------------------------------------------
-- Funktionsrechte (CLAUDE.md, 04 Abschnitt 11, Ä1, Ä2)
-- ---------------------------------------------------------------------

create function pg_temp.execute_je_funktion() returns setof text language plpgsql as $$
declare r record;
begin
  for r in select * from funktionen where prosecdef order by name, argumente loop
    if r.name in ('ist_tim', 'wissen_app_schreiben') then
      return next is(format('anon %s, authenticated %s', has_function_privilege('anon', r.oid, 'EXECUTE')::text,
                            has_function_privilege('authenticated', r.oid, 'EXECUTE')::text),
                     'anon false, authenticated true',
                     'UC0-AK2 anon ohne EXECUTE, authenticated mit eigener Prüfung: ' || r.name);
    else
      return next is(format('anon %s, authenticated %s', has_function_privilege('anon', r.oid, 'EXECUTE')::text,
                            has_function_privilege('authenticated', r.oid, 'EXECUTE')::text),
                     'anon false, authenticated false',
                     'UC0-AK2 anon und authenticated ohne EXECUTE: ' || r.name);
    end if;
  end loop;
end $$;
select * from pg_temp.execute_je_funktion();

create function pg_temp.search_path_je_funktion() returns setof text language plpgsql as $$
declare r record;
begin
  for r in select * from funktionen order by name, argumente loop
    return next ok(coalesce('search_path=""' = any (r.proconfig), false),
                   'UC0-AK2 Ä1 Funktion mit search_path leer: ' || r.name || '(' || r.argumente || ')');
  end loop;
end $$;
select * from pg_temp.search_path_je_funktion();

select pg_temp.als('authenticated', '00000000-0000-4000-8000-00000000000b');
select throws_ok(
  $$select public.wissen_app_schreiben('sorte_neu', '{"sorte_id":"f0000000-0000-4000-8000-000000000109","name":"Fremd","art_id":"pgtap_art_a","kulturtyp":"blatt"}')$$,
  'P0001'::bpchar, null::text, 'UC0-AK2 fremdes Konto: wissen_app_schreiben nicht erlaubt');
reset role;

-- smoke3 D1: security-definer-Funktionen trotz Default-Privileges nicht für anon und authenticated
select pg_temp.als('anon', null);
select throws_ok($$select public.datenart_loeschen('demo')$$, '42501'::bpchar, null::text,
                 'UC0-AK2 smoke3 D1 anon darf datenart_loeschen nicht');
select throws_ok($$select public.backup_status_melden(1)$$, '42501'::bpchar, null::text,
                 'UC0-AK2 smoke3 D1 anon darf backup_status_melden nicht');
reset role;
select pg_temp.als('authenticated', '00000000-0000-4000-8000-00000000000a');
select throws_ok($$select public.datenart_loeschen('demo')$$, '42501'::bpchar, null::text,
                 'UC0-AK2 smoke3 D1 authenticated darf datenart_loeschen nicht');
select throws_ok($$select public.backup_status_melden(1)$$, '42501'::bpchar, null::text,
                 'UC0-AK2 smoke3 D1 authenticated darf backup_status_melden nicht');
reset role;

-- ---------------------------------------------------------------------
-- TRUNCATE umgeht RLS: anon und authenticated dürfen es auf keiner Tabelle (Prüfer Sicherheit Runde 1)
-- ---------------------------------------------------------------------

create function pg_temp.truncate_je_tabelle() returns setof text language plpgsql as $$
declare t text;
begin
  for t in select name from tabellen order by name loop
    return next is(format('anon %s, authenticated %s',
                          has_table_privilege('anon', format('public.%I', t), 'TRUNCATE')::text,
                          has_table_privilege('authenticated', format('public.%I', t), 'TRUNCATE')::text),
                   'anon false, authenticated false', 'UC0-AK2 anon und authenticated ohne TRUNCATE: ' || t);
  end loop;
end $$;
select * from pg_temp.truncate_je_tabelle();

-- Gelingt TRUNCATE, rollt der innere Block es zurück, damit die folgenden Tests ihre Fixtures behalten.
create function pg_temp.truncate_als(rolle text, sub uuid, tabelle text) returns text language plpgsql as $$
declare
  ergebnis text;
begin
  perform pg_temp.als(rolle, sub);
  begin
    execute format('truncate public.%I', tabelle);
    raise exception using errcode = 'HV001', message = 'TRUNCATE zurückrollen';
  exception
    when sqlstate 'HV001' then ergebnis := 'ok';
    when others then ergebnis := sqlstate;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return ergebnis;
end $$;
-- eigene Anweisung, damit public.zugang beim TRUNCATE nicht in derselben Abfrage offen ist (sonst 55006)
create temp table truncate_ergebnis as
  select pg_temp.truncate_als('authenticated', '00000000-0000-4000-8000-00000000000b', 'zugang') as ergebnis;
select is(
  format('%s, Zugang danach %s', (select ergebnis from truncate_ergebnis),
         (select count(*) from public.zugang where user_id = '00000000-0000-4000-8000-00000000000a')),
  '42501, Zugang danach 1', 'UC0-AK2 fremdes Konto: TRUNCATE public.zugang scheitert');

-- A3: Trigger feuern ohne EXECUTE-Recht des auslösenden Nutzers auf der Triggerfunktion
select is(
  pg_temp.ausfuehren_dann('authenticated', '00000000-0000-4000-8000-00000000000a',
    $$insert into public.ereignis (client_id, typ, satz_id, daten, gilt_ab, app_version)
      values ('f0000000-0000-4000-8000-0000000003c1', 'aussaat', 'f0000000-0000-4000-8000-000000000381',
              '{"saatdatum":"2027-01-06"}', '2027-01-08 10:00 Europe/Zurich', 'pgtap')$$,
    $$select 'Saatdatum ' || saatdatum from public.satz where id = 'f0000000-0000-4000-8000-000000000381'$$),
  'ok 1, Saatdatum 2027-01-06', 'UC0-AK2 A3 Trigger cache_aus_ereignis feuert, wenn Tim ein Ereignis schreibt');

select is(
  pg_temp.ausfuehren_dann('authenticated', '00000000-0000-4000-8000-00000000000a',
    $$insert into public.ereignis (client_id, typ, pflanzung_id, daten, gilt_ab, app_version)
        values ('f0000000-0000-4000-8000-0000000003c2', 'umsetzdatum_geaendert', 'f0000000-0000-4000-8000-000000000391',
                '{"von":"2027-01-20","nach":"2027-01-21","grund":"morgen"}', '2027-01-20 08:00 Europe/Zurich', 'pgtap');
      update public.reservierung set storniert_am = '2027-01-20 09:00 Europe/Zurich', storno_grund = 'korrektur'
       where client_id = 'f0000000-0000-4000-8000-000000000393';
      insert into public.reservierung (client_id, pflanzung_id, netztopf_id, umsetzen_vorgabe_am, umsetzen_geplant_am, gilt_ab, app_version)
        values ('f0000000-0000-4000-8000-000000000394', 'f0000000-0000-4000-8000-000000000391',
                'f0000000-0000-4000-8000-000000000351', '2027-01-20', '2027-01-20', '2027-01-20 09:00 Europe/Zurich', 'pgtap')$$,
    $$select 'geplant ' || umsetzen_geplant_am from public.reservierung where client_id = 'f0000000-0000-4000-8000-000000000394'$$),
  'ok 1, geplant 2027-01-21', 'UC0-AK2 A3 Trigger reservierung_vorbelegen feuert, wenn Tim eine Reservierung schreibt');

select * from finish();
rollback;
