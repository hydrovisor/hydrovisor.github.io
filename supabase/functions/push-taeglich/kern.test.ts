// Kern der Edge Function push-taeglich (Plan 13 Schnittstellen und Testliste; Konzept 11.3, R5.5, G2, G5;
// 06_tests.md 8 TP1 bis TP4; Use Cases F4 UC0-AK5, T2). Läuft mit `deno test --allow-read --allow-env
// supabase/functions` ohne Netz und ohne Secrets: Uhr, Daten (In-Memory mit Unique-Verhalten wie der Index
// push_versand_einmal_push) und Sender (feste Statuscodes) eingespritzt. Importiert nur kern.ts, _shared/hmac.ts
// und src/domain/ relativ, nie index.ts oder npm:web-push. Keine Personendaten, keine echten Endpoints.
// Vorausgesetzt (wo Plan 13 offen ist):
// - _shared/hmac.ts: `signieren(schluessel: string, text: string): Promise<string>` und
//   `pruefen(schluessel: string, text: string, signatur: string): Promise<boolean>` (HMAC-SHA256, WebCrypto).
// - PushDaten.aktiveAbos() liefert ungefiltert (auch inaktive und Demo-Abos); der Kern filtert aktiv und echt.
// - pushLauf antwortet: 401 ohne gültiges Cron-Geheimnis bzw. ohne istTim, 204 vor der Push-Zeit, 200 nach
//   einem Lauf zur Push-Zeit; ein abgelehnter elfter Test-Push mit einem Status ≥ 400 ohne Versand.
// - Unique gilt wie der Index nur für art sammel; Test-Pushes dürfen mehrfach am Tag (A7: höchstens 10).
import { pushLauf, type Abo, type Auftrag, type PushDaten, type Sender } from './kern.ts';
import { pruefen, signieren } from '../_shared/hmac.ts';
import { signaturText } from '../../../src/domain/push/signatur.ts';
import { TEILE_DREI_ROUTINE, ZONE, teileFuer } from '../../../tests/unit/push-fixture.ts';

const SCHLUESSEL = 'test-schluessel-nur-lokal';
const SAMMEL: Auftrag = { art: 'sammel', geheimnisOk: true };

type Status = 'geplant' | 'gesendet' | 'fehler' | 'abgemeldet';
interface VersandZeile {
  id: string;
  abo_id: string;
  art: 'sammel' | 'test';
  datum_lokal: string;
  titel: string;
  anzahl_aufgaben: number;
  status: Status;
  gesendet_am?: string;
}
interface Optionen {
  TTL: 14400;
  urgency: 'high';
}

// ---------------------------------------------------------------------------------------------------------
// Prüfhilfen ohne externe Module (pr.yml ohne Netz, keine Import-Map)
// ---------------------------------------------------------------------------------------------------------

function wahr(bedingung: boolean, was: string): void {
  if (!bedingung) throw new Error(was);
}

function gleich(ist: unknown, soll: unknown, was: string): void {
  const a = JSON.stringify(ist);
  const b = JSON.stringify(soll);
  if (a !== b) throw new Error(`${was}: erwartet ${b}, erhalten ${a}`);
}

// ---------------------------------------------------------------------------------------------------------
// Attrappen
// ---------------------------------------------------------------------------------------------------------

const aboId = (n: number) => `00000000-0000-4000-8000-0000000a${String(n).padStart(4, '0')}`;

function abo(n: number, teil: Partial<Abo> = {}): Abo {
  return {
    id: aboId(n),
    endpoint: `https://push.example.invalid/geraet-${n}`,
    p256dh: `BPtest${n}`,
    auth_schluessel: `auth${n}`,
    datenart: 'echt',
    aktiv: true,
    ...teil,
  };
}

class Speicher implements PushDaten {
  pushZeit = '07:00:00';
  abos: Abo[];
  teileWert: Record<string, unknown[]>;
  versande: VersandZeile[] = [];
  letzterFehler = new Map<string, string>();
  protokoll: string[] = [];
  private zaehler = 0;

