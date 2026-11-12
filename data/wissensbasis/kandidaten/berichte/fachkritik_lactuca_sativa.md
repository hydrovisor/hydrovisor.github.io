# Fachkritik Salat (`lactuca_sativa`) und Standardprofil

Stand 12.11.2026 · W0-Probelauf, Issue #184 · Rolle Fachkritiker · Kulturgruppe `blattsalat` (Leitkultur) · Kulturform im Auftrag `schnitt` (Lollo Rossa Loka, Eichblatt Lattughino Verde, Eissalat Roxette als Schnittsalat; DWC) · dazu Ebene `standard` (Abschnitt 6)

Grundlage: nur Zeilen mit `status = geprueft` in `teile/blattsalat/` (`art.csv`, `profilwert.csv`, `profilwert_offen.csv`, `saatempfehlung.csv`, `quelle.csv`); `saatempfehlung_offen.csv` gibt es in dieser Gruppe nicht. Geprüfte Zeilen der Art: 10 in `art.csv`, 16 in `profilwert.csv`, 13 in `profilwert_offen.csv`, 0 in `saatempfehlung.csv`. Standardprofil: 4 in `profilwert.csv`, 1 in `profilwert_offen.csv`. Geschrieben wurde nur die Spalte `konflikt_id` (25 Zeilen: 24 Salat, 1 Standard). Umrechnungen in diesem Bericht dienen nur der Prüfung; in den Dateien bleibt der Rohwert.

## 1 Konfliktliste Salat

Zwölf Konflikte, davon fünf «nur offener Wert» (kein ladbarer Kandidat, nur Zeilen aus `profilwert_offen.csv`). Kein Kandidat ist bevorzugt; die Reihenfolge folgt Phase und `kandidat_id`. Quelle `cornell-cea-lettuce-handbook` hat in `quelle.csv` kein Jahr.

### K-salat-01 · Keimung · `keimtemp`

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.lactuca_sativa.keimung.keimtemp#1` | 5 / 20 / 33 | °C | – | `sci-agric-lettuce-thermoinhibition-2003` (peer_review) | B1 | `keine` | `andere` | 2003 | ladbar |
| `pw.lactuca_sativa.keimung.keimtemp#2` | – / 20 / – | °C | – | `cornell-cea-lettuce-handbook` | B1 | `substrat_inert` | `gewaechshaus` | – | offen, «Einzelwert» |
| `pw.lactuca_sativa.keimung.keimtemp#3` | Text «64-68 °F» | °F | – | `uky-ccd-hydroponic-lettuce-2016` | B1 | `substrat_inert` | `gewaechshaus` | 2016 | offen, «Angabe in °F, nicht umgerechnet; Bereich ohne typ» |
| `pw.lactuca_sativa.keimung.keimtemp#4` | Text «70-75 °F» | °F | – | `utk-ufl-w844b-2019` | B1 | `substrat_inert` | `andere` | 2019 | offen, «Angabe in °F, nicht umgerechnet; Bereich ohne typ» |

### K-salat-02 · Anzucht · `wechselmerkmal`

| `kandidat_id` | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| `pw.lactuca_sativa.anzucht.wechselmerkmal#1` | «Hat der Sämling drei bis vier echte Blätter?» | – | – | `cornell-gpn-leafy-greens-2016` | B1 | `dwc` | `gewaechshaus` | 2016 |
| `pw.lactuca_sativa.anzucht.wechselmerkmal#2` | «Hat der Sämling drei bis fünf echte Blätter und sind Wurzeln unten am Würfel sichtbar?» | – | – | `utk-ufl-w844b-2019` | B1 | `dwc` | `andere` | 2019 |

### K-salat-03 · Anzucht · `dauer` · nur offener Wert

| `kandidat_id` | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.lactuca_sativa.anzucht.dauer#4` | Text «11 Tage ab Saat inkl. Keimung» | Tage ab Saat | – | `cornell-cea-lettuce-handbook` | B1 | `substrat_inert` | `gewaechshaus` | – | offen, «Einzelwert ab Saat inkl. Keimung» |

### K-salat-04 · Anzucht · `ph` · nur offener Wert

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.lactuca_sativa.anzucht.ph#2` | – / 5.8 / – | pH | – | `cornell-cea-lettuce-handbook` | B1 | `substrat_inert` | `gewaechshaus` | – | offen, «Einzelwert» |

### K-salat-05 · Anzucht · `ec`

| `kandidat_id` | Rohwert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.lactuca_sativa.anzucht.ec#1` | 0.5 / – / 1.0 | mS/cm | `unbekannt` | `utk-ufl-w844b-2019` | B1 | `substrat_inert` | `andere` | 2019 | ladbar |
| `pw.lactuca_sativa.anzucht.ec#2` | – / 1200 / – | µS/cm | `zuwachs` | `cornell-cea-lettuce-handbook` | B1 | `substrat_inert` | `gewaechshaus` | – | offen, «Einzelwert» |

### K-salat-06 · Anzucht · `licht_h` · nur offener Wert

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.lactuca_sativa.anzucht.licht_h#2` | – / 24 / – | h | – | `cornell-cea-lettuce-handbook` | B1 | `substrat_inert` | `gewaechshaus` | – | offen, «Einzelwert» |

### K-salat-07 · Wachstum · `dauer` · nur offener Wert, verschiedene Werte

| `kandidat_id` | Wert (min / typ / max) | Einheit | Bezugs-DLI | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.lactuca_sativa.wachstum.dauer#1` | – / 24 / – | Tage ab Umsetzen | 17 | `cornell-gpn-leafy-greens-2016` | B1 | `dwc` | `gewaechshaus` | 2016 | offen, «Einzelwert» |
| `pw.lactuca_sativa.wachstum.dauer#2` | – / 48 / – | Tage ab Umsetzen | 8.5 | `cornell-gpn-leafy-greens-2016` | B1 | `dwc` | `gewaechshaus` | 2016 | offen, «Einzelwert bei halbem DLI» |
| `pw.lactuca_sativa.wachstum.dauer#3` | – / 24 / – | Tage ab Umsetzen (Tag 35 minus Tag 11) | 17 | `cornell-cea-lettuce-handbook` | B1 | `dwc` | `gewaechshaus` | – | offen, «Einzelwert» |

### K-salat-08 · Wachstum · `ph`

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| `pw.lactuca_sativa.wachstum.ph#1` | 5.6 / 5.8 / 6.0 | pH | – | `cornell-cea-lettuce-handbook` | B1 | `dwc` | `gewaechshaus` | – |
| `pw.lactuca_sativa.wachstum.ph#2` | 5.5 / – / 6.0 | pH | – | `cornell-gpn-leafy-greens-2016` | B1 | `dwc` | `gewaechshaus` | 2016 |

### K-salat-09 · Wachstum · `ec`

| `kandidat_id` | Rohwert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.lactuca_sativa.wachstum.ec#2` | 1.5 / – / 2.0 | mS/cm | `unbekannt` | `utk-ufl-w844b-2019` | B1 | `dwc` | `andere` | 2019 | ladbar |
| `pw.lactuca_sativa.wachstum.ec#3` | 1150 / – / 1250 | µS/cm | `zuwachs` | `cornell-cea-lettuce-handbook` | B1 | `dwc` | `gewaechshaus` | – | offen, «EC-Band 0.1 breit (unter 0.2)» |
| `pw.lactuca_sativa.wachstum.ec#4` | – / 1.3 / – | mS/cm (Quelle dS/m) | `unbekannt` | `purdue-ho-309-2020` | B1 | `nft` | `andere` | 2020 | offen, «Einzelwert» |

### K-salat-10 · Wachstum · `wassertemp` · nur offener Wert

| `kandidat_id` | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.lactuca_sativa.wachstum.wassertemp#1` | Text «nicht über 25 °C, kühlen bei 26 °C, heizen bei 24 °C» | °C | – | `cornell-cea-lettuce-handbook` | B1 | `dwc` | `gewaechshaus` | – | offen, «Stellwerte, kein wörtlicher Bereich min bis max» |

### K-salat-11 · Artmerkmal · `umsetzen_ab_d`

| `kandidat_id` | Wert | Einheit | Basis | Quelle | Klasse | System (Anbaumethode der Quelle) | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| `art.lactuca_sativa.umsetzen_ab_d#1` | 12 | Tage ab Saat | – | `utk-ufl-w844b-2019` | B1 | `dwc` | – | 2019 |
| `art.lactuca_sativa.umsetzen_ab_d#2` | 11 | Tage ab Saat | – | `cornell-cea-lettuce-handbook` | B1 | `dwc` | – | – |

### K-salat-12 · Artmerkmal · `umsetzen_bis_d`

| `kandidat_id` | Wert | Einheit | Basis | Quelle | Klasse | System (Anbaumethode der Quelle) | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| `art.lactuca_sativa.umsetzen_bis_d#1` | 18 | Tage ab Saat | – | `utk-ufl-w844b-2019` | B1 | `dwc` | – | 2019 |
| `art.lactuca_sativa.umsetzen_bis_d#2` | 22 | Tage ab Saat (bei halbem DLI) | – | `cornell-gpn-leafy-greens-2016` | B1 | `dwc` | – | 2016 |

