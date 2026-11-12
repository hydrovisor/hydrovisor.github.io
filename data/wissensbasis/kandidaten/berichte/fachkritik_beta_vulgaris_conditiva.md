# Fachkritik Randen (`beta_vulgaris_conditiva`, Blattnutzung)

W0-Hauptlauf, Issue #188, 12.11.2026. Kulturgruppe `fuchsschwanz`, Leitkultur Spinat (Vergleich: `fachkritik_spinacia_oleracea.md`). Kulturformen im Auftrag nach Entscheid 0018: `babyleaf;schnitt`, Vorgabe `babyleaf` (Blattnutzung, W6); eine Form ohne belegte Quelle entfällt. Grundlage: alle Zeilen der Art mit `status = geprueft` oder `vorgeschlagen` in `data/wissensbasis/kandidaten/teile/fuchsschwanz/` (`art.csv`, `profilwert.csv`, `profilwert_offen.csv`, `saatempfehlung.csv`, `saatempfehlung_offen.csv`) und die zugehörigen Zeilen in `quelle.csv`. Zeilen mit `status = entwurf` (MDPI-Studie `agriculture-randen-babyleaf-2025` ohne Zugang) und `verworfen` zählen nicht. Regeln: Konzept 9.1, 9.3, 9.4, R1.1; `03_import_w0.md` 4.4, 6, 7, 9.

Zeilen mit `vorgeschlagen` gibt es für Randen nicht. Geprüft sind 5 Zeilen in `art.csv` (3 Stammfelder, `samentyp`, `ak.schnitt.ernteart`), 13 Zeilen in `profilwert.csv` und 3 Zeilen in `profilwert_offen.csv`; Saatempfehlungen sind nur verworfen vorhanden. Quellen: `gbif-8257605`, `bbch-monografie-2001` und `frankiesgarten-keimtemperaturen` sind geprüft. `frankiesgarten-rote-bete-hydroponik` steht in `quelle.csv` auf `verworfen`, nur weil der Titel abweicht (Quellenprüfung «abweichend: Titel lautet «Rote Bete im Hydro Tower anbauen: mein Versuch»»); sie ist hier wie geprüft behandelt, den Titel korrigiert der Lead. Ihre Anbaumethode ist `nft` (Hydro-Tower). `agriculture-randen-babyleaf-2025` ist mit Quellenprüfung `nicht_gefunden` verworfen (nicht nur wegen des Titels); ihre Zeilen sind `entwurf` oder `verworfen` und zählen nicht.

Zusammenfassung: 2 Konflikte (beide «nur offener Wert», einer davon zusätzlich Wertkonflikt), 12 Plausibilitätsbefunde, 35 Lücken (5 Pflichtgrössen, 1 Stammfeld, 16 Artmerkmale, 11 Kulturform-Felder, 2 Saatempfehlungen), 1 Bestätigung.

## 1 Konfliktliste

Konflikt-IDs in `profilwert_offen.csv` in der Spalte `konflikt_id` gesetzt, nur bei geprüften Kandidaten (Entwurfszeilen derselben `zeile_id` ohne ID). Kein Kandidat ist bevorzugt; die Reihenfolge folgt der Datei. «(offen: …)» steht für Zeilen aus `profilwert_offen.csv` mit dem Grund aus Spalte `grund`.

### K-randen-01 – Phase `keimung`, `dauer` – nur offener Wert

| kandidat_id | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| pw.beta_vulgaris_conditiva.keimung.dauer#1 (offen: Einzelwert) | 3 (nur `wert_min`) | d | – | frankiesgarten-rote-bete-hydroponik | C | substrat_inert | andere | – |

Kein ladbarer Kandidat (`keimung.dauer#2`, 4 d, ist `entwurf`). Pflichtgrösse auf Ebene Art; betrifft die Vorabladung der Keimung (03_import_w0.md 8 Nr. 4).

### K-randen-02 – Phase `keimung`, `keimtemp` – nur offene Werte, Wertkonflikt

