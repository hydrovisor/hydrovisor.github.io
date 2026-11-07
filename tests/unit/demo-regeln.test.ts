// Demo-Regeln (Plan 15, Lösungsweg 1 und 2; 06_tests.md Abschnitt 10): relative Daten über die Sommerzeit,
// Referenzen, Suche, einmal-Zeilen, SQL-Quoting und alle Fixtures unter tests/fixtures/demo. Routine: Tests vom Lead.
import { describe, expect, it } from 'vitest';
import {
  clientIdFuer,
  demoSkript,
  idFuer,
  literal,
  loeschSkript,
  relativ,
  uuidAus,
  type Fixture,
  type Uhr,
  type Zeile,
} from '../../scripts/demo/regeln.ts';
import { md5 } from '../../scripts/demo/md5.ts';
import { DECKEL_VORSCHLAEGE } from '../../src/domain/vorlagen/deckel-vorschlaege.ts';

const ZONE = 'Europe/Zurich';
const uhr = (iso: string): Uhr => ({ jetzt: new Date(iso), zeitzone: ZONE });
const fixture = (zeilen: Zeile[], name = 'probe.json'): Fixture => ({ name, zeilen });
const zeit = (r: ReturnType<typeof relativ>) => (r && 'zeitpunkt' in r ? r.zeitpunkt.toISOString() : r);

const dateien = import.meta.glob<{ zeilen: Zeile[] }>('../fixtures/demo/*.json', {
  eager: true,
  import: 'default',
});
const alle: Fixture[] = Object.entries(dateien)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([pfad, inhalt]) => ({ name: pfad.split('/').pop() ?? pfad, zeilen: inhalt.zeilen }));
const zeilenAus = (name: string) => alle.find((f) => f.name === name)?.zeilen ?? [];

describe('md5 und IDs', () => {
  it('md5 trifft die Prüfwerte aus RFC 1321', () => {
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(md5('abc')).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(md5('message digest')).toBe('f96b697d7cb7938d525a2f31aaf161d0');
    expect(md5('12345678901234567890123456789012345678901234567890123456789012345678901234567890')).toBe(
      '57edf4a22be3c955ac49da2e2107b67a',
    );
    expect(md5('Füllstand ⅓')).toHaveLength(32);
  });

  it('IDs sind UUIDs aus md5, getrennt für id und client_id', () => {
    expect(uuidAus('abc')).toBe('90015098-3cd2-4fb0-d696-3f7d28e17f72');
    expect(idFuer('X')).toBe(uuidAus('demo:X'));
    expect(clientIdFuer('X')).toBe(uuidAus('demo-client:X'));
    expect(idFuer('X')).not.toBe(clientIdFuer('X'));
  });
});

describe('relative Daten (Europe/Zurich)', () => {
  it('heute und heute±N als Kalendertag in Zürich, auch kurz nach Mitternacht', () => {
    // 3.11.2026 23:30 UTC = 4.11. 00:30 in Zürich
    const u = uhr('2026-11-03T23:30:00Z');
    expect(relativ('heute', u)).toEqual({ tag: '2026-11-04' });
    expect(relativ('heute-12', u)).toEqual({ tag: '2026-10-23' });
    expect(relativ('heute+2', u)).toEqual({ tag: '2026-11-06' });
  });

  it('jetzt-Nd HH:MM über die Umstellung auf Winterzeit (25.10.2026)', () => {
    const u = uhr('2026-10-30T10:00:00Z'); // 11:00 MEZ
    expect(zeit(relativ('jetzt-12d 18:00', u))).toBe('2026-10-18T16:00:00.000Z'); // 18:00 MESZ
    expect(zeit(relativ('jetzt-12d', u))).toBe('2026-10-18T09:00:00.000Z'); // 11:00 MESZ, Uhrzeit von jetzt
    expect(zeit(relativ('jetzt+1d 08:00', u))).toBe('2026-10-31T07:00:00.000Z');
  });

  it('jetzt-Nd HH:MM über die Umstellung auf Sommerzeit (28.3.2027)', () => {
    const u = uhr('2027-03-29T10:00:00Z'); // 12:00 MESZ
    expect(zeit(relativ('jetzt-1d 01:30', u))).toBe('2027-03-28T00:30:00.000Z'); // 01:30 MEZ
    expect(zeit(relativ('jetzt-1d 18:00', u))).toBe('2027-03-28T16:00:00.000Z'); // 18:00 MESZ
  });

  it('jetzt ohne Zusatz ist genau die Uhr; anderer Text ist nicht relativ', () => {
    const u = uhr('2026-11-03T21:15:42.123Z');
    expect(zeit(relativ('jetzt', u))).toBe('2026-11-03T21:15:42.123Z');
    expect(relativ('Jetzt', u)).toBeUndefined();
    expect(relativ('heute morgen', u)).toBeUndefined();
    expect(() => relativ('jetzt-1d 25:00', u)).toThrow(/Uhrzeit/);
  });
});

