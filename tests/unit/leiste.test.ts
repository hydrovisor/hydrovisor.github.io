// Leiste unten (Issue #212, Plan 212; Entscheid 0025). Reines TypeScript: aktives Ziel je Route und Sitzung, Routen
// #/anlagen, #/saatgut und #/mehr. Vertrag (Plan 212, Auftrag des Leads):
// - src/ui/leiste.ts: LEISTE in der Reihenfolge Heute, Anlagen, Säen, Saatgut, Mehr; leisteZiel(route, sitzung, imAblauf)
//   liefert das Ziel nur auf den fünf Hauptseiten, Säen nur ausserhalb des Ablaufs, ohne Sitzung nie.
// - src/ui/router.ts: { name: 'anlagen'; standort?: 'outdoor' }, { name: 'mehr' }; #/saatgut und #/sorten ergeben die
//   Sorten-Liste, hashZu davon ist #/saatgut; #/sorten/neu und #/sorten/<uuid> bleiben.
// Das Modul wird je Test dynamisch geladen, damit die Router-Tests auch ohne src/ui/leiste.ts aus eigenem Grund rot sind.
import { describe, expect, it } from 'vitest';
import { hashZu, routeAusHash, type Route } from '../../src/ui/router.ts';

const leiste = () => import('../../src/ui/leiste.ts');

const SORTE_ID = '3c000000-0000-4000-8000-000000000001';

// Routen, die (noch) nicht im Typ stehen, über unknown, damit der Test vor der Umsetzung lädt
const r = (route: Record<string, unknown>) => route as unknown as Route;

const UNTERSEITEN: Route[] = [
  r({ name: 'messen', code: 'R-2.3' }),
  r({ name: 'messen', code: 'R-2.3', zeile: 3 }),
  r({ name: 'ansatz', code: 'R-2.3' }),
  r({ name: 'sorte', sorte: SORTE_ID }),
  r({ name: 'sorte-neu' }),
  r({ name: 'gefaess', code: 'R-2.3' }),
  r({ name: 'gefaess-aendern', code: 'R-2.3' }),
  r({ name: 'gefaess-neu', kuerzel: 'R' }),
  r({ name: 'anlage' }),
  r({ name: 'anlage', kuerzel: 'R' }),
  r({ name: 'anlage-neu' }),
  r({ name: 'einstellungen' }),
  r({ name: 'info' }),
  r({ name: 'vorlagen' }),
  r({ name: 'push' }),
  r({ name: 'etiketten' }),
  r({ name: 'etikett', code: 'R-2.3' }),
  r({ name: 'notfallblatt' }),
  r({ name: 'kalibrieren' }),
  r({ name: 'rundgang', kuerzel: 'R' }),
  r({ name: 'stromausfall' }),
  r({ name: 'keimung', satz: SORTE_ID }),
  r({ name: 'pflanze', pflanzung: SORTE_ID }),
  r({ name: 'umsetzen', satz: SORTE_ID }),
  r({ name: 'verschieben', topf: 'R-2.3.1' }),
  r({ name: 'pruefen', code: 'R-2.3' }),
  r({ name: 'muster' }),
  r({ name: 'anmelden' }),
];

const HAUPTSEITEN: [Route, string][] = [
  [r({ name: 'heute' }), 'heute'],
  [r({ name: 'anlagen' }), 'anlagen'],
  [r({ name: 'anlagen', standort: 'outdoor' }), 'anlagen'],
  [r({ name: 'saeen' }), 'saeen'],
  [r({ name: 'saeen', box: 'R-A1' }), 'saeen'],
  [r({ name: 'sorten' }), 'saatgut'],
  [r({ name: 'mehr' }), 'mehr'],
];

