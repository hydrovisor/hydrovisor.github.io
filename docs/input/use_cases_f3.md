# **Hydrovisor – Vorschläge Use Cases**

**Fassung 3 vom 23.10.2026, angeglichen an Konzept v0.3.** Grundlage der Spezifikation. Fassung 2 vom 19.10.2026 bleibt unverändert erhalten.  
**Neu in Fassung 3 (23.10.2026):** Alle Entscheide bis zum Konzept v0.3 sind eingearbeitet: Anlage als oberste Ebene (K18); Gefässe, Box- und Deckelvorlagen erfasst Tim in der App statt per Startdaten-Skript (K19, K20; K1 und K2 aufgehoben); neuer UC14 «Etiketten erzeugen, drucken, scannen» mit QR-Etikett je Platz (K21, K22); Prüfablauf je Gefäss mit Status «in Prüfung» und «in Betrieb» (K23); Installation und Tests nur mit Chrome (K24); Düngerrechner mit Herstellerdosis als Rechenbasis und EC als Kontrolle (K25); Sondenpflege, Mischregeln, 15 Minuten Wartezeit, Kratky-Regeln und Kontrollmessung am Folgetag (K26); Messwerte «veraltet» und «unsicher» (K27); Kurzprüfung im Rundgang; Umfang ohne UC10, UC11 und UC13 (Folge-CAS KI, entschieden am 20.10.2026). Aufwand und Zeitplan sind nachgerechnet: Kern rund 21.25 PT plus 2.75 PT für Anlage und Etiketten, Erweiterungspool bei 5.9 PT gedeckelt. Nachtrag 23.10.2026: Passungs-Empfehlung K28 (+0.75 PT Kern), Begriff «Schritt» statt «Bildschirm», Dezimalpunkt in App und Dokumenten, Wissensbasis W0, Einrichtungs-Checkliste K29, Säen ab Januar K30, kein fester Zielbereich je Gefäss. Nachtrag 27.10.2026: K31 Folgesätze und Probelauf W0 («Satz duplizieren» im Kern, \+0.25 PT; Kern rund 25.25 PT netto, rund 29.0 PT mit Zuschlag; Umsetzung in Claude Code im Terminal). Nachtrag 28.10.2026: Zeitplan Z2 mit Start am 1.11.2026 (K32, E19; Nachtrag am Ende des Dokuments).  
**Lesehilfe.** (A) \= Annahme ohne Beleg. **Umfang** in PT (Personentag) misst die Grösse eines Bausteins als Arbeit im Dialog mit Claude Code; er dient nur zum Vergleich der Bausteine untereinander. Tims eigene Zeit bei Umsetzung durch das Agenten-Team steht in A5. Fachbegriffe stehen im Glossar (C6). Teil A fasst Stand und Entscheide zusammen, Teil B beschreibt die Use Cases im Detail, Teil C enthält die Anhänge. Bei Widerspruch gilt das Konzept v0.3.

# **Teil A – Stand und Entscheide**

## **A1 Worum es geht**

Tim fand die Use Cases im Fachkonzept zu wenig konkret und wünschte umsetzbare Vorschläge, besonders zur Bedienung am Regal. Fassung 1 und 2 entstanden aus einer Recherche über rund 70 Apps samt Usability-Richtlinien, einer Kritik aus drei Blickwinkeln (Bedienung am Regal, Umfang und Aufwand, Fachlichkeit der Hydroponik) und einem unabhängigen Review. Der Marktvergleich vom 21.10.2026 (zwei Agenten-Läufe, Lauf 2 als Grundlage) und der Vorschlag «Anlagen, Gefässe und QR-Etiketten» vom 23.10.2026 sind in Konzept v0.3 übernommen. Fassung 3 bringt die Use Cases, Abläufe und Akzeptanzkriterien auf diesen Stand. Alle Entscheide sind getroffen; offen sind nur die Prüfpunkte des Gerätetests im Dezember (A6).

## **A2 Die zehn wichtigsten Punkte**

| Nr. | Punkt | UCs | Herkunft | Klasse |
| :---- | :---- | :---- | :---- | :---- |
| 1 | **Anlage als oberste Ebene, Maske «Gefäss» als Arbeitsplatz.** Das Indoor-Regal (Kürzel R) ist die erste Anlage; Bereiche (Ebenen) und Gefässe hängen darunter. Aufgaben hängen am Gefäss und ergeben sich aus dem Erfassten; die Maske «Gefäss» zeigt die Kennung sehr gross, gleich geschrieben wie auf dem Etikett. | 1, 8 | K6, K18 | Kern |
| 2 | **Regal selbst erfassen und prüfen.** Vorlagen für Box und Deckel (Löcher je Reihe, Loch 1 vorne links), Assistent mit vier Schritten je Gefäss, Prüfablauf am Regal mit Status «in Prüfung» und «in Betrieb»; das Volumen wird beim ersten Füllen auf ±10 % bestätigt. | 2, 3 | K19, K20, K23 | Kern |
| 3 | **QR-Etikett je Platz.** 70 × 42 mm, QR-Link auf den Ort und Kennung in 20 mm Schriftgrösse (Ziffern rund 14 mm hoch); Druck über den Druckdialog von Android auf den Epson WF-3820 oder als PDF; ein Scan öffnet die Maske «Gefäss» oder «Säen». | 14 | K21, K22 | Kern |
| 4 | **Messmaske ohne Scrollen.** Drei Kacheln, eigener grosser Ziffernblock, Schieber als Anzeige des Sollbands, Trendzeile je Kachel; nach dem dritten Wert wird der Ziffernblock zur Ergebniszone. Zeitziel 15 Sekunden je Gefäss. | 9 | E4, M41, M42 | Kern |
| 5 | **Rundgang mit Kurzprüfung und Abschlussliste.** Gefäss für Gefäss: Kurzprüfung (Pumpe sprudelt, Luftzone), messen, dann nachfüllen; am Ende alle Abweichungen mit Massnahme. | 7, 8, 9 | K13, M38 | Kern |
| 6 | **Düngerrechner nach Herstellerdosis.** Mengen aus der Herstellerdosis je Stadium, Soll-EC als Kontrolle, Skalierung auf den Zielbereich nur bei Abweichung; Mengen in Tims Messmitteln; Untergrenze Leitungswasser; eigene Kratky-Regel. | 7 | K25, M24, M26, M33 | Kern |
| 7 | **Geführter Lösungswechsel.** Abhakliste mit den Herstellerregeln (schütteln, einzeln einrühren, Messbecher spülen, pH vor EC), 15 Minuten Wartezeit, Kontrollmessung am Folgetag; bis k stabil ist, zuerst 85 % dosieren. | 7, 9 | K12, K26, M27 | Kern |
| 8 | **Messwerte «veraltet» und «unsicher».** Nach Nachfüllen oder Wechsel nutzt der Rechner den letzten Wert nicht mehr; bei überfälliger Kalibrierung werden neue Werte als «unsicher» gespeichert. | 7, 9 | K27, M22, M31 | Kern |
| 9 | **Anzucht mit Zieltopf, satzweise.** Zieltopf wahlweise schon bei der Aussaat reserviert, sonst beim Umsetzen gewählt; Pflanzvorschlag als Passungs-Empfehlung (K28) nach Schnittmenge zum Zeitpunkt des Umsetzens, Kulturgruppe und Systemeignung, ohne Sperren; Sicherheitszuschlag aus der Keimrate; Verschieben und Tauschen von Töpfen gleicher Grösse. | 5, 6 | K16, N2, M48 | Kern |
| 10 | **Nur Chrome, ein Sammel-Push pro Tag.** Installation als WebAPK mit Chrome, dauerhafter Speicher, Bildschirm bleibt in allen Abläufen an; ein Sammel-Push mit Anzahl Aufgaben im Titel aufs Honor Magic5 Pro. | 8, alle | K5, K24, M13, M14, M16 | Kern |

Etappe A umfasst elf Use Cases: UC1 bis UC9 und UC14 sind Muss, UC12 ist Soll. UC10, UC11 und UC13 sowie die Erfassung des Ertrags folgen im Folge-CAS KI.

## **A3 Tims Schieber (entschieden mit E4)**

**Tims Idee:** pH und EC beim Erfassen mit einem Schieberegler einstellen statt tippen.  
**Für den Schieber spricht:** Er zeigt auf einen Blick, wo ein Wert im Sollbereich liegt, und braucht keine Bildschirmtastatur; Pool-Apps nutzen solche Skalen (Orenda, Pool Care). In einer Studie zur Zahleneingabe (Oladimeji et al. 2011\) entstanden mit Plus/Minus-Tasten 1.56 unbemerkte Fehleingaben je 100 Zahlen, mit einem Ziffernblock 3.61; verglichen wurden allerdings Plus/Minus und Ziffernblock, nicht der Schieber. Baymard empfiehlt einen Schieber zusammen mit einem Zahlenfeld.  
**Gegen den Schieber spricht:** Die Auflösung ist zu fein (pH 5.0 bis 7.5 in Schritten von 0.1 auf rund 330 dp ergibt 13 dp je Schritt, EC in Schritten von 0.05 nur 5.5 dp; ein Finger trifft erst ab rund 48 dp sicher). Mit Wasser auf dem Bildschirm misslangen im Versuch RainCheck 21 % der Gesten. Ein Schieber steht immer irgendwo, «nicht gemessen» und «gleich wie letztes Mal» sind dann nicht zu unterscheiden. Die Nielsen Norman Group rät von Schiebern ab, wenn der genaue Wert zählt.  
**Entscheid (E4):** Eingabe über einen grossen eigenen Ziffernblock mit ± zur Feinkorrektur; der Schieber erscheint als Anzeige des Sollbands in jeder Kachel. Der Regaltest A bis D zu Beginn der Messmaske entscheidet endgültig.  
  \<---------------- 360 dp \-----------------\>  
\+----------------------------------------------+  
\| 2.3  Salate · DWC          \[nicht geprüft\] \[x\]\|  Kopf 48 dp, Kennung 40 sp  
\+---------------+---------------+--------------+  
\| pH            \| EC mS/cm      \| °C           \|  Kacheln 132 dp  
\|    6.7        \|    1.4\_       \|    \_\_.\_      \|  Werte 40 sp  
\| Knapp daneben \|               \|              \|  Status mit Wort und Symbol  
\| vorher 6.4 ↗  \| vorher 1.3    \| vorher 20.5  \|  Trendzeile, Pfeil ab 0.2 pH / 0.1 EC  
\| \-\[=\|==\]--o-   \| \--\[===\]---    \| \-\[===\]--     \|  Sollband, \| vorher, o neu  
\+-----------+-----------+-----------+----------+  
\|     7     \|     8     \|     9     \|    \<-    \|  Ziffernblock 4 x 72 dp  
\|     4     \|     5     \|     6     \|   \-0.1   \|  Tasten 83 x 68 dp  
\|     1     \|     2     \|     3     \|   \+0.1   \|  
\|     .     \|     0     \|   weiter  \|  leeren  \|  
\+----------------------------------------------+  
\|                 Speichern                    \|  72 dp  
\+----------------------------------------------+  
  Nach dem dritten Wert ersetzt die Ergebniszone den Ziffernblock.

*Lesart:* Die Felder starten leer; der vorherige Wert erscheint als Trendzeile und als Marke auf der Spur. Status immer mit Wort und Symbol: «Im grünen Bereich», «Knapp daneben», «Ausserhalb». Ausser Kopf, Kacheln, Ziffernblock und Speichern ist höchstens ein Hinweisbanner sichtbar (etwa «Kalibrierung überfällig: Werte unsicher»), auch bei Systemschrift 130 %. Das Honor Magic5 Pro hat mehr Höhe als die Skizze; massgebend ist das Platzbudget.  
**Regaltest (rund 0.35 PT, mit der echten Maske, umschaltbar):** A Ziffernblock mit ± (Empfehlung); B nur ± ab dem letzten Wert; C Antippen der Spur, dann ±; D Tims ursprüngliche Idee, Schieber als Haupteingabe mit Einrasten. Je Variante 5 Eingaben mit nassen Fingern, ein grosser Sprung (6.1 → 7.4) und ein Lesetest aus 80 cm. Gewählt wird die Variante mit den wenigsten unbemerkten Fehlern, bei Gleichstand die schnellere.

## **A4 Entschiedener Umfang**

> * **UC10 Export: Folge-CAS KI.** Die Datensicherung leisten Supabase Pro und das verschlüsselte GitHub-Backup. Für Kapitel 6 genügen Auswertungsabfragen in Supabase, als CSV abrufbar (Erweiterung, C3).  
> * **UC11 Notizen und Foto-Tagebuch: Folge-CAS KI** (entschieden am 20.10.2026, ersetzt E9 vom 19.10.2026). Fotos macht Tim ab der ersten Aussaat ohne App: frontal, gleiche Distanz, Licht an, Dateiname «JJJJ-MM-TT\_Gefäss»; sie sind die Bildbasis für den Folge-CAS KI.  
> * **UC13 Symptom-Check: Folge-CAS KI.** Vorbereitet durch die Massnahmen bei Messabweichungen (UC9) und die Mangelbilder in UC12.  
> * **Ertrag je Sorte: Folge-CAS KI.** **Keimrate je Schwamm: Kern** (UC6).  
> * **Neu: UC14 Etiketten: Muss** (entschieden am 23.10.2026).

## **A5 Umfang und Zeitplan**

Nachtrag 28.10.2026: Zeiträume und Meilensteine ersetzt durch den Zeitplan Z2, siehe Nachtrag am Ende des Dokuments (K32, E19). **Zeitplan gemäss Folie «Zeitplan» der Dispositiv-Präsentation und Konzept v0.3.** Hardware: bestellt am 17.10.2026, Bau November bis Dezember, Regal im Dezember in Betrieb. App: Fachkonzept und Spezifikation November bis Dezember, Konten Ende November, Grundgerüst und Risikotests im Dezember, Umsetzung Januar bis Februar, ab 1.3.2027 nur noch Fehlerbehebungen. Testbetrieb Januar bis April, Abgabe Ende April 2027\.

| Inkrement | Inhalt | Zeitraum | Meilenstein |
| :---- | :---- | :---- | :---- |
| I0 Grundgerüst und Risikotests | Projekt, Hosting mit Hash-Routing, Anmeldung mit lang gültiger Sitzung, Datenmodell mit Anlage und Zugriffsregeln (Kern), Startdaten-Skript mit Wissen und einem Testgefäss, Demo-Datensatz-Skript, einfache Messung, Push-Test, KI-Test mit drei Saattüten, App mit Chrome installiert, dauerhafter Speicher, Hochformat; Gerätetest QR-Link, Druck auf den Epson und Etikettenbogen; Pro2-Anleitung prüfen; Startdaten-Skript lädt die freigegebene Wissensbasis W0 | Dezember | M0 Ende Dezember: Push an 5 Tagen in Folge, KI liest 3 von 3 Tüten, App installiert, Gerätetest durchgeführt, Wissensbasis W0 freigegeben, Zeit und Verbrauch je Arbeitspaket und Rolle gemessen |
| I1a Anlage, Gefässe, Etiketten, Prüfung | UC1 Anlage und Übersicht, UC2 Vorlagen mit Deckelgrafik, UC3 Assistent, Ändern, Entfernen, Prüfablauf, UC14 Etiketten, Einrichtungs-Checkliste (K29); danach erfasst, druckt, klebt und prüft Tim das Regal | Januar, erste Hälfte | Regal erfasst, alle Gefässe «in Betrieb» |
| I1b Messen, Düngen, Erinnern | UC9 Messmaske mit Ergebniszone, UC7 Rechner und Abhakliste, UC8 Heute, Rundgang mit Kurzprüfung, Timer, Sammel-Push, Seite «Einstellungen», Maske «Gefäss», Regaltest A bis D, einfaches Säen und Keimung prüfen (K30), «Satz duplizieren» für Folgesätze (K31) | Januar | M1 Ende Januar: eine Woche ohne Papier |
| I2 Sorten, Pflanzen, Phasen | UC4 mit KI und den 22 Tüten, UC5 mit Zieltopf und Umsetzen, UC6 mit Keimungsprüfung, Ernte, Verschieben und Tauschen, Zielbereich berechnet, Offline-Warteschlange, UC12 nach Zeit | Februar | M2 Ende Februar: App Stufe 1, alle Muss-UCs am Regal vorgeführt |
| I3 Härten | Fehler aus dem Betrieb, Auswertungsabfragen, Erweiterungen nach C3 | ab 1.3.2027 | nur noch Fehlerbehebungen |

Die erste Aussaat Anfang Januar erfasst Tim direkt in der App mit dem einfachen «Säen» aus I1 (K30); die Nacherfassung mit Rückdatierung bleibt für Ausnahmen. Gepflanzt wird erst mit dem Testbetrieb: zuerst Tomate und Chili, gleichzeitig ein erster Satz Nüsslisalat und Kräuter, danach alle 2 Wochen ein Folgesatz mit «Satz duplizieren» (K31). Den Kräuter-Mix je Gefäss schlägt die Passungs-Empfehlung (K28) vor.  
**Umfang der Bausteine** (Vergleichsgrösse, Schätzung)

