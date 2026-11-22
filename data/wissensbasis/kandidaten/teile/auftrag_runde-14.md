# Auftrag W0 Runde 14 (Issue #266, 22.11.2026)

Koordinator: Lead (Entscheid 0018). Auftrag Tims im Chat vom 22.11.2026: «Runde 14 und Wächter». Ziel: die Klasse-D-Lücken nach Runde 13 (Tabelle «Verbleibende Lücken» in `berichte/lead_entscheide_runde-13.md`), **zuerst `ernte_ab_d` für Schnittlauch und Spinat Schnitt**: Ohne diesen Wert zeigt der Erntekalender bei diesen Kulturformen «Termine noch offen». Massgebend sind Konzept v1.11 9.1 bis 9.4 (Ableitungsregeln D1 bis D8 und E1 bis E3, Lesekopie) und `docs/w0/ablauf.md`.

## Gesucht (nur diese Felder, `art.csv`)

| Feld | `zeile_id` | Bedeutung | Format (`03_import_w0.md` 4.3.3) |
|---|---|---|---|
| `ernte_ab_d` | `ak.<art_id>.<kulturform>.ernte_ab_d` | Tage **ab Umsetzen** bis zur ersten Ernte (erster Schnitt); bei Direktsaat ab Saat | ganze Tage |
| `ernteintervall_d` | `ak.…` | Tage zwischen zwei Schnitten bzw. Pflückgängen | ganze Tage; nur `mehrfach` |
| `schnitte_max` | `ak.…` | wie viele Schnitte bzw. Ernten eine Pflanze sinnvoll liefert, bevor sie ersetzt wird | Ganzzahl; nur `mehrfach` |
| `kulturdauer_max_d` | `ak.…` | Tage ab Saat, nach denen die Kultur endet (letzte Ernte, Ersatz) | ganze Tage ab Saat |
| `umsetzen_bis_d` | `art.<art_id>.umsetzen_bis_d` (Kulturform leer) | spätester Tag ab Saat, an dem der Keimling umgesetzt wird | ganze Tage ab Saat |

**Bezug von `ernte_ab_d`:** Zählt die Quelle ab Saat, Wert ab Umsetzen nur, wenn dieselbe Quelle den Umsetztag nennt (Rechnung in `fundstelle`); sonst Rohwert ab Saat mit «ab Saat, Umsetztag nicht genannt» am Anfang von `fundstelle` (Umrechnung D7 macht der Lead mit dem freigegebenen `umsetzen_ab_d`: Schnittlauch 28, Spinat 9, Randen 9, Mangold 21, Basilikum 14, Petersilie 21, Tomate 10, Chili 10).

**Bereiche (neu in Runde 14):** Nennt die Quelle für `ernte_ab_d` oder `ernteintervall_d` einen Bereich («three to four weeks», «every 2-3 weeks»), legst du **einen** Kandidaten an: `wert` = untere Grenze als Rohzahl, `fundstelle` beginnt mit «Bereich: <untere> bis <obere> <Einheit>; ». Du wählst damit nichts aus; den Wert aus dem Bereich leitet der Lead als eigenen Wert ab (`ablauf.md` Annahme 5 und 9). Für `schnitte_max` und `kulturdauer_max_d` gilt dasselbe mit `wert` = obere Grenze («Bereich: …; obere Grenze»).

## Lücken je Kulturgruppe

| Kulturgruppe | Art (`art_id`) | Kulturform (Ernteart) | gesucht |
|---|---|---|---|
| kraut_ausdauernd | `allium_schoenoprasum` | dauerkultur_blatt (mehrfach) | **ernte_ab_d**, ernteintervall_d, schnitte_max |
| kraut_ausdauernd | `allium_schoenoprasum` | schnitt (mehrfach) | **ernte_ab_d**, ernteintervall_d, schnitte_max, kulturdauer_max_d |
| kraut_ausdauernd | `petroselinum_crispum` | dauerkultur_blatt (mehrfach) | schnitte_max, kulturdauer_max_d |
| kraut_einjaehrig | `ocimum_basilicum` | Art | umsetzen_bis_d (D8: nur Klasse A oder B1, mindestens 27 Tage ab Saat) |
| kraut_einjaehrig | `ocimum_basilicum` | dauerkultur_blatt, schnitt (mehrfach) | schnitte_max, kulturdauer_max_d |
| fuchsschwanz | `spinacia_oleracea` | schnitt (mehrfach) | **ernte_ab_d**, kulturdauer_max_d |
| fuchsschwanz | `spinacia_oleracea` | kopf (einmalig) | kulturdauer_max_d |
| fuchsschwanz | `beta_vulgaris_conditiva` | Art | umsetzen_bis_d |
| fuchsschwanz | `beta_vulgaris_conditiva` | schnitt (mehrfach) | ernte_ab_d, ernteintervall_d, schnitte_max, kulturdauer_max_d |
| fuchsschwanz | `beta_vulgaris_cicla` | schnitt (mehrfach) | schnitte_max, kulturdauer_max_d |
| fruchtgemuese | `solanum_lycopersicum` | dauerkultur_frucht (mehrfach) | schnitte_max |
| fruchtgemuese | `capsicum_annuum` | dauerkultur_frucht (mehrfach) | schnitte_max, kulturdauer_max_d |

