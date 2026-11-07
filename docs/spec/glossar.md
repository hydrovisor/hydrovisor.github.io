# Glossar: Fachbegriff und Name im Code

Stand 1.11.2026 · Auftrag 2 «Spezifikation». Bedeutungen stehen in Konzept v1.2 Kapitel 19; hier steht, wie ein Begriff im Code heisst. Regel (Konzept 11.2): fachliche Namen deutsch ohne Umlaute (ae, oe, ue, ss), in SQL `snake_case`, in TypeScript `camelCase` (Typen `PascalCase`); technische Namen englisch.

| Fachbegriff | SQL | TypeScript |
|---|---|---|
| Anlage | `anlage` | `Anlage`, `anlage` |
| Kürzel der Anlage | `anlage.kuerzel` | `kuerzel` |
| Datenart (echt, demo, test) | `datenart` | `Datenart` |
| Bereich (Ebene) | `bereich` | `Bereich` |
| Nutzbare Höhe über Deckel | `bereich.nutzbare_hoehe_mm` | `nutzbareHoeheMm` |
| Platz, Ort | `platz` (Rolle `platz_rolle`) | `Platz`, `Ort` (Union aus Gefäss, Anzuchtort, Messstelle) |
| Kennung | `platz.kennung`, `netztopf.kennung` | `kennung` |
| Etikett, Etikett-Code | `etikett`, `etikett.code` | `Etikett`, `etikettCode` |
| Gefäss (Belegung) | `gefaess` | `Gefaess` |
| Gefässmodell (Box), Deckeltyp (Deckel, Platte) | `gefaessmodell`, `deckeltyp` | `Gefaessmodell`, `Deckeltyp` |
| Löcher je Reihe | `deckeltyp.loecher_je_reihe` | `loecherJeReihe` |
| Betriebsart | `betriebsart` (`dwc`, `konstantpegel`, `kratky_belueftet`, `kratky`) | `Betriebsart` |
| Betriebsvolumen | `betriebsvolumen_l` | `betriebsvolumenL` |
| Station, feste Dosis | `gefaess.feste_dosis` | `istStation()` |
| Luftpumpe | `gefaess.luftpumpe` | `luftpumpe` |
| Prüfstatus | `gefaess_status`, `v_gefaess_status` | `Pruefstatus` |
| Füllzustand | `v_fuellzustand.fuellzustand` (`leer`, `loesung`) | `Fuellzustand` |
| Anzuchtort (Anzuchtbox) | `anzuchtort` | `Anzuchtort` |
| Messstelle W | `platz` mit Rolle `messstelle`, Kennung `W` | `Messstelle` |
| Netztopf, Heimplatz | `netztopf`, `heim_platz_id`, `heim_loch_nr` | `Netztopf`, `heimplatz` |
| Messgerät, Messunsicherheit | `messgeraet`, `u_ec`, `u_ph` | `Messgeraet`, `uEc`, `uPh` |
| Einstellung | `einstellung` | `Einstellungen` |
| Faktor k, k wirksam | `k_faktor` | `kFaktor`, `kWirksam()` |
| Quelle | `quelle` | `Quelle` |
| Kulturgruppe, Leitkultur der Gruppe | `kulturgruppe`, `leitkultur_art_id` | `Kulturgruppe` |
| Art | `art`, `art_schluessel` | `Art`, `artId` |
| Kulturform | `kulturform` | `Kulturform` |
| Sorte, Kulturtyp | `sorte`, `sorte_schluessel`, `kulturtyp` | `Sorte`, `Kulturtyp` |
| Profilwert, Grösse, Ebene | `profilwert`, `groesse`, `profil_ebene` | `Profilwert`, `Groesse` |
| Sollwert (aufgelöst), Vererbung | `v_sollwert` | `sollwert()` |
| Evidenzklasse, Vermerk | `evidenzklasse`, `vermerk` | `Evidenzklasse` |
| Pflichtgrösse, Vollständigkeit, Prüfauftrag | `pflichtgroesse`, `v_vollstaendigkeit` | `vollstaendigkeit()` |
| Saatempfehlung, Saatmengen-Skala | `saatempfehlung`, `klasse_saatmenge` | `Saatempfehlung` |
| Produkt (Grow, Micro, Bloom, pH-Minus) | `produkt` | `Produkt` |
| Düngerschema, Herstellerstadium | `duengerschema`, `stadium` | `Duengerschema`, `Stadium` |
| Wissenseintrag (Wissenskarte) | `wissenseintrag` | `Wissenseintrag` |
| Phase | `phase` | `Phase` |
| Saatgut (Packung) | `saatgut` | `Saatgut` |
| Satz, Folgesatz | `satz`, `v_folgesatz` | `Satz`, `istFolgesatz()` |
| Pflanzung, Schwamm | `pflanzung` | `Pflanzung` |
| Pflanzvorgang | `pflanzvorgang` | `Pflanzvorgang` |
| Keimprüfung, Keimansicht, Keimeingabe | Ereignis `keimung` | `keimVorgang()`, `keimAnsicht()`, `KeimEingabe` |
| Phasenfrage, Phasenstand, Phasenwechsel | Ereignis `phase_antwort` (`daten.phase`, `daten.antwort`) | `phasenStand()`, `phasenKarten()`, `antwortVorgang()`, `Fragekarte`; Prognose an einem Tag `phaseAm()` |
| Phasen nachführen, Profilende, Phasenfolge | `v_sollwert` (`dauer`, `wechselmerkmal`, `anwendbar`) | `nachfuehrVorgang()`, `PROFILENDE`, `phasenfolge()`, `NachfuehrZeile` |
| Datumskorrektur, Verlauf, Wissenskarte der Phase | `ersetzt_id`, `wissenseintrag` | `korrekturVorgang()`, `korrekturGrenze()`, `phasenVerlauf()`, `wissenFuer()` |
| Erntestand, Ernte möglich, Teilernte, Abernten | Ereignis `ernte` (`daten.art`), `art_kulturform` | `ernteStand()`, `ernteVorgang()`, `ernteAufgaben()`, `ErnteStand` |
| Kulturfrage, Kultur beenden oder verlängern | Ereignis `kultur_entscheid` am Satz | `kulturEntscheidVorgang()`, `kulturEntscheide()`, `verlaengerungTage()`, `VERLAENGERN_TAGE` |
| Blüte melden, Schossen-Handlung | Ereignisse `beobachtung` {kategorie: schossen}, `schossen_handlung`, `art.schossen_handlung` | `schossenVorgang()`, `SchossenHandlung` |
| Ausfall, Endzustand, Wiederherstellen | Ereignisse `abschluss`, `ernte` ab, `wiederherstellen` | `ausfallVorgang()`, `endzustand()`, `endeWiederherstellenVorgang()`, `endeRueckgaengig()`, `kuerzlichBeendet()` |
| Überlagerung nach dem Speichern | Bündelteile bis zum neuen Bündel | `teileNach()`, `zielbereichZeile()` (Spiegel von `v_zielbereich`) |
| Sollbereich, Pflanzenansicht, Wie weiter? | `v_sollwert` (Herkunft, Evidenzklasse) | `sollbereich()`, `sollText()`, `pflanzenAnsicht()`, `wieWeiter()`, `pflanzenVerlauf()` |
| Keimbilanz (Summe je Packung wie `v_keimrate`) | `v_keimrate.gesaet`, `gekeimt` | `keimbilanz()`, `keimrateGeglaettet()` |
| Keimt nicht, Wiederherstellen | Ereignis `abschluss {grund: keimt_nicht}`, `wiederherstellen` | `wiederherstellenVorgang()` |
| Stationseintritt (aus der Box auf die Station) | Ereignis `verschieben` | `stationsVorbelegung()`, `freieStationsloecher()` |
| Reservierung, geplantes Umsetzdatum, Vorgabe | `reservierung`, `umsetzen_geplant_am`, `umsetzen_vorgabe_am` | `Reservierung`, `umsetzenGeplantAm`, `umsetzenVorgabeAm` |
| Demo- oder Testdaten löschen | `datenart_loeschen()` | `datenartLoeschen` (nur Skript) |
| Direktsaat | `satz.direktsaat_platz_id` | `istDirektsaat()` |
| Passungs-Empfehlung, Einstufung | `pflanzung.einstufung`, `gruende` | `passung()`, `passungText()`, `Einstufung`, `GrundCode` (P1 bis P11), `LeitkulturBezug`, `passungKontext()`, `sortenPassung()`, `gefaessPassung()` (`src/domain/passung/`) |
| Zielbereich, Schnittmenge | `v_zielbereich`, Schnappschuss in `schnappschuss` | `zaehlendePflanzungen()`, `schnittmenge()`, `reservierteImGefaess()`; Zweck Passung `zaehlendeFuerPassung()`, `zielbereichPassung()`, Band-Hilfen `bandSchnitt()`, `restbreite()`, `bandmitte()`, `mindestbreiteEc()` (`src/domain/zielbereich*.ts`) |
| Mischentscheid | `mischentscheid` | `Mischentscheid` |
| Messung, Messart | `messung`, `messart` | `Messung`, `Messart` |
| Bewertung (grün, knapp, ausserhalb) | `bewertung` | `Bewertung` |
| Knapp-Zone | – | `knappZone()` |
| unsicher, veraltet | `v_messung_unsicher`; veraltet nur im Client | `istUnsicher()`, `istVeraltet()` |
| Kalibrierung | `kalibrierung`, `v_kalibrierung_faellig` | `Kalibrierung` |
| Nährlösungsansatz (Neuansatz, Nachfüllen, pH-Korrektur, Teilwechsel) | `naehrloesungsansatz`, `ansatz_typ` | `Ansatz`, `AnsatzTyp` |
| Abhakliste | `ansatz_schritt` | `Abhakliste` |
| Teil-Dosis, Restdosis | `teil_dosis` | `teilDosis()`, `restdosis()` |
| Inneres Band | – | `inneresBand()` |
| Frischwasser messen, ECWasser | Messart `frischwasser`, `v_ec_wasser` | `ecWasser` |
| Gesamt-EC | `ec_gesamt()` | `ecGesamt()` |
| Säurebedarf, pH-Wirkung | `v_saeurebedarf`, `v_ph_wirkung` | `saeurebedarf()`, `phWirkung()` |
| Nachfüllsumme | `v_nachfuellsumme` | `nachfuellsumme` |
| Ereignis | `ereignis`, `ereignis_typ` | `Ereignis` |
| Aufgabe, Aufgabenschlüssel (Plan 27) | – (berechnet), `aufgabe_schluessel` | `Aufgabe`, `Rohaufgabe`, `AufgabenTyp` (Tabelle R5.2 Stufe 1), `AufgabenArt` (mit Stromausfall), `Gewicht`, `faelligeAufgaben()`, `alleAufgaben()`, `naechsteAufgabe()`, `nurEcht()`, `titelNachGewicht()`, `aufgabenSchluessel()`, `schluesselLesen()`, `AUFGABEN_TEILE`, `fehlendeTeile()`, `einstellungenAus()` |
| Rundgang (Plan 30) | `ereignis` (`kurzpruefung`), `messung` (`messart` `rundgang`), `naehrloesungsansatz` (`nachfuellen`) | `RundgangPlan`, `RundgangEbene`, `RundgangOrt`, `RundgangStand`, `RundgangSchritt`, `rundgangPlan()`, `ortsfolge()`, `laufwegRang()`, `rundgangStart()`, `nachKurzpruefung()`, `nachMessung()`, `nachNachfuellen()`, `amEnde()`, `rundgangBeenden()`, `kurzpruefungPunkte()`, `kurzpruefungVorgang()`, `nachfuellSchritt()`, `kratkySchritt()`, `nachfuellVorgang()`, `abschlussliste()`, `abschlussKopf()` |
| Heute-Karte (Plan 30) | – (berechnet) | `Ortskarte`, `heuteKarten()`, `ausserhalbOrte()`, `startzeitMedian()` |
| Verteilung der Ansätze, vorziehbar (R5.6, Plan 113) | – (berechnet) | `vorziehbar`, `ANSATZ_TYPEN`, `MAX_ANSAETZE_JE_TAG`, `ansaetzeHeute()`, `verteilen()`, `Verteilt`, `verteilteAufgaben()`, `fruehestens`; Messmaske im Modus Korrektur: `Ablaufmodus.korrektur`, `eingabeAus()` |
| Nach Stromausfall (Plan 30) | `ereignis` (`stromausfall {beginn, ende}`, `anlage_id`) | `StromTyp`, `STROM_TYPEN`, `MORGEN_STROM`, `STROM_GRENZE_STUNDEN`, `stromausfallAufgaben()`, `stromausfallVorgang()` |
| Aufschub (Morgen, Überspringen, Pegel ok) | `aufschub` | `AufschubZeile`, `MORGEN`, `UEBERSPRINGEN`, `ERLEDIGT_KNOPF`, `aufschubVorgang()`, `erledigtVorgang()`, `deckelVorgang()` |
| Keimtermine eines Satzes (Plan 27) | – (berechnet) | `KeimTermin`, `keimTermine()` |
| Tagesliste | `aufgabe_tagesliste` | – (nur Edge Function) |
| Kurzprüfung | Ereignis `kurzpruefung` | `Kurzpruefung` |
| Rundgang | – | `Rundgang` (Ablauf) |
| Wechselblock | – | `wechselblock()` |
| Push-Abo, Sammel-Push, Versand | `push_abo`, `push_versand` | `PushAbo` |
| Etikettaufruf (Scan) | `etikett_aufruf` | – |
| KI-Feldprotokoll | `ki_feldprotokoll` | `KiFeld` |
| Auswertungsfenster | `auswertung_fenster` | – |
| Kalendertag | `kalendertag()` | `kalendertag()` |
| Schreibweg | – | `schreiben()` |
| Offline-Bündel, Warteschlange | – | `buendel`, `warteschlange` (IndexedDB) |
| Vorgang (Schritte einer Erfassung, je Zeile idempotent) | – | `Vorgang`, `Schritt` (`neu`, `storno`) |
| Ergebnis des Schreibens | – | `Schreibergebnis` (`gespeichert`, `abweichend`, `nicht_gespeichert`) |
| Stand des Bündels («Stand: hh:mm») | – | `Buendel.stand`, `standAnzeige()` |
| Kalibrierstand (Erstkalibrierung, gültig, fällig, überfällig) | `v_kalibrierung_faellig` | `Kalibrierstand`, `kalibrierStand()`, `istUnsicher()` |
| Messfälligkeit | – | `Messfaelligkeit`, `messFaelligkeit()` |
| Messeingabe (Ziffernblock) | – | `Messeingabe`, `eingabeTippen()` |
| Sammel-Push, Lauf der Function | `push_versand` | `pushLauf()`, `sammelFaellig()`, `wiederholungErlaubt()` |
| Inhalt der Pushes (I1b-06) | – | `sammelInhalt()`, `kurzpruefungOffen()`, `kurzpruefungInhalt()`, `timerInhalt()`, `tageslisteZeilen()` |
| Beschreibung und Kürzung der Bündelteile | – | `BUENDEL_TEILE`, `teileKuerzen()` |
| Zustellung je Tag (UC8-AK8, EK5) | `v_push_zustellung` | `ZustellungTag`, `ek5Anteil()` |
| E-Mail-Rückfall | `einstellung.email_rueckfall` | `Mailer`, «E-Mail, wenn Push fehlt» |
| Push-Stand in Heute | `push_abo`, `push_versand` | `pushStand()`, `PushStand` |
| Quittung der Push | `push_versand.angezeigt_am`, `geoeffnet_am` | `quittieren()`, `signaturText()` |
| Tütenfelder (Schema der Saattüte) | `ki_feld` | `TuetenFelder`, `TUETEN_SCHEMA`, `antwortPruefen()`, `feldTexte()` |
| Tüte lesen (KI-Aufruf mit Ausweichmodell) | `ki_aufruf` | `tueteLesen()`, `KiErgebnis`, `ModellRufer` |
| Übernahme ins Formular, Feldstatus | `ki_feldprotokoll.status` | `kiUebernehmen()`, `feldStatus()` |
| Bewertung im Eval | `ki_feldprotokoll.bewertung_eval` | `feldBewerten()`, `auswerten()`, `defaultWaehlen()` |
| Ort aus dem Etikett-Code | – | `Ort`, `ortAufloesen()`, `messbareOrte()` |
| Edge Functions | `push-taeglich`, `push-quittung`, `ki-tuete` | – |
| Zugriff | `zugang`, `ist_tim()` | – |
| Umsetzen, Sämling, Zieltopf (Plan 33) | Ereignisse `umsetzen`, `umsetzdatum_geaendert`, `ernte`, `abschluss` | `umsetzAnsicht()`, `wieGeplant()`, `umsetzZiele()`, `alleFreienWaehlen()`, `umsetzEingabePruefen()`, `umsetzVorgang()`, `umsetzZusammenfassung()`, `umsetzAufgaben()` |
| Verschieben, Tausch, Wurzelregel (Plan 33) | Ereignisse `verschieben`, `tausch` (`vorgang_id`) | `verschiebenPruefen()`, `verschiebZiele()`, `verschiebAnsicht()`, `verschiebVorgang()`, `umgesetztAm()`, `HINWEIS_WURZELN` |
| Topf und Deckel (Plan 33) | `v_netztopf_platz`, `netztopf` | `topfOrt()`, `pflanzungenImTopf()`, `lochGroesse()`, `topfPasst()`, `deckelBelegung()`, `DeckelLoch` |
| Deckel-Hilfen und Typen (Plan 33) | – | `lochText()`, `lochArt()`, `lochName()`, `deckelReihen()`, `istStation()`, `UmsetzEingabe`, `Saemling` |
| Hydroponik-Recherche (Plan 37, E8) | `ki_aufruf.zweck`, Vermerk `recherche`, `wissen_app_schreiben('recherche_wert' \| 'recherche_saatempfehlung')` | `rechercheLuecken()`, `wertPruefen()`, `saatPruefen()`, `recherchieren()`, `RechercheErgebnis` |
| Sortenerfassung (Plan 37) | `sorte`, `saatgut`, `ki_feldprotokoll`, `v_vollstaendigkeit` | `SortenFormular`, `formularNachKi()`, `erfassungBauen()`, `sortenListe()`, `sortenDetail()` |
