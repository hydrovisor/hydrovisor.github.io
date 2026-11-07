-- 20261107120000_vermerk_recherche.sql · Enum-Wert recherche für vermerk (Issue #37, Plan 37 Migration Punkt 1;
-- Konzept 8.2, 11.3, Erratum E8).
--
-- Eigene Datei (Plan 37 A1): Ein neuer Enum-Wert darf erst nach dem Commit der Transaktion verwendet werden, in der er
-- entsteht. Der Supabase-Runner fasst jede Datei in eine Transaktion; die Funktion mit den Aktionen recherche_wert und
-- recherche_saatempfehlung folgt deshalb in 20261107120100_recherche_schreibweg.sql.
-- Additiv; gilt für profilwert.vermerk und herkunft.vermerk. Rückweg: keiner (Enum-Werte entfernt die Migration nicht),
-- Recherche-Zeilen schliesst man über gueltig_bis.

alter type public.vermerk add value if not exists 'recherche' after 'leitkultur';