| kandidat_id | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| pw.beta_vulgaris_conditiva.keimung.keimtemp#1 (offen: Bereich ohne typ; Band 1 °C) | 20 bis 21 | °C | – | frankiesgarten-rote-bete-hydroponik | C | substrat_inert | andere | – |
| pw.beta_vulgaris_conditiva.keimung.keimtemp#3 (offen: Bereich ohne typ) | 15 bis 20 | °C | – | frankiesgarten-keimtemperaturen | C | substrat_inert | andere | – |

Kein ladbarer Kandidat (`keimung.keimtemp#2`, 25 °C, ist `entwurf`); zusätzlich weichen die Bereiche voneinander ab und berühren sich nur bei 20 °C. Beide Quellen sind Seiten desselben Betreibers.

Keine weiteren Konflikte: `keimart` hat zwei gleiche Werte (Bestätigung), `anzucht.ph`, `wachstum.ph`, `samentyp` und `ak.schnitt.ernteart` je einen geprüften Kandidaten.

## 2 Plausibilität

Umrechnung nur zur Prüfung (03_import_w0.md 6). Randen hat keinen geprüften EC-Kandidaten (`anzucht.ec#1`, `wachstum.ec#2`, `#3` verworfen, `wachstum.ec#1` `entwurf`); V4, V5 (EC) und die Gegenprobe sind nicht anwendbar. Die Gegenprobe-Tabelle (03_import_w0.md 7) nennt für Beta keinen Vergleichswert; der Vergleich mit Spinat (Wachstum 1.6 mS/cm gesamt) ist mangels Wert nicht möglich. EC-Obergrenze der Kulturgruppe `fuchsschwanz`: 2.0 mS/cm.

| Nr. | kandidat_id | Regel | Wert | Befund |
|---|---|---|---|---|
| P1 | art.beta_vulgaris_conditiva.gbif_key#1, name_wiss#1 | Stammfelder 4.3 (GBIF-Herkunft) | 8257605, Beta vulgaris var. conditiva Alef. | Laut Fundstelle ist der Schlüssel im GBIF-Backbone ein Synonym mit dem akzeptierten Schlüssel 7068845, sodass die Art auf ein nicht akzeptiertes Taxon verweist (V2 nicht berührt). |
| P2 | pw.beta_vulgaris_conditiva.keimung.dauer#1 | Form 4.4.1 (min, typ, max), V6 | 3 d | Nur `wert_min` belegt, `wert_typ` und `wert_max` fehlen; der vorhandene Wert ist über 0. |
| P3 | pw.beta_vulgaris_conditiva.keimung.dauer#1 | Abgleich innerhalb der Quelle, Vergleich mit der Kulturgruppe | 3 d | Der Wert ist die Beobachtung eines einzelnen Versuchs in Vermiculite, während dieselbe Quelle laut Fundstelle in der englischen Anzuchtkarte 4 to 7 days nennt; er liegt auch unter Spinat (K-spinat-02, 5 bis 10 d). |
| P4 | pw.beta_vulgaris_conditiva.keimung.keimtemp#1 | Form 4.4.1 (min, typ, max) | 20 bis 21 °C | `wert_typ` fehlt; die Bandbreite von 1 °C ist eine Raumtemperatur des Versuchs und keine Empfehlung. |
| P5 | pw.beta_vulgaris_conditiva.keimung.keimtemp#1 | Abgleich innerhalb der Quelle | 20 bis 21 °C | Dieselbe Quelle nennt laut Fundstelle in der englischen Anzuchtkarte 18 to 20 °C, also einen anderen Bereich als die deutsche Fassung. |
| P6 | pw.beta_vulgaris_conditiva.keimung.keimtemp#3 | Form 4.4.1 (min, typ, max) | 15 bis 20 °C | `wert_typ` fehlt; der Bereich selbst ist geordnet. |
| P7 | pw.beta_vulgaris_conditiva.anzucht.bbch#1 | Herkunft des Phasenendes | 10 bis 12 | Das Ende 12 folgt laut Fundstelle dem Umsetzmerkmal «two-leaf stage» aus `agriculture-randen-babyleaf-2025`, deren Zeile `anzucht.wechselmerkmal#1` nur `entwurf` und deren Quelle verworfen ist, sodass das Phasenende keinen geprüften Beleg hat. |
| P8 | pw.beta_vulgaris_conditiva.anzucht.bbch#1 | Vergleich mit der Kulturgruppe | 10 bis 12 | Mangold endet auf derselben Skala «Beet» bei BBCH 14 (drei bis vier Blätter) und Spinat bei 13, Randen also zwei Stadien früher als die gleiche Art Beta vulgaris. |
| P9 | pw.beta_vulgaris_conditiva.anzucht.ph#1, wachstum.ph#1 | Kulturbezug der Quelle | 6.0 bis 6.5 | Die Quelle beschreibt den Knollenanbau im Hydro-Tower (NFT) mit laufender Blattentnahme und trennt die Blattnutzung (W6) nicht eigens; V3 und V5 (Bandbreite 0.5) sind eingehalten. |
| P10 | pw.beta_vulgaris_conditiva.wachstum.ph#1 | Vergleich mit der Kulturgruppe | 6.0 bis 6.5 | Mangold (`wachstum.ph#1`, cornell-gpn, B1) hat 5.5 bis 6.0, sodass die beiden Beta-Formen nur den Punkt 6.0 teilen; Spinat 6.0 bis 7.0 schliesst Randen ein. |
| P11 | ak.beta_vulgaris_conditiva.schnitt.ernteart#1 | Abgleich Wert und Kurzzitat (Kulturform) | mehrfach | «Die jungen Blätter kannst du schon vorher laufend ernten» beschreibt eine Blattentnahme vor der Knollenernte, und dieselbe Quelle ist bei `se.beta_vulgaris_conditiva.schnitt#1` aus genau diesem Grund (Knollenanbau statt Blattnutzung) verworfen. |
| P12 | art.beta_vulgaris_conditiva.samentyp#1 | Folgefeld 4.3.2 | Knäuel | Mit `samentyp` Knäuel ist `keimlinge_je_knaeuel` nötig; das Kurzzitat nennt dazu eine Spanne, eine Kandidatenzeile fehlt aber (L7). |

