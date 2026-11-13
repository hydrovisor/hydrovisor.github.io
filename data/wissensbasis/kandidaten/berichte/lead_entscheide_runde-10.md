# Lead-Entscheide W0 Runde 10 (Entscheid 0018, Issue #202)
Stand 13.11.2026. Erzeugt aus den Kandidatendateien (Spalte `notiz_tim` der freigegebenen Zeilen). Werkzeug: `scripts/w0/lead_entscheide_runde10.py` mit `scripts/w0/w0lib.py`, Bericht `scripts/w0/berichte.py`.

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
| `pw.allium_schoenoprasum.anzucht.dauer` | 18/21/34 | plantvillage-psu-schnittlauch (C) | eigener Wert aus pw.allium_schoenoprasum.anzucht.dauer#8: Runde 10 (Entscheid 0022), Regel D2 (A): typ 21 aus #8 (umsetzbereit mit etwa 4 Wochen, Auflaufen nach etwa 7 Tagen: 28 minus 7); min 18 und max 34 aus #4 (4 bis 6 Wochen ab Saat minus Keimung 8 bis 10 Tage derselben Quelle); #7 (Ball-Plug-Chart, 28 bis 42 Tage bis zum verkaufsfertigen Jungpflanzenballen) und #5 (Winteranzucht in Erdpresstöpfen) länger, nicht gewählt |
| `pw.allium_schoenoprasum.keimung.dauer` | 7/10/14 | johnnys-schnittlauch-key-growing (C) | eigener Wert aus pw.allium_schoenoprasum.keimung.dauer#8: Runde 10 (Entscheid 0022), Regel D1 (A): 7 bis 14 Tage bei 18 bis 21 °C (Raumtemperatur der Anlage); bestätigt durch #10 (7 bis 14), #4 (8 bis 10, Hydroponik-Seite) und #11 (etwa 7); #6 und #9 (bis 25 bzw. 21 Tage) gelten für kühlere Aussaat |
| `pw.solanum_lycopersicum.bluete.dauer` | 24/30/38 | uptc-tomate-cherry-fenologia-2018 (C) | eigener Wert aus pw.solanum_lycopersicum.bluete.dauer#3: Runde 10 (Entscheid 0022), Regel D3 (A): «De flor a fruto de tamaño típico» 30 d (BBCH 601 bei 44 ddt bis 701 bei 74 ddt), Bezug genau das Wechselmerkmal BBCH 71; drei Cherry-Genotypen wie Tims Sorten; einziger geprüfter Kandidat |
| `pw.valerianella_locusta.anzucht.dauer` | 9/11/14 | plants-valerianella-salinity-2023 (C) | eigener Wert aus pw.valerianella_locusta.anzucht.dauer#1: Runde 10 (Entscheid 0022), Regel D3/D5 (A): umgesetzt 22 Tage nach der Saat (Floating, Klasse A) minus Keimdauer typ 11 (keimung.dauer, Klasse C) = 11 Tage; Klasse C, weil die Aufteilung auf einer Anbauquelle beruht |
| `pw.valerianella_locusta.keimung.dauer` | 8/11/14 | prospecierara-pflanzenanzucht-2022 (C) | eigener Wert aus pw.valerianella_locusta.keimung.dauer#3: Runde 10 (Entscheid 0022), Regel D1 (A): 8 bis 14 Tage bei 15 bis 18 °C (ProSpecieRara, Schweiz); übereinstimmend #2 und #6 (je 8 bis 14), #1 10 bis 14; #5 und #7 (bis 21 bzw. 28, Keimtest bis Endauszählung) nicht gewählt |
| `pw.valerianella_locusta.keimung.keimart` | dunkel | gartenjournal-feldsalat-2026 (C) | Runde 10 (Entscheid 0022), einziger geprüfter Kandidat («da Feldsalat ein Dunkelkeimer ist»), Klasse C nach Entscheid 0022 |

Dazu 1 Kulturgruppen-Mindestzeilen (V13) als Kopie der neuen Art-Zeilen der Leitkultur bzw. mit «(A) andere Art».
