-- 13_vorlagen_regal.test.sql · Vorlagen Box und Deckel: das erfasste Regal zählt 84 Löcher (Plan 19 Testliste SQL;
-- UC2-AK5; Konzept 5.3, 5.4; 06_tests.md Abschnitt 9). Eigene Anlage UV mit Datenart test (Plan 19 A12), angelegt als
-- Tim (authenticated, RLS greift) wie über den Schreibweg der App. Innenmasse = Aussenmasse aus Konzept 5.3 (A13).
-- Lochbilder wie tests/fixtures/lochbilder.ts (A1). Alles in einer Transaktion mit rollback.
begin;
create extension if not exists pgtap with schema extensions;
set local timezone to 'UTC';
select plan(7);

-- ---------------------------------------------------------------------
-- Zugang als postgres: Testkonto ohne Personendaten
-- ---------------------------------------------------------------------

insert into auth.users (id) values ('00000000-0000-4000-8000-000000000019') on conflict (id) do nothing;
insert into public.zugang (user_id, app_version) values ('00000000-0000-4000-8000-000000000019', 'pgtap')
  on conflict (user_id) do nothing;

-- aktive Gefässe der Anlage UV mit Ebene; als Funktion in pg_temp (security invoker:
-- sie zählt mit den Rechten des Aufrufers, unten als Tim)
create function pg_temp.uv_gefaess() returns table (platz_id uuid, deckeltyp_id uuid, ebene smallint)
  language sql stable as $$
  select g.platz_id, g.deckeltyp_id, b.nummer
    from public.gefaess g
    join public.platz p on p.id = g.platz_id
    join public.bereich b on b.id = p.bereich_id
   where p.anlage_id = '19000000-0000-4000-8000-00000000a000'
     and g.gueltig_bis is null and g.storniert_am is null
$$;

-- ---------------------------------------------------------------------
-- Erfassung des Regals als Tim (authenticated)
-- ---------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000019","role":"authenticated"}', true);

insert into public.anlage (id, name, kuerzel, datenart, app_version)
  values ('19000000-0000-4000-8000-00000000a000', 'Testanlage Vorlagen', 'UV', 'test', 'pgtap');

insert into public.bereich (id, anlage_id, nummer, name, standard_betriebsart, app_version) values
  ('19000000-0000-4000-8000-00000000b001', '19000000-0000-4000-8000-00000000a000', 1, 'Ebene 1', 'dwc', 'pgtap'),
  ('19000000-0000-4000-8000-00000000b002', '19000000-0000-4000-8000-00000000a000', 2, 'Ebene 2', 'dwc', 'pgtap'),
  ('19000000-0000-4000-8000-00000000b003', '19000000-0000-4000-8000-00000000a000', 3, 'Ebene 3', 'kratky_belueftet', 'pgtap'),
  ('19000000-0000-4000-8000-00000000b004', '19000000-0000-4000-8000-00000000a000', 4, 'Ebene 4', 'konstantpegel', 'pgtap');

-- 13 Plätze für Gefässe, 4 für Anzuchtorte (Ebene 4 rechts neben den Stationen)
insert into public.platz (id, anlage_id, bereich_id, kennung, rolle, position, app_version)
select ('19000000-0000-4000-8000-0000000c' || lpad(n::text, 4, '0'))::uuid,
       '19000000-0000-4000-8000-00000000a000',
       ('19000000-0000-4000-8000-00000000b00' || ebene)::uuid,
       kennung, rolle::public.platz_rolle, pos, 'pgtap'
  from (values
    (1, 1, '1.1', 'gefaess', 1), (2, 1, '1.2', 'gefaess', 2),
    (3, 2, '2.1', 'gefaess', 1), (4, 2, '2.2', 'gefaess', 2), (5, 2, '2.3', 'gefaess', 3),
    (6, 3, '3.1', 'gefaess', 1), (7, 3, '3.2', 'gefaess', 2), (8, 3, '3.3', 'gefaess', 3),
    (9, 4, '4.1', 'gefaess', 1), (10, 4, '4.2', 'gefaess', 2), (11, 4, '4.3', 'gefaess', 3),
    (12, 4, '4.4', 'gefaess', 4), (13, 4, '4.5', 'gefaess', 5),
    (14, 4, 'A1', 'anzuchtort', 6), (15, 4, 'A2', 'anzuchtort', 7),
    (16, 4, 'A3', 'anzuchtort', 8), (17, 4, 'A4', 'anzuchtort', 9)
  ) as p(n, ebene, kennung, rolle, pos);