| Posten | Umfang |
| :---- | :---- |
| Kern Fassung 2: alle Muss-Funktionen UC1 bis UC9, inklusive Zieltopf, Verschieben und Keimrate je Schwamm | 18.75 PT |
| Kern-Zuwachs aus dem Marktvergleich (fast alles als Abnahmekriterien in bestehenden Paketen, ein Paket Demo-Datensatz) | rund 2.5 PT |
| **Kern Konzept v0.3** | **rund 21.25 PT** |
| Anlage, Erfassung in der App, Etiketten und Prüfung (UC1 bis UC3, UC14; Skript entlastet) | rund 2.75 PT |
| **Kern gesamt Etappe A** | **rund 25.25 PT inklusive Passungs-Empfehlung (K28, \+0.75 PT), Einrichtungs-Checkliste (K29, \+0.25 PT) und «Satz duplizieren» (K31, \+0.25 PT); mit 15 % für Zusammenbau, Gerätetests und Fehlerbehebung rund 29.0 PT** |
| Erweiterungen nach Zeit (Pool, Liste in C3) | 5.9 PT, gedeckelt: neue Kandidaten verdrängen alte |

**Tims Zeit, wenn das Agenten-Team umsetzt.** Je Arbeitspaket (A): Auftrag und Akzeptanzkriterien freigeben 15 min, Plan prüfen 15 min, am Gerät und am Regal abnehmen 30 min, Prüfbefunde entscheiden und zusammenführen 15 min, zusammen rund 1¼ Stunden. Nach M0 gibt Tim Pläne nur noch bei Datenbank und Fachlogik frei.

| Inkrement | Arbeitspakete | Tims Zeit (Schätzung) | pro Woche |
| :---- | :---- | :---- | :---- |
| I0 Dezember | 8, dazu Einrichtung (Supabase-Organisation, Schlüssel, GitHub, Gerät) 6 h, Fehlersuche Push und KI 4 h, Gerätetest QR und Druck rund 2 h (zusammen 22 h) | rund 22 h | rund 5 h |
| Inhalte: Wissensbasis W0 prüfen und freigeben (rund 6 bis 8 h), Wissenskarten und Deckel aus den Bohrplänen (rund 4 h) | – | rund 12 h, November bis Januar | rund 1 bis 2 h |
| I1 Januar | 14 plus 3 für Anlage, Etiketten und Prüfung plus 1 Demo-Datensatz; dazu Fehlersuche 4 h, Regaltest 2 h, Grundaufnahme des Regals rund 2 h, Drucken, Kleben und Prüfen rund 2 h; Demo-Datensatz spart rund 1.5 h | rund 31 h | rund 7 h |
| I2 Februar | 16, dazu Fehlersuche 4 h; Demo-Datensatz spart rund 1 h | rund 23 h | rund 6 h |
| **Summe Dezember bis Februar** | **rund 42** | **rund 88 h (Spanne 68 bis 108 h)** | **rund 5 bis 8 h** |

Das entspricht dem Konzept v0.3: rund 80 h aus Fassung 2, rund 8 bis 9 h mehr für Anlage, Erfassung und Etiketten, rund 2 bis 3 h weniger dank Demo-Datensatz, also rund 86 h; dazu kommen rund 2 h für den Gerätetest im Dezember. Der Januar liegt mit rund 7 h pro Woche über dem Rahmen von rund 6 h (E1); Ausgleich: die Inhalte möglichst ganz im Dezember erstellen und bei Bedarf die Sparhebel aus C2 nutzen. Nicht eingerechnet ist die Arbeit am Fachkonzept im November und Dezember. Am Messpunkt M0 wird die tatsächliche Zeit je Arbeitspaket gemessen und der Plan angepasst; reicht die Zeit nicht, fallen zuerst die Erweiterungen weg.

## **A6 Entscheide**

**Stand 27.10.2026: Alle Entscheide sind getroffen. Nachtrag 28.10.2026: E19 Zeitplan Z2, siehe Nachtrag am Ende des Dokuments.** Offen sind nur die Prüfpunkte des Gerätetests im Dezember.

> * **E1 Zeit und Plan (20.10.2026):** rund 6 h pro Woche von Dezember bis Februar, im Dezember weniger; Plan O1 gemäss Folie.  
> * **E2 Grundsätze der Umsetzung (19.10.2026):** Aufgaben ergeben sich aus dem Erfassten; ohne Netz wird nur die Messung gespeichert. Punkt (c) «Startdaten per Skript» gilt seit 23.10.2026 nur noch für Wissen (Sorten, Profile, Düngerschema), ein Testgefäss und den Demo-Datensatz (K19).  
> * **E3 Zuschnitt der Use Cases (19.10.2026):** Titel wie im Konzept; die Maske «Gefäss» gehört zu UC1, Ernte, Beenden, Verschieben und Tauschen zu UC6; Rundgang, Lösungswechsel, Anzucht und Inbetriebnahme sind Abläufe über bestehende UCs. Seit 23.10.2026 kommt UC14 dazu.  
> * **E4 Messmaske und Schieber (19.10.2026):** Ziffernblock-Maske mit Schieber als Anzeige des Sollbands; der Regaltest A bis D entscheidet.  
> * **E5 Geräte (20.10.2026):** Tims persönliches Android-Telefon Honor Magic5 Pro (6.81 Zoll, IP68) in einer abnehmbaren Halterung am Regal, installiert mit Chrome; es empfängt auch die Push-Nachrichten. Kalender-Abo nur als Rückfallebene.  
> * **E6 bis E8 Konzeptänderungen K1 bis K15 (19.10.2026):** angenommen; K1 und K2 am 23.10.2026 durch K19 aufgehoben, K9 durch K25 ersetzt (siehe C5).  
> * **E9 Umfang (20.10.2026):** UC10, UC11, UC13 und Ertrag im Folge-CAS KI; Keimrate im Kern.  
> * **E10 Fachliche Klärungen (20.10.2026):** Jungpflanzenstation mit fester Dosis 0.5 ml/L je Teil, Band Leitungswasser \+ 0.3 bis 0.6 (K25); Kräuter in DWC alle 14 Tage wechseln; Gerät auf mS/cm.  
> * **E11 Netztopf-Kennung, Anzucht und Verschieben (20.10.2026):** (a) die Kennung bleibt auf dem Topfrand beim Topf, die App führt den aktuellen Platz; (b) Zieltopf bei der Aussaat wählbar und dann reserviert, sonst beim Umsetzen gewählt; (c) Töpfe gleicher Grösse verschieben und tauschen, «Neu beschriften» macht den neuen Platz zum Heimplatz.  
> * **E12 Konzept v0.3 (23.10.2026):** K18 bis K27 übernommen; Etikett gehört zum Platz; nur QR, nur Chrome, Druck über den Android-Druckdialog; kein NFC, kein Scanner in der App, kein Bluetooth-Druck; Kurzbefund «Algen, Geruch, Wurzeln» im Folge-CAS.  
> * E13 Passungs-Empfehlung (23.10.2026): K28 übernommen. Die App empfiehlt statt zu sperren: «Empfohlen», «Möglich», «Nicht empfohlen» zum Zeitpunkt des Umsetzens, in beiden Richtungen (Gefäss → Sorten, Sorte → Gefässe), ohne Rückfrage.  
> * E14 Wissensbasis W0 (23.10.2026): Inhalte nur aus Hydroponik-Quellen, erarbeitet vor der Umsetzung von einem Agenten-Team mit festen Rollen (Koordinator, Rechercheure je Kulturgruppe, Methodenprüfer, Quellenprüfer, Fachkritiker, Redaktor) nach dem Dokument «Hydrovisor – Vorgehen Wissensbasis W0»; der Redaktor legt je Konflikt einen Freigabevorschlag mit zwei Alternativen vor, Tim entscheidet im Terminal (Claude Code) oder ergänzt im freien Feld; Probelauf erste Pflanzrunde (Tomate, Chili, Nüsslisalat, Kräuter) im November (K31), Freigabe bis M0.  
> * E15 Ersteinrichtung (23.10.2026): K29 übernommen; die Einrichtungs-Checkliste wechselt aus dem Erweiterungspool in den Kern.  
> * E16 Säen ab Januar (23.10.2026): K30 übernommen; einfaches Säen und Keimung prüfen in I1, die Liste für die erste Aussaat entfällt.  
> * E17 Zahlenformat (23.10.2026): Dezimalpunkt in der App und im Fliesstext aller gültigen Dokumente.  
> * E18 Folgesätze und Probelauf W0 (27.10.2026): K31 übernommen; «Satz duplizieren» wechselt aus dem Erweiterungspool in den Kern (I1b, \+0.25 PT); gepflanzt wird erst ab dem Testbetrieb, zuerst Tomate und Chili, gleichzeitig Nüsslisalat und Kräuter, danach alle 2 Wochen ein Folgesatz; den Kräuter-Mix je Gefäss schlägt die Passungs-Empfehlung (K28) vor; der W0-Probelauf umfasst die erste Pflanzrunde; Umsetzung und W0 laufen in Claude Code im Terminal, nicht in Claude Cowork.

**Prüfpunkte im Gerätetest Dezember (rund zwei Stunden):** QR-Link öffnet die installierte App (sonst Etiketten nur als Beschriftung, kein Scanner als Ersatz); Druck vom Honor auf den Epson WF-3820 und Einzug eines Etikettenbogens (Papierfach 50 bis 80 g/m², Wasserfestigkeit prüfen, sonst laminieren); Genauigkeit, Auflösung und Dezimalen des P160 Pro2 laut Anleitung. Im Testbetrieb: Richtwert «Liter je Pflanze» je Art.

# **Teil B – Use Cases im Detail**

**Aufbau:** Konzept → Ziel, Auslöser, Ablauf, Varianten → Akzeptanzkriterien (AK) mit Prüfart (Glossar C6) → Bedienung → Herkunft und Inkrement. K-Nummern stehen in C5, M-Nummern verweisen auf «Marktvergleich und Ergänzungen (Lauf 2)».

## **B0 Bedienmuster U1 bis U14**

| Nr. | Muster | Regel |
| :---- | :---- | :---- |
| U1 | Messmaske | Kacheln und eigener Ziffernblock (Skizze A3), Systemtastatur zu; Dezimalpunkt automatisch (pH und EC eine Vorkommastelle, °C zwei); die App zeigt Zahlen nach de-CH mit Punkt (pH 6.1, EC 1.4 mS/cm), wie im Design System festgelegt; Fokus springt nach der eingestellten Zahl Dezimalen weiter; ± für Feinkorrektur; «x» oder Android-Zurück verwerfen keine Eingabe. Platzbudget: ausser Kopf, Kacheln, Ziffernblock und Speichern höchstens ein Hinweisbanner und eine Trendzeile je Kachel; nach dem dritten Wert ersetzt die Ergebniszone den Ziffernblock |
| U2 | Leer starten | Ein leeres Feld heisst «nicht gemessen» und wird nicht gespeichert |
| U3 | Plausibilität und Genauigkeit | Harte Grenzen pH 0 bis 14, EC 0 bis 10 mS/cm, °C 0 bis 50; Rückfrage bei Sprung pH über 1.0 oder EC über 0.8 ohne Lösungswechsel; Geräteeinheit fest, intern mS/cm. Als Abweichung gilt erst, was über der Messgenauigkeit liegt; Trendpfeil erst ab 0.1 mS/cm oder 0.2 pH |
| U4 | Rückgängig statt Rückfrage | 10 s «Rückgängig» nach Messung, Pflanzen, Verschieben, Ernte und Beenden, immer an derselben Stelle; sonst bearbeiten oder löschen über das Menü, nie per Wischen |
| U5 | Status | Drei Stufen des Design Systems «Im grünen Bereich», «Knapp daneben», «Ausserhalb», je mit Wort, Symbol und Farbe; Kennzeichen «veraltet» und «unsicher» als Wort mit Symbol; Status nie nur über Farbe |
| U6 | Lesbarkeit | Erfassungsmasken und Heute: Kennung und Werte mindestens 40 sp, Status mindestens 28 sp, Rest mindestens 21 sp (lesbar aus 50 bis 80 cm); Übersicht 28 sp mit Symbolen; Tasten am Regal mindestens 68 dp; nur Antippen als Pflichtgeste |
| U7 | Timer und Wake Lock | Der Bildschirm bleibt in Rundgang, Düngerrechner, Abhakliste, Gefässprüfung und Timer eingeschaltet, beim Timer bis Ende plus 2 min; Timer rechnet gegen die absolute Endzeit; Ton und Vibration am Ende; Countdown oben in Heute. Standardwartezeit 15 Minuten |
| U8 | Sammel-Push | Ein Push pro Tag zur eingestellten Zeit mit der Anzahl Aufgaben im Titel, weil Android am App-Symbol keine Zahl zeigt; erste Zeile allein verständlich; ersetzt die Vortagesmeldung; dieselbe Aufgabe löst am selben Tag keine zweite Nachricht aus; Versandprotokoll; Test-Push in den Einstellungen; Demo-Daten erscheinen nie |
| U9 | Erledigen durch Erfassen | Eine passende Erfassung verschiebt die Fälligkeit; «Erledigt» gibt es nur für Aufgaben ohne Daten (Abdeckung entfernt, kalibriert) |
| U10 | Offline nur Messungen | Warteschlange mit dauerhaftem Speicher und eindeutiger Kennung je Messung; Zustände «wartet», «gesendet», «fehlgeschlagen»; «Stand: hh:mm» auf Heute, Gefäss und Pflanze; Warnung in Heute, wenn die Warteschlange alt ist |
| U11 | Zeiten und Grund | «seit 2 Tagen überfällig», «Lösung 12/14 Tage», «Tag 5 von 4–8»; je Aufgabe der Grund («DWC alle 3 Tage · zuletzt vor 4 Tagen»); leer: «Noch nie gemessen» → «Erstmessung» |
| U12 | Gerät am Regal | Honor Magic5 Pro, Hydrovisor mit Chrome als WebAPK installiert; Hochformat im Manifest, sichere Bereiche; Anzeige als App ohne Adresszeile; abnehmbare Halterung auf 105 bis 140 cm; am Regal nie eine erneute Anmeldung; Chrome-Daten nie löschen |
| U13 | Schutz vor Fehltipps | Doppeltipps auf demselben Element kurz sperren, jede getippte Ziffer gross wiederholen |
| U14 | Erfassung am Schreibtisch | Anlage, Gefässe, Vorlagen, Sorten und Etiketten werden selten und mit trockenen Händen erfasst; dort ist die Systemtastatur erlaubt, Tippflächen mindestens 48 dp |

## **UC1 Anlage abbilden**

**Konzept:** Übersicht je Anlage wie am realen Regal (Ebene 4 oben bis 1 unten), je Gefäss eine Kachel mit Kennung, Belegung, Status und Lösungsalter, dazu die Messstelle «W» und die Anzuchtorte; Heute zeigt die Aufgaben aller Anlagen. Ein Tipp öffnet die Maske «Gefäss», den Arbeitsplatz am Regal.

> * **Ziel:** Tim findet jedes Gefäss am selben Ort und mit derselben Kennung wie am Regal und auf dem Etikett; mehrere Anlagen lassen sich führen, ohne dass sich die erste verändert.  
> * **Auslöser:** Navigation «Anlage»; Antippen in Heute; Scan eines Etiketts (UC14); Einstellungen → «Anlagen verwalten».  
> * **Ablauf Anlage anlegen (einmalig, am Schreibtisch):** 1\. Name (z. B. «Indoor-Regal»), Kürzel (R), Standort indoor oder outdoor, Lichtstunden (nur indoor). 2\. Leitungswasser-EC mit Datum (bis zur Messung bei der Inbetriebnahme Annahme 0.5 mS/cm, danach vierteljährlich neu). 3\. Bereiche anlegen: beim Regal Ebene 1 bis 4 mit Standard-Anbausystem (DWC auf 1 und 2, Kratky auf 3 und 4), Lichtleisten und Luftpumpe. 4\. Gefässe und Anzuchtorte folgen mit UC3; der Laufweg ist vorbelegt in der Reihenfolge der Erfassung und in der Anlage änderbar (A).  
> * **Ablauf Übersicht:** 1\. Anlage mit Bereichen von oben nach unten; je Gefäss eine Kachel mit Kennung, Belegung, Status mit Wort und Symbol, «Lösung 12/14 Tage» und Prüfstatus («nicht geprüft», solange «in Prüfung»); dazu «W» für Leitungswasser und eine Zeile «Anzucht» mit R-A, R-B und R-Z. 2\. Antippen öffnet die Maske «Gefäss».  
> * **Ablauf Maske «Gefäss»:** 1\. Kopf mit der Kennung sehr gross, gleich geschrieben wie auf dem Etikett, dazu System, Volumen und Zielbereich. 2\. Letzte Messung mit Bewertung und Trendzeile, bei Bedarf «veraltet, neu messen» oder «unsicher»; Lösungsalter; offene Aufgaben. 3\. Ein grosser Knopf für die nächste fällige Handlung («Jetzt: Messen», 72 dp), darunter Nachfüllen, Wechseln, Pflanzen (56 dp). 4\. Deckelgrafik mit Kennungen der Töpfe und Satzauswahl.  
> * **Varianten:** ohne Netz «Stand: hh:mm»; nie gemessen → «Erstmessung»; Gefäss ruht → grau mit Text; Gefäss «in Prüfung» → Hinweis «nicht geprüft» und Aufgabe «Gefäss prüfen»; zweite Anlage → Auswahl der Anlage erscheint, Heute gruppiert nach Anlage; Outdoor-Felder (Saisonfenster) bleiben in Etappe A leer. Einrichtungs-Checkliste (K29): Solange die Einrichtung nicht abgeschlossen ist, zeigt Heute oben eine Checkliste in fester Reihenfolge: 1\. Anlage anlegen, 2\. Leitungswasser-EC messen, 3\. Messgerät kalibrieren, 4\. Vorlagen für Box und Deckel, 5\. Gefässe und Anzuchtorte erfassen, 6\. Etiketten drucken und kleben, 7\. Gefässe prüfen, 8\. erste Aussaat. Jeder Punkt öffnet den passenden Ablauf und hakt sich durch die Erfassung selbst ab; danach verschwindet die Checkliste.  
> * **AK:** (1) \[E2E\] Übersicht mit 11 Gefässen, «W» und der Zeile «Anzucht» ohne Scrollen; Kachel mindestens 72 × 80 dp, Kennung mindestens 28 sp. (2) \[E2E\] In der Maske «Gefäss» sind Kopf, Zustand und Hauptknopf ohne Scrollen sichtbar; Aufgaben und Deckelgrafik dürfen scrollen. (3) \[Gerät\] Vom Antippen bis zur vollständigen Darstellung höchstens 1 s (Warmstart, Median aus 5). (4) \[E2E\] Kein Status nur über Farbe. (5) \[E2E\] Eine zweite Anlage (T) lässt sich anlegen, ohne dass sich Daten oder Kennungen von R ändern; Heute gruppiert danach nach Anlage, vorher nicht. (6) \[Unit\] Das Kürzel einer Anlage ist nach dem ersten Etikettendruck nicht mehr änderbar. (7) \[SQL\] Kennungen sind je Anlage eindeutig; 2.3 auf R und 2.3 auf T sind verschiedene Gefässe. (8) \[E2E\] Solange die Einrichtung nicht abgeschlossen ist, zeigt Heute die Checkliste mit acht Punkten; jeder Punkt hakt sich durch die passende Erfassung selbst ab, danach verschwindet sie.  
> * **Bedienung:** U5, U6, U11, U14.  
> * **Herkunft und Inkrement:** K18 (Anlage), K6 (Arbeit am Gefäss); Muss · I0 (Datenmodell mit Anlage), I1a (Anlage, Übersicht, Maske «Gefäss»).

