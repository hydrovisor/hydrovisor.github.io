# Fachkritik Mangold (`beta_vulgaris_cicla`)

W0-Hauptlauf, Issue #188, 12.11.2026. Kulturgruppe `fuchsschwanz`, Leitkultur Spinat (Vergleich: `fachkritik_spinacia_oleracea.md`). Kulturformen im Auftrag nach Entscheid 0018: `schnitt;babyleaf`, Vorgabe `schnitt`; eine Form ohne belegte Quelle entfällt. Grundlage: alle Zeilen der Art mit `status = geprueft` oder `vorgeschlagen` in `data/wissensbasis/kandidaten/teile/fuchsschwanz/` (`art.csv`, `profilwert.csv`, `profilwert_offen.csv`, `saatempfehlung.csv`, `saatempfehlung_offen.csv`) und die zugehörigen Zeilen in `quelle.csv`. Zeilen mit `status = entwurf` (MDPI-Studie `horticulturae-mangold-meerwasser-2022` ohne Zugang) und `verworfen` zählen nicht. Regeln: Konzept 9.1, 9.3, 9.4, R1.1; `03_import_w0.md` 4.4, 6, 7, 9.

Zeilen mit `vorgeschlagen` gibt es für Mangold nicht. Geprüft sind 3 Stammfelder in `art.csv`, 12 Zeilen in `profilwert.csv` und 1 Zeile in `profilwert_offen.csv`; Saatempfehlungen fehlen ganz. Alle Quellen der geprüften Kandidaten (`gbif-7539798`, `bbch-monografie-2001`, `cornell-gpn-leafy-greens-2016`, `frankiesgarten-keimtemperaturen`) sind in `quelle.csv` geprüft. Die Quelle `horticulturae-mangold-meerwasser-2022` ist in `quelle.csv` mit Quellenprüfung `nicht_gefunden` verworfen (nicht nur wegen des Titels); ihre Mangold-Zeilen sind `entwurf` oder `verworfen` und zählen nicht.

Zusammenfassung: 1 Konflikt («nur offener Wert»), 6 Plausibilitätsbefunde, 35 Lücken (6 Pflichtgrössen, 1 Stammfeld, 16 Artmerkmale, 10 Kulturform-Felder, 2 Saatempfehlungen), keine Bestätigung innerhalb der Art.

## 1 Konfliktliste

Konflikt-ID in `profilwert_offen.csv` in der Spalte `konflikt_id` gesetzt, nur beim geprüften Kandidaten (die Entwurfszeile derselben `zeile_id` ohne ID). Kein Kandidat ist bevorzugt. «(offen: …)» steht für Zeilen aus `profilwert_offen.csv` mit dem Grund aus Spalte `grund`.

### K-mangold-01 – Phase `keimung`, `keimtemp` – nur offener Wert

| kandidat_id | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| pw.beta_vulgaris_cicla.keimung.keimtemp#2 (offen: Bereich ohne typ) | 15 bis 20 | °C | – | frankiesgarten-keimtemperaturen | C | substrat_inert | andere | – |

Kein ladbarer Kandidat (`keimung.keimtemp#1`, 25 °C, ist `entwurf`). Pflichtgrösse der Phase `keimung` (03_import_w0.md 9); betrifft die Vorabladung der Keimung (8 Nr. 4).

Keine weiteren Konflikte: `keimart`, `wachstum.ph` und alle übrigen Zeilen haben je genau einen geprüften Kandidaten.

## 2 Plausibilität

Umrechnung nur zur Prüfung (03_import_w0.md 6). Mangold hat keinen geprüften EC-Kandidaten; V4, V5 (EC) und die Gegenprobe sind nicht anwendbar. Die Gegenprobe-Tabelle (03_import_w0.md 7) nennt für Beta keinen Vergleichswert; der Vergleich mit Spinat (Wachstum 1.6 mS/cm gesamt) ist mangels Wert nicht möglich. EC-Obergrenze der Kulturgruppe `fuchsschwanz`: 2.0 mS/cm (`kulturgruppe.csv`, Zeile `fuchsschwanz#1`).

