// Timer-Push von push-taeglich (Plan 31 Testliste «Deno timer_test.ts», Lösungsweg 4; Konzept R5.5, 11.3; 06_tests.md
// 8 TP5, TP4; 04_architektur.md 5 «Timer»; Annahme 9). Läuft mit `deno test --allow-read --allow-env
// supabase/functions` ohne Netz: Uhr, Daten (tests/unit/push-speicher.ts) und Sender eingespritzt.
// Vorausgesetzt (Plan 31 Schnittstellen):
// - Auftrag { art: 'timer', geheimnisOk } (Cron jede Minute, ?nur=timer) ruft laufendeTimer(jetzt − 15 min, jetzt)
//   und sendet je Timer einer echten Anlage und je aktivem echtem Abo genau eine Push; die Zeile push_versand
//   (kanal push, art timer, bezug_id = Ansatz, timer_ende) entsteht vor dem Senden (Index push_versand_einmal_timer).
// - Nutzlast tag timer, Titel «Timer abgelaufen · R-2.3», Text «Weiter mit der Abhakliste» (Neuansatz) bzw.
//   «Jetzt nachmessen» (pH-Korrektur), url #/ansatz/R-2.3 bzw. #/heute (A10); TTL 14400, urgency high (A9).
// - Ergebnis.timer zählt die gesendeten Timer-Pushes.
import { pruefen, signieren } from '../_shared/hmac.ts';
import { signaturText } from '../../../src/domain/push/signatur.ts';
import { grundstand } from '../../../tests/unit/aufgaben-fixture.ts';
import {
  FakeSender,
  PushSpeicher,
  SAMMEL,
  SCHLUESSEL,
  TIMER,
  abo,
  aboId,
  gleich,
  lauf as laufMit,
  uhren,
  wahr,
  type TimerZeile,
} from '../../../tests/unit/push-speicher.ts';

const signiert = (text: string) => signieren(SCHLUESSEL, text);
const ANSATZ = '0e200000-0000-4000-8000-0000000000a1';
const ANSATZ_PH = '0e200000-0000-4000-8000-0000000000a2';
/** 20.1.2027 11:00 Zürich */
const ENDE = '2027-01-20T10:00:00.000Z';

function timer(teil: Partial<TimerZeile> = {}): TimerZeile {
  return {
    ansatz_id: ANSATZ,
    typ: 'neuansatz',
    timer_ende: ENDE,
    code: 'R-2.3',
    datenart: 'echt',
    status: 'laufend',
    ...teil,
  };
}

function speicher(abos = [abo(1), abo(2)], timerZeilen: TimerZeile[] = [timer()]) {
  const daten = new PushSpeicher(abos, grundstand());
  daten.timer = timerZeilen;
  return daten;
}

const timerLauf = (jetzt: string, daten: PushSpeicher, sender: FakeSender) =>
  laufMit(TIMER, jetzt, daten, sender, signiert);

Deno.test(
  'TP5 Timer-Lauf jede Minute, timer_ende erreicht: genau eine Timer-Push je (Abo, Ansatz, timer_ende)',
  async () => {
    const daten = speicher();
    const sender = new FakeSender();
    let gezaehlt = 0;
    for (const zeit of uhren('2027-01-20T09:57:00.000Z', '2027-01-20T10:20:00.000Z', 1))
      gezaehlt += (await timerLauf(zeit, daten, sender)).timer;
    const pushes = sender.mitTag('timer');
    gleich(pushes.length, 2, 'Timer-Pushes (zwei Abos)');
    gleich(pushes.map((p) => p.abo.id).sort(), [aboId(1), aboId(2)], 'je Abo eine');
    gleich([...new Set(pushes.map((p) => p.jetzt))], [ENDE], 'gesendet im Lauf der Minute timer_ende');
    gleich(gezaehlt, 2, 'Ergebnis.timer');
    gleich(
      daten
        .von('timer')
        .map((v) => [v.kanal, v.abo_id, v.bezug_id, v.timer_ende, v.datum_lokal, v.status])
        .sort(),
      [
        ['push', aboId(1), ANSATZ, ENDE, '2027-01-20', 'gesendet'],
        ['push', aboId(2), ANSATZ, ENDE, '2027-01-20', 'gesendet'],
      ],
      'Versände art timer',
    );
    // Fenster jetzt − 15 min bis jetzt
    const letzter = daten.timerAufrufe.at(-1);
    gleich(
      letzter,
      { von: '2027-01-20T10:05:00.000Z', bis: '2027-01-20T10:20:00.000Z' },
      'laufendeTimer(jetzt − 15 min, jetzt)',
    );
  },
);

