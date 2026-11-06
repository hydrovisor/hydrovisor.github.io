-- 16_ansatz_zustand.test.sql · Zustand des Ansatzes aus Schritten und Messungen (Issue #29, Plan 29 Abschnitt
-- Migration und Testliste SQL; Konzept 8.1 Regel 2, R4.6, R4.14, 11.4; 06_tests.md Abschnitt 9 Ereignisreihenfolge).
-- Ohne Personendaten; alles in einer Transaktion mit rollback. Die Datenbank läuft in UTC, alle Zeitpunkte stehen
-- ausdrücklich in Europe/Zurich.
--
-- Vorausgesetzt (Plan 29, Migration):
--   20261108120000_ansatz_schritt_abbruch.sql: Enum-Wert 'abbruch' in ansatz_schritt_typ.
--   20261108120100_ansatz_zustand.sql:
--     public.ansatz_zustand_nachrechnen() returns trigger (Rechte des Aufrufers), after insert or update of
--       storniert_am auf ansatz_schritt und auf messung (nur ansatz_id is not null).
--       Neuansatz mit mindestens einem Schritt: status abgebrochen (gültige Zeile abbruch) vor abgeschlossen (gültige
--       Zeile 17) vor laufend; abgeschlossen_am = erledigt_am der Zeile abbruch bzw. 17; dauer_s = abgeschlossen_am
--       − begonnen_am beim Abschluss; timer_ende = erledigt_am(t − 1) + 15 min für die höchste Timerzeile t aus
--       11, 13, 16 mit gültig erledigtem Vorgänger, sonst null; kontrollmessung_id bzw. endmessung_id = jüngste
--       gültige Messung kontrolle_ansatz bzw. end_ansatz mit dieser ansatz_id.
--       pH-Korrektur: abgeschlossen mit abgeschlossen_am = gilt_ab der jüngsten gültigen Messung nachmessen, sonst
--       laufend; timer_ende aus dem Insert bleibt. Neuansatz ohne Schritte: Werte des Inserts bleiben (A22).
--     public.ansatz_zustand_geschuetzt() returns trigger, before update auf naehrloesungsansatz: bei
--       pg_trigger_depth() < 2 scheitert jede Änderung von status, abgeschlossen_am, timer_ende, dauer_s,
--       kontrollmessung_id, endmessung_id mit raise exception (P0001) «… (8.1 Regel 2)» (A25).
--     EXECUTE auf beiden Funktionen entzogen von public, anon, authenticated.
--     create or replace view v_ph_wirkung: pH nachher = coalesce(ph_nachher, pH der jüngsten gültigen Messung
--       nachmessen mit dieser ansatz_id) (A23).
--
-- Jeder Fall läuft in pg_temp.isoliert() (Unterblock, danach zurückgerollt); ein fehlender Enum-Wert oder eine
-- fehlende Funktion ergibt ein falsches Ergebnis, nicht den Abbruch des Laufs (Muster 05_auswertung, 15_sorten).
--
-- Fixture (als postgres): Tim …000a mit Zugang, fremdes Konto …000b ohne; Anlage PZ (echt) mit Gefäss 2.3, Anlage
-- PD (demo) mit Gefäss 2.3; ein Messgerät. Zeilen der Abhakliste am 10.1.2027 (Zürich):
--   nr       0     1     2     3     4     5     6     7     8     9     10    11    12    13    14    15    16    17
--   erledigt 18:00 18:01 18:05 18:07 18:08 18:10 18:11 18:12 18:13 18:14 18:15 18:30 18:35 18:50 18:52 18:55 19:10 19:12
--   begonnen_am = 18:01 (Haken Zeile 1). Timer: nach 10 → 18:30, nach 12 → 18:50, nach 15 → 19:10.
--   Abschluss 19:12, dauer_s = 71 min = 4260.
begin;
create extension if not exists pgtap with schema extensions;
set local timezone to 'UTC';
select plan(26);

-- ---------------------------------------------------------------------
-- Hilfen
-- ---------------------------------------------------------------------

-- Fixture ausführen, Abfrage lesen, alles zurückrollen (wie 05_auswertung)
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

-- Anweisung als postgres; «ok» oder der SQLSTATE
create function pg_temp.sqlstate_von(anweisung text) returns text language plpgsql as $$
begin
  execute anweisung;
  return 'ok';
exception when others then
  return sqlstate;
end $$;

-- Anweisung als angemeldetes Konto; «ok <Zeilen>» oder «<SQLSTATE>: <Meldung>»
create function pg_temp.als_konto(sub uuid, anweisung text) returns text language plpgsql as $$
declare
  r text;
  n bigint;
begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub', sub, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    execute anweisung;
    get diagnostics n = row_count;
    r := 'ok ' || n;
  exception when others then
    r := sqlstate || ': ' || sqlerrm;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return r;
end $$;

