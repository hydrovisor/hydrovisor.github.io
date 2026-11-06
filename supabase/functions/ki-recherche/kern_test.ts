// Kern der Edge Function ki-recherche (Issue #37, Plan 37 Testliste; UC4-AK7 mit TK1 bis TK3 für die Recherche;
// Konzept 9.1, 9.3, 9.4, 11.1, 11.3; Erratum E8; 01_fachregeln.md G2). Deno test ohne Netz und ohne Secrets:
// Fake RechercheDaten im Speicher, Fake ModellRufer mit aufgezeichneten Antworten, virtuelle Uhr in Europe/Zurich.
//
// Vorausgesetzt (Plan 37, Domänenfunktionen; A):
//   supabase/functions/ki-recherche/kern.ts
//     recherchieren(anfrage: { sorteId; appVersion }, abh: { daten: RechercheDaten; modell: ModellRufer;
//                   zeit: Zeitgeber; zeitzone }) → Promise<RechercheErgebnis>   (wirft nie)
//     ohneSchluessel() → RechercheErgebnis { ergebnis: 'abgebrochen', grund: 'nicht_eingerichtet', hinweis, dauerMs }
//     RechercheDaten = { stand(sorteId), aufrufeSeit(ab), aufrufBeginnen({ modell, zweck, app_version }),
//                        aufrufBeenden(id, { status, dauer_ms }), wertSchreiben(zeile), saatSchreiben(zeile) }
//     stand(sorteId) → { sorte: { sorte_id, name, art_id, kulturtyp },
//                        art: { art_id, name_de, name_wiss, kulturformen_erlaubt },
//                        kulturgruppe: { kulturgruppe_id, ec_obergrenze_validator },
//                        sollwerte, pflicht, saatempfehlungen }   (Zeilen wie in recherche-luecken.test.ts)
//     wertSchreiben / saatSchreiben → id oder null (schon vorhanden; zählt nicht als ergänzt)
//   ModellRufer, ModellAntwort, Zeitgeber typgleich aus ../ki-tuete/kern.ts. Der Rufer liefert den letzten Textblock.
//   Recherche-Request mit web_search, Quellenprüfer-Request mit web_fetch (daran unterscheidet der Fake die Aufrufe).
//   Die Kandidaten-ids aus der Recherche-Antwort gehen unverändert an den Quellenprüfer und in verworfen.
//   Tageslimit 30 je Zürcher Kalendertag für alle Zeilen ki_aufruf (ki-tuete und ki-recherche zusammen).
import { strict as assert } from 'node:assert';
import { ohneSchluessel, recherchieren, type RechercheDaten } from './kern.ts';
import type { ModellAntwort, Zeitgeber } from '../ki-tuete/kern.ts';
import { RECHERCHE_AUSWEICHMODELL, RECHERCHE_HAUPTMODELL } from '../../../src/domain/ki/modelle.ts';

const ZUERICH = 'Europe/Zurich';
const APP = '0.1.0+abc1234';
// 15.1.2027 11:00 Zürich
const START = '2027-01-15T10:00:00.000Z';
const SORTE = '37000000-0000-4000-8000-000000000001';
const ART = 'testus_lactucoides';

async function fixtureText(datei: string): Promise<string> {
  const body = JSON.parse(
    await Deno.readTextFile(new URL(`../../../tests/fixtures/ki/recherche/${datei}`, import.meta.url)),
  ) as { content: { type: string; text?: string }[] };
  const texte = body.content.filter((b) => b.type === 'text');
  const text = texte[texte.length - 1]?.text;
  if (text === undefined) throw new Error(`Fixture ${datei} ohne Textblock`);
  return text;
}

const ok = (text: string): ModellAntwort => ({ art: 'ok', text, eingabeTokens: 5000, ausgabeTokens: 800 });

class VirtuelleUhr implements Zeitgeber {
  t: number;
  private offen: { at: number; los: () => void }[] = [];
  private geplant = false;

  constructor(start: string) {
    this.t = Date.parse(start);
  }

  jetzt(): Date {
    return new Date(this.t);
  }

