# Auftrag 1 «Lesen und fragen»: Rückfragen, Widersprüche, Annahmen

Stand 1.11.2026 · Lead-Entwickler (Claude Code) an Tim · Grundlage: alle Dateien in `docs/input/`, `data/stammdaten/sorten.csv` und `design-system/`, vollständig gelesen.

**Lesehilfe.** «Z. n» ist die Zeile in der genannten Datei. «Konzept» ist `docs/input/konzept_v1.1.md` (gleiche Zeilen wie v1.0), «UC» ist `docs/input/use_cases_f4.md`, «Bericht» ist `docs/input/use_cases_f4_bericht.md`, «Beipackzettel» ist `docs/input/README.md`. Nicht gestellt sind: die Punkte unter «Bekannte Abweichungen» im Beipackzettel (entschieden, es gilt das Konzept), die Fragen aus Konzept 16.4 (deren Defaults gelten als deine Antwort) und die am 31.10.2026 entschiedenen E-F4-1, E-F4-2 und E-F4-8.

**Stand 1.11.2026: entschieden.** Tim hat alle Defaults aus Teil 1 und alle Vorschläge aus Teil 2 angenommen. Was das Konzept betrifft, steht seit 1.11.2026 im Text von Konzept v1.1 (Erratum E6, Anhang B.2); `konzept_v1.0.md` ist ersetzt und liegt im Git-Verlauf. Die übrigen Entscheide gelten so, wie sie hier stehen, und gehen in Auftrag 2 und 3 ein.

## Teil 1: Rückfragen, die die Spezifikation verändern

### Übersicht

| Nr. | Thema | Default in einem Satz |
|---|---|---|
| R1 | E-F4-3 Prüfart der Edge-Function-Tests | [Unit] mit Zusatz «Deno test», keine sechste Prüfart |
| R2 | E-F4-4 neue AK-Nummern | so bestätigen, ab der Spezifikation eingefroren |
| R3 | E-F4-5 Rücktaste im Ziffernblock | «leeren» oben rechts, Rücktaste unten rechts |
| R4 | E-F4-6 Reste aus Fassung 3 | sechs behalten als (A), drei streichen (Liste) |
| R5 | E-F4-7 Erratum-Kandidaten Etikett | Wortlaut «Kennung am Platz, Etikett am Gefäss», Enum `70x42_3` |
| R6 | E-F4-9 Rundung der Teil-EC | in Hundertsteln gerundet: 1.04, Hinweis ab 1.30 |
| R7 | E-F4-10 Auswertungs-AK in C4 | so bestätigen |
| R8 | Referenzdatei Düngerrechner | 17 Zeilen statt 19, Zielbereich je Zeile legst du fest |
| R9 | Sortenmerkmale in `sorten.csv` leer | Felder bleiben leer, Vererbung von der Art |
| R10 | W0-Datenvorlage und W0-Lauf | reine Langform, Spalten in `03_import_w0.md` vorab bis 3.11. |
| R11 | Pflege des Design Systems | Ergänzungen im Repository, `tokens.json` wird die Quelle |
| R12 | Wassertemperatur «am Ende der Lichtphase» | Zeitfenster 18:00 bis 21:30 für `v_klima` |
| R13 | E-Mail als Rückfall für die Push | nur bei fehlendem oder ungültigem Abo, Versand über Resend |

### R1 Prüfart der Edge-Function-Tests (E-F4-3)

- **Fundstelle:** UC Z. 133; Bericht Z. 42 und Z. 60; Konzept 12.6 Z. 964 (eigene Ebene «Edge Function», Deno test), Glossar Z. 1321 (fünf Prüfarten), A.3 TE-05 Z. 1417 (UC8-AK7 als [SQL]).
- **Frage:** Tragen TP1 bis TP4 und TK1 bis TK3 die Prüfart [Unit] mit dem Zusatz «Deno test», oder bekommt das Glossar eine sechste Prüfart [Edge]?
- **Warum blockiert:** Das AK-Abdeckungsskript (12.6, Z. 972) sucht die AK-Nummern je Prüfart in den Testnamen; `06_tests.md` legt fest, welche Berichte (Vitest, Deno, pgTAP, Playwright) es liest.
- **Default:** [Unit] mit Zusatz «Deno test» wie in Fassung 4; das Skript liest die Testnamen aus Vitest und Deno test. Keine neue Prüfart, also kein Erratum. Der Protokollteil von UC8-AK7 bleibt [SQL] (TE-05).

