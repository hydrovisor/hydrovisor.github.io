# 03 Import der Wissensbasis W0

Stand 1.11.2026 · Teil von Auftrag 2 «Spezifikation», vorab geliefert, damit der W0-Probelauf am 3.11. mit festen Spalten beginnt (Entscheid R10 in `00_rueckfragen.md`). Grundlage: Konzept v1.1 Kapitel 8 und 9, R1.3, R1.4, R12.3; `docs/input/w0_vorgehen.md` mit den Änderungen aus Konzept 9.

**Lesehilfe.** «(A)» ist eine Annahme dieser Spezifikation, die Tim mit der Abnahme bestätigt oder ändert. Spaltennamen sind verbindlich ab dem 3.11.2026; Änderungen danach nur additiv (neue Spalten optional), bis die Spezifikation am 11.11. abgenommen ist. Tabellennamen und Spalten der Datenbank stehen in `02_datenmodell.sql`; dieses Dokument legt die Dateien und ihre Abbildung fest.

## 1 Überblick

| Datei | Wer schreibt | Zieltabellen | Geladen |
|---|---|---|---|
| `data/wissensbasis/kandidaten/*.csv` | W0-Lauf (Rechercheure, Prüfrollen, Redaktor) | keine | nie; Arbeitsstand mit Prüfspalten |
| `data/wissensbasis/freigegeben/quelle.csv` | Redaktor nach Tims Freigabe | quelle | ja |
| `data/wissensbasis/freigegeben/kulturgruppe.csv` | Redaktor nach Tims Freigabe | kulturgruppe | ja |
| `data/wissensbasis/freigegeben/art.csv` | Redaktor nach Tims Freigabe | art, art_kulturform, herkunft | ja |
| `data/wissensbasis/freigegeben/profilwert.csv` | Redaktor nach Tims Freigabe | profilwert (Ebenen art, kulturgruppe, standard) | ja |
| `data/wissensbasis/freigegeben/saatempfehlung.csv` | Redaktor nach Tims Freigabe | saatempfehlung (Ebene art) | ja |
| `data/stammdaten/sorten.csv` | Tim | sorte, saatgut, profilwert (Ebene sorte), quelle (Tüte) | ja |
| `data/stammdaten/duengerschema.csv` | Tim (aus `docs/input/TriPart_hydro_coco.csv`) | duengerschema | ja |
| `data/wissen/wissenseintrag.csv` | Tim, erste Einträge aus dem Düngeplan (W8) | wissenseintrag | ja |

Es bleibt bei den fünf freigegebenen W0-Dateien aus Konzept 9.2. Artmerkmale, Kulturformen und die Herkunft je Feld stehen gemeinsam in `art.csv` (Langform, Abschnitt 4.3); Kulturgruppen- und Standardwerte stehen in `profilwert.csv` mit der Spalte `ebene`. (A) Das weicht vom Wortlaut des Defaults R10(a) ab, der eigene Vorlagen für art_kulturform, herkunft und standard nannte; Konzept 9.2 legt die fünf Dateien fest, und die Langform deckt alle Inhalte ab.

## 2 Gemeinsame Regeln für alle Dateien

1. **Format.** UTF-8 ohne BOM, Trennzeichen Komma, Kopfzeile Pflicht, Zeilenende LF, Felder mit Komma oder Anführungszeichen in `"…"` nach RFC 4180. Dezimalpunkt (6.1), keine Tausendertrennung. Datum `JJJJ-MM-TT`. Wahrheitswerte `ja` oder `nein`. Leeres Feld heisst «kein Wert» (null), nie 0.
2. **Spalten.** Reihenfolge frei, Namen genau wie hier. Eine unbekannte Spalte bricht den Lauf ab (Konzept 9.2); eine fehlende Pflichtspalte ebenso. Die Prüfspalten (Abschnitt 3) sind in `freigegeben/` nicht erlaubt.
3. **Zeilenschlüssel `zeile_id`.** Stabil über alle Fassungen; eine Zeile behält ihre `zeile_id`, auch wenn sich ihr Wert ändert. Aufbau je Datei in Abschnitt 4, nur Kleinbuchstaben, Ziffern, `_`, `-` und `.`, höchstens 120 Zeichen. In einer Datei eindeutig.
4. **Schlüssel der Arten.** `art_id` ist der wissenschaftliche Name in snake_case ohne Autor (Tabelle 4.3.1). `kulturgruppe_id` nach Tabelle 4.2.1.
5. **Aufzählungen.** Werte genau wie in Abschnitt 5; Gross- und Kleinschreibung zählt.
6. **Herkunft.** Jeder Wert in `art.csv`, `profilwert.csv` und `saatempfehlung.csv` trägt `quelle_id`, `fundstelle`, `kurzzitat` und die Evidenzklasse (bei der Saatempfehlung die Klasse der Saatmengen-Skala). Ohne Kurzzitat gilt der Wert als «nicht gefunden» und gehört nicht in `freigegeben/` (Konzept 9.3).
7. **Klasse D** erzeugt keine Zeile (Konzept 9.1). Fehlt ein Wert, fehlt die Zeile; die App vererbt zur Laufzeit.

