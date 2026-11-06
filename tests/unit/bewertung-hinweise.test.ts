// Warnhinweise mit Folge und Massnahme je Betriebsart (Plan 26 Testliste; UC9-AK11 Hinweisteil; R10.4, R10.5;
// Konzept 7.5 Tabelle; 05_masken.md 5). Injizierte Uhr, Zeitzone Europe/Zurich; Wochenrate in Kalendertagen (TZ).
//
// Vertrag (vom Testentwickler festgelegt, wo Plan 26 offen ist):
// - `hinweise(e, jetzt, zeitzone)` aus src/domain/bewertung/hinweise.ts mit
//   e = { betriebsart, werte, bewertungen, sollband?, vorher, ansaetze }; `vorher` hat die Form
//   Partial<Record<Groesse, { wert: Hundertstel; giltAb: string }>>, `ansaetze` sind die Ansätze am Platz.
// - Folge und Massnahme stehen wörtlich (Teiltext) in `folge` bzw. `massnahme`; «Wurzeln und Lösung prüfen»
//   darf in Folge oder Massnahme stehen.
// - `text` der Bandhinweise: «Gemessen 6.8, Sollwert deiner Anlage 6.0–6.5.» (pH und °C eine Dezimale, EC zwei,
//   Halbgeviertstrich).
// - Ton: DWC, Konstantpegel und Station `danger` bei «Ausserhalb», `warn` bei «Knapp daneben»; Kratky (belüftet und
//   ohne Pumpe) immer `info` und `alarm` falsch. `alarm` ist wahr, sobald ein Hinweis den Ton warn oder danger hat.
// - Reihenfolge der Bandhinweise: Ausserhalb vor Knapp daneben, in gleicher Stufe pH vor EC vor °C; Temperatur-
//   und Verlaufshinweise danach; höchstens zwei.
import { describe, expect, it } from 'vitest';
import { bewerten } from '../../src/domain/bewertung/bewertung.ts';
import { hinweise, type Hinweis } from '../../src/domain/bewertung/hinweise.ts';
import type { Sollband } from '../../src/domain/bewertung/sollband.ts';
import type { AnsatzZeile } from '../../src/domain/bewertung/verlauf.ts';
import type { Groesse } from '../../src/domain/messung/eingabe.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { JETZT } from '../fixtures/messen.ts';
import { platzId, uid } from '../fixtures/regal.ts';

type Werte = Partial<Record<Groesse, number>>;
type Vorher = Partial<Record<Groesse, { wert: number; giltAb: string }>>;

const BAND: Sollband = {
  ph: { min: 600, max: 650 },
  ec: { min: 100, max: 140 },
  temperatur: { min: 1800, max: 2200 },
  herkunft: 'pflanzungen',
};
const STATION: Sollband = {
  ph: { min: 580, max: 630 },
  ec: { min: 80, max: 110 },
  temperatur: { min: 1800, max: 2200 },
  herkunft: 'station',
};

let n = 0;
function ansatz(typ: AnsatzZeile['typ'], begonnenAm: string): AnsatzZeile {
  n += 1;
  return {
    id: uid('21', 200 + n),
    platz_id: platzId('2.3'),
    typ,
    status: 'abgeschlossen',
    begonnen_am: begonnenAm,
    kontrollmessung_id: null,
    endmessung_id: null,
    storniert_am: null,
  };
}

function rechne(
  betriebsart: Parameters<typeof hinweise>[0]['betriebsart'],
  werte: Werte,
  o: { vorher?: Vorher; ansaetze?: AnsatzZeile[]; sollband?: Sollband | null; jetzt?: Date } = {},
): { hinweise: Hinweis[]; alarm: boolean } {
  const sollband = o.sollband === null ? undefined : (o.sollband ?? BAND);
  const bewertungen = sollband ? bewerten(werte, sollband, { uEc: 10, uPh: 10 }) : {};
  return hinweise(
    {
      betriebsart,
      werte,
      bewertungen,
      ...(sollband ? { sollband } : {}),
      vorher: o.vorher ?? {},
      ansaetze: o.ansaetze ?? [],
    },
    o.jetzt ?? JETZT,
    ZEITZONE,
  );
}

