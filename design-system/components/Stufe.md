# Stufe

Zeigt die Einstufung der Passungs-Empfehlung (Konzept R3.2; Plan 36) als Badge mit Symbol und Wort, nie mit Farbe allein.

- Props: `einstufung` = `empfohlen` («Empfohlen», Ton `ok`), `moeglich` («Möglich», Ton `warn`), `nicht_empfohlen` («Nicht empfohlen», Ton `danger`). Die Wörter kommen aus `EINSTUFUNG_NAME` in `src/domain/passung/passung.ts` und werden nicht umformuliert.
- Gestaltung wie `StatusBadge` (Klassen `hv-badge hv-badge-<ton>`, Symbol `StatusIcon`), aber mit dem Stufenwort statt der festen Statuswörter, weil eine Einstufung keine Messwert-Bewertung ist.
- Steht nach dem Titel einer Option (`Choice` mit `stufe`) oder nach der Kennung eines Zielgefässes beim Umsetzen; das Wort ist Teil des zugänglichen Namens.
- Gründe stehen daneben als Text («nicht für Kratky»), nie im Badge.
