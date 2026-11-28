# Passungsmatrix der ersten Runde (Konzept 9.6)

Stand 28.11.2026 · Lead · gerechnet mit `scripts/w0/passungsmatrix.ts` aus `data/wissensbasis/freigegeben/` (381 Profilwerte, 11 Arten) und der Entscheidungstabelle R3.2 der App (`passung()`). Tim bestätigt damit den Mix je Gefäss aus Konzept 5.5 oder passt ihn an.

Annahmen (A): Sollwerte der Art, sonst der Kulturgruppe, sonst der Standard (die Ebene Sorte hat in W0 keine Zeilen); EC-Basis «Zuwachs» plus ECWasser 0.5 (W0 hat keine solche Zeile; 29 von 40 EC-Zeilen tragen die Basis «unbekannt», die App zeigt dazu «EC-Basis unklar»); u_EC 0.10; Bereiche mit den Startwerten aus Konzept 5.2 (15 h Licht, nutzbare Höhe 45, 20, 15, 15 cm); keine gemessene Wassertemperatur. Die Phase am Umsetztag folgt dem Alter nach den typischen Dauern aus W0, ohne bestätigte Phasen. «nicht geprüft» nennt die Zeilen von R3.2, für die in W0 ein Stammwert fehlt; sie werten nicht ab (Fachregeln R3.4).

Codes: P1 Systemeignung, P2 Restbreite pH oder EC, P3 freies Loch, P4 Licht und Schossen, P5 Höhe, P6 Wassertemperatur, P7 Pythium, P8 Kulturdauer gegen Leitkultur, P9 Beschattung, P10 EC-Mitte, P11 Liter je Pflanze.

## 1 Sollbereiche der Arten der ersten Runde

| Art | Phase | pH | EC (mS/cm) | Wasser (°C) | Licht max. (h) | Herkunft pH / EC |
|---|---|---|---|---|---|---|
| Tomate | Anzucht | 5.6 bis 5.8 | 0.4 bis 1.3 | 18 bis 24 | 16 | Art / Art |
| Tomate | Wachstum | 5.8 bis 6.2 | 1.2 bis 1.4 | 18 bis 24 | 16 | Art / Art |
| Tomate | Blüte | 5.8 bis 6.2 | 2.0 bis 2.5 | 18 bis 24 | 16 | Art / Art |
| Tomate | Fruchtbildung und Reife | 5.8 bis 6.2 | 2.0 bis 2.5 | 18 bis 24 | 16 | Art / Art |
| Chili | Anzucht | 5.5 bis 6.0 | 0.5 bis 1.0 | 18 bis 24 | 16 | Art / Art |
| Chili | Wachstum | 5.5 bis 6.0 | 0.8 bis 1.8 | 18 bis 24 | 16 | Art / Art |
| Chili | Blüte | 5.5 bis 6.0 | 1.8 bis 2.2 | 18 bis 24 | 16 | Art / Art |
| Chili | Fruchtbildung und Reife | 5.5 bis 6.0 | 1.8 bis 2.2 | 18 bis 24 | 16 | Art / Art |
| Basilikum | Anzucht | 5.5 bis 6.5 | 0.4 bis 0.8 | 18 bis 22 | – | Art / Art |
| Basilikum | Wachstum | 5.5 bis 6.0 | 1.0 bis 1.6 | 18 bis 24 | 16 | Art / Art |
| Pak Choi | Anzucht | 6.0 bis 7.0 | 1.0 bis 1.4 | 18 bis 22 | 16 | Art / Art |
| Pak Choi | Wachstum | 5.5 bis 6.5 | 1.5 bis 2.0 | 18 bis 22 | 16 | Art / Art |
| Petersilie | Anzucht | 5.5 bis 6.0 | 0.4 bis 0.8 | 18 bis 22 | 16 | Art / Art |
| Petersilie | Wachstum | 5.5 bis 6.0 | 1.0 bis 1.3 | 18 bis 22 | – | Art / Art |
| Schnittlauch | Anzucht | 5.5 bis 6.5 | 0.4 bis 0.8 | – | 16 | Art / Art |
| Schnittlauch | Wachstum | 5.5 bis 6.0 | 1.0 bis 1.3 | 18 bis 22 | 16 | Art / Art |
| Salat | Anzucht | 5.5 bis 6.5 | 0.5 bis 1.0 | 18 bis 22 | 16 | Art / Art |
| Salat | Wachstum | 5.6 bis 6.0 | 1.2 bis 1.5 | 18 bis 22 | 16 | Art / Art |
| Nüsslisalat | Anzucht | 5.8 bis 6.2 | 1.2 bis 1.6 | – | – | Art / Art |
| Nüsslisalat | Wachstum | 5.6 bis 6.0 | 1.2 bis 1.6 | 22 bis 24 | – | Art / Art |
| Spinat | Anzucht | 6.0 bis 7.0 | 1.6 bis 1.8 | – | – | Art / Art |
| Spinat | Wachstum | 6.0 bis 7.0 | 1.4 bis 2.0 | 20 bis 25 | 14 | Art / Art |