-- Abfrage (ein Wert) als angemeldetes Konto
create function pg_temp.wert_als(sub uuid, abfrage text) returns text language plpgsql as $$
declare
  r text;
begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub', sub, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    execute abfrage into r;
  exception when others then
    r := 'Fehler ' || sqlstate;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return r;
end $$;

create function pg_temp.tim(anweisung text) returns text language sql as $$
  select pg_temp.als_konto('00000000-0000-4000-8000-00000000000a', anweisung)
$$;

-- Uhrzeit am 10.1.2027 in Zürich
create function pg_temp.t(hhmm text) returns timestamptz language sql immutable as $$
  select ('2027-01-10 ' || hhmm || ':00 Europe/Zurich')::timestamptz
$$;

-- Schritt-Typ und erledigt_am je Zeile (R4.6)
create function pg_temp.typ(nr int) returns text language sql immutable as $$
  select (array['kalibrierung_pruefen', 'absaugen', 'frischwasser', 'frischwasser_messen', 'gerechnet_fuer', 'micro',
                'spuelen', 'grow', 'spuelen', 'bloom', 'umruehren', 'timer', 'ph_einstellen', 'timer',
                'kontrollmessung', 'restdosis', 'timer', 'endmessung'])[nr + 1]
$$;
create function pg_temp.zeit(nr int) returns timestamptz language sql immutable as $$
  select pg_temp.t((array['18:00', '18:01', '18:05', '18:07', '18:08', '18:10', '18:11', '18:12', '18:13', '18:14',
                          '18:15', '18:30', '18:35', '18:50', '18:52', '18:55', '19:10', '19:12'])[nr + 1])
$$;

-- Neuansatz in PZ-2.3 (…f6…0311), begonnen 18:01
create function pg_temp.ansatz(id uuid, platz uuid default 'f6000000-0000-4000-8000-000000000311') returns uuid
language sql as $$
  insert into public.naehrloesungsansatz (id, client_id, platz_id, typ, begonnen_am, stadium_vorschlag, volumen_l,
                                          gilt_ab, app_version)
  values (id, id, platz, 'neuansatz', pg_temp.zeit(1), 'wachstum', 9, pg_temp.zeit(1), 'pgtap')
  returning id
$$;

-- eine Zeile der Abhakliste; Typ und Zeit nach Tabelle, wenn nicht angegeben (Typ als Text: 'abbruch' erst mit Plan 29)
create function pg_temp.schritt(ansatz uuid, nr int, typ text default null, erledigt timestamptz default null)
returns uuid language plpgsql as $$
declare
  r uuid;
begin
  execute 'insert into public.ansatz_schritt (client_id, ansatz_id, nr, schritt, erledigt_am, app_version)
           values (gen_random_uuid(), $1, $2, $3::public.ansatz_schritt_typ, $4, ''pgtap'') returning id'
    into r using ansatz, nr, coalesce(typ, pg_temp.typ(nr)), coalesce(erledigt, pg_temp.zeit(nr));
  return r;
end $$;

-- Zeilen 0 bis n aufsteigend
create function pg_temp.bis(ansatz uuid, n int) returns void language plpgsql as $$
begin
  for i in 0..n loop
    perform pg_temp.schritt(ansatz, i);
  end loop;
end $$;

create function pg_temp.storno(ansatz uuid, nr int) returns void language sql as $$
  update public.ansatz_schritt set storniert_am = now()
   where ansatz_id = ansatz and nr = storno.nr and storniert_am is null
$$;

-- Messung im Ansatz am Platz des Ansatzes ($1 id, $2 ansatz, $3 Messart, $4 gilt_ab, $5 pH, $6 EC)
create function pg_temp.messung(uuid, uuid, public.messart, timestamptz, numeric, numeric)
returns uuid language sql as $$
  insert into public.messung (id, client_id, platz_id, messgeraet_id, messart, ph, ec, temperatur, schnappschuss,
                              ansatz_id, gilt_ab, app_version)
  select $1, $1, a.platz_id, 'f6000000-0000-4000-8000-000000000201', $3, $5, $6, 20.0, '{"betriebsart":"dwc"}',
         $2, $4, 'pgtap'
    from public.naehrloesungsansatz a where a.id = $2
  returning id
$$;

-- Zeilen in vorgegebener Reihenfolge
create function pg_temp.folge(ansatz uuid, nrn int[]) returns void language plpgsql as $$
declare
  n int;
begin
  foreach n in array nrn loop
    perform pg_temp.schritt(ansatz, n);
  end loop;
end $$;

-- Abfragen nacheinander (feste Reihenfolge), Ergebnisse mit «, » verbunden
create function pg_temp.reihe(abfragen text[]) returns text language plpgsql as $$
declare
  q text;
  r text;
  alle text[] := '{}';
begin
  foreach q in array abfragen loop
    execute q into r;
    alle := alle || coalesce(r, '(leer)');
  end loop;
  return array_to_string(alle, ', ');
