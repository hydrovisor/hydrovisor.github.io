# Auftrag Runde 2: Lücken der Kulturgruppe `kohl` (Stand 12.11.2026, Koordinator)
Ladbar heisst: Kandidat mit Status `geprueft` oder `vorgeschlagen` in `profilwert.csv` (Form des Validators erfüllt). Zeilen nur in `profilwert_offen.csv` zählen als Lücke (nur offener Wert); ein neuer Kandidat mit min, typ und max schliesst sie.

## `brassica_rapa_chinensis`
- profilwert Pflicht: keimung.dauer, keimung.keimart, keimung.keimtemp, anzucht.dauer, anzucht.ec (nur offen), wachstum.dauer (nur offen)
- profilwert erwünscht: keimung.licht_h, keimung.wassertemp, anzucht.wassertemp, wachstum.wassertemp
- art.csv Artmerkmale fehlen: kulturformen_erlaubt, kulturform_vorgabe, systemeignung, standard_keimfaehigkeit, samentyp (Kulturformen nach Entscheid 0018: `kopf;babyleaf`, Vorgabe `kopf`; Quelle muss die Nutzung als diese Kulturform belegen)
- Kulturform `kopf`: Felder fehlen: keine; Saatempfehlung `se.brassica_rapa_chinensis.kopf`: vorhanden
- Kulturform `babyleaf`: Felder fehlen: ernte_ab_d, ernteart, kulturdauer_typisch_d; Saatempfehlung `se.brassica_rapa_chinensis.babyleaf`: fehlt
