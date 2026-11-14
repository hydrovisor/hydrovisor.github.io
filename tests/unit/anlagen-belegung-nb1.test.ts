// Belegung der Anlage: fehlende Fälle aus #216 (Issue #219, Plan 219 Testliste NB1-AK10, A10). Teile aus
// tests/fixtures/saeen.ts (Regal R am 7.1.2027: Satz Lollo Rossa mit drei Pflanzungen auf 2.3 Loch 1 bis 3; Stationen
// 4.1 bis 4.5 als Konstantpegel mit fester Dosis; Direktsaat-Gefässe 3.1 bis 3.3). Keine Uhr, keine Personendaten.
//
// Vertrag (Plan 216): anlagenBelegung(teile, anlageId) zählt aktive Pflanzungen nicht stornierter Sätze; ohne
// Ortsereignis steht eine Pflanzung im Direktsaat-Gefäss ihres Satzes, sonst ohne Platz in der Box ihres Satzes.
// A10: Ein stornierter Satz liegt hier in den Teilen, obwohl das Bündel ihn wegen ohneStorno nicht lädt; die
// Topfpunkte aus deckelBelegung prüft dieser Test nicht.
import { describe, expect, it } from 'vitest';
import { anlagenBelegung } from '../../src/domain/anlage/belegung.ts';
import { platzId, uid } from '../fixtures/regal.ts';
import { ANLAGE_R, aufStation, saatTeile, SORTE } from '../fixtures/saeen.ts';

const JETZT = new Date('2027-01-07T08:00:00Z');
type Zeile = Record<string, unknown>;

const gefaess = (b: ReturnType<typeof anlagenBelegung>, kennung: string) => {
  const g = b.ebenen.flatMap((e) => e.gefaesse).find((x) => x.kennung === kennung);
  if (!g) throw new Error(`Gefäss ${kennung} fehlt`);
  return g;
};
const box = (b: ReturnType<typeof anlagenBelegung>, kennung: string) => {
  const x = b.boxen.find((y) => y.kennung === kennung);
  if (!x) throw new Error(`Box ${kennung} fehlt`);
  return x;
};

/** Satz mit Pflanzungen ohne Ortsereignis (v_pflanzung_zustand ohne platz_id), Direktsaat oder Box */
function satzOhneOrt(
  t: Record<string, Zeile[]>,
  e: { nr: number; sorteId: string; anzahl: number; direktsaat?: string; box?: string; storniert?: string },
): string[] {
  const satzId = uid('27', e.nr);
  const gilt = '2027-01-05T11:00:00.000Z';
  (t['satz'] ??= []).push({
    id: satzId,
    client_id: satzId,
    sorte_id: e.sorteId,
    saatgut_id: null,
    kulturform: 'babyleaf',
    anzuchtort_platz_id: e.box ? platzId(e.box) : null,
    direktsaat_platz_id: e.direktsaat ? platzId(e.direktsaat) : null,
    anzahl_schwaemme: e.anzahl,
    samen_je_schwamm: 3,
    saatdatum: '2027-01-05',
    gilt_ab: gilt,
    storniert_am: e.storniert ?? null,
  });
  const ids = Array.from({ length: e.anzahl }, (_, i) => uid('28', e.nr * 100 + i + 1));
  for (const id of ids) {
    (t['pflanzung'] ??= []).push({ id, client_id: id, satz_id: satzId, gilt_ab: gilt, storniert_am: null });
    (t['v_pflanzung_zustand'] ??= []).push({
      pflanzung_id: id,
      satz_id: satzId,
      phase: 'keimung',
      phase_seit: null,
      status: 'aktiv',
      netztopf_id: null,
      platz_id: null,
      loch_nr: null,
    });
  }
  return ids;
}

