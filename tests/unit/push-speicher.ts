// Attrappen für die Deno-Tests von push-taeglich in I1b-06 (Plan 31 Testliste: sammel_test.ts, timer_test.ts,
// email_test.ts). Liegt unter tests/unit wie push-fixture.ts und aufgaben-fixture.ts, damit die Deno-Tests sie relativ
// importieren; darum reines TypeScript ohne vitest-, node:- oder Deno-Abhängigkeit. Keine Personendaten, Endpoints
// unter example.invalid, keine echten Schlüssel.
//
// PushSpeicher bildet PushDaten im Speicher nach, mit dem Verhalten der Datenbank:
// - push_versand_einmal_push: (abo_id, datum_lokal, art) für kanal push und art sammel, kurzpruefung_20;
// - push_versand_einmal_email: (datum_lokal, art) für kanal email und art sammel, kurzpruefung_20;
// - push_versand_einmal_timer: (abo_id, bezug_id, timer_ende) für art timer;
// - aufgabe_tagesliste: unique (tag, aufgabe_schluessel) und A7 (ein Schlüssel nur am ersten Tag);
// - laufendeTimer(von, bis): wie die Abfrage auf naehrloesungsansatz (status laufend, ohne Storno,
//   von < timer_ende ≤ bis); den Filter auf echte Anlagen macht der Kern (Plan 31 Datenfluss Timer-Lauf).
// Vorausgesetzt (Plan 31 Schnittstellen, wo offen mit (A)):
// - timer_ende kommt aus laufendeTimer() als ISO-Text (PostgREST) und geht unverändert an versandAnlegen() (A).
// - Mailer ist in den Abhängigkeiten das Feld `mailer` (Plan 31: «in Abhaengigkeiten optional (mailer?)»).
import {
  pushLauf,
  type Abo,
  type Auftrag,
  type Ergebnis,
  type Mailer,
  type PushDaten,
  type Sender,
} from '../../supabase/functions/push-taeglich/kern.ts';

export const SCHLUESSEL = 'test-schluessel-nur-lokal';
export const SAMMEL: Auftrag = { art: 'sammel', geheimnisOk: true };
export const TIMER: Auftrag = { art: 'timer', geheimnisOk: true };

export type Kanal = 'push' | 'email';
export type Art = 'sammel' | 'kurzpruefung_20' | 'timer' | 'test';
export type Status = 'geplant' | 'gesendet' | 'fehler' | 'abgemeldet';

export interface VersandZeile {
  id: string;
  kanal: Kanal;
  abo_id: string | null;
  art: Art;
  datum_lokal: string;
  titel: string;
  anzahl_aufgaben: number;
  bezug_id?: string;
  timer_ende?: string;
  status: Status;
  gesendet_am?: string;
}

export interface TimerZeile {
  ansatz_id: string;
  typ: 'neuansatz' | 'ph_korrektur';
  timer_ende: string;
  code: string;
  datenart: 'echt' | 'demo' | 'test';
  status: 'laufend' | 'abgeschlossen' | 'abgebrochen';
  storniert?: boolean;
}

export interface TageslisteZeile {
  tag: string;
  aufgabe_schluessel: string;
  typ: string;
  platz_id: string | null;
  faellig_am: string;
}

// ---------------------------------------------------------------------------------------------------------
// Prüfhilfen ohne externe Module (pr.yml ohne Netz, keine Import-Map)
// ---------------------------------------------------------------------------------------------------------

export function wahr(bedingung: boolean, was: string): void {
  if (!bedingung) throw new Error(was);
}

export function gleich(ist: unknown, soll: unknown, was: string): void {
  const a = JSON.stringify(ist);
  const b = JSON.stringify(soll);
  if (a !== b) throw new Error(`${was}: erwartet ${b}, erhalten ${a}`);
}

// ---------------------------------------------------------------------------------------------------------
// Abos, Speicher, Sender, Mailer
// ---------------------------------------------------------------------------------------------------------

export const aboId = (n: number) => `00000000-0000-4000-8000-0000000a${String(n).padStart(4, '0')}`;