## 3 Kandidatendateien (`data/wissensbasis/kandidaten/`)

Je freigegebene Datei gibt es eine Kandidatendatei mit demselben Namen und denselben Spalten, dazu am Ende die Prüfspalten:

| Spalte | Inhalt |
|---|---|
| `kandidat_id` | eindeutig je Kandidatenzeile, z. B. `pw.lactuca_sativa.wachstum.ec#2` für die zweite Quelle zum selben Wert |
| `methodenpruefung` | `zugelassen` oder `verworfen: <Grund>` (prüft nur, ob System hydroponisch und Einheit und EC-Basis richtig erfasst sind; rechnet nicht um) |
| `quellenpruefung` | `bestaetigt`, `nicht_gefunden` oder `abweichend: <Wert aus der Quelle>` |
| `abgerufen_am` | Datum des Abrufs durch den Quellenprüfer |
| `konflikt_id` | gleiche ID für konkurrierende Kandidaten desselben Werts, z. B. `K-007` |
| `status` | `entwurf`, `geprueft`, `vorgeschlagen`, `freigegeben`, `verworfen` |
| `freigegeben_am` | Datum von Tims Freigabe |
| `notiz_tim` | Tims Entscheid oder Ergänzung |

Mehrere Kandidaten für denselben Wert haben dieselbe `zeile_id` und verschiedene `kandidat_id`. Freigegeben wird höchstens ein Kandidat je `zeile_id`. Übertragen in `freigegeben/` werden nur Zeilen mit `status = freigegeben`, ohne `kandidat_id` und ohne Prüfspalten, aber mit `freigegeben_am` (Pflicht in `freigegeben/`). Die Kandidatendateien bleiben im Repository (Konzept 9.2). `docs/input/w0_datenvorlage.csv` ist damit ersetzt.

## 4 Freigegebene Dateien

### 4.1 `quelle.csv`

| Spalte | Pflicht | Inhalt |
|---|---|---|
| `zeile_id` | ja | gleich `quelle_id` |
| `quelle_id` | ja | stabil, z. B. `cornell-cea-lettuce-2019` |
| `titel` | ja | |
| `autoren` | nein | |
| `jahr` | nein | vierstellig |
| `link` | ja | URL oder `doi:…` |
| `klasse` | ja | Aufzählung `quelle_klasse` (Abschnitt 5) |
| `anbaumethode` | ja | Aufzählung `system` oder `keine` (Katalog, Tüte) |
| `abgerufen_am` | ja | Datum |
| `freigegeben_am` | ja | Datum |

### 4.2 `kulturgruppe.csv`

| Spalte | Pflicht | Inhalt |
|---|---|---|
| `zeile_id` | ja | gleich `kulturgruppe_id` |
| `kulturgruppe_id` | ja | Tabelle 4.2.1 |
| `name` | ja | deutscher Name |
| `leitkultur_art_id` | ja | Art, die die Gruppe vertritt |
| `ec_obergrenze_validator` | ja | 2.6 bei Fruchtgemüse, sonst 2.0 (Konzept 9.4) |
| `freigegeben_am` | ja | Datum |

**4.2.1 Sechs Kulturgruppen (A).** Das Konzept verlangt sechs Gruppen mit je einer Leitkultur (R1.3), nennt sie aber nicht. Vorschlag für den Probelauf; der W0-Lauf darf Namen ändern, Tim bestätigt:

| `kulturgruppe_id` | Name | Leitkultur | Arten der Startbelegung |
|---|---|---|---|
| `fruchtgemuese` | Fruchtgemüse | `solanum_lycopersicum` | Tomate, Chili |
| `blattsalat` | Blattsalate | `lactuca_sativa` | Salat, Nüsslisalat |
| `kohl` | Kohlgewächse | `brassica_rapa_chinensis` | Pak Choi |
| `kraut_einjaehrig` | Einjährige Kräuter | `ocimum_basilicum` | Basilikum |
| `kraut_ausdauernd` | Ausdauernde Kräuter | `petroselinum_crispum` | Petersilie, Schnittlauch |
| `fuchsschwanz` | Fuchsschwanzgewächse | `spinacia_oleracea` | Spinat, Mangold, Randen |

### 4.3 `art.csv` (Artmerkmale, Kulturformen, Herkunft je Feld)

Langform: eine Zeile je Art, Kulturform und Feld.

