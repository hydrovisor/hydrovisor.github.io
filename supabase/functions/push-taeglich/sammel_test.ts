// Sammel-Push, Tagesliste und «Kurzprüfung offen» von push-taeglich (Plan 31 Testliste «Deno sammel_test.ts» und
// «Deno kurzpruefung»; Konzept R5.1, R5.4, R5.5, 11.3, G5, 2.3 EK5; 06_tests.md 8 TP3, TP7; UC8-AK10, UC8-AK11).
// Läuft mit `deno test --allow-read --allow-env supabase/functions` ohne Netz und ohne Secrets: Uhr, Daten
// (tests/unit/push-speicher.ts, In-Memory mit dem Unique-Verhalten der Indizes) und Sender eingespritzt. Teile aus den
// Fixtures von Heute (tests/unit/aufgaben-fixture.ts, tests/unit/rundgang-fixture.ts): Anlage R echt, Anlage X demo.
// Erwartete Listen sind von Hand aus den Regeln R5.2 abgeleitet (Kommentare an den Szenarien).
// Vorausgesetzt (Plan 31 Schnittstellen):
// - Titel «Hydrovisor heute: 1 Ausserhalb · 2 Wechsel · 13 Routine», Gruppen mit 0 entfallen (A1), bei 0 Aufgaben
//   «Hydrovisor heute: nichts fällig» (A2); erste Zeile des Texts nach Gewicht, gleicher Titel zusammengefasst,
//   höchstens 120 Zeichen mit «+ n weitere» (A3); weitere Zeilen je Aufgabe «Titel Code».
// - «Kurzprüfung offen» im Sammel-Lauf zwischen 20:00 und 21:59 Zürich (A4), Nutzlast tag kurzpruefung, Titel
//   «Hydrovisor: Kurzprüfung offen», Text «Noch offen: R-1.1, R-3.3», Versand art kurzpruefung_20.
// - Lastschutz: nach gesendeter Sammel-Push lädt ein Lauf ausserhalb des Kurzprüfung-Fensters keine Teile.
import { einstellungenAus, faelligeAufgaben, nurEcht } from '../../../src/domain/aufgaben.ts';
import { signieren } from '../_shared/hmac.ts';
import {
  ansatzDazu,
  fertig,
  gefaessDazu,
  grundstand,
  jetztAm,
  kalibrierungDazu,
  kurzpruefungDazu,
  leer,
  messungDazu,
  phKontrolleDazu,
  platzId,
  schluessel,
  zh,
  type Teile,
} from '../../../tests/unit/aufgaben-fixture.ts';
import { regal, stromausfallDazu } from '../../../tests/unit/rundgang-fixture.ts';
import {
  FakeSender,
  PushSpeicher,
  SAMMEL,
  SCHLUESSEL,
  abo,
  aboId,
  gleich,
  lauf as laufMit,
  wahr,
} from '../../../tests/unit/push-speicher.ts';

const ZONE = 'Europe/Zurich';
const signiert = (text: string) => signieren(SCHLUESSEL, text);
const lauf = (jetzt: string | Date, daten: PushSpeicher, sender: FakeSender) =>
  laufMit(SAMMEL, jetzt, daten, sender, signiert);

/** 12.1.2027 07:00 Zürich (Push-Zeit) */
const SIEBEN = jetztAm('2027-01-12', '07:00');
const ersteZeile = (text: unknown) => String(text).split('\n')[0] ?? '';

/**
 * Nur echt: R-1.1 mit Lösung, Messung 11.1. (Messen erst 13.1.), Wurzeln am 10.1. geprüft → nur Kurzprüfung R-1.1.
 * Demo X-2.3: Wechsel 12.1., Messung 9.1. ausserhalb → Messen und nachfüllen (Ausserhalb), Lösung wechseln (Wechsel),
 * Kurzprüfung, Wurzeln prüfen. Kalibrierung 1.1. und pH-Kontrolle 11.1. noch nicht fällig.
 */
