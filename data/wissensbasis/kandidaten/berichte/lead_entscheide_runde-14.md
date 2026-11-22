# Lead-Entscheide W0 Runde 14 (Entscheid 0018, Issue #266)
Stand 22.11.2026. Erzeugt aus den Kandidatendateien (Spalte `notiz_tim` der freigegebenen Zeilen). Werkzeug: `scripts/w0/lead_entscheide_runde14.py` mit `scripts/w0/w0lib.py`, Bericht `scripts/w0/berichte.py`.

## Fachregeln für offene Werte (A)
| Regel | Inhalt |
|---|---|
| D1 | Bereich ohne typischen Wert: typ = abgerundete Mitte |
| D2 | mehrere Einzelwerte: min und max = kleinster und grösster Quellenwert, typ = Wert der besten Quelle nach Regel 9.3 |
| D3 | ein Einzelwert x: min = 0.8·x, max = 1.25·x (gerundet), typ = x |
| D4 | Angabe in Wochen: Tage = 7·Wochen |
| D5 | Tage ab Saat: minus Keimdauer derselben Quelle, sonst minus Keimdauer typ der Art |
| D6 | nur eine Grenze aus einem Quellenwert (typ ist der grösste bzw. kleinste Quellenwert): die andere nach D3 (0.8·typ bzw. 1.25·typ) |
| D7 | ernte_ab_d ab Saat ohne Umsetztag derselben Quelle oder aus Direktsaat der Quelle, in der Anlage umgesetzt: minus art.umsetzen_ab_d, fehlt er minus Keimung typ plus Anzucht typ der Art |
| D8 | Umsetztag: nennt die gewählte Quelle selbst einen Bereich, gelten seine Grenzen; sonst umsetzen_ab_d = Wert der Quelle am nächsten an der Anlage (Würfel unter LED, dann DWC, Floating oder NFT); umsetzen_bis_d = grösster Wert einer Quelle der Klasse A oder B1 derselben Art, nur wenn er mindestens Keimung typ plus Anzucht typ erreicht (die App zeigt «In der Station lassen bis» Saat plus umsetzen_bis_d und mahnt «Umsetzen überfällig» sieben Tage danach; ein früherer Wert endete vor dem Ende der Anzucht nach Phasen), sonst Klasse D |
| E1 | pH- oder EC-Einzelwert: Band ±0.2 um den Wert |
| E2 | Band über der Validatorgrenze: auf die Grenze gekürzt |
| E3 | EC-Basis nach der Quelle korrigiert (Methodenprüfer) |

## Neue oder geänderte freigegebene Zeilen auf Ebene Art