| Spalte | Pflicht | Inhalt |
|---|---|---|
| `zeile_id` | ja | `art.<art_id>.<feld>` oder `ak.<art_id>.<kulturform>.<feld>` |
| `art_id` | ja | Tabelle 4.3.1 |
| `kulturform` | nein | leer für Artmerkmale; sonst Aufzählung `kulturform` für Felder aus 4.3.3 |
| `feld` | ja | Feldname aus 4.3.2 oder 4.3.3 |
| `wert` | ja | Wert im Format des Felds |
| `quelle_id` | ja | aus `quelle.csv` |
| `fundstelle` | ja | Seite, Tabelle oder Abschnitt |
| `kurzzitat` | ja | wörtlich, höchstens 200 Zeichen |
| `evidenzklasse` | ja | `A`, `B1`, `B2`, `C` |
| `vermerk` | ja | `keine`, `katalog`, `tuete`, `testbetrieb` |
| `freigegeben_am` | ja | Datum |

Die Stammfelder `name_de`, `name_wiss`, `gbif_key` und `kulturgruppe_id` sind Pflicht für jede geladene Art und tragen als Herkunft die GBIF-Seite (`quelle_id` z. B. `gbif-<key>`, Klasse `C`, Vermerk `keine`).

**4.3.1 Arten der Startbelegung (A).** Zuordnung der deutschen Namen aus `sorten.csv` (Spalte `art`) über `name_de` (Entscheid W13):

| `name_de` | `art_id` | Sorten |
|---|---|---|
| Tomate | `solanum_lycopersicum` | 5 |
| Chili | `capsicum_annuum` | 4 (inkl. Sibirischer Hauspaprika) |
| Basilikum | `ocimum_basilicum` | 2 |
| Pak Choi | `brassica_rapa_chinensis` | 1 |
| Petersilie | `petroselinum_crispum` | 1 |
| Schnittlauch | `allium_schoenoprasum` | 1 |
| Salat | `lactuca_sativa` | 4 (inkl. Babyleaf-Mischung) |
| Nüsslisalat | `valerianella_locusta` | 1 |
| Spinat | `spinacia_oleracea` | 1 |
| Mangold | `beta_vulgaris_cicla` | 1 |
| Randen | `beta_vulgaris_conditiva` | 1 |

**4.3.2 Artmerkmale** (Zeilen ohne `kulturform`; Konzept 8.2 `art`):

| `feld` | Format von `wert` |
|---|---|
| `name_de`, `name_wiss` | Text |
| `gbif_key` | Ganzzahl |
| `kulturgruppe_id` | aus 4.2.1 |
| `samentyp` | Text, z. B. «Knäuel» bei Beta |
| `keimlinge_je_knaeuel` | Zahl, nur bei Knäuelsaat |
| `standard_keimfaehigkeit` | 0.30 bis 0.98 |
| `systemeignung` | `dwc`, `kratky`, `beide` |
| `liter_je_pflanze` | Liter; der Seed setzt `liter_status = testbetrieb_offen` (Konzept 8.2) |
| `wasserbedarf_je_pflanze_l` | Liter über die Kultur (Leitkultur bei Gleichstand, R2.3; Kratky-Kriterium in R3.2) |
| `pflanzen_je_m2` | Zahl |
| `wuchshoehe_max_mm` | Ganzzahl in mm |
| `wuchsform` | `aufrecht`, `buschig`, `haengend`, `rosette` |
| `photoperiode` | `langtag`, `kurztag`, `tagneutral` |
| `kritische_tageslaenge_h` | Stunden, nur bei `langtag` oder `kurztag` |
| `bestaeubung_noetig` | `ja` oder `nein` |
| `pythium` | `hoch`, `mittel`, `gering` |
| `schossen_handlung` | `auskneifen`, `ernten_beenden`, `bluete_nutzen` |
| `aussaatfenster_outdoor` | Monate `von-bis`, z. B. `3-6`; optional |
| `umsetzen_ab_d`, `umsetzen_bis_d` | Tage ab Saat |
| `kulturformen_erlaubt` | Liste aus `kulturform`, mit `;` getrennt |
| `kulturform_vorgabe` | eine Kulturform aus der Liste (R1.2 «Vorgabe aus der Art»; im Konzept-Schema nicht genannt, A) |

**4.3.3 Kulturform-Felder** (Zeilen mit `kulturform`; Konzept 8.2 `art_kulturform`):

| `feld` | Format von `wert` |
|---|---|
| `ernte_ab_d` | Tage ab Umsetzen, bei Direktsaat ab Saat (der Bezug folgt aus dem Satz, nicht aus der Datei) |
| `ernteart` | `einmalig` oder `mehrfach` |
| `ernteintervall_d` | Tage; nur bei `mehrfach` |
| `schnitte_max` | Ganzzahl; nur bei `mehrfach` |
| `kulturdauer_max_d` | Tage ab Saat |
| `kulturdauer_typisch_d` | Tage ab Saat |
| `entspitzen` | `ja` oder `nein` |

Das Phasenprofil-Ende je Kulturform ist eine Seed-Konstante (R1.2) und steht nicht in der Datei.

