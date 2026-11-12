# Fachkritik Pak Choi (`brassica_rapa_chinensis`)

W0-Probelauf, Issue #184, 12.11.2026. Kulturgruppe `kohl` (Leitkultur), Kulturform im Auftrag `kopf` (Sorte Misome, DWC). Grundlage: Zeilen mit `status = geprueft` in `data/wissensbasis/kandidaten/teile/kohl/` (`art.csv`, `profilwert.csv`, `profilwert_offen.csv`, `saatempfehlung.csv`, `quelle.csv`); `saatempfehlung_offen.csv` gibt es für `kohl` nicht. Verworfene Zeilen zählen nicht als Kandidaten. Regeln: Konzept 9.1, 9.3, 9.4, R1.1; `03_import_w0.md` 4.4, 6, 7, 9.

Zusammenfassung: 10 Konflikte (davon 2 «nur offener Wert»), 16 Plausibilitätsbefunde, 20 Lücken der Art (dazu ein Hinweis V13 zur Ebene Kulturgruppe), 4 Bestätigungen.

Hinweis an den Koordinator: Konzept 9.3 nennt höchstens vier Konflikte je Runde; Pak Choi allein hat zehn.

## 1 Konfliktliste

Konflikt-IDs sind in den Arbeitsdateien in der Spalte `konflikt_id` gesetzt. Kein Kandidat ist bevorzugt; die Reihenfolge folgt der Datei.

Spalten «System» und «Umgebung»: bei `profilwert` aus `system_quelle` und `umgebung_quelle`; bei `art.csv` und `saatempfehlung.csv` gibt es diese Spalten nicht, dort steht `anbaumethode` der Quelle und die Umgebung nur, soweit die Fundstelle sie nennt.

### K-pakchoi-01 – Artmerkmal `umsetzen_ab_d` (Tage ab Saat)

| kandidat_id | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| art.brassica_rapa_chinensis.umsetzen_ab_d#1 | 14 | d | – | sfa-ph-blattgemuese-2026 | B1 | nft (Anzucht in Oasis-Horticubes) | nicht angegeben | 2026 |
| art.brassica_rapa_chinensis.umsetzen_ab_d#2 | 7 | d | – | risegardens-bok-choy-2026 | B2 | dwc | nicht angegeben | 2026 |

### K-pakchoi-02 – Artmerkmal `umsetzen_bis_d` (Tage ab Saat)

| kandidat_id | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| art.brassica_rapa_chinensis.umsetzen_bis_d#1 | 16 | d | – | sfa-ph-blattgemuese-2026 | B1 | nft (Anzucht in Oasis-Horticubes) | nicht angegeben | 2026 |
| art.brassica_rapa_chinensis.umsetzen_bis_d#2 | 10 | d | – | risegardens-bok-choy-2026 | B2 | dwc | nicht angegeben | 2026 |

### K-pakchoi-03 – Kulturform `kopf`, `ernte_ab_d` (Tage ab Umsetzen)

| kandidat_id | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| ak.brassica_rapa_chinensis.kopf.ernte_ab_d#1 | 21 | d | – | sfa-ph-blattgemuese-2026 | B1 | nft | Gewächshaus (laut Kurzzitat) | 2026 |
| ak.brassica_rapa_chinensis.kopf.ernte_ab_d#2 | 21 | d | – | frontiers-pakchoi-photoperiode-2025 | A | ebbe_flut | Klimakammer mit LED (laut Fundstelle) | 2025 |
| ak.brassica_rapa_chinensis.kopf.ernte_ab_d#3 | 35 | d | – | caatinga-pakchoi-ec-2024 | A | nft (und Substrat) | Gewächshaus (laut Fundstelle) | 2024 |

#1 und #2 stimmen überein (Bestätigung B1).

### K-pakchoi-04 – Phase `anzucht`, `wechselmerkmal`

| kandidat_id | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| pw.brassica_rapa_chinensis.anzucht.wechselmerkmal#1 | Hat der Sämling 4 bis 5 echte Laubblätter? | – | – | caatinga-pakchoi-ec-2024 | A | nft | gewaechshaus | 2024 |
| pw.brassica_rapa_chinensis.anzucht.wechselmerkmal#2 | Sind Wurzeln unten am Würfel sichtbar? | – | – | risegardens-bok-choy-2026 | B2 | dwc | indoor_led | 2026 |
| pw.brassica_rapa_chinensis.anzucht.wechselmerkmal#3 | Ist das sechste Laubblatt voll entfaltet? | – | – | plosone-pakchoi-ec-2018 | A | ebbe_flut | gewaechshaus | 2018 |

### K-pakchoi-05 – Phase `anzucht`, `ph`

| kandidat_id | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| pw.brassica_rapa_chinensis.anzucht.ph#1 | 6.0 bis 7.0 | pH | – | sfa-ph-blattgemuese-2026 | B1 | substrat_inert | andere | 2026 |
| pw.brassica_rapa_chinensis.anzucht.ph#2 (offen: Einzelwert) | 5.8 | pH | – | plosone-pakchoi-ec-2018 | A | ebbe_flut | gewaechshaus | 2018 |

### K-pakchoi-06 – Phase `anzucht`, `ec` – nur offener Wert

| kandidat_id | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| pw.brassica_rapa_chinensis.anzucht.ec#1 (offen: Einzelwert) | 1.2 | mS/cm | gesamt | plosone-pakchoi-ec-2018 | A | ebbe_flut | gewaechshaus | 2018 |

Kein ladbarer Kandidat; die Pflichtgrösse `ec` der Phase `anzucht` (Ebene Art) hängt allein an diesem offenen Wert. Entscheid durch Tim.

### K-pakchoi-07 – Phase `wachstum`, `dauer` – nur offene Werte, Wertkonflikt

| kandidat_id | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| pw.brassica_rapa_chinensis.wachstum.dauer#1 (offen: Einzelwert) | 21 (nur min) | d ab Umsetzen | – | sfa-ph-blattgemuese-2026 | B1 | nft | gewaechshaus | 2026 |
| pw.brassica_rapa_chinensis.wachstum.dauer#2 (offen: Einzelwert) | 21 (nur min), Bezugstemperatur 24 °C | d ab Umsetzen | – | frontiers-pakchoi-photoperiode-2025 | A | ebbe_flut | indoor_led | 2025 |
| pw.brassica_rapa_chinensis.wachstum.dauer#3 (offen: Einzelwert) | 35 (nur min) | d ab Umsetzen | – | caatinga-pakchoi-ec-2024 | A | nft | gewaechshaus | 2024 |

Kein ladbarer Kandidat (alle in `profilwert_offen.csv`); zusätzlich weichen die Werte voneinander ab. #1 und #2 stimmen überein (Bestätigung).

