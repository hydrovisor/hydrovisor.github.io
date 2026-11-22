# Fachkritik W0 Runde 14 (#266): Ernte ab, Intervall, Schnitte und Umsetzen bis

Stand 22.11.2026. Gegenstand: die 9 Zeilen mit `status = geprueft` und `abgerufen_am = 2026-11-22` in `data/wissensbasis/kandidaten/teile/{kraut_ausdauernd,fuchsschwanz}/art.csv` (Schnittlauch `ernte_ab_d` und `ernteintervall_d` für dauerkultur_blatt und schnitt; Spinat Schnitt `ernte_ab_d`; Randen `umsetzen_bis_d`; Mangold Schnitt `schnitte_max`). In `kraut_einjaehrig/art.csv` und `fruchtgemuese/art.csv` gibt es in dieser Runde keine geprüfte Zeile. Vergleich gegen `data/wissensbasis/freigegeben/art.csv` und die Phasendauern in `freigegeben/profilwert.csv`. Bezug nach `docs/spec/03_import_w0.md` 4.3.2 und 4.3.3 sowie Auftrag `teile/auftrag_runde-14.md`: `umsetzen_ab_d`, `umsetzen_bis_d` und `kulturdauer_max_d` Tage ab Saat, `ernte_ab_d` Tage ab Umsetzen (bei Direktsaat ab Saat). Bereiche sind nach der Bereichsregel des Auftrags als ein Kandidat erfasst (`wert` = untere Grenze bei `ernte_ab_d` und `ernteintervall_d`, obere Grenze bei `schnitte_max`; Bereich am Anfang von `fundstelle`). Wochenwerte sind roh und hier nur zum Prüfen nach D4 (7 · Wochen) und D7 (minus `art.umsetzen_ab_d`) umgerechnet; in den Dateien bleiben die Rohwerte. Die Quellenzeilen aller Kandidaten haben in `quelle.csv` den Status `geprueft` oder `freigegeben` (`crc-hydroponik-heimgaertner-2015`, `agrowtronics-schnittlauch-2021`, `smgardener-spinat-kratky-2022`, `actasci-randen-mudas-floating-2005` geprüft; `risegardens-library-mangold` freigegeben), alle Kandidaten sind also wählbar. `quelle.csv` führt keine Umgebung; sie stammt aus der `fundstelle`.

Bezugswerte der App (freigegeben, Keimung typ plus Anzucht typ = Tag, an dem die App das Umsetzen nach Phasen erwartet; in Klammern min-Summe bis max-Summe):

| Art | Keimung min/typ/max | Anzucht min/typ/max | Wachstum min/typ/max | Umsetzen nach Phasen | `art.umsetzen_ab_d` / `umsetzen_bis_d` freigegeben |
|---|---|---|---|---|---|
| allium_schoenoprasum | 7/10/14 | 18/21/34 | 32/40/50 | 31 (25 bis 48) | 28 / 42 |
| spinacia_oleracea | 5/7/10 | 7/10/14 | 21/24/28 | 17 (12 bis 24) | 9 / – |
| beta_vulgaris_conditiva | 2/3/4 | 8/10/13 | 14/17/21 | 13 (10 bis 17) | 9 / – |
| beta_vulgaris_cicla | 1/4/7 | 10/16/20 | 24/30/38 | 20 (11 bis 27) | 21 / 28 |

Freigegebene Kulturform-Werte, die hier berührt werden: Schnittlauch Dauerkultur `kulturdauer_max_d` 730, Ernteart beider Kulturformen `mehrfach`; Petersilie Dauerkultur `ernte_ab_d` 28, `ernteintervall_d` 7; Spinat Schnitt `ernteintervall_d` 7, `schnitte_max` 3 (beide cornell-cea-spinat-2005), Babyleaf `ernte_ab_d` 14 (Direktsaat), `kulturdauer_typisch_d` 16, `kulturdauer_max_d` 46, Kopf `ernte_ab_d` 64; Mangold Schnitt `ernte_ab_d` 28, `ernteintervall_d` 14 (beide horticulturae-mangold-meerwasser-2022), Ernteart `mehrfach`; Randen Schnitt Ernteart `mehrfach`.

## Geprüfte Kandidaten

