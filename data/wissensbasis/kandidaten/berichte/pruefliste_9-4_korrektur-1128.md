# Prüfliste nach Konzept 9.4, W0-Korrekturen vom 28.11.2026 (Entscheid 0018, Issue #277)
Alle freigegebenen Zeilen, die gegenüber `origin/main` neu sind oder sich geändert haben (100 %, keine Stichprobe). Teil A: pH und EC der Phasen Anzucht und Wachstum auf Ebene Art. Teil B: übrige Zeilen (Dauern, Kulturgruppen-Mindestzeilen). Je Zeile Link öffnen, Fundstelle suchen, Kurzzitat und Wert vergleichen; bei eigenem Wert des Lead den Ausgangswert im Kurzzitat und die Regel in der Spalte Lead prüfen.

## Teil A (0)

| zeile_id | Wert | Quelle (Klasse) | Fundstelle | Kurzzitat | Link | Lead |
|---|---|---|---|---|---|---|

## Teil B (2)

| zeile_id | Wert | Quelle (Klasse) | Fundstelle | Kurzzitat | Link | Lead |
|---|---|---|---|---|---|---|
| `ak.lactuca_sativa.schnitt.kulturdauer_max_d` | 56 | jas-lettuce-cut-and-come-again-2017 (A) | S. 72, Abschnitt 4 Discussion (Vermerk: Wochen; ab Saat bis zum zweiten Schnitt, passend zur Empfehlung von zwei Schnitten; ganzer Versuch bis zum sechsten Schnitt «ten week growing period», S. 68 Abschnitt 3.2); Ableitung des Lead 28.11.2026 (#277): 42 Tage Standzeit ab Umsetzen (6 Wochen nach D4) + 14 Tage von der Saat bis zum Plantag (Konzept 14.1) = 56 Tage ab Saat; Zählweise nach Tims Entscheid C vom 28.11.2026 | total of two first harvest 406.7 g/tray for a six week growing period | doi:10.5539/jas.v9n1p64 | eigener Wert aus ak.lactuca_sativa.schnitt.kulturdauer_max_d#2: Korrektur 28.11.2026 (#277), Tims Entscheid C vom 28.11.2026 im Chat («Ja, so umsetzen», Belegungsplan-Abgleich): Standzeit 42 Tage ab Umsetzen gilt, Plantag 14 Tage nach der Saat, also 42 + 14 = 56 Tage ab Saat statt 42; Quelle, Kurzzitat und Klasse der alten Zeile bleiben |
| `ak.valerianella_locusta.kopf.ernte_ab_d` | 51 | plants-valerianella-salinity-2023 (A) | Abschnitt 4.3 (Tage ab Umsetzen in das Floating-System); Ableitung des Lead 28.11.2026 (#277): 29 Tage ab Umsetzen + 22 Tage Anzucht derselben Quelle (Abschnitt 4.1, art.valerianella_locusta.umsetzen_ab_d) = 51 Tage ab Saat, weil die Anlage Nüsslisalat direkt sät und die App bei Direktsaat ab Saat rechnet (Umkehrung von D7, Plan 277 A2) | the commercial stage (29 days after transplanting, 5 November) | doi:10.3390/plants12071454 | eigener Wert aus ak.valerianella_locusta.kopf.ernte_ab_d#2: Korrektur 28.11.2026 (#277), Abweichung F des Belegungsplan-Abgleichs, (A): Die Quelle zählt 29 Tage ab Umsetzen nach 22 Tagen Anzucht; die Anlage sät direkt (3.1, Kratky), die App rechnet dann ab Saat; D7 nimmt Direktsaat aus, deshalb neue Ableitung 29 + 22 = 51 statt 29; mit Saat 7.1.2027 erste Ernte 27.2.2027 wie im Plan (26.2. bis 8.3.), unter kulturdauer_max_d 66 |