### K-pakchoi-08 – Phase `wachstum`, `ph`

| kandidat_id | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| pw.brassica_rapa_chinensis.wachstum.ph#1 | 6.0 bis 7.0 | pH | – | sfa-ph-blattgemuese-2026 | B1 | nft | gewaechshaus | 2026 |
| pw.brassica_rapa_chinensis.wachstum.ph#2 | 6.0 bis 7.0, typ 6.5 | pH | – | risegardens-bok-choy-2026 | B2 | dwc | indoor_led | 2026 |
| pw.brassica_rapa_chinensis.wachstum.ph#3 | 5.5 bis 6.5 | pH | – | caatinga-pakchoi-ec-2024 | A | nft | gewaechshaus | 2024 |
| pw.brassica_rapa_chinensis.wachstum.ph#4 (offen: Einzelwert) | 5.8 | pH | – | plosone-pakchoi-ec-2018 | A | ebbe_flut | gewaechshaus | 2018 |
| pw.brassica_rapa_chinensis.wachstum.ph#5 (offen: Einzelwert) | 5.7 | pH | – | frontiers-pakchoi-photoperiode-2025 | A | ebbe_flut | indoor_led | 2025 |

Bereich 6.0 bis 7.0 von #1 und #2 übereinstimmend (Bestätigung); #2 nennt zusätzlich `wert_typ` 6.5.

### K-pakchoi-09 – Phase `wachstum`, `ec`

| kandidat_id | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| pw.brassica_rapa_chinensis.wachstum.ec#1 | 1.5 bis 2.0 | mS/cm | unbekannt | okstate-hla6722-2016 | B1 | substrat_inert | andere | 2016 |
| pw.brassica_rapa_chinensis.wachstum.ec#2 (offen: über Obergrenze, zwei Versuchsstufen) | 1.8 bis 2.4 | mS/cm | gesamt | plosone-pakchoi-ec-2018 | A | ebbe_flut | gewaechshaus | 2018 |
| pw.brassica_rapa_chinensis.wachstum.ec#3 (offen: Einzelwert, über Obergrenze) | 2.3 | mS/cm | unbekannt | frontiers-pakchoi-photoperiode-2025 | A | ebbe_flut | indoor_led | 2025 |
| pw.brassica_rapa_chinensis.wachstum.ec#4 (offen: über Obergrenze) | 1.5 bis 2.5 | mS/cm | unbekannt | risegardens-bok-choy-2026 | B2 | dwc | indoor_led | 2026 |

### K-pakchoi-10 – Saatempfehlung `se.brassica_rapa_chinensis.kopf`

| kandidat_id | Wert (Samen je Schwamm / Obergrenze / stehen lassen) | Einheit | Basis | Quelle | Klasse Saatmenge | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| se.brassica_rapa_chinensis.kopf#1 | 1 / 1 / 1 | Samen, Pflanzen | – | frontiers-pakchoi-photoperiode-2025 | B (Quelle A) | ebbe_flut, Steinwollstopfen | Klimakammer mit LED (laut Fundstelle Art) | 2025 |
| se.brassica_rapa_chinensis.kopf#2 | 5 / 5 / 1 | Samen, Pflanzen | – | caatinga-pakchoi-ec-2024 | C (Quelle A) | nft, Kokosfaser-Zellen | Gewächshaus (laut Fundstelle Art) | 2024 |

`pflanzen_stehen_lassen` = 1 in beiden Kandidaten übereinstimmend (Bestätigung).

## 2 Plausibilität

Umrechnung nur zur Prüfung: alle EC-Rohwerte stehen in mS/cm (dS/m), Faktor 1. Basis `unbekannt` rechnet als `gesamt` (03_import_w0.md 6), keine Zeile hat Basis `zuwachs`; die Gegenprobe vergleicht daher die Bandmitte direkt mit dem Düngeplan (Pak Choi: Anzucht 1.0, Wachstum 1.4 mS/cm). EC-Obergrenze der Kulturgruppe `kohl`: 2.0 mS/cm.

| Nr. | kandidat_id | Regel | Wert | Befund |
|---|---|---|---|---|
| P1 | pw.brassica_rapa_chinensis.anzucht.ph#2 | V5 Bandbreite pH 0.2 bis 1.2 | 5.8 | Einzelwert ohne Bereich, Bandbreite 0 liegt unter 0.2. |
| P2 | pw.brassica_rapa_chinensis.wachstum.ph#4 | V5 Bandbreite pH | 5.8 | Einzelwert ohne Bereich, Bandbreite 0 liegt unter 0.2. |
| P3 | pw.brassica_rapa_chinensis.wachstum.ph#5 | V5 Bandbreite pH | 5.7 | Einzelwert ohne Bereich, Bandbreite 0 liegt unter 0.2. |
| P4 | pw.brassica_rapa_chinensis.anzucht.ec#1 | V5 Bandbreite EC 0.2 bis 1.2 | 1.2 mS/cm | Einzelwert ohne Bereich, Bandbreite 0 liegt unter 0.2; Grenzen V4 (0.4 bis 2.0) und Gegenprobe (1.2 gegen 1.0, Abweichung 0.2) sind eingehalten. |
| P5 | pw.brassica_rapa_chinensis.wachstum.ec#2 | V4 EC 0.4 bis 2.0 | 1.8 bis 2.4 mS/cm | Obergrenze 2.4 liegt 0.4 über der Validatorgrenze 2.0 der Kulturgruppe `kohl`. |
| P6 | pw.brassica_rapa_chinensis.wachstum.ec#2 | Gegenprobe Düngeplan | Bandmitte 2.1 mS/cm | Bandmitte 2.1 weicht um 0.7 vom Vergleichswert 1.4 ab (über 0.4). |
| P7 | pw.brassica_rapa_chinensis.wachstum.ec#3 | V4 EC 0.4 bis 2.0 | 2.3 mS/cm | Wert 2.3 liegt 0.3 über der Validatorgrenze 2.0. |
| P8 | pw.brassica_rapa_chinensis.wachstum.ec#3 | V5 Bandbreite EC | 2.3 mS/cm | Einzelwert ohne Bereich, Bandbreite 0 liegt unter 0.2. |
| P9 | pw.brassica_rapa_chinensis.wachstum.ec#3 | Gegenprobe Düngeplan | 2.3 mS/cm | Wert 2.3 weicht um 0.9 vom Vergleichswert 1.4 ab (über 0.4). |
| P10 | pw.brassica_rapa_chinensis.wachstum.ec#4 | V4 EC 0.4 bis 2.0 | 1.5 bis 2.5 mS/cm | Obergrenze 2.5 liegt 0.5 über der Validatorgrenze 2.0. |
| P11 | pw.brassica_rapa_chinensis.wachstum.ec#4 | Gegenprobe Düngeplan | Bandmitte 2.0 mS/cm | Bandmitte 2.0 weicht um 0.6 vom Vergleichswert 1.4 ab (über 0.4). |
| P12 | pw.brassica_rapa_chinensis.wachstum.dauer#1 | V6, Form 4.4.1 (min, typ, max) | min 21 | Nur `wert_min` belegt, `wert_typ` und `wert_max` fehlen, V6 ist so nicht vollständig prüfbar (Wert über 0). |
| P13 | pw.brassica_rapa_chinensis.wachstum.dauer#2 | V6, Form 4.4.1 | min 21 | Nur `wert_min` belegt, `wert_typ` und `wert_max` fehlen, V6 ist so nicht vollständig prüfbar (Wert über 0). |
| P14 | pw.brassica_rapa_chinensis.wachstum.dauer#3 | V6, Form 4.4.1 | min 35 | Nur `wert_min` belegt, `wert_typ` und `wert_max` fehlen, V6 ist so nicht vollständig prüfbar (Wert über 0). |
| P15 | pw.brassica_rapa_chinensis.wachstum.dauer#3, ak.brassica_rapa_chinensis.kopf.ernte_ab_d#3, pw.brassica_rapa_chinensis.anzucht.wechselmerkmal#1 | Vergleich mit den übrigen Kandidaten der Art | 35 d ab Umsetzen, Umsetzen 35 d nach Saat | Die Caatinga-Studie (Gewächshaus) setzt nach 35 Tagen um und erntet nach weiteren 35 Tagen, gegenüber Umsetzen nach 7 bis 16 Tagen und Ernte 21 Tage nach Umsetzen in den drei übrigen Quellen; der Wert liegt damit rund 1.7-mal über den anderen Dauern, ohne Validatorverstoss. |
| P16 | pw.brassica_rapa_chinensis.wachstum.licht_h#1 | Vergleich mit Artmerkmal `photoperiode` | 12 bis 16 h | Pak Choi ist als `langtag` belegt, die `kritische_tageslaenge_h` fehlt jedoch, sodass nicht prüfbar ist, ob 16 h Licht das Schossen auslösen (V7 0 bis 24 h eingehalten). |