Deno.test('TP5 neuer Timer im selben Ansatz erhält eine eigene Push', async () => {
  const daten = speicher([abo(1)]);
  const sender = new FakeSender();
  for (const zeit of uhren('2027-01-20T09:59:00.000Z', '2027-01-20T10:05:00.000Z', 1))
    await timerLauf(zeit, daten, sender);
  gleich(sender.mitTag('timer').length, 1, 'erster Timer');
  // Abhakliste geht weiter: neuer Timer mit neuem timer_ende im selben Ansatz (Plan 29)
  const zweitesEnde = '2027-01-20T10:30:00.000Z';
  daten.timer = [timer({ timer_ende: zweitesEnde })];
  for (const zeit of uhren('2027-01-20T10:06:00.000Z', '2027-01-20T10:40:00.000Z', 1))
    await timerLauf(zeit, daten, sender);
  const pushes = sender.mitTag('timer');
  gleich(pushes.length, 2, 'zweiter Timer eigene Push');
  gleich(pushes[1]?.jetzt, zweitesEnde, 'zweite Push zur Minute des neuen timer_ende');
  gleich(
    daten.von('timer').map((v) => v.timer_ende),
    [ENDE, zweitesEnde],
    'je timer_ende eine Zeile',
  );
});

Deno.test('TP5 parallele Läufe derselben Minute: eine Push je Abo', async () => {
  const daten = speicher();
  const sender = new FakeSender();
  await Promise.all([timerLauf(ENDE, daten, sender), timerLauf(ENDE, daten, sender)]);
  gleich(sender.mitTag('timer').length, 2, 'Timer-Pushes bei zwei Abos');
  gleich(daten.von('timer').length, 2, 'Versände art timer');
});

Deno.test(
  'TP5 kein Timer-Push für Demo-Anlage, abgeschlossenen oder abgebrochenen Ansatz, Storno oder timer_ende älter als 15 min',
  async () => {
    const id = (n: number) => `0e200000-0000-4000-8000-0000000001${String(n).padStart(2, '0')}`;
    const daten = speicher(
      [abo(1)],
      [
        timer({ ansatz_id: id(1), code: 'X-1.1', datenart: 'demo' }),
        timer({ ansatz_id: id(2), code: 'T-1.1', datenart: 'test' }),
        timer({ ansatz_id: id(3), status: 'abgeschlossen' }),
        timer({ ansatz_id: id(4), status: 'abgebrochen' }),
        timer({ ansatz_id: id(5), storniert: true }),
        timer({ ansatz_id: id(6), timer_ende: '2027-01-20T09:44:00.000Z' }),
        timer({ ansatz_id: id(7), timer_ende: '2027-01-20T10:01:00.000Z' }),
        timer({ ansatz_id: id(8), code: 'R-3.1', timer_ende: '2027-01-20T09:46:00.000Z' }),
      ],
    );
    const sender = new FakeSender();
    await timerLauf(ENDE, daten, sender);
    const pushes = sender.mitTag('timer');
    gleich(
      pushes.map((p) => p.nutzlast['titel']),
      ['Timer abgelaufen · R-3.1'],
      'nur der echte, laufende Timer im Fenster (09:46 liegt 14 min zurück)',
    );
    gleich(
      daten.von('timer').map((v) => v.bezug_id),
      [id(8)],
      'Versände nur für diesen Timer',
    );
    // ein Demo-Abo erhält auch für echte Timer nichts
    const demoAbo = speicher([abo(3, { datenart: 'demo' }), abo(4, { aktiv: false })]);
    const demoSender = new FakeSender();
    await timerLauf(ENDE, demoAbo, demoSender);
    gleich(demoSender.aufrufe.length, 0, 'Demo-Abo und inaktives Abo');
  },
);

