# Fachkritik Nüsslisalat (`valerianella_locusta`)

Stand 12.11.2026 · W0-Probelauf, Issue #184 · Rolle Fachkritiker · Kulturgruppe `blattsalat` (Leitkultur Salat) · Kulturform im Auftrag `kopf`, einmalige Ernte (Sorte Dunkelgrüner vollherziger 2; Kratky belüftet, Direktsaat)

Grundlage: nur Zeilen mit `status = geprueft` in `teile/blattsalat/` (`art.csv`, `profilwert.csv`, `profilwert_offen.csv`, `saatempfehlung.csv`, `quelle.csv`); `saatempfehlung_offen.csv` gibt es in dieser Gruppe nicht. Geprüfte Zeilen der Art: 7 in `art.csv`, 5 in `profilwert.csv`, 5 in `profilwert_offen.csv`, 0 in `saatempfehlung.csv`. Geprüfte Quellen mit Datenzeilen der Art: `gbif-2888778`, `bbch-monografie-2001`, `plants-valerianella-salinity-2023`, `acta-hort-267-valerianella-germination-1990`. Geschrieben wurde nur die Spalte `konflikt_id` (5 Zeilen in `profilwert_offen.csv`). Umrechnungen in diesem Bericht dienen nur der Prüfung; in den Dateien bleibt der Rohwert.

## 1 Konfliktliste

Fünf Konflikte, alle «nur offener Wert»: Je `zeile_id` gibt es genau einen geprüften Kandidaten, und er steht in `profilwert_offen.csv`. Es gibt keine `zeile_id` mit zwei oder mehr geprüften Kandidaten. Kein Kandidat ist bevorzugt.

### K-nuesslisalat-01 · Keimung · `keimtemp` · nur offener Wert

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.valerianella_locusta.keimung.keimtemp#1` | 5 / – / 20, Text «Optimum c. 15-20 °C» | °C | – | `acta-hort-267-valerianella-germination-1990` (peer_review) | B1 | `keine` | `andere` | 1990 | offen, «Bereich ohne typ (Optimum als Bereich c. 15-20 °C genannt)» |

### K-nuesslisalat-02 · Anzucht · `dauer` · nur offener Wert

| `kandidat_id` | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.valerianella_locusta.anzucht.dauer#1` | Text «22 Tage ab Saat inkl. Keimung» | Tage ab Saat | – | `plants-valerianella-salinity-2023` (peer_review) | A | `substrat_inert` | `gewaechshaus` | 2023 | offen, «Einzelwert ab Saat; Keimdauer nicht in derselben Quelle» |

### K-nuesslisalat-03 · Wachstum · `dauer` · nur offener Wert

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.valerianella_locusta.wachstum.dauer#1` | – / 29 / – | Tage ab Umsetzen | – | `plants-valerianella-salinity-2023` (peer_review) | A | `dwc` | `gewaechshaus` | 2023 | offen, «Einzelwert» |

### K-nuesslisalat-04 · Wachstum · `ph` · nur offener Wert

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.valerianella_locusta.wachstum.ph#1` | – / 5.6 / – | pH | – | `plants-valerianella-salinity-2023` (peer_review) | A | `dwc` | `gewaechshaus` | 2023 | offen, «Einzelwert» |

### K-nuesslisalat-05 · Wachstum · `ec` · nur offener Wert

| `kandidat_id` | Rohwert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.valerianella_locusta.wachstum.ec#1` | – / 2.47 / – | mS/cm (Quelle dS m⁻¹) | `gesamt` | `plants-valerianella-salinity-2023` (peer_review) | A | `dwc` | `gewaechshaus` | 2023 | offen, «Einzelwert; über der EC-Obergrenze 2.0 der Kulturgruppe» |

## 2 Plausibilität

Geprüft gegen V3 bis V13 (03_import_w0.md 7), die Gegenprobe-Tabelle (Nüsslisalat: nur Wachstum 1.0 mS/cm; Gesamt-EC mit ECWasser 0.5, Basis `gesamt` ohne Zuschlag), R1.1, R1.2, die Pflichtgrössen (Abschnitt 9) und die geprüften Zeilen von Salat, der Leitkultur derselben Gruppe.

