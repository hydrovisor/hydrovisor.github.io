// Kern der Edge Function push-taeglich (Pläne 13 und 31; Konzept 11.1, 11.3, R5.1, R5.5, G2, G5; TP1 bis TP7, UC0-AK5,
// UC8-AK7, UC8-AK11, EK5, T2). Laufzeitneutral: Uhr, Datenzugriff, Sender, Mailer und Signatur kommen als
// Abhängigkeiten; die Hülle index.ts verbindet sie mit supabase-js, web-push, Resend und den Secrets.
// Aufträge: «sammel» (Cron alle 5 min: Sammel-Push mit Tagesliste und E-Mail-Rückfall, 20:00 «Kurzprüfung offen»),
// «timer» (Cron jede Minute, ?nur=timer) und «test» (Test-Push aus den Einstellungen). Jede Zeile push_versand entsteht
// vor dem Senden; die Unique-Indizes verhindern die zweite Sendung.
import {
  einstellungenAus,
  faelligeAufgaben,
  fehlendeTeile,
  nurEcht,
  type Aufgabe,
} from '../../../src/domain/aufgaben.ts';
import type { Datenart } from '../../../src/domain/kalibrierung/stand.ts';
import {
  kurzpruefungInhalt,
  kurzpruefungOffen,
  sammelInhalt,
  tageslisteZeilen,
  timerInhalt,
  type TageslisteZeile,
} from '../../../src/domain/push/inhalt.ts';
import { signaturText } from '../../../src/domain/push/signatur.ts';
import {
  kurzpruefungFaellig,
  sammelFaellig,
  TIMER_FENSTER_MS,
  timerFaellig,
  wiederholungErlaubt,
} from '../../../src/domain/push/zeitpunkt.ts';
import { kalendertag } from '../../../src/domain/zeit.ts';
import { BASIS_URL } from '../../../src/adressen.ts';

export interface Abo {
  id: string;
  endpoint: string;
  p256dh: string;
  auth_schluessel: string;
  datenart: Datenart;
  aktiv: boolean;
}

export type Kanal = 'push' | 'email';
export type VersandArt = 'sammel' | 'kurzpruefung_20' | 'timer' | 'test';
type Abschluss = 'gesendet' | 'fehler' | 'abgemeldet';

export interface LaufenderTimer {
  ansatz_id: string;
  typ: string;
  /** ISO-Text wie von PostgREST; geht unverändert in push_versand.timer_ende */
  timer_ende: string;
  /** Code des Orts, z. B. R-2.3 */
  code: string;
  /** Datenart der Anlage */
  datenart: Datenart;
}

export interface PushDaten {
  einstellung(): Promise<{ push_zeit: string; zeitzone: string; email_rueckfall: boolean }>;
  /** ungefiltert; der Kern filtert aktiv und echt */
  aktiveAbos(): Promise<Abo[]>;
  aboZuEndpoint(endpoint: string): Promise<Abo | undefined>;
  /** alle AUFGABEN_TEILE wie im Offline-Bündel (gleiche Filter, gleiche Kürzung) */
  teile(stichtag: Date): Promise<Record<string, unknown[]>>;
  /** Versände des Kalendertags (für den Lastschutz) */
  versandHeute(
    datum_lokal: string,
  ): Promise<{ abo_id: string | null; kanal: Kanal; art: VersandArt; status: string }[]>;
  /** Unique-Indizes push_versand_einmal_push, _email, _timer → 'besteht' */
  versandAnlegen(z: {
    kanal: Kanal;
    abo_id: string | null;
    art: VersandArt;
    datum_lokal: string;
    titel: string;
    anzahl_aufgaben: number;
    bezug_id?: string;
    timer_ende?: string;
  }): Promise<{ id: string } | 'besteht'>;
  /** Status fehler → geplant, atomar; undefined, wenn keine solche Zeile besteht */
  fehlerVersandUebernehmen(
    abo_id: string | null,
    datum_lokal: string,
    art: VersandArt,
    kanal: Kanal,
  ): Promise<{ id: string } | undefined>;
  versandAbschliessen(id: string, status: Abschluss, gesendetAm?: Date): Promise<void>;
  aboDeaktivieren(id: string, fehler: string): Promise<void>;
  testsHeute(datum_lokal: string): Promise<number>;
  /** schreibt nur Schlüssel, die noch in keiner früheren Zeile stehen (A7); Anzahl neuer Zeilen */
  tageslisteSchreiben(tag: string, zeilen: readonly TageslisteZeile[]): Promise<number>;
  /** steht für den Tag schon eine Zeile in aufgabe_tagesliste? Optional: fehlt die Methode, gilt «nein» */
  tageslisteVorhanden?(tag: string): Promise<boolean>;
  /** laufende, nicht stornierte Ansätze mit von < timer_ende ≤ bis */
  laufendeTimer(von: Date, bis: Date): Promise<LaufenderTimer[]>;
}