| Nr. | kandidat_id | Regel | Wert | Befund |
|---|---|---|---|---|
| P1 | pw.beta_vulgaris_cicla.keimung.keimtemp#2 | Form 4.4.1 (min, typ, max) | 15 bis 20 °C | `wert_typ` fehlt; der Bereich selbst ist geordnet. |
| P2 | pw.beta_vulgaris_cicla.wachstum.ph#1 | Artbezug des Kurzzitats | 5.5 bis 6.0 | Der Wert stammt aus der Kopfsalat-Methode der Quelle, die diese Methode nur pauschal auch für «swiss chard» empfiehlt, sodass kein für Mangold eigens genannter pH vorliegt (V3 und V5 mit Bandbreite 0.5 eingehalten). |
| P3 | pw.beta_vulgaris_cicla.wachstum.ph#1 | Vergleich mit der Kulturgruppe | 5.5 bis 6.0 | Randen (`wachstum.ph#1`, 6.0 bis 6.5) und Spinat (`wachstum.ph#3`, 6.0 bis 7.0) liegen darüber, sodass Mangold mit beiden nur den Punkt 6.0 teilt, obwohl Mangold und Randen zur selben Art Beta vulgaris gehören; ohne Validatorverstoss. |
| P4 | pw.beta_vulgaris_cicla.anzucht.wechselmerkmal#1 | Artbezug des Kurzzitats | «Hat der Sämling drei bis vier echte Blätter?» | Das Umsetzmerkmal steht in der Quelle im Abschnitt Head Lettuce (PDF S. 1) und gilt für Mangold nur über die pauschale Übertragung auf PDF S. 2. |
| P5 | pw.beta_vulgaris_cicla.anzucht.wechselmerkmal#1 gegen anzucht.bbch#1 | Abgleich Wechselmerkmal und BBCH-Ende | drei bis vier Blätter gegen BBCH 14 | Die Frage ist schon bei drei Blättern (BBCH 13) mit Ja zu beantworten, während die BBCH-Zeile die Anzucht erst bei BBCH 14 (vier Blätter) enden lässt. |
| P6 | pw.beta_vulgaris_cicla.anzucht.bbch#1 | Herkunft des Phasenendes, Vergleich mit der Kulturgruppe | 10 bis 14 | Das Ende 14 ist laut Fundstelle eine Zuordnung des Rechercheurs aus dem Umsetzmerkmal einer anderen Quelle (P4), und Randen endet auf derselben Skala «Beet» bei 12 (Spinat auf der Skala «Leaf vegetables» bei 13). |

**Ohne Befund geprüft:** `anwendbar` für alle fünf Phasen (`ja` für Keimung, Anzucht, Wachstum; `entfaellt` für Blüte und Fruchtbildung aus `#2` mit Fundstelle der Art «Beet», PDF S. 41 f., R1.1 Blattgemüse; `#1` mit allgemeiner Skala verworfen); BBCH `keimung` 0 bis 9, `anzucht` 10 bis 14, `wachstum` 15 bis 39 (0 bis 99, lückenlos über die Hauptstadien 0, 1 und 3; Hauptstadium 4 gilt der Rübe); Wechselmerkmale `keimung` und `anzucht` unter 120 Zeichen und als Frage (V10), `wachstum` als letzte anwendbare Phase ohne Wechselmerkmal; `keimart` `dunkel` nur in `keimung` (V8, V12); `wachstum.ph#1` 5.5 bis 6.0 (V3, V5); Stammfelder `name_wiss`, `gbif_key` (GBIF-Status accepted, Rang variety) und `kulturgruppe_id` mit GBIF-Quelle, Klasse C, Vermerk `keine` (4.3).

