-- 20261108120000_ansatz_schritt_abbruch.sql · Enum-Wert abbruch für ansatz_schritt (Issue #29, Plan 29 Migration
-- Punkt 1; Konzept 6.2, R4.6, U4, U13; Annahme A20).
--
-- Eigene Datei (Plan 29 A20, wie Plan 37 A1): Ein neuer Enum-Wert darf erst nach dem Commit der Transaktion verwendet
-- werden, in der er entsteht. Der Supabase-Runner fasst jede Datei in eine Transaktion; die Triggerfunktion, die den
-- Wert liest, folgt deshalb in 20261108120100_ansatz_zustand.sql.
--
-- «Wechsel abbrechen» schreibt eine Zeile ansatz_schritt mit schritt = 'abbruch' und der nächsten offenen nr. Das passt
-- zum Teilindex ansatz_schritt_nr (ansatz_id, nr) where storniert_am is null und zum Check nr between 0 and 17: Ist
-- Zeile 17 erledigt, ist der Ansatz abgeschlossen, und es gibt keinen Abbruch mehr. Ein Storno der Abbruchzeile gibt
-- die Nummer wieder frei (Rückgängig, U4).
-- Additiv, keine Spalte und kein Check geändert. Rückweg: keiner (Enum-Werte entfernt die Migration nicht); der Wert
-- bleibt ungenutzt, Abbruchzeilen storniert man oder sie bleiben als Protokoll stehen.

alter type public.ansatz_schritt_typ add value if not exists 'abbruch' after 'endmessung';
