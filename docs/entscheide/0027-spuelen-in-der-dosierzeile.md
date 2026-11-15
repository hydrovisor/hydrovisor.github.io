# 0027 Spülen des Messbechers steht in der Dosierzeile

Datum: 14.11.2026 · Entscheid von Tim im Chat («Alle 14») auf die Liste der Usability-Runde, Punkt 14, nach dem
Hinweis des Leads, dass der Punkt die Abhakliste des Konzepts ändert · Paket UX8, Issue #230

## Ausgangslage

Die Abhakliste Neuansatz hatte nach R4.6 die Zeilen 0 bis 17, jede ein Tipp. Die Zeilen 6 und 8 hiessen «Messbecher
spülen» (nach Micro und nach Grow). Die Usability-Runde vom 14.11.2026 zählte für einen Lösungswechsel rund 47 Tipper;
die zwei Spülzeilen haben weder Menge noch Messwert und keinen Leser in Zustand oder Auswertung.

## Entscheid

- Die Zeilen 6 und 8 entfallen. Die Dosierzeilen Micro (5) und Grow (7) tragen den Hinweis «danach Messbecher spülen»,
  unabhängig vom Messmittel (A).
- Die Nummern der übrigen Zeilen bleiben (Lücken 6 und 8): Messzeilen 3, 14 und 17, Timer 11, 13 und 16, Routen und
  gespeicherte Abläufe verwenden sie.
- Neue Wechsel schreiben keinen Schritt `spuelen` mehr. Der Schritt-Typ bleibt im Schema; alte Schritte bleiben gültige
  Ereignisse (Konzept 8.1 Regel 2). Keine Migration.
- Ein laufender Wechsel mit offener oder abgehakter Spülzeile läuft weiter: die lokale Zeile entfällt, die nächste
  Dosierzeile wird aktiv, kein Haken geht verloren.

## Abweichung vom Konzept

Weicht ab von R4.6 («6 spülen», «8 spülen», Zeilen 0 bis 17 als lückenlose Folge) in `konzept_v1.8.md`,
`use_cases_f4.md` (UC7, Ablauf Neuansatz), dem Düngeplan, `docs/spec/01_fachregeln.md` R4.6 und `05_masken.md` 3.5.
Nachführung in der nächsten Fassung des Konzepts mit Eintrag in Anhang B.2 (Posten in `docs/plaene/pakete.md`).

## Folgen

Ein Lösungswechsel braucht zwei Haken weniger. Die Reihenfolge der Zugaben, die Mengen, die Rückfrage nach einer Pause
über 2 Minuten und die Timer sind unverändert.