### 4.4 `profilwert.csv`

Langform: eine Zeile je Ebene, Bezug, Phase und Grösse (Konzept 8.2 `profilwert`).

| Spalte | Pflicht | Inhalt |
|---|---|---|
| `zeile_id` | ja | `pw.<bezug>.<phase>.<groesse>`; bei Ebene `standard` ist `<bezug>` gleich `standard` |
| `ebene` | ja | `art`, `kulturgruppe`, `standard` (die Ebene `sorte` kommt nur aus `sorten.csv` und UC4) |
| `bezug` | ja | `art_id`, `kulturgruppe_id` oder `standard` |
| `phase` | ja | Aufzählung `phase` |
| `groesse` | ja | Aufzählung `groesse` |
| `wert_min`, `wert_typ`, `wert_max` | je Grösse | Tabelle 4.4.1 |
| `text_wert` | je Grösse | Tabelle 4.4.1 |
| `einheit_quelle` | nur `ec` | `mS/cm`, `µS/cm`, `ppm500`, `ppm700`, `cf` |
| `ec_basis` | nur `ec` | `gesamt`, `zuwachs`, `unbekannt` |
| `bezugstemperatur_c`, `bezugs_dli` | nur `dauer`, optional | aus der Quelle, sonst leer |
| `system_quelle` | ja | Aufzählung `system` |
| `umgebung_quelle` | ja | `indoor_led`, `gewaechshaus`, `andere` |
| `quelle_id`, `fundstelle`, `kurzzitat` | ja | |
| `evidenzklasse` | ja | `A`, `B1`, `B2`, `C` |
| `vermerk` | ja | `keine`, `katalog`, `tuete`, `testbetrieb` |
| `freigegeben_am` | ja | Datum |

**4.4.1 Grössen und ihre Werte.**

| `groesse` | Werte | Regel |
|---|---|---|
| `anwendbar` | `text_wert` = `ja` oder `entfaellt` | je Art genau eine Zeile für jede der fünf Phasen; bei Blattgemüse und Kräutern `entfaellt` für Blüte und Fruchtbildung (R1.1) |
| `dauer` | `wert_min`, `wert_typ`, `wert_max` in ganzen Tagen ab Phasenbeginn | min ≤ typ ≤ max, alle über 0; andere Bezugspunkte rechnet die Vorlage vorher um (9.2) |
| `bbch` | `wert_min` = BBCH von, `wert_max` = BBCH bis | 0 bis 99 |
| `wechselmerkmal` | `text_wert`, höchstens 120 Zeichen, als Frage formulierbar | |
| `ph` | `wert_min`, `wert_max`, optional `wert_typ` | |
| `ec` | `wert_min`, `wert_max` als Rohwert in `einheit_quelle`, dazu `ec_basis` | der Seed rechnet um (Abschnitt 6), nie die Rechercheure |
| `licht_h` | `wert_min`, `wert_max` in Stunden | |
| `wassertemp` | `wert_min`, `wert_max` in °C | |
| `keimart` | `text_wert` = `licht`, `dunkel`, `indifferent` | nur Phase `keimung`; `indifferent` belegt die Box der Lichtkeimer vor (A) |
| `keimtemp` | `wert_min`, `wert_typ`, `wert_max` in °C | nur Phase `keimung` |

**4.4.2 Mindestzeilen je Kulturgruppe.** Damit eine neue Art aus UC4 (nur Artmerkmale, Sollwerte vererbt als Klasse D, 8.1 Regel 6) Phasen, Termine und Sollbereiche hat, trägt jede Kulturgruppe für jede der fünf Phasen `anwendbar` und für jede anwendbare Phase `dauer`, `bbch` und `wechselmerkmal`, ausser in `keimung` auch `ph` und `ec`; in `keimung` gibt es auf Ebene Kulturgruppe weder `ph` noch `ec`, damit bei Direktsaat die Bewertung gegen den Schnappschuss des Ansatzes greift (`01_fachregeln.md` R2.2, Abschnitt 9). Quelle ist in der Regel die Leitkultur der Gruppe mit ihrer Fundstelle. Der Validator prüft das (V13). In der App zeigen diese Werte immer «Prüfauftrag» (Klasse D, R1.3). Die Artmerkmale einer neuen Art übernimmt `wissen_app_schreiben('art_neu')` von der Leitkultur der Gruppe: `kulturformen_erlaubt`, `kulturform_vorgabe`, `umsetzen_ab_d`, `umsetzen_bis_d`, `systemeignung`, `standard_keimfaehigkeit` und alle gültigen `art_kulturform`-Zeilen, mit Herkunft der Leitkultur und Vermerk `leitkultur` («Prüfauftrag»). Die Saatempfehlung einer neuen Sorte legt `saatempfehlung_neu` an (Klasse C aus der Tüte mit Quelle `tuete-<sorte_key>` oder D ohne Quelle, R12.3); Tim bestätigt sie in der Maske Sorten.

