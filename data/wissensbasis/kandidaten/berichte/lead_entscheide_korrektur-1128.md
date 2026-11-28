# Lead-Entscheide W0-Korrekturen vom 28.11.2026 (Entscheid 0018, Issue #277)
Stand 28.11.2026. Erzeugt aus den Kandidatendateien (Spalte `notiz_tim` der freigegebenen Zeilen). Werkzeug: `scripts/w0/lead_entscheide_korrektur_1128.py` mit `scripts/w0/w0lib.py`, Bericht `scripts/w0/berichte.py`.

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
| D8 | Umsetztag: nennt die gewählte Quelle selbst einen Bereich, gelten seine Grenzen; sonst umsetzen_ab_d = Wert der Quelle am nächsten an der Anlage (Würfel unter LED, dann DWC, Floating oder NFT); umsetzen_bis_d = grösster Wert einer Quelle der Klasse A oder B1 derselben Art, nur wenn er mindestens Keimung typ plus Anzucht typ erreicht (die App zeigt «In der Station lassen bis» Saat plus umsetzen_bis_d und mahnt «Umsetzen überfällig» sieben Tage danach; ein früherer Wert endete vor dem Ende der Anzucht nach Phasen), sonst Klasse D |
| E1 | pH- oder EC-Einzelwert: Band ±0.2 um den Wert |
| E2 | Band über der Validatorgrenze: auf die Grenze gekürzt |
| E3 | EC-Basis nach der Quelle korrigiert (Methodenprüfer) |

## Neue oder geänderte freigegebene Zeilen auf Ebene Art

| zeile_id | Wert | Quelle (Klasse) | Entscheid |
|---|---|---|---|
| `ak.lactuca_sativa.schnitt.kulturdauer_max_d` | 56 | jas-lettuce-cut-and-come-again-2017 (A) | eigener Wert aus ak.lactuca_sativa.schnitt.kulturdauer_max_d#2: Korrektur 28.11.2026 (#277), Tims Entscheid C vom 28.11.2026 im Chat («Ja, so umsetzen», Belegungsplan-Abgleich): Standzeit 42 Tage ab Umsetzen gilt, Plantag 14 Tage nach der Saat, also 42 + 14 = 56 Tage ab Saat statt 42; Quelle, Kurzzitat und Klasse der alten Zeile bleiben |
| `ak.valerianella_locusta.kopf.ernte_ab_d` | 51 | plants-valerianella-salinity-2023 (A) | eigener Wert aus ak.valerianella_locusta.kopf.ernte_ab_d#2: Korrektur 28.11.2026 (#277), Abweichung F des Belegungsplan-Abgleichs, (A): Die Quelle zählt 29 Tage ab Umsetzen nach 22 Tagen Anzucht; die Anlage sät direkt (3.1, Kratky), die App rechnet dann ab Saat; D7 nimmt Direktsaat aus, deshalb neue Ableitung 29 + 22 = 51 statt 29; mit Saat 7.1.2027 erste Ernte 27.2.2027 wie im Plan (26.2. bis 8.3.), unter kulturdauer_max_d 66 |

Dazu 0 Kulturgruppen-Mindestzeilen (V13) als Kopie der neuen Art-Zeilen der Leitkultur bzw. mit «(A) andere Art».

## Begründung (Lead)

