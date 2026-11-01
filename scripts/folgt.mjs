// Platzhalter für npm-Skripte, deren Inhalt ein späteres Paket liefert (CLAUDE.md, Befehle).
const [skript, paket] = process.argv.slice(2);
console.error(`npm run ${skript}: folgt mit Paket ${paket}.`);
process.exit(1);
