# Prüfbericht Auftrag 2 (Spezifikation)

Prüfer-Subagent mit frischem Kontext, nur lesen. Massstab: `docs/input/konzept_v1.2.md`, danach Use Cases F4, Düngeplan, W0; Entscheide in `00_rueckfragen.md` sind keine Befunde.

## Durchgang 1 (Stand 0714302): nachbessern, 1 hoch, 13 mittel, 11 gering

Alle Befunde behoben in Commit `e0cdb12` (Kurzfassung: unsicher nach Rücksetzablauf begrenzt, Kalibrierung je Datenart, Prüfstatus und Füllzustand am Ereignis `gefaess_erfasst`, Kaskaden für das Löschen der Demo-Anlage, Auswertungssichten nur echt im Fenster, Caches über Trigger, Herkunft für Düngerschema und Wissenseinträge, Tausch als zwei Ereignisse, gebündelte Phasenantwort, Abernten setzt geerntet, Timer-Push einmal je Timer, Backup-Rolle, Messgerät änderbar, `ki_aufruf`, Kleinigkeiten). Die Rechenbeispiele und die Testfall-Listen waren ohne Befund.

## Durchgang 2 (Stand e0cdb12): nachbessern, 0 hoch, 6 mittel, 7 gering

**Offen; vor Tims Abnahme zu beheben, danach Durchgang 3.**

### Mittel

| ID | Stelle | Befund | Korrektur |
|---|---|---|---|
| C1 | `02` `v_messung_unsicher` (Zweig `als_unsicher_markiert`, `sonde_gereinigt`), `v_kalibrierung_faellig` | Kalibrierung X wird nicht an Messgerät und Datenart der Messung gebunden; «Sonde gereinigt» und «als unsicher markiert» haben keine Datenart: Demo-Ereignisse wirken auf echte Messungen (8.1 Regel 7, R4.7). | `x.messgeraet_id = m.messgeraet_id and x.datenart = m.datenart`; beide Ereignisse erhalten `daten.datenart`, beide Sichten filtern darauf. |
| C2 | `02` `v_gefaess_status`, `v_fuellzustand`; `01` R9.3, R5.4; `05` Gefäss erfassen | Die Sichten brauchen das Ereignis `gefaess_erfasst`, aber keine Datei legt fest, wer es schreibt; ohne es bleibt jedes Gefäss «in Prüfung». | In `01` R9.3 und `05` festlegen: Speichern im Assistenten schreibt im selben Vorgang `gefaess_erfasst` (Platz, `gilt_ab`); neue Belegungen wegen Volumen oder Betriebsart nicht; S1 enthält es. Optional Rückfall in der Sicht: frühestes `gueltig_von` nach dem letzten «entfernt». |
| C3 | `01` R1.5; `02` `v_pflanzung_zustand` | Fruchtgemüse-Antwort an der Pflanzung gilt nur für diese; R1.5 verlangt, dass der Satz der ersten Pflanze folgt. | Fruchtgemüse-Antwort am Satz speichern (`pflanzung_id` leer, `daten.ausloesende_pflanzung_id`); nur echte Ausnahmen an der Pflanzung. |
| C4 | `03` 4.4.2 und V13 gegen `03` Abschnitt 9 und `01` R2.2 (B13) | Mindestzeilen verlangen pH und EC auch in `keimung`; dann greift die Schnappschuss-Regel bei Direktsaat nie. | In 4.4.2 und V13 pH und EC für `keimung` ausnehmen. |
| C5 | `02` `wissen_app_schreiben` Aktion `art_neu`; `03` 4.4.2 | Neue Art ohne `kulturformen_erlaubt`, `kulturform_vorgabe`, `art_kulturform`, `umsetzen_ab_d/bis_d`, `systemeignung`; keine Aktion legt eine Saatempfehlung neu an → Sorten nie vollständig (R1.2, R1.4, R3.1, R12.3). | `art_neu` übernimmt diese Merkmale und die `art_kulturform`-Zeilen von der Leitkultur der Gruppe (Herkunft App, als Prüfauftrag angezeigt); neue Aktion `saatempfehlung_neu` (Klasse C aus Tüte oder D ohne Quelle); `03` 4.4.2 nachführen. |
| C6 | `02` `cache_aus_ereignis` (Reservierung) | (a) Storno des einzigen `umsetzdatum_geaendert` lässt den stornierten Wert stehen, weil die Vorgabe nirgends gespeichert ist; (b) Ereignisse am Satz («Morgen» auf der Satz-Aufgabe Umsetzen) wirken nicht; (c) auch beendete Reservierungen werden geändert. | Unveränderliche Spalte `umsetzen_vorgabe_am` als Rückfall; Satz-Ereignisse auf alle Pflanzungen des Satzes anwenden; nur aktive Reservierungen; Schlüssel `aussaat {saatdatum}` in A4 dokumentieren. |

