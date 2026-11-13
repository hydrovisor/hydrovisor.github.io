-- 20261113120000_tuetenfoto.sql · Tütenfotos je Sorte und Seite (Issue #207; Konzept 8.1 Regel 2, 3 und 6, 11.3,
-- 11.6 Punkt 3; Plan 37 A16; Bucket aus 20261103140100_saattueten.sql, Rechte wie 20261104170000_tabellenrechte.sql,
-- 20261104171000_service_ohne_delete.sql, 20261104230000_anon_ohne_tabellenrechte.sql und 20261104150000_backup_rollen.sql).
--
-- Additiv: eine neue Tabelle mit Index, RLS-Policies und Rechten; keine bestehende Tabelle, Sicht oder Funktion ändert sich.
--   tuetenfoto   Verweis auf ein Foto im privaten Bucket saattueten (Pfad <ordner>/<uuid>.jpg). Ersetzen = Storno plus
--                neue Zeile (8.1 Regel 2 und 3); es gilt das jüngste nicht stornierte Foto je Sorte und Seite.
-- Keine Spalte datenart: Tütenfotos gehören zu echten Sorten; datenart_loeschen bleibt unverändert.
--
-- Rechte (A): Die Default-Privileges der Rolle postgres in public ergeben schon den Sollstand (authenticated genau
-- SELECT, INSERT, UPDATE, DELETE; service_role genau SELECT, INSERT, UPDATE; anon nichts; backup_leser SELECT; kein
-- TRUNCATE). Abschnitt 3 setzt denselben Stand für diese Tabelle trotzdem ausdrücklich, damit er nicht davon abhängt,
-- unter welcher Rolle der Runner die Migration ausführt (Lehre aus #65: lokal und gehostet wichen ab).
--
-- Wiederholbar: Policies mit drop policy if exists, Grants und Revokes sind wiederholbar; create table und create index
-- laufen nur einmal (Migrationsliste).
-- Rückweg (Folgemigration): drop table public.tuetenfoto nur, solange die Tabelle leer ist; sonst stehen lassen
-- (Fotos im Bucket bleiben in jedem Fall, die App löscht nie).

-- ---------------------------------------------------------------------
-- 1. Tabelle
-- ---------------------------------------------------------------------
create table public.tuetenfoto (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  sorte_id uuid not null references public.sorte_schluessel (id),
  saatgut_id uuid references public.saatgut (id),
  seite text not null check (seite in ('vorne', 'hinten')),
  pfad text not null check (pfad ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$'),
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz
);
comment on table public.tuetenfoto is
  'Tütenfoto je Sorte und Seite (vorne, hinten) im privaten Bucket saattueten (#207, Konzept 11.3). pfad ist <ordner>/<uuid>.jpg; der Ordner ist die beim Öffnen von «Neue Sorte» erzeugte sorte_id und kann bei «Packung zu …» von sorte_id abweichen (Plan 37 A16). Ersetzen = Storno plus neue Zeile; es gilt das jüngste nicht stornierte Foto je Sorte und Seite. Anzeige über signierte Links (60 s). Kein Löschen durch die App (8.1 Regel 3).';

-- Gültige Fotos je Sorte (Sortendetail, Backup-Abgleich)
create index tuetenfoto_sorte on public.tuetenfoto (sorte_id) where storniert_am is null;

-- ---------------------------------------------------------------------
-- 2. Zeilensicherheit wie die Schleife in 20261103140000_datenmodell.sql Abschnitt 8 (Erfassungstabelle:
--    lesen, einfügen, ändern; keine Delete-Policy)
-- ---------------------------------------------------------------------
alter table public.tuetenfoto enable row level security;

drop policy if exists tim_lesen on public.tuetenfoto;
create policy tim_lesen on public.tuetenfoto for select to authenticated
  using ((select public.ist_tim()));

drop policy if exists tim_einfuegen on public.tuetenfoto;
create policy tim_einfuegen on public.tuetenfoto for insert to authenticated
  with check ((select public.ist_tim()));

-- update: Storno (storniert_am) und erneutes Senden derselben client_id (Upsert aus der Warteschlange)
drop policy if exists tim_aendern on public.tuetenfoto;
create policy tim_aendern on public.tuetenfoto for update to authenticated
  using ((select public.ist_tim()))
  with check ((select public.ist_tim()));

-- ---------------------------------------------------------------------
-- 3. Tabellenrechte ausdrücklich (A, siehe Kopf): gleicher Stand wie die übrigen Tabellen in public
-- ---------------------------------------------------------------------
revoke all on table public.tuetenfoto from anon, authenticated, service_role;
grant select, insert, update, delete on table public.tuetenfoto to authenticated;
grant select, insert, update on table public.tuetenfoto to service_role;
grant select on table public.tuetenfoto to backup_leser;

-- ---------------------------------------------------------------------
-- 4. Rückfall E7 wie 20261104150000_backup_rollen.sql Abschnitt 4: ohne BYPASSRLS eine Policy backup_lesen
--    (nur select, nur backup_leser); mit BYPASSRLS keine
-- ---------------------------------------------------------------------
do $$
declare
  mit_bypass boolean := (select rolbypassrls from pg_roles where rolname = 'backup_leser');
begin
  drop policy if exists backup_lesen on public.tuetenfoto;
  if not mit_bypass then
    create policy backup_lesen on public.tuetenfoto for select to backup_leser using (true);
  end if;
end $$;
