// Bündelteil ereignis_satz für Phasenstand, Phasenfragen und Verlauf (Plan 35 Testliste; R1.5, 04_architektur.md 4.2).
// tests/unit/datenpfad-buendel.test.ts bleibt unverändert.
//
// Vertrag (Plan 35 «Betroffene Dateien»): Teil { name: 'ereignis_satz', tabelle: 'ereignis', ohneStorno: true,
// typen: ['phase_antwort'] }, nach dem Teil messgeraet; die übrigen Teile auf der Tabelle ereignis bleiben.
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/daten/supabase.ts', () => ({ supabase: {}, SUPABASE_URL: 'http://127.0.0.1:54321' }));

const { BUENDEL_TEILE } = await import('../../src/daten/buendel.ts');

describe('R1.5 Bündelteil ereignis_satz', () => {
  it('R1.5 Bündelteil ereignis_satz liest nur phase_antwort ohne Storno', () => {
    const teil = BUENDEL_TEILE.find((t) => t.name === 'ereignis_satz');
    expect(teil).toMatchObject({ name: 'ereignis_satz', tabelle: 'ereignis', ohneStorno: true });
    expect(teil?.typen).toEqual(['phase_antwort']);
    expect(teil?.fensterTage).toBeUndefined();
    // die bisherigen Teile auf ereignis bleiben, keiner liest phase_antwort ausser ereignis_satz
    const aufEreignis = BUENDEL_TEILE.filter((t) => (t.tabelle ?? t.name) === 'ereignis').map((t) => t.name);
    expect(aufEreignis).toEqual(
      expect.arrayContaining(['ereignis', 'ereignis_pflanzung', 'ereignis_platz', 'ereignis_satz']),
    );
    for (const t of BUENDEL_TEILE.filter((x) => x.name !== 'ereignis_satz'))
      expect(t.typen ?? [], t.name).not.toContain('phase_antwort');
    // Namen eindeutig
    expect(new Set(BUENDEL_TEILE.map((t) => t.name)).size).toBe(BUENDEL_TEILE.length);
  });
});
