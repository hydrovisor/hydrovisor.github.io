# **Hydrovisor – Vorgehen Wissensbasis W0**

**Stand 27.10.2026 · angenommen von Tim · Grundlage Konzept v0.3 und «Vorschläge Use Cases», Fassung 3\.** W0 erarbeitet die fachlichen Inhalte der Wissensbasis (pH, EC, Phasendauer, Keimung, Ernte, Systemeignung je Art und Phase), bevor das Agenten-Team die App baut. Das Agenten-Team baut die Struktur in Supabase; W0 liefert die Werte, die das Startdaten-Skript lädt.

## **1 Grundregel**

Ein Sollwert gilt nur, wenn seine Quelle hydroponisch ist: DWC, Kratky, NFT, Ebbe-Flut oder inertes Substrat (Schaum, Steinwolle, Blähton, Perlit). Werte aus Erde, Freiland, Topfkultur mit Erde und von Saattüten sind für pH, EC, Phasendauer, Licht und Wassertemperatur ausgeschlossen. Saattüten bleiben nur für Sortenmerkmale zugelassen, die nicht von der Anbaumethode abhängen (Keimart, Keimtemperatur, Samentyp). Kein Wert wird geschätzt, gemittelt oder ohne Fundstelle eingetragen. Konflikte werden offengelegt, nicht geglättet. Gültig wird eine Zeile erst mit Tims Freigabe.

## **2 Evidenzstufen für Sollwerte**

| Stufe | Quelle | Beispiel |
| :---- | :---- | :---- |
| A | Begutachtete Studie, hydroponisch, mit gemessenem Wert für die Art und Phase | Studie zu Basilikum in DWC mit EC-Stufen |
| B | Hydroponik-Fachquelle einer Universität, Beratungsstelle oder eines Herstellers hydroponischer Systeme mit eigenen Angaben | Cornell CEA Handbook, University of Arizona CEAC |
| C | Hydroponik-Praxisquelle ohne Versuch, Methode ausdrücklich hydroponisch | Fachseite mit Tabellen für Hydroponik |
| D | Kein Hydroponik-Wert gefunden; Wert über Kulturgruppe oder Standardprofil vererbt, in der App als «nicht belegt» markiert | Prüfauftrag für den Testbetrieb |

Nie zugelassen: Erde, Freiland, Foren, Seiten ohne erkennbare Quelle, KI-generierte Texte ohne Beleg. Gewächshausversuche gelten, wenn das System hydroponisch ist; Indoor-Versuche mit LED haben bei gleicher Stufe Vorrang, weil sie der Anlage entsprechen.

## **3 Datenvorlage**

Eine Zeile je Art und Phase (fünf Phasen, «entfällt» wo nicht anwendbar), dazu eine Zeile je Art für Artmerkmale. Spalten entsprechen dem Datenmodell im Konzept v0.3 (Art, Phasenprofil, Saatempfehlung, Quelle); das Schema in Supabase bildet sie 1:1 ab.

| Gruppe | Spalten |
| :---- | :---- |
| Bezug | art\_id, Art wissenschaftlich (über GBIF vereinheitlicht), Kulturgruppe, Phase, anwendbar (ja oder entfällt) |
| Phase | Dauer min., typisch, max. in Tagen; Bezugspunkt; BBCH von und bis; Wechselmerkmal |
| Sollwerte | pH min. und max.; EC min. und max. in mS/cm als Gesamt-EC; EC-Basis der Quelle (gesamt oder über Ausgangswasser) und Einheit der Quelle (mS/cm, µS/cm, ppm 500, ppm 700); Lichtstunden; DLI; Wassertemperatur min. und max. |
| Herkunft | quelle\_id, Fundstelle (Seite, Tabelle, Abschnitt), System der Quelle (DWC, Kratky, NFT, Ebbe-Flut, Substrat), Umgebung (indoor LED, Gewächshaus), Evidenzstufe A bis D |
| Prüfung | Methodenprüfung (zugelassen, verworfen mit Grund), Quellenprüfung (bestätigt, nicht gefunden, abweichend), Konflikt-ID, Status (Entwurf, geprüft, freigegeben), freigegeben am, Notiz Tim |
| Artmerkmale | Keimart, Keimtemperatur, Keimdauer, Ernte möglich ab, Ernte einmalig oder mehrfach, Systemeignung (DWC, Kratky), Liter je Pflanze, Samentyp |
| Quelle | quelle\_id, Titel, Autoren, Jahr, Link oder DOI, Art der Quelle, Anbaumethode, abgerufen am |

Ablage: Dateien im Repository unter data/wissensbasis/ (CSV, UTF-8), versioniert; nur Zeilen mit Status «freigegeben» lädt das Startdaten-Skript nach Supabase.

## **4 Rollen**

