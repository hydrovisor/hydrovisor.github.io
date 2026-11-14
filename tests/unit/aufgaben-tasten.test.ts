// Tasten je Aufgabe für Heute und die Maske Gefäss (Issue #225, Plan 225 Entscheide 5 und 7, Testliste; UX3-AK4;
// R5.1, R5.2, R5.3; UX1-AK3). aufgabenTasten() ist eine reine Tabelle: die erste Taste ist die einzige betonte, «Öffnen»
// (→ Gefäss) gibt es nur in Heute bei Zeilen mit Ort, deren Haupttaste schreibt oder fehlt (A7), in der Maske Gefäss nie;
// «Morgen», «Überspringen» und «Pegel ok» folgen den Flags der Aufgabe. Aufgaben von Hand (Form wie
// faelligeAufgaben()) mit den Flags, die die Aufgaben-Rechnung für den Typ setzt (MORGEN, UEBERSPRINGEN,
// ERLEDIGT_KNOPF, Stromausfall). Keine Uhr nötig (die Tabelle hängt nicht von jetzt ab). Keine Personendaten.
//
// Vertrag (Plan 225 Entscheid 5):
//   src/domain/aufgaben-tasten.ts
//     aufgabenTasten(a, wo: 'heute' | 'gefaess', pegelGesetzt: boolean): AufgabenTaste[]
//     AufgabenTaste = { art: 'schreiben'; aktion: Aktion; text; betont } | { art: 'link'; ziel: AufgabenZiel; text; betont }
//     Aktion = 'erledigt' | 'deckel' | 'morgen' | 'ueberspringen' | 'pegel_ok' | 'pruefung_ok' | 'pruefung_auffaellig'
// Ziele der Masken Kurzprüfung und Nachfüllen werden mit toMatchObject geprüft (ein Zusatz `von: 'gefaess'` in der
// Maske Gefäss ist erlaubt), alle übrigen genau.
import { describe, expect, it } from 'vitest';
import { aufgabenTasten, type AufgabenTaste } from '../../src/domain/aufgaben-tasten.ts';
import type { AufgabenZiel } from '../../src/domain/aufgaben-folge.ts';
import type { Aufgabe, AufgabenArt, AufgabenTyp } from '../../src/domain/aufgaben.ts';
import { ERLEDIGT_KNOPF, MORGEN, TYPEN, UEBERSPRINGEN } from '../../src/domain/aufgaben-aufschub.ts';
import { STROM_TYPEN, type StromTyp } from '../../src/domain/aufgaben-stromausfall.ts';
import { satzId } from './aufgaben-fixture.ts';
import { ANLAGE, aufgabe as handAufgabe } from './rundgang-fixture.ts';

/** Typen ohne Ort: Messgerät bzw. Anlage */
const OHNE_ORT: ReadonlySet<AufgabenArt> = new Set<AufgabenArt>([
  'kalibrieren',
  'ph_kontrolle',
  'strom_pumpen',
  'strom_ac10_licht',
]);
/** Bezug Satz (Ort des Satzes R-A1) */
const SATZ_TYPEN: ReadonlySet<AufgabenArt> = new Set<AufgabenArt>([
  'keimung_pruefen',
  'abdeckung_entfernen',
  'umsetzen',
  'reservierung_pruefen',
]);
const SATZ = satzId(1);