-- sechs Gefässmodelle nach Konzept 5.3 (Innenmasse = Aussenmasse, A13)
insert into public.gefaessmodell (id, name, form, innen_l_mm, innen_b_mm, innen_h_mm, nennvolumen_l, betriebsvolumen_l, app_version) values
  ('19000000-0000-4000-8000-00000000d001', 'Rako 40 × 30 × 27', 'rechteckig', 400, 300, 270, 25, 20, 'pgtap'),
  ('19000000-0000-4000-8000-00000000d002', 'Rako 40 × 30 × 17', 'rechteckig', 400, 300, 170, 15, 9, 'pgtap'),
  ('19000000-0000-4000-8000-00000000d003', 'Rako 30 × 20 × 17', 'rechteckig', 300, 200, 170, null, 4, 'pgtap'),
  ('19000000-0000-4000-8000-00000000d004', 'Rako 40 × 30 × 12', 'rechteckig', 400, 300, 120, 10, 7, 'pgtap'),
  ('19000000-0000-4000-8000-00000000d005', 'Rako 30 × 20 × 12', 'rechteckig', 300, 200, 120, null, 3, 'pgtap'),
  ('19000000-0000-4000-8000-00000000d006', 'Leni Flori 36', 'oval', 365, 135, 110, 3.7, 2.3, 'pgtap');

-- sieben Deckel- und Plattentypen (Plan 19 «Lochbilder der sieben Typen»)
insert into public.deckeltyp (id, name, topfdurchmesser_mm, loecher_je_reihe, service_oeffnung, app_version) values
  ('19000000-0000-4000-8000-00000000e001', 'D1', 80, '{2,2}', true, 'pgtap'),
  ('19000000-0000-4000-8000-00000000e002', 'D2', 80, '{3,3}', true, 'pgtap'),
  ('19000000-0000-4000-8000-00000000e004', 'D4', 80, '{1,1}', true, 'pgtap'),
  ('19000000-0000-4000-8000-00000000e003', 'D3', 50, '{4,4}', true, 'pgtap'),
  ('19000000-0000-4000-8000-00000000e006', 'D6', 50, '{2,2,2}', true, 'pgtap'),
  ('19000000-0000-4000-8000-00000000e008', 'S8', 80, '{4}', true, 'pgtap'),
  ('19000000-0000-4000-8000-00000000e005', 'S5', 50, '{1,2,1,2,1,2,1,2,1}', true, 'pgtap');

-- 13 Gefässe: Box, Deckel, Betriebsart, feste Dosis für die Stationen 4.1 bis 4.5, Pumpe (4.5 an P3, Konzept 5.3)
insert into public.gefaess (platz_id, gefaessmodell_id, deckeltyp_id, betriebsart, feste_dosis, luftpumpe,
                            betriebsvolumen_l, intervall_messen_d, intervall_wechseln_d, app_version)
select ('19000000-0000-4000-8000-0000000c' || lpad(n::text, 4, '0'))::uuid,
       ('19000000-0000-4000-8000-00000000d00' || modell)::uuid,
       ('19000000-0000-4000-8000-00000000e00' || deckel)::uuid,
       art::public.betriebsart, art = 'konstantpegel', pumpe::public.luftpumpe, volumen,
       case when art = 'kratky_belueftet' then 7 else 2 end,
       case when art = 'kratky_belueftet' then null else 14 end,
       'pgtap'
  from (values
    (1, 1, 1, 'dwc', 'P1', 20), (2, 1, 1, 'dwc', 'P1', 20),
    (3, 2, 2, 'dwc', 'P2', 9), (4, 3, 4, 'dwc', 'P2', 4), (5, 2, 2, 'dwc', 'P2', 9),
    (6, 4, 3, 'kratky_belueftet', 'P3', 7), (7, 5, 6, 'kratky_belueftet', 'P3', 3), (8, 4, 3, 'kratky_belueftet', 'P3', 7),
    (9, 5, 6, 'konstantpegel', 'P4', 3), (10, 6, 8, 'konstantpegel', 'P4', 2.3), (11, 6, 8, 'konstantpegel', 'P4', 2.3),
    (12, 6, 5, 'konstantpegel', 'P4', 2.3), (13, 6, 5, 'konstantpegel', 'P3', 2.3)
  ) as g(n, modell, deckel, art, pumpe, volumen);