`art.csv` hat keine Spalten für System und Umgebung; angegeben ist die `anbaumethode` der Quelle aus `quelle.csv`.

## 2 Plausibilität Salat

Geprüft gegen V3 bis V13 (03_import_w0.md 7), die Gegenprobe-Tabelle (Salat (Schnitt): Anzucht 1.0, Wachstum 1.2 mS/cm; Gesamt-EC mit ECWasser 0.5, Basis `unbekannt` als gesamt), R1.1, die Pflichtgrössen (Abschnitt 9) und die übrigen Arten der Kulturgruppe (Nüsslisalat, nur geprüfte Zeilen).

| Nr. | `kandidat_id` | Regel | Wert | Befund |
|---|---|---|---|---|
| P1 | `pw.lactuca_sativa.wachstum.ec#2` | Gegenprobe (9.4), V4, V5 | 1.5 – 2.0 mS/cm, `unbekannt` | V4 knapp eingehalten (Obergrenze gleich `ec_obergrenze_validator` 2.0) und Bandbreite 0.5 zulässig, aber die Bandmitte 1.75 weicht 0.55 von 1.2 ab, bei Freigabe also ein Gegenprobe-Konflikt für Tim. |
| P2 | `pw.lactuca_sativa.wachstum.ec#3` | V5, Gegenprobe | 1150 – 1250 µS/cm, `zuwachs` | Umgerechnet 1.15 – 1.25 mS/cm, Bandbreite 0.1 unter 0.2 (deshalb offen); als Gesamt-EC 1.65 – 1.75, Mitte 1.70, Abweichung 0.50 über 0.4, obwohl der Zuwachs allein der Vergleichs-EC 1.2 entspricht. |
| P3 | `pw.lactuca_sativa.wachstum.ec#4` | Gegenprobe, Einheit | typ 1.3 mS/cm (Quelle dS/m) | dS/m ist zahlengleich mit mS/cm; Abweichung von 1.2 nur 0.1, aber ohne Band nicht ladbar (NFT-Versuch). |
| P4 | `pw.lactuca_sativa.anzucht.ec#1` | Gegenprobe, V4, V5 | 0.5 – 1.0 mS/cm, `unbekannt` | Innerhalb 0.4 bis 2.0, Bandbreite 0.5, Mitte 0.75 weicht 0.25 von 1.0 ab, kein Gegenprobe-Konflikt; laut Kurzzitat gilt das Band nur «for the first few days» und danach steigt die Lösung auf die des Hauptsystems. |
| P5 | `pw.lactuca_sativa.anzucht.ec#2` | Gegenprobe | typ 1200 µS/cm, `zuwachs` | Umgerechnet 1.2 mS/cm Zuwachs, als Gesamt-EC 1.7 und damit 0.7 über der Vergleichs-EC 1.0; ein «eigener Wert» auf dieser Grundlage erzeugt einen Gegenprobe-Konflikt. |
| P6 | `pw.lactuca_sativa.anzucht.ec#1`, `wachstum.ec#2` | 03_import_w0.md 6 | Basis `unbekannt` | Beide ladbaren EC-Kandidaten haben Basis `unbekannt` (App zeigt dann «EC-Basis unklar»), die Cornell-Kandidaten mit Basis `zuwachs` sind nur offen; beide UTK-Werte gelten laut Kurzzitat allgemein für Sämlinge bzw. «most leafy crops», nicht eigens für Salat. |
| P7 | `pw.lactuca_sativa.wachstum.ph#1`, `#2` | V3, V5 | 5.6 / 5.8 / 6.0; 5.5 – 6.0 | Beide in 5.2 bis 7.0, Bandbreiten 0.4 und 0.5, typ 5.8 im Band; die Bänder überlappen auf 5.6 – 6.0; Nüsslisalat Wachstum (offen, typ 5.6) liegt in beiden. |
| P8 | `pw.lactuca_sativa.anzucht.ph#2` | V3, V5, 4.4.1 | typ 5.8 | Liegt in 5.2 bis 7.0 und in beiden Wachstumsbändern, ist als Einzelwert ohne min und max aber nicht ladbar; `anzucht.ph` ist Pflichtgrösse auf Ebene Art. |
| P9 | `pw.lactuca_sativa.keimung.ph#1` | V3, V5, V13, Abschnitt 9 | 5.5 – 5.8 | Form zulässig (Bandbreite 0.3), aber in Keimung keine pH-Pflicht (Würfel nur angefeuchtet, R4.3); beim Kopieren der Leitkultur-Zeilen auf Ebene `kulturgruppe` darf diese Zeile nicht mit, sonst bricht V13 ab. |
| P10 | `pw.lactuca_sativa.wachstum.dauer#1`, `#2`, `#3` | V6, Kulturform | typ 24, 48, 24 Tage | V6 nicht prüfbar (nur typ); alle drei beschreiben die Ernte ganzer Köpfe («5- to 6-ounce heads», Ernte Tag 35), also Kulturform `kopf` und nicht `schnitt` im Auftrag; `#2` gilt nur bei halbem DLI 8.5. |
| P11 | `pw.lactuca_sativa.wachstum.dauer#3` | 9.2 (Bezugspunkt) | 35 − 11 = 24 | Die Dauer ist aus zwei Tagesangaben des Kurzzitats abgeleitet (zulässige Umrechnung auf den Phasenbeginn); das Bezugs-DLI 17 stammt laut Fundstelle aus einem anderen Abschnitt (Set-points 3.3). |
| P12 | `pw.lactuca_sativa.anzucht.dauer#4` | 9.2 (Bezugspunkt), V6 | 11 Tage ab Saat inkl. Keimung | Bezugspunkt ist die Saat, nicht der Phasenbeginn; die Umrechnung braucht `keimung.dauer`, die keinen geprüften Kandidaten hat; der Wert deckt sich mit `umsetzen_ab_d#2` (11, gleiche Quelle). |
| P13 | `pw.lactuca_sativa.anzucht.licht_h#2` | V7, 4.4.1 | typ 24 h | 24 h liegt in 0 bis 24 (Dauerlicht), ist ohne min und max aber nicht ladbar; das Standardprofil hat keinen geprüften `licht_h`-Wert als Rückfall (Abschnitt 6). |
| P14 | `pw.lactuca_sativa.wachstum.wassertemp#1` | V7, 4.4.1 | Stellwerte 24, 25, 26 °C | Alle Zahlen in 10 bis 28, aber ein Band min bis max wäre Deutung der Stellwerte; sie liegen über dem offenen Standardwert 72 – 75 °F (22.2 – 23.9 °C, K-standard-01). |
| P15 | `pw.lactuca_sativa.keimung.keimtemp#1` bis `#4` | 4.4.1 (`keimtemp`) | 5 / 20 / 33 °C; typ 20; 64 – 68 °F; 70 – 75 °F | Kein Validator-Grenzwert für `keimtemp`; `#1` ist formal ladbar (5 ≤ 20 ≤ 33), doch min und max sind laut Kurzzitat Grenzen, bei denen «some» Genotypen keimen, kein Zielband; umgerechnet 17.8 – 20.0 °C (`#3`) und 21.1 – 23.9 °C (`#4`) überschneiden sich nicht. |
| P16 | `pw.lactuca_sativa.keimung.keimtemp#1` | 9.1 | System `keine` | Für `keimtemp` ist eine nicht hydroponische Quelle zulässig (9.1 schliesst nur pH, EC, Phasendauer, Licht, Wassertemperatur aus); Quervergleich Nüsslisalat (offen 5 – 20 °C) plausibel kühler. |
| P17 | `pw.lactuca_sativa.*.bbch#1` (3 Zeilen) und K-salat-02 | 4.4.1, Abgleich Wechselmerkmal | 0 – 9, 10 – 13, 14 – 49 | Lückenlos und ohne Überschneidung, Ende 49 vor Schossen; das Anzucht-Ende 13 ist laut Fundstelle nach `wechselmerkmal#1` (3 bis 4 Blätter) gewählt, bei Entscheid für `#2` (3 bis 5 Blätter und Wurzeln) ist das BBCH-Ende neu abzustimmen. |
| P18 | `pw.lactuca_sativa.*.bbch#1`, `wuchsform#1` | Artbezug | Skala «Leaf vegetables (not forming heads)» | Die Skala gilt für nicht kopfbildenden Salat (var. crispa); Eissalat Roxette ist eine Kopfsalat-Sorte, die als Schnittsalat geführt wird, die Skala passt damit zur Kulturform, nicht zur Sorte. |
| P19 | `pw.lactuca_sativa.bluete.anwendbar#1`, `fruchtbildung_reife.anwendbar#1` (verworfen) | R1.1, 4.4.1, Annahme 2 in `docs/w0/ablauf.md` | `entfaellt` | Beide sind verworfen, weil «entfaellt» nicht in der Quelle steht; Annahme 2 sieht für diesen Fall die Monografie als Quelle mit Wert aus R1.1 vor; ohne die zwei Zeilen lädt der Seed keine Kulturform-Felder, Saatempfehlung und `profilwert` der Art (03_import_w0.md 8 Punkt 4) und V13 fehlt die Kulturgruppe (Hinweis an den Koordinator, Widerspruch der Prüfregeln). |
| P20 | `art.lactuca_sativa.umsetzen_ab_d#1`, `#2`, `umsetzen_bis_d#1`, `#2` | Konsistenz | 12, 11; 18, 22 | In jeder Kombination gilt ab ≤ bis; `umsetzen_ab_d#1` und `umsetzen_bis_d#1` stammen aus demselben Satz, `umsetzen_bis_d#2` gilt laut Kurzzitat nur bei halbem DLI, die Bedingung steht nicht in der Zeile. |
| P21 | `art.lactuca_sativa.wuchsform#1` | Kurzzitat | `rosette` | Das Kurzzitat nennt «letucce varieties without head» getrennt von «species with rosette-type growth»; `rosette` für Salat steht damit nicht wörtlich, sondern ist abgeleitet. |
| P22 | `art.lactuca_sativa.pflanzen_je_m2#1` | Kulturform | 38 | Endabstand für Kopfsalat nach dem Umstellen (vorher 97 je m²), nicht für Schnitt; Nüsslisalat 53 je m². |
| P23 | `art.lactuca_sativa.liter_je_pflanze#1` | Kurzzitat | 1 | Die Quelle nennt «at least 1 L» je Pflanze, also eine Untergrenze; der Seed setzt `liter_status = testbetrieb_offen` (4.3.2). |
| P24 | `ak.lactuca_sativa.schnitt.ernteart#1` | V11 | `mehrfach` | Zulässig; bei `mehrfach` sind `ernteintervall_d` und `schnitte_max` vorgesehen, beide fehlen (Lückenliste); das Kurzzitat ist nur der Titel der Studie. |
| P25 | Quervergleich Kulturgruppe | Nüsslisalat | EC, Dauer | Nüsslisalat Wachstum EC 2.47 dS/m gesamt (offen) liegt über allen Salat-Kandidaten und über 2.0; Anzucht 22 Tage ab Saat (Salat 11), Wachstum typ 29 Tage (Salat 24); keine Salat-Zahl widerspricht der Gruppe. |
| P26 | `q.cornell-cea-lettuce-handbook` | 9.3 Regel (2) | `jahr` leer | Ohne Jahr ist «jüngere vor älterer Quelle» in K-salat-05, -08, -09 und -11 nicht anwendbar. |
| P27 | `q.ufl-hs1258-2015` | Statusfolge (`docs/w0/ablauf.md` 3) | `methodenpruefung` leer, `status = geprueft` | Die Quelle ist geprüft ohne Methodenprüfung; die einzige Datenzeile mit dieser Quelle (`kulturformen_erlaubt`) steht noch auf `entwurf` (Hinweis an den Koordinator). |

