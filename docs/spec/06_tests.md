# 06 Tests

Stand 1.11.2026 · Auftrag 2 «Spezifikation» · Grundlage: Konzept v1.2 Kapitel 12.5 und 12.6, Testfälle in 7, 11.3, 11.4; Use Cases Fassung 4. (A) = Annahme dieser Spezifikation.

## 1 Ebenen und Prüftor

| Ebene | Werkzeug | Läuft | Inhalt |
|---|---|---|---|
| Unit | Vitest, injizierte Uhr und Zeitzone | `pr.yml` | `src/domain/` (R1 bis R12), Validator und Umrechnung W0, Router, Lochnummern, QR |
| Unit (Deno test) | `deno test` mit Fake-Sender und aufgezeichneten Antworten | `pr.yml` Job `edge` | TP1 bis TP4, TK1 bis TK3 (Prüfart [Unit], E-F4-3) |
| SQL | pgTAP gegen `supabase start` nach `db reset` | `pr.yml` Job `db` | RLS je Tabelle, Eindeutigkeit, Checks, Sichten, Seed-Zähltest, Ereignisreihenfolge |
| E2E | Playwright, Chromium, 360 × 640 dp, gegen `vite build` + `vite preview` | `pr.yml` Job `e2e` | Masken, Berührungen, Offline TO1 bis TO8, Druck-PDF, Scan-Fortsetzung |
| Mutation | StrykerJS mit Vitest, nur `rechner`, `zielbereich`, `aufgaben` | Kern-Pakete | Mindestwert 80 % |
| Eval | Skript mit echter API, von Hand | je Meilenstein | Tüten-Trefferquote (UC4-AK3) |
| Gerät | Checkliste im Pull Request | Abnahme 1 und 2 | [Gerät]-AK; am Regal mit Label `offen-regal` (höchstens 20) |

**Prüftor (`pr.yml`):** lint, typecheck, unit, mutation (Kern), db (inkl. Typen-Abgleich, E6), edge, e2e, build, AK-Abdeckung, Testdatei-Wächter, Referenzdatei-Hash, db-lock. `test.skip`, `test.only` und neue Schnappschüsse lassen es scheitern. Die Claude API wird nie echt aufgerufen.

## 2 Namensregel und AK-Abdeckung

- Jeder Test, der ein AK prüft, trägt die AK-Nummer am Anfang seines Namens: `it('UC7-AK1 Neuansatz 2.3 skaliert auf 1.2', …)`, `-- UC0-AK2 …` in pgTAP; Randfälle zusätzlich mit ihrer ID (`RF10`, `TZ5`, `TO2`, `TP1`, `TK1`). AK der Abläufe tragen das Präfix des Ablaufs: `Inbetriebnahme-AK2`, `Rundgang-AK1a`, `Loesungswechsel-AK5`, `Anzucht-AK1`, `C4-AK1`.
- `scripts/ak-abdeckung.ts` liest die AK-Nummern aus dem Issue des Pakets und die Testnamen aus den Berichten von Vitest, Deno test, pgTAP und Playwright; fehlt eine [Unit]-, [SQL]- oder [E2E]-Nummer, bricht es ab. [Gerät]-Nummern müssen im Abnahmekommentar stehen, [Eval] im Issue.
- Testdatei-Wächter: Änderungen an Testdateien aus dem Commit des Testentwicklers meldet CI im Pull Request; der Prüfer gibt sie mit Begründung frei.

## 3 Referenzdateien (Orakel)