**Ohne Befund geprüft:** `anwendbar` für alle fünf Phasen (`ja` für Keimung, Anzucht, Wachstum; `entfaellt` für Blüte und Fruchtbildung aus `#2` mit Fundstelle der Art «Beet», PDF S. 41 f., R1.1 Blattgemüse; `#1` mit allgemeiner Skala verworfen); BBCH `keimung` 0 bis 9, `anzucht` 10 bis 12, `wachstum` 13 bis 39 (0 bis 99, lückenlos über die Hauptstadien 0, 1 und 3; Hauptstadium 4 gilt der Rübe); `keimung.wechselmerkmal` unter 120 Zeichen und als Frage (V10), `wachstum` als letzte anwendbare Phase ohne Wechselmerkmal; `keimart` `dunkel` nur in `keimung` (V8, V12); `anzucht.ph#1` und `wachstum.ph#1` 6.0 bis 6.5 (V3, V5); `samentyp` «Knäuel» im Format von 4.3.2; `ak.schnitt.ernteart` `mehrfach` gültig (V12; zum Inhalt P11); Stammfelder mit GBIF-Quelle, Klasse C, Vermerk `keine` (4.3; zum Status P1).

**Vergleich mit der Kulturgruppe** (geprüfte Zeilen von Spinat und Mangold): `keimart` `dunkel` wie Mangold und Spinat #1, #2 (Spinat #3 `indifferent`, K-spinat-01); `keimtemp#3` 15 bis 20 °C gleich wie Mangold und Spinat #4 aus derselben Tabelle, `#1` 20 bis 21 °C steht allein; `keimung.dauer` siehe P3; `anzucht.ph` nur bei Randen belegt (Spinat L2, Mangold L3 offen); `wachstum.ph` siehe P10; BBCH siehe P8. Für `ec`, `dauer` (Anzucht, Wachstum), `wassertemp` und `licht_h` hat Randen keine geprüften Kandidaten.

