// Bericht der Teilfreigabe je Art (03_import_w0.md 8.4) für die Dateien unter freigegeben/ (Issue #188).
// Aufruf: node scripts/w0/auswahl-bericht.ts
import { fileURLToPath } from 'node:url';
import { artAuswahl } from '../../src/domain/w0/auswahl.ts';
import { seedKonstanten } from '../../src/domain/w0/konstanten.ts';
import { dateienLesen } from '../seed/dateien.ts';

const wurzel = fileURLToPath(new URL('../..', import.meta.url));
const { dateien } = dateienLesen(wurzel);
const auswahl = artAuswahl(dateien, seedKonstanten.pflichtgroessen);
console.log(`voll geladen: ${[...auswahl.voll].sort().join(', ') || 'keine'}`);
for (const [art, grund] of [...auswahl.nurMerkmale].sort()) console.log(`nur Artmerkmale: ${art}: ${grund}`);
console.log(`Keimung vorab: ${[...auswahl.keimungVorab].sort().join(', ') || 'keine'}`);
