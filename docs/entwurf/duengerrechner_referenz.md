# Entwurf Referenzdatei Düngerrechner – Herleitung

Stand 5.11.2026 · Entwurf nach Entscheid 0012 · Ziel `tests/golden/duengerrechner_referenz.csv` (für Agenten gesperrt; Tim kopiert die Datei und setzt `REFERENZ_HASH_RECHNER`).

Die Datei `docs/entwurf/duengerrechner_referenz.csv` ist von Hand aus den Fachquellen gerechnet (Node nur als Taschenrechner), nicht aus dem Code in `src/`. Sie ist damit ein unabhängiges Orakel; der Rechner muss jede Zeile auf ±0.5 ml treffen (Konzept R4.12, UC7-AK12).

## Quellen

- Konzept v1.4 Kapitel 7.3: R4.1 (k, ECSoll), R4.2 (inneres Band, Skalierung, Untergrenze ECWasser + 0.3, «Leitungswasser zu hoch»), R4.3 (Herstellerstadien), R4.4 (Kappung 5.5 ml/L und 1.2 × D), R4.5 (Stationen mit fester Dosis), R4.7 (Restdosis, kIst), R4.8 (Teilwechsel, «doppelt dosiert»), R4.9 (Nachfüllen, Verdünnen), R4.11 (Rundung), R4.12 (RF1 bis RF12 und Absatz zur Referenzdatei), Kapitel 5.3 (Betriebsvolumen).
- Düngeplan V1.6 Abschnitt 2 (Herstellertabelle Hydro/Coco) und Abschnitt 4 (19 Tabellenzeilen).
- Use Cases F4, UC7-AK1 bis AK15 (Kontrollbeispiele).
- `docs/spec/00_rueckfragen.md` R4 (Grenze 1.04 / 1.29 / 1.30) und R8 (Inhalt der Referenzdatei).
- `docs/spec/06_tests.md` Abschnitt 3 (Spalten) und 4 (RF1 bis RF12).
- `docs/spec/02_datenmodell.sql`: Enum `stadium`, `ansatz.skaliert boolean`, `ansatz.teil_dosis in (0.75, 0.85, 1.00)`.

## Rechenregeln (wie angewendet)

Rahmenwerte, sofern die Zeile nichts anderes nennt (R4.12): ECWasser 0.50, k 0.30 für alle Komponenten, u_EC 0.10, Teil-Dosis aus.

1. Herstellerdosis des Stadiums d = (Grow, Micro, Bloom) in ml/L, D = Summe, Anteile a_i = d_i / D (R4.2, Tabelle R4.3):
   `wurzeln_keimung` 0.5/0.5/0.5 (D 1.5), `echte_blaetter` 1/1/1 (D 3), `wachstum` 1.8/1.2/0.6 (D 3.6), `vorbluete` 2/2/1.5 (D 5.5), `bluete_frucht` 0.8/1.6/2.4 (D 4.8).
2. ECSoll = ECWasser + k · D (R4.1).
3. Inneres Band = [min + 0.25 · Breite, max − 0.25 · Breite], Grenzen einschliesslich.
4. ECSoll im Band: keine Skalierung, ECZiel = ECSoll, `skaliert = false`.
5. Sonst: ECZiel = Bandmitte; liegt ECWasser über max − 0.3, ECZiel = max mit «Leitungswasser zu hoch für dieses Gefäss»; ECZiel nie unter ECWasser + 0.3 und nie über max. D_neu = D · (ECZiel − ECWasser) / (ECSoll − ECWasser), gekappt auf min(5.5, 1.2 · D) (R4.4); greift die Kappung, ECZiel = ECWasser + k · D_neu mit «Ziel nicht ganz erreichbar». `skaliert = true`.
6. Stationen (R4.5): feste Dosis, keine Skalierung, keine Teil-Dosis; ECZiel = ECSoll der festen Dosis.
7. Menge je Komponente roh = D_neu · a_i · V · Teil-Dosis; Rundung R4.11: roh unter 5 ml auf 0.1 ml, sonst auf 0.5 ml, kaufmännisch (halbe Schritte aufwärts); keine Komponente auf 0.
8. `ec_ziel` auf Hundertstel (R10.1).

