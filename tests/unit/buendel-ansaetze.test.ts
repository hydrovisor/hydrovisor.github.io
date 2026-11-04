// Ansätze und Positionen im Offline-Bündel (Plan 20, Runde 1 Befunde 4 und 8): je Ort der letzte Ansatz und der
// letzte nicht abgebrochene Neuansatz oder Teilwechsel; Positionen nur dieser Ansätze.
import { describe, expect, it } from 'vitest';
import { BUENDEL_TEILE, erstelleBuendelLaden, type Buendeladapter } from '../../src/daten/buendel.ts';
import type { Antwort } from '../../src/daten/schreiben.ts';

const KONTEXT = { jetzt: new Date('2026-12-10T08:00:00Z'), zeitzone: 'Europe/Zurich' };
const antwort = (data: unknown) => ({ data, error: null }) as unknown as Antwort;

const ansatz = (id: string, platz: string, typ: string, tag: number, status = 'abgeschlossen') => ({
  id,
  platz_id: platz,
  typ,
  status,
  begonnen_am: `2026-12-${String(tag).padStart(2, '0')}T08:00:00Z`,
  storniert_am: null,
});
const position = (id: string, ansatzId: string) => ({
  id,
  ansatz_id: ansatzId,
  produkt_id: 'grow',
  storniert_am: null,
});

async function laden(inhalt: Record<string, unknown[]>) {
  const adapter: Buendeladapter = {
    istTim: async () => antwort(true),
    seite: async (teil) => antwort(inhalt[teil.name] ?? []),
  };
  const ergebnis = await erstelleBuendelLaden(
    adapter,
    { ersetzen: async () => {} },
    {
      appVersion: 'test',
      nutzerId: 'n',
    },
  )(KONTEXT);
  if (ergebnis.status !== 'geladen') throw new Error(ergebnis.status);
  return ergebnis.buendel.teile;
}

describe('Ansätze im Bündel', () => {
  it('UC1-AK2 je Ort der letzte Ansatz und der letzte Neuansatz; Positionen nur dieser Ansätze', async () => {
    expect(BUENDEL_TEILE.map((t) => t.name)).toContain('ansatz_position');
    const teile = await laden({
      naehrloesungsansatz: [
        ansatz('alt', 'p1', 'neuansatz', 1),
        ansatz('neu', 'p1', 'neuansatz', 3),
        ansatz('abgebrochen', 'p1', 'neuansatz', 5, 'abgebrochen'),
        ansatz('ph', 'p1', 'ph_korrektur', 6),
        ansatz('p2', 'p2', 'teilwechsel', 2),
      ],
      ansatz_position: [
        position('a1', 'alt'),
        position('n1', 'neu'),
        position('x1', 'abgebrochen'),
        position('t1', 'p2'),
      ],
    });
    const ids = (teile['naehrloesungsansatz'] as { id: string }[]).map((a) => a.id).sort();
    expect(ids).toEqual(['neu', 'p2', 'ph']);
    const positionen = (teile['ansatz_position'] as { id: string }[]).map((p) => p.id).sort();
    expect(positionen).toEqual(['n1', 't1']);
  });

  it('UC1-AK2 ist der letzte Ansatz selbst ein Neuansatz, steht er nur einmal im Bündel', async () => {
    const teile = await laden({
      naehrloesungsansatz: [ansatz('a', 'p1', 'nachfuellen', 1), ansatz('b', 'p1', 'neuansatz', 2)],
    });
    expect((teile['naehrloesungsansatz'] as { id: string }[]).map((a) => a.id)).toEqual(['b']);
  });
});
