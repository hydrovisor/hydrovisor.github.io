# Fachkritik W0 Runde 12 (#250): Kulturform-Felder `ernte_ab_d` und `kulturdauer_max_d`

Stand 19.11.2026. Gegenstand: die 14 Zeilen mit `status = geprueft` aus dem Auftrag in `data/wissensbasis/kandidaten/teile/{blattsalat,kraut_einjaehrig,kraut_ausdauernd,fuchsschwanz}/art.csv`. Vergleich gegen `data/wissensbasis/freigegeben/art.csv` und `profilwert.csv`. Bezug nach `docs/spec/03_import_w0.md` 4.3.3: `ernte_ab_d` zählt ab Umsetzen, bei Direktsaat ab Saat; `kulturdauer_max_d` und `kulturdauer_typisch_d` ab Saat. Umrechnung nur zum Prüfen (Wochen × 7; ab Saat minus Umsetzen nach `art.umsetzen_ab_d` bzw. nach der Quelle); in den Dateien bleiben die Rohwerte. Für Basilikum, Petersilie und Mangold ist kein `art.umsetzen_ab_d` freigegeben; dort dient das Ende der Anzucht nach den freigegebenen Phasendauern (Keimung typ plus Anzucht typ) als Ersatz für den Umsetztag der Anlage.

## Geprüfte Kandidaten

| Art | Kulturform | Feld | `kandidat_id` | Rohwert | Bezug laut Fundstelle | geprüft als (ab Umsetzen bzw. ab Saat) | Quelle | Klasse |
|---|---|---|---|---|---|---|---|---|
| lactuca_sativa | schnitt | ernte_ab_d | `…schnitt.ernte_ab_d#1` | 5 (Wochen) | ab Saat, Direktsaat | 35 d ab Saat; für Umsetzen 35 − 12 = 23 d | jas-lettuce-cut-and-come-again-2017 | A |
| lactuca_sativa | schnitt | ernte_ab_d | `…schnitt.ernte_ab_d#2` | 21 | ab Saat, Umsetztag nicht genannt | 21 − 12 = 9 d ab Umsetzen | risegardens-salat-dauer-2026 | B2 |
| lactuca_sativa | schnitt | ernte_ab_d | `…schnitt.ernte_ab_d#3` | 4 (Wochen) | ab Umsetzen | 28 d ab Umsetzen | frankiesgarten-salat-hydroponik | C |
| lactuca_sativa | babyleaf | ernte_ab_d | `…babyleaf.ernte_ab_d#3` | 21 | ab Saat, Umsetztag nicht genannt | 21 − 12 = 9 d ab Umsetzen | risegardens-salat-dauer-2026 | B2 |
| lactuca_sativa | babyleaf | kulturdauer_max_d | `…babyleaf.kulturdauer_max_d#1` | 30 | ab Saat | 30 d | frontiers-babyleaf-nitrat-floating-2021 | A |
| lactuca_sativa | babyleaf | kulturdauer_max_d | `…babyleaf.kulturdauer_max_d#2` | 35 | ab Saat | 35 d | risegardens-salat-dauer-2026 | B2 |
| lactuca_sativa | kopf | kulturdauer_max_d | `…kopf.kulturdauer_max_d#2` | 45 | ab Saat | 45 d | risegardens-salat-dauer-2026 | B2 |
| lactuca_sativa | kopf | kulturdauer_max_d | `…kopf.kulturdauer_max_d#3` | 56 | ab Saat (21 + 35) | nicht wählbar: Quelle `uky-ccd-cp63-2026` in `quelle.csv` verworfen (Jahr abweichend) | uky-ccd-cp63-2026 | B1 |
| ocimum_basilicum | dauerkultur_blatt | ernte_ab_d | `…dauerkultur_blatt.ernte_ab_d#1` | 18 | ab Umsetzen (Umsetzen 15 d ab Saat) | 18 d | frontiers-basilikum-raft-sorten-2021 | A |
| ocimum_basilicum | dauerkultur_blatt | ernte_ab_d | `…dauerkultur_blatt.ernte_ab_d#2` | 13 | ab Umsetzen (Umsetzen 36 d ab Saat) | 13 d | fshs-kraeuter-vertikal-2001 | A |
| petroselinum_crispum | dauerkultur_blatt | ernte_ab_d | `…dauerkultur_blatt.ernte_ab_d#1` | 21 | 49 ab Saat minus 28 (Umsetzen nach der Quelle) | 21 d | vt-spes-466-2023 | B1 |
| petroselinum_crispum | dauerkultur_blatt | ernte_ab_d | `…dauerkultur_blatt.ernte_ab_d#2` | 21 | ab Umsetzen (Umsetzen 47 d ab Saat) | 21 d | fshs-kraeuter-vertikal-2001 | A |
| petroselinum_crispum | dauerkultur_blatt | ernte_ab_d | `…dauerkultur_blatt.ernte_ab_d#3` | 4 (Wochen) | ab Umsetzen (Umsetzen 35 d ab Saat) | 28 d | plos-one-dill-petersilie-2021 | A |
| beta_vulgaris_cicla | schnitt | ernte_ab_d | `…schnitt.ernte_ab_d#3` | 39 | ab Saat, Umsetztag nicht genannt | 39 − 20 = 19 d ab Umsetzen (Bereich 12 bis 28) | risegardens-library-mangold | B2 |