In keiner Düngeplan-Zeile greift die Kappung; die grösste skalierte Dosis ist 5.333 ml/L (Blüte / Frucht) bei der Grenze min(5.5, 5.76) = 5.5.

## Kontrolle der Regeln an UC7 (alle übereinstimmend)

| Beispiel | Eingabe | Gerechnet | Quelle erwartet |
|---|---|---|---|
| UC7-AK1 | 2.3, 9 l, wachstum, 1.0–1.4 | ECSoll 1.58 ausserhalb 1.1–1.3 → ECZiel 1.20; D_neu = 3.6 · 0.7 / 1.08 = 2.3333; roh 10.500 / 7.000 / 3.500 → 10.5 / 7.0 / 3.5 | 10.5 / 7.0 / 3.5 |
| UC7-AK1 75 % | dito · 0.75 | roh 7.875 / 5.250 / 2.625 → 8.0 / 5.5 / 2.6 | 8.0 / 5.5 / 2.6 |
| UC7-AK1 85 % | dito · 0.85 | roh 8.925 / 5.950 / 2.975 → 9.0 / 6.0 / 3.0 | 9.0 / 6.0 / 3.0 |
| UC7-AK2 | D 2.0, 1.0–1.4 | ECSoll 0.5 + 0.6 = 1.10 = untere Bandgrenze → keine Skalierung, ECZiel 1.10 | dito |
| UC7-AK3 / RF10 | Ist 18.0 ml auf 9 l, ECIst 1.05, Ziel 1.2 | ECSoll_ist 0.5 + 0.3 · 2.0 = 1.10; Abweichung 0.05 ≤ 0.10; kIst = 0.55 / 2.0 = 0.275; ΔD = 0.15 / 0.3 = 0.5 ml/L · 9 = 4.5 ml; 2.25 / 1.5 / 0.75 → 2.3 / 1.5 / 0.8 | dito |
| UC7-AK4 | V 9, Kanne 2 l, EC1 1.15, Ziel 1.2, D_Ansatz 2.33 | d = (10.8 − 8.05 − 1.0) / 0.6 = 2.9167 ml/L < 1.5 · 2.33 = 3.50; 5.833 ml auf 2 l → 2.9 / 1.9 / 1.0 | 2.92; 5.8 ml; 2.9 / 1.9 / 1.0 |
| UC7-AK5 / RF6 | 6 l EC 1.5, Ziel 1.2, 8 l | VWasser = 6 · 0.3 / 0.7 = 2.571 → 2.6 l; frei 2.0 l; (9.0 + 1.0) / 8 = 1.25 | 2.6 l, 2.0 l, 1.25 |
| UC7-AK6 | 0.6–0.8, Wasser 0.5 | Bandmitte 0.70 < 0.5 + 0.3 → Ziel 0.80 mit Hinweis Untergrenze | 0.8 |
| UC7-AK6 / RF3 | 0.8–1.2, Wasser 0.95 | 0.95 > 1.2 − 0.3 = 0.9 → Ziel 1.20, «Leitungswasser zu hoch» | 1.2 |
| UC7-AK7 | Station 4.1, 3 l | 0.5 · 3 = 1.5 je Teil | je 1.5 ml |
| UC7-AK9 / RF11 | 10.5, 53.5, 7.25 ml | 10.5, 53.5, 7.5 | dito |
| UC7-AK14 | 9 l, Ist 1.5, Ziel 1.2, Wasser 0.5 | 9 · 0.3 / 1.0 = 2.7 l | 2.7 l |

Anmerkung zu UC7-AK4: «5.8 ml auf 2 l» ist die Summe 5.833 auf 0.1 ml; die Komponenten werden einzeln gerundet (2.917 → 2.9, 1.944 → 1.9, 0.972 → 1.0). Nach Regel 7 würde die Summe als einzelne Menge (≥ 5 ml) auf 6.0 ml gerundet; die Anzeige der Summe ist für die Referenzdatei ohne Belang, weil die Datei nur Komponenten führt.

## Herleitung je Zeile

### Düngeplan V1.6 Abschnitt 4 (17 Zeilen)

