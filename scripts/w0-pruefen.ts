// npm run w0:pruefen [-- --kandidaten]: Validator V1 bis V13 ohne Datenbank (03_import_w0.md Abschnitt 7).
// Exit 1 bei einem Verstoss; Konflikte der Gegenprobe nur als Warnung.
import { fileURLToPath } from 'node:url';
import { verstossText } from '../src/domain/w0/typen.ts';
import { pruefen } from '../src/domain/w0/validator.ts';
import { dateienLesen, kandidatenLesen } from './seed/dateien.ts';

const wurzel = fileURLToPath(new URL('..', import.meta.url));
const kandidaten = process.argv.includes('--kandidaten');

let fehler = 0;
for (const [modus, gelesen] of [
  ['freigegeben', dateienLesen(wurzel)],
  ...(kandidaten ? [['kandidaten', kandidatenLesen(wurzel)] as const] : []),
] as const) {
  const { verstoesse, konflikte } = pruefen(gelesen.dateien, { modus });
  const alle = [...gelesen.verstoesse, ...verstoesse];
  const vorhanden = Object.keys(gelesen.dateien);
  console.log(`W0 ${modus}: ${vorhanden.length} Dateien (${vorhanden.join(', ') || 'keine'})`);
  for (const v of alle) console.log(`::error::${verstossText(v)}`);
  for (const k of konflikte) console.log(`::warning::Gegenprobe ${k.datei} ${k.zeileId}: ${k.text}`);
  fehler += alle.length;
}
console.log(fehler === 0 ? 'W0-Prüfung bestanden' : `W0-Prüfung: ${fehler} Verstösse`);
process.exit(fehler === 0 ? 0 : 1);