function nurDemoFaellig(): Teile {
  const t = leer();
  kalibrierungDazu(t, zh('2027-01-01'));
  phKontrolleDazu(t, zh('2027-01-11'));
  gefaessDazu(t, { code: 'R-1.1', betriebsart: 'dwc', luftpumpe: 'P1' });
  ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-01-02') });
  messungDazu(t, 'R-1.1', { gilt: zh('2027-01-11') });
  kurzpruefungDazu(t, 'R-1.1', zh('2027-01-10'), 'wurzeln');
  gefaessDazu(t, { code: 'X-2.3', betriebsart: 'dwc', luftpumpe: 'P1', naechsterWechselAm: '2027-01-12' });
  ansatzDazu(t, 'X-2.3', { begonnen: zh('2027-01-02') });
  messungDazu(t, 'X-2.3', { gilt: zh('2027-01-09'), ausserhalb: true });
  return fertig(t);
}

/** Regal (rundgang-fixture) mit Stromausfall 11.1. 23:00 bis 12.1. 06:30 an der Anlage R oder X */
function mitStromausfall(anlage: 'R' | 'X'): Teile {
  const t = regal();
  stromausfallDazu(t, { beginn: zh('2027-01-11', '23:00'), ende: zh('2027-01-12', '06:30'), anlage });
  return fertig(t);
}

const echteListe = (t: Teile, jetzt: Date) => nurEcht(faelligeAufgaben(t, einstellungenAus(t), jetzt, ZONE));

// ---------------------------------------------------------------------------------------------------------
// UC8-AK11 TP3 Nur echt
// ---------------------------------------------------------------------------------------------------------

Deno.test('UC8-AK11 TP3 Demo-Gefäss mit fälligen Aufgaben wird im Titel nicht gezählt', async () => {
  const daten = new PushSpeicher([abo(1)], nurDemoFaellig());
  const sender = new FakeSender();
  await lauf(SIEBEN, daten, sender);
  gleich(
    daten.von('sammel').map((v) => [v.titel, v.anzahl_aufgaben]),
    [['Hydrovisor heute: 1 Routine', 1]],
    'Titel und Anzahl im Versand (nur Kurzprüfung R-1.1)',
  );
  const heute = sender.mitTag('heute');
  gleich(heute.length, 1, 'Sammel-Pushes');
  gleich(heute[0]?.nutzlast['titel'], 'Hydrovisor heute: 1 Routine', 'Titel der Nutzlast');
  wahr(!String(heute[0]?.nutzlast['text']).includes('X-'), 'kein Demo-Ort im Text');
  wahr(!/Ausserhalb|Wechsel/.test(String(heute[0]?.nutzlast['titel'])), 'Demo-Gewichte nicht im Titel');
});

Deno.test(
  'UC8-AK11 TP3 Stromausfall an der Demo-Anlage zählt nicht; an der echten Anlage zählt er als Ausserhalb',
  async () => {
    // Demo X: die echte Liste des Regals hat 16 Aufgaben, alle Routine; Strom-Aufgaben nur an X (demo)
    const demo = new PushSpeicher([abo(1)], mitStromausfall('X'));
    await lauf(SIEBEN, demo, new FakeSender());
    gleich(
      demo.von('sammel').map((v) => [v.titel, v.anzahl_aufgaben]),
      [['Hydrovisor heute: 16 Routine', 16]],
      'Stromausfall an X',
    );
    // echt R: dazu Pumpen, AC10/Licht und Wassertemperatur an 7 Gefässen mit Lösung = 9 Ausserhalb
    const echt = new PushSpeicher([abo(1)], mitStromausfall('R'));
    const sender = new FakeSender();
    await lauf(SIEBEN, echt, sender);
    gleich(
      echt.von('sammel').map((v) => [v.titel, v.anzahl_aufgaben]),
      [['Hydrovisor heute: 9 Ausserhalb · 16 Routine', 25]],
      'Stromausfall an R',
    );
    wahr(
      ersteZeile(sender.mitTag('heute')[0]?.nutzlast['text']).startsWith('Pumpen prüfen nach Stromausfall'),
      `erste Zeile beginnt mit der Ausserhalb-Aufgabe: ${ersteZeile(sender.mitTag('heute')[0]?.nutzlast['text'])}`,
    );
  },
);

