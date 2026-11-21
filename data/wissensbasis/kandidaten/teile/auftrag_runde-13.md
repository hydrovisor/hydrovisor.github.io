# Auftrag W0 Runde 13 (Issue #258, 21.11.2026)

Koordinator: Lead (Entscheid 0018). Auftrag Tims im Chat vom 21.11.2026: «Setze alle genannten Punkte vollautomatisch bis ans Ende um und suche jeweils eine Lösung dazu bei Problemstellungen.» Ziel: die übrigen Klasse-D-Lücken der Erntewerte (Tabelle «Verbleibende Lücken» in `berichte/lead_entscheide_runde-12.md`) und der Umsetztag (`art.umsetzen_ab_d`, `art.umsetzen_bis_d`) der Kräuter, Randen und Mangold. Der Umsetztag ist Bezug des Erntekalenders vor dem Umsetzen (`ersteErnteAb()`, Konzept v1.10 UC15) und der Passung (R3.1).

## Gesucht (nur diese Felder, `art.csv`)

| Feld | `zeile_id` | Bedeutung | Format (`03_import_w0.md` 4.3.3) |
|---|---|---|---|
| `umsetzen_ab_d`, `umsetzen_bis_d` | `art.<art_id>.<feld>` (Kulturform leer) | frühester und spätester Tag ab Saat, an dem der Keimling aus dem Würfel bzw. der Anzucht in das Endsystem umgesetzt wird | ganze Tage ab Saat |
| `ernte_ab_d` | `ak.<art_id>.<kulturform>.ernte_ab_d` | Tage **ab Umsetzen** bis zur ersten Ernte (erster Schnitt); bei Direktsaat ab Saat | ganze Tage |
| `ernteintervall_d` | `ak.…` | Tage zwischen zwei Schnitten bzw. Pflückgängen | ganze Tage; nur `mehrfach` |
| `schnitte_max` | `ak.…` | wie viele Schnitte bzw. Ernten eine Pflanze sinnvoll liefert, bevor sie ersetzt wird | Ganzzahl; nur `mehrfach` |
| `kulturdauer_max_d` | `ak.…` | Tage ab Saat, nach denen die Kultur endet (letzte Ernte, Ersatz) | ganze Tage ab Saat |

**Bezug von `ernte_ab_d`:** wie Runde 12. Zählt die Quelle ab Saat, Wert ab Umsetzen nur, wenn dieselbe Quelle den Umsetztag nennt (Rechnung in `fundstelle`); sonst Rohwert ab Saat mit «ab Saat, Umsetztag nicht genannt» am Anfang von `fundstelle` (Umrechnung D7 macht der Lead). Ein Umsetztag in derselben Quelle ist zugleich ein Kandidat für `art.<art_id>.umsetzen_ab_d`.

## Lücken je Kulturgruppe

| Kulturgruppe | Art (`art_id`) | Kulturform (Ernteart) | gesucht |
|---|---|---|---|
| kraut_einjaehrig | `ocimum_basilicum` | Art | **umsetzen_ab_d**, umsetzen_bis_d |
| kraut_einjaehrig | `ocimum_basilicum` | dauerkultur_blatt, schnitt (mehrfach) | schnitte_max, kulturdauer_max_d |
| kraut_ausdauernd | `petroselinum_crispum` | Art | **umsetzen_ab_d**, umsetzen_bis_d |
| kraut_ausdauernd | `petroselinum_crispum` | dauerkultur_blatt (mehrfach) | schnitte_max, kulturdauer_max_d |
| kraut_ausdauernd | `allium_schoenoprasum` | Art | **umsetzen_ab_d**, umsetzen_bis_d |
| kraut_ausdauernd | `allium_schoenoprasum` | dauerkultur_blatt (mehrfach) | **ernte_ab_d**, ernteintervall_d, schnitte_max |
| kraut_ausdauernd | `allium_schoenoprasum` | schnitt (mehrfach) | **ernte_ab_d**, ernteintervall_d, schnitte_max, kulturdauer_max_d |
| fuchsschwanz | `beta_vulgaris_conditiva` | Art | **umsetzen_ab_d**, umsetzen_bis_d |
| fuchsschwanz | `beta_vulgaris_conditiva` | schnitt (mehrfach) | **ernte_ab_d**, ernteintervall_d, schnitte_max, kulturdauer_max_d |
| fuchsschwanz | `beta_vulgaris_cicla` | Art | **umsetzen_ab_d**, umsetzen_bis_d |
| fuchsschwanz | `beta_vulgaris_cicla` | schnitt (mehrfach) | ernteintervall_d, schnitte_max, kulturdauer_max_d |
| fuchsschwanz | `spinacia_oleracea` | schnitt (mehrfach) | **ernte_ab_d**, kulturdauer_max_d |
| fuchsschwanz | `spinacia_oleracea` | babyleaf, kopf (einmalig) | kulturdauer_max_d |
| fruchtgemuese | `solanum_lycopersicum` | dauerkultur_frucht (mehrfach) | ernteintervall_d, schnitte_max |
| fruchtgemuese | `capsicum_annuum` | dauerkultur_frucht (mehrfach) | schnitte_max, kulturdauer_max_d |

Fett: Vorrang.

## Gesperrte Volltexte aus Runde 12: Lesekopien

In Runde 12 sind fünf Kandidaten verworfen worden, weil die Prüfrollen den Volltext wegen der Verlagssperre (HTTP 403 bzw. Bot-Prüfung) nicht abrufen konnten. Der Koordinator hat die Artikel am 21.11.2026 im eingebauten Browser der Claude-App gelesen, wie ein Mensch eine Artikelseite liest (normale Artikelseite bzw. Leseansicht des Verlags; keine CAPTCHA gelöst, kein anderer Server, kein Download), und die massgebenden Absätze wörtlich als **Lesekopie** abgelegt. Er hat dabei nichts ausgewählt oder bewertet ausser der Abgrenzung der Absätze.

