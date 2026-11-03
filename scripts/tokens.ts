// npm run tokens: schreibt design-system/tokens.css aus tokens.json (Entscheid R11, Plan 17).
// npm run tokens -- --pruefen: Exit 1, wenn tokens.css nicht dem erzeugten Text entspricht.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tokensCss, type Tokens } from './tokens-regeln.ts';

const ordner = resolve(import.meta.dirname, '../design-system');
const quelle = JSON.parse(readFileSync(resolve(ordner, 'tokens.json'), 'utf8')) as Tokens;
const ziel = resolve(ordner, 'tokens.css');
const text = tokensCss(quelle);

if (process.argv.includes('--pruefen')) {
  if (readFileSync(ziel, 'utf8') !== text) {
    console.error('design-system/tokens.css weicht von tokens.json ab: npm run tokens');
    process.exit(1);
  }
  console.log('tokens.css entspricht tokens.json');
} else {
  writeFileSync(ziel, text);
  console.log(`design-system/tokens.css geschrieben (${text.split('\n').length} Zeilen)`);
}