export interface Sender {
  senden(abo: Abo, nutzlast: string, optionen: { TTL: 14400; urgency: 'high' }): Promise<{ status: number }>;
}

/** E-Mail-Rückfall (R5.5, R13); fehlt er, sendet der Lauf keine E-Mail */
export interface Mailer {
  senden(m: { betreff: string; text: string; idempotenz: string }): Promise<{ status: number }>;
}

export type Auftrag =
  | { art: 'sammel'; geheimnisOk: boolean }
  | { art: 'timer'; geheimnisOk: boolean }
  | { art: 'test'; istTim: boolean; endpoint: string };

export interface Ergebnis {
  http: number;
  /** Sammel- und Test-Pushes */
  versandt: number;
  uebersprungen: number;
  abgemeldet: number;
  emails: number;
  timer: number;
  kurzpruefung: number;
}

export const TESTS_JE_TAG = 10;
const OPTIONEN = { TTL: 14400, urgency: 'high' } as const;
const TEST_TITEL = 'Hydrovisor Test-Push';

interface Abhaengigkeiten {
  jetzt: Date;
  daten: PushDaten;
  sender: Sender;
  signieren: (text: string) => Promise<string>;
  mailer?: Mailer;
}

type Tag = 'heute' | 'test' | 'kurzpruefung' | 'timer';
type Zustellung = 'gesendet' | 'fehler' | 'abgemeldet';

/** Senden und Ergebnis festhalten: 2xx gesendet; 404 und 410 Abo inaktiv, Versand abgemeldet; sonst fehler */
async function zustellen(
  abh: Abhaengigkeiten,
  abo: Abo,
  versandId: string,
  inhalt: { titel: string; text: string; tag: Tag; url?: string },
  ergebnis: Ergebnis,
): Promise<Zustellung> {
  const nutzlast = JSON.stringify({
    titel: inhalt.titel,
    text: inhalt.text,
    versand_id: versandId,
    signatur: await abh.signieren(signaturText(versandId)),
    tag: inhalt.tag,
    url: inhalt.url ?? '#/heute',
  });
  let status: number;
  try {
    status = (await abh.sender.senden(abo, nutzlast, OPTIONEN)).status;
  } catch {
    status = 0;
  }
  if (status >= 200 && status < 300) {
    await abh.daten.versandAbschliessen(versandId, 'gesendet', abh.jetzt);
    return 'gesendet';
  }
  if (status === 404 || status === 410) {
    await abh.daten.aboDeaktivieren(abo.id, status === 410 ? '410 Gone' : '404 Not Found');
    await abh.daten.versandAbschliessen(versandId, 'abgemeldet');
    ergebnis.abgemeldet += 1;
    return 'abgemeldet';
  }
  await abh.daten.versandAbschliessen(versandId, 'fehler');
  return 'fehler';
}

/** Zeile anlegen; besteht sie, nach einem Fehler nur im Wiederholungsfenster übernehmen */
async function versandFuer(
  abh: Abhaengigkeiten,
  z: Parameters<PushDaten['versandAnlegen']>[0],
  wiederholen: boolean,
): Promise<{ id: string } | undefined> {
  const v = await abh.daten.versandAnlegen(z);
  if (v !== 'besteht') return v;
  if (!wiederholen) return undefined;
  return abh.daten.fehlerVersandUebernehmen(z.abo_id, z.datum_lokal, z.art, z.kanal);
}

const leer = (): Ergebnis => ({
  http: 200,
  versandt: 0,
  uebersprungen: 0,
  abgemeldet: 0,
  emails: 0,
  timer: 0,
  kurzpruefung: 0,
});

const echteAktive = (abos: readonly Abo[]) => abos.filter((a) => a.aktiv && a.datenart === 'echt');

export async function pushLauf(auftrag: Auftrag, abh: Abhaengigkeiten): Promise<Ergebnis> {
  const ergebnis = leer();
  if (auftrag.art === 'test' ? !auftrag.istTim : !auftrag.geheimnisOk) return { ...ergebnis, http: 401 };
  const einstellung = await abh.daten.einstellung();

  if (auftrag.art === 'test') return testLauf(auftrag.endpoint, einstellung.zeitzone, abh, ergebnis);
  if (auftrag.art === 'timer') return timerLauf(einstellung.zeitzone, abh, ergebnis);
  return sammelLauf(einstellung, abh, ergebnis);
}

