# KI-Eval der Saattüten (UC4-AK3)

Anleitung für Tim, Plan 14. Der Lead startet den echten Lauf nie, weil er den Schlüssel nicht sehen darf. Alles andere bereitet er vor.

## 1 Fotos

- Drei der 22 Tüten wählen.
- Vorder- und Rückseite mit dem Honor fotografieren.
- Die Fotos ablegen in `C:\dev\hydrovisor\data\eval\fotos\`. Namen:
  - `<zeile_id>-1.jpg` für die Vorderseite
  - `<zeile_id>-2.jpg` für die Rückseite
- Die `zeile_id` steht in `data/stammdaten/sorten.csv`, zum Beispiel `sorte-tomate-vilma-f1-1.jpg`.
- Der Ordner ist gitignoriert und kommt nie ins Repository. Fotos können GPS-Daten enthalten. Das Skript verkleinert die Bilder vor dem Senden wie die App und entfernt dabei EXIF.

## 2 Referenz

`data/eval/tueten_referenz.csv` ist die Wahrheit für den Vergleich, das Orakel. Nur du legst sie an. Kopf und Beispiel mit erfundenen Werten:

```csv
sorte_zeile_id,feld,soll
sorte-beispiel,name,Rote Probe
sorte-beispiel,art,Salat|Lactuca sativa
sorte-beispiel,keimart,Lichtkeimer
sorte-beispiel,keimtemperatur,15 bis 20 °C
sorte-beispiel,keimdauer,7-14
sorte-beispiel,kulturdauer,nicht auf der Tüte
sorte-beispiel,aussaatfenster,3-8
sorte-beispiel,hersteller,Beispiel Saaten
```

- **Felder:** je Tüte genau diese acht.
- **Fehlt etwas auf der Tüte:** `nicht auf der Tüte`.
- **Mehrere gültige Schreibweisen:** mit `|` trennen.
- **Zahlen:** Bei Keimtemperatur, Keimdauer, Kulturdauer und Aussaatfenster zählen nur die Zahlen. «15 bis 20 °C» gilt wie «15-20».
- **Aussaatfenster:** als Monatszahlen.
- **Keimart:** `Lichtkeimer`, `Dunkelkeimer` oder `indifferent`.

Die Datei lädst du auf GitHub in den Zweig `paket/14-ki-eval` hoch. Danach setzt du die Repository-Variable `REFERENZ_HASH_TUETEN`. Den Lauf und den Hash bereitet der Lead vor.

## 3 Lauf

In PowerShell im Ordner `C:\dev\hydrovisor`:

```powershell
$env:ANTHROPIC_API_KEY = '<Schlüssel aus dem Passwortmanager>'; npm run eval:tueten
```

- Das Skript ruft je Tüte beide Modelle einmal auf, ohne Ausweichen. Bei drei Tüten kostet das wenige Rappen.
- Den Bericht schreibt es nach `reports/ki-eval.md`.
- Auf der Konsole erscheint nur die Zusammenfassung, nie der Schlüssel.
- Danach dem Lead «Eval gelaufen» melden. Er postet den Bericht ins Issue #14 und legt den Entscheid zum Default-Modell an.

Probelauf ohne Schlüssel mit erfundenen Daten:

```powershell
npm run eval:tueten -- --trocken tests/fixtures/ki/antworten
```
