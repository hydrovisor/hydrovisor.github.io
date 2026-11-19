# Lead-Entscheide W0 Runde 12 (Entscheid 0018, Issue #250)
Stand 19.11.2026. Erzeugt aus den Kandidatendateien (Spalte `notiz_tim` der freigegebenen Zeilen). Werkzeug: `scripts/w0/lead_entscheide_runde12.py` mit `scripts/w0/w0lib.py`, Bericht `scripts/w0/berichte.py`.

## Fachregeln für offene Werte (A)
| Regel | Inhalt |
|---|---|
| D1 | Bereich ohne typischen Wert: typ = abgerundete Mitte |
| D2 | mehrere Einzelwerte: min und max = kleinster und grösster Quellenwert, typ = Wert der besten Quelle nach Regel 9.3 |
| D3 | ein Einzelwert x: min = 0.8·x, max = 1.25·x (gerundet), typ = x |
| D4 | Angabe in Wochen: Tage = 7·Wochen |
| D5 | Tage ab Saat: minus Keimdauer derselben Quelle, sonst minus Keimdauer typ der Art |
| D6 | nur eine Grenze aus einem Quellenwert (typ ist der grösste bzw. kleinste Quellenwert): die andere nach D3 (0.8·typ bzw. 1.25·typ) |
| D7 | ernte_ab_d ab Saat ohne Umsetztag derselben Quelle oder aus Direktsaat der Quelle, in der Anlage umgesetzt: minus art.umsetzen_ab_d, fehlt er minus Keimung typ plus Anzucht typ der Art |
| E1 | pH- oder EC-Einzelwert: Band ±0.2 um den Wert |
| E2 | Band über der Validatorgrenze: auf die Grenze gekürzt |
| E3 | EC-Basis nach der Quelle korrigiert (Methodenprüfer) |

## Neue oder geänderte freigegebene Zeilen auf Ebene Art