**Vergleich mit der Kulturgruppe** (geprüfte Zeilen von Spinat und Randen; Randen-Zeilen der Quelle `frankiesgarten-rote-bete-hydroponik` wie geprüft behandelt): `keimart` `dunkel` wie Randen (#1, #2) und Spinat (#1, #2), Spinat #3 `indifferent` steht allein (K-spinat-01); `keimtemp` 15 bis 20 °C stimmt mit Spinat #4 und Randen #3 überein, alle drei aus derselben Tabelle von `frankiesgarten-keimtemperaturen` (keine unabhängige Bestätigung); Randen #1 nennt 20 bis 21 °C, Spinat #1 und #2 25 und 26 °C. `wachstum.ph` siehe P3. Für `dauer` (alle Phasen), `anzucht.ph`, `ec`, `wassertemp` und `licht_h` hat Mangold keine geprüften Kandidaten, ein Vergleich ist nicht möglich.

## 3 Lückenliste

Klasse D, Prüfauftrag. Pflichtgrössen nach `03_import_w0.md` 9; verworfene und Entwurfszeilen zählen nicht. Offene Kandidaten zählen als Kandidaten (keine Lücke), sind aber ohne Entscheid nicht ladbar.

### 3.1 Phasen und Pflichtgrössen (6)

| Nr. | Art | Phase | Grösse | Bemerkung |
|---|---|---|---|---|
| L1 | beta_vulgaris_cicla | keimung | dauer | Pflicht auf Ebene Art; einziger Kandidat `keimung.dauer#1` ist `entwurf` |
| L2 | beta_vulgaris_cicla | anzucht | dauer | Pflicht auf Ebene Art; einziger Kandidat `anzucht.dauer#1` ist `entwurf` |
| L3 | beta_vulgaris_cicla | anzucht | ph | Pflicht auf Ebene Art; kein Kandidat |
| L4 | beta_vulgaris_cicla | anzucht | ec | Pflicht auf Ebene Art; kein Kandidat |
| L5 | beta_vulgaris_cicla | wachstum | dauer | Pflicht auf Ebene Art; einziger Kandidat `wachstum.dauer#1` ist `entwurf` |
| L6 | beta_vulgaris_cicla | wachstum | ec | Pflicht auf Ebene Art; einziger Kandidat `wachstum.ec#1` ist `entwurf` |

Pflichtzeile ohne ladbaren Kandidaten (nur offener Wert, 1): `keimung.keimtemp` (K-mangold-01). Ohne Schliessen von L1 bis L6 lädt der Seed Kulturform-Felder, Saatempfehlungen und `profilwert` der Art nicht (8 Nr. 4); für die Vorabladung der Keimung fehlen `keimung.dauer` (L1) und ein Entscheid zu K-mangold-01.

Vorhanden: alle fünf `anwendbar`, `bbch` in den drei anwendbaren Phasen, `wechselmerkmal` in `keimung` und `anzucht`, `keimart`, `wachstum.ph`. Nicht gezählt (Standardprofil, R1.4): `wassertemp` und `licht_h`.

### 3.2 Stammfelder (1)

| Nr. | Art | Feld | Bemerkung |
|---|---|---|---|
| L7 | beta_vulgaris_cicla | name_de | kein Kandidat; `sorten.csv` ordnet die Sorte über `name_de` «Mangold» zu (4.3.1, 4.6), ohne Zeile bricht der Seed beim Sortenstamm ab |

Vorhanden: `name_wiss`, `gbif_key`, `kulturgruppe_id`.

### 3.3 Artmerkmale (16)

| Nr. | Art | Feld |
|---|---|---|
| L8 | beta_vulgaris_cicla | samentyp (bei Beta laut 4.3.2 «Knäuel»; davon hängt `keimlinge_je_knaeuel` ab) |
| L9 | beta_vulgaris_cicla | standard_keimfaehigkeit |
| L10 | beta_vulgaris_cicla | systemeignung (einziger Kandidat `#1` verworfen, Quelle nicht gefunden) |
| L11 | beta_vulgaris_cicla | liter_je_pflanze |
| L12 | beta_vulgaris_cicla | wasserbedarf_je_pflanze_l |
| L13 | beta_vulgaris_cicla | pflanzen_je_m2 |
| L14 | beta_vulgaris_cicla | wuchshoehe_max_mm |
| L15 | beta_vulgaris_cicla | wuchsform |
| L16 | beta_vulgaris_cicla | photoperiode |
| L17 | beta_vulgaris_cicla | bestaeubung_noetig |
| L18 | beta_vulgaris_cicla | pythium |
| L19 | beta_vulgaris_cicla | schossen_handlung |
| L20 | beta_vulgaris_cicla | umsetzen_ab_d (einziger Kandidat `#1` ist `entwurf`) |
| L21 | beta_vulgaris_cicla | umsetzen_bis_d |
| L22 | beta_vulgaris_cicla | kulturformen_erlaubt (kein Kandidat) |
| L23 | beta_vulgaris_cicla | kulturform_vorgabe (einziger Kandidat `#1` = `schnitt` verworfen) |

Bedingt, nicht gezählt: `keimlinge_je_knaeuel` (wenn `samentyp` Knäuel belegt wird), `kritische_tageslaenge_h` (wenn `photoperiode` `langtag` oder `kurztag` belegt wird). Nicht gezählt: `aussaatfenster_outdoor` (optional).

### 3.4 Kulturform-Felder (10)

Keine der beiden Formen im Auftrag hat einen geprüften Beleg: `kulturformen_erlaubt` fehlt, `kulturform_vorgabe#1` und `ak.schnitt.ernteart#1` sind verworfen, die übrigen `ak.schnitt`-Zeilen sind `entwurf`. Nach Entscheid 0018 entfielen damit beide Formen, und der Art fehlte jede Kulturform; die Felder sind deshalb für beide Formen als Lücke geführt.

| Nr. | Art | Kulturform | Feld |
|---|---|---|---|
| L24 | beta_vulgaris_cicla | schnitt | ernte_ab_d (einziger Kandidat `#1` ist `entwurf`) |
| L25 | beta_vulgaris_cicla | schnitt | ernteart (einziger Kandidat `#1` verworfen) |
| L26 | beta_vulgaris_cicla | schnitt | kulturdauer_typisch_d (einziger Kandidat `#1` ist `entwurf`) |
| L27 | beta_vulgaris_cicla | schnitt | kulturdauer_max_d |
| L28 | beta_vulgaris_cicla | schnitt | entspitzen |
| L29 | beta_vulgaris_cicla | babyleaf | ernte_ab_d |
| L30 | beta_vulgaris_cicla | babyleaf | ernteart |
| L31 | beta_vulgaris_cicla | babyleaf | kulturdauer_typisch_d |
| L32 | beta_vulgaris_cicla | babyleaf | kulturdauer_max_d |
| L33 | beta_vulgaris_cicla | babyleaf | entspitzen |

Bedingt: Wird `ernteart` als `mehrfach` belegt, fehlen bei der Form zusätzlich `ernteintervall_d` und `schnitte_max` (bei `schnitt` beide nur als `entwurf` vorhanden).

### 3.5 Saatempfehlungen (2)

| Nr. | Art | Kulturform | Zeile |
|---|---|---|---|
| L34 | beta_vulgaris_cicla | schnitt | se.beta_vulgaris_cicla.schnitt (kein Kandidat; nach Entscheid 0018 Punkt 4 wäre eine Zeile Klasse D möglich) |
| L35 | beta_vulgaris_cicla | babyleaf | se.beta_vulgaris_cicla.babyleaf (kein Kandidat; ebenso) |

### 3.6 V13

Mangold ist nicht Leitkultur; die Mindestzeilen der Kulturgruppe `fuchsschwanz` behandelt `fachkritik_spinacia_oleracea.md` 3.6.

## 4 Bestätigungen

Keine: Jede Zeile von Mangold hat höchstens einen geprüften Kandidaten. Die Übereinstimmungen mit Spinat und Randen bei `keimart` und `keimtemp` (Abschnitt 2, Vergleich) betreffen andere Arten und stammen für `keimtemp` aus derselben Tabelle.
