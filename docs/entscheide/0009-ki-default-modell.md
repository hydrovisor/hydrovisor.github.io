# 0009 Default-Modell für das Lesen der Saattüten

Datum 4.11.2026 · Entscheid des Leads nach Regel aus Plan 14 (Konzept 11.3) · Paket I0-09 (#14)

**Grundlage.** Tim hat den Eval an seinem PC gestartet (`npm run eval:tueten`). Getestet wurden 3 echte Tüten mit je 8 Feldern gegen seine Referenz `tueten_referenz.csv`: Chili, Petersilie und Tomate.

| Modell | richtig | M0 (Name, Art, Keimart 3 von 3) | Median | Max | Kosten je Tüte |
|---|---|---|---|---|---|
| `claude-sonnet-5-5` | 22 von 24 (92 %) | nicht erfüllt (Art bei Chili falsch) | 3.6 s | 5.8 s | 0.0145 USD |
| `claude-haiku-5-5` | 23 von 24 (96 %) | erfüllt | 2.2 s | 7.5 s | 0.0009 USD |

Beide Modelle lasen das Aussaatfenster der Petersilie falsch.

**Entscheid.** `claude-haiku-5-5` wird das Hauptmodell, `claude-sonnet-5-5` das Ausweichmodell. Die Ausweichregel bleibt gleich: bei 429, 5xx oder nach 20 s ein Versuch mit dem anderen Modell, nach höchstens 30 s «von Hand».

**Begründung.** Plan 14 legt die Regel fest: Ein Modell ohne M0 kann nicht Default werden. Unter den Modellen mit M0 gewinnt die höhere Trefferquote; liegen beide höchstens ein Feld auseinander, gewinnt das schnellere. Nur Haiku erfüllt M0. Haiku ist zudem genauer, schneller im Median und kostet je Tüte rund ein Sechzehntel. Konzept 11.3 nennt Sonnet als Ausgangspunkt und sagt: «Eval entscheidet den Default». Eine neue Konzeptfassung braucht es darum nicht.

**Vorbehalt.** Drei Tüten sind eine kleine Stichprobe. Die Schwelle von 80 % je Feld gilt verbindlich erst mit 22 Tüten in I2-05. Zeigt das Feldprotokoll dort, dass Haiku schlechter liest, wird der Entscheid überprüft. Das Aussaatfenster liegt bei beiden Modellen unter 80 %. Das beobachtet I2-05.

**Folgen.**
- `src/domain/ki/modelle.ts`: die Konstanten getauscht.
- `docs/spec/04_architektur.md` Abschnitt 6 angepasst.
- Die Tests verwenden die Konstanten und bleiben unverändert.
- Der Bericht steht im Issue #14 als Kommentar «UC4-AK3 [Eval]».
