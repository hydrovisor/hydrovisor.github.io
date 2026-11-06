// Bündelteile für Ernte, Kulturentscheid und Schossen (Plan 38 Testliste; R1.7, 04_architektur.md 4.2).
// tests/unit/phasen-buendel.test.ts und tests/unit/umsetzen-nebenwirkungen.test.ts bleiben unverändert.
//
// Vertrag (Abweichung von Plan 38 «Betroffene Dateien», siehe tests/fixtures/ernte.ts): ereignis_pflanzung.typen um
// schossen_handlung, beobachtung und kultur_entscheid erweitert (kultur_entscheid steht am Satz; der Teil filtert nur
// nach typ). ereignis_satz bleibt genau ['phase_antwort'] (Testvertrag Plan 35). Keine neuen Teile.
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/daten/supabase.ts', () => ({ supabase: {}, SUPABASE_URL: 'http://127.0.0.1:54321' }));

const { BUENDEL_TEILE } = await import('../../src/daten/buendel.ts');

describe('R1.7 Bündelteile', () => {
  it('R1.7 Bündel lädt schossen_handlung und beobachtung in ereignis_pflanzung, kultur_entscheid am Satz ebenfalls in ereignis_pflanzung', () => {
    const teil = (name: string) => BUENDEL_TEILE.find((x) => x.name === name);
    const pflanzung = teil('ereignis_pflanzung');
    expect(pflanzung).toMatchObject({ tabelle: 'ereignis', ohneStorno: true });
    for (const typ of ['schossen_handlung', 'beobachtung', 'kultur_entscheid'])
      expect(pflanzung?.typen, typ).toContain(typ);
    // die bisherigen Typen bleiben
    for (const typ of [
      'keimung',
      'abschluss',
      'wiederherstellen',
      'verschieben',
      'umsetzen',
      'tausch',
      'ernte',
    ])
      expect(pflanzung?.typen, typ).toContain(typ);
    expect(pflanzung?.fensterTage).toBeUndefined();
    // Plan 35: ereignis_satz unverändert; kultur_entscheid über ereignis_pflanzung (Zeilen am Satz)
    expect(teil('ereignis_satz')?.typen).toEqual(['phase_antwort']);
    // jeder neue Typ in genau einem Teil auf der Tabelle ereignis
    const aufEreignis = BUENDEL_TEILE.filter((t) => (t.tabelle ?? t.name) === 'ereignis');
    for (const typ of ['schossen_handlung', 'beobachtung', 'kultur_entscheid'])
      expect(
        aufEreignis.filter((t) => (t.typen ?? []).includes(typ)).map((t) => t.name),
        typ,
      ).toEqual(['ereignis_pflanzung']);
    // keine neuen Teile, Namen eindeutig
    expect(aufEreignis.map((t) => t.name).sort()).toEqual(
      ['ereignis', 'ereignis_pflanzung', 'ereignis_platz', 'ereignis_satz'].sort(),
    );
    expect(new Set(BUENDEL_TEILE.map((t) => t.name)).size).toBe(BUENDEL_TEILE.length);
  });
});