## 2 Mix je Gefäss nach Konzept 5.5

Jede Kultur wird gegen alle übrigen Töpfe ihres Gefässes gerechnet, nach der Topfzahl aus Konzept 5.5 und auch gegen die der eigenen Art. Zeile «Umsetztag»: wie die App beim Säen, am geplanten Umsetztag aus Konzept 14.1, jede Pflanze in der Phase ihres Alters an diesem Tag (Wachstum ab Keimung + Anzucht nach den typischen Dauern in W0, davor Anzucht). Zeile «später»: alle im Wachstum, bei Fruchtgemüse auch Blüte und Fruchtbildung (A, unabhängig vom Datum). Direktsaat (3.1 bis 3.3) zählt in der App immer im Wachstum. (A) Der Kandidat gilt als zuletzt gesät, und die übrigen Töpfe des eigenen Satzes zählen mit; die App zählt sie beim Säen erst ab dem nächsten Satz, bei Basilikum und Pak Choi nennt sie deshalb einen anderen Zielbereich im Text, die Einstufung bleibt gleich.

| Gefäss | Kultur (Töpfe) | Zeitpunkt und Phase | Urteil | Gemeinsamer Bereich pH | Gemeinsamer Bereich EC | nicht geprüft |
|---|---|---|---|---|---|---|
| 1.1 | Tomate (4) | Umsetztag 28.1. (Tag 21, Wachstum ab Tag 29): Anzucht | **Nicht empfohlen** · nicht für DWC · pH bleibt 5.6 bis 5.8, schmaler als 0.3 | 5.6 bis 5.8 | 0.4 bis 1.3 | P5, P7, P8, P9 |
| 1.1 | Tomate (4) | später: Wachstum | **Nicht empfohlen** · nicht für DWC · EC bleibt 1.2 bis 1.4, schmaler als 0.3 | 5.8 bis 6.2 | 1.2 bis 1.4 | P5, P7, P8, P9 |
| 1.1 | Tomate (4) | später: Blüte | **Nicht empfohlen** · nicht für DWC | 5.8 bis 6.2 | 2.0 bis 2.5 | P5, P7, P8, P9 |
| 1.1 | Tomate (4) | später: Fruchtbildung und Reife | **Nicht empfohlen** · nicht für DWC | 5.8 bis 6.2 | 2.0 bis 2.5 | P5, P7, P8, P9 |
| 1.2 | Chili (4) | Umsetztag 28.1. (Tag 21, Wachstum ab Tag 22): Anzucht | **Empfohlen** · passt: pH 5.5 bis 6.0, EC 0.5 bis 1.0 | 5.5 bis 6.0 | 0.5 bis 1.0 | P1, P5, P7, P8, P9 |
| 1.2 | Chili (4) | später: Wachstum | **Empfohlen** · passt: pH 5.5 bis 6.0, EC 0.8 bis 1.8 | 5.5 bis 6.0 | 0.8 bis 1.8 | P1, P5, P7, P8, P9 |
| 1.2 | Chili (4) | später: Blüte | **Empfohlen** · passt: pH 5.5 bis 6.0, EC 1.8 bis 2.2 | 5.5 bis 6.0 | 1.8 bis 2.2 | P1, P5, P7, P8, P9 |
| 1.2 | Chili (4) | später: Fruchtbildung und Reife | **Empfohlen** · passt: pH 5.5 bis 6.0, EC 1.8 bis 2.2 | 5.5 bis 6.0 | 1.8 bis 2.2 | P1, P5, P7, P8, P9 |
| 2.1 | Basilikum (3) | Umsetztag 24.2. (Tag 20, Wachstum ab Tag 27): Anzucht; Pak Choi Wachstum | **Nicht empfohlen** · EC: keine Schnittmenge mit 1.5 bis 0.8 | 5.5 bis 6.5 | leer | P4, P8, P9 |
| 2.1 | Basilikum (3) | später: Wachstum | **Nicht empfohlen** · EC bleibt 1.5 bis 1.6, schmaler als 0.3 | 5.5 bis 6.0 | 1.5 bis 1.6 | P8, P9 |
| 2.1 | Pak Choi (3) | Umsetztag 18.2. (Tag 14, Wachstum ab Tag 19): Anzucht; Basilikum Anzucht | **Nicht empfohlen** · EC: keine Schnittmenge mit 1.0 bis 0.8 | 6.0 bis 6.5 | leer | P5, P7, P8, P9 |
| 2.1 | Pak Choi (3) | später: Wachstum | **Nicht empfohlen** · EC bleibt 1.5 bis 1.6, schmaler als 0.3 | 5.5 bis 6.0 | 1.5 bis 1.6 | P5, P7, P8, P9 |
| 2.2 | Petersilie (1) | Umsetztag 11.2. (Tag 35, Wachstum ab Tag 21): Wachstum; Schnittlauch Wachstum | **Empfohlen** · passt: pH 5.5 bis 6.0, EC 1.0 bis 1.3 | 5.5 bis 6.0 | 1.0 bis 1.3 | P4, P5, P7, P8, P9 |
| 2.2 | Schnittlauch (1) | Umsetztag 4.2. (Tag 28, Wachstum ab Tag 31): Anzucht; Petersilie Wachstum | **Nicht empfohlen** · EC: keine Schnittmenge mit 1.0 bis 1.3 | 5.5 bis 6.0 | leer | P1, P5, P6, P7, P8, P9 |
| 2.2 | Schnittlauch (1) | später: Wachstum | **Empfohlen** · passt: pH 5.5 bis 6.0, EC 1.0 bis 1.3 | 5.5 bis 6.0 | 1.0 bis 1.3 | P1, P5, P7, P8, P9 |
| 2.3 | Schnittsalat (Lollo Rossa, Eissalat, Eichblatt) (6) | Umsetztag 21.1. (Tag 14, Wachstum ab Tag 12): Wachstum | **Empfohlen** · passt: pH 5.6 bis 6.0, EC 1.2 bis 1.5 | 5.6 bis 6.0 | 1.2 bis 1.5 | P7, P8, P9 |
| 3.1 | Nüsslisalat (8) | Direktsaat: Wachstum | **Nicht empfohlen** · nicht für Kratky | 5.6 bis 6.0 | 1.2 bis 1.6 | P4, P5, P7, P9, P11 |
| 3.2 | Spinat Babyleaf (6) | Direktsaat: Wachstum | **Nicht empfohlen** · nicht für Kratky | 6.0 bis 7.0 | 1.4 bis 2.0 | P9, P11 |
| 3.3 | Babyleaf-Mischung (8) | Direktsaat: Wachstum | **Empfohlen** · passt: pH 5.6 bis 6.0, EC 1.2 bis 1.5 | 5.6 bis 6.0 | 1.2 bis 1.5 | P7, P8, P9, P11 |