Ohne Befund: V8 (`einheit_quelle` und `ec_basis` genau bei `ec`; `keimart` und `keimtemp` nur in Keimung), V9 (alle geprüften Zeilen mit Quelle, Fundstelle, Kurzzitat, Klasse; keine Klasse D), V10 (Wechselmerkmale höchstens 86 Zeichen), V12 (Aufzählungswerte gültig), `keimung.keimart#1` (`licht`, Kurzzitat «Most lettuce requires light»). Keine ladbare Dauer, V6 entfällt deshalb.

## 3 Lückenliste Salat

### 3.1 Pflichtgrössen ohne geprüften Kandidaten (Klasse D, Prüfauftrag)

| Art | Phase | Grösse |
|---|---|---|
| `lactuca_sativa` | `keimung` | `dauer` (mindestens Ebene Art) |
| `lactuca_sativa` | `bluete` | `anwendbar` (nach R1.1 `entfaellt`, Kandidat verworfen, P19) |
| `lactuca_sativa` | `fruchtbildung_reife` | `anwendbar` (nach R1.1 `entfaellt`, Kandidat verworfen, P19) |

Pflichtgrössen nur mit offenen Kandidaten: `anzucht.dauer` (K-salat-03), `anzucht.ph` (K-salat-04), `wachstum.dauer` (K-salat-07). `wachstum.wechselmerkmal` entfällt als letzte anwendbare Phase (Abschnitt 9). Folge: Ohne diese Werte lädt der Seed Kulturform-Felder, Saatempfehlung und `profilwert` der Art nicht (03_import_w0.md 8 Punkt 4); die Keimungszeilen für den Vorab-Lauf bis 15.12. haben keine `dauer`. Weil Salat Leitkultur ist, fehlen der Kulturgruppe `blattsalat` die Mindestzeilen `anwendbar` (Blüte, Fruchtbildung), `dauer` (Keimung, Anzucht, Wachstum) und `ph` der Anzucht (4.4.2, V13).

### 3.2 Keine Pflichtgrössen, Prüfauftrag nach R1.4

| Art | Phase | Grösse |
|---|---|---|
| `lactuca_sativa` | `keimung` | `licht_h`, `wassertemp` |
| `lactuca_sativa` | `anzucht` | `wassertemp`; `licht_h` nur offen (K-salat-06) |
| `lactuca_sativa` | `wachstum` | `licht_h`; `wassertemp` nur offen (K-salat-10) |

### 3.3 Stammfelder und Artmerkmale (4.3.2)

Vorhanden: `name_wiss`, `gbif_key`, `wuchsform`, `pflanzen_je_m2`, `liter_je_pflanze`, `umsetzen_ab_d`, `umsetzen_bis_d`. Es fehlen:

| Art | Feld | Hinweis |
|---|---|---|
| `lactuca_sativa` | `name_de` | Stammfeld, Kandidat verworfen |
| `lactuca_sativa` | `kulturgruppe_id` | Stammfeld, Kandidat verworfen |
| `lactuca_sativa` | `kulturformen_erlaubt` | kein geprüfter Kandidat (eine Zeile steht auf `entwurf`, P27); soll laut Auftrag vollständig sein, mindestens `schnitt` (Probelauf) und `babyleaf` (Hauptlauf, Konzept 9.5) |
| `lactuca_sativa` | `kulturform_vorgabe` | muss in `kulturformen_erlaubt` liegen (V11) |
| `lactuca_sativa` | `samentyp` | |
| `lactuca_sativa` | `standard_keimfaehigkeit` | übernimmt eine neue Art der Gruppe von der Leitkultur (4.4.2) |
| `lactuca_sativa` | `systemeignung` | übernimmt eine neue Art der Gruppe von der Leitkultur |
| `lactuca_sativa` | `wasserbedarf_je_pflanze_l` | |
| `lactuca_sativa` | `wuchshoehe_max_mm` | |
| `lactuca_sativa` | `photoperiode` | |
| `lactuca_sativa` | `bestaeubung_noetig` | |
| `lactuca_sativa` | `pythium` | |
| `lactuca_sativa` | `schossen_handlung` | |
| `lactuca_sativa` | `kritische_tageslaenge_h` | bedingt, nur bei `langtag` oder `kurztag` |
| `lactuca_sativa` | `aussaatfenster_outdoor` | optional |

`keimlinge_je_knaeuel` entfällt (keine Knäuelsaat).

### 3.4 Kulturform-Felder `schnitt` (4.3.3)

Vorhanden: `ernteart` (`mehrfach`). Es fehlen:

| Art | Kulturform | Feld |
|---|---|---|
| `lactuca_sativa` | `schnitt` | `ernte_ab_d` |
| `lactuca_sativa` | `schnitt` | `ernteintervall_d` |
| `lactuca_sativa` | `schnitt` | `schnitte_max` |
| `lactuca_sativa` | `schnitt` | `kulturdauer_max_d` |
| `lactuca_sativa` | `schnitt` | `kulturdauer_typisch_d` |
| `lactuca_sativa` | `schnitt` | `entspitzen` |

### 3.5 Saatempfehlung

| Art | Kulturform | Zeile |
|---|---|---|
| `lactuca_sativa` | `schnitt` | `se.lactuca_sativa.schnitt` (beide Kandidaten verworfen, keine `saatempfehlung_offen.csv`; deckt Lollo Rossa Loka, Eichblatt Lattughino Verde und Eissalat Roxette) |

## 4 Bestätigungen Salat

| `zeile_id` | Wert | Kandidaten |
|---|---|---|
| `pw.lactuca_sativa.wachstum.dauer` | typ 24 Tage bei Bezugs-DLI 17 | `#1` (`cornell-gpn-leafy-greens-2016`) und `#3` (`cornell-cea-lettuce-handbook`), beide offen und im Konflikt K-salat-07 mit `#2` (48 Tage bei DLI 8.5); beide Quellen aus Cornell |
| `pw.lactuca_sativa.keimung.keimtemp` | typ 20 °C (nur typ) | `#1` (`sci-agric-lettuce-thermoinhibition-2003`) und `#2` (`cornell-cea-lettuce-handbook`), im Konflikt K-salat-01 |