end $$;

-- «status|abgeschlossen_am|timer_ende|dauer_s» mit Uhrzeiten in Zürich, leere Felder als «-»
create function pg_temp.zustand(a uuid) returns text language sql as $$
  select concat_ws('|', status,
                   coalesce(to_char(abgeschlossen_am at time zone 'Europe/Zurich', 'HH24:MI'), '-'),
                   coalesce(to_char(timer_ende at time zone 'Europe/Zurich', 'HH24:MI'), '-'),
                   coalesce(dauer_s::text, '-'))
    from public.naehrloesungsansatz where id = a
$$;

-- Rechte einer Funktion: «trigger, invoker, anon nein, authenticated nein, public nein» oder «fehlt»
create function pg_temp.rechte(signatur text) returns text language sql as $$
  select coalesce((
    select concat_ws(', ',
             case when p.prorettype = 'trigger'::regtype then 'trigger' else 'kein trigger' end,
             case when p.prosecdef then 'definer' else 'invoker' end,
             'anon ' || case when has_function_privilege('anon', p.oid, 'execute') then 'ja' else 'nein' end,
             'authenticated ' || case when has_function_privilege('authenticated', p.oid, 'execute') then 'ja' else 'nein' end,
             'public ' || case when exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) x
                                             where x.grantee = 0 and x.privilege_type = 'EXECUTE')
                               then 'ja' else 'nein' end)
      from pg_proc p where p.oid = to_regprocedure(signatur)), 'fehlt')
$$;

-- ---------------------------------------------------------------------
-- Fixtures als postgres
-- ---------------------------------------------------------------------

insert into auth.users (id) values
  ('00000000-0000-4000-8000-00000000000a'), ('00000000-0000-4000-8000-00000000000b')
  on conflict (id) do nothing;
insert into public.zugang (user_id, app_version) values ('00000000-0000-4000-8000-00000000000a', 'pgtap')
  on conflict do nothing;
insert into public.auswertung_fenster (name, von, bis, app_version)
  values ('testbetrieb', '2027-01-07 00:00 Europe/Zurich', '2027-04-01 00:00 Europe/Zurich', 'pgtap')
  on conflict (name) do nothing;
insert into public.produkt (produkt_id, name, app_version) values
  ('grow', 'Grow', 'pgtap'), ('micro_hard_water', 'Micro', 'pgtap'), ('bloom', 'Bloom', 'pgtap'),
  ('ph_minus', 'pH-Minus', 'pgtap')
  on conflict (produkt_id) do nothing;
insert into public.messgeraet (id, modell, app_version) values ('f6000000-0000-4000-8000-000000000201', 'Testgeraet', 'pgtap');
insert into public.anlage (id, name, kuerzel, datenart, app_version) values
  ('f6000000-0000-4000-8000-000000000301', 'Testregal Ansatz', 'PZ', 'echt', 'pgtap'),
  ('f6000000-0000-4000-8000-000000000302', 'Demo Ansatz', 'PD', 'demo', 'pgtap');
insert into public.platz (id, anlage_id, kennung, rolle, app_version) values
  ('f6000000-0000-4000-8000-000000000311', 'f6000000-0000-4000-8000-000000000301', '2.3', 'gefaess', 'pgtap'),
  ('f6000000-0000-4000-8000-000000000321', 'f6000000-0000-4000-8000-000000000302', '2.3', 'gefaess', 'pgtap');

-- ---------------------------------------------------------------------
-- Loesungswechsel-AK3 Zustand aus Schritten, unabhängig von der Reihenfolge (8.1 Regel 2, 06_tests.md 9)
-- ---------------------------------------------------------------------

select is(pg_temp.isoliert($f$
  select pg_temp.ansatz('f6000000-0000-4000-8000-000000000401');
  select pg_temp.bis('f6000000-0000-4000-8000-000000000401', 17);
  select pg_temp.ansatz('f6000000-0000-4000-8000-000000000402');
  select pg_temp.folge('f6000000-0000-4000-8000-000000000402',
                       array[17, 5, 0, 16, 3, 1, 15, 2, 12, 4, 14, 6, 13, 7, 11, 8, 10, 9]);
  $f$,
  $q$select pg_temp.zustand('f6000000-0000-4000-8000-000000000401') || ' = '
         || pg_temp.zustand('f6000000-0000-4000-8000-000000000402')$q$),
  'abgeschlossen|19:12|19:10|4260 = abgeschlossen|19:12|19:10|4260',
  'Loesungswechsel-AK3 vertauschte Reihenfolge der Schritte ergibt denselben Zustand (8.1 Regel 2): status, abgeschlossen_am, timer_ende, dauer_s');

-- ---------------------------------------------------------------------
-- Loesungswechsel-AK3 Timer gegen die absolute Endzeit (R4.6, TP5)
-- ---------------------------------------------------------------------

