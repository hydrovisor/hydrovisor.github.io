# Plan kamera: Tütenfotos direkt mit der Kamera, Vorder- und Rückseite in einem Zug

Stand 14.11.2026 · Paket ausserhalb von pakete.md (Wunsch Tim im Chat vom 14.11.2026, kein Issue: die Integration darf keine Issues anlegen) · Klasse Routine · Planer Lead · Planfreigabe nicht nötig

## Ziel

Tim fotografiert seine rund 22 Saatguttüten am Honor, ohne die App zu verlassen: ein Tipp öffnet die Kamera, je Tüte ein Tipp für die Vorder- und einer für die Rückseite, die App speichert und springt zur nächsten Sorte. Für einzelne Fotos wählt er Kamera, Galerie oder Dateien (Drive und andere Cloud-Ablagen).

## Ursache

`PhotoField` nutzte `input type=file accept="image/*"` ohne `capture`. Chrome ab Android 14 öffnet dafür den System-Fotoauswähler («This app can only access the photos that you select») ohne Kamera.

## Betroffene Dateien

| Datei | neu / geändert | Inhalt |
|---|---|---|
| `src/ui/bausteine/Kamera.tsx` | neu | Sucher in der App (getUserMedia, Rückkamera), Auslöser, Schritt, Vorschau, Aktionen, Fehlermeldung |
| `src/ui/bausteine/PhotoField.tsx` | geändert | drei Wege: Kamera (`capture`), «Aus Galerie wählen», «Aus Dateien wählen» |
| `src/ui/masken/Sorte.tsx` | geändert | Karte «Tütenfoto»: «Vorder- und Rückseite aufnehmen» |
| `src/ui/masken/SaatgutNachtragen.tsx` | geändert | Kamera bleibt über alle Sorten offen, «Sorte überspringen», «Ohne Rückseite weiter» |
| `src/ui/masken/SaatgutErfassen.tsx` | geändert | nach beiden Fotos liest die App die Tüte ohne weiteren Tipp |
| `design-system/components/Kamera.md`, `PhotoField.md`, `Tuetenfoto.md`, `bundle.css` | neu / geändert | Baustein Kamera, Quellen des Fotofelds |
| `tests/e2e/kamera.spec.ts`, `tests/unit/kamera.test.ts` | neu | AK unten |

## Migration

Nein. Speichern unverändert über `tuetenfotoHochladen` und `schreiben()` (Storno plus neue Zeile, Plan 207).

## AK

| AK | Prüfart | Fundstelle | Test |
|---|---|---|---|
| KA1-AK1 | E2E | Fotofeld mit Kamera (`capture="environment"`), Galerie (`accept="image/*"`), Dateien (ohne `accept`) | `KA1-AK1 Fotofeld: …` |
| KA1-AK2 | Unit, E2E | ohne Kamera-Freigabe Meldung mit Ausweg, Auslöser gesperrt | `kamera.test.ts`, `KA1-AK2 Kamera ohne Freigabe …` |
| KA1-AK3 | E2E | Detail der Sorte: zwei Auslösungen speichern vorne und hinten | `KA1-AK3 Detail der Sorte …` |
| KA1-AK4 | E2E | Fotos nachtragen: Kamera bleibt offen, nächste Sorte von selbst, überspringen, beenden | `KA1-AK4 Fotos nachtragen …` |
| KA1-AK5 | E2E | Tüte erfassen: nach zwei Auslösungen startet das Lesen ohne Tipp | `KA1-AK5 Tüte erfassen …` |
| KA1-AK6 | [Gerät] | Honor: Kamera öffnet direkt, Fotos scharf und lesbar, «Aus Dateien wählen» zeigt Drive | Abnahme 2 |

## Risiken

| Risiko | Folge | Gegenmassnahme |
|---|---|---|
| Kamera-Freigabe in Chrome verweigert | Sucher bleibt leer | Meldung mit Weg über das Fotofeld (Kamera-App, Galerie) |
| Standbild aus dem Video weniger scharf als ein Foto der Kamera-App | KI liest schlechter | 1920 × 1080, die App verkleinert ohnehin auf 1568 px (BILD_KANTE_MAX); Prüfung in Abnahme 2 |
| Speichern scheitert mitten in der Reihe | Foto fehlt | Kamera schliesst, die Seite zeigt Meldung und «Speichern wiederholen» wie bisher |

## Nicht-Ziele

Keine Taschenlampe, kein Zoom, kein automatisches Auslösen; keine Änderung an Speicherung, Bucket oder KI.

## Annahmen (A)

1. (A) `input type=file` ohne `accept` öffnet in Chrome für Android die Auswahl mit «Dateien» (Drive, OneDrive); Nicht-Bilder meldet die Maske als «nicht lesbar». Prüfung am Honor in Abnahme 2.
2. (A) Die Kamera bleibt eingehängt, solange die Maske sie zeigt; so startet sie im Ablauf «Fotos nachtragen» nicht je Sorte neu.
3. (A) Standbild aus dem Video statt `ImageCapture.takePhoto()`: dieselbe Ausrichtung wie im Sucher, keine Geräteeigenheiten; 1080 × 1920 im Hochformat reicht für 1568 px.
4. (A) Fehler von getUserMedia: `NotAllowedError`/`SecurityError` → nicht freigegeben, `NotFoundError`/`OverconstrainedError` → keine Kamera, sonst «startet nicht».
5. (A) Die Testdaten `saatTeile()` haben kein `name_wiss`; `kamera.spec.ts` ergänzt es leer, damit die Erkennung der Art wie in der Datenbank läuft.