Deno.test('UC8-AK11 TP3 Tagesliste enthält keine Aufgabe der Demo- oder Testanlage', async () => {
  const t = grundstand();
  // Testanlage T mit einem Gefäss: wie X darf sie nicht in die Tagesliste
  t['anlage']?.push({
    id: '0f000000-0000-4000-8000-0000000000f1',
    kuerzel: 'T',
    name: 'Testanlage',
    datenart: 'test',
    aktiv: true,
    storniert_am: null,
  });
  const daten = new PushSpeicher([abo(1)], t);
  await lauf(SIEBEN, daten, new FakeSender());
  wahr(daten.tagesliste.length > 0, 'Tagesliste geschrieben');
  const demoPlatz = platzId('X-1.1');
  gleich(
    daten.tagesliste.filter((z) => z.platz_id === demoPlatz || z.aufgabe_schluessel.includes(demoPlatz)),
    [],
    'Zeilen der Demo-Anlage',
  );
  gleich(daten.tagesliste.length, 16, 'Zeilen = echte Aufgaben des Grundstands');
});

// ---------------------------------------------------------------------------------------------------------
// R5.5 Titel und Text
// ---------------------------------------------------------------------------------------------------------

Deno.test(
  'R5.5 Titel nach Gewicht «Hydrovisor heute: 1 Ausserhalb · 2 Wechsel · 9 Routine»; Gruppen mit 0 entfallen; 0 Aufgaben «nichts fällig»',
  async () => {
    // Grundstand 12.1.: Wärme prüfen R-2.1 (Ausserhalb), Ansatz R-1.2 und Lösung wechseln R-2.1 (Wechsel), 13 Routine
    const voll = new PushSpeicher([abo(1)], grundstand());
    await lauf(SIEBEN, voll, new FakeSender());
    gleich(
      voll.von('sammel').map((v) => [v.titel, v.anzahl_aufgaben]),
      [['Hydrovisor heute: 1 Ausserhalb · 2 Wechsel · 13 Routine', 16]],
      'Grundstand',
    );
    // nur Routine: Gruppen mit 0 entfallen
    const routine = new PushSpeicher([abo(1)], nurDemoFaellig());
    await lauf(SIEBEN, routine, new FakeSender());
    gleich(routine.von('sammel')[0]?.titel, 'Hydrovisor heute: 1 Routine', 'nur Routine');
    // nichts fällig: Kalibrierung und pH-Kontrolle frisch, kein Gefäss
    const t = leer();
    kalibrierungDazu(t, zh('2027-01-11'));
    const nichts = new PushSpeicher([abo(1)], fertig(t));
    const sender = new FakeSender();
    await lauf(SIEBEN, nichts, sender);
    gleich(
      nichts.von('sammel').map((v) => [v.titel, v.anzahl_aufgaben]),
      [['Hydrovisor heute: nichts fällig', 0]],
      'nichts fällig',
    );
    gleich(sender.mitTag('heute').length, 1, 'Sammel-Push auch bei 0 Aufgaben (A2)');
  },
);