select is(pg_temp.isoliert($f$
  select pg_temp.ansatz('f6000000-0000-4000-8000-000000000401');
  select pg_temp.bis('f6000000-0000-4000-8000-000000000401', 9);
  $f$,
  $q$select split_part(pg_temp.zustand('f6000000-0000-4000-8000-000000000401'), '|', 3)$q$),
  '-', 'Loesungswechsel-AK3 ohne Zeile 10 ist timer_ende null');

select is(pg_temp.isoliert($f$
  select pg_temp.ansatz('f6000000-0000-4000-8000-000000000401');
  select pg_temp.bis('f6000000-0000-4000-8000-000000000401', 10);
  $f$,
  $q$select pg_temp.zustand('f6000000-0000-4000-8000-000000000401')$q$),
  'laufend|-|18:30|-', 'Loesungswechsel-AK3 timer_ende = erledigt_am Zeile 10 + 15 min');

select is(pg_temp.isoliert($f$
  select pg_temp.ansatz('f6000000-0000-4000-8000-000000000401');
  select pg_temp.bis('f6000000-0000-4000-8000-000000000401', 12);
  $f$,
  $q$select split_part(pg_temp.zustand('f6000000-0000-4000-8000-000000000401'), '|', 3)$q$),
  '18:50', 'Loesungswechsel-AK3 nach Zeile 12 timer_ende neu aus Zeile 12 + 15 min');

select is(pg_temp.isoliert($f$
  select pg_temp.ansatz('f6000000-0000-4000-8000-000000000401');
  select pg_temp.bis('f6000000-0000-4000-8000-000000000401', 15);
  $f$,
  $q$select split_part(pg_temp.zustand('f6000000-0000-4000-8000-000000000401'), '|', 3)$q$),
  '19:10', 'Loesungswechsel-AK3 nach Zeile 15 timer_ende aus Zeile 15 + 15 min');

-- ---------------------------------------------------------------------
-- Loesungswechsel-AK3 Storno eines Schritts rechnet zurück (Korrektur = Storno plus neue Zeile)
-- ---------------------------------------------------------------------

select is(pg_temp.isoliert($f$
  select pg_temp.ansatz('f6000000-0000-4000-8000-000000000401');
  select pg_temp.bis('f6000000-0000-4000-8000-000000000401', 17);
  select pg_temp.storno('f6000000-0000-4000-8000-000000000401', 17);
  $f$,
  $q$select pg_temp.zustand('f6000000-0000-4000-8000-000000000401')$q$),
  'laufend|-|19:10|-', 'Loesungswechsel-AK3 Storno von Zeile 17 ergibt laufend, abgeschlossen_am und dauer_s null');

select is(pg_temp.isoliert($f$
  select pg_temp.ansatz('f6000000-0000-4000-8000-000000000401');
  select pg_temp.bis('f6000000-0000-4000-8000-000000000401', 12);
  select pg_temp.storno('f6000000-0000-4000-8000-000000000401', 12);
  $f$,
  $q$select pg_temp.zustand('f6000000-0000-4000-8000-000000000401')$q$),
  'laufend|-|18:30|-', 'Loesungswechsel-AK3 Storno von Zeile 12 setzt timer_ende wieder aus Zeile 10');

select is(pg_temp.isoliert($f$
  select pg_temp.ansatz('f6000000-0000-4000-8000-000000000401');
  select pg_temp.bis('f6000000-0000-4000-8000-000000000401', 17);
  select pg_temp.storno('f6000000-0000-4000-8000-000000000401', 17);
  select pg_temp.schritt('f6000000-0000-4000-8000-000000000401', 17, null, pg_temp.t('19:20'));
  $f$,
  $q$select pg_temp.zustand('f6000000-0000-4000-8000-000000000401')$q$),
  'abgeschlossen|19:20|19:10|4740', 'Loesungswechsel-AK3 neue Zeile 17 nach dem Storno schliesst mit ihrem erledigt_am ab');

-- ---------------------------------------------------------------------
-- Loesungswechsel-AK4 Abbruch und Abschluss
-- ---------------------------------------------------------------------

select is(pg_temp.isoliert($f$
  select pg_temp.ansatz('f6000000-0000-4000-8000-000000000401');
  select pg_temp.bis('f6000000-0000-4000-8000-000000000401', 7);
  select pg_temp.schritt('f6000000-0000-4000-8000-000000000401', 8, 'abbruch', pg_temp.t('18:20'));
  $f$,
  $q$select split_part(pg_temp.zustand('f6000000-0000-4000-8000-000000000401'), '|', 1) || '|'
         || split_part(pg_temp.zustand('f6000000-0000-4000-8000-000000000401'), '|', 2) || ' '
         || (select fuellzustand from public.v_fuellzustand where platz_id = 'f6000000-0000-4000-8000-000000000311')$q$),
  'abgebrochen|18:20 leer',
  'Loesungswechsel-AK4 Abbruchzeile mit der nächsten offenen nr setzt abgebrochen mit abgeschlossen_am; v_fuellzustand sieht leer');

