// Offene Werte einer Sorte für die Recherche (Issue #37, Plan 37 Testliste; UC4-AK7; R1.2, R1.3, R1.4, R12.3;
// 03_import_w0.md Abschnitt 9; Erratum E8). Rein.
//
// Vorausgesetzt (Plan 37, Domänenfunktionen; Zeilen wie aus der Datenbank, A):
//   src/domain/wissen/luecken.ts
//     type Luecke = { id: string; phase: Phase; groesse: 'dauer' | 'bbch' | 'wechselmerkmal' | 'ph' | 'ec' | 'keimart' | 'keimtemp' }
//     rechercheLuecken(e: { sorteId; artId; kulturtyp; kulturformenErlaubt; sollwerte; pflicht; saatempfehlungen })
//       → { werte: Luecke[]; saat: Kulturform[] }
//   sollwerte: Zeilen aus v_sollwert { sorte_id, phase, groesse, wert_min, wert_typ, wert_max, text_wert,
//              herkunft_ebene, evidenzklasse, vermerk }
//   pflicht: Zeilen aus pflichtgroesse { phase, groesse, mindestens_art }
//   saatempfehlungen: gültige Zeilen aus saatempfehlung { ebene, art_id, sorte_id, kulturform, klasse_saatmenge,
//              bestaetigt_am }
//   Offen ist je anwendbarer Phase (anwendbar = ja) jede Pflichtgrösse ausser anwendbar (A6), ohne wechselmerkmal der
//   letzten anwendbaren Phase, wenn der Wert fehlt oder nicht auf Ebene Sorte oder Art mit Klasse A bis C steht.
import { describe, expect, it } from 'vitest';
import { rechercheLuecken } from '../../src/domain/wissen/luecken.ts';

type Eingabe = Parameters<typeof rechercheLuecken>[0];

const SORTE = '37000000-0000-4000-8000-000000000001';
const ART = 'testus_lactucoides';

const PFLICHT = [
  ...['anwendbar', 'dauer', 'bbch', 'keimart', 'keimtemp', 'wechselmerkmal'].map((groesse) => ({
    phase: 'keimung',
    groesse,
    mindestens_art: groesse === 'dauer',
  })),
  ...['anzucht', 'wachstum', 'bluete', 'fruchtbildung_reife'].flatMap((phase) =>
    ['anwendbar', 'dauer', 'bbch', 'ph', 'ec', 'wechselmerkmal'].map((groesse) => ({
      phase,
      groesse,
      mindestens_art: ['dauer', 'ph', 'ec'].includes(groesse),
    })),
  ),
];

function sw(
  phase: string,
  groesse: string,
  ebene: 'sorte' | 'art' | 'kulturgruppe' | 'standard',
  aenderung: Record<string, unknown> = {},
) {
  return {
    sorte_id: SORTE,
    phase,
    groesse,
    wert_min: groesse === 'anwendbar' ? null : 1,
    wert_typ: null,
    wert_max: groesse === 'anwendbar' ? null : 2,
    text_wert: groesse === 'anwendbar' ? 'ja' : null,
    herkunft_ebene: ebene,
    evidenzklasse: ebene === 'kulturgruppe' || ebene === 'standard' ? 'D' : 'B1',
    vermerk: 'keine',
    ...aenderung,
  };
}

/** anwendbar ja für keimung, anzucht, wachstum aus der Kulturgruppe, Blüte entfällt */
const ANWENDBAR = [
  sw('keimung', 'anwendbar', 'kulturgruppe'),
  sw('anzucht', 'anwendbar', 'kulturgruppe'),
  sw('wachstum', 'anwendbar', 'kulturgruppe'),
  sw('bluete', 'anwendbar', 'kulturgruppe', { text_wert: 'entfaellt' }),
];

function eingabe(aenderung: Partial<Eingabe> = {}): Eingabe {
  return {
    sorteId: SORTE,
    artId: ART,
    kulturtyp: 'blatt',
    kulturformenErlaubt: ['schnitt'],
    sollwerte: ANWENDBAR,
    pflicht: PFLICHT,
    saatempfehlungen: [],
    ...aenderung,
  } as Eingabe;
}

const namen = (r: ReturnType<typeof rechercheLuecken>) =>
  r.werte.map((l) => `${l.phase}.${l.groesse}`).sort();

