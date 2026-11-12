# Lead-Entscheide W0 Runde 7 (Entscheid 0018, Issue #190)
Stand 12.11.2026. Erzeugt aus den Kandidatendateien (Spalte `notiz_tim` der freigegebenen Zeilen). Werkzeug: `scripts/w0/lead_entscheide_runde7.py` mit `scripts/w0/w0lib.py`, Bericht `scripts/w0/berichte.py`.

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

## Neue oder geänderte freigegebene Zeilen auf Ebene Art

| zeile_id | Wert | Quelle (Klasse) | Entscheid |
|---|---|---|---|
| `pw.allium_schoenoprasum.anzucht.ec` | 0.4/0.8 mS/cm | frankiesgarten-hydroponik-einstieg (C) | eigener Wert aus pw.allium_schoenoprasum.anzucht.ec#1: Runde 7, (A) Band aus den beiden Stufen derselben Tabelle (erste Blätter 0.4 bis 0.6 #1, Jungpflanze 0.6 bis 0.8 #2) wie bei Basilikum und Chili; Befund 1 aus PR #189 |
| `pw.beta_vulgaris_cicla.anzucht.dauer` | 10/16/20 | horticulturae-mangold-meerwasser-2022 (A) | eigener Wert aus pw.beta_vulgaris_cicla.anzucht.dauer#1: Runde 7, Regel D2/D3 (A): typ 16 aus #1 (A, stehende Nährlösung wie Kratky, Regel 2), min 10 aus #4 (A, Ebbe-Flut), max 1.25·16 (#1 ist der grösste Quellenwert) |
| `pw.beta_vulgaris_conditiva.anzucht.dauer` | 8/10/13 | agriculture-randen-babyleaf-2025 (A) | eigener Wert aus pw.beta_vulgaris_conditiva.anzucht.dauer#1: Runde 7, Regel D3 (A): 14 Tage ab Saat bis Umsetzen minus Keimkammer 4 Tage derselben Quelle |
| `pw.beta_vulgaris_conditiva.anzucht.ec` | 0.5/1.2 mS/cm | frankiesgarten-rote-bete-hydroponik (C) | eigener Wert aus pw.beta_vulgaris_conditiva.anzucht.ec#2: Runde 7, (A) Band aus den beiden Stufen derselben Anzuchtkarte (Keimling 0.5 #3, Jungpflanze 0.8 bis 1.2 #2) wie bei Basilikum und Chili; Befund 1 aus PR #189 |
| `pw.beta_vulgaris_conditiva.wachstum.dauer` | 14/17/21 | agriculture-randen-babyleaf-2025 (A) | eigener Wert aus pw.beta_vulgaris_conditiva.wachstum.dauer#1: Runde 7, Regel D2/D3 (A): typ 17 aus #1 (A, Floating wie DWC der Anlage, Regel 2), max 21 aus #3 (A, NFT, Ernte 30 minus Umsetzen 9 Tage ab Saat), min 0.8·17 (#1 ist der kleinste Quellenwert); #2 (frankiesgarten, 8 bis 10 Wochen) gilt der Knollenernte, nicht der Blattnutzung |
| `pw.ocimum_basilicum.anzucht.dauer` | 7/18/23 | biology-11-991-basilikum-pflanzenfabrik-2022 (A) | eigener Wert aus pw.ocimum_basilicum.anzucht.dauer#8: Runde 7, Regel D2/D3 (A): typ 18 aus #8 (A, 20 Tage ab Saat minus Keimung 2 Tage, Schwammwürfel unter LED wie die Anlage, Regel 1 und 2), min 7 aus #5, #6 und #7 (B2, Rise Gardens), max 1.25·18 wie bei der Keimdauer Petersilie (#8 ist der grösste Quellenwert) |
| `pw.petroselinum_crispum.anzucht.dauer` | 6/7/9 | risegardens-darki-petersilie (B2) | eigener Wert aus pw.petroselinum_crispum.anzucht.dauer#4: Runde 7, Regel D3 (A): 7 Tage ab Keimung bis Umsetzen (Stufen «Germination» und «Move to Garden» derselben Seite), bestätigt durch #5 (Rise Gardens, andere Sorte) |
| `pw.petroselinum_crispum.anzucht.ec` | 0.4/0.8 mS/cm | frankiesgarten-hydroponik-einstieg (C) | eigener Wert aus pw.petroselinum_crispum.anzucht.ec#1: Runde 7, (A) Band aus den beiden Stufen derselben Tabelle (erste Blätter 0.4 bis 0.6 #1, Jungpflanze 0.6 bis 0.8 #2) wie bei Basilikum und Chili; Befund 1 aus PR #189 |
| `pw.solanum_lycopersicum.wachstum.dauer` | 16/28/35 | frontiers-nft-cherry-bari-2016 (A) | eigener Wert aus pw.solanum_lycopersicum.wachstum.dauer#3: Runde 7, Regel D2/D3 (A): typ 28 aus #3 (A, NFT als Wasserkultur am nächsten an DWC und Kratky, Regel 2), min 16 aus #5 (A, Kokos, 15.87 gerundet), #4 (A, Steinwolle, 21.4 bis 22.6) liegt dazwischen; max 1.25·28 (#3 ist der grösste Quellenwert) |

Dazu 4 Kulturgruppen-Mindestzeilen (V13) als Kopie der neuen Art-Zeilen der Leitkultur bzw. mit «(A) andere Art».
