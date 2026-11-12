# Auftrag Runde 2: Lücken der Kulturgruppe `fuchsschwanz` (Stand 12.11.2026, Koordinator)
Ladbar heisst: Kandidat mit Status `geprueft` oder `vorgeschlagen` in `profilwert.csv` (Form des Validators erfüllt). Zeilen nur in `profilwert_offen.csv` zählen als Lücke (nur offener Wert); ein neuer Kandidat mit min, typ und max schliesst sie.

## `spinacia_oleracea`
- profilwert Pflicht: anwendbar aller Phasen (bei Blattgemüse/Kräutern Blüte und Fruchtbildung `entfaellt` legt der Koordinator an), keimung.dauer, keimung.bbch, keimung.keimart, keimung.keimtemp, keimung.wechselmerkmal, anzucht.dauer, anzucht.bbch, anzucht.ph, anzucht.ec, anzucht.wechselmerkmal, wachstum.dauer, wachstum.bbch, wachstum.ph, wachstum.ec
- profilwert erwünscht: keimung.licht_h, keimung.wassertemp, anzucht.licht_h, anzucht.wassertemp, wachstum.licht_h, wachstum.wassertemp
- art.csv Artmerkmale fehlen: name_de, name_wiss, gbif_key, kulturgruppe_id, kulturformen_erlaubt, kulturform_vorgabe, umsetzen_ab_d, umsetzen_bis_d, systemeignung, standard_keimfaehigkeit, samentyp (Kulturformen nach Entscheid 0018: `babyleaf;kopf;schnitt`, Vorgabe `babyleaf`; Quelle muss die Nutzung als diese Kulturform belegen)
- Kulturform `babyleaf`: Felder fehlen: ernte_ab_d, ernteart, kulturdauer_typisch_d; Saatempfehlung `se.spinacia_oleracea.babyleaf`: fehlt
- Kulturform `kopf`: Felder fehlen: ernte_ab_d, ernteart, kulturdauer_typisch_d; Saatempfehlung `se.spinacia_oleracea.kopf`: fehlt
- Kulturform `schnitt`: Felder fehlen: ernte_ab_d, ernteart, kulturdauer_typisch_d, ernteintervall_d, schnitte_max; Saatempfehlung `se.spinacia_oleracea.schnitt`: fehlt

## `beta_vulgaris_cicla`
- profilwert Pflicht: anwendbar aller Phasen (bei Blattgemüse/Kräutern Blüte und Fruchtbildung `entfaellt` legt der Koordinator an), keimung.dauer, keimung.bbch, keimung.keimart, keimung.keimtemp, keimung.wechselmerkmal, anzucht.dauer, anzucht.bbch, anzucht.ph, anzucht.ec, anzucht.wechselmerkmal, wachstum.dauer, wachstum.bbch, wachstum.ph, wachstum.ec
- profilwert erwünscht: keimung.licht_h, keimung.wassertemp, anzucht.licht_h, anzucht.wassertemp, wachstum.licht_h, wachstum.wassertemp
- art.csv Artmerkmale fehlen: name_de, name_wiss, gbif_key, kulturgruppe_id, kulturformen_erlaubt, kulturform_vorgabe, umsetzen_ab_d, umsetzen_bis_d, systemeignung, standard_keimfaehigkeit, samentyp (Kulturformen nach Entscheid 0018: `schnitt;babyleaf`, Vorgabe `schnitt`; Quelle muss die Nutzung als diese Kulturform belegen)
- Kulturform `schnitt`: Felder fehlen: ernte_ab_d, ernteart, kulturdauer_typisch_d, ernteintervall_d, schnitte_max; Saatempfehlung `se.beta_vulgaris_cicla.schnitt`: fehlt
- Kulturform `babyleaf`: Felder fehlen: ernte_ab_d, ernteart, kulturdauer_typisch_d; Saatempfehlung `se.beta_vulgaris_cicla.babyleaf`: fehlt

## `beta_vulgaris_conditiva`
- profilwert Pflicht: anwendbar aller Phasen (bei Blattgemüse/Kräutern Blüte und Fruchtbildung `entfaellt` legt der Koordinator an), keimung.dauer, keimung.bbch, keimung.keimart, keimung.keimtemp, keimung.wechselmerkmal, anzucht.dauer, anzucht.bbch, anzucht.ph, anzucht.ec, anzucht.wechselmerkmal, wachstum.dauer, wachstum.bbch, wachstum.ph, wachstum.ec
- profilwert erwünscht: keimung.licht_h, keimung.wassertemp, anzucht.licht_h, anzucht.wassertemp, wachstum.licht_h, wachstum.wassertemp
- art.csv Artmerkmale fehlen: name_de, name_wiss, gbif_key, kulturgruppe_id, kulturformen_erlaubt, kulturform_vorgabe, umsetzen_ab_d, umsetzen_bis_d, systemeignung, standard_keimfaehigkeit, samentyp (Kulturformen nach Entscheid 0018: `babyleaf;schnitt`, Vorgabe `babyleaf`; Quelle muss die Nutzung als diese Kulturform belegen)
- Kulturform `babyleaf`: Felder fehlen: ernte_ab_d, ernteart, kulturdauer_typisch_d; Saatempfehlung `se.beta_vulgaris_conditiva.babyleaf`: fehlt
- Kulturform `schnitt`: Felder fehlen: ernte_ab_d, ernteart, kulturdauer_typisch_d, ernteintervall_d, schnitte_max; Saatempfehlung `se.beta_vulgaris_conditiva.schnitt`: fehlt
