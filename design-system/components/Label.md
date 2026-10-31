# Label

Druckvorlage für das Etikett eines Gefässes oder Anzuchtorts, 70 × 42 mm, mit QR-Code, Kennung in grosser Schrift und Zusatzzeilen.

- Props: `code` (Etikett-Code, z. B. `R-2.3`), `kennung` (z. B. `2.3`, `A`), `lines` (ein bis zwei Zeilen, z. B. «Indoor-Regal · DWC · 9 l», «Deckel D2 · 6 × 8 cm»), `qr` (SVG als Text oder Element; ohne `qr` erscheint ein Platzhalter).
- Den QR-Code erzeugt die App: Inhalt ist nur der Link auf den Ort, `https://<konto>.github.io/hydrovisor/#/e/R-2.3`, Fehlerkorrektur Q, Ruhezone von mindestens vier Modulen. Er wird mit 30 × 30 mm gedruckt.
- Die Kennung steht in Manrope 700 mit Schriftgrösse 20 mm, das ergibt rund 14 mm hohe Ziffern; mehr passt neben dem 30-mm-QR-Code nicht auf 70 mm Breite. Sie ist gleich geschrieben wie im Kopf der Maske «Gefäss».
- Immer `label-ink` auf `label-paper` (schwarz auf weiss), auch im dunklen Thema; keine Status- oder Markenfarben, kein Logo.
- Masse in Millimetern; 3 mm Innenrand, weil Tintenstrahldrucker am Blattrand nicht drucken. Ob der Epson WF-3820 den Bogen randgenau trifft, zeigt der Gerätetest im Dezember.
- `LabelSheet` verteilt bis zu 21 Etiketten auf einen A4-Bogen mit 3 × 7 Feldern (`labels`); `start` (1 bis 21) lässt auf einem angebrauchten Bogen die ersten Felder frei. Gedruckt wird über den Druckdialog von Android oder als PDF; die Seite setzt `@page { size: A4; margin: 0 }`.