## 5 Konfliktliste Standardprofil

Ein Konflikt «nur offener Wert». Die pH-Zeilen haben je genau einen geprüften Kandidaten.

### K-standard-01 · Wachstum · `wassertemp` · nur offener Wert

| `kandidat_id` | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.standard.wachstum.wassertemp#2` | Text «72-75 °F» | °F | – | `okstate-hla-6722-2016` | B1 | `keine` | `andere` | 2016 | offen, «Angabe in °F, nicht umgerechnet» |

## 6 Standardprofil: Plausibilität, Lücken, Bestätigungen

### 6.1 Plausibilität

| Nr. | `kandidat_id` | Regel | Wert | Befund |
|---|---|---|---|---|
| S1 | `pw.standard.anzucht.ph#1`, `wachstum.ph#1`, `bluete.ph#1`, `fruchtbildung_reife.ph#1` | V3, V5, V8 | 5.5 – 6.2 | In 5.2 bis 7.0, Bandbreite 0.7, Grösse auf Ebene `standard` zulässig; dieselbe Fundstelle («Most plants grown in these systems», nicht phasenbezogen) trägt alle vier Phasen. |
| S2 | dieselben | Quervergleich | 5.5 – 6.2 | Die Salat-Kandidaten Wachstum (5.6 – 6.0, 5.5 – 6.0) und Nüsslisalat (typ 5.6) liegen innerhalb; kein Widerspruch. |
| S3 | `pw.standard.wachstum.wassertemp#2` | V7, 4.4.1 | 72 – 75 °F | Umgerechnet 22.2 – 23.9 °C, in 10 bis 28, aber in °F nicht ladbar; `01_fachregeln.md` R10.2 nennt als Beispiel «Standard 18–22», der offene Wert liegt darüber. |
| S4 | `pw.standard.wachstum.wassertemp#2` | Phase | nur Wachstum | Die Fundstelle ist nicht phasenbezogen («Important Points»), der Kandidat steht aber nur in Wachstum; die übrigen Phasen haben keinen Wassertemperatur-Kandidaten. |
| S5 | alle `pw.standard.*.licht_h` | Abschnitt 9, R1.4 | – | Alle Licht-Kandidaten sind verworfen; damit fehlt der Rückfall für `licht_h` jeder Art, deren Licht nicht auf Ebene Art oder Sorte belegt ist (bei Salat alle Phasen). |

### 6.2 Lücken (Klasse D, Prüfauftrag)

| Ebene | Phase | Grösse |
|---|---|---|
| `standard` | `keimung` | `ph` (Keimung ohne pH-Pflicht, Abschnitt 9), `wassertemp`, `licht_h` |
| `standard` | `anzucht` | `wassertemp`, `licht_h` |
| `standard` | `wachstum` | `licht_h`; `wassertemp` nur offen (K-standard-01) |
| `standard` | `bluete` | `wassertemp`, `licht_h` |
| `standard` | `fruchtbildung_reife` | `wassertemp`, `licht_h` |

### 6.3 Bestätigungen

Keine (je `zeile_id` höchstens eine Quelle).

## 7 Zahlen

Salat: Konflikte 12 (davon 5 «nur offener Wert»), Plausibilitätsbefunde 27 (kein Verstoss gegen V3 bis V12 bei ladbaren Kandidaten; Gegenprobe-Konflikt bei Freigabe von `wachstum.ec#2`, ebenso bei «eigener Wert» aus `anzucht.ec#2` oder `wachstum.ec#3`), Lücken 23: 3 Pflichtgrössen, 2 Stammfelder, 11 Artmerkmale (dazu 1 bedingt, 1 optional), 6 Kulturform-Felder, 1 Saatempfehlung; zusätzlich 4 Prüfaufträge `licht_h` und `wassertemp` ohne Pflicht. Standardprofil: Konflikte 1 (nur offener Wert), Plausibilitätsbefunde 5, Lücken 10. Bestätigungen 2 (Salat).

## 8 Runde 2 (12.11.2026)

Issue #188 · Rolle Fachkritiker · Kulturformen nach Entscheid 0018: `kopf;schnitt;babyleaf`, Vorgabe `schnitt` · Grundlage: Zeilen von `lactuca_sativa` mit `status = geprueft` oder `vorgeschlagen` in `art.csv`, `profilwert.csv`, `profilwert_offen.csv`, `saatempfehlung.csv` und `saatempfehlung_offen.csv` (gibt es seit Runde 2). Die Quellen `frankiesgarten-salat-hydroponik` und `frankiesgarten-faq` stehen in `quelle.csv` auf `verworfen` nur wegen eines abweichenden Titels und gelten hier als geprüft. `ufl-hs1258-2015` steht auf `entwurf`; ihre beiden Zeilen (`kulturformen_erlaubt#1`, `kulturform_vorgabe#1`) stehen ebenfalls auf `entwurf` und zählen nicht.

Geschrieben wurde nur `konflikt_id` in 23 Zeilen (11 in `profilwert.csv`, 9 in `profilwert_offen.csv`, 2 in `art.csv`, 1 in `saatempfehlung_offen.csv`); bestehende IDs blieben, Zeilen des Nüsslisalats und des Standardprofils sind nicht berührt. Gegenprobe: Salat (Schnitt) Anzucht 1.0, Wachstum 1.2; Salat (Babyleaf) Wachstum 1.0 mS/cm, jeweils als Gesamt-EC mit ECWasser 0.5 (`zuwachs` plus 0.5, `unbekannt` wie `gesamt`). Umrechnungen nur zur Prüfung.

### 8.1 Konfliktliste (alle offenen Konflikte)

15 Konflikte: K-salat-01 bis -12 aus Runde 1, neu K-salat-13 bis -15. «Nur offener Wert» (kein ladbarer Kandidat): K-salat-03, -07, -13, -15. K-salat-04, -06 und -10 waren in Runde 1 «nur offener Wert» und haben jetzt ladbare Kandidaten. Kein Kandidat ist bevorzugt. «neu» = Kandidat aus Runde 2. Die frankiesgarten-Quellen und `cornell-cea-lettuce-handbook` haben kein Jahr.

#### K-salat-01 · Keimung · `keimtemp`

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, Status, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.lactuca_sativa.keimung.keimtemp#1` | 5 / 20 / 33 | °C | – | `sci-agric-lettuce-thermoinhibition-2003` | B1 | `keine` | `andere` | 2003 | ladbar, vorgeschlagen |
| `pw.lactuca_sativa.keimung.keimtemp#2` | – / 20 / – | °C | – | `cornell-cea-lettuce-handbook` | B1 | `substrat_inert` | `gewaechshaus` | – | offen, «Einzelwert» |
| `pw.lactuca_sativa.keimung.keimtemp#3` | Text «64-68 °F» | °F | – | `uky-ccd-hydroponic-lettuce-2016` | B1 | `substrat_inert` | `gewaechshaus` | 2016 | offen, «Angabe in °F, nicht umgerechnet; Bereich ohne typ» |
| `pw.lactuca_sativa.keimung.keimtemp#4` | Text «70-75 °F» | °F | – | `utk-ufl-w844b-2019` | B1 | `substrat_inert` | `andere` | 2019 | offen, «Angabe in °F, nicht umgerechnet; Bereich ohne typ» |
| `pw.lactuca_sativa.keimung.keimtemp#5` (neu) | – / 15 / –, Text «etwa 15 °C; über 24 °C schlechter» | °C | – | `frankiesgarten-salat-hydroponik` | C | `substrat_inert` | `indoor_led` | – | offen, «Einzelwert, kein min und max» |
| `pw.lactuca_sativa.keimung.keimtemp#6` (neu) | 15 / – / 20 | °C | – | `frankiesgarten-keimtemperaturen` | C | `substrat_inert` | `indoor_led` | – | offen, «Bereich ohne typ» |

#### K-salat-02 · Anzucht · `wechselmerkmal` (unverändert)

| `kandidat_id` | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, Status |
|---|---|---|---|---|---|---|---|---|---|
| `pw.lactuca_sativa.anzucht.wechselmerkmal#1` | «Hat der Sämling drei bis vier echte Blätter?» | – | – | `cornell-gpn-leafy-greens-2016` | B1 | `dwc` | `gewaechshaus` | 2016 | ladbar, geprueft |
| `pw.lactuca_sativa.anzucht.wechselmerkmal#2` | «Hat der Sämling drei bis fünf echte Blätter und sind Wurzeln unten am Würfel sichtbar?» | – | – | `utk-ufl-w844b-2019` | B1 | `dwc` | `andere` | 2019 | ladbar, vorgeschlagen |

#### K-salat-03 · Anzucht · `dauer` · nur offener Wert (unverändert)