## 3 Lückenliste

Klasse D, Prüfauftrag. Pflichtgrössen nach `03_import_w0.md` 9; verworfene und Entwurfszeilen zählen nicht. Offene Kandidaten zählen als Kandidaten (keine Lücke), sind aber ohne Entscheid nicht ladbar.

### 3.1 Phasen und Pflichtgrössen (5)

| Nr. | Art | Phase | Grösse | Bemerkung |
|---|---|---|---|---|
| L1 | beta_vulgaris_conditiva | anzucht | dauer | Pflicht auf Ebene Art; einziger Kandidat `anzucht.dauer#1` ist `entwurf` |
| L2 | beta_vulgaris_conditiva | anzucht | ec | Pflicht auf Ebene Art; einziger Kandidat `anzucht.ec#1` verworfen |
| L3 | beta_vulgaris_conditiva | anzucht | wechselmerkmal | einziger Kandidat `anzucht.wechselmerkmal#1` ist `entwurf` (Anzucht ist nicht die letzte anwendbare Phase) |
| L4 | beta_vulgaris_conditiva | wachstum | dauer | Pflicht auf Ebene Art; einziger Kandidat `wachstum.dauer#1` ist `entwurf` |
| L5 | beta_vulgaris_conditiva | wachstum | ec | Pflicht auf Ebene Art; `wachstum.ec#1` ist `entwurf`, `#2` und `#3` verworfen |

Pflichtzeilen ohne ladbaren Kandidaten (nur offene Werte, 2): `keimung.dauer` (K-randen-01), `keimung.keimtemp` (K-randen-02). Ohne Entscheid und ohne Schliessen von L1, L2, L4 und L5 fehlen `dauer` und `ec` auf Ebene Art, und der Seed lädt Kulturform-Felder, Saatempfehlungen und `profilwert` der Art nicht (8 Nr. 4); die Vorabladung der Keimung fehlt ohne Entscheid zu K-randen-01 und K-randen-02.

Vorhanden: alle fünf `anwendbar`, `bbch` in den drei anwendbaren Phasen, `keimung.wechselmerkmal`, `keimart`, `anzucht.ph`, `wachstum.ph`. Nicht gezählt (Standardprofil, R1.4): `wassertemp` und `licht_h`.

### 3.2 Stammfelder (1)

| Nr. | Art | Feld | Bemerkung |
|---|---|---|---|
| L6 | beta_vulgaris_conditiva | name_de | kein Kandidat; `sorten.csv` ordnet die Sorte über `name_de` «Randen» zu (4.3.1, 4.6), ohne Zeile bricht der Seed beim Sortenstamm ab |

Vorhanden: `name_wiss`, `gbif_key`, `kulturgruppe_id` (zum Synonym-Status P1).

### 3.3 Artmerkmale (16)

| Nr. | Art | Feld |
|---|---|---|
| L7 | beta_vulgaris_conditiva | keimlinge_je_knaeuel (nötig, weil `samentyp` = Knäuel; P12) |
| L8 | beta_vulgaris_conditiva | standard_keimfaehigkeit |
| L9 | beta_vulgaris_conditiva | systemeignung (einziger Kandidat `#1` ist `entwurf`) |
| L10 | beta_vulgaris_conditiva | liter_je_pflanze |
| L11 | beta_vulgaris_conditiva | wasserbedarf_je_pflanze_l |
| L12 | beta_vulgaris_conditiva | pflanzen_je_m2 |
| L13 | beta_vulgaris_conditiva | wuchshoehe_max_mm |
| L14 | beta_vulgaris_conditiva | wuchsform |
| L15 | beta_vulgaris_conditiva | photoperiode |
| L16 | beta_vulgaris_conditiva | bestaeubung_noetig |
| L17 | beta_vulgaris_conditiva | pythium |
| L18 | beta_vulgaris_conditiva | schossen_handlung |
| L19 | beta_vulgaris_conditiva | umsetzen_ab_d (einziger Kandidat `#1` ist `entwurf`) |
| L20 | beta_vulgaris_conditiva | umsetzen_bis_d |
| L21 | beta_vulgaris_conditiva | kulturformen_erlaubt (kein Kandidat) |
| L22 | beta_vulgaris_conditiva | kulturform_vorgabe (einziger Kandidat `#1` = `babyleaf` verworfen) |

