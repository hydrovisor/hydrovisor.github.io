// E-Mail-Rückfall von push-taeglich (Plan 31 Abschnitt «E-Mail-Rückfall» und Testliste «Deno email_test.ts»; Konzept
// R5.5, 11.1, R13; 06_tests.md 8 TP6). Läuft mit `deno test --allow-read --allow-env supabase/functions` ohne Netz
// und ohne Secrets: Mailer als Attrappe (kein Resend), Empfänger nur als Secret in index.ts, hier nie genannt.
// Vorausgesetzt (Plan 31 Schnittstellen):
// - Mailer.senden({ betreff, text, idempotenz }) → { status }; 2xx gesendet, sonst fehler (Wiederholung bis
//   Push-Zeit + 4 h über fehlerVersandUebernehmen(null, datum_lokal, 'sammel', 'email')).
// - E-Mail nur, wenn die Sammel-Push fällig ist, email_rueckfall = true und nach dem Push-Teil des Laufs kein aktives
//   echtes Abo bleibt; nicht bei Push-Antwort 5xx; nie für «Kurzprüfung offen» und Timer (A8).
// - Versand kanal email, abo_id null, art sammel; Index push_versand_einmal_email (einmal je Tag).
// - Betreff = Titel der Sammel-Push; Text mit allen Aufgaben und dem Link https://hydrovisor.github.io/#/heute;
//   idempotenz = versand_id (A6). Ergebnis.emails zählt gesendete Mails.
import { signieren } from '../_shared/hmac.ts';
import { grundstand, jetztAm } from '../../../tests/unit/aufgaben-fixture.ts';
import {
  FakeMailer,
  FakeSender,
  PushSpeicher,
  SAMMEL,
  SCHLUESSEL,
  TIMER,
  abo,
  gleich,
  lauf as laufMit,
  uhren,
  wahr,
} from '../../../tests/unit/push-speicher.ts';
import type { Abo } from './kern.ts';

const signiert = (text: string) => signieren(SCHLUESSEL, text);
const SIEBEN = jetztAm('2027-01-12', '07:00');

function speicher(abos: Abo[] = [], emailRueckfall = true) {
  const daten = new PushSpeicher(abos, grundstand());
  daten.emailRueckfall = emailRueckfall;
  return daten;
}

const lauf = (jetzt: string | Date, daten: PushSpeicher, sender: FakeSender, mailer?: FakeMailer) =>
  laufMit(SAMMEL, jetzt, daten, sender, signiert, mailer);

Deno.test('TP6 kein aktives Abo, email_rueckfall an: genau eine Sammel-Mail je Tag', async () => {
  const daten = speicher();
  const sender = new FakeSender();
  const mailer = new FakeMailer();
  let emails = 0;
  // 12.1. 00:00 bis 13.1. 23:55 Zürich, alle 5 min
  for (const zeit of uhren('2027-01-11T23:00:00.000Z', '2027-01-13T22:55:00.000Z', 5))
    emails += (await lauf(zeit, daten, sender, mailer)).emails;
  gleich(mailer.aufrufe.length, 2, 'Mails');
  gleich(emails, 2, 'Ergebnis.emails');
  gleich(sender.aufrufe.length, 0, 'keine Push ohne Abo');
  gleich(
    daten.von('sammel', 'email').map((v) => [v.abo_id, v.datum_lokal, v.status]),
    [
      [null, '2027-01-12', 'gesendet'],
      [null, '2027-01-13', 'gesendet'],
    ],
    'je Tag eine Zeile kanal email',
  );
});

