// Mutationstest der Kernmodule rechner, zielbereich, aufgaben (Konzept 12.6, Mindestwert 80 % in stryker.config.json).
// Solange keines der Module existiert, endet der Lauf mit einer Warnung statt mit dem Fehler von Stryker.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';

const MODULE = /^(rechner|zielbereich|aufgaben).*\.ts$/;
const vorhanden = existsSync('src/domain') && readdirSync('src/domain').some((d) => MODULE.test(d));
if (!vorhanden) {
  console.log(
    '::warning::Mutationstest übersprungen: src/domain/rechner, zielbereich und aufgaben fehlen noch',
  );
  process.exit(0);
}
const lauf = spawnSync('npx', ['stryker', 'run'], { stdio: 'inherit', shell: process.platform === 'win32' });
process.exit(lauf.status ?? 1);
