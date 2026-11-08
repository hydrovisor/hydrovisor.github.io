# 0015 Karbonathärte wird nicht erfasst

Datum: 8.11.2026 · Entschieden von Tim (Rückmeldung am Honor in der Sitzung zu #139, weitergegeben an #147) · Issue #147, PR #148

## Ausgangslage

Konzept 5.1 nennt an der Anlage eine «optional[e] Karbonathärte», Konzept 17 (offene Punkte) führt sie als «unbekannt» mit dem Zweig «bekannt: Feld an der Anlage, Hinweis beim Ansäuern», Q16 entscheidet den Säurebedarf empirisch. UC1 «Ablauf Anlage anlegen» (`docs/input/use_cases_f4.md`) zeigt das Feld als optional. Die Maske «Anlage anlegen» hatte dafür ein Eingabefeld «Karbonathärte °dH».

## Entscheid

Tim: «Karbonathärte kannst du komplett löschen, können wir nicht erfassen.»

- Die Maske «Anlage anlegen» hat kein Feld für die Karbonathärte mehr (Plan 147).
- Der offene Punkt aus Konzept 17 bleibt im Zweig «unbekannt»: Der Säurebedarf wird empirisch nach Q16 und R4.13 bestimmt; es gibt keinen Hinweis zur Karbonathärte beim Ansäuern.
- Die Spalte `anlage.karbonathaerte_dh` und das optionale Feld der Domäne (`AnlageEingabe.karbonathaerte`) bleiben; neue Anlagen schreiben null. Keine Migration (additive Regel im Testbetrieb).

## Abwägung

- **Nur die Oberfläche** (gewählt): kein Eingriff in Datenmodell und Konzept; das Feld ist dort optional, der Entscheid widerspricht dem Konzept nicht.
- **Spalte entfernen** (verworfen): bräuchte eine Migration in zwei Schritten über zwei Releases und brächte keinen Nutzen.
- Eine neue Konzeptfassung ist nicht nötig; ob Anhang B.2 den Entscheid nennt, bestimmt Tim bei der nächsten Fassung.