| Datei | Inhalt | Wer | Frist | Schutz |
|---|---|---|---|---|
| `tests/golden/duengerrechner_referenz.csv` | 17 Zeilen aus Düngeplan V1.6 Abschnitt 4 und RF1 bis RF12; Spalten `zeile_id, quelle, gefaess, volumen_l, stadium, zielbereich_ec_min, zielbereich_ec_max, ec_wasser, k, teil_dosis, grow_ml, micro_ml, bloom_ml, ec_ziel, skaliert, hinweis` | Tim | 30.11. | Hash gegen Repository-Variable `REFERENZ_HASH_RECHNER`; für Agenten gesperrt; Rechner je Zeile ±0.5 ml |
| `data/eval/tueten_referenz.csv` | Soll je Feld der 22 Tüten (`sorte_zeile_id, feld, soll`; «nicht auf der Tüte» ist gültig) | Tim | 30.11. | Hash `REFERENZ_HASH_TUETEN` |

Eine Abweichung vom Orakel ist ein Fehler-Issue der Klasse Fachlogik mit Planfreigabe (Konzept 12.6).

## 4 Randfälle Düngerrechner RF1 bis RF12 ([Unit], Rahmen: Wasser 0.5, k 0.3, u_EC 0.10, Teil-Dosis aus)

| Nr. | Eingabe | Erwartung |
|---|---|---|
| RF1 | 3.1, 7 l, wachstum, Zielbereich 1.0–1.4 | D 2.333; 8.0 / 5.5 / 2.7 ml; Rundungsabweichung −0.13 ml, Anzeige «−0.01 mS/cm» |
| RF2 | 3.2, 3 l, Kratky belüftet, Direktsaat, wachstum, 1.5–1.8 | ECSoll 1.58 im inneren Band 1.575–1.725; 5.5 / 3.6 / 1.8 ml |
| RF3 | Zielbereich 0.8–1.2, ECWasser 0.95 | Ziel 1.2, «Leitungswasser zu hoch für dieses Gefäss» |
| RF4 | Verdünnen, ECZiel = ECWasser = 0.5 | «mit Wasser allein nicht erreichbar», keine Division |
| RF5 | Verdünnen, EC1 = ECZiel = 1.2 | «kein Verdünnen nötig», 0 l |
| RF6 | 6 l mit 1.5, Ziel 1.2, Betriebsvolumen 8 l | 2.6 l nötig, gekappt auf 2.0 l, erwartet 1.25 |
| RF7 | leeres Gefäss, Neuansatz | Ziel-EC und Stadium von Hand (Vorschlag wachstum) |
| RF8 | Station 4.4, k nicht stabil | 100 % der festen Dosis |
| RF9 | Kontrollmessung 1.25 bei Ziel 1.2 | Restdosis 0 mit Hinweis |
| RF10 | Ist 18.0 ml (2.0 ml/L) auf 9 l, ECIst 1.05, Ziel 1.2 | ECSoll_ist 1.10, kein k-Vorschlag, kIst 0.275; Restdosis 4.5 ml = 2.3 / 1.5 / 0.8 |
| RF11 | 7.25 ml | 7.5 ml |
| RF12 | Teil-Dosis 75 %, Beispiel 2.3 | 8.0 / 5.5 / 2.6 ml (1.79 ml/L); erwartete Teil-EC 1.04; Kontrolle 1.29 kein Hinweis, 1.30 Hinweis (E-F4-9) |

Zusätzlich [Unit]: UC7-AK1 bis AK15, UC9-AK7 (pH-Vorschlag 5.85 ml), Station 4.1 3 l → je 1.5 ml.

## 5 Zeitregeln TZ1 bis TZ9 ([Unit], injizierte Uhr, Europe/Zurich)