## 3 Matrix Art gegen Art

Zeile: Kultur, die dazukommt. Spalte: Kultur, die schon im Gefäss steht (Leitkultur). Gerechnet in einem DWC-Gefäss ohne Angaben zu Bereich und Systemeignung, also nur die Zeilen, die vom Paar abhängen (P2, P6, P7, P8, P10). E = Empfohlen, M = Möglich, N = Nicht empfohlen, mit den Codes der Gründe.

### Phase Anzucht (nur zum Vergleich; im Zielgefäss bewertet die App ab Wachstum)

| dazu ↓ / steht → | Salat | Nüsslisalat | Tomate | Chili | Pak Choi | Basilikum | Petersilie | Schnittlauch | Spinat | Mangold | Randen |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Salat (schnitt) | · | N P2 | N P2 | E | N P2 | E | E | E | N P2 | E | E |
| Nüsslisalat (kopf) | N P2 | · | N P2 | N P2 | N P2 | N P2 | N P2 | N P2 | N P2 | N P2 | N P2 |
| Tomate (dauerkultur_frucht) | N P2 | N P2 | · | N P2 | N P2 | N P2 | N P2 | N P2 | N P2 | N P2 | N P2 |
| Chili (dauerkultur_frucht) | E | N P2 | N P2 | · | N P2 | E | E | E | N P2 | E | N P2 |
| Pak Choi (kopf) | N P2 | N P2 | N P2 | N P2 | · | N P2 | N P2 | N P2 | N P2 | N P2 | N P2 |
| Basilikum (dauerkultur_blatt) | E | N P2 | N P2 | E | N P2 | · | E | E | N P2 | E | M P10 |
| Petersilie (dauerkultur_blatt) | E | N P2 | N P2 | E | N P2 | E | · | E | N P2 | E | N P2 |
| Schnittlauch (dauerkultur_blatt) | E | N P2 | N P2 | E | N P2 | E | E | · | N P2 | E | M P10 |
| Spinat (babyleaf) | N P2 | N P2 | N P2 | N P2 | N P2 | N P2 | N P2 | N P2 | · | N P2 | N P2 |
| Mangold (schnitt) | E | N P2 | N P2 | E | N P2 | E | E | E | N P2 | · | E |
| Randen (schnitt) | E | N P2 | N P2 | N P2 | N P2 | M P10 | N P2 | M P10 | N P2 | E | · |