## Konfliktliste

Vier Konflikte; `konflikt_id` ist in den Teil-Dateien gesetzt (`teile/blattsalat/art.csv`, `teile/kraut_einjaehrig/art.csv`, `teile/kraut_ausdauernd/art.csv`). Kein Konflikt entschieden; der Hinweis «passt zur Anlage» bezieht sich auf Tims Regal (Indoor mit LED, DWC und Kratky, Anzucht in Würfeln, danach Umsetzen).

### K-salat-16: lactuca_sativa, schnitt, `ernte_ab_d`

| `kandidat_id` | Rohwert | Einheit | Basis (Bezug) | geprüft als ab Umsetzen | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `ak.lactuca_sativa.schnitt.ernte_ab_d#1` | 5 | Wochen | ab Saat, Direktsaat in schwimmende Speedling-Schalen mit Vermiculit | 23 d (35 − 12) | jas-lettuce-cut-and-come-again-2017 | A (peer_review) | Floating, Aquaponik-Durchfluss (quelle.csv: dwc) | Folientunnel | 2017 |
| `ak.lactuca_sativa.schnitt.ernte_ab_d#2` | 21 | Tage | ab Saat, Umsetztag nicht genannt (Saatpods im System) | 9 d (21 − 12) | risegardens-salat-dauer-2026 | B2 (hersteller) | Indoor-System (quelle.csv: nft) | indoor_led | 2026 |
| `ak.lactuca_sativa.schnitt.ernte_ab_d#3` | 4 | Wochen | ab Umsetzen in den Tower | 28 d | frankiesgarten-salat-hydroponik | C (praxis) | Tower (quelle.csv: nft) | nicht genannt | ohne |

Passt zur Anlage: am ehesten #1 (Floating-System nahe DWC, Klasse A, gleiche Quelle wie die freigegebenen Schnitt-Werte `ernteintervall_d` 7, `schnitte_max` 2, `kulturdauer_max_d` 42, mit denen es nach Umrechnung genau aufgeht, siehe P1); Vorbehalt: Direktsaat ohne Umsetzen und Folientunnel. #3 passt im Ablauf (Wert ab Umsetzen, keine Umrechnung), verletzt aber mit zwei Schnitten die freigegebene Kulturdauer (P3). #2 passt in der Umgebung (Indoor mit LED), beschreibt aber laut Kurzzitat die Babyleaf-Ernte (P2).

### K-salat-17: lactuca_sativa, babyleaf, `kulturdauer_max_d`

