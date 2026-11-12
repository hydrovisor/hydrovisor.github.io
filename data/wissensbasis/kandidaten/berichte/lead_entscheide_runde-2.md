# Lead-Entscheide W0 Runde 2 (Entscheid 0018, Issue #188)
Stand 12.11.2026. Erzeugt aus den Kandidatendateien (Spalte `notiz_tim` der freigegebenen Zeilen). Werkzeug: `scripts/w0/lead_entscheide.py` mit `scripts/w0/w0lib.py`.

## Fachregeln für offene Werte (A)
| Regel | Inhalt |
|---|---|
| D1 | Bereich ohne typischen Wert: typ = abgerundete Mitte |
| D2 | mehrere Einzelwerte: min und max = kleinster und grösster Quellenwert, typ = Wert der besten Quelle nach Regel 9.3 |
| D3 | ein Einzelwert x: min = 0.8·x, max = 1.25·x (gerundet), typ = x |
| D4 | Angabe in Wochen: Tage = 7·Wochen |
| D5 | Tage ab Saat: minus Keimdauer typ der Art |
| E1 | pH- oder EC-Einzelwert: Band ±0.2 um den Wert |
| E2 | Band über der Validatorgrenze: auf die Grenze gekürzt |
| E3 | EC-Basis nach der Quelle korrigiert (Methodenprüfer) |

Dazu: Titel von sechs Quellen nach dem Befund der Quellenprüfung korrigiert; Stammfelder `name_de` und `kulturgruppe_id` nach 03_import_w0.md 4.3.1 und 4.2.1 (Herkunft GBIF); Kulturformen nach der Matrix in Entscheid 0018, soweit belegt; `ernteart` nach R1.2; Saatempfehlungen Klasse D, wo keine Quelle der Skala A bis C vorliegt; Kulturgruppen-Mindestzeilen (V13) als Kopie der Leitkultur.

## Zeilen mit Annahme (A) oder eigenem Wert

