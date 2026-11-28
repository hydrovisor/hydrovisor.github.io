# 0033 Belegungsplan Runde 1: Umsetztag beim Säen, Petersilie, Schnittsalat, Babyleaf

Datum 28.11.2026 · Entscheid von Tim auf Empfehlung des Lead

**Tims Wortlaut im Chat (28.11.2026):** «Ja, so umsetzen» (Antwort auf die Vorschläge des Lead zu den Abweichungen A bis E im Abgleich `docs/plaene/belegungsplan_abgleich_2026-11-28.md`, PR #276).

Grundlage: Konzept v1.11 Kapitel 14.1 gegen `data/wissensbasis/freigegeben/art.csv` nach den W0-Runden 11 bis 14. Die Buchstaben folgen dem Abgleich.

| Nr. | Abweichung | Entscheid | Umsetzung |
|---|---|---|---|
| A | Die App setzt den geplanten Umsetztag auf Saat + «Umsetzen ab»; einen Plantag aus 14.1 kann man beim Säen nicht wählen | Paket «Umsetzdatum beim Säen wählen» (Fachlogik, rund 0.5 PT aus dem Pool, vor M2 31.1.2027): Vorschlag Saat + `umsetzen_ab_d`, Plantag aus 14.1 wählbar, Grenze Saat + `umsetzen_bis_d` + 7 | Paket #278; Hinweis in Konzept v1.12, 14.1 und R6.2 (E29) |
| B | Petersilie glatt (W1) → 2.2: geplant 18.2.; nach W0 ist der 18.2. schon die Grenze Saat + «Umsetzen bis» + 7 | Plantag Umsetzen **11.2.** statt 18.2. | Konzept v1.12, 14.1 und 14.6 (E26) |
| C | Lollo Rossa, Eissalat, Eichblatt (Kulturform Schnitt): Der Plan zählt die Standzeit 42 Tage ab Umsetzen, W0 die Kulturdauer max. ab Saat | Standzeit 42 Tage **ab Umsetzen** gilt (Plan); W0-Korrektur `ak.lactuca_sativa.schnitt.kulturdauer_max_d` als neue Zeile **56 Tage ab Saat** (42 + 14) | W0-Korrektur #277; Hinweis in Konzept v1.12, 14.1 und R1.7 (E30) |
| D | Babyleaf-Mischung (W2) → 3.3: Der Plan erntet um 25.2., fünf Tage nach dem Ende laut W0 (20.2.) | Ernte **um 18.2.** statt 25.2. | Konzept v1.12, 14.1 (E27) |
| E | Folgesatz Babyleaf (W5) → 3.3: Plan «Ernte nach 31.3.», die App zeigt die Ernte ab 25.3. | Ernte **25.3. bis 31.3.** einplanen statt «nach 31.3.» | Konzept v1.12, 14.1 (E28) |

Dazu zwei Lead-Entscheide nach Entscheid 0018 (W0-Freigabe durch den Lead); sie sind nicht Teil von Tims Satz:

- **F** Nüsslisalat: `ak.valerianella_locusta.kopf.ernte_ab_d` als neue Zeile 51 Tage (die Quelle zählt 29 Tage ab Umsetzen nach 22 Tagen; (A) neue Ableitung, weil Regel D7 Direktsaat ausnimmt). Umsetzung #277.
- **Basilikum:** Nachkontrolle `ak.ocimum_basilicum.schnitt.ernte_ab_d` = 50 (vor Regel D7 freigegeben; zählt die Quelle ab Saat, Korrektur nach D7). Umsetzung #277.

**Folge für den Plan (A, Lead):** Mit B zieht Petersilie am 11.2. in die 7 Tage alte Lösung von 2.2 (Erstansatz 4.2.). Nach R2.2 schlägt die App am Umsetztag einen Wechsel vor. Der Belegungsplan nimmt an, dass Tim ihn ablehnt und 2.2 wie geplant am 14.2. wechselt; sonst trägt der 11.2. vier Ansätze statt höchstens drei. Tim bestätigt die Annahme mit der Konzeptfassung 1.12.

**Widerruf.** Ein Satz von Tim im Chat genügt.
