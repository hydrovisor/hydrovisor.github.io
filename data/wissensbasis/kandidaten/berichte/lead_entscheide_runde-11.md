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
