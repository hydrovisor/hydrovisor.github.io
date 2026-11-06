// Ladeskript des Seeds (Plan 10, Lösungsweg 2 bis 5; 03_import_w0.md Abschnitt 8): erzeugt aus dem Ladeplan genau
// einen SQL-Text. Die Daten stehen als JSON-Literal im Dollar-Quoting mit geprüftem Tag; Vergleich, Schliessen,
// Einfügen und Zähltest laufen mengenbasiert in SQL, ohne Update fachlicher Spalten und ohne Löschen (8.1 Regel 4).
// Rein, ohne Node- oder Browser-Abhängigkeit: die Unit-Tests prüfen es ohne Datenbank.
import {
  KULTURGRUPPE_SPALTEN,
  ZIELSPALTEN,
  type Ladeplan,
  type Schritt,
} from '../../src/domain/w0/abbildung.ts';
import { DATEI } from '../../src/domain/w0/schema.ts';
import { WISSEN_LUECKEN_SQL, WISSEN_PRUEFUNG_SQL } from './wissen-abdeckung.ts';

export const DOLLAR_TAG = '$hv_seed$';

export interface Lauf {
  jetzt: Date;
  commit: string;
  gesamtfreigabe: boolean;
  trocken: boolean;
}

export interface Ladeskript {
  /** Berichtstabellen anlegen und leeren (temporär, wiederholbar in derselben Sitzung und Transaktion) */
  vorbereitung: string;
  /** alle Schritte ohne Transaktionssteuerung, inklusive Zähltest; Fehler = Ausnahme */
  kern: string;
  /** eine Anweisung mit genau einer Zeile, Spalte bericht (jsonb) */
  berichtAbfrage: string;
  /** vorbereitung; begin; kern; commit; berichtAbfrage (bei trocken endet kern mit der Ausnahme seed_trockenlauf) */
  vollstaendig: string;
}

/** Meldung, mit der ein Trockenlauf endet; danach folgt der Bericht als JSON */
export const TROCKENLAUF = 'seed_trockenlauf';

/** Nicht verglichene Spalten (A4) */
const VERWALTUNG = ['zeile_id', 'quelldatei', 'freigegeben_am', 'bestaetigt_am'];

function literal(text: string): string {
  if (text.includes(DOLLAR_TAG)) throw new Error(`Daten enthalten das Dollar-Tag ${DOLLAR_TAG}`);
  return `${DOLLAR_TAG}${text}${DOLLAR_TAG}`;
}

function json(wert: unknown): string {
  return `${literal(JSON.stringify(wert))}::jsonb`;
}

/** einfacher SQL-Text für bekannte Namen (Pfade, Tabellen) */
function text(t: string): string {
  return `'${t.replace(/'/g, "''")}'`;
}

function zeilen(...s: string[]): string {
  return s.join('\n');
}

/** Staging-Tabelle mit dem Zeilentyp der Zieltabelle; sorte_key wird zu sorte_id aufgelöst */
function staging(name: string, tabelle: string, daten: unknown[]): string {
  return zeilen(
    `drop table if exists pg_temp.${name};`,
    `create temp table ${name} on commit drop as`,
    `select r.* from jsonb_array_elements(${json(daten)}) e`,
    `cross join lateral jsonb_populate_record(null::public.${tabelle}, e || case when e ? 'sorte_key'`,
    `  then jsonb_build_object('sorte_id', (select sk.id from public.sorte_schluessel sk where sk.sorte_key = e ->> 'sorte_key'))`,
    `  else '{}'::jsonb end) r;`,
  );
}

function tupel(alias: string, spalten: string[]): string {
  return `row(${spalten.map((s) => `${alias}.${s}`).join(', ')})`;
}

class Skript {
  private readonly teile: string[] = [];
  private readonly zaehl: string[] = [];
  private readonly profilSchritte: number[] = [];
  private readonly J: string;
  private readonly C: string;
  private readonly V: string;
  private readonly plan: Ladeplan;

  constructor(plan: Ladeplan, lauf: Lauf) {
    this.plan = plan;
    this.J = `${text(lauf.jetzt.toISOString())}::timestamptz`;
    this.C = literal(lauf.commit);
    this.V = literal(`seed@${lauf.commit}`);
  }