| zeile_id | Wert | Quelle (Klasse) | Entscheid |
|---|---|---|---|
| `ak.beta_vulgaris_cicla.schnitt.ernte_ab_d` | 19 | risegardens-library-mangold (B2) | eigener Wert aus ak.beta_vulgaris_cicla.schnitt.ernte_ab_d#3: Runde 12 (#250), Regel D7 (A): «Ready to harvest: Day 39» ab Saat (Indoor-System mit LED, Klasse B2) minus Keimung typ 4 und Anzucht typ 16 der freigegebenen Phasendauern (art.umsetzen_ab_d fehlt) = 19 Tage ab Umsetzen |
| `ak.lactuca_sativa.babyleaf.ernte_ab_d` | 21 | risegardens-salat-dauer-2026 (B2) | Runde 12 (#250), Babyleaf-Ernte 21 Tage ab Saat (Indoor-System mit LED, Saatpods im System, Klasse B2); die Babyleaf-Mischung wird nach Konzept 3.3 direkt im Kratky-Gefäss gesät, der Wert gilt also ab Saat ohne Umrechnung (Befund 1 des Prüfers, Runde 1; wie Spinat Babyleaf 14); ≤ kulturdauer_max_d 30 |
| `ak.lactuca_sativa.babyleaf.kulturdauer_max_d` | 30 | frontiers-babyleaf-nitrat-floating-2021 (A) | Runde 12 (#250), spätester Babyleaf-Erntetermin 30 Tage ab Saat (Floating, Klasse A); #2 (35, Klasse B2) gilt für Pflücksalat allgemein |
| `ak.lactuca_sativa.kopf.kulturdauer_max_d` | 45 | risegardens-salat-dauer-2026 (B2) | Runde 12 (#250), obere Grenze «30–45 days» ab Saat (Indoor-System mit LED, Klasse B2); ≥ kulturdauer_typisch_d 35; #3 (Klasse B1) wegen verworfener Quellenzeile (Jahr) nicht wählbar; Fachkritik P6: Butterhead und Romana brauchen bis 55 Tage, die Kulturfrage (R1.7) bietet dann «Verlängern um 14 Tage»; P12: Rise Gardens nennt NFT für seine Systeme, NFT ist hydroponisch (Konzept 9.1) |
| `ak.lactuca_sativa.schnitt.ernte_ab_d` | 23 | jas-lettuce-cut-and-come-again-2017 (A) | eigener Wert aus ak.lactuca_sativa.schnitt.ernte_ab_d#1: Runde 12 (#250), Regel D4 (A): 5 Wochen = 35 Tage ab Saat (Direktsaat in Floating-Schalen, Klasse A); Regel D7 (A): minus art.umsetzen_ab_d 12 = 23 Tage ab Umsetzen; passt zu Intervall 7 und Kulturdauer max. 42 (zweiter Schnitt 6 Wochen ab Saat); #3 (4 Wochen ab Umsetzen, Klasse C) und #2 (21 ab Saat, Klasse B2) nicht gewählt |
| `ak.ocimum_basilicum.dauerkultur_blatt.ernte_ab_d` | 18 | frontiers-basilikum-raft-sorten-2021 (A) | Runde 12 (#250), erster Schnitt 18 Tage nach Umsetzen in das Floating-Raft-System (Klasse A, System wie DWC der Anlage); #2 (13, Tabelle, Text derselben Seite 15 bis 28) nicht gewählt |
| `ak.petroselinum_crispum.dauerkultur_blatt.ernte_ab_d` | 28 | plos-one-dill-petersilie-2021 (A) | eigener Wert aus ak.petroselinum_crispum.dauerkultur_blatt.ernte_ab_d#3: Runde 12 (#250), Regel D4 (A): «four weeks» nach Umsetzen = 28 Tage (Deep-Flow-Tische = DWC, Klasse A); Fachkritik P9: die erste Ernte 49 Tage ab Saat aus #1 (Virginia Tech) ergibt ab dem Umsetzen der App (Keimung typ 14 plus Anzucht typ 7 = 21) ebenfalls 28; passt zu Wachstum min. 28 derselben Quelle; #1 und #2 (21, Umsetzen erst nach 28 bzw. 47 Tagen) nicht gewählt |

Dazu 0 Kulturgruppen-Mindestzeilen (V13) als Kopie der neuen Art-Zeilen der Leitkultur bzw. mit «(A) andere Art».


## Ergänzungen des Lead zu Runde 12

- **Regel D7 (A), neu:** `ernte_ab_d` zählt ab Umsetzen, bei Direktsaat ab Saat (`03_import_w0.md` 4.3.3). Nennt die Quelle Tage ab Saat ohne eigenen Umsetztag oder sät sie direkt in das Endsystem, während die Anlage die Kulturform umsetzt, zieht der Lead `art.umsetzen_ab_d` der Art ab; fehlt dieser, Keimung typ plus Anzucht typ der freigegebenen Phasendauern (der Tag, an dem die App das Umsetzen erwartet). Salat Schnitt: 12 (= 3 + 9), Mangold: 4 + 16 = 20. Nicht bei Kulturformen, die in der Anlage direkt gesät werden (Babyleaf nach Konzept 3.3): dort gilt der Wert ab Saat unverändert.
- **Konflikte (Fachkritik `fachkritik_runde-12.md`):** K-salat-16 → #1 umgerechnet 23 (geht mit Intervall 7 und Kulturdauer max. 42 auf, P1); K-salat-17 → #1 30 (gemessen, Klasse A, P5); K-basilikum-13 → #1 18 (Floating Raft, P7 gegen #2); K-petersilie-14 → #3 umgerechnet 28 (Befund P9: Die Quellen mit 21 setzen erst nach 28 bzw. 47 Tagen um; ab dem Umsetzen der App nach 21 Tagen ergibt die erste Ernte nach 49 Tagen ab Saat aus Virginia Tech ebenfalls 28; passt zu Wachstum min. 28).
- **Salat Babyleaf 21 statt 9 (Befund 1 des Prüfers, Runde 1):** Die Babyleaf-Mischung wird nach Konzept 3.3 direkt im Kratky-Gefäss gesät; die App rechnet dann ab Saat. Der zuerst freigegebene eigene Wert 9 (21 minus Umsetzen 12) ist zurückgenommen, gewählt ist der Quellenwert 21 (wie Spinat Babyleaf 14 ab Saat), ≤ Kulturdauer max. 30.
- **Kopfsalat Kulturdauer max. 45 (P6):** Die Quelle nennt für Butterhead, Romana und Batavia bis 55 Tage. 45 ist die obere Grenze ihrer allgemeinen Aussage; die Kulturfrage (R1.7) bietet «Verlängern um 14 Tage».
- **Mangold 19 (P11):** unter Wachstum min. 24; der erste Schnitt äusserer Blätter ist vor dem Ende des Wachstums möglich. Herstellerangabe Klasse B2 mit LED-Indoor-System; ab Saat 4 + 16 + 19 = 39 wie die Quelle.
- **Rise Gardens als NFT (P12):** Die Methodenprüfung ist zugelassen, weil der Hersteller NFT auf einer eigenen Seite für seine Systeme nennt; NFT ist hydroponisch (Konzept 9.1). Der Verwurf in Runde 11 betraf eine andere Seite.
- **Gesperrte Volltexte:** Vier Kandidaten aus MDPI-Arbeiten (Spinat Schnitt `ernte_ab_d` 34, Spinat Babyleaf Kulturdauer max. 46, Mangold `ernte_ab_d` 28 und Intervall 14) sowie Basilikum 50 (Adv. Hort. Sci., Bot-Sperre beim Verlag) sind verworfen, weil die Prüfrollen den Volltext ohne Umgehung der Verlagssperre nicht lesen konnten. Eine Prüfung im Browser durch Tim oder eine freie Kopie (PMC, Repositorium) wäre ein Posten für eine spätere Runde.
- **Schnittlauch (Salve Regina «Day 52»):** verworfen, weil die Fundstelle offenlässt, ob ab Saat oder ab Umsetzen gezählt wird.
- **Kentucky CCD-CP-63 (Kopfsalat max. 56):** Quelle verworfen (Jahr 2025 statt 2026); eine Neueinreichung mit korrektem Jahr ergäbe einen Konflikt 45 gegen 56.

## Wirkung im Erntekalender

Mit `ernte_ab_d` rechnet `ernteStand()` die erste Ernte ab dem Umsetztag der Pflanzung: Basilikum Dauerkultur 18, Petersilie 28, Salat Schnitt 23, Mangold Schnitt 19 Tage; Salat Babyleaf (Direktsaat) 21 Tage ab Saat. Vor dem Umsetzen und für das Ende der Dauerkulturen (ohne `kulturdauer_max_d`) bleibt der Termin offen.

## Verbleibende Lücken (Klasse D, keine Zeile)

| Art | Kulturform | ohne Wert |
|---|---|---|
| Tomate | dauerkultur_frucht | `ernteintervall_d` (nur «2-4 times weekly»), `schnitte_max` |
| Chili | dauerkultur_frucht | `schnitte_max`, `kulturdauer_max_d` |
| Basilikum | dauerkultur_blatt, schnitt | `schnitte_max`, `kulturdauer_max_d` |
| Petersilie | dauerkultur_blatt | `schnitte_max`, `kulturdauer_max_d` |
| Schnittlauch | dauerkultur_blatt | `ernte_ab_d`, `ernteintervall_d`, `schnitte_max` |
| Schnittlauch | schnitt | `ernte_ab_d`, `ernteintervall_d`, `schnitte_max`, `kulturdauer_max_d` |
| Spinat | schnitt | `ernte_ab_d`, `kulturdauer_max_d` |
| Spinat | babyleaf, kopf | `kulturdauer_max_d` |
| Randen | schnitt | alle vier |
| Mangold | schnitt | `ernteintervall_d`, `schnitte_max`, `kulturdauer_max_d` |

Dazu fehlen `art.umsetzen_ab_d` für Basilikum, Petersilie, Schnittlauch, Randen und Mangold (Fachkritik, Lückenliste).