**Ohne Befund geprüft:** `anzucht.ph#1` 6.0 bis 7.0, `wachstum.ph#1` und `#2` 6.0 bis 7.0 (Obergrenze genau auf der Validatorgrenze 7.0, Bandbreite 1.0), `wachstum.ph#3` 5.5 bis 6.5 (Bandbreite 1.0); `wachstum.ec#1` 1.5 bis 2.0 mS/cm (V4 genau an der Obergrenze 2.0, Bandbreite 0.5, Gegenprobe Bandmitte 1.75 gegen 1.4, Abweichung 0.35 knapp unter 0.4; Basis `unbekannt` ergibt zur Laufzeit den Hinweis «EC-Basis unklar»); `anzucht.licht_h#1` 14 bis 16 h und `wachstum.licht_h#1` 12 bis 16 h (V7); BBCH `keimung` 0 bis 9, `anzucht` 10 bis 19, `wachstum` 41 bis 49 (0 bis 99); Wechselmerkmale unter 120 Zeichen (V10); `ernteart` `einmalig` passt zur Kulturform `kopf` (R1.2); `kulturdauer_typisch_d` 32 (Tage ab Saat) entspricht in derselben Quelle Umsetzen 11 plus Ernte 21; Saatempfehlungen erfüllen `obergrenze_samen` ≥ `samen_je_schwamm` und `pflanzen_stehen_lassen` ≥ 1, Klasse B bei gleicher Substratklasse und C bei abweichendem Substrat entspricht R12.3.

**Vergleich mit der Kulturgruppe:** In `teile/kohl/` ist Pak Choi die einzige Art; ein Vergleich mit anderen Arten der Kulturgruppe `kohl` ist nicht möglich.

## 3 Lückenliste

Klasse D, Prüfauftrag. Pflichtgrössen nach `03_import_w0.md` 9; verworfene Zeilen zählen nicht.

### 3.1 Phasen und Pflichtgrössen (6)

| Nr. | Art | Phase | Grösse | Bemerkung |
|---|---|---|---|---|
| L1 | brassica_rapa_chinensis | keimung | dauer | Pflicht auf Ebene Art; einziger Kandidat verworfen. Vorabladung der Keimung (03_import_w0.md 8 Nr. 4) betroffen. |
| L2 | brassica_rapa_chinensis | keimung | keimart | kein Kandidat |
| L3 | brassica_rapa_chinensis | keimung | keimtemp | einziger Kandidat verworfen (°F) |
| L4 | brassica_rapa_chinensis | anzucht | dauer | Pflicht auf Ebene Art; alle drei Kandidaten verworfen (Tage ab Saat) |
| L5 | brassica_rapa_chinensis | bluete | anwendbar | einziger Kandidat (`entfaellt`) verworfen; R1.1 verlangt bei Blattgemüse `entfaellt` |
| L6 | brassica_rapa_chinensis | fruchtbildung_reife | anwendbar | einziger Kandidat (`entfaellt`) verworfen; R1.1 verlangt bei Blattgemüse `entfaellt` |

Bedingt: Wird `bluete` oder `fruchtbildung_reife` als `ja` entschieden, fehlen dort alle Pflichtgrössen (`dauer`, `bbch`, `ph`, `ec`, `wechselmerkmal`) und in `wachstum` zusätzlich `wechselmerkmal`; bei `entfaellt` ist `wachstum` die letzte anwendbare Phase und braucht kein Wechselmerkmal.

Keine Lücke, aber nicht ladbar: `anzucht.ec` (K-pakchoi-06) und `wachstum.dauer` (K-pakchoi-07) haben nur offene Kandidaten. Ohne Entscheid fehlen damit Pflichtgrössen auf Ebene Art, und der Seed lädt Kulturform, Saatempfehlung und `profilwert` der Art nicht (03_import_w0.md 8 Nr. 4).

Nicht gezählt, weil keine Pflichtgrösse (Standardprofil, R1.4): `wassertemp` in `anzucht` und `wachstum` (einziger Kandidat verworfen, °F), `licht_h` in `keimung`.

### 3.2 Stammfelder (0)

`name_de`, `name_wiss`, `gbif_key`, `kulturgruppe_id` liegen vor.

### 3.3 Artmerkmale (12)

