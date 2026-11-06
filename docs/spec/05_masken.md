# 05 Masken

Stand 1.11.2026 · Auftrag 2 «Spezifikation» · Grundlage: Konzept v1.2 Kapitel 6 und 10, Use Cases Fassung 4 (Bedienmuster U1 bis U14), `design-system/`. (A) = Annahme dieser Spezifikation.

## 1 Grundsätze

- **Zwei Kontexte (Konzept 6.3).** Regal: Heute, Rundgang, Gefäss, Messen, Ansatz, Säen, Keimung, Umsetzen, Pflanze, Gefäss prüfen; Dichte «regal» (`data-density="regal"`), keine Systemtastatur, keine Wischgesten. Schreibtisch: Anmeldung, Anlage, Vorlagen, Gefäss erfassen, Sorten, Etiketten, Einstellungen, Info, Druckansichten; Standarddichte (48 dp), Systemtastatur erlaubt.
- **Jeder Ablauf geht vollständig ab Heute.** Nur Antippen als Pflichtgeste. Status nie nur über Farbe (StatusBadge mit Wort und Symbol). Thema nach `einstellung.thema`, Standard «Hell».
- **Zahlen** nach de-CH mit Dezimalpunkt, Tabellenziffern (`hv-num`); Einheit klein daneben; Bereiche «5.8–6.3»; Statuswörter fix: «Im grünen Bereich», «Knapp daneben», «Ausserhalb», Kennzeichen «veraltet», «unsicher».
- **Schutz vor Fehltipps (U13):** Prellfilter 80 ms im Ziffernblock, Sperre 400 ms nur für Aktionsknöpfe (Speichern, Ja, Erledigt, Morgen); Rückgängig bis zur nächsten Handlung, mindestens 10 s, immer unten über der Hauptaktion (U4).
- **Viewports:** Referenz 360 × 640 dp und Honor-Viewport (Default 360 × 780 dp bis zum Gerätetest). CSS-Pixel entsprechen in Chrome auf Android den dp.

## 2 Bausteine

| Baustein | Stand im Design System | Verwendung |
|---|---|---|
| Logo, Button, Card, StatusBadge, Notice, TextField | vorhanden (`bundle.css`) | überall; Button `primary` höchstens einmal je Maske |
| Gauge | vorhanden; **nicht** `tolerance` und `gaugeStatus` verwenden, Status kommt aus R10 (Beipackzettel Abschnitt 4) | Pflanzenansicht, Verlauf |
| Label, LabelSheet | vorhanden mit 70 × 42 mm; Nachführung auf 70 × 42.3 mm, 4 mm, 32 mm im Design-System-Paket (E6) | Etiketten |
| **Dichte «regal»** (neu) | Tokens `size-touch-regal` 68 dp, `value-regal` 40 sp, `status-regal` 28 sp, `text-regal` 21 sp, `icon-status-regal` 32 dp | alle Regal-Masken |
| **NumPad** (neu) | Ziffernblock 4 × 4, Tasten 68 dp hoch, Abstand 8 dp, Prellfilter 80 ms, ± in 0.1-Schritten, «leeren» oben rechts, Rücktaste unten rechts (E-F4-5), jede Ziffer gross wiederholt | Messen, Mengen, Kannen |
| **Tile** (neu) | Kachel für Messwert (Bezeichnung, Wert 40 sp, Statussymbol 32 dp, Trendzeile, Sollband als Spur) und für Orte der Anlagenübersicht | Messen, Anlage, Heute |
| **Checklist** (neu) | Abhakliste mit Zeilennummer, Soll-Menge und Messmittel, Haken abwählbar bis zum nächsten Schritt, Timer-Zeile mit Countdown gegen absolute Endzeit | Ansatz |
| **Notfallblatt** (neu) | Druckvorlage A4 «Stand je Gefäss» und Vertretungsblatt | Druck |

Die neuen Bausteine entstehen im Design-System-Paket vor I1a in `design-system/` (E6) und erst danach in der App.

## 3 Regal-Masken

### 3.1 Heute (UC8, UC0)