Die Keimdauer ist die Grösse `dauer` der Phase `keimung` (Konzept 8.2 `art`). Für Ebene `standard` sind nur `ph`, `wassertemp` und `licht_h` erlaubt (R1.3, Check-Constraint). Phasenwerte für Licht, Luftfeuchte, Lufttemperatur und DLI gibt es nicht (Erratum E1).

### 4.5 `saatempfehlung.csv`

| Spalte | Pflicht | Inhalt |
|---|---|---|
| `zeile_id` | ja | `se.<bezug>.<kulturform>` |
| `ebene` | ja | `art` oder `sorte` (R12.3: je Sorte oder Art) |
| `bezug` | ja | `art_id` oder `zeile_id` der Sorte aus `sorten.csv` |
| `kulturform` | ja | Aufzählung `kulturform` |
| `samen_je_schwamm` | ja | Ganzzahl ≥ 1 |
| `obergrenze_samen` | ja | Ganzzahl ≥ `samen_je_schwamm` |
| `pflanzen_stehen_lassen` | ja | Ganzzahl ≥ 1 (Büschel > 1, z. B. Petersilie 15) |
| `klasse_saatmenge` | ja | `A`, `B`, `C`, `D` nach R12.3 |
| `substrat_passung` | ja | Text zur «Passung» aus 9.2: Substrat und Grösse der Quelle gegen Würfel 2.2 cm |
| `quelle_id`, `fundstelle`, `kurzzitat` | ja, ausser Klasse D | |
| `begruendung` | ja | ein Satz |
| `freigegeben_am` | ja | Datum |

Für Zeilen aus der Datei setzt der Seed `bestaetigt_am = freigegeben_am`, weil Tims Freigabe die Bestätigung ist (A); sonst wäre die Vollständigkeit der 22 Sorten bis zur Gesamtfreigabe am 20.12. nicht erreichbar, denn die Maske UC4 kommt erst in I2. Neue Sorten bestätigt Tim in der App (UC4, R1.4). Entschieden und deshalb als erste Zeilen zu führen: Petersilie 15 Samen je Schwamm; Tomaten 1 Pflanze je Topf; Eissalat Roxette als Schnittsalat (R12.3).

### 4.6 `data/stammdaten/sorten.csv`

Spalten wie die Datei vom 31.10.2026: `zeile_id, name, art, kulturtyp, shop_link, keimart_tuete, keimtemperatur_tuete, wuchshoehe_max_mm, wuchsform, fruehzeitigkeit_relativ, katalog_quelle, kaufdatum, keimfaehigkeit_packung, bestand_korn`.

| Spalte | Abbildung |
|---|---|
| `zeile_id`, `name`, `shop_link`, `kulturtyp` | `sorte` |
| `art` | `sorte.art_id` über `art.name_de`; unbekannter Name bricht ab |
| `wuchshoehe_max_mm`, `wuchsform`, `fruehzeitigkeit_relativ` | `sorte`, Herkunft `katalog_quelle` (Klasse C, Vermerk `katalog`) |
| `keimart_tuete` (`licht`, `dunkel`, `indifferent`), `keimtemperatur_tuete` (`min-max` in °C) | `profilwert` Ebene `sorte`, Phase `keimung`, Klasse C, Vermerk `tuete`; Quelle `tuete-<sorte_key>` (= `zeile_id` der Sorte) legt der Seed an, gleich wie `wissen_app_schreiben()` |
| `katalog_quelle` | `quelle_id` aus `quelle.csv` |
| `kaufdatum`, `keimfaehigkeit_packung`, `bestand_korn` | eine Zeile `saatgut` je Sorte |

Leere Felder werden nicht geladen; dann gilt die Art (Konzept 8.4, Entscheid R9). Sorten aus UC4 haben keine Zeile in der Datei: Der Client erzeugt die `sorte_id`, `sorte_neu` übernimmt sie als `sorte_schluessel.id` und setzt `sorte_key` = `zeile_id` = `app-<sorte_id>`; die Tüten-Quelle heisst dann `tuete-app-<sorte_id>`. `kulturtyp` von Mangold und Randen ist `blatt` (Entscheid W6); das I0-Seed-Paket trägt es in `sorten.csv` nach, weil `sorte.kulturtyp` Pflicht ist (UC4-AK4).

### 4.7 `data/stammdaten/duengerschema.csv`