| Art | Kulturform | Feld | `kandidat_id` | Rohwert (Bereich) | geprüft als | Quelle | Klasse | `konflikt_id` |
|---|---|---|---|---|---|---|---|---|
| allium_schoenoprasum | dauerkultur_blatt | ernte_ab_d | `ak.allium_schoenoprasum.dauerkultur_blatt.ernte_ab_d#3` | 75 (75 bis 85 Tage ab Saat) | 47 bis 57 d ab Umsetzen nach D7 | crc-hydroponik-heimgaertner-2015 | C | K-schnittlauch-08 |
| allium_schoenoprasum | dauerkultur_blatt | ernte_ab_d | `…#4` | 3 (3 bis 4 Wochen ab Umsetzen) | 21 bis 28 d ab Umsetzen | agrowtronics-schnittlauch-2021 | C | K-schnittlauch-08 |
| allium_schoenoprasum | schnitt | ernte_ab_d | `ak.allium_schoenoprasum.schnitt.ernte_ab_d#2` | 75 (75 bis 85 Tage ab Saat) | 47 bis 57 d ab Umsetzen nach D7 | crc-hydroponik-heimgaertner-2015 | C | K-schnittlauch-09 |
| allium_schoenoprasum | schnitt | ernte_ab_d | `…#3` | 3 (3 bis 4 Wochen ab Umsetzen) | 21 bis 28 d ab Umsetzen | agrowtronics-schnittlauch-2021 | C | K-schnittlauch-09 |
| allium_schoenoprasum | dauerkultur_blatt | ernteintervall_d | `ak.allium_schoenoprasum.dauerkultur_blatt.ernteintervall_d#1` | 2 (2 bis 3 Wochen) | 14 bis 21 d | agrowtronics-schnittlauch-2021 | C | – |
| allium_schoenoprasum | schnitt | ernteintervall_d | `ak.allium_schoenoprasum.schnitt.ernteintervall_d#1` | 2 (2 bis 3 Wochen) | 14 bis 21 d | agrowtronics-schnittlauch-2021 | C | – |
| spinacia_oleracea | schnitt | ernte_ab_d | `ak.spinacia_oleracea.schnitt.ernte_ab_d#4` | 30 (Tage ab Saat, Direktsaat) | 30 d ab Saat; nach D7 21 d ab Umsetzen | smgardener-spinat-kratky-2022 | C | – |
| beta_vulgaris_conditiva | – | umsetzen_bis_d | `art.beta_vulgaris_conditiva.umsetzen_bis_d#1` | 25 | 25 d ab Saat | actasci-randen-mudas-floating-2005 | A | – |
| beta_vulgaris_cicla | schnitt | schnitte_max | `ak.beta_vulgaris_cicla.schnitt.schnitte_max#2` | 10 (5 bis 10 Ernten, obere Grenze) | 10 | risegardens-library-mangold | B2 | – |

## Konfliktliste

Zwei Konflikte, beide ohne freigegebenen Wert. `konflikt_id` ist in `teile/kraut_ausdauernd/art.csv` gesetzt. Nummern fortlaufend nach den bestehenden (höchste bisher: K-schnittlauch-07 in `fachkritik_allium_schoenoprasum.md` und `teile/kraut_ausdauernd/saatempfehlung.csv`). Kein Konflikt entschieden. Beide Konflikte haben dieselben zwei Quellen; die Rohwerte stehen in verschiedenen Einheiten und mit verschiedenem Bezug, verschieden sind sie auch nach Umrechnung (P1 bis P3).

### K-schnittlauch-08: allium_schoenoprasum, dauerkultur_blatt, `ernte_ab_d`

| `kandidat_id` | Rohwert | Einheit | Basis (Bezug) | geprüft als | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `ak.allium_schoenoprasum.dauerkultur_blatt.ernte_ab_d#3` | 75 (Bereich 75 bis 85) | Tage | ab Saat bis zur ersten Ernte, Typ «Fine Leaf»; Direktsaat in die Turmtöpfe, kein Umsetzen (D7: minus `umsetzen_ab_d` 28) | 47 bis 57 d ab Umsetzen; erste Ernte 75 bis 85 d ab Saat | crc-hydroponik-heimgaertner-2015 | C (praxis) | Pflanztürme mit Perlit (quelle.csv: substrat_inert) | nicht genannt | 2015 |
| `ak.allium_schoenoprasum.dauerkultur_blatt.ernte_ab_d#4` | 3 (Bereich 3 bis 4) | Wochen | ab Umsetzen («at least another three or four weeks» nach rund vier Wochen Anzucht in Anzuchtsubstrat) | 21 bis 28 d ab Umsetzen; erste Ernte 49 bis 56 d ab Saat | agrowtronics-schnittlauch-2021 | C (praxis) | Ebbe-Flut, Tropf, NFT, Raft oder Turm (quelle.csv: nft) | nicht genannt | 2021 |