Deno.test('TP6 email_rueckfall aus oder ohne Mailer: keine Mail, Lauf ohne Fehler', async () => {
  const aus = speicher([], false);
  const mailer = new FakeMailer();
  const ergebnis = await lauf(SIEBEN, aus, new FakeSender(), mailer);
  gleich(ergebnis.http, 200, 'HTTP mit email_rueckfall aus');
  gleich(mailer.aufrufe.length, 0, 'Mails mit email_rueckfall aus');
  gleich(aus.von('sammel', 'email').length, 0, 'Versände email mit email_rueckfall aus');

  // Secrets fehlen: index.ts baut keinen Mailer
  const ohne = speicher([], true);
  const ohneErgebnis = await lauf(SIEBEN, ohne, new FakeSender());
  gleich(ohneErgebnis.http, 200, 'HTTP ohne Mailer');
  gleich(ohneErgebnis.emails, 0, 'emails ohne Mailer');
  gleich(ohne.von('sammel', 'email').length, 0, 'Versände email ohne Mailer');
});

Deno.test('TP6 aktives echtes Abo: keine Mail; Antwort 410 im Lauf: Mail im selben Lauf', async () => {
  const mitAbo = speicher([abo(1)]);
  const mailer = new FakeMailer();
  await lauf(SIEBEN, mitAbo, new FakeSender(), mailer);
  await lauf(jetztAm('2027-01-12', '07:05'), mitAbo, new FakeSender(), mailer);
  gleich(mailer.aufrufe.length, 0, 'Mails mit gültigem Abo');

  const weg = speicher([abo(1)]);
  const wegMailer = new FakeMailer();
  const ergebnis = await lauf(SIEBEN, weg, new FakeSender(() => 410), wegMailer);
  gleich(ergebnis.abgemeldet, 1, 'abgemeldet');
  gleich(weg.abos[0]?.aktiv, false, 'Abo inaktiv');
  gleich(wegMailer.aufrufe.length, 1, 'Mail im selben Lauf');
  gleich(ergebnis.emails, 1, 'Ergebnis.emails');
  gleich(
    weg.von('sammel', 'email').map((v) => [v.datum_lokal, v.status]),
    [['2027-01-12', 'gesendet']],
    'Versand email',
  );
});

Deno.test('TP6 Push-Antwort 500 (Abo bleibt aktiv): keine Mail', async () => {
  const daten = speicher([abo(1)]);
  const mailer = new FakeMailer();
  const sender = new FakeSender(() => 500);
  for (const zeit of ['07:00', '07:05', '07:10'])
    await lauf(jetztAm('2027-01-12', zeit), daten, sender, mailer);
  gleich(daten.abos[0]?.aktiv, true, 'Abo aktiv');
  gleich(mailer.aufrufe.length, 0, 'Mails');
  gleich(daten.von('sammel', 'email').length, 0, 'Versände email');
});

Deno.test('TP6 nur Demo-Abo aktiv: zählt als kein Abo, Mail geht', async () => {
  const daten = speicher([abo(1, { datenart: 'demo' }), abo(2, { aktiv: false })]);
  const mailer = new FakeMailer();
  const sender = new FakeSender();
  await lauf(SIEBEN, daten, sender, mailer);
  gleich(sender.aufrufe.length, 0, 'keine Push an Demo- oder inaktives Abo');
  gleich(mailer.aufrufe.length, 1, 'Mails');
});

