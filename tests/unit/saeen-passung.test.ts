// Speichern der Einstufung beim Säen und beim Umsetzen ohne Zieltopf (Plan 36 Testliste saeen-passung.test.ts; Konzept
// R3.1, R3.4, R6.2; UC5). Injizierte Uhr ZB_JETZT (Mo 18.1.2027 09:00 Zürich) bzw. UMSETZ_JETZT (19.1.2027 09:00
// Zürich), Zeitzone Europe/Zurich; Teile aus tests/fixtures/passung.ts und tests/fixtures/umsetzen.ts.
//
// Vertrag (Plan 36 «Änderungen an bestehenden Modulen», vom Testentwickler präzisiert):
//   saatVorgang(): bei eingabe.zielPlatzId je Satz sortenPassung() über alle Sorten (Vorgabe-Kulturform, die gewählte
//     Sorte in ihrer gewählten Kulturform) mit dem erfassten Saatdatum; jede pflanzung-Zeile des Satzes trägt
//     einstufung, rang (Zahl) und gruende (Codes 'P1' … 'P11'); ohne Zielgefäss fehlen die Felder (oder null, gruende
//     leer).
//   umsetzVorgang(): bei frei gewähltem Zielgefäss daten.passung = { einstufung, rang, gruende } im Ereignis umsetzen
//     (Werte aus gefaessPassung()); beim eigenen reservierten Zieltopf kein Schlüssel passung.
//   ereignisDatenPruefen('umsetzen', …) lässt den Schlüssel passung zu.
import { describe, expect, it } from 'vitest';
import {
  alleFreienWaehlen,
  umsetzAnsicht,
  umsetzVorgang,
  umsetzZiele,
  umsetzZusammenfassung,
  wieGeplant,
  type UmsetzEingabe,
} from '../../src/domain/anzucht/umsetzen.ts';
import type { Schritt, Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import { ereignisDatenPruefen } from '../../src/domain/datenpfad/ereignisdaten.ts';
import { gefaessPassung, sortenPassung } from '../../src/domain/passung/kontext.ts';
import {
  saatEingabePruefen,
  saatRueckgaengig,
  saatVorgang,
  saatVorschlag,
  sortenAuswahl,
  type SaatEingabe,
  type SatzEingabe,
} from '../../src/domain/pflanzung/saeen.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { ANLAGE_R, uid, type Teile } from '../fixtures/regal.ts';
import { ART, netztopfId, passungTeile, platzId, SORTE, stammSetzen, ZB_JETZT } from '../fixtures/passung.ts';
import { R, SATZ, UMSETZ_JETZT, umsetzTeile } from '../fixtures/umsetzen.ts';

const J = ZB_JETZT;
const Z = ZEITZONE;
const HEUTE = '2027-01-18';
const P23 = platzId('2.3');
const P21 = platzId('2.1');
const P33 = platzId('3.3');

function neueIds(): () => string {
  let n = 0;
  return () => {
    n += 1;
    return uid('5d', n);
  };
}

type Neu = Extract<Schritt, { art: 'neu' }>;
const neue = (v: Vorgang, tabelle: string) =>
  v.filter((s): s is Neu => s.art === 'neu' && s.tabelle === tabelle).map((s) => s.felder);

function eingabe(saetze: SatzEingabe[], e: Partial<SaatEingabe> = {}): SaatEingabe {
  return {
    anlageId: ANLAGE_R,
    einstieg: 'gefaess',
    begonnenAm: new Date('2027-01-18T07:58:00Z'),
    saatdatum: HEUTE,
    saetze,
    ...e,
  };
}

/** Rang, Einstufung und Gründe einer Sorte in der Gesamtliste des Gefässes (gewählte Sorte in ihrer Kulturform) */
function erwartet(t: Teile, sorteId: string, kulturform: string, ziel: string, saatdatum = HEUTE) {
  const sorten = sortenAuswahl(t).map((s) =>
    s.sorteId === sorteId ? { ...s, kulturform: kulturform as typeof s.vorgabe } : s,
  );
  const x = sortenPassung(t, sorten, ziel, saatdatum, J, Z).find((s) => s.sorteId === sorteId);
  if (!x) throw new Error('Sorte fehlt in sortenPassung');
  return { einstufung: x.passung.einstufung, rang: x.rang, gruende: x.passung.gruende };
}

/** Pflanzungen des Satzes mit der Sorte */
function pflanzungenVon(v: Vorgang, sorteId: string) {
  const satz = neue(v, 'satz').find((s) => s['sorte_id'] === sorteId);
  return neue(v, 'pflanzung').filter((p) => p['satz_id'] === satz?.['id']);
}

describe('R3.4 Einstufung beim Säen speichern', () => {
  it('R3.4 saatVorgang schreibt einstufung, rang und gruende in jede Pflanzung des Satzes bei Zielgefäss', () => {
    const t = passungTeile();
    const e = eingabe(
      [
        {
          sorteId: SORTE.ochsenherz,
          kulturform: 'dauerkultur_frucht',
          zieltopfIds: [netztopfId('3.3.1'), netztopfId('3.3.2')],
        },
      ],
      { zielPlatzId: P33 },
    );
    expect(saatEingabePruefen(t, e, J, Z)).toEqual([]);
    const v = saatVorgang(t, e, neueIds(), J, Z);
    const pflanzungen = pflanzungenVon(v, SORTE.ochsenherz);
    expect(pflanzungen).toHaveLength(2);
    const soll = erwartet(t, SORTE.ochsenherz, 'dauerkultur_frucht', P33);
    for (const p of pflanzungen) {
      expect(p['einstufung']).toBe('nicht_empfohlen');
      expect((p['gruende'] as string[])[0]).toBe('P1');
      expect(p['gruende']).toEqual(soll.gruende);
      // Tomate ist im leeren Kratky-Gefäss die einzige Nicht empfohlen: letzter Rang von 7 Sorten
      expect(p['rang']).toBe(7);
      expect(p['rang']).toBe(soll.rang);
    }
    // andere Tabellen tragen die Felder nicht
    for (const tabelle of ['pflanzvorgang', 'satz', 'reservierung'])
      for (const f of neue(v, tabelle)) expect(f['einstufung']).toBeUndefined();
  });

  it('R3.4 ohne Zielgefäss bleiben die Felder weg', () => {
    const t = passungTeile();
    const e = eingabe([{ sorteId: SORTE.lollo, kulturform: 'kopf', zieltopfIds: [], pflanzenOhneZiel: 2 }]);
    const v = saatVorgang(t, e, neueIds(), J, Z);
    const pflanzungen = neue(v, 'pflanzung');
    expect(pflanzungen.length).toBeGreaterThan(0);
    for (const p of pflanzungen) {
      expect(p['einstufung'] ?? null).toBeNull();
      expect(p['rang'] ?? null).toBeNull();
      expect(p['gruende'] ?? []).toEqual([]);
    }
  });

  it('R3.4 Rang der gewählten Sorte entspricht ihrer Position in sortenPassung', () => {
    const t = passungTeile();
    const e = eingabe(
      [
        { sorteId: SORTE.matador, kulturform: 'kopf', zieltopfIds: [netztopfId('2.1.1')] },
        { sorteId: SORTE.lollo, kulturform: 'kopf', zieltopfIds: [netztopfId('2.1.2'), netztopfId('2.1.3')] },
      ],
      { zielPlatzId: P21 },
    );
    expect(saatEingabePruefen(t, e, J, Z)).toEqual([]);
    const v = saatVorgang(t, e, neueIds(), J, Z);
    for (const [sorte, kulturform] of [
      [SORTE.matador, 'kopf'],
      [SORTE.lollo, 'kopf'],
    ] as const) {
      const soll = erwartet(t, sorte, kulturform, P21);
      const pflanzungen = pflanzungenVon(v, sorte);
      expect(pflanzungen.length).toBeGreaterThan(0);
      for (const p of pflanzungen) {
        expect(p['rang']).toBe(soll.rang);
        expect(p['einstufung']).toBe(soll.einstufung);
        expect(p['gruende']).toEqual(soll.gruende);
      }
    }
    // Spinat als Kopf auf Ebene 2 bei 15 h: Schossgefahr (P4), Nicht empfohlen
    expect(pflanzungenVon(v, SORTE.matador)[0]?.['einstufung']).toBe('nicht_empfohlen');
    expect(pflanzungenVon(v, SORTE.matador)[0]?.['gruende']).toContain('P4');
  });

  it('R3.4 saatVorgang rechnet mit dem erfassten Saatdatum, nicht mit heute', () => {
    const t = passungTeile();
    // Lollo Rossa in 2.3 einmalig mit Ernte ab 30 Tagen nach dem Umsetzen (28.12.) → Ende 27.1.
    stammSetzen(t, 'art_kulturform', (z) => z['art_id'] === ART.salat && z['kulturform'] === 'kopf', {
      ernte_ab_d: 30,
    });
    // Runde 1 Befund 1 (Prüfer Fachlogik): ohne Zieltopf wird nicht gespeichert; die Rechnung des Vorgangs mit dem
    // erfassten Saatdatum steht im Vorschlag (saatVorschlag), aus dem saatVorgang() schreibt
    const satz = [{ sorteId: SORTE.lollo, kulturform: 'kopf', zieltopfIds: [] }];
    // gesät heute: Umsetzen 8.2., 2.3.1 bis 2.3.3 frei (Nachfolge), nur P2
    const heute = saatVorschlag(t, eingabe(satz, { zielPlatzId: P23 }), J, Z).saetze[0];
    expect(heute?.passung?.gruende).toEqual(['P2']);
    // nacherfasst, gesät 1.1.: Umsetzen 22.1., kein freies Loch → P2 und P3
    const e = eingabe(satz, { zielPlatzId: P23, saatdatum: '2027-01-01' });
    expect(saatEingabePruefen(t, e, J, Z)).toEqual([]);
    const nach = saatVorschlag(t, e, J, Z).saetze[0];
    const soll = erwartet(t, SORTE.lollo, 'kopf', P23, '2027-01-01');
    expect(nach?.passung?.gruende).toEqual(['P2', 'P3']);
    expect(nach?.passung?.gruende).toEqual(soll.gruende);
    expect(nach?.rang).toBe(soll.rang);
  });

  it('R3.4 Satz ohne Zieltopf trägt bei Zielgefäss keine Einstufung (Runde 1 Befund 1, EK4)', () => {
    const t = passungTeile();
    const e = eingabe(
      [
        { sorteId: SORTE.lollo, kulturform: 'kopf', zieltopfIds: [netztopfId('2.1.1')] },
        { sorteId: SORTE.ochsenherz, kulturform: 'dauerkultur_frucht', zieltopfIds: [], pflanzenOhneZiel: 1 },
      ],
      { zielPlatzId: P21 },
    );
    expect(saatEingabePruefen(t, e, J, Z)).toEqual([]);
    const v = saatVorgang(t, e, neueIds(), J, Z);
    for (const p of pflanzungenVon(v, SORTE.ochsenherz)) {
      expect(p['einstufung']).toBeUndefined();
      expect(p['rang']).toBeUndefined();
      expect(p['gruende']).toBeUndefined();
    }
    expect(pflanzungenVon(v, SORTE.lollo)[0]?.['einstufung']).toBe(
      erwartet(t, SORTE.lollo, 'kopf', P21).einstufung,
    );
  });

  it('UC5 saatRueckgaengig storniert weiterhin alle Zeilen', () => {
    const t = passungTeile();
    const v = saatVorgang(
      t,
      eingabe(
        [{ sorteId: SORTE.ochsenherz, kulturform: 'dauerkultur_frucht', zieltopfIds: [netztopfId('3.3.1')] }],
        { zielPlatzId: P33 },
      ),
      neueIds(),
      J,
      Z,
    );
    expect(neue(v, 'pflanzung')[0]?.['einstufung']).toBe('nicht_empfohlen');
    const r = saatRueckgaengig(v);
    expect(r).toHaveLength(v.length);
    expect(r.every((s) => s.art === 'storno')).toBe(true);
    expect(new Set(r.map((s) => (s.art === 'storno' ? s.clientId : '')))).toEqual(
      new Set(v.map((s) => (s.art === 'neu' ? s.felder.client_id : ''))),
    );
  });
});

describe('R6.2 Einstufung beim Umsetzen ohne Zieltopf', () => {
  const leer = (e: Partial<UmsetzEingabe>): UmsetzEingabe => ({
    satzId: SATZ.lollo,
    zuweisung: [],
    abernten: [],
    inStationLassen: [],
    ueberzaehlig: [],
    ...e,
  });
  const rucolaFrei = (t: Teile): UmsetzEingabe => {
    const toepfe = alleFreienWaehlen(umsetzZiele(t, P21, new Map()), 5);
    return leer({
      satzId: SATZ.rucola,
      zuweisung: R.slice(1, 6).map((p, i) => ({ pflanzungId: p, netztopfId: toepfe[i] as string })),
    });
  };

  it('R6.2 umsetzVorgang legt daten.passung ins Ereignis umsetzen bei freier Gefässwahl, nicht beim eigenen Zieltopf', () => {
    const t = umsetzTeile();
    const v = umsetzVorgang(t, rucolaFrei(t), neueIds(), UMSETZ_JETZT, Z);
    const umsetzen = neue(v, 'ereignis').filter((f) => f['typ'] === 'umsetzen');
    expect(umsetzen).toHaveLength(5);
    const soll = gefaessPassung(t, SATZ.rucola, P21, UMSETZ_JETZT, Z);
    expect(soll).toBeDefined();
    for (const f of umsetzen) {
      const p = (f['daten'] as Record<string, unknown>)['passung'] as Record<string, unknown> | undefined;
      expect(p).toBeDefined();
      expect(p?.['einstufung']).toBe(soll?.einstufung);
      expect(p?.['gruende']).toEqual(soll?.gruende);
      expect(Number.isInteger(p?.['rang'])).toBe(true);
      expect(Number(p?.['rang'])).toBeGreaterThanOrEqual(1);
      expect(ereignisDatenPruefen('umsetzen', f['daten'] as Record<string, unknown>)).toEqual([]);
    }

    // Lollo Rossa wie geplant in die eigenen reservierten Zieltöpfe: keine Einstufung
    const a = umsetzAnsicht(t, SATZ.lollo, UMSETZ_JETZT, Z);
    if (!a) throw new Error('Ansicht fehlt');
    const geplant = umsetzVorgang(t, wieGeplant(a), neueIds(), UMSETZ_JETZT, Z);
    const eigene = neue(geplant, 'ereignis').filter((f) => f['typ'] === 'umsetzen');
    expect(eigene.length).toBeGreaterThan(0);
    for (const f of eigene) expect(Object.hasOwn(f['daten'] as object, 'passung')).toBe(false);
  });

  it('ereignisDatenPruefen lässt passung am Typ umsetzen zu', () => {
    expect(
      ereignisDatenPruefen('umsetzen', {
        von_platz_id: platzId('4.4'),
        von_loch_nr: 7,
        nach_platz_id: P21,
        nach_loch_nr: 1,
        passung: { einstufung: 'moeglich', rang: 2, gruende: ['P8'] },
      }),
    ).toEqual([]);
    // an anderen Typen bleibt der Schlüssel unbekannt
    expect(ereignisDatenPruefen('verschieben', { passung: { einstufung: 'moeglich' } })).toHaveLength(1);
    // Sicherheit Runde 1 Befund 1: Werte und Unterschlüssel werden geprüft
    for (const falsch of [
      { einstufung: 'falsch', gruende: [] },
      { einstufung: 'moeglich', gruende: ['X'] },
      { einstufung: 'moeglich', gruende: ['P1', 'P2', 'P3'] },
      { einstufung: 'moeglich', rang: 0, gruende: [] },
      { einstufung: 'moeglich', rang: 1.5, gruende: [] },
      { einstufung: 'moeglich', gruende: [], fremd: 1 },
      { einstufung: 'moeglich' },
      ['moeglich'],
      null,
    ])
      expect(ereignisDatenPruefen('umsetzen', { passung: falsch })).toHaveLength(1);
    expect(ereignisDatenPruefen('umsetzen', { passung: { einstufung: 'empfohlen', gruende: [] } })).toEqual(
      [],
    );
    expect(
      ereignisDatenPruefen('umsetzen', {
        passung: { einstufung: 'nicht_empfohlen', rang: 3, gruende: ['P10', 'P11'] },
      }),
    ).toEqual([]);
  });

  it('R6.2 umsetzZusammenfassung mit ansatz und wechselIn bleibt unverändert', () => {
    const t = umsetzTeile();
    const z = umsetzZusammenfassung(t, rucolaFrei(t), UMSETZ_JETZT, Z);
    expect(z.zeilen).toHaveLength(5);
    expect(z.ansatz).toBe('2.1: Ansatz für Umsetzen');
    expect(z.wechselIn).toBeUndefined();
  });
});
