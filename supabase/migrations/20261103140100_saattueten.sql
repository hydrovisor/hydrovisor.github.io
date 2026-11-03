-- =====================================================================
-- 20261103140100_saattueten.sql · Privater Bucket für Tütenfotos (Paket I0-03, Issue #9)
--
-- Herkunft: Abschnitt 9 aus docs/spec/02_datenmodell.sql (Entwurf, Stand 1.11.2026) mit Ä5
-- aus Plan docs/plaene/9.md (Konzept 11.3, 11.6 Punkt 3):
--   Ä5 Bucket privat, nur image/jpeg, höchstens 2 MB (A11); Policies je select, insert, update
--      für authenticated mit bucket_id = 'saattueten' and (select public.ist_tim()); keine
--      Delete-Policy (die App löscht nie, 8.1 Regel 3; Fotos belegen ki_feldprotokoll.fotopfad).
-- Eigene Datei, damit ein Fehler in storage das Schema in public nicht mitreisst.
-- Idempotent: Bucket mit on conflict do nothing, Policies mit drop policy if exists.
-- Pfad saattueten/{sorte_id}/{uuid}.jpg; Anzeige über signierte Links (60 s).
-- =====================================================================

insert into storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
values ('saattueten', 'saattueten', false, array['image/jpeg'], 2097152)
on conflict (id) do nothing;

drop policy if exists saattueten_lesen on storage.objects;
create policy saattueten_lesen on storage.objects for select to authenticated
  using (bucket_id = 'saattueten' and (select public.ist_tim()));

-- insert: Upload aus der Warteschlange
drop policy if exists saattueten_einfuegen on storage.objects;
create policy saattueten_einfuegen on storage.objects for insert to authenticated
  with check (bucket_id = 'saattueten' and (select public.ist_tim()));

-- update: erneuter Upload derselben Datei (upsert) aus der Warteschlange
drop policy if exists saattueten_aendern on storage.objects;
create policy saattueten_aendern on storage.objects for update to authenticated
  using (bucket_id = 'saattueten' and (select public.ist_tim()))
  with check (bucket_id = 'saattueten' and (select public.ist_tim()));
