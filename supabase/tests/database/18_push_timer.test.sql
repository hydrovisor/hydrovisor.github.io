-- 18_push_timer.test.sql · Timer-Cron, E-Mail-Index und Sicht v_push_zustellung (Plan 31 Abschnitt Migration und
-- Testliste «SQL»; Konzept R5.5, 11.3, 2.3 EK5; 06_tests.md 8 TP5, TP6, 9 UC8-AK7; Annahmen 9, 12, 13).
-- Alles in einer Transaktion mit rollback: Vault-Einträge, Abos, Versände und Tagesliste entstehen nur hier;
-- net.http_request_queue sieht der Hintergrundprozess von pg_net vor dem Commit nicht, es geht keine Anfrage hinaus.
-- Kein Geheimnis und keine Projekt-Referenz: Testwerte ohne Bedeutung, Endpoints unter example.invalid.
-- Fehlen Funktion, Job oder Sicht, liefern die Hilfen einen Fehlertext statt die Datei abzubrechen, damit jeder Fall
-- einzeln rot wird.
-- Vorausgesetzt (Plan 31 Migration):
-- - push_timer_ausloesen() liefert die Request-ID von net.http_post (bigint) oder null, Body '{}', Header
--   x-cron-geheimnis, Adresse rtrim(projekt_url, '/') || '/functions/v1/push-taeglich?nur=timer'.
-- - v_push_zustellung hat je datum_lokal die Spalten soll, gesendet_am, verspaetung_min, angezeigt_am,
--   email_gesendet_am, aufgaben, am_faelligkeitstag; soll = datum_lokal + einstellung.push_zeit in einstellung.zeitzone;
--   gesendet_am und angezeigt_am nur aus Versänden kanal push, art sammel an echte Abos.
begin;
create extension if not exists pgtap with schema extensions;
set local timezone to 'UTC';
select plan(16);

-- ---------------------------------------------------------------------
-- Hilfsfunktionen (wie 09_push_cron.test.sql)
-- ---------------------------------------------------------------------

create function pg_temp.wert(abfrage text) returns text language plpgsql as $$
declare
  ergebnis text;
begin
  execute abfrage into ergebnis;
  return ergebnis;
exception when others then
  return 'Fehler ' || sqlstate || ': ' || sqlerrm;
end $$;

create function pg_temp.tun(anweisung text) returns text language plpgsql as $$
begin
  execute anweisung;
  return 'ok';
exception when others then
  return 'Fehler ' || sqlstate || ': ' || sqlerrm;
end $$;

-- nur der SQLSTATE eines Fehlers, sonst 'ok'
create function pg_temp.status(anweisung text) returns text language plpgsql as $$
begin
  execute anweisung;
  return 'ok';
exception when others then
  return sqlstate;
end $$;

-- ---------------------------------------------------------------------
-- TP5 Cron-Job push-timer
-- ---------------------------------------------------------------------

select is(
  pg_temp.wert($q$select schedule || ' | ' || command from cron.job where jobname = 'push-timer'$q$),
  '* * * * * | select public.push_timer_ausloesen()',
  'TP5 Cron-Job push-timer mit * * * * * ruft push_timer_ausloesen()'
);

select is(
  pg_temp.wert($q$select count(*)::text from cron.job where jobname = 'push-timer' and active$q$),
  '1',
  'TP5 genau ein aktiver Cron-Job push-timer'
);

select is(
  pg_temp.wert($q$select schedule from cron.job where jobname = 'push-taeglich'$q$),
  '*/5 * * * *',
  'TP5 Cron-Job push-taeglich bleibt bei */5 * * * *'
);

-- ---------------------------------------------------------------------
-- TP5 push_timer_ausloesen ohne und mit Vault-Einträgen
-- ---------------------------------------------------------------------

select is(
  pg_temp.tun($q$delete from vault.secrets where name in ('projekt_url', 'cron_geheimnis')$q$),
  'ok',
  'TP5 Vorbereitung: Vault ohne projekt_url und cron_geheimnis'
);

create temp table anfragen_vorher as
  select pg_temp.wert($q$select coalesce(max(id), 0)::text from net.http_request_queue$q$) as max_id;

create function pg_temp.neue_anfragen() returns text language plpgsql as $$
begin
  return pg_temp.wert(format(
    'select count(*)::text from net.http_request_queue where id > %s',
    (select case when max_id ~ '^[0-9]+$' then max_id else '0' end from anfragen_vorher)));
