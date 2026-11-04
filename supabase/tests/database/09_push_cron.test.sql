-- 09_push_cron.test.sql · Push-Kette pg_cron → pg_net → push-taeglich (Plan 13 Abschnitt Migration und Testliste;
-- Konzept 11.3, 11.6 Punkt 4; A3, A5). Vault-Einträge entstehen nur in dieser Transaktion und werden am Ende
-- mit ihr zurückgerollt; net.http_request_queue sieht der Hintergrundprozess von pg_net vor dem Commit nicht,
-- es geht also keine Anfrage hinaus. Kein Geheimnis und keine Projekt-Referenz: Testwerte ohne Bedeutung.
-- Fehlen Erweiterung, Funktion oder Job, liefern die Hilfen einen Fehlertext statt die Datei abzubrechen,
-- damit jeder Fall einzeln rot wird.
-- Vorausgesetzt: Die Migration legt die Vault-Einträge nicht an; push_cron_ausloesen() liefert die Request-ID von
-- net.http_post (bigint) oder null; der Body der Anfrage ist '{}'.
begin;
create extension if not exists pgtap with schema extensions;
set local timezone to 'UTC';
select plan(15);

-- ---------------------------------------------------------------------
-- Hilfsfunktionen
-- ---------------------------------------------------------------------

-- Erster Wert einer Abfrage als Text; bei einem Fehler «Fehler <sqlstate>: <Meldung>»
create function pg_temp.wert(abfrage text) returns text language plpgsql as $$
declare
  ergebnis text;
begin
  execute abfrage into ergebnis;
  return ergebnis;
exception when others then
  return 'Fehler ' || sqlstate || ': ' || sqlerrm;
end $$;

-- Anweisung ausführen; bei einem Fehler «Fehler <sqlstate>: <Meldung>», sonst 'ok'
create function pg_temp.tun(anweisung text) returns text language plpgsql as $$
begin
  execute anweisung;
  return 'ok';
exception when others then
  return 'Fehler ' || sqlstate || ': ' || sqlerrm;
end $$;

-- Rechte einer Rolle auf eine Funktion; ohne Funktion «fehlt»
create function pg_temp.darf(rolle text, funktion text) returns text language plpgsql as $$
begin
  if to_regprocedure(funktion) is null then
    return 'fehlt';
  end if;
  return has_function_privilege(rolle, funktion, 'execute')::text;
end $$;

-- ---------------------------------------------------------------------
-- 11.3 Erweiterungen und Cron-Job
-- ---------------------------------------------------------------------

select is(
  (select string_agg(extname, ',' order by extname) from pg_extension where extname in ('pg_cron', 'pg_net')),
  'pg_cron,pg_net',
  '11.3 Erweiterungen pg_cron und pg_net aktiv'
);

select is(
  pg_temp.wert($q$select schedule || ' | ' || command from cron.job where jobname = 'push-taeglich'$q$),
  '*/5 * * * * | select public.push_cron_ausloesen()',
  '11.3 Cron-Job push-taeglich mit */5 * * * * ruft push_cron_ausloesen()'
);

select is(
  pg_temp.wert($q$select count(*)::text from cron.job where jobname = 'push-taeglich' and active$q$),
  '1',
  '11.3 genau ein aktiver Cron-Job push-taeglich'
);

select ok(
  coalesce(current_setting('cron.timezone', true), '') in ('UTC', 'GMT', 'Etc/UTC'),
  '11.3 show cron.timezone ist UTC oder GMT (A5)'
);

-- ---------------------------------------------------------------------
-- 11.3 push_cron_ausloesen ohne und mit Vault-Einträgen
-- ---------------------------------------------------------------------

-- Ausgangszustand: keine Vault-Einträge dieser Namen (nur in dieser Transaktion entfernt)
select is(
  pg_temp.tun($q$delete from vault.secrets where name in ('projekt_url', 'cron_geheimnis')$q$),
  'ok',
  '11.3 Vorbereitung: Vault ohne projekt_url und cron_geheimnis'
);

create temp table anfragen_vorher as
  select pg_temp.wert($q$select coalesce(max(id), 0)::text from net.http_request_queue$q$) as max_id;

