# Fachkritik W0 Runde 11 (#242): Kulturform-Felder

Stand 18.11.2026. Gegenstand: die 13 Zeilen mit `status = geprueft` in `data/wissensbasis/kandidaten/teile/*/art.csv` (Felder `ernteintervall_d`, `schnitte_max`, `kulturdauer_max_d`). Neue geprüfte Zeilen zu `kulturdauer_typisch_d` oder `ernte_ab_d` gibt es in dieser Runde nicht. Vergleich gegen `data/wissensbasis/freigegeben/art.csv` und `profilwert.csv`. Umrechnung nur zum Prüfen nach D4 (Tage = 7 · Wochen); in den Dateien bleiben die Rohwerte.

## Geprüfte Kandidaten

| Art | Kulturform | Feld | `kandidat_id` | Rohwert | geprüft als | Quelle | Klasse |
|---|---|---|---|---|---|---|---|
| lactuca_sativa | schnitt | ernteintervall_d | `ak.lactuca_sativa.schnitt.ernteintervall_d#1` | 1 (Wochen) | 7 d | jas-lettuce-cut-and-come-again-2017 | A |
| lactuca_sativa | schnitt | schnitte_max | `ak.lactuca_sativa.schnitt.schnitte_max#1` | 2 | 2 | jas-lettuce-cut-and-come-again-2017 | A |
| lactuca_sativa | schnitt | kulturdauer_max_d | `ak.lactuca_sativa.schnitt.kulturdauer_max_d#1` | 6 (Wochen) | 42 d | jas-lettuce-cut-and-come-again-2017 | A |
| valerianella_locusta | kopf | kulturdauer_max_d | `ak.valerianella_locusta.kopf.kulturdauer_max_d#2` | 66 | 66 d | plants-valerianella-selen-2021 | A |
| solanum_lycopersicum | dauerkultur_frucht | kulturdauer_max_d | `ak.solanum_lycopersicum.dauerkultur_frucht.kulturdauer_max_d#1` | 364 | 364 d | ua-tomato-workshop-modul5-2026 | B1 |
| capsicum_annuum | dauerkultur_frucht | ernteintervall_d | `ak.capsicum_annuum.dauerkultur_frucht.ernteintervall_d#1` | 1 (Wochen) | 7 d | ua-ceac-kurs-kap8 | B1 |
| brassica_rapa_chinensis | kopf | kulturdauer_max_d | `ak.brassica_rapa_chinensis.kopf.kulturdauer_max_d#1` | 60 | 60 d | risegardens-bok-choy-2026 | B2 |
| ocimum_basilicum | schnitt | ernteintervall_d | `ak.ocimum_basilicum.schnitt.ernteintervall_d#2` | 3 (Wochen) | 21 d | cafre-blattsalat-kraeuter-2020 | B1 |
| petroselinum_crispum | dauerkultur_blatt | ernteintervall_d | `ak.petroselinum_crispum.dauerkultur_blatt.ernteintervall_d#1` | 1 (Wochen) | 7 d | vt-spes-466-2023 | B1 |
| petroselinum_crispum | dauerkultur_blatt | ernteintervall_d | `ak.petroselinum_crispum.dauerkultur_blatt.ernteintervall_d#2` | 1 (Wochen) | 7 d | fshs-kraeuter-vertikal-2001 | A |
| allium_schoenoprasum | dauerkultur_blatt | kulturdauer_max_d | `ak.allium_schoenoprasum.dauerkultur_blatt.kulturdauer_max_d#1` | 2 (Jahre) | etwa 730 d | simplyhydro-schnittlauch | C |
| spinacia_oleracea | schnitt | ernteintervall_d | `ak.spinacia_oleracea.schnitt.ernteintervall_d#1` | 1 (Wochen) | 7 d | cornell-cea-spinat-2005 | B1 |
| spinacia_oleracea | schnitt | schnitte_max | `ak.spinacia_oleracea.schnitt.schnitte_max#2` | 3 | 3 | cornell-cea-spinat-2005 | B1 |

## Konfliktliste

Keine Konflikte. Keine `zeile_id` hat zwei geprüfte Kandidaten mit verschiedenen Werten; es wurde keine `konflikt_id` gesetzt.

- `ak.petroselinum_crispum.dauerkultur_blatt.ernteintervall_d`: zwei geprüfte Kandidaten mit gleichem Wert (siehe Bestätigungen).
- `ak.spinacia_oleracea.schnitt.schnitte_max`: nur #2 (3) ist geprüft; #1 (2) und #3 (5) sind verworfen und zählen nicht.
- `ak.lactuca_sativa.schnitt.ernteintervall_d`: nur #1 geprüft; #2 (2 Wochen, Rise Gardens) ist verworfen.

## Plausibilität