  constructor(abos: Abo[], teile: Record<string, unknown[]> = TEILE_DREI_ROUTINE) {
    this.abos = abos;
    this.teileWert = teile;
  }

  async einstellung() {
    return { push_zeit: this.pushZeit, zeitzone: ZONE };
  }

  async aktiveAbos() {
    return this.abos.map((a) => ({ ...a }));
  }

  async aboZuEndpoint(endpoint: string) {
    const a = this.abos.find((x) => x.endpoint === endpoint);
    return a ? { ...a } : undefined;
  }

  async teile() {
    return this.teileWert;
  }

  async versandAnlegen(z: {
    abo_id: string;
    art: 'sammel' | 'test';
    datum_lokal: string;
    titel: string;
    anzahl_aufgaben: number;
  }): Promise<{ id: string } | 'besteht'> {
    if (
      z.art === 'sammel' &&
      this.versande.some(
        (v) => v.art === 'sammel' && v.abo_id === z.abo_id && v.datum_lokal === z.datum_lokal,
      )
    ) {
      this.protokoll.push('besteht');
      return 'besteht';
    }
    this.zaehler += 1;
    const id = `00000000-0000-4000-8000-${String(this.zaehler).padStart(12, '0')}`;
    this.versande.push({ id, ...z, status: 'geplant' });
    this.protokoll.push(`anlegen ${id}`);
    return { id };
  }

  async fehlerVersandUebernehmen(abo_id: string, datum_lokal: string) {
    const v = this.versande.find(
      (x) =>
        x.art === 'sammel' && x.abo_id === abo_id && x.datum_lokal === datum_lokal && x.status === 'fehler',
    );
    if (!v) return undefined;
    v.status = 'geplant';
    this.protokoll.push(`uebernehmen ${v.id}`);
    return { id: v.id };
  }

  async versandAbschliessen(id: string, status: 'gesendet' | 'fehler' | 'abgemeldet', gesendetAm?: Date) {
    const v = this.versande.find((x) => x.id === id);
    if (!v) throw new Error(`Versand ${id} fehlt`);
    v.status = status;
    if (gesendetAm) v.gesendet_am = gesendetAm.toISOString();
    this.protokoll.push(`abschliessen ${id} ${status}`);
  }

  async aboDeaktivieren(id: string, fehler: string) {
    const a = this.abos.find((x) => x.id === id);
    if (!a) throw new Error(`Abo ${id} fehlt`);
    a.aktiv = false;
    this.letzterFehler.set(id, fehler);
  }

  async testsHeute(datum_lokal: string) {
    return this.versande.filter((v) => v.art === 'test' && v.datum_lokal === datum_lokal).length;
  }

  sammel(): VersandZeile[] {
    return this.versande.filter((v) => v.art === 'sammel');
  }
}

class FakeSender implements Sender {
  aufrufe: { abo: Abo; nutzlast: string; optionen: Optionen }[] = [];
  antwort: (abo: Abo, nummer: number) => number;
  protokoll: string[] | undefined;

  constructor(antwort: (abo: Abo, nummer: number) => number = () => 201, protokoll?: string[]) {
    this.antwort = antwort;
    this.protokoll = protokoll;
  }

  async senden(a: Abo, nutzlast: string, optionen: Optionen) {
    this.aufrufe.push({ abo: a, nutzlast, optionen });
    this.protokoll?.push('senden');
    return { status: this.antwort(a, this.aufrufe.length) };
  }
}

function lauf(auftrag: Auftrag, jetzt: string, daten: PushDaten, sender: Sender) {
  return pushLauf(auftrag, {
    jetzt: new Date(jetzt),
    daten,
    sender,
    signieren: (text: string) => signieren(SCHLUESSEL, text),
  });
}

const nutzlastVon = (sender: FakeSender, i = 0) => {
  const aufruf = sender.aufrufe[i];
  if (!aufruf) throw new Error(`Sendung ${i} fehlt`);
  return JSON.parse(aufruf.nutzlast) as Record<string, unknown>;
};