| `kandidat_id` | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, Status, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.lactuca_sativa.anzucht.dauer#4` | Text «11 Tage ab Saat inkl. Keimung» | Tage ab Saat | – | `cornell-cea-lettuce-handbook` | B1 | `substrat_inert` | `gewaechshaus` | – | offen, geprueft, «Einzelwert ab Saat inkl. Keimung» |

Die neue Zeile `anzucht.dauer#5` (CTAHR, «1-3 weeks») ist verworfen und zählt nicht.

#### K-salat-04 · Anzucht · `ph`

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, Status, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.lactuca_sativa.anzucht.ph#2` | – / 5.8 / – | pH | – | `cornell-cea-lettuce-handbook` | B1 | `substrat_inert` | `gewaechshaus` | – | offen, geprueft, «Einzelwert» |
| `pw.lactuca_sativa.anzucht.ph#3` (neu) | 5.5 / 5.8 / 6.5 | pH | – | `frankiesgarten-salat-hydroponik` | C | `dwc` | `indoor_led` | – | ladbar, geprueft |

#### K-salat-05 · Anzucht · `ec`

| `kandidat_id` | Rohwert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, Status, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.lactuca_sativa.anzucht.ec#1` | 0.5 / – / 1.0 | mS/cm | `unbekannt` | `utk-ufl-w844b-2019` | B1 | `substrat_inert` | `andere` | 2019 | ladbar, vorgeschlagen |
| `pw.lactuca_sativa.anzucht.ec#2` | – / 1200 / – | µS/cm | `zuwachs` | `cornell-cea-lettuce-handbook` | B1 | `substrat_inert` | `gewaechshaus` | – | offen, geprueft, «Einzelwert» |
| `pw.lactuca_sativa.anzucht.ec#3` (neu) | 0.4 / – / 0.6 | mS/cm | `unbekannt` | `frankiesgarten-salat-hydroponik` | C | `dwc` | `indoor_led` | – | ladbar, geprueft |
| `pw.lactuca_sativa.anzucht.ec#4` (neu) | 0.4 / – / 0.8 | mS/cm | `unbekannt` | `frankiesgarten-salat-hydroponik` | C | `dwc` | `indoor_led` | – | ladbar, geprueft |

#### K-salat-06 · Anzucht · `licht_h`

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, Status, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.lactuca_sativa.anzucht.licht_h#2` | – / 24 / – | h | – | `cornell-cea-lettuce-handbook` | B1 | `substrat_inert` | `gewaechshaus` | – | offen, geprueft, «Einzelwert» |
| `pw.lactuca_sativa.anzucht.licht_h#3` (neu) | 14 / – / 16 | h | – | `frankiesgarten-salat-hydroponik` | C | `dwc` | `indoor_led` | – | ladbar, geprueft |

#### K-salat-07 · Wachstum · `dauer` · nur offener Wert

| `kandidat_id` | Wert | Einheit | Bezugs-DLI | Quelle | Klasse | System | Umgebung | Jahr | Datei, Status, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.lactuca_sativa.wachstum.dauer#1` | – / 24 / – | Tage ab Umsetzen | 17 | `cornell-gpn-leafy-greens-2016` | B1 | `dwc` | `gewaechshaus` | 2016 | offen, geprueft, «Einzelwert» |
| `pw.lactuca_sativa.wachstum.dauer#2` | – / 48 / – | Tage ab Umsetzen | 8.5 | `cornell-gpn-leafy-greens-2016` | B1 | `dwc` | `gewaechshaus` | 2016 | offen, geprueft, «Einzelwert bei halbem DLI» |
| `pw.lactuca_sativa.wachstum.dauer#3` | – / 24 / – | Tage ab Umsetzen | 17 | `cornell-cea-lettuce-handbook` | B1 | `dwc` | `gewaechshaus` | – | offen, geprueft, «Einzelwert» |
| `pw.lactuca_sativa.wachstum.dauer#5` (neu) | Text «etwa 4 bis 6 Wochen im Tower» | Wochen | – | `frankiesgarten-salat-hydroponik` | C | `nft` | `indoor_led` | – | offen, geprueft, «Angabe in Wochen; Bereich ohne typ» |
| `pw.lactuca_sativa.wachstum.dauer#6` (neu) | Text «about 4-6 weeks after transplanting» | Wochen ab Umsetzen | – | `ctahr-vc-1-2010` | B1 | `kratky` | `andere` | 2010 | offen, geprueft, «Angabe in Wochen; Bereich ohne typ» |

#### K-salat-08 · Wachstum · `ph`

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, Status |
|---|---|---|---|---|---|---|---|---|---|
| `pw.lactuca_sativa.wachstum.ph#1` | 5.6 / 5.8 / 6.0 | pH | – | `cornell-cea-lettuce-handbook` | B1 | `dwc` | `gewaechshaus` | – | ladbar, vorgeschlagen |
| `pw.lactuca_sativa.wachstum.ph#2` | 5.5 / – / 6.0 | pH | – | `cornell-gpn-leafy-greens-2016` | B1 | `dwc` | `gewaechshaus` | 2016 | ladbar, geprueft |
| `pw.lactuca_sativa.wachstum.ph#4` (neu) | 5.5 / 5.8 / 6.5 | pH | – | `frankiesgarten-salat-hydroponik` | C | `nft` | `indoor_led` | – | ladbar, geprueft |
| `pw.lactuca_sativa.wachstum.ph#5` (neu) | 5.5 / – / 6.5 | pH | – | `ctahr-vc-1-2010` | B1 | `kratky` | `andere` | 2010 | ladbar, geprueft |

Hinweis: Entscheid 0018 hat K-salat-08 vor dem Eingang von `#4` und `#5` auf `#1` entschieden. Die neuen Kandidaten tragen dieselbe ID; ob der Entscheid bleibt, ist offen.

#### K-salat-09 · Wachstum · `ec`

| `kandidat_id` | Rohwert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, Status, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.lactuca_sativa.wachstum.ec#2` | 1.5 / – / 2.0 | mS/cm | `unbekannt` | `utk-ufl-w844b-2019` | B1 | `dwc` | `andere` | 2019 | ladbar, vorgeschlagen |
| `pw.lactuca_sativa.wachstum.ec#3` | 1150 / – / 1250 | µS/cm | `zuwachs` | `cornell-cea-lettuce-handbook` | B1 | `dwc` | `gewaechshaus` | – | offen, geprueft, «EC-Band 0.1 breit (unter 0.2)» |
| `pw.lactuca_sativa.wachstum.ec#4` | – / 1.3 / – | mS/cm (Quelle dS/m) | `unbekannt` | `purdue-ho-309-2020` | B1 | `nft` | `andere` | 2020 | offen, geprueft, «Einzelwert» |
| `pw.lactuca_sativa.wachstum.ec#6` (neu) | 1.0 / – / 1.3 | mS/cm | `unbekannt` | `frankiesgarten-salat-hydroponik` | C | `nft` | `indoor_led` | – | ladbar, geprueft |
| `pw.lactuca_sativa.wachstum.ec#7` (neu) | 1.2 / – / 1.5 | mS/cm | `gesamt` | `ctahr-vc-1-2010` | B1 | `kratky` | `andere` | 2010 | ladbar, geprueft |
| `pw.lactuca_sativa.wachstum.ec#8` (neu) | 1.6 / – / 2.0 | mS/cm | `gesamt` | `ctahr-vc-1-2010` | B1 | `kratky` | `andere` | 2010 | ladbar, geprueft |
| `pw.lactuca_sativa.wachstum.ec#9` (neu) | 1.1 / – / 1.2 | mS/cm | `unbekannt` | `frankiesgarten-faq` | C | `keine` | `indoor_led` | – | offen, geprueft, «EC-Band 0.1 breit (unter 0.2)» |
| `pw.lactuca_sativa.wachstum.ec#10` (neu) | 1 / 1.5 / 2.5 | mS/cm | `gesamt` | `ctahr-vc-1-2010` | B1 | `kratky` | `andere` | 2010 | offen, geprueft, «EC-Band 1.5 breit (über 1.2); max über 2.0» |
| `pw.lactuca_sativa.wachstum.ec#11` (neu) | – / 1.2 / –, Text «ausgewachsen höchstens 1.6» | mS/cm | `unbekannt` | `frankiesgarten-faq` | C | `keine` | `indoor_led` | – | offen, geprueft, «Einzelwert je Stufe, kein min» |

#### K-salat-10 · Wachstum · `wassertemp`

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, Status, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.lactuca_sativa.wachstum.wassertemp#1` | Text «nicht über 25 °C, kühlen bei 26 °C, heizen bei 24 °C» | °C | – | `cornell-cea-lettuce-handbook` | B1 | `dwc` | `gewaechshaus` | – | offen, geprueft, «Stellwerte, kein wörtlicher Bereich min bis max» |
| `pw.lactuca_sativa.wachstum.wassertemp#2` (neu) | 18 / – / 22 | °C | – | `frankiesgarten-salat-hydroponik` | C | `nft` | `indoor_led` | – | ladbar, geprueft |
| `pw.lactuca_sativa.wachstum.wassertemp#3` (neu) | 18 / – / 22 | °C | – | `frankiesgarten-faq` | C | `keine` | `indoor_led` | – | ladbar, geprueft |

