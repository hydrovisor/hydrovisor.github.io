# Sortenzeile

Eine Sorte in der Sortenliste eines Gemüses (Säen, Schritt 1; Entscheid 0023). Ein Tipp öffnet das Detail der Sorte.

- Aufbau (`hv-sortenzeile`, `button`): links das Tütenbild 52 × 52 px (`hv-sortenzeile-bild`; ohne Foto ein Kamerasymbol auf `surface-sunken` mit gestricheltem Rand `line-control`), daneben Titel (`hv-sortenzeile-titel`, fett) und Zusatzzeile (`hv-sortenzeile-zusatz`, Stil `small`, `ink-muted`), rechts ein Pfeil (`hv-sortenzeile-pfeil`) als Zeichen, dass eine Ansicht folgt.
- Höhe mindestens `size-touch-regal` (68 dp), Rand 2 px `line-control`, Radius `radius-md`, Fläche `surface-raised`; Abstand zwischen Zeilen `space-2`.
- Gewählt (`hv-sortenzeile-gewaehlt`): Fläche `brand-soft`, Rand `brand`, Zusatzzeile mit Haken und «gewählt · Schnitt». Nie nur Farbe: Wort und Haken tragen den Zustand.
- Optional eine `Stufe` nach dem Titel (Passung, Plan 36) und der Grund in der Zusatzzeile.
- Props: `titel`, `zusatz`, `gewaehlt`, `stufe`, `onClick`. Der zugängliche Name beginnt mit dem Titel.