| `kandidat_id` | Wert | Einheit | Basis (Bezug) | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| `ak.lactuca_sativa.babyleaf.kulturdauer_max_d#1` | 30 | Tage | ab Saat; späterer der zwei gemessenen Zyklen (Frühjahr 30, Herbst 25) | frontiers-babyleaf-nitrat-floating-2021 | A (peer_review) | Floating und Ebbe-Flut, Perlit-Schalen (quelle.csv: dwc) | Gewächshaus | 2021 |
| `ak.lactuca_sativa.babyleaf.kulturdauer_max_d#2` | 35 | Tage | ab Saat; obere Grenze des Bereichs 25 bis 35 d (Loose-leaf bis «baby greens») | risegardens-salat-dauer-2026 | B2 (hersteller) | Indoor-System (quelle.csv: nft) | indoor_led | 2026 |

Passt zur Anlage: am ehesten #1 (gemessener Wert, Floating nahe DWC, Klasse A); #2 passt in der Umgebung (Indoor mit LED), ist aber eine Bereichsgrenze eines Herstellers mit NFT. Zur Wechselwirkung mit `babyleaf.ernte_ab_d` siehe P4.

### K-basilikum-13: ocimum_basilicum, dauerkultur_blatt, `ernte_ab_d`

| `kandidat_id` | Wert | Einheit | Basis (Bezug) | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| `ak.ocimum_basilicum.dauerkultur_blatt.ernte_ab_d#1` | 18 | Tage | ab Umsetzen (Umsetzen 15 d ab Saat), erster Schnitt CT1 vor der Blüte | frontiers-basilikum-raft-sorten-2021 | A (peer_review) | Floating Raft (quelle.csv: dwc) | Glasgewächshaus | 2021 |
| `ak.ocimum_basilicum.dauerkultur_blatt.ernte_ab_d#2` | 13 | Tage | ab Umsetzen (Umsetzen 36 d ab Saat), Mittel mehrerer Pflanzungen | fshs-kraeuter-vertikal-2001 | A (peer_review) | Verti-Gro-Türme mit Perlit (quelle.csv: substrat_inert) | Gewächshaus | 2001 |

Passt zur Anlage: am ehesten #1 (Floating Raft = DWC, Umsetzen nach 15 d nahe der freigegebenen Anzucht, Wert gleich dem freigegebenen Wachstum-Minimum 18). #2 stammt aus Perlit-Türmen mit sehr später Umsetzung (36 d) und widerspricht dem Text derselben Seite (P7).

### K-petersilie-14: petroselinum_crispum, dauerkultur_blatt, `ernte_ab_d`

| `kandidat_id` | Rohwert | Einheit | Basis (Bezug) | geprüft als | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `ak.petroselinum_crispum.dauerkultur_blatt.ernte_ab_d#1` | 21 | Tage | 49 ab Saat (erste Ernte) minus 28 (True Leaves = Umsetzen laut Quelle) | 21 d | vt-spes-466-2023 | B1 (universitaet_beratung) | Steinwolle, dann NFT, Stack, Ebbe-Flut, Floating Raft (quelle.csv: dwc) | nicht genannt | 2023 |
| `ak.petroselinum_crispum.dauerkultur_blatt.ernte_ab_d#2` | 21 | Tage | ab Umsetzen (TP 47 d ab Saat) | 21 d | fshs-kraeuter-vertikal-2001 | A (peer_review) | Verti-Gro-Türme mit Perlit (substrat_inert) | Gewächshaus | 2001 |
| `ak.petroselinum_crispum.dauerkultur_blatt.ernte_ab_d#3` | 4 | Wochen | ab Umsetzen (Umsetzen 5 Wochen ab Saat), Ernte bei Marktreife der ersten Variante | 28 d | plos-one-dill-petersilie-2021 | A (peer_review) | Deep-Flow-Tische (dwc) | Glasgewächshaus | 2021 |