Von den 19 Tabellenzeilen entfallen Zeile 17 (4.1 Basilikum, Kratky 7 l) und Zeile 19 (4.3 Mangold + Randen) nach Erratum E2. Zeile 18 (4.2 Jungpflanzenstation) wird nach R8 zu «Station 4.1, 3 l, feste Dosis». «Jungpflanze (Woche 1)» (Zeilen 9 und 12) wird `echte_blaetter`. Volumen nach Düngeplan, bestätigt durch Konzept 5.3.

**Zielbereich (A):** Im Repository steht kein von Tim festgelegter Zielbereich je Gefäss; für alle Zeilen DP01 bis DP16 gilt deshalb nach R4.12 und R8 «Ziel-EC des Düngeplans ± 0.2». Legt Tim andere Zielbereiche fest, sind die betroffenen Zeilen neu zu rechnen.

| Zeile | Düngeplan | Zielbereich (A) / Band | D / ECSoll | Entscheid und D_neu | roh Grow / Micro / Bloom | CSV | Düngeplan von Hand |
|---|---|---|---|---|---|---|---|
| DP01 | Z. 1: 1.1 Tomaten, DWC 20 l, 1. echte Blätter, Ziel 1.0 | 0.8–1.2 / 0.9–1.1 | 3 / 1.40 | ausserhalb → Ziel 1.00; 3 · 0.5 / 0.9 = 1.6667 | 11.111 / 11.111 / 11.111 | 11.0 / 11.0 / 11.0, Ziel 1.00, true | 11 / 11 / 11 |
| DP02 | Z. 2: 1.1, 20 l, Wachstum, Ziel 1.5 | 1.3–1.7 / 1.4–1.6 | 3.6 / 1.58 | **im Band** → keine Skalierung, Ziel 1.58 | 36.000 / 24.000 / 12.000 | 36.0 / 24.0 / 12.0, Ziel 1.58, false | 33.5 / 22 / 11 |
| DP03 | Z. 3: 1.1, 20 l, Vorblüte, Ziel 1.9 | 1.7–2.1 / 1.8–2.0 | 5.5 / 2.15 | ausserhalb → Ziel 1.90; 5.5 · 1.4 / 1.65 = 4.6667 | 33.939 / 33.939 / 25.455 | 34.0 / 34.0 / 25.5, Ziel 1.90, true | 34 / 34 / 25.5 |
| DP04 | Z. 4: 1.1, 20 l, Blüte / Frucht, Ziel 2.1 | 1.9–2.3 / 2.0–2.2 | 4.8 / 1.94 | ausserhalb (unter dem Band) → Ziel 2.10; 4.8 · 1.6 / 1.44 = 5.3333 ≤ 5.5 | 17.778 / 35.556 / 53.333 | 18.0 / 35.5 / 53.5, Ziel 2.10, true | 18 / 35.5 / 53.5 |
| DP05 | Z. 5: 1.2 Chili, 20 l, 1. echte Blätter, Ziel 1.1 | 0.9–1.3 / 1.0–1.2 | 3 / 1.40 | ausserhalb → Ziel 1.10; 3 · 0.6 / 0.9 = 2.0 | 13.333 / 13.333 / 13.333 | 13.5 / 13.5 / 13.5, Ziel 1.10, true | 13.5 / 13.5 / 13.5 |
| DP06 | Z. 6: 1.2, 20 l, Wachstum, Ziel 1.7 | 1.5–1.9 / 1.6–1.8 | 3.6 / 1.58 | ausserhalb (unter dem Band) → Ziel 1.70; 3.6 · 1.2 / 1.08 = 4.0 ≤ min(5.5, 4.32) | 40.000 / 26.667 / 13.333 | 40.0 / 26.5 / 13.5, Ziel 1.70, true | 40 / 26.5 / 13.5 |
| DP07 | Z. 7: 1.2, 20 l, Vorblüte, Ziel 1.9 | wie DP03 | 5.5 / 2.15 | wie DP03 | wie DP03 | 34.0 / 34.0 / 25.5, Ziel 1.90, true | 34 / 34 / 25.5 |
| DP08 | Z. 8: 1.2, 20 l, Blüte / Frucht, Ziel 2.1 | wie DP04 | 4.8 / 1.94 | wie DP04 | wie DP04 | 18.0 / 35.5 / 53.5, Ziel 2.10, true | 18 / 35.5 / 53.5 |
| DP09 | Z. 9: 2.1 Misome + Basilikum, DWC 9 l, Jungpflanze → echte_blaetter, Ziel 1.0 | 0.8–1.2 / 0.9–1.1 | 3 / 1.40 | ausserhalb → Ziel 1.00; 1.6667 | 5.000 / 5.000 / 5.000 | 5.0 / 5.0 / 5.0, Ziel 1.00, true | 5 / 5 / 5 |
| DP10 | Z. 10: 2.1, 9 l, Wachstum, Ziel 1.4 | 1.2–1.6 / 1.3–1.5 | 3.6 / 1.58 | ausserhalb → Ziel 1.40; 3.6 · 0.9 / 1.08 = 3.0 | 13.500 / 9.000 / 4.500 | 13.5 / 9.0 / 4.5, Ziel 1.40, true | 13.5 / 9 / 4.5 |
| DP11 | Z. 11: 2.2 Petersilie + Schnittlauch, DWC 4 l, Wachstum, Ziel 1.3 | 1.1–1.5 / 1.2–1.4 | 3.6 / 1.58 | ausserhalb → Ziel 1.30; 3.6 · 0.8 / 1.08 = 2.6667 | 5.333 / 3.556 / 1.778 | 5.5 / 3.6 / 1.8, Ziel 1.30, true | 5.5 / 3.6 / 1.8 |
| DP12 | Z. 12: 2.3 Salate, DWC 9 l, Jungpflanze → echte_blaetter, Ziel 1.0 | wie DP09 | 3 / 1.40 | wie DP09 | 5.000 / 5.000 / 5.000 | 5.0 / 5.0 / 5.0, Ziel 1.00, true | 5 / 5 / 5 |
| DP13 | Z. 13: 2.3, 9 l, Wachstum, Ziel 1.2 | 1.0–1.4 / 1.1–1.3 | 3.6 / 1.58 | ausserhalb → Ziel 1.20; 2.3333 (= UC7-AK1) | 10.500 / 7.000 / 3.500 | 10.5 / 7.0 / 3.5, Ziel 1.20, true | 10.5 / 7 / 3.5 |
| DP14 | Z. 14: 3.1 Nüsslisalat, Kratky 7 l, Wachstum, Ziel 1.0 | 0.8–1.2 / 0.9–1.1 | 3.6 / 1.58 | ausserhalb → Ziel 1.00; 3.6 · 0.5 / 1.08 = 1.6667 | 5.833 / 3.889 / 1.944 | 6.0 / 3.9 / 1.9, Ziel 1.00, true | 6 / 4 / 2 |
| DP15 | Z. 15: 3.2 Spinat, Kratky 3 l, Wachstum, Ziel 1.6 | 1.4–1.8 / 1.5–1.7 | 3.6 / 1.58 | **im Band** → keine Skalierung, Ziel 1.58 | 5.400 / 3.600 / 1.800 | 5.5 / 3.6 / 1.8, Ziel 1.58, false | 5.5 / 3.5 / 2 |
| DP16 | Z. 16: 3.3 Babyleaf, Kratky 7 l, Wachstum, Ziel 1.0 | wie DP14 | 3.6 / 1.58 | wie DP14 | 5.833 / 3.889 / 1.944 | 6.0 / 3.9 / 1.9, Ziel 1.00, true | 6 / 4 / 2 |
| DP17 | Z. 18: 4.2 Jungpflanzenstation → Station 4.1, 3 l, feste Dosis 0.5 ml/L | Kontrollband 0.80–1.10 (R4.5, Düngeplan «0.8–1.1») | 1.5 / 0.95 | feste Dosis, keine Skalierung, keine Teil-Dosis; Ziel = ECSoll 0.95 | 1.500 / 1.500 / 1.500 | 1.5 / 1.5 / 1.5, Ziel 0.95, false | 1.5 / 1.5 / 1.5 |