## **UC2 Vorlagen für Box und Deckel**

**Konzept:** Boxen (Innenmasse, Betriebsvolumen) und Deckeltypen (Topfdurchmesser, Löcher je Reihe, Service-Öffnung) in der App erfassen; die sieben Deckeltypen D1 bis D4, D6, Z1 und Z2 erfasst Tim aus den Bohrplänen des Aufbauplans. Deckelgrafik mit Loch 1 vorne links, Auswahl ganzer Sätze, Reihen oder «alle freien».

> * **Ziel:** Jede Vorlage ist in höchstens 2 Minuten erfasst; die Grafik zeigt die Löcher in der richtigen Reihenfolge und dient der Orientierung, nicht der Massgenauigkeit.  
> * **Auslöser:** Inbetriebnahme; selten eine neue Box oder ein neuer Deckel; Schritt 2 und 3 des Assistenten in UC3.  
> * **Ablauf Box:** Name (z. B. «RAKO 40 × 30 × 17»), Innenmasse Länge, Breite, Höhe in mm, Betriebsvolumen in Litern; die App schlägt das Betriebsvolumen aus Länge × Breite × Füllhöhe vor.  
> * **Ablauf Deckel:** Name (z. B. «D6»), Topfdurchmesser 5 oder 8 cm, Löcher je Reihe von vorne nach hinten (D6: «2, 2, 2»; versetzt etwa «2, 3, 2»), Service-Öffnung ja oder nein. Die Grafik erscheint sofort: Loch 1 vorne links, zeilenweise nach hinten (D6: 1 und 2 vorne, 3 und 4 Mitte, 5 und 6 hinten). Grundlage sind die Bohrpläne des Aufbauplans V8.15: D1 (4 × 8 cm), D2 (6 × 8 cm), D3 (8 × 5 cm), D4 (2 × 8 cm), D6 (6 × 5 cm), Z1 (15 × 5 cm), Z2 (7 × 8 cm).  
> * **Deckelgrafik im Betrieb:** Über der Grafik Satz-Chips («Lollo (6)», «alle freien») und Zeilenköpfe; an jedem Loch die Kennung des Topfs, der dort steht; reservierte Löcher markiert.  
> * **Varianten:** Eine Vorlage, die von Gefässen genutzt wird, lässt sich nicht löschen, nur umbenennen; Löcher passen geometrisch nicht auf die Box (Reihen × Durchmesser plus Abstand) → Hinweis beim Zuordnen in UC3.  
> * **AK:** (1) \[Unit\] Eingabe «2, 2, 2» mit 5 cm erzeugt 6 Löcher, Loch 1 vorne links, Nummern 1 bis 6 zeilenweise nach hinten. (2) \[Unit\] Die abgeleiteten Lochnummern entsprechen für alle sieben Deckeltypen den Bohrplänen V8.15. (3) \[E2E\] Jedes Loch der Grafik ist mindestens 48 dp gross. (4) \[Gerät\] Die sieben Deckeltypen sind in je höchstens 2 Minuten erfasst. (5) \[SQL\] Nach der Erfassung des Regals zählen die 11 Gefässe 66 Löcher (22 × 8 cm auf Ebene 1 und 2, 44 × 5 cm auf Ebene 3 und 4); die Zusatzbox mit Z1 oder Z2 zählt als Anzuchtort.  
> * **Bedienung:** U14.  
> * **Herkunft und Inkrement:** K19 (Erfassung in der App statt Skript, hebt K1 auf), K20 (Löcher je Reihe statt Koordinaten); Satzauswahl ist in UC5 gerechnet. Muss · I1a.

## **UC3 Gefäss erfassen, ändern, prüfen, entfernen**

**Konzept:** Assistent mit vier Schritten (Platz, Box, Deckel, Zusammenfassung); die App leitet die Topfkennungen ab und schlägt das Betriebsvolumen vor. Prüfablauf «Gefäss prüfen» mit Status «in Prüfung» und «in Betrieb». Ändern von Intervallen, Volumen und System; Box- oder Deckeltausch nur ohne Pflanzen oder bei gleichem Lochbild; Entfernen nur ohne aktive Pflanzung. Seite «Einstellungen».

> * **Ziel:** Jeder Platz trägt genau ein Gefäss mit Box, Deckel, System, Volumen und Intervallen, damit Rechner, Bewertung und Aufgaben ab dem ersten Tag stimmen; erst die Prüfung am Regal bestätigt die Erfassung.  
> * **Auslöser:** Inbetriebnahme; Umbau; Aufgabe «Gefäss prüfen».  
> * **Ablauf Erfassen (Assistent):**  
  1. **Platz:** Anlage (vorbelegt), Bereich (z. B. Ebene 2), Position (1 links, 2 Mitte, 3 rechts), System (vorbelegt aus dem Bereich). Prüfung: Kennung 2.3 ist in der Anlage frei.  
  2. **Box:** Vorlage wählen oder neu (UC2). Prüfung: Betriebsvolumen kleiner als Länge × Breite × Höhe.  
  3. **Deckel:** Vorlage wählen oder neu (UC2); Grafik mit Nummern. Prüfung: Löcher passen in die Box, Topfgrösse 5 oder 8 cm.  
  4. **Zusammenfassung:** Kennung, Box, Deckel, Töpfe 2.3.1 bis 2.3.6, Volumen, Intervalle aus der Systemvorlage (DWC: messen alle 3 Tage, nachfüllen alle 2, wechseln alle 14; Kratky: messen alle 3 Tage, einmal je Satz ansetzen, Dauerkultur alle 28 Tage wechseln). Knöpfe «Speichern und Etikett drucken» oder «Speichern».

> Beim Speichern legt die App die Netztöpfe mit ihrer Kennung (Heimplatz) und Grösse an, setzt den Status «in Prüfung», erzeugt den Etikett-Code (R-2.3) und die Aufgabe «Gefäss prüfen».

> * **Anzuchtorte:** Im selben Assistenten mit der Rolle «Anzuchtort»: Anzuchtbox A (Lichtkeimer) und B (Dunkelkeimer) mit Schwammbögen, Zusatzbox 40 × 30 × 12 cm mit Deckel Z1 oder Z2 und wechselndem Standort (Phase 1 auf Ebene 4 links, später Fensterbank). Codes R-A, R-B, R-Z. Die Jungpflanzenstation ist Gefäss 4.2 (R-4.2).  
> * **Ablauf Gefäss prüfen (am Regal, je Schritt ein Tipp, Bildschirm bleibt an):** 1\. Etikett scannen: die App bestätigt «Richtiges Gefäss: 2.3»; öffnet sich ein anderes Gefäss oder nichts, ist das Etikett falsch gedruckt oder geklebt. 2\. Deckel vergleichen: Anzahl Löcher, Loch 1 vorne links; «Stimmt» oder «Stimmt nicht» (zurück zu Schritt 3 des Assistenten). 3\. Topfgrösse: ein Netztopf der erfassten Grösse sitzt im Loch. 4\. Volumen: beim ersten Füllen die Kannen bis zur Betriebsmarke zählen; weicht das Ergebnis mehr als 10 % vom Betriebsvolumen ab, schlägt die App die Korrektur vor. Schritt 4 darf auf den ersten Lösungsansatz verschoben werden. Danach «in Betrieb, geprüft am …», das Prüfprotokoll bleibt gespeichert.  
> * **Ändern:** Intervalle, Volumen und System jederzeit. Box oder Deckel tauschen nur, wenn das Gefäss leer ist oder das Lochbild (Anzahl und Grösse der Löcher) gleich bleibt; nach einem Tausch von Box oder Deckel geht der Status zurück auf «in Prüfung».  
> * **Entfernen:** nur ohne aktive Pflanzungen und Reservierungen; sonst zeigt die App, welche Sätze zuerst umzusetzen oder zu beenden sind. Status «entfernt», Messungen und Verlauf bleiben; die App erinnert daran, das Etikett abzuziehen. Ein neues Gefäss am selben Platz übernimmt Kennung und Etikett.  
> * **Seite «Einstellungen»:** Vorlauf n für Phasenwechsel, Push-Zeit, Test-Push, Kannengrösse, Messmittel (Spritzen 1 ml und 5 ml, Messbecher), k je Stadium, Messgerät (Einheit, Dezimalen), Ruhe-Status je Gefäss; Einstiege «Anlagen verwalten» und «Etiketten».  
> * **Varianten:** Gefäss ruht → keine Pflegeaufgaben; Prüfschritt «Stimmt nicht» → Aufgabe bleibt offen, Grund im Protokoll.  
> * **AK:** (1) \[E2E\] Ein Gefäss ist in höchstens 4 Schritten erfasst. (2) \[Unit\] Eine doppelte Kennung in derselben Anlage wird abgelehnt; Betriebsvolumen über Länge × Breite × Höhe wird abgelehnt. (3) \[Unit\] Entfernen mit aktiver Pflanzung oder Reservierung wird verhindert; nach dem Entfernen bleibt der Verlauf abrufbar und der Status ist «entfernt». (4) \[Unit\] Gefüllt 8.0 l statt erfasster 9 l (−11 %) → Vorschlag «Betriebsvolumen auf 8.0 l ändern»; 8.5 l (−5.6 %) → kein Vorschlag. (5) \[E2E\] Nach den vier Prüfschritten steht das Gefäss auf «in Betrieb» mit Datum, die Aufgabe «Gefäss prüfen» ist weg. (6) \[Unit\] Ein Deckeltausch auf ein anderes Lochbild ist mit Pflanzen im Gefäss gesperrt. (7) \[Unit\] Wechselintervall 14 → 10 Tage verschiebt «Wechsel fällig» auf letzten Neuansatz \+ 10\. (8) \[E2E\] Ein Intervall lässt sich in höchstens 5 Berührungen ändern.  
> * **Bedienung:** Erfassen U14; Prüfen am Regal U6, U7.  
> * **Herkunft und Inkrement:** K19 (hebt K2 auf), K23 (Prüfstatus), K7 (ganze Tage). Muss · I1a (Assistent, Ändern, Entfernen, Prüfung), I1b (Einstellungen).

## **UC4 Saatgut erfassen**

**Konzept:** Sorte mit Shop-Link, Keimart, Keimtemperatur, Keimdauer, Aussaatfenster, Bestand und Saatempfehlung mit Evidenzstufe; pH, EC und Phasen aus den Profilen von Art und Kulturgruppe. KI-Hilfe aus Foto der Saattüte oder kopiertem Text, Tim bestätigt. Ohne bestätigte Saatempfehlung gilt die Sorte nicht als vollständig erfasst.

> * **Ziel:** Tim erfasst Sorte und Packung; die KI liest nur, was auf der Tüte steht.  
> * **Auslöser:** neue Tüte; Kontrollerfassung der 22 Startsorten.  
> * **Ablauf:** 1\. «Neue Sorte»: Foto von Vorder- und Rückseite (im Browser verkleinert, privat gespeichert) oder kopierter Text. 2\. Die KI-Funktion liefert Felder nach festem Schema: Name, Art, Keimart, Keimtemperatur min und max, Keimdauer, Kulturdauer, Aussaatfenster in Monaten, Hersteller; je Feld auch «nicht gefunden». pH, EC und Phasen sieht das Schema nicht vor. 3\. Tim bestätigt die Art; die Sorte erbt Profil, Systemeignung und Saatempfehlung. 4\. Saatempfehlung nach der Prüfreihenfolge A bis D (Fachlogik Punkt 8); Angaben der Tüte gelten meist für Erde und höchstens als Stufe C. 5\. Packung: Shop-Link, Kaufdatum, Keimfähigkeit laut Packung, Bestand in Korn. 6\. Speichern mit Feldprotokoll (übernommen, geändert, leer) und Dauer.  
> * **Varianten:** KI-Fehler, kein Netz oder über 30 s → von Hand, Eingaben bleiben; Keimart der Tüte weicht vom Profil ab → markiert, die Tüte gilt; Sorte existiert → nur neue Packung.  
> * **AK:** (1) \[Unit\] Die Antwort entspricht dem Schema; pH, EC und Phasen lassen sich nicht setzen. (2) \[Unit\] Bei Fehler oder Zeitüberschreitung bleiben alle Eingaben erhalten. (3) \[Eval\] Ein Skript über die gespeicherten Tütenfotos meldet die Trefferquote je Feld. (4) \[SQL\] Jede Sorte hat Art, bestätigte Saatempfehlung mit Stufe und Quelle, Packung und Feldprotokoll.  
> * **Bedienung:** U14; die App warnt beim Säen, wenn der Bestand nicht reicht.  
> * **Herkunft und Inkrement:** K3. Muss · I0 (KI-Test mit 3 Tüten; die 22 Startsorten kommen per Skript, damit die Aussaat im Januar sie kennt), I2 (Maske; Tim erfasst die 22 Tüten, das Skript dient als Referenz).

## **UC5 Pflanzen**

**Konzept:** Satzweise säen, Anzuchtort nach Keimart vorbelegt, Zieltöpfe wahlweise antippen. Pflanzvorschlag als Passungs-Empfehlung (K28) nach Schnittmenge zum Zeitpunkt des Umsetzens inklusive reservierter Töpfe, Systemeignung und Saatempfehlung mit Sicherheitszuschlag; höchstens drei Schritte; Nacherfassung mit Rückdatierung.