Spalten wie `docs/input/TriPart_hydro_coco.csv` (`zeile_id, stadium, grow_ml_l, micro_ml_l, bloom_ml_l, summe_ml_l, ec_richtwert_min_ms_cm, ec_richtwert_max_ms_cm, ec_basis, herkunft`), dazu nach 8.1 Regel 4 `quelle_id` (Eintrag in `quelle.csv`, z. B. `terra-aquatica-tripart-2022`, Klasse `hersteller`), `fundstelle` («Tabelle Hydro/Coco»), `kurzzitat` und `evidenzklasse` (`B2`); die bisherige Freitextspalte `quelle` entfällt. Tim übernimmt die Datei geprüft (Konzept 8.2). Zuordnung der Spalte `stadium` zum Enum: «1. Wurzeln / Keimung» → `wurzeln_keimung`, «1. echte Blätter» → `echte_blaetter`, «Wachstum» → `wachstum`, «Vorblüte» → `vorbluete`, «Blüte / Frucht» → `bluete_frucht`, «Reife» → `reife`; ein anderer Wert bricht ab. Die Zuordnung Phase zu Stadium (R4.3) mit der Einwurzel-Dauer 7 Tage und die vier Produkte (Grow 3-1-6, Micro Hard Water 5-0-1, Bloom 0-5-4, pH-Minus TA pH Down mit Konzentration leer) sind Seed-Konstanten. Der Seed prüft `summe_ml_l` gegen die Summe der drei Dosen (±0.01).

### 4.8 `data/wissen/wissenseintrag.csv`

| Spalte | Pflicht | Inhalt |
|---|---|---|
| `zeile_id` | ja | `we.<bezug>.<phase oder thema>.<laufnummer>` |
| `ebene` | ja | `art`, `kulturgruppe`, `allgemein` |
| `bezug` | ja | `art_id`, `kulturgruppe_id` oder `allgemein` |
| `phase` | nein | Aufzählung `phase` |
| `typ` | ja | Aufzählung `wissenseintrag_typ` (Konzept 8.2) |
| `text` | ja | höchstens 600 Zeichen; keine Erwähnung von KCl oder Lagerlösung |
| `quelle_id`, `fundstelle`, `kurzzitat` | ja | nach 8.1 Regel 4 |
| `evidenzklasse` | ja | `A`, `B1`, `B2`, `C` |

## 5 Aufzählungen

| Name | Werte |
|---|---|
| `phase` | `keimung`, `anzucht`, `wachstum`, `bluete`, `fruchtbildung_reife` |
| `groesse` | `anwendbar`, `dauer`, `bbch`, `wechselmerkmal`, `ph`, `ec`, `licht_h`, `wassertemp`, `keimart`, `keimtemp` |
| `kulturform` | `keimling`, `babyleaf`, `schnitt`, `kopf`, `dauerkultur_blatt`, `dauerkultur_frucht` |
| `system` | `dwc`, `kratky`, `nft`, `ebbe_flut`, `substrat_inert`, `keine` |
| `quelle_klasse` | `peer_review`, `universitaet_beratung`, `hersteller`, `praxis`, `katalog`, `tuete`, `app` |
| `wissenseintrag_typ` | `naehrstoffe`, `duengerkomponenten`, `typischer_fehler`, `mangelbild`, `warnregel`, `ernte`, `sondenpflege`, `kratky_pegel`, `wurzelfarbe`, `topf_umsetzen`, `boxen_einzeln`, `stromausfall`, `schossen`, `entspitzen`, `bestaeubung`, `wochenfahrplan` |

## 6 Umrechnung und Gesamt-EC

Der Seed speichert den Rohwert unverändert (`ec_min_quelle`, `ec_max_quelle`, `ec_einheit_quelle`, `ec_basis_quelle`) und daneben `wert_min` und `wert_max` in mS/cm: µS/cm geteilt durch 1000, ppm500 durch 500, ppm700 durch 700, CF durch 10, auf drei Dezimalen gerundet (Konzept 9.3). Die Basis bleibt erhalten; die Gesamt-EC entsteht erst zur Laufzeit je Anlage mit `ec_gesamt()` (Basis `zuwachs` addiert ECWasser, `unbekannt` rechnet als `gesamt` mit dem Hinweis «EC-Basis unklar»; Konzept 8.3).

## 7 Validator

Der Validator läuft vor jedem Laden und als eigener Befehl ohne Datenbank (`npm run w0:pruefen`, ab dem Seed-Paket in I0; bis dahin prüfen die W0-Rollen die Regeln von Hand). Er prüft `freigegeben/` immer, `kandidaten/` auf Wunsch. Jeder Verstoss bricht das Laden ab und nennt Datei, `zeile_id`, Regel und Wert.

