# Verbrauch je Rolle seit 14.11.2026 (M0, Bedingung 10)

Stand 28.11.2026, 11 Uhr · Lead · Paket RR14 (#279) · Grundlage Konzept v1.11 Kapitel 12.2 (Rollen, Modelle, Rückfallreihenfolge «Entscheid nach M0 anhand von Verbrauch und bestätigten Prüferbefunden je Rolle»), 12.7 (Pflichtfelder) und 13.5 (M0 Bedingung 10). Am 15.12. rechnet der Lead die Tabelle mit demselben Verfahren nach und trägt die Endwerte in `m0_2026-12-15.md` ein.

**Ergebnis:** Der Lead verbraucht rund zwei Drittel (67 %), die Subagents ein Drittel (33 %). Unter den Subagents liegen Testentwickler (11 %), Prüfer Fachlogik (7 %) und Planer (6 %) vorn; die vier W0-Rollen zusammen 8 %, der Routine-Prüfer 2.5 %. Drei Viertel des Lead-Verbrauchs entstehen durch das wiederholte Lesen des Kontexts langer Sitzungen (Cache-Lesen). Keine Prüferrolle hat seit 14.11. einen Befund verworfen bekommen.

## Verfahren

1. **Messung (gemessen):** Die Sitzungsprotokolle von Claude Code auf Tims Rechner (`~/.claude/projects/C--dev-hydrovisor*/`, Hauptsitzungen `*.jsonl`, Subagents `*/subagents/agent-*.jsonl` mit der Rolle aus `agent-*.meta.json`, Feld `agentType`) enthalten je Antwort die Tokenzahlen. Gezählt sind alle Antworten ab 14.11.2026 00:00 UTC, je Nachrichten-ID einmal, getrennt nach Rolle, Modell und Kontingentwoche. Die Hauptsitzung ist der Lead (auch Nebensitzungen des Lead). Das Zählskript liegt ausserhalb des Repositorys, weil es Tims lokales Profil liest; der Rechenweg steht hier vollständig.
2. **Gewichtung (A):** Gewichtete Tokens = Eingabe + 1.25 × Cache-Schreiben + 0.1 × Cache-Lesen + 5 × Ausgabe, nach dem Preisverhältnis der Claude-API innerhalb eines Modells. (A) Das Wochenkontingent zählt im selben Verhältnis. Opus 5.5 und Fable 5.2 sind getrennt ausgewiesen, weil ihr Verhältnis zueinander im Kontingent nicht bekannt ist; die Anteile in der Spalte «Anteil» setzen beide gleich (A).
3. **Umrechnung in Prozent des Wochenkontingents (A):** Das Kontingent gilt für Tims ganzes Konto. Ausser Hydrovisor fallen andere Projekte auf Tims Rechner an (gleich gezählt: 24.0 Mio. vom 14. bis 17.11., 53.4 Mio. vom 17. bis 24.11., 1.0 Mio. ab 24.11.) und Arbeit ausserhalb der lokalen Protokolle (claude.ai, Cloud-Sitzungen), die hier fehlt. Die Woche ab 24.11. (Rücksetzung dienstags 12 Uhr) stand am 28.11. um 11 Uhr bei 4 % (`get_usage`, alle Modelle) mit 12.6 Mio. lokal gezählt; daraus (A) 1 % ≈ mindestens 2.8 Mio. gewichtete Tokens (3.2 Mio. bei genau 4 %, 2.8 Mio. bei 4.49 %). Die Woche 17. bis 24.11. passt dazu (rund 70 %; 68 % laut `m0_2026-12-15.md` Bedingung 8, 72 % laut #270, beide vom 22.11.) nur mit rund 70 Mio. ausserhalb der lokalen Protokolle; das ist nicht nachprüfbar. Die Spalte «höchstens % Kontingent» teilt deshalb durch 2.8 Mio. und gibt eine Obergrenze in Prozentpunkten, summiert über alle Wochen; massgebend für den Vergleich der Rollen ist die Spalte «Anteil».
4. **Pflichtfelder:** Aus allen 29 seit 14.11. gemergten Pull Requests (`gh pr list --state merged --search "merged:>=2026-11-14"`) die Felder «Verbrauch in % des Wochenkontingents», «Modell und Denkstufe je Rolle» und «Prüferbefunde bestätigt / verworfen» (Tabelle unten). Die Felder nennen den Stand des ganzen Kontingents beim Öffnen oder den Zuwachs je Paket, nie den Anteil je Rolle; deshalb die Messung nach Schritt 1.

## Verbrauch je Rolle

| Rolle | Modell und Denkstufe (`.claude/agents/`) | Läufe | Gewichtete Tokens (Mio.) | Anteil | höchstens % Kontingent (A) | Je Lauf (Mio.) |
|---|---|---|---|---|---|---|
| Lead (Hauptsitzung) | Opus 5.5 (Sitzung), 14. bis 28.11. ausser UX1 bis UX8 | 23 Sitzungsdateien (A: je Datei eine Sitzung) | 79.1 | 49.0 % | 28 | – |
| Lead (Hauptsitzung) | Fable 5.2 (Sitzung), UX1 bis UX8 vom 14. bis 16.11. | in denselben Sitzungen | 29.0 | 18.0 % | Fable-Teilgrenze: 35 % → 63 % (#231, #238) | – |
| testentwickler | Opus 5.5 mittel | 15 | 17.3 | 10.7 % | 6.2 | 1.15 |
| pruefer_fachlogik | Opus 5.5 hoch | 18 | 10.6 | 6.5 % | 3.8 | 0.59 |
| planer | Opus 5.5 mittel | 11 | 9.0 | 5.6 % | 3.2 | 0.82 |
| w0_rechercheur | Opus 5.5 mittel | 9 | 7.1 | 4.4 % | 2.5 | 0.79 |
| pruefer | Opus 5.5 mittel | 15 | 4.0 | 2.5 % | 1.4 | 0.27 |
| w0_methodenpruefer | Opus 5.5 hoch | 5 | 2.4 | 1.5 % | 0.9 | 0.48 |
| w0_fachkritiker | Opus 5.5 hoch | 3 | 1.6 | 1.0 % | 0.6 | 0.53 |
| w0_quellenpruefer | Opus 5.5 mittel | 6 | 1.3 | 0.8 % | 0.5 | 0.22 |
| datenbank | Opus 5.5 hoch | 1 | 0.1 | 0.1 % | unter 0.1 | 0.1 |
| planer_kern | Fable 5.1 mittel | 0 | 0 | 0 % | 0 | – |
| pruefer_sicherheit | Opus 5.5 hoch | 0 | 0 | 0 % | 0 | – |
| w0_redaktor | Fable 5.1 mittel | 0 | 0 | 0 % | 0 | – |
| **Summe** | | 83 Subagent-Läufe | **161.5** | 100 % | | |

Je Kontingentwoche (gewichtete Tokens, Anteil der Subagents): 14.11. bis 17.11. 75.9 Mio. (Subagents 34 %), 17.11. bis 24.11. 74.0 Mio. (36 %), 24.11. bis 28.11. 11.6 Mio. (rund 12 %). Ausgabe-Tokens: Lead 2.0 Mio., alle Subagents zusammen 2.0 Mio.; Cache-Lesen Lead 817 Mio. (× 0.1 = 81.7 Mio., 76 % des Lead-Verbrauchs).

## Prüferbefunde je Prüferrolle

Gezählt aus dem Pflichtfeld «Prüferbefunde bestätigt / verworfen» (Wert je Pull Request in der letzten Spalte der Tabelle unten); (A) Befunde mit Schwere (muss, blockierend, sollte, hoch, mittel, gering, niedrig, kann) getrennt von Hinweisen, wo das Feld beides nennt.

| Prüferrolle | Pull Requests mit Angabe | Befunde bestätigt | Hinweise | verworfen | ohne Angabe («folgt», «siehe Prüferkommentar») |
|---|---|---|---|---|---|
| pruefer (Routine) | 7: #221, #231, #238, #244, #248, #262, #264 | 31 | 1 | 0 | #252, #257, #267, #269, #272, #274, #276; #220 ohne Feld |
| pruefer_fachlogik | 14: #222, #233 bis #237, #239, #240, #245, #253, #255, #259, #260, #270 | 51 | 32 | 0 | – |
| pruefer_sicherheit | 0 (kein Kern-Paket und keine RLS-Änderung seit 14.11.) | – | – | – | – |

## Was daraus folgt (zur Kenntnis für den Entscheid nach M0)

- Die Rückfallreihenfolge in 12.2 (zuerst Lead für Routine-Pakete auf Sonnet 5.5, dann Testentwickler, dann Denkstufen) trifft die zwei grössten Posten in dieser Reihenfolge, beim Lead allerdings nur insgesamt: Den Anteil des Lead in Routine-Paketen misst diese Auswertung nicht getrennt. Ein Wechsel ist nicht nötig, solange Bedingung 8 hält (Kontingent höchstens 80 %).
- Der grösste Hebel ohne Modellwechsel bleibt die Sitzungslänge des Lead (Cache-Lesen, Regel «Neue Sitzung ab 65 %»).
- Die Prüferrollen liefern bei kleinem Anteil (zusammen 9 %) 82 bestätigte Befunde ohne Verwerfung; «bestätigte Befunde» trennt die Rollen damit nicht. Die sieben Routine-Pull-Requests mit «folgt» nennen ihre Befunde nur im Prüferkommentar.
- Hinweis: `planer_kern` und `w0_redaktor` tragen `claude-fable-5-1`, die Lead-Sitzungen vom 14. bis 16.11. liefen auf Fable 5.2. Beide Rollen liefen seit 14.11. nicht; ein Modellwechsel in den Rollendateien gehört nach 12.2 an einen Meilenstein (M0) und braucht Tims Entscheid (Hebung auf Fable).
- Für Bedingung 8 zählt das ganze Konto: Die anderen Projekte auf Tims Rechner machten in der Woche 17. bis 24.11. rund 42 % der lokal gezählten Tokens aus.
- Nicht erfasst: Cloud-Sitzungen (#221), Arbeit auf claude.ai und Läufe vor dem 14.11. Die Zahlen der laufenden Sitzungen vom 28.11. sind bis 11 Uhr enthalten.

## Pflichtfelder der Pull Requests seit 14.11.2026

| PR | gemergt | Paket-ID und Klasse | Verbrauch in % des Wochenkontingents | Modell und Denkstufe je Rolle | Prüferbefunde (A): Befunde / Hinweise / verworfen |
|---|---|---|---|---|---|
| #220 | 14.11. | Konzept v1.7, Routine (nur Dokumente) | – | Lead-Nebensitzung Opus 5.5 | kein Feld |
| #221 | 14.11. | kamera · Routine | nicht erhoben (Umsetzung in der Cloud-Sitzung) | Lead und Prüfer nach `.claude/agents/` | 5 / 0 / 0 |
| #222 | 14.11. | Nachbesserungen Tütenfotos, N3, N4 (#219), Fachlogik ohne Migration | 70 % (alle Modelle) am 14.11.2026 | Lead Opus 5.5; Planer, Testentwickler, Prüfer Fachlogik laut `.claude/agents/` | 5 / 1 / 0 |
| #231 | 14.11. | UX1 (Usability-Runde vom 14.11.2026), Routine | 78 % (alle Modelle), Fable 35 % | Lead Fable 5.2; Prüfer laut `.claude/agents/pruefer.md` | 6 / 0 / 0 |
| #233 | 14.11. | UC15 (#232), Fachlogik, ohne Migration | 85 % (alle Modelle) beim Öffnen | Lead Opus 5.5 mittel; planer, testentwickler, pruefer_fachlogik nach `.claude/agents/` | 6 / 6 / 0 |
| #234 | 14.11. | UX2 (Usability-Runde vom 14.11.2026), Fachlogik | 83 % (alle Modelle), Fable 41 % | Lead Fable 5.2; Planer, Testentwickler, Prüfer laut `.claude/agents/` (Opus 5.5, mittel bzw. laut Datei) | 3 / 13 / 0 |
| #235 | 14.11. | UX3 (Usability-Runde vom 14.11.2026), Fachlogik | 90 % (alle Modelle), Fable 49 % | Lead Fable 5.2; Planer, Testentwickler, Prüfer laut `.claude/agents/` | 4 / 3 / 0 |
| #236 | 14.11. | UX4 (Usability-Runde vom 14.11.2026), Fachlogik | siehe Statuskommentar im Issue (#226: 94 % alle Modelle, Fable 56 %) | Lead Fable 5.2; Planer, Testentwickler, Prüfer laut `.claude/agents/` | 0 / 3 / 0 |
| #237 | 15.11. | UX5 (Usability-Runde vom 14.11.2026), Fachlogik | 97 % (alle Modelle), Fable 60 %; Start bei rund 94 % | Lead Fable 5.2; Planer, Testentwickler, Prüfer laut `.claude/agents/` | 3 / 2 / 0 |
| #238 | 15.11. | UX7 (Usability-Runde vom 14.11.2026), Routine | 98 % (alle Modelle), Fable 63 %; Start bei 97 % | Lead Fable 5.2; Prüfer laut `.claude/agents/pruefer.md` | 2 / 1 / 0 |
| #239 | 15.11. | UX8 (Usability-Runde vom 14.11.2026), Fachlogik | siehe Statuskommentar im Issue (#230: 99 bis 100 % alle Modelle); Start bei 98 % | Lead Fable 5.2; Planer, Testentwickler, Prüfer laut `.claude/agents/` | 1 / 2 / 0 |
| #240 | 18.11. | UX6 #228, Fachlogik | 5 % (alle Modelle) | Lead, Planer, Testentwickler, Prüfer Fachlogik: Opus 5.5 (Denkstufe der Rollendateien) | 2 / 2 / 0 |
| #244 | 18.11. | RB1, Routine | 9 % (alle Modelle) | Lead Opus 5.5; Prüfer laut `.claude/agents/pruefer.md` | 4 / 0 / 0 |
| #245 | 18.11. | W0 Runde 11, Fachlogik ohne Migration | rund 5 % für das Paket, Stand rund 14 % (alle Modelle) | Lead Opus 5.5; W0-Rollen, Testentwickler, Prüfer Fachlogik laut `.claude/agents/` | 3 / 0 / 0 |
| #248 | 18.11. | K19, Routine (Dokumente) | rund 2 % | Lead Opus 5.5; Prüfer laut `.claude/agents/pruefer.md` | 8 / 0 / 0 |
| #252 | 19.11. | RB2, Routine (Prüftor) | unter 1 % | Lead Opus 5.5; Prüfer laut `.claude/agents/pruefer.md` | folgt |
| #253 | 19.11. | W0 Runde 12, Fachlogik ohne Migration | rund 5 % für das Paket | Lead Opus 5.5; W0-Rollen, Testentwickler, Prüfer Fachlogik laut `.claude/agents/` | 3 / 0 / 0 |
| #255 | 21.11. | Folgeposten UC15 (#232) nach W0 Runde 12, Fachlogik ohne Migration | rund 2 % | Lead Opus 5.5; Planer, Testentwickler, Prüfer Fachlogik laut `.claude/agents/` | 3 / 0 / 0 |
| #257 | 21.11. | K20, Routine (Dokumente) | unter 1 % | Lead Opus 5.5; Prüfer laut `.claude/agents/pruefer.md` | siehe Prüferkommentar |
| #259 | 21.11. | W0 Runde 13, Fachlogik ohne Migration | rund 10 % (36 % → 46 %, alle Modelle) | Lead Opus 5.5; W0-Rollen laut `.claude/agents/w0_*.md`; Testentwickler und Prüfer laut Agentendatei | 7 / 0 / 0 |
| #260 | 21.11. | Pool P-02 (#249, Entscheid 0030), Fachlogik mit additiver Migration | rund 4 % | Lead Opus 5.5; planer, testentwickler, datenbank, pruefer_fachlogik laut `.claude/agents/` | 7 / 0 / 0 |
| #262 | 21.11. | Restpunkt 2 vom 21.11.2026 (#261), Routine | rund 1 % | Lead Opus 5.5; Prüfer `pruefer` laut `.claude/agents/` | 2 / 0 / 0 |
| #264 | 22.11. | K21 (#263), Routine (Dokumente) | rund 1 % | Lead Opus 5.5; Prüfer `pruefer` laut `.claude/agents/` | 4 / 0 / 0 |
| #267 | 22.11. | RB3, Routine (Prüftor) | unter 1 % | Lead Opus 5.5; Prüfer laut `.claude/agents/pruefer.md` | folgt |
| #269 | 22.11. | RR13, Routine (Dokumente) | unter 1 % | Lead Opus 5.5; Prüfer laut `.claude/agents/pruefer.md` | folgt |
| #270 | 22.11. | W0 Runde 14, Fachlogik ohne Migration | rund 7 % (65 % → 72 %, alle Modelle) | Lead Opus 5.5; W0-Rollen laut `.claude/agents/w0_*.md`; Testentwickler und Prüfer laut Agentendatei | 4 / 0 / 0 |
| #272 | 28.11. | RB4, Routine (Workflow) | unter 1 % | Lead Opus 5.5; Prüfer laut `.claude/agents/pruefer.md` | folgt |
| #274 | 28.11. | RR13, Routine (Referenzdatei, Dokumente) | unter 1 % | Lead Opus 5.5; Prüfer laut `.claude/agents/pruefer.md` | folgt |
| #276 | 28.11. | RR13, Routine (Dokumente) | unter 1 % | Lead Opus 5.5; Prüfer laut `.claude/agents/pruefer.md` | folgt |