| Nr. | Gegeben | Erwartung |
|---|---|---|
| TZ1 | Kalibrierung 1.1., heute 30.1. (Tag 29) | keine Aufgabe, Messung nicht unsicher |
| TZ2 | heute 31.1. (Tag 30) | Aufgabe «Messgerät kalibrieren», nicht unsicher |
| TZ3 | heute 1.2. (Tag 31) | «seit 1 Tag überfällig», unsicher |
| TZ4 | nie kalibriert | «Erstkalibrierung», unsicher |
| TZ5 | Keimung min 4, typ 6, max 8, Saat 1.1. | 4.1. kein Wechsel, 5.1. möglich, 7.1. Frage, 9.1. kein Hinweis, 10.1. «prüfen» |
| TZ6 | «Noch nicht» am 7.1. | Frage am 9.1. |
| TZ7 | Anzucht min 21, typ 25, max 28, Beginn 7.1. | frühestens 28.1., Frage 1.2., Hinweis ab 5.2. |
| TZ8 | Saat rückdatiert 1.1., erfasst 12.1. | Karte «Phasen nachführen», keine Aufgabe vor 12.1. |
| TZ9 | Lösungswechsel rückdatiert 10.1., erfasst 12.1. | keine Kontrollmessung am Folgetag, Wechsel fällig 24.1. |

TZ1 bis TZ4 zusätzlich als [SQL] gegen `v_messung_unsicher` und `v_kalibrierung_faellig` (im Entwurf bereits geprüft, siehe Abschnitt 9).

## 6 Auslöser-Matrix R5.2 ([Unit], je Zeile mindestens ein Fall «fällig» und ein Fall «nicht fällig»)

| Aufgabe | fällig-Fall | nicht-fällig-Fall | «Morgen» |
|---|---|---|---|
| Gefäss prüfen | Gefäss in Prüfung | nach Schritt 3 | ja |
| Messen und nachfüllen | DWC, letzte Messung vor 2 Tagen | Füllzustand leer; Wechsel heute erledigt | nein; nach «Pegel ok» höchstens 2 × |
| Messen (Kratky) | letzte Messung vor 7 Tagen | vor 6 Tagen | höchstens 2 × |
| Nachfüllen Kratky | Messung heute mit «unter ⅓» | «über ⅓» (UC7-AK8) | nein |
| Lösung wechseln | Neuansatz + 14; Nachfüllsumme ≥ Volumen; Fruchtgemüse Stadiumwechsel | echte_blaetter → wachstum nach Einwurzeln | höchstens 3 Tage |
| Ansatz für Umsetzen oder Direktsaat | Umsetzdatum heute; Saattag | Umsetzdatum verschoben | nein |
| Kontrollmessung am Folgetag | Neuansatz gestern | rückdatiert (TZ9) | nein |
| Nachmessen | Korrektur + 15 min | – | nein |
| Kurzprüfung | Ort mit Lösung, heute | Füllzustand leer | nein |
| Belüftung prüfen | Abweichung in 3.1 → 3.1, 3.2, 3.3, 4.5 (Pumpe P3) markiert | Abweichung in 2.1 markiert nicht 3.x | nein |
| Wurzeln prüfen | letzte Prüfung + 7 | + 6 | einmal |
| Wärme prüfen | gestern über 24 °C | 24.0 °C | nein |
| Messgerät kalibrieren | TZ2, fester Termin, Sonde gereinigt | TZ1 | ja |
| pH-Kontrolle | Kalibrierung oder Kontrolle + 7 | + 6 | ja |
| Würfel feucht | Box mit Satz | Box leer | nein |
| Deckel öffnen | A3, Saat + Keimdauer min des frühesten Satzes | A1 (Lichtkeimer) | ja |
| Keimung prüfen | Saat + typ; Teilergebnis + 2 | nach Keimdauer max | ja, bis max |
| Umsetzen | geplantes Datum | – ; ab Saat + bis + 7 «überfällig» ohne «Morgen» | bis Saat + bis + 7 |
| Station auf 1. echte Blätter | ältester Satz Eintritt + 15 | innert 3 Tagen vor Wechsel → zusammengelegt | nein |
| Reservierung prüfen | Saat + bis + 7 ohne Umsetzen | umgesetzt | ja |
| Phasenwechsel steht an | typ − n bei neuem Stadium | gleiches Stadium | nein |
| Phase bestätigen | typischer Tag, gebündelt | nach «Noch nicht» bis + 2 | nur «Noch nicht» |
| Phasen nachführen | Rückdatierung (TZ8), Start Phasenlogik (UC6-AK7) | – | nein |
| Ernte möglich | Umsetzen + Ernte ab; Mehrfachernte letzte + Intervall | – | ja |
| Kultur beenden oder verlängern? | Schnitte max oder Kulturdauer max | – | ja |
| Bestäuben | 1.1 in Blüte, letzte + 2 | Salat in Wachstum | einmal |
| Reinigen, freie Löcher abdecken | nach geleert | – | ja |
| Sollwert geändert: messen | Seed ersetzt Zeile einer Art im Gefäss | andere Art | nein |
| Nach Stromausfall | Ereignis Stromausfall (DWC > 6 h: Folgetag Wurzeln und Messung) | ≤ 6 h ohne Folgetag | nein |

