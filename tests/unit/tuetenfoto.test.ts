// Tütenfotos je Sorte und Seite (Issue #207, Plan 207 Testliste Unit; TF1-AK2, TF1-AK3, TO2; Konzept 8.1 Regeln 2 und
// 3, 11.3, 11.4; Plan 37 A16). Reine Funktionen; erfassungBauen() und schreiben() mit fester Uhr in Zürich.
// Keine Personendaten, erfundene Sorten und UUIDs.
//
// Vorausgesetzt (Plan 207, Domäne und Datenfluss):
//   src/domain/sorten/tuetenfoto.ts
//     type TuetenfotoSeite = 'vorne' | 'hinten'
//     interface TuetenfotoZeile { id; client_id; sorte_id; saatgut_id: string | null; seite; pfad; erfasst_am;
//                                 storniert_am: string | null }
//     aktuelleTuetenfotos(zeilen, sorteId) → { vorne?: { pfad; clientId }; hinten?: { pfad; clientId } }
//       je Seite die jüngste nicht stornierte Zeile der Sorte nach erfasst_am, bei Gleichstand die grössere id (A6);
//       der Pfad zählt nicht für die Zuordnung (A16)
//     tuetenfotoVorgang({ sorteId; seite; pfad; clientId; ersetzt? }) → Schritt[]
//       ohne ersetzt: ein Schritt neu (tuetenfoto, saatgut_id null); mit ersetzt: neu, dann storno (korrektur) der
//       alten client_id (#219: Neu vor Storno, Plan 207 A20)
//   src/domain/sorten/erfassung.ts erfassungBauen(f, ids: { sorteId; saatgutId; clientIds; fotos? }, ki, kontext)
//     je Foto nach saatgut und vor dem Feldprotokoll ein Schritt neu tuetenfoto
//   src/domain/datenpfad/buendel-teile.ts BUENDEL_TEILE mit tuetenfoto (ohneStorno)
import { describe, expect, it, vi } from 'vitest';
import {
  aktuelleTuetenfotos,
  tuetenfotoVorgang,
  type TuetenfotoSeite,
  type TuetenfotoZeile,
} from '../../src/domain/sorten/tuetenfoto.ts';
import {
  erfassungBauen,
  leeresFormular,
  type KiLauf,
  type SortenFormular,
} from '../../src/domain/sorten/erfassung.ts';
import {
  vorgangPruefen,
  type Schritt,
  type Vorgang,
  type Zeitkontext,
} from '../../src/domain/datenpfad/erfassung.ts';
import { BUENDEL_TEILE } from '../../src/domain/datenpfad/buendel-teile.ts';
import { erstelleSchreiben, type Schreibadapter } from '../../src/daten/schreiben.ts';
import type { KiErgebnis } from '../../src/domain/ki/uebernahme.ts';

// schreiben.ts bindet den Supabase-Client und das Bündel; im Unit-Test ohne Netz und IndexedDB
vi.mock('../../src/daten/supabase.ts', () => ({ supabase: {}, SUPABASE_URL: 'http://127.0.0.1:54321' }));
vi.mock('../../src/daten/buendel.ts', () => ({
  buendelLaden: vi.fn(async () => ({ status: 'kein_zugang' })),
  buendelLesen: vi.fn(async () => undefined),
  buendelLeeren: vi.fn(async () => undefined),
}));

const ZUERICH = 'Europe/Zurich';
// 15.1.2027 10:30 Zürich
const JETZT = new Date('2027-01-15T09:30:00.000Z');
const KONTEXT = { jetzt: JETZT, zeitzone: ZUERICH, appVersion: '0.1.0+test' };
const ZEIT: Zeitkontext = { jetzt: JETZT, zeitzone: ZUERICH };