#### K-salat-11 · Artmerkmal · `umsetzen_ab_d` (unverändert)

| `kandidat_id` | Wert | Einheit | Basis | Quelle | Klasse | System (Anbaumethode der Quelle) | Umgebung | Jahr | Status |
|---|---|---|---|---|---|---|---|---|---|
| `art.lactuca_sativa.umsetzen_ab_d#1` | 12 | Tage ab Saat | – | `utk-ufl-w844b-2019` | B1 | `dwc` | – | 2019 | vorgeschlagen |
| `art.lactuca_sativa.umsetzen_ab_d#2` | 11 | Tage ab Saat | – | `cornell-cea-lettuce-handbook` | B1 | `dwc` | – | – | geprueft |

#### K-salat-12 · Artmerkmal · `umsetzen_bis_d` (unverändert)

| `kandidat_id` | Wert | Einheit | Basis | Quelle | Klasse | System (Anbaumethode der Quelle) | Umgebung | Jahr | Status |
|---|---|---|---|---|---|---|---|---|---|
| `art.lactuca_sativa.umsetzen_bis_d#1` | 18 | Tage ab Saat | – | `utk-ufl-w844b-2019` | B1 | `dwc` | – | 2019 | vorgeschlagen |
| `art.lactuca_sativa.umsetzen_bis_d#2` | 22 | Tage ab Saat (bei halbem DLI) | – | `cornell-gpn-leafy-greens-2016` | B1 | `dwc` | – | 2016 | geprueft |

#### K-salat-13 · Keimung · `dauer` · nur offener Wert (neu)

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, Status, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.lactuca_sativa.keimung.dauer#3` | – / 3 / –, Text «etwa 3 Tage» | Tage | – | `frankiesgarten-salat-hydroponik` | C | `substrat_inert` | `indoor_led` | – | offen, geprueft, «Einzelwert («etwa 3 Tage»), kein min und max» |
| `pw.lactuca_sativa.keimung.dauer#5` | – / 3 / –, Text «etwa 3 Tage (gemessen bei 21 bis 23 °C)» | Tage | – | `frankiesgarten-keimtemperaturen` | C | `substrat_inert` | `indoor_led` | – | offen, geprueft, «Einzelwert («etwa 3 Tage»), kein min und max» |

Gleiche Zahl, aber kein ladbarer Kandidat; die übrigen Keimdauer-Zeilen (`#1`, `#2`, `#4`) sind verworfen.

#### K-salat-14 · Artmerkmal · `systemeignung` (neu)

| `kandidat_id` | Wert | Einheit | Basis | Quelle | Klasse | System (Anbaumethode der Quelle) | Umgebung | Jahr | Status |
|---|---|---|---|---|---|---|---|---|---|
| `art.lactuca_sativa.systemeignung#1` | `kratky` | – | – | `ctahr-vc-1-2010` | B1 | `kratky` | – | 2010 | geprueft |
| `art.lactuca_sativa.systemeignung#2` | `dwc` | – | – | `cornell-gpn-leafy-greens-2016` | B1 | `dwc` | – | 2016 | geprueft |

#### K-salat-15 · Saatempfehlung `babyleaf` · nur offener Wert (neu)

| `kandidat_id` | Wert (Samen je Schwamm / Obergrenze / stehen lassen) | Einheit | Basis | Quelle | Klasse Saatmenge | System (Anbaumethode der Quelle) | Umgebung | Jahr | Datei, Status, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `se.lactuca_sativa.babyleaf#1` | 6 / 12 / – | Samen | – | `cornell-gpn-leafy-greens-2016` | C | `dwc` | – | 2016 | `saatempfehlung_offen.csv`, geprueft, «Bereich 6 bis 12 je nach Kultur, nicht artbezogen; pflanzen_stehen_lassen nicht genannt» |

### 8.2 Plausibilität Runde 2

Die Befunde P1 bis P27 gelten weiter mit drei Ausnahmen: P8 ist überholt (`anzucht.ph#3` ist ladbar), P13 ebenso (Licht ist jetzt auf Ebene Art belegt) und P19 ist erledigt (`bluete.anwendbar#3` und `fruchtbildung_reife.anwendbar#3`, `entfaellt`, geprüft, Fundstelle der Art nach Annahme 2). P9, P24 und P27 bleiben offen.

