-- Push-Kette pg_cron → pg_net → Edge Function push-taeglich (I0-08, Plan 13 Abschnitt Migration; Konzept 11.3,
-- 11.6 Punkt 4). Additiv: zwei Erweiterungen, zwei Funktionen, ein Cron-Job; keine Tabelle, Spalte oder Sicht.
-- Kein Geheimnis, keine Adresse und keine Projekt-Referenz im Code: projekt_url und cron_geheimnis liegen nur in
-- Vault und setzt Tim in der Produktion (Plan 13 Handgriff 7). Ohne beide Einträge bleibt der Job wirkungslos (A3).
-- Rückweg im Notfall: select cron.unschedule('push-taeglich');

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Ruft push-taeglich mit dem Cron-Geheimnis im Header auf; ohne beide Vault-Einträge null und kein Aufruf.
create or replace function public.push_cron_ausloesen()
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
    url := rtrim(adresse, '/') || '/functions/v1/push-taeglich',
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-geheimnis', geheimnis),
    timeout_milliseconds := 10000
  );
end $$;
revoke execute on function public.push_cron_ausloesen() from public, anon, authenticated;
comment on function public.push_cron_ausloesen() is
  'Cron-Job push-taeglich alle 5 min: POST auf <projekt_url>/functions/v1/push-taeglich mit x-cron-geheimnis aus Vault; ohne Vault-Einträge null (Plan 13, A3).';

-- Prüft das Cron-Geheimnis der Function gegen Vault; das Geheimnis liegt an genau einer Stelle.
create or replace function public.push_cron_pruefen(geheimnis text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  soll text;
begin
  select decrypted_secret into soll from vault.decrypted_secrets where name = 'cron_geheimnis' limit 1;
  return coalesce(soll, '') <> '' and coalesce(push_cron_pruefen.geheimnis, '') = soll;
end $$;
-- Supabase vergibt EXECUTE über Default-Privileges an anon und authenticated; ausdrücklich entziehen (D1)
revoke execute on function public.push_cron_pruefen(text) from public, anon, authenticated;
grant execute on function public.push_cron_pruefen(text) to service_role;
comment on function public.push_cron_pruefen(text) is
  'true genau dann, wenn der Header x-cron-geheimnis gleich cron_geheimnis in Vault ist; nur service_role (Plan 13).';

-- derselbe Name ersetzt den Job: die Migration ist wiederholbar
select cron.schedule('push-taeglich', '*/5 * * * *', 'select public.push_cron_ausloesen()');
