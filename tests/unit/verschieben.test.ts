// Verschieben und Tauschen von Töpfen (Plan 33 Testliste; UC6-AK3, UC6-AK4, UC6-AK8, R8.3, R8.4). Injizierte Uhr
// 2027-01-19T08:00:00Z (Zürich 19.1.), Zeitzone Europe/Zurich. Teile verschiebTeile() aus tests/fixtures/umsetzen.ts:
// 2.3 Loch 1 Topf 2.3.1 mit Eichblatt und Loch 4 Topf 2.3.4 mit Lollo Rossa (beide umgesetzt 9.1.: am 19.1. Tag 10,
// am 20.1. Tag 11), 2.3.6 reserviert; 2.1 Loch 6 Topf 2.1.6 mit Eichblatt (umgesetzt 5.1.), Loch 2 abwesend (2.1.2
// mit Ochsenherz auf 4.2 Loch 1); Direktsaat Rucola in 3.1.1 (gesät 5.1., ohne umsetzen).
//
// Vertrag (Plan 33 «Signaturen und Datenfluss», vom Testentwickler präzisiert, wo der Plan offen ist):
//   src/domain/pflanzung/verschieben.ts
//     HINWEIS_WURZELN = 'Wurzeln vermutlich verwachsen, nur innerhalb des Gefässes tauschen'
//     umgesetztAm(teile, pflanzungId, zeitzone): Kalendertag des letzten nicht stornierten umsetzen; ohne umsetzen der
//       Saattag (Direktsaat, A17); unbekannt → undefined.
//     verschiebAnsicht(teile, topfCode 'R-2.3.1', jetzt, zeitzone): VerschiebAnsicht | undefined
//       { topf: { netztopfId; kennung; platzId; lochNr }; pflanzung?: { pflanzungId; sorte; umgesetztAm; tag };
//         kopf «Topf 2.3.1 · Eichblatt · umgesetzt am 9.1.»;
//         zielgefaesse: { platzId; kennung; erlaubt; hinweis? }[] (eigenes Gefäss zuerst, dann übrige ohne feste Dosis
//           mit gleicher Topfgrösse; keine Station); wissenskarte?: { text } aus wissenseintrag typ topf_umsetzen }
//     verschiebZiele(teile, netztopfId, zielPlatzId, jetzt, zeitzone): DeckelLoch[] mit nichtWaehlbar und zustandName
//     verschiebenPruefen(teile, { netztopfId, zielPlatzId, zielLochNr }, jetzt, zeitzone): Verstoss[]; Verstoss.feld ist
//       der Grund-Code groesse | wurzeln | gesperrt | station | reserviert | abwesend | gleich, Verstoss.grund der Text
//       (bei wurzeln genau HINWEIS_WURZELN).
//     verschiebVorgang(teile, eingabe, ids, jetzt, zeitzone): { vorgang; art: 'verschieben' | 'tausch'; text }
//       Tausch: zwei Ereignisse tausch (je Topf netztopf_id, pflanzung_id der Pflanzung im Topf, daten von/nach vertauscht
//       und gemeinsame vorgang_id = neue ID aus ids()), text «Getauscht: 2.3.1 ↔ 2.3.4».
//       Leerer Topf im Ziel: zwei Ereignisse verschieben, der Topf mit Pflanzung ins Zielloch, der leere Topf ohne
//       pflanzung_id ins frei gewordene Loch, text «Verschoben: 2.3.1 auf 2.1.5 · leeren Topf 2.1.5 in 2.3 Loch 1
//       stecken». Bei Verstössen vorgang [].
import { describe, expect, it } from 'vitest';
import { vorgangPruefen, type Schritt, type Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import { saatRueckgaengig } from '../../src/domain/pflanzung/saeen.ts';
import { topfPasst } from '../../src/domain/pflanzung/topf.ts';
import {
  HINWEIS_WURZELN,
  umgesetztAm,
  verschiebAnsicht,
  verschiebenPruefen,
  verschiebVorgang,
  verschiebZiele,
} from '../../src/domain/pflanzung/verschieben.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { netztopfId, platzId, uid, type Teile } from '../fixtures/regal.ts';
import { umsetzSichtenNachrechnen, umsetzVorgangAnwenden } from '../fixtures/sichten.ts';
import {
  DIREKT,
  EICHBLATT_21,
  EICHBLATT_23,
  kurzpruefungDazu,
  LOLLO_ALT,
  UMSETZ_JETZT,
  verschiebTeile,
  WISSEN_TOPF_UMSETZEN,
} from '../fixtures/umsetzen.ts';

const J = UMSETZ_JETZT;
const TAG11 = new Date('2027-01-20T08:00:00Z');
const Z = ZEITZONE;

function neueIds(): () => string {
  let n = 0;
  return () => {
    n += 1;
    return uid('5d', n);
  };
}
type Neu = Extract<Schritt, { art: 'neu' }>;
const neue = (v: Vorgang) => v.filter((s): s is Neu => s.art === 'neu').map((s) => s.felder);
const daten = (f: Record<string, unknown> | undefined) => (f?.['daten'] ?? {}) as Record<string, unknown>;
const ziel = (topf: string, gefaess: string, loch: number) => ({
  netztopfId: netztopfId(topf),
  zielPlatzId: platzId(gefaess),
  zielLochNr: loch,
});
const gruende = (t: Teile, topf: string, gefaess: string, loch: number, jetzt = J) =>
  verschiebenPruefen(t, ziel(topf, gefaess, loch), jetzt, Z).map((v) => v.feld);
const ortVon = (t: Teile, topf: string) =>
  (t['v_netztopf_platz'] ?? []).find((n) => n['netztopf_id'] === netztopfId(topf));

describe('UC6-AK4 gleiche Topfgrösse (R8.3)', () => {
  it('UC6-AK4 Verschieben eines 5-cm-Topfs auf ein 8-cm-Loch wird abgelehnt', () => {
    const t = verschiebTeile();
    const frueh = new Date('2027-01-12T08:00:00Z');
    expect(topfPasst(t, netztopfId('3.1.1'), platzId('2.3'))).toBe(false);
    expect(topfPasst(t, netztopfId('3.1.1'), platzId('3.2'))).toBe(true);
    expect(gruende(t, '3.1.1', '2.3', 2, frueh)).toContain('groesse');
    expect(gruende(t, '3.1.1', '2.3', 2, frueh)).not.toContain('wurzeln');
    expect(verschiebVorgang(t, ziel('3.1.1', '2.3', 2), neueIds(), frueh, Z).vorgang).toEqual([]);
  });

  it('UC6-AK4 Tausch eines 5-cm-Topfs mit einem 8-cm-Topf wird abgelehnt', () => {
    const t = verschiebTeile();
    const frueh = new Date('2027-01-12T08:00:00Z');
    expect(gruende(t, '3.1.1', '2.3', 4, frueh)).toContain('groesse');
    expect(gruende(t, '2.3.4', '3.1', 1, frueh)).toContain('groesse');
    expect(verschiebVorgang(t, ziel('2.3.4', '3.1', 1), neueIds(), frueh, Z).vorgang).toEqual([]);
  });
});

describe('UC6-AK3 Tausch und Verschieben (R8.3)', () => {
  it('UC6-AK3 Tausch: zwei Ereignisse tausch mit gemeinsamer vorgang_id, je Topf mit netztopf_id und pflanzung_id, von und nach vertauscht', () => {
    const t = verschiebTeile();
    expect(gruende(t, '2.3.1', '2.3', 4)).toEqual([]);
    const r = verschiebVorgang(t, ziel('2.3.1', '2.3', 4), neueIds(), J, Z);
    expect(r.art).toBe('tausch');
    expect(r.text).toBe('Getauscht: 2.3.1 ↔ 2.3.4');
    expect(vorgangPruefen(r.vorgang)).toEqual([]);
    const e = neue(r.vorgang);
    expect(e).toHaveLength(2);
    expect(r.vorgang.every((s) => s.art === 'neu' && s.tabelle === 'ereignis')).toBe(true);
    const a = e.find((f) => f['netztopf_id'] === netztopfId('2.3.1'));
    const b = e.find((f) => f['netztopf_id'] === netztopfId('2.3.4'));
    expect(a).toMatchObject({ typ: 'tausch', pflanzung_id: EICHBLATT_23, gilt_ab: J.toISOString() });
    expect(b).toMatchObject({ typ: 'tausch', pflanzung_id: LOLLO_ALT, gilt_ab: J.toISOString() });
    const vorgangId = daten(a)['vorgang_id'];
    expect(typeof vorgangId).toBe('string');
    expect(vorgangId).not.toBe(a?.['id']);
    expect(daten(a)).toEqual({
      von_platz_id: platzId('2.3'),
      von_loch_nr: 1,
      nach_platz_id: platzId('2.3'),
      nach_loch_nr: 4,
      vorgang_id: vorgangId,
    });
    expect(daten(b)).toEqual({
      von_platz_id: platzId('2.3'),
      von_loch_nr: 4,
      nach_platz_id: platzId('2.3'),
      nach_loch_nr: 1,
      vorgang_id: vorgangId,
    });
    const nach = umsetzVorgangAnwenden(t, r.vorgang, J);
    expect(ortVon(nach, '2.3.1')).toMatchObject({ platz_id: platzId('2.3'), loch_nr: 4, ausser_heim: true });
    expect(ortVon(nach, '2.3.4')).toMatchObject({ platz_id: platzId('2.3'), loch_nr: 1, ausser_heim: true });
  });

  it('UC6-AK3 Verschieben auf ein Loch mit leerem Topf: zwei Ereignisse verschieben, der leere Topf ohne pflanzung_id ins frei gewordene Loch', () => {
    const t = verschiebTeile();
    expect(gruende(t, '2.3.1', '2.1', 5)).toEqual([]);
    const r = verschiebVorgang(t, ziel('2.3.1', '2.1', 5), neueIds(), J, Z);
    expect(r.art).toBe('verschieben');
    expect(r.text).toBe('Verschoben: 2.3.1 auf 2.1.5 · leeren Topf 2.1.5 in 2.3 Loch 1 stecken');
    expect(vorgangPruefen(r.vorgang)).toEqual([]);
    const e = neue(r.vorgang);
    expect(e.map((f) => f['typ'])).toEqual(['verschieben', 'verschieben']);
    const mit = e.find((f) => f['netztopf_id'] === netztopfId('2.3.1'));
    const leer = e.find((f) => f['netztopf_id'] === netztopfId('2.1.5'));
    expect(mit?.['pflanzung_id']).toBe(EICHBLATT_23);
    expect(daten(mit)).toEqual({
      von_platz_id: platzId('2.3'),
      von_loch_nr: 1,
      nach_platz_id: platzId('2.1'),
      nach_loch_nr: 5,
    });
    expect(leer?.['pflanzung_id'] ?? null).toBeNull();
    expect(daten(leer)).toEqual({
      von_platz_id: platzId('2.1'),
      von_loch_nr: 5,
      nach_platz_id: platzId('2.3'),
      nach_loch_nr: 1,
    });
    const nach = umsetzVorgangAnwenden(t, r.vorgang, J);
    expect(ortVon(nach, '2.3.1')).toMatchObject({ platz_id: platzId('2.1'), loch_nr: 5 });
    expect(ortVon(nach, '2.1.5')).toMatchObject({ platz_id: platzId('2.3'), loch_nr: 1 });
    expect((nach['v_pflanzung_zustand'] ?? []).find((z) => z['pflanzung_id'] === EICHBLATT_23)).toMatchObject(
      {
        platz_id: platzId('2.1'),
        loch_nr: 5,
        netztopf_id: netztopfId('2.3.1'),
      },
    );
  });

  it('UC6-AK3 Rückgängig storniert beide Ereignisse', () => {
    const t = verschiebTeile();
    const r = verschiebVorgang(t, ziel('2.3.1', '2.3', 4), neueIds(), J, Z);
    const zurueck = saatRueckgaengig(r.vorgang);
    expect(zurueck).toHaveLength(2);
    expect(zurueck.map((s) => (s.art === 'storno' ? s.clientId : ''))).toEqual(
      neue(r.vorgang)
        .map((f) => f['client_id'])
        .reverse(),
    );
    const nach = umsetzVorgangAnwenden(umsetzVorgangAnwenden(t, r.vorgang, J), zurueck, J);
    expect(ortVon(nach, '2.3.1')).toMatchObject({ loch_nr: 1, ausser_heim: false });
    expect(ortVon(nach, '2.3.4')).toMatchObject({ loch_nr: 4, ausser_heim: false });
  });
});

describe('UC6-AK8 anderes Gefäss nur bis 10 Tage nach dem Umsetzen (R8.4)', () => {
  it('UC6-AK8 Tag 10 nach dem Umsetzen: anderes Gefäss erlaubt', () => {
    const t = verschiebTeile();
    expect(umgesetztAm(t, EICHBLATT_23, Z)).toBe('2027-01-09');
    expect(gruende(t, '2.3.1', '2.1', 5)).toEqual([]);
    const a = verschiebAnsicht(t, 'R-2.3.1', J, Z);
    expect(a).toMatchObject({
      topf: { netztopfId: netztopfId('2.3.1'), kennung: '2.3.1', platzId: platzId('2.3'), lochNr: 1 },
      pflanzung: { pflanzungId: EICHBLATT_23, sorte: 'Eichblatt', umgesetztAm: '2027-01-09', tag: 10 },
      kopf: 'Topf 2.3.1 · Eichblatt · umgesetzt am 9.1.',
    });
    expect(a?.zielgefaesse[0]).toMatchObject({ platzId: platzId('2.3'), kennung: '2.3', erlaubt: true });
    expect(a?.zielgefaesse.find((g) => g.kennung === '2.1')).toMatchObject({ erlaubt: true });
    expect(a?.zielgefaesse.find((g) => g.kennung === '2.1')?.hinweis).toBeUndefined();
    expect(verschiebAnsicht(t, 'R-9.9.9', J, Z)).toBeUndefined();
  });

  it('UC6-AK8 Tag 11 nach dem Umsetzen: Grund wurzeln mit HINWEIS_WURZELN', () => {
    expect(HINWEIS_WURZELN).toBe('Wurzeln vermutlich verwachsen, nur innerhalb des Gefässes tauschen');
    const t = verschiebTeile(TAG11);
    const v = verschiebenPruefen(t, ziel('2.3.1', '2.1', 5), TAG11, Z);
    expect(v).toContainEqual({ feld: 'wurzeln', grund: HINWEIS_WURZELN });
    expect(verschiebVorgang(t, ziel('2.3.1', '2.1', 5), neueIds(), TAG11, Z).vorgang).toEqual([]);
    const a = verschiebAnsicht(t, 'R-2.3.1', TAG11, Z);
    expect(a?.pflanzung?.tag).toBe(11);
    expect(a?.zielgefaesse[0]).toMatchObject({ kennung: '2.3', erlaubt: true });
    expect(a?.zielgefaesse.find((g) => g.kennung === '2.1')).toMatchObject({
      erlaubt: false,
      hinweis: HINWEIS_WURZELN,
    });
    // keine Station unter den Zielgefässen, nur gleiche Topfgrösse (kein 3.x)
    expect(
      a?.zielgefaesse.map((g) => g.kennung).filter((k) => k.startsWith('4.') || k.startsWith('3.')),
    ).toEqual([]);
  });

  it('UC6-AK8 Grenze über die Sommerzeit: umgesetzt 21.3.2027, am 1.4.2027 Tag 11', () => {
    const t = verschiebTeile();
    // umsetzen von Eichblatt auf 21.3. 23:30 MEZ (22:30 UTC) verlegt
    for (const e of t['ereignis'] ?? [])
      if (e['typ'] === 'umsetzen' && e['pflanzung_id'] === EICHBLATT_23)
        e['gilt_ab'] = '2027-03-21T22:30:00.000Z';
    umsetzSichtenNachrechnen(t);
    expect(umgesetztAm(t, EICHBLATT_23, Z)).toBe('2027-03-21');
    // 31.3. 23:30 MESZ (21:30 UTC) = Tag 10; 1.4. 00:30 MESZ (22:30 UTC) = Tag 11
    expect(gruende(t, '2.3.1', '2.1', 5, new Date('2027-03-31T21:30:00Z'))).not.toContain('wurzeln');
    expect(gruende(t, '2.3.1', '2.1', 5, new Date('2027-03-31T22:30:00Z'))).toContain('wurzeln');
  });

  it('UC6-AK8 innerhalb des Gefässes kein Hinweis, Tausch erlaubt', () => {
    const t = verschiebTeile(TAG11);
    expect(gruende(t, '2.3.1', '2.3', 4, TAG11)).toEqual([]);
    expect(gruende(t, '2.3.1', '2.3', 2, TAG11)).toEqual([]);
    const r = verschiebVorgang(t, ziel('2.3.1', '2.3', 4), neueIds(), TAG11, Z);
    expect(r.art).toBe('tausch');
    expect(neue(r.vorgang)).toHaveLength(2);
  });
});

describe('R8.4 Bezug, Sperre und Wissenskarte', () => {
  it('R8.4 Direktsaat ohne umsetzen: Bezug ist der Saattag', () => {
    const t = verschiebTeile();
    expect(umgesetztAm(t, DIREKT, Z)).toBe('2027-01-05');
    // 5.1. + 10 = 15.1. erlaubt, 16.1. Tag 11
    expect(gruende(t, '3.1.1', '3.2', 1, new Date('2027-01-15T08:00:00Z'))).not.toContain('wurzeln');
    expect(gruende(t, '3.1.1', '3.2', 1, new Date('2027-01-16T08:00:00Z'))).toContain('wurzeln');
  });

  it('R8.4 Kurzprüfung mit ok false am Herkunftsort sperrt anderes Gefäss; spätere Kurzprüfung ok hebt auf', () => {
    const t = verschiebTeile();
    kurzpruefungDazu(t, '2.3', 'wurzeln', false, '2027-01-18T17:00:00.000Z');
    umsetzSichtenNachrechnen(t);
    expect(gruende(t, '2.3.1', '2.1', 5)).toContain('gesperrt');
    // innerhalb des Gefässes bleibt der Tausch erlaubt
    expect(gruende(t, '2.3.1', '2.3', 4)).toEqual([]);
    kurzpruefungDazu(t, '2.3', 'wurzeln', true, '2027-01-18T18:00:00.000Z');
    umsetzSichtenNachrechnen(t);
    expect(gruende(t, '2.3.1', '2.1', 5)).toEqual([]);
    // ein anderer Punkt mit Abweichung sperrt ebenso
    kurzpruefungDazu(t, '2.3', 'pumpe', false, '2027-01-18T19:00:00.000Z');
    umsetzSichtenNachrechnen(t);
    expect(gruende(t, '2.3.1', '2.1', 5)).toContain('gesperrt');
    // eine Abweichung in einem anderen Gefäss sperrt 2.3 nicht
    const u = verschiebTeile();
    kurzpruefungDazu(u, '1.1', 'wurzeln', false, '2027-01-18T17:00:00.000Z');
    umsetzSichtenNachrechnen(u);
    expect(gruende(u, '2.3.1', '2.1', 5)).toEqual([]);
  });

  it('R8.4 Tausch über zwei Gefässe prüft beide Töpfe', () => {
    // 2.3.1 (Tag 10) tauscht mit 2.1.6 (Eichblatt, umgesetzt 5.1., Tag 14)
    const t = verschiebTeile();
    expect(umgesetztAm(t, EICHBLATT_21, Z)).toBe('2027-01-05');
    expect(gruende(t, '2.3.1', '2.1', 6)).toContain('wurzeln');
    // am 15.1. sind beide höchstens Tag 10; eine Abweichung in 2.1 sperrt den Tausch trotzdem
    const frueh = new Date('2027-01-15T08:00:00Z');
    const u = verschiebTeile(frueh);
    expect(gruende(u, '2.3.1', '2.1', 6, frueh)).toEqual([]);
    kurzpruefungDazu(u, '2.1', 'wurzeln', false, '2027-01-14T17:00:00.000Z');
    umsetzSichtenNachrechnen(u);
    expect(gruende(u, '2.3.1', '2.1', 6, frueh)).toContain('gesperrt');
  });

  it('R8.4 Wissenskarte «Topf umsetzen» bei anderem Gefäss', () => {
    const t = verschiebTeile();
    expect(verschiebAnsicht(t, 'R-2.3.1', J, Z)?.wissenskarte?.text).toBe(WISSEN_TOPF_UMSETZEN);
    t['wissenseintrag'] = [];
    expect(verschiebAnsicht(t, 'R-2.3.1', J, Z)?.wissenskarte).toBeUndefined();
  });
});

describe('R8.3 nicht wählbare Ziele', () => {
  it('R8.3 aus oder auf eine Station abgelehnt mit Hinweis auf Umsetzen', () => {
    const t = verschiebTeile();
    // 2.1.2 steht mit Ochsenherz auf 4.2: verlässt die Station nur über Umsetzen
    const aus = verschiebenPruefen(t, ziel('2.1.2', '2.1', 5), J, Z);
    expect(aus.map((v) => v.feld)).toContain('station');
    expect(aus.find((v) => v.feld === 'station')?.grund).toMatch(/Umsetzen/);
    expect(gruende(t, '2.3.1', '4.2', 2)).toContain('station');
    expect(verschiebVorgang(t, ziel('2.3.1', '4.2', 2), neueIds(), J, Z).vorgang).toEqual([]);
  });

  it('R8.3 reservierter Topf und Loch mit abwesendem Heimtopf nicht wählbar', () => {
    const t = verschiebTeile();
    expect(gruende(t, '2.3.1', '2.3', 6)).toContain('reserviert');
    expect(gruende(t, '2.3.1', '2.1', 2)).toContain('abwesend');
    const in23 = verschiebZiele(t, netztopfId('2.3.1'), platzId('2.3'), J, Z);
    const nicht = (l: number) => in23.find((x) => x.lochNr === l)?.nichtWaehlbar === true;
    expect(nicht(6)).toBe(true);
    expect(nicht(1)).toBe(true);
    expect(nicht(4)).toBe(false);
    expect(nicht(2)).toBe(false);
    const in21 = verschiebZiele(t, netztopfId('2.3.1'), platzId('2.1'), J, Z);
    expect(in21.find((x) => x.lochNr === 2)?.nichtWaehlbar).toBe(true);
    expect(in21.find((x) => x.lochNr === 5)?.nichtWaehlbar ?? false).toBe(false);
  });

  it('R8.3 derselbe Topf als Ziel abgelehnt', () => {
    const t = verschiebTeile();
    expect(gruende(t, '2.3.1', '2.3', 1)).toContain('gleich');
    expect(verschiebVorgang(t, ziel('2.3.1', '2.3', 1), neueIds(), J, Z).vorgang).toEqual([]);
  });
});
