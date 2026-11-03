-- 20261103160000_zugang_einziges_konto.sql · Zugang für das einzige Konto (Issue #9, Nachtrag I0-03)
--
-- Zweck: public.zugang ist die Grundlage von public.ist_tim(). Konzept 11.6 sieht vor, Tims Zeile von Hand
-- im SQL-Editor anzulegen. Diese einmalige, bedingte Zeile ersetzt den Handgriff, ohne Personendaten im
-- Repository: Sie trägt die Nutzer-ID des einzigen Kontos in auth.users ein.
--
-- In Produktion und hydrovisor-dev ist die Registrierung gesperrt und genau Tims Konto vorhanden; dort
-- entsteht damit genau Tims Zeile. Bei 0 Konten (lokal nach supabase db reset) oder mehr als 1 Konto hat
-- die Anweisung keine Wirkung; dann bleibt der Handgriff aus Konzept 11.6.
--
-- Kein Trigger, keine dauerhafte Regel: später angelegte Konten erhalten nie automatisch Zugang.
-- Wiederholbar (on conflict do nothing). Entscheid: docs/entscheide/0006-dev-migration-und-zugang.md.

insert into public.zugang (user_id, app_version)
select u.id, 'migration'
  from auth.users u
 where (select count(*) from auth.users) = 1
on conflict (user_id) do nothing;