const ausloeser = (r: { hinweise: Hinweis[] }) => r.hinweise.map((h) => h.ausloeser);
const von = (r: { hinweise: Hinweis[] }, a: Hinweis['ausloeser']) =>
  r.hinweise.find((h) => h.ausloeser === a);
const ganz = (h: Hinweis | undefined) => (h ? `${h.folge} ${h.massnahme}` : '');

describe('UC9-AK11 Kratky belüftet (R10.4, Hinweisteil)', () => {
  const vorher: Vorher = { ph: { wert: 650, giltAb: '2027-01-05T17:00:00.000Z' } };

  it('UC9-AK11 6.7 ohne Eisenhinweis, Ton info, alarm falsch', () => {
    // EC ausserhalb dazu, damit ein Hinweis entsteht: auch er ohne Alarm
    const r = rechne('kratky_belueftet', { ph: 670, ec: 160 }, { vorher });
    expect(ausloeser(r)).not.toContain('eisen');
    expect(ausloeser(r)).not.toContain('ph_hoch');
    expect(ausloeser(r)).not.toContain('ph_anstieg');
    expect(r.hinweise.length).toBeGreaterThan(0);
    for (const h of r.hinweise) expect(h.ton).toBe('info');
    expect(r.alarm).toBe(false);
  });

  it('UC9-AK11 6.9 Eisenhinweis mit pH-Minus', () => {
    const r = rechne('kratky_belueftet', { ph: 690 }, { vorher });
    const eisen = von(r, 'eisen');
    expect(eisen?.folge).toContain('Eisen- und Mangansperre');
    expect(eisen?.massnahme).toContain('pH schrittweise senken');
    expect(eisen?.ton).toBe('info');
    expect(r.alarm).toBe(false);
  });

  it('UC9-AK11 6.8 genau an der Grenze des Beobachtungsbands ohne Eisenhinweis', () => {
    const r = rechne(
      'kratky_belueftet',
      { ph: 680 },
      { vorher: { ph: { wert: 670, giltAb: '2027-01-05T17:00:00.000Z' } } },
    );
    expect(ausloeser(r)).not.toContain('eisen');
  });
});