Nähe zur Anlage (Indoor mit LED, DWC und Kratky, Anzucht in Würfeln, danach Umsetzen): #4 beschreibt Anzucht mit anschliessendem Umsetzen nach etwa vier Wochen wie die Anlage (gleich dem freigegebenen `umsetzen_ab_d` 28, P8) und nennt Raft unter den Systemen; #3 sät direkt ins Endsystem (Perlit-Turm) und braucht die Umrechnung D7. Gleiche Klasse C, Umgebung bei beiden nicht genannt.

### K-schnittlauch-09: allium_schoenoprasum, schnitt, `ernte_ab_d`

| `kandidat_id` | Rohwert | Einheit | Basis (Bezug) | geprüft als | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `ak.allium_schoenoprasum.schnitt.ernte_ab_d#2` | 75 (Bereich 75 bis 85) | Tage | wie K-schnittlauch-08 #3 (gleiche Fundstelle) | 47 bis 57 d ab Umsetzen | crc-hydroponik-heimgaertner-2015 | C (praxis) | Pflanztürme mit Perlit (substrat_inert) | nicht genannt | 2015 |
| `ak.allium_schoenoprasum.schnitt.ernte_ab_d#3` | 3 (Bereich 3 bis 4) | Wochen | wie K-schnittlauch-08 #4 (gleiche Fundstelle) | 21 bis 28 d ab Umsetzen | agrowtronics-schnittlauch-2021 | C (praxis) | Ebbe-Flut, Tropf, NFT, Raft oder Turm (nft) | nicht genannt | 2021 |

Nähe zur Anlage wie bei K-schnittlauch-08. Beide Quellen unterscheiden die Kulturformen dauerkultur_blatt und schnitt nicht (P6); die beiden Konflikte sind inhaltlich derselbe Befund.

### Kein Konflikt

- `ak.allium_schoenoprasum.dauerkultur_blatt.ernteintervall_d` und `ak.allium_schoenoprasum.schnitt.ernteintervall_d`: je nur #1 (agrowtronics); nichts freigegeben.
- `ak.spinacia_oleracea.schnitt.ernte_ab_d`: nur #4 geprüft (#1, #2, #3, #5 verworfen); nichts freigegeben.
- `art.beta_vulgaris_conditiva.umsetzen_bis_d`: nur #1; nichts freigegeben.
- `ak.beta_vulgaris_cicla.schnitt.schnitte_max`: nur #2 geprüft (#1 verworfen); nichts freigegeben.

## Plausibilität

Validatorgrenzen für pH, EC, Wassertemperatur und Licht sowie die Gegenprobe des Düngeplans betreffen diese Felder nicht (nur `art.csv`). Geprüft wurden das Format nach 4.3.2/4.3.3 (ganze Tage, Ganzzahl), V11 (`ernteintervall_d` und `schnitte_max` nur bei `mehrfach`; erfüllt: Schnittlauch beide Kulturformen und Mangold Schnitt sind freigegeben `mehrfach`), die Ordnung `umsetzen_ab_d ≤ umsetzen_bis_d` (`02_datenmodell.sql`, Tabelle `art`), D7 und D8 (Konzept 9.3), der Wert gegen die Phasendauern der Art und gegen freigegebene Werte derselben Kulturform sowie der Vergleich in der Kulturgruppe.

