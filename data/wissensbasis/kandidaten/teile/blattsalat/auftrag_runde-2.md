# Auftrag Runde 2: Lücken der Kulturgruppe `blattsalat` (Stand 12.11.2026, Koordinator)
Ladbar heisst: Kandidat mit Status `geprueft` oder `vorgeschlagen` in `profilwert.csv` (Form des Validators erfüllt). Zeilen nur in `profilwert_offen.csv` zählen als Lücke (nur offener Wert); ein neuer Kandidat mit min, typ und max schliesst sie.

## `lactuca_sativa`
- profilwert Pflicht: keimung.dauer, anzucht.dauer (nur offen), anzucht.ph (nur offen), wachstum.dauer (nur offen)
- profilwert erwünscht: keimung.licht_h, keimung.wassertemp, anzucht.licht_h, anzucht.wassertemp, wachstum.licht_h, wachstum.wassertemp
- art.csv Artmerkmale fehlen: name_de, kulturgruppe_id, kulturformen_erlaubt, kulturform_vorgabe, systemeignung, standard_keimfaehigkeit, samentyp (Kulturformen nach Entscheid 0018: `kopf;schnitt;babyleaf`, Vorgabe `kopf`; Quelle muss die Nutzung als diese Kulturform belegen)
- Kulturform `kopf`: Felder fehlen: ernte_ab_d, ernteart, kulturdauer_typisch_d; Saatempfehlung `se.lactuca_sativa.kopf`: fehlt
- Kulturform `schnitt`: Felder fehlen: ernte_ab_d, kulturdauer_typisch_d, ernteintervall_d, schnitte_max; Saatempfehlung `se.lactuca_sativa.schnitt`: fehlt
- Kulturform `babyleaf`: Felder fehlen: ernte_ab_d, ernteart, kulturdauer_typisch_d; Saatempfehlung `se.lactuca_sativa.babyleaf`: fehlt

## `valerianella_locusta`
- profilwert Pflicht: keimung.dauer, keimung.keimart, keimung.keimtemp (nur offen), anzucht.dauer (nur offen), anzucht.bbch, anzucht.ph, anzucht.ec, anzucht.wechselmerkmal, wachstum.dauer (nur offen), wachstum.bbch, wachstum.ph (nur offen), wachstum.ec (nur offen)
- profilwert erwünscht: keimung.licht_h, keimung.wassertemp, anzucht.licht_h, anzucht.wassertemp, wachstum.licht_h, wachstum.wassertemp
- art.csv Artmerkmale fehlen: kulturgruppe_id, kulturform_vorgabe, umsetzen_ab_d, umsetzen_bis_d, systemeignung, standard_keimfaehigkeit, samentyp (Kulturformen nach Entscheid 0018: `kopf;babyleaf`, Vorgabe `kopf`; Quelle muss die Nutzung als diese Kulturform belegen)
- Kulturform `kopf`: Felder fehlen: kulturdauer_typisch_d; Saatempfehlung `se.valerianella_locusta.kopf`: fehlt
- Kulturform `babyleaf`: Felder fehlen: ernte_ab_d, ernteart, kulturdauer_typisch_d; Saatempfehlung `se.valerianella_locusta.babyleaf`: fehlt
