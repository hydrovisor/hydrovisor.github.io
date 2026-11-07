-- I1b-09 (#118, Plan 118): Die Push liest die nach R5.6 verteilte Liste. Vorgezogene Ansätze stehen ein bis zwei Tage
-- vor ihrer Fälligkeit in aufgabe_tagesliste (Schlüssel und faellig_am bleiben). Nur Sichten, additiv
-- (create or replace view, gleiche Spalten am Anfang); keine Tabelle, keine Rechte, keine RLS-Änderung.

-- Termintreue (Konzept 8.6): je Schlüssel genau eine Zeile im Nenner, die mit dem frühesten Tag im Fenster (A3).
-- daten.ts schreibt einen Schlüssel schon nur am ersten Tag (Plan 31 A7); die Sicht sichert das unabhängig vom
-- Schreibweg. Fenster- und Datenartfilter vor der Auswahl, damit ein vor dem 7.1. gelisteter Schlüssel im Fenster zählt.
create or replace view public.v_termintreue with (security_invoker = true) as
with im_fenster as (
  select distinct on (t.aufgabe_schluessel) t.tag, t.aufgabe_schluessel, t.faellig_am
    from public.aufgabe_tagesliste t
    join public.auswertung_fenster f on f.name = 'testbetrieb' and t.tag >= public.kalendertag(f.von) and t.tag < public.kalendertag(f.bis)
    left join public.v_auswertung_platz ap on ap.platz_id = t.platz_id
   where t.platz_id is null or ap.platz_id is not null
   order by t.aufgabe_schluessel, t.tag
)
select t.tag, count(*) as faellig,
       count(*) filter (where exists (
         select 1 from public.ereignis e where e.aufgabe_schluessel = t.aufgabe_schluessel and e.storniert_am is null
            and not e.nacherfasst and public.kalendertag(e.gilt_ab) <= t.faellig_am + 1
         union all
         select 1 from public.messung m where m.aufgabe_schluessel = t.aufgabe_schluessel and m.storniert_am is null
            and not m.nacherfasst and public.kalendertag(m.gilt_ab) <= t.faellig_am + 1
         union all
         select 1 from public.naehrloesungsansatz a where a.aufgabe_schluessel = t.aufgabe_schluessel and a.storniert_am is null
            and not a.nacherfasst and public.kalendertag(a.gilt_ab) <= t.faellig_am + 1
         union all
         select 1 from public.kalibrierung k where k.aufgabe_schluessel = t.aufgabe_schluessel and k.storniert_am is null
            and not k.nacherfasst and public.kalendertag(k.gilt_ab) <= t.faellig_am + 1)) as erledigt_bis_folgetag
  from im_fenster t
 group by t.tag;
comment on view public.v_termintreue is 'Messplan Termintreue: Anteil der Aufgaben aus aufgabe_tagesliste, erledigt bis fällig + 1 Tag, ohne nacherfasste; je Schlüssel einmal, am frühesten Tag der Tagesliste im Fenster; nur echt im Fenster testbetrieb.';

-- Zustellung (EK5): neue letzte Spalte vor_faelligkeitstag zählt die nach R5.6 vorgezogenen Zeilen (faellig_am > tag).
-- Rechtzeitig im Sinn von EK5 sind am_faelligkeitstag + vor_faelligkeitstag (A4). Sonst unverändert aus
-- 20261109120000_push_timer.sql.
create or replace view public.v_push_zustellung with (security_invoker = true) as
with tage_mit_daten as (
  select v.datum_lokal as tag
    from public.push_versand v
    join public.push_abo a on a.id = v.abo_id and a.datenart = 'echt'
   where v.kanal = 'push' and v.art = 'sammel'
  union
  select v.datum_lokal from public.push_versand v where v.kanal = 'email' and v.art = 'sammel'
  union
  select t.tag from public.aufgabe_tagesliste t
),
tage as (
  select g::date as datum_lokal
    from (select min(tag) as von, max(tag) as bis from tage_mit_daten) b,
         generate_series(b.von, b.bis, interval '1 day') g
),
vorgabe as (
  select coalesce(e.push_zeit, time '07:00') as push_zeit, coalesce(e.zeitzone, 'Europe/Zurich') as zeitzone
    from (select 1) eins
    left join public.einstellung e on true
),
push as (
  select v.datum_lokal, min(v.gesendet_am) as gesendet_am, min(v.angezeigt_am) as angezeigt_am
    from public.push_versand v
    join public.push_abo a on a.id = v.abo_id and a.datenart = 'echt'
   where v.kanal = 'push' and v.art = 'sammel'
   group by v.datum_lokal
),
email as (
  select v.datum_lokal, min(v.gesendet_am) as email_gesendet_am
    from public.push_versand v
   where v.kanal = 'email' and v.art = 'sammel'
   group by v.datum_lokal
),
liste as (
  select t.tag, count(*) as aufgaben, count(*) filter (where t.faellig_am = t.tag) as am_faelligkeitstag,
         count(*) filter (where t.faellig_am > t.tag) as vor_faelligkeitstag
    from public.aufgabe_tagesliste t
   group by t.tag
),
soll as (
  select d.datum_lokal, (d.datum_lokal + w.push_zeit) at time zone w.zeitzone as soll
    from tage d cross join vorgabe w
)
select s.datum_lokal,
       s.soll,
       p.gesendet_am,
       round(extract(epoch from p.gesendet_am - s.soll) / 60, 1) as verspaetung_min,
       p.angezeigt_am,
       m.email_gesendet_am,
       coalesce(l.aufgaben, 0) as aufgaben,
       coalesce(l.am_faelligkeitstag, 0) as am_faelligkeitstag,
       coalesce(l.vor_faelligkeitstag, 0) as vor_faelligkeitstag
  from soll s
  left join push p on p.datum_lokal = s.datum_lokal
  left join email m on m.datum_lokal = s.datum_lokal
  left join liste l on l.tag = s.datum_lokal;
comment on view public.v_push_zustellung is
  'Zustellung der Sammel-Push je Kalendertag (UC8-AK7, EK5): Soll = Tag + Push-Zeit in der Zeitzone der Einstellung, frühester Versand und frühestes Anzeigen an echte Abos, Verspätung in Minuten (eine Dezimale), E-Mail-Rückfall, Aufgaben der Tagesliste, davon am Fälligkeitstag und davon vor dem Fälligkeitstag (nach R5.6 vorgezogen, Plan 118); Lücken zwischen erstem und letztem Tag als Zeile ohne Versand (Plan 31).';
