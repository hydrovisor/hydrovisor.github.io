-- 20261104171000_service_ohne_delete.sql · service_role ohne DELETE in public (Fehler #65, Plan 65 Nachtrag Runde 1).
--
-- service_role hat BYPASSRLS; mit DELETE könnte der Service-Schlüssel alle echten Daten physisch löschen. Kein Dienst
-- braucht es: Seed, Demo und Wiederherstellungsprobe laufen als postgres, datenart_loeschen ist security definer, die
-- Edge Functions lesen, fügen ein und ändern nur (Prüfer Sicherheit, Runde 1). Eigene Datei statt Änderung von
-- 20261104170000, weil jene in hydrovisor-dev schon eingespielt ist.
-- Additiv (nur Rechte). Rückweg: grant delete … to service_role.
revoke delete on all tables in schema public from service_role;
alter default privileges for role postgres in schema public revoke delete on tables from service_role;