Passt zur Anlage: am ehesten #1 (Anzucht in Steinwolle, DWC unter den Systemen, bestätigt durch #2). #3 (Deep-Flow = DWC, Klasse A) passt dagegen zu den freigegebenen Phasen (Wachstum 28/28/42 stammt aus derselben Quelle und demselben Satz) und ergibt sich auch aus #1, wenn man mit dem Anzucht-Ende der Anlage statt mit dem Umsetztag der Quelle rechnet (P9).

### Kein Konflikt

- `ak.lactuca_sativa.kopf.kulturdauer_max_d`: #2 (45) und #3 (56) haben Status `geprueft`, #3 ist aber nicht wählbar, weil seine Quelle `uky-ccd-cp63-2026` in `teile/blattsalat/quelle.csv` den Status `verworfen` hat (Jahr 2026 statt 2025 laut «Suggested Citation»). Keine `konflikt_id` gesetzt; wird die Quelle mit korrigiertem Jahr neu eingereicht, entsteht ein Konflikt 45 gegen 56.
- `ak.lactuca_sativa.babyleaf.ernte_ab_d`: nur #3 geprüft (#1 und #2 verworfen).
- `ak.beta_vulgaris_cicla.schnitt.ernte_ab_d`: nur #3 geprüft (#1 und #2 verworfen).

## Plausibilität

Validatorgrenzen für Dauern (min ≤ typ ≤ max) betreffen diese Felder nicht; geprüft wurden V11 in der Lesart des Auftrags (`kulturdauer_typisch_d` ≤ `kulturdauer_max_d`; Umsetzen plus `ernte_ab_d` ≤ `kulturdauer_max_d`), die Umrechnung nach 4.3.3 und der Vergleich mit den freigegebenen Werten derselben Art und Kulturgruppe. Freigegebene Bezugswerte: Salat `umsetzen_ab_d` 12, `umsetzen_bis_d` 18, Keimung 3/3/4, Anzucht 8/9/15, Wachstum 24/28/42, Kopf `ernte_ab_d` 24 und `kulturdauer_typisch_d` 35, Schnitt `kulturdauer_max_d` 42, `ernteintervall_d` 7, `schnitte_max` 2; Basilikum Keimung 5/9/14, Anzucht 7/18/23, Wachstum 18/23/50, Schnitt `ernte_ab_d` 50, Dauerkultur `ernteintervall_d` 21; Petersilie Keimung 7/14/18, Anzucht 6/7/9, Wachstum 28/28/42, `ernteintervall_d` 7; Mangold Keimung 1/4/7, Anzucht 10/16/20, Wachstum 24/30/38.

