// Regeln der AK-Abdeckung (docs/spec/06_tests.md Abschnitt 2, Konzept 12.6, docs/plaene/7.md).
// Reine Funktionen ohne Node-Abhängigkeit; Ein- und Ausgabe in scripts/ak-abdeckung.ts.

export type Pruefart = 'Unit' | 'SQL' | 'E2E' | 'Geraet' | 'Eval' | 'ohne';

export interface Ak {
  /** Kennung (UC7-AK1, TZ5) oder Wortlaut (Info-Seite zeigt Commit) */
  text: string;
  pruefart: Pruefart;
  /** true: ein Wort mit Ziffer wie UC7-AK1; false: Wortlaut */
  kennung: boolean;
}

export interface Testfall {
  name: string;
  bestanden: boolean;
  quelle: string;
}

export interface Lage {
  tests: Testfall[];
  /** Kommentare in Pull Request und Issue, die mit «# Abnahme» beginnen */
  abnahmeKommentare: string[];
  /** alle Kommentare im Issue (für [Eval]) */
  issueKommentare: string[];
  /** Pull Request trägt abnahme-wartet oder ist unbekannt: [Gerät] und [Eval] warnen nur */
  abnahmeWartet: boolean;
}

export type Ergebnis = 'gedeckt' | 'fehlt' | 'warnung';

export interface Befund {
  ak: Ak;
  ergebnis: Ergebnis;
  beleg: string;
}

const KENNUNG = /^(?=.*\d)[A-Za-z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)*$/;

const PRUEFARTEN: Record<string, Pruefart> = {
  unit: 'Unit',
  sql: 'SQL',
  e2e: 'E2E',
  gerät: 'Geraet',
  geraet: 'Geraet',
  g: 'Geraet',
  eval: 'Eval',
};

/** AK-Zeilen im Abschnitt «AK mit Prüfart» bis «Wortlaut im Paketplan:» oder zum nächsten Abschnitt */
export function akListe(issueText: string): Ak[] {
  const zeilen = issueText.split(/\r?\n/).map((z) => z.trim());
  const start = zeilen.findIndex((z) => /^#{1,6}\s*AK mit Prüfart/i.test(z));
  if (start < 0) return [];
  const liste: Ak[] = [];
  for (const zeile of zeilen.slice(start + 1)) {
    if (/^#{1,6}\s/.test(zeile) || /^Wortlaut im Paketplan:/i.test(zeile)) break;
    if (zeile === '' || zeile === '_No response_') continue;
    const [, vorne = '', klammer = ''] = /^(.*?)\s*\[([^\]]+)\]\s*$/.exec(zeile) ?? [];
    const art = PRUEFARTEN[klammer.trim().toLowerCase()];
    const text = (art ? vorne : zeile).replace(/^[-*]\s+/, '').trim();
    liste.push({ text, pruefart: art ?? 'ohne', kennung: KENNUNG.test(text) });
  }
  return liste;
}

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normal(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Kennung als eigenes Wort (UC1-AK1 nicht in UC1-AK10, UC1-AK1a, UC4-AK1); Wortlaut als Teil des Namens */
export function nennt(name: string, ak: Ak): boolean {
  if (!ak.kennung) return normal(name).includes(normal(ak.text));
  return new RegExp(`(?<![\\p{L}\\p{N}-])${escape(ak.text)}(?![\\p{L}\\p{N}-])`, 'u').test(name);
}

function inAbnahme(ak: Ak, kommentare: string[]): boolean {
  return kommentare.some((k) =>
    k.split(/\r?\n/).some((zeile) => {
      const zelle = /^\|([^|]*)\|/.exec(zeile.trim())?.[1];
      return zelle !== undefined && normal(zelle.replace(/\[[^\]]*\]/g, '')) === normal(ak.text);
    }),
  );
}

export function abgleichen(aks: Ak[], lage: Lage): Befund[] {
  return aks.map((ak): Befund => {
    const tests = lage.tests.filter((t) => nennt(t.name, ak));
    const bestanden = tests.find((t) => t.bestanden);
    const beiAbnahme = (gedeckt: boolean, wo: string): Befund =>
      gedeckt
        ? { ak, ergebnis: 'gedeckt', beleg: wo }
        : lage.abnahmeWartet
          ? { ak, ergebnis: 'warnung', beleg: `${wo} steht aus (abnahme-wartet)` }
          : { ak, ergebnis: 'fehlt', beleg: `${wo} fehlt` };
    switch (ak.pruefart) {
      case 'Unit':
      case 'SQL':
      case 'E2E':
        if (bestanden) return { ak, ergebnis: 'gedeckt', beleg: `${bestanden.quelle}: ${bestanden.name}` };
        if (tests[0]) return { ak, ergebnis: 'fehlt', beleg: `nicht bestanden: ${tests[0].name}` };
        return { ak, ergebnis: 'fehlt', beleg: 'kein Testname nennt dieses AK' };
      case 'Geraet':
        return beiAbnahme(inAbnahme(ak, lage.abnahmeKommentare), 'Abnahmekommentar');
      case 'Eval':
        return beiAbnahme(
          lage.issueKommentare.some((k) => nennt(k, ak)),
          'Eval-Ergebnis im Issue',
        );
      case 'ohne':
        if (bestanden) return { ak, ergebnis: 'gedeckt', beleg: `${bestanden.quelle}: ${bestanden.name}` };
        return { ak, ergebnis: 'warnung', beleg: 'ohne Prüfart: Beleg von Hand im Pull Request' };
    }
  });
}

interface VitestBericht {
  testResults: {
    assertionResults: { title: string; fullName?: string; ancestorTitles?: string[]; status: string }[];
  }[];
}

export function vitestTests(bericht: VitestBericht): Testfall[] {
  return bericht.testResults.flatMap((datei) =>
    datei.assertionResults.map((t) => ({
      name: t.fullName ?? [...(t.ancestorTitles ?? []), t.title].join(' '),
      bestanden: t.status === 'passed',
      quelle: 'Vitest',
    })),
  );
}

interface PlaywrightSuite {
  title: string;
  specs?: { title: string; tests: { status: string }[] }[];
  suites?: PlaywrightSuite[];
}

export function playwrightTests(bericht: { suites: PlaywrightSuite[] }): Testfall[] {
  const liste: Testfall[] = [];
  const gehe = (suite: PlaywrightSuite, pfad: string[]) => {
    for (const spec of suite.specs ?? []) {
      liste.push({
        name: [...pfad, spec.title].join(' '),
        bestanden:
          spec.tests.length > 0 && spec.tests.every((t) => t.status === 'expected' || t.status === 'flaky'),
        quelle: 'Playwright',
      });
    }
    for (const kind of suite.suites ?? []) gehe(kind, [...pfad, kind.title]);
  };
  // die oberste Suite ist die Datei; ihr Name gehört nicht zum Testnamen
  for (const datei of bericht.suites) gehe(datei, []);
  return liste;
}

function xmlText(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** JUnit-XML (deno test --reporter=junit) */
export function junitTests(xml: string): Testfall[] {
  const liste: Testfall[] = [];
  for (const m of xml.matchAll(/<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g)) {
    const name = /\bname="([^"]*)"/.exec(m[1] ?? '')?.[1];
    if (name === undefined) continue;
    liste.push({
      name: xmlText(name),
      bestanden: !/<(failure|error|skipped)\b/.test(m[2] ?? ''),
      quelle: 'Deno',
    });
  }
  return liste;
}