### R2 AK-Nummern bestätigen (E-F4-4)

- **Fundstelle:** UC Z. 133; Bericht Z. 9 und Z. 61.
- **Frage:** Bestätigst du die 34 neuen AK (davon 8 in UC0), C4-AK1 bis AK3 und die Teilung der Rundgang-AK in 1a bis 1c?
- **Warum blockiert:** Die Nummern werden Teil der Testnamen und der Issues; eine spätere Umnummerierung bricht das AK-Abdeckungsskript.
- **Default:** so bestätigt. Ab der Abnahme der Spezifikation (11.11.) sind die Nummern eingefroren; neue AK werden hinten angehängt, entfallene behalten ihre Nummer mit «entfällt».

### R3 Rücktaste im Ziffernblock (E-F4-5)

- **Fundstelle:** UC Z. 52 bis 55 (Skizze A3) und Z. 62; Konzept 6.3 Z. 353 («leeren» oben rechts, weg von «Speichern»).
- **Frage:** «leeren» oben rechts und die Rücktaste dafür unten rechts?
- **Warum blockiert:** Das Tastenraster geht in `05_masken.md`, in den Baustein NumPad und in die E2E-Tests der Berührungen (Rundgang-AK1a bis 1c).
- **Default:** wie die Skizze: Spalte rechts von oben «leeren», «−0.1», «+0.1», Rücktaste. Tastenhöhe 68 dp nach Konzept (die Skizze nennt in Z. 52 «4 × 72 dp», in Z. 53 «68 dp»; es gilt 68 dp, siehe W14).

### R4 Reste aus Fassung 3 ohne Beleg im Konzept (E-F4-6)

- **Fundstelle:** Bericht Z. 63 und Z. 71; UC Z. 15, 63, 104, 129, 145, 177, 179, 242, 292, 371, 373.
- **Frage:** Welche dieser Werte bleiben als Annahme (A) in der Spezifikation?
- **Warum blockiert:** Behaltene Werte werden AK mit Prüfart und damit Testfälle oder Gerätechecks.
- **Default:**

| Wert | Fundstelle | Default |
|---|---|---|
| rund 70 Apps | UC Z. 15 | streichen; nicht spezifikationsrelevant, Konzept 2.1 nennt für die Recherche vom 21.10. rund 90 Apps |
| Auswahlregel des Regaltests (wenigste unbemerkte Fehler, bei Gleichstand die schnellere) | UC Z. 63 | behalten (A) |
| rund 0.35 PT für den Regaltest | UC Z. 63 | streichen; die Schätzung kommt aus `docs/plaene/pakete.md` |
| Aufteilung der 75 Minuten je Paket | UC Z. 104 | streichen; Konzept 13.3 nennt nur 75 und 45 Minuten |
| Papierfach 50 bis 80 g/m² | UC Z. 129 | behalten (A) als Prüfpunkt im Gerätetest |
| Bildschirm bis Timerende plus 2 min | UC Z. 145, Z. 373 | behalten (A) |
| Hauptknopf 72 dp, Maske «Gefäss» in höchstens 1 s | UC Z. 177, Z. 179 | behalten (A); 72 dp liegt über dem Minimum von 68 dp |
| Heute in höchstens 2 s | UC Z. 292 | behalten (A) |
| Frage «Erreicht die Lösung den Netztopfboden?» | UC Z. 242 | behalten (A) |
| Wechseldauer 60 bis 75 min, ohne Teil-Dosis 45 min | UC Z. 371 | streichen aus der Spezifikation; keine Regel, nur Schätzung |

### R5 Erratum-Kandidaten zum Etikett (E-F4-7)

