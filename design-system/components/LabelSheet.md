# LabelSheet

A4-Bogen 3 × 7 Felder à 70 × 42.3 mm (Avery Zweckform 3652 oder gleichwertig) mit bis zu 21 Etiketten (`Label`), UC14 und R9.1.

- Masse als Tokens (Gruppe Druck): `label-width`, `label-height`, `sheet-columns`, `sheet-rows`, `sheet-margin-top` (0.45 mm = (297 − 7 × 42.3) / 2), `sheet-margin-left` (0 mm), `sheet-gap-x`, `sheet-gap-y` (je 0 mm). Die Seite setzt `@page { size: A4; margin: 0 }`; gedruckt wird über den Druckdialog von Android oder als PDF.
- **Startfeld** (1 bis 21): Auf einem angebrauchten Bogen bleiben die ersten Felder leer; die App setzt dafür leere `hv-sheet-cell` vor das erste Etikett.
- **Druckversatz X/Y** in mm (Einstellung, Ergebnis des Testbogens): die App setzt `--hv-versatz-x` und `--hv-versatz-y` am Bogen; jedes Feld verschiebt sich um denselben Betrag.
- **Testbogen** auf Normalpapier: Klasse `hv-sheet-test` zeichnet die Feldkanten gestrichelt, damit Tim den Ausdruck auf den Etikettenbogen legen und den Versatz ablesen kann (Ziel höchstens 1 mm).
- Props: `labels` (bis 21 Etiketten), `start` (1 bis 21), `versatz` (`{ x, y }` in mm), `test`.
- Klassen: `hv-sheet`, `hv-sheet-cell`, `hv-sheet-test`. Schwarz auf weiss in beiden Themen (`label-ink`, `label-paper`).
- Prüfung: PDF der Druckansicht hat eine Seite A4, Etikettkanten auf den Bogenmassen ±0.5 mm (R9.1).