> * **Ziel:** Tim sät satzweise und kann jeder Pflanze schon bei der Aussaat ihren Zieltopf zuweisen (Kennung vom Topfrand, z. B. 2.3.4); Konflikte in der Nährlösung des Zielgefässes sieht er dann sofort. Er kann den Zieltopf auch offen lassen.  
> * **Auslöser:** Aussaat in Anzuchtbox A oder B; Scan von R-A oder R-B (öffnet «Säen» mit vorgewähltem Ort); Direktsaat im Zielgefäss (Babyleaf, Spinat); Nachsaat; Nacherfassung.  
> * **Ablauf (Malmodus):** 1\. «Säen» in Heute, in der Maske «Gefäss», in der Zeile «Anzucht» oder per Scan. 2\. Sorte wählen: zuletzt genutzte Sorte als erste Option («Wie letztes Mal»), dann alle Sorten mit Einstufung «Empfohlen», «Möglich» oder «Nicht empfohlen» (K28): bewertet mit dem Sollbereich der Sorte in der Phase beim geplanten Umsetzen gegen den Zielbereich des Gefässes an diesem Datum (Wachstumsstand der Pflanzen darin, reservierte Töpfe eingeschlossen), nach verbleibender Breite von pH und EC (Mindestbreite 0.3, entschieden am 23.10.2026; bei einer EC-Genauigkeit des Pro2 über 0.15 mS/cm das Doppelte der Genauigkeit), Abstand der Bandmitten, gleicher Kulturgruppe, Systemeignung, Liter je Pflanze und freien Löchern der richtigen Grösse; «Nicht empfohlen» eingeklappt mit Grund, aber mit einem Tipp wählbar, ohne Rückfrage. Gegenrichtung: Wird zuerst die Sorte gewählt, sind die Gefässe nach derselben Einstufung geordnet. 3\. Zieltöpfe antippen (wahlweise; «Ziel später» überspringt den Schritt): Zielgefäss, dann Löcher, Zeilenköpfe oder «alle freien»; nur Töpfe der passenden Grösse. 4\. Anzuchtort: vorbelegt nach Keimart; entfällt bei Direktsaat. 5\. Datum heute, Samen je Schwamm und «Pflanzen stehen lassen» aus der Saatempfehlung, Anzahl Schwämme mit Sicherheitszuschlag aus der Keimrate (für vier Zieltöpfe je nach Keimrate fünf bis sechs); Keimart, Keimtemperatur und Keimdauer sichtbar, bei Dunkelkeimern «abdecken». 6\. Einmal speichern; Rückgängig 10 s. Gewählte Zieltöpfe sind im Zielgefäss «reserviert».  
> * **Weg des Sämlings** (Aufbauplan V8.15): Nach der Keimung kommt der Schwamm auf die Jungpflanzenstation (4.2 mit D6 oder Zusatzbox mit Z1, beide 5 cm; Zusatzbox mit Z2 für 8 cm). Ziel 5 cm: gleich in den Zieltopf, der bis zum Umsetzen in 4.2 oder auf Z1 steht. Ziel 8 cm: direkt in den 8-cm-Zieltopf auf Z2 oder zuerst in einen 5-cm-Anzuchttopf; die App zeigt am Platz «→ 2.3.4». Erfasst bei der Keimungsprüfung (UC6).  
> * **Umsetzen:** Mit dem Wechsel von Anzucht zu Wachstum erscheint «Umsetzen» mit dem Knopf «Wie geplant umsetzen». Sämlinge ohne Zieltopf weist Tim hier einem Zielgefäss und Platz zu, mit derselben Prüfung der Schnittmenge und Systemeignung. Saatdatum, Phase und Verlauf bleiben. Hinweise: 8-cm-Topf mit gespültem Blähton 8 bis 16 mm, DWC-Startstand Topfboden 1 bis 2 cm im Wasser, 5 bis 7 Tage von oben angiessen; Kratky: Topfboden 1 cm eintauchen.  
> * **Varianten:** «Ziel später»: beim Umsetzen schlägt die App freie Löcher der passenden Grösse vor. Laufendes Kratky-Gefäss als Ziel: «Erreicht die Lösung den Netztopfboden?» → Nein: anderes Gefäss. Keine Schnittmenge → «Nicht empfohlen» mit Grund, mit einem Tipp wählbar, ohne Rückfrage; die Wahl steht im Verlauf, entschieden wird erst beim Ansetzen der Nährlösung (Mischentscheid). Freie Löcher in einem Gefäss → die Maske «Gefäss» zeigt «Passt hierhin» mit den besten drei Sorten aus dem Bestand. Nicht gekeimt → Reservierung wird frei. Datum in der Vergangenheit → Nacherfassung. Zielgefäss «in Prüfung» → Hinweis, Pflanzen trotzdem möglich.  
> * **AK:** (1) \[E2E\] 6 Zieltöpfe in 2.3 mit 2 Sorten, Anzucht in Box A, in höchstens 14 Berührungen und 3 Schritten. (2) \[Unit\] Ein reservierter Topf zählt zur Schnittmenge; Spinat (EC 1.5 bis 1.8) für 3.1 mit Nüsslisalat (0.8 bis 1.2) erscheint als «Nicht empfohlen». (3) \[E2E\] «Wie geplant umsetzen» setzt 5 Sämlinge mit 1 Berührung plus Bestätigung an ihre Zieltöpfe; Saatdatum, Phase und Verlauf unverändert, beide Zielbereiche neu. (4) \[Unit\] Ein 8-cm-Zieltopf lässt sich nicht als Platz auf D6 oder Z1 wählen. (5) \[Unit\] Eine rückdatierte Pflanzung erzeugt keine Aufgabe vor dem Erfassungstag. (6) \[SQL\] Jede Pflanzung speichert Zieltopf (darf leer sein), Anzuchtort, Rang im Vorschlag, Einstufung beim Setzen und Erfassungsdauer. (7) \[E2E\] Ein Satz ohne Zieltopf mit 5 Sämlingen wird beim Umsetzen in höchstens 3 Schritten zugewiesen; bei leerer Schnittmenge erscheint dieselbe Einstufung «Nicht empfohlen». (8) \[Unit\] Tomate erscheint für ein Kratky-Gefäss als «Nicht empfohlen». (9) \[Unit\] Vier Zieltöpfe bei Keimrate 70 % ergeben 6 Schwämme, bei 90 % 5 (A, Regel nach Fachlogik Punkt 8). (10) \[Unit\] Sorte mit pH 5.8 bis 6.0 für ein Gefäss mit Zielbereich pH 6.0 bis 6.5 → Schnittmenge 0 breit → «Nicht empfohlen»; Sorte gleicher Kulturgruppe mit verbleibender Breite mindestens 0.3 in pH und EC → «Empfohlen». (11) \[Unit\] Bewertet wird mit dem Sollbereich der Phase beim geplanten Umsetzen (Saat plus typische Anzuchtdauer) und dem Zielbereich des Gefässes an diesem Datum, nicht mit den Werten von heute. (12) \[E2E\] Sorte zuerst gewählt → Gefässe nach Einstufung geordnet; ein Gefäss mit freien Löchern zeigt «Passt hierhin» mit höchstens drei Sorten aus dem Bestand. (13) \[E2E\] Setzen einer «Nicht empfohlen»-Sorte braucht keine zusätzliche Berührung ausser dem Aufklappen.  
> * **Bedienung:** Sorte zuerst, dann Plätze; erst mit trockenen Händen planen, dann säen; Bildschirm bleibt an.  
> * **Herkunft und Inkrement:** K4 (Schritt \= eine Ansicht, die man mit «Weiter» verlässt), K16 (Zieltopf, Anzuchtorte), N2 (Systemeignung), M48 (Sicherheitszuschlag). Muss · I1b einfaches Säen (K30: Sorte, Anzuchtort nach Keimart, Datum, Saatmenge, Zieltopf wahlweise; noch ohne Passungs-Empfehlung) und «Satz duplizieren» für Folgesätze (K31, M46), I2 der Rest (Passungs-Empfehlung, Gegenrichtung, Umsetzen).

## **UC6 Pflanzenansicht**

**Konzept:** Je Satz oder Topf Tag seit Saat, Phase mit «Tag y von min–max», Sollwerte mit Herkunft und Verlässlichkeit, Zielbereich des Gefässes, nächster Schritt; Aktionen je Satz: Phase bestätigen, Keimung prüfen, Teilernte, Abernten, Ausfall, Umsetzen, Verschieben und Tauschen.

> * **Ziel:** Tim sieht je Satz oder Topf Phase, Sollwerte und den nächsten Schritt und erledigt die Satzaktionen mit wenigen Berührungen.  
> * **Auslöser:** Topf oder Satz antippen; Aufgaben «Phase bestätigen», «Keimung prüfen», «Umsetzen», «Ernte möglich».  
> * **Ablauf:** 1\. Satz oder Topf wählen. 2\. Sorte, Topfkennung und Platz («2.3.4, steht auf 2.3.4» oder «3.3.5, steht in 4.2»), «Tag x seit Saat» (Saattag \= Tag 0), Phase aus dem festen Katalog (Keimung, Anzucht, Wachstum, Blüte, Fruchtbildung und Reife) mit «Tag y von min–max». 3\. Sollbereich der Pflanze neben dem Zielbereich des Gefässes, mit Herkunft (Sorte, Art, Kulturgruppe, Standard) und Verlässlichkeit; nächste Phase mit Datumsfenster und Wechselmerkmal. 4\. Aktionen je Satz: «Phase wechseln», «Noch nicht» (+2 Tage), «Teilernte», «Abernten», «Umsetzen», «Verschieben»; im Menü «Ausfall» mit Grund. 5\. Nach der Bestätigung: Zielbereich neu, Prüfung der Schnittmenge, Folgetermine ab dem bestätigten Datum, Wissenskarte der neuen Phase (UC12). 6\. Nach dem letzten Topf eines Gefässes: «Wie weiter?» \[Neu bepflanzen\] \[Lösung wechseln\] \[Gefäss ruht\].  
> * **Keimung prüfen:** Je Schwamm tippt Tim, wie viele Samen gekeimt sind (0 bis n, vorbelegt, überspringbar). Schwämme mit 0 werden mit «keimt nicht» beendet, ihre Reservierung wird frei. Danach tippt er die Plätze auf der Jungpflanzenstation an (vorbelegt). Die beobachtete Keimrate wird der zuletzt verwendeten Packung zugeordnet.  
> * **Verschieben und Tauschen:** Topf antippen → «Verschieben» → Ziel-Loch antippen, im selben oder einem anderen Gefäss. Frei: der Topf wechselt; belegt: die beiden Töpfe tauschen. Die Töpfe behalten ihre Beschriftung; die Deckelgrafik markiert Töpfe ausserhalb ihres Heimplatzes («2.3.1 auf 2.3.4»). «Neu beschriften» macht den neuen Platz zum Heimplatz.  
> * **Varianten:** über der Höchstdauer → Hinweis aus dem Phasenwissen; falsch bestätigt → «korrigieren» mit Datum; einmalige Ernte schliesst die Pflanzung ab, Mehrfachernte lässt sie in ihrer Phase; Blüte bei Blattgemüse ist Schossen → Hinweis; Verschieben in ein anderes Gefäss → beide Zielbereiche neu, nur gleiche Topfgrösse; ein Topf aus der Anzucht in ein 8-cm-Loch nur über «Umsetzen».  
> * **AK:** (1) \[Unit\] Saat 01.01., Keimung 4 bis 8 Tage → am 06.01. «Tag 5 von 4–8», am 10.01. ohne Bestätigung Hinweis «prüfen». (2) \[Unit\] 6 Schwämme à 2 Samen, Eingaben 2, 2, 1, 2, 0, 2 → 9 von 12 Samen (75 %), 1 Schwamm beendet, Reservierung frei. (3) \[E2E\] Tausch zweier Töpfe in 2.3 in höchstens 4 Berührungen; Deckelgrafik und Verlauf zeigen den Tausch. (4) \[Unit\] Verschieben eines 5-cm-Topfs auf ein 8-cm-Loch wird abgelehnt. (5) \[Unit\] Nach dem Beenden ist keine Aufgabe der Pflanzung mehr fällig, der Zielbereich ist neu berechnet. (6) \[E2E\] Phase je Satz in höchstens 2 Berührungen; jede Bestätigung und Korrektur steht mit Datum im Verlauf.  
> * **Bedienung:** U4; zwei Knöpfe «Teilernte» und «Abernten» statt einer Rückfrage.  
> * **Herkunft und Inkrement:** K8, K14, K16; Phasenkatalog und Ernte als Ereignis gemäss Lösungsvorschlag Phasenmodell. Muss · I1b «Keimung prüfen» (K30), I2 der Rest.

## **UC7 Düngerrechner**

**Konzept:** Geführter Neuansatz und Nachfüllen; Mengen primär aus der Herstellerdosis je Stadium, Soll-EC als Kontrolle (Leitungswasser plus k · D), bei Bedarf auf den Zielbereich skaliert; Mengen in Tims Messmitteln; Abhakliste mit Herstellerregeln; bis k stabil ist, zuerst 85 %; Nachfüllen je Giesskanne mit Mischformel und Untergrenze Leitungswasser; Kratky mit eigener Regel; Jungpflanzenstation mit fester Dosis; nach Nachfüllen oder Wechsel gilt der letzte Messwert als veraltet.

> * **Ziel:** Die App rechnet Micro, Grow und Bloom für Neuansatz und Nachfüllen, zeigt sie in Spritzen und Kannen und führt mit einer Abhakliste durch das Mischen.  
> * **Auslöser:** Aufgabe «Lösung wechseln» (Ablauf Lösungswechsel), «Nachfüllen» oder «Pegel prüfen» (Ablauf Rundgang); Maske «Gefäss».  
> * **Rechenbasis (K25):** 1\. Stadium \= Phase der meisten Pflanzen, bei Gleichstand die frühere; Tim kann übersteuern; bei leerer Schnittmenge entscheidet er sichtbar (Mehrheit, andere Phase, Kompromiss). 2\. Dosis D und Anteile ak aus der Herstellertabelle für Hydroponik und Kokos; Vk \= D · ak · V mit V \= Betriebsvolumen. 3\. Kontrollwert ECSoll \= ECWasser \+ k · D (k Startwert 0.3 mS/cm je ml/L, je Stadium). 4\. Liegt ECSoll ausserhalb des Zielbereichs, skaliert die App D auf die Mitte: D \= (ECZiel − ECWasser) / k, Ziel nie unter ECWasser \+ 0.3. 5\. Die Hersteller-EC gilt als Zuwachs über dem Leitungswasser; geführt wird immer die Gesamt-EC.  
> * **Ablauf Neuansatz (Abhakliste, jede Zeile antippbar, Haken nur in fester Reihenfolge):** Absaugen · Frischwasser x l, temperiert · Micro: Flasche schütteln, Menge, einzeln einrühren · Messbecher spülen · Grow · spülen · Bloom · umrühren · Timer 15 min · pH messen und mit pH-Minus einstellen (Ersteinstellung, zählt nicht als Korrektur) · Timer 15 min · pH und EC messen (Kontrollmessung, UC9) · Restdosis bis Ziel · umrühren, Timer 15 min · Endmessung pH, dann EC. Jeder Haken übernimmt die Soll-Menge als Ist-Menge; «Menge ändern» öffnet den Ziffernblock. Die Reihenfolge Micro, Grow, Bloom ist bewährte Praxis, nicht Herstellerangabe; Konzentrate nie direkt mischen.  
> * **Teil-Dosis und k:** Solange k für das Stadium nicht stabil ist (zwei bis drei Ansätze mit Abweichung unter 0.1 mS/cm), dosiert die App zuerst 85 %. kIst \= (ECIst − ECWasser) / Ist-Dosis; «k für dieses Stadium übernehmen?» (eine Berührung) nur, wenn sich die EC um mindestens 0.3 mS/cm verändert hat. Danach 100 % mit Kontrollmessung.  
> * **Korrektur nach dem Mischen:** EC zu tief → alle drei Teile im gleichen Verhältnis um 10 % nachdosieren, erwarteter Wert angezeigt; EC zu hoch → Wasser nachfüllen, höchstens bis zum Arbeitsvolumen, sonst «keine Korrektur möglich»; Verdünnen mit Leitungswasser hebt den pH.  
> * **Nachfüllen DWC:** Dosis je Kanne nach der Messung davor: über Ziel nur Wasser, im Ziel halbe Dosis, darunter volle Dosis; «Wie viele Kannen?» \[1\] … \[n\], n begrenzt durch das freie Volumen; Nachfüllwasser auf Lösungstemperatur. Wasser bis zur Ziel-EC: VWasser \= V1 · (EC1 − ECZiel) / (ECZiel − ECWasser); das Ziel muss zwischen Leitungswasser-EC und aktueller EC liegen, sonst «mit Wasser allein nicht erreichbar».  
> * **Kratky:** erst unter einem Drittel Füllstand nachfüllen, nie bis zur Startmarke, höchstens 2.5 cm (Box 40 × 30 cm rund 3 l, 30 × 20 cm rund 1.5 l); Wasser, wenn die EC über dem Band liegt, sonst halbe Konzentration; vor jeder Messung umrühren; kein Verdünnen durch Zugabe zur Korrektur.  
> * **Jungpflanzenstation (4.2, Zusatzbox):** feste Dosis 0.5 ml/L je Teil; Kontrollband Leitungswasser \+ 0.3 bis 0.6, also 0.8 bis 1.1 bei Leitungswasser 0.5. Anzuchtboxen A und B: Schwämme nur mit Leitungswasser und 0.1 ml/L je Teil anfeuchten.  
> * **Messmittel und Rundung:** Mengen in Tims Messmitteln (Spritzen 1 ml und 5 ml, Messbecher, Kannengrösse aus den Einstellungen): unter 5 ml auf 0.1 ml, sonst auf 0.5 ml; Anzeige etwa «2 × 5-ml-Spritze \+ 0.5 ml» statt «10.5 ml»; keine Komponente wird auf 0 gerundet; die App zeigt die Abweichung der Rundung in EC.  
> * **Nach dem Ansatz:** Der Ansatz speichert die Dünger als Positionsliste (Name, Soll- und Ist-Menge, Einheit, Bezugsvolumen) inklusive pH-Minus. Nach Nachfüllen und Wechsel gilt der letzte Messwert als «veraltet»; der Rechner nutzt ihn nicht mehr. Nach einem Wechsel entsteht für den Folgetag die Aufgabe «Kontrollmessung».  
> * **Varianten:** ECZiel nicht über ECWasser \+ 0.3 → Ziel wird auf diese Untergrenze gesetzt, Hinweis «Leitungswasser liefert EC aus Calcium, Magnesium und Hydrogencarbonat, aber keinen Stickstoff, Phosphor und Kalium»; leeres Gefäss → Ziel-EC von Hand; ECWasser ab 1.0 → Warnung; letzte Messung veraltet → Rechner verlangt eine neue Messung.  
> * **AK:** (1) \[Unit\] 2.3: 9 l, Stadium Wachstum, Grow : Micro : Bloom \= 1.8 : 1.2 : 0.6 (D \= 3.6 ml/L), Zielbereich 1.0 bis 1.4, Wasser 0.5, k 0.3 → ECSoll 1.58 ausserhalb → D \= 2.33 ml/L; Grow 10.5, Micro 7.0, Bloom 3.5 ml; Teil-Dosis 85 %: Grow 9.0, Micro 6.0, Bloom 3.0 ml. (2) \[Unit\] Herstellerdosis 2.0 ml/L, Zielbereich 1.0 bis 1.4, Wasser 0.5, k 0.3 → ECSoll 1.1 im Zielbereich, keine Skalierung. (3) \[Unit\] Ist 18.0 ml (2.0 ml/L), ECIst 1.05 → kIst 0.28, Restdosis rund 0.55 ml/L (4.9 ml); k-Vorschlag erscheint (Änderung 0.55 ≥ 0.3). (4) \[Unit\] Nachfüllen in 2.3 mit halber Dosis je 2-l-Kanne bei D \= 2.33 → Grow 1.2, Micro 0.8, Bloom 0.4 ml. (5) \[Unit\] 6 l mit EC 1.5, Ziel 1.2, Wasser 0.5 → Wasser 2.6 l; Ziel 0.4 → «mit Wasser allein nicht erreichbar». (6) \[Unit\] Zielbereich 0.6 bis 0.8 bei Wasser 0.5 → Ziel 0.8 mit Hinweis Untergrenze. (7) \[Unit\] Jungpflanzenstation 3 l → je 1.5 ml; keine Komponente wird auf 0 gerundet. (8) \[Unit\] Kratky-Gefäss mit EC über dem Band → «nur Wasser», höchstens 2.5 cm; Kratky über einem Drittel → keine Aufgabe «Nachfüllen». (9) \[Unit\] 10.5 ml werden als «2 × 5-ml-Spritze \+ 0.5 ml» angezeigt. (10) \[Unit\] Nach dem Speichern eines Nachfüllens ist der letzte Messwert des Gefässes «veraltet» und wird vom Rechner nicht verwendet. (11) \[Unit\] Nach 3 Ansätzen eines Stadiums mit Abweichung unter 0.1 mS/cm schlägt die App 100 % vor.  
> * **Bedienung:** U1, U7; einmaliger Hinweis: eine beschriftete Spritze je Komponente, eine eigene Pipette für pH-Minus.  
> * **Herkunft und Inkrement:** K10 bis K14, K25, K26, K27; M24, M26, M27, M33, M34, M35. Muss · I1b. Erweiterung: Korrekturrechner mit Teilwechsel und Füllhöhe (C3).

