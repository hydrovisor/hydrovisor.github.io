# Phasenbalken

Zeitachse eines Satzes im Erntekalender (UC15, Plan 232, Entscheid 0026): Phasenabschnitte über ein Fenster von acht
Wochen ab Montag der laufenden Woche, Linie «heute», Wochenmarken und darunter die Ernte-Marken. Nur Anzeige; die Termine
rechnet die Domäne (`src/domain/phasen/kalender.ts`), der Baustein rechnet nur Prozent aus Tagesindizes.

- **Spur** (`hv-phasenbalken`, `aria-hidden`): Höhe 22 dp, Radius `radius-sm`, Grund `surface` mit 1 px Rand `line`.
  Abschnitte (`hv-phasenbalken-abschnitt hv-phasenfarbe`, `data-phase` mit dem Phasenschlüssel) stehen absolut mit `left`
  und `width` in Prozent des Fensters; Fläche aus den Tokens `phase-keimung`, `phase-anzucht`, `phase-wachstum`,
  `phase-bluete`, `phase-frucht`, 1 px Rand innen `line-control` (Keimung hebt sich sonst kaum vom Grund ab).
- **Buchstabe** K, A, W, B, F fett 11 sp in `ink` mitten im Abschnitt; Kontrast jeder Phasenfarbe gegen `ink` mindestens
  4.5:1 in beiden Themen. Der Buchstabe steht immer im DOM; Abschnitte unter 2 Tagen tragen ihn verborgen
  (`hv-visually-hidden`) und im `title`.
- **Bestätigt oder Prognose**: bestätigte Tage (vor heute in der bestätigten Phase) voll; Prognosen mit Schraffur
  `hv-phasenbalken-prognose` (`repeating-linear-gradient(135deg, …)` in `surface-raised` über der Phasenfarbe). Der
  Unterschied liegt in der Form, nie nur in der Farbe. `data-art` nennt `bestaetigt` oder `prognose`.
- **Wochenmarken** `hv-phasenbalken-woche` (gepunktete Linie `line-control`) an jedem Montag, **Linie «heute»**
  `hv-phasenbalken-heute` (2 dp `ink`) am Beginn des heutigen Tags.
- **Erntezeile** `hv-phasenbalken-ernte` (18 dp) unter der Spur: Marke `hv-phasenbalken-marke` mit Schere (Lucide
  `scissors`, `aria-hidden`) und Datum in `status-ok`, um ihren Tag zentriert, am Rand bündig (kein seitliches
  Überlaufen); ein Termin nach dem Fenster als Hinweis rechts `hv-phasenbalken-spaeter` («Ernte 27.2. →»), ein Termin
  vor dem Fenster (erntereif) links `hv-phasenbalken-frueher` («← Ernte seit 4.3.»); nur wenn es gar keinen Erntetermin
  gibt, die gestrichelte Zeile `hv-phasenbalken-offen` («Ernte: Termine noch offen», `ink-muted`).
- **Kennzeichen** `hv-badge hv-badge-kennzeichen` mit Fragezeichen (Lucide `circle-help`): «Phase unbestätigt», «Termine
  noch offen». Neutral und gestrichelt wie `hv-badge-uncertain` (`StatusBadge.md`), nie farbig.
- **Legende** `hv-phasenbalken-legende` (Liste, 12 sp, `ink-muted`): K Keimung, A Anzucht, W Wachstum, B Blüte, F Frucht,
  «voll = bestätigt», «schraffiert = Prognose», Schere «Ernte ab».
- Props `Phasenbalken`: `tage` (56), `abschnitte` (je `phase`, `buchstabe`, `start`, `laenge` in Tagen ab Fensterbeginn,
  `prognose`), `wochen` (Indizes), `heute` (Index), `marken` (je `tag`, `text`), `spaeter?`, `frueher?`, `offen?`. Dazu
  `PhasenLegende` und `KalenderKennzeichen` (`text`).
- Nachbau in `src/ui/bausteine/Phasenbalken.tsx`.

## Kalender

Maske «Erntekalender» (`#/ernte`, Regal-Dichte, Hauptseite mit Leiste) aus Phasenbalken je Satz.

- Kopf `hv-kalender-kopf`: Titel «Erntekalender», rechts der Stand «Do 18.3. · 8 Sätze» (`small`, `ink-muted`).
- Achse `hv-kalender-achse` (`aria-hidden`, 11 sp, `ink-muted`) bündig mit den Spuren: «heute» fett über der Linie,
  Montage als Ticks `hv-kalender-tick`.
- Zeile je Satz `button.hv-kalender-zeile` (`aria-pressed`, mindestens `size-touch-regal`, Fläche `surface-raised`, Rand
  `line`, Radius `radius-lg`): Kopf mit «Art Sorte» (`hv-kalender-sorte`, 17 sp fett) und Ort rechts
  (`hv-kalender-ort`), Phasenbalken, Kurzzeile (`hv-kalender-kurz`, 14 sp, `ink-muted`), Kennzeichen. Gewählt: Rand 2 px
  `brand` (Form und Farbe). Zugänglicher Name «Titel, Ort, Phase Tag x von min–max, Kurzzeile[, Kennzeichen]».
- Feld `section.hv-kalender-feld` («Termine des Satzes»), fest unten über der Leiste (`bottom: var(--hv-leiste-hoehe)`),
  Fläche `surface-raised`, Radius oben `radius-xl`, Schatten `shadow-lg`: Titel, Angaben (`hv-kalender-angaben`, `dl`
  mit Kulturform, Ort, Saat, Phase, Nächstes, Ernte) und die Knöpfe «Feld schliessen» (`secondary`) und «Pflanze öffnen»
  (`primary`) nebeneinander, bei Platzmangel umbrechend. Unter der Liste hält ein Platzhalter in Höhe des Felds die
  letzte Zeile erreichbar.