Deno.test(
  'R5.5 erste Zeile: Ausserhalb vor Wechsel vor Routine, gleicher Titel zusammengefasst, höchstens 120 Zeichen mit «+ n weitere»; Nutzlast unter 4 KB bei 60 Aufgaben',
  async () => {
    const daten = new PushSpeicher([abo(1)], grundstand());
    const sender = new FakeSender();
    await lauf(SIEBEN, daten, sender);
    const text = String(sender.mitTag('heute')[0]?.nutzlast['text']);
    const erste = ersteZeile(text);
    wahr(
      erste.startsWith(
        'Wärme prüfen R-2.1 · Ansatz für Umsetzen R-1.2 · Lösung wechseln R-2.1 · pH-Kontrolle',
      ),
      `Reihenfolge nach Gewicht: ${erste}`,
    );
    wahr(erste.length <= 120, `höchstens 120 Zeichen (${erste.length})`);
    wahr(/ \+ \d+ weitere$/.test(erste), `Rest «+ n weitere»: ${erste}`);
    // weitere Zeilen: je Aufgabe «Titel Code»
    const zeilen = text.split('\n').slice(1);
    gleich(zeilen.length, 16, 'eine Zeile je Aufgabe');
    for (const z of ['Wärme prüfen R-2.1', 'Kurzprüfung R-3.3', 'Gefäss prüfen R-2.2', 'pH-Kontrolle'])
      wahr(zeilen.includes(z), `Zeile «${z}» in ${JSON.stringify(zeilen)}`);
    wahr(!text.includes('X-1.1'), 'keine Demo-Zeile');

    // 60 Aufgaben: 30 Gefässe mit Lösung, je Messen und nachfüllen und Kurzprüfung
    const t = leer();
    kalibrierungDazu(t, zh('2027-01-11'));
    for (let i = 1; i <= 30; i += 1) {
      const code = `R-${1 + (i % 4)}.${i}`;
      gefaessDazu(t, { code, betriebsart: 'dwc', luftpumpe: 'P1' });
      ansatzDazu(t, code, { begonnen: zh('2027-01-02') });
      messungDazu(t, code, { gilt: zh('2027-01-10') });
      kurzpruefungDazu(t, code, zh('2027-01-11'), 'wurzeln');
    }
    const viele = new PushSpeicher([abo(1)], fertig(t));
    const vieleSender = new FakeSender();
    await lauf(SIEBEN, viele, vieleSender);
    wahr((viele.von('sammel')[0]?.anzahl_aufgaben ?? 0) >= 60, 'mindestens 60 Aufgaben');
    const roh = vieleSender.aufrufe.find((a) => JSON.parse(a.nutzlast)['tag'] === 'heute')?.nutzlast ?? '';
    wahr(new TextEncoder().encode(roh).length < 4096, `Nutzlast unter 4 KB (${roh.length} Zeichen)`);
    const vieleErste = ersteZeile(JSON.parse(roh)['text']);
    wahr(
      vieleErste.length <= 120 && / \+ \d+ weitere$/.test(vieleErste),
      `erste Zeile gekürzt: ${vieleErste}`,
    );
    // gleicher Titel zusammengefasst: «Messen und nachfüllen R-…, R-…» statt je Ort ein Teil
    wahr(
      /^Messen und nachfüllen R-\d\.\d+, R-\d\.\d+/.test(vieleErste),
      `gleicher Titel zusammengefasst: ${vieleErste}`,
    );
  },
);

// ---------------------------------------------------------------------------------------------------------
// UC8-AK10 gleiche Liste, EK5 Tagesliste, Lastschutz
// ---------------------------------------------------------------------------------------------------------

Deno.test('UC8-AK10 Push-Liste gleich nurEcht(faelligeAufgaben()) aus der Fixture von Heute', async () => {
  const t = grundstand();
  const daten = new PushSpeicher([abo(1)], t);
  await lauf(SIEBEN, daten, new FakeSender());
  const erwartet = echteListe(grundstand(), SIEBEN);
  gleich(erwartet.length, 16, 'echte Aufgaben des Grundstands (Fixture unverändert)');
  gleich(
    daten.tageslisteAufrufe[0]?.zeilen.map((z) => z.aufgabe_schluessel),
    erwartet.map((a) => a.schluessel),
    'Schlüssel der Push-Liste in der Reihenfolge von faelligeAufgaben()',
  );
  gleich(daten.von('sammel')[0]?.anzahl_aufgaben, erwartet.length, 'anzahl_aufgaben');
});