| Nr. | Regel | Quelle |
|---|---|---|
| V1 | Spalten nach Abschnitt 4, keine unbekannten, keine fehlenden Pflichtspalten | 9.2 |
| V2 | `zeile_id` je Datei eindeutig; Fremdschlüssel (`quelle_id`, `art_id`, `kulturgruppe_id`) vorhanden | 8.1 |
| V3 | pH-Sollbereich innerhalb 5.2 bis 7.0 | 9.4 |
| V4 | EC (umgerechnet in mS/cm, ohne Leitungswasser) mindestens 0.4 und höchstens `ec_obergrenze_validator` der Kulturgruppe (2.6 Fruchtgemüse, 2.0 übrige) | 9.4 |
| V5 | Bandbreite von pH und EC je 0.2 bis 1.2 | 9.4 |
| V6 | Dauer min ≤ typ ≤ max, alle über 0 | 9.4 |
| V7 | Wassertemperatur 10 bis 28 °C; Lichtstunden 0 bis 24 | 9.4 |
| V8 | Ebene `standard` nur `ph`, `wassertemp`, `licht_h`; `keimart` und `keimtemp` nur in Phase `keimung`; `einheit_quelle` und `ec_basis` genau bei `ec` | R1.3 |
| V9 | Jede Zeile hat `quelle_id`, `fundstelle`, `kurzzitat`, `evidenzklasse` (Saatempfehlung Klasse D ausgenommen); keine Evidenzklasse `D` | 9.1, 9.5 |
| V10 | `wechselmerkmal` höchstens 120 Zeichen; `wissenseintrag.text` höchstens 600 Zeichen ohne «KCl» und «Lagerlösung» | R1.1, R7.2 |
| V11 | `kulturform_vorgabe` liegt in `kulturformen_erlaubt`; `ernteintervall_d` und `schnitte_max` nur bei `mehrfach` | R1.2 |
| V12 | Aufzählungswerte nach Abschnitt 5 | 8.2 |
| V13 | Jede Kulturgruppe hat die Mindestzeilen nach 4.4.2; `ph` und `ec` der Ebene Kulturgruppe in Phase `keimung` brechen ab | 8.1 Regel 6, R1.3, R2.2 |

**Gegenprobe (Konflikt statt Abbruch, Konzept 9.4).** Weicht die Bandmitte eines freigegebenen EC-Werts einer Art der ersten Runde, als Gesamt-EC mit ECWasser 0.5 gerechnet, um mehr als 0.4 mS/cm von der Ziel-EC des Düngeplans V1.6 Abschnitt 4 ab, meldet der Validator einen Konflikt für Tim und lädt trotzdem. Vergleichswerte (A, aus dem Düngeplan; Phase `anzucht` gegen «1. echte Blätter» bzw. «Jungpflanze»):

| Art | Anzucht | Wachstum | Blüte | Fruchtbildung |
|---|---|---|---|---|
| Tomate | 1.0 | 1.5 | 1.9 | 2.1 |
| Chili | 1.1 | 1.7 | 1.9 | 2.1 |
| Basilikum, Pak Choi | 1.0 | 1.4 | – | – |
| Petersilie, Schnittlauch | – | 1.3 | – | – |
| Salat (Schnitt) | 1.0 | 1.2 | – | – |
| Salat (Babyleaf), Nüsslisalat | – | 1.0 | – | – |
| Spinat | – | 1.6 | – | – |

## 8 Laden (Seed)