Vorhanden: `samentyp`. Bedingt, nicht gezählt: `kritische_tageslaenge_h` (wenn `photoperiode` `langtag` oder `kurztag` belegt wird). Nicht gezählt: `aussaatfenster_outdoor` (optional).

### 3.4 Kulturform-Felder (11)

`schnitt` hat mit `ak.schnitt.ernteart#1` einen geprüften Beleg (zum Inhalt P11). `babyleaf` hat keinen: `kulturform_vorgabe#1` und `ak.babyleaf.ernte_ab_d#1` sind verworfen, `ak.babyleaf.kulturdauer_typisch_d#1` ist `entwurf`. Nach Entscheid 0018 entfiele damit `babyleaf`, und die Vorgabe `babyleaf` stünde nicht mehr in `kulturformen_erlaubt` (V11); die Felder sind trotzdem für beide Formen im Auftrag als Lücke geführt.

| Nr. | Art | Kulturform | Feld |
|---|---|---|---|
| L23 | beta_vulgaris_conditiva | babyleaf | ernte_ab_d (einziger Kandidat `#1` verworfen) |
| L24 | beta_vulgaris_conditiva | babyleaf | ernteart |
| L25 | beta_vulgaris_conditiva | babyleaf | kulturdauer_typisch_d (einziger Kandidat `#1` ist `entwurf`) |
| L26 | beta_vulgaris_conditiva | babyleaf | kulturdauer_max_d |
| L27 | beta_vulgaris_conditiva | babyleaf | entspitzen |
| L28 | beta_vulgaris_conditiva | schnitt | ernte_ab_d |
| L29 | beta_vulgaris_conditiva | schnitt | kulturdauer_typisch_d |
| L30 | beta_vulgaris_conditiva | schnitt | kulturdauer_max_d |
| L31 | beta_vulgaris_conditiva | schnitt | entspitzen |
| L32 | beta_vulgaris_conditiva | schnitt | ernteintervall_d (nötig, weil `ernteart` = `mehrfach`) |
| L33 | beta_vulgaris_conditiva | schnitt | schnitte_max (nötig, weil `ernteart` = `mehrfach`) |

Vorhanden: `schnitt.ernteart`. Bedingt: Wird `ernteart` bei `babyleaf` als `mehrfach` belegt, fehlen dort zusätzlich `ernteintervall_d` und `schnitte_max`.

### 3.5 Saatempfehlungen (2)

| Nr. | Art | Kulturform | Zeile |
|---|---|---|---|
| L34 | beta_vulgaris_conditiva | babyleaf | se.beta_vulgaris_conditiva.babyleaf (kein Kandidat; nach Entscheid 0018 Punkt 4 wäre eine Zeile Klasse D möglich) |
| L35 | beta_vulgaris_conditiva | schnitt | se.beta_vulgaris_conditiva.schnitt (einziger Kandidat `#1` in `saatempfehlung_offen.csv` verworfen; ebenso) |

### 3.6 V13

Randen ist nicht Leitkultur; die Mindestzeilen der Kulturgruppe `fuchsschwanz` behandelt `fachkritik_spinacia_oleracea.md` 3.6.

## 4 Bestätigungen

| Zeile | Wert | Übereinstimmende Kandidaten |
|---|---|---|
| pw.beta_vulgaris_conditiva.keimung.keimart | dunkel | #1 frankiesgarten-rote-bete-hydroponik (C, Vermiculite), #2 frankiesgarten-keimtemperaturen (C, Schaumstoffwürfel); zwei Seiten desselben Betreibers, also keine unabhängigen Quellen |