describe('R10.4 Anstieg je Woche', () => {
  it('R10.4 Anstieg 0.3 pH in 7 Tagen ergibt «Wurzeln und Lösung prüfen»', () => {
    const r = rechne(
      'kratky_belueftet',
      { ph: 630 },
      { vorher: { ph: { wert: 600, giltAb: '2027-01-05T17:00:00.000Z' } } },
    );
    expect(ausloeser(r)).toContain('ph_anstieg');
    expect(ganz(von(r, 'ph_anstieg'))).toContain('Wurzeln und Lösung prüfen');
    expect(ausloeser(r)).not.toContain('eisen');
    expect(r.alarm).toBe(false);
  });

  it('R10.4 Anstieg 0.2 in 7 Tagen ohne Hinweis', () => {
    const vorher: Vorher = { ph: { wert: 600, giltAb: '2027-01-05T17:00:00.000Z' } };
    expect(ausloeser(rechne('kratky_belueftet', { ph: 620 }, { vorher }))).not.toContain('ph_anstieg');
    // 0.21 in 7 Tagen liegt über 0.2 je Woche
    expect(ausloeser(rechne('kratky_belueftet', { ph: 621 }, { vorher }))).toContain('ph_anstieg');
  });

  it('R10.4 TZ Anstieg 0.2 vom 25.3. 20:00 bis 1.4. 09:00 über die Sommerzeit zählt 7 Kalendertage, ohne Hinweis', () => {
    // 6.5 Tage in Millisekunden, 7 Kalendertage in Zürich (Umstellung 28.3.2027)
    const r = rechne(
      'kratky_belueftet',
      { ph: 620 },
      {
        vorher: { ph: { wert: 600, giltAb: '2027-03-25T19:00:00.000Z' } },
        jetzt: new Date('2027-04-01T07:00:00.000Z'),
      },
    );
    expect(ausloeser(r)).not.toContain('ph_anstieg');
  });

  it('R10.4 Anstieg nach einem Ansatz seit der vorherigen Messung zählt nicht', () => {
    const r = rechne(
      'kratky_belueftet',
      { ph: 630 },
      {
        vorher: { ph: { wert: 600, giltAb: '2027-01-05T17:00:00.000Z' } },
        ansaetze: [ansatz('nachfuellen', '2027-01-08T10:00:00.000Z')],
      },
    );
    expect(ausloeser(r)).not.toContain('ph_anstieg');
  });

  it('R10.4 Kratky ohne Pumpe wie belüftet', () => {
    const knapp = rechne('kratky', { ph: 670 });
    expect(ausloeser(knapp)).not.toContain('eisen');
    expect(ausloeser(knapp)).not.toContain('ph_hoch');
    expect(knapp.alarm).toBe(false);
    const hoch = rechne('kratky', { ph: 690 });
    expect(von(hoch, 'eisen')?.massnahme).toContain('pH schrittweise senken');
    expect(hoch.alarm).toBe(false);
  });
});

