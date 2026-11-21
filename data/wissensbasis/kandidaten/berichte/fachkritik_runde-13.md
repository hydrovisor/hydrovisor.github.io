# Fachkritik W0 Runde 13 (#258): Umsetztag und übrige Erntewerte

Stand 21.11.2026. Gegenstand: die 23 Zeilen mit `status = geprueft` und `abgerufen_am = 2026-11-21` in `data/wissensbasis/kandidaten/teile/{kraut_einjaehrig,kraut_ausdauernd,fuchsschwanz,fruchtgemuese}/art.csv` (Basilikum, Petersilie, Schnittlauch, Mangold, Randen, Spinat, Tomate). Vergleich gegen `data/wissensbasis/freigegeben/art.csv` und die Phasendauern in `freigegeben/profilwert.csv`. Bezug nach `docs/spec/03_import_w0.md` 4.3.2 und 4.3.3: `umsetzen_ab_d`, `umsetzen_bis_d`, `kulturdauer_max_d` und `kulturdauer_typisch_d` Tage ab Saat, `ernte_ab_d` Tage ab Umsetzen (bei Direktsaat ab Saat). Wochenwerte sind roh (Einheit am Anfang von `fundstelle`) und hier nur zum Prüfen nach D4 umgerechnet (7 · Wochen); in den Dateien bleiben die Rohwerte. Zeilen mit «Lesekopie» sind wie alle anderen behandelt. Die Quellenzeilen aller Kandidaten haben in `quelle.csv` den Status `geprueft` oder `freigegeben` (bei `agriculture-spinat-rauke-floating-2021` die neue Zeile vom 21.11.2026), alle Kandidaten sind also wählbar. `quelle.csv` führt keine Umgebung; sie stammt aus der `fundstelle`.

Bezugswerte der App (freigegeben, Keimung typ plus Anzucht typ = Tag, an dem die App das Umsetzen erwartet; in Klammern min-Summe bis max-Summe):

| Art | Keimung min/typ/max | Anzucht min/typ/max | Wachstum min/typ/max | Umsetzen nach Phasen |
|---|---|---|---|---|
| ocimum_basilicum | 5/9/14 | 7/18/23 | 18/23/50 | 27 (12 bis 37) |
| petroselinum_crispum | 7/14/18 | 6/7/9 | 28/28/42 | 21 (13 bis 27) |
| allium_schoenoprasum | 7/10/14 | 18/21/34 | 32/40/50 | 31 (25 bis 48) |
| beta_vulgaris_cicla | 1/4/7 | 10/16/20 | 24/30/38 | 20 (11 bis 27) |
| beta_vulgaris_conditiva | 2/3/4 | 8/10/13 | 14/17/21 | 13 (10 bis 17) |
| spinacia_oleracea | 5/7/10 | 7/10/14 | 21/24/28 | 17 (12 bis 24); `art.umsetzen_ab_d` 9 freigegeben |
| solanum_lycopersicum | 6/8/10 | 17/21/26 | 16/28/35 | 29; `art.umsetzen_ab_d` 10, `umsetzen_bis_d` 16 freigegeben |

Freigegebene Kulturform-Werte, die hier berührt werden: Basilikum Dauerkultur `ernte_ab_d` 18 (frontiers-basilikum-raft-sorten-2021), `ernteintervall_d` 21; Petersilie Dauerkultur `ernte_ab_d` 28 (plos-one-dill-petersilie-2021), `ernteintervall_d` 7; Schnittlauch Dauerkultur `kulturdauer_max_d` 730; Mangold Schnitt `ernte_ab_d` 19; Spinat Babyleaf `ernte_ab_d` 14 (Direktsaat), `kulturdauer_typisch_d` 16, Kopf `ernte_ab_d` 64, `kulturdauer_typisch_d` 64, Schnitt `schnitte_max` 3, `ernteintervall_d` 7; Tomate Dauerkultur `ernte_ab_d` 71, `kulturdauer_max_d` 364; Chili Dauerkultur `ernteintervall_d` 7.

## Geprüfte Kandidaten