// ---------------------------------------------------------------------------------------------------------
// TP1 Einmal je Tag
// ---------------------------------------------------------------------------------------------------------

Deno.test('TP1 Läufe 07:00 und 07:05 am selben Tag: genau ein Sammel-Versand', async () => {
  const daten = new Speicher([abo(1)]);
  const sender = new FakeSender();
  const erster = await lauf(SAMMEL, '2027-01-20T06:00:00.000Z', daten, sender);
  const zweiter = await lauf(SAMMEL, '2027-01-20T06:05:00.000Z', daten, sender);
  gleich(erster.http, 200, 'HTTP erster Lauf');
  gleich(erster.versandt, 1, 'versandt erster Lauf');
  gleich(zweiter.versandt, 0, 'versandt zweiter Lauf');
  gleich(zweiter.uebersprungen, 1, 'uebersprungen zweiter Lauf');
  gleich(sender.aufrufe.length, 1, 'Sendungen');
  gleich(
    daten.sammel().map((v) => [v.datum_lokal, v.status]),
    [['2027-01-20', 'gesendet']],
    'Sammel-Versände',
  );
});

Deno.test('TP1 zwei parallele Läufe 07:00: genau ein Versand', async () => {
  const daten = new Speicher([abo(1)]);
  const sender = new FakeSender();
  const [a, b] = await Promise.all([
    lauf(SAMMEL, '2027-01-20T06:00:00.000Z', daten, sender),
    lauf(SAMMEL, '2027-01-20T06:00:00.000Z', daten, sender),
  ]);
  gleich(sender.aufrufe.length, 1, 'Sendungen');
  gleich(daten.sammel().length, 1, 'Sammel-Versände');
  gleich(a.versandt + b.versandt, 1, 'versandt zusammen');
  gleich(a.uebersprungen + b.uebersprungen, 1, 'uebersprungen zusammen');
});

// ---------------------------------------------------------------------------------------------------------
// TP2 und UC0-AK5 Abo ungültig
// ---------------------------------------------------------------------------------------------------------

Deno.test('TP2 Antwort 410: Abo inaktiv, Status abgemeldet, letzter_fehler gesetzt', async () => {
  const daten = new Speicher([abo(1)]);
  const sender = new FakeSender(() => 410);
  const ergebnis = await lauf(SAMMEL, '2027-01-20T06:00:00.000Z', daten, sender);
  gleich(ergebnis.abgemeldet, 1, 'abgemeldet');
  gleich(ergebnis.versandt, 0, 'versandt');
  gleich(daten.abos[0]?.aktiv, false, 'Abo aktiv');
  wahr(/410/.test(daten.letzterFehler.get(aboId(1)) ?? ''), 'letzter_fehler enthält 410');
  gleich(
    daten.sammel().map((v) => v.status),
    ['abgemeldet'],
    'Status des Versands',
  );
});

Deno.test('UC0-AK5 Antwort 404: Abo inaktiv, Versand abgemeldet', async () => {
  const daten = new Speicher([abo(1)]);
  const sender = new FakeSender(() => 404);
  const ergebnis = await lauf(SAMMEL, '2027-01-20T06:00:00.000Z', daten, sender);
  gleich(ergebnis.abgemeldet, 1, 'abgemeldet');
  gleich(daten.abos[0]?.aktiv, false, 'Abo aktiv');
  wahr((daten.letzterFehler.get(aboId(1)) ?? '').length > 0, 'letzter_fehler gesetzt');
  gleich(
    daten.sammel().map((v) => v.status),
    ['abgemeldet'],
    'Status des Versands',
  );
  // kein weiterer Versand an dieses Abo am Folgetag
  const folgetag = await lauf(SAMMEL, '2027-01-21T06:00:00.000Z', daten, sender);
  gleich(folgetag.versandt, 0, 'versandt am Folgetag');
  gleich(sender.aufrufe.length, 1, 'Sendungen insgesamt');
});

