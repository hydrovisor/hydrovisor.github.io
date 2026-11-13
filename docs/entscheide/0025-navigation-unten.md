# 0025 Navigation unten und Saatgut-Manager

Datum: 13.11.2026 · Entscheid von Tim im Chat nach dem Vorschlag `docs/plaene/vorschlag-navigation.md` (Zweig
`vorschlag-navigation`) und dem klickbaren Mockup <https://claude.ai/artifact/E8p4gav7Ed3CAmDF5sN8i5> · Pakete N1 (Leiste
unten, Routine, Issue #212) und N2 (Saatgut-Manager, Fachlogik), N3 und N4 später

## Ausgangslage

Heute zeigte oben vier grosse Knöpfe («Anlage öffnen», «Säen», «Info öffnen», «Einstellungen öffnen») und darunter viel
Text. Heute war zugleich Startseite und Menü; mit weiteren Anlagen und Masken wird die Kopfzeile länger. Tim wünschte eine
feste Leiste unten wie in üblichen Apps mit Anlagen (Indoor und Outdoor), Einstellungen, Säen und einem eigenen
Saatgut-Manager.

## Tims Wortlaut (Chat, 13.11.2026)

«Du kannst die Schritte in eins und in zwei umsetzen. Wichtig ist mir, ich will, dass du diese Schritte komplett
eigenständig umsetzt. Ich gebe dir grundsätzlich alle Berechtigungen dafür und ich möchte nicht dauernd gefragt werden.
Setze dies mit dem Projektteam eigenständig um und deploye im Anschluss. Oder veröffentlichen, sodass ich in der
Live-App dann die entsprechenden Fotos des Saatguts einfügen kann. […] Ansonsten arbeitest du weiter die ganze Nacht
durch bis morgen die kompletten entsprechenden Pakete im entsprechenden App veröffentlicht sind. Ich möchte auch nicht
aufwendige Tests und so per Handy durchführen. Falls dann etwas nicht mir entsprechen würde, werden wir Änderungen
eingeben.»

Mit «eins und zwei» sind die Pakete N1 und N2 des Vorschlags gemeint; die fünf Ziele und «Kein Saatgut mehr» (N3) nimmt
der Lead damit als angenommen (A), weil Tim keine Änderung verlangt hat.

## Entscheid

1. **Leiste unten** (Baustein `Tabbar`, `design-system/components/Tabbar.md`): fünf feste Ziele Heute, Anlagen, Säen,
   Saatgut und Mehr; je Ziel 68 dp hoch, Symbol und Wort, aktives Ziel mit Balken, Pille und fetter Schrift, nie nur Farbe.
   Nur Tippen, keine Wischgesten (Konzept 6.3).
2. **Sichtbarkeit:** nur auf den fünf Hauptseiten (Heute `#/`, `#/anlagen`, `#/saeen` in Schritt 1, `#/saatgut`, `#/mehr`).
   In Abläufen (Messen, Ansatz, Säen ab Schritt 2, Neue Sorte, Gefäss erfassen) und auf Unterseiten (Anlage, Gefäss,
   Sorte, Einstellungen, Info …) fehlt sie; dort führen «Zurück» und «Zu Heute» heraus. So passt die Messmaske weiter ohne
   Scrollen auf 360 × 640 (Konzept 17).
3. **Heute ohne Kopfknöpfe:** Der Kopf zeigt nur das Logo; alle bisherigen Wege bleiben über die Leiste erreichbar
   («Anlage öffnen» über Anlagen, «Säen» über Säen, «Einstellungen» und «Info» über Mehr). Jeder Ablauf geht weiter ab
   Heute (Konzept 6.3).
4. **Routen (A):** `#/anlagen` (Wahl Indoor/Outdoor, `#/anlagen?standort=outdoor`), `#/saatgut` als neuer Name der
   Sorten-Liste (`#/sorten` leitet weiter; `#/sorten/neu` und `#/sorten/<id>` bleiben gültig, bis N2 sie umbenennt),
   `#/mehr` (Einstellungen, Etiketten, Vorlagen, Push-Erinnerungen, Notfallblatt, Info und Version).
5. **Anlagen** zeigt vorerst je Standort die Anlagen mit «Anlage <Kürzel> öffnen» und für Outdoor ohne Anlage den leeren
   Zustand mit «Anlage anlegen». Die Belegung je Ebene und Box ist Paket N4.
6. **Saatgut-Manager** (N2) und «Kein Saatgut mehr» (N3) nach dem Vorschlag; Bestand in Korn wird nicht mehr abgefragt.

## Abweichung vom Konzept

- **6.3 Usability-Leitlinien** nennen Heute als Ausgangspunkt jedes Ablaufs und die Masken je Kontext; die Navigation
  zwischen den Masken lief bisher über Knöpfe in Heute. Neu führt eine feste Leiste zu den Hauptseiten. Die Regel «Jeder
  Ablauf geht vollständig ab Heute» bleibt erfüllt; die Leiste ergänzt Wege, sie ersetzt keinen Ablauf.
- **10 Gestaltung und Design System:** neuer Baustein `Tabbar` mit Navigationsliste; die Maske «Sorten» heisst in der
  Leiste «Saatgut».
- **Nachführung:** in der nächsten Konzeptfassung 6.3, 10 und die Maskenliste (`docs/spec/05_masken.md`) nachführen,
  Eintrag in Anhang B.2. Posten in `docs/plaene/pakete.md` (I3, Nachführung Konzept).

## Folgen

- Abnahme 2 am Honor prüft, dass die Leiste mit nassen Händen sicher trifft (NV1-AK10, «offen-abnahme-2»).
- Feste Füsse einer Hauptseite («Rundgang starten», Säen-Fuss) stehen über der Leiste.
- N2 ändert weder Router noch Heute noch Leiste und mischt `origin/main` nach dem Merge von N1 ein.