end $$;

select is(
  pg_temp.wert($q$select coalesce(public.push_timer_ausloesen()::text, 'null')$q$) || ',' || pg_temp.neue_anfragen(),
  'null,0',
  'TP5 ohne Vault-Einträge null und keine Anfrage'
);

select is(
  pg_temp.tun($q$select vault.create_secret('http://127.0.0.1:54321/', 'projekt_url')$q$) || ','
    || pg_temp.tun($q$select vault.create_secret('pgtap-geheimnis-ohne-bedeutung', 'cron_geheimnis')$q$),
  'ok,ok',
  'TP5 Vorbereitung: projekt_url (mit Schrägstrich am Ende) und cron_geheimnis in der Transaktion angelegt'
);

create temp table ausgeloest as
  select pg_temp.wert($q$select public.push_timer_ausloesen()::text$q$) as request_id;

select is(
  pg_temp.wert(format(
    $q$select jsonb_build_object('method', q.method, 'url', q.url, 'geheimnis', q.headers ->> 'x-cron-geheimnis')::text
         from net.http_request_queue q where q.id::text = %L$q$,
    (select request_id from ausgeloest))),
  jsonb_build_object(
    'method', 'POST',
    'url', 'http://127.0.0.1:54321/functions/v1/push-taeglich?nur=timer',
    'geheimnis', 'pgtap-geheimnis-ohne-bedeutung')::text,
  'TP5 mit Vault-Einträgen (in der Transaktion) eine Anfrage an …/push-taeglich?nur=timer mit x-cron-geheimnis'
);

select is(pg_temp.neue_anfragen(), '1', 'TP5 mit Vault-Einträgen: genau eine Anfrage');

select is(
  pg_temp.wert($q$select count(*)::text from pg_indexes
                  where schemaname = 'public' and tablename = 'naehrloesungsansatz'
                    and indexname = 'naehrloesungsansatz_timer_laufend'
                    and indexdef like '%(timer_ende)%' and indexdef like '%laufend%'
                    and indexdef like '%storniert_am IS NULL%'$q$),
  '1',
  'TP5 Teilindex naehrloesungsansatz_timer_laufend auf timer_ende für laufende Ansätze ohne Storno (A13)'
);

-- ---------------------------------------------------------------------
-- TP6 E-Mail einmal je Tag (Index push_versand_einmal_email)
-- ---------------------------------------------------------------------

select is(
  pg_temp.status($q$insert into public.push_versand (kanal, abo_id, art, datum_lokal, status, app_version)
                    values ('email', null, 'sammel', '2027-01-20', 'gesendet', 'pgtap')$q$) || ','
    || pg_temp.status($q$insert into public.push_versand (kanal, abo_id, art, datum_lokal, status, app_version)
                    values ('email', null, 'sammel', '2027-01-20', 'geplant', 'pgtap')$q$) || ','
    || pg_temp.status($q$insert into public.push_versand (kanal, abo_id, art, datum_lokal, status, app_version)
                    values ('email', null, 'sammel', '2027-01-21', 'geplant', 'pgtap')$q$),
  'ok,23505,ok',
  'TP6 zweite E-Mail sammel am selben Tag scheitert mit 23505, am Folgetag nicht'
);

-- ---------------------------------------------------------------------
-- UC8-AK7 und EK5 v_push_zustellung
-- ---------------------------------------------------------------------

-- Einstellung 07:00 Zürich (nur in der Transaktion)
insert into public.einstellung (app_version) select 'pgtap' where not exists (select 1 from public.einstellung);
update public.einstellung set push_zeit = '07:00', zeitzone = 'Europe/Zurich';

insert into public.push_abo (id, geraet, endpoint, p256dh, auth_schluessel, datenart, aktiv, app_version) values
  ('18000000-0000-4000-8000-0000000000a1', 'Testgerät echt', 'https://push.example.invalid/pgtap-18-echt',
   'BPtest', 'auth', 'echt', true, 'pgtap'),
  ('18000000-0000-4000-8000-0000000000a2', 'Testgerät demo', 'https://push.example.invalid/pgtap-18-demo',
   'BPtest', 'auth', 'demo', true, 'pgtap');

