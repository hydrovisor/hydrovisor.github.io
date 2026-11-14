# Aufklappzeile

Eine Zeile, die einen Abschnitt zeigt oder einklappt, wenn er gerade nicht im Weg stehen soll (Heute: «Einrichtung · 4 von 9 erledigt», solange Aufgaben fällig sind).

- Die ganze Zeile ist eine Taste (`hv-aufklapp-knopf`, mindestens `size-touch` 48 dp, im Regal `size-touch-regal` 68 dp) mit `aria-expanded`. Links der Titel in der Schrift der Umgebung, rechts das Verb «anzeigen» bzw. «einklappen» (`hv-aufklapp-aktion`, `brand`, unterstrichen wie in der Checklist-Zeile «Punkte 1 bis n erledigt»).
- Zugänglicher Name: Titel und Verb, «Einrichtung · 4 von 9 erledigt anzeigen». Der Titel nennt den Stand, damit die eingeklappte Zeile für sich spricht.
- Die Zeile steht in der Überschrift des Abschnitts (`h2`), der Inhalt folgt direkt darunter; eingeklappt ist er nicht im Dokument.
- Props: `titel`, `offen`, `onWechsel(offen)`. Ob der Abschnitt am Anfang offen ist, entscheidet die Maske.
- Nicht für Navigation (dafür die Navigationsliste) und nicht für einzelne Zeilen einer Checklist (dort `erledigteZusammenfassen`).
