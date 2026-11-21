# Auftrag W0 Runde 12 (Issue #250, 19.11.2026)

Koordinator: Lead (Entscheid 0018). Ziel: Basilikum, Petersilie und die übrigen Kräuter und Schnittkulturen zeigen im Erntekalender (UC15, Konzept v1.9 R1.7) echte Termine statt «Termine noch offen». Dafür fehlen die erste Ernte (`ernte_ab_d`) und das Kulturende (`kulturdauer_max_d`), dazu die übrigen Klasse-D-Lücken aus Runde 11 (`berichte/lead_entscheide_runde-11.md`, Tabelle «Verbleibende Lücken»).

## Gesucht (nur diese Felder, `art.csv`, Zeilen `ak.<art_id>.<kulturform>.<feld>`)

| Feld | Bedeutung | Format (`03_import_w0.md` 4.3.3) |
|---|---|---|
| `ernte_ab_d` | Tage **ab Umsetzen** in das Endsystem bis zur ersten Ernte (erster Schnitt); bei Direktsaat in das Endsystem ab Saat | ganze Tage |
| `ernteintervall_d` | Tage zwischen zwei Schnitten bzw. Pflückgängen | ganze Tage; nur bei `ernteart = mehrfach` |
| `schnitte_max` | wie viele Schnitte bzw. Ernten eine Pflanze sinnvoll liefert, bevor sie ersetzt wird | Ganzzahl; nur bei `mehrfach` |
| `kulturdauer_max_d` | Tage ab Saat, nach denen die Kultur endet (letzte Ernte, Ersatz, Abbruch) | ganze Tage ab Saat |
| `kulturdauer_typisch_d` | nur nebenbei, wenn dieselbe Quelle sie nennt | ganze Tage ab Saat, ≤ max |

**Bezug von `ernte_ab_d`:** Zählt die Quelle ab Saat, gib den Wert ab Umsetzen nur an, wenn dieselbe Quelle den Umsetztag nennt, und schreibe die Rechnung in `fundstelle` («Tage ab Saat 42 minus Umsetzen 14 = 28»). Nennt die Quelle nur Tage ab Saat ohne Umsetztag, lege den Kandidaten trotzdem an, mit dem Rohwert ab Saat und dem Satz «ab Saat, Umsetztag nicht genannt» am Anfang von `fundstelle`; die Umrechnung macht der Lead. Direktsaat in das Endsystem (Floating, NFT, Würfel im Endsystem) zählt ab Saat: das in `fundstelle` vermerken.

## Lücken je Kulturgruppe

| Kulturgruppe | Art (`art_id`) | Kulturform (Ernteart) | gesucht |
|---|---|---|---|
| kraut_einjaehrig | `ocimum_basilicum` | dauerkultur_blatt (mehrfach) | **ernte_ab_d**, schnitte_max, kulturdauer_max_d |
| kraut_einjaehrig | `ocimum_basilicum` | schnitt (mehrfach) | schnitte_max, kulturdauer_max_d (ernte_ab_d 50 ist freigegeben) |
| kraut_ausdauernd | `petroselinum_crispum` | dauerkultur_blatt (mehrfach) | **ernte_ab_d**, schnitte_max, kulturdauer_max_d (Hinweis: Virginia Tech SPES-466 nennt «Harvest 49–84 d»; prüfen, ob die Quelle hydroponisch ist) |
| kraut_ausdauernd | `allium_schoenoprasum` | dauerkultur_blatt (mehrfach) | **ernte_ab_d**, ernteintervall_d, schnitte_max |
| kraut_ausdauernd | `allium_schoenoprasum` | schnitt (mehrfach) | **ernte_ab_d**, ernteintervall_d, schnitte_max, kulturdauer_max_d |
| fuchsschwanz | `spinacia_oleracea` | schnitt (mehrfach) | **ernte_ab_d**, kulturdauer_max_d |
| fuchsschwanz | `spinacia_oleracea` | babyleaf, kopf (einmalig) | kulturdauer_max_d |
| fuchsschwanz | `beta_vulgaris_conditiva` | schnitt (mehrfach) | **ernte_ab_d**, ernteintervall_d, schnitte_max, kulturdauer_max_d |
| fuchsschwanz | `beta_vulgaris_cicla` | schnitt (mehrfach) | **ernte_ab_d**, ernteintervall_d, schnitte_max, kulturdauer_max_d |
| blattsalat | `lactuca_sativa` | schnitt (mehrfach) | **ernte_ab_d** (Intervall 7, Schnitte 2, max. 42 sind freigegeben) |
| blattsalat | `lactuca_sativa` | babyleaf (einmalig) | **ernte_ab_d**, kulturdauer_max_d |
| blattsalat | `lactuca_sativa` | kopf (einmalig) | kulturdauer_max_d |
| fruchtgemuese | `solanum_lycopersicum` | dauerkultur_frucht (mehrfach) | ernteintervall_d, schnitte_max |
| fruchtgemuese | `capsicum_annuum` | dauerkultur_frucht (mehrfach) | schnitte_max, kulturdauer_max_d |