Deno.test('UC0-AK5 inaktives Abo erhält keine Sammel-Push', async () => {
  const daten = new Speicher([abo(1, { aktiv: false }), abo(2)]);
  const sender = new FakeSender();
  const ergebnis = await lauf(SAMMEL, '2027-01-20T06:00:00.000Z', daten, sender);
  gleich(ergebnis.versandt, 1, 'versandt');
  gleich(
    sender.aufrufe.map((s) => s.abo.id),
    [aboId(2)],
    'Empfänger',
  );
  gleich(
    daten.versande.map((v) => v.abo_id),
    [aboId(2)],
    'Versände',
  );
});

// ---------------------------------------------------------------------------------------------------------
// TP3 Nur echt
// ---------------------------------------------------------------------------------------------------------

Deno.test('TP3 Demo-Gefäss mit fälliger Messung nicht im Titel gezählt', async () => {
  const teile = teileFuer({
    echtKalibriert: '2027-01-10T10:00:00.000Z',
    orte: [
      { anlage: 'R', kennung: '2.3', letzteMessung: '2027-01-18T08:00:00.000Z' },
      { anlage: 'D', kennung: '2.3', letzteMessung: '2027-01-10T08:00:00.000Z' },
      { anlage: 'D', kennung: '3.1' },
    ],
  });
  const daten = new Speicher([abo(1)], teile);
  const sender = new FakeSender();
  await lauf(SAMMEL, '2027-01-20T06:00:00.000Z', daten, sender);
  gleich(
    daten.sammel().map((v) => [v.titel, v.anzahl_aufgaben]),
    [['Hydrovisor heute: 1 Routine', 1]],
    'Titel und Anzahl im Versand',
  );
  const nutzlast = nutzlastVon(sender);
  gleich(nutzlast['titel'], 'Hydrovisor heute: 1 Routine', 'Titel der Nutzlast');
  wahr(!String(nutzlast['text']).includes('D-'), 'kein Demo-Ort im Text');
});

Deno.test('TP3 Demo-Abo erhält keine Sammel-Push', async () => {
  const daten = new Speicher([abo(1, { datenart: 'demo' }), abo(2, { datenart: 'test' })]);
  const sender = new FakeSender();
  const ergebnis = await lauf(SAMMEL, '2027-01-20T06:00:00.000Z', daten, sender);
  gleich(ergebnis.versandt, 0, 'versandt');
  gleich(sender.aufrufe.length, 0, 'Sendungen');
  gleich(daten.versande.length, 0, 'Versände');
});

// ---------------------------------------------------------------------------------------------------------
// TP4 Ortszeit und Sommerzeit
// ---------------------------------------------------------------------------------------------------------

Deno.test(
  'TP4 feste Uhr 27., 28., 29.3.2027 alle 5 min, TZ=America/New_York: je genau ein Versand um 07:00 Zürich',
  async () => {
    const vorher = Deno.env.get('TZ');
    Deno.env.set('TZ', 'America/New_York');
    try {
      const daten = new Speicher([abo(1)]);
      const sender = new FakeSender();
      const zeiten: string[] = [];
      // 27.3. 00:00 Zürich (26.3. 23:00Z) bis 29.3. 23:55 Zürich (29.3. 21:55Z), alle 5 min
      const beginn = Date.parse('2027-03-26T23:00:00.000Z');
      const ende = Date.parse('2027-03-29T21:55:00.000Z');
      for (let t = beginn; t <= ende; t += 5 * 60_000) {
        const vorSendungen = sender.aufrufe.length;
        await lauf(SAMMEL, new Date(t).toISOString(), daten, sender);
        if (sender.aufrufe.length > vorSendungen) zeiten.push(new Date(t).toISOString());
      }
      gleich(
        zeiten,
        ['2027-03-27T06:00:00.000Z', '2027-03-28T05:00:00.000Z', '2027-03-29T05:00:00.000Z'],
        'Sendezeitpunkte (07:00 Zürich, ab 28.3. Sommerzeit)',
      );
      gleich(
        daten.sammel().map((v) => v.datum_lokal),
        ['2027-03-27', '2027-03-28', '2027-03-29'],
        'datum_lokal der Versände',
      );
    } finally {
      if (vorher === undefined) Deno.env.delete('TZ');
      else Deno.env.set('TZ', vorher);
    }
  },
);

