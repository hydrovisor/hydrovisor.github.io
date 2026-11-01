import { describe, expect, it, vi } from 'vitest';
import { dauerhaftenSpeicherAnfragen } from '../../src/anmeldung/speicher.ts';

describe('Dauerhafter Speicher', () => {
  it('fragt nicht erneut an, wenn schon erteilt', async () => {
    const persist = vi.fn(async () => true);
    expect(await dauerhaftenSpeicherAnfragen({ persisted: async () => true, persist })).toBe('erteilt');
    expect(persist).not.toHaveBeenCalled();
  });

  it('fragt an und meldet erteilt oder nicht erteilt', async () => {
    expect(
      await dauerhaftenSpeicherAnfragen({ persisted: async () => false, persist: async () => true }),
    ).toBe('erteilt');
    expect(
      await dauerhaftenSpeicherAnfragen({ persisted: async () => false, persist: async () => false }),
    ).toBe('nicht-erteilt');
  });

  it('ohne StorageManager nicht verfügbar', async () => {
    expect(await dauerhaftenSpeicherAnfragen(undefined)).toBe('nicht-verfuegbar');
    expect(await dauerhaftenSpeicherAnfragen({ persisted: async () => false })).toBe('nicht-verfuegbar');
  });

  it('eine Ausnahme gilt als nicht erteilt', async () => {
    const fehler = async (): Promise<boolean> => {
      throw new Error('SecurityError');
    };
    expect(await dauerhaftenSpeicherAnfragen({ persisted: fehler, persist: fehler })).toBe('nicht-erteilt');
  });
});
