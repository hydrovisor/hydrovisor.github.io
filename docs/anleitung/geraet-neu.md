# Anleitung «Gerät neu»

Für einen Gerätewechsel oder ein zweites Chrome-Profil (Konzept 11.7, UC0-AK8). Ziel: in unter 20 Minuten wieder messen und Erinnerungen erhalten. Die Daten liegen in Supabase; auf dem alten Gerät geht nichts verloren, das nicht schon gespeichert ist.

## Vorher

- Auf dem alten Gerät in Heute prüfen, dass keine Messung mit «nicht gespeichert» offen ist. Sonst dort zuerst «Erneut senden».
- Zugangsdaten bereithalten: E-Mail und Passwort aus dem Passwortmanager. Eine Registrierung gibt es nicht.

## Schritte auf dem neuen Gerät

1. **Chrome öffnen** und die Adresse `https://hydrovisor.github.io/` eingeben.
2. **Anmelden** mit E-Mail und Passwort aus dem Passwortmanager. Die Sitzung bleibt lange gültig; am Regal kommt keine neue Anmeldung.
3. **Installieren:** im Chrome-Menü «App installieren» (bzw. «Zum Startbildschirm hinzufügen»). Danach die App über das neue Symbol öffnen, nicht mehr im Browser-Tab.
4. **Push abonnieren:** In der App Einstellungen › «Push einrichten und Test-Push senden» öffnen, «Push einrichten» tippen und Benachrichtigungen erlauben.
5. **Test-Push:** «Test-Push senden». Die Nachricht muss innert einer Minute erscheinen, auch bei gesperrtem Bildschirm.
6. **Link-Freigabe:** Android-Einstellungen › Apps › Hydrovisor › «Standardmässig öffnen» › unterstützte Links erlauben. Dann öffnet ein QR-Etikett direkt die App.
7. **Dauerhafter Speicher:** Heute einmal online öffnen, damit die Daten für den Betrieb ohne Netz geladen sind. Fragt Chrome nach dauerhaftem Speicher, erlauben; Chrome-Einstellungen › Website-Einstellungen › hydrovisor.github.io darf die Daten nicht automatisch löschen.
8. **Akku-Optimierung aus:** Android-Einstellungen › Apps › Chrome › Akku › «Nicht eingeschränkt». Sonst kommen Erinnerungen verspätet.
9. **Probe:** ein Etikett scannen (öffnet die Maske «Gefäss»), danach eine Messung an Y-2.3 der Testanlage speichern und mit «Rückgängig machen» zurücknehmen.

## Alte Geräte

- Das Push-Abo des alten Geräts bleibt bestehen, bis ein Versand mit 404 oder 410 scheitert; dann markiert die App es selbst als ungültig.
- VAPID-Schlüssel werden nie neu erzeugt; sonst wären alle Abos ungültig.

## Zeit messen

Die Probe im Dezember mit einem zweiten Chrome-Profil durchspielen und die Dauer im Issue zu I1b-07 als Abnahme von UC0-AK8 (`offen-regal`) eintragen.