| Nr. | `kandidat_id` | Regel | Wert | Befund |
|---|---|---|---|---|
| P1 | `pw.valerianella_locusta.wachstum.ec#1` | V4 | typ 2.47 mS/cm, `gesamt` | Der Wert liegt 0.47 über `ec_obergrenze_validator` 2.0 der Kulturgruppe `blattsalat`; ein «eigener Wert» auf dieser Grundlage bricht V4 ab, solange er nicht unter 2.0 liegt. |
| P2 | `pw.valerianella_locusta.wachstum.ec#1` | Gegenprobe (9.4) | Mitte 2.47 gegen 1.0 | Mit Basis `gesamt` ist die Bandmitte 2.47 mS/cm und weicht 1.47 von der Vergleichs-EC 1.0 ab, bei Freigabe also ein Gegenprobe-Konflikt für Tim. |
| P3 | `pw.valerianella_locusta.wachstum.ec#1` | V5, 4.4.1 | nur typ | Ohne `wert_min` und `wert_max` ist keine Bandbreite prüfbar; laut Kurzzitat ist 2.47 die gemessene EC der Kontroll-Nährlösung einer Salzstress-Studie («control NS»), kein angegebener Sollbereich. |
| P4 | `pw.valerianella_locusta.wachstum.ec#1` | Quervergleich Kulturgruppe | 2.47 gegen Salat | Der Wert liegt über allen Salat-Kandidaten (ladbar 1.5 – 2.0 `unbekannt`; offen 1150 – 1250 µS/cm `zuwachs` und 1.3 mS/cm), obwohl der Düngeplan Nüsslisalat mit 1.0 tiefer führt als Salat (Schnitt) mit 1.2. |
| P5 | `pw.valerianella_locusta.wachstum.ph#1` | V3, V5, Quervergleich | typ 5.6 | 5.6 liegt in 5.2 bis 7.0 und in beiden Salat-Bändern Wachstum (5.6 – 6.0, 5.5 – 6.0) sowie im Standard 5.5 – 6.2, ist ohne min und max aber nicht ladbar; `wachstum.ph` ist Pflicht auf Ebene Art. |
| P6 | `ak.valerianella_locusta.kopf.ernte_ab_d#2` | 4.3.3 (Bezug), R1.2 | 29 Tage ab Umsetzen | Die App liest `ernte_ab_d` bei Direktsaat als Tage ab Saat; in der Quelle lag das kommerzielle Stadium nach 22 Tagen Anzucht plus 29 Tagen, also rund 51 Tage ab Saat, bei Tims Direktsaat im Kratky stünde «Ernte möglich» damit rund drei Wochen zu früh. |
| P7 | `pw.valerianella_locusta.wachstum.dauer#1`, `ak.valerianella_locusta.kopf.ernte_ab_d#2` | V6, Konsistenz | typ 29 | V6 ist ohne min und max nicht prüfbar; beide Zeilen stützen sich auf denselben Satz derselben Quelle (keine Bestätigung durch eine zweite Quelle) und passen zur Kulturform `kopf`, deren Profil in Wachstum endet; Bezugstemperatur und Bezugs-DLI sind leer. |
| P8 | `pw.valerianella_locusta.anzucht.dauer#1` | 9.2 (Bezugspunkt), V6 | 22 Tage ab Saat inkl. Keimung | Bezugspunkt ist die Saat, nicht der Phasenbeginn; die Umrechnung braucht `keimung.dauer`, für die es keinen geprüften Kandidaten gibt, und die Anzucht lief in Steinwoll-Plugs (`substrat_inert`), nicht wie bei Tim direkt im Kratky. |
| P9 | `pw.valerianella_locusta.anzucht.dauer#1` | Quervergleich Kulturgruppe | 22 ab Saat | Doppelt so lang wie bei Salat (11 Tage ab Saat, `cornell-cea-lettuce-handbook`) und am oberen Rand der Salat-Umsetzfenster 11 – 22; für die langsam keimende Art plausibel, aber nur eine Quelle. |
| P10 | `pw.valerianella_locusta.keimung.keimtemp#1` | 4.4.1 (`keimtemp`), Kurzzitat | 5 / – / 20, Text «Optimum c. 15-20 °C» | Kein Validator-Grenzwert, min ≤ max erfüllt; das Kurzzitat nennt nur, dass die Samen bei 5 bis 20 °C «much better» keimen als über 20 °C, das Optimum 15 – 20 °C im `text_wert` steht nicht im Kurzzitat. |
| P11 | `pw.valerianella_locusta.keimung.keimtemp#1` | 9.1, Artbezug | System `keine`, «Valerianella olitoria» | Für `keimtemp` ist eine nicht hydroponische Quelle zulässig (9.1 schliesst nur pH, EC, Dauer, Licht, Wassertemperatur aus); die Quelle nennt den Synonymnamen Valerianella olitoria; die Obergrenze 20 °C liegt beim Salat-Typwert 20 °C, Nüsslisalat ist damit plausibel der kühlere Keimer der Gruppe. |
| P12 | `pw.valerianella_locusta.keimung.anwendbar#1`, `anzucht.anwendbar#1`, `wachstum.anwendbar#1`, `keimung.bbch#1`, `keimung.wechselmerkmal#1` | Annahme 2, Artbezug | Übertragung über Fussnote 1 | Die Monografie nennt Valerianella nicht; die Übertragung stützt sich auf «species with rosette-type growth», doch für `wuchsform` der Art gibt es keinen geprüften Kandidaten, die Grundlage der Übertragung steht also in keiner geprüften Zeile. |
| P13 | `pw.valerianella_locusta.keimung.bbch#1`, `keimung.wechselmerkmal#1` | 4.4.1, V10 | 0 – 9; «Sind die Keimblätter vollständig entfaltet?» | Merkmal (BBCH 10, 41 Zeichen) schliesst lückenlos an 0 – 9 an; die Grenze zur Anzucht ist offen, weil `anzucht.bbch` fehlt. |
| P14 | (Lücke) `bluete.anwendbar`, `fruchtbildung_reife.anwendbar` | R1.1, 03_import_w0.md 8 Punkt 4 | – | Nach R1.1 sind beide `entfaellt`, aber es gibt keinen geprüften Kandidaten; ohne sie lädt der Seed Kulturform-Felder, Saatempfehlung und `profilwert` der Art nicht, selbst wenn alle übrigen Werte entschieden sind. |
| P15 | `art.valerianella_locusta.kulturformen_erlaubt#1` | Kurzzitat, V11 | `kopf` | Das Kurzzitat beschreibt die Ernte ganzer Pflanzen im kommerziellen Stadium, `kopf` ist daraus abgeleitet und deckt den Auftrag; `kulturform_vorgabe` fehlt (V11 prüft sie gegen die Liste), und die Gegenprobe-Tabelle führt Nüsslisalat zusammen mit Salat (Babyleaf). |
| P16 | `ak.valerianella_locusta.kopf.ernteart#1` | V11, R1.7 | `einmalig` | Zulässig und passend zu Kopf; `ernteintervall_d` und `schnitte_max` entfallen deshalb. |
| P17 | `art.valerianella_locusta.pflanzen_je_m2#1` | Quervergleich Kulturgruppe | 53 | Dichter als Salat (38 je m², Kopfsalat nach dem Umstellen), für die kleinere Rosette plausibel; gilt für Floating-Platten mit 5-cm-Löchern im Gewächshaus. |
| P18 | alle hydroponischen Werte der Art | 9.3 Regel (2), System | eine Studie, `dwc`, `gewaechshaus` | Alle Werte zu pH, EC und Dauer sowie `ernte_ab_d` und `pflanzen_je_m2` stammen aus `plants-valerianella-salinity-2023` (Floating, Gewächshaus, Jungpflanzen aus Steinwoll-Plugs); keine Quelle mit Kratky, Indoor-LED oder Direktsaat. |