Deno.test(
  'EK5 Tagesliste: erster Lauf schreibt je Aufgabe eine Zeile; Wiederholung am selben Tag und überfällige Aufgabe am Folgetag schreiben keine zweite',
  async () => {
    const daten = new PushSpeicher([abo(1)], grundstand());
    const sender = new FakeSender();
    await lauf(SIEBEN, daten, sender);
    gleich(daten.tagesliste.length, 16, 'Zeilen nach dem ersten Lauf');
    const gefaessPruefen = schluessel('gefaess_pruefen', platzId('R-2.2'), '2027-01-08');
    gleich(
      daten.tagesliste.find((z) => z.aufgabe_schluessel === gefaessPruefen),
      {
        tag: '2027-01-12',
        aufgabe_schluessel: gefaessPruefen,
        typ: 'gefaess_pruefen',
        platz_id: platzId('R-2.2'),
        faellig_am: '2027-01-08',
      },
      'Zeile der überfälligen Aufgabe',
    );
    const ph = daten.tagesliste.find((z) => z.typ === 'ph_kontrolle');
    gleich(ph?.platz_id, null, 'platz_id nur bei bezugArt platz');

    await lauf(jetztAm('2027-01-12', '07:05'), daten, sender);
    await lauf(jetztAm('2027-01-12', '09:30'), daten, sender);
    gleich(daten.tagesliste.length, 16, 'Wiederholung am selben Tag schreibt nichts');

    await lauf(jetztAm('2027-01-13', '07:00'), daten, sender);
    const schluesselListe = daten.tagesliste.map((z) => z.aufgabe_schluessel);
    gleich(schluesselListe.length, new Set(schluesselListe).size, 'kein Schlüssel zweimal');
    const folgetag = daten.tagesliste.filter((z) => z.tag === '2027-01-13');
    wahr(
      folgetag.some(
        (z) => z.aufgabe_schluessel === schluessel('kurzpruefung', platzId('R-1.1'), '2027-01-13'),
      ),
      'Kurzprüfung des 13.1. am Folgetag geschrieben',
    );
    wahr(
      !folgetag.some((z) => z.aufgabe_schluessel === gefaessPruefen),
      'überfällige Aufgabe am Folgetag nicht erneut',
    );
    // die Tagesliste wird geschrieben, auch wenn kein Abo besteht (unabhängig vom Kanal)
    const ohneAbo = new PushSpeicher([], grundstand());
    await lauf(SIEBEN, ohneAbo, new FakeSender());
    gleich(ohneAbo.tagesliste.length, 16, 'Tagesliste ohne Abo');
  },
);

Deno.test('R5.5 Lastschutz: nach gesendeter Sammel-Push lädt ein Lauf um 07:05 keine Teile', async () => {
  const daten = new PushSpeicher([abo(1)], grundstand());
  const sender = new FakeSender();
  await lauf(jetztAm('2027-01-12', '06:55'), daten, sender);
  gleich(daten.teileAufrufe, 0, 'vor der Push-Zeit keine Teile');
  await lauf(SIEBEN, daten, sender);
  gleich(daten.teileAufrufe, 1, 'Teile im Lauf mit Sammel-Push');
  for (const zeit of ['07:05', '07:10', '12:00', '19:55'])
    await lauf(jetztAm('2027-01-12', zeit), daten, sender);
  gleich(daten.teileAufrufe, 1, 'nach gesendeter Sammel-Push keine Teile bis vor 20:00');
  gleich(sender.mitTag('heute').length, 1, 'eine Sammel-Push');
});

// ---------------------------------------------------------------------------------------------------------
// TP7 Kurzprüfung offen um 20:00
// ---------------------------------------------------------------------------------------------------------

