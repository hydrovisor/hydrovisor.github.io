# Notfallblatt

Druckvorlagen A4 «Stand je Gefäss» und Vertretungsblatt; laminiert am Regal (Konzept 11.7, UC0). Derselbe Druckweg wie der Etikettenbogen.

- **Stand je Gefäss** (`hv-blatt`): Titel «Stand je Gefäss», Zeile mit Anlage und Stand («Stand 14.12.2026, 18:40», `hv-blatt-meta`), dann eine Tabelle (`hv-blatt-tabelle`) mit einer Zeile je Gefäss in Laufweg-Reihenfolge: Kennung (`hv-blatt-kennung`, gleich geschrieben wie auf dem Etikett), Betriebsart, Zielbereich (pH und EC), Dosis je Kanne (Micro, Grow, Bloom in ml), letzte Messung (Datum, pH, EC, °C), nächster Wechsel (Datum).
- **Vertretungsblatt** (`hv-blatt`): Titel «Vertretung», kurze Regeln als Liste (`hv-blatt-regeln`): nur Leitungswasser bis zur Marke nachfüllen; Pumpen und Licht prüfen; **keinen Dünger geben** (`hv-blatt-verboten`); Telefonnummer aus den Einstellungen.
- Schwarz auf weiss in beiden Themen (`label-ink`, `label-paper`), Seitenrand `page-margin`, Schrift 11 pt, Kennung 16 pt; Status in Worten, nie über Farbe. `@page { size: A4; margin: 0 }`, jedes Blatt eine Seite.
- Die Telefonnummer steht nur in der Datenbank (`einstellung`), nie im Repository, in Vorschauen oder Testdaten (Annahme 12); die Vorschau zeigt «Telefonnummer aus den Einstellungen».
- Props: `art` = `stand` oder `vertretung`; `stand` (Zeilen je Gefäss), `anlage`, `erstelltAm`; `telefon`.
