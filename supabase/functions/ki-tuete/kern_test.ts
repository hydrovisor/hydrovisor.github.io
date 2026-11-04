// Kern der Edge Function ki-tuete (Issue #14, Plan 14 Testliste; UC4-AK1, UC4-AK2, UC4-AK5 mit TK1 bis TK3;
// Konzept 11.1, 11.3; 04_architektur.md 6; 01_fachregeln.md G2). Deno test ohne Netz und ohne Secrets:
// Fake KiDaten im Speicher, Fake ModellRufer, virtuelle Uhr (kein Test wartet echt).
//
// Vorausgesetzt (Plan 14, Schnittstellen):
//   supabase/functions/ki-tuete/kern.ts
//     ModellAntwort, ModellRufer, Zeitgeber, KiDaten, anfragePruefen(body), tueteLesen(eingabe, appVersion, abh)
//   src/domain/ki/modelle.ts HAUPTMODELL, AUSWEICHMODELL; src/domain/ki/anfrage.ts anfrageBauen
//   Die virtuelle Uhr ist ereignisgesteuert: zeit.warten(ms, signal) und die Antwortzeit der Fake-Modelle sind
//   Zeitpunkte auf derselben Achse; die Uhr springt erst zum frühesten offenen Zeitpunkt, wenn keine andere Arbeit
//   ansteht. Der Kern bricht sein Warten über signal ab, sobald das Modell geantwortet hat (sonst bliebe die Frist
//   offen), und bricht den Modellaufruf über signal ab, wenn die Frist abläuft. Ein abgebrochenes warten() endet
//   ohne Zeitsprung; ein abgebrochener Fake-Aufruf liefert { art: 'ausweichen' }.
//   Tagesgrenze: aufrufeSeit(tagesbeginn(kalendertag(jetzt, zz), zz)) mit zz = Europe/Zurich.
import { strict as assert } from 'node:assert';
import { anfragePruefen, tueteLesen, type KiDaten, type ModellAntwort, type Zeitgeber } from './kern.ts';
import { AUSWEICHMODELL, HAUPTMODELL } from '../../../src/domain/ki/modelle.ts';
import { KI_FELDER, feldTexte } from '../../../src/domain/ki/schema.ts';
import { feldStatus } from '../../../src/domain/ki/uebernahme.ts';
import type { KiEingabe } from '../../../src/domain/ki/anfrage.ts';

const ZUERICH = 'Europe/Zurich';
const APP = '0.1.0+abc1234';
// 15.1.2027 11:00 Zürich; Tagesbeginn 15.1. 00:00 Zürich = 14.1. 23:00 UTC
const START = '2027-01-15T10:00:00.000Z';
const TAGESBEGINN = '2027-01-14T23:00:00.000Z';
const EINGABE: KiEingabe = { art: 'bilder', bilder: [{ base64: 'dm9ybmU=' }, { base64: 'aGludGVu' }] };

const FELDER = {
  name: 'Rote Probe',
  art: 'Lactuca sativa',
  keimart: 'licht',
  keimtemperatur_min_c: 15,
  keimtemperatur_max_c: 20,
  keimdauer_min_d: 7,
  keimdauer_max_d: 14,
  kulturdauer_min_d: 50,
  kulturdauer_max_d: 70,
  aussaat_von_monat: 3,
  aussaat_bis_monat: 8,
  hersteller: 'Beispiel Saaten',
};
const EIGENSCHAFTEN = Object.keys(FELDER).sort();

async function fixtureText(datei: string): Promise<string> {
  const body = JSON.parse(
    await Deno.readTextFile(new URL(`../../../tests/fixtures/ki/${datei}`, import.meta.url)),
  ) as {
    content: { type: string; text?: string }[];
  };
  const text = body.content.find((b) => b.type === 'text')?.text;
  if (text === undefined) throw new Error(`Fixture ${datei} ohne Textblock`);
  return text;
}

const okAntwort = (text: string): ModellAntwort => ({
  art: 'ok',
  text,
  eingabeTokens: 2000,
  ausgabeTokens: 300,
});
const okFelder = (): ModellAntwort => okAntwort(JSON.stringify(FELDER));

class VirtuelleUhr implements Zeitgeber {
  t: number;
  wartezeiten: number[] = [];
  private offen: { at: number; los: () => void }[] = [];
  private geplant = false;

  constructor(start: string) {
    this.t = Date.parse(start);
  }