| Nr. | Art | Feld |
|---|---|---|
| L7 | brassica_rapa_chinensis | samentyp |
| L8 | brassica_rapa_chinensis | standard_keimfaehigkeit |
| L9 | brassica_rapa_chinensis | systemeignung |
| L10 | brassica_rapa_chinensis | liter_je_pflanze |
| L11 | brassica_rapa_chinensis | wasserbedarf_je_pflanze_l |
| L12 | brassica_rapa_chinensis | wuchshoehe_max_mm |
| L13 | brassica_rapa_chinensis | kritische_tageslaenge_h (nötig, weil `photoperiode` = `langtag`) |
| L14 | brassica_rapa_chinensis | bestaeubung_noetig |
| L15 | brassica_rapa_chinensis | pythium |
| L16 | brassica_rapa_chinensis | schossen_handlung |
| L17 | brassica_rapa_chinensis | kulturformen_erlaubt |
| L18 | brassica_rapa_chinensis | kulturform_vorgabe |

Nicht gezählt: `keimlinge_je_knaeuel` (nur bei Knäuelsaat), `aussaatfenster_outdoor` (optional).

### 3.4 Kulturform `kopf` (2)

| Nr. | Art | Kulturform | Feld |
|---|---|---|---|
| L19 | brassica_rapa_chinensis | kopf | kulturdauer_max_d |
| L20 | brassica_rapa_chinensis | kopf | entspitzen |

Nicht gezählt: `ernteintervall_d`, `schnitte_max` (nur bei `mehrfach`; `ernteart` ist `einmalig`).

### 3.5 Saatempfehlung (0)

`se.brassica_rapa_chinensis.kopf` hat zwei geprüfte Kandidaten (K-pakchoi-10).

### 3.6 Hinweis V13, Ebene Kulturgruppe `kohl`

In `teile/kohl/profilwert.csv` steht keine Zeile mit `ebene = kulturgruppe`. Für die Mindestzeilen nach 4.4.2 (fünfmal `anwendbar`; je anwendbare Phase `dauer`, `bbch`, `wechselmerkmal`, ausser in `keimung` auch `ph` und `ec`) fehlt damit alles; V13 bricht so ab. Die Quelle wäre nach 4.4.2 in der Regel die Leitkultur, hier Pak Choi.

## 4 Bestätigungen

| Zeile | Wert | Übereinstimmende Kandidaten |
|---|---|---|
| ak.brassica_rapa_chinensis.kopf.ernte_ab_d | 21 d ab Umsetzen | #1 sfa-ph-blattgemuese-2026 (B1, NFT, Gewächshaus), #2 frontiers-pakchoi-photoperiode-2025 (A, Ebbe-Flut, LED); Gegenwert #3 in K-pakchoi-03 |
| pw.brassica_rapa_chinensis.wachstum.dauer | 21 d (nur min) | #1 sfa-ph-blattgemuese-2026 (B1), #2 frontiers-pakchoi-photoperiode-2025 (A); beide offen, Gegenwert #3 in K-pakchoi-07 |
| pw.brassica_rapa_chinensis.wachstum.ph | 6.0 bis 7.0 | #1 sfa-ph-blattgemuese-2026 (B1, NFT, Gewächshaus), #2 risegardens-bok-choy-2026 (B2, DWC, LED; zusätzlich typ 6.5); weitere Werte in K-pakchoi-08 |
| se.brassica_rapa_chinensis.kopf, Feld `pflanzen_stehen_lassen` | 1 | #1 frontiers-pakchoi-photoperiode-2025, #2 caatinga-pakchoi-ec-2024; `samen_je_schwamm` weicht ab (K-pakchoi-10) |

## Runde 2 (12.11.2026)

Issue #188. Grundlage: alle Zeilen der Art mit `status = geprueft` oder `vorgeschlagen` in `teile/kohl/` (`art.csv`, `profilwert.csv`, `profilwert_offen.csv`, `saatempfehlung.csv`, neu auch `saatempfehlung_offen.csv`) und die zugehörigen Zeilen in `quelle.csv`; verworfene Zeilen zählen nicht. Kulturformen im Auftrag nach Entscheid 0018: `kopf;babyleaf`, Vorgabe `kopf`; eine Form ohne belegte Quelle entfällt.

Zusammenfassung Runde 2: 17 offene Konflikte (10 aus Runde 1, davon 4 mit neuen Kandidaten; 7 neu, K-pakchoi-11 bis K-pakchoi-17), davon 6 «nur offener Wert»; 10 neue Plausibilitätsbefunde (P17 bis P26, P1 bis P16 gelten weiter); 17 Lücken (keine Phasenlücke, 10 Artmerkmale, 2 Kulturform `kopf`, 5 Kulturform `babyleaf`), dazu 6 Pflichtzeilen ohne ladbaren Kandidaten und der Hinweis V13; 7 Bestätigungen.

Gesetzte `konflikt_id` in Runde 2: `profilwert.csv` anzucht.ph#3 (K-05), wachstum.ph#6 (K-08), wachstum.licht_h#1 und #2 (K-13); `profilwert_offen.csv` keimung.dauer#2 (K-14), keimung.keimtemp#2 (K-15), anzucht.dauer#4 (K-16), wachstum.dauer#4 (K-07); `saatempfehlung.csv` kopf#3 (K-10); `saatempfehlung_offen.csv` babyleaf#1 (K-17); `art.csv` systemeignung#1 und #2 (K-11), kulturdauer_typisch_d#1 und #2 (K-12). Bestehende IDs sind unverändert.

**Wichtiger Hinweis vorab (siehe P17):** Die Quelle `frankiesgarten-pakchoi-2026` steht in `quelle.csv` mit `status = verworfen` (Quellenprüfung: Titel weicht von der Seite ab). 14 geprüfte Kandidaten der Runde 2 verweisen auf sie. Bleibt die Quellenzeile verworfen, fehlt diesen Kandidaten der Fremdschlüssel (V2), und die Lücken L1 bis L4 der Runde 1 öffnen sich wieder.

### R2.1 Konfliktliste

Spalte «Status» ist der Status der Kandidatenzeile. «System» bei `art.csv` und `saatempfehlung.csv` = `anbaumethode` der Quelle. Quelle `frankiesgarten-pakchoi-2026` hat kein Jahr (Seite ohne Datum). Kein Kandidat ist bevorzugt.

#### K-pakchoi-01 – Artmerkmal `umsetzen_ab_d` (Tage ab Saat), unverändert

| kandidat_id | Status | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| art.brassica_rapa_chinensis.umsetzen_ab_d#1 | vorgeschlagen | 14 | d | – | sfa-ph-blattgemuese-2026 | B1 | nft | nicht angegeben | 2026 |
| art.brassica_rapa_chinensis.umsetzen_ab_d#2 | geprueft | 7 | d | – | risegardens-bok-choy-2026 | B2 | dwc | nicht angegeben | 2026 |

