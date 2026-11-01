import { describe, expect, it } from 'vitest';
import { hinweisNeueVersionZeigen } from '../../src/ui/neueVersion.ts';

describe('Hinweis «Neue Version» (Service Worker «Hinweis statt Automatik»)', () => {
  it('TO7 Hinweis nur in Heute, wenn eine Version wartet und kein Ablauf läuft', () => {
    expect(
      hinweisNeueVersionZeigen({ route: { name: 'heute' }, neueVersionWartet: true, ablaufOffen: false }),
    ).toBe(true);
    expect(
      hinweisNeueVersionZeigen({ route: { name: 'info' }, neueVersionWartet: true, ablaufOffen: false }),
    ).toBe(false);
  });

  it('TO7 kein Hinweis während eines Ablaufs', () => {
    expect(
      hinweisNeueVersionZeigen({ route: { name: 'heute' }, neueVersionWartet: true, ablaufOffen: true }),
    ).toBe(false);
  });

  it('TO7 kein Hinweis ohne wartende Version', () => {
    expect(
      hinweisNeueVersionZeigen({ route: { name: 'heute' }, neueVersionWartet: false, ablaufOffen: false }),
    ).toBe(false);
  });

  it('TO7 kein Hinweis, solange der Ablauf-Stand unbekannt ist', () => {
    expect(
      hinweisNeueVersionZeigen({ route: { name: 'heute' }, neueVersionWartet: true, ablaufOffen: undefined }),
    ).toBe(false);
  });
});
