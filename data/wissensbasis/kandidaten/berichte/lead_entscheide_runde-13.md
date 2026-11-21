# Lead-Entscheide W0 Runde 13 (Entscheid 0018, Issue #258)
Stand 21.11.2026. Erzeugt aus den Kandidatendateien (Spalte `notiz_tim` der freigegebenen Zeilen). Werkzeug: `scripts/w0/lead_entscheide_runde13.py` mit `scripts/w0/w0lib.py`, Bericht `scripts/w0/berichte.py`.

## Fachregeln für offene Werte (A)
| Regel | Inhalt |
|---|---|
| D1 | Bereich ohne typischen Wert: typ = abgerundete Mitte |
| D2 | mehrere Einzelwerte: min und max = kleinster und grösster Quellenwert, typ = Wert der besten Quelle nach Regel 9.3 |
| D3 | ein Einzelwert x: min = 0.8·x, max = 1.25·x (gerundet), typ = x |
| D4 | Angabe in Wochen: Tage = 7·Wochen |
| D5 | Tage ab Saat: minus Keimdauer derselben Quelle, sonst minus Keimdauer typ der Art |
| D6 | nur eine Grenze aus einem Quellenwert (typ ist der grösste bzw. kleinste Quellenwert): die andere nach D3 (0.8·typ bzw. 1.25·typ) |
| D7 | ernte_ab_d ab Saat ohne Umsetztag derselben Quelle oder aus Direktsaat der Quelle, in der Anlage umgesetzt: minus art.umsetzen_ab_d, fehlt er minus Keimung typ plus Anzucht typ der Art |
| D8 | Umsetztag: nennt die gewählte Quelle selbst einen Bereich, gelten seine Grenzen; sonst umsetzen_ab_d = Wert der Quelle am nächsten an der Anlage (Würfel unter LED, dann DWC, Floating oder NFT); umsetzen_bis_d = grösster Wert einer Quelle der Klasse A oder B1 derselben Art, nur wenn er mindestens Keimung typ plus Anzucht typ erreicht (die App zeigt «In der Station lassen bis» Saat plus umsetzen_bis_d und mahnt «Umsetzen überfällig» sieben Tage danach; ein früherer Wert endete vor dem Ende der Anzucht nach Phasen), sonst Klasse D |
| E1 | pH- oder EC-Einzelwert: Band ±0.2 um den Wert |
| E2 | Band über der Validatorgrenze: auf die Grenze gekürzt |
| E3 | EC-Basis nach der Quelle korrigiert (Methodenprüfer) |

## Neue oder geänderte freigegebene Zeilen auf Ebene Art