Jede Rolle hat einen festen Auftrag, feste Eingaben und klare Verbote. Prüfende Rollen sehen nur die Kandidatenzeile und die Quelle, nicht die Begründung der Rolle davor, damit sie unabhängig urteilen. Keine Rolle prüft ihre eigene Arbeit. Modell und Denkstufe stehen fest in der Rollendefinition. Das Agenten-Team läuft wie die App-Entwicklung in Claude Code im Terminal, nicht in Claude Cowork.

| Rolle | Modell, Denkstufe | Erhält | Liefert | Darf nicht |
| :---- | :---- | :---- | :---- | :---- |
| Koordinator | Opus 5.5, mittel | Auftrag, Datenvorlage, Artenliste | verteilt die Aufträge, sammelt die Ergebnisse, führt den Stand | selbst recherchieren oder bewerten |
| Rechercheur (6, je Kulturgruppe) | Opus 5.5, mittel | Kulturgruppe mit Arten, Grundregel, Evidenzstufen | Kandidatenzeilen mit Fundstelle, System, EC-Basis und Einheit der Quelle | Werte ohne Fundstelle eintragen, mitteln, schätzen, umrechnen |
| Methodenprüfer | Opus 5.5, hoch | Kandidatenzeile und Quelle | «zugelassen» oder «verworfen» mit Grund; Einheit und EC-Basis auf Gesamt-EC in mS/cm vereinheitlicht | neue Werte einbringen |
| Quellenprüfer | Opus 5.5, mittel | zugelassene Zeile und Link | «bestätigt», «nicht gefunden» oder «abweichend» mit dem Wert aus der Quelle | interpretieren oder korrigieren |
| Fachkritiker | Opus 5.5, hoch | alle bestätigten Zeilen einer Art | Konfliktliste (alle Werte mit Quelle und Stufe), Plausibilität gegen die Kulturgruppe, Lückenliste | Konflikte entscheiden |
| Redaktor | Fable 5.1, mittel | Konfliktliste, Entscheidungsregel (Abschnitt 5\) | Datenvorlage und je Konflikt einen Freigabevorschlag mit Begründung und Alternativen | neue Quellen suchen, Werte ausserhalb der Konfliktliste setzen |
| Tim (Product Owner) | – | Freigabevorschläge, Stichprobe | Entscheid je Konflikt und je Wert der Stufe D, Stichprobe von 10 % der übrigen Zeilen, Gesamtfreigabe | – |

Begründung der Modellwahl: Opus 5.5 für alle Such- und Prüfrollen, weil der Marktvergleich gezeigt hat, dass Opus mehr Treffer und mehr Fehler fand als Sonnet; die beiden Prüfrollen mit dem höchsten Schadenpotenzial (Methode und Fachkritik) auf hoch. Fable 5.1 nur für den Redaktor, weil dort die Abwägung zwischen Quellen am schwierigsten ist und die Rolle selten läuft.

## **5 Konflikte und Freigabe**

**Entscheidungsregel des Redaktors**, in dieser Reihenfolge:

> 1. Höhere Evidenzstufe vor tieferer; Werte verschiedener Stufen werden nie gemittelt.  
> 2. Bei gleicher Stufe: Indoor mit LED vor Gewächshaus, gleiches System (DWC, Kratky) vor anderem, jüngere vor älterer Quelle.  
> 3. Bei mehreren gleichwertigen Quellen: die Schnittmenge ihrer Bereiche; ist sie schmaler als 0.3, der schonendere Bereich (tiefere EC, pH näher bei 6.0).  
> 4. Kein Hydroponik-Wert: Stufe D, Vererbung über Kulturgruppe oder Standardprofil, Markierung «nicht belegt».

**Freigabevorschlag je Konflikt:** Art, Phase und Grösse; alle Werte mit Quelle und Stufe; der Vorschlag mit einem Satz Begründung nach der Entscheidungsregel; zwei Alternativen. Tim antwortet im Terminal (Claude Code) als Auswahl: «Vorschlag annehmen», «Alternative 1», «Alternative 2» oder im freien Feld mit eigenem Wert oder Ergänzung. Höchstens vier Konflikte je Runde. Entscheid und Ergänzung landen in der Spalte «Notiz Tim» und in der Freigabeliste W0 (Google Sheet in «Software Hydrovisor»).

## **6 Welche Pflanzen zusammenpassen**

Die Passung wird nicht separat recherchiert, sondern aus den freigegebenen Zeilen berechnet: eine Matrix Art gegen Art je Phase mit Schnittmenge von pH und EC (Mindestbreite 0.3), Wassertemperatur, Licht und System. Sie ist die Grundlage der Passungs-Empfehlung K28. Hydroponische Studien zu gemischten Kulturen gehen nur als Hinweis ein (Stufe A oder B, mit Quelle). Den Kräuter-Mix je Gefäss legt Tim nicht von Hand fest: Nach der Freigabe der W0-Werte schlägt die Passungs-Empfehlung (K28) je Gefäss einen bunten Mix vor, der zusammenpasst. Tim übernimmt ihn für den ersten Durchlauf.