#### K-pakchoi-02 – Artmerkmal `umsetzen_bis_d` (Tage ab Saat), unverändert

| kandidat_id | Status | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| art.brassica_rapa_chinensis.umsetzen_bis_d#1 | vorgeschlagen | 16 | d | – | sfa-ph-blattgemuese-2026 | B1 | nft | nicht angegeben | 2026 |
| art.brassica_rapa_chinensis.umsetzen_bis_d#2 | geprueft | 10 | d | – | risegardens-bok-choy-2026 | B2 | dwc | nicht angegeben | 2026 |

#### K-pakchoi-03 – Kulturform `kopf`, `ernte_ab_d` (Tage ab Umsetzen), unverändert

| kandidat_id | Status | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| ak.brassica_rapa_chinensis.kopf.ernte_ab_d#1 | geprueft | 21 | d | – | sfa-ph-blattgemuese-2026 | B1 | nft | Gewächshaus | 2026 |
| ak.brassica_rapa_chinensis.kopf.ernte_ab_d#2 | vorgeschlagen | 21 | d | – | frontiers-pakchoi-photoperiode-2025 | A | ebbe_flut | Klimakammer mit LED | 2025 |
| ak.brassica_rapa_chinensis.kopf.ernte_ab_d#3 | geprueft | 35 | d | – | caatinga-pakchoi-ec-2024 | A | nft | Gewächshaus | 2024 |

#### K-pakchoi-04 – Phase `anzucht`, `wechselmerkmal`, unverändert

| kandidat_id | Status | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| pw.brassica_rapa_chinensis.anzucht.wechselmerkmal#1 | vorgeschlagen | Hat der Sämling 4 bis 5 echte Laubblätter? | – | – | caatinga-pakchoi-ec-2024 | A | nft | gewaechshaus | 2024 |
| pw.brassica_rapa_chinensis.anzucht.wechselmerkmal#2 | geprueft | Sind Wurzeln unten am Würfel sichtbar? | – | – | risegardens-bok-choy-2026 | B2 | dwc | indoor_led | 2026 |
| pw.brassica_rapa_chinensis.anzucht.wechselmerkmal#3 | geprueft | Ist das sechste Laubblatt voll entfaltet? | – | – | plosone-pakchoi-ec-2018 | A | ebbe_flut | gewaechshaus | 2018 |

#### K-pakchoi-05 – Phase `anzucht`, `ph` (neuer Kandidat #3)

| kandidat_id | Status | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| pw.brassica_rapa_chinensis.anzucht.ph#1 | vorgeschlagen | 6.0 bis 7.0 | pH | – | sfa-ph-blattgemuese-2026 | B1 | substrat_inert | andere | 2026 |
| pw.brassica_rapa_chinensis.anzucht.ph#2 (offen: Einzelwert) | geprueft | 5.8 | pH | – | plosone-pakchoi-ec-2018 | A | ebbe_flut | gewaechshaus | 2018 |
| pw.brassica_rapa_chinensis.anzucht.ph#3 **neu** | geprueft | 5.5 bis 6.5, typ 5.8 | pH | – | frankiesgarten-pakchoi-2026 | C | substrat_inert | andere | – |

#### K-pakchoi-06 – Phase `anzucht`, `ec` – nur offener Wert, unverändert

| kandidat_id | Status | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| pw.brassica_rapa_chinensis.anzucht.ec#1 (offen: Einzelwert) | geprueft | 1.2 | mS/cm | gesamt | plosone-pakchoi-ec-2018 | A | ebbe_flut | gewaechshaus | 2018 |

Der neue Kandidat `anzucht.ec#2` (frankiesgarten, 0.5 bis 0.9 mS/cm) ist verworfen und zählt nicht; die Pflichtgrösse hängt weiter allein am offenen Wert.

#### K-pakchoi-07 – Phase `wachstum`, `dauer` – nur offene Werte, Wertkonflikt (neuer Kandidat #4)

| kandidat_id | Status | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| pw.brassica_rapa_chinensis.wachstum.dauer#1 (offen: Einzelwert) | geprueft | 21 (nur min) | d ab Umsetzen | – | sfa-ph-blattgemuese-2026 | B1 | nft | gewaechshaus | 2026 |
| pw.brassica_rapa_chinensis.wachstum.dauer#2 (offen: Einzelwert) | geprueft | 21 (nur min), Bezugstemperatur 24 °C | d ab Umsetzen | – | frontiers-pakchoi-photoperiode-2025 | A | ebbe_flut | indoor_led | 2025 |
| pw.brassica_rapa_chinensis.wachstum.dauer#3 (offen: Einzelwert) | geprueft | 35 (nur min) | d ab Umsetzen | – | caatinga-pakchoi-ec-2024 | A | nft | gewaechshaus | 2024 |
| pw.brassica_rapa_chinensis.wachstum.dauer#4 (offen: Einzelwert, aus Tag 35 minus Tag 21) **neu** | geprueft | 14 (nur min) | d ab Phasenbeginn | – | frankiesgarten-pakchoi-2026 | C | nft | andere | – |

Weiterhin kein ladbarer Kandidat.

#### K-pakchoi-08 – Phase `wachstum`, `ph` (neuer Kandidat #6)

| kandidat_id | Status | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| pw.brassica_rapa_chinensis.wachstum.ph#1 | geprueft | 6.0 bis 7.0 | pH | – | sfa-ph-blattgemuese-2026 | B1 | nft | gewaechshaus | 2026 |
| pw.brassica_rapa_chinensis.wachstum.ph#2 | geprueft | 6.0 bis 7.0, typ 6.5 | pH | – | risegardens-bok-choy-2026 | B2 | dwc | indoor_led | 2026 |
| pw.brassica_rapa_chinensis.wachstum.ph#3 | vorgeschlagen | 5.5 bis 6.5 | pH | – | caatinga-pakchoi-ec-2024 | A | nft | gewaechshaus | 2024 |
| pw.brassica_rapa_chinensis.wachstum.ph#4 (offen: Einzelwert) | geprueft | 5.8 | pH | – | plosone-pakchoi-ec-2018 | A | ebbe_flut | gewaechshaus | 2018 |
| pw.brassica_rapa_chinensis.wachstum.ph#5 (offen: Einzelwert) | geprueft | 5.7 | pH | – | frontiers-pakchoi-photoperiode-2025 | A | ebbe_flut | indoor_led | 2025 |
| pw.brassica_rapa_chinensis.wachstum.ph#6 **neu** | geprueft | 5.5 bis 6.5, typ 5.8 | pH | – | frankiesgarten-pakchoi-2026 | C | nft | andere | – |