| Nr. | `kandidat_id` | Regel | Wert | Befund |
|---|---|---|---|---|
| P1 | `ak.allium_schoenoprasum.dauerkultur_blatt.ernte_ab_d#3`, `ak.allium_schoenoprasum.schnitt.ernte_ab_d#2` | D7, Wachstum, Phasensumme | 75 bis 85 d ab Saat = 47 bis 57 d ab Umsetzen | Nach D7 (minus 28) liegt die untere Grenze 47 im Wachstum 32/40/50, die obere 57 sieben Tage über Wachstum max 50; ab Saat liegen 75 bis 85 nahe der Phasensumme 10 + 21 + 40 = 71 und im Bereich 57 bis 98. |
| P2 | `ak.allium_schoenoprasum.dauerkultur_blatt.ernte_ab_d#4`, `ak.allium_schoenoprasum.schnitt.ernte_ab_d#3` | Wachstum, Phasensumme | 3 bis 4 Wochen = 21 bis 28 d ab Umsetzen | Beide Grenzen liegen unter Wachstum min 32 (11 bzw. 4 Tage); mit `umsetzen_ab_d` 28 erste Ernte 49 bis 56 d ab Saat, unter der kleinsten Phasensumme 57; «at least» macht den Bereich zu einer Mindestangabe, was zur Bedeutung «Ernte ab» passt. |
| P3 | K-schnittlauch-08, K-schnittlauch-09 | Vergleich der Kandidaten (Frage des Koordinators) | 47 bis 57 gegen 21 bis 28 d ab Umsetzen | CRC nach D7 passt nicht zu agrowtronics: die Bereiche überlappen nicht, der Abstand beträgt 19 Tage (47 − 28) bis 36 Tage (57 − 21), ab Saat 75 bis 85 gegen 49 bis 56; Wachstum typ 40 liegt zwischen beiden Bereichen. |
| P4 | `…dauerkultur_blatt.ernte_ab_d#3`, `#4`; `…schnitt.ernte_ab_d#2`, `#3`; beide `ernteintervall_d#1` | Format 4.3.3, Bezug | 75, 3, 2 | Rohwerte sind Bereichsgrenzen, zwei davon in Wochen in einer Tagesspalte; ungerechnet lägen 3 bzw. 2 d weit unter jeder Phase; 75 darf nicht ohne D7 als Wert ab Umsetzen gelesen werden, sonst läge die erste Ernte bei 103 d ab Saat, über der Summe der Maxima 98. |
| P5 | `…dauerkultur_blatt.ernte_ab_d#3`, `…schnitt.ernte_ab_d#2` | Bezug, gleiche Art (Regel 4) | 75 bis 85 d | Die Quelle sät direkt ins Endsystem (D7, zweiter Fall: Kennzeichnung «Umsetztag nicht genannt» trifft zu); das Zitat gilt dem Typ «Fine Leaf» eines Absatzes über «two types of chives», der zweite Typ ist nicht Gegenstand des Kandidaten. |
| P6 | K-schnittlauch-08 und K-schnittlauch-09; beide `ernteintervall_d#1` | Kulturform | gleiche Werte für dauerkultur_blatt und schnitt | Beide Quellen unterscheiden die Kulturformen nicht; die Erntebeschreibung von agrowtronics («Cut most of the chive leaves, but leave an inch or two») entspricht dem Schnitt der ganzen Pflanze, für die Teilernte der Dauerkultur liegt kein eigener Wert vor. |
| P7 | `ak.allium_schoenoprasum.dauerkultur_blatt.ernteintervall_d#1`, `ak.allium_schoenoprasum.schnitt.ernteintervall_d#1` | V11, Kulturgruppe | 2 bis 3 Wochen = 14 bis 21 d | V11 erfüllt; doppelt bis dreifach so lang wie das freigegebene Petersilie-Intervall 7 derselben Kulturgruppe, stimmig mit der freigegebenen Ernteart-Fundstelle «regeneration time is several weeks» (Schnitt ganzer Horste); `schnitte_max` fehlt, bei `kulturdauer_max_d` 730 ist die Zahl der Schnitte daher nicht begrenzt. |
| P8 | `…dauerkultur_blatt.ernte_ab_d#4`, `…schnitt.ernte_ab_d#3` | Quellinterne Stimmigkeit | rund 4 Wochen bis zum Umsetzen | Dieselbe Fundstelle nennt «about four weeks before you can transplant», gleich dem freigegebenen `umsetzen_ab_d` 28 (andere Quelle); der Wert ab Umsetzen braucht damit keine Umrechnung D7. |
| P9 | `ak.spinacia_oleracea.schnitt.ernte_ab_d#4` | D7, Kennzeichnung | 30 d ab Saat | Direktsaat im Kratky-Gefäss; `fundstelle` beginnt nicht mit «ab Saat, Umsetztag nicht genannt», sondern nennt «daher Tage ab Saat»: setzt die Anlage Spinat Schnitt um, gilt nach D7 30 − 9 = 21 d ab Umsetzen (erste Ernte weiterhin 30 d ab Saat), sät sie direkt (wie Babyleaf in 3.2), gilt 30 ab Saat; ohne Umrechnung als Wert ab Umsetzen gelesen läge die erste Ernte bei 39 d ab Saat. |
| P10 | `ak.spinacia_oleracea.schnitt.ernte_ab_d#4` | Wachstum, Kulturform | 30 d ab Saat (21 d ab Umsetzen) | Nach D7 gleich Wachstum min 21; ab Saat drei Tage unter der kleinsten Phasensumme 5 + 7 + 21 = 33 und unter der typischen 41; die Reihenfolge Babyleaf (14 bis 16 d, max 46) vor Schnitt (30 d) vor Kopf (64 d) ist stimmig; Kratky entspricht dem System von 3.2, Wassertemperatur und Licht nennt die Fundstelle nicht (Herbst 2021, eigener Anbauversuch). |
| P11 | `ak.spinacia_oleracea.schnitt.ernte_ab_d#4` | Quellinterne Stimmigkeit mit freigegebenem Intervall 7 und `schnitte_max` 3 | 30 d ab Saat | Derselbe Absatz nennt «two more harvests each at 7-10 day interval», also drei Ernten im Abstand 7 bis 10 Tage, stimmig mit den freigegebenen Cornell-Werten `schnitte_max` 3 und `ernteintervall_d` 7; letzte Ernte damit 44 bis 50 d ab Saat (30 + 2 · 7 bzw. 30 + 2 · 10); `schnitt.kulturdauer_max_d` fehlt. |
| P12 | `art.beta_vulgaris_conditiva.umsetzen_bis_d#1` | D8, Ordnung ab ≤ bis | 25 d ab Saat | D8 erfüllt: Klasse A und mindestens Keimung typ plus Anzucht typ (3 + 10 = 13); Ordnung 9 ≤ 25 erfüllt; die App zeigt «In der Station lassen bis» Saat plus 25 und mahnt «Umsetzen überfällig» ab Tag 32. |
| P13 | `art.beta_vulgaris_conditiva.umsetzen_bis_d#1` | Umsetzen gegen Phasen, Bedeutung «spätester Tag» | 25 d ab Saat | Acht Tage über der Summe der Maxima (4 + 13 = 17); die Quelle nennt einen einzelnen Versuchstag («realizado aos 25 DAS») für Setzlinge, die danach ins Feld (Knollenanbau) kamen, nur die Anzucht in Styroporplatten mit Plantmax-HT bzw. Bagasse im Floating ist hydroponisch; das Fenster 9 bis 25 (16 Tage) stammt aus zwei Quellen mit verschiedenem Zweck (Babyleaf in NFT, Feldsetzlinge). |
| P14 | `art.beta_vulgaris_conditiva.umsetzen_bis_d#1` | Kulturgruppe | 25 d ab Saat | Nahe dem freigegebenen Mangold-`umsetzen_bis_d` 28 (gleiche Kulturgruppe; Mangold und Randen belegen einander nicht, Regel 4); das Mangold-Fenster ist 21 bis 28 (7 Tage), das Randen-Fenster wäre mehr als doppelt so breit. |
| P15 | `ak.beta_vulgaris_cicla.schnitt.schnitte_max#2` | V11, freigegebenes Intervall, Kulturdauer | 10 (Bereich 5 bis 10) | V11 erfüllt; mit den freigegebenen Werten `umsetzen_ab_d` 21, `ernte_ab_d` 28 und `ernteintervall_d` 14 fiele der 10. Schnitt auf 21 + 28 + 9 · 14 = 175 d ab Saat, die untere Grenze 5 auf 105 d; `schnitt.kulturdauer_max_d` fehlt, eine Obergrenze ist nicht prüfbar. |
| P16 | `ak.beta_vulgaris_cicla.schnitt.schnitte_max#2` | Quellenmischung, Bedeutung | 10 | Die Zahl stammt von Rise Gardens (Indoor mit LED, erste Ernte dort Day 39 ab Saat, eigenes Intervall nicht erfasst), das Intervall 14 aus dem Floating-Versuch mit drei Schnitten bis 56 DAT; die Kulturdauer 175 d ist eine Kombination zweier Quellen; das Endkriterium der Quelle verbindet die Zahl der Ernten mit «its stalk is 4-5 inches long». |
| P17 | `ak.beta_vulgaris_cicla.schnitt.schnitte_max#2` | Kulturgruppe | 10 | Mehr als das Dreifache des freigegebenen Spinat-Schnitt-Werts 3 derselben Kulturgruppe; die Quelle ist eine ausdrückliche Ersatzregel («ready to remove when you have gotten 5-10 harvests»), kein Versuchsplan wie die verworfenen #1 (Mangold) und Spinat #4. |