describe('NB1-AK10 anlagenBelegung', () => {
  it('NB1-AK10 Direktsaat ohne Ortsereignis zählt im Direktsaat-Gefäss als Pflanze und Sorte', () => {
    const t = saatTeile(JETZT);
    const leer = gefaess(anlagenBelegung(t, ANLAGE_R), '3.1');
    expect(leer).toMatchObject({ pflanzen: 0, sorten: [] });

    satzOhneOrt(t, { nr: 61, sorteId: SORTE.rucola, anzahl: 3, direktsaat: '3.1' });
    const b = anlagenBelegung(t, ANLAGE_R);
    const g = gefaess(b, '3.1');
    expect(g.pflanzen).toBe(3);
    expect(g.sorten).toEqual([{ sorte: 'Rucola', anzahl: 3 }]);
    // nur im eigenen Direktsaat-Gefäss, in keinem anderen und in keiner Box
    expect(gefaess(b, '3.2')).toMatchObject({ pflanzen: 0, sorten: [] });
    expect(gefaess(b, '3.3')).toMatchObject({ pflanzen: 0, sorten: [] });
    for (const x of b.boxen) expect(x).toMatchObject({ belegt: 0, sorten: [] });
    // der Satz in 2.3 bleibt unverändert
    expect(gefaess(b, '2.3')).toMatchObject({ pflanzen: 3, sorten: [{ sorte: 'Lollo Rossa', anzahl: 3 }] });
  });

  it('NB1-AK10 Pflanzungen eines stornierten Satzes zählen weder als Pflanze noch als Sorte noch im Inhalt der Box', () => {
    const t = saatTeile(JETZT);
    const vorher = anlagenBelegung(t, ANLAGE_R);
    const storniert = '2027-01-06T09:00:00.000Z';
    // stornierter Satz in der Box A2, ein stornierter Direktsaat-Satz in 3.2
    satzOhneOrt(t, { nr: 62, sorteId: SORTE.eichblatt, anzahl: 4, box: 'A2', storniert });
    satzOhneOrt(t, { nr: 63, sorteId: SORTE.rucola, anzahl: 2, direktsaat: '3.2', storniert });
    // stornierter Satz mit Pflanzungen auf einem Platz (2.1 Loch 1 und 2): Ortsereignis vorhanden
    const ids = satzOhneOrt(t, { nr: 64, sorteId: SORTE.ochsenherz, anzahl: 2, box: 'A1', storniert });
    ids.forEach((id, i) => {
      const z = (t['v_pflanzung_zustand'] ?? []).find((x) => x['pflanzung_id'] === id) as Zeile;
      z['platz_id'] = platzId('2.1');
      z['loch_nr'] = i + 1;
      z['phase'] = 'wachstum';
    });
    // dazu ein gültiger Satz in A2, damit die Box nicht nur leer ist
    satzOhneOrt(t, { nr: 65, sorteId: SORTE.cayenne, anzahl: 1, box: 'A2' });

    const b = anlagenBelegung(t, ANLAGE_R);
    expect(box(b, 'A2')).toMatchObject({ belegt: 1, sorten: [{ sorte: 'Cayenne', anzahl: 1 }] });
    expect(box(b, 'A1')).toMatchObject({ belegt: 0, sorten: [] });
    expect(gefaess(b, '3.2')).toMatchObject({ pflanzen: 0, sorten: [] });
    expect(gefaess(b, '2.1')).toMatchObject({ pflanzen: 0, sorten: [] });
    // keine Sorte eines stornierten Satzes irgendwo
    const alleSorten = [
      ...b.ebenen.flatMap((e) => e.gefaesse.flatMap((g) => g.sorten.map((s) => s.sorte))),
      ...b.boxen.flatMap((x) => x.sorten.map((s) => s.sorte)),
    ];
    expect(alleSorten).not.toContain('Eichblatt');
    expect(alleSorten).not.toContain('Ochsenherz');
    expect(alleSorten).not.toContain('Rucola');
    // Pflanzen je Gefäss wie vorher
    for (const e of b.ebenen)
      for (const g of e.gefaesse) expect(g.pflanzen, g.kennung).toBe(gefaess(vorher, g.kennung).pflanzen);
  });

  it('NB1-AK10 belegte Station mit fester Dosis zählt nach ihren Löchern', () => {
    const t = saatTeile(JETZT);
    const g41 = (t['gefaess'] ?? []).find((g) => g['platz_id'] === platzId('4.1')) as Zeile;
    expect(g41['feste_dosis']).toBe(true);
    const leer = gefaess(anlagenBelegung(t, ANLAGE_R), '4.1');
    expect(leer).toMatchObject({ loecher: 6, belegt: 0, reserviert: 0, frei: 6, pflanzen: 0 });

    aufStation(t, {
      satzNr: 66,
      sorteId: SORTE.rucola,
      saatdatum: '2027-01-02',
      loecher: [
        ['4.1', 1],
        ['4.1', 2],
        ['4.1', 4],
      ],
    });
    const b = anlagenBelegung(t, ANLAGE_R);
    const g = gefaess(b, '4.1');
    // die Station zählt nach den Löchern ihres Deckels, belegt nach den Pflanzungen darin
    expect(g).toMatchObject({
      loecher: 6,
      belegt: 3,
      reserviert: 0,
      frei: 3,
      pflanzen: 3,
      ohneGefaess: false,
    });
    expect(g.punkte).toEqual(['belegt', 'belegt', 'frei', 'belegt', 'frei', 'frei']);
    expect(g.sorten).toEqual([{ sorte: 'Rucola', anzahl: 3 }]);
    // Summe der Ebene 4 enthält die Station
    const e4 = b.ebenen.find((e) => e.ebene === 4);
    expect(e4?.belegt).toBe(3);
    expect(e4?.belegt).toBe(e4?.gefaesse.reduce((s, x) => s + x.belegt, 0));
  });
});
