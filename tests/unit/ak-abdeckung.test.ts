import { describe, expect, it } from 'vitest';
import {
  abgleichen,
  akListe,
  berichtLesen,
  junitTests,
  nennt,
  playwrightTests,
  tapTests,
  vitestTests,
  type Ak,
  type Lage,
} from '../../scripts/ak-abdeckung-regeln.ts';

const ISSUE_6 = `### Paketklasse

Routine (keine Planfreigabe)

### AK mit Prüfart

TO7 [E2E]
Info-Seite zeigt Commit [E2E]

Wortlaut im Paketplan: TO7 [E2E]; Info-Seite zeigt Commit [E2E]

### Schätzung in PT (eingefroren)

0.5`;

const ISSUE_7 = `### AK mit Prüfart\r\n\r\nRauchtest mit Rückfall einmal ausgelöst (Beleg im PR)\r\n\r\nWortlaut im Paketplan: Rauchtest mit Rückfall einmal ausgelöst (Beleg im PR)\r\n\r\n### Schätzung in PT (eingefroren)\r\n`;

const ISSUE_GEMISCHT = `### AK mit Prüfart

UC1-AK1 [E2E]
UC1-AK6 [Unit]
UC0-AK2 [SQL]
UC1-AK3 [Gerät]
UC0-AK7 [G]
UC4-AK3 [Eval]
Fälle aus \`docs/spec/pruefung/smoke*.sql\` als pgTAP

### Schätzung in PT (eingefroren)`;

const lage = (teil: Partial<Lage>): Lage => ({
  tests: [],
  abnahmeKommentare: [],
  issueKommentare: [],
  abnahmeWartet: false,
  ...teil,
});

const ak = (text: string, pruefart: Ak['pruefart'] = 'Unit'): Ak => ({
  text,
  pruefart,
  kennung: /\d/.test(text) && !text.includes(' '),
});

describe('AK-Liste aus dem Issue', () => {
  it('liest Kennung und Wortlaut mit Prüfart und hört bei «Wortlaut im Paketplan» auf', () => {
    expect(akListe(ISSUE_6)).toEqual([
      { text: 'TO7', pruefart: 'E2E', kennung: true },
      { text: 'Info-Seite zeigt Commit', pruefart: 'E2E', kennung: false },
    ]);
  });

  it('liest eine Zeile ohne Prüfart mit Windows-Zeilenenden', () => {
    expect(akListe(ISSUE_7)).toEqual([
      { text: 'Rauchtest mit Rückfall einmal ausgelöst (Beleg im PR)', pruefart: 'ohne', kennung: false },
    ]);
  });

  it('erkennt Gerät als [Gerät] und [G], Eval und freie Zeilen bis zum nächsten Abschnitt', () => {
    expect(akListe(ISSUE_GEMISCHT).map((a) => `${a.text}|${a.pruefart}`)).toEqual([
      'UC1-AK1|E2E',
      'UC1-AK6|Unit',
      'UC0-AK2|SQL',
      'UC1-AK3|Geraet',
      'UC0-AK7|Geraet',
      'UC4-AK3|Eval',
      'Fälle aus `docs/spec/pruefung/smoke*.sql` als pgTAP|ohne',
    ]);
  });

  it('ergibt eine leere Liste ohne Abschnitt', () => {
    expect(akListe('### Ziel\n\nirgendwas')).toEqual([]);
  });
});

describe('Testname nennt AK', () => {
  it('Kennung nur als eigenes Wort', () => {
    const uc11 = ak('UC1-AK1');
    expect(nennt('UC1-AK1 Säen speichert', uc11)).toBe(true);
    expect(nennt('Säen UC1-AK1: speichert', uc11)).toBe(true);
    expect(nennt('UC1-AK10 Säen', uc11)).toBe(false);
    expect(nennt('UC1-AK1a Säen', uc11)).toBe(false);
    expect(nennt('UC4-AK1 Tüte', ak('C4-AK1'))).toBe(false);
    expect(nennt('TZ10 Zeit', ak('TZ1'))).toBe(false);
    expect(nennt('UC9-AK6 TZ1 Kalibrierung', ak('TZ1'))).toBe(true);
  });

  it('Wortlaut als Teil des Namens ohne Rücksicht auf Gross- und Kleinschreibung', () => {
    const info = ak('Info-Seite zeigt Commit', 'E2E');
    expect(nennt('info-seite zeigt  Commit aus version.json', info)).toBe(true);
    expect(nennt('Info-Seite zeigt Version', info)).toBe(false);
  });
});