Fett: Vorrang. Lies vor der Suche den Abschnitt «Runde 13 (#258)» und frühere Abschnitte in `recherche.md` deiner Gruppe: Quellen, die dort verworfen oder als Lücke begründet sind, nicht erneut anlegen. Neue Suchwege: Beratungsstellen mit eigenen Hydroponik-Anleitungen (Universitäten, CEA-Zentren), Hersteller hydroponischer Systeme mit Kulturplänen (Klasse B2), begutachtete Studien mit Folgeschnitten unter LED oder im Gewächshaus mit Nährlösung, Abschlussarbeiten in Hochschul-Repositorien.

## Fachliche Hinweise

- **Spinat Schnitt `ernte_ab_d`:** In Runde 13 verworfen ist ein Winterversuch mit Wassertemperatur 6 bis 15 °C (34 Tage, über Wachstum max 28). Gesucht ist eine Quelle mit Schnittkultur (mehrere Schnitte derselben Pflanze) in DWC, NFT, Floating oder Substrat mit Nährlösung bei üblicher Wassertemperatur (etwa 18 bis 24 °C) oder unter LED.
- **Schnittlauch:** In Runde 13 lagen nur Bereiche vor (CRC und Gardyn 75 bis 85 Tage ab Saat, agrowtronics «Three to four weeks», Intervall «two to three weeks»); sie sind mit der Bereichsregel oben jetzt Kandidaten, wenn die Methodenprüfung die Quelle zulässt. Simply Hydroponics «every three to eight weeks» gilt für *Allium tuberosum* (andere Art, Regel 4).
- **`schnitte_max` und `kulturdauer_max_d`:** Ein reines Versuchsende oder ein Versuchsplan («four successive harvests») ohne Aussage zur Kultur trägt das Feld nicht; unbestimmte Angaben («easily last a year», «several months») ebenfalls nicht. Gesucht sind Aussagen wie «replace plants after N harvests», «productive for N months, then replace». Monate nicht umrechnen (Einheit am Anfang von `fundstelle`, «Monate: …»).
- **Gleiche Art** (Konzept 9.3 Regel 4): Mangold belegt nicht Randen und umgekehrt; Schnittknoblauch nicht Schnittlauch.

## Gesperrte Volltexte: Lesekopien

Triffst du auf eine Quelle, deren Volltext automatisch gesperrt ist (403, Bot-Prüfung, nur PDF bei MDPI, Seite nur mit JavaScript), die aber für eine Lücke wichtig ist: **keinen** Kandidaten aus Suchauszügen anlegen, keinen anderen Server (Spiegel, Archiv, `mdpi-res.com`) nutzen. Trage sie in `recherche.md` unter «Nur im Browser lesbar» mit Artikelseite, erwarteter Fundstelle und gesuchtem Feld ein (höchstens vier, wichtigste zuerst). Der Koordinator liest die Artikelseite im eingebauten Browser wie ein Mensch (keine CAPTCHA, kein Download, kein anderer Server) und legt die Absätze wörtlich als Lesekopie ab; danach legst du die Kandidaten mit `fundstelle` «Lesekopie 22.11.2026 (Artikelseite im Browser): …» an. Bestehende Lesekopien aus Runde 13: `C:\Users\Tim_L\AppData\Local\Claude-Data\claude_pzs8sxrjxfjjc\side-session-notes\local_e10dfe29-ae57-4c04-93ca-676bfdb738ee\lesekopien\` (Spinat/Rauke Floating, Mangold Meerwasser und NFT, Basilikum NFT, Petersilie DWC, Kräuter NFT).

## Regeln für diese Runde

- Wie Runde 13: hydroponisch zuerst (DWC, Kratky, NFT, Floating, inertes Substrat), Klasse A bis C; frankiesgarten.de Klasse C (Entscheid 0018); Indoor mit LED vorziehen.
- Fehlt eine hydroponische Quelle, kein Kandidat: Eintrag in die Lückenliste von `recherche.md` (Klasse D) mit einem Satz, was Anbauquellen sagen (mit Link).
- Nur wörtlich belegte Zahlen. Wochen, Monate und Jahre nicht umrechnen (Einheit am Anfang von `fundstelle`, «Wochen: …»); die Umrechnung D4 macht der Lead.
- `vermerk` nur `keine`, `katalog`, `tuete` oder `testbetrieb`.
- **Erreichbarkeit:** Der Quellenprüfer muss die Fundstelle mit einem normalen Abruf lesen können oder es muss eine Lesekopie des Koordinators geben. PMC, Europe PMC, CORE und Hochschul-Repositorien sind frei; diesen Weg als `link` angeben.
- Bestehende Zeilen nicht ändern; neue Zeilen unten anhängen; `kandidat_id` fortlaufend nach den bestehenden Nummern derselben `zeile_id` (auch verworfene zählen). Neue Quellen unten in `quelle.csv` (bestehende `quelle_id` wiederverwenden; ist die bestehende Quellenzeile verworfen, neue Zeile mit derselben `kandidat_id` und Status `entwurf`).
- `recherche.md`: Abschnitt «Runde 14 (#266)» unten anhängen, mit Unterabschnitten «Kandidaten», «Lückenliste Runde 14 (Klasse D)» und «Nur im Browser lesbar».
- Keine Personennamen (Autoren) im Repository, auch nicht in `recherche.md` oder `fundstelle`.