| Nr. | `kandidat_id` | Regel | Wert | Befund |
|---|---|---|---|---|
| P28 | `pw.lactuca_sativa.anzucht.ec#3` | V4, V5, Gegenprobe | 0.4 – 0.6 mS/cm, `unbekannt` | Untergrenze genau 0.4 und Bandbreite genau 0.2, also knapp zulässig; die Mitte 0.5 liegt 0.5 unter der Vergleichs-EC 1.0, bei Freigabe also ein Gegenprobe-Konflikt. |
| P29 | `pw.lactuca_sativa.anzucht.ec#4` | V4, V5, Gegenprobe | 0.4 – 0.8 mS/cm, `unbekannt` | Zulässig (Bandbreite 0.4); die Mitte 0.6 liegt genau 0.4 unter 1.0 und damit noch nicht «mehr als 0.4» daneben, also auf der Grenze. |
| P30 | `pw.lactuca_sativa.anzucht.ec#3`, `wachstum.ec#6` | Phase, System | Zeilen «Keimblätter offen» und «Kräftige Pflanze» | Beide stammen aus derselben Dünge-Tabelle im Abschnitt «2 Anzucht in der Station», tragen aber verschiedene Phasen und Systeme (`anzucht`/`dwc` und `wachstum`/`nft`); dass «Kräftige Pflanze» zur Phase Wachstum gehört, steht nicht in der Fundstelle. |
| P31 | `pw.lactuca_sativa.wachstum.ec#6` | V4, V5, Gegenprobe | 1.0 – 1.3 mS/cm, `unbekannt` | Zulässig (Bandbreite 0.3); die Mitte 1.15 liegt 0.05 von 1.2 (Schnitt) und 0.15 von 1.0 (Babyleaf) entfernt, also kein Gegenprobe-Konflikt. |
| P32 | `pw.lactuca_sativa.wachstum.ec#7` | V4, V5, Gegenprobe | 1.2 – 1.5 mS/cm, `gesamt` | Zulässig (Bandbreite 0.3); die Mitte 1.35 liegt 0.15 bzw. 0.35 von den Vergleichswerten entfernt, aber die Quelle nennt den Wert nur für «hot weather», und diese Bedingung steht nicht in der Zeile. |
| P33 | `pw.lactuca_sativa.wachstum.ec#8` | V4, Gegenprobe | 1.6 – 2.0 mS/cm, `gesamt` | Obergrenze genau `ec_obergrenze_validator` 2.0; die Mitte 1.8 liegt 0.6 über 1.2 (Schnitt) und 0.8 über 1.0 (Babyleaf), bei Freigabe also ein Gegenprobe-Konflikt; die Quelle nennt den Wert nur für «cool weather». |
| P34 | `pw.lactuca_sativa.wachstum.ec#7`, `#8`, `#10` | Herkunft | CTAHR S. 11 | Alle drei stammen aus demselben Abschnitt einer Kratky-Quelle mit Wetterbedingung (heiss, kühl, Spanne); für das Indoor-Regal ohne Wetter ist keine der Bedingungen in den Zeilen vermerkt. |
| P35 | `pw.lactuca_sativa.wachstum.ec#9` | V5 | 1.1 – 1.2 mS/cm, `unbekannt` | Bandbreite 0.1 unter 0.2 (deshalb offen); die Mitte 1.15 liegt nahe bei 1.2; die Quelle bezieht den Wert auf ausgewachsenen Salat «bei weichem Wasser». |
| P36 | `pw.lactuca_sativa.wachstum.ec#10` | V4, V5 | 1 / 1.5 / 2.5 mS/cm, `gesamt` | Doppelt nicht ladbar: max 2.5 über 2.0 und Bandbreite 1.5 über 1.2; typ 1.5 läge 0.3 über 1.2. |
| P37 | `pw.lactuca_sativa.wachstum.ec#11` | Gegenprobe, Stufen | typ 1.2, Text «ausgewachsen höchstens 1.6» | typ entspricht genau der Vergleichs-EC 1.2; das Kurzzitat nennt vier Stufen (Anzucht 0.4, Jungpflanze 0.8, Wachstum 1.2, ausgewachsen höchstens 1.6), von denen nur die Stufe Wachstum als Kandidat erfasst ist. |
| P38 | K-salat-09 gesamt | Gegenprobe, Kulturform | Schnitt 1.2, Babyleaf 1.0 | `profilwert` gilt je Art, die Gegenprobe-Tabelle trennt aber Salat (Schnitt) und Salat (Babyleaf); mit Vorgabe `schnitt` gelten 1.2 und 1.0, und gegen Babyleaf 1.0 verfehlen `#2` (1.75), `#8` (1.8) und `#3` als Gesamt-EC (1.7) die Grenze von 0.4. |
| P39 | `pw.lactuca_sativa.anzucht.ph#3`, `wachstum.ph#4` | V3, V5, Phasenbezug | 5.5 / 5.8 / 6.5 | Zulässig (Bandbreite 1.0, typ im Band); die Fundstelle ist die Zeile pH der Übersichtstabelle, die «für alle Stadien» gilt, also nicht phasenbezogen, und dieselbe Zeile trägt einmal `dwc`, einmal `nft`. |
| P40 | `pw.lactuca_sativa.wachstum.ph#1`, `#2`, `#4`, `#5` | V3, V5, Quervergleich | 5.6–6.0; 5.5–6.0; 5.5–6.5; 5.5–6.5 | Alle in 5.2 bis 7.0 mit Bandbreite 0.4 bis 1.0; die gemeinsame Schnittmenge ist 5.6 – 6.0 (Breite 0.4); 6.5 liegt über dem Standardprofil 5.5 – 6.2, Nüsslisalat typ 5.6 (offen) liegt in allen vier Bändern. |
| P41 | `pw.lactuca_sativa.anzucht.ph#2`, `#3` | Quervergleich | typ 5.8; 5.5 / 5.8 / 6.5 | Gleiches typ; kein inhaltlicher Widerspruch, `#2` ist nur wegen der Form offen. |
| P42 | `pw.lactuca_sativa.anzucht.licht_h#2`, `#3` | V7, Inhalt | 24 h; 14 – 16 h | Beide in 0 bis 24, inhaltlich aber gegensätzlich: Cornell fährt Dauerlicht, frankiesgarten nennt 16 h als Höchstwert («aber nie länger»). |
| P43 | `pw.lactuca_sativa.wachstum.licht_h#2`, `wachstum.wassertemp#3`, `wachstum.ec#9`, `#11` | 9.1, Artbezug | `system_quelle = keine` | Die FAQ ist eine Hydroponik-Seite, nennt aber kein System; 9.1 verlangt für Licht, Wassertemperatur und EC eine hydroponische Quelle, und `licht_h#2` gilt laut Kurzzitat «egal ob Salat, Kräuter oder Fruchtgemüse», ist also nicht artspezifisch. |
| P44 | `pw.lactuca_sativa.anzucht.wassertemp#1`, `wachstum.wassertemp#2`, `#3` | V7, Quervergleich | 18 – 22 °C | Zulässig (in 10 bis 28); liegt unter den Cornell-Stellwerten 24 bis 26 °C (`wassertemp#1`, offen) und unter dem offenen Standardwert 22.2 – 23.9 °C (K-standard-01); der Zusatz «bis 24 °C noch in Ordnung» steht nicht im Band. |
| P45 | `pw.lactuca_sativa.keimung.keimtemp#5`, `#6` | 4.4.1, Quervergleich | typ 15 °C; 15 – 20 °C | Kein Validator-Grenzwert; `#6` überschneidet sich mit `#3` (17.8 – 20.0 °C) und enthält typ 20 von `#1` und `#2`; `#5` (15 °C) liegt unter allen anderen typ-Werten; die Warnung «über 24 °C schlechter, über 25 °C oft gar nicht» passt zur Thermoinhibition aus `#1`; Nüsslisalat 15 – 18 °C (frankiesgarten) liegt ähnlich. |
| P46 | `pw.lactuca_sativa.keimung.dauer#3`, `#5` | V6, Bezugspunkt, Unabhängigkeit | typ 3 Tage | V6 nicht prüfbar (nur typ); beide Quellen sind Seiten desselben Betreibers und damit nicht unabhängig; `#5` ist bei 21 bis 23 °C gemessen, über der Keimtemperatur 15 – 20 °C derselben Quelle (`keimtemp#6`); ob «Keimdauer» das Auflaufen (BBCH 09) oder das Ende der Phase (BBCH 10, `keimung.wechselmerkmal#1`) meint, steht nicht in der Zeile. |
| P47 | K-salat-13, K-salat-03, K-salat-11 | Konsistenz | 3; 11 ab Saat; 11 / 12 | Keimung 3 Tage plus Anzucht bis Umsetzen an Tag 11 oder 12 ergäbe 8 bis 9 Tage Anzucht; die Zahlen widersprechen sich nicht, stammen aber aus verschiedenen Quellen und Umgebungen (`indoor_led` gegen `gewaechshaus`). |
| P48 | `pw.lactuca_sativa.wachstum.dauer#5`, `#6` | 9.2 (Bezugspunkt), Kulturform | 4 bis 6 Wochen | Umgerechnet 28 bis 42 Tage ab Umsetzen, zwischen Cornell typ 24 (DLI 17) und 48 (halbes DLI); `#6` gilt für Blatt- und Halbkopfsalat ab Umsetzen, `#5` ab Umsetzen in den Tower nach der Anzucht in der Station, deren Ende als Phasenbeginn nicht belegt ist (vgl. P30). |
| P49 | `art.lactuca_sativa.systemeignung#1`, `#2` (K-salat-14) | 4.3.2, Fundstelle | `kratky`; `dwc` | Beide Werte sind gültig; die Cornell-Fundstelle nennt DWC und NFT für «leafy greens» allgemein, nicht für Salat allein; ein Kandidat `beide` liegt nicht vor. |
| P50 | `art.lactuca_sativa.kulturformen_erlaubt#2` | Entscheid 0018, V11 | `kopf;babyleaf` | Der einzige geprüfte Kandidat enthält `schnitt` nicht (Fundstelle: «Schnitt nicht genannt»); Kandidaten mit `schnitt` (`kulturformen_erlaubt#1`) und die Vorgabe `schnitt` (`kulturform_vorgabe#1`) stehen auf `entwurf`; wird nur `#2` freigegeben, bricht eine Vorgabe `schnitt` V11, und die Zeilen `ak.lactuca_sativa.schnitt.*` und `se.lactuca_sativa.schnitt` gehörten zu einer nicht erlaubten Form; die Nutzung als Schnittsalat belegen `ak.lactuca_sativa.schnitt.ernteart#1` (A) und `#2` (C). |
| P51 | `ak.lactuca_sativa.kopf.ernte_ab_d#1`, `kulturdauer_typisch_d#1`, `umsetzen_ab_d#2` | Konsistenz | 24 ab Umsetzen; 35 ab Saat; 11 | 11 + 24 = 35, die Kopf-Felder sind untereinander und mit Cornell stimmig; `ernteart` `einmalig` passt; V11 bei `kopf` ohne Befund. |
| P52 | `se.lactuca_sativa.kopf#1`, `se.lactuca_sativa.schnitt#3` | R12.3 | 1 / 2 / 1, Klasse B bzw. C | Gleiche Quelle, gleicher Satz, gleiche Zahlen; Klasse B für Kopf und C für Schnitt (Analogie über Pflücksalat) sind folgerichtig; Obergrenze 2 ≥ 1 Samen, 1 Pflanze stehen lassen, formal ohne Befund. |
| P53 | `se.lactuca_sativa.babyleaf#1` | R12.3, Methodenprüfung | 6 / 12 / – | Die Zahl gilt laut Kurzzitat «depending on crop» für mehrere Kulturen, nicht für Salat; die Passung nennt 1-Zoll-Zellen aus Steinwolle oder Oasis, während die Babyleaf-Zeilen `ak.lactuca_sativa.babyleaf.*` derselben Quelle und desselben Abschnitts verworfen sind, weil die Versuche in Torf/Perlit- oder Kokos-Schalen liefen; die beiden Prüfungen widersprechen sich. |
| P54 | `q.frankiesgarten-salat-hydroponik`, `q.frankiesgarten-faq`, `q.frankiesgarten-keimtemperaturen` | 9.3 Regel (2) | `jahr` leer | Ohne Jahr ist «jüngere vor älterer Quelle» in K-salat-01, -04 bis -10 und -13 für diese Kandidaten nicht anwendbar; die Quellenklasse `praxis` und Klasse C entsprechen Entscheid 0018 Punkt 5. |
| P55 | `art.lactuca_sativa.name_de#1`, `kulturgruppe_id#1` | 4.3 (Stammfelder) | `Salat`; `blattsalat` | Beide verworfen, weil GBIF den Wert nicht nennt; 4.3 verlangt als Herkunft der Stammfelder die GBIF-Seite, `name_de` folgt aber aus `sorten.csv` und `kulturgruppe_id` aus 4.2.1, also kann keine GBIF-Fundstelle den Wert wörtlich tragen (Hinweis an den Koordinator, gilt ebenso für Nüsslisalat). |