describe('Berichte', () => {
  it('Vitest: voller Name, nur passed zählt als bestanden', () => {
    const tests = vitestTests({
      testResults: [
        {
          assertionResults: [
            { title: 'UC7-AK1 skaliert', fullName: 'Rechner UC7-AK1 skaliert', status: 'passed' },
            { title: 'UC7-AK2 rundet', ancestorTitles: ['Rechner'], status: 'failed' },
            { title: 'UC7-AK3 später', status: 'skipped' },
          ],
        },
      ],
    });
    expect(tests.map((t) => `${t.name}|${t.bestanden}`)).toEqual([
      'Rechner UC7-AK1 skaliert|true',
      'Rechner UC7-AK2 rundet|false',
      'UC7-AK3 später|false',
    ]);
  });

  it('Playwright: Pfad ohne Dateiname, expected und flaky bestanden, unexpected und skipped nicht', () => {
    const tests = playwrightTests({
      suites: [
        {
          title: 'info.spec.ts',
          specs: [{ title: 'Info-Seite zeigt Commit aus version.json', tests: [{ status: 'expected' }] }],
          suites: [
            {
              title: 'Offline',
              specs: [
                { title: 'TO1 erfasst offline', tests: [{ status: 'flaky' }] },
                { title: 'TO2 sendet nach', tests: [{ status: 'unexpected' }] },
                { title: 'TO3 später', tests: [{ status: 'skipped' }] },
              ],
            },
          ],
        },
      ],
    });
    expect(tests.map((t) => `${t.name}|${t.bestanden}`)).toEqual([
      'Info-Seite zeigt Commit aus version.json|true',
      'Offline TO1 erfasst offline|true',
      'Offline TO2 sendet nach|false',
      'Offline TO3 später|false',
    ]);
  });

  it('JUnit (Deno): failure, error und skipped nicht bestanden, Entitäten entschlüsselt', () => {
    const xml = `<?xml version="1.0"?><testsuites><testsuite name="push">
      <testcase name="TP1 sendet &amp; protokolliert" classname="push" time="0.1"/>
      <testcase name="TP2 Fehler" classname="push"><failure message="x">boom</failure></testcase>
      <testcase name="TK1 später" classname="k"><skipped/></testcase>
      <testcase name="TK2 läuft" classname="k"></testcase>
    </testsuite></testsuites>`;
    expect(junitTests(xml).map((t) => `${t.name}|${t.bestanden}`)).toEqual([
      'TP1 sendet & protokolliert|true',
      'TP2 Fehler|false',
      'TK1 später|false',
      'TK2 läuft|true',
    ]);
  });

  it('TAP (pgTAP): ok, not ok, SKIP und TODO', () => {
    const tap = [
      '1..4',
      'ok 1 - UC0-AK2 RLS sperrt anon',
      'not ok 2 - UC1-AK7 Eindeutigkeit',
      'ok 3 - C4-AK1 Sicht # SKIP fehlt',
      '    ok 4 - UC4-AK6 eingerückt',
      '# Looks like you failed 1 test of 4',
    ].join('\n');
    expect(tapTests(tap).map((t) => `${t.name}|${t.bestanden}`)).toEqual([
      'UC0-AK2 RLS sperrt anon|true',
      'UC1-AK7 Eindeutigkeit|false',
      'C4-AK1 Sicht|false',
      'UC4-AK6 eingerückt|true',
    ]);
  });

  it('erkennt den Bericht an Endung und Inhalt, unbekannte Dateien ergeben nichts', () => {
    expect(berichtLesen('vitest.json', JSON.stringify({ testResults: [] }))).toEqual([]);
    expect(
      berichtLesen(
        'playwright.json',
        JSON.stringify({
          suites: [{ title: 'a', specs: [{ title: 'TO7 x', tests: [{ status: 'expected' }] }] }],
        }),
      ),
    ).toHaveLength(1);
    expect(berichtLesen('pgtap.txt', 'ok 1 - UC0-AK2 a')).toHaveLength(1);
    expect(berichtLesen('deno.xml', '<testcase name="TP1 a"/>')).toHaveLength(1);
    expect(berichtLesen('andere.json', '{"x":1}')).toEqual([]);
    expect(berichtLesen('bild.png', '')).toEqual([]);
  });
});