  add(...s: string[]): void {
    this.teile.push(...s);
  }

  /** Nicht versionierte Tabelle: fehlende Zeilen einfügen, abweichende brechen ab (A6) */
  festwerte(
    nr: string,
    tabelle: string,
    daten: unknown[],
    schluessel: string[],
    werte: string[],
    zusatz: string[] = [],
  ): void {
    if (daten.length === 0) return;
    const t = `hv_f_${nr}`;
    const schl = `concat_ws('.', ${schluessel.map((s) => `s.${s}`).join(', ')})`;
    const gleich = schluessel.map((s) => `c.${s} = s.${s}`).join(' and ');
    this.add(
      `-- ${tabelle}: einfügen, wenn neu; abweichend ohne Versionsspalten bricht ab (A6)`,
      staging(t, tabelle, daten),
      `do $$ declare k text; begin`,
      `  select string_agg(${schl}, ', ' order by ${schl}) into k from pg_temp.${t} s join public.${tabelle} c on ${gleich}`,
      `   where ${tupel('s', werte)} is distinct from ${tupel('c', werte)};`,
      `  if k is not null then`,
      `    raise exception 'Seed: % ohne Versionsspalten abweichend: % (neuer Schlüssel oder eigenes Paket nötig)', ${text(tabelle)}, k;`,
      `  end if;`,
      `end $$;`,
      `insert into public.${tabelle} (${[...schluessel, ...werte, ...zusatz].join(', ')}, app_version)`,
      `select ${[...schluessel, ...werte, ...zusatz].map((s) => `s.${s}`).join(', ')}, ${this.V} from pg_temp.${t} s`,
      ` where not exists (select 1 from public.${tabelle} c where ${gleich});`,
    );
  }

  /** Versionierte Tabelle: gleich nichts, geändert schliessen und neu, nicht mehr in der Datei schliessen (8.3) */
  versioniert(nr: number, s: Schritt): void {
    const T = s.tabelle as keyof typeof ZIELSPALTEN;
    const fach = ZIELSPALTEN[T];
    const D = text(s.datei);
    const st = `hv_s${nr}`;
    const k = `hv_k${nr}`;
    const z = `hv_z${nr}`;
    const verwaltung = VERWALTUNG.filter((v) => v !== 'bestaetigt_am' || T === 'saatempfehlung');
    const einfuegen = [...fach, ...verwaltung];
    this.add(
      `-- Schritt ${nr}: ${s.datei} → ${T}`,
      staging(st, T, s.zeilen),
      `drop table if exists pg_temp.${k};`,
      `create temp table ${k} on commit drop as`,
      `select s.zeile_id, c.id as alt_id, case`,
      `  when c.id is null then 'neu'`,
      `  when ${tupel('s', fach)} is not distinct from ${tupel('c', fach)}`,
      `    then case when c.quelldatei = 'app' then 'app_gleich' else 'gleich' end`,
      `  when c.quelldatei = 'app' then 'app'`,
      `  else 'geaendert' end as art`,
      `from pg_temp.${st} s left join public.${T} c on c.zeile_id = s.zeile_id and c.gueltig_bis is null;`,
      `drop table if exists pg_temp.${z};`,
      `create temp table ${z} on commit drop as`,
      `select k.alt_id as id, 'geaendert'::text as grund from pg_temp.${k} k where k.art = 'geaendert'`,
      `union all`,
      `select c.id, 'geschlossen' from public.${T} c where c.quelldatei = ${D} and c.gueltig_bis is null`,
      `   and not exists (select 1 from pg_temp.${st} s where s.zeile_id = c.zeile_id);`,
      `update public.${T} t set gueltig_bis = ${this.J} from pg_temp.${z} z where t.id = z.id;`,
      `insert into public.${T} (${einfuegen.join(', ')}, gueltig_ab, commit, app_version)`,
      `select ${einfuegen.map((c) => `s.${c}`).join(', ')}, ${this.J}, ${this.C}, ${this.V}`,
      `  from pg_temp.${st} s join pg_temp.${k} k on k.zeile_id = s.zeile_id where k.art in ('neu', 'geaendert');`,
      `insert into pg_temp.hv_seed_konflikt (art, zeile_id, text)`,
      `select 'app', k.zeile_id, 'App-Fassung bleibt gültig, Datei weicht ab (${s.datei} → ${T})' from pg_temp.${k} k where k.art = 'app';`,
      this.berichtZeile(s, k, z),
    );
    this.zaehlen(
      s,
      `(select count(*) from public.${T} c where c.quelldatei = ${D} and c.gueltig_bis is null)` +
        ` + (select count(*) from pg_temp.${k} k where k.art in ('app', 'app_gleich'))`,
    );
    if (T === 'profilwert') this.profilSchritte.push(nr);
  }