/** Aufgabe des Typs mit den Flags der Aufgaben-Rechnung; Ort R-2.1 bzw. R-A1, ohne Ort für Messgerät und Anlage */
function von(typ: AufgabenArt, extra: Partial<Aufgabe> = {}): Aufgabe {
  const strom = STROM_TYPEN.has(typ as StromTyp);
  const code = SATZ_TYPEN.has(typ) || typ === 'wuerfel_feucht' || typ === 'deckel_oeffnen' ? 'R-A1' : 'R-2.1';
  const a = handAufgabe((strom ? 'messen' : typ) as AufgabenTyp, code);
  const regel = strom ? 'nein' : MORGEN[typ as AufgabenTyp];
  const basis: Aufgabe = {
    ...a,
    typ,
    schluessel: `${typ}|${a.bezug}|${a.faelligAm}`,
    titel: typ,
    morgen: { erlaubt: regel !== 'nein', verschoben: 0 },
    ueberspringen: UEBERSPRINGEN.has(typ),
    pegelOk: typ === 'messen_nachfuellen',
    erledigtKnopf: ERLEDIGT_KNOPF.has(typ) || strom,
  };
  if (SATZ_TYPEN.has(typ)) {
    basis.bezug = SATZ;
    basis.bezugArt = 'satz';
  }
  if (OHNE_ORT.has(typ)) {
    delete basis.ort;
    basis.bezug = typ.startsWith('strom_') ? ANLAGE.R : 'messgeraet';
    basis.bezugArt = typ.startsWith('strom_') ? 'anlage' : 'messgeraet';
  }
  return { ...basis, ...extra };
}

/** Ziel der Tabelle: AufgabenZiel samt den neuen Masken Kurzprüfung und Nachfüllen (Plan 225 Entscheid 7) */
type Ziel = AufgabenZiel | { name: 'kurzpruefung' | 'nachfuellen'; code: string };

const texte = (l: readonly AufgabenTaste[]) => l.map((t) => t.text);
const zielVon = (t: AufgabenTaste | undefined): AufgabenZiel | undefined =>
  t?.art === 'link' ? t.ziel : undefined;
const aktionVon = (t: AufgabenTaste | undefined) => (t?.art === 'schreiben' ? t.aktion : undefined);
const MIT_ORT = TYPEN.filter((t) => !OHNE_ORT.has(t));