Entscheid 0018 nennt für diesen Konflikt bereits einen Lead-Entscheid aus Runde 1; in den Kandidatendateien ist er nicht abgebildet, der Konflikt bleibt hier mit dem neuen Kandidaten aufgeführt. Bereich von #6 stimmt mit #3 überein (Bestätigung).

#### K-pakchoi-09 – Phase `wachstum`, `ec`, unverändert

| kandidat_id | Status | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| pw.brassica_rapa_chinensis.wachstum.ec#1 | vorgeschlagen | 1.5 bis 2.0 | mS/cm | unbekannt | okstate-hla6722-2016 | B1 | substrat_inert | andere | 2016 |
| pw.brassica_rapa_chinensis.wachstum.ec#2 (offen: über Obergrenze, zwei Versuchsstufen) | geprueft | 1.8 bis 2.4 | mS/cm | gesamt | plosone-pakchoi-ec-2018 | A | ebbe_flut | gewaechshaus | 2018 |
| pw.brassica_rapa_chinensis.wachstum.ec#3 (offen: Einzelwert, über Obergrenze) | geprueft | 2.3 | mS/cm | unbekannt | frontiers-pakchoi-photoperiode-2025 | A | ebbe_flut | indoor_led | 2025 |
| pw.brassica_rapa_chinensis.wachstum.ec#4 (offen: über Obergrenze) | geprueft | 1.5 bis 2.5 | mS/cm | unbekannt | risegardens-bok-choy-2026 | B2 | dwc | indoor_led | 2026 |

Der neue Kandidat `wachstum.ec#5` (frankiesgarten, 1.4 bis 1.8 mS/cm) ist verworfen und zählt nicht.

#### K-pakchoi-10 – Saatempfehlung `se.brassica_rapa_chinensis.kopf` (neuer Kandidat #3)

| kandidat_id | Status | Wert (Samen je Schwamm / Obergrenze / stehen lassen) | Einheit | Basis | Quelle | Klasse Saatmenge | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| se.brassica_rapa_chinensis.kopf#1 | vorgeschlagen | 1 / 1 / 1 | Samen, Pflanzen | – | frontiers-pakchoi-photoperiode-2025 | B (Quelle A) | ebbe_flut, Steinwollstopfen | Klimakammer mit LED | 2025 |
| se.brassica_rapa_chinensis.kopf#2 | geprueft | 5 / 5 / 1 | Samen, Pflanzen | – | caatinga-pakchoi-ec-2024 | C (Quelle A) | nft, Kokosfaser-Zellen | Gewächshaus | 2024 |
| se.brassica_rapa_chinensis.kopf#3 **neu** | geprueft | 1 / 1 / 1 | Samen, Pflanzen | – | frankiesgarten-pakchoi-2026 | B (Quelle C) | nft, Schaumstoffwürfel | nicht angegeben | – |

#3 stimmt mit #1 in allen drei Feldern überein (Bestätigung).

#### K-pakchoi-11 – Artmerkmal `systemeignung` (neu)

| kandidat_id | Status | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| art.brassica_rapa_chinensis.systemeignung#1 | geprueft | dwc | – | – | cornell-gpn-blattgemuese-2016 | B1 | dwc | nicht angegeben | 2016 |
| art.brassica_rapa_chinensis.systemeignung#2 | geprueft | kratky | – | – | ctahr-vc1-2010 | B1 | kratky | nicht angegeben | 2010 |

Beide Werte sind gültige Aufzählungswerte nach 4.3.2; die Quellen belegen je ein anderes System.

#### K-pakchoi-12 – Kulturform `kopf`, `kulturdauer_typisch_d` (Tage ab Saat, neu)

| kandidat_id | Status | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| ak.brassica_rapa_chinensis.kopf.kulturdauer_typisch_d#1 | vorgeschlagen | 32 | d ab Saat | – | frontiers-pakchoi-photoperiode-2025 | A | ebbe_flut | Klimakammer mit LED | 2025 |
| ak.brassica_rapa_chinensis.kopf.kulturdauer_typisch_d#2 | geprueft | 35 | d ab Saat | – | frankiesgarten-pakchoi-2026 | C | nft | nicht angegeben | – |

#### K-pakchoi-13 – Phase `wachstum`, `licht_h` (neu; keine Pflichtgrösse)

| kandidat_id | Status | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| pw.brassica_rapa_chinensis.wachstum.licht_h#1 | vorgeschlagen | 12 bis 16 | h | – | risegardens-bok-choy-2026 | B2 | dwc | indoor_led | 2026 |
| pw.brassica_rapa_chinensis.wachstum.licht_h#2 | geprueft | 14 bis 16 | h | – | frankiesgarten-pakchoi-2026 | C | nft | andere | – |

#### K-pakchoi-14 – Phase `keimung`, `dauer` – nur offener Wert (neu)

| kandidat_id | Status | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| pw.brassica_rapa_chinensis.keimung.dauer#2 (offen: Bereich ohne typ) | geprueft | 4 bis 7 | d | – | frankiesgarten-pakchoi-2026 | C | substrat_inert | andere | – |

Pflichtgrösse auf Ebene Art; kein ladbarer Kandidat (`keimung.dauer#1` verworfen). Betrifft die Vorabladung der Keimung (03_import_w0.md 8 Nr. 4).

#### K-pakchoi-15 – Phase `keimung`, `keimtemp` – nur offener Wert (neu)

| kandidat_id | Status | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| pw.brassica_rapa_chinensis.keimung.keimtemp#2 (offen: Bereich ohne typ) | geprueft | 20 bis 25 | °C | – | frankiesgarten-pakchoi-2026 | C | substrat_inert | andere | – |

Pflichtgrösse (Ebene Art oder Kulturgruppe); `keimtemp#1` verworfen.

#### K-pakchoi-16 – Phase `anzucht`, `dauer` – nur offener Wert (neu)

| kandidat_id | Status | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| pw.brassica_rapa_chinensis.anzucht.dauer#4 (offen: Einzelwert, aus Tag 21 minus Tag 7) | geprueft | 14 (nur min) | d ab Phasenbeginn | – | frankiesgarten-pakchoi-2026 | C | substrat_inert | andere | – |

Pflichtgrösse auf Ebene Art; `anzucht.dauer#1` bis `#3` verworfen.

#### K-pakchoi-17 – Saatempfehlung `se.brassica_rapa_chinensis.babyleaf` – nur offener Wert (neu)

