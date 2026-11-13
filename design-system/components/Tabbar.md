# Tabbar

Feste Leiste unten mit den Hauptzielen der App (Entscheid 0025, Paket N1). Ersetzt die Kopfknöpfe in Heute; jeder Ablauf
beginnt weiter ab Heute (Konzept 6.3).

- **Aufbau** (`nav.hv-tabbar`, `aria-label` «Hauptnavigation»): fest am unteren Rand, volle Breite, Fläche `surface-raised`,
  oben eine Linie `line`. Die Ziele stehen als gleich breite Spalten nebeneinander, bei breiten Bildschirmen auf
  `size-content` zentriert. Der Sicherheitsabstand unten (`env(safe-area-inset-bottom)`) liegt innerhalb der Leiste.
- **Ziel** (`a.hv-tabbar-ziel`): ein Link, Höhe `size-touch-regal` (68 dp) unabhängig von der Dichte der Seite, Symbol 24 dp
  (`hv-tabbar-symbol`, `aria-hidden`) über dem Wort (13 sp, `hv-tabbar-wort`). Der zugängliche Name ist nur das Wort.
  Nur Tippen, keine Wischgesten.
- **Aktives Ziel**: `aria-current="page"`, Balken 4 dp in `brand` am oberen Rand des Ziels, Symbol auf einer Pille
  `brand-soft`, Wort fett (800) und in `ink` statt `ink-muted`. Der Zustand steht nie nur in der Farbe: Balken, Pille und
  Schriftstärke unterscheiden ihn auch in Graustufen.
- **Plakette** (`hv-tabbar-zahl`, optional): kleine Zahl oben rechts am Symbol in `status-warn` auf `surface-raised`, mit
  Wort im zugänglichen Namen («Saatgut, 3 ohne Foto»). Ohne Zahl entfällt sie ganz.
- **Sichtbarkeit**: nur auf den Hauptseiten. In Abläufen (Messen, Ansatz, Säen ab Schritt 2, Neue Sorte, Gefäss erfassen)
  und auf Unterseiten fehlt die Leiste, damit Masken mit Platzbudget (Messmaske ohne Scrollen auf 360 × 640) unverändert
  bleiben; dort führt «Zurück» oder «Zu Heute» heraus. Im Druck ist sie ausgeblendet.
- **Platz für die Leiste**: Der App-Rahmen mit Leiste (`[data-leiste]` ausser `keine`) setzt `--hv-leiste-hoehe` und gibt
  der Seite unten so viel Abstand, dass nichts verdeckt bleibt. Feste Füsse einer Seite (`position: sticky; bottom: …`)
  stehen mit `bottom: var(--hv-leiste-hoehe, 0px)` über der Leiste.
- Nachbau in `src/ui/bausteine/Tabbar.tsx`: `Tabbar` mit `ziele` (je `schluessel`, `text`, `href`, `symbol`, optional
  `zahl` und `zahlText`), `aktiv` und `label`; die Symbole stehen als SVG-Pfade im Baustein (`TABBAR_SYMBOLE`: heute,
  anlagen, saeen, saatgut, mehr; Strich 2 dp, `currentColor`).

## Navigationsliste

Liste von Unterseiten auf einer Hauptseite, etwa «Mehr» (Einstellungen, Etiketten, Vorlagen, Push-Erinnerungen,
Notfallblatt, Info und Version).

- `ul.hv-navliste` mit je einem Link `a.hv-navliste-zeile`: Höhe mindestens `size-touch-regal`, Fläche `surface-raised`,
  Rand `line`, Radius `radius-lg`, Titel fett (`hv-navliste-titel`), rechts ein Pfeil `›` in `ink-muted`
  (`hv-navliste-pfeil`, `aria-hidden`). Die Titel sind Substantive wie in der Leiste; Knöpfe mit Verb bleiben auf den
  Masken selbst.
