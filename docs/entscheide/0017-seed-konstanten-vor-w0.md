# 0017 Seed-Konstanten vor W0 scharf laden

Datum: 12.11.2026 · Entschieden von Tim (im Chat der Lead-Sitzung, Antwort auf die Frage «Soll ich die Seed-Konstanten schon vor W0 scharf laden lassen?») · Issue #178 · weicht ab von Entscheid 0007 · Bezug RR16, Anleitung Inbetriebnahme Schritt 0 (#174)

## Ausgangslage

Entscheid 0007 lässt den Seed in Produktion scharf erst nach dem ersten grünen Trockenlauf **und** der W0-Teilfreigabe laden. Der Trockenlauf ist grün (zuletzt 8.11.2026, Lauf 42464362100), die W0-Dateien unter `data/wissensbasis/freigegeben/` fehlen aber noch (RR16). Ohne Seed hat die Produktion weder Messgerät noch Einstellungen; die Einrichtung der Anlage R kann deshalb nicht beginnen. Die Seed-Konstanten (Messgerät, Einstellungen mit Kalibrierterminen und Stationsgrenze, Dünger-Produkte, k-Startwerte, feste Regeln wie Pflichtgrössen, Profilende und Auswertungsfenster) lädt der Seed unabhängig von W0; damit gehen die Einrichtungspunkte 1 bis 8 (E2E IB-AK4).

## Entscheid

Tim: «Ja, Konstanten jetzt».

- `deploy.yml` erhält den Eingang `seed_scharf` (nur `workflow_dispatch` auf `main`). Mit `seed_scharf=true` lädt der Seed scharf, was das Repository liefert; ohne W0-Dateien nur die Konstanten. Die Freigabe in `production` gibt Tim, weil der Lauf die Produktionsdatenbank verändert (Regel 2, Entscheid 0010).
- Jeder Push auf `main` bleibt beim Trockenlauf. So gibt der Lead gewöhnliche Deploys ohne Migration weiter selbst frei (Entscheid 0010), auch wenn sie `src/domain/` ändern.
- Kommen die W0-Dateien nach der Teilfreigabe, lädt sie ein weiterer Lauf mit `seed_scharf` (wieder mit Tims Freigabe). Die Teilfreigabe selbst bleibt Tims Handgriff: Nur freigegebene Dateien liegen unter `freigegeben/`, die Teilfreigabe je Art prüft der Seed (03_import_w0.md 8).

## Folgen

- Messgerät und Einstellung legt der Seed nur an, wenn die Tabellen leer sind; ein späterer Lauf überschreibt Tims Änderungen nicht (Ladeskript, A7).
- [SQL]-Test W178-AK1 (`tests/seed/konstanten-ohne-w0.test.ts`) sichert, dass ein scharfer Lauf ohne W0 nur die Konstanten anlegt und wiederholbar ist.
- Entscheide 0007 und 0010 erhalten einen Nachtrag (Freigabe durch den Lead nur für Läufe ohne `seed_scharf`); CLAUDE.md (Regeln 1 und 4, Befehle, Entscheide) und die Anleitung Inbetriebnahme sind nachgeführt.
- Ein Lauf mit `seed_scharf` deployt wie jeder Lauf des Jobs `migration` auch die Edge Functions, Pages mit Rauchtest und zieht das Tag `letzte-migration` nach; steht eine Migration aus, liefe auch `supabase db push`. Vor dem Start prüft der Lead, dass `git diff --name-only letzte-migration origin/main -- supabase/migrations` leer ist, und nennt das in der Nachricht an Tim.

## Verworfen

- Scharf bei jedem Push (wie in 0007 vorgesehen): Jeder Deploy mit Änderung unter `src/domain/` bräuchte dann Tims Freigabe.
- Warten auf die W0-Teilfreigabe (bis 15.12.): Die Einrichtung der Anlage R würde sich ohne Not verzögern.
