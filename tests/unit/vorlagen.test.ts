// Vorlagen Box und Deckel (Plan 19 Testliste; UC2-AK1, UC2-AK2; Konzept 5.3, 5.4, 8.1 Regel 2, 3 und 9; R3.3,
// R9.3). Ohne Uhr: keine der Vorlagen-Funktionen ist zeitabhängig. Teile des Bündels in der Form von PostgREST.
import { describe, expect, it } from 'vitest';
import { vorgangPruefen } from '../../src/domain/datenpfad/erfassung.ts';
import {
  korrekturVorgang,
  loeschVorgang,
  nutzendePlaetze,
  vorlagenAusTeilen,
} from '../../src/domain/vorlagen/bestand.ts';
import {
  deckeltypPruefen,
  deckeltypSchritt,
  type DeckeltypEingabe,
} from '../../src/domain/vorlagen/deckeltyp.ts';
import {
  betriebsvolumenVorschlag,
  gefaessmodellPruefen,
  gefaessmodellSchritt,
  volumenPruefen,
  type GefaessmodellEingabe,
} from '../../src/domain/vorlagen/gefaessmodell.ts';
import { lochbild, lochzahl, loecherJeReiheLesen, randloecher } from '../../src/domain/vorlagen/lochbild.ts';
import { GEFAESSE, LOCHBILDER, lochbildtyp } from '../fixtures/lochbilder.ts';

const CLIENT = '19000000-0000-4000-8000-000000000001';
const CLIENT_NEU = '19000000-0000-4000-8000-000000000002';

/** Lochnummern je Reihe (Reihe 1 = vorne), innerhalb der Reihe nach Spalte */
function nummernJeReihe(reihen: number[]): number[][] {
  const loecher = lochbild(reihen);
  const anzahl = Math.max(0, ...loecher.map((l) => l.reihe));
  return Array.from({ length: anzahl }, (_, i) =>
    loecher
      .filter((l) => l.reihe === i + 1)
      .sort((a, b) => a.spalte - b.spalte)
      .map((l) => l.nr),
  );
}

const deckel = (teil: Partial<DeckeltypEingabe> = {}): DeckeltypEingabe => ({
  name: 'D6',
  topfdurchmesserCm: 5,
  loecherJeReihe: '2, 2, 2',
  serviceOeffnung: true,
  ...teil,
});

const box = (teil: Partial<GefaessmodellEingabe> = {}): GefaessmodellEingabe => ({
  name: 'Rako 40 × 30 × 27',
  form: 'rechteckig',
  laengeMm: '400',
  breiteMm: '300',
  hoeheMm: '270',
  nennvolumenL: '25',
  betriebsvolumenL: '20',
  fuellhoeheMm: '',
  ...teil,
});