- **Fundstelle:** Konzept 5.4 Z. 234 («gehört zum Gefäss») gegen Z. 234 (gleicher Absatz), 8.2 Z. 646 und R9.1 Z. 607 (Kennung am Platz); Enum `'70x42'` in Z. 646 gegen 70 × 42.3 mm in Z. 16, 607, 829; Bericht Z. 39 bis 40.
- **Frage:** Gilt der Wortlaut «Kennung am Platz, Etikett physisch am Gefäss», und wie heisst der Enum-Wert?
- **Warum blockiert:** `02_datenmodell.sql` legt den Enum fest; nach dem ersten Druck ist eine Umbenennung nur noch zweistufig möglich (Konzept 11.4).
- **Default:** Wortlaut wie oben; `etikett.format enum('70x42_3','55x25')`. Umgesetzt mit E-F4-8 (W2) in Konzept v1.1 (Erratum E6).

### R6 Rundung der erwarteten Teil-EC (E-F4-9)

- **Fundstelle:** Konzept R4.8 Z. 465 («aus den gerundeten Ist-Mengen»), RF12 Z. 488 (1.04), R10.1 Z. 551 (Rechnung in Hundertsteln als Ganzzahl); UC Z. 373; Bericht Z. 49 und Z. 66.
- **Frage:** Rechnet die Grenze «mehr als 0.25 über der erwarteten Teil-EC» mit 1.04 oder mit 1.037?
- **Warum blockiert:** Grenzwerttest in `06_tests.md` und in der Referenzdatei; 1.29 ist je nach Regel Hinweis oder nicht.
- **Default:** gerundet auf Hundertstel wie in R10.1: erwartete Teil-EC 1.04, Grenze 1.29, «mehr als» heisst ab 1.30. Grenzfälle im Test: 1.29 ohne Hinweis, 1.30 mit Hinweis.

### R7 AK der Auswertungssichten in C4 (E-F4-10)

- **Fundstelle:** UC Z. 518; Bericht Z. 67.
- **Frage:** Bleiben C4-AK1 bis AK3 bei den Auswertungssichten (statt in UC10)?
- **Warum blockiert:** Paketzuordnung und Testnamen.
- **Default:** ja; die Sichten gehören zum Kern-Paket Datenmodell in I0, C4-AK2 (CSV in Excel) wird am 1.4.2027 als [Gerät] geprüft.

### R8 Inhalt und Eingaben der Referenzdatei Düngerrechner

- **Fundstelle:** Konzept R4.12 Z. 490 und 12.6 Z. 974; Düngeplan Z. 44 bis 68; Beipackzettel Z. 62 (offene Rückfrage zu 4.1 bis 4.3).
- **Frage:** Welche Zeilen aus Düngeplan Abschnitt 4 kommen in `tests/golden/duengerrechner_referenz.csv`, und mit welchen Eingaben?
- **Warum blockiert:** Die Datei ist das Orakel des Rechners, du legst sie bis 30.11. selbst an, und ich muss in `06_tests.md` ihr Format festlegen. Zwei Lücken: (a) Die Zeilen 4.1 «Basilikum + Pourpre, Kratky 7 l» und 4.3 «Mangold + Randen» beschreiben Gefässe, die es nach Erratum E2 nicht mehr gibt. (b) Der Düngeplan nennt je Zeile nur eine Ziel-EC und Handstadien wie «Jungpflanze (Woche 1)»; der Rechner braucht einen Zielbereich, ein Herstellerstadium, das Volumen, ECWasser, k und den Stand der Teil-Dosis. Der Satz in Z. 490 («2.1 auf die Mitte 1.2, 3.2 und 3.3 nicht skaliert») setzt Zielbereiche voraus, die nirgends stehen; für 3.3 (Babyleaf, Düngeplan-Ziel 1.0) passt «nicht skaliert» nur bei einem Zielbereich um 1.4 bis 1.8.
- **Default:** 17 Düngeplan-Zeilen plus RF1 bis RF12. 4.1 und 4.3 entfallen; 4.2 wird zur Zeile «Station 4.1, 3 l, feste Dosis 0.5 ml/L» (gleich UC7-AK7). «Jungpflanze (Woche 1)» entspricht «1. echte Blätter». Rahmenwerte wie in R4.12: Wasser 0.5, k 0.3, Teil-Dosis aus. Den Zielbereich je Zeile trägst du ein; wo du keinen einträgst, gilt Ziel-EC des Düngeplans ± 0.2. Z. 490 ist in Konzept v1.1 so gefasst. Spalten: `zeile_id, quelle, gefaess, volumen_l, stadium, zielbereich_ec_min, zielbereich_ec_max, ec_wasser, k, teil_dosis, grow_ml, micro_ml, bloom_ml, ec_ziel, skaliert, hinweis`.

