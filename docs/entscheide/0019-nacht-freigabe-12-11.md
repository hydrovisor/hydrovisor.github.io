# 0019 Nacht-Freigabe vom 12.11.2026: alle Freigaben bis 13.11. 07:00 beim Lead

Datum: 12.11.2026 · Entschieden von Tim (im Chat der Lead-Sitzung «W0 Runde 7», ca. 22:50) · Issue #190, #193 · befristete Abweichung von CLAUDE.md Regeln 1, 2 und 4 sowie den Entscheiden 0010 und 0017 (Freigabe von `production` mit `seed_scharf` durch Tim)

## Ausgangslage

Nach dem Merge von PR #192 (W0 Runde 7) wartete der ältere `seed_scharf`-Lauf 43301587085 (Stand #189) auf Tims Freigabe in `production` und belegte die Concurrency-Gruppe `deploy`; der Push-Deploy blieb dahinter stehen. Den Abbruch des alten Laufs hatte die Rechtesperre der Sitzung abgelehnt. Tim war über Nacht nicht erreichbar.

## Entscheid

Tim, wörtlich: «Setzte alle Aufgaben um 23.20 weiter fort. Ich gebe dir alle Berechtigungen dazu. Setzte alle weiteren Schritte bis morgen 07.00 um, ich berechtige dich für alle Freigaben. Du setzt lückenlos bis morgen 07.00 das Projekt weiter um.»

- **Gültig** vom 12.11.2026, 22:50, bis 13.11.2026, 07:00.
- **Gedeckt:** Abbruch veralteter Deploy-Läufe; Freigabe von `production` auch für Läufe mit `seed_scharf` (sonst Tims Handgriff nach Entscheid 0017); Planfreigaben, die sonst Tim gibt; Merge nach Regel 1.
- **Nicht gedeckt** (A): Secrets und VAPID-Schlüssel lesen oder setzen (Regeln 2 und 3), Änderungen an den Sperren (`.claude/settings.json`, `.claude/hooks/`, `.mcp.json`, Referenzdateien), Force-Push, endgültiges Löschen, Produktions-Migrationen (Regel 2; in der Nacht steht keine an). Diese Grenzen zieht der Lead, weil Tims Satz sie nicht ausdrücklich nennt und sie nicht rückgängig zu machen sind.
- Jede Freigabe nennt im Issue den Lauf und diesen Entscheid.

## Folgen

- Lauf 43301587085 abgebrochen, Push-Deploy 43310515926 freigegeben (Rauchtest grün), `seed_scharf` Lauf 43318210369 durch den Lead freigegeben: W0 Runde 7 in der Produktion geladen (Issue #190).
- Nach 07:00 gelten wieder die Regeln aus CLAUDE.md und den Entscheiden 0008, 0010 und 0017.