### Gering

| ID | Stelle | Befund | Korrektur |
|---|---|---|---|
| C7 | `02` `push_versand.abo_id`, `pflanzvorgang` | Ohne `on delete` scheitert das Löschen der Demo-Abos; Demo-Pflanzvorgänge bleiben verwaist. | `on delete cascade` auf `abo_id`; verwaiste Pflanzvorgänge mitlöschen; Test «Demo löschen» in `06` um Kalibrierungen und Abos erweitern. |
| C8 | `04` Abschnitt 6 gegen `02` RLS | `ki_aufruf` ist für Tim nur lesbar; die Function mit Benutzer-Token kann nicht schreiben. | `04`: Function schreibt `ki_aufruf` nach der Token-Prüfung mit der Service-Rolle. |
| C9 | `04` Abschnitt 6 gegen `02` `sorte_neu`; `03` 4.6 | Client erzeugt `sorte_id` vor dem Upload, `sorte_neu` erzeugt sie selbst; `sorte_key` ≠ `zeile_id`. | `sorte_neu` übernimmt `daten.sorte_id` als `sorte_schluessel.id` und setzt `sorte_key = 'app-' || sorte_id`. |
| C10 | `02` `tuetenwert` | Zweiter Tütenwert derselben Grösse verletzt `profilwert_gueltig`. | Vorher die gültige Fassung schliessen. |
| C11 | `04` Abschnitt 9 (Risikotest Backup) | Rückfall auf die Rolle `postgres` widerspricht «Datenbankrolle nur lesend» (11.7). | Rückfall: Select-Policies `to backup_leser` mit `pg_dump --enable-row-security` und benannter Ausnahme im Prüftor-Test; oder Tims Entscheid festhalten. |
| C12 | `02` `v_pflegezeit` | Ereignisse nur mit Satz, Pflanzung oder Netztopf fallen aus der Summe. | Anlage auch über Satz, Pflanzung → Satz → Platz und `netztopf.anlage_id` auflösen. |
| C13 | `02` `v_termintreue` und `between f.von and f.bis` | `bis` = 1.4. 00:00 wird eingeschlossen. | `>= von and < bis`; bei Tagen `t.tag < kalendertag(f.bis)`. |

## Testskripte

`docs/spec/pruefung/` enthält die Skripte, mit denen der Entwurf in Docker geprüft wurde: `stub.sql` (Stubs für `auth.users`, `auth.uid()`, Rollen), `smoke.sql` (Vererbung, Checks, TZ1 bis TZ4, RLS; vorher Rechte für `authenticated` vergeben) und `smoke2.sql` (Zustände, Caches, Demo löschen, Timer-Push, Backup). Ablauf: `docker run -d --name hv-pg -e POSTGRES_PASSWORD=test postgres:17-alpine`, Dateien mit `docker cp` kopieren, `psql -U postgres -v ON_ERROR_STOP=1 -f` (in Git Bash `MSYS_NO_PATHCONV=1` setzen). Nach den Korrekturen erweitern und erneut laufen lassen.