| Art | Kulturform | Feld | `kandidat_id` | Rohwert | geprüft als | Quelle | Klasse | `konflikt_id` |
|---|---|---|---|---|---|---|---|---|
| ocimum_basilicum | – | umsetzen_ab_d | `art.ocimum_basilicum.umsetzen_ab_d#1` | 15 | 15 d | frontiers-basilikum-raft-sorten-2021 | A | K-basilikum-14 |
| ocimum_basilicum | – | umsetzen_ab_d | `…#2` | 18 | 18 d | frontiers-2022-basilikum-hydrolysat-raft | A | K-basilikum-14 |
| ocimum_basilicum | – | umsetzen_ab_d | `…#3` | 2 (Wochen) | 14 d | plos-one-basilikum-saemlingsumgebung-2022 | A | K-basilikum-14 |
| ocimum_basilicum | – | umsetzen_ab_d | `…#4` | 2 (Wochen) | 14 d | isu-ph-kraeuter-2025 | B1 | K-basilikum-14 |
| ocimum_basilicum | – | umsetzen_ab_d | `…#5` | 14 | 14 d | isu-diss-kraeuter-licht-2019 | B1 | K-basilikum-14 |
| ocimum_basilicum | – | umsetzen_ab_d | `…#6` | 2 (Wochen) | 14 d | isu-ms-basilikum-systeme-2015 | B1 | K-basilikum-14 |
| ocimum_basilicum | – | umsetzen_ab_d | `…#8` | 3 (Wochen) | 21 d | crc-hydroponik-heimgaertner-2015 | C | K-basilikum-14 |
| petroselinum_crispum | – | umsetzen_ab_d | `art.petroselinum_crispum.umsetzen_ab_d#1` | 5 (Wochen) | 35 d | plos-one-dill-petersilie-2021 | A | K-petersilie-15 |
| petroselinum_crispum | – | umsetzen_ab_d | `…#2` | 3 (Wochen) | 21 d | isu-ph-kraeuter-2025 | B1 | K-petersilie-15 |
| petroselinum_crispum | – | umsetzen_ab_d | `…#3` | 3 (Wochen) | 21 d | isu-diss-kraeuter-licht-2019 | B1 | K-petersilie-15 |
| petroselinum_crispum | – | umsetzen_ab_d | `…#6` | 3 (Wochen) | 21 d | agronomy-ec-kraeuter-2019 | A | K-petersilie-15 |
| petroselinum_crispum | – | umsetzen_ab_d | `…#7` | 21 | 21 d | horttech-34-saatdichte-petersilie-2024 | A | K-petersilie-15 |
| allium_schoenoprasum | – | umsetzen_ab_d | `art.allium_schoenoprasum.umsetzen_ab_d#2` | 4 (Wochen) | 28 d | simplyhydro-schnittlauch | C | – |
| allium_schoenoprasum | – | umsetzen_bis_d | `art.allium_schoenoprasum.umsetzen_bis_d#1` | 6 (Wochen) | 42 d | simplyhydro-schnittlauch | C | – |
| beta_vulgaris_cicla | – | umsetzen_ab_d | `art.beta_vulgaris_cicla.umsetzen_ab_d#2` | 21 | 21 d | horticulturae-mangold-meerwasser-2022 | A | – |
| beta_vulgaris_cicla | – | umsetzen_bis_d | `art.beta_vulgaris_cicla.umsetzen_bis_d#1` | 28 | 28 d | hortsci-mangold-nft-2025 | A | – |
| beta_vulgaris_cicla | schnitt | ernte_ab_d | `ak.beta_vulgaris_cicla.schnitt.ernte_ab_d#5` | 28 | 28 d ab Umsetzen | horticulturae-mangold-meerwasser-2022 | A | K-mangold-02 |
| beta_vulgaris_cicla | schnitt | ernteintervall_d | `ak.beta_vulgaris_cicla.schnitt.ernteintervall_d#3` | 14 | 14 d | horticulturae-mangold-meerwasser-2022 | A | – |
| beta_vulgaris_conditiva | – | umsetzen_ab_d | `art.beta_vulgaris_conditiva.umsetzen_ab_d#2` | 9 | 9 d | hortbras-randen-babyleaf-nft-2014 | A | – |
| spinacia_oleracea | schnitt | ernte_ab_d | `ak.spinacia_oleracea.schnitt.ernte_ab_d#2` | 34 | 34 d ab Umsetzen | agriculture-spinat-rauke-floating-2021 | A | – |
| spinacia_oleracea | schnitt | schnitte_max | `ak.spinacia_oleracea.schnitt.schnitte_max#4` | 5 | 5 | agriculture-spinat-rauke-floating-2021 | A | K-spinat-09 |
| spinacia_oleracea | babyleaf | kulturdauer_max_d | `ak.spinacia_oleracea.babyleaf.kulturdauer_max_d#3` | 46 | 46 d ab Saat | agriculture-spinat-rauke-floating-2021 | A | – |
| solanum_lycopersicum | dauerkultur_frucht | ernteintervall_d | `ak.solanum_lycopersicum.dauerkultur_frucht.ernteintervall_d#1` | 7 | 7 d | jksus-tomate-salinitaet-hydroponik-2023 | A | – |

