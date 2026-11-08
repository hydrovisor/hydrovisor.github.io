// Wechselblock: bis zu 3 Abhaklisten parallel (Plan 139 Testliste; WB-AK1 bis WB-AK3; Konzept R5.6, R5.3, R4.6, U7).
// Injizierte Uhr, Zeitzone Europe/Zurich, Kalendertag 12.1.2027. Hilfen in tests/fixtures/wechselblock.ts.
//
// Vertrag (Plan 139 «Signaturen»), src/domain/abhakliste/block.ts:
//   MAX_ABHAKLISTEN_JE_BLOCK = 3
//   gliedAusStand(stand, ort: { code; kennung }): BlockGlied | undefined   (undefined, wenn abgeschlossen)
//   wechselblock({ teile, aufgaben, lokal }, jetzt, zeitzone): Wechselblock[]   (je Anlage ein Block ab 2 Gliedern)
//   naechsterSchritt(glieder, jetzt): { art: 'schritt'; platzId; code; kennung; zeile; zeilenText? }
//                                    | { art: 'warten'; bis: string } | { art: 'fertig' }
//   blockText(glied, zeitzone): string
//
// Simulationsmodell WB-AK1/WB-AK2 (Plan 139 Testliste): je Gefäss standNeu() mit ZEILEN_SIM; ab 18:00 je Runde
// naechsterSchritt() über gliedAusStand() aller Stände; bei «schritt» Messzeile zuerst messungZuordnen(), dann
// abhaken() zur Uhrzeit t, danach t + 1 min; bei «warten» t = bis; bei «fertig» Ende.
import { describe, expect, it } from 'vitest';
import {
  blockText,
  gliedAusStand,
  MAX_ABHAKLISTEN_JE_BLOCK,
  naechsterSchritt,
  wechselblock,
  type BlockGlied,
  type NaechsterSchritt,
} from '../../src/domain/abhakliste/block.ts';
import {
  abhaken,
  aktiveZeile,
  messungZuordnen,
  timerEnde,
  type AblaufStand,
} from '../../src/domain/abhakliste/stand.ts';
import { MESSZEILEN } from '../../src/domain/abhakliste/zeilen.ts';
import { uhrzeit, ZEITZONE } from '../../src/domain/zeit.ts';
import { ansatzTeile, LAUFEND, laufenderWechsel } from '../fixtures/ansatz.ts';
import { ANLAGE_R, platzId, uid, vereinen, weitereAnlage } from '../fixtures/regal.ts';
import { aufgabe, mitAbbruch, neu, ort, standBis, takt, um } from '../fixtures/wechselblock.ts';

const hhmm = (d: Date | string) => uhrzeit(new Date(d), ZEITZONE);
const plus = (d: Date, min: number) => new Date(d.getTime() + min * 60_000);

interface Haken {
  kennung: string;
  zeile: number;
  am: string;
}

/** Simulation nach Plan 139: jeder Vorschlag wird ausgeführt */
function simuliere(kennungen: readonly string[], start: Date) {
  const staende = new Map<string, { kennung: string; s: AblaufStand }>(
    kennungen.map((k) => [platzId(k), { kennung: k, s: neu(k, start) }]),
  );
  const folge: Haken[] = [];
  const vorschlaege: NaechsterSchritt[] = [];
  let t = start;
  for (let runde = 0; runde < 500; runde += 1) {
    const glieder = [...staende.values()]
      .map(({ kennung, s }) => gliedAusStand(s, ort(kennung)))
      .filter((g): g is BlockGlied => g !== undefined);
    const n = naechsterSchritt(glieder, t);
    vorschlaege.push(n);
    if (n.art === 'fertig') break;
    if (n.art === 'warten') {
      const bis = new Date(n.bis);
      if (bis.getTime() <= t.getTime()) throw new Error(`warten ohne Fortschritt um ${hhmm(t)}`);
      t = bis;
      continue;
    }
    const e = staende.get(n.platzId);
    if (!e) throw new Error(`Vorschlag für unbekannten Platz ${n.platzId}`);
    let s = e.s;
    if (MESSZEILEN[n.zeile]) s = messungZuordnen(s, n.zeile, { id: uid('5d', runde + 1) });
    const nach = abhaken(s, n.zeile, t);
    if (aktiveZeile(nach) === aktiveZeile(s))
      throw new Error(`Vorschlag ${e.kennung}/${String(n.zeile)} um ${hhmm(t)} nicht abhakbar`);
    staende.set(n.platzId, { kennung: e.kennung, s: nach });
    folge.push({ kennung: e.kennung, zeile: n.zeile, am: hhmm(t) });
    t = plus(t, 1);
  }
  return { folge, vorschlaege, staende, ende: folge.at(-1)?.am };
}