1. **Aufruf.** `npm run seed -- --ziel lokal|dev` von Hand; in Produktion nur aus `deploy.yml` nach der Migration unter derselben Freigabe (Annahme 6 in `00_rueckfragen.md`). Verbindung über die Datenbank-URL des Ziels mit Service-Rolle; die App schreibt nie in Wissenstabellen ausser über `wissen_app_schreiben()` (8.1 Regel 6).
2. **Reihenfolge, eine Transaktion je Lauf:** quelle → kulturgruppe → art mit herkunft → art_kulturform → profilwert → sorte, saatgut, profilwert der Ebene sorte → saatempfehlung → duengerschema und produkt → wissenseintrag → Seed-Konstanten (Messgerät, Pflichtgrössen, Phasenprofil-Ende, k-Startwerte, feste Kalibriertermine, `stationsgrenze_ab`, Auswertungsfenster). Schlägt ein Schritt fehl, bleibt die Datenbank unverändert.
3. **Versionierung (8.1 Regel 4).** Je `zeile_id` vergleicht der Seed den Inhalt mit der gültigen Fassung (`gueltig_bis is null`). Gleich: nichts. Geändert: alte Fassung erhält `gueltig_bis = jetzt`, neue Fassung `gueltig_ab = jetzt`. Neu: anlegen. In der Datei nicht mehr vorhanden: `gueltig_bis = jetzt`. Jede Fassung trägt `quelldatei`, `zeile_id`, `commit` (Git-Hash des Laufs) und `freigegeben_am`. Kein Update, kein Löschen.
4. **Teilfreigabe je Art (9.5).** Artmerkmale (`art.csv`, Zeilen ohne Kulturform) werden immer geladen, sobald die Stammfelder vorliegen, damit Sorten darauf verweisen können (A: löst den Widerspruch zwischen «Art nur geladen, wenn alle Phasen freigegeben» in 8.4 und dem vorab geladenen Sortenstamm im selben Abschnitt). Kulturform-Felder, Saatempfehlungen und `profilwert` einer Art lädt der Seed erst, wenn für alle fünf Phasen eine Zeile `anwendbar` vorliegt und jede anwendbare Phase ihre Pflichtgrössen hat (Abschnitt 9). Ausnahme: Zeilen der Phase `keimung` (`keimart`, `keimtemp`, `dauer`) gehen für die Arten der ersten Runde vorab mit dem Sortenstamm (bis 15.12., Konzept 8.4). Nicht geladene Arten nennt der Bericht.
5. **«Sollwert geändert: messen».** Wird eine gültige Fassung von `profilwert` ersetzt oder geschlossen, schreibt der Seed je betroffener Art oder Sorte ein Ereignis `sollwert_geaendert` (Bezug Art oder Sorte, `app_version` = `seed@<commit>`); das Aufgabenmodul leitet daraus die Gefässe mit Pflanzungen dieser Art ab (R5.2). Nicht beim ersten Laden einer Zeile.
6. **Zähltest nach dem Laden.** Je Datei: Zeilen in der Datei (nach Teilfreigabe) = gültige Fassungen in der Datenbank. `sorten.csv`: 22 Sorten und 22 Packungen. Abweichung bricht ab (Rollback).
7. **Bericht** auf der Konsole und als `seed-bericht.md` (nicht versioniert): geladene, geänderte, geschlossene Zeilen je Datei; nicht geladene Arten mit Grund; Konflikte der Gegenprobe; Vollständigkeit je Sorte aus `v_vollstaendigkeit` mit Zahl der Prüfaufträge. Mit `--gesamtfreigabe` (ab 20.12.) bricht eine unvollständige Sorte ab, sonst nur Meldung. Ebenso bricht die Gesamtfreigabe ab, wenn eine Art und Phase der Startbelegung keine gültige Wissenskarte auf Ebene Art oder Kulturgruppe hat (UC12-AK1, R7.2); der Bericht nennt diese Lücken in jedem Lauf im Abschnitt «Wissenskarten fehlen» (Plan 40). Startbelegung sind die Arten mit gültiger Sorte und nicht stornierter Packung, ihre Phasen die mit «anwendbar = ja» nach `v_sollwert`.

## 9 Pflichtgrössen (Seed-Konstante `pflichtgroesse`, A)

R1.4 nennt die Tabelle, aber nicht ihren Inhalt. Vorschlag:

| Phase | Pflichtgrössen | mindestens auf Ebene Art |
|---|---|---|
| `keimung` | `anwendbar`, `dauer`, `bbch`, `keimart`, `keimtemp`, `wechselmerkmal` | `dauer` |
| `anzucht` | `anwendbar`, `dauer`, `bbch`, `ph`, `ec`, `wechselmerkmal` | `dauer`, `ph`, `ec` |
| `wachstum`, `bluete`, `fruchtbildung_reife` | `anwendbar`, `dauer`, `bbch`, `ph`, `ec`, `wechselmerkmal` | `dauer`, `ph`, `ec` |

`wechselmerkmal` entfällt in der letzten anwendbaren Phase einer Art. `wassertemp` und `licht_h` sind keine Pflichtgrössen, weil das Standardprofil sie liefert; ohne Wert auf Sorte oder Art zählen sie als Prüfauftrag (R1.4). In der Phase `keimung` gibt es keine pH- und EC-Pflicht, weil die Würfel nur angefeuchtet werden (R4.3) und der Neuansatz bei Direktsaat mit der Phase Wachstum rechnet (R2.2); die Bewertung von Messungen bei Direktsaat vor der Bestätigung «anzucht» läuft gegen den Schnappschuss des Ansatzes (`01_fachregeln.md` R2.2, A).

## 10 Tests (Auszug für `06_tests.md`)

- [Unit] Validator: je Regel V1 bis V13 ein Fall, der abbricht, und einer, der durchgeht; Gegenprobe Tomate Wachstum Bandmitte 2.0 gesamt → Konflikt, 1.8 → kein Konflikt.
- [Unit] Umrechnung: 1400 µS/cm → 1.400; 700 ppm500 → 1.400; 980 ppm700 → 1.400; CF 14 → 1.400.
- [SQL] Zähltest und Idempotenz: zweiter Lauf mit unveränderten Dateien ändert keine Zeile; geänderter Wert erzeugt genau eine geschlossene und eine neue Fassung und ein Ereignis `sollwert_geaendert`.
- [SQL] Teilfreigabe: Art mit fehlender Phase `bluete` lädt nur Artmerkmale und Keimungswerte; `v_sollwert` vererbt die übrigen Werte über Kulturgruppe oder Standard mit Evidenzklasse D.
- [SQL] Unbekannte Spalte, unbekannter Artname in `sorten.csv`, Ebene `standard` mit Grösse `ec` → Abbruch ohne Änderung.