-- Anzuchtboxen A1, A2 Lichtkeimer, A3, A4 Dunkelkeimer, je 25 Würfel (Konzept 5.3, 5.8)
insert into public.anzuchtort (platz_id, typ, platzzahl, position, app_version) values
  ('19000000-0000-4000-8000-0000000c0014', 'box_licht', 25, 'vorne', 'pgtap'),
  ('19000000-0000-4000-8000-0000000c0015', 'box_licht', 25, 'hinten', 'pgtap'),
  ('19000000-0000-4000-8000-0000000c0016', 'box_dunkel', 25, 'vorne', 'pgtap'),
  ('19000000-0000-4000-8000-0000000c0017', 'box_dunkel', 25, 'hinten', 'pgtap');

-- ---------------------------------------------------------------------
-- Zählung als Tim (was die App über RLS sieht)
-- ---------------------------------------------------------------------

select is(
  (select string_agg(d.name, ', ' order by d.name)
     from public.deckeltyp d
    where d.storniert_am is null
      and d.id in (select deckeltyp_id from pg_temp.uv_gefaess())),
  'D1, D2, D3, D4, D6, S5, S8',
  'UC2-AK5 sieben Deckel- und Plattentypen erfasst und an den Gefässen genutzt');

select is(
  (select count(*)::int from pg_temp.uv_gefaess()),
  13,
  'UC2-AK5 13 aktive Gefässe, davon 5 Stationen mit fester Dosis auf Ebene 4');

select is(
  (select sum(x)::int
     from pg_temp.uv_gefaess() g
     join public.deckeltyp d on d.id = g.deckeltyp_id
     cross join lateral unnest(d.loecher_je_reihe) as x),
  84,
  'UC2-AK5 die 13 Gefässe zählen 84 Löcher');

select is(
  (select string_agg(z.zeile, ', ' order by z.groesse desc)
     from (select d.topfdurchmesser_mm as groesse, (sum(x) || ' × ' || d.topfdurchmesser_mm / 10 || ' cm') as zeile
             from pg_temp.uv_gefaess() g
             join public.deckeltyp d on d.id = g.deckeltyp_id
             cross join lateral unnest(d.loecher_je_reihe) as x
            where g.ebene between 1 and 3
            group by d.topfdurchmesser_mm) z),
  '22 × 8 cm, 22 × 5 cm',
  'UC2-AK5 44 Zieltöpfe auf Ebene 1 bis 3: 22 × 8 cm, 22 × 5 cm');

select is(
  (select string_agg(z.zeile, ', ' order by z.groesse_mm desc)
     from (select s.groesse_mm, (sum(s.loecher) || ' × ' || s.groesse_mm / 10 || ' cm' || ' auf ' || count(*)) as zeile
             from public.v_station_frei s
             join public.platz p on p.id = s.platz_id
            where p.anlage_id = '19000000-0000-4000-8000-00000000a000'
            group by s.groesse_mm) z),
  '8 × 8 cm auf 2, 32 × 5 cm auf 3',
  'UC2-AK5 40 Stationsplätze auf Ebene 4: 8 × 8 cm, 32 × 5 cm aus v_station_frei (5 Stationen)');

select is(
  (select string_agg(p.kennung || ' ' || a.typ || ' ' || a.platzzahl, ', ' order by p.kennung)
     from public.anzuchtort a
     join public.platz p on p.id = a.platz_id
    where p.anlage_id = '19000000-0000-4000-8000-00000000a000' and a.storniert_am is null),
  'A1 box_licht 25, A2 box_licht 25, A3 box_dunkel 25, A4 box_dunkel 25',
  'UC2-AK5 Anzuchtboxen A1 bis A4 je 25 Würfelplätze');

select is(
  (select count(*)::int
     from public.gefaess g
     join public.anzuchtort a on a.platz_id = g.platz_id
     join public.platz p on p.id = a.platz_id
    where p.anlage_id = '19000000-0000-4000-8000-00000000a000'),
  0,
  'UC2-AK5 Anzuchtboxen ohne Löcher: an ihren Plätzen steht kein Gefäss, also kein Deckeltyp');

reset role;
select * from finish();
rollback;