| kandidat_id | Status | Wert (Samen je Schwamm / Obergrenze / stehen lassen) | Einheit | Basis | Quelle | Klasse Saatmenge | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| se.brassica_rapa_chinensis.babyleaf#1 (offen: Bereich 6 bis 12 ohne Zuordnung, Analogie, stehen lassen fehlt) | geprueft | 6 / 12 / leer | Samen, Pflanzen | – | cornell-gpn-blattgemuese-2016 | C (Quelle B1) | dwc, Steinwolle oder Oasis 1 inch | nicht angegeben | 2016 |

Nur relevant, wenn `babyleaf` erlaubte Kulturform wird (siehe L-R2-10).

### R2.2 Plausibilität

Umrechnung nur zur Prüfung wie in Abschnitt 2 (alle EC-Rohwerte in mS/cm, Faktor 1). Neue EC-Kandidaten gibt es nicht (beide verworfen); die Gegenprobe ändert sich gegenüber Runde 1 nicht. P1 bis P16 gelten weiter.

| Nr. | kandidat_id | Regel | Wert | Befund |
|---|---|---|---|---|
| P17 | art: kulturformen_erlaubt#2, kopf.kulturdauer_typisch_d#2; pw: keimung.keimart#1, anzucht.ph#3, anzucht.licht_h#2, anzucht.wassertemp#1, wachstum.ph#6, wachstum.licht_h#2, wachstum.wassertemp#2; offen: keimung.dauer#2, keimung.keimtemp#2, anzucht.dauer#4, wachstum.dauer#4; se: kopf#3 | V2 Fremdschlüssel `quelle_id` | frankiesgarten-pakchoi-2026 | Die Quellenzeile `q.frankiesgarten-pakchoi-2026` ist in `quelle.csv` verworfen (Titel weicht von der Seite ab), sodass diese 14 Kandidaten ohne gültige Quellenzeile nicht ladbar wären. |
| P18 | pw.brassica_rapa_chinensis.keimung.dauer#2 | Form 4.4.1 (min, typ, max), V6 | 4 bis 7 d | `wert_typ` fehlt; min ≤ max und alle Werte über 0 sind erfüllt. |
| P19 | pw.brassica_rapa_chinensis.keimung.keimtemp#2 | Form 4.4.1 (min, typ, max) | 20 bis 25 °C | `wert_typ` fehlt, den 4.4.1 für `keimtemp` verlangt; der Bereich selbst ist geordnet. |
| P20 | pw.brassica_rapa_chinensis.anzucht.dauer#4 | V6, Form 4.4.1 | min 14 d | Nur `wert_min` belegt, aus «etwa Tag 7 bis 21» gerechnet, wobei der Zählbeginn ab Saat nur aus der Beschriftung des Anbauplans erschlossen ist; V6 ist so nicht vollständig prüfbar. |
| P21 | pw.brassica_rapa_chinensis.anzucht.dauer#4 gegen art.umsetzen_ab_d und umsetzen_bis_d (#1, #2) | Vergleich mit den übrigen Kandidaten der Art | Ende Anzucht Tag 21 ab Saat | Die Quelle setzt erst an Tag 21 nach Saat in den Tower um, 5 Tage nach dem höchsten Kandidaten `umsetzen_bis_d` (16) und 11 Tage nach dem niedrigeren (10); ohne Validatorverstoss. |
| P22 | pw.brassica_rapa_chinensis.wachstum.dauer#4 | V6, Form 4.4.1 | min 14 d | Nur `wert_min` belegt, aus Tag 35 minus Tag 21 gerechnet; V6 ist so nicht vollständig prüfbar. |
| P23 | pw.brassica_rapa_chinensis.wachstum.dauer#4 | Vergleich mit den übrigen Kandidaten der Art | 14 d | Der Wert liegt unter allen übrigen Wachstumsdauern und `ernte_ab_d`-Kandidaten (21, 21, 35 d), bei der Caatinga-Studie um den Faktor 2.5; ohne Validatorverstoss. |
| P24 | pw.brassica_rapa_chinensis.wachstum.licht_h#2, anzucht.licht_h#1, anzucht.licht_h#2 | Vergleich mit Artmerkmal `photoperiode` | 14 bis 16 h | Wie P16: Bei `photoperiode` = `langtag` ohne `kritische_tageslaenge_h` ist nicht prüfbar, ob bis 16 h Licht das Schossen auslösen (V7 eingehalten). |
| P25 | art.brassica_rapa_chinensis.kulturformen_erlaubt#2 | Abgleich Wert und Fundstelle (R1.2) | kopf | Die Fundstelle nennt neben der Ernte der ganzen Rosette auch die laufende Ernte äusserer Blätter, was zu `kopf` mit `ernteart` `einmalig` nur teilweise passt; der Wert selbst ist gültig. |
| P26 | se.brassica_rapa_chinensis.babyleaf#1 | 4.5 Pflichtfelder, R12.3 | 6 / 12 / leer | `pflanzen_stehen_lassen` fehlt (Pflicht ≥ 1), und `samen_je_schwamm` 6 ist die Untergrenze eines Bereichs, den die Quelle keiner Kultur zuordnet; Pak Choi ist dort nicht genannt (Analogie). |

**Ohne Befund geprüft:** `anzucht.ph#3` und `wachstum.ph#6` 5.5 bis 6.5, typ 5.8 (V3 innerhalb 5.2 bis 7.0, V5 Bandbreite 1.0, typ im Bereich); `anzucht.wassertemp#1` und `wachstum.wassertemp#2` 18 bis 22 °C (V7 10 bis 28 °C; die Quelle ordnet den Wert keiner Phase zu, er steht in beiden); `anzucht.licht_h#2` und `wachstum.licht_h#2` 14 bis 16 h (V7); `keimung.keimart#1` `dunkel` (V8 nur `keimung`, V12); `bluete.anwendbar#2` und `fruchtbildung_reife.anwendbar#2` `entfaellt` (R1.1 Blattgemüse); `kulturdauer_typisch_d#2` 35 d entspricht in derselben Quelle Keimung 7 plus Anzucht 14 plus Wachstum 14; `kulturformen_erlaubt` `kopf` und `kulturform_vorgabe` `kopf` (V11 erfüllt); `systemeignung` `dwc` und `kratky` (V12); `se.kopf#3` 1 / 1 / 1 (Obergrenze ≥ Samen, stehen lassen ≥ 1, Klasse B bei gleichem Material nach Entscheid 0018 Punkt 5).

**Vergleich mit der Kulturgruppe:** Pak Choi ist weiterhin die einzige Art in `teile/kohl/`.

### R2.3 Lückenliste