Die Lesekopie `adv-hort-sci-27-basilikum-nft-2013` hat in `art.csv` keine neue geprüfte Zeile ergeben (Basilikum Dauerkultur `ernte_ab_d` und Kulturende bleiben wie bisher).

## Konfliktliste

Vier Konflikte, davon zwei mit einem freigegebenen Wert. `konflikt_id` ist in den Teil-Dateien gesetzt (`teile/kraut_einjaehrig/art.csv`, `teile/kraut_ausdauernd/art.csv`, `teile/fuchsschwanz/art.csv`); bei den Konflikten mit freigegebenem Wert steht sie auch auf der freigegebenen Kandidatenzeile in `teile/` (nicht in `freigegeben/`). Nummern fortlaufend nach den bestehenden (höchste bisher: K-basilikum-13, K-petersilie-14, K-mangold-01, K-spinat-08). Kein Konflikt entschieden; «passt zur Anlage» bezieht sich auf Tims Regal (Indoor mit LED, DWC und Kratky, Anzucht in Würfeln, danach Umsetzen).

### K-basilikum-14: ocimum_basilicum, Art, `umsetzen_ab_d`

| `kandidat_id` | Rohwert | Einheit | Basis (Bezug) | geprüft als | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `art.ocimum_basilicum.umsetzen_ab_d#1` | 15 | Tage | ab Saat bis Einsetzen in das Floating Raft; Anzuchtsubstrat nicht genannt | 15 d | frontiers-basilikum-raft-sorten-2021 | A (peer_review) | Floating Raft (quelle.csv: dwc) | Glasgewächshaus | 2021 |
| `…#2` | 18 | Tage | ab Saat, beim Stadium 2–3 echte Blätter in Polystyrolplatten umgesetzt | 18 d | frontiers-2022-basilikum-hydrolysat-raft | A (peer_review) | Floating Raft (dwc) | Gewächshaus, Sommer | 2022 |
| `…#3` | 2 | Wochen | ab Saat; Anzucht in Steinwollwürfeln 2.5 × 2.5 × 4 cm in Klimakammern mit LED, dann Deep-Flow | 14 d | plos-one-basilikum-saemlingsumgebung-2022 | A (peer_review) | Deep-Flow (dwc) | Anzucht Klimakammer LED, Kultur Glasgewächshaus | 2022 |
| `…#4` | 2 | Wochen | ab Saat; Phenolschaum-Würfel (Oasis) in Klimakammer, dann DFT | 14 d | isu-ph-kraeuter-2025 | B1 (universitaet_beratung) | DFT (dwc) | Klimakammer | 2025 |
| `…#5` | 14 | Tage | ab Saat; Oasis-Würfel in Klimakammer, dann DFT (Kap. 3 derselben Arbeit: «2 (basil) … weeks») | 14 d | isu-diss-kraeuter-licht-2019 | B1 (universitaet_beratung) | DFT (dwc) | Klimakammer | 2019 |
| `…#6` | 2 | Wochen | ab Saat; Oasis-Würfel in Klimakammer, dann NFT oder DFT | 14 d | isu-ms-basilikum-systeme-2015 | B1 (universitaet_beratung) | NFT und DFT (quelle.csv: dwc) | Anzucht Klimakammer, Kultur nicht genannt | 2015 |
| `…#8` | 3 | Wochen | ab Saat; Nachsaat in 1-Zoll-Steinwollwürfel drei Wochen vor dem Ersatz der alten Pflanzen | 21 d | crc-hydroponik-heimgaertner-2015 | C (praxis) | Raft und NFT (quelle.csv: substrat_inert) | nicht genannt | 2015 |