const id = (n: number) => `20700000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const SORTE = id(10);
const ANDERE_SORTE = id(11);
const FREMDER_ORDNER = id(12);
const SAATGUT = id(20);
const pfad = (ordner: string, n: number) => `${ordner}/${id(100 + n)}.jpg`;

function zeile(
  n: number,
  seite: TuetenfotoSeite,
  erfasstAm: string,
  extra: Partial<TuetenfotoZeile> = {},
): TuetenfotoZeile {
  return {
    id: id(500 + n),
    client_id: id(300 + n),
    sorte_id: SORTE,
    saatgut_id: null,
    seite,
    pfad: pfad(SORTE, n),
    erfasst_am: erfasstAm,
    storniert_am: null,
    ...extra,
  };
}

/** Vorgang auf die Zeilen anwenden, wie die Datenbank es täte (neu mit erfasst_am, storno setzt storniert_am) */
function anwenden(
  zeilen: TuetenfotoZeile[],
  vorgang: Vorgang,
  erfasstAm: string,
  n: number,
): TuetenfotoZeile[] {
  const neu = zeilen.map((z) => ({ ...z }));
  for (const s of vorgang) {
    expect(s.tabelle).toBe('tuetenfoto');
    if (s.art === 'storno') {
      for (const z of neu)
        if (z.client_id === s.clientId && z.storniert_am === null) z.storniert_am = erfasstAm;
    } else if (s.art === 'neu') {
      const f = s.felder as Record<string, unknown>;
      neu.push({
        id: id(600 + n),
        client_id: String(f['client_id']),
        sorte_id: String(f['sorte_id']),
        saatgut_id: (f['saatgut_id'] as string | null) ?? null,
        seite: f['seite'] as TuetenfotoSeite,
        pfad: String(f['pfad']),
        erfasst_am: erfasstAm,
        storniert_am: null,
      });
    }
  }
  return neu;
}

describe('TF1-AK2 aktuelleTuetenfotos', () => {
  it('TF1-AK2 aktuelleTuetenfotos liefert je Seite die jüngste nicht stornierte Zeile, auch unter fremder sorte_id', () => {
    const zeilen: TuetenfotoZeile[] = [
      zeile(1, 'vorne', '2027-01-10T08:00:00.000Z'),
      zeile(2, 'vorne', '2027-01-12T08:00:00.000Z'),
      // jünger, aber storniert: zählt nicht
      zeile(3, 'vorne', '2027-01-14T08:00:00.000Z', { storniert_am: '2027-01-14T09:00:00.000Z' }),
      // Plan 37 A16: Pfad unter fremder sorte_id, die Zeile gehört zur Sorte
      zeile(4, 'hinten', '2027-01-11T08:00:00.000Z', { pfad: pfad(FREMDER_ORDNER, 4) }),
      // andere Sorte, jünger: zählt nicht
      zeile(5, 'vorne', '2027-01-15T08:00:00.000Z', { sorte_id: ANDERE_SORTE }),
      zeile(6, 'hinten', '2027-01-15T08:00:00.000Z', { sorte_id: ANDERE_SORTE }),
    ];
    expect(aktuelleTuetenfotos(zeilen, SORTE)).toEqual({
      vorne: { pfad: pfad(SORTE, 2), clientId: id(302) },
      hinten: { pfad: pfad(FREMDER_ORDNER, 4), clientId: id(304) },
    });
    expect(aktuelleTuetenfotos(zeilen, ANDERE_SORTE)).toEqual({
      vorne: { pfad: pfad(SORTE, 5), clientId: id(305) },
      hinten: { pfad: pfad(SORTE, 6), clientId: id(306) },
    });
  });

  it('TF1-AK2 Pfad unter der Sorte, Zeile einer anderen Sorte: zählt nicht für diese Sorte (A16, nur sorte_id ordnet zu)', () => {
    const zeilen = [zeile(1, 'vorne', '2027-01-10T08:00:00.000Z', { sorte_id: ANDERE_SORTE })];
    // der Pfad liegt im Ordner SORTE, die Zeile gehört aber zu ANDERE_SORTE
    expect(zeilen[0]?.pfad.startsWith(`${SORTE}/`)).toBe(true);
    expect(aktuelleTuetenfotos(zeilen, SORTE)).toEqual({});
  });

  it('TF1-AK2 nur Rückseite: vorne fehlt; keine Zeile: leeres Ergebnis', () => {
    const r = aktuelleTuetenfotos([zeile(1, 'hinten', '2027-01-10T08:00:00.000Z')], SORTE);
    expect(r.hinten).toEqual({ pfad: pfad(SORTE, 1), clientId: id(301) });
    expect(r.vorne).toBeUndefined();
    expect('vorne' in r).toBe(false);
    expect(aktuelleTuetenfotos([], SORTE)).toEqual({});
    // nur stornierte Zeilen: kein Foto
    expect(
      aktuelleTuetenfotos(
        [zeile(2, 'vorne', '2027-01-10T08:00:00.000Z', { storniert_am: '2027-01-11T08:00:00.000Z' })],
        SORTE,
      ),
    ).toEqual({});
  });

  it('TF1-AK2 Gleichstand bei erfasst_am: die grössere id gewinnt, unabhängig von der Reihenfolge (A6)', () => {
    const gleich = '2027-01-12T08:00:00.123456+00:00';
    const a = zeile(1, 'vorne', gleich, { id: id(901) });
    const b = zeile(2, 'vorne', gleich, { id: id(902) });
    expect(aktuelleTuetenfotos([a, b], SORTE).vorne?.clientId).toBe(id(302));
    expect(aktuelleTuetenfotos([b, a], SORTE).vorne?.clientId).toBe(id(302));
  });

  it('TF1-AK2 erfasst_am als Zeitpunkt verglichen, nicht als Text (+00:00 gegen Z)', () => {
    // Text «2027-01-12T09…+01:00» ist lexikalisch grösser, als Zeitpunkt aber älter als 08:30Z
    const aelter = zeile(1, 'vorne', '2027-01-12T09:00:00+01:00');
    const juenger = zeile(2, 'vorne', '2027-01-12T08:30:00.000Z');
    expect(aktuelleTuetenfotos([aelter, juenger], SORTE).vorne?.clientId).toBe(id(302));
    expect(aktuelleTuetenfotos([juenger, aelter], SORTE).vorne?.clientId).toBe(id(302));
  });
});

describe('TF1-AK2 tuetenfotoVorgang', () => {
  it('TF1-AK2 tuetenfotoVorgang ergänzt mit einer Zeile und ersetzt mit Storno plus neuer Zeile', () => {
    const ergaenzen = tuetenfotoVorgang({
      sorteId: SORTE,
      seite: 'vorne',
      pfad: pfad(SORTE, 1),
      clientId: id(401),
    });
    expect(ergaenzen).toEqual([
      {
        art: 'neu',
        tabelle: 'tuetenfoto',
        felder: {
          client_id: id(401),
          sorte_id: SORTE,
          saatgut_id: null,
          seite: 'vorne',
          pfad: pfad(SORTE, 1),
        },
      },
    ]);
    expect(vorgangPruefen(ergaenzen)).toEqual([]);

    const ersetzen = tuetenfotoVorgang({
      sorteId: SORTE,
      seite: 'hinten',
      pfad: pfad(SORTE, 2),
      clientId: id(402),
      ersetzt: id(399),
    });
    // #219: Neu vor Storno (Plan 207 A20)
    expect(ersetzen).toEqual([
      {
        art: 'neu',
        tabelle: 'tuetenfoto',
        felder: {
          client_id: id(402),
          sorte_id: SORTE,
          saatgut_id: null,
          seite: 'hinten',
          pfad: pfad(SORTE, 2),
        },
      },
      { art: 'storno', tabelle: 'tuetenfoto', clientId: id(399), grund: 'korrektur' },
    ]);
    expect(vorgangPruefen(ersetzen)).toEqual([]);
  });

  it('TF1-AK2 Ersetzen nach aktuelleTuetenfotos storniert die gültige Zeile derselben Seite, die andere Seite bleibt', () => {
    let zeilen = [
      zeile(1, 'vorne', '2027-01-10T08:00:00.000Z'),
      zeile(2, 'hinten', '2027-01-10T08:01:00.000Z'),
    ];
    const aktuell = aktuelleTuetenfotos(zeilen, SORTE);
    const v = tuetenfotoVorgang({
      sorteId: SORTE,
      seite: 'vorne',
      pfad: pfad(SORTE, 7),
      clientId: id(407),
      ersetzt: aktuell.vorne?.clientId,
    });
    // #219: Neu vor Storno (Plan 207 A20)
    expect(v[1]).toEqual({ art: 'storno', tabelle: 'tuetenfoto', clientId: id(301), grund: 'korrektur' });
    zeilen = anwenden(zeilen, v, '2027-01-15T09:30:00.000Z', 7);
    expect(aktuelleTuetenfotos(zeilen, SORTE)).toEqual({
      vorne: { pfad: pfad(SORTE, 7), clientId: id(407) },
      hinten: { pfad: pfad(SORTE, 2), clientId: id(302) },
    });
    expect(zeilen.filter((z) => z.storniert_am !== null).map((z) => z.client_id)).toEqual([id(301)]);
  });

  it('TF1-AK2 Grenzfall zweimal ersetzen: das zweite Ersetzen storniert die Zeile des ersten; mit verspätetem Bündel gilt die jüngere', () => {
    const start = [zeile(1, 'vorne', '2027-01-10T08:00:00.000Z')];
    // erstes Ersetzen
    const v1 = tuetenfotoVorgang({
      sorteId: SORTE,
      seite: 'vorne',
      pfad: pfad(SORTE, 2),
      clientId: id(402),
      ersetzt: aktuelleTuetenfotos(start, SORTE).vorne?.clientId,
    });
    const nachErstem = anwenden(start, v1, '2027-01-15T09:30:00.000Z', 2);
    // zweites Ersetzen aus dem nachgeladenen Bündel: storniert die Zeile des ersten Ersetzens
    const v2 = tuetenfotoVorgang({
      sorteId: SORTE,
      seite: 'vorne',
      pfad: pfad(SORTE, 3),
      clientId: id(403),
      ersetzt: aktuelleTuetenfotos(nachErstem, SORTE).vorne?.clientId,
    });
    // #219: Neu vor Storno (Plan 207 A20)
    expect(v2[1]).toEqual({ art: 'storno', tabelle: 'tuetenfoto', clientId: id(402), grund: 'korrektur' });
    const nachZweitem = anwenden(nachErstem, v2, '2027-01-15T09:31:00.000Z', 3);
    expect(nachZweitem.filter((z) => z.storniert_am === null).map((z) => z.client_id)).toEqual([id(403)]);
    expect(aktuelleTuetenfotos(nachZweitem, SORTE).vorne).toEqual({
      pfad: pfad(SORTE, 3),
      clientId: id(403),
    });

    // verspätetes Bündel: das zweite Ersetzen sieht noch die Startzeile; zwei gültige Zeilen, die jüngere gilt
    const v2alt = tuetenfotoVorgang({
      sorteId: SORTE,
      seite: 'vorne',
      pfad: pfad(SORTE, 4),
      clientId: id(404),
      ersetzt: aktuelleTuetenfotos(start, SORTE).vorne?.clientId,
    });
    const verspaetet = anwenden(nachErstem, v2alt, '2027-01-15T09:32:00.000Z', 4);
    expect(verspaetet.filter((z) => z.storniert_am === null).map((z) => z.client_id)).toEqual([
      id(402),
      id(404),
    ]);
    expect(aktuelleTuetenfotos(verspaetet, SORTE).vorne).toEqual({ pfad: pfad(SORTE, 4), clientId: id(404) });
  });

  it('TF1-AK2 TO2 Storno-Wiederholung: derselbe Vorgang zweimal über schreiben() ergibt ein Storno und eine neue Zeile', async () => {
    // Server im Speicher: Upsert ohne Überschreiben je client_id, Storno nur solange storniert_am leer ist
    const zeilen = new Map<string, Record<string, unknown>>([
      [
        id(301),
        { client_id: id(301), sorte_id: SORTE, seite: 'vorne', pfad: pfad(SORTE, 1), storniert_am: null },
      ],
    ]);
    const einfuegen = vi.fn(async (_t: string, z: Record<string, unknown>) => {
      const cid = String(z['client_id']);
      if (zeilen.has(cid)) return { data: [], error: null };
      const neu = { ...z, storniert_am: null, erfasst_am: '2027-01-15T09:30:01.000+00:00' };
      zeilen.set(cid, neu);
      return { data: [neu], error: null };
    });
    const lesen = vi.fn(async (_t: string, cid: string) => ({
      data: zeilen.has(cid) ? [zeilen.get(cid)] : [],
      error: null,
    }));
    const stornieren = vi.fn(async (_t: string, cid: string, felder: Record<string, unknown>) => {
      const z = zeilen.get(cid);
      if (!z || z['storniert_am'] !== null) return { data: [], error: null };
      Object.assign(z, felder);
      return { data: [z], error: null };
    });
    const adapter = { einfuegen, lesen, stornieren, setzen: vi.fn() } as unknown as Schreibadapter;
    const nachErfolg = vi.fn();
    const schreibe = erstelleSchreiben(adapter, { appVersion: '0.1.0+test', nachErfolg });

    const vorgang: Schritt[] = tuetenfotoVorgang({
      sorteId: SORTE,
      seite: 'vorne',
      pfad: pfad(SORTE, 2),
      clientId: id(402),
      ersetzt: id(301),
    });
    // #219: Neu vor Storno (Plan 207 A20)
    expect(await schreibe(vorgang, ZEIT)).toEqual({ status: 'gespeichert', clientIds: [id(402), id(301)] });
    expect(await schreibe(vorgang, ZEIT)).toEqual({ status: 'gespeichert', clientIds: [id(402), id(301)] });

    expect([...zeilen.keys()].sort()).toEqual([id(301), id(402)]);
    expect(zeilen.get(id(301))?.['storniert_am']).toBe(JETZT.toISOString());
    expect(zeilen.get(id(402))?.['storniert_am']).toBeNull();
    // A4: tuetenfoto hat weder storno_grund noch gilt_ab noch client_zeit
    for (const [, , felder] of stornieren.mock.calls) expect(felder).not.toHaveProperty('storno_grund');
    for (const [tabelle, z] of einfuegen.mock.calls) {
      expect(tabelle).toBe('tuetenfoto');
      expect(z).not.toHaveProperty('gilt_ab');
      expect(z).not.toHaveProperty('client_zeit');
      expect(z['app_version']).toBe('0.1.0+test');
    }
    expect(nachErfolg).toHaveBeenCalledTimes(2);
  });

  it('TF1-AK2 Bündel enthält tuetenfoto ohne stornierte Zeilen', () => {
    const teil = BUENDEL_TEILE.find((t) => t.name === 'tuetenfoto');
    expect(teil).toBeDefined();
    expect(teil?.ohneStorno).toBe(true);
    expect(teil?.gueltig).toBeUndefined();
    expect(teil?.fensterTage).toBeUndefined();
  });
});

// ---------------------------------------------------------------------
// TF1-AK3 erfassungBauen mit Fotos
// ---------------------------------------------------------------------

const KI_OK: KiErgebnis = {
  ergebnis: 'ok',
  modell: 'claude-haiku-5-5',
  felder: {
    name: 'Testsorte Gelb',
    art: 'Lactuca sativa L.',
    keimart: 'licht',
    keimtemperatur_min_c: 15,
    keimtemperatur_max_c: 20,
    keimdauer_min_d: 7,
    keimdauer_max_d: 14,
    kulturdauer_min_d: 50,
    kulturdauer_max_d: 70,
    aussaat_von_monat: null,
    aussaat_bis_monat: null,
    hersteller: 'Beispiel Saaten',
  },
  verworfen: [],
  dauerMs: 4200,
  ausweichmodell: false,
};

const FORMULAR = (): SortenFormular => ({
  ...leeresFormular(),
  tuete: { name: 'Testsorte Gelb', art: 'Lactuca sativa L.' },
  artId: 'lactuca_sativa',
  kulturtyp: 'blatt',
  kaufdatum: '2027-01-10',
  bestandKorn: '150',
});

function zaehler() {
  let n = 0;
  return () => id(700 + ++n);
}

const tuetenfotoZeilen = (vorgang: Vorgang) =>
  vorgang.filter((s): s is Extract<Schritt, { art: 'neu' }> => s.art === 'neu' && s.tabelle === 'tuetenfoto');

describe('TF1-AK3 erfassungBauen', () => {
  it('TF1-AK3 erfassungBauen hängt je Foto eine Zeile tuetenfoto mit Seite, Sorte und Packung an', () => {
    const fotos = [
      { seite: 'vorne' as const, pfad: pfad(SORTE, 1) },
      { seite: 'hinten' as const, pfad: pfad(SORTE, 2) },
    ];
    const r = erfassungBauen(
      FORMULAR(),
      { sorteId: SORTE, saatgutId: SAATGUT, clientIds: zaehler(), fotos },
      undefined,
      KONTEXT,
    );
    expect(r.vorgang.map((s) => s.tabelle)).toEqual(['saatgut', 'tuetenfoto', 'tuetenfoto']);
    const z = tuetenfotoZeilen(r.vorgang).map((s) => s.felder);
    expect(z).toEqual([
      {
        client_id: expect.any(String),
        sorte_id: SORTE,
        saatgut_id: SAATGUT,
        seite: 'vorne',
        pfad: pfad(SORTE, 1),
      },
      {
        client_id: expect.any(String),
        sorte_id: SORTE,
        saatgut_id: SAATGUT,
        seite: 'hinten',
        pfad: pfad(SORTE, 2),
      },
    ]);
    // je eigene client_id, verschieden von der Packung
    const ids = r.vorgang.map((s) => (s.art === 'neu' ? s.felder.client_id : ''));
    expect(new Set(ids).size).toBe(3);
    expect(vorgangPruefen(r.vorgang)).toEqual([]);
  });

  it('TF1-AK3 mit KI-Lauf: tuetenfoto nach saatgut und vor dem unveränderten Feldprotokoll', () => {
    const lauf = { ...KI_OK, fotopfade: [pfad(SORTE, 1), pfad(SORTE, 2)] } as KiLauf;
    const ohne = erfassungBauen(
      FORMULAR(),
      { sorteId: SORTE, saatgutId: SAATGUT, clientIds: zaehler() },
      lauf,
      KONTEXT,
    );
    const mit = erfassungBauen(
      FORMULAR(),
      {
        sorteId: SORTE,
        saatgutId: SAATGUT,
        clientIds: zaehler(),
        fotos: [
          { seite: 'vorne', pfad: pfad(SORTE, 1) },
          { seite: 'hinten', pfad: pfad(SORTE, 2) },
        ],
      },
      lauf,
      KONTEXT,
    );
    const tabellen = mit.vorgang.map((s) => s.tabelle);
    expect(tabellen.slice(0, 3)).toEqual(['saatgut', 'tuetenfoto', 'tuetenfoto']);
    expect(tabellen.slice(3).every((t) => t === 'ki_feldprotokoll')).toBe(true);
    const protokoll = (v: Vorgang) =>
      v
        .filter((s) => s.tabelle === 'ki_feldprotokoll')
        .map((s) => {
          const { client_id: _c, ...rest } = (s as Extract<Schritt, { art: 'neu' }>).felder;
          void _c;
          return rest;
        });
    expect(protokoll(mit.vorgang)).toEqual(protokoll(ohne.vorgang));
    expect(protokoll(mit.vorgang)).toHaveLength(8);
    expect(mit.wissen).toEqual(ohne.wissen);
  });

  it('TF1-AK3 Packung zu … schreibt tuetenfoto auf die bestehende Sorte', () => {
    // die Maske übergibt die bestehende Sorte; der Pfad liegt unter der beim Öffnen erzeugten sorte_id (A16)
    const r = erfassungBauen(
      FORMULAR(),
      {
        sorteId: ANDERE_SORTE,
        saatgutId: SAATGUT,
        clientIds: zaehler(),
        fotos: [{ seite: 'vorne', pfad: pfad(FREMDER_ORDNER, 1) }],
      },
      undefined,
      KONTEXT,
    );
    const z = tuetenfotoZeilen(r.vorgang);
    expect(z).toHaveLength(1);
    expect(z[0]?.felder).toMatchObject({
      sorte_id: ANDERE_SORTE,
      saatgut_id: SAATGUT,
      seite: 'vorne',
      pfad: pfad(FREMDER_ORDNER, 1),
    });
    const saatgut = r.vorgang[0];
    expect(saatgut?.tabelle).toBe('saatgut');
    expect(saatgut?.art === 'neu' ? saatgut.felder['sorte_id'] : undefined).toBe(ANDERE_SORTE);
  });

  it('TF1-AK3 ohne Foto keine Zeile tuetenfoto', () => {
    const ohne = erfassungBauen(
      FORMULAR(),
      { sorteId: SORTE, saatgutId: SAATGUT, clientIds: zaehler() },
      undefined,
      KONTEXT,
    );
    const leer = erfassungBauen(
      FORMULAR(),
      { sorteId: SORTE, saatgutId: SAATGUT, clientIds: zaehler(), fotos: [] },
      undefined,
      KONTEXT,
    );
    expect(ohne.vorgang.map((s) => s.tabelle)).toEqual(['saatgut']);
    expect(leer.vorgang.map((s) => s.tabelle)).toEqual(['saatgut']);
    expect(tuetenfotoZeilen(leer.vorgang)).toEqual([]);
  });
});

// ---------------------------------------------------------------------
// NB1-AK3 Ersetzen: zuerst die neue Zeile, dann das Storno (#219, Plan 219 «Ersetzen»; Plan 207 A20)
// ---------------------------------------------------------------------

describe('NB1-AK3 tuetenfotoVorgang neu vor Storno', () => {
  it('NB1-AK3 Ersetzen: zuerst neu, dann storno korrektur der alten Zeile', () => {
    const v = tuetenfotoVorgang({
      sorteId: SORTE,
      seite: 'vorne',
      pfad: pfad(SORTE, 8),
      clientId: id(408),
      ersetzt: id(301),
    });
    expect(v.map((s) => s.art)).toEqual(['neu', 'storno']);
    expect(v[0]).toEqual({
      art: 'neu',
      tabelle: 'tuetenfoto',
      felder: { client_id: id(408), sorte_id: SORTE, saatgut_id: null, seite: 'vorne', pfad: pfad(SORTE, 8) },
    });
    expect(v[1]).toEqual({ art: 'storno', tabelle: 'tuetenfoto', clientId: id(301), grund: 'korrektur' });
    expect(vorgangPruefen(v)).toEqual([]);
  });

  it('NB1-AK3 ohne ersetzt genau eine neue Zeile', () => {
    for (const ersetzt of [undefined, '']) {
      const v = tuetenfotoVorgang({
        sorteId: SORTE,
        seite: 'hinten',
        pfad: pfad(SORTE, 9),
        clientId: id(409),
        ersetzt,
      });
      expect(v).toHaveLength(1);
      expect(v[0]).toMatchObject({ art: 'neu', tabelle: 'tuetenfoto', felder: { client_id: id(409) } });
    }
  });

  it('NB1-AK3 Storno gescheitert: nur die neue Zeile angewandt, aktuelleTuetenfotos zeigt die neue', () => {
    const start = [
      zeile(1, 'vorne', '2027-01-10T08:00:00.000Z'),
      zeile(2, 'hinten', '2027-01-10T08:01:00.000Z'),
    ];
    const v = tuetenfotoVorgang({
      sorteId: SORTE,
      seite: 'vorne',
      pfad: pfad(SORTE, 7),
      clientId: id(407),
      ersetzt: aktuelleTuetenfotos(start, SORTE).vorne?.clientId,
    });
    // schreiben() bricht nach dem ersten Schritt ab: nur er erreicht die Datenbank
    const nurErster = anwenden(start, v.slice(0, 1), '2027-01-15T09:30:00.000Z', 7);
    expect(aktuelleTuetenfotos(nurErster, SORTE).vorne?.clientId).toBe(id(407));
    expect(aktuelleTuetenfotos(nurErster, SORTE)).toEqual({
      vorne: { pfad: pfad(SORTE, 7), clientId: id(407) },
      hinten: { pfad: pfad(SORTE, 2), clientId: id(302) },
    });
    // die alte Zeile bleibt gültig, gilt aber nicht mehr (jüngste Zeile je Seite, Plan 207 A6)
    expect(nurErster.filter((z) => z.storniert_am !== null)).toEqual([]);
    // «Speichern wiederholen» sendet denselben Vorgang: danach ist die alte Zeile storniert, die neue gilt weiter
    const wiederholt = anwenden(nurErster, v, '2027-01-15T09:31:00.000Z', 7);
    expect(wiederholt.filter((z) => z.storniert_am !== null).map((z) => z.client_id)).toEqual([id(301)]);
    expect(aktuelleTuetenfotos(wiederholt, SORTE).vorne?.clientId).toBe(id(407));
  });
});

// ---------------------------------------------------------------------
// NB1-AK7 Mikrosekunden bei gleicher Millisekunde (#219; Prüferbefund B8 aus Plan 207)
// ---------------------------------------------------------------------

describe('NB1-AK7 aktuelleTuetenfotos auf die Mikrosekunde', () => {
  it('NB1-AK7 gleiche Millisekunde: die grössere Mikrosekunde ist das aktuelle Foto, unabhängig von id und Reihenfolge', () => {
    // Date.parse schneidet nach der Millisekunde ab: .123456 und .123457 sind dieselbe Millisekunde
    const frueher = zeile(1, 'vorne', '2027-01-12T08:00:00.123456+00:00', { id: id(902) });
    const spaeter = zeile(2, 'vorne', '2027-01-12T08:00:00.123457+00:00', { id: id(901) });
    expect(Date.parse(frueher.erfasst_am)).toBe(Date.parse(spaeter.erfasst_am));
    // die kleinere id gewinnt, weil ihre Mikrosekunde grösser ist
    expect(aktuelleTuetenfotos([frueher, spaeter], SORTE).vorne?.clientId).toBe(id(302));
    expect(aktuelleTuetenfotos([spaeter, frueher], SORTE).vorne?.clientId).toBe(id(302));
    // umgekehrt: grössere Mikrosekunde mit grösserer id
    const a = zeile(3, 'hinten', '2027-01-12T08:00:00.999998+00:00', { id: id(903) });
    const b = zeile(4, 'hinten', '2027-01-12T08:00:00.999999+00:00', { id: id(904) });
    expect(aktuelleTuetenfotos([a, b], SORTE).hinten?.clientId).toBe(id(304));
    expect(aktuelleTuetenfotos([b, a], SORTE).hinten?.clientId).toBe(id(304));
    // weniger als sechs Stellen: .1234 ist .123400, also früher als .123401
    const kurz = zeile(5, 'vorne', '2027-01-13T08:00:00.1234+00:00', { id: id(999) });
    const lang = zeile(6, 'vorne', '2027-01-13T08:00:00.123401+00:00', { id: id(905) });
    expect(aktuelleTuetenfotos([kurz, lang], SORTE).vorne?.clientId).toBe(id(306));
    expect(aktuelleTuetenfotos([lang, kurz], SORTE).vorne?.clientId).toBe(id(306));
  });
});
