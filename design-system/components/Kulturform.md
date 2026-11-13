# Kulturform

Block im Detail einer Sorte (Säen; Entscheid 0023, Konzept R1.2): zeigt die Kulturform, die gilt, und was sie bewirkt. Eine Wahl gibt es erst nach «Kulturform ändern».

- Fläche `surface-raised`, Rand `line`, Radius `radius-lg`, Innenabstand `space-3` und `space-4` (`hv-kulturform`).
- Ruhezustand: Beschriftung «Kulturform» (`hv-kulturform-label`, Stil `small`, `ink-muted`), darunter die Form fett mit Badge «Vorgabe», «Wie letztes Mal» oder «geändert» (`hv-kulturform-titel`), dann was die Form heisst («junge Blätter, die Pflanze wird einmal geerntet») und die Erntezeile (`hv-kulturform-wirkung`, Erntezeile im Stil `small`): «einmal ernten, erste Ernte ab etwa Tag 14, fertig nach etwa 16 Tagen». Fehlen Werte: «Termine noch offen».
- Nur bei mehreren erlaubten Formen ein sekundärer Knopf «Kulturform ändern» (`hv-btn-secondary hv-btn-compact`). Er öffnet eine `Choice` mit `einzeln` (untereinander), jede Option mit der Erntezeile als Zusatz; die Vorgabe trägt «· Vorgabe» im Titel. Ein Tipp wählt und schliesst die Auswahl.
- Props: `form`, `formen`, `herkunft` (`vorgabe`, `letztes_mal`, `geaendert`), `vorgabe`, `ernte(form)`, `onWahl(form)`.