/** Grundstand 12.1.: offene Kurzprüfungen R-1.1, R-3.3 (echt) und X-1.1 (demo); Sammel-Push um 07:00 schon gesendet */
async function abends(
  dazu: (t: Teile) => void = () => {},
  antwort?: (nutzlast: Record<string, unknown>, nummer: number) => number,
) {
  const t = grundstand();
  dazu(t);
  const daten = new PushSpeicher([abo(1), abo(2, { datenart: 'demo' })], fertig(t));
  let kurz = 0;
  const sender = new FakeSender((_a, _n, nutzlast) => {
    if (nutzlast['tag'] !== 'kurzpruefung' || !antwort) return 201;
    kurz += 1;
    return antwort(nutzlast, kurz);
  });
  await lauf(SIEBEN, daten, sender);
  return { daten, sender };
}

Deno.test(
  'TP7 Kurzprüfung heute nur an der Demo-Anlage: Push «Kurzprüfung offen» um 20:00 wird gesendet',
  async () => {
    const { daten, sender } = await abends((t) =>
      kurzpruefungDazu(t, 'X-1.1', zh('2027-01-12', '19:00'), 'pumpe'),
    );
    const ergebnis = await lauf(jetztAm('2027-01-12', '20:00'), daten, sender);
    const kurz = sender.mitTag('kurzpruefung');
    gleich(kurz.length, 1, 'Pushes «Kurzprüfung offen»');
    gleich(kurz[0]?.abo.id, aboId(1), 'nur an das echte Abo');
    gleich(kurz[0]?.nutzlast['titel'], 'Hydrovisor: Kurzprüfung offen', 'Titel');
    gleich(kurz[0]?.nutzlast['text'], 'Noch offen: R-1.1, R-3.3', 'Text');
    gleich(ergebnis.kurzpruefung, 1, 'Ergebnis.kurzpruefung');
    gleich(
      daten.von('kurzpruefung_20').map((v) => [v.abo_id, v.datum_lokal, v.status]),
      [[aboId(1), '2027-01-12', 'gesendet']],
      'Versand kurzpruefung_20',
    );
  },
);

Deno.test('TP7 Kurzprüfung an allen echten Orten erfasst: keine Push um 20:00', async () => {
  const { daten, sender } = await abends((t) => {
    kurzpruefungDazu(t, 'R-1.1', zh('2027-01-12', '18:00'), 'pumpe');
    kurzpruefungDazu(t, 'R-3.3', zh('2027-01-12', '18:05'), 'wurzeln');
  });
  await lauf(jetztAm('2027-01-12', '20:00'), daten, sender);
  await lauf(jetztAm('2027-01-12', '20:05'), daten, sender);
  gleich(sender.mitTag('kurzpruefung').length, 0, 'Pushes «Kurzprüfung offen»');
  gleich(daten.von('kurzpruefung_20').length, 0, 'Versände kurzpruefung_20');
});

Deno.test('TP7 halber Rundgang: Push nennt nur die offenen Orte', async () => {
  const { daten, sender } = await abends((t) =>
    kurzpruefungDazu(t, 'R-1.1', zh('2027-01-12', '18:00'), 'pumpe'),
  );
  await lauf(jetztAm('2027-01-12', '20:00'), daten, sender);
  const kurz = sender.mitTag('kurzpruefung');
  gleich(kurz.length, 1, 'Pushes «Kurzprüfung offen»');
  gleich(kurz[0]?.nutzlast['text'], 'Noch offen: R-3.3', 'nur der offene Ort');
});

