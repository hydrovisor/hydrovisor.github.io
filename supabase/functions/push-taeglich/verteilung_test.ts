// Push liest die nach R5.6 verteilte Aufgabenliste (Plan 118 Testliste «Deno»; R5.1, R5.5, R5.6, G5; UC8-AK10,
// UC8-AK11, R5.6-AK8, R5.6-AK10; Plan 31 A7). Läuft mit `deno test --allow-read --allow-env supabase/functions` ohne
// Netz und ohne Secrets: Uhr, Daten (tests/unit/push-speicher.ts) und Sender eingespritzt; Fixture
// tests/unit/verteilung-fixture.ts (vier Wechsel am Do 14.1.2027).
// Vom Testentwickler festgelegt, wo Plan 118 offen ist:
// - Welcher der vier Wechsel vorgezogen wird, legt der Test nicht fest (Plan 113 A3); er sucht ihn über den Hinweis
//   «vorgezogen» in nurEcht(verteilteAufgaben()).
// - Die Zeilen ab der zweiten heissen «Titel Code · Hinweis» (Plan 118 Lösungsweg 3); der Test prüft das Ende der
//   Zeile und vergleicht den ganzen Text mit sammelInhalt() derselben Liste.
import { einstellungenAus, faelligeAufgaben, nurEcht, type Aufgabe } from '../../../src/domain/aufgaben.ts';
import { verteilteAufgaben } from '../../../src/domain/aufgaben-verteilung.ts';
import { sammelInhalt } from '../../../src/domain/push/inhalt.ts';
import { signieren } from '../_shared/hmac.ts';
import { ZONE, type Teile } from '../../../tests/unit/aufgaben-fixture.ts';
import {
  DO,
  DO_SIEBEN,
  MI,
  MI_SIEBEN,
  MI_ZWANZIG,
  VIER_ECHT,
  vierWechsel,
} from '../../../tests/unit/verteilung-fixture.ts';
import {
  FakeSender,
  PushSpeicher,
  SAMMEL,
  SCHLUESSEL,
  abo,
  gleich,
  lauf as laufMit,
  wahr,
} from '../../../tests/unit/push-speicher.ts';

const signiert = (text: string) => signieren(SCHLUESSEL, text);
const lauf = (jetzt: string | Date, daten: PushSpeicher, sender: FakeSender) =>
  laufMit(SAMMEL, jetzt, daten, sender, signiert);

const verteilt = (t: Teile, jetzt: Date) => nurEcht(verteilteAufgaben(t, einstellungenAus(t), jetzt, ZONE));
const faellig = (t: Teile, jetzt: Date) => nurEcht(faelligeAufgaben(t, einstellungenAus(t), jetzt, ZONE));
const wechsel = (l: readonly Aufgabe[]) => l.filter((a) => a.typ === 'loesung_wechseln');
const ersteZeile = (text: unknown) => String(text).split('\n')[0] ?? '';
const weitereZeilen = (text: unknown) => String(text).split('\n').slice(1);

function einzig<T>(l: readonly T[], was: string): T {
  if (l.length !== 1) throw new Error(`${was}: erwartet genau 1, erhalten ${l.length}`);
  return l[0] as T;
}

/** der am Mi 13.1. vorgezogene Wechsel aus der verteilten Liste */
const vorgezogenAm = (t: Teile, jetzt: Date) =>
  einzig(
    wechsel(verteilt(t, jetzt)).filter((a) => a.hinweis === 'vorgezogen'),
    'Wechsel mit Hinweis «vorgezogen»',
  );

// ---------------------------------------------------------------------------------------------------------
// UC8-AK10 gleiche Liste wie Heute nach R5.6
// ---------------------------------------------------------------------------------------------------------