Abweichungen der App vom Düngeplan (erwartet, Konzept R4.12 letzter Satz):

- DP02: Der Düngeplan skaliert 1.1 Wachstum von Hand auf 1.5 (33.5 / 22 / 11); mit dem Zielbereich 1.3–1.7 liegt ECSoll 1.58 im inneren Band 1.4–1.6, die App bleibt bei der Herstellerdosis 36.0 / 24.0 / 12.0. Abweichung bis 2.5 ml, also ausserhalb ±0.5 ml zum Düngeplan; massgebend ist die App-Erwartung.
- DP15: wie RF2 bleibt die Herstellerdosis; Micro 3.6 statt 3.5, Bloom 1.8 statt 2 (Düngeplan von Hand gerundet).
- DP14, DP16: Micro 3.9 und Bloom 1.9 statt 4 und 2; der Düngeplan rundet hier gröber als R4.11.

### Randfälle RF1 bis RF12 (Konzept R4.12, `06_tests.md` Abschnitt 4)

Wo ein Randfall kein Gefäss, Volumen, Stadium oder keinen Zielbereich nennt, bleibt die Spalte leer; wo er keine ml-Werte hat, bleiben die ml-Spalten leer und die Erwartung steht in `hinweis`.

| Zeile | Eingabe nach Quelle | Rechenweg | CSV-Erwartung |
|---|---|---|---|
| RF1 | 3.1, 7 l, wachstum, 1.0–1.4 | ECSoll 1.58 ausserhalb 1.1–1.3 → Ziel 1.20; D_neu 2.3333; roh 8.167 / 5.444 / 2.722 → 8.0 / 5.5 / 2.7; Summe 16.2 gegen 16.333 = −0.133 ml; −0.133 / 7 · 0.3 = −0.0057 → «−0.01 mS/cm» | 8.0 / 5.5 / 2.7, Ziel 1.20, true |
| RF2 | 3.2, 3 l, Kratky belüftet, Direktsaat, wachstum, 1.5–1.8 | Band 1.575–1.725; ECSoll 1.58 im Band; roh 5.4 / 3.6 / 1.8 → 5.5 / 3.6 / 1.8 (5.4 ≥ 5 → 0.5-Schritt) | 5.5 / 3.6 / 1.8, Ziel 1.58, false |
| RF3 | Zielbereich 0.8–1.2, ECWasser 0.95 | 0.95 > 1.2 − 0.3 = 0.90 → Ziel = obere Grenze 1.20 | Ziel 1.20, Hinweis; keine ml |
| RF4 | Verdünnen, ECZiel = ECWasser = 0.5 | R4.9: ECZiel ≤ ECWasser → «mit Wasser allein nicht erreichbar», ohne Division | Ziel 0.50, Hinweis |
| RF5 | Verdünnen, EC1 = ECZiel = 1.2 | R4.9: EC1 ≤ ECZiel → «kein Verdünnen nötig», 0 l | Ziel 1.20, Hinweis |
| RF6 | 6 l mit EC 1.5, Ziel 1.2, Betriebsvolumen 8 l | 6 · 0.3 / 0.7 = 2.571 → 2.6 l; frei 8 − 6 = 2.0 l; (6 · 1.5 + 2 · 0.5) / 8 = 1.25 | volumen_l 8, Ziel 1.20, Hinweis mit 2.6 / 2.0 / 1.25 |
| RF7 | leeres Gefäss, Neuansatz | keine Rechnung ohne Ziel-EC und Stadium; Vorschlag «wachstum» | nur Hinweis |
| RF8 | Station 4.4, k nicht stabil | R4.5: feste Dosis ohne Teil-Dosis; Volumen 2.3 l (A) nach Konzept 5.3; roh 0.5 · 2.3 = 1.15 → 1.2 je Teil; ECSoll 0.95 | teil_dosis 0.75 (A, Eingabe), 1.2 / 1.2 / 1.2, Ziel 0.95, false |
| RF9 | Kontrollmessung 1.25 bei Ziel 1.2 | R4.7: ΔD = (1.2 − 1.25) / 0.3 < 0 → 0 | ml-Spalten = Restdosis 0.0 / 0.0 / 0.0 (A), Ziel 1.20 |
| RF10 | Ist 18.0 ml (2.0 ml/L) auf 9 l, ECIst 1.05, Ziel 1.2 | siehe Kontrolle UC7-AK3; Aufteilung im Verhältnis wachstum (A) | ml-Spalten = Restdosis 2.3 / 1.5 / 0.8, volumen_l 9, Ziel 1.20 |
| RF11 | 7.25 ml | 7.25 / 0.5 = 14.5 → kaufmännisch 15 → 7.5 | nur Hinweis |
| RF12 | Teil-Dosis 75 %, Beispiel 2.3 | wie UC7-AK1 75 %: 8.0 / 5.5 / 2.6; Summe 16.1 / 9 = 1.789 → 1.79 ml/L; 0.5 + 0.3 · 1.79 = 1.037 → 1.04; Grenze 1.04 + 0.25 = 1.29, Hinweis ab 1.30 (Rückfrage R4) | 8.0 / 5.5 / 2.6, teil_dosis 0.75, Ziel 1.20, true |

