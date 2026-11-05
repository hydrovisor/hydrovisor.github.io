# Deckel

Deckelgrafik eines Gefässes: Löcher als Tippflächen, aus dem Lochbild «Löcher je Reihe von vorne nach hinten» gezeichnet (Konzept 5.4, UC2, UC4).

- Loch 1 liegt vorne links; nummeriert wird spaltenweise: erst die linke Spalte von vorne nach hinten, dann die nächste (Konzept v1.4, E9; D6: 1 bis 3 links, 4 bis 6 rechts). Vorne ist unten in der Grafik (`hv-deckel` stapelt die Reihen von unten nach oben), so wie Tim vor dem Regal steht.
- Jedes Loch (`hv-loch`) ist mindestens `size-loch` (48 dp) gross; in Regal-Masken `size-touch-regal` (68 dp). Es zeigt die Lochnummer oder die Topfkennung («2.3.4»).
- Zustände nie nur über Farbe: frei (Rand `line-control`), belegt (`hv-loch-belegt`, Fläche `brand-soft`, Kennung des Topfs), reserviert (`hv-loch-reserviert`, gestrichelter Rand), gewählt (`hv-loch-gewaehlt`, Fläche `brand`); der zugängliche Name nennt den Zustand («Loch 4, reserviert»).
- Props: `reihen` (Löcher je Reihe, z. B. `[2, 2, 2]`), `loecher` (`{ nr, text, zustand, marke?, nichtWaehlbar? }`), `onLoch(nr)`, `onReihe(reihe)`. Mehrfachauswahl (Malmodus Säen) läuft über den Zustand `gewaehlt` je Loch.
- Reihenköpfe (Prop `onReihe`): links jeder Reihe eine Tippfläche `hv-deckel-reihenkopf` (Grösse wie ein Loch, 68 dp in Regal-Masken) mit der Reihennummer und dem Namen «Reihe 2 wählen»; die Maske entscheidet, welche Löcher der Reihe der Tipp wählt.
- Marke (`marke`, Nummer der Sorte im Malmodus): gewählte Löcher zeigen «S1», «S2» (`hv-loch-marke`), damit die Marke nicht mit einer Lochnummer verwechselt wird; der zugängliche Name nennt die Sorte («Loch 4, gewählt für Eins»). Nicht wählbare Löcher (`nichtWaehlbar`: belegt, reserviert, kein Topf, falsche Topfgrösse) sind `aria-disabled`, reagieren nicht und zeigen ihren Zustand als Text (`text`, z. B. «bel.», «res.», «5 cm», «–»); `zustandName` ersetzt das Zustandswort im zugänglichen Namen («Loch 3, kein Topf»).
- Nummern, Reihe, Spalte, Randloch und Gangkante kommen aus `lochbild()` in `src/domain/vorlagen/lochbild.ts` (eine Quelle für Grafik, Vorlagen und Assistent). Jedes Loch trägt `data-reihe` (1 = vorne) und `data-randloch` (Konzept 8.1 Regel 9: erste oder letzte Reihe, erstes oder letztes Loch einer Reihe); die vorderste Reihe ist die Gangkante (`data-gangkante`). Die Attribute färben nichts.
- `kanten` zeigt die Beschriftung «hinten» oben und «vorne · Gang» unten (`hv-deckel-kante`); `serviceOeffnung` setzt an der Vorderkante die Marke «Service-Öffnung» (`hv-deckel-service`, gestrichelter Rahmen mit Text).
- `hv-deckel-rahmen` umschliesst die Grafik: Reihen, die breiter als die Maske sind, scrollen waagrecht; Löcher schrumpfen nie unter `size-loch` (UC2-AK3).
- Keine geometrische Lochprüfung (U-01); die Grafik ist schematisch.
