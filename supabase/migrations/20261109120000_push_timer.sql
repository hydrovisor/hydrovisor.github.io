-- Timer-Push, Zustellungsprotokoll und Teilindex für die Timer-Abfrage (I1b-06, Plan 31 Abschnitt Migration; Konzept
-- R5.5, 11.3, 2.3 EK5; Annahme 9). Additiv: eine Funktion, ein Cron-Job, eine Sicht, ein Index; keine Tabelle, keine
-- Spalte, keine RLS-Änderung, keine security-definer-Funktion.
-- Kein Geheimnis, keine Adresse und keine Projekt-Referenz im Code: projekt_url und cron_geheimnis liegen nur in Vault
-- (wie 20261104120000_push_cron.sql). Ohne beide Einträge bleibt der Job wirkungslos.
-- Rückweg im Notfall: select cron.unschedule('push-timer'); Sicht, Index und Funktion bleiben harmlos stehen.

-- Ruft push-taeglich?nur=timer mit dem Cron-Geheimnis im Header auf; ohne beide Vault-Einträge null und kein Aufruf.
-- Eigene Funktion statt Parameter an push_cron_ausloesen(): eine Überladung mit Vorgabewert macht den Aufruf ohne
-- Argument mehrdeutig (Plan 31).
create or replace function public.push_timer_ausloesen()
returns bigint language plpgsql security invoker set search_path = '' as $$
declare
  adresse text;
  geheimnis text;
begin
  select decrypted_secret into adresse from vault.decrypted_secrets where name = 'projekt_url' limit 1;
  select decrypted_secret into geheimnis from vault.decrypted_secrets where name = 'cron_geheimnis' limit 1;
  if coalesce(adresse, '') = '' or coalesce(geheimnis, '') = '' then
    return null;
  end if;
  return net.http_post(
    url := rtrim(adresse, '/') || '/functions/v1/push-taeglich?nur=timer',
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-geheimnis', geheimnis),
    timeout_milliseconds := 10000
  );
end $$;
-- Supabase vergibt EXECUTE über Default-Privileges an anon und authenticated; ausdrücklich entziehen
revoke execute on function public.push_timer_ausloesen() from public, anon, authenticated;
comment on function public.push_timer_ausloesen() is
  'Cron-Job push-timer jede Minute: POST auf <projekt_url>/functions/v1/push-taeglich?nur=timer mit x-cron-geheimnis aus Vault; ohne Vault-Einträge null (Plan 31, Annahme 9).';

-- derselbe Name ersetzt den Job: die Migration ist wiederholbar
select cron.schedule('push-timer', '* * * * *', 'select public.push_timer_ausloesen()');

-- Zustellung der Sammel-Push je Kalendertag (UC8-AK7, EK5). Tage: vom ersten bis zum letzten Tag mit einem Versand
-- sammel an ein echtes Abo, einer Sammel-E-Mail oder einer Zeile aufgabe_tagesliste, Lücken als Zeile ohne Versand,
-- damit ein ausgefallener Tag sichtbar bleibt (A). Soll mit der aktuellen Push-Zeit und Zeitzone aus einstellung
-- (A12); fehlt die Zeile, gelten die Vorgaben 07:00 und Europe/Zurich (A). Gesendet und angezeigt nur aus Versänden
-- kanal push, art sammel an Abos mit datenart echt (8.1 Regel 7). RLS der Basistabellen gilt (security_invoker).
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
  select t.tag, count(*) as aufgaben, count(*) filter (where t.faellig_am = t.tag) as am_faelligkeitstag
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
       coalesce(l.am_faelligkeitstag, 0) as am_faelligkeitstag
  from soll s
  left join push p on p.datum_lokal = s.datum_lokal
  left join email m on m.datum_lokal = s.datum_lokal
  left join liste l on l.tag = s.datum_lokal;
comment on view public.v_push_zustellung is
  'Zustellung der Sammel-Push je Kalendertag (UC8-AK7, EK5): Soll = Tag + Push-Zeit in der Zeitzone der Einstellung, frühester Versand und frühestes Anzeigen an echte Abos, Verspätung in Minuten (eine Dezimale), E-Mail-Rückfall, Aufgaben der Tagesliste und davon am Fälligkeitstag; Lücken zwischen erstem und letztem Tag als Zeile ohne Versand (Plan 31).';

-- Abfrage der laufenden Timer jede Minute (A13)
create index if not exists naehrloesungsansatz_timer_laufend on public.naehrloesungsansatz (timer_ende)
  where status = 'laufend' and storniert_am is null;