  /** Herkunft je Feld (8.1 Regel 4); nur für Zeilen, die aus dieser Datei stammen (nicht App-Fassungen) */
  herkunft(nr: number, s: Schritt): void {
    const D = text(s.datei);
    const tabellen = s.datei === DATEI.art ? ['art', 'art_kulturform'] : ['sorte'];
    const st = `hv_s${nr}`;
    const e = `hv_e${nr}`;
    const k = `hv_k${nr}`;
    const z = `hv_z${nr}`;
    const werte = ['quelle_id', 'fundstelle', 'kurzzitat', 'evidenzklasse', 'vermerk'];
    const alle = ['tabelle', 'zeile_id', 'feld', ...werte];
    const eigene = tabellen
      .map((t) => `select zeile_id from public.${t} where quelldatei = ${D}`)
      .join(' union ');
    const imUmfang = `c.tabelle in (${tabellen.map(text).join(', ')}) and c.zeile_id in (select e.zeile_id from pg_temp.${e} e)`;
    this.add(
      `-- Schritt ${nr}: ${s.datei} → herkunft`,
      staging(st, 'herkunft', s.zeilen),
      `drop table if exists pg_temp.${e};`,
      `create temp table ${e} on commit drop as ${eigene};`,
      `drop table if exists pg_temp.${k};`,
      `create temp table ${k} on commit drop as`,
      `select s.tabelle, s.zeile_id, s.feld, c.id as alt_id, case`,
      `  when not exists (select 1 from pg_temp.${e} e where e.zeile_id = s.zeile_id) then 'app'`,
      `  when c.id is null then 'neu'`,
      `  when ${tupel('s', werte)} is not distinct from ${tupel('c', werte)} then 'gleich'`,
      `  else 'geaendert' end as art`,
      `from pg_temp.${st} s left join public.herkunft c`,
      `  on c.tabelle = s.tabelle and c.zeile_id = s.zeile_id and c.feld = s.feld and c.gueltig_bis is null;`,
      `drop table if exists pg_temp.${z};`,
      `create temp table ${z} on commit drop as`,
      `select k.alt_id as id, 'geaendert'::text as grund from pg_temp.${k} k where k.art = 'geaendert'`,
      `union all`,
      `select c.id, 'geschlossen' from public.herkunft c where c.gueltig_bis is null and ${imUmfang}`,
      `   and not exists (select 1 from pg_temp.${st} s where s.tabelle = c.tabelle and s.zeile_id = c.zeile_id and s.feld = c.feld);`,
      `update public.herkunft t set gueltig_bis = ${this.J} from pg_temp.${z} z where t.id = z.id;`,
      `insert into public.herkunft (${alle.join(', ')}, gueltig_ab, app_version)`,
      `select ${alle.map((c) => `s.${c}`).join(', ')}, ${this.J}, ${this.V} from pg_temp.${st} s`,
      `  join pg_temp.${k} k on k.tabelle = s.tabelle and k.zeile_id = s.zeile_id and k.feld = s.feld`,
      ` where k.art in ('neu', 'geaendert');`,
      this.berichtZeile(s, k, z),
    );
    this.zaehlen(
      s,
      `(select count(*) from public.herkunft c where c.gueltig_bis is null and ${imUmfang})` +
        ` + (select count(*) from pg_temp.${k} k where k.art = 'app')`,
    );
  }