Zusätzlich [Unit]: UC8-AK1 bis AK6, AK10, AK12, AK13; R5.6 (vier fällige Ansätze → einer vorgezogen; beide Vortage voll → «4 Ansätze heute»); identische Listen Client und Edge Function (UC8-AK10).

## 7 Offline TO1 bis TO8 ([E2E] gegen Produktions-Build)

| Nr. | Ab | Ablauf | Erwartung |
|---|---|---|---|
| TO1 | Warteschlange | Messung offline, App schliessen, öffnen, online | genau 1 Datensatz |
| TO2 | I0 | Server speichert, Antwort verworfen, Wiederholung | genau 1 Datensatz (client_id) |
| TO3 | Warteschlange | Messung offline 10:00, Nachfüllen online 11:00, Abgleich 12:00 | Messung «veraltet» |
| TO4 | Warteschlange | Kalibrierung am Messtag überfällig, Abgleich nach Kalibrierung | bleibt «unsicher» |
| TO5 | Warteschlange | älteste wartende Messung > 24 h | Hinweis in Heute |
| TO6 | I0 | Heute online laden, offline neu laden | sichtbar mit «Stand: hh:mm» |
| TO7 | I0 | neue Version während Ablauf | Hinweis nur in Heute ohne Ablauf, nichts verloren |
| TO8 | I0 | Speichern ohne Netz | «nicht gespeichert», Eingaben bleiben |

## 8 Edge Functions TP1 bis TP4, TK1 bis TK3 ([Unit] Deno test)

| Nr. | Gegeben | Erwartung |
|---|---|---|
| TP1 | Läufe 07:00 und 07:05 am selben Tag | genau ein Sammel-Versand (UC8-AK7) |
| TP2 | Push-Antwort 410 | Abo inaktiv, Status abgemeldet (UC0-AK5) |
| TP3 | Demo-Gefäss mit fälligen Aufgaben | nicht im Titel gezählt (UC8-AK11) |
| TP4 | feste Uhr 27., 28., 29.3.2027, Gerätezeitzone ≠ Zürich | je genau ein Versand zur Ortszeit |
| TP5 (A) | Timer-Lauf jede Minute, timer_ende erreicht; danach neuer Timer im selben Ansatz | genau eine Timer-Push je (Abo, Ansatz, timer_ende); der neue Timer erhält eine eigene |
| TP7 (A) | Kurzprüfung heute nur an der Demo-Anlage | Push «Kurzprüfung offen» um 20:00 wird trotzdem gesendet |
| TP6 (A) | kein aktives Abo, `email_rueckfall` an | genau eine Sammel-Mail je Tag |
| TK1 | Antwort mit Feld «ph: 6.0» | verworfen, Feldprotokoll «leer» |
| TK2 | ungültiges JSON | Eingaben bleiben, «von Hand» |
| TK3 | Hauptmodell 529 | Ausweichmodell; alle Modelle Fehler → «von Hand» nach höchstens 30 s |
| TK1 Recherche (Plan 37) | Kandidat mit System «Erde» oder pH 4.5 | verworfen mit Grund, Lücke bleibt offen, nichts geschrieben |
| TK2 Recherche | ungültiges JSON | abgebrochen «ungueltig», kein Schreibaufruf |
| TK3 Recherche | Hauptmodell 529; alle Modelle Fehler oder Frist | Ausweichmodell; sonst abgebrochen nach höchstens 120 s, nichts geschrieben |