## Lückenliste (Klasse D, Prüfauftrag)

Felder aus der Tabelle «Lücken je Kulturgruppe» in `teile/auftrag_runde-14.md` ohne geprüften Kandidaten und ohne freigegebenen Wert. Fett: Vorrang laut Auftrag (alle drei fetten Felder sind gedeckt).

| Art | Kulturform | Feld |
|---|---|---|
| allium_schoenoprasum | dauerkultur_blatt | schnitte_max |
| allium_schoenoprasum | schnitt | schnitte_max |
| allium_schoenoprasum | schnitt | kulturdauer_max_d |
| petroselinum_crispum | dauerkultur_blatt | schnitte_max |
| petroselinum_crispum | dauerkultur_blatt | kulturdauer_max_d |
| ocimum_basilicum | – | umsetzen_bis_d |
| ocimum_basilicum | dauerkultur_blatt | schnitte_max |
| ocimum_basilicum | dauerkultur_blatt | kulturdauer_max_d |
| ocimum_basilicum | schnitt | schnitte_max |
| ocimum_basilicum | schnitt | kulturdauer_max_d |
| spinacia_oleracea | schnitt | kulturdauer_max_d |
| spinacia_oleracea | kopf | kulturdauer_max_d |
| beta_vulgaris_conditiva | schnitt | ernte_ab_d |
| beta_vulgaris_conditiva | schnitt | ernteintervall_d |
| beta_vulgaris_conditiva | schnitt | schnitte_max |
| beta_vulgaris_conditiva | schnitt | kulturdauer_max_d |
| beta_vulgaris_cicla | schnitt | kulturdauer_max_d |
| solanum_lycopersicum | dauerkultur_frucht | schnitte_max |
| capsicum_annuum | dauerkultur_frucht | schnitte_max |
| capsicum_annuum | dauerkultur_frucht | kulturdauer_max_d |

