# Lead-Entscheide W0 Runde 11 (Entscheid 0018, Issue #242)
Stand 18.11.2026. Erzeugt aus den Kandidatendateien (Spalte `notiz_tim` der freigegebenen Zeilen). Werkzeug: `scripts/w0/lead_entscheide_runde11.py` mit `scripts/w0/w0lib.py`, Bericht `scripts/w0/berichte.py`.

## Fachregeln für offene Werte (A)
| Regel | Inhalt |
|---|---|
| D1 | Bereich ohne typischen Wert: typ = abgerundete Mitte |
| D2 | mehrere Einzelwerte: min und max = kleinster und grösster Quellenwert, typ = Wert der besten Quelle nach Regel 9.3 |
| D3 | ein Einzelwert x: min = 0.8·x, max = 1.25·x (gerundet), typ = x |
| D4 | Angabe in Wochen: Tage = 7·Wochen |
| D5 | Tage ab Saat: minus Keimdauer derselben Quelle, sonst minus Keimdauer typ der Art |
| D6 | nur eine Grenze aus einem Quellenwert (typ ist der grösste bzw. kleinste Quellenwert): die andere nach D3 (0.8·typ bzw. 1.25·typ) |
| E1 | pH- oder EC-Einzelwert: Band ±0.2 um den Wert |
| E2 | Band über der Validatorgrenze: auf die Grenze gekürzt |
| E3 | EC-Basis nach der Quelle korrigiert (Methodenprüfer) |

## Neue oder geänderte freigegebene Zeilen auf Ebene Art

