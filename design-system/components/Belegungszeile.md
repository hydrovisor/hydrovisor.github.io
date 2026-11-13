# Belegungszeile

Ein Ort einer Anlage in der Übersicht «Anlagen» (Plan 216, Entscheid 0025): Gefäss mit seinen Töpfen, Anzuchtbox mit Inhalt oder Messstelle. Ein Tipp öffnet die Maske des Orts.

- Aufbau (`hv-belegung`, immer ein Link `a`): links die Kennung (`hv-belegung-kennung`, Stil `status-regal`, feste Breite 56 dp, gleich geschrieben wie auf dem Etikett ohne Kürzel), daneben der Text (`hv-belegung-text`) mit der Belegung als Wort (`hv-belegung-zeile`, fett, Umbruch nur an den Trennpunkten «·» über `hv-belegung-teil`: «3 belegt · 3 frei», «1 reserviert · 5 frei», «Anzucht dunkel · 5 von 25», «kein Gefäss»), darunter die Sorten (`hv-belegung-zusatz`, Stil `small`, `ink-muted`, eine Zeile mit Ellipse: «Lollo Rossa 3 · Rucola 2»), rechts ein Pfeil (`hv-belegung-pfeil`) als Zeichen, dass eine Maske folgt.
- **Topfpunkte** (`hv-belegung-punkte`, `aria-hidden`): je Loch ein Punkt 10 dp mit 2 dp Abstand in Lochfolge (13 Löcher passen in eine Zeile), umbrechend: belegt gefüllt (`hv-topfpunkt-belegt`, Fläche und Rand `brand`), reserviert gestrichelter Ring (`hv-topfpunkt-reserviert`, wie `hv-loch-reserviert` im Deckel), frei leerer Ring (`hv-topfpunkt-frei`, Rand `line-control`). Die Punkte unterscheiden sich in der Form, nicht nur in der Farbe; der Zustand steht ausserdem als Wort in `hv-belegung-zeile`.
- Prüfstatus als neutraler `StatusBadge` («ruht», «nicht geprüft») hinter der Belegung, nie nur Farbe.
- Höhe mindestens `size-touch-regal` (68 dp), Rand 2 px `line-control`, Radius `radius-md`, Fläche `surface-raised`, gedrückt wie `Sortenzeile` (Fläche `surface-sunken`, 1 px tiefer); Abstand zwischen Zeilen `space-2`. Volle Breite, kein waagrechtes Scrollen auf 360 dp.
- Zugänglicher Name (`aria-label`): «Kennung, Belegung[, Sorten][, Prüfstatus]», etwa «2.3, 3 belegt · 3 frei, Lollo Rossa 3» oder «1.2, 4 frei, ruht».
- Gruppen (`hv-anlagen-gruppe`): Überschrift `h4` («Ebene 3», «Anzuchtboxen», «Messstelle», Stil `label`) mit der Summe rechts (`hv-anlagen-gruppe-summe`, `small`, `ink-muted`: «3 belegt · 11 frei»), darunter die Zeilen als Liste.
- Props: `kennung`, `zeile`, `zusatz`, `punkte` (Liste aus `belegt`, `reserviert`, `frei`), `badge`, `href`.
- Nachbau in `src/ui/bausteine/Belegungszeile.tsx`.
