# W0-Lauf: Ablauf für den Koordinator

Stand 12.11.2026 · Issue #182 · Grundlage: Konzept 9 (massgebend), `docs/input/w0_vorgehen.md`, `docs/spec/03_import_w0.md`. Der Koordinator ist der Lead. Er verteilt Aufträge, führt Dateien zusammen und hält den Stand; er recherchiert nicht und bewertet keine Werte.

## 1 Rollen

| Rolle | Datei | Modell, Denkstufe | Liefert |
|---|---|---|---|
| Rechercheur (je Kulturgruppe) | `.claude/agents/w0_rechercheur.md` | Opus 5.5, mittel | Kandidatenzeilen mit Quelle, Fundstelle, Kurzzitat; Lückenliste |
| Methodenprüfer | `.claude/agents/w0_methodenpruefer.md` | Opus 5.5, hoch | Spalte `methodenpruefung` |
| Quellenprüfer | `.claude/agents/w0_quellenpruefer.md` | Opus 5.5, mittel | Spalten `quellenpruefung`, `abgerufen_am` |
| Fachkritiker (je Art) | `.claude/agents/w0_fachkritiker.md` | Opus 5.5, hoch | Spalte `konflikt_id`, Bericht mit Konflikt-, Plausibilitäts- und Lückenliste |
| Redaktor | `.claude/agents/w0_redaktor.md` | Fable 5.1, mittel | Status `vorgeschlagen`, Freigabevorschläge je Runde |
| Tim | – | – | Entscheid je Konflikt und je Klasse-D-Lücke, Prüfung nach Konzept 9.4 |

Keine Rolle prüft eigene Arbeit. Die Prüfrollen erhalten nur die Kandidatendateien (Zeilen mit Quelle und Kurzzitat) und den Link; den Bericht des Rechercheurs (`recherche.md`) und frühere Prüfberichte erhalten sie nicht.

## 2 Dateien

```
data/wissensbasis/kandidaten/
  teile/<kulturgruppe_id>/quelle.csv          Arbeitsdateien je Kulturgruppe (Rechercheur legt an,
  teile/<kulturgruppe_id>/art.csv             Prüfrollen füllen nur ihre Spalten)
  teile/<kulturgruppe_id>/profilwert.csv
  teile/<kulturgruppe_id>/saatempfehlung.csv
  teile/<kulturgruppe_id>/profilwert_offen.csv  belegte Werte, die die Form des Validators nicht erfüllen
  teile/<kulturgruppe_id>/saatempfehlung_offen.csv  belegte Saatempfehlungen ohne alle Pflichtfelder (Annahme 7)
  teile/<kulturgruppe_id>/recherche.md        Lückenliste und Suchweg des Rechercheurs (nur Koordinator)
  berichte/fachkritik_<art_id>.md             Fachkritiker
  berichte/freigabevorschlaege_runde-<n>.md   Redaktor
  quelle.csv, kulturgruppe.csv, art.csv,      zusammengeführt durch den Koordinator;
  profilwert.csv, saatempfehlung.csv          diese Dateien prüft der Validator
  profilwert_offen.csv                        zusammengeführt, vom Validator nicht gelesen
  saatempfehlung_offen.csv                    zusammengeführt, vom Validator nicht gelesen
```

Der Validator prüft im Modus `--kandidaten` jede Zeile unabhängig vom Status. Ein wörtlich belegter Wert, der seine Form nicht erfüllt (Einzelwert, Dauer ohne typischen Wert, Band schmaler als 0.2 oder breiter als 1.2, ausserhalb der Grenzen V3, V4, V7), steht deshalb in `profilwert_offen.csv` mit der Spalte `grund`. Er durchläuft dieselben Prüfungen und erscheint in der Konfliktliste; übernehmen kann ihn nur Tim über «eigener Wert».

