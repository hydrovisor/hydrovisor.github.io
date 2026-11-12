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

## Runde 2 (12.11.2026)

Issue #188 · Kulturformen nach Entscheid 0018 `kopf;babyleaf` (Vorgabe `kopf`) · mitgeprüft: Standardprofil (`ebene = standard`) in `teile/blattsalat/profilwert.csv` und `profilwert_offen.csv`.

Grundlage: alle Zeilen mit `status = geprueft` oder `vorgeschlagen` (Runde 1 und 2) der Art und des Standardprofils in `art.csv`, `profilwert.csv`, `profilwert_offen.csv`, `saatempfehlung.csv`, `saatempfehlung_offen.csv` und die zugehörigen Quellen in `quelle.csv`. Berücksichtigte Zeilen der Art: 14 in `art.csv` (7 vorgeschlagen, 7 geprueft), 7 in `profilwert.csv` (5 vorgeschlagen, 2 geprueft), 6 in `profilwert_offen.csv` (alle geprueft), 0 in beiden Saatempfehlungsdateien. Standardprofil: 4 in `profilwert.csv` (vorgeschlagen), 1 in `profilwert_offen.csv` (geprueft). Quellen der berücksichtigten Zeilen, alle `geprueft`: `gbif-2888778`, `bbch-monografie-2001`, `plants-valerianella-salinity-2023`, `acta-hort-267-valerianella-germination-1990`, `acta-hort-644-lambs-lettuce-floating-2004`, `rivista-agraria-valerianella-2018`, `frankiesgarten-keimtemperaturen`, `vt-spes-464-2023`, `okstate-hla-6722-2016`. Die beiden frankiesgarten-Quellen mit `verworfen` nur wegen des Titels (`frankiesgarten-salat-hydroponik`, `frankiesgarten-faq`) tragen keine Zeile der Art und keine des Standardprofils.

Geschrieben wurde nur die Spalte `konflikt_id`: `pw.valerianella_locusta.keimung.keimtemp#2` (`profilwert_offen.csv`) erhält die bestehende ID K-nuesslisalat-01; `art.valerianella_locusta.kulturformen_erlaubt#1` und `#2` (`art.csv`) erhalten die neue ID K-nuesslisalat-06. Bestehende IDs (K-nuesslisalat-01 bis -05, K-standard-01) und alle Salat-IDs blieben unverändert. Umrechnungen dienen nur der Prüfung.

### R2.1 Konfliktliste (alle offenen Konflikte)

Sieben offene Konflikte: sechs der Art, einer im Standardprofil. Kein Kandidat ist bevorzugt.