## 9 Datenmodell ([SQL] pgTAP)

- **Zugriff (UC0-AK2):** Schleife über `information_schema.tables` (Schema public): RLS aktiv, keine Policy mit `using (true)` ausser der benannten Ausnahme `backup_lesen` (nur `select`, nur `to backup_leser`, `04_architektur.md` Abschnitt 9); ohne Anmeldung 0 Zeilen und jedes Insert scheitert; zweites Testkonto sieht keine Zeile von Tim und kann nicht einfügen; Wissenstabellen für Tim nur lesbar; Bucket privat.
- **Eindeutigkeit:** Kennung je Anlage unter aktiven Plätzen (UC1-AK7); ein aktives Gefäss je Platz; Netztopf-Kennung unter aktiven, `topf_neu_beschriften` tauscht in einer Transaktion; Etikett-Code unveränderlich, Kürzel nach dem ersten Druck fest (UC1-AK6).
- **Checks:** Topfgrösse 50/80, Volumen < L × B × H (UC3-AK2), Standardprofil nur pH, Wassertemperatur, Lichtstunden, Validator 9.4, Überschreiben einer Wissenszeile scheitert.
- **Sichten:** `v_sollwert` (Vererbung und Klasse D), `v_vollstaendigkeit` (UC4-AK4), `v_messung_unsicher` und `v_kalibrierung_faellig` (TZ1 bis TZ4), `v_fuellzustand` (UC3-AK9), `v_gefaess_status` (UC3-AK5), `v_reservierung_aktiv` (UC6-AK9), `v_keimrate` (nur echt, nur eingehaltene Keimtemperatur), `v_klima` (Fenster 18:00 bis 21:30), Auswertungssichten nur echt im Fenster (C4-AK1, C4-AK3).
- **Ereignisreihenfolge:** dieselben Ereignisse in vertauschter Erfassungsreihenfolge ergeben denselben Zustand (8.1 Regel 2).
- **Zustände und Caches:** neues Gefäss am Platz eines entfernten startet «in Prüfung», nach Schritten 1 bis 3 «in Betrieb (Volumen offen)»; Volumenkorrektur nach Schritt 4 (neue Belegung) bleibt «in Betrieb»; neu erfasstes Gefäss ist «leer»; Messung nach der neuen Kalibrierung ist trotz «als unsicher markiert» nicht unsicher (R4.7); Demo-Messung zählt nur Demo-Kalibrierungen (8.1 Regel 7); «Sonde gereinigt» und «als unsicher markiert» der Demo wirken nicht auf echte Messungen und die echte Fälligkeit, Kalibrierung X eines anderen Geräts wirkt nicht, beide Ereignisse ohne `daten.datenart` scheitern; Gefäss ohne `gefaess_erfasst` nimmt `gueltig_von` als Anker, nach «entfernt» zählen alte Prüfschritte nicht; Fruchtgemüse-Antwort am Satz mit `ausloesende_pflanzung_id` gilt für alle Pflanzungen, eine Phasenantwort an der Pflanzung scheitert; neues Gefäss am Platz eines entfernten ist ohne `gefaess_erfasst` «leer»; eine Korrektur der Reservierung oder ein neuer Zieltopf nach «Morgen» behält das verschobene Datum; Storno des einzigen `aussaat` bzw. `umsetzdatum_geaendert` fällt auf `gilt_ab` des Satzes bzw. `umsetzen_vorgabe_am` zurück, «Morgen» am Satz verschiebt alle aktiven Reservierungen des Satzes, beendete bleiben, `umsetzen_vorgabe_am` ist unveränderlich; gebündelte Phasenantwort am Satz gilt für alle Pflanzungen; `ernte {art: ab}` setzt «geerntet»; Tausch setzt beide Töpfe um (zwei Ereignisse); direkte Änderung von `satz.saatdatum` oder `reservierung.umsetzen_geplant_am` scheitert, das Ereignis führt sie nach; `messgeraet` für Tim änderbar, nicht einfügbar.
- **Schreibweg der App (UC4):** `art_neu` übernimmt Merkmale und Kulturformen der Leitkultur mit Vermerk `leitkultur`; `sorte_neu` übernimmt die Client-`sorte_id`, `sorte_key` = `zeile_id`, zweiter Aufruf ändert nichts; zweiter Tütenwert derselben Grösse schliesst die erste Fassung; `saatempfehlung_neu` nur Klasse C (Tüte, nur Sorte) oder D, neue Fassung schliesst die alte.
- **Auswertungsfenster halboffen:** Ereignis am 31.3. 23:59 zählt, am 1.4. 00:00 nicht; Termintreue ohne den Tag 1.4.; Pflegezeit löst die Anlage über Satz, Pflanzung, Netztopf und `daten.datenart` auf (C4-AK1).
- **Demo löschen:** `datenart_loeschen('demo')` mit der Service-Rolle hinterlässt 0 Zeilen der Anlage X in allen Betriebstabellen, dazu 0 Demo-Kalibrierungen, Demo-Abos mit Versand, Pflanzvorgänge ohne Pflanzung, Ereignisse mit `daten.datenart = 'demo'`, pH-Kontrollen und Aufschübe der Demo und Scans mit Kürzel X; echte Zeilen bleiben; `datenart_loeschen('echt')` scheitert; Aufruf als `anon` oder `authenticated` scheitert, ebenso `backup_status_melden` (Rechte trotz der Default-Privileges von Supabase, Konzept 8.5, 11.6, 11.7).
- **Push und KI:** Timer-Push einmal je (Abo, Ansatz, timer_ende); `ki_aufruf` zählt jeden Aufruf; `backup_status_melden` ist der einzige Schreibweg der Backup-Rolle.
- **Abläufe:** Inbetriebnahme-AK2 (13 Gefässe «in Betrieb (Volumen offen)» oder «in Betrieb», 84 Löcher, 4 Anzuchtboxen mit Etikett-Code) gegen S1; UC8-AK7 [SQL]: Protokoll mit injizierter Uhr an 14 von 14 Tagen höchstens 5 min nach der Push-Zeit.
- **Seed:** Zähltest, Idempotenz, Versionierung, Teilfreigabe, Abbruch bei unbekannter Spalte (`03_import_w0.md` Abschnitt 10).

