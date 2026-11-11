# Entwurf: Erweiterte Usability-Prüfung

Stand 11.11.2026 · Lead · Auftrag Tim im Chat (11.11.2026): «Prüfe zusätzlich, ob du für die Usability mit Playwright die richtige Methode hast. […] visuelle Darstellungen, Haptik, Ansprechung der Buttons und sonstige Menüführungspunkte, Prozessvereinfachungen» · Status: **entschieden** (Tim, 11.11.2026, Entscheid A): aufgenommen in Konzept v1.6 (6.3, 12.5, 12.6, 14.5, Erratum E11); SEQ und SUS nur als Befragung im Claude-Chat (Entscheid 0016).

## 1 Befund: Was Playwright heute leistet und was nicht

Gebrauchstauglichkeit nach ISO 9241-11 hat drei Masse: **Effektivität** (Aufgabe richtig erledigt), **Effizienz** (Zeit, Berührungen, Fehler) und **Zufriedenheit**. Die heutige Prüfung deckt davon nur einen Teil.

| Heute vorhanden | Werkzeug | deckt ab |
|---|---|---|
| E2E je AK (Prüftor) | Playwright, 360 × 640 | Ablauf funktioniert, Berührungen gezählt (Rundgang-AK1a bis c), Masken ohne Scrollen, 68 dp, keine Eingabefelder in Regal-Masken |
| Honor-Simulation (`npm run sim:honor`, #120) | Playwright, 360 × 780, Touch, Pixeldichte 3.5 | 17 Abläufe sichtbar vorgeführt; Regeln: Tastengrösse, Hauptknopf ohne Scrollen und im Daumenbereich, Messmaske ohne Scrollen, Systemschrift 130 %, Zeit bis Heute und Gefäss |
| [Gerät]-AK am Honor | Tim | Push, Wake Lock, Druck, 80 cm Lesbarkeit, 15 s je Messung |

**Grenze.** Playwright prüft *Regeln*, die wir vorher kennen (Konformität). Es sieht nicht, ob eine Maske verständlich ist, ob die Reihenfolge der Schritte zum Arbeiten am Regal passt, ob ein Status bei LED-Licht und nassen Händen richtig gelesen wird, ob eine Taste sich «angesprochen» anfühlt (Rückmeldung beim Tippen) oder ob ein Ablauf mit weniger Schritten ginge. Dafür braucht es Methoden, die Menschen oder Expertenurteile einbeziehen. Playwright bleibt das richtige Werkzeug für die messbaren Teile; es wird ergänzt, nicht ersetzt.

## 2 Vorschlag: vier Ebenen

| Ebene | Methode | wer, wann | Ergebnis |
|---|---|---|---|
| **U1 Automatisch (Regeln)** | Honor-Simulation erweitert: WCAG 2.2 AA mit axe-core (Kontrast 4.5 : 1 bzw. 3 : 1, Namen, Rollen) in Hell und Dunkel; Abstand zwischen Tasten (8 dp, über «Speichern» 16 dp, Konzept 6.3); Rückmeldung beim Tippen (sichtbarer gedrückter Zustand, Prellfilter); Daumenbereich; Berührungen und geschätzte Bediendauer je Ablauf nach dem Keystroke-Level-Modell (KLM) gegen die Zielzeiten (15 s je Messung); Bildschirmfotos aller Regal-Masken in beiden Themen, bei 130 % und mit Filtern für Blendung (Kontrast halbiert) und Farbsehschwäche (Status nie nur über Farbe) | Lead, bei jedem Paket mit Oberfläche (nicht im Prüftor, Bericht im PR) | Mängel- und Hinweisliste, Bilderbogen je Maske |
| **U2 Expertenprüfung** | Heuristische Evaluation nach Nielsen (10 Heuristiken) und ISO 9241-110 (Interaktionsprinzipien), dazu ein Cognitive Walkthrough der fünf Kernaufgaben (Messen, Rundgang, Lösung wechseln, Säen, Keimung prüfen); Schweregrad 0 bis 4 je Befund | Lead jetzt (November) an den Bildern aus U1, danach je Meilenstein | Befundliste mit Schweregrad und Vorschlag; Schweregrad 3 und 4 als Routine-Pakete, Prozessänderungen als Vorschlag an Tim |
| **U3 Aufgabentest am Honor** | Fünf Kernaufgaben mit Zeit, Fehlern, Berührungen und lautem Denken (Bildschirmaufnahme von Android, Ton an); nach jeder Aufgabe die Single Ease Question (SEQ, 1 bis 7) | Tim allein, 30 min: einmal vor der Regalfreigabe (2. bis 7.1.) und einmal nach Woche 2 des Testbetriebs | Zeiten gegen Ziel, SEQ, Stolpersteine als Zyklusnotiz (PDSA) |
| **U4 Zufriedenheit** | System Usability Scale (SUS, 10 Fragen, 0 bis 100; Ziel mindestens 80) | Tim, Ende Januar (M2) und Ende März (Datenschluss) | Kennzahl für Kapitel 6 der Arbeit |

Optional **U5 Vertretungstest** (RR4): Eine zweite Person ohne Vorwissen erledigt mit dem Vertretungsblatt «Messen 2.3» und «Nachfüllen»; zählt Fehler und Rückfragen. Das prüft Erlernbarkeit, die Tim selbst nicht mehr prüfen kann.

## 3 Was ins Konzept käme (Vorschlag, Tims Entscheid)

- **6.3** ergänzt um: «Tippen gibt sofort sichtbare Rückmeldung (gedrückter Zustand), Kontrast WCAG 2.2 AA in beiden Themen, Abstand der Tasten 8 dp.» (bisher implizit).
- **12.6** neue Zeile «Usability: Honor-Simulation mit axe-core, KLM und Bilderbogen; Lead; je Paket mit Oberfläche; nicht im Prüftor» und Prüfart **[Usability]** für U3 und U4 (wie [Eval] von Hand mit Ergebnis im Issue).
- **12.5** Abnahme 1: Bericht der Simulation (U1) im PR, Mängel blockieren den Merge bei Regal-Masken.
- **14.x Messplan:** SEQ je Kernaufgabe und SUS als zusätzliche Kennzahlen (EK für die Arbeit).
- Aufwand: U1 einmalig rund 0.5 PT (Routine, Werkzeug wie #120), U2 rund 0.25 PT je Durchgang; Tim rund 30 min je U3 und 5 min je U4. Prozessvereinfachungen aus U2 und U3 fallen unter die Tauschregel bzw. ins Prüflauf-Budget (I3).

## 4 Was der Lead ohne Konzeptänderung sofort macht

U1 (Werkzeug wie die Honor-Simulation #120, keine App-Änderung) und U2 (Befundliste in `docs/entwurf/usability_befunde.md`). Behebungen, die Spezifikation und Design System schon verlangen (z. B. #151 «Rundgang starten» im Daumenbereich), setzt er als Routine-Pakete um. Alles, was einen Ablauf ändert, legt er Tim zur Auswahl vor.
