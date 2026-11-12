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