### Phase Wachstum

| dazu ↓ / steht → | Salat | Nüsslisalat | Tomate | Chili | Pak Choi | Basilikum | Petersilie | Schnittlauch | Spinat | Mangold | Randen |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Salat (schnitt) | · | E | N P2 | E | N P2 | E | N P2 | N P2 | N P2 | N P2 | N P2 |
| Nüsslisalat (kopf) | E | · | N P2 | E | N P2 | E | N P2 | N P2 | N P2 | E | N P2 |
| Tomate (dauerkultur_frucht) | N P2 | N P2 | · | N P2 | N P2 | N P2 | N P2 | N P2 | N P2 | N P2 | N P2 |
| Chili (dauerkultur_frucht) | E | E | N P2 | · | M P10 | E | E | E | N P2 | E | N P2 |
| Pak Choi (kopf) | N P2 | N P2 | N P2 | M P10 | · | N P2 | N P2 | N P2 | M P8 | N P2 | E |
| Basilikum (dauerkultur_blatt) | E | E | N P2 | E | N P2 | · | E | E | N P2 | E | N P2 |
| Petersilie (dauerkultur_blatt) | N P2 | N P2 | N P2 | E | N P2 | E | · | E | N P2 | N P2 | N P2 |
| Schnittlauch (dauerkultur_blatt) | N P2 | N P2 | N P2 | E | N P2 | E | E | · | N P2 | N P2 | N P2 |
| Spinat (babyleaf) | N P2 | N P2 | N P2 | N P2 | E | N P2 | N P2 | N P2 | · | N P2 | E |
| Mangold (schnitt) | N P2 | E | N P2 | E | N P2 | E | N P2 | N P2 | N P2 | · | N P2 |
| Randen (schnitt) | N P2 | N P2 | N P2 | N P2 | E | N P2 | N P2 | N P2 | E | N P2 | · |

## 4 Befunde (Lead, 28.11.2026)

