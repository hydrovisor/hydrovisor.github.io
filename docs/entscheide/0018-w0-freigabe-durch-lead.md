# 0018 W0-Freigabe durch den Lead, frankiesgarten.de als Praxisquelle, alle Arten

Datum: 12.11.2026 · Entschieden von Tim (im Chat der W0-Lead-Sitzung nach den Freigabevorschlägen der Runde 1) · Issue #188 · weicht ab von Konzept 9.3 und 9.4 (Freigabe und Prüfung durch Tim) und von `docs/w0/ablauf.md` Abschnitt 4 Schritte 7 und 8 · Bezug #184, PR #187, RR16, Entscheid 0017

## Ausgangslage

Der W0-Probelauf (#184) hat für acht Arten 61 Konflikte und 58 Pflichtlücken auf Ebene Art ergeben (vor allem `dauer`); keine Art war ladbar. Nach Konzept 9.3 und 9.4 entscheidet Tim jeden Konflikt und jede Klasse-D-Lücke und prüft die Werte gegen die Quellen. In diesem Takt wäre die Wissensbasis bis zur Teilfreigabe am 15.12. nicht fertig.

## Entscheid

Tim (Chat, 12.11.2026, wörtlich): «Das Ziel ist, diese Datenbank entsprechend nun zu erstellen und du setzt alle Schritte eigenständig um und grundsätzlich sollst du auch entscheiden mit einer Fachlogik, wie das Ganze umgesetzt wird. Zusätzlich haben wir als Best Practice Praxisquellen frankisgarden.de. Diese sind nicht wissenschaftlich, aber wir haben diese als Fachquelle aufgenommen. Setze nun die weiteren Schritte um, achte zwingend auf das Kontextfenster, schließe alle Chats, die nicht mehr aktuell sind und fahre mit einem neuen Chat fort, setze das Ganze um. Zusätzlich können wir in Betracht ziehen, nicht nur diese 8, sondern alle entsprechenden Saatgutmengen einzupflegen, damit ich bei der Anpflanzung variieren kann.»

1. **Freigabe durch den Lead.** Der Lead entscheidet jeden Konflikt nach der Entscheidungsregel aus Konzept 9.3 (Klasse, dann Umgebung und System, dann Schnittmenge); weicht er davon ab, kennzeichnet er es mit (A) und Grund. Lücken und Kandidaten, die nur in `profilwert_offen.csv` oder `saatempfehlung_offen.csv` stehen, entscheidet er wie Tims «eigener Wert» (`docs/w0/ablauf.md` Annahmen 5 und 7): neue Kandidatenzeile mit Quelle, Fundstelle und Kurzzitat des offenen Kandidaten, Vermerk `keine`, Wert und Grund in `notiz_tim`. Ohne belegten Kandidaten entsteht keine Zeile (Klasse D, Prüfauftrag), ausser bei der Saatempfehlung (Punkt 4).
2. **Prüfung nach Konzept 9.4.** Statt Tim prüft ein frischer Prüfer (Rolle `pruefer`, kein Teil des W0-Laufs) die Prüfliste gegen die Quellen: 100 % pH und EC der Phasen Anzucht und Wachstum, sonst eine Stichprobe von 10 %. Ein Befund geht an den Lead zurück; erst ohne offenen Befund kommt die Zeile nach `freigegeben/`.
3. **Freigabevermerk.** `freigegeben_am` ist das Datum des Lead-Entscheids; `notiz_tim` beginnt mit «Lead nach Entscheid 0018:» und nennt den Grund (Regel 9.3 mit Nummer oder (A)).
4. **Saatempfehlung Klasse D.** Findet die Recherche für eine Kulturform keine Quelle der Saatmengen-Skala A bis C, legt der Lead die Zeile mit `klasse_saatmenge = D`, leeren Herkunftsfeldern und einer `begruendung` mit Fachlogik an («Lead nach Entscheid 0018, (A): …»), wie bei Tims Entscheiden nach R12.3 (Annahme 6). Kandidaten A bis C gehen vor.
5. **frankiesgarten.de** (Tims Schreibweise «frankisgarden.de»; die Domain frankisgarden.de existiert nicht, gemeint ist die deutsche Hydroponik-Praxisseite frankiesgarten.de mit Anleitungen je Kultur unter `/anleitungen/gemueseanbau/`) ist zugelassene Hydroponik-Praxisquelle, Klasse C (Konzept 9.1: Praxisquelle ohne Versuch, Methode ausdrücklich hydroponisch), Quellenklasse `praxis`, für alle Grössen einschliesslich `dauer` und Saatmenge (Saatmengen-Skala B bei gleicher Substratklasse, sonst C). In Konflikten gilt Regel 1: A und B vor C. Die Methodenprüfung prüft je Seite, ob sie die Methode ausdrücklich hydroponisch beschreibt.
6. **Umfang.** Alle 11 Arten aus `data/stammdaten/sorten.csv` (22 Sorten): die acht des Probelaufs, dazu Spinat, Mangold und Randen (Kulturgruppe `fuchsschwanz`, Leitkultur Spinat, 03_import_w0.md 4.2.1); Saatempfehlungen je Art und jeder erlaubten Kulturform, damit Tim bei der Anpflanzung variieren kann.

## Kulturformen je Art (Lead, A)

Nach R1.2 (Kulturtyp der Sorte schränkt ein: Frucht → `dauerkultur_frucht`; Blatt → `babyleaf`, `schnitt`, `kopf`, `dauerkultur_blatt`; `keimling` nicht in der ersten Runde) und der üblichen Nutzung im Indoor-Regal. Die Zeilen `kulturformen_erlaubt` und `kulturform_vorgabe` brauchen in `art.csv` eine Quelle, die die Nutzung belegt; fehlt sie für eine Form, entfällt die Form.

| Art | `kulturformen_erlaubt` | `kulturform_vorgabe` |
|---|---|---|
| Tomate, Chili | `dauerkultur_frucht` | `dauerkultur_frucht` |
| Salat | `kopf;schnitt;babyleaf` | `schnitt` |
| Nüsslisalat | `kopf;babyleaf` | `kopf` |
| Pak Choi | `kopf;babyleaf` | `kopf` |
| Basilikum | `dauerkultur_blatt;schnitt` | `dauerkultur_blatt` |
| Petersilie, Schnittlauch | `dauerkultur_blatt;schnitt` | `dauerkultur_blatt` |
| Spinat | `babyleaf;kopf;schnitt` | `babyleaf` |
| Mangold | `schnitt;babyleaf` | `schnitt` |
| Randen (Blattnutzung, W6) | `babyleaf;schnitt` | `babyleaf` |

## Entscheide des Lead zu Runde 1

- K-salat-08 → `#1` 5.6–6.0 (Regel 3, Schnittmenge).
- K-pakchoi-08 → `#3` 5.5–6.5 (Regel 1, Klasse A).
- K-basilikum-03 → `#1` 5.5–6.0 (okstate, reine Hydroponik), (A) gegen den Vorschlag `#3`: der DWC-Wert stammt aus Aquaponik, «gleiches System» (Regel 2) trifft fachlich nicht zu.
- K-basilikum-04 → `#1` 1.0–1.6 mS/cm (Regel 1).
- Übrige Konflikte mit Vorschlag des Redaktors: Vorschlag übernehmen, sofern die Gegenprobe (03_import_w0.md 7) nicht um mehr als 0.4 mS/cm verfehlt wird; sonst Fachlogik mit (A).
- `anwendbar = entfaellt` für Blüte und Fruchtbildung bei Blattgemüse und Kräutern gilt als Regelwert nach R1.1 (`docs/w0/ablauf.md` Annahme 2): Quelle BBCH-Monografie mit der Fundstelle der Art; verworfene Zeilen werden neu angelegt, nicht überstimmt.
- Saatmengen Klasse D: Petersilie 15 / Obergrenze 15 / 15 Pflanzen stehen lassen (Büschel, R12.3); Tomate und Chili 1 Samen / Obergrenze 3 / 1 Pflanze (die App erhöht die Samenzahl nach Keimfähigkeit bis zur Obergrenze, R12.3). Kandidaten A bis C gehen vor.

## Folgen

- `docs/w0/ablauf.md` Abschnitte 1, 3 und 4 nennen den Lead statt Tim als Entscheider und den Prüfer nach Punkt 2.
- Tims einziger Handgriff bleibt die Freigabe in `production` für den scharfen Seed (`gh workflow run deploy.yml --ref main -f seed_scharf=true`, Entscheid 0017).
- Tim kann jede Zeile später in der App oder über eine neue Fassung der Datei ändern; der Seed versioniert je `zeile_id` (03_import_w0.md 8.3).

## Verworfen

- Freigabe weiter durch Tim je Runde mit höchstens vier Konflikten: bei rund 60 Konflikten und dem Hauptlauf mit drei weiteren Arten nicht bis zum 15.12. zu schaffen.
- frankiesgarten.de als Klasse B: die Seiten beschreiben Praxis ohne Versuch (Konzept 9.1).