// ---------------------------------------------------------------------------------------------------------
// R5.5 Push-Zeit, Wiederholung, mehrere Abos
// ---------------------------------------------------------------------------------------------------------

Deno.test('R5.5 Lauf 06:55 vor der Push-Zeit: kein Versand', async () => {
  const daten = new Speicher([abo(1)]);
  const sender = new FakeSender();
  const ergebnis = await lauf(SAMMEL, '2027-01-20T05:55:00.000Z', daten, sender);
  gleich(ergebnis.http, 204, 'HTTP');
  gleich(ergebnis.versandt, 0, 'versandt');
  gleich(sender.aufrufe.length, 0, 'Sendungen');
  gleich(daten.versande.length, 0, 'Versände');
});

Deno.test('R5.5 Push-Zeit 05:00 am 28.3.2027 (Sommerzeit): Versand um 05:00 Ortszeit', async () => {
  const daten = new Speicher([abo(1)]);
  daten.pushZeit = '05:00:00';
  const sender = new FakeSender();
  await lauf(SAMMEL, '2027-03-28T02:55:00.000Z', daten, sender);
  gleich(sender.aufrufe.length, 0, 'Sendungen um 04:55 Ortszeit');
  await lauf(SAMMEL, '2027-03-28T03:00:00.000Z', daten, sender);
  gleich(sender.aufrufe.length, 1, 'Sendungen um 05:00 Ortszeit');
  gleich(
    daten.sammel().map((v) => v.datum_lokal),
    ['2027-03-28'],
    'datum_lokal',
  );
});

Deno.test(
  'R5.5 Antwort 500: Status fehler; nächster Lauf sendet erneut; nach Push-Zeit + 4 h nicht mehr',
  async () => {
    // innerhalb der 4 h: zweiter Lauf übernimmt die Zeile mit fehler und sendet erneut
    const daten = new Speicher([abo(1)]);
    const sender = new FakeSender((_a, nummer) => (nummer === 1 ? 500 : 201));
    await lauf(SAMMEL, '2027-01-20T06:00:00.000Z', daten, sender);
    gleich(
      daten.sammel().map((v) => v.status),
      ['fehler'],
      'Status nach 500',
    );
    gleich(daten.abos[0]?.aktiv, true, 'Abo bleibt aktiv nach 500');
    const zweiter = await lauf(SAMMEL, '2027-01-20T06:05:00.000Z', daten, sender);
    gleich(zweiter.versandt, 1, 'versandt im zweiten Lauf');
    gleich(sender.aufrufe.length, 2, 'Sendungen nach dem zweiten Lauf');
    gleich(
      daten.sammel().map((v) => v.status),
      ['gesendet'],
      'eine Zeile, Status gesendet',
    );
    await lauf(SAMMEL, '2027-01-20T06:10:00.000Z', daten, sender);
    gleich(sender.aufrufe.length, 2, 'kein dritter Versand nach gesendet');

    // nach Push-Zeit + 4 h (11:05 Zürich): keine Wiederholung mehr
    const spaet = new Speicher([abo(1)]);
    const spaetSender = new FakeSender((_a, nummer) => (nummer === 1 ? 500 : 201));
    await lauf(SAMMEL, '2027-01-20T06:00:00.000Z', spaet, spaetSender);
    const ergebnis = await lauf(SAMMEL, '2027-01-20T10:05:00.000Z', spaet, spaetSender);
    gleich(ergebnis.versandt, 0, 'versandt nach 11:00');
    gleich(spaetSender.aufrufe.length, 1, 'Sendungen nach 11:00');
    gleich(
      spaet.sammel().map((v) => v.status),
      ['fehler'],
      'Status bleibt fehler',
    );
  },
);