| zeile_id | Wert | Entscheid |
|---|---|---|
| `art.lactuca_sativa.systemeignung` | beide | eigener Wert aus art.lactuca_sativa.systemeignung#1: (A) Kratky belegt durch #1, DWC durch #2; beide B1, also «beide» |
| `art.lactuca_sativa.kulturform_vorgabe` | schnitt | eigener Wert aus art.lactuca_sativa.kulturformen_erlaubt#1: (A) Vorgabe schnitt nach Entscheid 0018 (Sorten Roxette als Schnittsalat, Lollo, Lattughino Pflücksalat, R12.3); Quelle belegt die Form schnitt |
| `art.lactuca_sativa.name_de` | Salat | (A) Stammfeld nach Spezifikation; Herkunft GBIF wie name_wiss (03_import_w0.md 4.3), der Wert selbst steht nicht in GBIF |
| `art.lactuca_sativa.kulturgruppe_id` | blattsalat | (A) Stammfeld nach Spezifikation; Herkunft GBIF wie name_wiss (03_import_w0.md 4.3), der Wert selbst steht nicht in GBIF |
| `art.valerianella_locusta.kulturgruppe_id` | blattsalat | (A) Stammfeld nach Spezifikation; Herkunft GBIF wie name_wiss (03_import_w0.md 4.3), der Wert selbst steht nicht in GBIF |
| `ak.lactuca_sativa.babyleaf.ernteart` | einmalig | eigener Wert aus art.lactuca_sativa.kulturformen_erlaubt#1: (A) Ernteart einmalig folgt aus der Kulturform babyleaf (Konzept R1.2); Quelle belegt die Kulturform |
| `art.brassica_rapa_chinensis.systemeignung` | beide | eigener Wert aus art.brassica_rapa_chinensis.systemeignung#2: (A) DWC belegt durch #1 (Cornell GPN), Kratky durch #2 (CTAHR VC-1); beide B1, also «beide» |
| `art.beta_vulgaris_cicla.name_de` | Mangold | (A) Stammfeld nach Spezifikation; Herkunft GBIF wie name_wiss (03_import_w0.md 4.3), der Wert selbst steht nicht in GBIF |
| `art.beta_vulgaris_conditiva.name_de` | Randen | (A) Stammfeld nach Spezifikation; Herkunft GBIF wie name_wiss (03_import_w0.md 4.3), der Wert selbst steht nicht in GBIF |
| `ak.spinacia_oleracea.babyleaf.ernteart` | einmalig | eigener Wert aus art.spinacia_oleracea.kulturformen_erlaubt#1: (A) Ernteart einmalig folgt aus der Kulturform babyleaf (Konzept R1.2); Quelle belegt die Kulturform |
| `ak.spinacia_oleracea.kopf.ernteart` | einmalig | eigener Wert aus art.spinacia_oleracea.kulturformen_erlaubt#1: (A) Ernteart einmalig folgt aus der Kulturform kopf (Konzept R1.2); Quelle belegt die Kulturform |
| `art.beta_vulgaris_cicla.kulturform_vorgabe` | schnitt | eigener Wert aus art.beta_vulgaris_cicla.kulturformen_erlaubt#1: (A) Vorgabe schnitt nach Entscheid 0018 (erste erlaubte Form der Matrix); Quelle belegt die Form |
| `ak.beta_vulgaris_cicla.schnitt.ernteart` | mehrfach | eigener Wert aus art.beta_vulgaris_cicla.kulturformen_erlaubt#1: (A) Ernteart mehrfach folgt aus der Kulturform schnitt (Konzept R1.2); Quelle belegt die Kulturform |
| `art.beta_vulgaris_conditiva.kulturform_vorgabe` | schnitt | eigener Wert aus art.beta_vulgaris_conditiva.kulturformen_erlaubt#1: (A) Vorgabe schnitt nach Entscheid 0018 (erste erlaubte Form der Matrix); Quelle belegt die Form |
| `pw.lactuca_sativa.wachstum.ec` | 1.2/1.5 mS/cm | (A) Vorschlag #2 (1.5 bis 2.0) verfehlt die Gegenprobe 1.2 um 0.55; #7 (B1, CTAHR, Kratky wie die Anlage, Regel 2) hält sie ein (Bandmitte 1.35 gesamt) |
| `pw.lactuca_sativa.keimung.dauer` | 3/3/4  | eigener Wert aus pw.lactuca_sativa.keimung.dauer#6: Regel D1 (A), typ 3 bestätigt durch #3 und #5 (frankiesgarten, «etwa 3 Tage») |
| `pw.lactuca_sativa.anzucht.dauer` | 8/9/15  | eigener Wert aus pw.lactuca_sativa.anzucht.dauer#4: Regel D5 (A): 11 Tage ab Saat (#4) minus Keimung 3 = 8; typ 9 und max 15 aus dem Umsetzfenster 12 bis 18 Tage ab Saat (art.umsetzen_ab_d/bis_d, utk) minus Keimung 3 |
| `pw.lactuca_sativa.wachstum.dauer` | 24/28/42  | eigener Wert aus pw.lactuca_sativa.wachstum.dauer#6: Regel D2 und D4 (A): 4 bis 6 Wochen nach dem Umsetzen (#6, CTAHR, Kratky wie die Anlage, Regel 2) = 28 bis 42 Tage, typ 28; min 24 aus #1 und #3 (Cornell, DLI 17) |
| `pw.valerianella_locusta.keimung.keimtemp` | 15/17/20  | eigener Wert aus pw.valerianella_locusta.keimung.keimtemp#1: (A) Optimum «c. 15-20 °C» derselben Fundstelle, Regel D1; B1 vor C (#2 15 bis 18) |
| `pw.valerianella_locusta.wachstum.ph` | 5.6/6.0  | eigener Wert aus pw.valerianella_locusta.wachstum.ph#1: Regel D2 für pH (A): Band zwischen #1 (5.6) und #2 (6) bzw. E1 |
| `pw.valerianella_locusta.wachstum.ec` | 1.2/1.6 mS/cm | eigener Wert aus pw.valerianella_locusta.wachstum.ec#2: Regel E1 (A); #1 (2.47) liegt über der Validatorgrenze 2.0; Gegenprobe 1.0 gerade eingehalten |
| `pw.valerianella_locusta.wachstum.dauer` | 23/29/36  | eigener Wert aus pw.valerianella_locusta.wachstum.dauer#1: Regel D3 (A) |
| `pw.valerianella_locusta.anzucht.ph` | 5.8/6.2  | eigener Wert aus pw.valerianella_locusta.anzucht.ph#1: Regel E1 (A), Direktsaat-Quelle ohne getrennte Anzucht |
| `pw.valerianella_locusta.anzucht.ec` | 1.2/1.6 mS/cm | eigener Wert aus pw.valerianella_locusta.anzucht.ec#1: Regel E1 (A), Direktsaat-Quelle ohne getrennte Anzucht |
| `pw.standard.wachstum.wassertemp` | 22/24  | eigener Wert aus pw.standard.wachstum.wassertemp#2: (A) 72 bis 75 °F umgerechnet und auf ganze °C gerundet (22.2 bis 23.9 °C) |
| `pw.solanum_lycopersicum.bluete.ec` | 2.0/2.5 mS/cm | (A) Vorschlag #1 (A, 1.2 bis 1.4, Single-Truss-Kurzkultur) verfehlt die Gegenprobe (1.9 bzw. 2.1) um über 0.4; frankiesgarten 2.0 bis 2.5 (C) hält sie ein und gilt für kompakte Sorten im Tower |
| `pw.solanum_lycopersicum.fruchtbildung_reife.ec` | 2.0/2.5 mS/cm | (A) Vorschlag #1 (A, 1.2 bis 1.4, Single-Truss-Kurzkultur) verfehlt die Gegenprobe (1.9 bzw. 2.1) um über 0.4; frankiesgarten 2.0 bis 2.5 (C) hält sie ein und gilt für kompakte Sorten im Tower |
| `pw.capsicum_annuum.keimung.dauer` | 7/8/10  | eigener Wert aus pw.capsicum_annuum.keimung.dauer#1: Regel D1 (A), B1 artspezifisch vor Wochenraster #4 und C #5 |
| `pw.capsicum_annuum.anzucht.ec` | 0.5/1.0 mS/cm | eigener Wert aus pw.capsicum_annuum.anzucht.ec#4: (A) Band aus den beiden Stufen derselben Quelle (Anzucht 0.5, Jungpflanze 1.0); #1 und #3 (2.5, 2.3) beschreiben das Tränken der Steinwollblöcke, kein Sollband (Fachkritik P4, P5); Gegenprobe 1.1 eingehalten |
| `pw.capsicum_annuum.bluete.dauer` | 9/11/14  | eigener Wert aus pw.capsicum_annuum.bluete.dauer#3: Regel D3 (A), 44 minus 33 Tage (Chapingo); #2 (rmca 2022) nennt ebenfalls 11 Tage |
| `pw.capsicum_annuum.fruchtbildung_reife.dauer` | 46/58/73  | eigener Wert aus pw.capsicum_annuum.fruchtbildung_reife.dauer#7: Regel D3 (A), Erntebeginn 102 minus Fruchtansatz 44 Tage (Chapingo) |
| `pw.solanum_lycopersicum.keimung.dauer` | 6/8/10  | eigener Wert aus pw.solanum_lycopersicum.keimung.dauer#3: Regel D1 (A); artspezifische Angabe 6 bis 10 Tage vor dem Wochenraster #2 (B1, «Woche 2», gleicher Wert für Chili), Abweichung von Regel 1 |
| `pw.solanum_lycopersicum.anzucht.dauer` | 17/21/26  | eigener Wert aus pw.solanum_lycopersicum.anzucht.dauer#2: Regel D3 (A) |
| `pw.capsicum_annuum.bluete.ec` | 1.8/2.2 mS/cm | eigener Wert aus pw.capsicum_annuum.bluete.ec#4: (A) Regel E1; Vorschlag #1 (0.8 bis 1.8) verfehlt die Gegenprobe (1.9 bzw. 2.1) um über 0.4; Alberta 2.5 bis 3.0 überschreitet die Validatorgrenze 2.6 |
| `pw.capsicum_annuum.fruchtbildung_reife.ec` | 1.8/2.2 mS/cm | eigener Wert aus pw.capsicum_annuum.fruchtbildung_reife.ec#4: (A) Regel E1; Vorschlag #1 (0.8 bis 1.8) verfehlt die Gegenprobe (1.9 bzw. 2.1) um über 0.4; Alberta 2.5 bis 3.0 überschreitet die Validatorgrenze 2.6 |
| `pw.brassica_rapa_chinensis.keimung.dauer` | 4/5/7  | eigener Wert aus pw.brassica_rapa_chinensis.keimung.dauer#2: Regel D1 (A) |
| `pw.brassica_rapa_chinensis.keimung.keimtemp` | 20/22/25  | eigener Wert aus pw.brassica_rapa_chinensis.keimung.keimtemp#2: Regel D1 (A) |
| `pw.brassica_rapa_chinensis.anzucht.dauer` | 11/14/18  | eigener Wert aus pw.brassica_rapa_chinensis.anzucht.dauer#4: Regel D3 (A); passt zum Umsetzfenster 14 bis 16 Tage ab Saat (sfa) |
| `pw.brassica_rapa_chinensis.anzucht.ec` | 1/1.4 mS/cm | eigener Wert aus pw.brassica_rapa_chinensis.anzucht.ec#1: Regel E1 (A), Klasse A vor C; Gegenprobe 1.0 eingehalten |
| `pw.brassica_rapa_chinensis.wachstum.dauer` | 14/21/35  | eigener Wert aus pw.brassica_rapa_chinensis.wachstum.dauer#2: Regel D2 (A): typ 21 aus #2 (A, Indoor-LED, Regel 2) und #1 (B1), min 14 aus #4 (C), max 35 aus #3 (A, Gewächshaus) |
| `pw.ocimum_basilicum.keimung.dauer` | 5/9/14  | eigener Wert aus pw.ocimum_basilicum.keimung.dauer#2: Regel D1 (A) |
| `pw.ocimum_basilicum.keimung.keimtemp` | 20/22/25  | eigener Wert aus pw.ocimum_basilicum.keimung.keimtemp#1: Regel D1 (A), B1 vor C |
| `pw.ocimum_basilicum.anzucht.ec` | 0.4/0.8 mS/cm | eigener Wert aus pw.ocimum_basilicum.anzucht.ec#3: (A) Band aus den beiden Stufen derselben Quelle (Anzucht 0.4, Jungpflanze 0.8, #3 und #4); Gegenprobe 1.0 um 0.4 (Grenze) |
| `pw.ocimum_basilicum.wachstum.dauer` | 18/23/50  | eigener Wert aus pw.ocimum_basilicum.wachstum.dauer#4: Regel D2/D3 (A): typ 23 aus #4 (A, Floating Raft wie DWC der Anlage, Regel 2), min 0.8·23, max 50 aus #3 (A, NFT Gewächshaus, Herbst-Winter) |
| `pw.petroselinum_crispum.keimung.dauer` | 7/14/18  | eigener Wert aus pw.petroselinum_crispum.keimung.dauer#3: Regel D2/D3 (A): typ 14 aus #3 (B1, Regel 1), min 7 aus #1 (C), max 1.25·14 |
| `pw.petroselinum_crispum.keimung.keimtemp` | 15/17/20  | eigener Wert aus pw.petroselinum_crispum.keimung.keimtemp#1: Regel D1 (A) |
| `pw.petroselinum_crispum.wachstum.dauer` | 28/28/42  | eigener Wert aus pw.petroselinum_crispum.wachstum.dauer#2: Regel D2/D4 (A): typ und min 4 Wochen aus #2 (A), max 6 Wochen aus #1 (B2, 5 bis 6 Wochen nach dem Umsetzen) |
| `pw.allium_schoenoprasum.wachstum.dauer` | 32/40/50  | eigener Wert aus pw.allium_schoenoprasum.wachstum.dauer#1: Regel D3 (A) |
| `pw.spinacia_oleracea.keimung.dauer` | 5/7/10  | eigener Wert aus pw.spinacia_oleracea.keimung.dauer#2: Regel D1 (A) |
| `pw.spinacia_oleracea.keimung.keimtemp` | 25/25/26  | eigener Wert aus pw.spinacia_oleracea.keimung.keimtemp#1: Regel D2 (A): Einzelwerte 25 (#1) und 26 (#2) derselben B1-Quelle (Cornell), Regel 1 vor B2 und C |
| `pw.spinacia_oleracea.anzucht.dauer` | 7/10/14  | eigener Wert aus pw.spinacia_oleracea.anzucht.dauer#2: Regel D4/D5/D1 (A): 2 bis 3 Wochen ab Saat = 14 bis 21 Tage minus Keimung typ 7 = 7 bis 14 |
| `pw.spinacia_oleracea.wachstum.dauer` | 21/24/28  | eigener Wert aus pw.spinacia_oleracea.wachstum.dauer#2: Regel D4/D1 (A): 3 bis 4 Wochen (UGA, B1) bis zur Ernte nach dem Umsetzen |
| `pw.beta_vulgaris_cicla.keimung.dauer` | 1/4/7  | eigener Wert aus pw.beta_vulgaris_cicla.keimung.dauer#2: Regel D1 (A); Untergrenze 0 der Quelle auf 1 Tag gesetzt (Validator: über 0) |
| `pw.beta_vulgaris_cicla.keimung.keimtemp` | 15/17/20  | eigener Wert aus pw.beta_vulgaris_cicla.keimung.keimtemp#2: Regel D1 (A) |
| `pw.beta_vulgaris_conditiva.keimung.dauer` | 2/3/4  | eigener Wert aus pw.beta_vulgaris_conditiva.keimung.dauer#1: Regel D3 (A) |
| `pw.beta_vulgaris_conditiva.keimung.keimtemp` | 20/20/21  | eigener Wert aus pw.beta_vulgaris_conditiva.keimung.keimtemp#1: Regel D1 (A), Band 1 °C der Quelle |
| `pw.beta_vulgaris_conditiva.wachstum.ec` | 1.6/2 mS/cm | eigener Wert aus pw.beta_vulgaris_conditiva.wachstum.ec#4: Regel E1/E2 (A), Obergrenze 2.0 |
| `pw.beta_vulgaris_cicla.wachstum.dauer` | 24/30/38  | eigener Wert aus pw.beta_vulgaris_cicla.wachstum.dauer#4: Regel D3 (A); Ernte 30 Tage nach dem Umsetzen |
| `pw.beta_vulgaris_cicla.wachstum.ec` | 1.3/1.7 mS/cm | eigener Wert aus pw.beta_vulgaris_cicla.wachstum.ec#4: (A) Regel E1; Einheit der Quelle «mhos/cm2» als mmho/cm = mS/cm gelesen (Grössenordnung der Kopfsalat-Lösung derselben Quelle) |
| `se.lactuca_sativa.babyleaf` | 6/12/6 (Klasse C) | eigener Wert aus se.lactuca_sativa.babyleaf#1: (A) Bereich 6 bis 12 Samen je Zelle der Quelle; Babyleaf wird als Büschel geerntet, alle Keimlinge bleiben stehen |
| `se.valerianella_locusta.kopf` | 3/4/3 (Klasse D) | Saatempfehlung Klasse D (Entscheid 0018 Punkt 4): Feldsalat wird als Rosettenbüschel geerntet; mehrere Pflanzen je Würfel wie bei Kräutern |
| `se.allium_schoenoprasum.dauerkultur_blatt` | 4/5/4 (Klasse B) | eigener Wert aus se.allium_schoenoprasum.dauerkultur_blatt#2: (A) 3 bis 5 Samen je Würfel (frankiesgarten, Klasse B), typ 4 wie Fork Farms (B); Schnittlauch wächst als Büschel, alle Keimlinge bleiben stehen |
| `se.allium_schoenoprasum.schnitt` | 4/5/4 (Klasse B) | eigener Wert aus se.allium_schoenoprasum.schnitt#1: (A) 3 bis 5 Samen je Würfel (frankiesgarten, Klasse B), typ 4 wie Fork Farms (B); Schnittlauch wächst als Büschel, alle Keimlinge bleiben stehen |
| `se.petroselinum_crispum.dauerkultur_blatt` | 15/15/15 (Klasse D) | Saatempfehlung Klasse D (Entscheid 0018 Punkt 4): entschieden von Tim, Konzept R12.3 (Petersilie 15 Samen je Schwamm, Büschel); Obergrenze und Pflanzen stehen lassen nach Entscheid 0018; Quellen der Klasse B nennen 3 bis 6 Samen (offen) |
| `se.beta_vulgaris_cicla.schnitt` | 1/2/1 (Klasse C) | eigener Wert aus se.beta_vulgaris_cicla.schnitt#1: (A) Quelle lässt eine Pflanze stehen; ein Knäuel je Würfel (Beta-Knäuel mit 2 bis 4 Keimlingen), Obergrenze 2 bei schwacher Keimung |
| `se.spinacia_oleracea.schnitt` | 2/3/1 (Klasse D) | Saatempfehlung Klasse D (Entscheid 0018 Punkt 4): Schnittkultur mit einer kräftigen Pflanze je Würfel; 2 Samen wegen mässiger Keimfähigkeit |
| `se.beta_vulgaris_conditiva.schnitt` | 1/2/1 (Klasse D) | Saatempfehlung Klasse D (Entscheid 0018 Punkt 4): ein Knäuel je Würfel (2 bis 4 Keimlinge), stärkste Pflanze stehen lassen wie bei Mangold (Rise) |

67 Zeilen. Die Kulturgruppen-Mindestzeilen (V13) sind Kopien freigegebener Art-Zeilen und hier nicht einzeln aufgeführt; Kopien aus einer anderen Gruppe tragen in `notiz_tim` «(A) andere Art».
