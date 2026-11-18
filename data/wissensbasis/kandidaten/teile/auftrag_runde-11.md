# Auftrag W0 Runde 11 (Issue #242, 18.11.2026)

Koordinator: Lead (Entscheid 0018). Ziel: Kulturform-Felder für den Erntekalender (UC15) und die Kulturfrage (R1.7).

## Gesucht (nur diese Felder, `art.csv`, Zeilen `ak.<art_id>.<kulturform>.<feld>`)

| Feld | Bedeutung | Format (`03_import_w0.md` 4.3.3) |
|---|---|---|
| `ernteintervall_d` | Tage zwischen zwei Schnitten bzw. Pflückgängen | ganze Tage; nur bei `ernteart = mehrfach` |
| `schnitte_max` | wie viele Schnitte bzw. Ernten eine Pflanze sinnvoll liefert, bevor sie ersetzt wird | Ganzzahl; nur bei `mehrfach`; bei Fruchtgemüse die Zahl der Pflückgänge nur, wenn eine Quelle sie nennt |
| `kulturdauer_max_d` | Tage ab Saat, nach denen die Kultur endet (letzte Ernte, Ersatz, Abbruch) | ganze Tage ab Saat |
| `kulturdauer_typisch_d` | nur nebenbei, wenn dieselbe Quelle sie nennt | ganze Tage ab Saat, ≤ max |

## Lücken je Kulturgruppe

| Kulturgruppe | Art (`art_id`) | Kulturform (Ernteart) | gesucht |
|---|---|---|---|
| blattsalat | `lactuca_sativa` | schnitt (mehrfach) | ernteintervall_d, schnitte_max, kulturdauer_max_d |
| blattsalat | `lactuca_sativa` | kopf, babyleaf (einmalig) | kulturdauer_max_d |
| blattsalat | `valerianella_locusta` | kopf (einmalig) | kulturdauer_max_d |
| fruchtgemuese | `solanum_lycopersicum` | dauerkultur_frucht (mehrfach) | ernteintervall_d, schnitte_max, kulturdauer_max_d |
| fruchtgemuese | `capsicum_annuum` | dauerkultur_frucht (mehrfach) | ernteintervall_d, schnitte_max, kulturdauer_max_d |
| kohl | `brassica_rapa_chinensis` | kopf (einmalig) | kulturdauer_max_d |
| kraut_einjaehrig | `ocimum_basilicum` | dauerkultur_blatt, schnitt (mehrfach) | ernteintervall_d, schnitte_max, kulturdauer_max_d |
| kraut_ausdauernd | `allium_schoenoprasum` | dauerkultur_blatt, schnitt (mehrfach) | ernteintervall_d, schnitte_max, kulturdauer_max_d |
| kraut_ausdauernd | `petroselinum_crispum` | dauerkultur_blatt (mehrfach) | ernteintervall_d, schnitte_max, kulturdauer_max_d |
| fuchsschwanz | `spinacia_oleracea` | schnitt (mehrfach) | ernteintervall_d, schnitte_max, kulturdauer_max_d |
| fuchsschwanz | `spinacia_oleracea` | babyleaf, kopf (einmalig) | kulturdauer_max_d |
| fuchsschwanz | `beta_vulgaris_conditiva` | schnitt (mehrfach) | ernteintervall_d, schnitte_max, kulturdauer_max_d |
| fuchsschwanz | `beta_vulgaris_cicla` | schnitt (mehrfach) | ernteintervall_d, schnitte_max, kulturdauer_max_d (Kandidaten aus `horticulturae-mangold-meerwasser-2022` stehen schon als `entwurf` da; weitere Quellen suchen) |

## Regeln für diese Runde

- Quellen wie immer zuerst hydroponisch (DWC, Kratky, NFT, Floating, inertes Substrat), Klasse A bis C. frankiesgarten.de ist Praxisquelle Klasse C (Entscheid 0018, `docs/w0/ablauf.md` Annahme 9). Indoor mit LED vorziehen.
- Fehlt eine hydroponische Quelle, kein Kandidat: Eintrag in die Lückenliste von `recherche.md` (Klasse D). Erde, Freiland und Tüten nicht als Kandidat; nenne aber in der Lückenliste in einem Satz, was Anbauquellen sagen (mit Link), damit der Lead die Klasse-D-Lücke mit Fachlogik entscheiden kann.
- Nur wörtlich belegte Zahlen. Tage ab Saat: Rechnung in `fundstelle`, wenn die Quelle ab Umsetzen zählt und dieselbe Quelle die Anzucht nennt. Wochen in Tage nicht umrechnen: Wert in Wochen als Kandidat mit `vermerk` «Wochen» in `fundstelle` angeben, die Umrechnung (Regel D4) macht der Lead.
- Bestehende Zeilen in den Arbeitsdateien nicht ändern; neue Zeilen unten anhängen; `kandidat_id` fortlaufend nach den bestehenden Nummern derselben `zeile_id`. Neue Quellen unten in `quelle.csv` (bestehende `quelle_id` wiederverwenden, keine doppelte Zeile).
- `recherche.md`: einen Abschnitt «Runde 11 (#242)» unten anhängen.