export function abo(n: number, teil: Partial<Abo> = {}): Abo {
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

const iso = (w: string | Date | undefined) =>
  w === undefined ? undefined : (w instanceof Date ? w : new Date(w)).toISOString();

export class PushSpeicher implements PushDaten {
  pushZeit = '07:00:00';
  zeitzone = 'Europe/Zurich';
  emailRueckfall = false;
  abos: Abo[];
  teileWert: Record<string, unknown[]>;
  versande: VersandZeile[] = [];
  tagesliste: TageslisteZeile[] = [];
  tageslisteAufrufe: { tag: string; zeilen: readonly TageslisteZeile[] }[] = [];
  timer: TimerZeile[] = [];
  timerAufrufe: { von: string; bis: string }[] = [];
  teileAufrufe = 0;
  letzterFehler = new Map<string, string>();
  protokoll: string[] = [];
  private zaehler = 0;

  constructor(abos: Abo[], teile: Record<string, unknown[]>) {
    this.abos = abos;
    this.teileWert = teile;
  }

  async einstellung() {
    return { push_zeit: this.pushZeit, zeitzone: this.zeitzone, email_rueckfall: this.emailRueckfall };
  }

  async aktiveAbos() {
    return this.abos.map((a) => ({ ...a }));
  }

  async aboZuEndpoint(endpoint: string) {
    const a = this.abos.find((x) => x.endpoint === endpoint);
    return a ? { ...a } : undefined;
  }

  async teile() {
    this.teileAufrufe += 1;
    return structuredClone(this.teileWert);
  }

  async versandHeute(datum_lokal: string) {
    return this.versande
      .filter((v) => v.datum_lokal === datum_lokal)
      .map((v) => ({ abo_id: v.abo_id, kanal: v.kanal, art: v.art, status: v.status }));
  }

  async versandAnlegen(z: {
    kanal: Kanal;
    abo_id: string | null;
    art: Art;
    datum_lokal: string;
    titel: string;
    anzahl_aufgaben: number;
    bezug_id?: string;
    timer_ende?: string | Date;
  }): Promise<{ id: string } | 'besteht'> {
    const timerEnde = iso(z.timer_ende);
    const konflikt = this.versande.some((v) => {
      if (z.art === 'timer')
        return (
          v.art === 'timer' &&
          v.abo_id === z.abo_id &&
          v.bezug_id === z.bezug_id &&
          v.timer_ende === timerEnde
        );
      if (z.art !== 'sammel' && z.art !== 'kurzpruefung_20') return false;
      if (z.kanal === 'push')
        return (
          v.kanal === 'push' && v.art === z.art && v.abo_id === z.abo_id && v.datum_lokal === z.datum_lokal
        );
      return v.kanal === 'email' && v.art === z.art && v.datum_lokal === z.datum_lokal;
    });
    if (konflikt) {
      this.protokoll.push('besteht');
      return 'besteht';
    }
    this.zaehler += 1;
    const id = `00000000-0000-4000-8000-${String(this.zaehler).padStart(12, '0')}`;
    const zeile: VersandZeile = {
      id,
      kanal: z.kanal,
      abo_id: z.abo_id,
      art: z.art,
      datum_lokal: z.datum_lokal,
      titel: z.titel,
      anzahl_aufgaben: z.anzahl_aufgaben,
      status: 'geplant',
    };
    if (z.bezug_id !== undefined) zeile.bezug_id = z.bezug_id;
    if (timerEnde !== undefined) zeile.timer_ende = timerEnde;
    this.versande.push(zeile);
    this.protokoll.push(`anlegen ${id}`);
    return { id };
  }

  async fehlerVersandUebernehmen(abo_id: string | null, datum_lokal: string, art: Art, kanal: Kanal) {
    const v = this.versande.find(
      (x) =>
        x.abo_id === abo_id &&
        x.datum_lokal === datum_lokal &&
        x.art === art &&
        x.kanal === kanal &&
        x.status === 'fehler',
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

  async tageslisteSchreiben(tag: string, zeilen: readonly TageslisteZeile[]) {
    this.tageslisteAufrufe.push({ tag, zeilen: structuredClone([...zeilen]) });
    let neu = 0;
    for (const z of zeilen) {
      // unique (tag, aufgabe_schluessel) und A7: nur Schlüssel, die noch in keiner früheren Zeile stehen
      if (this.tagesliste.some((t) => t.aufgabe_schluessel === z.aufgabe_schluessel)) continue;
      this.tagesliste.push({ ...z });
      neu += 1;
    }
    return neu;
  }

  async laufendeTimer(von: Date, bis: Date) {
    this.timerAufrufe.push({ von: von.toISOString(), bis: bis.toISOString() });
    return this.timer
      .filter(
        (t) =>
          t.status === 'laufend' &&
          !t.storniert &&
          Date.parse(t.timer_ende) > von.getTime() &&
          Date.parse(t.timer_ende) <= bis.getTime(),
      )
      .map((t) => ({
        ansatz_id: t.ansatz_id,
        typ: t.typ,
        timer_ende: t.timer_ende,
        code: t.code,
        datenart: t.datenart,
      }));
  }

  /** Versände einer Art und eines Kanals */
  von(art: Art, kanal: Kanal = 'push'): VersandZeile[] {
    return this.versande.filter((v) => v.art === art && v.kanal === kanal);
  }
}

export interface Optionen {
  TTL: 14400;
  urgency: 'high';
}

export class FakeSender implements Sender {
  aufrufe: { abo: Abo; nutzlast: string; optionen: Optionen; jetzt?: string }[] = [];
  antwort: (abo: Abo, nummer: number, nutzlast: Record<string, unknown>) => number;
  /** Uhr des laufenden Laufs, damit Tests den Sendezeitpunkt sehen */
  uhr: string | undefined;

  constructor(antwort: (abo: Abo, nummer: number, nutzlast: Record<string, unknown>) => number = () => 201) {
    this.antwort = antwort;
  }

  async senden(a: Abo, nutzlast: string, optionen: Optionen) {
    this.aufrufe.push({ abo: a, nutzlast, optionen, ...(this.uhr ? { jetzt: this.uhr } : {}) });
    return {
      status: this.antwort(a, this.aufrufe.length, JSON.parse(nutzlast) as Record<string, unknown>),
    };
  }

  /** Nutzlasten (geparst) mit diesem Tag */
  mitTag(tag: string): { abo: Abo; nutzlast: Record<string, unknown>; jetzt?: string }[] {
    return this.aufrufe
      .map((a) => ({
        abo: a.abo,
        nutzlast: JSON.parse(a.nutzlast) as Record<string, unknown>,
        ...(a.jetzt ? { jetzt: a.jetzt } : {}),
      }))
      .filter((a) => a.nutzlast['tag'] === tag);
  }
}

export class FakeMailer implements Mailer {
  aufrufe: { betreff: string; text: string; idempotenz: string }[] = [];
  antwort: (nummer: number) => number;

  constructor(antwort: (nummer: number) => number = () => 200) {
    this.antwort = antwort;
  }

  async senden(m: { betreff: string; text: string; idempotenz: string }) {
    this.aufrufe.push({ ...m });
    return { status: this.antwort(this.aufrufe.length) };
  }
}

/** ein Lauf mit fester Uhr; signiert mit einem Testschlüssel ohne Bedeutung */
export function lauf(
  auftrag: Auftrag,
  jetzt: string | Date,
  daten: PushDaten,
  sender: FakeSender,
  signieren: (text: string) => Promise<string>,
  mailer?: Mailer,
): Promise<Ergebnis> {
  const uhr = new Date(jetzt);
  sender.uhr = uhr.toISOString();
  return pushLauf(auftrag, {
    jetzt: uhr,
    daten,
    sender,
    signieren,
    ...(mailer ? { mailer } : {}),
  });
}

/** Zeitpunkte von `von` bis `bis` (inklusive) im Abstand von `minuten` */
export function uhren(von: string, bis: string, minuten: number): string[] {
  const zeiten: string[] = [];
  for (let t = Date.parse(von); t <= Date.parse(bis); t += minuten * 60_000)
    zeiten.push(new Date(t).toISOString());
  return zeiten;
}