## **7 Ablauf und Zeitplan**

| Schritt | Inhalt | Zeitraum | Tims Zeit |
| :---- | :---- | :---- | :---- |
| 1 Vorlage | Datenvorlage und Rollendefinitionen festlegen | Ende Oktober | rund 0.5 h |
| 2 Probelauf | erste Pflanzrunde mit allen Rollen: Fruchtgemüse (Tomate, Chili und Paprika), Nüsslisalat und alle Kräuter der Startbelegung (Basilikum Genoveser und Pourpre, Petersilie glatt, Schnittlauch Twiggy, Pak Choi Misome); Tim prüft Ergebnis und Arbeitsweise, danach werden Regeln, Stufen und Freigabe bei Bedarf angepasst, bevor alle Gruppen laufen | November, erste Hälfte | rund 2 h |
| 3 Hauptlauf | die übrigen Kulturgruppen in der Reihenfolge der Pflanzung | bis Mitte Dezember | rund 4 bis 5 h |
| 4 Freigabe | alle Konflikte und Werte der Stufe D entschieden, Stichprobe 10 %, Gesamtfreigabe; Kriterium von Messpunkt M0 | bis Ende Dezember | in Schritt 2 und 3 enthalten |
| 5 Laden | das Startdaten-Skript lädt die freigegebenen Zeilen nach Supabase | Dezember (I0) | – |

Tims Zeit für W0 zusammen rund 6 bis 8 h; sie ersetzt den Teil «Profile» der bisher geplanten Inhalte (rund 12 h, Dezember und Januar). Wissenskarten und Deckel bleiben mit rund 4 h bestehen. Gepflanzt wird erst mit dem Testbetrieb, wenn die App produktiv läuft: zuerst Tomate und Chili (längste Kultur), gleichzeitig ein erster Satz Nüsslisalat und Kräuter, danach alle 2 Wochen ein Folgesatz, damit laufend geerntet werden kann.

## **8 Abnahme von W0**

> * Jede Zeile hat Quelle und Fundstelle oder ist als Stufe D markiert.  
> * In der Stichprobe stammt keine zugelassene Quelle aus Erde oder Freiland.  
> * Alle Konflikte und alle Werte der Stufe D sind von Tim entschieden.  
> * Alle EC-Werte sind Gesamt-EC in mS/cm; Herkunft und Umrechnung sind nachvollziehbar.  
> * Die Vollständigkeitsregel ist für alle 22 Sorten erfüllt.  
> * Die Passungsmatrix ist aus den freigegebenen Zeilen berechnet.

## **9 Ausnahme für die Saatmenge (entschieden am 23.10.2026)**

Die Grundregel gilt für alle Sollwerte und Phasendauern. Für die Saatmenge (Samen je Schwamm, Pflanzen stehen lassen) gilt eine Ausnahme: Sie betrifft das Keimen im 25-mm-Schwamm und nicht die Nährlösung. Deshalb bleibt dort die Prüfreihenfolge A bis D aus Fachlogik Punkt 8 mit Stufe C «abweichendes Substrat gleicher Grösse» zulässig, etwa für Nüsslisalat, Mangold und Randen. Solche Werte sind in der App mit Stufe C und der Abweichung markiert, und der Testbetrieb prüft sie über die Keimrate.

## **10 Quellen**

> * Cemri, M. et al. (2025). [Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) arXiv:2503.13657. Fehler entstehen häufig aus unklarer Aufgaben- und Rollenbeschreibung, Abstimmungsfehlern zwischen Agenten und fehlender Prüfung.  
> * Hong, S. et al. (2024). [MetaGPT: Meta Programming for a Multi-Agent Collaborative Framework](https://arxiv.org/abs/2308.00352). ICLR 2024\. Feste Rollen mit standardisierten Arbeitsschritten und Ergebnissen.  
> * [Hydrovisor – Konzept v0.3](https://docs.google.com/document/d/1ZKYiiU_mOnkQWw48H2crAFqMyWk-gWYKR8ZZQy8Ua9g/edit), [Hydrovisor – Vorschläge Use Cases, Fassung 3](https://docs.google.com/document/d/10sxfa2J18b6lLiK6kM2kSbXDDPg1PsxlhfTPxBDtQOU/edit), [Lösungsvorschlag Phasenmodell und Sortenabdeckung](https://docs.google.com/document/d/1OGtISea7UpZHx1vhWccxsCA5wCs0APMTUvuJ0_0lW-k/edit), [Marktvergleich und Ergänzungen (Lauf 2\)](https://docs.google.com/document/d/1efnsIYZa6BvOsaBwln0Azvggq3NT8eHv_y2NCzP_8z4/edit).