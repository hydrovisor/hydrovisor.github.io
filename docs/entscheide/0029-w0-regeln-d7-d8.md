# 0029 W0-Regeln D7 (Ernte ab Saat) und D8 (Umsetztag)

Datum: 21.11.2026 · Entscheid des Leads nach Entscheid 0018 (W0-Freigabe durch den Lead) · Grundlage: W0 Runde 12 (#250) und Runde 13 (#258), Befund 4 des Prüfers in Runde 13 · Auftrag Tims im Chat vom 21.11.2026: «Setze alle genannten Punkte vollautomatisch bis ans Ende um und suche jeweils eine Lösung dazu bei Problemstellungen.»

## Ausgangslage

Konzept 9.3 und Entscheid 0018 lassen den Lead Konflikte und Klasse-D-Lücken mit Fachlogik und (A) entscheiden; die Ableitungsregeln D1 bis D6 und E1 bis E3 stehen seit den Runden 7 bis 10 in `scripts/w0/w0lib.py` (`REGELN`) und in jedem Bericht `lead_entscheide_runde-<n>.md`. Runde 12 brauchte eine Regel für erste Ernten, die Quellen ab Saat zählen (D7); Runde 13 eine Auswahlregel für den Umsetztag aus mehreren Quellen (D8). Beide standen nur im Skript und im Bericht.

## Entscheid

- **D7 (A):** `ernte_ab_d` zählt ab Umsetzen, bei Direktsaat ab Saat (`03_import_w0.md` 4.3.3). Nennt die Quelle Tage ab Saat ohne eigenen Umsetztag oder sät sie direkt in das Endsystem, während die Anlage die Kulturform umsetzt, zieht der Lead `art.umsetzen_ab_d` ab; fehlt er, Keimung typ plus Anzucht typ der freigegebenen Phasendauern. Nicht bei Kulturformen, die die Anlage direkt sät (Babyleaf, Konzept 3.3).
- **D8 (A):** Umsetztag. Nennt die gewählte Quelle selbst einen Bereich, gelten seine Grenzen. Sonst ist `umsetzen_ab_d` der Wert der Quelle am nächsten an der Anlage (Würfel unter LED, danach DWC, Floating oder NFT) und `umsetzen_bis_d` der grösste Wert einer Quelle der Klasse A oder B1 derselben Art, aber nur, wenn er mindestens Keimung typ plus Anzucht typ erreicht; sonst bleibt `umsetzen_bis_d` Klasse D. Grund: Die App zeigt «In der Station lassen bis» Saat plus `umsetzen_bis_d` und mahnt «Umsetzen überfällig» sieben Tage danach; ein früherer Wert endete vor dem Ende der Anzucht nach Phasen.
- Konflikte zwischen einem neuen geprüften Kandidaten und einem schon freigegebenen Wert entscheidet der Lead nach Konzept 9.3 Regel 1 und 2 wie jeden Konflikt; eine Korrektur ist eine neue W0-Zeile (Konzept 9.4), der Seed schliesst die alte Fassung.

## Folgen

- Massgebend bleibt `scripts/w0/w0lib.py` (`REGELN`); die Berichte führen die Tabelle mit.
- Nachführung in der nächsten Konzeptfassung (Anhang B.2, Stelle 9.3) zusammen mit D1 bis D6.