-- Anzahl neuer Anfragen seit Beginn des Tests (Text, bei fehlendem pg_net ein Fehlertext)
create function pg_temp.neue_anfragen() returns text language plpgsql as $$
begin
  return pg_temp.wert(format(
    'select count(*)::text from net.http_request_queue where id > %s',
    (select case when max_id ~ '^[0-9]+$' then max_id else '0' end from anfragen_vorher)));
end $$;

select is(
  pg_temp.wert($q$select coalesce(public.push_cron_ausloesen()::text, 'null')$q$),
  'null',
  '11.3 ohne Vault-Einträge: push_cron_ausloesen() liefert null'
);

select is(pg_temp.neue_anfragen(), '0', '11.3 ohne Vault-Einträge: kein net.http_post');

-- nur projekt_url, ohne cron_geheimnis: ebenfalls nichts
select is(
  pg_temp.tun($q$select vault.create_secret('http://127.0.0.1:54321', 'projekt_url')$q$),
  'ok',
  '11.3 Vorbereitung: projekt_url in der Transaktion angelegt'
);

select is(
  pg_temp.wert($q$select coalesce(public.push_cron_ausloesen()::text, 'null')$q$) || ',' || pg_temp.neue_anfragen(),
  'null,0',
  '11.3 nur projekt_url ohne cron_geheimnis: kein Aufruf'
);

select is(
  pg_temp.tun($q$select vault.create_secret('pgtap-geheimnis-ohne-bedeutung', 'cron_geheimnis')$q$),
  'ok',
  '11.3 Vorbereitung: cron_geheimnis in der Transaktion angelegt'
);

create temp table ausgeloest as
  select pg_temp.wert($q$select public.push_cron_ausloesen()::text$q$) as request_id;

select is(
  pg_temp.wert(format(
    $q$select jsonb_build_object('method', q.method, 'url', q.url, 'geheimnis', q.headers ->> 'x-cron-geheimnis')::text
         from net.http_request_queue q where q.id::text = %L$q$,
    (select request_id from ausgeloest))),
  jsonb_build_object(
    'method', 'POST',
    'url', 'http://127.0.0.1:54321/functions/v1/push-taeglich',
    'geheimnis', 'pgtap-geheimnis-ohne-bedeutung')::text,
  '11.3 mit Vault-Einträgen (in der Transaktion angelegt): eine Anfrage an …/functions/v1/push-taeglich mit Header x-cron-geheimnis'
);

select is(pg_temp.neue_anfragen(), '1', '11.3 mit Vault-Einträgen: genau eine Anfrage');

-- ---------------------------------------------------------------------
-- 11.3 push_cron_pruefen
-- ---------------------------------------------------------------------

select is(
  pg_temp.wert($q$select public.push_cron_pruefen('pgtap-geheimnis-ohne-bedeutung')::text || ','
                      || public.push_cron_pruefen('falsch')::text || ','
                      || public.push_cron_pruefen('')::text$q$),
  'true,false,false',
  '11.3 push_cron_pruefen: richtig true, falsch false, leer false'
);

select is(
  pg_temp.wert($q$with weg as (delete from vault.secrets where name = 'cron_geheimnis' returning 1)
                  select (select count(*) from weg)::text || ','
                      || public.push_cron_pruefen('pgtap-geheimnis-ohne-bedeutung')::text$q$),
  '1,false',
  '11.3 push_cron_pruefen ohne Vault-Eintrag false'
);

-- ---------------------------------------------------------------------
-- 11.6 EXECUTE
-- ---------------------------------------------------------------------

select is(
  array[
    pg_temp.darf('anon', 'public.push_cron_ausloesen()'),
    pg_temp.darf('authenticated', 'public.push_cron_ausloesen()'),
    pg_temp.darf('anon', 'public.push_cron_pruefen(text)'),
    pg_temp.darf('authenticated', 'public.push_cron_pruefen(text)'),
    pg_temp.darf('service_role', 'public.push_cron_pruefen(text)')
  ],
  array['false', 'false', 'false', 'false', 'true'],
  '11.6 EXECUTE: push_cron_ausloesen und push_cron_pruefen für anon und authenticated verweigert; push_cron_pruefen für service_role erlaubt'
);

select * from finish();
rollback;