## Format

- UTF-8 ohne BOM, LF, Punkt als Dezimaltrenner, Komma als Trenner, keine Anführungszeichen (kein `hinweis` enthält ein Komma); 1 Kopfzeile + 29 Datenzeilen.
- `zeile_id`: `DP01` bis `DP17` (Düngeplan) und `RF1` bis `RF12`.
- `stadium`: Werte des Enums `public.stadium`.
- `teil_dosis`: Faktor wie `ansatz.teil_dosis` (1.00 = aus, 0.75, 0.85).
- `skaliert`: `true` / `false` wie `ansatz.skaliert`; leer, wo der Randfall keinen Neuansatz rechnet.
- EC-Werte auf Hundertstel, ml auf eine Nachkommastelle.

## Annahmen (A)

1. Zielbereich DP01 bis DP16 = Ziel-EC des Düngeplans ± 0.2 (kein von Tim festgelegter Bereich im Repository).
2. DP17: Zielbereich-Spalten tragen das Kontrollband der Station 0.80–1.10 (R4.5); `ec_ziel` = ECSoll der festen Dosis 0.95.
3. Unskalierte Zeilen: `ec_ziel` = ECSoll (R4.2 «ECZiel = ECSoll»).
4. RF8: Volumen der Station 4.4 = 2.3 l (Konzept 5.3, dort selbst als (A) geführt); `teil_dosis` = 0.75 als Eingabe «k nicht stabil», Ergebnis trotzdem 100 %.
5. RF9 und RF10: die ml-Spalten tragen die Restdosis, nicht den Neuansatz; RF9 = 0.0 je Komponente.
6. RF10: Aufteilung der Restdosis im Verhältnis `wachstum` (1.8 : 1.2 : 0.6), weil nur so 2.3 / 1.5 / 0.8 entsteht; Gefäss offen gelassen.
7. RF2: Gefäss 3.2 laut Randfall; Betriebsart und Direktsaat nur im Hinweis, da die Spalten keine Betriebsart führen.
8. Spaltenwerte `true`/`false` und Faktor 1.00/0.75/0.85 nach `02_datenmodell.sql`; `06_tests.md` legt die Kodierung nicht fest.
9. Kaufmännische Rundung mit Schwelle «unter 5 ml» auf den ungerundeten Wert.