V11: Alle `ernteintervall_d`- und `schnitte_max`-Zeilen gehören zu Kulturformen mit freigegebener Ernteart `mehrfach` (lactuca schnitt, capsicum dauerkultur_frucht, ocimum schnitt, petroselinum dauerkultur_blatt, spinacia schnitt). Alle Kulturformen stehen in der freigegebenen `kulturformen_erlaubt`. `kulturdauer_max_d` bei einmaligen Kulturformen (valerianella kopf, brassica kopf) ist zulässig. Kein Verstoss. V9 ist erfüllt: Quelle, Fundstelle, Kurzzitat und Klasse sind vorhanden, keine Klasse D.

| Nr. | `kandidat_id` | Regel | Wert | Befund |
|---|---|---|---|---|
| P1 | alle Wochen- und Jahreswerte (8 Zeilen: lactuca ernteintervall#1 und kulturdauer_max#1, capsicum ernteintervall#1, ocimum ernteintervall#2, petroselinum ernteintervall#1 und #2, spinacia ernteintervall#1, allium kulturdauer_max#1) | Format 4.3.3 (ganze Tage) | 1, 2, 3, 6 | Die Rohwerte stehen in Wochen bzw. Jahren in einer Tagesspalte; unverändert übernommen gälten sie als Tage (z. B. Salat-Kulturdauer 6 d, Schnittlauch 2 d), was kein Validator erkennt, daher müssen alle vor der Freigabe nach D4 umgerechnet werden. |
| P2 | `ak.allium_schoenoprasum.dauerkultur_blatt.kulturdauer_max_d#1` | D4 (nur Wochen) | 2 Jahre | D4 regelt nur Wochen; für Jahre fehlt eine Umrechnungsregel (Fundstelle sagt «analog Regel D4»), sie muss der Lead festlegen; mit etwa 730 d liegt der Wert weit über Saat bis erste Ernte (Keimung 10 + Anzucht 21 + Wachstum 40 = 71 d, freigegebene typ-Werte). |
| P3 | `ak.lactuca_sativa.schnitt.kulturdauer_max_d#1` | max ≥ Saat bis erste Ernte + (Schnitte − 1) · Intervall | 6 Wochen = 42 d | In der Quelle ist das stimmig (erster Schnitt 5 Wochen ab Saat, zweiter eine Woche später), mit den freigegebenen Werten aber knapp: Keimung typ 3 + Anzucht typ 9 + Wachstum typ 28 = 40 d plus 7 d = 47 d > 42 d; nur mit den Minima (3 + 8 + 24 = 35 d, plus 7 = 42 d) geht es auf. |
| P4 | `ak.lactuca_sativa.schnitt.schnitte_max#1` | Bezug | 2 | 2 ist die Empfehlung der Quelle (danach neu säen), im Versuch selbst gab es sechs Schnitte über zehn Wochen; das passt zu P3, denn ein höherer `schnitte_max` bräuchte eine längere Kulturdauer. |
| P5 | `ak.capsicum_annuum.dauerkultur_frucht.ernteintervall_d#1` | Fundstelle | 1 Woche = 7 d | Dieselbe Fundstelle nennt zweimal je Woche als üblich (etwa 3 bis 4 d); 7 d ist also das längere der beiden genannten Intervalle, und mangels `kulturdauer_max_d` und `schnitte_max` lässt sich Intervall mal Pflückgänge nicht gegen die Kulturdauer prüfen. |
| P6 | `ak.solanum_lycopersicum.dauerkultur_frucht.kulturdauer_max_d#1` | max ≥ Saat bis erste Ernte | 364 d | Unauffällig: Keimung 8 + Anzucht 21 + `ernte_ab_d` 71 = 100 d (mit max-Werten 107 d), Summe aller fünf Phasen typ 146 d; der Wert stammt aus einem Jahresplan im Gewächshaus und gibt etwa 260 Erntetage. |
| P7 | `ak.valerianella_locusta.kopf.kulturdauer_max_d#2` | max ≥ typisch, max ≥ Saat bis Ernte | 66 d | Unauffällig: ≥ `kulturdauer_typisch_d` 51 und ≥ `umsetzen_ab_d` 22 + `ernte_ab_d` 29 = 51 d; Phasen-Maxima 14 + 14 + 36 = 64 d ≤ 66 d (die Quelle meint mit 66 Tagen ab Saat die Marktreife in einer anderen Studie, nicht einen Abbruch). |
| P8 | `ak.brassica_rapa_chinensis.kopf.kulturdauer_max_d#1` | max ≥ typisch, Bezug ab Saat | 60 d | ≥ typisch 32 und genau gleich der Summe der Phasen-Maxima 7 + 18 + 35 = 60 d; die Fundstelle lässt aber offen, ob die Seite ab Saat oder ab Keimung zählt (ab Keimung wären es bis etwa 67 d ab Saat), und der Wert gilt für grosse Sorten, fast doppelt so lang wie der freigegebene typ-Wert. |
| P9 | `ak.ocimum_basilicum.schnitt.ernteintervall_d#2` | Kulturform, Intervall gegen Kulturdauer | 3 Wochen = 21 d | Plausibel neben Wachstum typ 23 d; «roughly» ist ein Näherungswert, laut Fundstelle passt die Stelle auch zu `dauerkultur_blatt` (dort kein Kandidat), und ohne `kulturdauer_max_d` und `schnitte_max` ist keine Kontrolle gegen die Kulturdauer möglich (erster Schnitt ab Saat: 9 + 18 + 50 = 77 d). |
| P10 | `ak.petroselinum_crispum.dauerkultur_blatt.ernteintervall_d#1`, `#2` | Intervall gegen Phasen | 1 Woche = 7 d | Unauffällig: Keimung 14 + Anzucht 7 + Wachstum 28 = 49 d bis zur ersten Ernte, deckungsgleich mit dem Beginn der wöchentlichen Ernten in vt-spes-466-2023 (49 bis 84 d). |
| P11 | `ak.spinacia_oleracea.schnitt.ernteintervall_d#1`, `ak.spinacia_oleracea.schnitt.schnitte_max#2` | Intervall · Schnitte gegen Kulturdauer | 7 d, 3 | Untereinander stimmig: erster Schnitt nach Fundstelle 12 bis 16 d ab Saat (Direktsaat, vgl. freigegeben babyleaf `ernte_ab_d` 14) plus 2 · 7 d = etwa 28 d. Ein späteres `kulturdauer_max_d` muss mindestens 28 d sein, mit den freigegebenen Phasenwerten für Umsetzen (7 + 10 + 24 + 14) etwa 55 d. Kulturgruppenvergleich: Salat schnitt hat 2 Schnitte bei 7 d, das passt. |

## Lückenliste (Klasse D, Prüfauftrag)

Kombinationen aus `auftrag_runde-11.md` ohne geprüften Kandidaten (27):

| Art | Kulturform | Feld |
|---|---|---|
| lactuca_sativa | kopf | kulturdauer_max_d (#1 verworfen) |
| lactuca_sativa | babyleaf | kulturdauer_max_d |
| solanum_lycopersicum | dauerkultur_frucht | ernteintervall_d |
| solanum_lycopersicum | dauerkultur_frucht | schnitte_max (nur, wenn eine Quelle Pflückgänge nennt) |
| capsicum_annuum | dauerkultur_frucht | schnitte_max (nur, wenn eine Quelle Pflückgänge nennt) |
| capsicum_annuum | dauerkultur_frucht | kulturdauer_max_d |
| ocimum_basilicum | dauerkultur_blatt | ernteintervall_d |
| ocimum_basilicum | dauerkultur_blatt | schnitte_max |
| ocimum_basilicum | dauerkultur_blatt | kulturdauer_max_d |
| ocimum_basilicum | schnitt | schnitte_max (#1 verworfen) |
| ocimum_basilicum | schnitt | kulturdauer_max_d (#1 verworfen) |
| allium_schoenoprasum | dauerkultur_blatt | ernteintervall_d |
| allium_schoenoprasum | dauerkultur_blatt | schnitte_max |
| allium_schoenoprasum | schnitt | ernteintervall_d |
| allium_schoenoprasum | schnitt | schnitte_max |
| allium_schoenoprasum | schnitt | kulturdauer_max_d |
| petroselinum_crispum | dauerkultur_blatt | schnitte_max |
| petroselinum_crispum | dauerkultur_blatt | kulturdauer_max_d (#1 verworfen) |
| spinacia_oleracea | schnitt | kulturdauer_max_d (#1 verworfen) |
| spinacia_oleracea | babyleaf | kulturdauer_max_d (#1 verworfen) |
| spinacia_oleracea | kopf | kulturdauer_max_d |
| beta_vulgaris_conditiva | schnitt | ernteintervall_d |
| beta_vulgaris_conditiva | schnitt | schnitte_max |
| beta_vulgaris_conditiva | schnitt | kulturdauer_max_d |
| beta_vulgaris_cicla | schnitt | ernteintervall_d (#1 verworfen, Quelle nicht gefunden) |
| beta_vulgaris_cicla | schnitt | schnitte_max (#1 verworfen) |
| beta_vulgaris_cicla | schnitt | kulturdauer_max_d (#1 verworfen) |

Vollständig belegt sind: lactuca_sativa schnitt (alle drei Felder), valerianella_locusta kopf, brassica_rapa_chinensis kopf.

Hinweis für die Prüfung, kein Auftragsfeld: Für lactuca_sativa schnitt und spinacia_oleracea schnitt fehlt ein freigegebenes `ernte_ab_d`. Damit lassen sich P3 und P11 nur über die Phasendauern bzw. die Fundstelle prüfen.

## Bestätigungen

| Art | Kulturform | Feld | Wert | Kandidaten |
|---|---|---|---|---|
| petroselinum_crispum | dauerkultur_blatt | ernteintervall_d | 1 (Wochen, «weekly») | `#1` vt-spes-466-2023 (B1; Steinwolle in NFT, Stack, Ebbe-Flut, DWC) und `#2` fshs-kraeuter-vertikal-2001 (A; Verti-Gro-Türme mit Perlit, Gewächshaus) |