**Bereits geprüft am 1.11.2026** (Entwurf `02_datenmodell.sql` gegen PostgreSQL 17 mit Stubs für `auth.users`, `auth.uid()` und die Rollen, zweimal: vor und nach der Prüferrunde): Migration ohne Fehler (49 Tabellen, 30 Sichten, RLS auf allen); Vererbung Art und Standard mit Klasse D; Standardprofil mit EC abgelehnt; Überschreiben abgelehnt; TZ1 bis TZ4 gegen `v_messung_unsicher`; fremdes Konto sieht 0 Zeilen und darf nicht einfügen; Wissen für Tim nur lesbar; dazu alle Fälle unter «Zustände und Caches» ausser Tausch und Messgerät, Demo löschen, Timer-Push einmal, `backup_status_melden`. Nach Prüferdurchgang 2 ein dritter Lauf mit `docs/spec/pruefung/smoke3.sql` (selbstprüfend, je Befund C1 bis C13 und D1 bis D5 aus Durchgang 3 mindestens ein Fall, alle grün): Schreibweg der App, Auswertungsfenster, Demo löschen mit `datenart_loeschen()` und der Rückfall der Backup-Rolle mit `pg_dump --enable-row-security` (49 von 49 Tabellen). Ablauf: `bash docs/spec/pruefung/lauf.sh` (je Skript eine frische Datenbank).

