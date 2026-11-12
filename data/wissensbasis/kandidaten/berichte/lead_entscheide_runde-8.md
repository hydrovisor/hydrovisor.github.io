# Lead-Entscheide W0 Runde 8 (Entscheid 0018, Issue #193)
Stand 12.11.2026. Erzeugt aus den Kandidatendateien (Spalte `notiz_tim` der freigegebenen Zeilen). Werkzeug: `scripts/w0/lead_entscheide_runde8.py` mit `scripts/w0/w0lib.py`, Bericht `scripts/w0/berichte.py`.

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
| `pw.beta_vulgaris_cicla.anzucht.ec` | 0.48/0.88 mS/cm | plants-mangold-durchfluss-2021 (A) | eigener Wert aus pw.beta_vulgaris_cicla.anzucht.ec#5: Runde 8, Regel E1 (A): Einzelwert 0.68 mS/cm der Sämlingslösung (Klasse A, Indoor-LED) vor #3 und #4 (frankiesgarten, Klasse C, Regel 1) |
| `pw.beta_vulgaris_cicla.anzucht.ph` | 5.5/6.5 | frankiesgarten-ec-wert-tabelle (C) | Runde 8, einziger geprüfter Kandidat in Validatorform (frankiesgarten, Zeile Mangold mit Stufe Anzucht) |
| `pw.solanum_lycopersicum.fruchtbildung_reife.dauer` | 47/59/74 | unalm-tomate-mnb-tesis-2019 (B1) | eigener Wert aus pw.solanum_lycopersicum.fruchtbildung_reife.dauer#5: Runde 8, Regel D3 (A): erste Ernte minus Fruchtansatz derselben Arbeit = 58.5 bis 59.1, gerundet 59 (wie Chili fruchtbildung_reife.dauer 58) |

Dazu 1 Kulturgruppen-Mindestzeilen (V13) als Kopie der neuen Art-Zeilen der Leitkultur bzw. mit «(A) andere Art».