insert into public.push_versand (kanal, abo_id, art, datum_lokal, titel, anzahl_aufgaben, status, gesendet_am,
                                 angezeigt_am, app_version) values
  -- 20.1. Winterzeit: Soll 06:00Z, echt gesendet 06:04Z (4 min), Demo früher um 06:01Z (zählt nicht)
  ('push', '18000000-0000-4000-8000-0000000000a1', 'sammel', '2027-01-20', 'Hydrovisor heute: 3 Routine', 3,
   'gesendet', '2027-01-20 06:04:00+00', '2027-01-20 06:05:00+00', 'pgtap'),
  ('push', '18000000-0000-4000-8000-0000000000a2', 'sammel', '2027-01-20', 'Hydrovisor heute: 1 Routine', 1,
   'gesendet', '2027-01-20 06:01:00+00', '2027-01-20 06:01:30+00', 'pgtap'),
  -- 21.1.: nur das Demo-Abo
  ('push', '18000000-0000-4000-8000-0000000000a2', 'sammel', '2027-01-21', 'Hydrovisor heute: 1 Routine', 1,
   'gesendet', '2027-01-21 06:02:00+00', null, 'pgtap'),
  -- 28.3. Sommerzeit: Soll 05:00Z, gesendet 05:04Z (4 min, nicht 64)
  ('push', '18000000-0000-4000-8000-0000000000a1', 'sammel', '2027-03-28', 'Hydrovisor heute: 2 Routine', 2,
   'gesendet', '2027-03-28 05:04:00+00', null, 'pgtap');

insert into public.aufgabe_tagesliste (tag, aufgabe_schluessel, typ, platz_id, faellig_am, app_version) values
  ('2027-01-20', 'kurzpruefung|pgtap-1|2027-01-20', 'kurzpruefung', null, '2027-01-20', 'push-taeglich'),
  ('2027-01-20', 'messen|pgtap-1|2027-01-20', 'messen', null, '2027-01-20', 'push-taeglich'),
  ('2027-01-20', 'gefaess_pruefen|pgtap-2|2027-01-18', 'gefaess_pruefen', null, '2027-01-18', 'push-taeglich');

select is(
  pg_temp.wert($q$select soll::text from public.v_push_zustellung where datum_lokal = '2027-01-20'$q$),
  '2027-01-20 06:00:00+00',
  'UC8-AK7 v_push_zustellung: Soll 07:00 Zürich am 20.1.2027 = 06:00Z'
);

select is(
  pg_temp.wert($q$select gesendet_am::text || ' | ' || (verspaetung_min::numeric = 4)::text
                  from public.v_push_zustellung where datum_lokal = '2027-01-20'$q$),
  '2027-01-20 06:04:00+00 | true',
  'UC8-AK7 v_push_zustellung: Soll 07:00 Zürich, gesendet 07:04 → 4 min'
);

select is(
  pg_temp.wert($q$select soll::text || ' | ' || (verspaetung_min::numeric = 4)::text
                  from public.v_push_zustellung where datum_lokal = '2027-03-28'$q$),
  '2027-03-28 05:00:00+00 | true',
  'UC8-AK7 v_push_zustellung: auch am 28.3.2027 (Sommerzeit) 4 min'
);

select is(
  pg_temp.wert($q$select angezeigt_am::text || ' | '
                      || (select count(*) from public.v_push_zustellung
                           where datum_lokal = '2027-01-21' and gesendet_am is not null)::text
                  from public.v_push_zustellung where datum_lokal = '2027-01-20'$q$),
  '2027-01-20 06:05:00+00 | 0',
  'UC8-AK7 v_push_zustellung zählt Demo-Abos nicht (gesendet und angezeigt nur echt; 21.1. ohne echten Versand)'
);

select is(
  pg_temp.wert($q$select aufgaben::text || ',' || am_faelligkeitstag::text
                  from public.v_push_zustellung where datum_lokal = '2027-01-20'$q$),
  '3,2',
  'EK5 v_push_zustellung zählt aufgaben und am_faelligkeitstag'
);

select is(
  pg_temp.wert($q$select (email_gesendet_am is null)::text
                  from public.v_push_zustellung where datum_lokal = '2027-03-28'$q$),
  'true',
  'UC8-AK7 v_push_zustellung: email_gesendet_am leer ohne E-Mail'
);

select * from finish();
rollback;