describe('UX3-AK4 aufgabenTasten()', () => {
  it('UX3-AK4 aufgabenTasten() liefert für jeden Typ aus TYPEN mit Ort in der Maske Gefäss mindestens eine Taste, nie «Öffnen»', () => {
    // Tabelle getrieben über alle Typen mit Ort, inkl. Stromausfall, Umsetzen, Reservierung und Station
    expect(MIT_ORT).toEqual(
      expect.arrayContaining([
        'umsetzen',
        'reservierung_pruefen',
        'station_echte_blaetter',
        'nachfuellen_kratky',
        'belueftung_pruefen',
        'strom_wassertemperatur',
        'strom_wurzeln',
        'strom_messen',
      ]),
    );
    for (const typ of MIT_ORT) {
      for (const flags of [
        {},
        { morgen: { erlaubt: false, verschoben: 0 }, ueberspringen: false, pegelOk: false },
      ]) {
        const l = aufgabenTasten(von(typ, flags), 'gefaess', false);
        expect(l.length, `${typ}: mindestens eine Taste`).toBeGreaterThanOrEqual(1);
        expect(texte(l), `${typ}: kein «Öffnen»`).not.toContain('Öffnen');
        for (const t of l) expect(zielVon(t)?.name, `${typ}: kein Link auf das Gefäss`).not.toBe('gefaess');
      }
    }
  });

  it('UX3-AK4 genau die erste Taste ist betont, alle weiteren nachrangig', () => {
    const pegel = [false, true];
    for (const wo of ['heute', 'gefaess'] as const)
      for (const typ of TYPEN) {
        if (wo === 'gefaess' && OHNE_ORT.has(typ)) continue;
        if (wo === 'heute' && (typ === 'umsetzen' || typ === 'kalibrieren')) continue;
        for (const p of pegel) {
          const l = aufgabenTasten(von(typ), wo, p);
          if (l.length === 0) continue;
          expect(l[0]?.betont, `${wo} ${typ}: erste betont`).toBe(true);
          expect(
            l.slice(1).every((t) => !t.betont),
            `${wo} ${typ}: übrige nachrangig`,
          ).toBe(true);
        }
      }
    // die Zeilen mit Ort in Heute haben immer eine Taste
    for (const typ of MIT_ORT.filter((t) => t !== 'umsetzen'))
      expect(aufgabenTasten(von(typ), 'heute', false).length, typ).toBeGreaterThanOrEqual(1);
  });

  it('UX3-AK4 Heute: «Öffnen» nur bei Zeilen mit Ort, deren Haupttaste schreibt', () => {
    // Erledigt, Deckel, Kurzprüfung, Wurzeln, Stromausfall am Ort
    const MIT_OEFFNEN: readonly AufgabenArt[] = [
      'kurzpruefung',
      'wurzeln_pruefen',
      'wuerfel_feucht',
      'reinigen',
      'deckel_oeffnen',
      'abdeckung_entfernen',
      'strom_wassertemperatur',
      'strom_wurzeln',
      'strom_messen',
    ];
    for (const typ of MIT_ORT.filter((t) => t !== 'umsetzen')) {
      const l = aufgabenTasten(von(typ), 'heute', false);
      const oeffnen = l.filter((t) => t.text === 'Öffnen');
      if (MIT_OEFFNEN.includes(typ)) {
        expect(l[0]?.art, `${typ}: Haupttaste schreibt`).toBe('schreiben');
        expect(oeffnen, `${typ}: ein «Öffnen»`).toHaveLength(1);
        expect(zielVon(oeffnen[0]), typ).toEqual({
          name: 'gefaess',
          code: von(typ).ort?.code,
        });
        expect(oeffnen[0]?.betont, `${typ}: «Öffnen» nachrangig`).toBe(false);
      } else {
        expect(oeffnen, `${typ}: kein «Öffnen»`).toEqual([]);
        expect(l[0]?.art, `${typ}: Haupttaste führt in die Maske`).toBe('link');
      }
    }
    // ohne Ort: Stromausfall an der Anlage nur «Erledigt», kein «Öffnen»
    for (const typ of ['strom_pumpen', 'strom_ac10_licht'] as const) {
      const l = aufgabenTasten(von(typ), 'heute', false);
      expect(texte(l), typ).toEqual(['Erledigt']);
      expect(aktionVon(l[0])).toBe('erledigt');
    }
    // pH-Kontrolle ohne Ort: «Öffnen» ist die Haupttaste und führt zum Kalibrieren (unverändert)
    const ph = aufgabenTasten(von('ph_kontrolle'), 'heute', false);
    expect(ph[0]).toMatchObject({ art: 'link', text: 'Öffnen', betont: true, ziel: { name: 'kalibrieren' } });
    expect(texte(ph)).toEqual(['Öffnen', 'Morgen', 'Überspringen']);
  });

  it('UX3-AK4 Morgen, Überspringen, Pegel ok nur nach den Flags der Aufgabe; «Pegel ok» nach gesetztem Pegel weg', () => {
    const ohne = { morgen: { erlaubt: false, verschoben: 0 }, ueberspringen: false, pegelOk: false };
    const mit = { morgen: { erlaubt: true, verschoben: 0 }, ueberspringen: true, pegelOk: true };
    for (const wo of ['heute', 'gefaess'] as const)
      for (const typ of MIT_ORT) {
        if (wo === 'heute' && typ === 'umsetzen') continue;
        const nichts = aufgabenTasten(von(typ, ohne), wo, false);
        expect(nichts.map(aktionVon), `${wo} ${typ} ohne Flags`).not.toContain('morgen');
        expect(nichts.map(aktionVon)).not.toContain('ueberspringen');
        expect(nichts.map(aktionVon)).not.toContain('pegel_ok');

        const alles = aufgabenTasten(von(typ, mit), wo, false);
        const morgen = alles.filter((t) => aktionVon(t) === 'morgen');
        expect(morgen, `${wo} ${typ}: «Morgen»`).toHaveLength(1);
        expect(morgen[0]).toMatchObject({ text: 'Morgen', betont: false });
        const ueber = alles.filter((t) => aktionVon(t) === 'ueberspringen');
        expect(ueber, `${wo} ${typ}: «Überspringen»`).toHaveLength(1);
        expect(ueber[0]).toMatchObject({ text: 'Überspringen', betont: false });
        const pegel = alles.filter((t) => aktionVon(t) === 'pegel_ok');
        expect(pegel, `${wo} ${typ}: «Pegel ok»`).toHaveLength(1);
        expect(pegel[0]).toMatchObject({ text: 'Pegel ok', betont: false });
        // nach gesetztem Pegel ist «Pegel ok» weg, die übrigen Tasten bleiben
        const gesetzt = aufgabenTasten(von(typ, mit), wo, true);
        expect(gesetzt.map(aktionVon), `${wo} ${typ}: Pegel gesetzt`).not.toContain('pegel_ok');
        expect(gesetzt).toHaveLength(alles.length - 1);
      }

    // Werte der Aufgaben-Rechnung: Messen und nachfüllen mit «Pegel ok», ohne «Morgen» bis Pegel ok
    const mn = aufgabenTasten(von('messen_nachfuellen'), 'heute', false);
    expect(texte(mn)).toEqual(['Messen', 'Pegel ok']);
    expect(texte(aufgabenTasten(von('messen_nachfuellen'), 'heute', true))).toEqual(['Messen']);
    const nachPegel = von('messen_nachfuellen', { morgen: { erlaubt: true, verschoben: 0 }, pegelOk: false });
    expect(texte(aufgabenTasten(nachPegel, 'gefaess', true))).toEqual(['Messen', 'Morgen']);
    // Messen Kratky belüftet: Morgen und Überspringen; Wurzeln: Morgen und Überspringen
    expect(texte(aufgabenTasten(von('messen'), 'gefaess', false))).toEqual([
      'Messen',
      'Morgen',
      'Überspringen',
    ]);
    expect(texte(aufgabenTasten(von('wurzeln_pruefen'), 'gefaess', false))).toEqual([
      'Wurzeln ok',
      'Auffällig',
      'Morgen',
      'Überspringen',
    ]);
    // Morgen bei Messen ausgeschöpft (verschoben 2)
    const ausgeschoepft = von('messen', { morgen: { erlaubt: false, verschoben: 2 } });
    expect(texte(aufgabenTasten(ausgeschoepft, 'gefaess', false))).toEqual(['Messen', 'Überspringen']);
  });

  it('UX3-AK4 Tabelle des Plans je Typ: Text und Ziel der Haupttaste', () => {
    const c = 'R-2.1';
    const a1 = 'R-A1';
    /** Haupttaste je Typ (Plan 225 Entscheid 5), Ziele mit Ort nach der Aufgabe aus von() */
    const HAUPT: Partial<Record<AufgabenArt, { text: string; ziel?: Ziel; aktion?: string }>> = {
      gefaess_pruefen: { text: 'Prüfen', ziel: { name: 'pruefen', code: c } },
      messen_nachfuellen: { text: 'Messen', ziel: { name: 'messen', code: c } },
      messen: { text: 'Messen', ziel: { name: 'messen', code: c } },
      kontrolle_folgetag: { text: 'Messen', ziel: { name: 'messen', code: c } },
      waerme_pruefen: { text: 'Messen', ziel: { name: 'messen', code: c } },
      nachfuellen_kratky: { text: 'Nachfüllen', ziel: { name: 'nachfuellen', code: c } },
      loesung_wechseln: { text: 'Ansetzen', ziel: { name: 'ansatz', code: c } },
      ansatz: { text: 'Ansetzen', ziel: { name: 'ansatz', code: c } },
      kurzpruefung: { text: 'Alles ok', aktion: 'pruefung_ok' },
      belueftung_pruefen: { text: 'Prüfen', ziel: { name: 'kurzpruefung', code: c } },
      wurzeln_pruefen: { text: 'Wurzeln ok', aktion: 'pruefung_ok' },
      wuerfel_feucht: { text: 'Erledigt', aktion: 'erledigt' },
      reinigen: { text: 'Erledigt', aktion: 'erledigt' },
      deckel_oeffnen: { text: 'Deckel geöffnet', aktion: 'deckel' },
      abdeckung_entfernen: { text: 'Abdeckung entfernt', aktion: 'deckel' },
      keimung_pruefen: { text: 'Prüfen', ziel: { name: 'keimung', satz: SATZ } },
      umsetzen: { text: 'Umsetzen', ziel: { name: 'umsetzen', satz: SATZ } },
      station_echte_blaetter: { text: 'Ansetzen', ziel: { name: 'ansatz', code: c } },
      reservierung_pruefen: { text: 'Umsetzen', ziel: { name: 'umsetzen', satz: SATZ } },
      strom_wassertemperatur: { text: 'Erledigt', aktion: 'erledigt' },
      strom_wurzeln: { text: 'Erledigt', aktion: 'erledigt' },
      strom_messen: { text: 'Erledigt', aktion: 'erledigt' },
    };
    expect(
      MIT_ORT.filter((t) => HAUPT[t] === undefined),
      'jeder Typ mit Ort in der Tabelle',
    ).toEqual([]);
    for (const wo of ['heute', 'gefaess'] as const)
      for (const typ of MIT_ORT) {
        if (wo === 'heute' && typ === 'umsetzen') continue;
        const soll = HAUPT[typ];
        const ist = aufgabenTasten(von(typ), wo, false)[0];
        expect(ist?.text, `${wo} ${typ}`).toBe(soll?.text);
        expect(ist?.betont, `${wo} ${typ}`).toBe(true);
        if (soll?.aktion) {
          expect(ist?.art, `${wo} ${typ}`).toBe('schreiben');
          expect(aktionVon(ist), `${wo} ${typ}`).toBe(soll.aktion);
        } else if (soll?.ziel?.name === 'kurzpruefung' || soll?.ziel?.name === 'nachfuellen') {
          expect(ist?.art, `${wo} ${typ}`).toBe('link');
          expect(zielVon(ist), `${wo} ${typ}`).toMatchObject(soll.ziel);
        } else {
          expect(ist?.art, `${wo} ${typ}`).toBe('link');
          expect(zielVon(ist), `${wo} ${typ}`).toEqual(soll?.ziel);
        }
      }

    // Kurzprüfung: zweite Taste «Etwas stimmt nicht» → Kurzprüfung des Orts, in Heute danach «Öffnen»
    for (const wo of ['heute', 'gefaess'] as const) {
      const k = aufgabenTasten(von('kurzpruefung'), wo, false);
      expect(k[1]).toMatchObject({ art: 'link', text: 'Etwas stimmt nicht', betont: false });
      expect(zielVon(k[1])).toMatchObject({ name: 'kurzpruefung', code: c });
      expect(texte(k)).toEqual(
        wo === 'heute' ? ['Alles ok', 'Etwas stimmt nicht', 'Öffnen'] : ['Alles ok', 'Etwas stimmt nicht'],
      );
      // Wurzeln: «Auffällig» schreibt direkt
      const w = aufgabenTasten(von('wurzeln_pruefen'), wo, false);
      expect(w[1]).toMatchObject({
        art: 'schreiben',
        aktion: 'pruefung_auffaellig',
        text: 'Auffällig',
        betont: false,
      });
    }
    // Ziele mit Satz am Anzuchtort: keine Verwechslung mit dem Code
    expect(zielVon(aufgabenTasten(von('keimung_pruefen'), 'gefaess', false)[0])).not.toHaveProperty('code');
    expect(von('keimung_pruefen').ort?.code).toBe(a1);
    // Umsetzen in der Maske Gefäss: «Morgen» verschiebt das Umsetzdatum (R5.3)
    expect(texte(aufgabenTasten(von('umsetzen'), 'gefaess', false))).toEqual(['Umsetzen', 'Morgen']);
    expect(texte(aufgabenTasten(von('reservierung_pruefen'), 'gefaess', false))).toEqual([
      'Umsetzen',
      'Morgen',
    ]);
    // Belüftung, Station, Nachfüllen Kratky: nur die Haupttaste (Morgen nein)
    for (const typ of ['belueftung_pruefen', 'station_echte_blaetter', 'nachfuellen_kratky'] as const)
      for (const wo of ['heute', 'gefaess'] as const)
        expect(aufgabenTasten(von(typ), wo, false), `${wo} ${typ}`).toHaveLength(1);
  });
});