Ohne Befund: V8 (`einheit_quelle` und `ec_basis` nur bei `ec`; `keimtemp` nur in Keimung), V9 (alle geprüften Zeilen mit Quelle, Fundstelle, Kurzzitat, Klasse; keine Klasse D), V12 (Aufzählungswerte gültig), Stammfelder `name_de`, `name_wiss`, `gbif_key` (Kurzzitat und Schlüssel 2888778 stimmen überein). V13 betrifft die Kulturgruppe, nicht die Art. Kein ladbarer Wert für pH, EC, Dauer, Wassertemperatur oder Licht, V3 bis V7 greifen deshalb nur auf die offenen Kandidaten.

## 3 Lückenliste

### 3.1 Pflichtgrössen ohne geprüften Kandidaten (Klasse D, Prüfauftrag)

| Art | Phase | Grösse |
|---|---|---|
| `valerianella_locusta` | `keimung` | `dauer` (mindestens Ebene Art) |
| `valerianella_locusta` | `keimung` | `keimart` |
| `valerianella_locusta` | `anzucht` | `bbch` |
| `valerianella_locusta` | `anzucht` | `ph` (mindestens Ebene Art) |
| `valerianella_locusta` | `anzucht` | `ec` (mindestens Ebene Art) |
| `valerianella_locusta` | `anzucht` | `wechselmerkmal` |
| `valerianella_locusta` | `wachstum` | `bbch` |
| `valerianella_locusta` | `bluete` | `anwendbar` (nach R1.1 `entfaellt`) |
| `valerianella_locusta` | `fruchtbildung_reife` | `anwendbar` (nach R1.1 `entfaellt`) |

Pflichtgrössen nur mit offenen Kandidaten: `keimung.keimtemp` (K-nuesslisalat-01), `anzucht.dauer` (K-nuesslisalat-02), `wachstum.dauer` (K-nuesslisalat-03), `wachstum.ph` (K-nuesslisalat-04), `wachstum.ec` (K-nuesslisalat-05). `wachstum.wechselmerkmal` entfällt als letzte anwendbare Phase der Kulturform `kopf` (Abschnitt 9). `bbch` und `wechselmerkmal` der Anzucht und `bbch` des Wachstums dürfen von der Kulturgruppe erben, die Pflichtgrössen auf Ebene Art (`dauer`, `ph`, `ec`) nicht. Folge: Für den Vorab-Lauf der Keimungszeilen bis 15.12. hat die Art weder `dauer` noch `keimart` noch eine ladbare `keimtemp`.