Deno.test('TP6 Mail-Fehler 500: Wiederholung im nächsten Lauf, nicht nach Push-Zeit + 4 h', async () => {
  const daten = speicher();
  const mailer = new FakeMailer((nummer) => (nummer === 1 ? 500 : 200));
  await lauf(SIEBEN, daten, new FakeSender(), mailer);
  gleich(
    daten.von('sammel', 'email').map((v) => v.status),
    ['fehler'],
    'Status nach 500',
  );
  await lauf(jetztAm('2027-01-12', '07:05'), daten, new FakeSender(), mailer);
  gleich(mailer.aufrufe.length, 2, 'Mails nach der Wiederholung');
  gleich(
    daten.von('sammel', 'email').map((v) => v.status),
    ['gesendet'],
    'eine Zeile, Status gesendet',
  );
  await lauf(jetztAm('2027-01-12', '07:10'), daten, new FakeSender(), mailer);
  gleich(mailer.aufrufe.length, 2, 'keine dritte Mail');
  // gleiche idempotenz bei der Wiederholung
  gleich(mailer.aufrufe[0]?.idempotenz, mailer.aufrufe[1]?.idempotenz, 'Idempotenz bei Wiederholung gleich');

  // Fehler um 07:00, nächster Lauf erst 11:05: keine Wiederholung mehr
  const spaet = speicher();
  const spaetMailer = new FakeMailer(() => 500);
  await lauf(SIEBEN, spaet, new FakeSender(), spaetMailer);
  await lauf(jetztAm('2027-01-12', '11:05'), spaet, new FakeSender(), spaetMailer);
  gleich(spaetMailer.aufrufe.length, 1, 'Mails nach 11:00');
  gleich(
    spaet.von('sammel', 'email').map((v) => v.status),
    ['fehler'],
    'Status bleibt fehler',
  );
});

Deno.test(
  'TP6 Betreff = Titel der Sammel-Push, Text mit allen Aufgaben und Link https://hydrovisor.github.io/#/heute, Idempotenz = versand_id',
  async () => {
    const daten = speicher();
    const mailer = new FakeMailer();
    await lauf(SIEBEN, daten, new FakeSender(), mailer);
    const mail = mailer.aufrufe[0];
    if (!mail) throw new Error('keine Mail');
    gleich(mail.betreff, 'Hydrovisor heute: 1 Ausserhalb · 2 Wechsel · 13 Routine', 'Betreff');
    for (const zeile of [
      'Wärme prüfen R-2.1',
      'Ansatz für Umsetzen R-1.2',
      'Lösung wechseln R-2.1',
      'Gefäss prüfen R-2.2',
      'Kurzprüfung R-1.1',
      'Kurzprüfung R-3.3',
      'Station auf 1. echte Blätter R-4.4',
    ])
      wahr(mail.text.split('\n').includes(zeile), `Zeile «${zeile}» im Text`);
    wahr(mail.text.includes('https://hydrovisor.github.io/#/heute'), 'Link auf Heute');
    wahr(!mail.text.includes('X-1.1'), 'keine Demo-Aufgabe');
    const versand = daten.von('sammel', 'email')[0];
    if (!versand) throw new Error('kein Versand email');
    gleich(mail.idempotenz, versand.id, 'Idempotenz = versand_id');
    gleich([versand.titel, versand.anzahl_aufgaben], [mail.betreff, 16], 'Titel und Anzahl im Versand');
  },
);

Deno.test('TP6 keine Mail für Kurzprüfung 20:00 und Timer', async () => {
  const daten = speicher();
  daten.timer = [
    {
      ansatz_id: '0e200000-0000-4000-8000-0000000000a1',
      typ: 'neuansatz',
      timer_ende: '2027-01-12T19:00:00.000Z',
      code: 'R-1.1',
      datenart: 'echt',
      status: 'laufend',
    },
  ];
  const mailer = new FakeMailer();
  const sender = new FakeSender();
  // erster Lauf des Tages um 20:00: Sammel-Mail (fällig seit 07:00), aber keine Mail «Kurzprüfung offen»
  await lauf(jetztAm('2027-01-12', '20:00'), daten, sender, mailer);
  await lauf(jetztAm('2027-01-12', '20:05'), daten, sender, mailer);
  await laufMit(TIMER, jetztAm('2027-01-12', '20:00'), daten, sender, signiert, mailer);
  gleich(mailer.aufrufe.length, 1, 'nur die Sammel-Mail');
  wahr(String(mailer.aufrufe[0]?.betreff).startsWith('Hydrovisor heute:'), 'Betreff der Sammel-Mail');
  gleich(
    daten.versande.filter((v) => v.kanal === 'email').map((v) => v.art),
    ['sammel'],
    'Versände email',
  );
});
