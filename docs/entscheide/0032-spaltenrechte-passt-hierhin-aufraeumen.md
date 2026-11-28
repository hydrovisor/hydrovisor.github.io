# 0032 Spaltenrechte gestrichen, «Passt hierhin» bis 21.1., alte Worktrees gelöscht

Datum 28.11.2026 · Entscheid von Tim auf Empfehlung des Lead

**Tims Wortlaut im Chat (28.11.2026):** «Die Empfehlungen sind für mich i.O Setze diese eigenständig um.»

## 1. Spaltenrechte nur auf `storniert_am` (#219 A2): gestrichen

- **Empfehlung des Lead:** nicht umsetzen.
- **Gründe:**
  - Den Schutz leistet RLS über `ist_tim()`: Schreiben kann nur Tims Konto.
  - Spaltenrechte würden zusätzlich nur verhindern, dass Tims eigene App andere Spalten ändert.
  - Der Revoke ist eine nicht additive Migration. Neben `storniert_am` setzt `schreiben()` auch `storno_grund` und die Spalten aus `SETZBAR` (`etikett.gedruckt_am`, `naehrloesungsansatz.ec_erwartet_final`, `k_vorschlag`). Ein Fehler würde Erfassungen im Testbetrieb blockieren, und nach dem 1.3.2027 sind nur noch `create or replace view` erlaubt.
- **Folge:** Der Folgeposten aus #219 entfällt. Frühestens nach dem Datenschluss (31.3.2027) neu prüfen.

## 2. Pool «Passt hierhin» (0.5 PT, Kern): Entscheid bis 21.1.2027

- **Empfehlung des Lead:** jetzt nicht umsetzen.
- **Gründe:**
  - Säen Schritt 2 zeigt das Urteil der Passung schon an jedem Ziel (Entscheid 0028), und Umsetzen ordnet die Sorten nach dem gewählten Gefäss.
  - Ein Kern-Paket braucht Tims Planfreigabe, und im Dezember ist Tim unterwegs.
- **Folge:** Der Lead fragt Tim nach den ersten Regaltagen bis zum 21.1.2027, ob «Passt hierhin» in der Maske Gefäss fehlt.
  - Fehlt es: Paket vor M2 (Umfang-Freeze 31.1.).
  - Sonst ist der Posten gestrichen.

## 3. Alte Worktrees: gelöscht durch den Lead (Ausnahme zu CLAUDE.md Regel 5, endgültiges Löschen)

- Gelöscht sind neun registrierte Worktrees unter `.claude/worktrees/` und deren Reste aus abgebrochenen Entfernungen.
- Alle Zweige waren gemergt oder als Remote-Zweig gesichert; geprüft mit `git worktree list`, `git status` und `git branch -r --contains`.
- Verloren ging nur eine nicht versionierte `.claude/launch.json` (Startkonfiguration des Dev-Servers) in einem der Worktrees.
- Die lokalen Zweige und die Remote-Zweige bleiben.
- Die Ausnahme gilt nur für dieses Aufräumen.

**Widerruf.** Ein Satz von Tim im Chat genügt.
