// W0K-AK1, W0K-AK2 [Unit] (Issue #261, 03_import_w0.md Abschnitte 3 und 7): Im Modus kandidaten zählen verworfene
// Kandidaten bei den Querprüfungen von art.csv (Stammfelder, V11, ernteart je Kulturform) nicht mit. Die echten
// Kandidatendateien liest kandidatenLesen() wie npm run w0:pruefen -- --kandidaten.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { pruefen } from '../../src/domain/w0/validator.ts';
import { kandidatenLesen } from '../../scripts/seed/dateien.ts';
import { PFAD } from './w0-hilfen.ts';

type W0Dateien = Parameters<typeof pruefen>[0];
type Zeile = Record<string, string | null>;

const wurzel = fileURLToPath(new URL('../..', import.meta.url));

function kandidaten(): W0Dateien {
  const gelesen = kandidatenLesen(wurzel);
  expect(gelesen.verstoesse).toEqual([]);
  return gelesen.dateien;
}

/** Kopie der Kandidatendateien mit zusätzlichen Zeilen in art.csv (nach einer bestehenden Zeile gebildet) */
function mitZeilen(d: W0Dateien, neu: Array<{ vorlage: string; felder: Zeile }>): W0Dateien {
  const art = d[PFAD.art];
  if (!art) throw new Error('art.csv fehlt in kandidaten/');
  const zeilen = [...art.zeilen];
  for (const { vorlage, felder } of neu) {
    const basis = art.zeilen.find((z) => z['kandidat_id'] === vorlage);
    if (!basis) throw new Error(`Vorlage ${vorlage} fehlt`);
    zeilen.push({ ...basis, ...felder });
  }
  return { ...d, [PFAD.art]: { ...art, zeilen } };
}

const querregeln = (d: W0Dateien) =>
  pruefen(d, { modus: 'kandidaten' }).verstoesse.filter(
    (v) => v.regel === 'V11' || /ernteart fehlt|Stammfeld/.test(v.text),
  );

describe('W0-Kandidaten ohne verworfene Kandidaten in den Querprüfungen (#261)', () => {
  it('W0K-AK1 Validator im Modus kandidaten über data/wissensbasis/kandidaten meldet keinen Verstoss', () => {
    expect(pruefen(kandidaten(), { modus: 'kandidaten' }).verstoesse).toEqual([]);
  });

  it('W0K-AK2 verworfenes kulturformen_erlaubt ohne die Vorgabe löst kein V11 aus, nicht verworfen schon', () => {
    const zeile = (status: string): Zeile => ({
      kandidat_id: 'art.lactuca_sativa.kulturformen_erlaubt#99',
      wert: 'kopf',
      status,
    });
    const verworfen = mitZeilen(kandidaten(), [
      { vorlage: 'art.lactuca_sativa.kulturformen_erlaubt#1', felder: zeile('verworfen') },
    ]);
    expect(querregeln(verworfen)).toEqual([]);
    const offen = mitZeilen(kandidaten(), [
      { vorlage: 'art.lactuca_sativa.kulturformen_erlaubt#1', felder: zeile('freigegeben') },
    ]);
    expect(querregeln(offen).map((v) => [v.regel, v.zeileId])).toContainEqual([
      'V11',
      'art.lactuca_sativa.kulturform_vorgabe',
    ]);
  });

  it('W0K-AK2 verworfene Kulturform ohne ernteart löst kein V1 aus, nicht verworfen schon', () => {
    const zeile = (status: string): Zeile => ({
      kandidat_id: 'ak.lactuca_sativa.keimling.kulturdauer_typisch_d#99',
      zeile_id: 'ak.lactuca_sativa.keimling.kulturdauer_typisch_d',
      kulturform: 'keimling',
      feld: 'kulturdauer_typisch_d',
      wert: '14',
      status,
    });
    const vorlage = 'ak.lactuca_sativa.kopf.ernteart#1';
    expect(querregeln(mitZeilen(kandidaten(), [{ vorlage, felder: zeile('verworfen') }]))).toEqual([]);
    const offen = querregeln(mitZeilen(kandidaten(), [{ vorlage, felder: zeile('freigegeben') }]));
    expect(offen.map((v) => [v.regel, v.text])).toContainEqual([
      'V1',
      'ernteart fehlt für Kulturform keimling',
    ]);
  });
});