| zeile_id | Wert | Quelle (Klasse) | Entscheid |
|---|---|---|---|
| `ak.beta_vulgaris_cicla.schnitt.ernte_ab_d` | 28 | horticulturae-mangold-meerwasser-2022 (A) | Runde 13 (#258), K-mangold-02, Konzept 9.3 Regel 1 (höhere Klasse vor tieferer): 28 Tage ab Umsetzen bis zum ersten Schnitt (Floating, Klasse A, gemessen; Lesekopie der Artikelseite, Runde 12 wegen Verlagssperre verworfen) statt 19 aus Runde 12 (Klasse B2, eigener Wert nach D7); im Wachstum 24 bis 38 (Fachkritik P14) und mit dem Umsetztag 21 derselben Quelle erste Ernte 49 Tage ab Saat wie in der Quelle; die festen Schnitttermine 28, 42, 56 Tage nach dem Umsetzen tragen ernte_ab_d und Intervall gleichermassen |
| `ak.beta_vulgaris_cicla.schnitt.ernteintervall_d` | 14 | horticulturae-mangold-meerwasser-2022 (A) | Runde 13 (#258), 14 Tage zwischen den Schnitten (Floating, Klasse A; Lesekopie der Artikelseite, Runde 12 wegen Verlagssperre verworfen); Schnitte 28, 42, 56 Tage nach dem Umsetzen (Fachkritik P15) |
| `ak.solanum_lycopersicum.dauerkultur_frucht.ernteintervall_d` | 7 | jksus-tomate-salinitaet-hydroponik-2023 (A) | Runde 13 (#258), Ernte alle 7 Tage («Every-seven days», Perlit-Hydroponik im Gewächshaus, Klasse A); gleich dem Chili-Intervall 7 (Fachkritik P20) |
| `ak.spinacia_oleracea.babyleaf.kulturdauer_max_d` | 46 | agriculture-spinat-rauke-floating-2021 (A) | Runde 13 (#258), spätester Babyleaf-Erntetermin 46 Tage ab Saat (längster von drei gemessenen Zyklen 46, 43, 28 im Floating-System, einmalige Ernte und Ersatz, Klasse A; Lesekopie der Artikelseite, Runde 12 wegen Verlagssperre verworfen); Fachkritik P19: fast das Dreifache von typisch 16, als Höchstwert stimmig (V11 typ ≤ max) |
| `art.allium_schoenoprasum.umsetzen_ab_d` | 28 | simplyhydro-schnittlauch (C) | eigener Wert aus art.allium_schoenoprasum.umsetzen_ab_d#2: Runde 13 (#258), Regel D4 (A): «After four to six weeks» untere Grenze 4 Wochen = 28 Tage ab Saat (NFT, Klasse C); Regel D8: Bereich derselben Quelle; #1 (Salve Regina, 15) und #3 (zugekaufte Setzlinge) in der Methodenprüfung verworfen |
| `art.allium_schoenoprasum.umsetzen_bis_d` | 42 | simplyhydro-schnittlauch (C) | eigener Wert aus art.allium_schoenoprasum.umsetzen_bis_d#1: Runde 13 (#258), Regel D4 (A): «After four to six weeks» obere Grenze 6 Wochen = 42 Tage ab Saat (NFT, Klasse C); Regel D8: die Quelle nennt selbst einen Bereich; einzige geprüfte Quelle; Fachkritik P9: Bezug ab Saat aus dem Zusammenhang (Satz nach der Keimung), 28 bis 42 umfasst Keimung typ 10 plus Anzucht typ 21 = 31 |
| `art.beta_vulgaris_cicla.umsetzen_ab_d` | 21 | horticulturae-mangold-meerwasser-2022 (A) | Runde 13 (#258), 21 Tage ab Saat (Steinwollstopfen, danach Floating, Klasse A; Lesekopie der Artikelseite, Runde 12 wegen Verlagssperre verworfen); einen Tag über Keimung typ 4 plus Anzucht typ 16 = 20 (Fachkritik P10) |
| `art.beta_vulgaris_cicla.umsetzen_bis_d` | 28 | hortsci-mangold-nft-2025 (A) | Runde 13 (#258), Regel D8 (A): 28 Tage ab Saat (Oasis-Würfel, danach NFT, Klasse A; Saat 31.10., Umsetzen 28.11.2023; Lesekopie der Artikelseite), grösster Wert der Klasse A und über 20; Fachkritik P11: einzelner Versuchstag, als spätester Tag der Spanne 21 bis 28 aus zwei Quellen verwendet |
| `art.beta_vulgaris_conditiva.umsetzen_ab_d` | 9 | hortbras-randen-babyleaf-nft-2014 (A) | Runde 13 (#258), 9 Tage ab Saat (Kokosfaser-Platten ohne Nährlösung, danach NFT, Klasse A; frei auf SciELO); einzige geprüfte Quelle, die MDPI-Arbeit (14 Tage) liegt nur als PDF vor; Fachkritik P12: unter Keimung min 2 plus Anzucht min 8 = 10 und unter dem Phasenwert 13, Babyleaf-Versuch; die App setzt die Reservierung damit früh, die Phasen bleiben |
| `art.ocimum_basilicum.umsetzen_ab_d` | 14 | plos-one-basilikum-saemlingsumgebung-2022 (A) | eigener Wert aus art.ocimum_basilicum.umsetzen_ab_d#3: Runde 13 (#258), Regel D4 (A): «Two weeks after sowing» = 14 Tage ab Saat (Steinwollwürfel 2.5 cm unter LED, danach Hydroponik, Klasse A; am nächsten an der Anlage, Regel D8); bestätigt von #4, #5 und #6 (je 14 Tage, Iowa State, Klasse B1, Fachkritik P4: nur bedingt unabhängig); K-basilikum-14: #1 (15) und #2 (18, Floating Raft, Klasse A) und #8 (21, Klasse C) nicht gewählt; mit dem freigegebenen ernte_ab_d 18 erste Ernte 32 Tage ab Saat (#1 derselben Quelle 33, P2) |
| `art.petroselinum_crispum.umsetzen_ab_d` | 21 | horttech-34-saatdichte-petersilie-2024 (A) | Runde 13 (#258), 21 Tage ab Saat (Phenolschaumwürfel 2.2 cm, danach DWC-Flösse, Klasse A; Lesekopie der Artikelseite, Regel D8: am nächsten an der Anlage); bestätigt von #2, #3 (je 3 Wochen, Iowa State, Klasse B1) und #6 (3 Wochen, NFT, Klasse A); gleich Keimung typ 14 plus Anzucht typ 7 (Fachkritik P6), die erste Ernte bleibt 49 Tage ab Saat wie in Runde 12 (P9); K-petersilie-15: #1 (35) als umsetzen_bis_d verwendet |
| `art.petroselinum_crispum.umsetzen_bis_d` | 35 | plos-one-dill-petersilie-2021 (A) | eigener Wert aus art.petroselinum_crispum.umsetzen_ab_d#1: Runde 13 (#258), Regel D4 (A): «five weeks after sowing» = 35 Tage ab Saat (Deep-Flow-Tische, Klasse A; dieselbe Quelle wie das freigegebene ernte_ab_d 28); Regel D8 (A): grösster Wert der Klasse A, über Keimung typ 14 plus Anzucht typ 7 = 21; Fachkritik P7: als frühester Tag zu spät, als spätester Tag stimmig |

Dazu 0 Kulturgruppen-Mindestzeilen (V13) als Kopie der neuen Art-Zeilen der Leitkultur bzw. mit «(A) andere Art».

## Ergänzungen des Lead zu Runde 13

- **Auftrag:** Tim im Chat vom 21.11.2026: «Setze alle genannten Punkte vollautomatisch bis ans Ende um und suche jeweils eine Lösung dazu bei Problemstellungen.» Auftrag der Runde: `teile/auftrag_runde-13.md`.
- **Regel D8 (A), neu:** Umsetztag. Nennt die gewählte Quelle selbst einen Bereich, gelten seine Grenzen (Schnittlauch 4 bis 6 Wochen = 28 bis 42). Sonst ist `umsetzen_ab_d` der Wert der Quelle am nächsten an der Anlage (Würfel unter LED, danach DWC, Floating oder NFT) und `umsetzen_bis_d` der grösste Wert einer Quelle der Klasse A oder B1 derselben Art, aber nur, wenn er mindestens Keimung typ plus Anzucht typ erreicht. Grund: Die App zeigt «In der Station lassen bis» Saat plus `umsetzen_bis_d` (`anzucht/umsetzen.ts`) und mahnt «Umsetzen überfällig» sieben Tage danach (`aufgaben-regeln.ts`); ein früherer Wert endete vor dem Ende der Anzucht nach Phasen (Befund 3 des Prüfers). Deshalb bleibt Basilikum `umsetzen_bis_d` Klasse D (grösster Wert 18 unter 9 + 18 = 27).
- **Konflikte (Fachkritik `fachkritik_runde-13.md`):** K-basilikum-14 → eigener Wert 14 aus #3 (2 Wochen, Steinwolle 2.5 cm unter LED, Klasse A), bestätigt von drei Iowa-State-Arbeiten; K-petersilie-15 → #7 21 (Phenolschaum 2.2 cm, DWC, Klasse A), #1 (35) als `umsetzen_bis_d`; K-mangold-02 (Konflikt mit freigegebenem Wert) → **28** (#5, Klasse A, gemessen) ersetzt 19 aus Runde 12 (Klasse B2, eigener Wert nach D7) nach Konzept 9.3 Regel 1 (höhere Klasse vor tieferer; Befund 2 des Prüfers, Runde 1); 28 liegt im Wachstum 24 bis 38 (19 lag darunter, P14) und ergibt mit dem Umsetztag 21 derselben Quelle die erste Ernte 49 Tage ab Saat wie in der Quelle; Korrektur als neue W0-Zeile nach Konzept 9.4, der Seed schliesst die alte Fassung; K-spinat-09 → `schnitte_max` 3 bleibt, 5 ist der Versuchsplan (P18).
- **Spinat Schnitt `ernte_ab_d` 34 nicht gewählt:** Winterversuch mit Wassertemperatur 6 bis 15 °C, über Wachstum max 28 (P16); die erste Ernte 43 Tage ab Saat passt nicht zur Anlage. Der Wert bleibt Klasse D.
- **Randen `umsetzen_ab_d` 9 (P12):** einzige geprüfte Quelle (NFT, Kokos-Anzucht); unter dem Phasenwert 13. Die App setzt damit die Reservierung früher; die Phasenprognose bleibt.
- **Bestehende Werte:** Ausser Mangold Schnitt `ernte_ab_d` (K-mangold-02) ist keine freigegebene Zeile vor Runde 13 geändert.
- **Spinat Babyleaf `kulturdauer_max_d` 46 (P19):** stammt aus demselben Winterversuch wie die verworfene 34; als Obergrenze ist der langsame Winterzyklus zulässig, weil die Kulturfrage (R1.7) dadurch später und nicht zu früh erscheint (Befund 6 des Prüfers).

## Gesperrte Volltexte: Lösung und Ergebnis

In Runde 12 waren fünf Kandidaten verworfen, weil die Prüfrollen die Verlagsseiten nicht automatisch abrufen konnten (HTTP 403 bei MDPI, Bot-Prüfung bei fupress); der Umweg über `mdpi-res.com` war als unbefugter Zugriff abgelehnt. Lösung in Runde 13 (A): Der Lead liest die Artikelseite im eingebauten Browser der Claude-App wie ein Mensch (normale Artikelseite bzw. Leseansicht des Verlags; keine CAPTCHA gelöst, kein anderer Server, kein Download) und legt die massgebenden Absätze wörtlich als Lesekopie ausserhalb des Repositorys ab. Rechercheur, Methodenprüfer und Quellenprüfer arbeiten mit der Lesekopie wie mit dem Volltext; die `fundstelle` beginnt mit «Lesekopie 21.11.2026 (Artikelseite im Browser)». Der Lead wählt und bewertet beim Lesen nichts.

| Kandidat Runde 12 | Weg in Runde 13 | Ergebnis |
|---|---|---|
| Mangold Schnitt `ernte_ab_d` 28 (MDPI Horticulturae) | Artikelseite im Browser, Lesekopie | bestätigt, **freigegeben** (ersetzt 19, K-mangold-02) |
| Mangold Schnitt `ernteintervall_d` 14 (dieselbe Quelle) | Lesekopie | bestätigt, **freigegeben**; dazu `umsetzen_ab_d` 21 **freigegeben** |
| Spinat Schnitt `ernte_ab_d` 34 (MDPI Agriculture) | Artikelseite im Browser, Lesekopie | bestätigt; nicht gewählt (Winterversuch, P16) |
| Spinat Babyleaf `kulturdauer_max_d` 46 (dieselbe Quelle) | Lesekopie | bestätigt, **freigegeben** |
| Basilikum Dauerkultur `ernte_ab_d` 50 (fupress, Adv. Hort. Sci.) | Artikelseite (die Bot-Prüfung «Dein Browser wird geprüft!» lief von selbst durch, ohne Eingabe), Leseansicht pdf.js des Verlags | Wert wörtlich belegt; freigegeben bleibt 18 (Runde 12, K-basilikum-13), keine neue Zeile |

Weitere Quellen dieser Runde aus dem Browser: HortScience 60(6) 967 (Mangold, `umsetzen_bis_d` 28 **freigegeben**), Agronomy 9(7) 389 und HortTechnology 34(3) 305 (Petersilie, `umsetzen_ab_d` 21 **freigegeben**).

**Nicht lesbar (Klasse D bleibt):**

| Quelle | Grund |
|---|---|
| Agriculture 15 1914 (MDPI, Randen Umsetzen 14) | Artikelseite zeigt keinen HTML-Volltext, nur das PDF; ein Download ist nicht freigegeben. Ersatz: SciELO-Quelle (9 Tage) |
| Resources, Environment and Sustainability 2026 100342 und Scientia Horticulturae 350 114364 (ScienceDirect, Chili) | ScienceDirect verlangt im Browser eine CAPTCHA («Are you a robot?»); nicht gelöst |
| Salve Regina «Dolores Chive» (Schnittlauch, «First Harvest Day 52») | PDF wird als Download ausgeliefert (Speichern-Dialog), kein Lesen im Browser; abgebrochen |
| TUM-Repositorium mediatum (Chili) | Bot-Sperre (Anubis) für den Rechercheur; nicht weiter verfolgt |

## Verbleibende Lücken (Klasse D, keine Zeile)

| Art | Kulturform | ohne Wert |
|---|---|---|
| Tomate | dauerkultur_frucht | `schnitte_max` |
| Chili | dauerkultur_frucht | `schnitte_max`, `kulturdauer_max_d` |
| Basilikum | Art | `umsetzen_bis_d` (Regel D8) |
| Basilikum | dauerkultur_blatt, schnitt | `schnitte_max`, `kulturdauer_max_d` |
| Petersilie | dauerkultur_blatt | `schnitte_max`, `kulturdauer_max_d` |
| Schnittlauch | dauerkultur_blatt | `ernte_ab_d`, `ernteintervall_d`, `schnitte_max` |
| Schnittlauch | schnitt | `ernte_ab_d`, `ernteintervall_d`, `schnitte_max`, `kulturdauer_max_d` |
| Spinat | schnitt | `ernte_ab_d`, `kulturdauer_max_d` |
| Spinat | kopf | `kulturdauer_max_d` |
| Randen | Art | `umsetzen_bis_d` |
| Randen | schnitt | `ernte_ab_d`, `ernteintervall_d`, `schnitte_max`, `kulturdauer_max_d` |
| Mangold | schnitt | `schnitte_max`, `kulturdauer_max_d` |

Für `schnitte_max` und `kulturdauer_max_d` der Dauerkulturen nennen die hydroponischen Quellen nur Versuchsenden oder unbestimmte Angaben («easily last a year», «after about 3 months» ohne Bezug); beides trägt das Feld nicht (Methodenprüfung). Ohne diese Werte erscheint die Kulturfrage (R1.7) nicht; der Erntekalender zeigt das Ende nicht.