1. **2.1 Basilikum mit Pak Choi: «Nicht empfohlen».** Am Umsetztag gibt es keine gemeinsame EC: am 18.2. stehen beide in der Anzucht (Basilikum 0.4 bis 0.8, Pak Choi 1.0 bis 1.4), am 24.2. ist Pak Choi im Wachstum (1.5 bis 2.0) und Basilikum noch in der Anzucht. Später, beide im Wachstum, bleibt nur 1.5 bis 1.6 (Basilikum 1.0 bis 1.6), schmaler als die Mindestbreite 0.3. Beide EC-Bänder tragen in W0 die Basis «unbekannt». Die App zeigt die Einstufung beim Säen an. Tim entscheidet den Mix: (a) lassen; bei jedem Ansatz verlangt die App dann den Mischentscheid nach R2.4 zwischen Leitkultur (Basilikum, im Wachstum EC 1.0 bis 1.6, Pak Choi höchstens «Knapp daneben»), anderer Phase und Kompromiss (im Wachstum Mittel der Bandmitten 1.3 und 1.75 ± 0.15, rund 1.38 bis 1.68); (b) Pak Choi tauschen: im Wachstum ist er zu Randen «Empfohlen», zu Spinat (P8) und Chili (P10) «Möglich»; (c) Basilikum behalten und einen Partner wählen, der passt: zu Basilikum sind im Wachstum Salat, Nüsslisalat, Chili, Petersilie, Schnittlauch und Mangold «Empfohlen».
2. **Systemeignung in W0 widerspricht der Startbelegung.** Tomate trägt nur «kratky» (Quelle zu Kratky-Tomaten), die App meldet in 1.1 «nicht für DWC». Nüsslisalat und Spinat tragen nur «dwc» (Quellen mit Floating-System), die App meldet in 3.1 und 3.2 «nicht für Kratky». Für Chili und Schnittlauch fehlt der Wert (nicht geprüft). Folge: W0-Nachrecherche der Systemeignung durch den Lead (Entscheid 0018) vor der Gesamtfreigabe. Findet sie für Nüsslisalat und Spinat keine Kratky-Quelle, entscheidet Tim, ob «Kratky belüftet» fachlich wie DWC gilt (Konzept 8.1 Regel 8 ordnet es Kratky zu); findet sie für Tomate keine DWC-Quelle, entscheidet Tim, ob 1.1 bleibt.
3. **Tomate in 1.1: zwei Bänder schmaler als die Mindestbreite.** Am Umsetztag 28.1. steht Tomate noch in der Anzucht; der pH 5.6 bis 5.8 ist nur 0.2 breit, ab dem zweiten Topf meldet die App «pH bleibt 5.6 bis 5.8, schmaler als 0.3». Im Wachstum ist die EC 1.2 bis 1.4 ebenfalls nur 0.2 breit, mit derselben Folge. Der Mischentscheid nach R2.4 fällt bei jedem Ansatz an, schon beim Ansatz «für Umsetzen» am 28.1. für den pH. Der Lead prüft beide Bänder in der W0-Nachrecherche (Entscheid 0018).
4. **2.2 Petersilie mit Schnittlauch: am Umsetztag des Schnittlauchs «Nicht empfohlen».** Am 4.2. steht Schnittlauch nach W0 noch in der Anzucht (EC 0.4 bis 0.8), Petersilie zählt als reservierte Pflanze im Wachstum (1.0 bis 1.3): keine gemeinsame EC. Sind beide im Wachstum, ist 2.2 «Empfohlen» mit pH 5.5 bis 6.0 und EC 1.0 bis 1.3. Tim kann den Umsetztag des Schnittlauchs beim Säen ab Tag 31 (7.2.) wählen, das Fenster in W0 reicht bis 18.2. (Umsetzen bis Tag 42), in der App wählbar ist der Tag bis 24.2.; Konzept 14.1 nennt für Schnittlauch noch «4.2. bis 11.2.» und wird in der nächsten Fassung nachgeführt; der Lead prüft Umsetzfenster und Anzuchtdauer in W0 (Befund 5).
5. **Umsetzfenster vor dem Ende der Anzucht.** Bei 5 Arten beginnt «Umsetzen ab» in W0 vor Keimung + Anzucht nach den typischen Dauern: Tomate (Umsetzen ab Tag 10, Wachstum ab Tag 29), Chili (Umsetzen ab Tag 10, Wachstum ab Tag 22), Basilikum (Umsetzen ab Tag 14, Wachstum ab Tag 27), Pak Choi (Umsetzen ab Tag 14, Wachstum ab Tag 19), Schnittlauch (Umsetzen ab Tag 28, Wachstum ab Tag 31). Die App bewertet diese Kulturen am Umsetztag mit den Sollwerten der Anzucht, obwohl sie dann im Zielgefäss stehen. Der Lead prüft in der W0-Nachrecherche, ob Umsetzfenster und Phasendauern zusammenpassen (Entscheid 0018).
6. **1.2, 2.3 und 3.3 sind «Empfohlen», 2.2 ab dem Wachstum beider Kulturen.** Chili in 1.2 hat Reserve (EC-Breite mindestens 0.4). In 2.3 und 3.3 (Salat, EC 1.2 bis 1.5) und in 2.2 (EC 1.0 bis 1.3) ist die Restbreite EC genau die Mindestbreite 0.3 ohne Reserve; liegt u_EC aus der Geräteprüfung über 0.15, werden sie zum Konfliktfall (Konzept, Risiko u_EC).
7. **Fehlende Stammwerte:** Die Wuchshöhe (P5, P9) fehlt bei allen Arten und Sorten, die Wuchsform «hängend» bei Tumbling Tom und Ampelo Gelb; Pythium (P7), «Kulturdauer typisch» (P8) und der Wasserbedarf je Pflanze (P11) fehlen bei mehreren Arten. Diese Zeilen werten nicht ab; sie gehören zur Vollständigkeit der Gesamtfreigabe (Konzept 9.5 Schritt 5).