  private berichtZeile(s: Schritt, k: string, z: string): string {
    return zeilen(
      `insert into pg_temp.hv_seed_bericht (datei, tabelle, geladen, geaendert, geschlossen)`,
      `select ${text(s.datei)}, ${text(s.tabelle)}, (select count(*) from pg_temp.${k} where art = 'neu'),`,
      `  (select count(*) from pg_temp.${k} where art = 'geaendert'),`,
      `  (select count(*) from pg_temp.${z} where grund = 'geschlossen');`,
    );
  }

  private zaehlen(s: Schritt, ausdruck: string): void {
    const e = this.plan.erwartet.find((x) => x.datei === s.datei && x.tabelle === s.tabelle);
    if (e) this.zaehl.push(this.zaehlPruefung(e.datei, e.tabelle, e.anzahl, ausdruck));
  }

  private zaehlPruefung(datei: string, tabelle: string, anzahl: number, ausdruck: string): string {
    return zeilen(
      `  n := ${ausdruck};`,
      `  if n <> ${Math.trunc(anzahl)} then`,
      `    raise exception 'Seed: Zähltest % → %: Datei %, Datenbank %', ${text(datei)}, ${text(tabelle)}, ${Math.trunc(anzahl)}, n;`,
      `  end if;`,
    );
  }

  schluessel(): void {
    const arten = [...new Set(this.plan.tabellen.art.map((a) => a['art_id']))];
    if (arten.length > 0) {
      this.add(
        `insert into public.art_schluessel (art_id)`,
        `select a from jsonb_array_elements_text(${json(arten)}) a on conflict (art_id) do nothing;`,
      );
    }
  }

  sorteSchluessel(): void {
    const keys = this.plan.tabellen.sorte.map((s) => s['sorte_key']);
    if (keys.length === 0) return;
    this.add(
      `insert into public.sorte_schluessel (sorte_key)`,
      `select k from jsonb_array_elements_text(${json(keys)}) k on conflict (sorte_key) do nothing;`,
    );
  }

  /** Packung je Sorte nur beim ersten Laden; spätere Dateiänderungen nur als Hinweis (A7) */
  saatgut(): void {
    const daten = this.plan.tabellen.saatgut;
    if (daten.length === 0) return;
    this.add(
      `-- ${DATEI.sorten} → saatgut (nur beim ersten Laden, A7)`,
      `drop table if exists pg_temp.hv_saatgut;`,
      `create temp table hv_saatgut on commit drop as`,
      `select md5('seed:saatgut:' || (e ->> 'sorte_key'))::uuid as client_id, e ->> 'sorte_key' as sorte_key,`,
      `       (e ->> 'kaufdatum')::date as kaufdatum, (e ->> 'bestand_korn')::integer as bestand_korn,`,
      `       (e ->> 'keimfaehigkeit_packung')::numeric as keimfaehigkeit_packung`,
      `  from jsonb_array_elements(${json(daten)}) e;`,
      `insert into pg_temp.hv_seed_hinweis (text)`,
      `select 'Packung ' || s.sorte_key || ' in der Datei geändert, nicht geladen (gehört nach dem ersten Laden Tim)'`,
      `  from pg_temp.hv_saatgut s join public.saatgut g on g.client_id = s.client_id`,
      ` where row(s.kaufdatum, s.bestand_korn, s.keimfaehigkeit_packung)`,
      `       is distinct from row(g.kaufdatum, g.bestand_korn, g.keimfaehigkeit_packung);`,
      `insert into public.saatgut (client_id, sorte_id, kaufdatum, bestand_korn, keimfaehigkeit_packung, app_version)`,
      `select s.client_id, sk.id, s.kaufdatum, s.bestand_korn, s.keimfaehigkeit_packung, ${this.V}`,
      `  from pg_temp.hv_saatgut s join public.sorte_schluessel sk on sk.sorte_key = s.sorte_key`,
      `on conflict (client_id) do nothing;`,
    );
    const e = this.plan.erwartet.find((x) => x.datei === DATEI.sorten && x.tabelle === 'saatgut');
    // Seed-Packungen ohne Storno-Bedingung: eine von Tim stornierte Packung bleibt gezählt (Prüferbefund 2)
    if (e)
      this.zaehl.push(
        this.zaehlPruefung(
          e.datei,
          e.tabelle,
          e.anzahl,
          `(select count(*) from public.saatgut g where g.client_id in (select s.client_id from pg_temp.hv_saatgut s))`,
        ),
      );
  }