Deno.test(
  'UC8-AK10 Push-Liste gleich nurEcht(verteilteAufgaben()) bei vier Wechseln, vorgezogener Schlüssel am Vortag',
  async () => {
    const daten = new PushSpeicher([abo(1)], vierWechsel());
    const sender = new FakeSender();
    await lauf(MI_SIEBEN, daten, sender);

    const erwartet = verteilt(vierWechsel(), MI_SIEBEN);
    const vorgezogen = vorgezogenAm(vierWechsel(), MI_SIEBEN);
    // Schutz der Fixture: die verteilte Liste unterscheidet sich von faelligeAufgaben() genau um den vorgezogenen
    const alt = faellig(vierWechsel(), MI_SIEBEN).map((a) => a.schluessel);
    gleich(
      erwartet.map((a) => a.schluessel).filter((s) => !alt.includes(s)),
      [vorgezogen.schluessel],
      'Fixture: zusätzlich in der verteilten Liste',
    );
    gleich(
      alt.filter((s) => !erwartet.some((a) => a.schluessel === s)),
      [],
      'Fixture: in faelligeAufgaben(), aber nicht in der verteilten Liste',
    );
    gleich(vorgezogen.faelligAm, DO, 'Fixture: vorgezogener Wechsel fällig am Do 14.1.');

    gleich(
      daten.tageslisteAufrufe[0]?.zeilen.map((z) => z.aufgabe_schluessel),
      erwartet.map((a) => a.schluessel),
      'Schlüssel der Push-Liste in der Reihenfolge von nurEcht(verteilteAufgaben())',
    );
    gleich(daten.von('sammel')[0]?.anzahl_aufgaben, erwartet.length, 'anzahl_aufgaben');
    const heute = sender.mitTag('heute');
    gleich(heute.length, 1, 'Sammel-Pushes');
    gleich(heute[0]?.nutzlast['text'], sammelInhalt(erwartet).text, 'Text der Sammel-Push');
    gleich(heute[0]?.nutzlast['titel'], sammelInhalt(erwartet).titel, 'Titel der Sammel-Push');
    const zeile = daten.tagesliste.find((z) => z.aufgabe_schluessel === vorgezogen.schluessel);
    gleich(
      zeile ? { tag: zeile.tag, faellig_am: zeile.faellig_am } : undefined,
      { tag: MI, faellig_am: DO },
      'Tagesliste: vorgezogener Wechsel am Mi 13.1. mit ursprünglicher Fälligkeit',
    );
  },
);

Deno.test(
  'UC8-AK10 vorgezogener Schlüssel am Fälligkeitstag nicht ein zweites Mal in der Tagesliste',
  async () => {
    const daten = new PushSpeicher([abo(1)], vierWechsel());
    const sender = new FakeSender();
    await lauf(MI_SIEBEN, daten, sender);
    await lauf(DO_SIEBEN, daten, sender);

    gleich(daten.tageslisteAufrufe.length, 2, 'zwei Läufe mit Tagesliste');
    gleich(
      daten.tageslisteAufrufe[1]?.zeilen.map((z) => z.aufgabe_schluessel),
      verteilt(vierWechsel(), DO_SIEBEN).map((a) => a.schluessel),
      'Do 14.1.: Schlüssel der Push-Liste wie nurEcht(verteilteAufgaben())',
    );
    const vorgezogen = vorgezogenAm(vierWechsel(), MI_SIEBEN);
    gleich(
      daten.tagesliste
        .filter((z) => z.aufgabe_schluessel === vorgezogen.schluessel)
        .map((z) => [z.tag, z.faellig_am]),
      [[MI, DO]],
      'vorgezogener Wechsel genau einmal, am Mi 13.1.',
    );
    const uebrige = daten.tagesliste.filter(
      (z) => z.typ === 'loesung_wechseln' && z.aufgabe_schluessel !== vorgezogen.schluessel,
    );
    gleich(
      uebrige.map((z) => [z.tag, z.faellig_am]),
      [
        [DO, DO],
        [DO, DO],
        [DO, DO],
      ],
      'die drei übrigen Wechsel am Do 14.1.',
    );
    const schluesselListe = daten.tagesliste.map((z) => z.aufgabe_schluessel);
    gleich(schluesselListe.length, new Set(schluesselListe).size, 'kein Schlüssel zweimal');
  },
);

// ---------------------------------------------------------------------------------------------------------
// R5.6-AK8 Hinweise in der Sammel-Push
// ---------------------------------------------------------------------------------------------------------

