# Passungsmatrix der ersten Runde (Konzept 9.6)

Stand 28.11.2026 · Lead · gerechnet mit `scripts/w0/passungsmatrix.ts` aus `data/wissensbasis/freigegeben/` (381 Profilwerte, 11 Arten) und der Entscheidungstabelle R3.2 der App (`passung()`). Tim bestätigt damit den Mix je Gefäss aus Konzept 5.5 oder passt ihn an.

Annahmen (A): Sollwerte der Art, sonst der Kulturgruppe, sonst der Standard; EC-Basis «Zuwachs» plus ECWasser 0.5; u_EC 0.10; Bereiche mit den Startwerten aus Konzept 5.2 (15 h Licht, nutzbare Höhe 45, 20, 15, 15 cm); keine gemessene Wassertemperatur. «nicht geprüft» nennt die Zeilen von R3.2, für die in W0 ein Stammwert fehlt; sie werten nicht ab (Fachregeln R3.4).

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

Jede Kultur wird gegen die übrigen Kulturen ihres Gefässes gerechnet; in einem Gefäss mit einer Art gelten nur die Zeilen P1 und P3 bis P6 (leeres Gefäss).

| Gefäss | Kultur | Phase | Urteil | Gemeinsamer Bereich pH | Gemeinsamer Bereich EC | nicht geprüft |
|---|---|---|---|---|---|---|
| 1.1 | Tomate | Anzucht | **Nicht empfohlen** · nicht für DWC | 5.6 bis 5.8 | 0.4 bis 1.3 | P5 |
| 1.1 | Tomate | Wachstum | **Nicht empfohlen** · nicht für DWC | 5.8 bis 6.2 | 1.2 bis 1.4 | P5 |
| 1.1 | Tomate | Blüte | **Nicht empfohlen** · nicht für DWC | 5.8 bis 6.2 | 2.0 bis 2.5 | P5 |
| 1.1 | Tomate | Fruchtbildung und Reife | **Nicht empfohlen** · nicht für DWC | 5.8 bis 6.2 | 2.0 bis 2.5 | P5 |
| 1.2 | Chili | Anzucht | **Empfohlen** · passt: pH 5.5 bis 6.0, EC 0.5 bis 1.0 | 5.5 bis 6.0 | 0.5 bis 1.0 | P1, P5 |
| 1.2 | Chili | Wachstum | **Empfohlen** · passt: pH 5.5 bis 6.0, EC 0.8 bis 1.8 | 5.5 bis 6.0 | 0.8 bis 1.8 | P1, P5 |
| 1.2 | Chili | Blüte | **Empfohlen** · passt: pH 5.5 bis 6.0, EC 1.8 bis 2.2 | 5.5 bis 6.0 | 1.8 bis 2.2 | P1, P5 |
| 1.2 | Chili | Fruchtbildung und Reife | **Empfohlen** · passt: pH 5.5 bis 6.0, EC 1.8 bis 2.2 | 5.5 bis 6.0 | 1.8 bis 2.2 | P1, P5 |
| 2.1 | Basilikum | Anzucht | **Nicht empfohlen** · EC: keine Schnittmenge mit 1.0 bis 1.4 | 6.0 bis 6.5 | leer | P4, P8, P9 |
| 2.1 | Basilikum | Wachstum | **Nicht empfohlen** · EC bleibt 1.5 bis 1.6, schmaler als 0.3 | 5.5 bis 6.0 | 1.5 bis 1.6 | P8, P9 |
| 2.1 | Pak Choi | Anzucht | **Nicht empfohlen** · EC: keine Schnittmenge mit 0.4 bis 0.8 | 6.0 bis 6.5 | leer | P5, P7, P8, P9 |
| 2.1 | Pak Choi | Wachstum | **Nicht empfohlen** · EC bleibt 1.5 bis 1.6, schmaler als 0.3 | 5.5 bis 6.0 | 1.5 bis 1.6 | P5, P7, P8, P9 |
| 2.2 | Petersilie | Anzucht | **Empfohlen** · passt: pH 5.5 bis 6.0, EC 0.4 bis 0.8 | 5.5 bis 6.0 | 0.4 bis 0.8 | P5, P7, P8, P9 |
| 2.2 | Petersilie | Wachstum | **Empfohlen** · passt: pH 5.5 bis 6.0, EC 1.0 bis 1.3 | 5.5 bis 6.0 | 1.0 bis 1.3 | P4, P5, P7, P8, P9 |
| 2.2 | Schnittlauch | Anzucht | **Empfohlen** · passt: pH 5.5 bis 6.0, EC 0.4 bis 0.8 | 5.5 bis 6.0 | 0.4 bis 0.8 | P1, P5, P6, P7, P8, P9 |
| 2.2 | Schnittlauch | Wachstum | **Empfohlen** · passt: pH 5.5 bis 6.0, EC 1.0 bis 1.3 | 5.5 bis 6.0 | 1.0 bis 1.3 | P1, P5, P7, P8, P9 |
| 2.3 | Schnittsalat (Lollo Rossa, Eissalat, Eichblatt) | Anzucht | **Empfohlen** · passt: pH 5.5 bis 6.5, EC 0.5 bis 1.0 | 5.5 bis 6.5 | 0.5 bis 1.0 | – |
| 2.3 | Schnittsalat (Lollo Rossa, Eissalat, Eichblatt) | Wachstum | **Empfohlen** · passt: pH 5.6 bis 6.0, EC 1.2 bis 1.5 | 5.6 bis 6.0 | 1.2 bis 1.5 | – |
| 3.1 | Nüsslisalat | Anzucht | **Nicht empfohlen** · nicht für Kratky | 5.8 bis 6.2 | 1.2 bis 1.6 | P4, P5, P6 |
| 3.1 | Nüsslisalat | Wachstum | **Nicht empfohlen** · nicht für Kratky | 5.6 bis 6.0 | 1.2 bis 1.6 | P4, P5 |
| 3.2 | Spinat Babyleaf | Anzucht | **Nicht empfohlen** · nicht für Kratky | 6.0 bis 7.0 | 1.6 bis 1.8 | P6 |
| 3.2 | Spinat Babyleaf | Wachstum | **Nicht empfohlen** · nicht für Kratky | 6.0 bis 7.0 | 1.4 bis 2.0 | – |
| 3.3 | Babyleaf-Mischung | Anzucht | **Empfohlen** · passt: pH 5.5 bis 6.5, EC 0.5 bis 1.0 | 5.5 bis 6.5 | 0.5 bis 1.0 | – |
| 3.3 | Babyleaf-Mischung | Wachstum | **Empfohlen** · passt: pH 5.6 bis 6.0, EC 1.2 bis 1.5 | 5.6 bis 6.0 | 1.2 bis 1.5 | – |