function vollstaendig(staende: ReturnType<typeof simuliere>['staende']): void {
  for (const [pid, { kennung, s }] of staende) {
    expect(s.platzId, kennung).toBe(pid);
    expect(s.code, kennung).toBe(`R-${kennung}`);
    const erledigt = s.zeilen.filter((z) => z.erledigtAm !== undefined);
    expect(erledigt, kennung).toHaveLength(18);
    expect(
      erledigt.map((z) => z.nr),
      kennung,
    ).toEqual(Array.from({ length: 18 }, (_, i) => i));
    const zeiten = erledigt.map((z) => Date.parse(z.erledigtAm as string));
    expect(
      zeiten.every((x, i) => i === 0 || x > (zeiten[i - 1] as number)),
      `${kennung}: Haken aufsteigend`,
    ).toBe(true);
    expect(aktiveZeile(s), kennung).toBeUndefined();
  }
}

const kurz = (h: Haken) => `${h.kennung}/${String(h.zeile)}`;

describe('WB-AK1 Schrittfolge über die Gefässe', () => {
  it('WB-AK1 zwei Ansätze reihum, jede Abhakliste vollständig', () => {
    const r = simuliere(['1.1', '1.2'], um('18:00'));
    expect(r.folge.slice(0, 6).map(kurz)).toEqual(['1.1/0', '1.2/0', '1.1/1', '1.2/1', '1.1/2', '1.2/2']);
    // jede Zeile je Gefäss genau einmal, keine Zeile in einer fremden Liste
    expect(r.folge).toHaveLength(36);
    for (const k of ['1.1', '1.2'])
      expect(r.folge.filter((h) => h.kennung === k).map((h) => h.zeile)).toEqual(
        Array.from({ length: 18 }, (_, i) => i),
      );
    vollstaendig(r.staende);
    expect(r.vorschlaege.at(-1)).toEqual({ art: 'fertig' });
  });

  it('WB-AK1 drei Ansätze reihum, jede Abhakliste vollständig', () => {
    const r = simuliere(['1.1', '1.2', '2.1'], um('18:00'));
    expect(r.folge.slice(0, 7).map(kurz)).toEqual([
      '1.1/0',
      '1.2/0',
      '2.1/0',
      '1.1/1',
      '1.2/1',
      '2.1/1',
      '1.1/2',
    ]);
    expect(r.folge).toHaveLength(54);
    for (const k of ['1.1', '1.2', '2.1'])
      expect(r.folge.filter((h) => h.kennung === k).map((h) => h.zeile)).toEqual(
        Array.from({ length: 18 }, (_, i) => i),
      );
    vollstaendig(r.staende);
    expect(r.vorschlaege.at(-1)).toEqual({ art: 'fertig' });
  });

  it('WB-AK1 MAX_ABHAKLISTEN_JE_BLOCK ist 3', () => {
    expect(MAX_ABHAKLISTEN_JE_BLOCK).toBe(3);
  });
});