Ohne Befund: V8, V10, V12 für alle neuen Zeilen; `keimung.keimart#1` bis `#3` (`licht`); `keimung.licht_h#2` (14 – 16 h, V7); `bluete.anwendbar#3`, `fruchtbildung_reife.anwendbar#3` (`entfaellt` nach R1.1). Weiterhin keine ladbare Dauer, V6 entfällt.

### 8.3 Lückenliste nach Pflichtgrössen

#### 8.3.1 Pflichtgrössen (03_import_w0.md 9)

| Phase | Grösse | Stand |
|---|---|---|
| `keimung` | `anwendbar`, `bbch`, `keimart`, `keimtemp`, `wechselmerkmal` | belegt (ladbar) |
| `keimung` | `dauer` | nur offen (K-salat-13) |
| `anzucht` | `anwendbar`, `bbch`, `wechselmerkmal` (K-salat-02), `ph` (K-salat-04), `ec` (K-salat-05) | belegt (ladbar) |
| `anzucht` | `dauer` | nur offen (K-salat-03) |
| `wachstum` | `anwendbar`, `bbch`, `ph` (K-salat-08), `ec` (K-salat-09) | belegt (ladbar); `wechselmerkmal` entfällt als letzte anwendbare Phase |
| `wachstum` | `dauer` | nur offen (K-salat-07) |
| `bluete`, `fruchtbildung_reife` | `anwendbar` | belegt (`entfaellt`), keine weiteren Pflichtgrössen |

Lücken der Klasse D bei Pflichtgrössen: keine. Alle drei `dauer`-Zeilen haben nur offene Kandidaten; bis zu einem Entscheid lädt der Seed Kulturform-Felder, Saatempfehlung und `profilwert` der Art nicht (03_import_w0.md 8 Punkt 4), und der Kulturgruppe `blattsalat` fehlen die Mindestzeilen `dauer` der Leitkultur (4.4.2, V13).

#### 8.3.2 Keine Pflichtgrösse, Prüfauftrag nach R1.4

| Art | Phase | Grösse |
|---|---|---|
| `lactuca_sativa` | `keimung` | `wassertemp` |

#### 8.3.3 Stammfelder und Artmerkmale (4.3.2)

Belegt: `name_wiss`, `gbif_key`, `wuchsform`, `pflanzen_je_m2`, `liter_je_pflanze`, `umsetzen_ab_d` (K-salat-11), `umsetzen_bis_d` (K-salat-12), `systemeignung` (K-salat-14), `kulturformen_erlaubt` (nur `kopf;babyleaf`, P50).

| Art | Feld | Hinweis |
|---|---|---|
| `lactuca_sativa` | `name_de` | Stammfeld, Kandidat verworfen (P55) |
| `lactuca_sativa` | `kulturgruppe_id` | Stammfeld, Kandidat verworfen (P55) |
| `lactuca_sativa` | `kulturformen_erlaubt`, Teil `schnitt` | kein geprüfter Kandidat mit `schnitt` (P50) |
| `lactuca_sativa` | `kulturform_vorgabe` | nur `entwurf` (Quelle `ufl-hs1258-2015` ebenfalls `entwurf`) |
| `lactuca_sativa` | `samentyp` | |
| `lactuca_sativa` | `standard_keimfaehigkeit` | Leitkultur, wird an neue Arten der Gruppe vererbt (4.4.2) |
| `lactuca_sativa` | `wasserbedarf_je_pflanze_l` | |
| `lactuca_sativa` | `wuchshoehe_max_mm` | |
| `lactuca_sativa` | `photoperiode` | |
| `lactuca_sativa` | `bestaeubung_noetig` | |
| `lactuca_sativa` | `pythium` | |
| `lactuca_sativa` | `schossen_handlung` | |
| `lactuca_sativa` | `kritische_tageslaenge_h` | bedingt, nur bei `langtag` oder `kurztag` |
| `lactuca_sativa` | `aussaatfenster_outdoor` | optional |

`keimlinge_je_knaeuel` entfällt (keine Knäuelsaat).

#### 8.3.4 Kulturform-Felder je erlaubter Kulturform (4.3.3)

Alle drei Formen aus Entscheid 0018 haben mindestens eine belegte Quelle (`kopf` und `babyleaf` über `kulturformen_erlaubt#2`, `schnitt` über `ak.lactuca_sativa.schnitt.ernteart#1` und `#2`); keine Form entfällt mangels Quelle, die Aufnahme von `schnitt` in die Liste ist aber nicht belegt (P50).

| Art | Kulturform | Vorhanden | Fehlt |
|---|---|---|---|
| `lactuca_sativa` | `kopf` | `ernteart` (`einmalig`), `ernte_ab_d` (24), `kulturdauer_typisch_d` (35) | `kulturdauer_max_d`, `entspitzen` |
| `lactuca_sativa` | `schnitt` | `ernteart` (`mehrfach`, zwei Quellen) | `ernte_ab_d`, `ernteintervall_d`, `schnitte_max`, `kulturdauer_max_d`, `kulturdauer_typisch_d`, `entspitzen` |
| `lactuca_sativa` | `babyleaf` | – (`ernte_ab_d#1` und `kulturdauer_typisch_d#1` verworfen) | `ernteart`, `ernte_ab_d`, `kulturdauer_max_d`, `kulturdauer_typisch_d`, `entspitzen`; `ernteintervall_d` und `schnitte_max` nur bei `mehrfach` |

#### 8.3.5 Saatempfehlungen je erlaubter Kulturform

| Art | Kulturform | Stand |
|---|---|---|
| `lactuca_sativa` | `kopf` | belegt: `se.lactuca_sativa.kopf#1` (1 / 2 / 1, Klasse B) |
| `lactuca_sativa` | `schnitt` | belegt: `se.lactuca_sativa.schnitt#3` (1 / 2 / 1, Klasse C) |
| `lactuca_sativa` | `babyleaf` | nur offen (K-salat-15); ohne Entscheid Klasse D nach Entscheid 0018 Punkt 4 |

### 8.4 Bestätigungen Runde 2

| `zeile_id` | Wert | Kandidaten |
|---|---|---|
| `pw.lactuca_sativa.keimung.keimart` | `licht` | `#1` (`uky-ccd-hydroponic-lettuce-2016`, B1), `#2` (`frankiesgarten-salat-hydroponik`, C), `#3` (`frankiesgarten-keimtemperaturen`, C); kein Konflikt |
| `pw.lactuca_sativa.keimung.dauer` | typ 3 Tage | `#3` und `#5`, beide offen und von frankiesgarten (K-salat-13) |
| `pw.lactuca_sativa.wachstum.ph` | 5.5 – 6.5 | `#4` (`frankiesgarten-salat-hydroponik`, C, mit typ 5.8) und `#5` (`ctahr-vc-1-2010`, B1), im Konflikt K-salat-08 |
| `pw.lactuca_sativa.wachstum.licht_h` | 14 – 16 h | `#1` (`frankiesgarten-salat-hydroponik`) und `#2` (`frankiesgarten-faq`), gleicher Betreiber; kein Konflikt |
| `pw.lactuca_sativa.wachstum.wassertemp` | 18 – 22 °C | `#2` (`frankiesgarten-salat-hydroponik`) und `#3` (`frankiesgarten-faq`), gleicher Betreiber, im Konflikt K-salat-10 |
| `pw.lactuca_sativa.wachstum.dauer` | 4 bis 6 Wochen | `#5` (frankiesgarten, C) und `#6` (CTAHR, B1), beide offen (K-salat-07); dazu aus Runde 1 typ 24 Tage `#1` und `#3` |
| `pw.lactuca_sativa.keimung.keimtemp` | typ 20 °C | `#1` und `#2` aus Runde 1 (K-salat-01) |
| `ak.lactuca_sativa.schnitt.ernteart` | `mehrfach` | `#1` (`agronomy-lettuce-sequential-harvest-2021`, A) und `#2` (`frankiesgarten-salat-hydroponik`, C); kein Konflikt |

### 8.5 Zahlen Runde 2

Konflikte 15 offen (12 aus Runde 1, davon 8 mit neuen Kandidaten: -01, -04 bis -10; neu 3), davon 4 «nur offener Wert» (K-salat-03, -07, -13, -15). Plausibilitätsbefunde 28 neu (P28 bis P55); Gegenprobe-Konflikt bei Freigabe von `anzucht.ec#3`, `wachstum.ec#2` und `wachstum.ec#8`, `anzucht.ec#4` genau auf der Grenze. Lücken 26: Pflichtgrössen Klasse D keine (aber 3 `dauer` nur offen), 2 Stammfelder, 10 Artmerkmale (inklusive `schnitt` in `kulturformen_erlaubt` und `kulturform_vorgabe`; dazu 1 bedingt, 1 optional), 13 Kulturform-Felder (`kopf` 2, `schnitt` 6, `babyleaf` 5), 1 Prüfauftrag ohne Pflicht (`keimung.wassertemp`); Saatempfehlungen ohne Klasse-D-Lücke, `babyleaf` nur offen. Bestätigungen 8.