describe('Umsetzung in SQL', () => {
  const u = uhr('2026-11-03T12:00:00Z');

  it('Werte: Text mit Apostroph, Zahl, Wahrheitswert, null, Liste, jsonb', () => {
    expect(literal("O'Neill")).toBe("'O''Neill'");
    const { kern } = demoSkript(
      [
        fixture([
          {
            tabelle: 'anlage',
            ref: 'A',
            felder: { name: "Tims 'Regal'", kuerzel: 'A', aktiv: true, licht_von: null },
          },
          {
            tabelle: 'ereignis',
            ref: 'E',
            felder: {
              typ: 'beobachtung',
              anlage_id: '@A',
              daten: { text: "it's", ziel: '@A', am: 'heute-1', liste: [1, 'jetzt'] },
              gilt_ab: 'jetzt-2d 18:00',
              zahlen: [1, 2],
              leer: [],
              wert: 1.25,
            },
          },
        ]),
      ],
      u,
    );
    expect(kern).toContain(`'Tims ''Regal'''`);
    expect(kern).toContain('true, null');
    expect(kern).toContain(`'${idFuer('A')}'::uuid`);
    expect(kern).toContain(
      `'${JSON.stringify({ text: "it''s", ziel: idFuer('A'), am: '2026-11-02', liste: [1, '2026-11-03T12:00:00.000Z'] })}'::jsonb`,
    );
    expect(kern).toContain(`'2026-11-01T17:00:00.000Z'::timestamptz`);
    expect(kern).toContain('array[1, 2]');
    expect(kern).toContain(`'{}'`);
    expect(kern).toContain('1.25');
    expect(kern).toContain(`'${clientIdFuer('E')}'::uuid`);
    expect(kern).toContain(`'demo'`);
  });

  it('beginnt mit dem Löschen von Demo- und Testdaten; vollständig in einer Transaktion mit Bericht', () => {
    const s = demoSkript(
      [fixture([{ tabelle: 'anlage', ref: 'A', felder: { name: 'a', kuerzel: 'A' } }])],
      u,
    );
    expect(
      s.kern.startsWith("select public.datenart_loeschen('demo');\nselect public.datenart_loeschen('test');"),
    ).toBe(true);
    expect(s.vollstaendig).toMatch(
      /^begin;\n[\s\S]*\ncommit;\nselect jsonb_build_object\([\s\S]* as bericht;$/,
    );
    expect(s.zeilen).toBe(1);
    expect(loeschSkript()).toMatch(/^begin;\nselect public\.datenart_loeschen\('demo'\);[\s\S]*commit;/);
  });

  it('Suche nach der ersten Zeile einer Tabelle oder mit einem Wert', () => {
    const { kern } = demoSkript(
      [
        fixture([
          {
            tabelle: 'messung',
            ref: 'M',
            felder: { messgeraet_id: '?messgeraet', sorte: "?sorte_schluessel.sorte_key=o'k" },
          },
        ]),
      ],
      u,
    );
    expect(kern).toContain('(select id from public.messgeraet order by id limit 1)');
    expect(kern).toContain(
      `(select id from public.sorte_schluessel where sorte_key = 'o''k' order by id limit 1)`,
    );
  });

  it('einmal: nur ohne offene Zeile gleichen Werts; Referenz sucht die vorhandene Zeile', () => {
    const { kern } = demoSkript(
      [
        fixture([
          {
            tabelle: 'deckeltyp',
            ref: 'D',
            einmal: 'name',
            felder: { name: 'Demo D1', loecher_je_reihe: [2, 2] },
          },
          { tabelle: 'gefaess', ref: 'G', felder: { deckeltyp_id: '@D' } },
        ]),
      ],
      u,
    );
    expect(kern).toContain(
      "where not exists (select 1 from public.deckeltyp where name = 'Demo D1' and storniert_am is null) on conflict (id) do nothing;",
    );
    expect(kern).toContain(
      "(select id from public.deckeltyp where name = 'Demo D1' and storniert_am is null order by erfasst_am, id limit 1)",
    );
    expect(() =>
      demoSkript(
        [
          fixture([
            { tabelle: 'deckeltyp', ref: 'D', einmal: 'name', felder: { name: 'x' } },
            { tabelle: 'ereignis', ref: 'E', felder: { daten: { d: '@D' } } },
          ]),
        ],
        u,
      ),
    ).toThrow(/einmal-Zeile, in jsonb nicht erlaubt/);
    expect(() =>
      demoSkript([fixture([{ tabelle: 'deckeltyp', ref: 'D', einmal: 'name', felder: {} }])], u),
    ).toThrow(/einmal braucht einen Text/);
  });

  it('fehlende, späte oder doppelte Referenz ist ein Fehler mit Datei und Zeile', () => {
    expect(() =>
      demoSkript([fixture([{ tabelle: 'platz', ref: 'P', felder: { anlage_id: '@fehlt' } }], 's1.json')], u),
    ).toThrow('s1.json Zeile 1 (P).anlage_id: Referenz @fehlt unbekannt oder vor ihrer Zeile verwendet');
    expect(() =>
      demoSkript(
        [
          fixture([{ tabelle: 'platz', ref: 'P', felder: { anlage_id: '@A' } }]),
          fixture([{ tabelle: 'anlage', ref: 'A', felder: {} }]),
        ],
        u,
      ),
    ).toThrow(/Referenz @A unbekannt/);
    expect(() =>
      demoSkript(
        [
          fixture([
            { tabelle: 'anlage', ref: 'A', felder: {} },
            { tabelle: 'anlage', ref: 'A', felder: {} },
          ]),
        ],
        u,
      ),
    ).toThrow(/ref doppelt: A/);
  });

  it('Tabellen- und Spaltennamen nur aus Kleinbuchstaben, Ziffern und _', () => {
    expect(() => demoSkript([fixture([{ tabelle: 'anlage; drop', ref: 'A', felder: {} }])], u)).toThrow(
      /Name ungültig/,
    );
    expect(() => demoSkript([fixture([{ tabelle: 'anlage', ref: 'A', felder: { 'x"': 1 } }])], u)).toThrow(
      /Name ungültig/,
    );
    expect(() =>
      demoSkript([fixture([{ tabelle: 'a', ref: 'A', felder: { b: '?x.y z=1' } }])], u),
    ).not.toThrow();
    expect(() => demoSkript([fixture([{ tabelle: 'a', ref: 'A', felder: { b: Number.NaN } }])], u)).toThrow(
      /Zahl ungültig/,
    );
  });
});

describe('Fixtures S1 bis S9 und Y', () => {
  const u = uhr('2026-11-03T12:00:00Z');

  it('alle zehn Dateien setzen sich ohne Fehler um, IDs eindeutig', () => {
    expect(alle.map((f) => f.name)).toEqual([
      's1-regal.json',
      's2-dwc.json',
      's3-veraltet.json',
      's4-kratky.json',
      's5-unsicher.json',
      's6-konflikt.json',
      's7-leer.json',
      's8-keimung.json',
      's9-spitzentag.json',
      'y-testanlage.json',
    ]);
    const s = demoSkript(alle, u);
    expect(s.zeilen).toBe(alle.reduce((n, f) => n + f.zeilen.length, 0));
    const refs = alle.flatMap((f) => f.zeilen.map((z) => z.ref));
    expect(new Set(refs).size).toBe(refs.length);
  });

  it('S1: Anlage X demo mit 13 Gefässen (5 Stationen), je gefaess_erfasst, A1 bis A4, W, 7 Deckel', () => {
    const z = zeilenAus('s1-regal.json');
    expect(z.find((r) => r.tabelle === 'anlage')?.felder).toMatchObject({ kuerzel: 'X', datenart: 'demo' });
    const gefaesse = z.filter((r) => r.tabelle === 'gefaess');
    expect(gefaesse).toHaveLength(13);
    expect(gefaesse.filter((g) => g.felder['feste_dosis'] === true)).toHaveLength(5);
    for (const g of gefaesse)
      expect(
        z.some(
          (r) =>
            r.tabelle === 'ereignis' &&
            r.felder['typ'] === 'gefaess_erfasst' &&
            r.felder['platz_id'] === g.felder['platz_id'],
        ),
      ).toBe(true);
    expect(z.filter((r) => r.tabelle === 'anzuchtort')).toHaveLength(4);
    expect(z.filter((r) => r.tabelle === 'platz' && r.felder['rolle'] === 'messstelle')).toHaveLength(1);
    expect(z.filter((r) => r.tabelle === 'deckeltyp').map((r) => r.felder['name'])).toEqual(
      ['D1', 'D2', 'D3', 'D4', 'D6', 'S8', 'S5'].map((d) => `Demo ${d}`),
    );
  });

  it('DS8-AK1 S1: Demo S8 hat Löcher je Reihe 1, 1, 1, 1 mit 8 cm Topf, gleich wie der Vorschlag S8 (#128)', () => {
    const s8 = zeilenAus('s1-regal.json').find(
      (r) => r.tabelle === 'deckeltyp' && r.felder['name'] === 'Demo S8',
    );
    const vorschlag = DECKEL_VORSCHLAEGE.find((v) => v.name === 'S8');
    expect(s8?.felder).toMatchObject({ topfdurchmesser_mm: 80, loecher_je_reihe: [1, 1, 1, 1] });
    expect(s8?.felder['loecher_je_reihe']).toEqual(vorschlag?.reihen);
    expect((s8?.felder['topfdurchmesser_mm'] as number) / 10).toBe(vorschlag?.topfCm);
  });

  it('Y ist identisch mit tests/e2e/orte.ts: Testanlage, Datenart test, Y-2.3 DWC 2 Tage, Y-3.1 Kratky belüftet 7 Tage, Y-W', () => {
    const z = zeilenAus('y-testanlage.json');
    expect(z.find((r) => r.tabelle === 'anlage')?.felder).toEqual({
      name: 'Testanlage Y',
      kuerzel: 'Y',
      datenart: 'test',
    });
    expect(
      z.filter((r) => r.tabelle === 'platz').map((r) => [r.felder['kennung'], r.felder['rolle']]),
    ).toEqual([
      ['2.3', 'gefaess'],
      ['3.1', 'gefaess'],
      ['W', 'messstelle'],
    ]);
    expect(z.find((r) => r.ref === 'Y-g2.3')?.felder).toMatchObject({
      betriebsart: 'dwc',
      intervall_messen_d: 2,
      intervall_wechseln_d: 14,
      betriebsvolumen_l: 15,
    });
    expect(z.find((r) => r.ref === 'Y-g3.1')?.felder).toMatchObject({
      betriebsart: 'kratky_belueftet',
      intervall_messen_d: 7,
      betriebsvolumen_l: 15,
    });
    expect(z.find((r) => r.tabelle === 'gefaessmodell')).toMatchObject({
      einmal: 'name',
      felder: { name: 'E2E Box Y' },
    });
    expect(z.find((r) => r.tabelle === 'deckeltyp')).toMatchObject({
      einmal: 'name',
      felder: { name: 'E2E Deckel Y' },
    });
    // keine Kalibrierung für Y: die E2E prüfen die Erstkalibrierung
    expect(
      alle
        .flatMap((f) => f.zeilen)
        .filter((r) => r.tabelle === 'kalibrierung' && r.felder['datenart'] !== 'demo'),
    ).toEqual([]);
  });

  it('keine Personendaten in den Fixtures (CLAUDE.md Regel 6)', () => {
    const text = JSON.stringify(alle);
    expect(text).not.toMatch(/@[a-z0-9.-]+\.[a-z]{2,}/i);
    expect(text).not.toMatch(/\+?\d{2,3}[ /]\d{3}[ /]\d{2}[ /]\d{2}/);
  });
});