Klasse D, Prüfauftrag. Pflichtgrössen nach `03_import_w0.md` 9; verworfene Zeilen zählen nicht. Offene Kandidaten zählen als Kandidaten (keine Lücke), sind aber ohne Entscheid nicht ladbar.

**Phasen und Pflichtgrössen (0).** Gegenüber Runde 1 geschlossen: L2 `keimung.keimart` (`#1`), L5 `bluete.anwendbar` und L6 `fruchtbildung_reife.anwendbar` (`#2`, `entfaellt`); L1 `keimung.dauer`, L3 `keimung.keimtemp` und L4 `anzucht.dauer` haben nun einen offenen Kandidaten. Mit `entfaellt` für Blüte und Fruchtbildung ist `wachstum` die letzte anwendbare Phase und braucht kein `wechselmerkmal`.

Pflichtzeilen ohne ladbaren Kandidaten (nur offene Werte, 6): `keimung.dauer` (K-pakchoi-14), `keimung.keimtemp` (K-pakchoi-15), `anzucht.dauer` (K-pakchoi-16), `anzucht.ec` (K-pakchoi-06), `wachstum.dauer` (K-pakchoi-07), `se.brassica_rapa_chinensis.babyleaf` (K-pakchoi-17, nur bei erlaubtem `babyleaf`). Ohne Entscheid fehlen damit `dauer` und `ec` auf Ebene Art, und der Seed lädt Kulturform, Saatempfehlung und `profilwert` der Art nicht (8 Nr. 4).

Bedingt (P17): Bleibt die Quelle `frankiesgarten-pakchoi-2026` verworfen, sind `keimung.keimart`, `keimung.dauer`, `keimung.keimtemp` und `anzucht.dauer` wieder Lücken.

Nicht gezählt (Standardprofil, R1.4): `licht_h` in `keimung`, `wassertemp` in `keimung`.

**Stammfelder (0).** `name_de`, `name_wiss`, `gbif_key`, `kulturgruppe_id` liegen vor (`vorgeschlagen`).

**Artmerkmale (10).**

| Nr. | Art | Feld |
|---|---|---|
| L-R2-01 | brassica_rapa_chinensis | samentyp |
| L-R2-02 | brassica_rapa_chinensis | standard_keimfaehigkeit |
| L-R2-03 | brassica_rapa_chinensis | liter_je_pflanze |
| L-R2-04 | brassica_rapa_chinensis | wasserbedarf_je_pflanze_l |
| L-R2-05 | brassica_rapa_chinensis | wuchshoehe_max_mm |
| L-R2-06 | brassica_rapa_chinensis | kritische_tageslaenge_h (nötig, weil `photoperiode` = `langtag`) |
| L-R2-07 | brassica_rapa_chinensis | bestaeubung_noetig |
| L-R2-08 | brassica_rapa_chinensis | pythium |
| L-R2-09 | brassica_rapa_chinensis | schossen_handlung |
| L-R2-10 | brassica_rapa_chinensis | kulturformen_erlaubt: kein Kandidat belegt `babyleaf` (beide Kandidaten nennen nur `kopf`); nach Entscheid 0018 entfällt die Form ohne belegte Quelle |

Gegenüber Runde 1 geschlossen: `systemeignung` (K-pakchoi-11), `kulturformen_erlaubt` für `kopf`, `kulturform_vorgabe`. Nicht gezählt: `keimlinge_je_knaeuel`, `aussaatfenster_outdoor`.

**Kulturform `kopf` (2).**

| Nr. | Art | Kulturform | Feld |
|---|---|---|---|
| L-R2-11 | brassica_rapa_chinensis | kopf | kulturdauer_max_d |
| L-R2-12 | brassica_rapa_chinensis | kopf | entspitzen |

Nicht gezählt: `ernteintervall_d`, `schnitte_max` (nur bei `mehrfach`).

**Kulturform `babyleaf` (5, nur falls die Form erlaubt wird; sonst entfallen sie mit L-R2-10).**

| Nr. | Art | Kulturform | Feld |
|---|---|---|---|
| L-R2-13 | brassica_rapa_chinensis | babyleaf | ernte_ab_d |
| L-R2-14 | brassica_rapa_chinensis | babyleaf | ernteart |
| L-R2-15 | brassica_rapa_chinensis | babyleaf | kulturdauer_typisch_d |
| L-R2-16 | brassica_rapa_chinensis | babyleaf | kulturdauer_max_d |
| L-R2-17 | brassica_rapa_chinensis | babyleaf | entspitzen |

`ernteintervall_d` und `schnitte_max` hängen von `ernteart` ab und sind nicht gezählt.

**Saatempfehlungen.** `kopf`: drei Kandidaten (K-pakchoi-10), keine Lücke. `babyleaf`: nur offener Kandidat (K-pakchoi-17), keine Lücke im Sinn «ohne Kandidat».

**Hinweis V13, Ebene Kulturgruppe `kohl`:** unverändert, keine Zeile mit `ebene = kulturgruppe` in `teile/kohl/profilwert.csv` (siehe 3.6).

### R2.4 Bestätigungen

| Zeile | Wert | Übereinstimmende Kandidaten |
|---|---|---|
| ak.brassica_rapa_chinensis.kopf.ernte_ab_d | 21 d ab Umsetzen | #1 sfa (B1), #2 frontiers (A); Gegenwert #3 in K-pakchoi-03 (unverändert) |
| pw.brassica_rapa_chinensis.wachstum.dauer | 21 d (nur min) | #1 sfa (B1), #2 frontiers (A), beide offen; Gegenwerte #3, #4 in K-pakchoi-07 |
| pw.brassica_rapa_chinensis.wachstum.ph | 6.0 bis 7.0 | #1 sfa (B1, NFT), #2 risegardens (B2, DWC) |
| pw.brassica_rapa_chinensis.wachstum.ph | 5.5 bis 6.5 | #3 caatinga-pakchoi-ec-2024 (A, NFT, Gewächshaus), #6 frankiesgarten-pakchoi-2026 (C, NFT; zusätzlich typ 5.8) |
| se.brassica_rapa_chinensis.kopf | 1 / 1 / 1 | #1 frontiers (B, Steinwolle), #3 frankiesgarten (B, Schaumstoff); `pflanzen_stehen_lassen` 1 auch in #2 |
| pw.brassica_rapa_chinensis.anzucht.licht_h | 14 bis 16 h | #1 risegardens-bok-choy-2026 (B2, DWC, LED), #2 frankiesgarten-pakchoi-2026 (C) |
| art.brassica_rapa_chinensis.kulturformen_erlaubt | kopf | #1 cornell-gpn-blattgemuese-2016 (B1, DWC), #2 frankiesgarten-pakchoi-2026 (C) |