## **UC8 Reminder und Heute-Ansicht**

**Konzept:** Heute als Startbildschirm mit den fälligen Aufgaben je Gefäss in der Reihenfolge des Laufwegs, «Ausserhalb» oben hervorgehoben; Rundgang mit Kurzprüfung und Abschlussliste; «Morgen» ohne Rhythmusbruch; eine Sammel-Push-Nachricht pro Tag mit Anzahl Aufgaben im Titel; Timer, Bildschirm bleibt an.

> * **Ziel:** Heute zeigt, was zu tun ist, nicht was erfasst wurde; sie mahnt keine Lücken an und zählt keine Serien.  
> * **Auslöser:** App-Start; pg\_cron prüft alle 5 min die Push-Zeit (Europe/Zurich).  
> * **Fälligkeiten (bei jedem Öffnen aus dem Erfassten berechnet):** Gefäss prüfen (Status «in Prüfung»); Messung \= letzte Messung \+ Intervall (Startwert 3 Tage, Kratky mit «zuerst umrühren»); Nachfüllen DWC \= letztes Nachfüllen oder Neuansatz \+ 2 Tage; Kratky «Pegel prüfen»; Wechsel \= letzter Neuansatz \+ Intervall, bei Fruchtgemüse zusätzlich beim Wechsel des Herstellerstadiums; Kontrollmessung \= Tag nach jedem Wechsel, nach «Ausserhalb» am selben Tag nach der Korrektur; Nachmessen \= Korrektur \+ 15 min (Timer); Kurzprüfung täglich im Rundgang; Phase bestätigen am typischen Tag, mit Vorlauf n «Phasenwechsel steht an»; Keimung (Abdeckung entfernen), Keimung prüfen, Umsetzen, Ernte möglich; Kalibrieren \= letzte Kalibrierung \+ 30 Tage und nach jeder Reinigung; nie gemessen → «Erstmessung».  
> * **Ablauf:** 1\. Gefässkarten in Laufweg-Reihenfolge; «Ausserhalb» oben hervorgehoben, ohne den Rundgang umzusortieren; je Aufgabe der Grund; laufende Abläufe mit Countdown oben («1.1 Wechsel läuft · messen ab 19:12»). 2\. «Rundgang starten (n Gefässe)». 3\. Je Aufgabe «Erfassen», «Morgen» oder «Überspringen»; «Erledigt» nur für Aufgaben ohne Daten. 4\. Sammel-Push mit Titel «Hydrovisor heute: 5 Aufgaben» und erster Zeile «Wechsel 1.1 (≈ 1 h) · Messen 1.2, 2.1 · Nachfüllen 1.1». 5\. Versandprotokoll (Zeit, Gerät, Status, Anzahl Aufgaben, geöffnet). 6\. Hinweis in Heute bei alter Offline-Warteschlange.  
> * **Varianten:** nichts fällig → «Heute nichts zu tun · nächste: Mi, Messen 1.1»; Wechsel fällig → Nachfüllen und Messung desselben Gefässes entfallen; mehrere Anlagen → gruppiert nach Anlage; Demo-Datensatz → nie in der Push.  
> * **AK:** (1) \[Unit\] Eine gespeicherte Messung in 1.2 lässt «Messung 1.2» verschwinden; nächste Fälligkeit \= Messdatum \+ Intervall; doppelte Aufgaben sind ausgeschlossen. (2) \[Unit\] Fälligkeiten sind Kalendertage in Europe/Zurich; Umstellung auf Sommerzeit am 28.03.2027 ohne doppelte oder fehlende Aufgaben. (3) \[Unit\] «Morgen» verschiebt «Messung 2.1» um einen Tag; die übernächste Fälligkeit rechnet ab der tatsächlichen Messung, nicht ab dem verschobenen Datum. (4) \[Unit\] «Nachfüllen» eines DWC-Gefässes bei tiefem Pegel bietet kein «Morgen». (5) \[Unit\] Ein Lösungswechsel am 10.01. erzeugt «Kontrollmessung» für den 11.01. (6) \[Unit\] Letzte Kalibrierung vor 31 Tagen → Aufgabe «Messgerät kalibrieren». (7) \[SQL\] Laut Protokoll geht der Sammel-Push an 14 von 14 Tagen höchstens 5 min nach der eingestellten Zeit hinaus; der Titel nennt die Anzahl Aufgaben. (8) \[Gerät\] M0: Empfang an 5 Tagen in Folge bei gesperrtem Gerät auf dem Honor. (9) \[Gerät\] Heute erscheint höchstens 2 s nach dem Öffnen (Warmstart, Median aus 5).  
> * **Bedienung:** U7, U8, U9, U10, U11.  
> * **Herkunft und Inkrement:** K5, K6, K7, K26; M14, M16, M30, M37, M38, M40, M43. Muss · I0 (Messung fällig, erster Push-Test), I1a (Gefäss prüfen), I1b (Heute, Rundgang, Push), I2 (Phase, Keimung, Ernte).

## **UC9 Messwerte erfassen**

**Konzept:** pH, EC und Wassertemperatur ohne Scrollen: drei Kacheln mit Trendzeile, eigener Ziffernblock mit ±, Dezimalpunkt automatisch, Sollband als Schieber-Anzeige; nach dem dritten Wert Ergebniszone mit Bewertung in drei Stufen, Folge und Massnahme je System, Korrektur mit erwartetem Wert und automatischem Nachmess-Timer. Werte «unsicher» oder «veraltet». Nachfüllen, Lösungswechsel, pH-Korrektur und Kalibrierung werden protokolliert; ohne Netz Warteschlange.

> * **Ziel:** Ein Gefäss ist mit pH, EC und Temperatur in höchstens 15 Sekunden erfasst (ohne Einschwingzeit des Messstifts), mit sofortiger Einordnung und Massnahme.  
> * **Auslöser:** Rundgang; Kontroll- und Endmessung beim Lösungswechsel; Aufgabe; Maske «Gefäss»; Messstelle «W»; Kalibrierung.  
> * **Ablauf:** 1\. Kopf mit Kennung (40 sp), Kultur, System und «x»; bei Kratky die Zeile «zuerst umrühren». 2\. Kacheln pH, EC, °C, leer, mit Trendzeile «vorher 1.4 ↗» (Pfeil erst ab 0.1 mS/cm oder 0.2 pH). 3\. Eingabe über den Ziffernblock (U1, U13). 4\. Ungewöhnlicher Sprung → Rückfrage (U3). 5\. Bei Kratky zusätzlich Füllstand «über / unter 1/3». 6\. Nach dem dritten Wert wird der Ziffernblock zur Ergebniszone: Bewertung je Wert, Folge und Massnahme je System, bei Korrektur erwarteter Wert; Knopf «pH-Minus gegeben» mit Menge und Volumen → Nachmess-Timer 15 min startet von selbst. 7\. Speichern; Rückgängig 10 s.  
> * **Bewertung:** «Im grünen Bereich» im Sollbereich; «Knapp daneben» bei pH mehr als 0.1 bis 0.2, EC 8 % oder mindestens 0.1 mS/cm und Temperatur 2 °C ausserhalb; sonst «Ausserhalb». Beim pH gilt als Abweichung erst, was über der Messgenauigkeit liegt (±0.1). Bei der EC gelten die Stufen nach Prozent der Grenze; die Messgenauigkeit (Vorgänger ±2 % F.S.; Prüfpunkt Dezember) wirkt über die Mindestbreite der Schnittmenge (K28). Temperatur 18 bis 22 °C im Ziel, über 24 °C Warnung Pythium-Risiko; Spinat 15 bis 20 °C (A). Kratky: Trend statt Alarm, Beobachtungsband pH 5.5 bis 6.8, ab pH 6.5 Hinweis auf mögliche Eisen- und Mangansperre. Die Ersteinstellung nach dem Ansetzen zählt nicht als Korrektur.  
> * **«unsicher» und «veraltet»:** Ist die Kalibrierung überfällig, zeigt die Maske ein Banner und speichert die Werte als «unsicher». Nach Nachfüllen oder Wechsel zeigt die Maske beim letzten Wert «veraltet, neu messen».  
> * **Protokolle:** Nachfüllen (Kannen, Dosis), Lösungswechsel (aus UC7), pH-Korrektur (Menge, Volumen), Kalibrierung (Datum, Lösungen pH 7.00 und 4.01, EC 1413, nach Reinigung ja oder nein), Kurzprüfung.  
> * **Varianten:** ohne Netz → Warteschlange (U10); nach kaltem Nachfüllen erst nach Temperaturausgleich messen; Messstelle «W» → nur EC und Temperatur, setzt ECWasser mit Datum.  
> * **AK:** (1) \[E2E\] Die Maske passt ohne Scrollen auf 360 × 640 dp und auf das Honor bei Systemschrift 130 %; Tasten 68 dp hoch. (2) \[Unit\] Ein leeres Feld wird nicht gespeichert; Speichern ist ab einem eingegebenen Wert aktiv. (3) \[Unit\] «6», «7» im pH-Feld → 6.7; «2», «0», «5» bei °C → 20.5; Gerät auf ppm 500: «600» → 1.20 mS/cm; pH 6.1 → 7.4 ohne Lösungswechsel → Rückfrage. (4) \[Unit\] pH 6.8 in 2.3 (Ziel 6.0 bis 6.5) → «Ausserhalb» mit Hinweis auf schlechtere Eisenaufnahme; pH 6.7 → «Knapp daneben»; pH 6.6 → «Im grünen Bereich», weil 0.1 nicht über der Messgenauigkeit liegt; 21 °C in 3.2 (Spinat) → «Knapp daneben», in 2.3 → «Im grünen Bereich». (5) \[Unit\] EC 1.35 nach 1.30 zeigt keinen Pfeil, 1.40 nach 1.30 zeigt «↗». (6) \[Unit\] Kalibrierung vor 31 Tagen → gespeicherte Werte tragen «unsicher». (7) \[Unit\] «pH-Minus gegeben» startet den Timer 15 min und erzeugt «nachmessen». (8) \[E2E\] Eine ohne Netz gespeicherte Messung steht nach der Rückkehr des Netzes genau einmal in der Datenbank; eine abgelehnte erscheint als «fehlgeschlagen». (9) \[Gerät\] Median der Erfassungsdauer je Gefäss höchstens 15 s über 10 Messungen am Regal.  
> * **Bedienung:** U1 bis U6, U10, U13.  
> * **Herkunft und Inkrement:** K9 (Gesamt-EC), K14, K26, K27; M22, M30, M31, M33, M41, M42 (Trendzeile). Muss · I0 (einfache Felder), I1b (Maske, Bewertung, Regaltest), I2 (Warteschlange; vorgezogen, falls das WLAN am Regal schwach ist).

## **UC10 Export (Folge-CAS KI)**

Alle Daten als CSV oder JSON sichern. In Etappe A leisten Supabase Pro und das GitHub-Backup die Datensicherung; für Kapitel 6 genügen Auswertungsabfragen in Supabase, als CSV abrufbar (Erweiterung, C3). AK für die Abfragen: \[SQL\] jede Abfrage beantwortet genau eine Frage des Messplans (C4); \[Gerät\] die CSV öffnet sich in Excel ohne Umformatierung.

## **UC11 Notizen und Foto-Tagebuch (Folge-CAS KI)**

Notiz mit Stichwort (Beobachtung, Problem, Symptom, Rückblick, Idee) an Gefäss oder Satz, Foto zur Notiz ohne KI-Auswertung. In Etappe A fotografiert Tim ohne App: frontal, gleiche Distanz, Licht an, Dateiname «JJJJ-MM-TT\_Gefäss». Die Fotos sind die Bildbasis für den Folge-CAS KI. Das Datenmodell enthält keine Tabelle Notiz.

## **UC12 Phasenwissen (Soll)**

> * **Konzept:** Zu jeder Phase kurze Wissenskarten: wichtige Nährstoffe, passende Düngerkomponenten und Zusätze, typische Fehler und Mangelbilder, Sondenpflege, Kratky-Pegel und Wurzelfarbe; angezeigt in der Pflanzenansicht und beim Phasenwechsel; statisch, in eigenen Worten mit Quelle.  
> * **Inhalte:** Karten je Art und Phase aus dem Startdaten-Skript; erste Einträge aus dem Düngeplan (Hinweise je Kultur, Fehlerbilder, Wochenfahrplan Tomate); Erntehinweise (Basilikum über einem Blattpaar schneiden, höchstens ein Drittel des Laubs); Sondenpflege der Trockenelektrode (keine Lagerlösung, 12 h Erstaktivierung in Leitungswasser, nach jeder Messung spülen, Kappe auf, trocken lagern, Salzkrusten normal, kalibrieren alle 30 Tage und nach Reinigung); Kratky-Pegel (Luftwurzelzone frei, nie bis zur Startmarke); Wurzelfarbe (weiss gesund, braun und schleimig verdächtig; Eisenverfärbung lässt sich abspülen).  
> * **AK:** (1) \[SQL\] Jede Kombination aus Art und Phase der Startbelegung hat mindestens 1 Karte mit höchstens 600 Zeichen und Quelle. (2) \[E2E\] Die Karten sind ohne Netz lesbar. (3) \[E2E\] Nach der Phasenbestätigung erscheint die Karte ohne zusätzliche Berührung und schliesst mit einem Antippen. (4) \[SQL\] Keine Karte erwähnt KCl oder Lagerlösung für das Messgerät.  
> * **Herkunft und Inkrement:** K26 (Sondenpflege). Soll · Code als Erweiterung in I2 oder I3; die Inhalte (rund 0.75 PT) schreibt Tim parallel.

## **UC13 Symptom-Check (Folge-CAS KI)**

Beobachtetes Symptom wählen; die App zeigt mögliche Ursachen und Massnahmen und hebt jene hervor, die zur letzten Messung passen; Hinweis statt Diagnose. Etappe A bereitet ohne eigenen Code vor: UC9 nennt bei Abweichung Folge und Massnahme, UC12 enthält Mangelbilder. AK für später: höchstens 3 Berührungen bis zur Ursachenliste; pH 6.8 in 2.3 und «Gelbfärbung junger Blätter» → Eisenmangel zuoberst; jede Ursache mit Quelle.

## **UC14 Etiketten erzeugen, drucken, scannen**

**Konzept:** Seite «Etiketten» je Anlage: druckbarer Bogen (70 × 42 mm, A4 mit 3 × 7 Etiketten oder 62-mm-Band) mit QR-Code, Kennung in grosser Schrift und Zusatzzeile; Stand je Etikett, Nachdruck mit demselben Code; Druck über den Druckdialog von Android auf den WLAN-Drucker oder als PDF. Ein Scan öffnet die Maske «Gefäss», bei einer Anzuchtbox «Säen» mit vorgewähltem Ort.