/** TAP (pgTAP über supabase test db): «ok 3 - UC0-AK2 …», «not ok 4 - …», SKIP und TODO zählen nicht */
export function tapTests(text: string): Testfall[] {
  const liste: Testfall[] = [];
  for (const zeile of text.split(/\r?\n/)) {
    const m = /^\s*(not )?ok\b\s*\d*\s*(?:-\s*)?(.*?)\s*(#\s*(SKIP|TODO)\b.*)?$/i.exec(zeile);
    if (!m || !m[2]) continue;
    liste.push({ name: m[2], bestanden: !m[1] && !m[3], quelle: 'pgTAP' });
  }
  return liste;
}

/** Bericht nach Dateiendung und Inhalt erkennen; unbekannte Dateien ergeben keine Tests */
export function berichtLesen(datei: string, inhalt: string): Testfall[] {
  if (datei.endsWith('.json')) {
    const json = JSON.parse(inhalt) as Record<string, unknown>;
    if (Array.isArray(json['testResults'])) return vitestTests(json as unknown as VitestBericht);
    if (Array.isArray(json['suites']))
      return playwrightTests(json as unknown as { suites: PlaywrightSuite[] });
    return [];
  }
  if (datei.endsWith('.xml')) return junitTests(inhalt);
  if (datei.endsWith('.txt') || datei.endsWith('.tap')) return tapTests(inhalt);
  return [];
}

const ZEICHEN: Record<Ergebnis, string> = { gedeckt: 'gedeckt', fehlt: 'FEHLT', warnung: 'Warnung' };

const ANZEIGE: Record<Pruefart, string> = {
  Unit: 'Unit',
  SQL: 'SQL',
  E2E: 'E2E',
  Geraet: 'Gerät',
  Eval: 'Eval',
  ohne: '–',
};

export function tabelle(befunde: Befund[]): string {
  const zeilen = befunde.map(
    (b) =>
      `| ${b.ak.text} | ${ANZEIGE[b.ak.pruefart]} | ${ZEICHEN[b.ergebnis]} | ${b.beleg.replace(/\|/g, '\\|')} |`,
  );
  return ['| AK | Prüfart | Ergebnis | Beleg |', '|---|---|---|---|', ...zeilen].join('\n');
}
