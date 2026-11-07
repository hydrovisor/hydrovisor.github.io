// Umsetzen einfach (Plan 33 Testliste; UC5-AK3, UC5-AK4, UC5-AK7, R6.1, R6.2, R5.2, R8.3). Injizierte Uhr
// 2027-01-19T08:00:00Z (Zürich 19.1. 09:00), Zeitzone Europe/Zurich; Teile aus tests/fixtures/umsetzen.ts, Sichten
// nachgerechnet mit umsetzSichtenNachrechnen() aus tests/fixtures/sichten.ts.
//
// Vertrag (Plan 33 «Signaturen und Datenfluss», vom Testentwickler präzisiert, wo der Plan offen ist):
//   src/domain/anzucht/umsetzen.ts
//     umsetzAnsicht(teile, satzId, jetzt, zeitzone): UmsetzAnsicht | undefined (unbekannter Satz → undefined)
//       { satzId; sorte; kulturform; saatdatum; tagSeitSaat; kopf «Lollo Rossa · Kopf · gesät 7.1. · Tag 12»;
//         saemlinge: { pflanzungId; nr; ort: { platzId; kennung; lochNr? }; groesse: 50 | 80;
//                      zieltopf?: { netztopfId; kennung; gefaessKennung; lochNr; frei;
//                                   belegtDurch?: { sorte; pflanzungIds } } }[];
//         ohneKeimpruefung: Zahl der aktiven Schwämme ohne Keimprüfung;
//         inStationLassenBis?: Saat + «Umsetzen bis», nur wenn nach heute; hinweise: string[] }
//       Sämling (A2): aktive Pflanzung ohne umsetzen, auf einer Station oder mit letzter Keimung > 0 (dann ort = Box).
//     wieGeplant(ansicht): UmsetzEingabe mit jedem Sämling, dessen Zieltopf frei ist, in der Folge der Sämlinge.
//     UmsetzEingabe = { satzId; zuweisung: { pflanzungId; netztopfId }[]; abernten: netztopfId[];
//                       inStationLassen: { pflanzungId; bis }[]; ueberzaehlig: pflanzungId[] }
//     umsetzZiele(teile, zielPlatzId, gewaehlt: Map<netztopfId, number>): DeckelLoch[]; nicht wählbar trägt
//       nichtWaehlbar: true (wählbar = frei, nicht reserviert, 80 mm, Gefäss ohne feste Dosis, Heimtopf nicht abwesend).
//     alleFreienWaehlen(ziele, anzahl): netztopfId[] der ersten `anzahl` wählbaren Löcher in Lochfolge.
//     umsetzEingabePruefen(teile, eingabe, jetzt, zeitzone): Verstoss[] (leer = gültig): doppelter Topf, Pflanzung eines
//       anderen Satzes, Nicht-Sämling, Topf nicht wählbar (Grösse, belegt ohne abernten), In der Station lassen ausserhalb
//       morgen bis Saat + «Umsetzen bis».
//     umsetzVorgang(teile, eingabe, ids, jetzt, zeitzone): Vorgang; je Schritt tabelle ereignis, id = client_id aus ids(),
//       gilt_ab = jetzt; Reihenfolge ernte {art: ab}, umsetzdatum_geaendert, umsetzen, abschluss {grund: ueberzaehlig};
//       umsetzen mit pflanzung_id, netztopf_id, daten { von_platz_id, von_loch_nr, nach_platz_id, nach_loch_nr };
//       ungültig → [].
//     umsetzZusammenfassung(teile, eingabe, jetzt, zeitzone): { zeilen («4.4.1 → 2.3.1»); hinweise; rest?; stationLeer?;
//       ansatz? } mit den wörtlichen Texten unten.
//     umsetzAufgaben(teile, jetzt, zeitzone): { satzId; text; ort; faelligAm; ueberfaellig; wieGeplant }[] mit
//       faelligAm ≤ heute; text beginnt mit «Umsetzen · <Sorte> · <Station> → <Zielgefäss>», überfällig mit
//       «Umsetzen überfällig».
//   src/domain/pflanzung/topf.ts: topfPasst(teile, netztopfId, zielPlatzId): boolean
//   src/domain/pflanzung/verschieben.ts: verschiebenPruefen(…) mit Verstoss.feld = Grund-Code (groesse, station, …)
//   Rückgängig: saatRueckgaengig(vorgang) aus src/domain/pflanzung/saeen.ts (umgekehrte Reihenfolge, rueckgaengig).
import { describe, expect, it } from 'vitest';
import {
  alleFreienWaehlen,
  umsetzAnsicht,
  umsetzAufgaben,
  umsetzEingabePruefen,
  umsetzVorgang,
  umsetzZiele,
  umsetzZusammenfassung,
  wieGeplant,
  type UmsetzEingabe,
} from '../../src/domain/anzucht/umsetzen.ts';
import { vorgangPruefen, type Schritt, type Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import { saatRueckgaengig } from '../../src/domain/pflanzung/saeen.ts';
import { topfPasst } from '../../src/domain/pflanzung/topf.ts';
import { verschiebenPruefen } from '../../src/domain/pflanzung/verschieben.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { pflanzungId, satzAnlegen } from '../fixtures/keimung.ts';
import { netztopfId, platzId, uid, type Teile } from '../fixtures/regal.ts';
import { SORTE } from '../fixtures/saeen.ts';
import { umsetzSichtenNachrechnen, umsetzVorgangAnwenden } from '../fixtures/sichten.ts';
import {
  EICHBLATT_23,
  ereignis,
  L,
  LOLLO_ALT,
  R,
  SATZ,
  TOMATE,
  UMSETZ_JETZT,
  umsetzTeile,
} from '../fixtures/umsetzen.ts';

const J = UMSETZ_JETZT;
const Z = ZEITZONE;

function neueIds(): () => string {
  let n = 0;
  return () => {
    n += 1;
    return uid('5c', n);
  };
}

type Neu = Extract<Schritt, { art: 'neu' }>;
const neue = (v: Vorgang, typ?: string) =>
  v
    .filter((s): s is Neu => s.art === 'neu')
    .map((s) => s.felder)
    .filter((f) => typ === undefined || f['typ'] === typ);
const daten = (f: Record<string, unknown> | undefined) => (f?.['daten'] ?? {}) as Record<string, unknown>;
const zustand = (t: Teile, p: string) =>
  (t['v_pflanzung_zustand'] ?? []).find((z) => z['pflanzung_id'] === p);
const aktiveRes = (t: Teile, pflanzungen: readonly string[]) =>
  (t['v_reservierung_aktiv'] ?? []).filter((r) => pflanzungen.includes(String(r['pflanzung_id'])));
const ansicht = (t: Teile, satz: string = SATZ.lollo, jetzt = J) => umsetzAnsicht(t, satz, jetzt, Z);
const eingabe = (e: Partial<UmsetzEingabe> = {}): UmsetzEingabe => ({
  satzId: SATZ.lollo,
  zuweisung: [],
  abernten: [],
  inStationLassen: [],
  ueberzaehlig: [],
  ...e,
});
const geplant = (t: Teile, satz: string = SATZ.lollo, jetzt = J): UmsetzEingabe => {
  const a = ansicht(t, satz, jetzt);
  if (!a) throw new Error('Ansicht fehlt');
  return wieGeplant(a);
};
const vorgang = (t: Teile, e: UmsetzEingabe, jetzt = J) => umsetzVorgang(t, e, neueIds(), jetzt, Z);
const waehlbar = (ziele: readonly { lochNr: number; nichtWaehlbar?: boolean }[]) =>
  ziele.filter((l) => !l.nichtWaehlbar).map((l) => l.lochNr);
const LOLLO_1_5 = L.slice(1, 6);

describe('UC5-AK3 Wie geplant umsetzen (R6.2)', () => {
  it('UC5-AK3 wieGeplant() weist jedem Sämling mit freiem Zieltopf seinen Zieltopf zu', () => {
    const t = umsetzTeile();
    const a = ansicht(t);
    expect(a).toBeDefined();
    expect(a).toMatchObject({
      satzId: SATZ.lollo,
      sorte: 'Lollo Rossa',
      saatdatum: '2027-01-07',
      tagSeitSaat: 12,
      kopf: 'Lollo Rossa · Kopf · gesät 7.1. · Tag 12',
      ohneKeimpruefung: 0,
    });
    // 6 Sämlinge auf 4.4 Loch 1 bis 6, 5 mit Zieltopf 2.3.1 bis 2.3.5, die Reserve ohne
    expect(new Set(a?.saemlinge.map((s) => s.pflanzungId))).toEqual(new Set(L.slice(1, 7)));
    for (const s of a?.saemlinge ?? []) {
      const k = L.indexOf(s.pflanzungId);
      expect(s.ort, `Sämling ${k}`).toMatchObject({ platzId: platzId('4.4'), kennung: '4.4', lochNr: k });
      expect(s.groesse).toBe(50);
      if (k <= 5)
        expect(s.zieltopf, `Sämling ${k}`).toMatchObject({
          netztopfId: netztopfId(`2.3.${k}`),
          kennung: `2.3.${k}`,
          gefaessKennung: '2.3',
          lochNr: k,
          frei: true,
        });
      else expect(s.zieltopf).toBeUndefined();
    }
    const e = wieGeplant(a as NonNullable<typeof a>);
    expect(e).toMatchObject({ satzId: SATZ.lollo, abernten: [], inStationLassen: [], ueberzaehlig: [] });
    expect([...e.zuweisung].sort((x, y) => x.pflanzungId.localeCompare(y.pflanzungId))).toEqual(
      LOLLO_1_5.map((p, i) => ({ pflanzungId: p, netztopfId: netztopfId(`2.3.${i + 1}`) })),
    );
    // unbekannter Satz
    expect(umsetzAnsicht(t, uid('27', 99), J, Z)).toBeUndefined();
  });

  it('UC5-AK3 umsetzVorgang schreibt je Sämling ein Ereignis umsetzen mit pflanzung_id, netztopf_id, von und nach; kein aussaat, keine phase_antwort, kein Storno', () => {
    const t = umsetzTeile();
    const v = vorgang(t, geplant(t));
    expect(v).toHaveLength(5);
    expect(v.every((s) => s.art === 'neu' && s.tabelle === 'ereignis')).toBe(true);
    expect(vorgangPruefen(v)).toEqual([]);
    const umsetzen = neue(v, 'umsetzen');
    expect(umsetzen).toHaveLength(5);
    for (let k = 1; k <= 5; k += 1) {
      const z = umsetzen.find((f) => f['pflanzung_id'] === L[k]);
      expect(z, `Sämling ${k}`).toMatchObject({
        typ: 'umsetzen',
        pflanzung_id: L[k],
        netztopf_id: netztopfId(`2.3.${k}`),
        gilt_ab: J.toISOString(),
      });
      expect(z?.['id']).toBe(z?.['client_id']);
      expect(daten(z)).toEqual({
        von_platz_id: platzId('4.4'),
        von_loch_nr: k,
        nach_platz_id: platzId('2.3'),
        nach_loch_nr: k,
      });
    }
    expect(new Set(umsetzen.map((f) => f['client_id'])).size).toBe(5);
    expect(neue(v).filter((f) => ['aussaat', 'phase_antwort'].includes(String(f['typ'])))).toEqual([]);
    expect(v.filter((s) => s.art === 'storno')).toEqual([]);

    // nachgerechnet: Ort und Topf neu, Phase und Saatdatum unverändert, Reservierungen beendet
    const nach = umsetzVorgangAnwenden(t, v, J);
    for (let k = 1; k <= 5; k += 1)
      expect(zustand(nach, L[k] as string), `Sämling ${k}`).toMatchObject({
        phase: 'anzucht',
        status: 'aktiv',
        platz_id: platzId('2.3'),
        loch_nr: k,
        netztopf_id: netztopfId(`2.3.${k}`),
      });
    expect((nach['satz'] ?? []).find((s) => s['id'] === SATZ.lollo)?.['saatdatum']).toBe('2027-01-07');
    expect(aktiveRes(nach, LOLLO_1_5)).toEqual([]);
  });

  it('UC5-AK3 8-cm-Zieltopf auf der Station: von = 4.2 Loch 1, nach = Heimplatz 2.1 Loch 2', () => {
    const t = umsetzTeile();
    const a = ansicht(t, SATZ.tomate);
    expect(a?.saemlinge).toHaveLength(1);
    expect(a?.saemlinge[0]).toMatchObject({
      pflanzungId: TOMATE,
      groesse: 80,
      ort: { platzId: platzId('4.2'), kennung: '4.2', lochNr: 1 },
      zieltopf: {
        netztopfId: netztopfId('2.1.2'),
        kennung: '2.1.2',
        gefaessKennung: '2.1',
        lochNr: 2,
        frei: true,
      },
    });
    const v = vorgang(t, geplant(t, SATZ.tomate));
    const [u] = neue(v, 'umsetzen');
    expect(neue(v)).toHaveLength(1);
    expect(u).toMatchObject({ pflanzung_id: TOMATE, netztopf_id: netztopfId('2.1.2') });
    expect(daten(u)).toEqual({
      von_platz_id: platzId('4.2'),
      von_loch_nr: 1,
      nach_platz_id: platzId('2.1'),
      nach_loch_nr: 2,
    });
    const nach = umsetzVorgangAnwenden(t, v, J);
    expect(
      (nach['v_netztopf_platz'] ?? []).find((n) => n['netztopf_id'] === netztopfId('2.1.2')),
    ).toMatchObject({
      platz_id: platzId('2.1'),
      loch_nr: 2,
      ausser_heim: false,
    });
  });

  it('UC5-AK3 5-cm-Sämling: nach = aktueller Platz des Zieltopfs aus v_netztopf_platz', () => {
    // die leeren Töpfe 2.3.3 und 2.3.6 wurden vertauscht: 2.3.3 steht in Loch 6
    const t = umsetzTeile();
    for (const [topf, von, nach] of [
      ['2.3.3', 3, 6],
      ['2.3.6', 6, 3],
    ] as const)
      ereignis(t, {
        typ: 'verschieben',
        netztopfId: netztopfId(topf),
        giltAb: '2027-01-18T08:00:00.000Z',
        daten: {
          von_platz_id: platzId('2.3'),
          von_loch_nr: von,
          nach_platz_id: platzId('2.3'),
          nach_loch_nr: nach,
        },
      });
    umsetzSichtenNachrechnen(t);
    const a = ansicht(t);
    expect(a?.saemlinge.find((s) => s.pflanzungId === L[3])?.zieltopf).toMatchObject({
      kennung: '2.3.3',
      lochNr: 6,
      frei: true,
    });
    const u = neue(vorgang(t, geplant(t)), 'umsetzen').find((f) => f['pflanzung_id'] === L[3]);
    expect(u?.['netztopf_id']).toBe(netztopfId('2.3.3'));
    expect(daten(u)).toMatchObject({ nach_platz_id: platzId('2.3'), nach_loch_nr: 6 });
  });

  it('UC5-AK3 Zieltopf belegt: frei false mit Sorte des Vorgängers; nicht in wieGeplant()', () => {
    // 2.3.1 steht mit Eichblatt, 2.3.4 mit Lollo Rossa (umgesetzt 9.1.)
    const t = umsetzTeile({ bestand23: true });
    const a = ansicht(t);
    const s = (k: number) => a?.saemlinge.find((x) => x.pflanzungId === L[k])?.zieltopf;
    expect(s(1)).toMatchObject({
      kennung: '2.3.1',
      frei: false,
      belegtDurch: { sorte: 'Eichblatt', pflanzungIds: [EICHBLATT_23] },
    });
    expect(s(4)).toMatchObject({
      kennung: '2.3.4',
      frei: false,
      belegtDurch: { sorte: 'Lollo Rossa', pflanzungIds: [LOLLO_ALT] },
    });
    expect(s(2)).toMatchObject({ frei: true });
    expect(s(2)?.belegtDurch).toBeUndefined();
    const e = wieGeplant(a as NonNullable<typeof a>);
    expect(e.zuweisung.map((z) => z.pflanzungId).sort()).toEqual([L[2], L[3], L[5]].sort());
    // in einen belegten Topf nur mit «Jetzt abernten»
    const belegt = eingabe({ zuweisung: [{ pflanzungId: L[1] as string, netztopfId: netztopfId('2.3.1') }] });
    expect(umsetzEingabePruefen(t, belegt, J, Z).length).toBeGreaterThan(0);
    expect(vorgang(t, belegt)).toEqual([]);
  });
});

describe('UC5-AK7 Umsetzen ohne Zieltopf (R6.2)', () => {
  it('UC5-AK7 umsetzZiele: nur freie 80-mm-Töpfe in Gefässen ohne feste Dosis; reserviert, belegt und abwesend nicht wählbar', () => {
    // 2.3: Loch 1 und 4 belegt, Loch 2 und 3 reserviert (Lollo); 2.1: Loch 2 abwesend (2.1.2 auf 4.2), Loch 6 belegt
    const t = umsetzTeile({ bestand23: true, zieltoepfe: ['2.3.2', '2.3.3', '1.1.1', '1.1.2', '1.1.3'] });
    const in23 = umsetzZiele(t, platzId('2.3'), new Map());
    expect(in23.map((l) => l.lochNr)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(waehlbar(in23)).toEqual([5, 6]);
    expect(in23.find((l) => l.lochNr === 1)).toMatchObject({ kennung: '2.3.1', zustand: 'belegt' });
    expect(in23.find((l) => l.lochNr === 2)).toMatchObject({ kennung: '2.3.2', zustand: 'reserviert' });
    const in21 = umsetzZiele(t, platzId('2.1'), new Map());
    expect(waehlbar(in21)).toEqual([1, 3, 4, 5]);
    expect(in21.find((l) => l.lochNr === 2)?.abwesend).toContain('auf 4.2.1');
    // 5-cm-Lochbild und Station mit fester Dosis: nichts wählbar
    for (const kennung of ['3.1', '3.2', '4.2', '4.4'])
      expect(waehlbar(umsetzZiele(t, platzId(kennung), new Map())), kennung).toEqual([]);
  });

  it('UC5-AK7 alleFreienWaehlen nimmt so viele Löcher wie Sämlinge ohne Ziel, in Lochfolge', () => {
    const t = umsetzTeile();
    const ziele = umsetzZiele(t, platzId('2.1'), new Map());
    // Loch 2 ist abwesend (2.1.2 steht auf 4.2)
    expect(alleFreienWaehlen(ziele, 5)).toEqual(
      ['2.1.1', '2.1.3', '2.1.4', '2.1.5', '2.1.6'].map(netztopfId),
    );
    expect(alleFreienWaehlen(ziele, 3)).toEqual(['2.1.1', '2.1.3', '2.1.4'].map(netztopfId));
    expect(alleFreienWaehlen(ziele, 9)).toHaveLength(5);
    expect(alleFreienWaehlen(ziele, 0)).toEqual([]);
  });

  it('UC5-AK7 umsetzEingabePruefen lehnt doppelten Topf, fremde Pflanzung und Nicht-Sämling ab', () => {
    const t = umsetzTeile();
    const rucola = (zuweisung: UmsetzEingabe['zuweisung']) => eingabe({ satzId: SATZ.rucola, zuweisung });
    const gut = rucola([
      { pflanzungId: R[1] as string, netztopfId: netztopfId('2.1.1') },
      { pflanzungId: R[2] as string, netztopfId: netztopfId('2.1.3') },
    ]);
    expect(umsetzEingabePruefen(t, gut, J, Z)).toEqual([]);
    // derselbe Topf zweimal
    const doppelt = rucola([
      { pflanzungId: R[1] as string, netztopfId: netztopfId('2.1.1') },
      { pflanzungId: R[2] as string, netztopfId: netztopfId('2.1.1') },
    ]);
    expect(umsetzEingabePruefen(t, doppelt, J, Z).length).toBeGreaterThan(0);
    // Pflanzung eines anderen Satzes
    const fremd = rucola([{ pflanzungId: L[6] as string, netztopfId: netztopfId('2.1.1') }]);
    expect(umsetzEingabePruefen(t, fremd, J, Z).length).toBeGreaterThan(0);
    // schon umgesetzt: kein Sämling mehr
    const nach = umsetzVorgangAnwenden(t, vorgang(t, gut), J);
    const nochmal = rucola([{ pflanzungId: R[1] as string, netztopfId: netztopfId('2.1.4') }]);
    expect(umsetzEingabePruefen(nach, nochmal, J, Z).length).toBeGreaterThan(0);
    expect(vorgang(nach, nochmal)).toEqual([]);
    // abwesender Heimtopf (2.1.2 auf 4.2) und reservierter Topf (2.3.1) sind kein Ziel
    for (const topf of ['2.1.2', '2.3.1'])
      expect(
        umsetzEingabePruefen(t, rucola([{ pflanzungId: R[1] as string, netztopfId: netztopfId(topf) }]), J, Z)
          .length,
        topf,
      ).toBeGreaterThan(0);
  });

  it('UC5-AK7 Umsetzen ohne Zieltopf schreibt keine Reservierung', () => {
    const t = umsetzTeile();
    const a = ansicht(t, SATZ.rucola);
    expect(a?.saemlinge).toHaveLength(5);
    expect(a?.saemlinge.every((s) => s.zieltopf === undefined)).toBe(true);
    expect(wieGeplant(a as NonNullable<typeof a>).zuweisung).toEqual([]);
    const toepfe = alleFreienWaehlen(umsetzZiele(t, platzId('2.1'), new Map()), 5);
    // Sämlinge in ihrer Nummernfolge auf die Löcher in Lochfolge (A8)
    const folge = [...(a?.saemlinge ?? [])].sort((x, y) => x.nr - y.nr).map((s) => s.pflanzungId);
    expect(folge).toEqual(R.slice(1, 6));
    const e = eingabe({
      satzId: SATZ.rucola,
      zuweisung: folge.map((p, i) => ({ pflanzungId: p, netztopfId: toepfe[i] as string })),
    });
    expect(umsetzEingabePruefen(t, e, J, Z)).toEqual([]);
    const v = vorgang(t, e);
    expect(v.every((s) => s.tabelle === 'ereignis')).toBe(true);
    expect(neue(v, 'umsetzen').map((f) => [f['pflanzung_id'], daten(f)['nach_loch_nr']])).toEqual(
      folge.map((p, i) => [p, [1, 3, 4, 5, 6][i]]),
    );
    const vorher = (t['v_reservierung_aktiv'] ?? []).length;
    const nach = umsetzVorgangAnwenden(t, v, J);
    expect((nach['reservierung'] ?? []).length).toBe((t['reservierung'] ?? []).length);
    expect((nach['v_reservierung_aktiv'] ?? []).length).toBe(vorher);
    expect(zustand(nach, R[1] as string)).toMatchObject({
      platz_id: platzId('2.1'),
      loch_nr: 1,
      netztopf_id: netztopfId('2.1.1'),
    });
  });
});

describe('UC5-AK4 8-cm-Zieltopf auf 5-cm-Lochbild (R8.3)', () => {
  for (const [kennung, deckel] of [
    ['3.1', 'D3'],
    ['3.2', 'D6'],
    ['4.4', 'S5'],
  ] as const)
    it(`UC5-AK4 Ein 8-cm-Zieltopf lässt sich nicht als Platz auf einem 5-cm-Lochbild (D3, D6, S5) wählen: ${kennung} (${deckel})`, () => {
      const t = umsetzTeile({ bestand23: true });
      expect(topfPasst(t, netztopfId('2.1.2'), platzId(kennung))).toBe(false);
      expect(topfPasst(t, netztopfId('2.3.1'), platzId(kennung))).toBe(false);
      expect(topfPasst(t, netztopfId('2.1.2'), platzId('2.3'))).toBe(true);
      expect(waehlbar(umsetzZiele(t, platzId(kennung), new Map()))).toEqual([]);
      // Umsetzen in einen 5-cm-Topf dieses Lochbilds (nur 3.1 und 3.2 haben Töpfe) wird abgelehnt
      if (kennung !== '4.4') {
        const e = eingabe({
          satzId: SATZ.rucola,
          zuweisung: [{ pflanzungId: R[1] as string, netztopfId: netztopfId(`${kennung}.2`) }],
        });
        expect(umsetzEingabePruefen(t, e, J, Z).length).toBeGreaterThan(0);
      }
      // Verschieben des 8-cm-Topfs 2.3.1 (umgesetzt 9.1., Tag 10) auf dieses Lochbild
      const felder = verschiebenPruefen(
        t,
        { netztopfId: netztopfId('2.3.1'), zielPlatzId: platzId(kennung), zielLochNr: 2 },
        J,
        Z,
      ).map((x) => x.feld);
      if (kennung === '4.4') expect(felder.some((f) => f === 'groesse' || f === 'station')).toBe(true);
      else expect(felder).toContain('groesse');
    });
});

describe('R6.2 Zieltopf belegt, In der Station lassen, Hinweise, Rest', () => {
  it('R6.2 Jetzt abernten: ernte {art: ab} des Vorgängers vor umsetzen im selben Vorgang', () => {
    const t = umsetzTeile({ bestand23: true });
    const e = geplant(t);
    const mit: UmsetzEingabe = {
      ...e,
      zuweisung: [...e.zuweisung, { pflanzungId: L[1] as string, netztopfId: netztopfId('2.3.1') }],
      abernten: [netztopfId('2.3.1')],
    };
    expect(umsetzEingabePruefen(t, mit, J, Z)).toEqual([]);
    const v = vorgang(t, mit);
    expect(vorgangPruefen(v)).toEqual([]);
    const typen = neue(v).map((f) => f['typ']);
    const ernte = neue(v, 'ernte');
    expect(ernte).toHaveLength(1);
    expect(ernte[0]).toMatchObject({ pflanzung_id: EICHBLATT_23, gilt_ab: J.toISOString() });
    expect(daten(ernte[0])).toEqual({ art: 'ab' });
    const iUmsetzen = neue(v).findIndex((f) => f['typ'] === 'umsetzen' && f['pflanzung_id'] === L[1]);
    expect(typen.indexOf('ernte')).toBeLessThan(iUmsetzen);
    expect(neue(v, 'umsetzen')).toHaveLength(4);
    const nach = umsetzVorgangAnwenden(t, v, J);
    expect(zustand(nach, EICHBLATT_23)?.['status']).toBe('geerntet');
    expect(zustand(nach, L[1] as string)).toMatchObject({ platz_id: platzId('2.3'), loch_nr: 1 });
  });

  it('R6.2 In der Station lassen: umsetzdatum_geaendert {von, nach, grund: in_station_lassen}, nach höchstens Saat + umsetzen_bis', () => {
    const t = umsetzTeile({ bestand23: true });
    // Saat 7.1. + «Umsetzen bis» 28 = 4.2.
    expect(ansicht(t)?.inStationLassenBis).toBe('2027-02-04');
    const e = (bis: string) =>
      eingabe({ ...geplant(t), inStationLassen: [{ pflanzungId: L[1] as string, bis }] });
    expect(umsetzEingabePruefen(t, e('2027-02-04'), J, Z)).toEqual([]);
    expect(umsetzEingabePruefen(t, e('2027-01-20'), J, Z)).toEqual([]);
    expect(umsetzEingabePruefen(t, e('2027-02-05'), J, Z).length).toBeGreaterThan(0);
    expect(umsetzEingabePruefen(t, e('2027-01-19'), J, Z).length).toBeGreaterThan(0);
    const v = vorgang(t, e('2027-02-04'));
    const [g] = neue(v, 'umsetzdatum_geaendert');
    expect(neue(v, 'umsetzdatum_geaendert')).toHaveLength(1);
    expect(g).toMatchObject({ pflanzung_id: L[1], gilt_ab: J.toISOString() });
    expect(daten(g)).toEqual({ von: '2027-01-28', nach: '2027-02-04', grund: 'in_station_lassen' });
    expect(neue(v, 'umsetzen').some((f) => f['pflanzung_id'] === L[1])).toBe(false);
    // Reihenfolge: umsetzdatum_geaendert vor umsetzen
    const typen = neue(v).map((f) => f['typ']);
    expect(typen.indexOf('umsetzdatum_geaendert')).toBeLessThan(typen.indexOf('umsetzen'));
    // nachgerechnet: die Reservierung von Pflanzung 1 gilt bis 4.2.
    const nach = umsetzVorgangAnwenden(t, v, J);
    expect(aktiveRes(nach, [L[1] as string])[0]?.['umsetzen_geplant_am']).toBe('2027-02-04');
  });

  it('R6.2 In der Station lassen fehlt, wenn Saat + umsetzen_bis nicht nach heute liegt', () => {
    const t = umsetzTeile({ bestand23: true });
    expect(ansicht(t, SATZ.lollo, new Date('2027-02-03T08:00:00Z'))?.inStationLassenBis).toBe('2027-02-04');
    const am4 = new Date('2027-02-04T08:00:00Z');
    expect(ansicht(t, SATZ.lollo, am4)?.inStationLassenBis).toBeUndefined();
    const e = eingabe({ inStationLassen: [{ pflanzungId: L[1] as string, bis: '2027-02-04' }] });
    expect(umsetzEingabePruefen(t, e, am4, Z).length).toBeGreaterThan(0);
  });

  it('R6.2 Hinweise: 8-cm-Topf samt Blähton, 5-cm-Anzuchttopf in den 8-cm-Zieltopf, DWC-Startstand, Ansatz je Zielgefäss (I2-02)', () => {
    const t = umsetzTeile();
    const z = umsetzZusammenfassung(t, geplant(t), J, Z);
    expect(z.zeilen).toContain('4.4.1 → 2.3.1');
    expect(z.zeilen).toHaveLength(5);
    expect(z.hinweise).toContain(
      '5-cm-Anzuchttopf mitsamt Schwamm in den 8-cm-Zieltopf mit gespültem Blähton 8 bis 16 mm',
    );
    expect(z.hinweise).toContain(
      'DWC-Startstand: Topfboden 1 bis 2 cm im Wasser, 5 bis 7 Tage von oben angiessen',
    );
    expect(z.hinweise).not.toContain('8-cm-Topf samt Blähton ins Zielgefäss');
    // Plan 34 (R2.2): Lösung in 2.3 vom 7.1., Umsetzen heute am 19.1. → 12 Tage alt
    expect(z.ansatz).toBe('2.3: Lösung wechseln am Umsetztag (Lösung 12 Tage alt)');

    const tomate = umsetzZusammenfassung(t, geplant(t, SATZ.tomate), J, Z);
    expect(tomate.hinweise).toContain('8-cm-Topf samt Blähton ins Zielgefäss');
    expect(tomate.zeilen).toEqual(['4.2.1 → 2.1.2']);

    // Kratky belüftet mit 80-mm-Lochbild (2.2 umgestellt)
    for (const g of t['gefaess'] ?? [])
      if (g['platz_id'] === platzId('2.2')) g['betriebsart'] = 'kratky_belueftet';
    const kratky = umsetzZusammenfassung(
      t,
      eingabe({
        satzId: SATZ.rucola,
        zuweisung: [{ pflanzungId: R[1] as string, netztopfId: netztopfId('2.2.1') }],
      }),
      J,
      Z,
    );
    expect(kratky.hinweise).toContain('Kratky belüftet: Topfboden 1 cm eintauchen');
    expect(kratky.hinweise).not.toContain(
      'DWC-Startstand: Topfboden 1 bis 2 cm im Wasser, 5 bis 7 Tage von oben angiessen',
    );
  });

  it('R6.2 R2.2 Ansatz je Zielgefäss: ab 7 Tagen Lösung wechseln, darunter Lösung bleibt, ohne Lösung Ansatz für Umsetzen (Plan 34 A12)', () => {
    /** Neuansatz in 2.3 (aus regalTeile) auf `beginn` verlegen */
    const mitLoesungVom = (beginn: string) => {
      const t = umsetzTeile();
      t['naehrloesungsansatz'] = (t['naehrloesungsansatz'] ?? []).map((a) =>
        a['platz_id'] === platzId('2.3') ? { ...a, begonnen_am: beginn, gilt_ab: beginn } : a,
      );
      t['v_fuellzustand'] = (t['v_fuellzustand'] ?? []).map((f) =>
        f['platz_id'] === platzId('2.3') ? { ...f, letzter_ansatz: beginn } : f,
      );
      return t;
    };
    const ansatz = (t: Teile) => umsetzZusammenfassung(t, geplant(t), J, Z).ansatz;
    expect(ansatz(mitLoesungVom('2027-01-10T08:00:00.000Z'))).toBe(
      '2.3: Lösung wechseln am Umsetztag (Lösung 9 Tage alt)',
    );
    expect(ansatz(mitLoesungVom('2027-01-12T08:00:00.000Z'))).toBe(
      '2.3: Lösung wechseln am Umsetztag (Lösung 7 Tage alt)',
    );
    expect(ansatz(mitLoesungVom('2027-01-13T08:00:00.000Z'))).toBe(
      '2.3: Lösung bleibt (6 Tage alt), Zielbereich und Nachfülldosis neu',
    );
    expect(ansatz(mitLoesungVom('2027-01-14T08:00:00.000Z'))).toBe(
      '2.3: Lösung bleibt (5 Tage alt), Zielbereich und Nachfülldosis neu',
    );
    // Ochsenherz nach 2.1: ohne Lösung erster Ansatz
    const t = umsetzTeile();
    expect(umsetzZusammenfassung(t, geplant(t, SATZ.tomate), J, Z).ansatz).toBe('2.1: Ansatz für Umsetzen');
  });

  it('R6.2 R2.2 Ansatz je Zielgefäss: Lösung 1 Tag alt und von heute in der Einzahl, wechselIn mit allen Zielgefässen (Plan 34 Runde 1)', () => {
    /** Neuansatz in 2.3 (aus regalTeile) auf `beginn` verlegen */
    const mitLoesungVom = (beginn: string) => {
      const t = umsetzTeile();
      t['naehrloesungsansatz'] = (t['naehrloesungsansatz'] ?? []).map((a) =>
        a['platz_id'] === platzId('2.3') ? { ...a, begonnen_am: beginn, gilt_ab: beginn } : a,
      );
      t['v_fuellzustand'] = (t['v_fuellzustand'] ?? []).map((f) =>
        f['platz_id'] === platzId('2.3') ? { ...f, letzter_ansatz: beginn } : f,
      );
      return t;
    };
    const ansatz = (t: Teile) => umsetzZusammenfassung(t, geplant(t), J, Z).ansatz;
    // Umsetztag 19.1.: Lösung vom 18.1. ist 1 Tag alt, vom 19.1. 08:00 Zürich von heute
    expect(ansatz(mitLoesungVom('2027-01-18T08:00:00.000Z'))).toBe(
      '2.3: Lösung bleibt (1 Tag alt), Zielbereich und Nachfülldosis neu',
    );
    expect(ansatz(mitLoesungVom('2027-01-19T07:00:00.000Z'))).toBe(
      '2.3: Lösung von heute bleibt, Zielbereich und Nachfülldosis neu',
    );
    // jünger als 7 Tage: kein Wechsel vorgeschlagen
    const jung = mitLoesungVom('2027-01-18T08:00:00.000Z');
    expect(umsetzZusammenfassung(jung, geplant(jung), J, Z).wechselIn).toBeUndefined();

    // zwei Zielgefässe mit 12 Tage alter Lösung: der letzte Lollo Rossa geht nach 2.2.1 statt nach 2.3
    const t = umsetzTeile();
    const ansatz23 = (t['naehrloesungsansatz'] ?? []).find((a) => a['platz_id'] === platzId('2.3'));
    if (!ansatz23) throw new Error('Ansatz in 2.3 fehlt');
    (t['naehrloesungsansatz'] ??= []).push({
      ...ansatz23,
      id: uid('5d', 1),
      client_id: uid('5d', 1),
      platz_id: platzId('2.2'),
    });
    const e = geplant(t);
    const letzte = e.zuweisung.at(-1);
    if (!letzte) throw new Error('Zuweisung fehlt');
    const zwei: UmsetzEingabe = {
      ...e,
      zuweisung: [...e.zuweisung.slice(0, -1), { ...letzte, netztopfId: netztopfId('2.2.1') }],
    };
    const z = umsetzZusammenfassung(t, zwei, J, Z);
    expect(z.ansatz).toBe(
      '2.3: Lösung wechseln am Umsetztag (Lösung 12 Tage alt) · 2.2: Lösung wechseln am Umsetztag (Lösung 12 Tage alt)',
    );
    expect(z.wechselIn).toEqual([platzId('2.3'), platzId('2.2')]);
  });

  it('R6.2 Rest: «In 4.4 verbleiben 2 Sämlinge ohne Ziel»', () => {
    const vier = umsetzTeile({ zieltoepfe: ['2.3.1', '2.3.2', '2.3.3', '2.3.4'] });
    expect(umsetzZusammenfassung(vier, geplant(vier), J, Z).rest).toBe(
      'In 4.4 verbleiben 2 Sämlinge ohne Ziel',
    );
    const t = umsetzTeile();
    expect(umsetzZusammenfassung(t, geplant(t), J, Z).rest).toBe('In 4.4 verbleibt 1 Sämling ohne Ziel');
    // Rest beendet: kein Hinweis
    const beendet = eingabe({ ...geplant(t), ueberzaehlig: [L[6] as string] });
    expect(umsetzZusammenfassung(t, beendet, J, Z).rest).toBeUndefined();
    const ohneReserve = umsetzTeile({ reserve: false });
    expect(umsetzZusammenfassung(ohneReserve, geplant(ohneReserve), J, Z).rest).toBeUndefined();
  });

  it('R6.2 Überzählige beenden: abschluss {grund: ueberzaehlig} je Rest-Sämling in Station und Box', () => {
    const t = umsetzTeile();
    const v = vorgang(t, eingabe({ ...geplant(t), ueberzaehlig: [L[6] as string] }));
    const ab = neue(v, 'abschluss');
    expect(ab).toHaveLength(1);
    expect(ab[0]).toMatchObject({ pflanzung_id: L[6], gilt_ab: J.toISOString() });
    expect(daten(ab[0])).toEqual({ grund: 'ueberzaehlig' });
    // abschluss nach den umsetzen
    const typen = neue(v).map((f) => f['typ']);
    expect(typen.lastIndexOf('umsetzen')).toBeLessThan(typen.indexOf('abschluss'));
    expect(zustand(umsetzVorgangAnwenden(t, v, J), L[6] as string)?.['status']).toBe('ueberzaehlig');

    // Satz Eichblatt (Nr. 88) in A2: Schwamm 1 gekeimt in der Box, Schwamm 2 auf 4.5 Loch 5
    const b = umsetzTeile();
    const [p1, p2] = satzAnlegen(b, {
      nr: 88,
      sorteId: SORTE.eichblatt,
      saatgutId: null,
      box: 'A2',
      schwaemme: 2,
      samen: 2,
      zieltoepfe: [],
    }) as [string, string];
    for (const p of [p1, p2])
      ereignis(b, {
        typ: 'keimung',
        pflanzungId: p,
        giltAb: '2027-01-11T08:00:00.000Z',
        daten: { samen_gesaet: 2, samen_gekeimt: 1, keimtemp_eingehalten: true },
      });
    ereignis(b, {
      typ: 'verschieben',
      pflanzungId: p2,
      giltAb: '2027-01-11T08:00:00.000Z',
      daten: { von_platz_id: platzId('A2'), nach_platz_id: platzId('4.5'), nach_loch_nr: 5 },
    });
    umsetzSichtenNachrechnen(b);
    const satz88 = uid('27', 88);
    const a = ansicht(b, satz88);
    expect(a?.saemlinge.find((s) => s.pflanzungId === p1)?.ort).toMatchObject({ platzId: platzId('A2') });
    expect(a?.saemlinge.find((s) => s.pflanzungId === p2)?.ort).toMatchObject({
      platzId: platzId('4.5'),
      lochNr: 5,
    });
    const box = vorgang(b, eingabe({ satzId: satz88, ueberzaehlig: [p1, p2] }));
    expect(neue(box, 'abschluss').map((f) => [f['pflanzung_id'], daten(f)['grund']])).toEqual([
      [p1, 'ueberzaehlig'],
      [p2, 'ueberzaehlig'],
    ]);
  });

  it('R6.2 Station ohne Satz nach dem Umsetzen: «4.4 ist ohne Satz: leeren»', () => {
    const t = umsetzTeile({ rucola: false });
    const alle = eingabe({ ...geplant(t), ueberzaehlig: [L[6] as string] });
    expect(umsetzZusammenfassung(t, alle, J, Z).stationLeer).toBe('4.4 ist ohne Satz: leeren');
    // die Reserve bleibt: kein Hinweis
    expect(umsetzZusammenfassung(t, geplant(t), J, Z).stationLeer).toBeUndefined();
    // Rucola steht noch auf 4.4: kein Hinweis
    const mitRucola = umsetzTeile();
    expect(
      umsetzZusammenfassung(
        mitRucola,
        eingabe({ ...geplant(mitRucola), ueberzaehlig: [L[6] as string] }),
        J,
        Z,
      ).stationLeer,
    ).toBeUndefined();
  });

  it('R6.2 ungeprüfte Schwämme und Schwämme mit 0 sind keine Sämlinge', () => {
    // Satz Eichblatt (Nr. 89) in A2: 1 gekeimt in der Box, 2 mit 0 (keimt nicht), 3 ungeprüft, 4 gekeimt auf 4.5
    const t = umsetzTeile();
    const p = satzAnlegen(t, {
      nr: 89,
      sorteId: SORTE.eichblatt,
      saatgutId: null,
      box: 'A2',
      schwaemme: 4,
      samen: 2,
      zieltoepfe: [],
    });
    const keim = (pf: string, gekeimt: number) =>
      ereignis(t, {
        typ: 'keimung',
        pflanzungId: pf,
        giltAb: '2027-01-11T08:00:00.000Z',
        daten: { samen_gesaet: 2, samen_gekeimt: gekeimt, keimtemp_eingehalten: true },
      });
    keim(p[0] as string, 1);
    keim(p[1] as string, 0);
    ereignis(t, {
      typ: 'abschluss',
      pflanzungId: p[1] as string,
      giltAb: '2027-01-11T08:00:00.000Z',
      daten: { grund: 'keimt_nicht' },
    });
    keim(p[3] as string, 2);
    ereignis(t, {
      typ: 'verschieben',
      pflanzungId: p[3] as string,
      giltAb: '2027-01-11T08:00:00.000Z',
      daten: { von_platz_id: platzId('A2'), nach_platz_id: platzId('4.5'), nach_loch_nr: 6 },
    });
    umsetzSichtenNachrechnen(t);
    const a = ansicht(t, uid('27', 89));
    expect(new Set(a?.saemlinge.map((s) => s.pflanzungId))).toEqual(new Set([p[0], p[3]]));
    expect(a?.ohneKeimpruefung).toBe(1);
    // ein Nicht-Sämling lässt sich nicht umsetzen
    const e = eingabe({
      satzId: uid('27', 89),
      zuweisung: [{ pflanzungId: p[2] as string, netztopfId: netztopfId('2.1.1') }],
    });
    expect(umsetzEingabePruefen(t, e, J, Z).length).toBeGreaterThan(0);
    expect(pflanzungId(89, 1)).toBe(p[0]);
  });

  it('R6.2 Rückgängig storniert alle Zeilen des Vorgangs in umgekehrter Reihenfolge', () => {
    const t = umsetzTeile();
    const v = vorgang(t, eingabe({ ...geplant(t), ueberzaehlig: [L[6] as string] }));
    expect(v).toHaveLength(6);
    const zurueck = saatRueckgaengig(v);
    expect(zurueck).toEqual(
      [...neue(v)].reverse().map((f) => ({
        art: 'storno',
        tabelle: 'ereignis',
        clientId: f['client_id'],
        grund: 'rueckgaengig',
      })),
    );
    const nach = umsetzVorgangAnwenden(umsetzVorgangAnwenden(t, v, J), zurueck, J);
    expect(aktiveRes(nach, LOLLO_1_5)).toHaveLength(5);
    for (let k = 1; k <= 6; k += 1)
      expect(zustand(nach, L[k] as string), `Sämling ${k}`).toMatchObject({
        status: 'aktiv',
        platz_id: platzId('4.4'),
        loch_nr: k,
      });
  });
});

describe('R5.2 Aufgabe «Umsetzen» (Übergangsliste bis I1b-02)', () => {
  const aufgabe = (t: Teile, jetzt: Date, satz: string = SATZ.lollo) =>
    umsetzAufgaben(t, jetzt, Z).find((a) => a.satzId === satz);

  it('R5.2 umsetzAufgaben: fällig am frühesten umsetzen_geplant_am; ohne Reservierung Saat + umsetzen_ab', () => {
    const t = umsetzTeile();
    // 27.1.: Lollo Rossa und Ochsenherz noch nicht fällig, Rucola seit 19.1. (5.1. + 14)
    expect(aufgabe(t, new Date('2027-01-27T08:00:00Z'))).toBeUndefined();
    expect(aufgabe(t, new Date('2027-01-27T08:00:00Z'), SATZ.tomate)).toBeUndefined();
    expect(aufgabe(t, J, SATZ.rucola)).toMatchObject({
      faelligAm: '2027-01-19',
      ueberfaellig: false,
      wieGeplant: false,
    });
    const am28 = new Date('2027-01-28T08:00:00Z');
    const lollo = aufgabe(t, am28);
    expect(lollo).toMatchObject({
      satzId: SATZ.lollo,
      faelligAm: '2027-01-28',
      ueberfaellig: false,
      wieGeplant: true,
    });
    expect(lollo?.text).toMatch(/^Umsetzen · Lollo Rossa · 4\.4 → 2\.3/);
    expect(aufgabe(t, am28, SATZ.tomate)).toMatchObject({ faelligAm: '2027-01-28', wieGeplant: true });
    expect(aufgabe(t, am28, SATZ.tomate)?.text).toMatch(/^Umsetzen · Ochsenherz · 4\.2 → 2\.1/);
    // nach Fälligkeit sortiert: Rucola zuerst
    expect(umsetzAufgaben(t, am28, Z)[0]?.satzId).toBe(SATZ.rucola);
    // eine Pflanzung früher geplant (Ereignis am 20.1.: 25.1.) → frühestes Datum zählt
    ereignis(t, {
      typ: 'umsetzdatum_geaendert',
      pflanzungId: L[3] as string,
      giltAb: '2027-01-20T08:00:00.000Z',
      daten: { von: '2027-01-28', nach: '2027-01-25', grund: 'morgen' },
    });
    umsetzSichtenNachrechnen(t);
    expect(aufgabe(t, new Date('2027-01-24T08:00:00Z'))).toBeUndefined();
    expect(aufgabe(t, new Date('2027-01-25T08:00:00Z'))?.faelligAm).toBe('2027-01-25');
  });

  it('R5.2 «Umsetzen überfällig» ab Saat + umsetzen_bis + 7', () => {
    const t = umsetzTeile();
    // Lollo Rossa: 7.1. + 28 + 7 = 11.2.; Rucola: 5.1. + 21 + 7 = 2.2.
    expect(aufgabe(t, new Date('2027-02-10T08:00:00Z'))?.ueberfaellig).toBe(false);
    const am11 = aufgabe(t, new Date('2027-02-11T08:00:00Z'));
    expect(am11?.ueberfaellig).toBe(true);
    expect(am11?.text).toMatch(/^Umsetzen überfällig/);
    expect(aufgabe(t, new Date('2027-02-01T08:00:00Z'), SATZ.rucola)?.ueberfaellig).toBe(false);
    expect(aufgabe(t, new Date('2027-02-02T08:00:00Z'), SATZ.rucola)?.ueberfaellig).toBe(true);
  });

  it('R5.2 Fälligkeit als Kalendertag in Zürich (jetzt 23:30 UTC am Vortag)', () => {
    const t = umsetzTeile();
    // 27.1. 23:30 UTC = 28.1. 00:30 in Zürich: fällig; 22:30 UTC = 27.1. 23:30: noch nicht
    expect(aufgabe(t, new Date('2027-01-27T23:30:00Z'))?.faelligAm).toBe('2027-01-28');
    expect(aufgabe(t, new Date('2027-01-27T22:30:00Z'))).toBeUndefined();
  });

  it('R5.2 nach dem Umsetzen keine Aufgabe mehr für den Satz', () => {
    const t = umsetzTeile();
    const am28 = new Date('2027-01-28T08:00:00Z');
    const e = eingabe({ ...geplant(t, SATZ.lollo, am28), ueberzaehlig: [L[6] as string] });
    const nach = umsetzVorgangAnwenden(t, umsetzVorgang(t, e, neueIds(), am28, Z), am28);
    expect(aufgabe(nach, am28)).toBeUndefined();
    // die übrigen Sätze bleiben
    expect(aufgabe(nach, am28, SATZ.tomate)).toBeDefined();
    expect(aufgabe(nach, am28, SATZ.rucola)).toBeDefined();
  });
});