> * **Ziel:** Jedes Gefäss und jeder Anzuchtort trägt ein gut lesbares Etikett, das Verwechslungen verhindert und mit der Kamera den richtigen Ort öffnet; das Antippen der Kachel bleibt der Hauptweg.  
> * **Auslöser:** «Speichern und Etikett drucken» in UC3; Einstellungen → «Etiketten»; Prüfschritt 1 in UC3; Scan mit der Systemkamera.  
> * **Inhalt:** Der QR-Code enthält nur einen Link auf den Ort: https\://\<konto\>.github.io/hydrovisor/\#/e/R-2.3. Code \= Anlagen-Kürzel und Kennung; er gehört zum Platz, nicht zur Box, und bleibt beim Ersatz eines Gefässes gültig. Anzuchtorte R-A, R-B, R-Z; Jungpflanzenstation R-4.2. Domain und Repository-Name sind nach dem ersten Druck fest.  
> * **Gestaltung:** 70 × 42 mm, schwarz auf weiss, Schrift Manrope; QR 30 mm mit Fehlerkorrektur Q und Ruhezone; Kennung in Manrope 700 mit 20 mm Schriftgrösse (Ziffern rund 14 mm hoch, mehr passt neben dem 30-mm-QR-Code nicht), gleich geschrieben wie im Kopf der Maske «Gefäss»; darunter klein Anlage, System, Volumen und Deckel; unter dem QR der Code als Text. Baustein «Label» mit «LabelSheet» im Design System (seit 23.10.2026).  
> * **Ablauf Drucken:** 1\. Seite «Etiketten»: Liste aller Gefässe und Anzuchtorte der Anlage mit Stand «nicht gedruckt», «gedruckt am …», «geprüft am …». 2\. Einzelne oder alle wählen, Format wählen (A4-Bogen 3 × 7 oder 62-mm-Band); bei angebrauchtem Bogen das Startfeld angeben. 3\. Druckansicht öffnen; der Druckdialog von Android druckt über den Mopria-Druckdienst auf den Epson WorkForce Pro WF-3820 im WLAN oder speichert als PDF. 4\. Nach dem Druck bestätigt Tim «gedruckt»; der Stand wechselt auf «gedruckt am …».  
> * **Anbringen:** gangseitige Vorderseite der Box, oberes Drittel, über der Höchstwasserlinie, mindestens 3 cm über dem Metallgitter; nicht auf dem Deckel, Box nicht anbohren. Material: wetterfeste Etiketten für Tintenstrahl oder Papier mit Laminierfolie.  
> * **Ablauf Scannen:** Die Systemkamera liest den Link, Android öffnet die installierte App (WebAPK): Maske «Gefäss» oder bei R-A, R-B, R-Z «Säen» mit vorgewähltem Ort. Unbekannter Code → «Etikett nicht bekannt»; entferntes Gefäss → «Gefäss 2.3 entfernt am …» mit Link auf die Anlage. Ist eine Gefässprüfung offen, führt der Scan direkt zu Prüfschritt 2\.  
> * **Varianten:** Nachdruck erzeugt dasselbe Etikett mit demselben Code; öffnet der Link im Gerätetest nur einen Browser-Tab, bleiben die Etiketten reine Beschriftung, ein Scanner in der App wird nicht nachgerüstet.  
> * **AK:** (1) \[Unit\] Der Link für Gefäss 2.3 der Anlage R lautet …/\#/e/R-2.3; ein Nachdruck erzeugt denselben Code. (2) \[E2E\] Der Aufruf von \#/e/R-2.3 öffnet die Maske «Gefäss» 2.3, \#/e/R-A öffnet «Säen» mit Anzuchtbox A, \#/e/R-9.9 zeigt «Etikett nicht bekannt», ein entferntes Gefäss den Hinweis mit Datum. (3) \[E2E\] Die Druckansicht passt auf einen A4-Bogen mit 3 × 7 Feldern und beginnt am gewählten Startfeld. (4) \[Gerät\] Die Kennung ist aus 80 cm lesbar; ein nasses Etikett lässt sich scannen. (5) \[Gerät\] Druck vom Honor über WLAN auf den Epson oder als PDF funktioniert. (6) \[Gerät\] Jeder Scan der 14 Etiketten öffnet den richtigen Ort.  
> * **Bedienung:** U14 für das Drucken; Scan nur als Zusatzweg (Kamera und NFC-Fläche liegen auf der Rückseite, das Telefon muss aus der Halterung).  
> * **Herkunft und Inkrement:** K21, K22, K24; M01, M11. Muss · I0 (Gerätetest), I1a.

## **Abläufe über mehrere Use Cases**

### **Inbetriebnahme des Regals (UC1 → UC2 → UC3 → UC14 → UC3)**

> 1. Am Schreibtisch: Anlage R mit vier Bereichen anlegen, Leitungswasser-EC eintragen (UC1).  
> 2. Sieben Deckeltypen und die Boxen aus den Bohrplänen V8.15 als Vorlagen erfassen (UC2).  
> 3. 11 Gefässe und 3 Anzuchtorte mit dem Assistenten erfassen (UC3); alle stehen auf «in Prüfung».  
> 4. Seite «Etiketten»: alle 14 Etiketten auf einen A4-Bogen drucken (UC14), kleben.  
> 5. Am Regal: Rundgang «Gefässe prüfen», je Gefäss vier Schritte; das Volumen wird beim ersten Füllen bestätigt (UC3).  
> * **AK:** (1) \[Gerät\] Das ganze Regal ist in rund 2 Stunden erfasst und in rund 2 Stunden gedruckt, geklebt und geprüft (A). (2) \[SQL\] Nach dem Ablauf stehen 11 Gefässe auf «in Betrieb» mit Prüfprotokoll, 66 Netztöpfe und 3 Anzuchtorte mit Etikett-Code.

### **Rundgang (UC8 → UC9 → UC7)**

> 1. Heute → «Rundgang starten (n Gefässe)»; Reihenfolge nach dem Laufweg; Bildschirm bleibt an.  
> 2. Je Gefäss zuerst die **Kurzprüfung** mit einem Tipp: DWC «Pumpe sprudelt», Kratky «Luftzone vorhanden»; eine Abweichung erzeugt «Belüftung prüfen».  
> 3. Dann **messen** (bei Kratky zuerst umrühren), dann, falls fällig, **nachfüllen** mit der Dosis je Kanne oder bei Kratky «Pegel prüfen»: Die Messung bestimmt die Dosis, und kaltes Nachfüllwasser würde die EC verfälschen.  
> 4. Alles im grünen Bereich → nach 1.5 s automatisch weiter mit der Zeile «Sonde abspülen»; Rückgängig wandert mit.  
> 5. Abweichung → Halt mit Massnahme: \[Am Ende\] (vorgewählt) oder \[Jetzt korrigieren\].  
> 6. Abschluss: «Fertig: 11 von 11 · 9 im grünen Bereich · 2 korrigieren». Je Abweichung eine Zeile mit Knopf, etwa «1.2 pH 6.7 Ausserhalb → \[pH-Minus gegeben\]» oder «2.1 EC 1.5 Knapp daneben → \[Beim nächsten Nachfüllen nur Wasser\]».  
> * **AK:** (1) \[E2E\] 5 Gefässe ohne Wischgeste, höchstens 10 Berührungen je Gefäss inklusive Kurzprüfung. (2) \[Unit\] Die Abschlussliste enthält genau die Werte «Knapp daneben» oder «Ausserhalb» und alle Kurzprüfungen mit Abweichung. (3) \[E2E\] «pH-Minus gegeben» startet den Timer 15 min und erzeugt «nachmessen». (4) \[Unit\] Ein Kratky-Gefäss über einem Drittel erzeugt im Rundgang kein «Nachfüllen».

### **Lösungswechsel (UC8 → UC7 → UC9)**

Abhakliste (UC7) → umrühren → Timer 15 min → pH einstellen → Timer 15 min → Kontrollmessung pH und EC (UC9) → Restdosis → Timer 15 min → Endmessung (UC9) → Vorschlag für k → am Folgetag Aufgabe «Kontrollmessung». Jeder Haken wird sofort gespeichert; Heute zeigt «1.1 Wechsel läuft · messen ab 19:12»; nach einer Unterbrechung geht es beim nächsten offenen Haken weiter. Mit Teil-Dosis dauert ein Wechsel 60 bis 75 min, ohne rund 45 min (A).

> * **AK:** (1) \[Unit\] Haken nur in fester Reihenfolge; pH vor EC. (2) \[Gerät\] Der Bildschirm bleibt bis Timerende plus 2 min an; am Ende Ton und Vibration. (3) \[E2E\] Ein abgebrochener Wechsel erscheint in Heute und setzt beim nächsten offenen Haken fort. (4) \[Unit\] Nach dem Wechsel ist der letzte Messwert vor dem Wechsel «veraltet», und für den Folgetag besteht «Kontrollmessung».

### **Anzucht mit Zieltopf (UC5 → UC8 → UC6 → UC5)**

Säen im Malmodus mit Zieltöpfen oder «Ziel später», Anzucht in Box A oder B → Aufgabe «Keimung prüfen» → Keimungsprüfung je Schwamm und Platz auf der Jungpflanzenstation (UC6) → Aufgabe «Umsetzen» beim Wechsel zu Wachstum → «Wie geplant umsetzen» oder Ziel wählen → Hinweis «In 4.2 verbleiben 2 Sämlinge ohne Ziel».

> * **AK:** (1) \[E2E\] 6 Zieltöpfe, 2 Sorten, 1 Schwamm ohne Keimling, 5 umgesetzt: zusammen höchstens 26 Berührungen über alle drei Schritte. (2) \[Unit\] Ein bei der Aussaat gewählter Zieltopf ist bis zum Umsetzen reserviert und kann keiner anderen Pflanzung zugeordnet werden.

# **Teil C – Anhang**

## **C1 Fachlogik und Datenmodell**

### **C1.1 Regeln und Grenzfälle**

> * **F1 Zielbereich:** Schnittmenge der Sollbereiche aller aktiven Pflanzungen und reservierten Töpfe; ein Gefäss hat keinen eigenen, festen Zielbereich. Leer hat es keinen (keine Bewertung, «Passt hierhin» für alle Sorten); er entsteht mit der ersten Pflanzung und ändert sich mit jeder Pflanzung, jedem Phasenwechsel und jeder Ernte. Ausnahme ist die Jungpflanzenstation mit fester Dosis. Die Fenster der Startbelegung aus dem Düngeplan gelten nur für das Mischen von Hand bis zum Testbetrieb (entschieden am 23.10.2026).  
> * **F2 Leeres Gefäss:** keine Bewertung, Ziel-EC von Hand.  
> * **F3 Ziel-EC und Stadium:** Ziel-EC \= Mitte des Zielbereichs (2.3: 1.0 bis 1.4 → 1.2), nie unter ECWasser \+ 0.3. Stadium \= Phase der meisten Pflanzen, bei Gleichstand die frühere; bei leerer Schnittmenge sichtbarer Mischentscheid.  
> * **F4 EC-Konvention:** Sollbereiche gelten als Gesamt-EC wie gemessen. Die Hersteller-EC je Stadium gilt als Zuwachs über dem Leitungswasser und wird mit ECWasser zur Gesamt-EC (K25, ersetzt «+0.2» aus K9).  
> * **F5 Rechner:** Vk \= D · ak · V mit Herstellerdosis D; ECSoll \= ECWasser \+ k · D; ausserhalb des Zielbereichs D \= (ECZiel − ECWasser) / k; keine negative Menge; Rundung und Jungpflanzenstation wie UC7.  
> * **F6 Teil-Dosis, Nachfüllen, Korrektur:** wie UC7; Mischformel ECneu \= (V1 · EC1 \+ V2 · EC2) / (V1 \+ V2); die Ist-EC eines Ansatzes gilt nach der pH-Einstellung.  
> * **F7 Phasen:** fester Katalog mit fünf Phasen und Wechselmerkmal; Tag 0 \= Saattag; «Phase bestätigen» am typischen Tag, «Phase wechseln» ab der Mindestdauer; «Noch nicht» \+2 Tage; nach der Höchstdauer Hinweis «prüfen»; Folgetermine ab bestätigtem Datum.  
> * **F8 Schnittmenge und Systemeignung:** geprüft beim Pflanzen (Startphase), beim Umsetzen, beim Verschieben und bei jeder Phasenbestätigung; Systemeignung (DWC, Kratky) und Liter je Pflanze je Art; Die Passungs-Empfehlung (K28) bewertet zum Zeitpunkt des Umsetzens und schaut damit bis dahin voraus; die frühere Erweiterung «Vorausschau über das ganze Profil» entfällt.  
> * **F9 Aufgaben:** aus Ereignissen berechnet, Kalendertage in Europe/Zurich; gespeichert werden nur «Morgen» und «Überspringen» (Tabelle Aufschub); jedes Ereignis speichert «war fällig am»; Nacherfassung ohne Aufgaben vor dem Erfassungstag.  
> * **F10 Ernte:** Ereignis, keine Phase; je Art «Ernte möglich ab» und einmalige oder mehrfache Ernte.  
> * **F11 Messtechnik:** Aquamaster Combo Pen P160 Pro2, Trockenelektrode: 12 h Erstaktivierung in Leitungswasser, keine Lagerlösung, nach jeder Messung spülen, Kappe auf, trocken lagern. pH zweipunktig (7.00 und 4.01) und EC (1413 µS/cm, Anzeige 1.4) alle 30 Tage und nach jeder Reinigung; Lösung frisch in einen Becher, nie zurück in die Flasche. Genauigkeit laut Händler beim Vorgänger pH ±0.1, EC ±2 % F.S., Auflösung 0.1 mS/cm (Prüfpunkt Dezember).  
> * **F12 Leitungswasser:** ECWasser \= jüngste Messung von «W», bei der Inbetriebnahme gemessen, vierteljährlich neu, bis dahin 0.5 mS/cm; Warnung ab 1.0 mS/cm. Calcium und Härte dienen nur der Wahl von Micro Hard Water und werden nicht erfasst.  
> * **F13 Topf und Platz:** Die Topfkennung bezeichnet den Heimplatz; die Pflanzung hängt an einem Topf, der Topf an einem aktuellen Platz. Zieltopf wahlweise ab Aussaat reserviert; Verschieben und Tauschen nur bei gleicher Topfgrösse; jede Ortsänderung ist ein Ereignis.  
> * **F14 Wartezeiten:** einheitlich 15 Minuten nach pH-Minus und nach dem Mischen; bei Kratky erst umrühren; Kontrollmessung am Folgetag nach jedem Lösungswechsel, weil das karbonathaltige Wasser den pH wieder anhebt.  
> * **F15 Mindeständerung:** Trendpfeil erst ab 0.1 mS/cm oder 0.2 pH; k nur nachführen, wenn sich die EC um mindestens 0.3 mS/cm verändert hat.  
> * **F16 «veraltet» und «unsicher»:** «veraltet» wird aus dem letzten Nachfüllen oder Wechsel abgeleitet und nicht gespeichert; «unsicher» wird an der Messung gespeichert, wenn die Kalibrierung überfällig war.  
> * **F17 Kratky:** «Pegel prüfen» statt Nachfüllen; Nachfüllen erst unter einem Drittel, höchstens 2.5 cm, nie bis zur Startmarke; Wasser bei EC über dem Band, sonst halbe Konzentration; umrühren vor jeder Messung; Trend statt Alarm.  
> * **F18 Etikett und Prüfung:** Etikett-Code \= Anlagen-Kürzel und Kennung, gehört zum Platz; Kürzel nach dem ersten Druck fest. Prüfstatus «in Prüfung», «in Betrieb», «ruht», «entfernt»; Volumenabweichung über 10 % → Korrekturvorschlag; nach Box- oder Deckeltausch wieder «in Prüfung».

### **C1.2 Datenmodell (gemäss Konzept v0.3, 22 Tabellen)**

| Bereich | Tabellen | Ergänzungen aus diesem Dokument |
| :---- | :---- | :---- |
| Anlage | Anlage, Bereich, Gefäss, Gefässmodell, Deckeltyp, Netztopf, Anzuchtort | Anlage mit Kürzel, Standort, Leitungswasser (EC mit Datum), Lichtstunden, Laufweg, Messgerät mit Kalibrierungen; Gefäss mit Status (in Prüfung, in Betrieb, ruht, entfernt), Etikett-Code, gedruckt am, geprüft am, Prüfprotokoll, Intervalle; Deckeltyp mit Löchern je Reihe; Anzuchtort mit Etikett-Code |
| Betrieb | Aufschub, Pflanzung, Messung, Nährlösungsansatz, Ereignis, Push | Messung mit «unsicher», Messart, Füllstand (Kratky), Bewertung, Erfassungsdauer, eindeutiger Kennung, «war fällig am»; Nährlösungsansatz mit Positionsliste inklusive pH-Minus, Stadium, Ziel-EC, erwarteter EC, k, ECWasser, Teil-Dosis; Ereignis auch für Kurzprüfung, Gefässprüfung, Verschieben, Tausch, Neu beschriften, Kalibrierung |
| Wissen | Saatgut, Sorte, Art, Kulturgruppe, Saatempfehlung, Phasenprofil, Düngerschema, Wissenseintrag, Quelle | Art mit Systemeignung und Liter je Pflanze; Düngerschema mit Produkt, Variante, Gehalt laut Etikett, Herstellertabelle Hydro/Coco, k je Stadium, Mischregeln |

Alle schreibenden Tabellen speichern die App-Version. Einstellungen (Push-Zeit, Kannengrösse, Messmittel) liegen bei der Anlage oder beim Push-Abo (A, wird in der Spezifikation festgelegt). **Startdaten-Skript:** Sorten, Arten, Kulturgruppen, Profile, Saatempfehlungen, Düngerschema, Wissenseinträge, Quellen, Messgerät und ein Testgefäss für I0; Nacherfassung aus Tims Liste. **Demo-Datensatz:** zweites, löschbares Skript mit einem Beispielgefäss und 14 Tagen Werten (Leitungswasser 0.5, steigender pH), nie in der Push. **Bewusst nicht:** Tabelle Notiz (UC11 im Folge-CAS), gespeicherte Aufgaben mit Status, allgemeines Journal.

### **C1.3 Fachliche Klärungen**

