// Platzhalter für npm-Skripte, deren Inhalt ein späteres Paket liefert (CLAUDE.md, Befehle).
// Endet mit Warnung und Exit 0, damit Workflow-Schritte bis dahin nicht scheitern (docs/entscheide/0004).
const [skript, paket] = process.argv.slice(2);
console.log(`::warning::npm run ${skript} ist ein Platzhalter und tut nichts; folgt mit Paket ${paket}.`);