async function testLauf(
  endpoint: string,
  zeitzone: string,
  abh: Abhaengigkeiten,
  ergebnis: Ergebnis,
): Promise<Ergebnis> {
  const datum = kalendertag(abh.jetzt, zeitzone);
  if ((await abh.daten.testsHeute(datum)) >= TESTS_JE_TAG) return { ...ergebnis, http: 429 };
  const abo = await abh.daten.aboZuEndpoint(endpoint);
  if (!abo || !abo.aktiv) return { ...ergebnis, http: 404 };
  const v = await abh.daten.versandAnlegen({
    kanal: 'push',
    abo_id: abo.id,
    art: 'test',
    datum_lokal: datum,
    titel: TEST_TITEL,
    anzahl_aufgaben: 0,
  });
  if (v === 'besteht') return { ...ergebnis, uebersprungen: 1 };
  const z = await zustellen(
    abh,
    abo,
    v.id,
    { titel: TEST_TITEL, text: 'Push funktioniert.', tag: 'test' },
    ergebnis,
  );
  if (z === 'gesendet') ergebnis.versandt += 1;
  return ergebnis;
}

/** Timer-Push (TP5, Annahme 9): je echtem Timer der letzten 15 min und je aktivem echtem Abo eine Push */
async function timerLauf(zeitzone: string, abh: Abhaengigkeiten, ergebnis: Ergebnis): Promise<Ergebnis> {
  const timer = (
    await abh.daten.laufendeTimer(new Date(abh.jetzt.getTime() - TIMER_FENSTER_MS), abh.jetzt)
  ).filter((t) => t.datenart === 'echt' && timerFaellig(new Date(t.timer_ende), abh.jetzt));
  if (timer.length === 0) return ergebnis;
  const abos = echteAktive(await abh.daten.aktiveAbos());
  const datum = kalendertag(abh.jetzt, zeitzone);
  for (const t of timer) {
    const inhalt = timerInhalt({ typ: t.typ, code: t.code });
    for (const abo of abos) {
      const v = await abh.daten.versandAnlegen({
        kanal: 'push',
        abo_id: abo.id,
        art: 'timer',
        datum_lokal: datum,
        titel: inhalt.titel,
        anzahl_aufgaben: 0,
        bezug_id: t.ansatz_id,
        timer_ende: t.timer_ende,
      });
      if (v === 'besteht') {
        ergebnis.uebersprungen += 1;
        continue;
      }
      if ((await zustellen(abh, abo, v.id, { ...inhalt, tag: 'timer' }, ergebnis)) === 'gesendet')
        ergebnis.timer += 1;
    }
  }
  return ergebnis;
}

/**
 * Sammel-Lauf: Sammel-Push ab Push-Zeit (einmal je Tag, Wiederholung bis + 4 h), Tagesliste, E-Mail-Rückfall ohne
 * gültiges Abo, danach 20:00 bis 21:59 «Kurzprüfung offen». Lastschutz: Teile werden nur geladen, wenn etwas offen ist.
 */