Passt zur Anlage: am ehesten die 14-d-Gruppe #3 bis #6 (Anzucht in Würfeln, danach DWC/DFT; #3 mit LED-Anzucht, Klasse A); #1 ist dieselbe Quelle wie das freigegebene Dauerkultur-`ernte_ab_d` 18 (P2). #8 nutzt dasselbe Würfel-Muster wie die Anlage, ist aber Klasse C. Alle Werte liegen unter dem Umsetzen nach Phasen (27), siehe P1.

### K-petersilie-15: petroselinum_crispum, Art, `umsetzen_ab_d`

| `kandidat_id` | Rohwert | Einheit | Basis (Bezug) | geprüft als | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `art.petroselinum_crispum.umsetzen_ab_d#1` | 5 | Wochen | ab Saat; Steinwollwürfel 2.5 × 2.5 × 4 cm, dann Deep-Flow | 35 d | plos-one-dill-petersilie-2021 | A (peer_review) | Deep-Flow (dwc) | Glasgewächshaus | 2021 |
| `…#2` | 3 | Wochen | ab Saat; Oasis-Würfel in Klimakammer, dann DFT | 21 d | isu-ph-kraeuter-2025 | B1 (universitaet_beratung) | DFT (dwc) | Klimakammer | 2025 |
| `…#3` | 3 | Wochen | ab Saat; Phenolschaum-Würfel in Klimakammer, dann DFT | 21 d | isu-diss-kraeuter-licht-2019 | B1 (universitaet_beratung) | DFT (dwc) | Anzucht Klimakammer, Kultur Gewächshaus | 2019 |
| `…#6` | 3 | Wochen | ab Saat; Oasis-Würfel in Klimakammer, dann NFT (Lesekopie) | 21 d | agronomy-ec-kraeuter-2019 | A (peer_review) | NFT (nft) | Gewächshaus | 2019 |
| `…#7` | 21 | Tage | ab Saat; Phenolschaum-Würfel auf Ebbe-Flut, dann DWC mit Schwimmplatten (Lesekopie) | 21 d | horttech-34-saatdichte-petersilie-2024 | A (peer_review) | DWC (quelle.csv: ebbe_flut) | Gewächshaus | 2024 |

