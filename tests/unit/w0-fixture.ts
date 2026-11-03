// Fixtures der W0-Tests über Vite gelesen (tests/unit hat keine Node-Typen, tsconfig.json).
// Jeder Aufruf liefert frische Objekte, damit Tests sie im Speicher abwandeln können.
import { dateienAus, PFAD, type Dateien } from './w0-hilfen.ts';

const WISSEN = import.meta.glob<string>('/tests/fixtures/wissen/data/**/*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const STARTBELEGUNG = import.meta.glob<string>('/tests/fixtures/seed/startbelegung/data/**/*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const REPOSITORY = import.meta.glob<string>('/data/**/*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** Test-Wissensstand tests/fixtures/wissen (06_tests.md Abschnitt 10) */
export function wissen(): Dateien {
  return dateienAus(WISSEN, '/tests/fixtures/wissen/');
}

/** Stammfelder der elf Arten (tests/fixtures/seed/startbelegung) plus echte data/stammdaten/sorten.csv */
export function startbelegung(): Dateien {
  const sorten = repository()[PFAD.sorten];
  if (!sorten) throw new Error('data/stammdaten/sorten.csv fehlt');
  return { ...dateienAus(STARTBELEGUNG, '/tests/fixtures/seed/startbelegung/'), [PFAD.sorten]: sorten };
}

/** Stand der W0-Dateien im Repository (nur vorhandene Dateien) */
export function repository(): Dateien {
  return dateienAus(REPOSITORY, '/');
}

/** Rohtext der echten data/stammdaten/sorten.csv */
export function sortenRoh(): string {
  const text = REPOSITORY['/data/stammdaten/sorten.csv'];
  if (text === undefined) throw new Error('data/stammdaten/sorten.csv fehlt');
  return text;
}