## 10 Demo-Szenarien S1 bis S9 (Fixtures, Anlage X, Daten relativ zu «heute»)

Dieselben Fixtures dienen E2E und Abnahme 1 (Konzept 8.5). Ablage `tests/fixtures/demo/*.json`, geladen von `scripts/demo-laden.ts` in lokal und dev; Löschen = `datenart_loeschen('demo')` mit der Service-Rolle (Anlage mit Kaskaden, Kalibrierungen, pH-Kontrollen, Aufschübe, Abos, Ereignisse mit `daten.datenart`, Scans). Jedes Gefäss der Fixtures trägt das Ereignis `gefaess_erfasst` wie nach dem Assistenten (R9.3).

| Szenario | Inhalt | deckt |
|---|---|---|
| S1 Regal komplett | 13 Gefässe (5 Stationen) mit je einem Ereignis `gefaess_erfasst`, 4 Anzuchtboxen, W, 7 Deckel- und Plattentypen nach 3D-Modell | UC1-AK1, UC2-AK5, UC14 |
| S2 DWC normal | 2.3 mit 2 Salatsorten, Messungen 14 Tage, letzter Wechsel vor 12 Tagen | Heute, Wechsel in 2 Tagen, Rechner |
| S3 veraltet | 1.1 mit Nachfüllen nach der letzten Messung | UC7-AK10 |
| S4 Kratky belüftet | 3.1 Füllstand unter ⅓, EC über Band | UC7-AK8, Rundgang |
| S5 unsicher | Demo-Kalibrierung vor 31 Tagen | UC8-AK6, UC9-AK6 |
| S6 Konflikt | 3.1 mit Nüsslisalat, Spinat reserviert | UC5-AK2 |
| S7 leer | 2.2 ohne Pflanzung, Füllzustand leer | R2.2, R5.4, RF7 |
| S8 Keimung | Satz mit 6 Schwämmen in A3, Saat vor 5 Tagen | UC6-AK2 |
| S9 Spitzentag | 4 DWC-Wechsel, 2 Kratky-Ansätze, 14 Phasenfragen am selben Tag | R5.6, Bündelung, Push-Titel |

Die Demo-Sorten und -Sollwerte stammen aus einem kleinen Test-Wissensstand `tests/fixtures/wissen/` (vier Arten mit erfundenen, plausiblen Werten, Quelle `test-fixture`), nicht aus W0, damit E2E unabhängig von der Freigabe läuft (A).

## 11 Gerät und Eval

- [Gerät]: UC8-AK8 Push bei gesperrtem Gerät (M0 5 Tage, EK5 14 Tage), QR-Link öffnet die installierte App, Druck auf den Epson mit Einzug des Etikettenbogens (Papierfach 50 bis 80 g/m², A, E-F4-6), Wake Lock, Systemschrift 130 % (UC9-AK1), Lesbarkeit aus 80 cm (UC9-AK13), EK6 am Regal (UC9-AK9), Probe «Gerät neu» unter 20 min (UC0-AK8), Inbetriebnahme-AK1 (rund 2 + 2 Stunden).
- Regaltest A bis D (Konzept 2.3): 20 vorgegebene Werte je Variante (darunter 1.12, 22.2, Sprung 6.1 → 7.4), wechselnde Reihenfolge, Ebenen 1, 2, 4, nasse Finger und Handschuhe; gezählt werden unbemerkte Fehler, Korrekturen, Fehltipps; Wahl nach den wenigsten unbemerkten Fehlern, bei Gleichstand die schnellere (A, E-F4-6).
- [Eval] UC4-AK3: 22 Tüten gegen `tueten_referenz.csv`, mindestens 80 % richtig je Feld; M0: Name, Art, Keimart bei 3 von 3.