- **Kopf:** Logo klein, Datum, «Letzte Erinnerung: heute 07:00 zugestellt» oder Warnung (48 h), laufende Abläufe mit Countdown («1.1 Wechsel läuft · messen ab 19:12»).
- **Bereiche von oben:** Einrichtungs-Checkliste (UC0, neun Punkte, verschwindet nach Abschluss); Hinweise (neue Version, Backup älter als 8 Tage, Warteschlange älter als 24 h, Push nicht eingerichtet, «4 Ansätze heute»); Karte «Phasen nachführen (n Sätze)»; gebündelte Phasenfragen; Ortskarten in Laufweg-Reihenfolge (Anzuchtorte zuerst), «Ausserhalb» hervorgehoben ohne Umsortieren; je Aufgabe Grund («Messen und nachfüllen alle 2 Tage · zuletzt vor 3 Tagen»), Knöpfe «Erfassen», «Morgen» oder «Überspringen» nur wo erlaubt (R5.2, R5.3).
- **Hauptaktion:** «Rundgang starten (n Orte)», unten im Daumenbereich. Daneben sekundär «Stromausfall erfasst».
- **Leer:** «Heute nichts zu tun · nächste: Mi, Messen und nachfüllen 1.1».
- **AK:** UC8-AK9 (≤ 2 s), UC0-AK1, UC0-AK6.

### 3.2 Rundgang (UC8 → UC9 → UC7)

- Je Ebene zuerst die Kurzprüfung als Sammel-Tipp «Pumpen laufen, Licht an, Lüfter läuft» mit Ausnahmen je Gefäss (Pumpe sprudelt, Luftzone bzw. «Lösung berührt Topfboden» bei Direktsaat unter 14 Tagen, wöchentlich «Wurzeln weiss?», je Anzuchtbox «Würfel feucht»). Abweichung «Pumpe sprudelt nicht» oder «keine Luftzone» markiert die Gefässe derselben Luftpumpe (E6).
- Je Ort die Messmaske (3.4); bei fälligem Nachfüllen direkt «Wie viele Kannen?» und die Dosis je Kanne.
- Beim Ortswechsel zeigt der Kopf 1 s die Kennung bildschirmfüllend; danach die Zeile «Sonde abspülen».
- Abweichung → Halt mit Massnahme: [Am Ende] (vorgewählt) [Jetzt korrigieren].
- Abschluss: «Fertig: 13 von 13 · 11 im grünen Bereich · 2 korrigieren», je Abweichung eine Zeile mit Knopf.
- **AK:** Rundgang-AK1a bis 1c (10, 11, 13 Berührungen), AK2 bis AK5.

### 3.3 Gefäss (UC1)

- **Ohne Scrollen sichtbar (UC1-AK2):** Kopf mit Kennung sehr gross (40 sp, gleich geschrieben wie das Etikett), Betriebsart, Volumen, Prüfstatus («nicht geprüft»); Zustand: Zielbereich mit begrenzender Pflanze, letzte Messung mit Bewertung, Trendzeile und Kennzeichen, Lösungsalter («Lösung 12/14 Tage» oder «leer · bereit»), Pflanzdauer, Phase und Dosis je Komponente (EK3); Hauptknopf für die nächste fällige Handlung («Jetzt: Messen und nachfüllen», 72 dp, A).
- **Darunter (darf scrollen):** offene Aufgaben; Nebenknöpfe Nachfüllen, Wechseln, Pflanzen (68 dp); Verlauf als Zahlenreihe mit Ereignismarkern (ohne Diagramm); Deckelgrafik mit Topfkennungen, reservierten Löchern, Töpfen ausserhalb des Heimplatzes («2.3.1 auf 2.3.4»), Satz-Chips; «Wie weiter?» [Neu bepflanzen] [Lösung wechseln] [Leeren] [Gefäss ruht].
- **Stationen** zusätzlich Messen, Nachfüllen, Umsetzen; **Anzuchtbox** zeigt ihre Sätze und «Säen»; **W** öffnet die Messmaske.
- **AK:** UC1-AK2, AK3 (≤ 1 s), AK4.

### 3.4 Messen (UC9) mit Platzbudget

Skizze und Masse nach UC A3, Tasten 68 dp (W14):

| Element | Höhe (dp) bei 360 × 640 |
|---|---|
| Kopf (Kennung 40 sp, Kultur, Betriebsart, «x»; bei Kratky «nach einem Pumpintervall messen» bzw. «zuerst umrühren») | 48 |
| Drei Kacheln pH, EC, °C (Wert 40 sp, Statussymbol 32 dp, Trendzeile, Sollband als Spur) | 132 |
| Füllstand «über / unter ⅓» (nur Kratky, Segmentschalter) | 0 oder 48 |
| Ziffernblock 4 Reihen × 68 dp, 3 × 8 dp Abstand | 296 |
| Abstand über «Speichern» | 16 |
| «Speichern» (Hauptaktion) | 72 |
| **Summe ohne Kratky und ohne Banner** | **564** |
| Reserve für genau ein Hinweisbanner (z. B. «Kalibrierung überfällig: Werte unsicher») | 56 |

