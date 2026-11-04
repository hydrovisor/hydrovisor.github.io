// Kern der Edge Function push-quittung (Plan 13 Schnittstellen und Testliste; Konzept 11.3; 04_architektur.md 5:
// Quittung ohne Sitzung, die Signatur genügt). Läuft mit `deno test --allow-read --allow-env supabase/functions`
// ohne Netz und ohne Secrets: Uhr, Signaturprüfung (echtes HMAC aus _shared/hmac.ts mit Testschlüssel) und
// Datenzugriff eingespritzt. Keine Personendaten.
// Vorausgesetzt (wo Plan 13 offen ist):
// - _shared/hmac.ts: `signieren(schluessel, text): Promise<string>`, `pruefen(schluessel, text, signatur):
//   Promise<boolean>`; die Signatur deckt signaturText(versand_id) = «hydrovisor-quittung:v1:<versand_id>» ab (A11).
// - `setzen(id, feld, zeit)` schreibt nur in ein leeres Feld (Hülle: update … where <feld> is null); der Kern
//   ruft es bei «angezeigt» für angezeigt_am, bei «geoeffnet» für geoeffnet_am und angezeigt_am auf.
// - Gültige Quittung antwortet 204, auch wenn nichts mehr zu setzen ist; ungültige Signatur 401; unvollständige
//   oder fehlerhafte Anfrage 400 (fehlendes Feld, leerer Text, falscher Typ, unbekanntes Ereignis), jeweils ohne
//   setzen; pruefen() wirft bei einer nicht dekodierbaren Signatur nicht, sondern liefert false.
import { quittieren } from './kern.ts';
import { signieren, pruefen } from '../_shared/hmac.ts';
import { signaturText } from '../../../src/domain/push/signatur.ts';

const SCHLUESSEL = 'test-schluessel-nur-lokal';
const VERSAND = '00000000-0000-4000-8000-0000000b0001';
const FREMD = '00000000-0000-4000-8000-0000000b0002';

type Feld = 'angezeigt_am' | 'geoeffnet_am';
type Anfrage = Parameters<typeof quittieren>[0];

function gleich(ist: unknown, soll: unknown, was: string): void {
  const a = JSON.stringify(ist);
  const b = JSON.stringify(soll);
  if (a !== b) throw new Error(`${was}: erwartet ${b}, erhalten ${a}`);
}

/** Versandzeilen mit den zwei Zeitstempeln; setzen nur in leere Felder wie die Hülle */
class Versande {
  zeilen = new Map<string, Record<Feld, string | null>>([
    [VERSAND, { angezeigt_am: null, geoeffnet_am: null }],
    [FREMD, { angezeigt_am: null, geoeffnet_am: null }],
  ]);
  aufrufe: string[] = [];

  setzen = async (id: string, feld: Feld, zeit: Date): Promise<void> => {
    this.aufrufe.push(`${id} ${feld}`);
    const zeile = this.zeilen.get(id);
    if (zeile && zeile[feld] === null) zeile[feld] = zeit.toISOString();
  };
}

function abh(versande: Versande, jetzt: string) {
  return {
    jetzt: new Date(jetzt),
    pruefen: (text: string, sig: string) => pruefen(SCHLUESSEL, text, sig),
    setzen: versande.setzen,
  };
}

const signaturFuer = (id: string) => signieren(SCHLUESSEL, signaturText(id));

Deno.test('11.3 signaturText: «hydrovisor-quittung:v1:<versand_id>»', () => {
  gleich(signaturText(VERSAND), `hydrovisor-quittung:v1:${VERSAND}`, 'signaturText');
});

Deno.test(
  '11.3 Quittung angezeigt mit gültiger Signatur setzt angezeigt_am einmal; zweite Quittung ändert nichts',
  async () => {
    const versande = new Versande();
    const signatur = await signaturFuer(VERSAND);
    const erste = await quittieren(
      { versand_id: VERSAND, signatur, ereignis: 'angezeigt' },
      abh(versande, '2027-01-20T06:00:20.000Z'),
    );
    gleich(erste.http, 204, 'HTTP erste Quittung');
    gleich(
      versande.zeilen.get(VERSAND),
      { angezeigt_am: '2027-01-20T06:00:20.000Z', geoeffnet_am: null },
      'Zeile nach erster Quittung',
    );
    const zweite = await quittieren(
      { versand_id: VERSAND, signatur, ereignis: 'angezeigt' },
      abh(versande, '2027-01-20T06:30:00.000Z'),
    );
    gleich(zweite.http, 204, 'HTTP zweite Quittung');
    gleich(
      versande.zeilen.get(VERSAND),
      { angezeigt_am: '2027-01-20T06:00:20.000Z', geoeffnet_am: null },
      'Zeile nach zweiter Quittung',
    );
    gleich(versande.zeilen.get(FREMD), { angezeigt_am: null, geoeffnet_am: null }, 'andere Zeile unberührt');
  },
);