Spalten und Reihenfolge der Arbeitsdateien sind fest (Abschnitt 6), damit das Zusammenführen ein reines Aneinanderhängen ist. `kulturgruppe.csv` legt der Koordinator aus `03_import_w0.md` 4.2.1 an (Struktur, keine Recherche). Nach `data/wissensbasis/freigegeben/` kommt nichts, bevor Tim entschieden hat.

## 3 Statusfolge

| Schritt | Wer | `status` danach |
|---|---|---|
| Zeile angelegt | Rechercheur | `entwurf` |
| `methodenpruefung = verworfen: …` | Methodenprüfer | `verworfen` |
| `quellenpruefung = bestaetigt` | Quellenprüfer (nur Zeilen mit `zugelassen`) | `geprueft` |
| `quellenpruefung = nicht_gefunden` oder `abweichend: …` | Quellenprüfer | `verworfen` |
| konkurrierende Kandidaten derselben `zeile_id` | Fachkritiker | bleibt `geprueft`, `konflikt_id` gesetzt |
| ein Kandidat je Konflikt gewählt | Redaktor | `vorgeschlagen` (die anderen bleiben `geprueft` als Alternativen) |
| genau ein geprüfter Kandidat, kein Konflikt | Koordinator (mechanisch) | `vorgeschlagen` |
| Tims Entscheid im Chat | Koordinator | `freigegeben` mit `freigegeben_am` und `notiz_tim`; die übrigen Kandidaten der `zeile_id` `verworfen` |

`quelle.csv`: Der Methodenprüfer prüft die Klasse und die Anbaumethode, der Quellenprüfer Titel und Link; der Status folgt derselben Tabelle (`verworfen` oder `geprueft`). Wird eine Quelle verworfen, verwirft dieselbe Rolle alle Datenzeilen mit dieser `quelle_id`. Das Kurzzitat liefert der Quellenprüfer (Konzept 9.3): Er bestätigt das Zitat des Rechercheurs oder ersetzt es durch den wörtlichen Satzteil der Fundstelle.

## 4 Ablauf einer Runde

1. `get_usage` vor jedem Schritt (RR2: W0 höchstens 30 % des Wochenkontingents).
2. Rechercheure parallel, je Kulturgruppe einer; Auftrag nennt Kulturgruppe, Arten mit `art_id`, Kulturformen und Sorten aus `data/stammdaten/sorten.csv`. Das Standardprofil (`ebene = standard`: `ph`, `wassertemp`, `licht_h`) weist der Koordinator genau einem Rechercheur zu. Die von Tim entschiedenen Saatmengen (R12.3: Petersilie 15 Samen je Schwamm, Tomate 1 Pflanze je Topf) legt der Koordinator als Saatempfehlung der Klasse D an (Annahme 6); Eissalat Roxette als Schnittsalat ist eine Kulturform der Sorte und deckt sich mit `se.lactuca_sativa.schnitt`.
3. Methodenprüfer je Kulturgruppe, danach Quellenprüfer je Kulturgruppe (parallel über die Gruppen, nie zwei Rollen auf denselben Dateien gleichzeitig).
4. Zusammenführen (Abschnitt 5), `npm run w0:pruefen -- --kandidaten`; Formfehler gehen an den Rechercheur derselben Gruppe zurück.
5. Fachkritiker je Art; Arten derselben Kulturgruppe nacheinander (gleiche Dateien), Gruppen parallel.
6. Redaktor über alle Konfliktlisten: Freigabevorschläge mit höchstens vier Konflikten je Runde.
7. Koordinator: mechanische Vorschläge setzen, zusammenführen, Validator, Commit, Freigabevorschläge Tim im Chat vorlegen (Auswahl: Vorschlag, Alternative 1, Alternative 2, eigener Wert), dazu die Klasse-D-Lücken und die Prüfliste nach Konzept 9.4 (100 % pH und EC der Phasen Anzucht und Wachstum, sonst Stichprobe 10 %).
8. Nach Tims Entscheid: Status nachführen; Zeilen der Ebene `kulturgruppe` als Kopie der freigegebenen Leitkultur-Zeilen anlegen (`pw.<kulturgruppe_id>.<phase>.<groesse>`, gleiche Quelle, Fundstelle, Kurzzitat und Klasse; in `keimung` ohne `ph` und `ec`; Mindestzeilen nach 03_import_w0.md 4.4.2, V13), Tim gibt sie zusammen mit den Werten der Leitkultur frei; nach `freigegeben/kulturgruppe.csv` kommen nur Gruppen, deren Mindestzeilen in derselben Runde freigegeben sind (sonst bricht V13 ab); Saatempfehlungen der Klasse D nach Tims Entscheid anlegen; freigegebene Zeilen ohne Prüfspalten nach `freigegeben/` übertragen, `npm run w0:pruefen`, Seed-Trockenlauf; scharf nur über `deploy.yml` mit `seed_scharf=true` und Tims Freigabe in `production` (Entscheid 0017).