select is(pg_temp.isoliert($f$
  select pg_temp.ansatz('f6000000-0000-4000-8000-000000000401');
  select pg_temp.bis('f6000000-0000-4000-8000-000000000401', 7);
  select pg_temp.schritt('f6000000-0000-4000-8000-000000000401', 8, 'abbruch', pg_temp.t('18:20'));
  select pg_temp.storno('f6000000-0000-4000-8000-000000000401', 8);
  $f$,
  $q$select pg_temp.zustand('f6000000-0000-4000-8000-000000000401') || ' '
         || (select count(*) from public.ansatz_schritt
              where ansatz_id = 'f6000000-0000-4000-8000-000000000401' and schritt::text = 'abbruch')$q$),
  'laufend|-|-|- 1', 'Loesungswechsel-AK4 Storno der Abbruchzeile ergibt wieder laufend; die Zeile bleibt als Protokoll');

select is(pg_temp.isoliert($f$
  select pg_temp.ansatz('f6000000-0000-4000-8000-000000000401');
  select pg_temp.bis('f6000000-0000-4000-8000-000000000401', 7);
  select pg_temp.schritt('f6000000-0000-4000-8000-000000000401', 8, 'abbruch', pg_temp.t('18:20'));
  $f$,
  $q$select pg_temp.sqlstate_von($s$select pg_temp.schritt('f6000000-0000-4000-8000-000000000401', 8)$s$)$q$),
  '23505', 'Loesungswechsel-AK4 Teilindex ansatz_schritt_nr nimmt die Abbruchzeile an; eine zweite gültige Zeile mit derselben nr scheitert');

select is(pg_temp.isoliert($f$
  select pg_temp.ansatz('f6000000-0000-4000-8000-000000000401');
  select pg_temp.bis('f6000000-0000-4000-8000-000000000401', 16);
  select pg_temp.messung('f6000000-0000-4000-8000-000000000501', 'f6000000-0000-4000-8000-000000000401', 'end_ansatz',
                         pg_temp.t('19:12'), 6.2, 1.25);
  update public.naehrloesungsansatz set ec_erwartet_final = 1.20 where id = 'f6000000-0000-4000-8000-000000000401';
  select pg_temp.schritt('f6000000-0000-4000-8000-000000000401', 17);
  $f$,
  $q$select pg_temp.zustand('f6000000-0000-4000-8000-000000000401') || ' '
         || (select fuellzustand from public.v_fuellzustand where platz_id = 'f6000000-0000-4000-8000-000000000311') || ' '
         || (select coalesce(sum(ansaetze), 0) from public.v_rechnerguete)$q$),
  'abgeschlossen|19:12|19:10|4260 loesung ' || (select coalesce(sum(ansaetze), 0) + 1 from public.v_rechnerguete),
  'Loesungswechsel-AK4 Zeile 17 setzt abgeschlossen mit abgeschlossen_am und dauer_s; v_fuellzustand und v_rechnerguete sehen den Ansatz');

-- ---------------------------------------------------------------------
-- Loesungswechsel-AK3 Kontroll- und Endmessung aus Messungen mit ansatz_id
-- ---------------------------------------------------------------------

select is(pg_temp.isoliert($f$
  select pg_temp.ansatz('f6000000-0000-4000-8000-000000000401');
  select pg_temp.bis('f6000000-0000-4000-8000-000000000401', 14);
  select pg_temp.messung('f6000000-0000-4000-8000-000000000511', 'f6000000-0000-4000-8000-000000000401',
                         'kontrolle_ansatz', pg_temp.t('18:51'), 6.3, 1.10);
  select pg_temp.messung('f6000000-0000-4000-8000-000000000512', 'f6000000-0000-4000-8000-000000000401',
                         'kontrolle_ansatz', pg_temp.t('18:52'), 6.3, 1.12);
  $f$,
  $q$select coalesce(kontrollmessung_id::text, '-') || '|' || coalesce(endmessung_id::text, '-')
       from public.naehrloesungsansatz where id = 'f6000000-0000-4000-8000-000000000401'$q$),
  'f6000000-0000-4000-8000-000000000512|-',
  'Loesungswechsel-AK3 kontrollmessung_id ist die jüngste gültige Messung kontrolle_ansatz mit dieser ansatz_id');