### R9 Sortenmerkmale in `sorten.csv` bewusst leer

- **Fundstelle:** Beipackzettel Z. 16 (Entscheid 31.10.: Keimart und Keimtemperatur laut Tüte, Wuchshöhe, Wuchsform, Frühzeitigkeit, Keimfähigkeit, Bestand leer) gegen Konzept 8.4 Z. 713 und 16.4 Z. 1184 (sorten.csv «mit Tüten- und Katalogwerten»), 5.5 Z. 255 (Katalogwerte «in W0 als Klasse C»), 8.2 Z. 666 (Quelle aller Sortenwerte ist sorten.csv oder UC4), 9.1 Z. 742 (Katalogwerte für genetische Merkmale zugelassen); Folgen in R3.2 Z. 420, R3.3 Z. 431, R12.2 Z. 599.
- **Frage:** Bleiben diese Spalten im Testbetrieb leer, und woher kommt die Wuchsform «hängend» von Tumbling Tom und Ampelo Gelb?
- **Warum blockiert:** Der Seed muss wissen, ob leere Felder zulässig sind; die Passung (Höhenregel, Ausnahme «hängend», Hinweis «an die gangseitige Längskante») und die Saatmenge (Keimrate aus der Packung) hängen daran.
- **Default:** Die Spalten bleiben in `sorten.csv`, dürfen leer sein und werden dann nicht geladen; die Vererbung greift auf die Art (Wuchshöhe, Wuchsform aus W0, Keimfähigkeit aus der Standard-Keimfähigkeit der Art). Für die erste Runde ändert das nichts, weil der Mix aus der Passungsmatrix kommt (9.6). Die Wuchsform «hängend» der zwei Sorten trägst du als Katalogwert (Klasse C, Vermerk «Katalog») nach, sobald du willst; bis dahin erscheint der Kanten-Hinweis nicht. Leerer Bestand heisst «unbekannt», die Warnung «Bestand reicht nicht» (UC Z. 229) entfällt dann.

### R10 W0-Datenvorlage und W0-Lauf

- **Fundstelle:** `w0_datenvorlage.csv` Z. 1; Beipackzettel Z. 14; Konzept 9.2 Z. 756 bis 772, 8.2 profilwert Z. 667, 9.5 Z. 788 bis 789, 13.1 Z. 990; `w0_vorgehen.md` Z. 22 und 31.
- **Frage:** (a) Soll die Vorlage reine Langform sein? (b) Wer führt den Probelauf ab 3.11. durch, und wo?
- **Warum blockiert:** (a) Die Vorlage ist eine Mischform: Dauer, BBCH und Wechselmerkmal stehen als Spalten in jeder Zeile, obwohl sie in `profilwert` eigene Grössen sind (Enum Z. 667); `wert_typ` fehlt; die Vorlagen für Artmerkmale, Kulturform, Saatempfehlung, Kulturgruppe/Standard und Quelle fehlen ganz. Das bestimmt `02_datenmodell.sql` und `03_import_w0.md`. (b) Die Spalten werden laut 9.5 erst mit der Spezifikation am 11.11. eingefroren, der Probelauf beginnt aber am 3.11.
- **Default:** (a) Reine Langform: eine Zeile je Art, Phase und Grösse; `anwendbar`, `dauer`, `bbch`, `wechselmerkmal` sind Grössen; Spalten `wert_min`, `wert_typ`, `wert_max`, `text_wert`; `bezugstemperatur_c` und `bezugs_dli` nur bei `dauer`; dazu eigene Vorlagen für `art`, `art_kulturform`, `herkunft` (Herkunft je Feld als Langform), `saatempfehlung`, `kulturgruppe`, `standard` und `quelle`. (b) Ich liefere `03_import_w0.md` als ersten Teil von Auftrag 2 vorab bis 3.11.; die Spalten gelten ab dann und werden am 11.11. nur noch bestätigt. Den W0-Lauf startest du in einer eigenen Sitzung im selben Repository auf eigenem Zweig unter `data/wissensbasis/` (Rollen nach `w0_vorgehen.md`); er ist nicht Teil der Aufträge 1 bis 3.