Fett: Vorrang. Die erste Ernte der Kräuter und Schnittkulturen ist das Ziel dieser Runde.

## Regeln für diese Runde

- Quellen wie immer zuerst hydroponisch (DWC, Kratky, NFT, Floating, inertes Substrat), Klasse A bis C. frankiesgarten.de ist Praxisquelle Klasse C (Entscheid 0018, `docs/w0/ablauf.md` Annahme 9). Indoor mit LED vorziehen. Versuche, die einen Erntetermin nennen (erster Schnitt, «first harvest», «harvested … days after transplanting»), sind für `ernte_ab_d` geeignet; ein reines Versuchsende ohne Aussage zur Kultur ist kein `kulturdauer_max_d`.
- Fehlt eine hydroponische Quelle, kein Kandidat: Eintrag in die Lückenliste von `recherche.md` (Klasse D). Erde, Freiland und Tüten nicht als Kandidat; nenne aber in der Lückenliste in einem Satz, was Anbauquellen sagen (mit Link).
- **Gleiche Art:** Ein Kandidat belegt nur die Art, die die Quelle untersucht (Konzept 9.3 Regel 4). Eine Quelle zu Mangold belegt nicht Randen und umgekehrt, auch wenn beide `Beta vulgaris` sind; nur wenn die Quelle beide untersucht, je Art eine eigene Zeile.
- Nur wörtlich belegte Zahlen. Wochen, Monate und Jahre nicht in Tage umrechnen: Wert roh als Kandidat mit der Einheit am Anfang von `fundstelle` («Wochen: …»), die Umrechnung (Regel D4) macht der Lead.
- **Erreichbarkeit:** Der Quellenprüfer muss die Fundstelle mit einem normalen Abruf lesen können. Quellen, deren Volltext automatisch nicht abrufbar ist (in Runde 11 die Verlagsseiten von MDPI mit HTTP 403), nur verwenden, wenn derselbe Volltext auf einem frei zugänglichen Weg vorliegt (PMC `https://pmc.ncbi.nlm.nih.gov/articles/PMC…/`, Europe PMC, Repositorium der Hochschule); diesen Weg als `link` in `quelle.csv` angeben. Sonst gleichwertige andere Quellen vorziehen.
- Bestehende Zeilen in den Arbeitsdateien nicht ändern; neue Zeilen unten anhängen; `kandidat_id` fortlaufend nach den bestehenden Nummern derselben `zeile_id` (auch verworfene zählen). Neue Quellen unten in `quelle.csv` (bestehende `quelle_id` wiederverwenden, keine doppelte Zeile).
- `recherche.md`: einen Abschnitt «Runde 12 (#250)» unten anhängen.
