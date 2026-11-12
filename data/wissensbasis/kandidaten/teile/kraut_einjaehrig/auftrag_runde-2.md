# Auftrag Runde 2: Lücken der Kulturgruppe `kraut_einjaehrig` (Stand 12.11.2026, Koordinator)
Ladbar heisst: Kandidat mit Status `geprueft` oder `vorgeschlagen` in `profilwert.csv` (Form des Validators erfüllt). Zeilen nur in `profilwert_offen.csv` zählen als Lücke (nur offener Wert); ein neuer Kandidat mit min, typ und max schliesst sie.

## `ocimum_basilicum`
- profilwert Pflicht: keimung.dauer, keimung.keimtemp (nur offen), anzucht.dauer, anzucht.ph, anzucht.ec, wachstum.dauer
- profilwert erwünscht: keimung.licht_h, keimung.wassertemp, anzucht.licht_h, anzucht.wassertemp, wachstum.licht_h, wachstum.wassertemp
- art.csv Artmerkmale fehlen: umsetzen_ab_d, umsetzen_bis_d, systemeignung, standard_keimfaehigkeit, samentyp (Kulturformen nach Entscheid 0018: `dauerkultur_blatt;schnitt`, Vorgabe `dauerkultur_blatt`; Quelle muss die Nutzung als diese Kulturform belegen)
- Kulturform `dauerkultur_blatt`: Felder fehlen: ernte_ab_d, kulturdauer_typisch_d, ernteintervall_d, kulturdauer_max_d; Saatempfehlung `se.ocimum_basilicum.dauerkultur_blatt`: vorhanden
- Kulturform `schnitt`: Felder fehlen: ernte_ab_d, ernteart, kulturdauer_typisch_d, ernteintervall_d, schnitte_max; Saatempfehlung `se.ocimum_basilicum.schnitt`: fehlt