Deno.test('R5.5 zwei echte Abos: je ein Versand', async () => {
  const daten = new Speicher([abo(1), abo(2)]);
  const sender = new FakeSender();
  const ergebnis = await lauf(SAMMEL, '2027-01-20T06:00:00.000Z', daten, sender);
  gleich(ergebnis.versandt, 2, 'versandt');
  gleich(sender.aufrufe.map((s) => s.abo.id).sort(), [aboId(1), aboId(2)], 'Empfänger');
  gleich(
    daten
      .sammel()
      .map((v) => v.abo_id)
      .sort(),
    [aboId(1), aboId(2)],
    'Versände je Abo',
  );
  const ids = sender.aufrufe.map((_s, i) => nutzlastVon(sender, i)['versand_id']);
  wahr(new Set(ids).size === 2, 'je Abo eine eigene versand_id');
});

// ---------------------------------------------------------------------------------------------------------
// 11.3 Nutzlast und Cron-Geheimnis
// ---------------------------------------------------------------------------------------------------------

Deno.test('11.3 Nutzlast: TTL 14400, urgency high, tag heute, versand_id und gültige Signatur', async () => {
  const daten = new Speicher([abo(1)]);
  const sender = new FakeSender(() => 201, daten.protokoll);
  await lauf(SAMMEL, '2027-01-20T06:00:00.000Z', daten, sender);
  const aufruf = sender.aufrufe[0];
  if (!aufruf) throw new Error('keine Sendung');
  gleich(aufruf.optionen, { TTL: 14400, urgency: 'high' }, 'Optionen');
  wahr(new TextEncoder().encode(aufruf.nutzlast).length < 4096, 'Nutzlast unter 4 KB');
  const nutzlast = nutzlastVon(sender);
  const versand = daten.versande[0];
  if (!versand) throw new Error('kein Versand');
  gleich(nutzlast['versand_id'], versand.id, 'versand_id');
  gleich(nutzlast['tag'], 'heute', 'tag');
  gleich(nutzlast['url'], '#/heute', 'url');
  gleich(nutzlast['titel'], 'Hydrovisor heute: 3 Routine', 'titel');
  gleich(String(nutzlast['text']).split('\n')[0], 'Kalibrieren · Messen R-2.3, R-3.1', 'text');
  gleich(versand.titel, 'Hydrovisor heute: 3 Routine', 'titel im Versand');
  gleich(versand.anzahl_aufgaben, 3, 'anzahl_aufgaben im Versand');
  gleich(versand.status, 'gesendet', 'Status');
  gleich(versand.gesendet_am, '2027-01-20T06:00:00.000Z', 'gesendet_am');
  wahr(
    await pruefen(SCHLUESSEL, signaturText(versand.id), String(nutzlast['signatur'])),
    'Signatur über signaturText(versand_id) gültig',
  );
  wahr(
    !(await pruefen(
      SCHLUESSEL,
      signaturText('00000000-0000-4000-8000-999999999999'),
      String(nutzlast['signatur']),
    )),
    'Signatur gilt nicht für eine fremde versand_id',
  );
  // Zeile vor dem Senden anlegen (Konflikt = schon gesendet oder in Arbeit)
  const anlegen = daten.protokoll.findIndex((e) => e.startsWith('anlegen'));
  const senden = daten.protokoll.indexOf('senden');
  wahr(anlegen >= 0 && senden > anlegen, `Reihenfolge anlegen vor senden: ${daten.protokoll.join(', ')}`);
});

Deno.test('11.3 ohne gültiges Cron-Geheimnis: 401, kein Versand', async () => {
  const daten = new Speicher([abo(1)]);
  const sender = new FakeSender();
  const ergebnis = await lauf(
    { art: 'sammel', geheimnisOk: false },
    '2027-01-20T06:00:00.000Z',
    daten,
    sender,
  );
  gleich(ergebnis.http, 401, 'HTTP');
  gleich(ergebnis.versandt, 0, 'versandt');
  gleich(sender.aufrufe.length, 0, 'Sendungen');
  gleich(daten.versande.length, 0, 'Versände');
});

