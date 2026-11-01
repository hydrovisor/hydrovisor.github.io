# Prüfbericht Auftrag 2 (Spezifikation)

Prüfer-Subagent mit frischem Kontext, nur lesen. Massstab: das Konzept (Durchgänge 1 und 2 v1.1, Durchgang 3 v1.2, `docs/input/konzept_v1.2.md`), danach Use Cases F4, Düngeplan, W0; Entscheide in `00_rueckfragen.md` sind keine Befunde.

## Durchgang 1 (Stand 0714302): nachbessern, 1 hoch, 13 mittel, 11 gering

Alle Befunde behoben in Commit `e0cdb12` (Kurzfassung: unsicher nach Rücksetzablauf begrenzt, Kalibrierung je Datenart, Prüfstatus und Füllzustand am Ereignis `gefaess_erfasst`, Kaskaden für das Löschen der Demo-Anlage, Auswertungssichten nur echt im Fenster, Caches über Trigger, Herkunft für Düngerschema und Wissenseinträge, Tausch als zwei Ereignisse, gebündelte Phasenantwort, Abernten setzt geerntet, Timer-Push einmal je Timer, Backup-Rolle, Messgerät änderbar, `ki_aufruf`, Kleinigkeiten). Die Rechenbeispiele und die Testfall-Listen waren ohne Befund.

## Durchgang 2 (Stand e0cdb12): nachbessern, 0 hoch, 6 mittel, 7 gering

Alle Befunde behoben in Commit `7e6c7dc`; Durchgang 3 bestätigt das je Befund. C5 und C11 berühren das Konzept und stehen seit v1.2 im Text (Erratum E7).

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

## Durchgang 3 (Stand 7e6c7dc): nachbessern, 0 hoch, 2 mittel, 3 gering

C1 bis C13 alle behoben (Nachprüfung je Befund, in Docker mitgeprüft). Neue Befunde, alle behoben im Commit nach `7e6c7dc` (Zweig `auftrag-2-spezifikation`):

| ID | Schwere | Stelle | Befund | Behebung |
|---|---|---|---|---|
| D1 | mittel | `02` `datenart_loeschen()`, `backup_status_melden()` | Supabase vergibt über Default-Privileges `EXECUTE` auf neue Funktionen direkt an `anon` und `authenticated`; `revoke … from public` genügt nicht, ohne Anmeldung hätte man Demo-Daten löschen und Backup-Stände fälschen können (11.6, 11.7, 8.5). | Rechte ausdrücklich entzogen (`from public, anon, authenticated`, Backup auch `service_role`), Rollenprüfung in `datenart_loeschen`; `stub.sql` bildet die Default-Privileges nach; Test als `anon` und `authenticated`; Regel in `04` Abschnitt 11. |
| D2 | mittel | `02` `reservierung_vorbelegen()` | Neue Reservierung (Korrektur, neuer Zieltopf) nahm immer die Vorgabe; ein «Morgen» ging verloren (8.1 Regel 2, R5.3). | Vorbelegung rechnet das letzte Ereignis der Pflanzung oder des Satzes ein und überschreibt den Client-Wert; Test D2. |
| D3 | gering | `02` `v_fuellzustand` | Ohne `gefaess_erfasst` zeigte ein neues Gefäss am Platz eines entfernten «Lösung» des Vorgängers (R5.4). | Gleicher Anker wie `v_gefaess_status` (auch «entfernt», erste Belegung danach); R9.3 nachgeführt; Test D3. |
| D4 | gering | `02` `aufschub`, `messung` (`ph_kontrolle`) | Beide ohne Datenart: blieben nach «Demo löschen» stehen, eine Demo-pH-Kontrolle hätte für die echte Fälligkeit gezählt (8.1 Regel 7, 8.5). | `aufschub.datenart`, `messung.datenart` (Pflicht genau bei `ph_kontrolle`), in `datenart_loeschen` und `v_messung_unsicher`; R10.3 nachgeführt; Test D4. |
| D5 | gering | `01` R1.5, `02` `ereignis`, `v_pflanzung_zustand` | Antworten an der Pflanzung widersprachen «Ausnahme je Satz» (Konzept R1.5) und hätten die Phasen eines Satzes auseinanderlaufen lassen. | `phase_antwort` nur am Satz (Check), Sicht liest nur den Satz; R1.5 und Kommentar angepasst; Test D5. |

**Stand nach Durchgang 3:** keine offenen Befunde. Nach Auftrag (Tim, 1.11.2026) endet die Prüfung mit diesem Durchgang; die Behebungen D1 bis D5 sind in Docker geprüft, aber von keinem weiteren Prüferdurchgang gegengelesen. Bereit zur Abnahme durch Tim bis 11.11.2026.

## Testskripte

`docs/spec/pruefung/` enthält die Skripte, mit denen der Entwurf in Docker (PostgreSQL 17) geprüft wird: `stub.sql` (Stubs für `auth.users`, `auth.uid()`, die Rollen `authenticated`, `anon`, `service_role`, `backup_leser` und die Default-Privileges wie in Supabase), `rechte.sql` (Tabellenrechte der API-Rollen), `smoke.sql` (Vererbung, Checks, TZ1 bis TZ4, RLS), `smoke2.sql` (Zustände, Caches, Demo löschen, Timer-Push, Backup) und `smoke3.sql` (selbstprüfend, je Befund C1 bis C13 und D1 bis D5 mindestens ein Fall; bricht beim ersten Fehler ab). Ablauf: `bash docs/spec/pruefung/lauf.sh` im Repository (Git Bash); das Skript startet den Container `hv-pg` bei Bedarf, legt je Skript eine frische Datenbank an und prüft zum Schluss den Dump als `backup_leser` mit `pg_dump --enable-row-security`. Letzter Lauf: alle Fälle grün, 49 von 49 Tabellen im Dump.