describe('Leiste: Ziele und aktives Ziel', () => {
  it('NV1-AK1 LEISTE nennt fünf Ziele in der Reihenfolge Heute, Anlagen, Säen, Saatgut, Mehr mit ihren Routen', async () => {
    const { LEISTE } = await leiste();
    expect(LEISTE.map((z) => z.ziel)).toEqual(['heute', 'anlagen', 'saeen', 'saatgut', 'mehr']);
    expect(LEISTE.map((z) => z.text)).toEqual(['Heute', 'Anlagen', 'Säen', 'Saatgut', 'Mehr']);
    expect(LEISTE.map((z) => z.route.name)).toEqual(['heute', 'anlagen', 'saeen', 'sorten', 'mehr']);
    expect(LEISTE.map((z) => hashZu(z.route))).toEqual([
      '#/heute',
      '#/anlagen',
      '#/saeen',
      '#/saatgut',
      '#/mehr',
    ]);
  });

  it('NV1-AK1 jedes Ziel der Leiste ist auf seiner eigenen Route aktiv', async () => {
    const { LEISTE, leisteZiel } = await leiste();
    for (const z of LEISTE) expect(leisteZiel(z.route, 'angemeldet'), z.text).toBe(z.ziel);
  });

  it('NV1-AK1 auf den fünf Hauptseiten liefert leisteZiel das aktive Ziel', async () => {
    const { leisteZiel } = await leiste();
    for (const [route, ziel] of HAUPTSEITEN) {
      expect(leisteZiel(route, 'angemeldet'), JSON.stringify(route)).toBe(ziel);
      expect(leisteZiel(route, 'angemeldet', false), JSON.stringify(route)).toBe(ziel);
    }
  });

  it('NV1-AK1 Säen ab Schritt 2 (im Ablauf) ohne Leiste, in Schritt 1 mit', async () => {
    const { leisteZiel } = await leiste();
    expect(leisteZiel(r({ name: 'saeen' }), 'angemeldet', true)).toBeUndefined();
    expect(leisteZiel(r({ name: 'saeen', box: 'R-A1' }), 'angemeldet', true)).toBeUndefined();
    expect(leisteZiel(r({ name: 'saeen' }), 'angemeldet', false)).toBe('saeen');
  });

  it('SG1-AK5 SG1-AK7 Saatgut in «Tüte erfassen» und «Fotos nachtragen» (im Ablauf) ohne Leiste, in der Liste mit', async () => {
    const { leisteZiel } = await leiste();
    expect(leisteZiel(r({ name: 'sorten' }), 'angemeldet', true)).toBeUndefined();
    expect(leisteZiel(r({ name: 'sorten' }), 'angemeldet', false)).toBe('saatgut');
    expect(leisteZiel(r({ name: 'sorten' }), 'angemeldet')).toBe('saatgut');
    expect(leisteZiel(r({ name: 'sorten' }), 'abgemeldet', true)).toBeUndefined();
  });

  it('NV1-AK1 Abläufe und Unterseiten ohne Leiste: Messen, Ansatz, Neue Sorte, Gefäss erfassen, Anlage, Einstellungen usw.', async () => {
    const { leisteZiel } = await leiste();
    for (const route of UNTERSEITEN) {
      expect(leisteZiel(route, 'angemeldet'), JSON.stringify(route)).toBeUndefined();
      expect(leisteZiel(route, 'angemeldet', false), JSON.stringify(route)).toBeUndefined();
    }
  });

  it('NV1-AK1 ohne Sitzung nie eine Leiste, auch nicht auf den Hauptseiten', async () => {
    const { leisteZiel } = await leiste();
    for (const [route] of HAUPTSEITEN)
      expect(leisteZiel(route, 'abgemeldet'), JSON.stringify(route)).toBeUndefined();
    for (const route of UNTERSEITEN)
      expect(leisteZiel(route, 'abgemeldet'), JSON.stringify(route)).toBeUndefined();
  });
});

describe('Router: Hauptseiten der Leiste', () => {
  it('NV1-AK2 #/anlagen mit und ohne Standort, unbekannter Standort fällt weg', () => {
    expect(routeAusHash('#/anlagen')).toEqual({ name: 'anlagen' });
    expect(routeAusHash('#/anlagen?standort=outdoor')).toEqual({ name: 'anlagen', standort: 'outdoor' });
    expect(routeAusHash('#/anlagen?standort=indoor')).toEqual({ name: 'anlagen' });
    expect(routeAusHash('#/anlagen?standort=mond')).toEqual({ name: 'anlagen' });
    expect(hashZu(r({ name: 'anlagen' }))).toBe('#/anlagen');
    expect(hashZu(r({ name: 'anlagen', standort: 'outdoor' }))).toBe('#/anlagen?standort=outdoor');
  });

  it('NV1-AK2 #/mehr', () => {
    expect(routeAusHash('#/mehr')).toEqual({ name: 'mehr' });
    expect(hashZu(r({ name: 'mehr' }))).toBe('#/mehr');
  });

  it('NV1-AK2 #/saatgut und #/sorten ergeben dieselbe Sorten-Liste, hashZu davon ist #/saatgut', () => {
    expect(routeAusHash('#/saatgut')).toEqual({ name: 'sorten' });
    expect(routeAusHash('#/sorten')).toEqual({ name: 'sorten' });
    expect(routeAusHash('#/saatgut')).toEqual(routeAusHash('#/sorten'));
    expect(hashZu({ name: 'sorten' })).toBe('#/saatgut');
  });

  it('NV1-AK2 #/sorten/neu und #/sorten/<id> bleiben gültig, hashZu dafür unverändert', () => {
    expect(routeAusHash('#/sorten/neu')).toEqual({ name: 'sorte-neu' });
    expect(routeAusHash(`#/sorten/${SORTE_ID}`)).toEqual({ name: 'sorte', sorte: SORTE_ID });
    expect(hashZu({ name: 'sorte-neu' })).toBe('#/sorten/neu');
    expect(hashZu({ name: 'sorte', sorte: SORTE_ID })).toBe(`#/sorten/${SORTE_ID}`);
  });

  it('NV1-AK2 Hin und zurück: Route aus dem Hash jeder Hauptseite ergibt wieder denselben Hash', () => {
    for (const hash of [
      '#/heute',
      '#/anlagen',
      '#/anlagen?standort=outdoor',
      '#/saeen',
      '#/saatgut',
      '#/mehr',
    ])
      expect(hashZu(routeAusHash(hash)), hash).toBe(hash);
  });
});
