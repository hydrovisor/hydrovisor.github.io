# 0021 Deckelwahl mit Lochbild und nach Box gefiltert

Datum: 13.11.2026 · Auftrag von Tim (Chat der Lead-Sitzung beim Einrichten der Honor-Tests, Anlage IHD, mit zwei Bildschirmfotos) · Klasse Routine, keine Migration · nimmt für die Deckelwahl den Umfangsschnitt «keine geometrische Lochprüfung» (U-01, `docs/input/use_cases_f4.md` UC2) teilweise zurück

## Ausgangslage

Im Assistenten «Gefäss erfassen», Schritt 3 «Deckel oder Platte», standen nur die Namen D3, S8, D2, D6, S5, D4 und D1, unsortiert und für jede Box alle. Tim: «Ich als Anwender oder andere haben keine Ahnung, was dieser Buchstabe und diese Zahl bedeutet.» Gewünscht: Lochgrösse und Lochzahl sichtbar (als Grafik oder mindestens im Text) und nach der Box-Wahl nur die Deckel, die auf die Box passen.

Das Datenmodell kennt keine Masse eines Deckels (`deckeltyp`: Topfdurchmesser, Löcher je Reihe, Service-Öffnung) und keine Verbindung zwischen Deckel und Box.

## Entscheid

1. **Beschreibung je Deckel:** Jede Option zeigt eine kleine Vorschau des Lochbilds (Baustein `DeckelVorschau`, `design-system/components/Deckel.md` «Vorschau») und den Text «6 Löcher · 8 cm · Reihen 3, 3 · für Rako 40 × 30». Der zugängliche Name des Radios bleibt der Deckelname. Dieselbe Beschreibung steht in der Zusammenfassung (Schritt 4) und in «Gefäss ändern».
2. **Passung über die Grundfläche, ohne Migration (A):** Die sieben Typen aus Konzept 5.4 gehören zu einer Boxgrundfläche nach Konzept 5.3: D1, D2, D3 zu Rako 40 × 30; D4, D6 zu Rako 30 × 20; S8, S5 zur ovalen Wanne Leni Flori 36 (36.5 × 13.5 cm). Ein Deckel gehört zu einem Typ, wenn Lochbild und Topfgrösse gleich sind; der Name zählt nicht. Eine Box gehört zu einer Grundfläche, wenn die Form gleich ist und Länge und Breite (längere Seite als Länge) je höchstens 60 mm von den Nennmassen abweichen; bei zwei Treffern gilt die nähere, bei gleichem Abstand keine (Rückfallweg). So passen Innen- und Aussenmasse.
3. **Filter mit Rückfallweg:** Nach der Box-Wahl zeigt Schritt 3 die passenden Deckel und die Deckel mit unbekanntem Lochbild («Grösse nicht hinterlegt»). Die übrigen stehen hinter «Alle Deckel zeigen». Hat die Box keine bekannte Grundfläche oder passt kein Deckel, erscheinen alle mit Hinweis. Ein neuer Box-Tipp setzt die Deckelwahl zurück.
4. **Vorgesehener Deckel:** Der Deckel, den Konzept 5.4 für die Kennung vorsieht (D2 für 2.1), trägt «vorgesehen für 2.1», steht zuoberst und ist gewählt, wenn er zur Box passt. Ohne vorgesehenen Deckel ist der einzige passende gewählt; ein einziger Deckel, der nachweislich nicht passt, ist nicht vorgewählt.

## Verworfen

- **Neue Spalten für die Grundfläche** (`deckeltyp` oder Verbindungstabelle): genauer für eigene Deckel, aber eine Produktions-Migration mit Tims Freigabe und zusätzliche Eingaben beim Erfassen. Nachholen, falls Tim Deckel ausserhalb der sieben Typen nutzt.
- **Geometrische Prüfung aus dem Lochbild allein** (Lochzahl × Topfdurchmesser gegen Innenmasse): trennt Rako 40 × 30 nicht von 30 × 20, weil kleine Lochbilder in beide passen.

## Folgen

- `src/domain/vorlagen/deckelpassung.ts` hält Nennmasse und Zuordnung; ändert sich die Hardware (neues 3D-Modell), dort nachführen.
- Konzept 5.4, `use_cases_f4.md` UC2 und U-01 bei der nächsten Fassung nachführen (Eintrag in Anhang B.2), bis dahin gilt dieser Entscheid; offener Posten in `docs/plaene/pakete.md` Abschnitt I3.

**Nachtrag 14.11.2026:** In Konzept v1.7 nachgeführt (Erratum E12, Anhang B.2), von Tim am 14.11.2026 bestätigt.