## 5 Zusammenführen

Je Datei die Kopfzeile der ersten Arbeitsdatei, dann alle Datenzeilen. In `quelle.csv` bleibt je `kandidat_id` die erste Zeile; weichen doppelte Quellen inhaltlich ab, klärt der Koordinator mit den Rechercheuren.

```bash
k=data/wissensbasis/kandidaten
for d in art profilwert profilwert_offen saatempfehlung saatempfehlung_offen; do
  { head -n 1 "$(ls $k/teile/*/$d.csv | head -n 1)"; tail -q -n +2 $k/teile/*/$d.csv; } > $k/$d.csv
done
{ head -n 1 "$(ls $k/teile/*/quelle.csv | head -n 1)"; tail -q -n +2 $k/teile/*/quelle.csv | awk -F, '!gesehen[$1]++'; } > $k/quelle.csv
npm run w0:pruefen -- --kandidaten
```

## 6 Spalten der Arbeitsdateien (feste Reihenfolge)

| Datei | Spalten |
|---|---|
| `quelle.csv` | `kandidat_id,zeile_id,quelle_id,titel,autoren,jahr,link,klasse,anbaumethode,abgerufen_am,methodenpruefung,quellenpruefung,konflikt_id,status,freigegeben_am,notiz_tim` |
| `art.csv` | `kandidat_id,zeile_id,art_id,kulturform,feld,wert,quelle_id,fundstelle,kurzzitat,evidenzklasse,vermerk,methodenpruefung,quellenpruefung,abgerufen_am,konflikt_id,status,freigegeben_am,notiz_tim` |
| `profilwert.csv` | `kandidat_id,zeile_id,ebene,bezug,phase,groesse,wert_min,wert_typ,wert_max,text_wert,einheit_quelle,ec_basis,bezugstemperatur_c,bezugs_dli,system_quelle,umgebung_quelle,quelle_id,fundstelle,kurzzitat,evidenzklasse,vermerk,methodenpruefung,quellenpruefung,abgerufen_am,konflikt_id,status,freigegeben_am,notiz_tim` |
| `profilwert_offen.csv` | Spalten von `profilwert.csv`, dazu am Ende `grund` |
| `saatempfehlung_offen.csv` | Spalten von `saatempfehlung.csv`, dazu am Ende `grund` |
| `saatempfehlung.csv` | `kandidat_id,zeile_id,ebene,bezug,kulturform,samen_je_schwamm,obergrenze_samen,pflanzen_stehen_lassen,klasse_saatmenge,substrat_passung,quelle_id,fundstelle,kurzzitat,begruendung,methodenpruefung,quellenpruefung,abgerufen_am,konflikt_id,status,freigegeben_am,notiz_tim` |
| `kulturgruppe.csv` | `kandidat_id,zeile_id,kulturgruppe_id,name,leitkultur_art_id,ec_obergrenze_validator,konflikt_id,status,freigegeben_am,notiz_tim` |

