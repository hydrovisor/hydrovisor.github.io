// Abhakliste Lösungswechsel: Vorgänge für schreiben() (Plan 29 Testliste abhakliste-vorgaenge, «Schreibweg», A4, A10,
// A24; Konzept 8.1 Regel 2, 8.1 Regel 7, 11.4; Fachregeln G5, R4.6, R4.7). Injizierte Uhr, Zeitzone Europe/Zurich.
// Rechenbeispiel 2.3 aus Konzept R4.2 und UC7-AK1: 9 l, Wachstum, Zielbereich 1.0 bis 1.4, Wasser 0.5, k 0.3,
// Teil-Dosis 100 % → Micro 7.0, Grow 10.5, Bloom 3.5 ml.
//
// Vertrag (src/domain/abhakliste/vorgaenge.ts):
//   kopfVorgang(stand, k: KopfAngaben, ids): { vorgang; stand }
//   schrittVorgang(stand, nr, ids): { vorgang; stand }
//   abwahlVorgang(vorher, nr): Vorgang
//   abbruchVorgang(stand, ids, jetzt): Vorgang
//   abschlussVorgang(stand, { ecErwartetFinal? (Hundertstel); kVorschlag? (Tausendstel); echt }, ids): { vorgang; stand }
// Die Datenbank führt status, abgeschlossen_am, timer_ende, dauer_s, kontrollmessung_id, endmessung_id nach; die App
// schreibt sie nie (ausser timer_ende beim Insert der pH-Korrektur).
import { describe, expect, it } from 'vitest';
import {
  abhaken,
  abwaehlen,
  defsUebernehmen,
  mengeAendern,
  messungZuordnen,
  standNeu,
  type AblaufMessung,
  type AblaufStand,
} from '../../src/domain/abhakliste/stand.ts';
import {
  abbruchVorgang,
  abschlussVorgang,
  abwahlVorgang,
  kopfVorgang,
  schrittVorgang,
  type KopfAngaben,
} from '../../src/domain/abhakliste/vorgaenge.ts';
import { zeilenAus, type ZeileDef } from '../../src/domain/abhakliste/zeilen.ts';
import type { Schritt, Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import { pruefschritt4Vorgang } from '../../src/domain/etikett/pruefung.ts';
import type { Kalibrierstand } from '../../src/domain/kalibrierung/stand.ts';
import type { RestdosisErgebnis } from '../../src/domain/rechner-korrektur.ts';
import { neuansatz, type NeuansatzErgebnis } from '../../src/domain/rechner.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';

// 12.1.2027 18:30 Zürich
const T0 = new Date('2027-01-12T17:30:00.000Z');
const PLATZ = '2b000000-0000-4000-8000-000000000005';
const ANSATZ = '29000000-0000-4000-8000-000000000001';
const MESSGERAET = '23000000-0000-4000-8000-000000000001';
const PFLANZUNGEN = ['33000000-0000-4000-8000-000000000001', '33000000-0000-4000-8000-000000000002'];
const K = { grow: 300, micro_hard_water: 300, bloom: 300 } as const;

/** fester ids-Zähler: gleiche Wiederholung, gleiche client_id (TO2) */
function zaehler(praefix = '4b'): () => string {
  let n = 0;
  return () => {
    n += 1;
    return `${praefix}000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  };
}

function rechnung(): NeuansatzErgebnis {
  const r = neuansatz({
    volumen: 900,
    stadium: 'wachstum',
    zielbereich: { min: 100, max: 140 },
    ecWasser: 50,
    k: K,
    teilDosis: 100,
    istStation: false,
    ueberHerstellerdosisBestaetigt: false,
  });
  if (r.art !== 'ergebnis') throw new Error('Rechnung erwartet');
  return r;
}

const GUELTIG: Kalibrierstand = {
  art: 'gueltig',
  letzte: '2027-01-11T07:00:00.000Z',
  faelligAm: '2027-01-31',
};

function defs(restdosis?: RestdosisErgebnis): ZeileDef[] {
  return zeilenAus(
    {
      rechnung: rechnung(),
      ersterAnsatz: false,
      volumen: 900,
      kalibrierung: GUELTIG,
      festeTermine: ['2027-01-31'],
      phZiel: 625,
      ...(restdosis ? { restdosis } : {}),
    },
    T0,
    ZEITZONE,
  );
}

/** Restdosis nach der Kontrollmessung in Zehnteln ml: Micro 0.5, Grow 1.0, Bloom 0.5 */
const RESTDOSIS = {
  mengen: { grow: 10, micro_hard_water: 5, bloom: 5 },
  ecSollIst: 120,
  abweichung: 10,
  kIst: 290,
  hinweise: [],
} as unknown as RestdosisErgebnis;

const KOPF: KopfAngaben = {
  volumen: 900,
  pflanzungIds: PFLANZUNGEN,
  schnappschuss: {
    zielbereich: { ph_min: 6.0, ph_max: 6.5, ec_min: 1.0, ec_max: 1.4 },
    betriebsart: 'dwc',
    k: { grow: 0.3, micro_hard_water: 0.3, bloom: 0.3 },
  },
  ecWasser: 50,
  rechnung: rechnung(),
  messgeraetId: MESSGERAET,
};

const MESSUNG: Readonly<Record<number, AblaufMessung>> = {
  3: {
    id: '24000000-0000-4000-8000-000000000301',
    ec: 50,
    temperatur: 2000,
    giltAb: '2027-01-12T17:33:00.000Z',
  },
  14: { id: '24000000-0000-4000-8000-000000000314', ph: 620, ec: 110, temperatur: 2000 },
  17: { id: '24000000-0000-4000-8000-000000000317', ph: 620, ec: 120, temperatur: 2000 },
};

const ZUSTANDSSPALTEN = [
  'status',
  'abgeschlossen_am',
  'timer_ende',
  'dauer_s',
  'kontrollmessung_id',
  'endmessung_id',
] as const;

type Neu = Extract<Schritt, { art: 'neu' }>;
const neue = (v: Vorgang) => v.filter((s): s is Neu => s.art === 'neu');
const tabellen = (v: Vorgang) => v.map((s) => `${s.art}:${s.tabelle}`);
const zeitNach = (nr: number) => {
  // Timerzeilen 11, 13, 16 erst nach 15 min; sonst je eine Minute
  let t = T0.getTime();
  for (let i = 1; i <= nr; i += 1) t += (i === 11 || i === 13 || i === 16 ? 16 : 1) * 60_000;
  return new Date(t);
};

function neuStand(d: readonly ZeileDef[] = defs()): AblaufStand {
  return standNeu({ platzId: PLATZ, code: 'R-2.3', ansatzId: ANSATZ, defs: d }, T0);
}

/** hakt eine Zeile ab (Messzeilen mit Messung), wie die Maske Ansatz */
function haken(s: AblaufStand, nr: number): AblaufStand {
  const m = MESSUNG[nr];
  const neu = abhaken(m ? messungZuordnen(s, nr, m) : s, nr, zeitNach(nr));
  if (neu.zeilen.find((z) => z.nr === nr)?.erledigtAm === undefined)
    throw new Error(`Zeile ${nr} nicht abgehakt`);
  return neu;
}

interface Lauf {
  stand: AblaufStand;
  vorgaenge: Record<number, Vorgang>;
}

/**
 * Durchlauf wie nachziehen() in der Maske: Zeilen 0 bis 3 nur lokal, Zeile 4 schreibt den Kopf, danach je Zeile ein
 * schrittVorgang, Zeile 17 den Abschluss. Nach Zeile 14 übernimmt der Stand die Restdosis.
 */
function durchlauf(
  ids: () => string,
  bisNr = 17,
  abschluss: { ecErwartetFinal?: number; kVorschlag?: number; echt: boolean } = {
    ecErwartetFinal: 120,
    kVorschlag: 280,
    echt: true,
  },
): Lauf {
  let s = neuStand();
  const vorgaenge: Record<number, Vorgang> = {};
  for (let nr = 0; nr <= bisNr; nr += 1) {
    if (nr === 12) s = mengeAendern(s, 12, 10, zeitNach(12));
    s = haken(s, nr);
    if (nr === 14) s = defsUebernehmen(s, defs(RESTDOSIS));
    if (nr < 4) {
      vorgaenge[nr] = schrittVorgang(s, nr, ids).vorgang;
      continue;
    }
    const r =
      nr === 4
        ? kopfVorgang(s, KOPF, ids)
        : nr === 17
          ? abschlussVorgang(s, abschluss, ids)
          : schrittVorgang(s, nr, ids);
    vorgaenge[nr] = r.vorgang;
    s = r.stand;
  }
  return { stand: s, vorgaenge };
}

describe('Vor Zeile 4 (A4)', () => {
  it('Loesungswechsel-AK3 vor Zeile 4 kein Vorgang: Haken, Abwahl und Abbruch schreiben nichts', () => {
    const ids = zaehler();
    let s = neuStand();
    for (let nr = 0; nr <= 3; nr += 1) {
      s = haken(s, nr);
      expect(schrittVorgang(s, nr, ids).vorgang, `Zeile ${nr}`).toEqual([]);
    }
    expect(s.kopfGeschrieben).toBe(false);
    expect(abwahlVorgang(s, 3)).toEqual([]);
    expect(abbruchVorgang(s, ids, zeitNach(4))).toEqual([]);
    // abgewählt vor dem Kopf: ebenfalls nichts
    expect(abwahlVorgang(abwaehlen(s, 3, zeitNach(4)), 2)).toEqual([]);
  });

  it('Loesungswechsel-AK3 einzige Ausnahme vor Zeile 4 ist pruefschritt4Vorgang (Kannen zählen), ohne Ansatztabellen', () => {
    const v = pruefschritt4Vorgang(
      {} as Parameters<typeof pruefschritt4Vorgang>[0],
      PLATZ,
      9,
      false,
      zaehler('4c'),
      zeitNach(2),
    );
    expect(v.length).toBeGreaterThan(0);
    for (const t of tabellen(v))
      expect(t).not.toMatch(/naehrloesungsansatz|ansatz_schritt|ansatz_position|messung/);
  });
});

describe('Kopf beim Haken von Zeile 4 (A4)', () => {
  it('Loesungswechsel-AK3 Kopf schreibt naehrloesungsansatz vor messung und ansatz_schritt (Reihenfolge der Fremdschlüssel)', () => {
    const { vorgaenge } = durchlauf(zaehler(), 4);
    const v = vorgaenge[4] ?? [];
    expect(v.every((s) => s.art === 'neu')).toBe(true);
    expect(tabellen(v)).toEqual([
      'neu:naehrloesungsansatz',
      'neu:messung',
      'neu:ansatz_schritt',
      'neu:ansatz_schritt',
      'neu:ansatz_schritt',
      'neu:ansatz_schritt',
      'neu:ansatz_schritt',
    ]);
    const schritte = neue(v).filter((s) => s.tabelle === 'ansatz_schritt');
    expect(schritte.map((s) => s.felder['nr'])).toEqual([0, 1, 2, 3, 4]);
    for (const s of schritte) {
      expect(s.felder['ansatz_id']).toBe(ANSATZ);
      expect(s.felder['erledigt_am']).toBe(zeitNach(s.felder['nr'] as number).toISOString());
    }
  });

  it('Loesungswechsel-AK3 alle Zeilen mit id = client_id, der Kopf mit id = ansatzId', () => {
    const { vorgaenge } = durchlauf(zaehler());
    const alle = Object.values(vorgaenge).flatMap((v) => neue(v));
    expect(alle.length).toBeGreaterThan(0);
    for (const s of alle) expect(s.felder['id'], s.tabelle).toBe(s.felder.client_id);
    const kopf = neue(vorgaenge[4] ?? [])[0];
    expect(kopf?.felder['id']).toBe(ANSATZ);
  });

  it('Loesungswechsel-AK3 Kopf ohne die sechs Zustandsspalten (8.1 Regel 2), mit den Werten der Rechnung', () => {
    const { vorgaenge } = durchlauf(zaehler(), 4);
    const kopf = neue(vorgaenge[4] ?? [])[0];
    expect(kopf?.tabelle).toBe('naehrloesungsansatz');
    const f = kopf?.felder ?? ({} as Record<string, unknown>);
    for (const spalte of ZUSTANDSSPALTEN) expect(Object.keys(f), spalte).not.toContain(spalte);
    expect(f['typ']).toBe('neuansatz');
    expect(f['platz_id']).toBe(PLATZ);
    expect(f['volumen_l']).toBe(9);
    // begonnen_am = Haken von Zeile 1
    expect(f['begonnen_am']).toBe(zeitNach(1).toISOString());
    expect(f['gerechnet_fuer']).toEqual(PFLANZUNGEN);
    expect(f['ec_wasser']).toBe(0.5);
    expect(f['teil_dosis']).toBe(1);
    expect(f['ist_ersteinstellung']).toBe(false);
  });

  it('Loesungswechsel-AK3 Frischwassermessung mit ansatz_id, gilt_ab der Messung und ohne pH', () => {
    const { vorgaenge } = durchlauf(zaehler(), 4);
    const m = neue(vorgaenge[4] ?? []).find((s) => s.tabelle === 'messung');
    expect(m?.felder['id']).toBe(MESSUNG[3]?.id);
    expect(m?.felder['messart']).toBe('frischwasser');
    expect(m?.felder['ansatz_id']).toBe(ANSATZ);
    expect(m?.felder['platz_id']).toBe(PLATZ);
    expect(m?.felder['messgeraet_id']).toBe(MESSGERAET);
    expect(m?.felder['gilt_ab']).toBe(MESSUNG[3]?.giltAb);
    expect(m?.felder['ec']).toBe(0.5);
    expect(m?.felder['temperatur']).toBe(20);
    expect(m?.felder['ph'] ?? null).toBeNull();
  });
});

describe('Schritte nach dem Kopf (A10)', () => {
  it('Loesungswechsel-AK3 Dosierzeilen 5, 7, 9 schreiben je eine Position vor dem Schritt mit Soll, Ist und Bezugsvolumen', () => {
    const { vorgaenge } = durchlauf(zaehler(), 9);
    const erwartet: Record<number, [string, number]> = {
      5: ['micro_hard_water', 7.0],
      7: ['grow', 10.5],
      9: ['bloom', 3.5],
    };
    for (const [nr, [produkt, ml]] of Object.entries(erwartet)) {
      const v = vorgaenge[Number(nr)] ?? [];
      expect(tabellen(v), `Zeile ${nr}`).toEqual(['neu:ansatz_position', 'neu:ansatz_schritt']);
      const [pos, schritt] = neue(v);
      expect(pos?.felder).toMatchObject({
        ansatz_id: ANSATZ,
        produkt_id: produkt,
        soll_ml: ml,
        ist_ml: ml,
        bezugsvolumen_l: 9,
      });
      expect(schritt?.felder).toMatchObject({ ansatz_id: ANSATZ, nr: Number(nr), soll_ml: ml, ist_ml: ml });
    }
    // Spülen ohne Position
    expect(tabellen(vorgaenge[6] ?? [])).toEqual(['neu:ansatz_schritt']);
  });

  it('Loesungswechsel-AK3 Zeile 12 schreibt ph_minus_ml im Schritt und eine Position ph_minus', () => {
    const { vorgaenge } = durchlauf(zaehler(), 12);
    const v = neue(vorgaenge[12] ?? []);
    expect(v.map((s) => s.tabelle)).toEqual(['ansatz_position', 'ansatz_schritt']);
    expect(v[0]?.felder).toMatchObject({ produkt_id: 'ph_minus', ist_ml: 1.0, ansatz_id: ANSATZ });
    expect(v[1]?.felder).toMatchObject({
      nr: 12,
      schritt: 'ph_einstellen',
      ph_minus_ml: 1.0,
      soll_ml: null,
      ist_ml: null,
    });
  });

  it('Loesungswechsel-AK3 die Restdosis in Zeile 15 ergibt eine zweite Position je Komponente', () => {
    const { vorgaenge } = durchlauf(zaehler(), 15);
    const v = neue(vorgaenge[15] ?? []);
    const pos15 = v.filter((s) => s.tabelle === 'ansatz_position');
    expect(pos15.map((s) => s.felder['produkt_id']).sort()).toEqual(['bloom', 'grow', 'micro_hard_water']);
    const rest: Record<string, number> = { micro_hard_water: 0.5, grow: 1.0, bloom: 0.5 };
    for (const p of pos15)
      expect(p.felder).toMatchObject({
        ansatz_id: ANSATZ,
        soll_ml: rest[p.felder['produkt_id'] as string],
        ist_ml: rest[p.felder['produkt_id'] as string],
        bezugsvolumen_l: 9,
      });
    expect(v.at(-1)?.felder).toMatchObject({ nr: 15, schritt: 'restdosis', soll_ml: 2.0 });
    // je Komponente genau zwei Positionen im ganzen Ablauf (Hauptdosis und Restdosis)
    const alle = Object.values(vorgaenge)
      .flatMap((x) => neue(x))
      .filter((s) => s.tabelle === 'ansatz_position' && s.felder['produkt_id'] !== 'ph_minus');
    for (const k of ['micro_hard_water', 'grow', 'bloom'])
      expect(
        alle.filter((s) => s.felder['produkt_id'] === k),
        k,
      ).toHaveLength(2);
  });

  it('Loesungswechsel-AK3 kein Schritt schreibt eine Zustandsspalte von naehrloesungsansatz', () => {
    const { vorgaenge } = durchlauf(zaehler());
    for (const s of Object.values(vorgaenge).flat()) {
      if (s.tabelle !== 'naehrloesungsansatz' || s.art === 'storno') continue;
      for (const spalte of ZUSTANDSSPALTEN) expect(Object.keys(s.felder), spalte).not.toContain(spalte);
    }
  });
});

describe('Abwahl (Korrektur = Storno plus neue Zeile)', () => {
  it('Loesungswechsel-AK1 Abwahl einer Dosierzeile storniert Schritt und Position mit Grund korrektur', () => {
    const lauf = durchlauf(zaehler(), 5);
    const z5 = lauf.stand.zeilen.find((z) => z.nr === 5);
    const v = abwahlVorgang(lauf.stand, 5);
    expect(v).toEqual([
      { art: 'storno', tabelle: 'ansatz_schritt', clientId: z5?.schrittClientId, grund: 'korrektur' },
      ...(z5?.positionClientIds ?? []).map((id) => ({
        art: 'storno',
        tabelle: 'ansatz_position',
        clientId: id,
        grund: 'korrektur',
      })),
    ]);
    expect(z5?.positionClientIds).toHaveLength(1);
  });

  it('Loesungswechsel-AK1 Abwahl von Zeile 4 storniert Kopf, Frischwassermessung und Schritte 0 bis 4', () => {
    const lauf = durchlauf(zaehler(), 4);
    const kopf = lauf.vorgaenge[4] ?? [];
    const v = abwahlVorgang(lauf.stand, 4);
    expect(v.every((s) => s.art === 'storno' && s.grund === 'korrektur')).toBe(true);
    const storniert = v.map((s) => (s.art === 'storno' ? `${s.tabelle}:${s.clientId}` : ''));
    expect(storniert.sort()).toEqual(
      neue(kopf)
        .map((s) => `${s.tabelle}:${s.felder.client_id}`)
        .sort(),
    );
    // der Kopf zuletzt (Fremdschlüssel der Schritte und der Messung)
    expect(v.at(-1)).toMatchObject({ tabelle: 'naehrloesungsansatz', clientId: ANSATZ });
  });

  it('Loesungswechsel-AK1 nach der Abwahl von Zeile 4 schreibt das neue Abhaken mit neuen IDs', () => {
    const ids = zaehler();
    const lauf = durchlauf(ids, 4);
    const alt = new Set(neue(lauf.vorgaenge[4] ?? []).map((s) => s.felder.client_id));
    let s = abwaehlen(lauf.stand, 4, zeitNach(5));
    // wie die Maske: neuer Kopf und neue Frischwassermessung, kein Kopf geschrieben
    const neueAnsatzId = ids();
    s = {
      ...s,
      ansatzId: neueAnsatzId,
      kopfGeschrieben: false,
      ...(s.frischwasser ? { frischwasser: { ...s.frischwasser, id: ids() } } : {}),
    };
    s = abhaken(s, 4, zeitNach(6));
    const v = kopfVorgang(s, KOPF, ids).vorgang;
    expect(tabellen(v)[0]).toBe('neu:naehrloesungsansatz');
    for (const x of neue(v))
      expect(alt.has(x.felder.client_id), `${x.tabelle} ${x.felder.client_id}`).toBe(false);
    for (const x of neue(v).filter((y) => y.tabelle !== 'naehrloesungsansatz'))
      expect(x.felder['ansatz_id']).toBe(neueAnsatzId);
  });
});

describe('Abbruch und Abschluss', () => {
  it('Loesungswechsel-AK4 der Abbruch schreibt abbruch mit der nächsten offenen nr', () => {
    const lauf = durchlauf(zaehler(), 7);
    const jetzt = new Date(zeitNach(7).getTime() + 60_000);
    const v = abbruchVorgang(lauf.stand, zaehler('4d'), jetzt);
    expect(tabellen(v)).toEqual(['neu:ansatz_schritt']);
    const f = neue(v)[0]?.felder ?? ({} as Record<string, unknown>);
    expect(f).toMatchObject({
      ansatz_id: ANSATZ,
      nr: 8,
      schritt: 'abbruch',
      erledigt_am: jetzt.toISOString(),
    });
    expect(f['id']).toBe(f['client_id']);
  });

  it('Loesungswechsel-AK4 nach Zeile 17 gibt es keinen Abbruch mehr', () => {
    const lauf = durchlauf(zaehler());
    expect(abbruchVorgang(lauf.stand, zaehler('4d'), zeitNach(18))).toEqual([]);
  });

  it('Loesungswechsel-AK4 der Abschluss setzt nur ec_erwartet_final und k_vorschlag, danach Schritt 17', () => {
    const { vorgaenge } = durchlauf(zaehler());
    const v = vorgaenge[17] ?? [];
    expect(tabellen(v)).toEqual(['setzen:naehrloesungsansatz', 'neu:ansatz_schritt']);
    const setzen = v[0];
    expect(setzen).toEqual({
      art: 'setzen',
      tabelle: 'naehrloesungsansatz',
      clientId: ANSATZ,
      felder: { ec_erwartet_final: 1.2, k_vorschlag: 0.28 },
    });
    expect(neue(v)[0]?.felder).toMatchObject({ nr: 17, schritt: 'endmessung', ansatz_id: ANSATZ });
  });

  it('Loesungswechsel-AK4 G5 Demo-Anlage: k_vorschlag bleibt leer, ec_erwartet_final wird gesetzt', () => {
    const { vorgaenge } = durchlauf(zaehler(), 17, { ecErwartetFinal: 120, kVorschlag: 280, echt: false });
    const setzen = (vorgaenge[17] ?? []).filter((s) => s.art === 'setzen');
    expect(setzen).toHaveLength(1);
    expect(setzen[0]?.felder).toEqual({ ec_erwartet_final: 1.2 });
  });

  it('Loesungswechsel-AK4 ohne erwarteten Wert und ohne k-Vorschlag kein setzen', () => {
    const { vorgaenge } = durchlauf(zaehler(), 17, { echt: true });
    expect(tabellen(vorgaenge[17] ?? [])).toEqual(['neu:ansatz_schritt']);
  });
});

describe('TO2 erneutes Senden', () => {
  it('Loesungswechsel-AK3 TO2 dieselbe Wiederholung mit festem ids-Zähler liefert dieselben client_id', () => {
    const a = durchlauf(zaehler());
    const b = durchlauf(zaehler());
    expect(b.vorgaenge).toEqual(a.vorgaenge);
    const idsA = Object.values(a.vorgaenge).flatMap((v) => neue(v).map((s) => s.felder.client_id));
    // keine client_id doppelt innerhalb eines Ablaufs
    expect(new Set(idsA).size).toBe(idsA.length);
  });

  it('Loesungswechsel-AK3 TO2 ein Schritt mit client_id wird nach dem erneuten Haken nicht doppelt geschrieben', () => {
    const lauf = durchlauf(zaehler(), 5);
    // der Stand trägt die client_id des Schritts und der Position; derselbe Vorgang geht unverändert erneut hinaus
    const z5 = lauf.stand.zeilen.find((z) => z.nr === 5);
    expect(z5?.schrittClientId).toBe(neue(lauf.vorgaenge[5] ?? []).at(-1)?.felder.client_id);
    expect(z5?.positionClientIds).toEqual([neue(lauf.vorgaenge[5] ?? [])[0]?.felder.client_id]);
  });
});