### R11 Wer ergänzt das Design System, und wo?

- **Fundstelle:** Konzept 10 Z. 804 («zuerst im Design System ergänzt, nicht in der App erfunden», Export durch Tim) und Z. 833 (Termin vor I1a); `design-system/tokens.css` Z. 1 bis 3 («Nicht von Hand ändern … dann neu exportieren»); `design-system/README.md` Z. 92.
- **Frage:** Werden Dichte «regal», LabelSheet 70 × 42.3 mm, Notfallblatt, NumPad, Checklist und Tile im claude.ai-Artefakt ergänzt und neu exportiert, oder direkt im Repository?
- **Warum blockiert:** `05_masken.md` nennt Tokens und Bausteine; das erste I1a-Paket braucht sie, und ein Export aus dem Artefakt kostet dich jedes Mal einen Handgriff.
- **Default:** Ab jetzt ist `design-system/` im Repository die Quelle: Ein eigenes Paket vor I1a ergänzt `tokens.json`, erzeugt `tokens.css` per Skript neu, ergänzt `components/*.md` und `bundle.css` und zieht `Label.md` auf Konzept 10 nach (42.3 mm, 4 mm Innenabstand, Kennung auf 32 mm Breite, Adresse `https://hydrovisor.github.io/`). Du nimmst es wie jedes Paket ab; das Artefakt führst du nur nach, wenn du es weiter brauchst.

### R12 Wassertemperatur «am Ende der Lichtphase»

- **Fundstelle:** Konzept 5.2 Z. 198, 5.7 Z. 277 («bei jeder Messung, am Ende der Lichtphase»), 8.3 `v_klima` Z. 709, R3.2 Z. 421 (Maximum der letzten 7 Tage), R5.5 Z. 541 (Push 07:00), 14.3 Z. 1098.
- **Frage:** Welche Messungen zählen als «Ende der Lichtphase», wenn der Rundgang auch morgens stattfindet?
- **Warum blockiert:** Definition von `v_klima`, der Passungszeile «Wasser zu warm» und eines Hinweises in der Messmaske.
- **Default:** `v_klima` nimmt je Gefäss und Tag die letzte Messung zwischen 18:00 und 21:30 Ortszeit (Licht bis 21:00). Bewertung (R10.2), «Wärme prüfen» (über 24 °C) und das 7-Tage-Maximum in R3.2 nutzen alle Messungen. Die Messmaske zeigt vor 18:00 keinen Hinweis; die Push-Zeit bleibt 07:00.

### R13 E-Mail als Rückfall für die Push

- **Fundstelle:** Konzept 11.1 Z. 849 («Rückfallebene E-Mail mit derselben Sammel-Nachricht aus derselben Function»), 8.2 `push_versand.kanal` Z. 692, 16.4 Z. 1195.
- **Frage:** Wann geht die E-Mail, und über welchen Dienst?
- **Warum blockiert:** Supabase versendet nur Auth-Mails; ein freier Versand braucht einen Dienst mit Schlüssel (Secret, Konto, Kosten). Das betrifft `04_architektur.md`, die Secrets-Liste und die Tests TP1 bis TP4.
- **Default:** Die E-Mail geht nur, wenn kein aktives Push-Abo besteht oder der Versand mit 404 oder 410 scheitert, höchstens einmal je Tag. Versand über Resend (Gratisstufe); API-Schlüssel und Empfängeradresse als Supabase-Secrets, nie im Repository. Das Konto legst du in I0 an; bis dahin ist der Kanal abgeschaltet und Heute zeigt «Push nicht eingerichtet».

## Teil 2: Widersprüche zwischen den Dokumenten