| Nr. | `kandidat_id` | Regel | Wert | Befund |
|---|---|---|---|---|
| P1 | `ak.lactuca_sativa.schnitt.ernte_ab_d#1` | 4.3.3 Bezug, V11 | 5 Wochen = 35 d ab Saat (Direktsaat) | Nach 4.3.3 gilt der Wert in der Anlage ab Umsetzen; nur umgerechnet (35 − 12 = 23 d) geht er mit der freigegebenen Kulturdauer genau auf (12 + 23 + 7 = 42 ≤ 42), als 35 d ab Umsetzen übernommen ergäbe er 12 + 35 = 47 d und verletzte `kulturdauer_max_d` 42 schon beim ersten Schnitt. |
| P2 | `ak.lactuca_sativa.schnitt.ernte_ab_d#2` | Kulturform, Wachstum | 21 d ab Saat = 9 d ab Umsetzen | Das Kurzzitat beschreibt «baby-leaf harvesting» und ist derselbe Wert derselben Quelle wie `babyleaf.ernte_ab_d#3`; mit 9 d ab Umsetzen liegt er weit unter Wachstum min 24 und unter Kopf `ernte_ab_d` 24, ist also eher ein Babyleaf- als ein erster Schnitt-Termin. |
| P3 | `ak.lactuca_sativa.schnitt.ernte_ab_d#3` | V11 mit `schnitte_max` 2 | 4 Wochen = 28 d ab Umsetzen | Erster Schnitt 12 + 28 = 40 ≤ 42, der zweite (+7 = 47) und bei spätem Umsetzen schon der erste (18 + 28 = 46) überschreiten `kulturdauer_max_d` 42; zudem läge der erste Schnitt später als die freigegebene Kopfernte (24), passt aber zu Wachstum typ 28 (dieselbe Spannung wie R11 P3). |
| P4 | `ak.lactuca_sativa.babyleaf.ernte_ab_d#3` | 4.3.3 Bezug, V11 gegen K-salat-17 | 21 d ab Saat = 9 d ab Umsetzen | Umgerechnet unauffällig (12 + 9 = 21 ≤ 30 bzw. 35); als 21 d ab Umsetzen übernommen ergäbe er 12 + 21 = 33 d und verletzte V11 mit `kulturdauer_max_d#1` 30 (mit #2 35 nur bei Umsetzen bis Tag 14), die Umrechnung muss also vor der Wahl in K-salat-17 feststehen. |
| P5 | `ak.lactuca_sativa.babyleaf.kulturdauer_max_d#2` | Vergleich Kulturformen | 35 d | Gleich der freigegebenen Kopf-`kulturdauer_typisch_d` 35, damit endete Babyleaf spätestens dann, wenn ein Kopf typischerweise fertig ist; #1 (30) hält Abstand. Eine `kulturdauer_typisch_d` für babyleaf fehlt, V11 (typ ≤ max) ist nicht prüfbar. |
| P6 | `ak.lactuca_sativa.kopf.kulturdauer_max_d#2` | V11, Fundstelle | 45 d | V11 erfüllt (35 ≤ 45; 12 + 24 = 36 und 18 + 24 = 42 ≤ 45); dieselbe Quelle nennt aber in der Sortenliste Butterhead 40 bis 50, Romaine 42 bis 55 und Batavia 38 bis 48 Tage, 45 schneidet diese Typen ab, und die Phasen-Maxima (4 + 15 + 42 = 61) liegen deutlich darüber. |
| P7 | `ak.ocimum_basilicum.dauerkultur_blatt.ernte_ab_d#2` | Wachstum, Fundstelle | 13 d | Unter Wachstum min 18; der Text derselben Seite nennt für die Kräuter «15 to 28» Tage, die Tabelle für Basil 13, und die Setzlinge waren mit 36 d ab Saat deutlich älter als nach freigegebener Anzucht (9 + 18 = 27 d). |
| P8 | `ak.ocimum_basilicum.dauerkultur_blatt.ernte_ab_d#1`, `#2` | Vergleich Kulturformen, V11 | 18 bzw. 13 d | Beide liegen weit unter dem freigegebenen Schnitt-`ernte_ab_d` 50 (Herbst-Winter in NFT); erste Ernte ab Saat in der Anlage etwa 27 + 18 = 45 bzw. 40 d, bei `ernteintervall_d` 21. V11 ist nicht prüfbar, weil `art.umsetzen_ab_d` und `dauerkultur_blatt.kulturdauer_max_d` fehlen. |
| P9 | `ak.petroselinum_crispum.dauerkultur_blatt.ernte_ab_d#1`, `#2` | Wachstum, Umrechnung | 21 d | Unter Wachstum min 28 (freigegeben aus plos-one-dill-petersilie-2021, gleicher Satz wie #3); #1 zieht den Umsetztag der Quelle (28 d) ab, mit dem Anzucht-Ende der Anlage (14 + 7 = 21 d) ergäbe dieselbe erste Ernte 49 d ab Saat 28 d ab Umsetzen, also den Wert von #3 (vgl. R11 P10). |
| P10 | `ak.petroselinum_crispum.dauerkultur_blatt.ernte_ab_d#3` | Kulturform | 4 Wochen = 28 d | Die Ernte erfolgte bei Marktreife der ersten Variante eines Licht- und Temperaturversuchs, nicht als erster von mehreren Schnitten; für die Dauerkultur ist das ein Ersternte-Termin ganzer Pflanzen. V11 nicht prüfbar (`kulturdauer_max_d` und `art.umsetzen_ab_d` fehlen). |
| P11 | `ak.beta_vulgaris_cicla.schnitt.ernte_ab_d#3` | 4.3.3 Bezug, Wachstum | 39 d ab Saat | Ohne freigegebenes `art.umsetzen_ab_d` nur über die Phasen umzurechnen: 39 − (4 + 16) = 19 d ab Umsetzen (Bereich 12 bis 28), unter Wachstum min 24; als 39 d ab Umsetzen übernommen wären es 20 + 39 = 59 d ab Saat und mehr als Anzucht plus Wachstum max (20 + 38). V11 nicht prüfbar (`kulturdauer_max_d` fehlt). |
| P12 | `…schnitt.ernte_ab_d#2`, `…babyleaf.ernte_ab_d#3`, `…babyleaf.kulturdauer_max_d#2`, `…kopf.kulturdauer_max_d#2` | System der Quelle | risegardens-salat-dauer-2026 | `quelle.csv` führt die Quelle mit `anbaumethode` nft; die Kandidaten der Rise-Gardens-Seite risegardens-hydroponic-lettuce-2025 wurden in Runde 11 mit genau dieser Begründung (NFT statt DWC) verworfen, hier ist die Methodenprüfung `zugelassen`. |
| P13 | alle Wochenwerte (`lactuca schnitt.ernte_ab_d#1`, `#3`, `petroselinum dauerkultur_blatt.ernte_ab_d#3`) | Format 4.3.3 (ganze Tage) | 5, 4, 4 | Rohwerte in Wochen in einer Tagesspalte; vor der Freigabe nach D4 umrechnen (35, 28, 28), sonst gälten sie als 5 bzw. 4 Tage. |

Kulturgruppenvergleich: In `kraut_einjaehrig` und `kraut_ausdauernd` gibt es keine weitere freigegebene `ernte_ab_d` einer Dauerkultur (Schnittlauch-Kandidaten verworfen). In `fuchsschwanz` ist nur Spinat babyleaf `ernte_ab_d` 14 (Direktsaat, ab Saat) freigegeben; Mangold #3 (39 ab Saat) ist für Schnitt ab Saat deutlich länger, das passt zur späteren Kulturform.

## Lückenliste (Klasse D, Prüfauftrag)

Alle Auftragszeilen haben mindestens einen ladbaren geprüften Kandidaten. Für die Prüfung nach V11 fehlen weiterhin (freigegeben und ohne geprüften Kandidaten):

| Art | Kulturform | Feld |
|---|---|---|
| ocimum_basilicum | – | umsetzen_ab_d, umsetzen_bis_d |
| petroselinum_crispum | – | umsetzen_ab_d, umsetzen_bis_d |
| beta_vulgaris_cicla | – | umsetzen_ab_d, umsetzen_bis_d |
| ocimum_basilicum | dauerkultur_blatt | kulturdauer_max_d, schnitte_max |
| petroselinum_crispum | dauerkultur_blatt | kulturdauer_max_d, schnitte_max |
| beta_vulgaris_cicla | schnitt | kulturdauer_max_d, ernteintervall_d, schnitte_max |
| lactuca_sativa | babyleaf | kulturdauer_typisch_d |
| lactuca_sativa | schnitt | kulturdauer_typisch_d |

## Bestätigungen

| Art | Kulturform | Feld | Wert | Kandidaten |
|---|---|---|---|---|
| petroselinum_crispum | dauerkultur_blatt | ernte_ab_d | 21 d ab Umsetzen | `#1` vt-spes-466-2023 (B1; Steinwolle, NFT, Stack, Ebbe-Flut, Floating Raft) und `#2` fshs-kraeuter-vertikal-2001 (A; Perlit-Türme, Gewächshaus); beide Teil von K-petersilie-14 |

Kein Bestätigungsfall: Salat 21 d in `schnitt.ernte_ab_d#2` und `babyleaf.ernte_ab_d#3` stammen aus derselben Quelle und betreffen verschiedene Zeilen (vgl. P2).
