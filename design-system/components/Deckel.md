# Deckel

Deckelgrafik eines Gefässes: Löcher als Tippflächen, aus dem Lochbild «Löcher je Reihe von vorne nach hinten» gezeichnet (Konzept 5.4, UC2, UC4).

- Loch 1 liegt vorne links; nummeriert wird zeilenweise nach hinten. Vorne ist unten in der Grafik (`hv-deckel` stapelt die Reihen von unten nach oben), so wie Tim vor dem Regal steht.
- Jedes Loch (`hv-loch`) ist mindestens `size-loch` (48 dp) gross; in Regal-Masken `size-touch-regal` (68 dp). Es zeigt die Lochnummer oder die Topfkennung («2.3.4»).
- Zustände nie nur über Farbe: frei (Rand `line-control`), belegt (`hv-loch-belegt`, Fläche `brand-soft`, Kennung des Topfs), reserviert (`hv-loch-reserviert`, gestrichelter Rand), gewählt (`hv-loch-gewaehlt`, Fläche `brand`); der zugängliche Name nennt den Zustand («Loch 4, reserviert»).
- Props: `reihen` (Löcher je Reihe, z. B. `[2, 2, 2]`), `loecher` (`{ nr, text, zustand }`), `onLoch(nr)`. Mehrfachauswahl («alle freien», ganze Reihen) folgt mit den Masken Säen und Vorlagen über den Zustand `gewaehlt` je Loch.
- Keine geometrische Lochprüfung (U-01); die Grafik ist schematisch.