| Nr. | Widerspruch | Fundstellen | Vorschlag |
|---|---|---|---|
| W1 | Merge auf `main`: Das Konzept lässt nur dich zusammenführen und verbietet `gh pr merge` per Deny-Regel; deine Arbeitsregel (c) vom 31.10. lässt mich nach deiner Bestätigung zusammenführen. Im Repository steht dieser Entscheid noch nirgends. | Konzept 12.1 Z. 907, 12.2 Z. 915, 12.3 Z. 939, 12.4 Z. 947 und 949, 12.5 Z. 956, 16.3 Z. 1175, Glossar Z. 1309 | Arbeitsregel (c) gilt. Auftrag 3: Regel in `CLAUDE.md` («Merge nach deiner Bestätigung der Kurzzusammenfassung»), `gh pr merge` aus `permissions.deny` nehmen, der Hook sperrt weiter Push auf `main` und die Produktions-Referenz; Entscheiddatei in `docs/entscheide/`. Im Konzept umgesetzt mit v1.1 (E6: 12.1 bis 12.5, 16.3, Glossar). |
| W2 | Kurzprüfung-Abweichung markiert «die Gefässe derselben Pumpe» gegen «den Bereich» (E-F4-8, entschieden: Pumpe). | Konzept 5.3 Z. 206 gegen R5.2 Z. 513 und R10.5 Z. 573; UC Z. 361 und 367 | Spezifikation nach Pumpe (`gefaess.luftpumpe`); R5.2 und R10.5 als Erratum E6 (mit R5). |
| W3 | Name des Code-Repositorys: «hydrovisor» gegen `hydrovisor.github.io`. | Konzept 11.1 Z. 852 und 11.2 Z. 858 gegen 11.1 Z. 846 und Erratum E4 Z. 1557 | `hydrovisor/hydrovisor.github.io` (Ist-Zustand, E4); die Supabase-Projekte heissen `hydrovisor` und `hydrovisor-dev`. |
| W4 | Entwicklungsprojekt «Gratisplan oder lokal, rund 25 USD pro Monat» gegen Ist-Zustand: `hydrovisor-dev` in der Pro-Organisation, rund 35 USD. | Konzept 11.1 Z. 848; Risikoregister RR8 Z. 1050 | Ist-Zustand gilt; Kostendach im Risikoregister (Auftrag 3) mit 35 USD. |
| W5 | Typen sollen «nach jedem Merge in CI neu generiert» werden; das Ruleset auf `main` erlaubt aber keine Commits ohne Pull Request und keinen Bypass. | Konzept 11.1 Z. 844, 12.3 Z. 942; Ruleset `main-schutz` | Der Job `db` erzeugt die Typen im Pull Request aus der lokal aufgebauten Datenbank und vergleicht sie mit der eingecheckten Datei; Abweichung bricht das Prüftor, der Lead committet die neu erzeugte Datei im Zweig. Kein CI-Commit auf `main`. |
| W6 | Kulturtyp von Mangold und Randen in `sorten.csv` leer bzw. «von Tim festlegen», obwohl das Konzept Randen als Blattkultur entschieden hat. | `sorten.csv` Z. 22 bis 23; `sorten_notizen.csv` Z. 22 bis 23; Konzept Q4 Z. 1337; UC Z. 447 | Beide `blatt`; ich setze es im Seed-Paket, wenn du nicht widersprichst. |
| W7 | Thema: Das Design System folgt `prefers-color-scheme` mit Übersteuerung; das Konzept verlangt «Hell» unabhängig vom Systemmodus, sagt aber nur «am Regal». | `design-system/README.md` Z. 50; Konzept 6.3 Z. 355, 10 Z. 822; UC0 Z. 162 | Eine Einstellung «Thema» für die ganze App (Hell, Dunkel, wie System), Standard «Hell». Kein Wechsel des Themas zwischen Masken. |
| W8 | Texte aus dem Düngeplan, die laut R7.2 die ersten Wissenskarten werden, widersprechen dem Konzept an Stellen, die der Beipackzettel nicht aufführt: W-Messung «vierteljährlich» (Z. 38); «Bei Kratky vor jeder Messung umrühren» (Z. 40); «10 % nachdosieren», «Wasser höchstens bis zum Arbeitsvolumen» (Z. 46); Vorblüte, «sobald der erste Blütenstand sichtbar ist» (Z. 72) gegen erste offene Blüte BBCH 60; Umsetzen «ab dem ersten echten Blattpaar» (Z. 78) gegen 2 bis 4 echte Blätter; Bestäubung «täglich leicht schütteln» (Z. 97) gegen alle 2 Tage mit der Zahnbürste; pH 5.6 bis 5.8 in der Vorblüte (Z. 97); «Nachschub aus 4.2» (Z. 99); «Kalibriert … alle 30 Tage (das Gerät erinnert selbst)» (Z. 117). | Düngeplan wie genannt; Konzept R7.2 Z. 617, R4.7 Z. 463, R4.8 Z. 465, R4.10 Z. 469, R1.5 Z. 374, R4.3 Z. 452, 5.8 Z. 291, R5.2 Z. 516 und 529, 13.1 Z. 999 | Konzept gilt. Beim Übertragen in `data/wissen/wissenseintrag.csv` werden diese Sätze an das Konzept angepasst; ich lege den Entwurf im UC12-Paket vor, du gibst ihn frei. |
| W9 | W0-Vorgehen über den Beipackzettel hinaus: «eine Zeile je Art und Phase» (Z. 22) gegen eine Grösse je Zeile (Konzept 9.2); Artmerkmale unvollständig (Z. 31); «25-mm-Schwamm» (Z. 90) gegen Würfel 2.2 cm; das Dokument ist trotz Konzept 9 Z. 738 und 17 Z. 1232 nicht nachgeführt. | `w0_vorgehen.md` Z. 22, 31, 90; Konzept 9.2 Z. 756, 5.3 Z. 215 | Konzept 9 gilt; die Spalten legt `03_import_w0.md` fest (R10). |
| W10 | Konzept nennt als Export `design-system/components/*.css`; im Repository liegen `components/*.md`, `bundle.css` und `tokens.json`. | Konzept 10 Z. 804, 16 Z. 1163; `design-system/README.md` Z. 90 | Export so übernehmen; `bundle.css` ist die CSS-Quelle der Bausteine. |
| W11 | `StatusBadge.md` erklärt «unsicher» nur mit überfälliger Kalibrierung; R10.3 auch mit fehlender Kalibrierung und dem Ereignis «als unsicher markiert». | `design-system/components/StatusBadge.md`; Konzept R10.3 Z. 555 | R10.3 gilt; Text im Design-System-Paket (R11) nachführen. |
| W12 | Fassung 4 und der Bericht verweisen auf `docs/input/use_cases_f3.md`, die nicht mehr im Repository liegt. | UC Z. 631; Bericht Z. 3; Beipackzettel Z. 11 | Nur historischer Verweis (Commit 9e6cecc); kein Handlungsbedarf. |
| W13 | `sorten.csv` führt die Art als deutschen Namen («Tomate»); `sorte` verweist auf `art` mit `art_id` (z. B. `solanum_lycopersicum`), und `art` hat keine Spalte für den deutschen Namen, den die Oberfläche zeigt. | `sorten.csv` Z. 1; Konzept 8.2 Z. 663 und 666; Beipackzettel Z. 14 und 16 | `art` erhält `name_de`; der Seed ordnet `sorten.csv.art` über `name_de` zu und bricht bei unbekanntem Namen ab. Alternativ eine Spalte `art_id` in `sorten.csv`. |
| W14 | Skizze A3: Ziffernblock «4 × 72 dp» gegen Tasten «83 × 68 dp» in der nächsten Zeile. | UC Z. 52 bis 53; Konzept 6.3 Z. 349, 10 Z. 825 | 68 dp (Token `size-touch-regal`). |