  warten(ms: number, signal: AbortSignal): Promise<void> {
    return this.nach(ms, signal);
  }

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

const PFLICHT = ['anwendbar', 'dauer', 'bbch', 'ph', 'ec', 'wechselmerkmal'].map((groesse) => ({
  phase: 'wachstum',
  groesse,
  mindestens_art: ['dauer', 'ph', 'ec'].includes(groesse),
}));

function sw(groesse: string, ebene: string, evidenz: string, extra: Record<string, unknown> = {}) {
  return {
    sorte_id: SORTE,
    phase: 'wachstum',
    groesse,
    wert_min: 1,
    wert_typ: null,
    wert_max: 2,
    text_wert: null,
    herkunft_ebene: ebene,
    evidenzklasse: evidenz,
    vermerk: 'keine',
    ...extra,
  };
}

/** Offen: pH und EC Wachstum, Saatempfehlung Schnitt */
function stand(voll = false) {
  return {
    sorte: { sorte_id: SORTE, name: 'Testsorte Rot', art_id: ART, kulturtyp: 'blatt' },
    art: {
      art_id: ART,
      name_de: 'Testsalat',
      name_wiss: 'Testus lactucoides',
      kulturformen_erlaubt: ['schnitt'],
    },
    kulturgruppe: { kulturgruppe_id: 'blatt', ec_obergrenze_validator: 2.0 },
    sollwerte: [
      sw('anwendbar', 'kulturgruppe', 'D', { wert_min: null, wert_max: null, text_wert: 'ja' }),
      sw('dauer', 'art', 'B1', { wert_min: 21, wert_typ: 28, wert_max: 35 }),
      sw('bbch', 'art', 'B1', { wert_min: 13, wert_max: 19 }),
      ...(voll
        ? [
            sw('ph', 'art', 'B1', { wert_min: 5.8, wert_max: 6.2 }),
            sw('ec', 'art', 'B2', { wert_min: 1.2, wert_max: 1.6 }),
          ]
        : [sw('ph', 'standard', 'D', { wert_min: 5.5, wert_max: 6.5 })]),
    ],
    pflicht: PFLICHT,
    saatempfehlungen: voll
      ? [
          {
            ebene: 'art',
            art_id: ART,
            sorte_id: null,
            kulturform: 'schnitt',
            klasse_saatmenge: 'B',
            bestaetigt_am: '2027-01-10',
          },
        ]
      : [],
  };
}

type Zeile = {
  id: string;
  modell: string;
  zweck: string | null;
  app_version: string;
  status: string;
  erfasst_am: Date;
};

class Daten {
  zeilen: Zeile[] = [];
  abfragen: Date[] = [];
  werte: Record<string, unknown>[] = [];
  saat: Record<string, unknown>[] = [];
  nullBei: string | undefined;
  voll = false;
  private uhr: VirtuelleUhr;

  constructor(uhr: VirtuelleUhr) {
    this.uhr = uhr;
  }

  vorbelegen(anzahl: number, iso: string) {
    for (let i = 0; i < anzahl; i++)
      this.zeilen.push({
        id: crypto.randomUUID(),
        modell: 'claude-haiku-5-5',
        zweck: null,
        app_version: 'alt',
        status: 'ok',
        erfasst_am: new Date(iso),
      });
  }

  neue(): Zeile[] {
    return this.zeilen.filter((z) => z.app_version !== 'alt');
  }