Bei Kratky ersetzt der Füllstand das Banner, wenn beide anstehen; das Banner wandert dann in die Ergebniszone (A). Bei Systemschrift 130 % wachsen nur Schriften; Kacheln und Tasten behalten ihre Höhe, Texte kürzen mit Ellipse (A, Prüfung [Gerät] UC9-AK1). Nach dem dritten Wert ersetzt die Ergebniszone den Ziffernblock: Statuswort je Wert in voller Breite, Folge und Massnahme je Betriebsart (R10.5), bei pH über Ziel der Vorschlag pH-Minus nach R4.14 mit «pH-Minus gegeben» (startet Timer 15 min). Felder starten leer; ein leeres Feld wird nicht gespeichert (U2). **AK:** UC9-AK1 bis AK13.

### 3.5 Ansatz: Rechner und Abhakliste (UC7)

- Kopf wie Messen; Zeile «Gerechnet für: 4 × Tomate Blüte, 2 reserviert Basilikum Anzucht» mit [Stimmt nicht] → Deckelgrafik.
- Rechnung: Stadium (Vorschlag, übersteuerbar), Zielbereich, Ziel-EC, Teil-Dosis-Stand («75 % bis zum Becherversuch»), Mengen je Komponente mit Messmittel («10.5 ml, 20-ml-Spritze») und Rundungsabweichung; bei Mischentscheid die drei Optionen als gleichwertige Knöpfe (R2.4).
- Abhakliste (Checklist) Zeilen 0 bis 17 nach R4.6; jede Zeile ein Tipp; Aufzüge einzeln abhakbar; Timer-Zeilen mit Countdown; Kontroll- und Endmessung öffnen die Messmaske im Ablauf.
- Nachfüllen: «Wie viele Kannen?» als grosse Zahlknöpfe [1] … [n] plus Teilkanne in Litern über den NumPad; Dosis je Kanne.
- Bildschirm bleibt an; Rückfrage nach 2 Minuten Pause mit Zeitstempel. **AK:** UC7-AK1 bis AK15, Lösungswechsel-AK1 bis AK6.

### 3.6 Säen (UC5)

- Drei Schritte: (1) Sorte («Wie letztes Mal» zuerst; mit Zielgefäss Einstufung und höchstens zwei Gründe je Sorte, «Nicht empfohlen» eingeklappt, ab I2-4) und Kulturform; (2) Zieltöpfe in der Deckelgrafik (Löcher, Zeilenköpfe, «alle freien»; nur passende Grösse) oder «Ziel später»; (3) Anzuchtbox nach Keimart vorbelegt oder Direktsaat, Datum, Samen je Schwamm und Schwämme als Vorschlag (R12), Hinweis Keimart, «Deckel zu» oder «abdecken», Stationsvorschau «Station am TT.MM.: frei x von 32 (5 cm), y von 8 (8 cm)» mit Warnungen (R6.1). Einmal speichern.
- **AK:** UC5-AK1 (≤ 14 Berührungen, 3 Schritte), AK13, AK15; EK2 (Pflanzvorgang ≤ 60 s).

### 3.7 Keimung prüfen, Umsetzen, Pflanze (UC6, UC5)

- **Keimung prüfen:** je Schwamm gekeimte Samen 0 bis n (vorbelegt), «Keimtemperatur eingehalten» ja oder nein, danach Stationsplätze antippen (vorbelegt nach R6.1). UC6-AK2, AK9, AK10.
- **Umsetzen:** «Wie geplant umsetzen» (1 Berührung plus Bestätigung) oder Zielgefäss und Loch; Optionen bei belegtem Zieltopf; Hinweise zum Topf (R6.2). UC5-AK3, AK7.
- **Pflanze:** Sorte, Kulturform, Topfkennung und Platz, «Tag x seit Saat», Phase «Tag y von min–max», Sollbereich neben Zielbereich mit Herkunft und Verlässlichkeit, nächste Phase; Aktionen Phase wechseln, Noch nicht, Problem, Teilernte und (räumlich getrennt, sekundär) Abernten, Umsetzen, Verschieben; Menü Ausfall. UC6-AK1 bis AK10.

### 3.8 Gefäss prüfen (UC3)

Schritte 1 bis 3, je ein Tipp, Bildschirm bleibt an: Scan oder Kennung tippen («Richtiges Gefäss: 2.3»), Deckel vergleichen mit Grafik («Stimmt» / «Stimmt nicht»), Topfgrösse. UC3-AK5.

## 4 Schreibtisch-Masken