  konstanten(): void {
    const k = this.plan.konstanten;
    this.festwerte(
      'pflicht',
      'pflichtgroesse',
      k.pflichtgroessen.map((p) => ({ phase: p.phase, groesse: p.groesse, mindestens_art: p.mindestensArt })),
      ['phase', 'groesse'],
      ['mindestens_art'],
    );
    this.festwerte(
      'profilende',
      'kulturform_profilende',
      k.profilenden.map((p) => ({ kulturform: p.kulturform, profil_ende: p.profilEnde })),
      ['kulturform'],
      ['profil_ende'],
    );
    this.festwerte(
      'produkt',
      'produkt',
      k.produkte.map((p) => ({
        produkt_id: p.produktId,
        name: p.name,
        variante: p.variante,
        gehalt: p.gehalt,
        konzentration: p.konzentration,
      })),
      ['produkt_id'],
      ['name', 'variante', 'gehalt', 'konzentration'],
    );
    this.festwerte(
      'fenster',
      'auswertung_fenster',
      [
        {
          name: k.auswertungFenster.name,
          von: k.auswertungFenster.von.toISOString(),
          bis: k.auswertungFenster.bis.toISOString(),
        },
      ],
      ['name'],
      ['von', 'bis'],
    );
    const m = k.messgeraet;
    const ein = k.einstellung;
    this.add(
      `-- Messgerät und Einstellungen nur, wenn leer; danach gehören sie Tim, Abweichungen nur als Hinweis (A7)`,
      `drop table if exists pg_temp.hv_messgeraet;`,
      `create temp table hv_messgeraet on commit drop as`,
      `select e ->> 'modell' as modell, (e ->> 'dezimalen')::smallint as dezimalen, (e ->> 'u_ec')::numeric as u_ec,`,
      `       (e ->> 'u_ph')::numeric as u_ph`,
      `  from (select ${json({ modell: m.modell, dezimalen: m.dezimalen, u_ec: m.uEc, u_ph: m.uPh })} as e) x;`,
      `insert into pg_temp.hv_seed_hinweis (text)`,
      `select 'Messgerät weicht von der Seed-Konstante ab (bleibt, gehört Tim)' where exists (select 1 from public.messgeraet)`,
      `   and not exists (select 1 from public.messgeraet g join pg_temp.hv_messgeraet s`,
      `                    on (g.modell, g.dezimalen, g.u_ec, g.u_ph) = (s.modell, s.dezimalen, s.u_ec, s.u_ph));`,
      `insert into public.messgeraet (modell, dezimalen, u_ec, u_ph, app_version)`,
      `select s.modell, s.dezimalen, s.u_ec, s.u_ph, ${this.V} from pg_temp.hv_messgeraet s`,
      ` where not exists (select 1 from public.messgeraet);`,
      `drop table if exists pg_temp.hv_einstellung;`,
      `create temp table hv_einstellung on commit drop as`,
      `select array(select jsonb_array_elements_text(e -> 'feste_kalibriertermine'))::date[] as feste_kalibriertermine,`,
      `       (e ->> 'stationsgrenze_ab')::date as stationsgrenze_ab`,
      `  from (select ${json({ feste_kalibriertermine: ein.festeKalibriertermine, stationsgrenze_ab: ein.stationsgrenzeAb })} as e) x;`,
      `insert into pg_temp.hv_seed_hinweis (text)`,
      `select 'Einstellungen (feste Kalibriertermine, Stationsgrenze) weichen von der Seed-Konstante ab (bleiben, gehören Tim)'`,
      `  from public.einstellung g, pg_temp.hv_einstellung s`,
      ` where (g.feste_kalibriertermine, g.stationsgrenze_ab) is distinct from (s.feste_kalibriertermine, s.stationsgrenze_ab);`,
      `insert into public.einstellung (feste_kalibriertermine, stationsgrenze_ab, app_version)`,
      `select s.feste_kalibriertermine, s.stationsgrenze_ab, ${this.V} from pg_temp.hv_einstellung s`,
      ` where not exists (select 1 from public.einstellung);`,
      `-- k-Startwerte je Komponente (R4.1, G6), feste client_id`,
      `insert into public.k_faktor (client_id, produkt_id, wert, gilt_ab, quelle, app_version)`,
      `select md5('seed:k_faktor:' || (e ->> 'produkt_id'))::uuid, e ->> 'produkt_id', (e ->> 'wert')::numeric,`,
      `       ${this.J}, 'startwert', ${this.V}`,
      `  from jsonb_array_elements(${json(k.kStartwerte.map((x) => ({ produkt_id: x.produktId, wert: x.wert })))}) e`,
      `on conflict (client_id) do nothing;`,
    );
  }

