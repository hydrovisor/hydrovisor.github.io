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
| `ak.lactuca_sativa.schnitt.kulturdauer_max_d` | 56 | jas-lettuce-cut-and-come-again-2017 (A) | eigener Wert aus ak.lactuca_sativa.schnitt.kulturdauer_max_d#2: Korrektur 28.11.2026 (#277), Tims Entscheid C vom 28.11.2026 im Chat («Ja, so umsetzen», Belegungsplan-Abgleich): Standzeit 42 Tage ab Umsetzen gilt, Plantag 14 Tage nach der Saat, also 42 + 14 = 56 Tage ab Saat statt 42 (die Quelle belegt sechs Wochen ab Saat, 56 folgt aus der Zählweise ab Umsetzen nach Tims Entscheid); Quelle, Kurzzitat und Klasse der alten Zeile bleiben |
| `ak.valerianella_locusta.kopf.ernte_ab_d` | 51 | plants-valerianella-salinity-2023 (A) | eigener Wert aus ak.valerianella_locusta.kopf.ernte_ab_d#2: Korrektur 28.11.2026 (#277), Abweichung F des Belegungsplan-Abgleichs, Regel D7 Satz 1 (A): «Ernte ab» zählt bei Direktsaat ab Saat (03_import_w0.md 4.3.3); die Quelle zählt 29 Tage ab Umsetzen nach 22 Tagen Anzucht, die Anlage sät direkt (3.1, Kratky), also 29 + 22 = 51 Tage ab Saat statt 29 (gleich kulturdauer_typisch_d 51 derselben Quelle); mit Saat 7.1.2027 erste Ernte 27.2.2027 wie im Plan (26.2. bis 8.3.), unter kulturdauer_max_d 66 |

Dazu 0 Kulturgruppen-Mindestzeilen (V13) als Kopie der neuen Art-Zeilen der Leitkultur bzw. mit «(A) andere Art».

## Begründung (Lead)