Deno.test(
  'TP7 19:55 keine, 20:00 eine, 20:05 keine zweite, nach 22:00 keine; Fehler 500 um 20:00 wird um 20:05 wiederholt',
  async () => {
    const { daten, sender } = await abends();
    await lauf(jetztAm('2027-01-12', '19:55'), daten, sender);
    gleich(sender.mitTag('kurzpruefung').length, 0, '19:55');
    await lauf(jetztAm('2027-01-12', '20:00'), daten, sender);
    gleich(sender.mitTag('kurzpruefung').length, 1, '20:00');
    gleich(sender.mitTag('kurzpruefung')[0]?.jetzt, '2027-01-12T19:00:00.000Z', 'gesendet um 20:00 Zürich');
    await lauf(jetztAm('2027-01-12', '20:05'), daten, sender);
    await lauf(jetztAm('2027-01-12', '21:55'), daten, sender);
    gleich(sender.mitTag('kurzpruefung').length, 1, 'keine zweite am selben Tag');

    // erster Lauf nach 22:00 (kein Lauf im Fenster): keine
    const spaet = await abends();
    await lauf(jetztAm('2027-01-12', '22:00'), spaet.daten, spaet.sender);
    await lauf(jetztAm('2027-01-12', '23:30'), spaet.daten, spaet.sender);
    gleich(spaet.sender.mitTag('kurzpruefung').length, 0, 'nach 22:00');

    // Fehler 500 um 20:00: Status fehler, Abo bleibt aktiv, 20:05 sendet erneut
    const fehler = await abends(undefined, (_n, nummer) => (nummer === 1 ? 500 : 201));
    await lauf(jetztAm('2027-01-12', '20:00'), fehler.daten, fehler.sender);
    gleich(
      fehler.daten.von('kurzpruefung_20').map((v) => v.status),
      ['fehler'],
      'Status nach 500',
    );
    gleich(fehler.daten.abos[0]?.aktiv, true, 'Abo bleibt aktiv');
    await lauf(jetztAm('2027-01-12', '20:05'), fehler.daten, fehler.sender);
    gleich(fehler.sender.mitTag('kurzpruefung').length, 2, 'Sendungen nach der Wiederholung');
    gleich(
      fehler.daten.von('kurzpruefung_20').map((v) => v.status),
      ['gesendet'],
      'eine Zeile, Status gesendet',
    );
  },
);

Deno.test('TP7 alle echten Gefässe leer (R5.4): keine Push um 20:00', async () => {
  // R-1.1 ohne Ansatz (leer), X-1.1 (demo) mit Lösung und offener Kurzprüfung
  const t = leer();
  kalibrierungDazu(t, zh('2027-01-11'));
  gefaessDazu(t, { code: 'R-1.1', betriebsart: 'dwc', luftpumpe: 'P1' });
  gefaessDazu(t, { code: 'X-1.1', betriebsart: 'dwc', luftpumpe: 'P1' });
  ansatzDazu(t, 'X-1.1', { begonnen: zh('2027-01-02') });
  fertig(t);
  gleich(
    echteListe(t, jetztAm('2027-01-12', '20:00')).filter((a) => a.typ === 'kurzpruefung'),
    [],
    'Vorbedingung: keine echte Kurzprüfung',
  );
  const daten = new PushSpeicher([abo(1)], t);
  const sender = new FakeSender();
  await lauf(SIEBEN, daten, sender);
  await lauf(jetztAm('2027-01-12', '20:00'), daten, sender);
  gleich(sender.mitTag('kurzpruefung').length, 0, 'Pushes «Kurzprüfung offen»');
});

Deno.test('TP7 Sommerzeit 28.3.2027: Push um 18:00Z statt 19:00Z', async () => {
  const daten = new PushSpeicher([abo(1)], grundstand());
  const sender = new FakeSender();
  await lauf('2027-03-28T05:00:00.000Z', daten, sender);
  await lauf('2027-03-28T17:55:00.000Z', daten, sender);
  gleich(sender.mitTag('kurzpruefung').length, 0, '19:55 Sommerzeit');
  await lauf('2027-03-28T18:00:00.000Z', daten, sender);
  gleich(sender.mitTag('kurzpruefung').length, 1, '20:00 Sommerzeit (18:00Z)');
  await lauf('2027-03-28T19:00:00.000Z', daten, sender);
  gleich(sender.mitTag('kurzpruefung').length, 1, 'keine zweite um 19:00Z');
  gleich(daten.von('kurzpruefung_20')[0]?.datum_lokal, '2027-03-28', 'datum_lokal');
});
