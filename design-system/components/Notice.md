# Notice

Meldet einen Warnhinweis oder Tipp mit Titel, kurzem Text und optionaler Aktion.

- Props: `tone` = `info` (Standard), `ok`, `warn`, `danger`; `title`; `children` (ein bis zwei Sätze); `action` (ein Button `compact` `secondary`).
- Warnhinweise nennen Messwert und Sollwert: «Gemessen 6.7, Sollwert deiner Anlage 5.5–6.5.» Danach die Massnahme.
- Beim Symptom-Check gilt «Hinweis statt Diagnose»: mögliche Ursachen, keine Feststellung.
- `kompakt` (`hv-notice-kompakt`): einzeilig mit der Aktion rechts, für Regal-Masken mit festem Platzbudget (Messen, Kalibrieren). Passt die Aktion nicht neben den Titel, bricht sie in die nächste Zeile um; nichts steht über den Rand (360 dp).
- `danger` wird Screenreadern sofort vorgelesen (`role="alert"`), die anderen höflich (`role="status"`).
