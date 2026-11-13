// Demo-Fixtures zu SQL (Plan 15, Lösungsweg 1 und 2; 06_tests.md Abschnitt 10). Rein, ohne Node-Abhängigkeit:
// Uhr und Zeitzone kommen als Parameter, jedes Ergebnis ist aus Fixture und Uhr wiederholbar.
//
// Fixture: { "zeilen": [{ "tabelle", "ref", "einmal"?, "felder" }] }. Werte in felder:
//   "@ref"                    ID der Zeile ref (in jsonb als Text)
//   "?tabelle.spalte=wert"    ID der ersten Zeile mit diesem Wert, "?tabelle" die erste Zeile überhaupt
//   "heute", "heute-12"       Kalendertag in der Zeitzone
//   "jetzt", "jetzt-12d", "jetzt-12d 18:00"  Zeitpunkt; mit Tagen ohne Uhrzeit gilt die Uhrzeit von jetzt
//   Zahl, Text, true/false, null, Liste (SQL-Array), Objekt (jsonb)
// Jede Zeile ausser einmal-Zeilen erhält id = md5('demo:' || ref)::uuid, client_id = md5('demo-client:' || ref)::uuid;
// alle erhalten app_version.
// «einmal»: Zeile nur anlegen, wenn keine offene Zeile mit demselben Wert in dieser Spalte besteht; die Referenz
// zeigt dann auf die vorhandene Zeile (Vorlagen ohne Anlage, die datenart_loeschen nicht entfernt). Weicht die offene
// Zeile in einem Feld der Fixture ab, wird sie storniert und neu angelegt (Korrektur = Storno plus neue Zeile, #130);
// id und client_id einer einmal-Zeile hängen darum von Inhalt und Uhr ab: eine neue Fassung, auch die Rückkehr zu einer
// früheren, trifft nie auf die ID einer stornierten Zeile. Ein Feld, das aus der Fixture verschwindet, gilt nicht als
// Änderung (A).
import { md5 } from './md5.ts';
import { kalendertag, tagPlus, uhrzeit, versatz, type Zeitzone } from '../../src/domain/zeit.ts';

export type Wert = string | number | boolean | null | Wert[] | { [schluessel: string]: Wert };

export interface Zeile {
  tabelle: string;
  ref: string;
  einmal?: string;
  felder: Record<string, Wert>;
}

export interface Fixture {
  name: string;
  zeilen: Zeile[];
}

export interface Uhr {
  jetzt: Date;
  zeitzone: Zeitzone;
}

export interface DemoSkript {
  /** Löschen und alle Inserts ohne Transaktionssteuerung (für Tests in einer äusseren Transaktion) */
  kern: string;
  /** begin; kern; commit; Abfrage mit einer Zeile, Spalte bericht (jsonb) */
  vollstaendig: string;
  zeilen: number;
}

export const APP_VERSION = 'demo';
const NAME = /^[a-z][a-z0-9_]*$/;
const HEUTE = /^heute(?:([+-]\d+))?$/;
const JETZT = /^jetzt(?:([+-]\d+)d)?(?: (\d{2}):(\d{2}))?$/;
const SUCHE = /^\?([a-z][a-z0-9_]*)(?:\.([a-z][a-z0-9_]*)=(.+))?$/;

