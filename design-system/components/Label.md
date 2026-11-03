# Label

Druckvorlage für das Etikett eines Gefässes, einer Anzuchtbox oder der Messstelle W, 70 × 42.3 mm, mit QR-Code, Kennung in grosser Schrift und Zusatzzeilen (R9.1).

- Props: `code` (Etikett-Code, z. B. `R-2.3`), `kennung` (z. B. `2.3`, `A1`, `W`), `lines` (ein bis zwei Zeilen: Anlage, Betriebsart, Volumen, Deckel oder Platte, z. B. «Indoor-Regal · DWC · 9 l», «Deckel D2 · 6 × 5 cm»; Stationen «4 × 8 cm»), `qr` (SVG als Text oder Element; ohne `qr` erscheint ein Platzhalter), `klein` (Anzuchtbox).
- Aufteilung der Breite: 4 mm Innenabstand links (`label-padding-x`), QR-Code 30 mm einschliesslich Ruhezone (`label-qr`), Kennung rechts auf 32 mm Breite (`label-id-width`), 4 mm Innenabstand rechts. Unter dem QR steht der Code als Text.
- Den QR-Code erzeugt die App: Inhalt ist nur der Link auf den Ort, `https://hydrovisor.github.io/#/e/R-2.3` (Basis-URL als Konstante), Fehlerkorrektur Q, Ruhezone von mindestens vier Modulen innerhalb der 30 mm.
- Die Kennung steht in Manrope 700. Ihre Schriftgrösse wird aus der Breite berechnet: die App misst die Kennung bei 1 mm Schriftgrösse und setzt `--hv-label-id-size` = min(`label-id-max` (20 mm), 32 mm / gemessene Breite); kurze Kennungen bleiben bei 20 mm. Sie ist gleich geschrieben wie im Kopf der Maske «Gefäss».
- **Anzuchtbox** (`hv-label-small`): 55 × 25 mm, aus einem Bogenfeld zugeschnitten, QR 19 mm, Zeilen «Lichtkeimer» oder «Dunkelkeimer» und «Deckel offen» oder «Deckel zu».
- Immer `label-ink` auf `label-paper` (schwarz auf weiss), auch im dunklen Thema; keine Status- oder Markenfarben, kein Logo.
- Masse in Millimetern; der Innenabstand hält Abstand zum Rand, den Tintenstrahldrucker nicht bedrucken. Ob der Epson WF-3820 den Bogen randgenau trifft, zeigt der Testbogen (Druckversatz X/Y, `LabelSheet`).
- Den A4-Bogen mit 3 × 7 Feldern, Startfeld und Druckversatz beschreibt `LabelSheet`.