20 Lücken. Gedeckt mit mindestens einem geprüften Kandidaten: Schnittlauch **ernte_ab_d** beider Kulturformen (je als Konflikt), Schnittlauch `ernteintervall_d` beider Kulturformen, Spinat Schnitt **ernte_ab_d**, Randen `umsetzen_bis_d`, Mangold Schnitt `schnitte_max`. Ohne geprüfte Zeile in dieser Runde blieben die Gruppen kraut_einjaehrig (Basilikum) und fruchtgemuese (Tomate, Chili).

## Bestätigungen

Keine. Kein Feld hat zwei geprüfte Kandidaten mit gleichem Wert aus verschiedenen Quellen; die Schnittlauch-Kandidaten je Kulturform stammen aus denselben zwei Quellen und weichen voneinander ab.

Hinweise ohne eigene Kandidatenzeile (keine Bestätigung im Sinne der Rolle): smgardener-spinat-kratky-2022 nennt im Zitat-Absatz drei Ernten im Abstand 7 bis 10 Tage, passend zu den freigegebenen Spinat-Schnitt-Werten `schnitte_max` 3 und `ernteintervall_d` 7 (P11); agrowtronics-schnittlauch-2021 nennt «about four weeks» bis zum Umsetzen, passend zum freigegebenen Schnittlauch-`umsetzen_ab_d` 28 (P8).
