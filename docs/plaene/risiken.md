# Risikoregister

Stand 1.11.2026 · Grundlage Konzept v1.2 Kapitel 13.6 · Durchsicht wöchentlich 10 Minuten (Montag, mit dem Statuskommentar der Woche); jede Durchsicht ergänzt unten eine Zeile im Protokoll. Status: ruhend (Auslöser nicht erreicht), beobachten, eingetreten.

| Nr. | Risiko | Auslöser | Massnahme | Status |
|---|---|---|---|---|
| RR1 | Subagents oder Agent Teams instabil | mehr als 2 abgebrochene Sitzungen pro Woche oder im Mittel mehr als 2 Nachbesserungsrunden | Rollen vereinfachen, Pakete kleiner schneiden | ruhend |
| RR2 | Kontingent erschöpft | mehr als 70 % des Wochenkontingents bis Mittwoch | Rückfallreihenfolge E-16 (Lead Routine auf Sonnet 5.5, dann Testentwickler, dann Denkstufen); W0 höchstens 30 % des Kontingents; Kern-Pakete nur zu Fensterbeginn mit mindestens 50 % frei | ruhend |
| RR3 | Modellwechsel oder Abkündigung | keiner | Modell-IDs nur in `.claude/agents/`, Wechsel nur an Meilensteinen; API-Parameter vor dem Einsatz an der Dokumentation geprüft (I0-09) | ruhend |
| RR4 | Tim fällt aus (besonders 1. bis 15.1.) | keiner | Papierprozess, Nacherfassung, Vertretungsblatt (I1b-07), Aussaat entkoppelt | ruhend |
| RR5 | Hardware verspätet oder defekt | Hardware-Vollständigkeit nicht bis 15.11. geprüft oder Wareneingang nicht bis 30.11. | Ersatzbestellung sofort, Lieferung bis spätestens 1.1.; sonst Minimal-Regal mit Ebene 4 und 3.1 | beobachten (Termine 15.11., 30.11.) |
| RR6 | Keimversagen oder Pflanzenausfall | Keimrate unter 0.5 in einem Satz | Reservesorte, 20 % Saatreserve, Folgesatz nach 2 Wochen, Keimtemperatur prüfen | ruhend |
| RR7 | Fehler im KI-Code bleiben unentdeckt | keiner | Referenzdatei, AK-Abdeckung, Mutationstest, Prüfer mit Plan-Code-Abgleich | ruhend |
| RR8 | Kosten ohne Dach | Monatsrechnung über dem Dach | Kostendach: Supabase Pro mit `hydrovisor` und `hydrovisor-dev` rund 35 USD pro Monat (Entscheid W4); Claude API im Arbeitsbereich «hydrovisor» der Claude Console mit Ausgabenlimit 15 USD pro Monat (Kosten je Tüte unter 0.05 USD, höchstens 30 Aufrufe pro Tag); Resend Gratisstufe; Cloudflare Pages und GitHub Pages kostenlos; Claude-Abo nach Tims Vertrag | beobachten |
| RR9 | Referent verlangt Änderungen | Rückmeldung nach der Freigabe | am 31.10. als Freigabe ohne Änderungen eingetreten (Z3, E5); Umfang in der ersten Woche anpassen | eingetreten, erledigt |
| RR10 | Testbetrieb liefert zu wenig Daten | erste Aussaat nach 20.1. oder M1 nach 31.1. | Kapitel 6 der Arbeit auf Messgüte, Rechnergüte, Termintreue, EK6 umstellen (14.4) | ruhend |
| RR11 | Fehldosis, Kalibrierfehler, falscher Sollwert | Endmessung über ECSoll_ist + 0.3; Frischwasser ausserhalb 0.2 bis 1.0; Validator-Konflikt | harte Grenzen R4.4, Gegenprobe, Validator; Rücksetzablauf R4.7 | ruhend |
| RR12 | Strom-, Pumpen-, Lüfterausfall; Hitze | Melder, Kurzprüfung, Wassertemperatur | Checkliste «Nach Stromausfall», Wärmesperre, «Wärme prüfen» | ruhend |
| RR13 | Z3 verdichtet zu stark (Tims Stunden, Kontingent, Planfreigaben während der Reise) | Prüfpunkt 30.11. verfehlt; später Ist-Zeit über 120 % in zwei Wochen in Folge | Rückfall auf Z2 am 30.11.; danach Streichreihenfolge (13.5); Abnahmen an zwei festen Tagen je Woche bündeln | beobachten (Prüfpunkt 30.11.) |
| RR14 | Testdaten setzen Fälligkeiten zurück | pH-Kontrollen der Schreibprobe (`datenart = test`, echtes Messgerät) zählen in einer Fälligkeit | Fälligkeit R5.2 «Kalibrierung oder Kontrolle + 7» und jede Regel auf `messung` filtern `datenart = echt` (8.1 Regel 7, Kommentar der Tabelle `messung`); Testfall im I1b-Plan (Prüferbefund I0-04, Sicherheit 4) | beobachten (I1b) |

## Protokoll der Durchsichten

| Datum | Änderung |
|---|---|
| 1.11.2026 | Register aus Konzept 13.6 angelegt; Kostendach RR8 nach Entscheid W4 |
| 1.11.2026 | RR8: Ausgabenlimit 15 USD pro Monat im Arbeitsbereich «hydrovisor» (von Tim eingerichtet) |
