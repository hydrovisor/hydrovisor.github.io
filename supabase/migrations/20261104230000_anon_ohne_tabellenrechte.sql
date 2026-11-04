-- 20261104230000_anon_ohne_tabellenrechte.sql · anon ohne Tabellenrechte in public, lokal wie gehostet (Fehler #67;
-- Folgepunkt aus #65, Plan 65 A2; Konzept 11.6; 04_architektur.md Abschnitt 11).
--
-- Lokal (supabase start) hat anon auf den Tabellen in public arwdxtm, gehostet nur xtm. Die App liest erst nach der
-- Anmeldung und braucht anon in public nicht. Gleicher Stand überall: anon hat auf Tabellen, Sichten und Sequenzen in
-- public kein Recht, auch nicht über die Default-Privileges der Rolle postgres (Migrationen laufen als postgres).
-- Funktionsrechte und Storage bleiben unverändert (eigene Tests in 00_zugriff und 07_speicher).
-- Additiv (nur Rechte), keine Wirkung auf Daten. Rückweg: Folgemigration mit grant.

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke all on sequences from anon;