select is(pg_temp.isoliert($f$
  select pg_temp.ansatz('f6000000-0000-4000-8000-000000000401');
  select pg_temp.bis('f6000000-0000-4000-8000-000000000401', 16);
  select pg_temp.messung('f6000000-0000-4000-8000-000000000511', 'f6000000-0000-4000-8000-000000000401',
                         'kontrolle_ansatz', pg_temp.t('18:51'), 6.3, 1.10);
  select pg_temp.messung('f6000000-0000-4000-8000-000000000512', 'f6000000-0000-4000-8000-000000000401',
                         'kontrolle_ansatz', pg_temp.t('18:52'), 6.3, 1.12);
  select pg_temp.messung('f6000000-0000-4000-8000-000000000521', 'f6000000-0000-4000-8000-000000000401',
                         'end_ansatz', pg_temp.t('19:11'), 6.2, 1.20);
  update public.messung set storniert_am = now(), storno_grund = 'korrektur'
   where id in ('f6000000-0000-4000-8000-000000000512', 'f6000000-0000-4000-8000-000000000521');
  $f$,
  $q$select coalesce(kontrollmessung_id::text, '-') || '|' || coalesce(endmessung_id::text, '-')
       from public.naehrloesungsansatz where id = 'f6000000-0000-4000-8000-000000000401'$q$),
  'f6000000-0000-4000-8000-000000000511|-',
  'Loesungswechsel-AK3 Storno der Messung ergibt die frühere gültige Kontrollmessung bzw. null für die Endmessung');

-- ---------------------------------------------------------------------
-- Loesungswechsel-AK3 Zustandsfelder nur aus der Datenbankfunktion (8.1 Regel 2, A25)
-- ---------------------------------------------------------------------

select is(pg_temp.isoliert($f$
  select pg_temp.ansatz('f6000000-0000-4000-8000-000000000401');
  select pg_temp.bis('f6000000-0000-4000-8000-000000000401', 16);
  $f$,
  $q$select pg_temp.reihe(array[
       $a$select pg_temp.tim($s$insert into public.ansatz_schritt (client_id, ansatz_id, nr, schritt, erledigt_am, app_version)
                                values (gen_random_uuid(), 'f6000000-0000-4000-8000-000000000401', 17, 'endmessung',
                                        '2027-01-10 19:12:00 Europe/Zurich', 'pgtap')$s$)$a$,
       $a$select pg_temp.zustand('f6000000-0000-4000-8000-000000000401')$a$])$q$),
  'ok 1, abgeschlossen|19:12|19:10|4260',
  'Loesungswechsel-AK3 der Haken von Zeile 17 als Tim (RLS) rechnet den Zustand nach');

select is(pg_temp.isoliert($f$
  select pg_temp.ansatz('f6000000-0000-4000-8000-000000000401');
  select pg_temp.bis('f6000000-0000-4000-8000-000000000401', 14);
  select pg_temp.messung('f6000000-0000-4000-8000-000000000511', 'f6000000-0000-4000-8000-000000000401',
                         'kontrolle_ansatz', pg_temp.t('18:51'), 6.3, 1.10);
  $f$,
  $q$select pg_temp.reihe(array[
       $a$select split_part(pg_temp.tim($s$update public.naehrloesungsansatz set status = 'abgeschlossen' where id = 'f6000000-0000-4000-8000-000000000401'$s$), ':', 1)$a$,
       $a$select split_part(pg_temp.tim($s$update public.naehrloesungsansatz set abgeschlossen_am = now() where id = 'f6000000-0000-4000-8000-000000000401'$s$), ':', 1)$a$,
       $a$select split_part(pg_temp.tim($s$update public.naehrloesungsansatz set timer_ende = now() where id = 'f6000000-0000-4000-8000-000000000401'$s$), ':', 1)$a$,
       $a$select split_part(pg_temp.tim($s$update public.naehrloesungsansatz set dauer_s = 1 where id = 'f6000000-0000-4000-8000-000000000401'$s$), ':', 1)$a$,
       $a$select split_part(pg_temp.tim($s$update public.naehrloesungsansatz set kontrollmessung_id = null where id = 'f6000000-0000-4000-8000-000000000401'$s$), ':', 1)$a$,
       $a$select split_part(pg_temp.tim($s$update public.naehrloesungsansatz set endmessung_id = 'f6000000-0000-4000-8000-000000000511' where id = 'f6000000-0000-4000-8000-000000000401'$s$), ':', 1)$a$])$q$),
  'P0001, P0001, P0001, P0001, P0001, P0001',
  'Loesungswechsel-AK3 direktes Update von status, abgeschlossen_am, timer_ende, dauer_s, kontrollmessung_id oder endmessung_id als Tim scheitert');

select matches(pg_temp.isoliert($f$
  select pg_temp.ansatz('f6000000-0000-4000-8000-000000000401');
  $f$,
  $q$select pg_temp.tim($s$update public.naehrloesungsansatz set timer_ende = now()
                           where id = 'f6000000-0000-4000-8000-000000000401'$s$)$q$),
  '^P0001: .*8\.1 Regel 2',
  'Loesungswechsel-AK3 die Ablehnung nennt 8.1 Regel 2, auch ohne Schritte');