async function sammelLauf(
  einstellung: { push_zeit: string; zeitzone: string; email_rueckfall: boolean },
  abh: Abhaengigkeiten,
  ergebnis: Ergebnis,
): Promise<Ergebnis> {
  const { push_zeit, zeitzone } = einstellung;
  const sammel = sammelFaellig(abh.jetzt, zeitzone, push_zeit);
  const kurz = kurzpruefungFaellig(abh.jetzt, zeitzone);
  if (!sammel.faellig && !kurz.faellig) return { ...ergebnis, http: 204 };
  const datum = sammel.datumLokal;
  const wieder = wiederholungErlaubt(abh.jetzt, zeitzone, push_zeit);
  const abos = echteAktive(await abh.daten.aktiveAbos());
  const versaende = await abh.daten.versandHeute(datum);
  const zeile = (art: VersandArt, kanal: Kanal, aboId: string | null) =>
    versaende.find((v) => v.art === art && v.kanal === kanal && v.abo_id === aboId);
  /** braucht dieses Abo (oder die E-Mail) noch eine Sendung? fehler nur im Wiederholungsfenster */
  const offen = (art: VersandArt, kanal: Kanal, aboId: string | null, wiederholen: boolean) => {
    const z = zeile(art, kanal, aboId);
    return !z || (z.status === 'fehler' && wiederholen);
  };
  const mailMoeglich = abh.mailer !== undefined && einstellung.email_rueckfall;

  // Was ist offen? (Lastschutz, Plan 31 Schritt 3)
  const pushOffen = sammel.faellig ? abos.filter((a) => offen('sammel', 'push', a.id, wieder)) : [];
  if (sammel.faellig) ergebnis.uebersprungen += abos.length - pushOffen.length;
  const mailOffen =
    sammel.faellig && mailMoeglich && abos.length === 0 && offen('sammel', 'email', null, wieder);
  // ohne jeden Kanal: Tagesliste trotzdem schreiben, im Fenster bis Push-Zeit + 4 h (A7, unabhängig vom Kanal)
  // (Lastschutz, Prüfer #31 Befund 3: nur bis die Tagesliste des Tages steht)
  const nurListe =
    sammel.faellig &&
    abos.length === 0 &&
    !mailMoeglich &&
    wieder &&
    (await abh.daten.tageslisteVorhanden?.(datum)) !== true;
  const kurzOffen = kurz.faellig ? abos.filter((a) => offen('kurzpruefung_20', 'push', a.id, true)) : [];
  if (pushOffen.length === 0 && !mailOffen && !nurListe && kurzOffen.length === 0) return ergebnis;

  const teile = await abh.daten.teile(abh.jetzt);
  // gleiche Teile wie das Bündel; fehlt einer, rechnet die Push mit einer Lücke (Plan 31 Risiken, Befund 2)
  const fehlend = fehlendeTeile(teile);
  if (fehlend.length > 0) console.warn(`push-taeglich: Teile fehlen: ${fehlend.join(', ')}`);
  const liste: Aufgabe[] = nurEcht(faelligeAufgaben(teile, einstellungenAus(teile), abh.jetzt, zeitzone));

  if (sammel.faellig && (pushOffen.length > 0 || mailOffen || nurListe)) {
    const inhalt = sammelInhalt(liste);
    await abh.daten.tageslisteSchreiben(datum, tageslisteZeilen(liste, datum));
    let aktivNachher = abos.length;
    for (const abo of pushOffen) {
      const v = await versandFuer(
        abh,
        {
          kanal: 'push',
          abo_id: abo.id,
          art: 'sammel',
          datum_lokal: datum,
          titel: inhalt.titel,
          anzahl_aufgaben: inhalt.anzahl,
        },
        wieder,
      );
      if (!v) {
        ergebnis.uebersprungen += 1;
        continue;
      }
      const z = await zustellen(
        abh,
        abo,
        v.id,
        { titel: inhalt.titel, text: inhalt.text, tag: 'heute' },
        ergebnis,
      );
      if (z === 'gesendet') ergebnis.versandt += 1;
      if (z === 'abgemeldet') aktivNachher -= 1;
    }
    if (einstellung.email_rueckfall && !abh.mailer && aktivNachher === 0)
      console.warn(
        'push-taeglich: E-Mail-Rückfall ist an, aber nicht eingerichtet (RESEND_API_KEY, EMAIL_EMPFAENGER)',
      );
    // E-Mail nur, wenn nach dem Push-Teil kein aktives echtes Abo bleibt (R5.5, R13; nicht bei 5xx)
    if (mailMoeglich && aktivNachher === 0 && (abos.length > 0 || mailOffen))
      await mailSenden(abh, datum, inhalt, wieder, ergebnis);
  }

  if (kurz.faellig && kurzOffen.length > 0) {
    const offenListe = kurzpruefungOffen(liste, kurz.datumLokal);
    if (offenListe.length > 0) {
      const inhalt = kurzpruefungInhalt(offenListe);
      for (const abo of kurzOffen) {
        const v = await versandFuer(
          abh,
          {
            kanal: 'push',
            abo_id: abo.id,
            art: 'kurzpruefung_20',
            datum_lokal: kurz.datumLokal,
            titel: inhalt.titel,
            anzahl_aufgaben: offenListe.length,
          },
          true,
        );
        if (!v) continue;
        const z = await zustellen(abh, abo, v.id, { ...inhalt, tag: 'kurzpruefung' }, ergebnis);
        if (z === 'gesendet') ergebnis.kurzpruefung += 1;
      }
    }
  }
  return ergebnis;
}

async function mailSenden(
  abh: Abhaengigkeiten,
  datum: string,
  inhalt: { titel: string; text: string; anzahl: number },
  wieder: boolean,
  ergebnis: Ergebnis,
): Promise<void> {
  const mailer = abh.mailer;
  if (!mailer) return;
  const v = await versandFuer(
    abh,
    {
      kanal: 'email',
      abo_id: null,
      art: 'sammel',
      datum_lokal: datum,
      titel: inhalt.titel,
      anzahl_aufgaben: inhalt.anzahl,
    },
    wieder,
  );
  if (!v) return;
  let status: number;
  try {
    status = (
      await mailer.senden({
        betreff: inhalt.titel,
        text: `${inhalt.text}\n\nHeute öffnen: ${BASIS_URL}#/heute`,
        idempotenz: v.id,
      })
    ).status;
  } catch {
    status = 0;
  }
  if (status >= 200 && status < 300) {
    await abh.daten.versandAbschliessen(v.id, 'gesendet', abh.jetzt);
    ergebnis.emails += 1;
  } else {
    await abh.daten.versandAbschliessen(v.id, 'fehler');
  }
}