Deno.test('R5.6-AK8 Sammel-Push zeigt «vorgezogen» und «4 Ansätze heute»', async () => {
  const daten = new PushSpeicher([abo(1)], vierWechsel());
  const sender = new FakeSender();
  await lauf(MI_SIEBEN, daten, sender);
  await lauf(DO_SIEBEN, daten, sender);
  const [mi, doPush] = sender.mitTag('heute');
  wahr(mi !== undefined && doPush !== undefined, 'zwei Sammel-Pushes (Mi und Do)');

  const miZeilen = weitereZeilen(mi?.nutzlast['text']);
  const miVorgezogen = miZeilen.filter((z) => z.endsWith(' · vorgezogen'));
  gleich(miVorgezogen.length, 1, `Mi: Zeilen mit « · vorgezogen» in ${JSON.stringify(miZeilen)}`);
  wahr(
    /^Lösung wechseln R-\d\.\d · vorgezogen$/.test(miVorgezogen[0] ?? ''),
    `Mi: «Lösung wechseln <Code> · vorgezogen»: ${miVorgezogen[0]}`,
  );

  const doZeilen = weitereZeilen(doPush?.nutzlast['text']);
  const doUeberzahl = doZeilen.filter((z) => z.endsWith(' · 4 Ansätze heute'));
  gleich(doUeberzahl.length, 1, `Do: Zeilen mit « · 4 Ansätze heute» in ${JSON.stringify(doZeilen)}`);
  wahr(
    /^Lösung wechseln R-\d\.\d · 4 Ansätze heute$/.test(doUeberzahl[0] ?? ''),
    `Do: «Lösung wechseln <Code> · 4 Ansätze heute»: ${doUeberzahl[0]}`,
  );
  // die drei übrigen Wechsel am Do ohne Hinweis «Titel Code»
  gleich(
    doZeilen.filter((z) => /^Lösung wechseln R-\d\.\d$/.test(z)).length,
    3,
    'Do: drei Wechsel ohne Hinweis',
  );

  for (const p of [mi, doPush]) {
    const titel = String(p?.nutzlast['titel']);
    const erste = ersteZeile(p?.nutzlast['text']);
    wahr(!/vorgezogen|Ansätze heute/.test(titel), `Titel ohne Hinweis: ${titel}`);
    wahr(!/vorgezogen|Ansätze heute/.test(erste), `erste Zeile ohne Hinweis: ${erste}`);
  }
});

// ---------------------------------------------------------------------------------------------------------
// Grenzfälle: Kurzprüfung und Demo
// ---------------------------------------------------------------------------------------------------------

Deno.test('R5.5 Kurzprüfung offen unverändert mit verteilter Liste', async () => {
  const daten = new PushSpeicher([abo(1)], vierWechsel());
  const sender = new FakeSender();
  await lauf(MI_SIEBEN, daten, sender);
  await lauf(MI_ZWANZIG, daten, sender);
  const kurz = sender.mitTag('kurzpruefung');
  gleich(kurz.length, 1, 'Pushes «Kurzprüfung offen»');
  gleich(kurz[0]?.nutzlast['text'], `Noch offen: ${VIER_ECHT.join(', ')}`, 'Text');
});

Deno.test('UC8-AK11 TP3 Demo-Wechsel verschieben die echte Liste nicht', async () => {
  const ohneDemo = verteilt(vierWechsel(), MI_SIEBEN);
  const mitDemo = verteilt(vierWechsel({ demo: true }), MI_SIEBEN);
  gleich(
    mitDemo.map((a) => [a.schluessel, a.hinweis ?? null]),
    ohneDemo.map((a) => [a.schluessel, a.hinweis ?? null]),
    'echte verteilte Liste mit und ohne Demo-Anlage',
  );

  const daten = new PushSpeicher([abo(1)], vierWechsel({ demo: true }));
  const sender = new FakeSender();
  await lauf(MI_SIEBEN, daten, sender);
  gleich(
    daten.tageslisteAufrufe[0]?.zeilen.map((z) => z.aufgabe_schluessel),
    ohneDemo.map((a) => a.schluessel),
    'Tagesliste wie ohne Demo-Anlage',
  );
  gleich(daten.von('sammel')[0]?.anzahl_aufgaben, ohneDemo.length, 'anzahl_aufgaben ohne Demo');
  wahr(!String(sender.mitTag('heute')[0]?.nutzlast['text']).includes('X-'), 'kein Demo-Ort im Text');
});