Deno.test('11.3 Sammel-Push auch bei 0 Aufgaben: «Hydrovisor heute: nichts fällig» (A4)', async () => {
  const teile = teileFuer({
    echtKalibriert: '2027-01-10T10:00:00.000Z',
    orte: [{ anlage: 'R', kennung: '2.3', letzteMessung: '2027-01-19T08:00:00.000Z' }],
  });
  const daten = new Speicher([abo(1)], teile);
  const sender = new FakeSender();
  await lauf(SAMMEL, '2027-01-20T06:00:00.000Z', daten, sender);
  gleich(sender.aufrufe.length, 1, 'Sendungen');
  gleich(nutzlastVon(sender)['titel'], 'Hydrovisor heute: nichts fällig', 'titel');
  gleich(daten.versande[0]?.anzahl_aufgaben, 0, 'anzahl_aufgaben');
});

// ---------------------------------------------------------------------------------------------------------
// T2 Test-Push
// ---------------------------------------------------------------------------------------------------------

Deno.test(
  'T2 Test-Push nur mit istTim; art test; zweiter Test am selben Tag erlaubt; elfter abgelehnt',
  async () => {
    const daten = new Speicher([abo(1), abo(2)]);
    const sender = new FakeSender();
    const endpoint = 'https://push.example.invalid/geraet-1';

    const fremd = await lauf(
      { art: 'test', istTim: false, endpoint },
      '2027-01-20T13:00:00.000Z',
      daten,
      sender,
    );
    gleich(fremd.http, 401, 'HTTP ohne istTim');
    gleich(sender.aufrufe.length, 0, 'Sendungen ohne istTim');
    gleich(daten.versande.length, 0, 'Versände ohne istTim');

    // zehn Tests am selben Tag, der erste vor der Push-Zeit (06:00 Zürich)
    for (let i = 0; i < 10; i += 1) {
      const zeit = new Date(Date.parse('2027-01-20T05:00:00.000Z') + i * 60 * 60_000).toISOString();
      const ergebnis = await lauf({ art: 'test', istTim: true, endpoint }, zeit, daten, sender);
      gleich(ergebnis.http, 200, `HTTP Test ${i + 1}`);
      gleich(ergebnis.versandt, 1, `versandt Test ${i + 1}`);
    }
    gleich(sender.aufrufe.length, 10, 'Sendungen nach zehn Tests');
    gleich(
      [...new Set(sender.aufrufe.map((s) => s.abo.endpoint))],
      [endpoint],
      'nur an das Abo dieses Endpoints',
    );
    gleich(
      [...new Set(daten.versande.map((v) => `${v.art} ${v.datum_lokal} ${v.titel}`))],
      ['test 2027-01-20 Hydrovisor Test-Push'],
      'Versände art test',
    );
    const nutzlast = nutzlastVon(sender, 1);
    gleich(nutzlast['titel'], 'Hydrovisor Test-Push', 'titel');
    gleich(nutzlast['tag'], 'test', 'tag');

    const elfter = await lauf(
      { art: 'test', istTim: true, endpoint },
      '2027-01-20T15:30:00.000Z',
      daten,
      sender,
    );
    wahr(elfter.http >= 400, `elfter Test abgelehnt (HTTP ${elfter.http})`);
    gleich(elfter.versandt, 0, 'versandt elfter Test');
    gleich(sender.aufrufe.length, 10, 'Sendungen nach elftem Test');
    gleich(daten.versande.length, 10, 'Versände nach elftem Test');

    // am Folgetag wieder erlaubt
    const folgetag = await lauf(
      { art: 'test', istTim: true, endpoint },
      '2027-01-21T08:00:00.000Z',
      daten,
      sender,
    );
    gleich(folgetag.versandt, 1, 'versandt am Folgetag');
  },
);