`kandidat_id`: `<zeile_id>#<n>`, `n` ab 1 je weiterer Quelle zum selben Wert (Beispiel `pw.lactuca_sativa.wachstum.ec#2`); bei `quelle.csv` gleich `q.<quelle_id>`, dort ist `zeile_id` gleich `quelle_id` (03_import_w0.md 4.1). Felder mit Komma, Anführungszeichen oder Zeilenumbruch in `"…"` (RFC 4180), UTF-8 ohne BOM, Zeilenende LF.

## 7 Annahmen (A)

1. (A) `autoren` bleibt leer: CLAUDE.md Regel 6 verbietet Nachnamen im öffentlichen Repository; Titel, Jahr und Link oder DOI machen die Quelle eindeutig. `quelle_id` nennt Organisation oder Kurztitel, keinen Personennamen.
2. (A) `anwendbar`, `bbch` und `wechselmerkmal` hängen nicht von der Anbaumethode ab (Konzept 9.1 schliesst Nicht-Hydroponik nur für pH, EC, Phasendauer, Licht und Wassertemperatur aus). Zugelassen ist dafür die BBCH-Monografie des Julius Kühn-Instituts (Klasse `universitaet_beratung`, Evidenzklasse B1, `system_quelle = keine`) oder eine hydroponische Quelle. `anwendbar = entfaellt` für Blüte und Fruchtbildung bei Blattgemüse und Kräutern folgt aus R1.1 und trägt als Quelle dieselbe Monografie mit der Fundstelle der Art.
3. (A) Wechselmerkmale formuliert der Rechercheur als Frage nahe am Kurzzitat (höchstens 120 Zeichen); das Kurzzitat bleibt wörtlich.
4. (A) Die Arbeitsdateien unter `teile/` und die Berichte bleiben im Repository wie die Kandidatendateien (Konzept 9.2); der Validator liest sie nicht.
5. (A) `profilwert_offen.csv` ist eine Arbeitsdatei ausserhalb von 03_import_w0.md 3, weil der Validator verworfene Kandidaten nicht überspringt und Konzept 9.1 Ergänzen, Kürzen und Mitteln verbietet. Ein Wert daraus kommt nur über Tims «eigener Wert» als neue Kandidatenzeile in `profilwert.csv`. Sie trägt Quelle, Fundstelle, Kurzzitat und Klasse des offenen Kandidaten, auf den sich Tim stützt (das Kurzzitat bleibt wörtlich und belegt den Ausgangswert), Vermerk `keine` und in `notiz_tim` Tims Wert mit Grund und der `kandidat_id` des offenen Kandidaten. Stützt sich Tims Wert auf keinen Kandidaten, entsteht keine Zeile (Klasse D, Prüfauftrag).
6. (A) Saatempfehlungen, die Tim entschieden hat, ohne Quelle der Saatmengen-Skala A bis C, legt der Koordinator mit `klasse_saatmenge = D`, leeren Herkunftsfeldern (V9 nimmt Klasse D aus) und `begruendung` «entschieden von Tim, Konzept R12.3» an; Kandidaten der Rechercheure mit Quelle stehen daneben. Pflichtfelder, die der Entscheid nicht nennt (`samen_je_schwamm`, `obergrenze_samen`, `pflanzen_stehen_lassen`, `substrat_passung`), fragt der Koordinator mit den Freigabevorschlägen bei Tim ab.
7. (A) `saatempfehlung_offen.csv` (Probelauf #184): Nennt eine Quelle der Saatmengen-Skala A bis C nicht alle Pflichtfelder (`samen_je_schwamm`, `obergrenze_samen`, `pflanzen_stehen_lassen`), steht die Zeile unverändert mit `grund` in dieser Datei, wie bei `profilwert_offen.csv` (Annahme 5). Sie durchläuft dieselben Prüfungen; die fehlenden Felder ergänzt nur Tim über «eigener Wert», danach legt der Koordinator die Zeile in `saatempfehlung.csv` an.