## 3 Matrix Art gegen Art

Zeile: Kultur, die dazukommt. Spalte: Kultur, die schon im Gefäss steht (Leitkultur). Gerechnet in einem DWC-Gefäss ohne Angaben zu Bereich und Systemeignung, also nur die Zeilen, die vom Paar abhängen (P2, P6, P7, P8, P10). E = Empfohlen, M = Möglich, N = Nicht empfohlen, mit den Codes der Gründe.

### Phase Anzucht

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

1. **2.1 Basilikum mit Pak Choi: «Nicht empfohlen».** Im Wachstum bleibt als gemeinsame EC nur 1.5 bis 1.6 (Basilikum 1.0 bis 1.6, Pak Choi 1.5 bis 2.0), schmaler als die Mindestbreite 0.3. Die App zeigt das beim Säen an. Tim entscheidet den Mix: (a) lassen, 2.1 mit EC 1.5 bis 1.6 fahren und die Einstufung als begründete Ausnahme wählen; (b) Pak Choi tauschen (im Wachstum passt er zu Spinat und Randen, zu Chili «Möglich»); (c) Basilikum allein in 2.1.
2. **Systemeignung in W0 widerspricht der Startbelegung.** Tomate trägt nur «kratky» (Quelle zu Kratky-Tomaten), die App meldet in 1.1 «nicht für DWC». Nüsslisalat und Spinat tragen nur «dwc» (Quellen mit Floating-System), die App meldet in 3.1 und 3.2 «nicht für Kratky». Für Chili und Schnittlauch fehlt der Wert (nicht geprüft). Folge: W0-Nachrecherche der Systemeignung durch den Lead (Entscheid 0018) vor der Gesamtfreigabe. Findet sie für Nüsslisalat und Spinat keine Kratky-Quelle, entscheidet Tim, ob «Kratky belüftet» fachlich wie DWC gilt (Konzept 8.1 Regel 8 ordnet es Kratky zu).
3. **Tomate in der Anzucht:** pH 5.6 bis 5.8 ist nur 0.2 breit; jede Mischung mit Tomate wäre «Nicht empfohlen». In 1.1 steht Tomate allein, ohne Folge für die erste Runde.
4. **2.2, 2.3, 3.3 und 1.2 sind «Empfohlen».** Petersilie und Schnittlauch teilen pH 5.5 bis 6.0 und EC 1.0 bis 1.3.
5. **Fehlende Stammwerte:** Wuchshöhe (P5) fehlt bei den meisten Arten, Pythium (P7) und «Kulturdauer typisch» (P8) bei mehreren. Diese Zeilen werten nicht ab; sie gehören zur Vollständigkeit der Gesamtfreigabe (Konzept 9.5 Schritt 5).