  jetzt(): Date {
    return new Date(this.t);
  }

  warten(ms: number, signal: AbortSignal): Promise<void> {
    this.wartezeiten.push(ms);
    return this.nach(ms, signal);
  }

  /** Zeitpunkt jetzt + ms; bei Abbruch Ende ohne Zeitsprung */
  nach(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise<void>((resolve) => {
      if (signal?.aborted) return resolve();
      const eintrag = { at: this.t + ms, los: resolve };
      this.offen.push(eintrag);
      signal?.addEventListener(
        'abort',
        () => {
          this.offen = this.offen.filter((e) => e !== eintrag);
          resolve();
        },
        { once: true },
      );
      this.planen();
    });
  }

  private planen() {
    if (this.geplant) return;
    this.geplant = true;
    setTimeout(() => {
      this.geplant = false;
      this.schritt();
    }, 0);
  }

  private schritt() {
    if (this.offen.length === 0) return;
    this.offen.sort((a, b) => a.at - b.at);
    const naechster = this.offen.shift();
    if (!naechster) return;
    this.t = Math.max(this.t, naechster.at);
    naechster.los();
    if (this.offen.length > 0) this.planen();
  }
}

type Zeile = {
  id: string;
  modell: string;
  app_version: string;
  status: string;
  dauer_ms: number | null;
  erfasst_am: Date;
};

class Daten implements KiDaten {
  zeilen: Zeile[] = [];
  abfragen: Date[] = [];
  fehlerBei: 'aufrufeSeit' | 'aufrufBeginnen' | 'aufrufBeenden' | undefined;
  private uhr: VirtuelleUhr;

  constructor(uhr: VirtuelleUhr) {
    this.uhr = uhr;
  }

  vorbelegen(anzahl: number, iso: string) {
    for (let i = 0; i < anzahl; i++) {
      this.zeilen.push({
        id: crypto.randomUUID(),
        modell: HAUPTMODELL,
        app_version: 'alt',
        status: 'ok',
        dauer_ms: 4000,
        erfasst_am: new Date(iso),
      });
    }
  }

  aufrufeSeit(ab: Date): Promise<number> {
    this.abfragen.push(ab);
    if (this.fehlerBei === 'aufrufeSeit') return Promise.reject(new Error('Datenbank nicht erreichbar'));
    return Promise.resolve(this.zeilen.filter((z) => z.erfasst_am.getTime() >= ab.getTime()).length);
  }

  aufrufBeginnen(z: { modell: string; app_version: string }): Promise<string> {
    if (this.fehlerBei === 'aufrufBeginnen') return Promise.reject(new Error('Datenbank nicht erreichbar'));
    const id = crypto.randomUUID();
    this.zeilen.push({ id, ...z, status: 'gestartet', dauer_ms: null, erfasst_am: this.uhr.jetzt() });
    return Promise.resolve(id);
  }

  aufrufBeenden(
    id: string,
    z: { status: 'ok' | 'ausweichmodell' | 'fehler' | 'zeitueberschreitung'; dauer_ms: number },
  ): Promise<void> {
    if (this.fehlerBei === 'aufrufBeenden') return Promise.reject(new Error('Datenbank nicht erreichbar'));
    const zeile = this.zeilen.find((x) => x.id === id);
    if (!zeile) return Promise.reject(new Error(`unbekannte Zeile ${id}`));
    zeile.status = z.status;
    zeile.dauer_ms = z.dauer_ms;
    return Promise.resolve();
  }

  neue(): Zeile[] {
    return this.zeilen.filter((z) => z.app_version !== 'alt');
  }
}

type Verhalten = { nachMs?: number; antwort: ModellAntwort } | 'haengt' | 'wirft';