select is(pg_temp.isoliert($f$
  select pg_temp.ansatz('f6000000-0000-4000-8000-000000000401');
  select pg_temp.bis('f6000000-0000-4000-8000-000000000401', 16);
  $f$,
  $q$select pg_temp.reihe(array[
       $a$select pg_temp.tim($s$update public.naehrloesungsansatz set ec_erwartet_final = 1.2 where id = 'f6000000-0000-4000-8000-000000000401'$s$)$a$,
       $a$select pg_temp.tim($s$update public.naehrloesungsansatz set k_vorschlag = 0.31 where id = 'f6000000-0000-4000-8000-000000000401'$s$)$a$,
       $a$select pg_temp.tim($s$update public.naehrloesungsansatz set storniert_am = now(), storno_grund = 'korrektur' where id = 'f6000000-0000-4000-8000-000000000401'$s$)$a$,
       $a$select ec_erwartet_final || ' ' || k_vorschlag || ' ' || (storniert_am is not null)
            from public.naehrloesungsansatz where id = 'f6000000-0000-4000-8000-000000000401'$a$])$q$),
  'ok 1, ok 1, ok 1, 1.200 0.310 true',
  'Loesungswechsel-AK3 Update von ec_erwartet_final, k_vorschlag und storniert_am als Tim geht');

-- ---------------------------------------------------------------------
-- Loesungswechsel-AK3 Neuansatz ohne Schritte behält die Werte des Inserts (Seed, Demo; A22)
-- ---------------------------------------------------------------------

select is(pg_temp.isoliert($f$
  insert into public.naehrloesungsansatz (id, client_id, platz_id, typ, status, begonnen_am, abgeschlossen_am,
                                          timer_ende, dauer_s, volumen_l, gilt_ab, app_version)
  values ('f6000000-0000-4000-8000-000000000403', 'f6000000-0000-4000-8000-000000000403',
          'f6000000-0000-4000-8000-000000000311', 'neuansatz', 'abgeschlossen', pg_temp.t('18:00'),
          pg_temp.t('19:00'), pg_temp.t('18:45'), 3600, 9, pg_temp.t('18:00'), 'pgtap');
  select pg_temp.messung('f6000000-0000-4000-8000-000000000531', 'f6000000-0000-4000-8000-000000000403',
                         'end_ansatz', pg_temp.t('19:00'), 6.2, 1.20);
  $f$,
  $q$select pg_temp.zustand('f6000000-0000-4000-8000-000000000403') || ' '
         || coalesce((select endmessung_id::text from public.naehrloesungsansatz
                       where id = 'f6000000-0000-4000-8000-000000000403'), '-')$q$),
  'abgeschlossen|19:00|18:45|3600 -',
  'Loesungswechsel-AK3 Neuansatz ohne Schritte behält status, abgeschlossen_am, timer_ende und dauer_s des Inserts (A22)');

-- ---------------------------------------------------------------------
-- UC9-AK7 pH-Korrektur mit Nachmessen (R4.14, R5.2, A23)
-- ---------------------------------------------------------------------

-- pH-Korrektur in PZ-2.3 um 18:00 (pH 6.9, 9 l, 2.9 ml pH-Minus, timer_ende 18:15 aus dem Insert)
create function pg_temp.korrektur(id uuid, platz uuid default 'f6000000-0000-4000-8000-000000000311',
                                  ph_nachher numeric default null) returns uuid language sql as $$
  insert into public.naehrloesungsansatz (id, client_id, platz_id, typ, begonnen_am, timer_ende, volumen_l, ph_vorher,
                                          ph_nachher, ist_ersteinstellung, gilt_ab, app_version)
  values (id, id, platz, 'ph_korrektur', pg_temp.t('18:00'), pg_temp.t('18:15'), 9, 6.9, ph_nachher, false,
          pg_temp.t('18:00'), 'pgtap');
  insert into public.ansatz_position (client_id, ansatz_id, produkt_id, soll_ml, ist_ml, bezugsvolumen_l, app_version)
  values (gen_random_uuid(), id, 'ph_minus', 2.9, 2.9, 9, 'pgtap');
  select id
$$;

select is(pg_temp.isoliert($f$
  select pg_temp.korrektur('f6000000-0000-4000-8000-000000000404');
  $f$,
  $q$select pg_temp.zustand('f6000000-0000-4000-8000-000000000404')$q$),
  'laufend|-|18:15|-', 'UC9-AK7 pH-Korrektur ohne Messung nachmessen bleibt laufend mit timer_ende aus dem Insert');

