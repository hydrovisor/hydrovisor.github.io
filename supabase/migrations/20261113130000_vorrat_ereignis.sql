-- 20261113130000_vorrat_ereignis.sql · Vorrat einer Sorte: «Kein Saatgut mehr» und «Wieder vorrätig» (Issue #215,
-- Plan 215 Abschnitt «Migration», A1 bis A5; Konzept 8.1 Regeln 2, 3 und 6, 11.4; Muster 20261113120000_tuetenfoto.sql,
-- Zeitachse wie public.aufschub in 20261103140000_datenmodell.sql; Rechte wie 20261104170000_tabellenrechte.sql,
-- 20261104171000_service_ohne_delete.sql, 20261104230000_anon_ohne_tabellenrechte.sql und 20261104150000_backup_rollen.sql).
--
-- Additiv: eine neue Tabelle mit Index, RLS-Policies und Rechten; keine bestehende Tabelle, Sicht oder Funktion ändert sich.
--   vorrat_ereignis   Erfassungstabelle (ergänzt Konzept 8.2 und die Liste in 8.1 Regel 3, Plan 215 Abweichung 1):
--                     je Handlung eine Zeile mit typ aufgebraucht oder vorraetig. Es gilt das jüngste nicht stornierte
--                     Ereignis der Sorte bis jetzt; eine danach erfasste Packung macht wieder vorrätig (A5). Den Stand
--                     rechnet src/domain/sorten/vorrat.ts aus dem Bündel (Plan 215 Abweichung 2), keine Sicht.
-- Keine Spalte datenart (A4): Das Ereignis gehört zu einer echten Sorte; datenart_loeschen bleibt unverändert.
--
-- Rechte (A): Die Default-Privileges der Rolle postgres in public ergeben schon den Sollstand (authenticated genau
-- SELECT, INSERT, UPDATE, DELETE; service_role genau SELECT, INSERT, UPDATE; anon nichts; backup_leser SELECT; kein
-- TRUNCATE). Abschnitt 3 setzt denselben Stand für diese Tabelle trotzdem ausdrücklich, damit er nicht davon abhängt,
-- unter welcher Rolle der Runner die Migration ausführt (Lehre aus #65: lokal und gehostet wichen ab).
--
-- Wiederholbar: Policies mit drop policy if exists, Grants und Revokes sind wiederholbar; create table und create index
-- laufen nur einmal (Migrationsliste).
-- Rückweg (Folgemigration): drop table public.vorrat_ereignis nur, solange die Tabelle leer ist; sonst stehen lassen
-- (ein alter Client liest sie nicht, die App löscht nie).

-- ---------------------------------------------------------------------
-- 1. Tabelle (Spalten der Zeitachse nach 8.1 Regel 3 wie public.aufschub, ohne datenart)
-- ---------------------------------------------------------------------
create table public.vorrat_ereignis (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  sorte_id uuid not null references public.sorte_schluessel (id),
  saatgut_id uuid references public.saatgut (id),
  typ text not null check (typ in ('aufgebraucht', 'vorraetig')),
  gilt_ab timestamptz not null,
  client_zeit timestamptz,
  nacherfasst boolean generated always as (erfasst_am - gilt_ab > interval '2 hours') stored,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz,
  storno_grund public.storno_grund,
  ersetzt_id uuid references public.vorrat_ereignis (id) on delete set null
);
comment on table public.vorrat_ereignis is
  'Vorrat einer Sorte (#215, Plan 215): «Kein Saatgut mehr» (typ aufgebraucht) und «Wieder vorrätig» (typ vorraetig), je Handlung eine Zeile (8.1 Regel 2). Es gilt das jüngste nicht stornierte Ereignis der Sorte bis jetzt (nach gilt_ab, dann erfasst_am, dann id); eine danach erfasste, nicht stornierte Packung (saatgut.erfasst_am nach erfasst_am des Ereignisses) macht wieder vorrätig. Den Stand rechnet src/domain/sorten/vorrat.ts. Korrektur = Storno plus neue Zeile; die App löscht nie (8.1 Regel 3). Keine datenart: gehört zur echten Sorte.';
comment on column public.vorrat_ereignis.sorte_id is 'Sorte, deren Vorrat sich ändert (Ereignis je Sorte, Issue-Annahme 1).';
comment on column public.vorrat_ereignis.saatgut_id is 'Optional: Packung, auf die sich das Ereignis bezieht (Plan 215 A3); die Maske schreibt sie nicht (null). Keine Prüfung, ob die Packung zur Sorte gehört.';
comment on column public.vorrat_ereignis.typ is 'aufgebraucht (Kein Saatgut mehr) oder vorraetig (Wieder vorrätig); text mit check, damit ein späterer Wert additiv bleibt (Plan 215 A3).';
comment on column public.vorrat_ereignis.gilt_ab is 'Fachlicher Zeitpunkt der Handlung (Gerätezeit, 8.1 Regel 3); ein Ereignis nach jetzt zählt nicht.';
comment on column public.vorrat_ereignis.client_zeit is 'Uhrzeit des Geräts beim Erfassen (zeileVorbereiten, 8.1 Regel 3).';
comment on column public.vorrat_ereignis.nacherfasst is 'Berechnet: erfasst_am - gilt_ab > 2 Stunden (8.1 Regel 3).';
comment on column public.vorrat_ereignis.erfasst_am is 'Serverzeit; massgebend für den Vergleich mit saatgut.erfasst_am (Plan 215 A5).';
comment on column public.vorrat_ereignis.storniert_am is 'Storno (8.1 Regel 2); stornierte Zeilen zählen nicht.';
comment on column public.vorrat_ereignis.ersetzt_id is 'Zeile, die diese Zeile als Korrektur ersetzt (8.1 Regel 3).';

-- Gültige Ereignisse je Sorte (Stand und Verlauf im Sortendetail). Kein Unique je Sorte: jede Handlung ist eine Zeile.
create index vorrat_ereignis_sorte on public.vorrat_ereignis (sorte_id) where storniert_am is null;

-- ---------------------------------------------------------------------
-- 2. Zeilensicherheit wie die Schleife in 20261103140000_datenmodell.sql Abschnitt 8 (Erfassungstabelle:
--    lesen, einfügen, ändern; keine Delete-Policy)
-- ---------------------------------------------------------------------
alter table public.vorrat_ereignis enable row level security;

drop policy if exists tim_lesen on public.vorrat_ereignis;
create policy tim_lesen on public.vorrat_ereignis for select to authenticated
  using ((select public.ist_tim()));

drop policy if exists tim_einfuegen on public.vorrat_ereignis;
create policy tim_einfuegen on public.vorrat_ereignis for insert to authenticated
  with check ((select public.ist_tim()));

-- update: Storno (storniert_am, storno_grund) und erneutes Senden derselben client_id (Upsert aus der Warteschlange)
drop policy if exists tim_aendern on public.vorrat_ereignis;
create policy tim_aendern on public.vorrat_ereignis for update to authenticated
  using ((select public.ist_tim()))
  with check ((select public.ist_tim()));

-- ---------------------------------------------------------------------
-- 3. Tabellenrechte ausdrücklich (A, siehe Kopf): gleicher Stand wie die übrigen Tabellen in public
-- ---------------------------------------------------------------------
revoke all on table public.vorrat_ereignis from anon, authenticated, service_role;
grant select, insert, update, delete on table public.vorrat_ereignis to authenticated;
grant select, insert, update on table public.vorrat_ereignis to service_role;
grant select on table public.vorrat_ereignis to backup_leser;

-- ---------------------------------------------------------------------
-- 4. Rückfall E7 wie 20261104150000_backup_rollen.sql Abschnitt 4: ohne BYPASSRLS eine Policy backup_lesen
--    (nur select, nur backup_leser); mit BYPASSRLS keine
-- ---------------------------------------------------------------------
do $$
declare
  mit_bypass boolean := (select rolbypassrls from pg_roles where rolname = 'backup_leser');
begin
  drop policy if exists backup_lesen on public.vorrat_ereignis;
  if not mit_bypass then
    create policy backup_lesen on public.vorrat_ereignis for select to backup_leser using (true);
  end if;
end $$;
