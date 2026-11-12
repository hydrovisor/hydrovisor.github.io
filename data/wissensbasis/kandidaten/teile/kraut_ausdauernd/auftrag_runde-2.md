# Auftrag Runde 2: Lücken der Kulturgruppe `kraut_ausdauernd` (Stand 12.11.2026, Koordinator)
Ladbar heisst: Kandidat mit Status `geprueft` oder `vorgeschlagen` in `profilwert.csv` (Form des Validators erfüllt). Zeilen nur in `profilwert_offen.csv` zählen als Lücke (nur offener Wert); ein neuer Kandidat mit min, typ und max schliesst sie.

## `petroselinum_crispum`
- profilwert Pflicht: keimung.dauer, keimung.bbch, keimung.keimart, keimung.keimtemp, anzucht.dauer, anzucht.bbch, anzucht.ph, anzucht.ec, wachstum.dauer, wachstum.bbch, wachstum.ph (nur offen), wachstum.ec (nur offen)
- profilwert erwünscht: keimung.licht_h, keimung.wassertemp, anzucht.licht_h, anzucht.wassertemp, wachstum.licht_h, wachstum.wassertemp
- art.csv Artmerkmale fehlen: kulturformen_erlaubt, kulturform_vorgabe, umsetzen_ab_d, umsetzen_bis_d, systemeignung, standard_keimfaehigkeit, samentyp (Kulturformen nach Entscheid 0018: `dauerkultur_blatt;schnitt`, Vorgabe `dauerkultur_blatt`; Quelle muss die Nutzung als diese Kulturform belegen)
- Kulturform `dauerkultur_blatt`: Felder fehlen: ernte_ab_d, ernteart, kulturdauer_typisch_d, ernteintervall_d, kulturdauer_max_d, entspitzen; Saatempfehlung `se.petroselinum_crispum.dauerkultur_blatt`: fehlt
- Kulturform `schnitt`: Felder fehlen: ernte_ab_d, ernteart, kulturdauer_typisch_d, ernteintervall_d, schnitte_max; Saatempfehlung `se.petroselinum_crispum.schnitt`: fehlt

## `allium_schoenoprasum`
- profilwert Pflicht: keimung.dauer, keimung.bbch, keimung.keimart, keimung.keimtemp, anzucht.dauer, anzucht.bbch, anzucht.ph, anzucht.ec, wachstum.dauer, wachstum.bbch, wachstum.ec (nur offen)
- profilwert erwünscht: keimung.licht_h, keimung.wassertemp, anzucht.licht_h, anzucht.wassertemp, wachstum.licht_h, wachstum.wassertemp
- art.csv Artmerkmale fehlen: kulturformen_erlaubt, kulturform_vorgabe, umsetzen_ab_d, umsetzen_bis_d, systemeignung, standard_keimfaehigkeit, samentyp (Kulturformen nach Entscheid 0018: `dauerkultur_blatt;schnitt`, Vorgabe `dauerkultur_blatt`; Quelle muss die Nutzung als diese Kulturform belegen)
- Kulturform `dauerkultur_blatt`: Felder fehlen: ernte_ab_d, kulturdauer_typisch_d, ernteintervall_d, kulturdauer_max_d, entspitzen; Saatempfehlung `se.allium_schoenoprasum.dauerkultur_blatt`: fehlt
- Kulturform `schnitt`: Felder fehlen: ernte_ab_d, ernteart, kulturdauer_typisch_d, ernteintervall_d, schnitte_max; Saatempfehlung `se.allium_schoenoprasum.schnitt`: fehlt
