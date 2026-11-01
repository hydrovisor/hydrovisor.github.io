# 0002 Design System im Repository als Quelle

Datum 1.11.2026 · Entscheid von Tim · Quelle: `docs/spec/00_rueckfragen.md` R11 und W10, W11; Konzept v1.2 Kapitel 10

**Entscheid.** `design-system/` im Repository ist die Quelle; das claude.ai-Artefakt wird nur nachgeführt, wenn Tim es weiter braucht. `tokens.json` ist die Quelle der Tokens, `tokens.css` wird per Skript daraus erzeugt (nicht von Hand), `bundle.css` ist die CSS-Quelle der Bausteine, `components/*.md` beschreibt sie.

**Folge.** Das Paket DS-01 in `docs/plaene/pakete.md` ergänzt vor I1a die Dichte «regal», NumPad, Tile, Checklist, LabelSheet 70 × 42.3 mm und das Notfallblatt, führt `Label.md` auf Konzept 10 und `StatusBadge.md` auf R10.3 nach. Fehlt später ein Baustein, wird er zuerst in `design-system/` ergänzt, nicht in der App erfunden.
