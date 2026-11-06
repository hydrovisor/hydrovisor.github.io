# Entwurf der Wissenskarten (UC12, Plan 40 A4)

Stand 6.11.2026 · Paket I2-08 (#40) · Entwurf des Leads, (A) · **Tim prüft und übernimmt**

`wissenseintrag.csv` in diesem Ordner enthält 51 Karten im Format von `data/wissen/wissenseintrag.csv` (W0, `docs/spec/03_import_w0.md`):

- 40 Karten je Art und Phase für die 11 Arten des Sortenstamms (Salat, Tomate, Peperoni, Basilikum, Spinat, Nüsslisalat, Pak Choi, Peterli, Schnittlauch, Krautstiel, Rande) und eine Karte für die Kulturgruppe Fruchtgemüse.
- 10 Themenkarten «allgemein» (Sondenpflege, Kratky-Pegel, Wurzelfarbe, Topf umsetzen, Boxen einzeln, Stromausfall und weitere nach UC12 «Inhalte»).

Jeder Text hat höchstens 600 Zeichen (der längste 269) und erwähnt weder KCl noch Lagerlösung. Die Texte sind in eigenen Worten nach dem Düngeplan V1.6, den Use Cases F4 und dem Konzept v1.4 geschrieben. Fachlich geprüft sind sie nicht.

## Was der Seed jetzt prüft

Die Gesamtfreigabe des Seeds (`--gesamtfreigabe`) bricht ab, wenn eine Kombination aus Art und Phase der Startbelegung keine gültige Karte hat (UC12-AK1, R7.2). Die Meldung lautet «Seed: Gesamtfreigabe, Wissenskarten fehlen: lactuca_sativa/keimung, …». Der Seed-Bericht listet die Lücken auch in der Teilfreigabe unter «Wissenskarten fehlen».

- **Startbelegung:** Arten mit einer gültigen Sorte und einer nicht stornierten Packung.
- **Phasen einer Art:** Phasen mit «anwendbar = ja» nach der Vererbung Sorte → Art → Kulturgruppe → Standard (`v_sollwert`).
- **Deckung:** Eine Karte auf Ebene Art deckt die Art, eine Karte auf Ebene Kulturgruppe alle Arten der Gruppe.

## Übernahme (Tims Handgriff, rund 45 Minuten)

1. Texte lesen und korrigieren. Fachlich falsche Hinweise sind am Regal schädlich; im Zweifel die Karte kürzen.
2. Quellen: Die Spalte `quelle_id` nennt `duengeplan-v1-6`, `use-cases-f4` und `konzept-v1-4`. Diese Quellen fehlen in `data/wissensbasis/freigegeben/quelle.csv`, weil die W0-Wissensbasis noch nicht im Repository liegt. Mit der Wissensbasis die drei Quellen dort anlegen (oder die Karten auf vorhandene Quellen umstellen). Ohne Quelle lehnt der Validator die Karte ab (V-Regeln, Fremdschlüssel).
3. Datei nach `data/wissen/wissenseintrag.csv` kopieren.
4. Prüfen: `npm run w0:pruefen`, dann der Trockenlauf `gh workflow run dev-seed.yml -f zweig=main -f trockenlauf=true`. Der Bericht zeigt die Lücken je Art und Phase.
5. Fehlt eine Kombination (etwa eine Art, die erst später gekauft wird), eine Karte ergänzen. Die Gesamtfreigabe gelingt erst ohne Lücken.

Der Lead übernimmt die Datei nicht selbst nach `data/`: Die Inhalte schreibt Tim (UC12 «Inhalte», Issue #40).