| zeile_id | Wert | Quelle (Klasse) | Entscheid |
|---|---|---|---|
| `ak.allium_schoenoprasum.dauerkultur_blatt.ernte_ab_d` | 28 | agrowtronics-schnittlauch-2021 (C) | eigener Wert aus ak.allium_schoenoprasum.dauerkultur_blatt.ernte_ab_d#4: Runde 14 (#266), K-schnittlauch-08, Konzept 9.3 Regel 2 (gleiche Klasse C, näher an der Anlage: Anzucht rund vier Wochen, dann Umsetzen; Fachkritik P8) vor CRC (Direktsaat in Perlit-Türme, 75 bis 85 Tage ab Saat, nach D7 47 bis 57 ab Umsetzen, über Wachstum max 50, P1); Regel D4 (A): «at least another three or four weeks» nach dem Umsetzen, obere Grenze 4 Wochen = 28 Tage, weil «at least» den Bereich zur Mindestangabe macht; erste Ernte 28 + 28 = 56 Tage ab Saat, nahe der kleinsten Phasensumme 57 (P2); beide Quellen trennen Dauerkultur und Schnitt nicht (P6) |
| `ak.allium_schoenoprasum.dauerkultur_blatt.ernteintervall_d` | 14 | agrowtronics-schnittlauch-2021 (C) | eigener Wert aus ak.allium_schoenoprasum.dauerkultur_blatt.ernteintervall_d#1: Runde 14 (#266), Regel D4 (A): «Chives grow back to be harvested again within two to three weeks» (Klasse C, einzige geprüfte Quelle), untere Grenze 2 Wochen = 14 Tage: frühester Tag, an dem der Horst wieder schnittreif ist, die Ernteaufgabe kommt so nie zu spät; doppelt so lang wie Petersilie 7 derselben Kulturgruppe, stimmig mit «regeneration time is several weeks» (Fachkritik P7) |
| `ak.allium_schoenoprasum.schnitt.ernte_ab_d` | 28 | agrowtronics-schnittlauch-2021 (C) | eigener Wert aus ak.allium_schoenoprasum.schnitt.ernte_ab_d#3: Runde 14 (#266), K-schnittlauch-09, Konzept 9.3 Regel 2 (gleiche Klasse C, näher an der Anlage: Anzucht rund vier Wochen, dann Umsetzen; Fachkritik P8) vor CRC (Direktsaat in Perlit-Türme, 75 bis 85 Tage ab Saat, nach D7 47 bis 57 ab Umsetzen, über Wachstum max 50, P1); Regel D4 (A): «at least another three or four weeks» nach dem Umsetzen, obere Grenze 4 Wochen = 28 Tage, weil «at least» den Bereich zur Mindestangabe macht; erste Ernte 28 + 28 = 56 Tage ab Saat, nahe der kleinsten Phasensumme 57 (P2); beide Quellen trennen Dauerkultur und Schnitt nicht (P6) |
| `ak.allium_schoenoprasum.schnitt.ernteintervall_d` | 14 | agrowtronics-schnittlauch-2021 (C) | eigener Wert aus ak.allium_schoenoprasum.schnitt.ernteintervall_d#1: Runde 14 (#266), Regel D4 (A): «Chives grow back to be harvested again within two to three weeks» (Klasse C, einzige geprüfte Quelle), untere Grenze 2 Wochen = 14 Tage: frühester Tag, an dem der Horst wieder schnittreif ist, die Ernteaufgabe kommt so nie zu spät; doppelt so lang wie Petersilie 7 derselben Kulturgruppe, stimmig mit «regeneration time is several weeks» (Fachkritik P7) |
| `ak.beta_vulgaris_cicla.schnitt.schnitte_max` | 10 | risegardens-library-mangold (B2) | Runde 14 (#266), Ersatzregel des Herstellers «ready to remove when you have gotten 5-10 harvests» (Indoor mit LED, Klasse B2, einzige geprüfte Quelle), obere Grenze 10 als Höchstzahl der Schnitte (Feldbedeutung «max.»); kein Versuchsplan (P17); mit umsetzen_ab_d 21, ernte_ab_d 28 und Intervall 14 fiele der 10. Schnitt auf 175 Tage ab Saat (P15, zwei Quellen); kulturdauer_max_d bleibt Klasse D |
| `ak.spinacia_oleracea.schnitt.ernte_ab_d` | 30 | smgardener-spinat-kratky-2022 (C) | Runde 14 (#266), erste Ernte 30 Tage ab Saat (Direktsaat in Kokosfaser im Kratky-Gefäss wie die Anlage in 3.2, Klasse C, einzige geprüfte Quelle; D7 greift bei Direktsaat nicht, Fachkritik P9); Reihenfolge Babyleaf 14 vor Schnitt 30 vor Kopf 64 stimmig (P10); dieselbe Quelle nennt danach zwei Schnitte im Abstand 7 bis 10 Tage, stimmig mit den freigegebenen schnitte_max 3 und ernteintervall_d 7 (P11) |
| `art.beta_vulgaris_conditiva.umsetzen_bis_d` | 25 | actasci-randen-mudas-floating-2005 (A) | Runde 14 (#266), Regel D8 (A): 25 Tage ab Saat («transplante, realizado aos 25 DAS», Anzucht im Floating mit Nährlösung, Klasse A), grösster Wert der Klasse A oder B1 und über Keimung typ 3 plus Anzucht typ 10 = 13 (Fachkritik P12); Fenster 9 bis 25 mit dem freigegebenen umsetzen_ab_d; P13: einzelner Versuchstag für Feldsetzlinge und acht Tage über der Summe der Maxima, als spätester Tag dennoch stimmig (Mangold 28 derselben Kulturgruppe, P14) |

Dazu 0 Kulturgruppen-Mindestzeilen (V13) als Kopie der neuen Art-Zeilen der Leitkultur bzw. mit «(A) andere Art».

## Ergänzungen des Lead zu Runde 14

- **Auftrag:** Tim im Chat vom 22.11.2026: «Runde 14 und Wächter». Auftrag der Runde: `teile/auftrag_runde-14.md`. Recherche in drei Gruppen (Kräuter, Fuchsschwanzgewächse, Fruchtgemüse), 27 neue Kandidaten der Rechercheure, davon 9 bestätigt; dazu 4 eigene Werte des Lead (31 neue Zeilen in `kandidaten/art.csv`) (Methoden- und Quellenprüfung), 7 Werte freigegeben.
- **Bereiche (Plan 266 A3):** Nennt die Quelle einen Bereich, steht die Rohgrenze im Kandidaten und «Bereich: …» am Anfang der `fundstelle`; den Wert leitet der Lead als eigenen Wert (`ablauf.md` Annahme 5 und 9) mit Begründung ab. Keine neue Regel. Ist die Rohgrenze schon der Wert des Felds (Mangold `schnitte_max`: obere Grenze 10 = «max.»), wählt der Lead den Kandidaten direkt (Prüferbefund 2).
- **K-schnittlauch-08 und -09 (Fachkritik P1 bis P8):** agrowtronics (Klasse C, Anzucht rund vier Wochen, dann Umsetzen wie die Anlage) vor CRC (Klasse C, Direktsaat in Perlit-Türme; 75 bis 85 Tage ab Saat ergeben nach D7 47 bis 57 ab Umsetzen, über Wachstum max 50), Konzept 9.3 Regel 2. Aus «at least another three or four weeks» die obere Grenze **28 Tage** (D4): «at least» macht den Bereich zur Mindestangabe, erste Ernte 56 Tage ab Saat nahe der kleinsten Phasensumme 57; 21 läge elf Tage unter Wachstum min 32. Dieselbe Seite stützt 28: «Wait about a month or a little less before you make the first cut» (Prüferbefund 3). Intervall aus «within two to three weeks» die untere Grenze **14 Tage** (frühester Schnitt, die Aufgabe kommt nie zu spät; gleich Mangold 14). Beide Quellen trennen Dauerkultur und Schnitt nicht (P6); beide Kulturformen erhalten dieselben Werte.
- **Spinat Schnitt `ernte_ab_d` 30 ab Saat:** Spinat wird in der Anlage direkt gesät (Kratky belüftet 3.2, Q5), wie in der Quelle; D7 greift nicht, gleich wie Kopf 64 und Babyleaf 14. Sät Tim Spinat Schnitt ausnahmsweise in der Station, zählt die App ab dem Umsetztag (Bezug in `ersteErnteAb()`); die erste Ernte käme dann 9 Tage später.
- **Erntekalender:** Schnittlauch und Spinat Schnitt zeigen jetzt «Ernte ab» statt «Termine noch offen» (Schnittlauch Saat + 28 + 28 = 56 Tage, Spinat Schnitt Saat + 30 Tage bei Direktsaat).
- **Bestehende Werte:** Keine freigegebene Zeile vor Runde 14 ist geändert.

## Gesperrte Volltexte

| Quelle | Weg | Ergebnis |
|---|---|---|
| Lettuce Grow «Chives» (Produktseite, HTTP 429 beim Abruf) | Lesekopie 22.11.2026 im eingebauten Browser | Kandidaten (4 Wochen ab Lieferung des Setzlings) in der Methodenprüfung verworfen: die Seite nennt kein hydroponisches System |
| IOP Conf. Ser. 954 012035 (Beta vulgaris in vertikaler Hydroponik, «leaves are cut about 4–6 times») | Artikelseite im Browser: nur Abstract, Volltext nur als PDF (Download nicht freigegeben) | kein Kandidat: der Abstract nennt nur «Beta vulgaris subsp. vulgaris», Randen oder Mangold ist nicht bestimmbar (Konzept 9.3 Regel 4) |

## Verbleibende Lücken (Klasse D, keine Zeile)

| Art | Kulturform | ohne Wert |
|---|---|---|
| Tomate | dauerkultur_frucht | `schnitte_max` |
| Chili | dauerkultur_frucht | `schnitte_max`, `kulturdauer_max_d` |
| Basilikum | Art | `umsetzen_bis_d` (Regel D8) |
| Basilikum | dauerkultur_blatt, schnitt | `schnitte_max`, `kulturdauer_max_d` |
| Petersilie | dauerkultur_blatt | `schnitte_max`, `kulturdauer_max_d` |
| Schnittlauch | dauerkultur_blatt | `schnitte_max` |
| Schnittlauch | schnitt | `schnitte_max`, `kulturdauer_max_d` |
| Spinat | schnitt | `kulturdauer_max_d` |
| Spinat | kopf | `kulturdauer_max_d` |
| Randen | schnitt | `ernte_ab_d`, `ernteintervall_d`, `schnitte_max`, `kulturdauer_max_d` |
| Mangold | schnitt | `kulturdauer_max_d` |

Verworfen in Runde 14 (Methodenprüfung): Tomate und Chili aus Kurzzyklus-Versuchen (entspitzte Pflanzen, eine Ernteperiode; Versuchsplan, keine Anbauregel) und unbestimmte Lebensdauern (AeroGarden «average», Einleitung ohne System); Basilikum «Replace … after 3-4 months» ohne eindeutigen Zählbeginn; Schnittlauch und Petersilie «for a year provided …» als bedingte Lebensdauer; Spinat Cornell 12 bis 16 Tage (Babyleaf, nicht Schnitt); Spinat Kopf 7 Wochen (Summe zweier Grenzen durch den Rechercheur).