| Frist | Klärung | Stand |
| :---- | :---- | :---- |
| vor I1 | Fenster der Jungpflanzenstation | Geklärt (K25): feste Dosis 0.5 ml/L je Teil, Band Leitungswasser \+ 0.3 bis 0.6, also 0.8 bis 1.1 |
| vor I1 | Messgerät | Geklärt am 20.10.2026: P160 Pro2, Trockenelektrode, mS/cm, zwei Dezimalen, Kalibrierung alle 30 Tage und nach Reinigung. Offen bis Dezember: Genauigkeit und Auflösung des Pro2 laut Anleitung |
| vor I1 | Zuordnung Phase → Herstellerstadium | Geklärt: Konzept v0.3, Fachlogik Punkt 3 |
| vor I1 | Gerät am Regal | Geklärt (E5): Honor Magic5 Pro mit Chrome |
| vor I1 | Drucker | Geklärt am 23.10.2026: Epson WorkForce Pro WF-3820 (Mopria). Offen bis Dezember: Druck vom Honor, Etikettenbogen, Wasserfestigkeit |
| vor I1 | Wasseranalyse | Erledigt am 22.10.2026: Calcium im Mittel 74.4 mg/L, Micro Hard Water bestätigt; Werte werden nicht erfasst |
| vor I2 | Randen Bull's Blood als Blatt- oder Knollenkultur | Kulturtyp je Sorte festlegen |
| im Testbetrieb | Richtwert «Liter je Pflanze» je Art | im Testbetrieb festlegen |
| im Testbetrieb | Lichtdauer Ebene 3; Spinat Butterfly als Baby-Leaf oder Vollkultur (Schossgefahr über 13 h Licht) | bei Vollkultur 12 bis 13 h prüfen |

## **C2 Inkrementplan**

| Inkrement | Inhalt | Umfang netto / mit Zuschlag | Zeitraum | Pakete, Tims Zeit | Meilenstein |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **I0 Grundgerüst und Risikotests** | Projekt, Hosting, Anmeldung, Datenmodell mit Anlage (Kern), Startdaten-Skript (T1), einfache Messung, Fälligkeit «Messung», Push-Test (T2), KI-Test (T3), Gerätetest (T5), dauerhafter Speicher, Hochformat, App-Version | 4.2 / 4.8 PT | Dezember | 8, rund 22 h | **M0 Ende Dezember** |
| **I1 Anlage, Messen, Düngen, Erinnern** | I1a: UC1, UC2, UC3, UC14; I1b: UC9, UC7, UC8, Einstellungen, Demo-Datensatz, Regaltest A bis D | 12.75 / 14.7 PT | Januar | 18, rund 31 h | **M1 Ende Januar:** Regal erfasst und geprüft, eine Woche ohne Papier |
| **I2 Sorten, Pflanzen, Phasen** | UC4 mit KI und den 22 Tüten, Profile, UC5 mit Zieltopf und Umsetzen, UC6, Zielbereich berechnet, Offline-Warteschlange | 8.3 / 9.5 PT | Februar | 16, rund 23 h | **M2 Ende Februar:** App Stufe 1 |
| **Summe Kern** |  | **25.25 / 29.0 PT** |  | **42, rund 76 h, dazu Inhalte rund 12 h** |  |
| **I3 Härten** | Fehler aus dem Betrieb, Auswertungsabfragen, Erweiterungen nach C3 | nach Zeit | ab März | – | **ab 1.3.2027 nur noch Fehlerbehebungen** |

Die Verteilung auf die Inkremente ist geschätzt (A): I0 \= 3.6 aus Fassung 2 \+ 0.35 Marktvergleich (M14, M17) \+ 0.25 Anlage (Datenmodell 0.5, Skript −0.25); I1 \= 7.2 \+ 2.05 Marktvergleich \+ 2.5 Anlage, Etiketten und Prüfung \+ 0.25 Einrichtungs-Checkliste (K29) \+ 0.5 einfaches Säen und Keimung (K30, aus I2) \+ 0.25 «Satz duplizieren» (K31, aus dem Pool); I2 \= 7.95 \+ 0.1 (M48) \+ 0.75 (K28, im Paket «Pflanzvorschlag», ohne zusätzliches Arbeitspaket) − 0.5 (K30, nach I1). K29, K30 und K31 laufen in bestehenden Arbeitspaketen, Tims Zeit bleibt gleich. Die Deckelgrafik und die Regalübersicht ziehen von I2 nach I1a; ihr Anteil ist in den Summen nicht verschoben.  
**Sparhebel** (zusammen rund 1.5 PT): Umsetzen durch «in der Anzucht beenden» und Nacherfassung ersetzen (−0.5; der Verlauf bricht ab) · Offline-Warteschlange erst nach M2, falls das WLAN am Regal gut ist (−0.5) · Anlage als Liste nach Ebenen statt Regalbild (−0.25) · Phasenkorrektur über den Tabelleneditor (−0.15) · Rundgang ohne automatisches Weiter (−0.1). Nicht streichen: Messpunkte, Push-Test, Rechner-Grenzfälle, Jungpflanzenstation, Kratky-Regel, Phasenbestätigung, Zieltopf, Gefässprüfung, «veraltet».  
**Technische Aufgaben ohne eigenen UC:** T1 Startdaten-Skript (freigegebene Wissensbasis W0 aus data/wissensbasis/ und ein Testgefäss; Nacherfassung aus Tims Liste; ein Zähltest prüft es) · T2 Push-Test von Ende zu Ende · T3 KI-Test mit 3 echten Tüten · T4 Kalender-Abo nur als Rückfallebene · T5 Gerätetest QR-Link, Druck und Etikettenbogen · T6 Demo-Datensatz · T7 verschlüsseltes Backup über GitHub Actions.  
**Belege für Kapitel 5:** je Arbeitspaket in GitHub Schätzung und Ist, Tims Zeit, Nachbesserungsrunden, Verbrauch je Rolle, Modell und Denkstufe, Paketklasse (Routine, Fachlogik, Kern); je Meilenstein drei Sätze (was funktionierte, was nicht, was ändern wir); AK-Nummern in den Testnamen.

## **C3 Erweiterungen nach Kapazität (Pool bei 5.9 PT gedeckelt, belegt 5.15 PT)**

| Erweiterung (UC, Herkunft) | PT |
| :---- | :---- |
| Auswertungsabfragen als Ersatz für UC10, zuerst, für Kapitel 6 nötig (10) | 0.5 |
| Phasenwissen, Code; Inhalt 0.75 PT durch Tim (12) | 0.5 |
| Korrekturrechner: Teilwechsel auf gleichem Pegel, Füllhöhe in cm; erwarteter Wert als Bereich (7, M21) | 0.5 |
| Regeln für vorgezogenen Wechsel; Schosshinweis Spinat über 13 h; «Gerät prüfen» mit «W» (7, 9\) | 0.5 |
| Eigene wiederkehrende Aufgaben je Anlage, z. B. «Zelt und Luftsteine reinigen» (8, L32) | 0.5 (A) |
| Verlauf in der Maske «Gefäss» als Zahlenreihe mit Ereignismarkern, ohne Diagramm (1, M42) | 0.35 |
| Begrenzende Pflanze im Pflanzvorschlag anzeigen (5, M23) | 0.25 |
| Zweiter Wechsel-Auslöser: Nachfüllwasser erreicht das Betriebsvolumen, nur DWC (8, M25) | 0.25 |
| «Frei seit x Tagen», Folgesatz rechnet Anzucht zurück (1, M45) | 0.25 |
| Satz duplizieren mit Plätzen (5, M46): entfällt, mit K31 im Kern | 0.25 |
| Folgesatz-Erinnerung: Babyleaf für 3.3, Nachschub in 4.2 (8) | 0.25 |
| Markierung «beobachten» mit befristet kürzerem Messintervall (1, 8, 9\) | 0.25 |
| «Auch morgen fällig: mitnehmen?» im Rundgang (8) | 0.25 |
| Timer-Push (8) | 0.25 |
| Vorausschau der Schnittmenge über das ganze Profil (5): entfällt, mit K28 im Kern | 0.25 |
| Messtechnik-Pflege als Aufgaben: Alter der Kalibrierlösungen, Reinigung (8) | 0.2 |
| Ernte-Erinnerung nach Ernteintervall, Basilikum 7 Tage (8) | 0.1 |
| «Heute auslassen» (8), davon 0.25 PT; die Einrichtungs-Checkliste (0.25 PT) ist seit K29 im Kern | 0.5 |
| **Summe** | **5.9** |

**Gestrichen oder in den Folge-CAS verschoben:** Notiz und Foto (UC11), Ertrag, Push-Aktionsknöpfe (M19), Flaschenbestand und Düngervorrat (M36), Abwesenheitsmodus und Push-Pause (M28 Abwesenheit), Wochenrückblick, Satz-Rückblick, Shop-Seite teilen, einstellbare EC-Skala, TalkBack-Test, pH-Lernfaktor (M28), pH-Korrekturzähler (M29), Kurzbefund Algen, Geruch, Wurzeln (M39), Raster je Schwamm (L23), Kosten je Satz (L27).  
**Ausblick:** Profil der Art aus eigener Erfahrung anpassen (Act-Schritt im Lösungsvorschlag Phasenmodell) · Wochenrhythmus als zweites Pflegemodell.  
**Bewusst verworfen:** NFC (M05, M06), Scanner in der App (M04), Etiketten erst beim Scan zuordnen (M03), Umsetzen mit zwei Scans (M07), Messen per Scan (M08), Aktions-Sticker (M09), Verknüpfung «Scannen» (M10), Einschwing-Timer (M32), zweites Datumsfeld (M50), Umsortierung des Rundgangs nach Dringlichkeit (M37), Bluetooth-Druck, periodische Hintergrundsynchronisation, Widgets, Vollbildmodus, Spracheingabe von Messwerten.

## **C4 Messplan für Kapitel 6 (Testbetrieb)**

Alle Werte sind beschreibend, nicht kausal. Erfolgskriterien des Konzepts v0.3: EK1 Anlage erfasst, geprüft, etikettiert, Sorten vollständig; EK2 Pflanzung unter einer Minute; EK3 Werte je Gefäss sichtbar; EK4 Pflanzvorschlag genutzt; EK5 Push rechtzeitig; EK6 Messung höchstens 15 s je Gefäss.

| Frage | Kennzahl | Datenfeld | ab |
| :---- | :---- | :---- | :---- |
| EK1 | Gefässe «in Betrieb» mit Prüfprotokoll, Etiketten gedruckt und geprüft; Zähler Löcher, Netztöpfe, Sorten; Vollständigkeitsregel | Gefäss, Startdaten, UC4 | I1a |
| EK2 | Median der Dauer je Pflanzvorgang (H2: höchstens 60 s) | Pflanzung: Erfassungsdauer | I2 |
| EK3 | Funktionsnachweis je Maske (Bildschirmfoto) | – | I2 |
| EK4 | Anteil Sorten aus «passend», Rang der gewählten Sorte, bestätigte Konflikte | Pflanzung | I2 |
| EK5 | Versandzeit, Anzahl Aufgaben, «aus Push geöffnet»; Termintreue | Push-Protokoll; «war fällig am» | I0/I1 |
| EK6 | Median ab erster Eingabe bis Speichern (H1: höchstens 15 s) | Messung: Erfassungsdauer | I1 |
| Rechnergüte | Ist- minus Soll-EC; Anteil skalierter Ansätze; Verlauf von k je Stadium | Ansatz mit Positionsliste, Kontroll- und Endmessung | I1 |
| Volumen | Abweichung beim ersten Füllen gegenüber dem erfassten Betriebsvolumen | Prüfprotokoll | I1a |
| Phasenprognose | bestätigt minus berechnet in Tagen; echte Keimdauer | Ereignis | I2 |
| KI-Güte UC4 | übernommen, geändert, leer je Feld (H3: mindestens 80 % unverändert); Dauer je Sorte (H4: höchstens 3 min) | Feldprotokoll, Tütenfotos | I2 |
| Sollbereichsquote | Anteil «Im grünen Bereich», «Knapp daneben», «Ausserhalb»; Anteil «unsicher» | Messung | I1 |
| Kurzprüfung | Anzahl Abweichungen «Pumpe» und «Luftzone» | Ereignis | I1 |
| Übersteuerungen | geänderte Ziel-EC, Mischentscheide, k-Übernahmen, korrigierte KI-Felder | Ansatz, Feldprotokoll | I1/I2 |
| Keimrate | gekeimte Samen je Schwamm und je Saatgut; Zieltöpfe wie geplant besetzt | Ereignis | I2 |
| Etiketten | Scans je Woche, falsche oder unbekannte Codes | Aufrufe von \#/e/ (A) | I1a |
| App-Version | Build-Kennung je Datensatz | alle schreibenden Tabellen | I0 |

## **C5 Konzeptänderungen K1 bis K31**

| Nr. | Stelle | Inhalt | Stand |
| :---- | :---- | :---- | :---- |
| K1 | UC2 | Gefässmodelle und Deckel per Startdaten-Skript | aufgehoben am 23.10.2026 durch K19 |
| K2 | UC3 | Gefässe per Skript, Tausch über den Tabelleneditor | aufgehoben am 23.10.2026 durch K19 |
| K3 | UC4 | KI liest nur Gedrucktes; pH, EC und Phasen aus den Profilen; 22 Startsorten per Skript und zusätzlich über UC4 | gilt |
| K4 | UC5, Leitlinie | «Schritt» \= eine Ansicht, die man mit «Weiter» verlässt (Begriff am 23.10.2026 statt «Bildschirm») | gilt |
| K5 | UC8 | ein Sammel-Push pro Tag | gilt; Titel mit Anzahl Aufgaben |
| K6 | Datenmodell, Fachlogik 4 | Aufgabe am Gefäss, aus Ereignissen berechnet | gilt |
| K7 | Pflegerhythmus | Intervalle in ganzen Tagen; messen alle 3 Tage für alle Gefässe | gilt |
| K8 | Fachlogik 4 | Frage am typischen Tag, Wechsel ab Mindestdauer, nach Höchstdauer «prüfen» | gilt |
| K9 | Fachlogik 2 und 3 | Gesamt-EC wie gemessen; Herstellerwerte \+0.2 | Gesamt-EC gilt; «+0.2» ersetzt durch K25 |
| K10 | Fachlogik 3 | Jungpflanzenstation mit fester Dosis | gilt; Band nach K25 |
| K11 | Fachlogik 3 | Rundung unter 5 ml auf 0.1 ml, nie 0 | gilt; ergänzt um Messmittel (M24) |
| K12 | Fachlogik 3 | k je Stadium, Teil-Dosis 85 %, bis k stabil ist | gilt; k nur ab 0.3 EC-Änderung (K26) |
| K13 | Fachlogik 4 | Nachfüllen nach Messung; Kratky nie zur Startmarke | gilt; Kratky-Regel präzisiert (K26) |
| K14 | Fachlogik 2 und 7 | Schnittmenge auch bei Phasenbestätigung; Mischentscheid; Temperatur je Kultur; relative EC-Toleranz; Massnahmen je System | gilt |
| K15 | Datenmodell | rund 25 Tabellen | ersetzt: 22 Tabellen gemäss Konzept v0.3 |
| K16 | UC2, UC3, UC5, UC6 | Topfkennung beim Topf, Zieltopf wahlweise, Anzuchtorte, Verschieben und Tauschen | gilt |
| K17 | Zeitplan | Zeitplan gemäss Folie | erledigt im Konzept v0.2 und v0.3 |
| K18 | Datenmodell, UC1, Fachlogik 5 | Anlage über Bereich; mehrere Anlagen von Anfang an | gilt seit 23.10.2026 |
| K19 | UC2, UC3, Zeitplan | Erfassen, ändern, prüfen und entfernen in der App; Skript nur für Wissen und ein Testgefäss | gilt seit 23.10.2026 |
| K20 | Deckeltyp | Löcher je Reihe und Topfdurchmesser; Nummern abgeleitet | gilt seit 23.10.2026 |
| K21 | UC14, Fachlogik 9 | QR-Etikett mit grosser Kennung je Ort; kein NFC | gilt seit 23.10.2026 |
| K22 | Architektur | Druck über den Android-Druckdialog (Mopria) oder PDF | gilt seit 23.10.2026 |
| K23 | UC3, Reminder | Prüfablauf je Gefäss, Status «in Prüfung» und «in Betrieb», Volumen beim ersten Füllen | gilt seit 23.10.2026 |
| K24 | Architektur, Gerät am Regal | Installation mit Chrome, Tests nur in Chrome | gilt seit 23.10.2026 |
| K25 | Fachlogik 3 | Herstellerdosis als Startwert, EC als Kontrolle, Skalierung nur bei Abweichung; Hersteller-EC plus Leitungswasser; Jungpflanzenstation Band Leitungswasser \+ 0.3 bis 0.6 | gilt seit 23.10.2026 |
| K26 | Dünger, Messung, Fachlogik 3 und 7, Pflegerhythmus | Trockenelektrode mit Erstaktivierung, Kalibrierung auch nach Reinigung; Herstellerregeln beim Mischen; 15 Minuten; Reihenfolge als Praxis; EC ±2 % F.S. mit Mindeständerung; Kratky umrühren und eigene Nachfüllregel; Kontrollmessung am Folgetag | gilt seit 23.10.2026 |
| K27 | UC9, Fachlogik 7, Datenmodell | Messwert «veraltet» nach Nachfüllen oder Wechsel; «unsicher» bei überfälliger Kalibrierung | gilt seit 23.10.2026 |
| K28 | Fachlogik 2, UC5, F8 | Passungs-Empfehlung statt Sperren: Einstufung «Empfohlen», «Möglich», «Nicht empfohlen» zum Zeitpunkt des Umsetzens (Phase beim Umsetzen gegen Wachstumsstand im Gefäss), nach Breite der Schnittmenge (Mindestbreite 0.3, entschieden), Abstand der Bandmitten, Kulturgruppe, Systemeignung und freien Löchern; in beiden Richtungen; «Passt hierhin» in der Maske «Gefäss»; ohne Rückfrage | gilt seit 23.10.2026 |
| K29 | UC1, Heute, A5 | Geführte Ersteinrichtung: Einrichtungs-Checkliste in Heute (Anlage, Leitungswasser-EC, Kalibrierung, Vorlagen, Gefässe und Anzuchtorte, Etiketten, Prüfung, erste Aussaat), hakt sich selbst ab; aus dem Erweiterungspool in den Kern (0.25 PT) | gilt seit 23.10.2026 |
| K30 | UC5, UC6, Zeitplan | Säen ab Januar: einfaches Säen (Sorte, Anzuchtort, Datum, Saatmenge, Zieltopf wahlweise) und Keimung prüfen in I1; die Liste für die erste Aussaat entfällt; 0.5 PT von I2 nach I1 | gilt seit 23.10.2026 |
| K31 | UC5, A5, C2, C3, Zeitplan | Folgesätze und Probelauf W0: «Satz duplizieren» in den Kern (I1b, 0.25 PT aus dem Erweiterungspool); Aussaat ab Testbetrieb, Folgesätze alle 2 Wochen; W0-Probelauf mit der ersten Pflanzrunde statt nur Kräuter | gilt seit 27.10.2026 |