/** md5 eines Texts als UUID, gleich wie md5(text)::uuid in PostgreSQL */
export function uuidAus(text: string): string {
  const h = md5(text);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export const idFuer = (ref: string): string => uuidAus(`demo:${ref}`);
export const clientIdFuer = (ref: string): string => uuidAus(`demo-client:${ref}`);

/** Zeitpunkt zur lokalen Uhrzeit hh:mm am Kalendertag in der Zeitzone */
export function zeitpunkt(tag: string, hh: number, mm: number, zeitzone: Zeitzone): Date {
  const [j, m, d] = tag.split('-').map(Number) as [number, number, number];
  const lokalAlsUtc = Date.UTC(j, m - 1, d, hh, mm);
  // zweimal angleichen wie tagesbeginn(): der Versatz kann sich zwischen Schätzung und Ergebnis ändern
  let ergebnis = lokalAlsUtc - versatz(new Date(lokalAlsUtc), zeitzone);
  ergebnis = lokalAlsUtc - versatz(new Date(ergebnis), zeitzone);
  return new Date(ergebnis);
}

/** relativer Tag oder Zeitpunkt; undefined, wenn der Text keiner ist */
export function relativ(text: string, uhr: Uhr): { tag: string } | { zeitpunkt: Date } | undefined {
  const heute = kalendertag(uhr.jetzt, uhr.zeitzone);
  const h = HEUTE.exec(text);
  if (h) return { tag: tagPlus(heute, Number(h[1] ?? 0)) };
  const j = JETZT.exec(text);
  if (!j) return undefined;
  if (j[1] === undefined && j[2] === undefined) return { zeitpunkt: uhr.jetzt };
  const tag = tagPlus(heute, Number(j[1] ?? 0));
  const [hh = 0, mm = 0] =
    j[2] !== undefined
      ? [Number(j[2]), Number(j[3])]
      : uhrzeit(uhr.jetzt, uhr.zeitzone).split(':').map(Number);
  if (hh > 23 || mm > 59) throw new Error(`Uhrzeit ungültig: ${text}`);
  return { zeitpunkt: zeitpunkt(tag, hh, mm, uhr.zeitzone) };
}

export const literal = (text: string): string => `'${text.replaceAll("'", "''")}'`;

function name(text: string, wo: string): string {
  if (!NAME.test(text)) throw new Error(`${wo}: Name ungültig: ${text}`);
  return text;
}

interface Bekannt {
  tabelle: string;
  einmal?: { spalte: string; wert: string };
}

class Umsetzer {
  private readonly bekannt = new Map<string, Bekannt>();
  private readonly uhr: Uhr;

  constructor(uhr: Uhr) {
    this.uhr = uhr;
  }

  private referenz(ref: string, wo: string): Bekannt {
    const b = this.bekannt.get(ref);
    if (!b) throw new Error(`${wo}: Referenz @${ref} unbekannt oder vor ihrer Zeile verwendet`);
    return b;
  }

  /** Wert als SQL-Ausdruck einer Spalte */
  sql(wert: Wert, wo: string): string {
    if (wert === null) return 'null';
    if (typeof wert === 'boolean') return wert ? 'true' : 'false';
    if (typeof wert === 'number') {
      if (!Number.isFinite(wert)) throw new Error(`${wo}: Zahl ungültig`);
      return String(wert);
    }
    if (Array.isArray(wert))
      return wert.length === 0 ? `'{}'` : `array[${wert.map((w) => this.sql(w, wo)).join(', ')}]`;
    if (typeof wert === 'object') return `${literal(JSON.stringify(this.json(wert, wo)))}::jsonb`;
    if (wert.startsWith('@')) {
      const ref = wert.slice(1);
      const b = this.referenz(ref, wo);
      if (!b.einmal) return `${literal(idFuer(ref))}::uuid`;
      return (
        `(select id from public.${b.tabelle} where ${b.einmal.spalte} = ${b.einmal.wert}` +
        ` and storniert_am is null order by erfasst_am, id limit 1)`
      );
    }
    const s = SUCHE.exec(wert);
    if (s) {
      const tabelle = name(s[1] ?? '', wo);
      const wo2 = s[2] === undefined ? '' : ` where ${name(s[2], wo)} = ${literal(s[3] ?? '')}`;
      return `(select id from public.${tabelle}${wo2} order by id limit 1)`;
    }
    const r = relativ(wert, this.uhr);
    if (r && 'tag' in r) return `${literal(r.tag)}::date`;
    if (r) return `${literal(r.zeitpunkt.toISOString())}::timestamptz`;
    return literal(wert);
  }

  /** Wert innerhalb von jsonb: Referenzen als UUID-Text, relative Angaben als ISO-Text */
  json(wert: Wert, wo: string): Wert {
    if (Array.isArray(wert)) return wert.map((w) => this.json(w, wo));
    if (wert !== null && typeof wert === 'object')
      return Object.fromEntries(Object.entries(wert).map(([k, w]) => [k, this.json(w, wo)]));
    if (typeof wert !== 'string') return wert;
    if (wert.startsWith('@')) {
      const ref = wert.slice(1);
      if (this.referenz(ref, wo).einmal)
        throw new Error(`${wo}: @${ref} ist eine einmal-Zeile, in jsonb nicht erlaubt`);
      return idFuer(ref);
    }
    if (SUCHE.test(wert)) throw new Error(`${wo}: Suche in jsonb nicht erlaubt: ${wert}`);
    const r = relativ(wert, this.uhr);
    if (r && 'tag' in r) return r.tag;
    if (r) return r.zeitpunkt.toISOString();
    return wert;
  }

  insert(z: Zeile, wo: string): string {
    const tabelle = name(z.tabelle, wo);
    if (!z.ref) throw new Error(`${wo}: ref fehlt`);
    if (this.bekannt.has(z.ref)) throw new Error(`${wo}: ref doppelt: ${z.ref}`);
    // einmal-Zeilen: neue Fassung neue IDs, sonst verhindert die alte, stornierte Zeile das Anlegen (#130)
    const schluessel = z.einmal
      ? `${z.ref}:${md5(JSON.stringify(z.felder)).slice(0, 12)}:${this.uhr.jetzt.toISOString()}`
      : z.ref;
    const felder: Record<string, Wert> = {
      id: idFuer(schluessel),
      client_id: clientIdFuer(schluessel),
      app_version: APP_VERSION,
      ...z.felder,
    };
    const spalten = Object.keys(felder).map((s) => name(s, wo));
    const werte = spalten.map((s) =>
      s === 'id' || s === 'client_id'
        ? `${literal(String(felder[s]))}::uuid`
        : this.sql(felder[s] ?? null, `${wo}.${s}`),
    );
    let befehl: string;
    if (z.einmal) {
      const spalte = name(z.einmal, wo);
      const w = felder[spalte];
      if (typeof w !== 'string') throw new Error(`${wo}: einmal braucht einen Text in ${spalte}`);
      this.bekannt.set(z.ref, { tabelle, einmal: { spalte, wert: literal(w) } });
      // Abweichende offene Fassung stornieren: Vergleich je Feld der Fixture über jsonb (30 = 30.0, Reihenfolge in
      // Listen zählt)
      const gleich = Object.keys(z.felder)
        .map((s) => name(s, wo))
        .map(
          (s) =>
            `coalesce(to_jsonb(t.${s}), 'null'::jsonb) = ${literal(JSON.stringify(this.json(z.felder[s] ?? null, `${wo}.${s}`)))}::jsonb`,
        )
        .join(' and ');
      befehl =
        `update public.${tabelle} t set storniert_am = ${literal(this.uhr.jetzt.toISOString())}::timestamptz` +
        ` where t.${spalte} = ${literal(w)} and t.storniert_am is null and not (${gleich});
` +
        `insert into public.${tabelle} (${spalten.join(', ')}) select ${werte.join(', ')}` +
        ` where not exists (select 1 from public.${tabelle} where ${spalte} = ${literal(w)} and storniert_am is null)` +
        ' on conflict (id) do nothing;';
    } else {
      befehl = `insert into public.${tabelle} (${spalten.join(', ')}) values (${werte.join(', ')});`;
      this.bekannt.set(z.ref, { tabelle });
    }
    return befehl;
  }
}

export const LOESCHEN = "select public.datenart_loeschen('demo');\nselect public.datenart_loeschen('test');";

const BERICHT =
  "select jsonb_build_object('anlagen', (select coalesce(jsonb_agg(a.kuerzel order by a.kuerzel), '[]')" +
  " from public.anlage a where a.datenart in ('demo', 'test') and a.storniert_am is null)," +
  " 'plaetze', (select count(*) from public.platz p join public.anlage a on a.id = p.anlage_id" +
  " where a.datenart in ('demo', 'test'))) as bericht;";

/** Skript zum Laden: zuerst alle Demo- und Testdaten löschen, dann die Fixtures in ihrer Reihenfolge (A2) */
export function demoSkript(fixtures: Fixture[], uhr: Uhr): DemoSkript {
  const u = new Umsetzer(uhr);
  const teile = [LOESCHEN];
  let zeilen = 0;
  for (const f of fixtures) {
    teile.push(`-- ${f.name}`);
    f.zeilen.forEach((z, i) => {
      teile.push(u.insert(z, `${f.name} Zeile ${i + 1} (${z.ref || '?'})`));
      zeilen += 1;
    });
  }
  const kern = teile.join('\n');
  return { kern, vollstaendig: `begin;\n${kern}\ncommit;\n${BERICHT}`, zeilen };
}

/** Skript zum Löschen aller Demo- und Testdaten */
export function loeschSkript(): string {
  return `begin;\n${LOESCHEN}\ncommit;\n${BERICHT}`;
}

const SORTE_SUCHE = '?sorte_schluessel.sorte_key=';

/** Sortenschlüssel, die die Fixtures über «?sorte_schluessel.sorte_key=…» verlangen, ohne Doppel (Plan 199) */
export function benoetigteSorten(fixtures: Fixture[]): string[] {
  const schluessel = new Set<string>();
  for (const f of fixtures)
    for (const z of f.zeilen)
      for (const wert of Object.values(z.felder))
        if (typeof wert === 'string' && wert.startsWith(SORTE_SUCHE))
          schluessel.add(wert.slice(SORTE_SUCHE.length));
  return [...schluessel];
}