Passt zur Anlage: am ehesten 21 d (#7: Würfel, danach DWC, Klasse A, Tage ohne Umrechnung; bestätigt durch #2, #3, #6) und gleich dem Umsetzen nach Phasen (14 + 7 = 21). #1 (35 d) ist dieselbe Quelle wie das freigegebene Dauerkultur-`ernte_ab_d` 28 und das freigegebene Wachstum, siehe P7.

### K-mangold-02: beta_vulgaris_cicla, schnitt, `ernte_ab_d` (Konflikt mit freigegebenem Wert)

| `kandidat_id` | Wert | Einheit | Basis (Bezug) | Quelle | Klasse | System | Umgebung | Jahr | Status |
|---|---|---|---|---|---|---|---|---|---|
| `ak.beta_vulgaris_cicla.schnitt.ernte_ab_d#4` | 19 | Tage | ab Umsetzen, vom Lead aus «Ready to harvest: Day 39» (ab Saat) minus Keimung typ 4 und Anzucht typ 16 gerechnet (D7) | risegardens-library-mangold | B2 (hersteller) | Indoor-System (quelle.csv: dwc) | indoor_led | ohne | freigegeben 19.11.2026 |
| `ak.beta_vulgaris_cicla.schnitt.ernte_ab_d#5` | 28 | Tage | ab Umsetzen (Umsetzen 21 d ab Saat), erster von drei Schnitten 28, 42, 56 DAT (Lesekopie) | horticulturae-mangold-meerwasser-2022 | A (peer_review) | Floating-Tanks mit stehender, belüfteter Lösung (dwc) | Gewächshaus | 2022 | geprueft |

Passt zur Anlage: #4 in der Umgebung (Indoor mit LED), aber Hersteller und umgerechnet; #5 im System (stehende belüftete Lösung wie DWC), gemessen, Klasse A, und quellintern stimmig mit `umsetzen_ab_d#2` 21 und `ernteintervall_d#3` 14 (P14, P15).

### K-spinat-09: spinacia_oleracea, schnitt, `schnitte_max` (Konflikt mit freigegebenem Wert)

| `kandidat_id` | Wert | Einheit | Basis (Bezug) | Quelle | Klasse | System | Umgebung | Jahr | Status |
|---|---|---|---|---|---|---|---|---|---|
| `ak.spinacia_oleracea.schnitt.schnitte_max#2` | 3 | Schnitte | erster Schnitt 12 bis 16 d ab Saat, dann «second and third harvests» im Wochenabstand | cornell-cea-spinat-2005 | B1 (universitaet_beratung) | Teich (dwc) | CEA (kontrollierte Umgebung laut Titel) | 2005 | freigegeben 18.11.2026 |
| `ak.spinacia_oleracea.schnitt.schnitte_max#4` | 5 | Schnitte | fünf Schnitte am selben Bestand in sieben Wochen, Versuchsende nach dem 5. Schnitt; Einleitung: «four or five successive harvests» (Lesekopie) | agriculture-spinat-rauke-floating-2021 | A (peer_review) | Floating (dwc) | Gewächshaus, Winter | 2021 | geprueft |

Passt zur Anlage: beide aus stehender Lösung (Teich bzw. Floating, nahe DWC); #2 passt zum freigegebenen Intervall 7 derselben Quelle, #4 hat längere Intervalle (22, 10, 10, 8 d) und einen späten ersten Schnitt (P16 bis P18).

### Kein Konflikt

- `art.allium_schoenoprasum.umsetzen_ab_d`: nur #2 geprüft (#1, #3 verworfen). `art.allium_schoenoprasum.umsetzen_bis_d`: nur #1.
- `art.beta_vulgaris_cicla.umsetzen_ab_d`: nur #2 geprüft (#1 mit gleichem Wert und gleicher Quelle verworfen). `art.beta_vulgaris_cicla.umsetzen_bis_d`: nur #1.
- `ak.beta_vulgaris_cicla.schnitt.ernteintervall_d`: nur #3 geprüft (#1, #2 gleicher Wert, gleiche Quelle, verworfen); nichts freigegeben.
- `art.beta_vulgaris_conditiva.umsetzen_ab_d`: nur #2 geprüft (#1 14 d aus agriculture-randen-babyleaf-2025 verworfen).
- `ak.spinacia_oleracea.schnitt.ernte_ab_d`: nur #2 geprüft (#1 gleicher Wert verworfen); nichts freigegeben.
- `ak.spinacia_oleracea.babyleaf.kulturdauer_max_d`: nur #3 geprüft (#1, #2 gleicher Wert verworfen); nichts freigegeben.
- `ak.solanum_lycopersicum.dauerkultur_frucht.ernteintervall_d`: nur #1; nichts freigegeben.

## Plausibilität

Validatorgrenzen für pH, EC, Wassertemperatur und Licht sowie die Gegenprobe des Düngeplans betreffen diese Felder nicht (nur `art.csv`). Geprüft wurden das Format nach 4.3.2/4.3.3 (ganze Tage), V11 (`ernteintervall_d` und `schnitte_max` nur bei `mehrfach`), die Ordnungen des Datenmodells (`umsetzen_ab_d ≤ umsetzen_bis_d`, `kulturdauer_typisch_d ≤ kulturdauer_max_d`, `02_datenmodell.sql` Checks der Tabellen `art` und `art_kulturform`), der Umsetztag gegen Keimung plus Anzucht der Art und gegen `ernte_ab_d` derselben Quelle sowie der Vergleich in der Kulturgruppe. V11 ist bei allen Intervall- und Schnittwerten erfüllt: Mangold Schnitt, Spinat Schnitt und Tomate Dauerkultur haben die freigegebene Ernteart `mehrfach`.

| Nr. | `kandidat_id` | Regel | Wert | Befund |
|---|---|---|---|---|
| P1 | `art.ocimum_basilicum.umsetzen_ab_d#1` bis `#6`, `#8` | Umsetzen gegen Keimung plus Anzucht | 14 bis 21 d | Alle Kandidaten liegen 6 bis 13 Tage unter dem Umsetzen nach Phasen (9 + 18 = 27), aber im Bereich der Summen 12 bis 37; mit 14 bis 18 d rechnet der Erntekalender die erste Dauerkultur-Ernte (`ernte_ab_d` 18) mit 32 bis 36 d ab Saat statt 45 d über die Phasen, und Anzucht typ 18 allein ist schon so lang wie #2. |
| P2 | `art.ocimum_basilicum.umsetzen_ab_d#1` | gegen `ernte_ab_d` derselben Quelle | 15 d | Quellintern stimmig: das freigegebene Dauerkultur-`ernte_ab_d` 18 stammt aus derselben Quelle und zählt ab genau diesem Umsetzen, erste Ernte 15 + 18 = 33 d ab Saat. |
| P3 | `…umsetzen_ab_d#3`, `#4`, `#6`, `#8` (Basilikum); `art.petroselinum_crispum.umsetzen_ab_d#1`, `#2`, `#3`, `#6`; `art.allium_schoenoprasum.umsetzen_ab_d#2`, `umsetzen_bis_d#1` | Format 4.3.2 (Tage ab Saat) | 2, 3, 5, 4, 6 | Rohwerte in Wochen in einer Tagesspalte; ungerechnet läge das Umsetzen vor dem Ende der Keimung (Basilikum min 5, Petersilie min 7, Schnittlauch min 7), vor der Freigabe also nach D4 umrechnen. |
| P4 | `art.ocimum_basilicum.umsetzen_ab_d#4`, `#5`, `#6` | Unabhängigkeit | 14 d | Drei Arbeiten der Iowa State University mit demselben Anzuchtprotokoll (Oasis-Würfel in Klimakammer, zwei Wochen); sie bestätigen einander nur bedingt unabhängig. |
| P5 | `art.ocimum_basilicum.umsetzen_ab_d#8` | Bezug, Kontext | 3 Wochen = 21 d | Das Zitat beschreibt die Nachsaat drei Wochen vor dem Ersatz alter Pflanzen nach «about 3 months»; Bezug ab Saat bis Umsetzen passt, der Wert ist der höchste der Gruppe und der einzige der Klasse C. |
| P6 | `art.petroselinum_crispum.umsetzen_ab_d#2`, `#3`, `#6`, `#7` | Umsetzen gegen Keimung plus Anzucht | 21 d | Genau gleich dem Umsetzen nach Phasen (14 + 7 = 21); damit bleibt das freigegebene `ernte_ab_d` 28 bei der ersten Ernte 49 d ab Saat, wie in der Begründung der Freigabe (Runde 12, P9). |
| P7 | `art.petroselinum_crispum.umsetzen_ab_d#1` | Umsetzen gegen Keimung plus Anzucht, `ernte_ab_d` derselben Quelle | 5 Wochen = 35 d | Über der Summe der Maxima (18 + 9 = 27); mit dem freigegebenen `ernte_ab_d` 28 derselben Quelle läge die erste Ernte 63 d ab Saat, 14 Tage später als mit 21 d, und die Freigabe von 28 stützte sich auf ein Umsetzen nach 21 d. |
| P8 | `art.allium_schoenoprasum.umsetzen_ab_d#2`, `umsetzen_bis_d#1` | Umsetzen gegen Keimung plus Anzucht, Ordnung ab ≤ bis | 4 bis 6 Wochen = 28 bis 42 d | Ordnung erfüllt (28 ≤ 42), beide im Bereich der Summen 25 bis 48 um den Phasenwert 31. |
| P9 | `art.allium_schoenoprasum.umsetzen_ab_d#2`, `umsetzen_bis_d#1` | Bezug | 4 bis 6 Wochen | Der Bezug ab Saat ist laut `fundstelle` nur aus dem Zusammenhang erschlossen (Satz folgt auf die Keimung «within eight to ten days»); gälte er ab Keimung, wären es 36 bis 52 d ab Saat und `umsetzen_bis_d` läge über der Summe der Maxima 48. |
| P10 | `art.beta_vulgaris_cicla.umsetzen_ab_d#2` | Umsetzen gegen Keimung plus Anzucht | 21 d | Einen Tag über dem Umsetzen nach Phasen (4 + 16 = 20), deren Anzucht aus derselben Quelle stammt; unauffällig. |
| P11 | `art.beta_vulgaris_cicla.umsetzen_bis_d#1` | Bedeutung «spätester Tag», Umsetzen gegen Phasen | 28 d | Die Quelle nennt ein einzelnes Umsetzdatum (Saat 31.10., Umsetzen 28.11.2023, Gewächshaus ohne Zusatzlicht), keinen spätesten Tag; der Wert liegt einen Tag über der Summe der Maxima (7 + 20 = 27) und stammt aus einer anderen Quelle (NFT) als `umsetzen_ab_d#2` (Floating); Ordnung 21 ≤ 28 erfüllt. |
| P12 | `art.beta_vulgaris_conditiva.umsetzen_ab_d#2` | Umsetzen gegen Keimung plus Anzucht | 9 d | Unter der Summe der Minima (2 + 8 = 10) und 4 Tage unter dem Phasenwert 13: die App erwartet das Umsetzen vor dem frühesten Anzucht-Ende; die Quelle ist ein Babyleaf-Versuch (einmalige Ernte 30 d ab Saat, Anzucht in Kokosfaser ohne Nährlösung), Babyleaf ist für Randen nicht erlaubt. |
| P13 | `art.beta_vulgaris_conditiva.umsetzen_ab_d#2` | Kulturgruppe | 9 d | Gleich dem freigegebenen Spinat-Umsetzen 9, deutlich unter Mangold (Kandidaten 21 bis 28); Randen und Mangold belegen einander nicht (Konzept 9.3 Regel 4). |
| P14 | `ak.beta_vulgaris_cicla.schnitt.ernte_ab_d#5` | Wachstum, Konflikt K-mangold-02 | 28 d ab Umsetzen | Im Wachstum 24/30/38; erste Ernte mit `umsetzen_ab_d#2` 21 d bei 49 d ab Saat, während das freigegebene 19 unter Wachstum min 24 liegt (Runde 12, P11) und 39 d ab Saat ergibt. |
| P15 | `ak.beta_vulgaris_cicla.schnitt.ernteintervall_d#3` | V11, quellinterne Stimmigkeit | 14 d | V11 erfüllt (`mehrfach` freigegeben); 28 + 14 + 14 ergibt genau die Schnitte 28, 42, 56 DAT der Quelle; doppelt so lang wie das freigegebene Spinat-Schnittintervall 7 der Kulturgruppe. |
| P16 | `ak.spinacia_oleracea.schnitt.ernte_ab_d#2` | Wachstum, Kulturform | 34 d ab Umsetzen | Über Wachstum max 28 (21/24/28); mit `art.umsetzen_ab_d` 9 erste Ernte 43 d ab Saat, während die freigegebenen Schnittwerte (Cornell) den ersten Schnitt bei 12 bis 16 d ab Saat und Babyleaf `ernte_ab_d` bei 14 d ab Saat sehen; die Tabelle derselben Quelle zeigt für die Kontrolle 34, 32 und 18 d, 34 ist also der langsamste (Winter-)Zyklus. |
| P17 | `ak.spinacia_oleracea.schnitt.schnitte_max#4` | Konflikt K-spinat-09, Kulturdauer | 5 | Fünf Schnitte mit den freigegebenen Werten ergäben 9 + 34 + 4 · 7 = 71 d ab Saat, in der Quelle 96 d (Intervalle 22, 10, 10, 8); `schnitt.kulturdauer_max_d` fehlt, eine Obergrenze ist nicht prüfbar. |
| P18 | `ak.spinacia_oleracea.schnitt.schnitte_max#4` | Höchstzahl oder Versuchsplan | 5 | Die Tabelle zeigt den Versuchsplan bis zum Versuchsende nach dem 5. Schnitt (gleicher Befund wie bei verworfenen `schnitte_max` anderer Arten); als Aussage zur Kultur trägt nur der Satz der Einleitung «four or five successive harvests». |
| P19 | `ak.spinacia_oleracea.babyleaf.kulturdauer_max_d#3` | Ordnung typ ≤ max, Abstand | 46 d ab Saat | Ordnung erfüllt (`kulturdauer_typisch_d` 16 ≤ 46, `ernte_ab_d` 14 ≤ 46), aber fast das Dreifache von typisch 16; der Wert ist der längste von drei gemessenen Zyklen (46, 43, 28 d, Winter) und keine ausdrücklich genannte Höchstdauer, mit Anzucht in Torfplatten und Umsetzen, während Babyleaf in der Anlage laut freigegebenem `ernte_ab_d` Direktsaat ist. |
| P20 | `ak.solanum_lycopersicum.dauerkultur_frucht.ernteintervall_d#1` | V11, Kulturgruppe | 7 d | V11 erfüllt; gleich dem freigegebenen Chili-Intervall 7; das späte Umsetzen der Quelle (60 d ab Saat gegen freigegeben 10 bis 16) betrifft das Intervall nicht; unauffällig. |

## Lückenliste (Klasse D, Prüfauftrag)

Felder aus der Tabelle «Lücken je Kulturgruppe» in `teile/auftrag_runde-13.md` ohne geprüften Kandidaten und ohne freigegebenen Wert. Fett: Vorrang laut Auftrag.

| Art | Kulturform | Feld |
|---|---|---|
| ocimum_basilicum | – | umsetzen_bis_d |
| ocimum_basilicum | dauerkultur_blatt | schnitte_max |
| ocimum_basilicum | dauerkultur_blatt | kulturdauer_max_d |
| ocimum_basilicum | schnitt | schnitte_max |
| ocimum_basilicum | schnitt | kulturdauer_max_d |
| petroselinum_crispum | – | umsetzen_bis_d |
| petroselinum_crispum | dauerkultur_blatt | schnitte_max |
| petroselinum_crispum | dauerkultur_blatt | kulturdauer_max_d |
| allium_schoenoprasum | dauerkultur_blatt | **ernte_ab_d** |
| allium_schoenoprasum | dauerkultur_blatt | ernteintervall_d |
| allium_schoenoprasum | dauerkultur_blatt | schnitte_max |
| allium_schoenoprasum | schnitt | **ernte_ab_d** |
| allium_schoenoprasum | schnitt | ernteintervall_d |
| allium_schoenoprasum | schnitt | schnitte_max |
| allium_schoenoprasum | schnitt | kulturdauer_max_d |
| beta_vulgaris_conditiva | – | umsetzen_bis_d |
| beta_vulgaris_conditiva | schnitt | **ernte_ab_d** |
| beta_vulgaris_conditiva | schnitt | ernteintervall_d |
| beta_vulgaris_conditiva | schnitt | schnitte_max |
| beta_vulgaris_conditiva | schnitt | kulturdauer_max_d |
| beta_vulgaris_cicla | schnitt | schnitte_max |
| beta_vulgaris_cicla | schnitt | kulturdauer_max_d |
| spinacia_oleracea | schnitt | kulturdauer_max_d |
| spinacia_oleracea | kopf | kulturdauer_max_d |
| solanum_lycopersicum | dauerkultur_frucht | schnitte_max |
| capsicum_annuum | dauerkultur_frucht | schnitte_max |
| capsicum_annuum | dauerkultur_frucht | kulturdauer_max_d |

27 Lücken. Gedeckt sind mit mindestens einem geprüften Kandidaten: alle fünf fett markierten `umsetzen_ab_d` (Basilikum, Petersilie, Schnittlauch, Randen, Mangold), Schnittlauch und Mangold `umsetzen_bis_d`, Mangold `ernteintervall_d`, Spinat Schnitt `ernte_ab_d`, Spinat Babyleaf `kulturdauer_max_d`, Tomate `ernteintervall_d`; Spinat `schnitte_max` und Mangold `ernte_ab_d` sind zusätzlich als Konflikt mit dem freigegebenen Wert eingereicht.

## Bestätigungen

| Art | Feld | Wert | Kandidaten |
|---|---|---|---|
| ocimum_basilicum | umsetzen_ab_d | 14 d ab Saat | `#3` plos-one-basilikum-saemlingsumgebung-2022 (A, 2 Wochen), `#4` isu-ph-kraeuter-2025 (B1, 2 Wochen), `#5` isu-diss-kraeuter-licht-2019 (B1, 14 d), `#6` isu-ms-basilikum-systeme-2015 (B1, 2 Wochen); alle Teil von K-basilikum-14, #4 bis #6 aus derselben Hochschule (P4) |
| petroselinum_crispum | umsetzen_ab_d | 21 d ab Saat | `#2` isu-ph-kraeuter-2025 (B1, 3 Wochen), `#3` isu-diss-kraeuter-licht-2019 (B1, 3 Wochen), `#6` agronomy-ec-kraeuter-2019 (A, 3 Wochen), `#7` horttech-34-saatdichte-petersilie-2024 (A, 21 d); alle Teil von K-petersilie-15, zugleich gleich dem Umsetzen nach Phasen (P6) |

Kein Bestätigungsfall: Mangold `ernteintervall_d` 14, Spinat Schnitt `ernte_ab_d` 34 und Babyleaf `kulturdauer_max_d` 46 haben gleiche Werte nur in verworfenen Zeilen derselben Quelle.