## Teil 3: Annahmen

1. **Auftrag.** Deine Nachricht «Auftrag 1 «Lesen und fragen»» lese ich als den Wortlaut aus Konzept 16.1 mit den Arbeitsregeln (a) bis (e) aus der Übergabe vom 31.10.2026. Fakten habe ich nur aus dem Repository genommen; die Übergabe lieferte nur die Arbeitsregeln und den Stand der Einrichtung.
2. **Rangfolge.** Konzept v1.1 vor Use Cases Fassung 4 vor Düngeplan V1.6 vor W0; die «Bekannten Abweichungen» im Beipackzettel sind entschieden.
3. **Entschieden am 31.10.2026:** E-F4-1 (Ebene 4 in drei Gruppen), E-F4-2 (Sorte zuerst, Passung beim Umsetzen), E-F4-8 (Pumpe). Die Spezifikation setzt sie so um.
4. **Stand der Einrichtung (Strang 0)** gilt als erfüllt: Organisation, Repositorys, Pages über Actions mit der Adresse `https://hydrovisor.github.io/`, Ruleset, Umgebung `production` mit zwei Secrets, Supabase-Projekte `hydrovisor` und `hydrovisor-dev` in Frankfurt mit gesperrter Registrierung, Cloudflare-Projekt `hydrovisor-vorschau`. Die Bedingung «Adresse bestätigt» (Konzept 13.1, 16.4, 17) erfüllt der QR-Test im Gerätetest.
5. **Noch nicht eingerichtet** und von dir in I0 zu setzen (ich bereite vor): Umgebung `backup` mit ihren vier Secrets und einer lesenden Datenbankrolle, Anthropic- und VAPID-Schlüssel als Supabase-Secrets, Umgebungsvariablen der Vorschau in Cloudflare, Statuschecks im Ruleset (erst wenn `pr.yml` existiert). Die `.mcp.json` mit fester Referenz auf `hydrovisor-dev` kommt in Auftrag 3; für Auftrag 2 brauche ich keinen Supabase-Zugang.
6. **Seed in Produktion** läuft in `deploy.yml` nach der Migration unter derselben Freigabe und lädt nur Wissen, Sortenstamm, Düngerschema, Messgerät, Einstellungen und Konstanten. Testanlage Y nur in Entwicklung und lokal; die Demo-Anlage X in Produktion nur auf Abruf (für Abnahme 2), löschbar nach 8.5.
7. **Packungen.** Je Sorte eine Zeile `saatgut` mit Kaufdatum 17.10.2026; die zwei Packungen der Babyleaf-Mischung (`sorten_notizen.csv` Z. 20) gelten als eine Packung. `sorten_notizen.csv` wird nicht geladen.
8. **Gemeinsame Fachlogik.** `src/domain/` ist reines TypeScript ohne Abhängigkeiten von Browser oder Node, damit Client (Vite) und Edge Function (Deno) dieselben Module importieren; wie, legt `04_architektur.md` fest.
9. **Timer-Push** läuft über dieselbe Edge Function wie die Sammel-Push; ein Cron-Lauf jede Minute prüft fällige Timer (`naehrloesungsansatz.timer_ende`), damit die Push höchstens rund 1 Minute nach Ablauf kommt. Die tägliche Sammel-Push bleibt bei der 5-Minuten-Regel (Unique-Index verhindert Doppelversand).
10. **Deckeltausch «nur bei leerem Gefäss»** (R8.3) heisst «ohne Pflanzen», nicht Füllzustand «leer» (Bericht Z. 46).
11. **Lichtstunden** stehen am Bereich und sind mit dem Lichtzeitplan der Anlage vorbelegt (Bericht Z. 41); keine eigene Prüfung auf Gleichheit.
12. **Personendaten.** Telefonnummer (Vertretungsblatt, Konzept 11.7) und E-Mail-Adresse liegen nur in der Datenbank (`einstellung`) oder als Secret, nie im Repository, in Fixtures oder in Testdaten.
13. **Werte mit (A)** bleiben Annahmen; die Spezifikation kennzeichnet sie und nennt den Messzeitpunkt aus Konzept 17.
14. **Honor-Viewport** 360 × 780 dp bis zum Gerätetest (Konzept 17 Z. 1215); E2E läuft mit 360 × 640 dp.
15. **Konzeptänderungen.** Nach deinem Auftrag vom 1.11.2026 kommen Entscheide, die das Konzept betreffen, direkt in den Konzepttext (neue Fassung wie v1.1, Zeilennummern möglichst unverändert, Eintrag in Anhang B.2) und nicht nur als Erratum-Zeile. Das Konzept im Repository ist die massgebende Fassung; die Originale im Drive-Ordner bleiben v1.0.
16. **Arbeitsweise.** Jede Änderung geht über einen Zweig mit höchstens 28 Zeichen und einen Pull Request; vor jedem Merge erhältst du eine Kurzzusammenfassung und führst nach deiner Bestätigung erst ich zusammen. In Auftrag 1 keine Subagents und kein Agent Team.