| Quelle (`quelle_id`) | Lesekopie | betrifft |
|---|---|---|
| `horticulturae-mangold-meerwasser-2022` | `lesekopien/horticulturae-mangold-meerwasser-2022.md` | Mangold `umsetzen_ab_d`, `ernte_ab_d`, `ernteintervall_d`, `schnitte_max` |
| `agriculture-spinat-rauke-floating-2021` | `lesekopien/agriculture-spinat-rauke-floating-2021.md` | Spinat Schnitt `ernte_ab_d`, Schnitte, Babyleaf `kulturdauer_max_d` |
| `adv-hort-sci-27-basilikum-nft-2013` | `lesekopien/adv-hort-sci-27-basilikum-nft-2013.md` | Basilikum Dauerkultur `ernte_ab_d` (schon 18 freigegeben; nur zur Prüfung), Kulturende |
| `agriculture-randen-babyleaf-2025` | keine: MDPI zeigt für diesen Artikel nur das PDF, kein HTML; ein Download ist nicht freigegeben | Randen `umsetzen_ab_d` bleibt ohne Prüfung, gleichwertige Quelle suchen |

Ordner der Lesekopien: `C:\Users\Tim_L\AppData\Local\Claude-Data\claude_pzs8sxrjxfjjc\side-session-notes\local_e10dfe29-ae57-4c04-93ca-676bfdb738ee\lesekopien\` (ausserhalb des Repositorys).

- Für Werte aus einer Lesekopie legst du **neue** Kandidatenzeilen an (nächste `kandidat_id`, alte verworfene Zeilen bleiben). `fundstelle` beginnt mit «Lesekopie 21.11.2026 (Artikelseite im Browser): » und nennt danach Abschnitt bzw. Tabelle; `kurzzitat` wörtlich aus der Lesekopie; `vermerk` = `keine` (der Hinweis «Lesekopie» steht am Anfang von `fundstelle`; `lesekopie` ist kein zulässiger Wert, 03_import_w0.md).
- Ist die Quellenzeile in `quelle.csv` verworfen (`agriculture-spinat-rauke-floating-2021`), hängst du eine neue Zeile mit derselben `kandidat_id` und Status `entwurf` unten an (Methoden- und Quellenprüfung leer); der Link bleibt die DOI.
- Triffst du in dieser Runde selbst auf eine Quelle, deren Volltext automatisch gesperrt ist (403, Bot-Prüfung, nur PDF bei MDPI), die aber für eine Lücke wichtig ist: **keinen** Kandidaten aus Suchauszügen anlegen, keinen anderen Server (z. B. `mdpi-res.com`, Spiegel, Archiv) für den Abruf nutzen. Trage sie in `recherche.md` unter «Nur im Browser lesbar» mit Artikelseite, erwarteter Fundstelle und gesuchtem Feld ein (höchstens vier, wichtigste zuerst). Der Koordinator legt bei Bedarf eine Lesekopie an und gibt sie dir zurück.

## Regeln für diese Runde

- Wie Runde 12: hydroponisch zuerst (DWC, Kratky, NFT, Floating, inertes Substrat), Klasse A bis C; frankiesgarten.de Klasse C (Entscheid 0018); Indoor mit LED vorziehen. Ein reines Versuchsende ohne Aussage zur Kultur ist kein `kulturdauer_max_d`; ein Versuchsende nach dem letzten geplanten Schnitt mit Ersatz der Pflanzen ist einer, wenn die Quelle das so sagt.
- **Umsetztag:** Anzucht in Steinwolle, Schaum, Oasis oder Würfeln und danach Umsetzen in DWC, NFT oder Floating ist das Muster der Anlage. Nennt die Quelle ein Stadium statt eines Tages («two true leaves»), ist das kein Kandidat; nur Tage ab Saat (oder Wochen roh mit Einheit). Ein Bereich «14 to 21 days» ergibt zwei Kandidaten (`umsetzen_ab_d` 14, `umsetzen_bis_d` 21) mit demselben Zitat.
- Fehlt eine hydroponische Quelle, kein Kandidat: Eintrag in die Lückenliste von `recherche.md` (Klasse D) mit einem Satz, was Anbauquellen sagen (mit Link).
- **Gleiche Art** (Konzept 9.3 Regel 4): Mangold belegt nicht Randen und umgekehrt.
- Nur wörtlich belegte Zahlen. Wochen, Monate und Jahre nicht umrechnen (Einheit am Anfang von `fundstelle`, «Wochen: …»); die Umrechnung D4 macht der Lead.
- **Erreichbarkeit:** Der Quellenprüfer muss die Fundstelle mit einem normalen Abruf lesen können oder es muss eine Lesekopie des Koordinators geben. PMC, Europe PMC, CORE und Hochschul-Repositorien sind frei; diesen Weg als `link` angeben.
- Bestehende Zeilen nicht ändern; neue Zeilen unten anhängen; `kandidat_id` fortlaufend nach den bestehenden Nummern derselben `zeile_id` (auch verworfene zählen). Neue Quellen unten in `quelle.csv` (bestehende `quelle_id` wiederverwenden).
- `recherche.md`: Abschnitt «Runde 13 (#258)» unten anhängen, mit Unterabschnitten «Kandidaten», «Lückenliste Runde 13 (Klasse D)» und «Nur im Browser lesbar».