describe('WB-AK2 Überlappende Timer', () => {
  const am = (r: ReturnType<typeof simuliere>, kennung: string, zeile: number) =>
    r.folge.find((h) => h.kennung === kennung && h.zeile === zeile)?.am;

  it('WB-AK2 Timer der Gefässe überlappen', () => {
    const zwei = simuliere(['1.1', '1.2'], um('18:00'));
    expect(['1.1', '1.2'].map((k) => am(zwei, k, 10))).toEqual(['18:20', '18:21']);
    expect(['1.1', '1.2'].map((k) => am(zwei, k, 11))).toEqual(['18:35', '18:36']);
    expect(['1.1', '1.2'].map((k) => am(zwei, k, 12))).toEqual(['18:37', '18:38']);
    expect(['1.1', '1.2'].map((k) => am(zwei, k, 13))).toEqual(['18:52', '18:53']);
    expect(am(zwei, '1.2', 15)).toBe('18:57');
    expect(['1.1', '1.2'].map((k) => am(zwei, k, 16))).toEqual(['19:11', '19:12']);
    expect(am(zwei, '1.2', 17)).toBe('19:14');

    // Intervalle [Haken Zeile 10, Timerende 11] schneiden sich paarweise
    const intervall = (r: ReturnType<typeof simuliere>, k: string): [number, number] => {
      const s = r.staende.get(platzId(k))?.s as AblaufStand;
      const von = Date.parse(s.zeilen[10]?.erledigtAm as string);
      const bis = timerEnde(s, 11)?.getTime() as number;
      return [von, bis];
    };
    const [a, b] = [intervall(zwei, '1.1'), intervall(zwei, '1.2')];
    expect([hhmm(new Date(a[0])), hhmm(new Date(a[1]))]).toEqual(['18:20', '18:35']);
    expect([hhmm(new Date(b[0])), hhmm(new Date(b[1]))]).toEqual(['18:21', '18:36']);
    expect(a[0] < b[1] && b[0] < a[1]).toBe(true);

    const drei = simuliere(['1.1', '1.2', '2.1'], um('18:00'));
    expect(['1.1', '1.2', '2.1'].map((k) => am(drei, k, 10))).toEqual(['18:30', '18:31', '18:32']);
    const iv = ['1.1', '1.2', '2.1'].map((k) => intervall(drei, k));
    expect(iv.map(([, bis]) => hhmm(new Date(bis)))).toEqual(['18:45', '18:46', '18:47']);
    for (const x of iv) for (const y of iv) expect(x[0] < y[1] && y[0] < x[1]).toBe(true);
  });

  it('WB-AK2 alle Timer laufen → warten bis frühestes Ende', () => {
    const s11 = standBis('1.1', takt(um('18:00'), 11, 2));
    const s12 = standBis('1.2', takt(um('18:01'), 11, 2));
    const glieder = [gliedAusStand(s11, ort('1.1')), gliedAusStand(s12, ort('1.2'))] as BlockGlied[];
    expect(glieder.map((g) => [g.zeile, g.timerEnde && hhmm(g.timerEnde)])).toEqual([
      [11, '18:35'],
      [11, '18:36'],
    ]);
    const n = naechsterSchritt(glieder, um('18:22'));
    expect(n.art).toBe('warten');
    expect(n.art === 'warten' && Date.parse(n.bis)).toBe(um('18:35').getTime());
    expect(naechsterSchritt(glieder, um('18:35'))).toMatchObject({
      art: 'schritt',
      platzId: platzId('1.1'),
      code: 'R-1.1',
      kennung: '1.1',
      zeile: 11,
    });
    // läuft ein Timer und ist ein anderes Gefäss bereit, kommt dessen Schritt
    const s12bereit = standBis('1.2', takt(um('18:01'), 10, 2));
    expect(
      naechsterSchritt(
        [glieder[0] as BlockGlied, gliedAusStand(s12bereit, ort('1.2')) as BlockGlied],
        um('18:22'),
      ),
    ).toMatchObject({ art: 'schritt', kennung: '1.2', zeile: 10 });
  });

  it('WB-AK2 abgelaufener Timer zuerst', () => {
    // 1.1 bis Zeile 12 (12 um 18:37), Timer 13 bis 18:52; 1.2 später begonnen, auf Zeile 2
    const zeiten11 = [...takt(um('18:00'), 11, 2), um('18:35'), um('18:37')];
    const s11 = standBis('1.1', zeiten11);
    const s12 = standBis('1.2', [um('18:40'), um('18:41')]);
    const g11 = gliedAusStand(s11, ort('1.1')) as BlockGlied;
    const g12 = gliedAusStand(s12, ort('1.2')) as BlockGlied;
    expect(g11).toMatchObject({ zeile: 13, quelle: 'lokal' });
    expect(Date.parse(g11.timerEnde as string)).toBe(um('18:52').getTime());
    expect(g12).toMatchObject({ zeile: 2, quelle: 'lokal' });
    expect(g12.timerEnde).toBeUndefined();
    // vor Ablauf: 1.2 ist bereit
    expect(naechsterSchritt([g11, g12], um('18:51'))).toMatchObject({
      art: 'schritt',
      kennung: '1.2',
      zeile: 2,
    });
    // Regel (a) vor (b): abgelaufener Timer vor kleinerer Zeile, auch in vertauschter Reihenfolge
    expect(naechsterSchritt([g11, g12], um('18:53'))).toMatchObject({
      art: 'schritt',
      kennung: '1.1',
      zeile: 13,
    });
    expect(naechsterSchritt([g12, g11], um('18:53'))).toMatchObject({
      art: 'schritt',
      kennung: '1.1',
      zeile: 13,
    });

    // Messzeile 14 ohne Messung ist bereit (Schritt «messen»), auch wenn im anderen Gefäss ein Timer läuft
    const s11m = standBis('1.1', [...zeiten11, um('18:52')]);
    const s12t = standBis('1.2', takt(um('18:38'), 13, 1)); // Zeile 12 um 18:50, Timer 13 bis 19:05
    const g11m = gliedAusStand(s11m, ort('1.1')) as BlockGlied;
    expect(g11m).toMatchObject({ zeile: 14 });
    expect(g11m.timerEnde).toBeUndefined();
    expect(
      naechsterSchritt([g11m, gliedAusStand(s12t, ort('1.2')) as BlockGlied], um('18:55')),
    ).toMatchObject({
      art: 'schritt',
      kennung: '1.1',
      zeile: 14,
    });
  });

  it('WB-AK2 Block kürzer als nacheinander', () => {
    const block = simuliere(['1.1', '1.2'], um('18:00'));
    expect(block.ende).toBe('19:14');
    const erst = simuliere(['1.1'], um('18:00'));
    expect(erst.ende).toBe('18:59');
    const dann = simuliere(['1.2'], um('19:00'));
    expect(dann.ende).toBe('19:59');
    expect((block.ende as string) < (dann.ende as string)).toBe(true);
  });
});

