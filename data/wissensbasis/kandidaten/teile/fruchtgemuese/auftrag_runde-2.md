# Auftrag Runde 2: Lücken der Kulturgruppe `fruchtgemuese` (Stand 12.11.2026, Koordinator)
Ladbar heisst: Kandidat mit Status `geprueft` oder `vorgeschlagen` in `profilwert.csv` (Form des Validators erfüllt). Zeilen nur in `profilwert_offen.csv` zählen als Lücke (nur offener Wert); ein neuer Kandidat mit min, typ und max schliesst sie.

## `solanum_lycopersicum`
- profilwert Pflicht: keimung.dauer (nur offen), keimung.keimart, anzucht.dauer (nur offen), anzucht.ec (nur offen), wachstum.dauer, bluete.dauer, fruchtbildung_reife.dauer
- profilwert erwünscht: keimung.licht_h, keimung.wassertemp, anzucht.licht_h, anzucht.wassertemp, wachstum.licht_h, wachstum.wassertemp, bluete.licht_h, bluete.wassertemp, fruchtbildung_reife.licht_h, fruchtbildung_reife.wassertemp
- art.csv Artmerkmale fehlen: kulturformen_erlaubt, kulturform_vorgabe, umsetzen_ab_d, umsetzen_bis_d, systemeignung, standard_keimfaehigkeit, samentyp (Kulturformen nach Entscheid 0018: `dauerkultur_frucht`, Vorgabe `dauerkultur_frucht`; Quelle muss die Nutzung als diese Kulturform belegen)
- Kulturform `dauerkultur_frucht`: Felder fehlen: ernte_ab_d, kulturdauer_typisch_d, ernteintervall_d, kulturdauer_max_d, entspitzen; Saatempfehlung `se.solanum_lycopersicum.dauerkultur_frucht`: fehlt

## `capsicum_annuum`
- profilwert Pflicht: keimung.dauer (nur offen), keimung.keimart, anzucht.dauer (nur offen), anzucht.ph, anzucht.ec (nur offen), wachstum.dauer, bluete.dauer, fruchtbildung_reife.dauer
- profilwert erwünscht: keimung.licht_h, keimung.wassertemp, anzucht.licht_h, anzucht.wassertemp, wachstum.licht_h, wachstum.wassertemp, bluete.licht_h, bluete.wassertemp, fruchtbildung_reife.licht_h, fruchtbildung_reife.wassertemp
- art.csv Artmerkmale fehlen: kulturformen_erlaubt, kulturform_vorgabe, umsetzen_ab_d, umsetzen_bis_d, systemeignung, standard_keimfaehigkeit, samentyp (Kulturformen nach Entscheid 0018: `dauerkultur_frucht`, Vorgabe `dauerkultur_frucht`; Quelle muss die Nutzung als diese Kulturform belegen)
- Kulturform `dauerkultur_frucht`: Felder fehlen: ernte_ab_d, kulturdauer_typisch_d, ernteintervall_d, kulturdauer_max_d, entspitzen; Saatempfehlung `se.capsicum_annuum.dauerkultur_frucht`: fehlt