  /** «Sollwert geändert: messen» (8.5, R5.2, A8): je geschlossener Fassung von profilwert */
  ereignisse(): void {
    if (this.profilSchritte.length === 0) return;
    const geschlossen = this.profilSchritte.map((n) => `select id from pg_temp.hv_z${n}`).join(' union all ');
    this.add(
      `-- Ereignis sollwert_geaendert je geänderter oder geschlossener Fassung von profilwert (8.5)`,
      `insert into public.ereignis (client_id, typ, art_id, sorte_id, daten, gilt_ab, app_version)`,
      `select gen_random_uuid(), 'sollwert_geaendert', b.art_id, b.sorte_id,`,
      `       jsonb_build_object('profilwert_zeile_id', b.zeile_id), ${this.J}, ${this.V}`,
      `  from (select p.zeile_id, p.art_id, p.sorte_id from public.profilwert p`,
      `         where p.id in (${geschlossen}) and p.ebene in ('art', 'sorte')`,
      `        union all`,
      `        select p.zeile_id, a.art_id, null from public.profilwert p`,
      `          join public.art a on a.gueltig_bis is null`,
      `           and (p.ebene = 'standard' or a.kulturgruppe_id = p.kulturgruppe_id)`,
      `         where p.id in (${geschlossen}) and p.ebene in ('kulturgruppe', 'standard')) b;`,
    );
  }

  zaehltest(): void {
    if (this.zaehl.length === 0) return;
    this.add(
      `-- Zähltest (8.6): Abweichung bricht ab und rollt den ganzen Lauf zurück`,
      `do $$ declare n bigint; begin`,
      ...this.zaehl,
      `end $$;`,
    );
  }

  gesamtfreigabe(): void {
    this.add(
      `-- Gesamtfreigabe (8.7): eine unvollständige Sorte bricht ab`,
      `do $$ declare k text; begin`,
      `  select string_agg(sk.sorte_key, ', ' order by sk.sorte_key) into k`,
      `    from public.v_vollstaendigkeit v join public.sorte_schluessel sk on sk.id = v.sorte_id where not v.vollstaendig;`,
      `  if k is not null then raise exception 'Seed: Gesamtfreigabe, Sorten unvollständig: %', k; end if;`,
      `end $$;`,
      `-- Gesamtfreigabe (R7.2, UC12-AK1): jede Art und Phase der Startbelegung braucht eine Wissenskarte`,
      WISSEN_PRUEFUNG_SQL,
    );
  }

  bericht(): string {
    const p = this.plan;
    const gegenprobe = p.gegenprobe.map((k) => ({
      art: 'gegenprobe',
      zeileId: k.zeileId,
      text: `${k.artId}: ${k.text}`,
    }));
    return zeilen(
      `jsonb_build_object(`,
      `  'dateien', coalesce((select jsonb_agg(jsonb_build_object('datei', b.datei, 'tabelle', b.tabelle,`,
      `    'geladen', b.geladen, 'geaendert', b.geaendert, 'geschlossen', b.geschlossen) order by b.nr)`,
      `    from pg_temp.hv_seed_bericht b), '[]'::jsonb),`,
      `  'nichtGeladen', ${json(p.nichtGeladen)},`,
      `  'fehlendeDateien', ${json(p.fehlendeDateien)},`,
      `  'hinweise', ${json(p.hinweise)} || coalesce((select jsonb_agg(h.text order by h.nr)`,
      `    from pg_temp.hv_seed_hinweis h), '[]'::jsonb),`,
      `  'konflikte', ${json(gegenprobe)} || coalesce((select jsonb_agg(jsonb_build_object('art', k.art,`,
      `    'zeileId', k.zeile_id, 'text', k.text) order by k.nr) from pg_temp.hv_seed_konflikt k), '[]'::jsonb),`,
      `  'vollstaendigkeit', coalesce((select jsonb_agg(jsonb_build_object('sorte', sk.sorte_key,`,
      `    'fehlendeGroessen', v.fehlende_groessen, 'pruefauftraege', v.pruefauftraege, 'vollstaendig', v.vollstaendig)`,
      `    order by sk.sorte_key) from public.v_vollstaendigkeit v join public.sorte_schluessel sk on sk.id = v.sorte_id), '[]'::jsonb),`,
      `  'wissenLuecken', coalesce((select jsonb_agg(jsonb_build_object('artId', l.art_id, 'phase', l.phase)`,
      `    order by l.art_id, l.phase) from (${WISSEN_LUECKEN_SQL}) l), '[]'::jsonb))`,
    );
  }