**K-nuesslisalat-01 · Keimung · `keimtemp` · nur offener Wert, jetzt zwei verschiedene Werte (Runde 2 neu: #2)**

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.valerianella_locusta.keimung.keimtemp#1` | 5 / – / 20, Text «Optimum c. 15-20 °C» | °C | – | `acta-hort-267-valerianella-germination-1990` (peer_review) | B1 | `keine` | `andere` | 1990 | offen, «Bereich ohne typ (Optimum als Bereich c. 15-20 °C genannt)» |
| `pw.valerianella_locusta.keimung.keimtemp#2` | 15 / – / 18, Text «ab 20 °C keimt er schlecht» | °C | – | `frankiesgarten-keimtemperaturen` (praxis) | C | `substrat_inert` | `indoor_led` | – | offen, «Bereich ohne typ» |

**K-nuesslisalat-02 · Anzucht · `dauer` · nur offener Wert (unverändert)**

| `kandidat_id` | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.valerianella_locusta.anzucht.dauer#1` | Text «22 Tage ab Saat inkl. Keimung» | Tage ab Saat | – | `plants-valerianella-salinity-2023` (peer_review) | A | `substrat_inert` | `gewaechshaus` | 2023 | offen, «Einzelwert ab Saat; Keimdauer nicht in derselben Quelle» |

**K-nuesslisalat-03 · Wachstum · `dauer` · nur offener Wert (unverändert)**

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.valerianella_locusta.wachstum.dauer#1` | – / 29 / – | Tage ab Umsetzen | – | `plants-valerianella-salinity-2023` (peer_review) | A | `dwc` | `gewaechshaus` | 2023 | offen, «Einzelwert» |

**K-nuesslisalat-04 · Wachstum · `ph` · nur offener Wert (unverändert)**

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.valerianella_locusta.wachstum.ph#1` | – / 5.6 / – | pH | – | `plants-valerianella-salinity-2023` (peer_review) | A | `dwc` | `gewaechshaus` | 2023 | offen, «Einzelwert» |

**K-nuesslisalat-05 · Wachstum · `ec` · nur offener Wert (unverändert)**

| `kandidat_id` | Rohwert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.valerianella_locusta.wachstum.ec#1` | – / 2.47 / – | mS/cm (Quelle dS m⁻¹) | `gesamt` | `plants-valerianella-salinity-2023` (peer_review) | A | `dwc` | `gewaechshaus` | 2023 | offen, «Einzelwert; über der EC-Obergrenze 2.0 der Kulturgruppe» |

**K-nuesslisalat-06 · Artmerkmal · `kulturformen_erlaubt` · zwei verschiedene Werte (neu)**

| `kandidat_id` | Wert | Einheit | Basis | Quelle | Klasse | System (Anbaumethode der Quelle) | Umgebung | Jahr | Status |
|---|---|---|---|---|---|---|---|---|---|
| `art.valerianella_locusta.kulturformen_erlaubt#1` | `kopf` | – | – | `plants-valerianella-salinity-2023` (peer_review) | A | `dwc` | – (Gewächshaus laut Quelle) | 2023 | vorgeschlagen |
| `art.valerianella_locusta.kulturformen_erlaubt#2` | `babyleaf` | – | – | `rivista-agraria-valerianella-2018` (praxis) | C | `dwc` | – (nicht genannt) | 2018 | geprueft |

Die Werte schliessen sich nicht aus; die Liste nach Entscheid 0018 (`kopf;babyleaf`) entspricht ihrer Vereinigung, die als Wert in keinem Kandidaten steht. Der Entscheid hängt mit V11 zusammen (R2-P2).

**K-standard-01 · Standardprofil · Wachstum · `wassertemp` · nur offener Wert (unverändert, kein neuer Kandidat)**

| `kandidat_id` | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.standard.wachstum.wassertemp#2` | Text «72-75 °F» | °F | – | `okstate-hla-6722-2016` (universitaet_beratung) | B1 | `keine` | `andere` | 2016 | offen, «Angabe in °F, nicht umgerechnet» |

Aus Runde 1 erledigt: Befund P14 (`bluete.anwendbar`, `fruchtbildung_reife.anwendbar`) hat jetzt geprüfte Kandidaten, `kulturform_vorgabe` (P15) ebenso.

### R2.2 Plausibilität

Geprüft gegen V3 bis V13, die Gegenprobe (Nüsslisalat Wachstum 1.0 mS/cm als Gesamt-EC mit ECWasser 0.5), R1.1, R1.2, Konzept 8.1 Regel 8, 9.1 und den Quervergleich mit Salat. Befunde P1 bis P13 und P16 bis P18 aus Runde 1 gelten weiter; P6 wird durch R2-P5 verstärkt.

| Nr. | `kandidat_id` | Regel | Wert | Befund |
|---|---|---|---|---|
| R2-P1 | `pw.valerianella_locusta.wachstum.ec#1` | V4, Gegenprobe | typ 2.47 mS/cm `gesamt` | Weiterhin der einzige EC-Kandidat der Art: 0.47 über der Obergrenze 2.0 und mit Bandmitte 2.47 um 1.47 über der Vergleichs-EC 1.0 (Runde 1 P1 bis P4). |
| R2-P2 | `art.valerianella_locusta.kulturformen_erlaubt#1`, `#2`, `art.valerianella_locusta.kulturform_vorgabe#1` | V11 | `kopf`, `babyleaf`; Vorgabe `kopf` | Die Vorgabe `kopf` besteht V11 nur, wenn die Liste `kopf` enthält; mit `babyleaf` allein (Kandidat #2) bricht der Validator ab. |
| R2-P3 | `art.valerianella_locusta.kulturformen_erlaubt#2` | 9.1, Kurzzitat | `babyleaf`, Klasse C | Das Kurzzitat nennt Valerianella nur als Beispiel für Floating-Babyleaf in einer Einleitung zu Selen-Biofortifizierung; als Hydroponik-Praxisquelle (Floating) für ein Artmerkmal zulässig. |
| R2-P4 | `art.valerianella_locusta.systemeignung#1` | Konzept 8.1 Regel 8, R3.2 | `dwc` | `dwc` deckt nur die Betriebsarten dwc und konstantpegel, nicht `kratky_belueftet`; Tims Ansatz (Kratky belüftet) erhielte damit keine Systemeignung, obwohl die Quelle Kratky nur nicht untersucht und nicht ausschliesst (Salat dazu K-salat-14). |
| R2-P5 | `ak.valerianella_locusta.kopf.kulturdauer_typisch_d#3`, `ak.valerianella_locusta.kopf.ernte_ab_d#2` | 4.3.3, R1.2, Konsistenz | 51 ab Saat; 29 | 51 ist die Summe 22 + 29 aus zwei Stellen derselben Quelle und stimmt mit den Daten 15.9. bis 5.11.2021 (51 Tage) überein; liest die App `ernte_ab_d` bei Direktsaat ab Saat, läge «Ernte möglich» mit 29 Tagen 22 Tage vor der typischen Kulturdauer (verstärkt P6). |
| R2-P6 | `art.valerianella_locusta.umsetzen_ab_d#1` | Quervergleich, Konsistenz | 22 Tage ab Saat | Gleicher Satz wie `anzucht.dauer#1` (keine Bestätigung); doppelt so spät wie Salat (11 und 12) und gleich dem oberen Salat-Wert 22 bei halbem DLI; Anzucht in Steinwoll-Plugs, bei Tims Direktsaat ohne Umsetzen nur Artmerkmal. |
| R2-P7 | `ak.valerianella_locusta.babyleaf.kulturdauer_typisch_d#1`, `ak.valerianella_locusta.babyleaf.kulturdauer_max_d#1` | 4.3.3, Konsistenz | typ 50, max 55 | typ ≤ max ist erfüllt und 50 liegt im Zyklus 45 bis 55 der zweiten Quelle; Babyleaf (50) ist damit kaum kürzer als Kopf (51), weil beide Quellen die ganze Rosette in Floating-Systemen ernten, nicht wie Salat-Babyleaf nach wenigen Wochen. |
| R2-P8 | `ak.valerianella_locusta.babyleaf.kulturdauer_typisch_d#1` | Kurzzitat | «Approximately 50 days» | Ungefährwert der Quelle mit 1200 Pflanzen (Fläche im Zitat nicht genannt); die Quelle wurde für `kopf` verworfen und für `babyleaf` zugelassen, die Zuordnung zur Kulturform beruht auf «ready-to-use» in der Fundstelle. |
| R2-P9 | `pw.valerianella_locusta.keimung.keimtemp#2` | 4.4.1, Quervergleich | 15 / – / 18 | min ≤ max, kein Validator-Grenzwert; liegt innerhalb des Bereichs 5 bis 20 von #1, beide Quellen setzen die Grenze bei 20 °C, und im Quervergleich keimt Nüsslisalat laut derselben Quelle 2 °C kühler als Salat (15 bis 20). |
| R2-P10 | `pw.valerianella_locusta.keimung.keimtemp#1`, `#2` | 9.1, Artbezug | System `keine`; Feldsalat | Für `keimtemp` ist eine nicht hydroponische Quelle zulässig; «Feldsalat» (#2) und «Valerianella olitoria» (#1) sind Namen derselben Art. |
| R2-P11 | `pw.valerianella_locusta.bluete.anwendbar#2`, `pw.valerianella_locusta.fruchtbildung_reife.anwendbar#2` | Annahme 2, R1.1 | `entfaellt` | Die Fundstelle ist die allgemeine BBCH-Skala (PDF S. 12); dieselbe Fundstelle wurde für Salat (`lactuca_sativa.bluete.anwendbar#2`, `fruchtbildung_reife.anwendbar#2`) mit Verweis auf Annahme 2 verworfen, hier aber zugelassen, weil die Monografie Valerianella in keinem Abschnitt nennt (siehe P12); uneinheitliche Prüfung, kein Konflikt. |
| R2-P12 | `pw.valerianella_locusta.bluete.anwendbar#2`, `fruchtbildung_reife.anwendbar#2` | 03_import_w0.md 8 Punkt 4 | – | Mit beiden Zeilen hat die Art erstmals `anwendbar` für alle fünf Phasen; der Seed lädt Kulturform-Felder, Saatempfehlungen und `profilwert` aber erst, wenn die Pflichtgrössen der Anzucht und des Wachstums ladbar sind (R2.3). |
| R2-P13 | `pw.standard.anzucht.ph#1`, `wachstum.ph#1`, `bluete.ph#1`, `fruchtbildung_reife.ph#1` | V3, V5, V8 | 5.5 – 6.2 | In 5.2 bis 7.0, Bandbreite 0.7, Grösse für Ebene `standard` zulässig; enthält den Nüsslisalat-Wert 5.6 und beide Salat-Bänder des Wachstums; die Quelle nennt den Bereich allgemein für DWC, nicht je Phase. |
| R2-P14 | `pw.standard.wachstum.wassertemp#2` | V7, Quervergleich | 72 – 75 °F (zur Prüfung 22.2 – 23.9 °C) | Innerhalb 10 bis 28 °C, Bandbreite 1.7 K; liegt über dem Salat-Band 18 bis 22 °C und würde als einziger Wert die Wassertemperatur des Nüsslisalats liefern, für den die Art und die Kulturgruppe keinen Kandidaten haben. |
| R2-P15 | (Kulturgruppe `blattsalat`) | V13, 4.4.2 | – | In `teile/blattsalat/profilwert*.csv` steht keine Zeile mit `ebene = kulturgruppe`; `bbch` und `wechselmerkmal` der Anzucht und `bbch` des Wachstums, die Nüsslisalat erben dürfte, haben damit auch auf Ebene Kulturgruppe keinen Kandidaten. |

Ohne Befund: V6 (keine ladbare Dauer), V8 (`keimtemp` nur in Keimung; Standard nur `ph`, `wassertemp`), V9 (alle berücksichtigten Zeilen mit Quelle, Fundstelle, Kurzzitat, Klasse; keine Klasse D), V10 (Wechselmerkmal 41 Zeichen), V12 (`kopf`, `babyleaf`, `dwc`, `einmalig`, `entfaellt` gültig).

### R2.3 Lückenliste nach Pflichtgrössen

**Pflichtgrössen (03_import_w0.md 9) je Phase**

| Art | Phase | Grösse | Stand |
|---|---|---|---|
| `valerianella_locusta` | `keimung` | `dauer` (Ebene Art) | kein Kandidat (Klasse D, Prüfauftrag) |
| `valerianella_locusta` | `keimung` | `keimart` | kein Kandidat (Klasse D, Prüfauftrag) |
| `valerianella_locusta` | `keimung` | `keimtemp` | nur offen (K-nuesslisalat-01) |
| `valerianella_locusta` | `anzucht` | `dauer` (Ebene Art) | nur offen (K-nuesslisalat-02) |
| `valerianella_locusta` | `anzucht` | `bbch` | kein Kandidat, auch nicht auf Ebene Kulturgruppe (R2-P15) |
| `valerianella_locusta` | `anzucht` | `ph` (Ebene Art) | kein Kandidat (Klasse D, Prüfauftrag) |
| `valerianella_locusta` | `anzucht` | `ec` (Ebene Art) | kein Kandidat (Klasse D, Prüfauftrag) |
| `valerianella_locusta` | `anzucht` | `wechselmerkmal` | kein Kandidat, auch nicht auf Ebene Kulturgruppe |
| `valerianella_locusta` | `wachstum` | `dauer` (Ebene Art) | nur offen (K-nuesslisalat-03) |
| `valerianella_locusta` | `wachstum` | `bbch` | kein Kandidat, auch nicht auf Ebene Kulturgruppe |
| `valerianella_locusta` | `wachstum` | `ph` (Ebene Art) | nur offen (K-nuesslisalat-04) |
| `valerianella_locusta` | `wachstum` | `ec` (Ebene Art) | nur offen (K-nuesslisalat-05) |

Vorhanden: `anwendbar` aller fünf Phasen (`ja` für Keimung, Anzucht, Wachstum; `entfaellt` für Blüte und Fruchtbildung), `keimung.bbch`, `keimung.wechselmerkmal`. `wachstum.wechselmerkmal` entfällt (letzte anwendbare Phase von `kopf` und `babyleaf`, R1.2). Blüte und Fruchtbildung haben als `entfaellt` keine weiteren Pflichtgrössen. Ohne Pflicht, Prüfauftrag nach R1.4: `licht_h` und `wassertemp` in Keimung, Anzucht und Wachstum (kein Kandidat der Art).

**Standardprofil**

| Ebene | Phase | Grösse | Stand |
|---|---|---|---|
| `standard` | alle fünf | `licht_h` | kein Kandidat (alle verworfen) |
| `standard` | `keimung`, `anzucht`, `bluete`, `fruchtbildung_reife` | `wassertemp` | kein Kandidat (alle verworfen) |
| `standard` | `wachstum` | `wassertemp` | nur offen (K-standard-01) |
| `standard` | `keimung` | `ph` | kein Kandidat (keine pH-Pflicht in Keimung, nur Hinweis) |

**Stammfelder und Artmerkmale**

| Art | Feld | Hinweis |
|---|---|---|
| `valerianella_locusta` | `kulturgruppe_id` | Stammfeld; einziger Kandidat verworfen |
| `valerianella_locusta` | `samentyp` | |
| `valerianella_locusta` | `standard_keimfaehigkeit` | |
| `valerianella_locusta` | `liter_je_pflanze` | |
| `valerianella_locusta` | `wasserbedarf_je_pflanze_l` | Kratky-Kriterium R3.2 |
| `valerianella_locusta` | `wuchshoehe_max_mm` | |
| `valerianella_locusta` | `wuchsform` | einziger Kandidat verworfen; Grundlage der BBCH-Übertragung (P12) |
| `valerianella_locusta` | `photoperiode` | |
| `valerianella_locusta` | `bestaeubung_noetig` | |
| `valerianella_locusta` | `pythium` | |
| `valerianella_locusta` | `schossen_handlung` | |
| `valerianella_locusta` | `umsetzen_bis_d` | |
| `valerianella_locusta` | `kritische_tageslaenge_h` | bedingt, nur bei `langtag` oder `kurztag` |
| `valerianella_locusta` | `aussaatfenster_outdoor` | optional |

Vorhanden: `name_de`, `name_wiss`, `gbif_key`, `kulturformen_erlaubt` (K-nuesslisalat-06), `kulturform_vorgabe`, `systemeignung`, `pflanzen_je_m2`, `umsetzen_ab_d`. `keimlinge_je_knaeuel` entfällt.

**Kulturform-Felder je erlaubter Kulturform**

| Art | Kulturform | Feld | Hinweis |
|---|---|---|---|
| `valerianella_locusta` | `kopf` | `kulturdauer_max_d` | einziger Kandidat (55, Rivista) für `kopf` verworfen |
| `valerianella_locusta` | `kopf` | `entspitzen` | |
| `valerianella_locusta` | `babyleaf` | `ernteart` | |
| `valerianella_locusta` | `babyleaf` | `ernte_ab_d` | |
| `valerianella_locusta` | `babyleaf` | `entspitzen` | |

Vorhanden: `kopf` mit `ernteart` (`einmalig`), `ernte_ab_d` (29), `kulturdauer_typisch_d` (51); `babyleaf` mit `kulturdauer_typisch_d` (50) und `kulturdauer_max_d` (55). `ernteintervall_d` und `schnitte_max` entfallen bei `kopf` (`einmalig`); bei `babyleaf` hängen sie an der fehlenden `ernteart` (nur bei `mehrfach`).

**Saatempfehlungen je erlaubter Kulturform**

| Art | Kulturform | Zeile |
|---|---|---|
| `valerianella_locusta` | `kopf` | `se.valerianella_locusta.kopf` (kein Kandidat, auch nicht offen) |
| `valerianella_locusta` | `babyleaf` | `se.valerianella_locusta.babyleaf` (kein Kandidat, auch nicht offen) |

### R2.4 Bestätigungen

Keine. Alle Übereinstimmungen der Art beruhen auf derselben Quelle (`plants-valerianella-salinity-2023`: `anzucht.dauer` und `umsetzen_ab_d` 22; `wachstum.dauer` und `ernte_ab_d` 29; `kulturdauer_typisch_d` 51 als deren Summe). Die vier Standard-pH-Zeilen stammen aus einem Satz derselben Quelle. Die Keimtemperaturen #1 und #2 teilen nur die Grenze 20 °C und sind als verschiedene Werte ein Konflikt.

### R2.5 Zahlen Runde 2

Offene Konflikte 7: K-nuesslisalat-01 bis -06 und K-standard-01; neu ist K-nuesslisalat-06, K-nuesslisalat-01 hat einen zweiten Kandidaten. Alle Pflichtgrössen-Konflikte der Art sind weiterhin «nur offener Wert». Plausibilitätsbefunde Runde 2: 15 (R2-P1 bis R2-P15). Lücken 35: 12 Pflichtgrössen der Art (davon 5 nur offen, 7 ohne Kandidat), 4 im Standardprofil (davon 1 nur offen), 1 Stammfeld, 11 Artmerkmale (dazu 1 bedingt, 1 optional), 5 Kulturform-Felder, 2 Saatempfehlungen; zusätzlich 6 Prüfaufträge `licht_h` und `wassertemp` der Art ohne Pflicht. Bestätigungen 0.