  schnittstelle(): RechercheDaten {
    return {
      stand: (sorteId: string) => {
        assert.equal(sorteId, SORTE);
        return Promise.resolve(stand(this.voll));
      },
      aufrufeSeit: (ab: Date) => {
        this.abfragen.push(ab);
        return Promise.resolve(this.zeilen.filter((z) => z.erfasst_am.getTime() >= ab.getTime()).length);
      },
      aufrufBeginnen: (z: { modell: string; zweck: string; app_version: string }) => {
        const id = crypto.randomUUID();
        this.zeilen.push({ id, ...z, status: 'gestartet', erfasst_am: this.uhr.jetzt() });
        return Promise.resolve(id);
      },
      aufrufBeenden: (id: string, z: { status: string; dauer_ms: number }) => {
        const zeile = this.zeilen.find((x) => x.id === id);
        if (zeile) zeile.status = z.status;
        return Promise.resolve();
      },
      wertSchreiben: (zeile: Record<string, unknown>) => {
        this.werte.push(zeile);
        return Promise.resolve(zeile['groesse'] === this.nullBei ? null : crypto.randomUUID());
      },
      saatSchreiben: (zeile: Record<string, unknown>) => {
        this.saat.push(zeile);
        return Promise.resolve(crypto.randomUUID());
      },
    } as unknown as RechercheDaten;
  }
}

type Verhalten = { nachMs?: number; antwort: ModellAntwort } | 'haengt';
type Rolle = { recherche: Verhalten; pruefer: Verhalten };

function umgebung(haupt: Rolle, ausweich: Rolle, start = START) {
  const uhr = new VirtuelleUhr(start);
  const daten = new Daten(uhr);
  const rufe: { modell: string; rolle: 'recherche' | 'pruefer'; t: number }[] = [];
  const modell = async (
    m: string,
    anfrage: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<ModellAntwort> => {
    const rolle = JSON.stringify(anfrage['tools'] ?? []).includes('web_fetch') ? 'pruefer' : 'recherche';
    rufe.push({ modell: m, rolle, t: uhr.t - Date.parse(start) });
    assert.equal(anfrage['model'], m);
    const v = (m === RECHERCHE_HAUPTMODELL ? haupt : ausweich)[rolle];
    if (v === 'haengt') {
      await uhr.nach(600_000, signal);
      return { art: 'ausweichen' };
    }
    await uhr.nach(v.nachMs ?? 0, signal);
    if (signal.aborted) return { art: 'ausweichen' };
    return v.antwort;
  };
  const lauf = () =>
    recherchieren(
      { sorteId: SORTE, appVersion: APP },
      { daten: daten.schnittstelle(), modell, zeit: uhr, zeitzone: ZUERICH },
    );
  return { uhr, daten, rufe, lauf };
}

type Ergebnis = Awaited<ReturnType<typeof recherchieren>>;
function fertig(r: Ergebnis) {
  if (r.ergebnis !== 'ok') throw new Error(`erwartet ok, erhalten ${JSON.stringify(r)}`);
  return r;
}
function abgebrochen(r: Ergebnis) {
  if (r.ergebnis !== 'abgebrochen') throw new Error(`erwartet abgebrochen, erhalten ${JSON.stringify(r)}`);
  return r;
}

const FEHLER_529: ModellAntwort = { art: 'ausweichen', status: 529 };
const FEHLER_503: ModellAntwort = { art: 'ausweichen', status: 503 };

async function normal(): Promise<Rolle> {
  return {
    recherche: { nachMs: 20_000, antwort: ok(await fixtureText('antwort_gueltig.json')) },
    pruefer: { nachMs: 8_000, antwort: ok(await fixtureText('pruefer_belegt.json')) },
  };
}

Deno.test(
  'UC4-AK7 Recherche schreibt nur Werte, die Grundregel, Validator und Quellenprüfer bestehen, mit Vermerk recherche und höchstens B1; der Rest bleibt Prüfauftrag',
  async () => {
    const u = umgebung(await normal(), await normal());
    const r = fertig(await u.lauf());
    assert.equal(r.werte, 2);
    assert.equal(r.saat, 1);
    assert.deepEqual(r.offen, []);
    assert.deepEqual(r.offenSaat, []);
    assert.deepEqual(r.verworfen, []);
    assert.deepEqual(u.daten.werte.map((z) => [z['groesse'], z['evidenzklasse'], z['art_id']]).sort(), [
      ['ec', 'B1', ART],
      ['ph', 'B2', ART],
    ]);
    for (const z of u.daten.werte) assert.ok(['B1', 'B2', 'C'].includes(String(z['evidenzklasse'])));
    assert.equal(u.daten.saat.length, 1);
    const s = u.daten.saat[0] ?? {};
    assert.equal(s['kulturform'], 'schnitt');
    assert.equal(s['klasse_saatmenge'], 'B');
    assert.deepEqual(
      u.rufe.map((x) => [x.modell, x.rolle]),
      [
        [RECHERCHE_HAUPTMODELL, 'recherche'],
        [RECHERCHE_HAUPTMODELL, 'pruefer'],
      ],
    );
  },
);

Deno.test(
  'UC4-AK7 TK1 (Recherche) Kandidat mit System «Erde» und Kandidat mit «ph: 4.5» verworfen, Lücke bleibt offen, nichts geschrieben',
  async () => {
    const erde: Rolle = {
      recherche: { nachMs: 15_000, antwort: ok(await fixtureText('antwort_erde.json')) },
      pruefer: { antwort: ok(await fixtureText('pruefer_belegt.json')) },
    };
    const u = umgebung(erde, erde);
    const r = fertig(await u.lauf());
    assert.equal(r.werte, 0);
    assert.equal(r.saat, 0);
    assert.deepEqual(
      [...r.verworfen].sort((a, b) => a.id.localeCompare(b.id)),
      [
        { id: 'w1', grund: 'nicht_hydroponisch' },
        { id: 'w2', grund: 'ph' },
      ],
    );
    assert.deepEqual(
      r.offen.map((l: { phase: string; groesse: string }) => `${l.phase}.${l.groesse}`).sort(),
      ['wachstum.ec', 'wachstum.ph'],
    );
    assert.deepEqual(r.offenSaat, ['schnitt']);
    assert.equal(u.daten.werte.length, 0);
    assert.equal(u.daten.saat.length, 0);
    assert.deepEqual(
      u.rufe.map((x) => x.rolle),
      ['recherche'],
    );
  },
);

Deno.test(
  'UC4-AK7 TK2 (Recherche) ungültiges JSON: abgebrochen «ungueltig», kein Schreibaufruf, Hinweis',
  async () => {
    const kaputt: Rolle = {
      recherche: { antwort: ok(await fixtureText('antwort_ungueltig.json')) },
      pruefer: { antwort: ok(await fixtureText('pruefer_belegt.json')) },
    };
    const u = umgebung(kaputt, kaputt);
    const r = abgebrochen(await u.lauf());
    assert.equal(r.grund, 'ungueltig');
    assert.ok(r.hinweis.length > 0);
    assert.equal(u.daten.werte.length + u.daten.saat.length, 0);
    assert.ok(u.rufe.every((x) => x.rolle === 'recherche'));
  },
);

Deno.test(
  'UC4-AK7 TK3 (Recherche) Hauptmodell 529 → Ausweichmodell liefert; alle Modelle Fehler → abgebrochen nach höchstens 120 s, kein Schreibaufruf',
  async () => {
    const gut = await normal();
    const ueberlastet = umgebung(
      { recherche: { nachMs: 1500, antwort: FEHLER_529 }, pruefer: gut.pruefer },
      gut,
    );
    const r1 = fertig(await ueberlastet.lauf());
    assert.equal(r1.werte, 2);
    assert.deepEqual(
      ueberlastet.rufe.map((x) => [x.modell, x.rolle]),
      [
        [RECHERCHE_HAUPTMODELL, 'recherche'],
        [RECHERCHE_AUSWEICHMODELL, 'recherche'],
        [RECHERCHE_HAUPTMODELL, 'pruefer'],
      ],
    );
    assert.equal(ueberlastet.rufe[1]?.t, 1500);

    const fehler: Rolle = {
      recherche: { nachMs: 2000, antwort: FEHLER_503 },
      pruefer: { antwort: FEHLER_503 },
    };
    const beide = umgebung(fehler, fehler);
    const r2 = abgebrochen(await beide.lauf());
    assert.ok(['fehler', 'zeit'].includes(r2.grund));
    assert.ok(r2.dauerMs <= 120_000);
    assert.equal(beide.rufe.length, 2);
    assert.equal(beide.daten.werte.length + beide.daten.saat.length, 0);

    const haengt: Rolle = { recherche: 'haengt', pruefer: 'haengt' };
    const still = umgebung(haengt, haengt);
    const r3 = abgebrochen(await still.lauf());
    assert.equal(r3.grund, 'zeit');
    assert.ok(r3.dauerMs <= 120_000, `dauerMs ${r3.dauerMs}`);
    assert.equal(still.rufe[1]?.t, 60_000);
    assert.equal(still.daten.werte.length + still.daten.saat.length, 0);
  },
);

Deno.test(
  'UC4-AK7 Quellenprüfer verneint einen Kandidaten → nur der bestätigte wird geschrieben, Grund «nicht_belegt»',
  async () => {
    const rolle: Rolle = {
      recherche: { antwort: ok(await fixtureText('antwort_gueltig.json')) },
      pruefer: { antwort: ok(await fixtureText('pruefer_nicht_belegt.json')) },
    };
    const u = umgebung(rolle, rolle);
    const r = fertig(await u.lauf());
    assert.equal(r.werte, 1);
    assert.equal(r.saat, 1);
    assert.deepEqual(r.verworfen, [{ id: 'w2', grund: 'nicht_belegt' }]);
    assert.deepEqual(
      u.daten.werte.map((z) => z['groesse']),
      ['ec'],
    );
    assert.deepEqual(
      r.offen.map((l: { phase: string; groesse: string }) => `${l.phase}.${l.groesse}`),
      ['wachstum.ph'],
    );
  },
);

Deno.test('UC4-AK7 Quellenprüfer scheitert → nichts geschrieben, abgebrochen', async () => {
  const gut = await normal();
  const rolle: Rolle = { recherche: gut.recherche, pruefer: { antwort: FEHLER_503 } };
  const u = umgebung(rolle, rolle);
  abgebrochen(await u.lauf());
  assert.equal(u.daten.werte.length + u.daten.saat.length, 0);

  const unlesbar: Rolle = { recherche: gut.recherche, pruefer: { antwort: ok('kein JSON') } };
  const v = umgebung(unlesbar, unlesbar);
  abgebrochen(await v.lauf());
  assert.equal(v.daten.werte.length + v.daten.saat.length, 0);
});

Deno.test('UC4-AK7 ohne Lücke kein Modellaufruf und keine Zeile ki_aufruf', async () => {
  const u = umgebung(await normal(), await normal());
  u.daten.voll = true;
  const r = fertig(await u.lauf());
  assert.equal(r.werte, 0);
  assert.equal(r.saat, 0);
  assert.deepEqual(r.offen, []);
  assert.deepEqual(r.offenSaat, []);
  assert.equal(u.rufe.length, 0);
  assert.equal(u.daten.zeilen.length, 0);
});

Deno.test('UC4-AK7 ohne ANTHROPIC_API_KEY «nicht_eingerichtet» ohne ki_aufruf', () => {
  const r = abgebrochen(ohneSchluessel());
  assert.equal(r.grund, 'nicht_eingerichtet');
  assert.match(r.hinweis, /noch nicht eingerichtet/);
});

Deno.test(
  'UC4-AK7 Tageslimit: 29 Aufrufe heute, Recherche braucht zwei → zweiter Aufruf «grenze», nichts geschrieben',
  async () => {
    const u = umgebung(await normal(), await normal());
    u.daten.vorbelegen(29, '2027-01-15T07:00:00.000Z');
    const r = abgebrochen(await u.lauf());
    assert.equal(r.grund, 'grenze');
    assert.match(r.hinweis, /Tageslimit/);
    assert.deepEqual(
      u.rufe.map((x) => x.rolle),
      ['recherche'],
    );
    assert.equal(u.daten.zeilen.length, 30);
    assert.equal(u.daten.werte.length + u.daten.saat.length, 0);
  },
);

Deno.test(
  'UC4-AK7 Tageslimit über den Zürcher Tageswechsel (feste Uhr 27.3.2027 23:59 und 28.3.2027 00:01)',
  async () => {
    // 27.3.2027 23:59 Zürich (MEZ) = 22:59 UTC; 28.3.2027 00:01 Zürich = 27.3. 23:01 UTC (Sommerzeit erst ab 02:00)
    const spaet = umgebung(await normal(), await normal(), '2027-03-27T22:59:00.000Z');
    spaet.daten.vorbelegen(30, '2027-03-27T09:00:00.000Z');
    const r1 = abgebrochen(await spaet.lauf());
    assert.equal(r1.grund, 'grenze');
    assert.equal(spaet.rufe.length, 0);
    assert.equal(spaet.daten.abfragen[0]?.toISOString(), '2027-03-26T23:00:00.000Z');

    const frueh = umgebung(await normal(), await normal(), '2027-03-27T23:01:00.000Z');
    frueh.daten.vorbelegen(30, '2027-03-27T09:00:00.000Z');
    fertig(await frueh.lauf());
    assert.equal(frueh.daten.abfragen[0]?.toISOString(), '2027-03-27T23:00:00.000Z');
    assert.equal(frueh.rufe.length, 2);
  },
);

Deno.test('UC4-AK7 ki_aufruf mit zweck recherche und quellenpruefer je Request', async () => {
  const gut = await normal();
  const u = umgebung({ recherche: { nachMs: 1000, antwort: FEHLER_529 }, pruefer: gut.pruefer }, gut);
  fertig(await u.lauf());
  assert.deepEqual(
    u.daten.neue().map((z) => [z.modell, z.zweck, z.app_version]),
    [
      [RECHERCHE_HAUPTMODELL, 'recherche', APP],
      [RECHERCHE_AUSWEICHMODELL, 'recherche', APP],
      [RECHERCHE_HAUPTMODELL, 'quellenpruefer', APP],
    ],
  );
  assert.deepEqual(
    u.daten.neue().map((z) => z.status),
    ['fehler', 'ausweichmodell', 'ok'],
  );
});

Deno.test('UC4-AK7 Schreiben gibt null zurück (Wert schon da) → zählt nicht als ergänzt', async () => {
  const u = umgebung(await normal(), await normal());
  u.daten.nullBei = 'ec';
  const r = fertig(await u.lauf());
  assert.equal(u.daten.werte.length, 2);
  assert.equal(r.werte, 1);
  assert.equal(r.saat, 1);
});