select is(pg_temp.isoliert($f$
  select pg_temp.korrektur('f6000000-0000-4000-8000-000000000404');
  select pg_temp.messung('f6000000-0000-4000-8000-000000000541', 'f6000000-0000-4000-8000-000000000404',
                         'nachmessen', pg_temp.t('18:16'), 6.6, 1.20);
  $f$,
  $q$select split_part(z, '|', 1) || '|' || split_part(z, '|', 2) || '|' || split_part(z, '|', 3)
       from pg_temp.zustand('f6000000-0000-4000-8000-000000000404') z$q$),
  'abgeschlossen|18:16|18:15',
  'UC9-AK7 Messung nachmessen schliesst die pH-Korrektur mit ihrem gilt_ab ab; timer_ende aus dem Insert bleibt');

select is(pg_temp.isoliert($f$
  select pg_temp.korrektur('f6000000-0000-4000-8000-000000000404');
  select pg_temp.messung('f6000000-0000-4000-8000-000000000541', 'f6000000-0000-4000-8000-000000000404',
                         'nachmessen', pg_temp.t('18:16'), 6.6, 1.20);
  update public.messung set storniert_am = now(), storno_grund = 'korrektur'
   where id = 'f6000000-0000-4000-8000-000000000541';
  $f$,
  $q$select pg_temp.zustand('f6000000-0000-4000-8000-000000000404')$q$),
  'laufend|-|18:15|-', 'UC9-AK7 Storno der Messung nachmessen ergibt wieder laufend');

select is(pg_temp.isoliert($f$
  update public.naehrloesungsansatz set storniert_am = now(), storno_grund = 'korrektur'
   where typ = 'ph_korrektur' and storniert_am is null;
  select pg_temp.korrektur('f6000000-0000-4000-8000-000000000404');
  select pg_temp.messung('f6000000-0000-4000-8000-000000000541', 'f6000000-0000-4000-8000-000000000404',
                         'nachmessen', pg_temp.t('18:16'), 6.6, 1.20);
  -- Demo mit ph_nachher 6.8 (w 0.322) zählt nicht (nur echt, 8.1 Regel 7)
  select pg_temp.korrektur('f6000000-0000-4000-8000-000000000405', 'f6000000-0000-4000-8000-000000000321', 6.8);
  $f$,
  $q$select round(wirkung_ml_je_l_je_0_1, 4)::text from public.v_ph_wirkung$q$),
  '0.1074',
  'UC9-AK7 v_ph_wirkung rechnet mit dem pH der Messung nachmessen, wenn ph_nachher leer ist: 2.9 ml / (9 l · 3) = 0.1074; nur echt');

-- ---------------------------------------------------------------------
-- Rechte (CLAUDE.md, Default-Privileges von Supabase; 00_zugriff)
-- ---------------------------------------------------------------------

select is(pg_temp.rechte('public.ansatz_zustand_nachrechnen()'),
          'trigger, invoker, anon nein, authenticated nein, public nein',
          'Loesungswechsel-AK3 ansatz_zustand_nachrechnen() ist Triggerfunktion ohne security definer, EXECUTE für public, anon und authenticated entzogen');
select is(pg_temp.rechte('public.ansatz_zustand_geschuetzt()'),
          'trigger, invoker, anon nein, authenticated nein, public nein',
          'Loesungswechsel-AK3 ansatz_zustand_geschuetzt() ist Triggerfunktion ohne security definer, EXECUTE für public, anon und authenticated entzogen');

select is(pg_temp.isoliert($f$
  select pg_temp.ansatz('f6000000-0000-4000-8000-000000000401');
  select pg_temp.bis('f6000000-0000-4000-8000-000000000401', 4);
  $f$,
  $q$select pg_temp.reihe(array[
       $a$select pg_temp.wert_als('00000000-0000-4000-8000-00000000000b', $s$select count(*)::text from public.naehrloesungsansatz where id = 'f6000000-0000-4000-8000-000000000401'$s$)$a$,
       $a$select pg_temp.wert_als('00000000-0000-4000-8000-00000000000b', $s$select count(*)::text from public.ansatz_schritt where ansatz_id = 'f6000000-0000-4000-8000-000000000401'$s$)$a$,
       $a$select pg_temp.als_konto('00000000-0000-4000-8000-00000000000b', $s$update public.naehrloesungsansatz set ec_erwartet_final = 1.2 where id = 'f6000000-0000-4000-8000-000000000401'$s$)$a$,
       $a$select pg_temp.als_konto('00000000-0000-4000-8000-00000000000b', $s$update public.ansatz_schritt set storniert_am = now() where ansatz_id = 'f6000000-0000-4000-8000-000000000401'$s$)$a$,
       $a$select pg_temp.zustand('f6000000-0000-4000-8000-000000000401') || ' ' || coalesce(ec_erwartet_final::text, '-')
            from public.naehrloesungsansatz where id = 'f6000000-0000-4000-8000-000000000401'$a$])$q$),
  '0, 0, ok 0, ok 0, laufend|-|-|- -',
  'Loesungswechsel-AK3 ein fremdes Konto sieht und ändert weder Ansatz noch Schritte');

select * from finish();
rollback;