describe('UC4-AK7 Lücken der Recherche (R1.4)', () => {
  it('UC4-AK7 (Lücken) neue Art aus der Kulturgruppe: alle Pflichtgrössen ausser anwendbar je anwendbarer Phase offen, ohne Wechselmerkmal der letzten Phase', () => {
    const vererbt = [
      ...ANWENDBAR,
      sw('keimung', 'dauer', 'kulturgruppe'),
      sw('anzucht', 'ph', 'kulturgruppe'),
      sw('wachstum', 'ec', 'kulturgruppe'),
      sw('wachstum', 'ph', 'standard'),
    ];
    const r = rechercheLuecken(eingabe({ sollwerte: vererbt } as Partial<Eingabe>));
    expect(namen(r)).toEqual(
      [
        'keimung.dauer',
        'keimung.bbch',
        'keimung.keimart',
        'keimung.keimtemp',
        'keimung.wechselmerkmal',
        'anzucht.dauer',
        'anzucht.bbch',
        'anzucht.ph',
        'anzucht.ec',
        'anzucht.wechselmerkmal',
        'wachstum.dauer',
        'wachstum.bbch',
        'wachstum.ph',
        'wachstum.ec',
      ].sort(),
    );
    expect(r.werte.some((l) => (l.groesse as string) === 'anwendbar')).toBe(false);
    expect(r.werte.some((l) => l.phase === 'bluete' || l.phase === 'fruchtbildung_reife')).toBe(false);
    expect(new Set(r.werte.map((l) => l.id)).size).toBe(r.werte.length);
    expect(r.saat).toEqual(['schnitt']);
  });

  it('UC4-AK7 (Lücken) W0-Werte auf Art und Tütenwerte auf Sorte schliessen die Lücke; Herkunft Kulturgruppe oder Standard bleibt offen', () => {
    const art = (phase: string, groesse: string) => sw(phase, groesse, 'art');
    const sollwerte = [
      ...ANWENDBAR,
      art('keimung', 'dauer'),
      art('keimung', 'bbch'),
      art('keimung', 'wechselmerkmal'),
      sw('keimung', 'keimart', 'sorte', {
        text_wert: 'licht',
        wert_min: null,
        wert_max: null,
        evidenzklasse: 'C',
        vermerk: 'tuete',
      }),
      sw('keimung', 'keimtemp', 'sorte', { evidenzklasse: 'C', vermerk: 'tuete' }),
      art('anzucht', 'dauer'),
      art('anzucht', 'bbch'),
      art('anzucht', 'wechselmerkmal'),
      art('anzucht', 'ph'),
      sw('anzucht', 'ec', 'art', { evidenzklasse: 'C', vermerk: 'recherche' }),
      art('wachstum', 'bbch'),
      sw('wachstum', 'dauer', 'kulturgruppe'),
      sw('wachstum', 'ph', 'standard'),
      sw('wachstum', 'ec', 'art', { evidenzklasse: 'B2' }),
    ];
    expect(namen(rechercheLuecken(eingabe({ sollwerte } as Partial<Eingabe>)))).toEqual([
      'wachstum.dauer',
      'wachstum.ph',
    ]);
  });

  it('UC4-AK7 (Lücken) Saatempfehlung je nach R1.2 zulässiger Kulturform ohne bestätigte Zeile; bestätigte Art-Zeile schliesst', () => {
    const se = (ebene: 'art' | 'sorte', kulturform: string, bestaetigt: string | null) => ({
      ebene,
      art_id: ebene === 'art' ? ART : null,
      sorte_id: ebene === 'sorte' ? SORTE : null,
      kulturform,
      klasse_saatmenge: 'C',
      bestaetigt_am: bestaetigt,
    });
    const blatt = rechercheLuecken(
      eingabe({
        kulturformenErlaubt: ['schnitt', 'kopf', 'babyleaf', 'dauerkultur_frucht'],
        saatempfehlungen: [se('art', 'schnitt', '2027-01-10'), se('sorte', 'kopf', null)],
      } as Partial<Eingabe>),
    );
    expect([...blatt.saat].sort()).toEqual(['babyleaf', 'kopf']);

    const knolle = rechercheLuecken(
      eingabe({
        kulturtyp: 'knolle',
        kulturformenErlaubt: ['babyleaf', 'kopf', 'schnitt'],
        saatempfehlungen: [se('sorte', 'kopf', '2027-01-12')],
      } as Partial<Eingabe>),
    );
    expect(knolle.saat).toEqual(['babyleaf']);

    const frucht = rechercheLuecken(
      eingabe({
        kulturtyp: 'frucht',
        kulturformenErlaubt: ['schnitt', 'dauerkultur_frucht'],
      } as Partial<Eingabe>),
    );
    expect(frucht.saat).toEqual(['dauerkultur_frucht']);
  });

  it('UC4-AK7 (Lücken) keine Lücke → keine Anfrage', () => {
    const art = (phase: string, groesse: string) => sw(phase, groesse, 'art');
    const voll = [
      ...ANWENDBAR,
      ...['dauer', 'bbch', 'keimart', 'keimtemp', 'wechselmerkmal'].map((g) => art('keimung', g)),
      ...['dauer', 'bbch', 'ph', 'ec', 'wechselmerkmal'].map((g) => art('anzucht', g)),
      ...['dauer', 'bbch', 'ph', 'ec'].map((g) => art('wachstum', g)),
    ];
    const r = rechercheLuecken(
      eingabe({
        sollwerte: voll,
        saatempfehlungen: [
          {
            ebene: 'art',
            art_id: ART,
            sorte_id: null,
            kulturform: 'schnitt',
            klasse_saatmenge: 'B',
            bestaetigt_am: '2027-01-10',
          },
        ],
      } as Partial<Eingabe>),
    );
    expect(r).toEqual({ werte: [], saat: [] });
  });
});