Deno.test('TP5 Lauf nur=timer sendet keine Sammel-Push; Sammel-Lauf sendet keine Timer-Push', async () => {
  // 11:00 Zürich: Sammel-Push des Tages fällig und noch nicht gesendet, Timer läuft gerade ab
  const daten = speicher([abo(1)]);
  const sender = new FakeSender();
  await timerLauf(ENDE, daten, sender);
  gleich(sender.mitTag('heute').length, 0, 'Sammel-Push im Timer-Lauf');
  gleich(daten.von('sammel').length, 0, 'Sammel-Versand im Timer-Lauf');
  gleich(daten.tagesliste.length, 0, 'Tagesliste im Timer-Lauf');

  const zweite = speicher([abo(1)]);
  const zweiterSender = new FakeSender();
  await laufMit(SAMMEL, ENDE, zweite, zweiterSender, signiert);
  gleich(zweiterSender.mitTag('timer').length, 0, 'Timer-Push im Sammel-Lauf');
  gleich(zweite.von('timer').length, 0, 'Timer-Versand im Sammel-Lauf');
  gleich(zweiterSender.mitTag('heute').length, 1, 'Sammel-Push im Sammel-Lauf');

  // ohne gültiges Cron-Geheimnis: 401, nichts
  const ohne = speicher([abo(1)]);
  const ohneSender = new FakeSender();
  const ergebnis = await laufMit({ art: 'timer', geheimnisOk: false }, ENDE, ohne, ohneSender, signiert);
  gleich(ergebnis.http, 401, 'HTTP ohne Geheimnis');
  gleich(ohneSender.aufrufe.length, 0, 'Sendungen ohne Geheimnis');
});

Deno.test(
  'TP5 Nutzlast: tag timer, Titel «Timer abgelaufen · R-2.3», url #/ansatz/R-2.3 bzw. #/heute bei pH-Korrektur, gültige Signatur',
  async () => {
    const daten = speicher(
      [abo(1)],
      [timer(), timer({ ansatz_id: ANSATZ_PH, typ: 'ph_korrektur', code: 'R-3.1' })],
    );
    const sender = new FakeSender();
    await timerLauf(ENDE, daten, sender);
    const pushes = sender.mitTag('timer');
    gleich(pushes.length, 2, 'Timer-Pushes');
    const neu = pushes.find((p) => p.nutzlast['titel'] === 'Timer abgelaufen · R-2.3')?.nutzlast;
    const ph = pushes.find((p) => p.nutzlast['titel'] === 'Timer abgelaufen · R-3.1')?.nutzlast;
    if (!neu || !ph) throw new Error(`Titel: ${JSON.stringify(pushes.map((p) => p.nutzlast['titel']))}`);
    gleich([neu['text'], neu['url']], ['Weiter mit der Abhakliste', '#/ansatz/R-2.3'], 'Neuansatz');
    gleich([ph['text'], ph['url']], ['Jetzt nachmessen', '#/heute'], 'pH-Korrektur');
    for (const aufruf of sender.aufrufe) {
      gleich(aufruf.optionen, { TTL: 14400, urgency: 'high' }, 'Optionen');
      wahr(new TextEncoder().encode(aufruf.nutzlast).length < 4096, 'Nutzlast unter 4 KB');
    }
    const versand = daten.von('timer').find((v) => v.bezug_id === ANSATZ);
    if (!versand) throw new Error('Versand des Neuansatzes fehlt');
    gleich(neu['versand_id'], versand.id, 'versand_id');
    wahr(
      await pruefen(SCHLUESSEL, signaturText(versand.id), String(neu['signatur'])),
      'Signatur über signaturText(versand_id) gültig',
    );
    gleich(versand.titel, 'Timer abgelaufen · R-2.3', 'Titel im Versand');
    // Zeile vor dem Senden
    const anlegen = daten.protokoll.findIndex((e) => e.startsWith('anlegen'));
    wahr(anlegen === 0, `zuerst anlegen: ${daten.protokoll.join(', ')}`);
  },
);

Deno.test(
  'TP4 Timer über die Umstellung am 28.3.2027: timer_ende 01:59 Zürich, Push 03:00 Sommerzeit',
  async () => {
    // 01:59:30 MEZ = 00:59:30Z; der nächste Lauf 01:00Z ist 03:00 MESZ und liegt 30 s nach timer_ende
    const ende = '2027-03-28T00:59:30.000Z';
    const daten = speicher([abo(1)], [timer({ timer_ende: ende })]);
    const sender = new FakeSender();
    for (const zeit of uhren('2027-03-28T00:55:00.000Z', '2027-03-28T01:20:00.000Z', 1))
      await timerLauf(zeit, daten, sender);
    const pushes = sender.mitTag('timer');
    gleich(pushes.length, 1, 'eine Timer-Push');
    gleich(pushes[0]?.jetzt, '2027-03-28T01:00:00.000Z', 'gesendet um 03:00 Sommerzeit');
    gleich(daten.von('timer')[0]?.datum_lokal, '2027-03-28', 'datum_lokal');
    gleich(daten.von('timer')[0]?.timer_ende, ende, 'timer_ende');
  },
);