| Maske | Inhalt | AK |
|---|---|---|
| Anmeldung | Logo mit Claim, E-Mail, Passwort, «Anmelden»; keine Registrierung, kein Magic Link | UC0-AK7 |
| Anlage | Regalbild Ebene 4 oben bis 1 unten; je Platz eine Tile (mindestens 72 × 80 dp, Kennung 28 sp, A) mit Belegung, Status, Füllzustand, Prüfstatus; Ebene 4 in drei Gruppen untereinander: «Keimung» (A1/A2 weiss, A3/A4 schwarz), «Jungpflanzen» (4.2/4.3 8 cm, 4.4/4.5 5 cm), «Halbbox» (4.1); W; ohne Scrollen auf 360 × 640 (E-F4-1). Anlage anlegen und Bereiche als Formular. | UC1-AK1, AK5 bis AK7 |
| Vorlagen | Box (Name, Form, Innenmasse mm, Volumen) und Deckel/Platte (Topfdurchmesser, Löcher je Reihe, Service-Öffnung) mit sofortiger Grafik, Löcher ≥ 48 dp | UC2-AK1 bis AK5 |
| Gefäss erfassen | Assistent in vier Schritten (Platz, Box, Deckel, Zusammenfassung) mit Betriebsart, feste Dosis, Luftpumpe, Intervallen; «Speichern und Etikett drucken» schreibt im selben Vorgang die Belegung und das Ereignis `gefaess_erfasst` (Status «in Prüfung», Füllzustand «leer», R9.3); spätere Änderungen von Volumen oder Betriebsart nicht | UC3-AK1 bis AK9 |
| Sorten | Liste mit Vollständigkeit und Prüfaufträgen; «Neue Sorte» mit Foto (zwei Seiten) oder Text, KI-Felder zum Bestätigen, Katalogmerkmale, Saatempfehlung anlegen (Klasse C aus der Tüte oder D) und bestätigen, Packung; neue Art über die Kulturgruppe mit Merkmalen der Leitkultur als «Prüfauftrag». Seit E8 (Plan 37): vier Schritte (Tüte, Sorte und Art, Merkmale, Packung) mit «Weiter»; «<Name> gibt es schon» mit «Packung zu <Name> erfassen»; nach dem Speichern «Recherche läuft» und das Ergebnis; Detail `#/sorten/<sorte_id>` mit Werten je Phase, Herkunft, Vermerk und Quelle, «Recherche starten» solange unvollständig; Saatempfehlung von Hand nur, wenn die Recherche nichts ergänzt | UC4-AK1 bis AK9 |
| Etiketten | Liste mit Stand, Auswahl, Startfeld, Druckversatz X/Y, Testbogen, Druckansicht | UC14-AK1 bis AK7 |
| Einstellungen | Push-Zeit, Test-Push, Vorlauf n, Kannengrösse mit Rechenbeispiel, Messmittel, k je Komponente, Messgerät (u_EC, u_pH), Thema, Pflegebudget, Ruhe je Gefäss, Telefonnummer fürs Vertretungsblatt; Einstiege Anlagen, Etiketten, Notfallblatt, Gerät neu | UC0-AK3, AK4 |
| Info | Logo mit Claim, App-Version mit Commit, Datenstand, Lizenz der Schrift | Abnahme 2 |
| Druck | Etikettenbogen A4 3 × 7 (`@page { size: A4; margin: 0 }`), Notfallblatt «Stand je Gefäss» (Kennung, Betriebsart, Zielbereich, Dosis je Kanne, letzte Messung, nächster Wechsel), Vertretungsblatt | UC14-AK3 |

## 5 Texte (Auszug)

Buttons beginnen mit dem Verb, keine Ausrufezeichen, Du-Form, Doppel-s. Feste Texte aus dem Konzept werden wörtlich übernommen, u. a.: «Kein Netz, nicht gespeichert, erneut senden», «Neue Version, neu laden», «Etikett nicht bekannt», «Gefäss 2.3 entfernt am …», «Richtiges Gefäss? Hier wächst: Salate», «Ziel nicht ganz erreichbar», «Leitungswasser zu hoch für dieses Gefäss», «Mehr EC als erwartet: Dosis, Volumen oder Kanne prüfen», «möglicherweise doppelt dosiert», «Wurzeln vermutlich verwachsen, nur innerhalb des Gefässes tauschen», «Satz belegt 18 von höchstens 16 Plätzen», «Saatgut prüfen», «Sollwert nicht belegt», «EC-Basis unklar», «Nachfüllwasser noch nicht ansäuern», «Push nicht eingerichtet». Warnhinweise nennen Messwert und Sollwert: «Gemessen 6.7, Sollwert deiner Anlage 6.0–6.5.»
