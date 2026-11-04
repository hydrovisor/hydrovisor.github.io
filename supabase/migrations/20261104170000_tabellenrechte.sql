-- 20261104170000_tabellenrechte.sql · Tabellenrechte der Data API ausdrücklich setzen (Fehler #65, Plan 65;
-- Konzept 8.1 Regel 3 und 6, 11.6; 04_architektur.md Abschnitt 11).
--
-- Ursache: Neuere gehostete Supabase-Projekte (hydrovisor-dev, Produktion) geben neue Tabellen in public nicht mehr
-- automatisch für die Data API frei: anon und authenticated haben dort nur REFERENCES, TRIGGER, MAINTAIN, service_role
-- zusätzlich TRUNCATE, aber kein SELECT, INSERT, UPDATE, DELETE. Lokal (supabase start) gelten mehr Rechte; deshalb
-- blieb das in den Tests unbemerkt. Die App («Push einrichten») und die Edge Functions scheiterten.
--
-- Additiv (nur Rechte). Welche Zeilen gelten, regeln weiter die RLS-Policies jeder Tabelle; ohne Delete-Policy löscht
-- die App nichts (8.1 Regel 3). TRUNCATE bleibt entzogen. anon und die Funktionsrechte bleiben unverändert (Plan A2).
-- Rückweg: Folgemigration mit revoke; Daten bleiben unberührt.

-- 1. Gleicher Ausgangspunkt lokal und gehostet, dann genau die nötigen Rechte (umfasst auch Sichten)
revoke all on all tables in schema public from authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;

-- 2. Sequenzen (heute keine in public; für künftige Identity-Spalten)
revoke all on all sequences in schema public from authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

-- 3. Künftige Tabellen und Sequenzen der Rolle postgres (Migrationen laufen als postgres, Plan 16 A5)
alter default privileges for role postgres in schema public revoke all on tables from authenticated, service_role;
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges for role postgres in schema public revoke all on sequences from authenticated, service_role;
alter default privileges for role postgres in schema public
  grant usage, select on sequences to authenticated, service_role;
