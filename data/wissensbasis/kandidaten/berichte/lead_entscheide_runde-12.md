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
| E1 | pH- oder EC-Einzelwert: Band ±0.2 um den Wert |
| E2 | Band über der Validatorgrenze: auf die Grenze gekürzt |
| E3 | EC-Basis nach der Quelle korrigiert (Methodenprüfer) |

## Neue oder geänderte freigegebene Zeilen auf Ebene Art

| zeile_id | Wert | Quelle (Klasse) | Entscheid |
|---|---|---|---|
| `ak.beta_vulgaris_cicla.schnitt.ernte_ab_d` | 19 | risegardens-library-mangold (B2) | eigener Wert aus ak.beta_vulgaris_cicla.schnitt.ernte_ab_d#3: Runde 12 (#250), Regel D7 (A): «Ready to harvest: Day 39» ab Saat (Indoor-System mit LED, Klasse B2) minus Keimung typ 4 und Anzucht typ 16 der freigegebenen Phasendauern (art.umsetzen_ab_d fehlt) = 19 Tage ab Umsetzen |
| `ak.lactuca_sativa.babyleaf.ernte_ab_d` | 9 | risegardens-salat-dauer-2026 (B2) | eigener Wert aus ak.lactuca_sativa.babyleaf.ernte_ab_d#3: Runde 12 (#250), Regel D7 (A): 21 Tage ab Saat (Indoor-System mit LED, Klasse B2) minus art.umsetzen_ab_d 12 = 9 Tage ab Umsetzen; bei Direktsaat rechnet die App ab Saat |
| `ak.lactuca_sativa.babyleaf.kulturdauer_max_d` | 30 | frontiers-babyleaf-nitrat-floating-2021 (A) | Runde 12 (#250), spätester Babyleaf-Erntetermin 30 Tage ab Saat (Floating, Klasse A); #2 (35, Klasse B2) gilt für Pflücksalat allgemein |
| `ak.lactuca_sativa.kopf.kulturdauer_max_d` | 45 | risegardens-salat-dauer-2026 (B2) | Runde 12 (#250), obere Grenze «30–45 days» ab Saat (Indoor-System mit LED, Klasse B2); ≥ kulturdauer_typisch_d 35; #3 (Klasse B1) wegen verworfener Quellenzeile (Jahr) nicht wählbar |
| `ak.lactuca_sativa.schnitt.ernte_ab_d` | 23 | jas-lettuce-cut-and-come-again-2017 (A) | eigener Wert aus ak.lactuca_sativa.schnitt.ernte_ab_d#1: Runde 12 (#250), Regel D4 (A): 5 Wochen = 35 Tage ab Saat (Direktsaat in Floating-Schalen, Klasse A); Regel D7 (A): minus art.umsetzen_ab_d 12 = 23 Tage ab Umsetzen; passt zu Intervall 7 und Kulturdauer max. 42 (zweiter Schnitt 6 Wochen ab Saat); #3 (4 Wochen ab Umsetzen, Klasse C) und #2 (21 ab Saat, Klasse B2) nicht gewählt |
| `ak.ocimum_basilicum.dauerkultur_blatt.ernte_ab_d` | 18 | frontiers-basilikum-raft-sorten-2021 (A) | Runde 12 (#250), erster Schnitt 18 Tage nach Umsetzen in das Floating-Raft-System (Klasse A, System wie DWC der Anlage); #2 (13, Tabelle, Text derselben Seite 15 bis 28) nicht gewählt |
| `ak.petroselinum_crispum.dauerkultur_blatt.ernte_ab_d` | 28 | plos-one-dill-petersilie-2021 (A) | eigener Wert aus ak.petroselinum_crispum.dauerkultur_blatt.ernte_ab_d#3: Runde 12 (#250), Regel D4 (A): «four weeks» nach Umsetzen = 28 Tage (Deep-Flow-Tische = DWC, Klasse A); Fachkritik P9: die erste Ernte 49 Tage ab Saat aus #1 (Virginia Tech) ergibt ab dem Umsetzen der App (Keimung typ 14 plus Anzucht typ 7 = 21) ebenfalls 28; passt zu Wachstum min. 28 derselben Quelle; #1 und #2 (21, Umsetzen erst nach 28 bzw. 47 Tagen) nicht gewählt |

Dazu 0 Kulturgruppen-Mindestzeilen (V13) als Kopie der neuen Art-Zeilen der Leitkultur bzw. mit «(A) andere Art».
