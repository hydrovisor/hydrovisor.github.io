# 0022 Keim-, Anzucht- und Blütedauer sowie Keimart aus Anbauquellen, wenn keine Hydroponik-Quelle vorliegt

Datum: 13.11.2026 · Entschieden von Tim (Chat der Lead-Sitzung, Antwort auf den Vorschlag in Issue #202: «Ja, Variante A») · Issue #202 · enge Ausnahme von Konzept 9.1 (Grundregel «nur Hydroponik» und Klasse D) und von `.claude/agents/w0_methodenpruefer.md` Regel 1 · Bezug Entscheid 0018, Runde 9 (#197)

## Ausgangslage

Nach Runde 9 sind 8 von 11 Arten voll geladen, 15 von 22 Sorten vollständig (`v_vollstaendigkeit` auf `hydrovisor-dev`). Bei Tomate, Schnittlauch und Nüsslisalat fehlen nur fünf Werte: `pw.solanum_lycopersicum.bluete.dauer`, `pw.allium_schoenoprasum.keimung.dauer`, `pw.allium_schoenoprasum.anzucht.dauer`, `pw.valerianella_locusta.keimung.dauer`, `pw.valerianella_locusta.keimung.keimart`. Neun Runden haben dafür keine hydroponische Quelle in Validatorform gefunden. frankiesgarten.de verweist bei Schnittlauch und Feldsalat selbst auf «siehe Tüte», pflanzenfabrik.de nennt keine Dauern. Wegen der Teilfreigabe je Art (Konzept 9.5) lädt der Seed für diese drei Arten auch die freigegebenen pH-, EC- und Dauerwerte und die Saatempfehlungen nicht. Das betrifft 7 Sorten.

## Entscheid

1. **Geltung.** Nur für `dauer` der Phasen `keimung`, `anzucht` und `bluete` sowie für `keimung.keimart`. Und nur dort, wo nach Runde 9 auf Ebene Art keine Zeile freigegeben ist (die fünf Werte oben). pH, EC, Licht, Wassertemperatur und alle übrigen Grössen bleiben streng hydroponisch nach Konzept 9.1.
2. **Zugelassene Quellen.** Neben hydroponischen Quellen gelten auch Gartenbau- und Beratungsliteratur, Kulturanleitungen von Saatgutfirmen, Saatguttüten, Kataloge und Gewächshausliteratur in Erde oder Substrat. Begründung (A): Keimdauer, Keimart (Licht- oder Dunkelkeimer) und die Zeit vom Blühbeginn bis zum Fruchtansatz hängen vor allem von Art, Temperatur und Licht ab, kaum vom Wurzelmedium. Die Anzuchtdauer bis zum Umsetzen ist im Würfel und im Anzuchttopf ähnlich.
3. **Klasse.** Solche Quellen erhalten höchstens Evidenzklasse C mit `anbaumethode = keine`, `system_quelle = keine` bei Anbau in Erde und `vermerk` `tuete` oder `katalog`, wo das zutrifft, sonst `keine`. Eine hydroponische Quelle in Validatorform geht immer vor (Regel 1 aus Konzept 9.3).
4. **Prüfung.** Der Methodenprüfer verwirft solche Zeilen nicht wegen der Anbaumethode, prüft aber Klasse, Bezug (Art, Phase, Zählbeginn) und Form wie sonst. Der Quellenprüfer prüft das Zitat wie sonst. Der Lead entscheidet nach Entscheid 0018, auch mit «eigener Wert» (Annahme 5 in `docs/w0/ablauf.md`); `notiz_tim` beginnt wie bisher mit «Lead nach Entscheid 0018:» und nennt «Runde 10 (Entscheid 0022)».
5. **Anzeige.** Die Werte sind belegt (Klasse C), also kein Prüfauftrag. Im Testbetrieb gilt wie überall: Weicht die beobachtete Dauer ab, folgt eine Korrektur als neue W0-Zeile.

## Folgen

- W0 Runde 10 (#202) sucht nach dieser Regel. Ziel: 11 von 11 Arten voll geladen, 22 von 22 Sorten vollständig.
- Ergebnis Runde 10 (Skript `scripts/w0/lead_entscheide_runde10.py`): Tomate Blüte 24/30/38 Tage, Schnittlauch Keimung 7/10/14 und Anzucht 18/21/34, Nüsslisalat Keimung 8/11/14, Anzucht 9/11/14 und Keimart «dunkel». Die Kulturgruppe `fruchtgemuese` erbt die Blütedauer jetzt von ihrer Leitkultur Tomate (Regel V13, `docs/w0/ablauf.md` Schritt 8) statt wie bisher ersatzweise von Chili. Chili behält seinen eigenen Wert.
- Konzept 9.1 und die Rolle `w0_methodenpruefer` sind in der nächsten Fassung nachzuführen (Konzept nur durch Tim, Anhang B.2). Bis dahin steht die Ausnahme in diesem Entscheid und im Auftrag an die Prüfrollen.

## Verworfen

- **Teilfreigabe je Phase** (Variante B in #202): Damit wären pH und EC sofort geladen, aber die 7 Sorten blieben unvollständig. Ausserdem müsste Konzept 9.5 geändert werden.

**Nachtrag 14.11.2026:** In Konzept v1.7 nachgeführt (Erratum E14, Anhang B.2), von Tim am 14.11.2026 bestätigt.