describe('Lochbild', () => {
  it('UC2-AK1 «2, 2, 2» mit 5 cm ergibt 6 Löcher, Loch 1 vorne links, 1 bis 6 zeilenweise nach hinten', () => {
    const gelesen = loecherJeReiheLesen('2, 2, 2');
    expect(gelesen).toEqual({ ok: true, reihen: [2, 2, 2] });
    const reihen = [2, 2, 2];
    expect(lochzahl(reihen)).toBe(6);
    const loecher = lochbild(reihen);
    expect(loecher.map((l) => l.nr)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(loecher[0]).toMatchObject({ nr: 1, reihe: 1, spalte: 1 });
    expect(nummernJeReihe(reihen)).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
    expect(loecher.map((l) => [l.nr, l.reihe, l.spalte])).toEqual([
      [1, 1, 1],
      [2, 1, 2],
      [3, 2, 1],
      [4, 2, 2],
      [5, 3, 1],
      [6, 3, 2],
    ]);
    const schritt = deckeltypSchritt(deckel(), CLIENT);
    expect(schritt.art === 'neu' && schritt.felder['topfdurchmesser_mm']).toBe(50);
    expect(schritt.art === 'neu' && schritt.felder['loecher_je_reihe']).toEqual([2, 2, 2]);
  });

  it.each(['2,2,2', '2 2 2', '2-2-2', '  2, 2, 2  ', '2 ,  2 ,2'])(
    'UC2-AK1 Schreibweise «%s» ergibt dasselbe Lochbild wie «2, 2, 2» (A3)',
    (text) => {
      expect(loecherJeReiheLesen(text)).toEqual({ ok: true, reihen: [2, 2, 2] });
    },
  );

  it.each([
    ['leer', ''],
    ['nur Leerzeichen', '   '],
    ['leere Reihe', '2,,2'],
    ['Reihe mit 0 Löchern', '2, 0'],
    ['Buchstabe', '2, a'],
    ['Dezimalzahl', '2.5'],
    ['negative Zahl', '2, -1'],
    ['21 Reihen', Array(21).fill('1').join(', ')],
    ['21 Löcher in einer Reihe', '21'],
  ])('UC2-AK1 ungültige Eingabe «%s» meldet einen Verstoss mit Text, was gilt', (_fall, text) => {
    const gelesen = loecherJeReiheLesen(text);
    expect(gelesen.ok).toBe(false);
    if (gelesen.ok) return;
    expect(gelesen.verstoesse.length).toBeGreaterThan(0);
    for (const v of gelesen.verstoesse) expect(v.grund.trim().length).toBeGreaterThan(10);
  });

  it('UC2-AK1 die Grenzen 20 Reihen und 20 Löcher je Reihe sind erlaubt, der Text nennt sie (A4)', () => {
    expect(loecherJeReiheLesen(Array(20).fill('1').join(', '))).toEqual({
      ok: true,
      reihen: Array(20).fill(1),
    });
    expect(loecherJeReiheLesen('20')).toEqual({ ok: true, reihen: [20] });
    const reihen = loecherJeReiheLesen(Array(21).fill('1').join(', '));
    const loecher = loecherJeReiheLesen('21');
    expect(!reihen.ok && reihen.verstoesse.map((v) => v.grund).join(' ')).toMatch(/20/);
    expect(!loecher.ok && loecher.verstoesse.map((v) => v.grund).join(' ')).toMatch(/20/);
  });

  it.each(LOCHBILDER.map((t) => [t.name, t] as const))(
    'UC2-AK2 Lochnummern für D1, D2, D4, D3, D6, S8, S5 zeilenweise nach dem Lochbild: %s',
    (_name, typ) => {
      expect(loecherJeReiheLesen(typ.eingabe)).toEqual({ ok: true, reihen: typ.reihen });
      const anzahl = typ.nummern.flat().length;
      expect(lochzahl(typ.reihen)).toBe(anzahl);
      const loecher = lochbild(typ.reihen);
      expect(loecher).toHaveLength(anzahl);
      expect(nummernJeReihe(typ.reihen)).toEqual(typ.nummern);
      expect(loecher.find((l) => l.nr === 1)).toMatchObject({ reihe: 1, spalte: 1 });
      expect(Math.max(...loecher.map((l) => l.nr))).toBe(lochzahl(typ.reihen));
      // Nummern lückenlos 1 bis Lochzahl, jede genau einmal
      expect([...loecher.map((l) => l.nr)].sort((a, b) => a - b)).toEqual(
        Array.from({ length: anzahl }, (_, i) => i + 1),
      );
      const schritt = deckeltypSchritt(
        deckel({ name: typ.name, topfdurchmesserCm: typ.topfdurchmesserCm, loecherJeReihe: typ.eingabe }),
        CLIENT,
      );
      expect(schritt).toMatchObject({
        art: 'neu',
        tabelle: 'deckeltyp',
        felder: { name: typ.name, topfdurchmesser_mm: typ.topfdurchmesserMm, loecher_je_reihe: typ.reihen },
      });
    },
  );

  it('UC2-AK2 die 13 Gefässe nach UC2 zählen 84 Löcher: 22 × 8 cm und 22 × 5 cm auf 1 bis 3, 8 × 8 cm und 32 × 5 cm auf 4', () => {
    expect(GEFAESSE).toHaveLength(13);
    const summe = (ebenen: number[], mm: 50 | 80) =>
      GEFAESSE.filter((g) => ebenen.includes(g.ebene))
        .map((g) => lochbildtyp(g.deckel))
        .filter((t) => t.topfdurchmesserMm === mm)
        .reduce((s, t) => s + lochzahl(t.reihen), 0);
    expect(summe([1, 2, 3], 80)).toBe(22);
    expect(summe([1, 2, 3], 50)).toBe(22);
    expect(summe([4], 80)).toBe(8);
    expect(summe([4], 50)).toBe(32);
    expect(GEFAESSE.reduce((s, g) => s + lochzahl(lochbildtyp(g.deckel).reihen), 0)).toBe(84);
  });

  it('UC2 Randlöcher nach 8.1 Regel 9: «3, 3, 3» hat nur Loch 5 innen', () => {
    expect(randloecher([3, 3, 3])).toEqual([1, 2, 3, 4, 6, 7, 8, 9]);
    const loecher = lochbild([3, 3, 3]);
    expect(loecher.filter((l) => !l.randloch).map((l) => l.nr)).toEqual([5]);
    // Gangkante = Reihe 1 (vorne, R3.3)
    expect(loecher.filter((l) => l.gangkante).map((l) => l.nr)).toEqual([1, 2, 3]);
  });

  it('UC2 Randlöcher: ein einzelnes Loch ist Randloch und Gangkante', () => {
    expect(lochbild([1])).toEqual([{ nr: 1, reihe: 1, spalte: 1, randloch: true, gangkante: true }]);
    expect(randloecher([1])).toEqual([1]);
  });

  it('UC2 Gangkante: S8 alle vier Löcher an der Gangkante, S5: nur Loch 1; bei den sieben Typen sind alle Löcher Randlöcher', () => {
    expect(lochbild(lochbildtyp('S8').reihen).every((l) => l.gangkante)).toBe(true);
    expect(
      lochbild(lochbildtyp('S5').reihen)
        .filter((l) => l.gangkante)
        .map((l) => l.nr),
    ).toEqual([1]);
    for (const typ of LOCHBILDER) {
      expect(lochbild(typ.reihen).every((l) => l.randloch)).toBe(true);
      expect(randloecher(typ.reihen)).toHaveLength(lochzahl(typ.reihen));
    }
  });
});

describe('Volumen-Vorschlag und Eingabeprüfung', () => {
  it('UC2 Vorschlag rechteckig: 400 × 300 bei Füllhöhe 150 ergibt 18.0 l', () => {
    expect(betriebsvolumenVorschlag('rechteckig', 400, 300, 150, 270)).toEqual({ liter: 18 });
  });

  it('UC2 Vorschlag 365 × 135 × 70 rechteckig rundet auf 0.1 l ab: 3.4 l (A5)', () => {
    expect(betriebsvolumenVorschlag('rechteckig', 365, 135, 70, 110)).toEqual({ liter: 3.4 });
  });

  it('UC2 Vorschlag: oval ohne Vorschlag, Füllhöhe fehlt, Füllhöhe nicht kleiner als die Höhe', () => {
    expect(betriebsvolumenVorschlag('oval', 365, 135, 70, 110)).toEqual({ grund: 'oval' });
    expect(betriebsvolumenVorschlag('rechteckig', 400, 300, null, 270)).toEqual({
      grund: 'fuellhoehe_fehlt',
    });
    expect(betriebsvolumenVorschlag('rechteckig', 400, 300, 270, 270)).toEqual({
      grund: 'fuellhoehe_zu_gross',
    });
    expect(betriebsvolumenVorschlag('rechteckig', 400, 300, 280, 270)).toEqual({
      grund: 'fuellhoehe_zu_gross',
    });
  });

  it('UC2 R9.3 Betriebsvolumen muss kleiner als L · B · H sein: 32.4 l bei 400 × 300 × 270 nicht, 32.39 l schon', () => {
    const masse = { laengeMm: 400, breiteMm: 300, hoeheMm: 270 };
    expect(volumenPruefen(masse, 32.4)).not.toBeNull();
    expect(volumenPruefen(masse, 32.39)).toBeNull();
    expect(volumenPruefen(masse, 20)).toBeNull();
    expect(volumenPruefen(masse, 40)).not.toBeNull();
    expect(gefaessmodellPruefen(box({ betriebsvolumenL: '32.4' }), [])).not.toEqual([]);
    expect(gefaessmodellPruefen(box({ betriebsvolumenL: '32.39' }), [])).toEqual([]);
  });

  it.each([
    ['Betriebsvolumen 0', { betriebsvolumenL: '0' }],
    ['Betriebsvolumen negativ', { betriebsvolumenL: '-2' }],
    ['Betriebsvolumen leer', { betriebsvolumenL: '' }],
    ['Betriebsvolumen keine Zahl', { betriebsvolumenL: 'viel' }],
    ['Länge 0', { laengeMm: '0' }],
    ['Breite negativ', { breiteMm: '-300' }],
    ['Höhe nicht ganzzahlig', { hoeheMm: '270.5' }],
    ['Länge über 32767', { laengeMm: '32768' }],
    ['Höhe leer', { hoeheMm: '' }],
    ['Name leer', { name: '   ' }],
  ] as const)('UC2 R9.3 Eingabeprüfung Box: %s ist ein Verstoss', (_fall, teil) => {
    const verstoesse = gefaessmodellPruefen(box(teil), []);
    expect(verstoesse.length).toBeGreaterThan(0);
    for (const v of verstoesse) expect(v.grund.trim()).not.toBe('');
  });

  it('UC2 R9.3 gültige Box ohne Verstoss; Nennvolumen darf fehlen', () => {
    expect(gefaessmodellPruefen(box(), [])).toEqual([]);
    expect(gefaessmodellPruefen(box({ nennvolumenL: '' }), [])).toEqual([]);
    expect(
      gefaessmodellPruefen(
        box({
          form: 'oval',
          name: 'Leni Flori 36',
          laengeMm: '365',
          breiteMm: '135',
          hoeheMm: '110',
          betriebsvolumenL: '2.3',
        }),
        [],
      ),
    ).toEqual([]);
  });

  it('UC2 Dezimalkomma wird als Punkt gelesen (A7)', () => {
    expect(gefaessmodellPruefen(box({ betriebsvolumenL: '32,39' }), [])).toEqual([]);
    expect(gefaessmodellPruefen(box({ betriebsvolumenL: '32,4' }), [])).not.toEqual([]);
    const schritt = gefaessmodellSchritt(box({ betriebsvolumenL: '2,3', nennvolumenL: '3,7' }), CLIENT);
    expect(schritt).toMatchObject({ felder: { betriebsvolumen_l: 2.3, nennvolumen_l: 3.7 } });
  });

  it('UC2 R9.3 Topf nur 5 oder 8 cm, Name Pflicht, Lochbild gültig', () => {
    expect(deckeltypPruefen(deckel(), [])).toEqual([]);
    expect(deckeltypPruefen(deckel({ topfdurchmesserCm: 8 }), [])).toEqual([]);
    expect(deckeltypPruefen(deckel({ topfdurchmesserCm: null }), []).length).toBeGreaterThan(0);
    expect(deckeltypPruefen(deckel({ topfdurchmesserCm: 6 as unknown as 5 }), []).length).toBeGreaterThan(0);
    expect(deckeltypPruefen(deckel({ name: '' }), []).length).toBeGreaterThan(0);
    expect(deckeltypPruefen(deckel({ loecherJeReihe: '2, 0' }), []).length).toBeGreaterThan(0);
  });

  it('UC2 Name schon unter den aktiven Vorlagen derselben Art ist ein Verstoss (A6)', () => {
    const { deckel: bestandDeckel, modelle } = vorlagenAusTeilen({
      deckeltyp: [deckelZeile('d-1', 'D6')],
      gefaessmodell: [modellZeile('m-1', 'Rako 40 × 30 × 27')],
    });
    expect(deckeltypPruefen(deckel({ name: 'D6' }), bestandDeckel).length).toBeGreaterThan(0);
    expect(deckeltypPruefen(deckel({ name: 'D3' }), bestandDeckel)).toEqual([]);
    expect(gefaessmodellPruefen(box({ name: 'Rako 40 × 30 × 27' }), modelle).length).toBeGreaterThan(0);
    // derselbe Name bei der anderen Art stört nicht
    expect(gefaessmodellPruefen(box({ name: 'D6' }), modelle)).toEqual([]);
  });

  it('UC2 Namensprüfung (A6) unterscheidet Gross-/Kleinschreibung und Leerzeichen am Rand nicht', () => {
    const { deckel: bestandDeckel, modelle } = vorlagenAusTeilen({
      deckeltyp: [deckelZeile('d-1', 'D6')],
      gefaessmodell: [modellZeile('m-1', 'Rako 40 × 30 × 27')],
    });
    expect(deckeltypPruefen(deckel({ name: ' d6 ' }), bestandDeckel).length).toBeGreaterThan(0);
    expect(gefaessmodellPruefen(box({ name: 'rako 40 × 30 × 27' }), modelle).length).toBeGreaterThan(0);
  });
});

describe('Schritte für schreiben()', () => {
  it('UC2 deckeltypSchritt: eine neue Zeile deckeltyp mit client_id, ohne Server- und Zeitfelder', () => {
    const schritt = deckeltypSchritt(deckel({ serviceOeffnung: false }), CLIENT);
    expect(schritt).toEqual({
      art: 'neu',
      tabelle: 'deckeltyp',
      felder: {
        client_id: CLIENT,
        name: 'D6',
        topfdurchmesser_mm: 50,
        loecher_je_reihe: [2, 2, 2],
        service_oeffnung: false,
      },
    });
    expect(vorgangPruefen([schritt])).toEqual([]);
  });

  it('UC2 gefaessmodellSchritt: eine neue Zeile gefaessmodell, Füllhöhe wird nicht gespeichert', () => {
    const schritt = gefaessmodellSchritt(box({ fuellhoeheMm: '150' }), CLIENT);
    expect(schritt).toEqual({
      art: 'neu',
      tabelle: 'gefaessmodell',
      felder: {
        client_id: CLIENT,
        name: 'Rako 40 × 30 × 27',
        form: 'rechteckig',
        innen_l_mm: 400,
        innen_b_mm: 300,
        innen_h_mm: 270,
        nennvolumen_l: 25,
        betriebsvolumen_l: 20,
      },
    });
    expect(vorgangPruefen([schritt])).toEqual([]);
    const ohneNenn = gefaessmodellSchritt(box({ nennvolumenL: '' }), CLIENT);
    expect(ohneNenn.art === 'neu' && ohneNenn.felder['nennvolumen_l']).toBeNull();
  });

  it('UC2 TO2 dieselbe Eingabe mit derselben client_id ergibt denselben Schritt (idempotent)', () => {
    expect(deckeltypSchritt(deckel(), CLIENT)).toEqual(deckeltypSchritt(deckel(), CLIENT));
    expect(gefaessmodellSchritt(box(), CLIENT)).toEqual(gefaessmodellSchritt(box(), CLIENT));
  });
});

// --- Bestand und Nutzung ---------------------------------------------------------------------------

const ohneStorno = { storniert_am: null };

function deckelZeile(id: string, name: string, storniert_am: string | null = null) {
  return {
    id,
    client_id: `${id}-client`,
    name,
    topfdurchmesser_mm: 50,
    loecher_je_reihe: [2, 2, 2],
    service_oeffnung: true,
    storniert_am,
  };
}

function modellZeile(id: string, name: string, storniert_am: string | null = null) {
  return {
    id,
    client_id: `${id}-client`,
    name,
    form: 'rechteckig',
    innen_l_mm: 400,
    innen_b_mm: 300,
    innen_h_mm: 270,
    // numeric kommt von PostgREST als Text
    nennvolumen_l: '25.00',
    betriebsvolumen_l: '20.00',
    storniert_am,
  };
}

const platz = (id: string, kennung: string) => ({
  id,
  anlage_id: 'anlage-1',
  kennung,
  rolle: 'gefaess',
  aktiv: true,
  ...ohneStorno,
});

const gefaess = (
  id: string,
  platzId: string,
  modellId: string,
  deckelId: string,
  extra: { gueltig_bis?: string | null; storniert_am?: string | null } = {},
) => ({
  id,
  platz_id: platzId,
  gefaessmodell_id: modellId,
  deckeltyp_id: deckelId,
  gueltig_bis: null,
  storniert_am: null,
  ...extra,
});

describe('Bestand und Nutzung', () => {
  it('UC2 vorlagenAusTeilen: nur nicht stornierte, nach Name, numeric als Zahl', () => {
    const { modelle, deckel: liste } = vorlagenAusTeilen({
      gefaessmodell: [
        modellZeile('m-2', 'Rako 40 × 30 × 27'),
        modellZeile('m-1', 'Leni Flori 36'),
        modellZeile('m-3', 'Alt', '2026-11-02T10:00:00Z'),
      ],
      deckeltyp: [
        deckelZeile('d-2', 'S5'),
        deckelZeile('d-1', 'D6'),
        deckelZeile('d-3', 'D1', '2026-11-02T10:00:00Z'),
      ],
    });
    expect(modelle.map((m) => m.name)).toEqual(['Leni Flori 36', 'Rako 40 × 30 × 27']);
    expect(liste.map((d) => d.name)).toEqual(['D6', 'S5']);
    expect(modelle[0]?.betriebsvolumen_l).toBe(20);
    expect(modelle[0]?.nennvolumen_l).toBe(25);
  });

  it('UC2 vorlagenAusTeilen ohne Teile liefert leere Listen', () => {
    expect(vorlagenAusTeilen(undefined)).toEqual({ modelle: [], deckel: [] });
    expect(vorlagenAusTeilen({})).toEqual({ modelle: [], deckel: [] });
  });

  it('UC2 nutzendePlaetze: aktive und geschlossene Belegungen zählen (A8), stornierte nicht; Kennungen sortiert und einmal', () => {
    const teile = {
      platz: [platz('p-21', '2.1'), platz('p-22', '2.2'), platz('p-23', '2.3'), platz('p-31', '3.1')],
      gefaess: [
        gefaess('g-23', 'p-23', 'm-1', 'd-2'),
        gefaess('g-21', 'p-21', 'm-1', 'd-2'),
        // geschlossene Belegung (neue Belegung wegen Volumen) am selben Platz: 2.1 nur einmal
        gefaess('g-21a', 'p-21', 'm-1', 'd-2', { gueltig_bis: '2026-11-03T10:00:00Z' }),
        // geschlossene Belegung an einem anderen Platz zählt auch (A8)
        gefaess('g-31', 'p-31', 'm-2', 'd-3', { gueltig_bis: '2026-11-03T10:00:00Z' }),
        // storniertes Gefäss zählt nicht
        gefaess('g-22', 'p-22', 'm-1', 'd-4', { storniert_am: '2026-11-03T10:00:00Z' }),
      ],
    };
    expect(nutzendePlaetze(teile, 'deckeltyp', 'd-2')).toEqual(['2.1', '2.3']);
    expect(nutzendePlaetze(teile, 'deckeltyp', 'd-3')).toEqual(['3.1']);
    expect(nutzendePlaetze(teile, 'deckeltyp', 'd-4')).toEqual([]);
    expect(nutzendePlaetze(teile, 'deckeltyp', 'd-9')).toEqual([]);
    expect(nutzendePlaetze(teile, 'gefaessmodell', 'm-1')).toEqual(['2.1', '2.3']);
    expect(nutzendePlaetze(teile, 'gefaessmodell', 'm-2')).toEqual(['3.1']);
    expect(nutzendePlaetze(undefined, 'gefaessmodell', 'm-1')).toEqual([]);
  });

  it('UC2 loeschVorgang: genau ein Storno der Vorlage (8.1 Regel 3)', () => {
    for (const art of ['deckeltyp', 'gefaessmodell'] as const) {
      const vorgang = loeschVorgang(art, CLIENT);
      expect(vorgang).toHaveLength(1);
      expect(vorgang[0]).toMatchObject({ art: 'storno', tabelle: art, clientId: CLIENT });
      const grund = vorgang[0]?.art === 'storno' ? vorgang[0].grund : undefined;
      expect(['rueckgaengig', 'korrektur', 'fehleingabe']).toContain(grund);
      expect(vorgangPruefen(vorgang)).toEqual([]);
    }
  });

  it('UC2 korrekturVorgang: Storno der alten Zeile, dann die neue mit anderer client_id (8.1 Regel 2)', () => {
    const neu = deckeltypSchritt(deckel({ name: 'D6 neu' }), CLIENT_NEU);
    const vorgang = korrekturVorgang('deckeltyp', CLIENT, neu);
    expect(vorgang).toHaveLength(2);
    expect(vorgang[0]).toEqual({ art: 'storno', tabelle: 'deckeltyp', clientId: CLIENT, grund: 'korrektur' });
    expect(vorgang[1]).toEqual(neu);
    expect(vorgang[1]?.art === 'neu' && vorgang[1].felder.client_id).not.toBe(CLIENT);
    expect(vorgangPruefen(vorgang)).toEqual([]);

    const neuBox = gefaessmodellSchritt(box({ betriebsvolumenL: '18' }), CLIENT_NEU);
    const boxVorgang = korrekturVorgang('gefaessmodell', CLIENT, neuBox);
    expect(boxVorgang.map((s) => [s.art, s.tabelle])).toEqual([
      ['storno', 'gefaessmodell'],
      ['neu', 'gefaessmodell'],
    ]);
  });
});