  text(): string {
    return this.teile.join('\n');
  }
}

export function ladeskript(plan: Ladeplan, lauf: Lauf): Ladeskript {
  if (lauf.gesamtfreigabe && plan.fehlendeDateien.length > 0)
    throw new Error(`Gesamtfreigabe: Dateien nicht geliefert: ${plan.fehlendeDateien.join(', ')}`);
  const s = new Skript(plan, lauf);
  const t = plan.tabellen;

  // Reihenfolge 8.2: quelle → kulturgruppe → art mit herkunft → art_kulturform → profilwert → sorte, saatgut,
  // profilwert der Ebene sorte → saatempfehlung → duengerschema und produkt → wissenseintrag → Seed-Konstanten
  // abgerufen_am und freigegeben_am sind Metadaten der Quelle und brechen nicht ab
  s.festwerte(
    'quelle',
    'quelle',
    t.quelle,
    ['quelle_id'],
    ['titel', 'autoren', 'jahr', 'link', 'klasse', 'anbaumethode'],
    ['abgerufen_am', 'freigegeben_am'],
  );
  s.schluessel();
  s.festwerte(
    'kulturgruppe',
    'kulturgruppe',
    t.kulturgruppe,
    ['kulturgruppe_id'],
    KULTURGRUPPE_SPALTEN.filter((c) => !['kulturgruppe_id', 'freigegeben_am'].includes(c)),
    ['freigegeben_am'],
  );
  plan.schritte.forEach((schritt, i) => {
    const nr = i + 1;
    if (schritt.tabelle === 'sorte') s.sorteSchluessel();
    if (schritt.tabelle === 'herkunft') s.herkunft(nr, schritt);
    else s.versioniert(nr, schritt);
    if (schritt.tabelle === 'sorte') s.saatgut();
  });
  s.konstanten();
  s.ereignisse();
  s.zaehltest();
  if (lauf.gesamtfreigabe) s.gesamtfreigabe();

  const bericht = s.bericht();
  if (lauf.trocken) {
    s.add(
      `-- Trockenlauf: Bericht als Meldung, Ausnahme rollt zurück (A9)`,
      `drop table if exists pg_temp.hv_seed_ergebnis;`,
      `create temp table hv_seed_ergebnis on commit drop as select ${bericht} as bericht;`,
      `do $$ begin raise exception '%', '${TROCKENLAUF} ' || (select bericht::text from pg_temp.hv_seed_ergebnis); end $$;`,
    );
  }
  const vorbereitung = zeilen(
    `create temp table if not exists hv_seed_bericht (nr serial, datei text, tabelle text, geladen int, geaendert int, geschlossen int);`,
    `create temp table if not exists hv_seed_konflikt (nr serial, art text, zeile_id text, text text);`,
    `create temp table if not exists hv_seed_hinweis (nr serial, text text);`,
    `truncate pg_temp.hv_seed_bericht, pg_temp.hv_seed_konflikt, pg_temp.hv_seed_hinweis;`,
  );
  const kern = s.text();
  const berichtAbfrage = `select ${bericht} as bericht;`;
  return {
    vorbereitung,
    kern,
    berichtAbfrage,
    vollstaendig: zeilen(vorbereitung, 'begin;', kern, 'commit;', berichtAbfrage),
  };
}