## Zeilen mit Unsicherheit

- DP02 (1.1 Wachstum): hängt am Zielbereich (A); mit ± 0.2 bleibt die Herstellerdosis, der Düngeplan von Hand liegt 2.5 ml tiefer. Ein schmalerer oder tieferer Zielbereich von Tim würde skalieren.
- DP15 (3.2 Spinat): ECSoll 1.58 liegt nur 0.08 über der unteren Bandgrenze 1.50; ein anderer Zielbereich kippt die Zeile auf «skaliert».
- DP06 (1.2 Wachstum): D_neu 4.0 liegt nahe der Kappung 1.2 · 3.6 = 4.32; ein höherer Zielbereich würde «Ziel nicht ganz erreichbar» auslösen.
- RF8: Rundung genau auf dem halben Schritt (1.15 → 1.2); empfindlich auf Gleitkomma im Rechner, innerhalb ±0.5 ml aber unkritisch. Das Stationsvolumen 2.3 l ist selbst (A).
- RF9, RF10: Bedeutung der ml-Spalten (Restdosis) muss der Test kennen.
- Kennungen: Konzept 5.3 nennt 4.1 eine Halbbox und 4.2 bis 4.5 die Stationen, R4.5 und R8 sprechen von «Stationen 4.1 bis 4.5»; DP17 folgt R8 («Station 4.1, 3 l»).