### 3.2 Keine Pflichtgrössen, Prüfauftrag nach R1.4

| Art | Phase | Grösse |
|---|---|---|
| `valerianella_locusta` | `keimung` | `licht_h`, `wassertemp` |
| `valerianella_locusta` | `anzucht` | `licht_h`, `wassertemp` |
| `valerianella_locusta` | `wachstum` | `licht_h`, `wassertemp` |

### 3.3 Stammfelder und Artmerkmale (4.3.2)

Vorhanden: `name_de`, `name_wiss`, `gbif_key`, `kulturformen_erlaubt` (`kopf`), `pflanzen_je_m2`. Es fehlen:

| Art | Feld | Hinweis |
|---|---|---|
| `valerianella_locusta` | `kulturgruppe_id` | Stammfeld; ohne es lädt der Seed auch die Artmerkmale nicht (03_import_w0.md 8 Punkt 4) |
| `valerianella_locusta` | `kulturform_vorgabe` | muss in `kulturformen_erlaubt` liegen (V11) |
| `valerianella_locusta` | `samentyp` | |
| `valerianella_locusta` | `standard_keimfaehigkeit` | |
| `valerianella_locusta` | `systemeignung` | Auftrag Kratky belüftet |
| `valerianella_locusta` | `liter_je_pflanze` | |
| `valerianella_locusta` | `wasserbedarf_je_pflanze_l` | Kratky-Kriterium R3.2 |
| `valerianella_locusta` | `wuchshoehe_max_mm` | |
| `valerianella_locusta` | `wuchsform` | Grundlage der BBCH-Übertragung (P12) |
| `valerianella_locusta` | `photoperiode` | |
| `valerianella_locusta` | `bestaeubung_noetig` | |
| `valerianella_locusta` | `pythium` | |
| `valerianella_locusta` | `schossen_handlung` | |
| `valerianella_locusta` | `umsetzen_ab_d` | bei Direktsaat ohne Umsetzen, als Artmerkmal trotzdem vorgesehen |
| `valerianella_locusta` | `umsetzen_bis_d` | wie `umsetzen_ab_d` |
| `valerianella_locusta` | `kritische_tageslaenge_h` | bedingt, nur bei `langtag` oder `kurztag` |
| `valerianella_locusta` | `aussaatfenster_outdoor` | optional |

`keimlinge_je_knaeuel` entfällt (keine Knäuelsaat).

### 3.4 Kulturform-Felder `kopf` (4.3.3)

Vorhanden: `ernteart` (`einmalig`), `ernte_ab_d` (29, Bezug siehe P6). `ernteintervall_d` und `schnitte_max` entfallen bei `einmalig`. Es fehlen:

| Art | Kulturform | Feld |
|---|---|---|
| `valerianella_locusta` | `kopf` | `kulturdauer_typisch_d` |
| `valerianella_locusta` | `kopf` | `kulturdauer_max_d` |
| `valerianella_locusta` | `kopf` | `entspitzen` |

### 3.5 Saatempfehlung

| Art | Kulturform | Zeile |
|---|---|---|
| `valerianella_locusta` | `kopf` | `se.valerianella_locusta.kopf` (kein Kandidat, keine `saatempfehlung_offen.csv`; deckt Dunkelgrüner vollherziger 2) |

## 4 Bestätigungen

Keine: Jede `zeile_id` der Art hat höchstens einen geprüften Kandidaten. Die Übereinstimmung von `wachstum.dauer` (typ 29) und `ernte_ab_d` (29) beruht auf demselben Satz derselben Quelle und ist keine Bestätigung (P7).

## 5 Zahlen

Konflikte 5 (alle «nur offener Wert», K-nuesslisalat-01 bis -05). Plausibilitätsbefunde 18 (kein ladbarer Wert verletzt V3 bis V12; der offene EC-Wert verletzt V4 und erzeugt bei Freigabe einen Gegenprobe-Konflikt; `ernte_ab_d` passt bei Direktsaat nicht zum Bezug der Quelle). Lücken 28: 9 Pflichtgrössen, 1 Stammfeld, 14 Artmerkmale (dazu 1 bedingt, 1 optional), 3 Kulturform-Felder, 1 Saatempfehlung; zusätzlich 6 Prüfaufträge `licht_h` und `wassertemp` ohne Pflicht. Bestätigungen 0.
