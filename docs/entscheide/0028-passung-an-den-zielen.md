# 0028 Passung an den Zielen beim Säen

Datum: 18.11.2026 · Entscheid des Leads auf Grundlage von Tims «Alle 14» im Chat vom 14.11.2026 (Usability-Runde,
Punkt 10) · Paket UX6, Issue #228, Plan `docs/plaene/228.md`

## Ausgangslage

Säen Schritt 2 zeigte die Zielgefässe nur als Kennung («1.1 … 3.3») ohne Titel und Anlage. Die Einstufung der Passung
erschien erst, nachdem Tim ein Ziel angetippt hatte; das beste Ziel fand er durch Ausprobieren. `docs/plaene/pakete.md`
führt im Pool den Posten «Passung Sorte → Gefässe» und «Passt hierhin» als Kern mit Planfreigabe.

## Entscheid

- Schritt 2 heisst «Wohin? · <Anlage>». Jedes Ziel zeigt das Urteil der bestehenden Passung als Wort (Empfohlen,
  Möglich, Nicht empfohlen) und die freien Löcher, ohne dass ein Ziel angetippt wurde.
- Die Ziele sind nach Urteil geordnet; das erste Ziel ist vorgewählt, wenn es «Empfohlen» ist, ein freies Loch hat und
  weder ruht noch in Prüfung ist. Ein Ziel aus der Adresse, ein Duplikat oder «Ziel später» haben Vorrang.
- Das Urteil kommt aus der bestehenden Funktion `sortenPassung()` (R3.2, P1 bis P11), je Ziel einmal aufgerufen. Mit
  mehreren gewählten Sorten gilt die schlechteste Einstufung (A). `src/domain/passung/` bleibt unverändert.
- Das Paket bleibt Fachlogik: Der Pool-Posten rechnet mit einer neuen oder geänderten Rechnung der Passung; dieses
  Paket ordnet nur das Ergebnis der bestehenden Rechnung. «Passt hierhin» in der Maske Gefäss bleibt im Pool und ist,
  falls dafür die Rechnung erweitert wird, weiterhin Kern mit Planfreigabe.

## Abweichung vom Konzept

Weicht ab von R3.1 in `konzept_v1.8.md` und `docs/spec/01_fachregeln.md` (Etappe A nur «Gefäss gewählt → Sorten
geordnet»; die Einstufung erscheint, sobald ein Zielgefäss gewählt ist) sowie von `use_cases_f4.md` UC5 und
`05_masken.md` 3.6 (Schritt 2). E-F4-2 bleibt gewahrt: Säen beginnt weiterhin mit der Sorte. Nachführung in der
nächsten Fassung des Konzepts mit Eintrag in Anhang B.2 (Posten in `docs/plaene/pakete.md`).

## Folgen

Eine Aussaat einer Sorte braucht ab der Taste «Säen» 6 statt 7 Tipper. Die gespeicherte Einstufung an der Pflanzung
schreibt `saatVorgang()` wie bisher.