describe('WB-AK3 Glieder des Blocks', () => {
  const jetzt = um('18:50');
  const codes = (b: { glieder: readonly BlockGlied[] } | undefined) => b?.glieder.map((g) => g.code);

  it('WB-AK3 laufende und fällige Ansätze bilden den Block', () => {
    const teile = ansatzTeile();
    const lokal = [standBis('1.1', takt(um('18:00'), 5, 2))];
    const wechsel21 = aufgabe({
      kennung: '2.1',
      faelligAm: '2027-01-11',
      anzeigeAb: '2027-01-11',
      tageUeberfaellig: 1,
    });
    const ansatz12 = aufgabe({ kennung: '1.2', typ: 'ansatz' });
    const bloecke = wechselblock({ teile, aufgaben: [wechsel21, ansatz12], lokal }, jetzt, ZEITZONE);
    expect(bloecke).toHaveLength(1);
    const [b] = bloecke;
    expect(b?.anlageId).toBe(ANLAGE_R);
    expect(b?.tag).toBe('2027-01-12');
    expect(codes(b)).toEqual(['R-1.1', 'R-1.2', 'R-2.1']);
    expect(b?.glieder.map((g: BlockGlied) => [g.kennung, g.quelle, g.zeile])).toEqual([
      ['1.1', 'lokal', 5],
      ['1.2', 'aufgabe', 0],
      ['2.1', 'aufgabe', 0],
    ]);
    expect(b?.glieder.map((g: BlockGlied) => g.platzId)).toEqual([
      platzId('1.1'),
      platzId('1.2'),
      platzId('2.1'),
    ]);
    expect(b?.glieder[1]?.aufgabe).toBe(ansatz12.schluessel);
    expect(b?.glieder[2]?.aufgabe).toBe(wechsel21.schluessel);
    expect(b?.wartend).toEqual([]);
    expect(b?.naechster).toMatchObject({ art: 'schritt', kennung: '1.2', zeile: 0 });
  });

  it('WB-AK3 TZ Aufgabe mit anzeigeAb morgen ist kein Glied, ab Mitternacht Zürich schon', () => {
    const teile = ansatzTeile();
    const lokal = [standBis('1.1', takt(um('18:00'), 5, 2))];
    const morgen = aufgabe({ kennung: '2.2', faelligAm: '2027-01-13' });
    // 23:30 Zürich (22:30 UTC) am 12.1.: 2.2 erst morgen → nur 1 Glied, kein Block
    expect(wechselblock({ teile, aufgaben: [morgen], lokal }, um('23:30'), ZEITZONE)).toEqual([]);
    // 00:30 Zürich am 13.1. (23:30 UTC am 12.1.): Kalendertag 13.1. → Block mit 1.1 und 2.2
    const nach = wechselblock(
      { teile, aufgaben: [morgen], lokal },
      new Date('2027-01-12T23:30:00.000Z'),
      ZEITZONE,
    );
    expect(nach).toHaveLength(1);
    expect(nach[0]?.tag).toBe('2027-01-13');
    expect(codes(nach[0])).toEqual(['R-1.1', 'R-2.2']);
  });

  it('WB-AK3 Gerätewechsel: Glied aus dem Bündel', () => {
    const wechsel11 = aufgabe({ kennung: '1.1' });
    // Zeile 10 erledigt (18:47), aktive Zeile 11 mit Timer bis 19:02
    const zehn = wechselblock(
      { teile: laufenderWechsel(ansatzTeile(), 10), aufgaben: [wechsel11], lokal: [] },
      jetzt,
      ZEITZONE,
    );
    expect(codes(zehn[0])).toEqual(['R-1.1', 'R-2.3']);
    const g23 = zehn[0]?.glieder[1];
    expect(g23).toMatchObject({ platzId: platzId('2.3'), kennung: '2.3', zeile: 11, quelle: 'buendel' });
    expect(Date.parse(g23?.timerEnde as string)).toBe(um('19:02').getTime());
    expect(zehn[0]?.naechster).toMatchObject({ art: 'schritt', kennung: '1.1', zeile: 0 });
    // um 19:03 ist der Timer abgelaufen: 2.3 zuerst (Regel a)
    const spaeter = wechselblock(
      { teile: laufenderWechsel(ansatzTeile(), 10), aufgaben: [wechsel11], lokal: [] },
      um('19:03'),
      ZEITZONE,
    );
    expect(spaeter[0]?.naechster).toMatchObject({ art: 'schritt', kennung: '2.3', zeile: 11 });

    // Zeile 11 erledigt: aktive Zeile 12 ist keine Timerzeile → kein timerEnde, obwohl timer_ende gesetzt ist
    const elf = wechselblock(
      { teile: laufenderWechsel(ansatzTeile(), 11), aufgaben: [wechsel11], lokal: [] },
      um('19:03'),
      ZEITZONE,
    );
    const g23elf = elf[0]?.glieder.find((g: BlockGlied) => g.kennung === '2.3');
    expect(g23elf).toMatchObject({ zeile: 12, quelle: 'buendel' });
    expect(g23elf?.timerEnde).toBeUndefined();

    // mit lokalem Stand für 2.3 gilt der lokale (Zeile 5), je Platz ein Glied
    const lokal23 = { ...standBis('2.3', takt(um('18:30'), 5, 1)), ansatzId: LAUFEND };
    const mitLokal = wechselblock(
      { teile: laufenderWechsel(ansatzTeile(), 10), aufgaben: [wechsel11], lokal: [lokal23] },
      jetzt,
      ZEITZONE,
    );
    expect(codes(mitLokal[0])).toEqual(['R-1.1', 'R-2.3']);
    expect(mitLokal[0]?.glieder[1]).toMatchObject({ zeile: 5, quelle: 'lokal' });
  });

  it('WB-AK3 je Platz einmal: laufender Stand und Aufgabe am selben Gefäss', () => {
    const lokal = [standBis('1.1', takt(um('18:00'), 5, 2))];
    const bloecke = wechselblock(
      {
        teile: ansatzTeile(),
        aufgaben: [aufgabe({ kennung: '1.1' }), aufgabe({ kennung: '2.1' })],
        lokal,
      },
      jetzt,
      ZEITZONE,
    );
    expect(codes(bloecke[0])).toEqual(['R-1.1', 'R-2.1']);
    expect(bloecke[0]?.glieder[0]).toMatchObject({ quelle: 'lokal', zeile: 5 });
  });

  it('WB-AK3 höchstens drei, vierter wartet', () => {
    const teile = laufenderWechsel(ansatzTeile(), 10);
    const lokal11 = standBis('1.1', takt(um('18:00'), 5, 2));
    const a21 = aufgabe({ kennung: '2.1' });
    const a22 = aufgabe({ kennung: '2.2' });
    const b = wechselblock({ teile, aufgaben: [a21, a22], lokal: [lokal11] }, jetzt, ZEITZONE);
    expect(b).toHaveLength(1);
    // beide laufenden (1.1 lokal, 2.3 Bündel), dann die erste Aufgabe; nach Code sortiert
    expect(codes(b[0])).toEqual(['R-1.1', 'R-2.1', 'R-2.3']);
    expect(b[0]?.glieder).toHaveLength(MAX_ABHAKLISTEN_JE_BLOCK);
    expect(b[0]?.wartend).toEqual([a22.schluessel]);

    // 1.1 abgeschlossen: 2.2 rückt nach
    const fertig11 = standBis('1.1', takt(um('18:00'), 18, 1));
    const danach = wechselblock({ teile, aufgaben: [a21, a22], lokal: [fertig11] }, jetzt, ZEITZONE);
    expect(codes(danach[0])).toEqual(['R-2.1', 'R-2.2', 'R-2.3']);
    expect(danach[0]?.wartend).toEqual([]);
  });

  it('WB-AK3 ein Glied → kein Block', () => {
    const teile = ansatzTeile();
    expect(
      wechselblock({ teile, aufgaben: [aufgabe({ kennung: '1.1' })], lokal: [] }, jetzt, ZEITZONE),
    ).toEqual([]);
    expect(wechselblock({ teile, aufgaben: [], lokal: [] }, jetzt, ZEITZONE)).toEqual([]);
    // station_echte_blaetter führt nicht in die Maske Ansatz (A3)
    const station = aufgabe({ kennung: '2.1', typ: 'station_echte_blaetter' });
    expect(
      wechselblock({ teile, aufgaben: [aufgabe({ kennung: '1.1' }), station], lokal: [] }, jetzt, ZEITZONE),
    ).toEqual([]);
  });

  it('WB-AK3 je Anlage getrennt', () => {
    const x = weitereAnlage('X', 'demo');
    const anlageX = (x['anlage']?.[0]?.['id'] ?? '') as string;
    const platzX = (x['platz']?.[0]?.['id'] ?? '') as string;
    const teile = vereinen(ansatzTeile(), x);
    const inX = aufgabe({ kennung: '2.3', anlageId: anlageX, platzId: platzX, kuerzel: 'X' });
    expect(
      wechselblock({ teile, aufgaben: [aufgabe({ kennung: '1.1' }), inX], lokal: [] }, jetzt, ZEITZONE),
    ).toEqual([]);
    const zwei = wechselblock(
      { teile, aufgaben: [aufgabe({ kennung: '1.1' }), inX, aufgabe({ kennung: '2.1' })], lokal: [] },
      jetzt,
      ZEITZONE,
    );
    expect(zwei).toHaveLength(1);
    expect(zwei[0]?.anlageId).toBe(ANLAGE_R);
    expect(codes(zwei[0])).toEqual(['R-1.1', 'R-2.1']);
  });

  it('WB-AK3 abgeschlossen und alt zählen nicht', () => {
    // abgeschlossene lokale Abhakliste: kein Glied
    const fertig = standBis('1.1', takt(um('18:00'), 18, 1));
    expect(gliedAusStand(fertig, ort('1.1'))).toBeUndefined();
    // abgebrochener Wechsel im Bündel (2.3), lokaler Stand 2.1 mit letzter Aktion vor 25 h
    const teile = mitAbbruch(laufenderWechsel(ansatzTeile(), 10), 11);
    const alt = standBis('2.1', takt(new Date(um('18:50').getTime() - 25 * 3_600_000), 3, 1));
    const b = wechselblock(
      {
        teile,
        aufgaben: [aufgabe({ kennung: '1.2' }), aufgabe({ kennung: '2.2' })],
        lokal: [fertig, alt],
      },
      jetzt,
      ZEITZONE,
    );
    expect(b).toHaveLength(1);
    expect(codes(b[0])).toEqual(['R-1.2', 'R-2.2']);
    // nur die beiden Aufgaben übrig: mit einer einzigen kein Block
    expect(
      wechselblock({ teile, aufgaben: [aufgabe({ kennung: '1.2' })], lokal: [fertig, alt] }, jetzt, ZEITZONE),
    ).toEqual([]);
  });

  it('WB-AK3 deterministisch', () => {
    const teile = laufenderWechsel(ansatzTeile(), 10);
    const a = [aufgabe({ kennung: '2.1' }), aufgabe({ kennung: '1.1', typ: 'ansatz' })];
    const eins = wechselblock({ teile, aufgaben: a, lokal: [] }, jetzt, ZEITZONE);
    const zwei = wechselblock({ teile, aufgaben: [...a].reverse(), lokal: [] }, jetzt, ZEITZONE);
    const drei = wechselblock({ teile: structuredClone(teile), aufgaben: a, lokal: [] }, jetzt, ZEITZONE);
    expect(eins).toHaveLength(1);
    expect(zwei).toEqual(eins);
    expect(drei).toEqual(eins);
    expect(codes(eins[0])).toEqual(['R-1.1', 'R-2.1', 'R-2.3']);
    expect(eins[0]?.naechster).toMatchObject({ art: 'schritt', kennung: '1.1', zeile: 0 });
    // die Eingabe bleibt unverändert
    expect(a.map((x) => x.ort?.kennung)).toEqual(['2.1', '1.1']);
  });
});

describe('WB-AK4 Texte des Blocks', () => {
  it('WB-AK4 blockText je Glied', () => {
    const g = (x: Partial<BlockGlied> & { kennung: string }): BlockGlied => ({
      platzId: platzId(x.kennung),
      code: `R-${x.kennung}`,
      zeile: 0,
      quelle: 'lokal',
      ...x,
    });
    expect(blockText(g({ kennung: '1.2', zeile: 1, zeilenText: 'absaugen' }), ZEITZONE)).toBe(
      '1.2 · Zeile 1 absaugen',
    );
    expect(
      blockText(
        g({ kennung: '2.3', zeile: 11, timerEnde: um('19:02').toISOString(), quelle: 'buendel' }),
        ZEITZONE,
      ),
    ).toBe('2.3 · Zeile 11 · weiter ab 19:02');
    expect(
      blockText(g({ kennung: '2.1', quelle: 'aufgabe', aufgabe: 'loesung_wechseln|x|2027-01-12' }), ZEITZONE),
    ).toBe('2.1 · noch nicht begonnen');
  });
});
