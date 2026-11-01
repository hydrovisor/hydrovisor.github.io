# 0003 Datenbank-Typen im Pull Request erzeugt

Datum 1.11.2026 · Entscheid von Tim · Quelle: `docs/spec/00_rueckfragen.md` W5; Konzept v1.2 11.1, 12.3; `docs/spec/04_architektur.md` Abschnitt 8

**Entscheid.** Der Job `db` in `pr.yml` baut die Datenbank lokal (`supabase start`, `supabase db reset`), erzeugt die Typen und vergleicht sie mit `src/daten/datenbank.types.ts`. Eine Abweichung bricht das Prüftor; der Lead committet die neu erzeugte Datei im Zweig. Es gibt keinen CI-Commit auf `main`, weil das Ruleset `main-schutz` nur Pull Requests ohne Bypass zulässt. Generierte Typen werden nie von Hand zusammengeführt.
