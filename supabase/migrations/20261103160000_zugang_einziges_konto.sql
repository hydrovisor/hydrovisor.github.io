-- 20261103160000_zugang_einziges_konto.sql · Zugang für das einzige Konto (Issue #9, Nachtrag I0-03)
--
-- Zweck: public.zugang ist die Grundlage von public.ist_tim(). Konzept 11.6 sieht vor, Tims Zeile von Hand
-- im SQL-Editor anzulegen. Diese einmalige, bedingte Zeile ersetzt den Handgriff, ohne Personendaten im
-- Repository: Sie trägt die Nutzer-ID des einzigen nicht-anonymen Kontos in auth.users ein.
--
-- In Produktion und hydrovisor-dev ist die Registrierung gesperrt und genau Tims Konto vorhanden; dort
-- entsteht damit genau Tims Zeile. Keine Wirkung, wenn
--   - 0 oder mehr als 1 nicht-anonymes Konto besteht (lokal nach supabase db reset: 0 Konten),
--   - zugang bereits eine Zeile enthält (z. B. von Hand angelegt; keine zweite Zeile für ein anderes Konto).
-- Anonyme Konten (auth.users.is_anonymous) zählen nicht und erhalten nie Zugang. Ohne Wirkung bleibt der
-- Handgriff aus Konzept 11.6.
--
-- Kein Trigger, keine dauerhafte Regel: später angelegte Konten erhalten nie automatisch Zugang.
-- Wiederholbar (not exists, on conflict do nothing). Entscheid: docs/entscheide/0006-dev-migration-und-zugang.md.

insert into public.zugang (user_id, app_version)
select u.id, 'migration'
  from auth.users u
 where not u.is_anonymous
   and (select count(*) from auth.users where not is_anonymous) = 1
   and not exists (select 1 from public.zugang)
on conflict (user_id) do nothing;