Deno.test('11.3 Quittung geoeffnet setzt geoeffnet_am und ein leeres angezeigt_am', async () => {
  const versande = new Versande();
  const signatur = await signaturFuer(VERSAND);
  const ergebnis = await quittieren(
    { versand_id: VERSAND, signatur, ereignis: 'geoeffnet' },
    abh(versande, '2027-01-20T06:10:00.000Z'),
  );
  gleich(ergebnis.http, 204, 'HTTP');
  gleich(
    versande.zeilen.get(VERSAND),
    { angezeigt_am: '2027-01-20T06:10:00.000Z', geoeffnet_am: '2027-01-20T06:10:00.000Z' },
    'Zeile ohne vorherige Anzeige',
  );

  // mit vorhandenem angezeigt_am bleibt es unverändert
  const zweite = new Versande();
  await quittieren(
    { versand_id: VERSAND, signatur, ereignis: 'angezeigt' },
    abh(zweite, '2027-01-20T06:00:20.000Z'),
  );
  await quittieren(
    { versand_id: VERSAND, signatur, ereignis: 'geoeffnet' },
    abh(zweite, '2027-01-20T07:15:00.000Z'),
  );
  gleich(
    zweite.zeilen.get(VERSAND),
    { angezeigt_am: '2027-01-20T06:00:20.000Z', geoeffnet_am: '2027-01-20T07:15:00.000Z' },
    'Zeile mit vorheriger Anzeige',
  );
});

Deno.test('11.3 falsche Signatur oder fremde versand_id: 401, nichts geändert', async () => {
  const versande = new Versande();
  const falsch = await quittieren(
    { versand_id: VERSAND, signatur: 'ungueltig', ereignis: 'angezeigt' },
    abh(versande, '2027-01-20T06:00:20.000Z'),
  );
  gleich(falsch.http, 401, 'HTTP falsche Signatur');
  // gültige Signatur von VERSAND, aber für FREMD verwendet
  const signatur = await signaturFuer(VERSAND);
  const fremd = await quittieren(
    { versand_id: FREMD, signatur, ereignis: 'geoeffnet' },
    abh(versande, '2027-01-20T06:00:20.000Z'),
  );
  gleich(fremd.http, 401, 'HTTP fremde versand_id');
  // Signatur mit einem anderen Schlüssel
  const andererSchluessel = await signieren('anderer-schluessel-nur-lokal', signaturText(VERSAND));
  const anders = await quittieren(
    { versand_id: VERSAND, signatur: andererSchluessel, ereignis: 'angezeigt' },
    abh(versande, '2027-01-20T06:00:20.000Z'),
  );
  gleich(anders.http, 401, 'HTTP anderer Schlüssel');
  gleich(versande.aufrufe, [], 'kein setzen');
  gleich(versande.zeilen.get(VERSAND), { angezeigt_am: null, geoeffnet_am: null }, 'Zeile VERSAND');
  gleich(versande.zeilen.get(FREMD), { angezeigt_am: null, geoeffnet_am: null }, 'Zeile FREMD');
});

Deno.test('11.3 unvollständige Anfrage: 400', async () => {
  const versande = new Versande();
  const signatur = await signaturFuer(VERSAND);
  const faelle: unknown[] = [
    { signatur, ereignis: 'angezeigt' },
    { versand_id: VERSAND, ereignis: 'angezeigt' },
    { versand_id: VERSAND, signatur },
    { versand_id: VERSAND, signatur, ereignis: 'geloescht' },
    { versand_id: '', signatur, ereignis: 'angezeigt' },
    { versand_id: VERSAND, signatur: '', ereignis: 'angezeigt' },
    { versand_id: 42, signatur, ereignis: 'angezeigt' },
  ];
  for (const [i, anfrage] of faelle.entries()) {
    const ergebnis = await quittieren(anfrage as Anfrage, abh(versande, '2027-01-20T06:00:20.000Z'));
    gleich(ergebnis.http, 400, `HTTP Fall ${i + 1}: ${JSON.stringify(anfrage)}`);
  }
  gleich(versande.aufrufe, [], 'kein setzen');
});