Anlass: Belegungsplan-Abgleich vom 28.11.2026 (`docs/plaene/belegungsplan_abgleich_2026-11-28.md`, #275), Abweichungen C und F und die Nachkontrolle des Basilikums. Tim im Chat am 28.11.2026 auf die Empfehlungen des Lead: «Ja, so umsetzen». Jede Korrektur ist eine neue W0-Zeile (Konzept v1.11 9.3 und 9.4, Entscheid 0029): Der neue Kandidat `…#3` ist freigegeben, der alte `…#2` verworfen mit Verweis; der Seed schliesst die alte Fassung in `art_kulturform` (`gueltig_bis`). Quelle, Kurzzitat und Evidenzklasse bleiben die der alten Zeile, die Ableitung steht am Ende der `fundstelle` (Plan 277 A3).

### C: Schnittsalat, Kulturdauer max. 42 → 56 (Tims Entscheid)

Die Standzeit der Schnittsalate (Lollo Rossa, Eissalat, Eichblatt) von 42 Tagen gilt nach Tims Entscheid ab Umsetzen, wie im Belegungsplan (Konzept 14.1). Die App rechnet das Ende als Saat + `kulturdauer_max_d` (`03_import_w0.md` 4.3.3). Mit dem Plantag 14 Tage nach der Saat (Konzept 14.1) ergibt das 42 + 14 = 56 Tage ab Saat. Mit dem Umsetztag der App (Saat + `umsetzen_ab_d` 12) wären es 54; massgebend ist der Plantag aus Tims Entscheid. Beispiel: Saat 7.1.2027, Ende 4.3.2027 (vorher 18.2.2027). `schnitte_max` 2 und `ernteintervall_d` 7 bleiben; `ernte_ab_d` 23 < 56 (V11).

### F: Nüsslisalat, Ernte ab 29 → 51 (Lead nach Entscheid 0018, (A))

Die Quelle (Plants 12(7) 1454, Floating, Klasse A) zählt die 29 Tage «after transplanting» nach 22 Tagen Anzucht in Steinwolle; dieselbe Quelle trägt `art.valerianella_locusta.umsetzen_ab_d` 22. Die Anlage sät Nüsslisalat direkt (3.1, Kratky; Konzept 3.3 und 14.1), und bei Direktsaat rechnet die App die erste Ernte als Saat + `ernte_ab_d` (`ersteErnteAb()` und `voraussichtlichesEnde()` in `src/domain/pflanzung/belegung.ts`). Mit 29 zeigte der Erntekalender die Ernte drei Wochen vor dem Plan (5.2. statt 26.2. bis 8.3.).

Regel D7 regelt nur die Gegenrichtung (Quelle zählt ab Saat, die Anlage setzt um: minus Umsetztag) und nimmt Kulturformen mit Direktsaat aus. Hier gilt die Umkehrung: Zählt die Quelle ab Umsetzen nach eigener Anzucht, während die Anlage direkt sät, addiert der Lead den Umsetztag derselben Quelle, 29 + 22 = 51 Tage ab Saat (A, Plan 277 A2). Eine eigene Regel D9 entsteht nicht, solange es der einzige Fall ist. Grenzen: 51 < `kulturdauer_max_d` 66 (Selen-Studie, Tage ab Saat); die Direktsaat überspringt die Anzucht im Würfel, die Keimung im Kratky-Gefäss kann einige Tage länger dauern, der Wert ist deshalb eher früh als spät. Wird Nüsslisalat doch vorgezogen und umgesetzt, rechnet die App Umsetztag + 51 und liegt rund 22 Tage zu spät; das ist in der Anlage nicht vorgesehen. Beispiel: Saat 7.1.2027, erste Ernte 27.2.2027, im Planfenster 26.2. bis 8.3.

### Nachkontrolle Basilikum Schnitt, Ernte ab 50 (bleibt)

`ak.ocimum_basilicum.schnitt.ernte_ab_d` 50 (Adv. Hort. Sci. 27(4), S. 166-172, Klasse A) war vor Regel D7 freigegeben. Der Quellenprüfer (`w0_quellenpruefer`) hat am 28.11.2026 gegen die Lesekopie vom 21.11.2026 (Artikelseite und Leseansicht des Verlags im eingebauten Browser, kein Download; die Webseite sperrt automatische Abrufe) geprüft: Urteil «bestaetigt». Die 50 Tage zählen ab Umsetzen in das NFT-System: «sample 5 (first harvest and 50 days after transplant)» und «green genotype, 50 DAT». Die Quelle nennt keinen Umsetztag in Tagen ab Saat («until the seedlings had two to three pairs of unfolded leaves»). D7 ist erfüllt; keine neue Zeile. Die Schnittform rechnet damit weiterhin Umsetztag + 50.