Anlass: Belegungsplan-Abgleich vom 28.11.2026 (`docs/plaene/belegungsplan_abgleich_2026-11-28.md`, #275), Abweichungen C und F und die Nachkontrolle des Basilikums. Tim im Chat am 28.11.2026 auf die Empfehlungen des Lead: «Ja, so umsetzen». Jede Korrektur ist eine neue W0-Zeile (Konzept v1.11 9.3 und 9.4, Entscheid 0029): Der neue Kandidat `…#3` ist freigegeben, der alte `…#2` verworfen mit Verweis; der Seed schliesst die alte Fassung in `art_kulturform` (`gueltig_bis`). Quelle, Kurzzitat und Evidenzklasse bleiben die der alten Zeile, die Ableitung steht am Ende der `fundstelle` (Plan 277 A3).

### C: Schnittsalat, Kulturdauer max. 42 → 56 (Tims Entscheid)

Die Standzeit der Schnittsalate (Lollo Rossa, Eissalat, Eichblatt) von 42 Tagen gilt nach Tims Entscheid ab Umsetzen, wie im Belegungsplan (Konzept 14.1). Die Quelle (J. Agric. Sci. 9(1), Aquaponik, Direktsaat in schwimmende Schalen) zählt die sechs Wochen bis zum zweiten Schnitt dagegen ab Saat; sie belegt 42 Tage ab Saat, nicht 56. Der Wert 56 stützt sich auf Tims Entscheid C und den Plan in Konzept 14.1 («Standzeit 42 Tage» ab Umsetzen), Quelle und Kurzzitat bleiben als Beleg der Standzeit. Die App rechnet das Ende als Saat + `kulturdauer_max_d` (`03_import_w0.md` 4.3.3). Mit dem Plantag 14 Tage nach der Saat (Konzept 14.1) ergibt das 42 + 14 = 56 Tage ab Saat. Mit dem Umsetztag der App (Saat + `umsetzen_ab_d` 12) wären es 54; massgebend ist der Plantag aus Tims Entscheid. Beispiel: Saat 7.1.2027, Ende 4.3.2027 (vorher 18.2.2027). `schnitte_max` 2 und `ernteintervall_d` 7 bleiben; `ernte_ab_d` 23 < 56 (V11).

**Folgewirkung mit Abweichung A (Prüfer, Befund 2):** Bei mehrfacher Ernte gibt `topfPrognose()` (`src/domain/pflanzung/belegung.ts`) einen Topf für einen Nachfolger nur frei, wenn das Ende des Vorgängers spätestens am Umsetztag des Nachfolgers liegt; beim Säen setzt die App den Umsetztag heute auf Saat + `umsetzen_ab_d`. Folgesatz W4 Lollo/Eissalat (Saat 18.2.2027): Umsetztag 18.2. + 12 = 2.3., Ende W1 jetzt 7.1. + 56 = 4.3. (vorher 18.2.); die Säen-Maske zeigt die Löcher in 2.3 deshalb als belegt. Gleich bei W5 Eichblatt (Saat 4.3., Umsetztag 16.3., Ende W2 21.1. + 56 = 18.3.). Mit dem Paket A «Umsetzdatum beim Säen wählen» (#278, vor M2) wählt Tim den Plantag 4.3. bzw. 18.3., dann ist das Ende gleich dem Umsetztag und der Topf frei. Option 2 aus A (Plantage an die App angleichen) passt mit C nicht mehr. Paket A muss vor dem 18.2.2027 live sein; ohne es sät Tim W4 und W5 ohne Zieltopf.

### F: Nüsslisalat, Ernte ab 29 → 51 (Lead nach Entscheid 0018, (A))

Die Quelle (Plants 12(7) 1454, Floating, Klasse A) zählt die 29 Tage «after transplanting» nach 22 Tagen Anzucht in Steinwolle; dieselbe Quelle trägt `art.valerianella_locusta.umsetzen_ab_d` 22. Die Anlage sät Nüsslisalat direkt (3.1, Kratky; Konzept 3.3 und 14.1), und bei Direktsaat rechnet die App die einmalige Ernte als Saat + `ernte_ab_d` (`voraussichtlichesEnde()` in `src/domain/pflanzung/belegung.ts` und `ernteStand().moeglichAb` in `src/domain/phasen/ernte.ts`; der Erntekalender nimmt beide). Mit 29 zeigte der Erntekalender die Ernte drei Wochen vor dem Plan (5.2. statt 26.2. bis 8.3.).

Grundlage ist Regel D7 Satz 1 und `03_import_w0.md` 4.3.3: «Ernte ab» zählt bei Direktsaat ab Saat. Die Quelle liefert beide Teile, 22 Tage bis zum Umsetzen und 29 Tage danach, also 29 + 22 = 51 Tage ab Saat (A). Dieselbe Summe trägt seit dem 12.11.2026 die freigegebene Zeile `ak.valerianella_locusta.kopf.kulturdauer_typisch_d` 51 derselben Quelle («22 Tage bis Umsetzen plus 29 Tage bis Ernte»). Grenzen: 51 < `kulturdauer_max_d` 66 (Selen-Studie, Tage ab Saat); die Direktsaat überspringt die Anzucht im Würfel, die Keimung im Kratky-Gefäss kann einige Tage länger dauern, der Wert ist deshalb eher früh als spät. Wird Nüsslisalat doch vorgezogen und umgesetzt, rechnet die App Umsetztag + 51 und liegt rund 22 Tage zu spät; das ist in der Anlage nicht vorgesehen. Beispiel: Saat 7.1.2027, erste Ernte 27.2.2027, im Planfenster 26.2. bis 8.3.

### Nachkontrolle Basilikum Schnitt, Ernte ab 50 (bleibt)

`ak.ocimum_basilicum.schnitt.ernte_ab_d` 50 (Adv. Hort. Sci. 27(4), S. 166-172, Klasse A) war vor Regel D7 freigegeben. Der Quellenprüfer (`w0_quellenpruefer`) hat am 28.11.2026 gegen die Lesekopie vom 21.11.2026 (Artikelseite und Leseansicht des Verlags im eingebauten Browser, kein Download; die Webseite sperrt automatische Abrufe) geprüft: Urteil «bestaetigt». Die 50 Tage zählen ab Umsetzen in das NFT-System: «sample 5 (first harvest and 50 days after transplant)» und «green genotype, 50 DAT». Die Quelle nennt keinen Umsetztag in Tagen ab Saat («until the seedlings had two to three pairs of unfolded leaves»). D7 ist erfüllt; keine neue Zeile. Die Schnittform rechnet damit weiterhin Umsetztag + 50.