describe('Abgleich', () => {
  const tests = [
    { name: 'TO7 neue Version während Ablauf', bestanden: true, quelle: 'Playwright' },
    { name: 'Info-Seite zeigt Commit aus version.json', bestanden: true, quelle: 'Playwright' },
    { name: 'UC1-AK6 rechnet', bestanden: false, quelle: 'Vitest' },
  ];

  it('Issue 6 ist durch die E2E-Berichte gedeckt', () => {
    const befunde = abgleichen(akListe(ISSUE_6), lage({ tests }));
    expect(befunde.map((b) => b.ergebnis)).toEqual(['gedeckt', 'gedeckt']);
    expect(befunde[1]?.beleg).toBe('Playwright: Info-Seite zeigt Commit aus version.json');
  });

  it('[Unit], [SQL], [E2E] ohne bestandenen Test fehlen', () => {
    const befunde = abgleichen([ak('UC1-AK6'), ak('UC0-AK2', 'SQL'), ak('UC1-AK1', 'E2E')], lage({ tests }));
    expect(befunde.map((b) => `${b.ergebnis}|${b.beleg}`)).toEqual([
      'fehlt|nicht bestanden: UC1-AK6 rechnet',
      'fehlt|kein Testname nennt dieses AK',
      'fehlt|kein Testname nennt dieses AK',
    ]);
  });

  it('Zeile ohne Prüfart ergibt eine Warnung «Beleg von Hand»', () => {
    const befunde = abgleichen(akListe(ISSUE_7), lage({ tests }));
    expect(befunde).toHaveLength(1);
    expect(befunde[0]?.ergebnis).toBe('warnung');
    expect(befunde[0]?.beleg).toContain('Beleg von Hand');
  });

  it('[Gerät] ist mit einer Zeile im Abnahmekommentar gedeckt, auch mit Prüfart in der Zelle', () => {
    const kommentar = `# Abnahme 1 · PR #50\n\n| AK | Ergebnis | Bemerkung | Bild |\n|---|---|---|---|\n| UC1-AK3 [Gerät] | offen-regal | am Regal | – |`;
    const befunde = abgleichen(
      [ak('UC1-AK3', 'Geraet'), ak('UC0-AK7', 'Geraet')],
      lage({ abnahmeKommentare: [kommentar] }),
    );
    expect(befunde.map((b) => b.ergebnis)).toEqual(['gedeckt', 'fehlt']);
  });

  it('[Gerät] und [Eval] warnen nur, solange abnahme-wartet gilt', () => {
    const befunde = abgleichen(
      [ak('UC0-AK7', 'Geraet'), ak('UC4-AK3', 'Eval')],
      lage({ abnahmeWartet: true }),
    );
    expect(befunde.map((b) => b.ergebnis)).toEqual(['warnung', 'warnung']);
  });

  it('[Eval] ist mit einem Issue-Kommentar gedeckt, der die Kennung nennt', () => {
    const befunde = abgleichen(
      [ak('UC4-AK3', 'Eval')],
      lage({ issueKommentare: ['Eval 1.12.: UC4-AK3 Trefferquote 91 %'] }),
    );
    expect(befunde[0]?.ergebnis).toBe('gedeckt');
  });
});