function umgebung(haupt: Verhalten, ausweich: Verhalten, start = START) {
  const uhr = new VirtuelleUhr(start);
  const daten = new Daten(uhr);
  const rufe: { modell: string; t: number; anfrageModell: unknown; zeilenstatus: string | undefined }[] = [];
  const modell = async (
    m: string,
    anfrage: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<ModellAntwort> => {
    const letzte = daten.zeilen[daten.zeilen.length - 1];
    rufe.push({
      modell: m,
      t: uhr.t - Date.parse(start),
      anfrageModell: anfrage['model'],
      zeilenstatus: letzte?.modell === m ? letzte.status : undefined,
    });
    const v = m === HAUPTMODELL ? haupt : ausweich;
    if (v === 'wirft') throw new TypeError('fetch failed');
    if (v === 'haengt') {
      // hängt bis zum Abbruch; Sicherung nach 10 virtuellen Minuten, damit ein Kern ohne Frist nicht ewig wartet
      await uhr.nach(600_000, signal);
      return { art: 'ausweichen' };
    }
    await uhr.nach(v.nachMs ?? 0, signal);
    if (signal.aborted) return { art: 'ausweichen' };
    return v.antwort;
  };
  const lesen = (eingabe: KiEingabe = EINGABE) =>
    tueteLesen(eingabe, APP, { daten, modell, zeit: uhr, zeitzone: ZUERICH });
  return { uhr, daten, rufe, lesen };
}

function vonHand(r: Awaited<ReturnType<typeof tueteLesen>>) {
  if (r.ergebnis !== 'von_hand') throw new Error(`erwartet von_hand, erhalten ${JSON.stringify(r)}`);
  return r;
}

function ok(r: Awaited<ReturnType<typeof tueteLesen>>) {
  if (r.ergebnis !== 'ok') throw new Error(`erwartet ok, erhalten ${JSON.stringify(r)}`);
  return r;
}

Deno.test('UC4-AK1 Kern liefert nur Schemafelder', async () => {
  const u = umgebung(
    { antwort: okAntwort(JSON.stringify({ ...FELDER, ph: 6.0, ec: 1.4, phase: 'wachstum' })) },
    'haengt',
  );
  const r = ok(await u.lesen());
  assert.deepEqual(Object.keys(r.felder).sort(), EIGENSCHAFTEN);
  assert.deepEqual(r.felder, FELDER);
  assert.deepEqual([...r.verworfen].sort(), ['ec', 'ph', 'phase']);
  assert.equal(r.modell, HAUPTMODELL);
  assert.equal(r.ausweichmodell, false);
  assert.equal(u.rufe[0]?.anfrageModell, HAUPTMODELL);
});

Deno.test('UC4-AK2 Ausnahme im Datenzugriff ergibt von_hand statt Fehler', async () => {
  for (const stelle of ['aufrufeSeit', 'aufrufBeginnen'] as const) {
    const u = umgebung({ antwort: okFelder() }, { antwort: okFelder() });
    u.daten.fehlerBei = stelle;
    const r = vonHand(await u.lesen());
    assert.equal(r.grund, 'fehler', stelle);
    assert.ok(r.hinweis.length > 0);
    assert.equal(u.rufe.length, 0, `${stelle}: kein Request ohne Protokollzeile`);
  }

  const beenden = umgebung({ antwort: okFelder() }, { antwort: okFelder() });
  beenden.daten.fehlerBei = 'aufrufBeenden';
  const r = await beenden.lesen();
  assert.ok(r.ergebnis === 'ok' || r.ergebnis === 'von_hand');

  const wirft = umgebung('wirft', 'wirft');
  const w = vonHand(await wirft.lesen());
  assert.ok(['fehler', 'zeit'].includes(w.grund));
});

Deno.test('UC4-AK2 Zeitüberschreitung ergibt von_hand ohne Ausnahme', async () => {
  const u = umgebung('haengt', 'haengt');
  const r = vonHand(await u.lesen());
  assert.equal(r.grund, 'zeit');
  assert.equal(r.dauerMs, 30_000);
  assert.ok(r.hinweis.includes('von Hand'));
  assert.deepEqual(
    u.daten.neue().map((z) => [z.modell, z.status, z.dauer_ms]),
    [
      [HAUPTMODELL, 'zeitueberschreitung', 20_000],
      [AUSWEICHMODELL, 'zeitueberschreitung', 10_000],
    ],
  );
});

Deno.test(
  'UC4-AK5 TK1 Antwort mit «ph: 6.0»: ph verworfen, übrige Felder null → Feldprotokoll leer',
  async () => {
    const u = umgebung({ antwort: okAntwort(await fixtureText('antwort_ph.json')) }, 'haengt');
    const r = ok(await u.lesen());
    assert.deepEqual([...r.verworfen], ['ph']);
    assert.deepEqual(Object.keys(r.felder).sort(), EIGENSCHAFTEN);
    assert.ok(Object.values(r.felder).every((w) => w === null));
    const texte = feldTexte(r.felder);
    for (const feld of KI_FELDER) {
      assert.equal(feldStatus(texte[feld], null), 'leer', feld);
      assert.equal(feldStatus(texte[feld], 'von Tim getippt'), 'leer', feld);
    }
    assert.equal(u.rufe.length, 1);
    assert.deepEqual(
      u.daten.neue().map((z) => z.status),
      ['ok'],
    );
  },
);

Deno.test(
  'UC4-AK5 TK2 ungültiges JSON: von_hand ungueltig, kein Ausweichmodell, Hinweis «von Hand»',
  async () => {
    const u = umgebung(
      { antwort: okAntwort(await fixtureText('antwort_ungueltig.json')) },
      { antwort: okFelder() },
    );
    const r = vonHand(await u.lesen());
    assert.equal(r.grund, 'ungueltig');
    assert.ok(r.hinweis.includes('von Hand'));
    assert.deepEqual(
      u.rufe.map((x) => x.modell),
      [HAUPTMODELL],
    );
    assert.deepEqual(
      u.daten.neue().map((z) => [z.modell, z.status]),
      [[HAUPTMODELL, 'fehler']],
    );
  },
);

Deno.test('UC4-AK5 TK3 Hauptmodell 529: Ausweichmodell liefert, ausweichmodell true', async () => {
  const u = umgebung(
    { nachMs: 1500, antwort: { art: 'ausweichen', status: 529 } },
    { nachMs: 3000, antwort: okFelder() },
  );
  const r = ok(await u.lesen());
  assert.equal(r.ausweichmodell, true);
  assert.equal(r.modell, AUSWEICHMODELL);
  assert.deepEqual(r.felder, FELDER);
  assert.equal(r.dauerMs, 4500);
  assert.deepEqual(
    u.rufe.map((x) => [x.modell, x.anfrageModell]),
    [
      [HAUPTMODELL, HAUPTMODELL],
      [AUSWEICHMODELL, AUSWEICHMODELL],
    ],
  );
});

Deno.test('UC4-AK5 TK3 Hauptmodell 20 s ohne Antwort: Ausweichmodell', async () => {
  const u = umgebung('haengt', { nachMs: 1000, antwort: okFelder() });
  const r = ok(await u.lesen());
  assert.equal(r.ausweichmodell, true);
  assert.equal(r.modell, AUSWEICHMODELL);
  assert.equal(u.rufe[1]?.t, 20_000);
  assert.equal(r.dauerMs, 21_000);
  assert.deepEqual(
    u.daten.neue().map((z) => [z.modell, z.status, z.dauer_ms]),
    [
      [HAUPTMODELL, 'zeitueberschreitung', 20_000],
      [AUSWEICHMODELL, 'ausweichmodell', 1000],
    ],
  );
});

Deno.test('UC4-AK5 TK3 alle Modelle Fehler: von_hand nach höchstens 30 s', async () => {
  const beide = umgebung(
    { nachMs: 2000, antwort: { art: 'ausweichen', status: 529 } },
    { nachMs: 1000, antwort: { art: 'ausweichen', status: 503 } },
  );
  const r1 = vonHand(await beide.lesen());
  assert.equal(r1.grund, 'fehler');
  assert.ok(r1.hinweis.includes('von Hand'));
  assert.ok(r1.dauerMs <= 30_000);
  assert.equal(beide.rufe.length, 2);
  assert.deepEqual(
    beide.daten.neue().map((z) => z.status),
    ['fehler', 'fehler'],
  );

  const spaet = umgebung({ nachMs: 19_000, antwort: { art: 'ausweichen', status: 500 } }, 'haengt');
  const r2 = vonHand(await spaet.lesen());
  assert.equal(r2.grund, 'zeit');
  assert.equal(r2.dauerMs, 30_000);
});

Deno.test('11.1 dreissig Zeilen heute: von_hand grenze, kein Request, keine neue Zeile', async () => {
  const u = umgebung({ antwort: okFelder() }, { antwort: okFelder() });
  u.daten.vorbelegen(30, '2027-01-15T07:00:00.000Z');
  const r = vonHand(await u.lesen());
  assert.equal(r.grund, 'grenze');
  assert.ok(r.hinweis.includes('von Hand'));
  assert.equal(u.rufe.length, 0);
  assert.equal(u.daten.zeilen.length, 30);
});

Deno.test('11.1 G2 neunundzwanzig Zeilen und eine von gestern 23:30 Zürich: Request erlaubt', async () => {
  const u = umgebung({ antwort: okFelder() }, { antwort: okFelder() });
  u.daten.vorbelegen(29, '2027-01-15T07:00:00.000Z');
  u.daten.vorbelegen(1, '2027-01-14T22:30:00.000Z'); // 14.1. 23:30 Zürich
  ok(await u.lesen());
  assert.equal(u.rufe.length, 1);
  assert.equal(u.daten.abfragen[0]?.toISOString(), TAGESBEGINN);
});

Deno.test('11.1 G2 Zeile 00:30 Zürich (23:30 UTC Vortag) zählt zu heute', async () => {
  const u = umgebung({ antwort: okFelder() }, { antwort: okFelder() });
  u.daten.vorbelegen(29, '2027-01-15T07:00:00.000Z');
  u.daten.vorbelegen(1, '2027-01-14T23:30:00.000Z'); // 15.1. 00:30 Zürich
  const r = vonHand(await u.lesen());
  assert.equal(r.grund, 'grenze');
  assert.equal(u.rufe.length, 0);
});

Deno.test('11.1 G2 Sommerzeit: Tagesbeginn 1.7. 00:00 Zürich = 30.6. 22:00 UTC', async () => {
  const u = umgebung({ antwort: okFelder() }, { antwort: okFelder() }, '2027-07-01T06:00:00.000Z');
  ok(await u.lesen());
  assert.equal(u.daten.abfragen[0]?.toISOString(), '2027-06-30T22:00:00.000Z');
});

Deno.test(
  '11.1 neunundzwanzig Zeilen und Hauptmodell 529: Ausweichmodell nicht mehr gerufen, von_hand grenze',
  async () => {
    const u = umgebung(
      { nachMs: 1000, antwort: { art: 'ausweichen', status: 529 } },
      { antwort: okFelder() },
    );
    u.daten.vorbelegen(29, '2027-01-15T07:00:00.000Z');
    const r = vonHand(await u.lesen());
    assert.equal(r.grund, 'grenze');
    assert.deepEqual(
      u.rufe.map((x) => x.modell),
      [HAUPTMODELL],
    );
    assert.equal(u.daten.zeilen.length, 30);
    assert.deepEqual(
      u.daten.neue().map((z) => [z.modell, z.status]),
      [[HAUPTMODELL, 'fehler']],
    );
  },
);

Deno.test('04-6 Zeile vor dem Request mit Status gestartet, danach ok mit dauer_ms', async () => {
  const u = umgebung({ nachMs: 4200, antwort: okFelder() }, 'haengt');
  const r = ok(await u.lesen());
  assert.equal(r.dauerMs, 4200);
  assert.equal(u.rufe[0]?.zeilenstatus, 'gestartet');
  assert.deepEqual(
    u.daten.neue().map((z) => [z.modell, z.app_version, z.status, z.dauer_ms, z.erfasst_am.toISOString()]),
    [[HAUPTMODELL, APP, 'ok', 4200, START]],
  );
});

Deno.test(
  '04-6 Ausweichen: zwei Zeilen, erste fehler bzw. zeitueberschreitung, zweite ausweichmodell',
  async () => {
    const fehler = umgebung(
      { nachMs: 500, antwort: { art: 'ausweichen', status: 429 } },
      { nachMs: 2500, antwort: okFelder() },
    );
    ok(await fehler.lesen());
    assert.equal(fehler.rufe[1]?.zeilenstatus, 'gestartet');
    assert.deepEqual(
      fehler.daten.neue().map((z) => [z.modell, z.status, z.dauer_ms]),
      [
        [HAUPTMODELL, 'fehler', 500],
        [AUSWEICHMODELL, 'ausweichmodell', 2500],
      ],
    );

    const frist = umgebung('haengt', { nachMs: 2500, antwort: okFelder() });
    ok(await frist.lesen());
    assert.deepEqual(
      frist.daten.neue().map((z) => [z.modell, z.status]),
      [
        [HAUPTMODELL, 'zeitueberschreitung'],
        [AUSWEICHMODELL, 'ausweichmodell'],
      ],
    );
  },
);

Deno.test('11.3 Hauptmodell 404 (falsche Modell-ID): kein Ausweichen, von_hand fehler', async () => {
  for (const status of [400, 401, 404]) {
    const u = umgebung({ nachMs: 300, antwort: { art: 'fehler', status } }, { antwort: okFelder() });
    const r = vonHand(await u.lesen());
    assert.equal(r.grund, 'fehler', String(status));
    assert.deepEqual(
      u.rufe.map((x) => x.modell),
      [HAUPTMODELL],
    );
    assert.deepEqual(
      u.daten.neue().map((z) => z.status),
      ['fehler'],
    );
  }
});

Deno.test('11.3 Hauptmodell 529 nach 2 s: Ausweichmodell erhält bis 30 s Restzeit (28 s)', async () => {
  const u = umgebung({ nachMs: 2000, antwort: { art: 'ausweichen', status: 529 } }, 'haengt');
  const r = vonHand(await u.lesen());
  assert.equal(r.grund, 'zeit');
  assert.equal(u.rufe[1]?.t, 2000);
  assert.equal(r.dauerMs, 30_000);
  assert.deepEqual(
    u.daten.neue().map((z) => [z.modell, z.status, z.dauer_ms]),
    [
      [HAUPTMODELL, 'fehler', 2000],
      [AUSWEICHMODELL, 'zeitueberschreitung', 28_000],
    ],
  );

  const knapp = umgebung(
    { nachMs: 2000, antwort: { art: 'ausweichen', status: 529 } },
    { nachMs: 27_000, antwort: okFelder() },
  );
  const k = ok(await knapp.lesen());
  assert.equal(k.ausweichmodell, true);
  assert.equal(k.dauerMs, 29_000);
});

Deno.test('11.3 Text statt Bild geht an das Hauptmodell', async () => {
  const u = umgebung({ antwort: okFelder() }, 'haengt');
  ok(await u.lesen({ art: 'text', text: 'Salat Rote Probe, Lichtkeimer' }));
  assert.deepEqual(
    u.rufe.map((x) => x.modell),
    [HAUPTMODELL],
  );
});

Deno.test(
  '04-6 anfragePruefen: zwei Pfade ok; drei Pfade, «../», fremdes Muster, leerer Text, 8001 Zeichen → fehler',
  () => {
    const sorte = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';
    const p1 = `${sorte}/0a1b2c3d-4e5f-4a6b-8c7d-8e9f0a1b2c3d.jpg`;
    const p2 = `${sorte}/1b2c3d4e-5f6a-4b7c-9d8e-9f0a1b2c3d4e.jpg`;
    const p3 = `${sorte}/2c3d4e5f-6a7b-4c8d-ae9f-0a1b2c3d4e5f.jpg`;

    assert.deepEqual(anfragePruefen({ fotopfade: [p1, p2], app_version: APP }), {
      fotopfade: [p1, p2],
      appVersion: APP,
    });
    assert.deepEqual(anfragePruefen({ fotopfade: [p1], app_version: APP }), {
      fotopfade: [p1],
      appVersion: APP,
    });
    assert.deepEqual(anfragePruefen({ text: 'Rote Probe', app_version: APP }), {
      text: 'Rote Probe',
      appVersion: APP,
    });
    assert.deepEqual(anfragePruefen({ text: 'x'.repeat(8000), app_version: APP }), {
      text: 'x'.repeat(8000),
      appVersion: APP,
    });

    const abgelehnt: unknown[] = [
      { fotopfade: [p1, p2, p3], app_version: APP },
      { fotopfade: [], app_version: APP },
      { fotopfade: [`${sorte}/../0a1b2c3d-4e5f-4a6b-8c7d-8e9f0a1b2c3d.jpg`], app_version: APP },
      { fotopfade: [`../${sorte}/0a1b2c3d-4e5f-4a6b-8c7d-8e9f0a1b2c3d.jpg`], app_version: APP },
      { fotopfade: ['andere/tuete.jpg'], app_version: APP },
      { fotopfade: [`${sorte}/0a1b2c3d-4e5f-4a6b-8c7d-8e9f0a1b2c3d.png`], app_version: APP },
      { fotopfade: [`saattueten/${p1}`], app_version: APP },
      { fotopfade: [42], app_version: APP },
      { text: '', app_version: APP },
      { text: 'x'.repeat(8001), app_version: APP },
      { text: 17, app_version: APP },
      {},
      null,
      'Rote Probe',
    ];
    for (const body of abgelehnt) {
      const r = anfragePruefen(body);
      assert.ok('fehler' in r, `erwartet fehler für ${JSON.stringify(body)?.slice(0, 80)}`);
    }
  },
);