| zeile_id | Wert | Quelle (Klasse) | Entscheid |
|---|---|---|---|
| `ak.allium_schoenoprasum.dauerkultur_blatt.kulturdauer_max_d` | 730 | simplyhydro-schnittlauch (C) | eigener Wert aus ak.allium_schoenoprasum.dauerkultur_blatt.kulturdauer_max_d#1: Runde 11 (#242), Regel D4 sinngemäss (A): «replacing plants every two years» = 2 × 365 Tage (Hydroponik-Praxis, Klasse C) |
| `ak.brassica_rapa_chinensis.kopf.kulturdauer_max_d` | 60 | risegardens-bok-choy-2026 (B2) | Runde 11 (#242), obere Grenze für grosse Sorten, Zählung ab Saat (Quellenprüfung), Klasse B2; ≥ kulturdauer_typisch_d 32 |
| `ak.capsicum_annuum.dauerkultur_frucht.ernteintervall_d` | 7 | ua-ceac-kurs-kap8 (B1) | eigener Wert aus ak.capsicum_annuum.dauerkultur_frucht.ernteintervall_d#1: Runde 11 (#242), Regel D4 (A): «once a week» = 7 Tage (Gewächshaus-Hydroponik, Klasse B1); dieselbe Stelle nennt zweimal je Woche als üblich, die Anlage erntet für den Eigenbedarf wöchentlich |
| `ak.capsicum_annuum.dauerkultur_frucht.kulturdauer_max_d` | 364 | ua-tomato-workshop-modul5-2026 (B1) | eigener Wert aus ak.solanum_lycopersicum.dauerkultur_frucht.kulturdauer_max_d#1: Runde 11 (#242), (A) andere Art: Leitkultur Tomate der Kulturgruppe Fruchtgemüse (wie V13); Chili als Jahreskultur im Gewächshaus (Anbauquellen in recherche.md nennen Saat im Herbst und Ende nach rund einem Jahr); ≥ Saat bis erste Ernte (Keimung 8 + Anzucht 14 + ernte_ab_d 102 = 124) |
| `ak.lactuca_sativa.schnitt.ernteintervall_d` | 7 | jas-lettuce-cut-and-come-again-2017 (A) | eigener Wert aus ak.lactuca_sativa.schnitt.ernteintervall_d#1: Runde 11 (#242), Regel D4 (A): 1 Woche = 7 Tage («weekly harvests», Floating-Schalen, Klasse A) |
| `ak.lactuca_sativa.schnitt.kulturdauer_max_d` | 42 | jas-lettuce-cut-and-come-again-2017 (A) | eigener Wert aus ak.lactuca_sativa.schnitt.kulturdauer_max_d#1: Runde 11 (#242), Regel D4 (A): 6 Wochen ab Saat = 42 Tage, bis zum zweiten Schnitt (passt zu schnitte_max 2 und Intervall 7) |
| `ak.lactuca_sativa.schnitt.schnitte_max` | 2 | jas-lettuce-cut-and-come-again-2017 (A) | Runde 11 (#242), Empfehlung der Quelle: nach zwei Schnitten neu säen (Klasse A); im Versuch mehr Schnitte bei sinkendem Ertrag |
| `ak.ocimum_basilicum.dauerkultur_blatt.ernteintervall_d` | 21 | cafre-blattsalat-kraeuter-2020 (B1) | eigener Wert aus ak.ocimum_basilicum.schnitt.ernteintervall_d#2: Runde 11 (#242), Regel D4 (A): «roughly 3 week intervals» = 21 Tage; die Quelle nennt das Schnittintervall des Basilikums ohne Bezug auf eine Kulturform, gilt also auch für die Dauerkultur (Vorgabe der Art) |
| `ak.ocimum_basilicum.schnitt.ernteintervall_d` | 21 | cafre-blattsalat-kraeuter-2020 (B1) | eigener Wert aus ak.ocimum_basilicum.schnitt.ernteintervall_d#2: Runde 11 (#242), Regel D4 (A): «roughly 3 week intervals» = 21 Tage (Klasse B1) |
| `ak.petroselinum_crispum.dauerkultur_blatt.ernteintervall_d` | 7 | fshs-kraeuter-vertikal-2001 (A) | eigener Wert aus ak.petroselinum_crispum.dauerkultur_blatt.ernteintervall_d#2: Runde 11 (#242), Regel D4 (A): wöchentliche Ernte = 7 Tage (Perlit-Türme, Klasse A); bestätigt durch #1 (NFT, Klasse B1) |
| `ak.solanum_lycopersicum.dauerkultur_frucht.kulturdauer_max_d` | 364 | ua-tomato-workshop-modul5-2026 (B1) | Runde 11 (#242), Jahresplan Gewächshaus-Hydroponik «Day 364 Remove Plants» (Klasse B1) |
| `ak.spinacia_oleracea.schnitt.ernteintervall_d` | 7 | cornell-cea-spinat-2005 (B1) | eigener Wert aus ak.spinacia_oleracea.schnitt.ernteintervall_d#1: Runde 11 (#242), Regel D4 (A): 1 Woche = 7 Tage (Cornell CEA, Klasse B1) |
| `ak.spinacia_oleracea.schnitt.schnitte_max` | 3 | cornell-cea-spinat-2005 (B1) | Runde 11 (#242), drei Schnitte je Pflanze (Cornell CEA, Klasse B1); #3 (5 Schnitte, Klasse A) wegen gesperrter Quelle nicht geprüft |
| `ak.valerianella_locusta.kopf.kulturdauer_max_d` | 66 | plants-valerianella-selen-2021 (A) | Runde 11 (#242), letzter Erntetermin bei Marktreife 66 Tage ab Saat (Floating, Klasse A); ≥ kulturdauer_typisch_d 51 |

Dazu 0 Kulturgruppen-Mindestzeilen (V13) als Kopie der neuen Art-Zeilen der Leitkultur bzw. mit «(A) andere Art».

## Ergänzungen des Lead zu Runde 11

- **Regel D4 sinngemäss für Jahre (A):** 1 Jahr = 365 Tage (Schnittlauch Dauerkultur «every two years» = 730).
- **Salat Schnitt, Kulturdauer max. 42 (A):** Die Quelle nennt 6 Wochen ab Saat bis zum zweiten Schnitt. Mit den freigegebenen Phasenwerten (typisch) läge der zweite Schnitt bei rund 47 Tagen (Fachkritik P3). Der Wert bleibt bei der Quelle; die Kulturfrage (R1.7) fragt ohnehin am früheren Tag von Kulturende und erreichten Schnitten und bietet «Verlängern um 14 Tage».
- **Chili, Kulturdauer max. 364 (A):** andere Art, Leitkultur Tomate der Kulturgruppe Fruchtgemüse (wie V13); die Anbauquellen in `teile/fruchtgemuese/recherche.md` nennen für Chili im Gewächshaus eine Jahreskultur.
- **Ohne Redaktor (A):** Die Fachkritik fand keinen Konflikt; die Freigabevorschläge des Redaktors entfallen, der Lead wählt je Feld den einzigen geprüften Kandidaten (Petersilie: zwei gleiche Werte, Klasse A gewählt, Annahme 8).
- **MDPI-Quellen:** Drei Arbeiten (Mangold Meerwasser 2022, Randen Babyleaf 2025, Spinat und Rauke Floating 2021) waren für die Quellenprüfung gesperrt (HTTP 403) und sind deshalb verworfen. Sie enthielten unter anderem Spinat Schnitte 5, Mangold Intervall 14 und Ernte ab 28 Tagen. Eine Prüfung im Browser ist ein Posten für eine spätere Runde.

## Verbleibende Lücken (Klasse D, keine Zeile)

Klasse D erzeugt nach `docs/spec/03_import_w0.md` Abschnitt 2 Punkt 7 keine Zeile. Der Erntekalender zeigt für diese Kulturformen die Termine, die aus den übrigen Werten folgen (erste Ernte über `ernte_ab_d`, Schnitte über das Intervall), sonst «Termine noch offen».

| Art | Kulturform | ohne Wert |
|---|---|---|
| Salat | kopf, babyleaf | `kulturdauer_max_d` |
| Tomate, Chili | dauerkultur_frucht | `schnitte_max` (Zahl der Pflückgänge nennt keine Quelle); Tomate auch `ernteintervall_d` («every 3-4 days» nur als Bereich) |
| Basilikum | dauerkultur_blatt, schnitt | `schnitte_max`, `kulturdauer_max_d` |
| Schnittlauch | dauerkultur_blatt | `ernteintervall_d`, `schnitte_max` |
| Schnittlauch | schnitt | alle drei |
| Petersilie | dauerkultur_blatt | `schnitte_max`, `kulturdauer_max_d` |
| Spinat | schnitt | `kulturdauer_max_d` |
| Spinat | babyleaf, kopf | `kulturdauer_max_d` (Babyleaf 46 Tage stand in einer gesperrten MDPI-Quelle) |
| Randen, Mangold | schnitt | alle drei |

Nebenbefund der Fachkritik: Für Salat Schnitt, Spinat Schnitt, Basilikum, Petersilie, Schnittlauch, Randen und Mangold ist auch `ernte_ab_d` nicht freigegeben; ohne ihn fehlt im Erntekalender die erste Ernte. Folgeposten für eine spätere W0-Runde.