describe('R10.5 Warnhinweise je Auslöser und Betriebsart', () => {
  it('R10.5 EC über Band DWC: Salzstress, Teilwechsel; Kratky: nur Wasser', () => {
    const dwc = von(rechne('dwc', { ec: 160 }), 'ec_hoch');
    expect(dwc?.folge).toContain('Gefahr von Salzstress');
    expect(dwc?.massnahme).toContain('Teilwechsel');
    expect(dwc?.ton).toBe('danger');
    const kratky = von(rechne('kratky_belueftet', { ec: 160 }), 'ec_hoch');
    expect(kratky?.folge).toContain('Gefahr von Salzstress');
    expect(kratky?.massnahme).toContain('beim nächsten Nachfüllen nur Wasser');
    expect(kratky?.ton).toBe('info');
    const station = von(rechne('station', { ec: 140 }, { sollband: STATION }), 'ec_hoch');
    expect(station?.massnahme).toContain('Lösung mit fester Dosis wechseln');
  });

  it('R10.5 EC unter Band: Nährstoffmangel, Restdosis', () => {
    const r = rechne('dwc', { ec: 80 });
    const h = von(r, 'ec_tief');
    expect(h?.folge).toContain('Nährstoffmangel');
    expect(h?.massnahme).toContain('Restdosis');
    expect(r.alarm).toBe(true);
    const kratky = von(rechne('kratky_belueftet', { ec: 60 }), 'ec_tief');
    expect(kratky?.massnahme).toContain('beim nächsten Nachfüllen halbe Konzentration');
  });

  it('R10.5 pH unter Band: Magnesium und Kalzium, pH vorsichtig anheben', () => {
    const h = von(rechne('dwc', { ph: 570 }), 'ph_tief');
    expect(h?.folge).toContain('Mangel an Magnesium und Kalzium möglich');
    expect(h?.massnahme).toContain('pH vorsichtig anheben');
  });

  it('R10.5 pH-Fall 0.3 ohne pH-Minus: Wurzeln und Geruch prüfen; mit pH-Korrektur dazwischen nicht', () => {
    const vorher: Vorher = { ph: { wert: 640, giltAb: '2027-01-10T17:00:00.000Z' } };
    const fall = rechne('dwc', { ph: 610 }, { vorher });
    const h = von(fall, 'ph_fall');
    expect(h?.folge).toContain('Frühsignal für Wurzelfäule');
    expect(h?.massnahme).toContain('Wurzeln und Geruch prüfen');
    // 0.29 ist kein Fall um 0.3
    expect(ausloeser(rechne('dwc', { ph: 611 }, { vorher }))).not.toContain('ph_fall');
    // protokolliertes pH-Minus zwischen den Messungen
    const korrigiert = rechne(
      'dwc',
      { ph: 610 },
      { vorher, ansaetze: [ansatz('ph_korrektur', '2027-01-11T10:00:00.000Z')] },
    );
    expect(ausloeser(korrigiert)).not.toContain('ph_fall');
  });

  it('R10.5 24.1 °C Pythium-Risiko, 24.0 °C nicht; 15.9 °C zu kalt für Tomate und Chili', () => {
    const warm = rechne('dwc', { temperatur: 2410 });
    expect(von(warm, 'temp_hoch')?.folge).toContain('Pythium-Risiko');
    expect(ganz(von(warm, 'temp_hoch'))).toContain('Belüftung prüfen');
    expect(ausloeser(rechne('dwc', { temperatur: 2400 }))).not.toContain('temp_hoch');
    const kalt = rechne('dwc', { temperatur: 1590 });
    expect(von(kalt, 'temp_tief')?.folge).toContain('zu kalt für Tomate und Chili');
    expect(von(kalt, 'temp_tief')?.massnahme).toContain('Nachfüllwasser temperieren');
    expect(ausloeser(rechne('dwc', { temperatur: 1600 }))).not.toContain('temp_tief');
  });

  it('R10.5 W EC 1.00 Ausgangswasser prüfen, 0.99 nicht', () => {
    const w = rechne('messstelle', { ec: 100, temperatur: 1800 }, { sollband: null });
    const h = von(w, 'leitungswasser');
    expect(h?.folge).toContain('Risiko von Nährstoffblockaden');
    expect(h?.massnahme).toContain('Ausgangswasser prüfen');
    expect(ausloeser(rechne('messstelle', { ec: 99 }, { sollband: null }))).not.toContain('leitungswasser');
  });

  it('R10.5 im Band kein Hinweis und kein Alarm', () => {
    const r = rechne('dwc', { ph: 620, ec: 120, temperatur: 2000 });
    expect(r.hinweise).toEqual([]);
    expect(r.alarm).toBe(false);
  });

  it('R10.5 höchstens zwei Hinweise, Ausserhalb vor Knapp daneben, pH vor EC', () => {
    // pH ausserhalb, EC knapp, 24.5 °C: der Temperaturhinweis fällt weg
    const drei = rechne('dwc', { ph: 680, ec: 145, temperatur: 2450 });
    expect(ausloeser(drei)).toEqual(['ph_hoch', 'ec_hoch']);
    expect(drei.hinweise.map((h) => h.ton)).toEqual(['danger', 'warn']);
    // EC ausserhalb vor pH knapp
    expect(ausloeser(rechne('dwc', { ph: 670, ec: 160 }))).toEqual(['ec_hoch', 'ph_hoch']);
    // beide ausserhalb: pH vor EC
    expect(ausloeser(rechne('dwc', { ph: 560, ec: 160 }))).toEqual(['ph_tief', 'ec_hoch']);
  });

  it('R10.5 Text nennt Messwert und Sollwert «Gemessen 6.8, Sollwert deiner Anlage 6.0–6.5.»', () => {
    expect(von(rechne('dwc', { ph: 680 }), 'ph_hoch')?.text).toBe(
      'Gemessen 6.8, Sollwert deiner Anlage 6.0–6.5.',
    );
    expect(von(rechne('dwc', { ec: 160 }), 'ec_hoch')?.text).toBe(
      'Gemessen 1.60, Sollwert deiner Anlage 1.00–1.40.',
    );
    expect(von(rechne('dwc', { ph: 670 }), 'ph_hoch')?.ton).toBe('warn');
  });
});