## **C6 Glossar**

| Begriff | Bedeutung |
| :---- | :---- |
| Anlage | oberste Ebene, etwa das Indoor-Regal (Kürzel R) oder später die Terrasse (T); hat Bereiche, Gefässe und Anzuchtorte |
| Bereich | Ebene oder Zone einer Anlage, beim Regal die Ebenen 1 bis 4 |
| Gefäss | Box mit Deckel an einem Platz; die Kennung (z. B. 2.3) bezeichnet den Platz |
| Löcher je Reihe | Lochbild eines Deckels, von vorne nach hinten (D6: «2, 2, 2»); Loch 1 vorne links |
| Prüfstatus | «in Prüfung» nach dem Erfassen, «in Betrieb» nach der Prüfung am Regal; dazu «ruht» und «entfernt» |
| Etikett-Code | Anlagen-Kürzel und Kennung, etwa R-2.3; gehört zum Platz und steht im QR-Link |
| Mopria | Druckstandard, über den Android Drucker im WLAN ohne Zusatz-App findet |
| WebAPK | echte installierte App, die Chrome aus einer PWA erzeugt; übernimmt Links ihres Bereichs |
| dp, sp | geräteunabhängiger Bildpunkt (48 dp ≈ 7.6 mm); Schriftgrösse in geräteunabhängigen Punkten |
| PT | Personentag, rund 6 Stunden Arbeit im Dialog mit Claude Code; nur Vergleichsgrösse |
| PWA | Web-App, die sich wie eine installierte App verhält |
| Sammel-Push | eine Benachrichtigung pro Tag mit allen Aufgaben, Anzahl im Titel |
| Kurzprüfung | ein Tipp je Gefäss im Rundgang: DWC «Pumpe sprudelt», Kratky «Luftzone vorhanden» |
| Herstellerdosis | Dosis D je Stadium aus der Herstellertabelle für Hydroponik und Kokos; Rechenbasis des Düngerrechners |
| Gesamt-EC | Leitfähigkeit inklusive Leitungswasser, wie das Messgerät sie zeigt |
| k | EC-Zuwachs je ml/L Dünger (Startwert 0.3 mS/cm), je Stadium |
| Messmittel | Tims Spritzen (1 ml, 5 ml), Messbecher und Giesskanne; Mengen werden darin angezeigt |
| veraltet | Kennzeichen des letzten Messwerts nach Nachfüllen oder Wechsel; der Rechner nutzt ihn nicht |
| unsicher | Kennzeichen einer Messung bei überfälliger Kalibrierung |
| Ergebniszone | Bereich der Messmaske, der nach dem dritten Wert den Ziffernblock ersetzt |
| Startdaten-Skript (Seed) | schreibt Wissen (Sorten, Profile, Düngerschema, Wissenseinträge, Quellen) und ein Testgefäss einmalig in die Datenbank |
| Demo-Datensatz | getrennter, löschbarer Beispieldatensatz zum Testen von Heute, Verlauf und Rechner |
| Tabelleneditor | Tabellenansicht in Supabase, nur für Notfälle |
| Inkrement, Meilenstein | Bauetappe (I0 bis I3); Prüfpunkt mit festen Kriterien (M0 bis M2) |
| Feature-Freeze | ab 1.3.2027 nur noch Fehlerbehebungen |
| Arbeitspaket | ein Auftrag an das Agenten-Team als GitHub-Issue mit Akzeptanzkriterien und Paketklasse (Routine, Fachlogik, Kern) |
| Heimplatz | das Loch, dessen Kennung auf dem Topfrand steht (z. B. 2.3.4) |
| Zieltopf | Topf, in den eine Pflanze nach der Anzucht kommt; bei der Aussaat wählbar und dann reserviert, sonst beim Umsetzen gewählt |
| Anzuchtort | Anzuchtbox A (Lichtkeimer, R-A) oder B (Dunkelkeimer, R-B), Zusatzbox mit Z1 oder Z2 (R-Z); die Jungpflanzenstation ist Gefäss 4.2 |
| Wake Lock | hält den Bildschirm in den Abläufen am Regal eingeschaltet |
| Offline-Warteschlange | Zwischenspeicher für Messungen ohne Netz, mit dauerhaftem Speicher geschützt |
| Zugriffsregeln (RLS) | geben nur Tims Konto Zugriff auf die Daten |
| Build-Kennung | App-Version, die jeder Datensatz mitspeichert |
| Satz | alle Pflanzungen einer Sorte mit gleichem Saatdatum im selben Gefäss |
| Profil, Vererbung | Sollwerte und Phasen je Sorte, Art, Kulturgruppe oder Standardprofil; der erste vorhandene Wert gilt |
| DWC, Kratky | Wurzeln in belüfteter Lösung; bei Kratky sinkt der Pegel mit dem Verbrauch, die Pumpe läuft nur 10 Minuten pro Stunde |
| Prüfarten | \[Unit\] Rechenfunktion · \[SQL\] Datenbankabfrage · \[E2E\] automatischer Bedientest · \[Gerät\] Prüfung von Hand · \[Eval\] Auswertungsskript |

## **C7 Quellen**

Die Quellen aus Fassung 2 (abgerufen am 18.10.2026) gelten weiter; ergänzt sind die Quellen aus Marktvergleich und Anlagen-Vorschlag (abgerufen am 21\. und 23.10.2026).  
**Eigene Unterlagen:** [Hydrovisor – Konzept v0.3](https://docs.google.com/document/d/1ZKYiiU_mOnkQWw48H2crAFqMyWk-gWYKR8ZZQy8Ua9g/edit) (23.10.2026) · [Hydrovisor – Vorschläge Use Cases, Fassung 2](https://docs.google.com/document/d/13tDrP9ruOm-JuhnADEQAiPPQF2WwjBjbJRY2nZ4NfKA/edit) (19.10.2026) · [Hydrovisor – Vorschlag Anlagen, Gefässe und QR-Etiketten](https://docs.google.com/document/d/1GeoCEVyLFDOSxODNKFZ4NJSTtwAieYJOP04fspRLv6c/edit) (23.10.2026) · [Hydrovisor – Marktvergleich und Ergänzungen (Lauf 2\)](https://docs.google.com/document/d/1efnsIYZa6BvOsaBwln0Azvggq3NT8eHv_y2NCzP_8z4/edit) und [(Lauf 1\)](https://docs.google.com/document/d/198_nvTSZnJh5A4QydOhUt7tGYBG2Tq6DmjBi3aoesPk/edit) (21.10.2026) · [Hydrovisor – Lösungsvorschlag Phasenmodell und Sortenabdeckung](https://docs.google.com/document/d/1OGtISea7UpZHx1vhWccxsCA5wCs0APMTUvuJ0_0lW-k/edit) · [Aufbauplan V8.15](https://drive.google.com/file/d/1h6itYqHdoxd0NtJr0Kr3FRupOEpWLWvT/view) · [Düngeplan TriPart V1.6](https://drive.google.com/file/d/1shaRtaEtTOLOTpzPXbXtbQWYYcKXJ_jY/view) · [Hydrovisor Design System](https://claude.ai/artifact/ESZiDEJMo91cNcxHo7DkmP).  
**Hersteller und Fachquellen:** [Terra Aquatica TriPart](https://www.terraaquatica.com/mineral-fertiliser-solutions/tripart/) · [TriPart Dosiertabelle](https://www.terraaquatica.com/wp-content/uploads/2022/01/TriPart.pdf) · [Application Chart 2022](https://www.terraaquatica.com/wp-content/uploads/2022/03/Application-Chart-2022.pdf) · [P160 Pro2 (trimleaf)](https://trimleaf.com/products/aqua-master-tools-p160-pro-2-combo-pen) · [P160 Pro2 (Sage Horticulture)](https://www.sagehort.com.au/product/aqua-master-p160-pro2-combo-pen/) · [P160 Pro technische Daten](https://www.hydrotekhydroponics.com/aquamaster-p160-pro-ph-ec-ppm-tds-temp-combo-meter) · [Hydrobuilder: Reservoir-Management](https://learn.hydrobuilder.com/hydroponic-reservoir-management/) · [Hydrobuilder: Nachfüllrechner](https://hydrobuilder.com/pages/reservoir-volume-top-off-calculator) · [Rise Gardens: pH-Korrektur](https://risegardens.com/blogs/communitygarden/hydroponic-ph-keeps-dropping-after-adjusting) · [Science in Hydroponics: Kratky](https://scienceinhydroponics.com/2020/12/five-tips-to-succeed-when-doing-kratky-hydroponics.html) · [CTAHR: Kratky-Methode](https://www.ctahr.hawaii.edu/hawaii/downloads/A_Suspended_Pot_Non-circulating_Hydroponic_Method.pdf) · [UMass: pH- und EC-Stifte](https://www.umass.edu/agriculture-food-environment/greenhouse-floriculture/fact-sheets/how-to-use-ph-ec-pens-to-monitor-greenhouse-crop-nutrition) · Cornell CEA Lettuce und Baby Spinach Handbook (Links in Fassung 2).  
**Plattform und Druck:** [web.dev: Installation](https://web.dev/learn/pwa/installation) · [web.dev: WebAPKs](https://web.dev/articles/webapks) · [Android 12: Web-Links](https://developer.android.com/about/versions/12/web-intent-resolution) · [Chrome: Badging API](https://developer.chrome.com/docs/capabilities/web-apis/badging-api) · [Wake Lock](https://developer.chrome.com/docs/capabilities/web-apis/wake-lock) · [web.dev: Offline-Daten](https://web.dev/learn/pwa/offline-data) · [Chromium: window.print() auf Android](https://chromium.googlesource.com/chromium/src.git/+/4c172eea8b6649f1c1c620d1daa20ce733cee9e1) · [Mopria: Drucken ab Android 8](https://www.mopria.org/androidfaq) · [Epson WorkForce Pro WF-3820](https://epson.com/For-Work/Printers/Inkjet/WorkForce-Pro-WF-3820-Wireless-All-in-One-Printer/p/C11CJ07201) · [Honor: NFC-Bereich Magic5 Pro](https://www.honor.com/uk/support/content/en-us15840969) · [Supabase: geplante Funktionen](https://supabase.com/docs/guides/functions/schedule-functions).  
**Bedienung und Ergonomie:** [NN/g: Schieber](https://www.nngroup.com/articles/gui-slider-controls/) · [Baymard: Schieber](https://baymard.com/blog/slider-interfaces) · [Oladimeji et al. 2011](https://opendl.ifip-tc6.org/db/conf/interact/interact2011-4/OladimejiTC11.pdf) · [RainCheck](https://mynkgoel.github.io/pdfs/raincheck.pdf) · [WCAG 2.2: Farbe](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html). Weitere App- und Ergonomiequellen siehe Fassung 2, C7, und Marktvergleich Lauf 2\.

## **Nachtrag 28.10.2026: Zeitplan Z2 (K32, E19)**

Entschieden von Tim am 28.10.2026 auf Grundlage des Prüfberichts Projektstand vom 28.10.2026. Referentengespräch am 31.10.2026; bei Freigabe beginnt die App-Entwicklung am 1.11.2026 statt im Dezember. Im Dezember ist Tim unterwegs: online arbeitsfähig, aber nicht am Regal. Gepflanzt wird erst ab Januar 2027\. Bei Widerspruch gilt das Konzept v0.3 mit seinem Nachtrag «Zeitplan Z2 (K32)».  
Zeitplan Z2

* 1\. bis 15.11.2026: Strang 0 (Repository, Supabase-Organisation, GitHub Pages, Secrets, Design System) und Strang 1 (Spezifikation in drei Aufträgen, CLAUDE.md, Rollen, Skill /umsetzen); W0 Kontextdatei, Rollendateien und Probelauf erste Pflanzrunde; Gerätetest QR-Link, Druck und Push; Leitungswasser-EC messen; Kalibrieransatz für k; Etikettenbogen und Halterung bestellen; Regalbau beginnen. Meilenstein: Spezifikation von Tim abgenommen.  
* 16\. bis 30.11.2026: I0 Grundgerüst und Risikotests, erste Pakete; W0 Hauptlauf; Regal so weit bauen, dass im Januar Füllen, Erfassen und Prüfen genügen.  
* Dezember 2026 (remote): I0 abschliessen; I1a Anlage, Vorlagen, Gefässe, Etiketten, Prüfung; einfaches Säen und Keimung prüfen (K30) und «Satz duplizieren» (K31); Beginn I1b; Abnahme am Honor mit dem Demo-Datensatz; W0 Gesamtfreigabe. M0 am 15.12.2026: Push an 5 Tagen, KI liest 3 von 3 Tüten, App installiert, W0 freigegeben, Verbrauch je Rolle gemessen. M1a am 31.12.2026: I1a und einfaches Säen fertig; Akzeptanzkriterien der Prüfart \[Gerät\], die das Regal brauchen, bleiben offen («fertig unter Vorbehalt Regal») und werden in der ersten Januarwoche nachgeholt; die Pull Requests werden trotzdem zusammengeführt.  
* 1\. bis 7.1.2027: Regal fertigstellen, Grundaufnahme (Vorlagen, 11 Gefässe, 3 Anzuchtorte), Etiketten drucken und kleben, Gefässe prüfen, Leitungswasser-EC am Regal nachmessen, offene \[Gerät\]-Kriterien aus I1a; erste Aussaat (Tomate, Chili, Nüsslisalat, Kräuter) in Anzuchtboxen und Jungpflanzenstation mit dem einfachen Säen. Regalfreigabe am 7.1.2027: alle Gefässe «in Betrieb», erste Aussaat erfasst.  
* 8\. bis 15.1.2027: I1b abschliessen (Rundgang, Push, Einstellungen); Regaltest A bis D mit der Messmaske am Regal; erste Messrunde mit der App. M1 am 15.1.2027: Messen, Düngen, Erinnern am Regal abgenommen, danach eine Woche ohne Papier.  
* 16.1. bis 15.2.2027: I2 Sorten, Pflanzen, Phasen; erstes Paket ist «Umsetzen», weil die erste Runde Anfang Februar umsetzreif ist; Folgesatz alle 2 Wochen mit «Satz duplizieren»; Umsetzen der ersten Runde in die Zielgefässe und erster Lösungsansatz mit dem Düngerrechner. M2 am 15.2.2027: App Stufe 1; Feature-Freeze 15.2.2027.  
* 16\. bis 28.2.2027: Reserve für Nachbesserungen; Erweiterungen aus dem Pool nur, wenn M2 gehalten hat. Ab 1.3.2027 nur noch Fehlerbehebungen (I3); Testbetrieb bis April, Abgabe Ende April 2027\.

Änderungen an Teil A und C: A5 Zeitplan: Zeiträume und Meilensteine wie oben; der Dezember trägt die Software-Arbeit remote, die Regalarbeit liegt in der ersten Januarwoche. C2 Inkrementplan: Zeiträume entsprechend; der Umfang je Inkrement ist unverändert, ausser dass rund 0.75 PT (K30 0.5 PT, K31 0.25 PT) von I1b nach I1a wandern. Tims Zeit: rund 104 h vom 1.11.2026 bis 28.2.2027, rund 6 h pro Woche, im Dezember 8 bis 9 h; die Spezifikation (rund 12 bis 15 h) ist neu mitgezählt. E1 (rund 6 h pro Woche) bleibt gültig.  
Akzeptanzkriterien der Prüfart \[Gerät\], die das Regal oder das Etikett am Regal brauchen, werden im Dezember nicht geprüft, sondern als offene Liste geführt und in der ersten Januarwoche abgearbeitet; die Pull Requests werden trotzdem zusammengeführt («fertig unter Vorbehalt Regal»).  
E19 Zeitplan Z2 (28.10.2026): Start der Entwicklung am 1.11.2026 bei Freigabe des Dispositivs am 31.10.2026; Dezember remote ohne Regalarbeit; Meilensteine M0 15.12.2026, Regalfreigabe 7.1.2027, M1 15.1.2027, M2 und Feature-Freeze 15.2.2027; Rückfall auf den bisherigen Takt (M1 Ende Januar, M2 Ende Februar) am M0, falls I1a im Dezember nicht fertig wird.  
K32 Zeitplan Z2: Stelle A5, C2, Konzept «Vorgehen und Zeitplan»; Inhalt wie E19; gilt seit 28.10.2026. Herleitung im Prüfbericht Projektstand 28.10.2026, Kapitel 3.1 (Ordner «Prüfubericht Projektstand 28.10.26»).