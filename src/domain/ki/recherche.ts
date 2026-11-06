// Schemas, Anfragen und Antworten der Hydroponik-Recherche (Konzept 9.1, 9.2, 11.3, Erratum E8; Plan 37).
// Rein; Client und Edge Function ki-recherche importieren dasselbe Modul. Die Recherche sucht nur, was fehlt; die
// Prüfung der Werte (Grundregel 9.1, Validator 9.4) steht in ../wissen/validator.ts.
import type { Kulturform } from '../phasen/profil.ts';
import type { Luecke } from '../wissen/luecken.ts';
import { ABRUFE_MAX, RECHERCHE_MAX_TOKENS, SUCHEN_MAX, werkzeugeFuer } from './modelle.ts';

export interface QuelleKandidat {
  titel: string;
  link: string;
  klasse: string;
  anbaumethode: string;
}
export interface WertKandidat {
  id: string;
  phase: string;
  groesse: string;
  wert_min: number | null;
  wert_typ: number | null;
  wert_max: number | null;
  text_wert: string | null;
  ec_einheit: string | null;
  ec_basis: string | null;
  system: string;
  umgebung: string | null;
  quelle: QuelleKandidat;
  fundstelle: string;
  kurzzitat: string;
}
export interface SaatKandidat {
  id: string;
  kulturform: string;
  samen_je_schwamm: number;
  obergrenze_samen: number;
  pflanzen_stehen_lassen: number;
  substrat_gleich: boolean;
  system: string;
  quelle: QuelleKandidat;
  fundstelle: string;
  kurzzitat: string;
}

const T = { type: 'string' };
const TN = { anyOf: [{ type: 'string' }, { type: 'null' }] };
const ZN = { anyOf: [{ type: 'number' }, { type: 'null' }] };
const SYSTEME = ['dwc', 'kratky', 'nft', 'ebbe_flut', 'substrat_inert', 'keine'];

const QUELLE = {
  type: 'object',
  properties: {
    titel: T,
    link: { type: 'string', description: 'Adresse der Quelle (https)' },
    klasse: {
      type: 'string',
      enum: ['peer_review', 'universitaet_beratung', 'hersteller', 'praxis'],
      description: 'Art der Quelle',
    },
    anbaumethode: { type: 'string', enum: SYSTEME, description: 'Anbaumethode, für die die Quelle gilt' },
  },
  required: ['titel', 'link', 'klasse', 'anbaumethode'],
  additionalProperties: false,
};

const WERT = {
  type: 'object',
  properties: {
    id: { type: 'string', description: 'id der Lücke, z. B. wachstum.ec' },
    phase: { type: 'string', enum: ['keimung', 'anzucht', 'wachstum', 'bluete', 'fruchtbildung_reife'] },
    groesse: {
      type: 'string',
      enum: ['dauer', 'bbch', 'wechselmerkmal', 'ph', 'ec', 'keimart', 'keimtemp'],
    },
    wert_min: ZN,
    wert_typ: ZN,
    wert_max: ZN,
    text_wert: { ...TN, description: 'nur für wechselmerkmal und keimart (licht, dunkel, indifferent)' },
    ec_einheit: {
      anyOf: [{ type: 'string', enum: ['mS/cm', 'µS/cm', 'ppm500', 'ppm700', 'cf'] }, { type: 'null' }],
    },
    ec_basis: { anyOf: [{ type: 'string', enum: ['gesamt', 'zuwachs', 'unbekannt'] }, { type: 'null' }] },
    system: { type: 'string', enum: SYSTEME, description: 'System des Versuchs oder der Angabe' },
    umgebung: {
      anyOf: [{ type: 'string', enum: ['indoor_led', 'gewaechshaus', 'andere'] }, { type: 'null' }],
    },
    quelle: QUELLE,
    fundstelle: { type: 'string', description: 'Tabelle, Abschnitt oder Seite' },
    kurzzitat: { type: 'string', description: 'wörtlich, höchstens 200 Zeichen' },
  },
  required: [
    'id',
    'phase',
    'groesse',
    'wert_min',
    'wert_typ',
    'wert_max',
    'text_wert',
    'ec_einheit',
    'ec_basis',
    'system',
    'umgebung',
    'quelle',
    'fundstelle',
    'kurzzitat',
  ],
  additionalProperties: false,
};

const SAAT = {
  type: 'object',
  properties: {
    id: { type: 'string', description: 'saat.<kulturform>' },
    kulturform: {
      type: 'string',
      enum: ['keimling', 'babyleaf', 'schnitt', 'kopf', 'dauerkultur_blatt', 'dauerkultur_frucht'],
    },
    samen_je_schwamm: { type: 'integer' },
    obergrenze_samen: { type: 'integer' },
    pflanzen_stehen_lassen: { type: 'integer' },
    substrat_gleich: { type: 'boolean', description: 'Quelle nutzt Steinwolle oder Schwamm wie das Regal' },
    system: { type: 'string', enum: SYSTEME },
    quelle: QUELLE,
    fundstelle: T,
    kurzzitat: T,
  },
  required: [
    'id',
    'kulturform',
    'samen_je_schwamm',
    'obergrenze_samen',
    'pflanzen_stehen_lassen',
    'substrat_gleich',
    'system',
    'quelle',
    'fundstelle',
    'kurzzitat',
  ],
  additionalProperties: false,
};

function tiefFrieren<T>(o: T): T {
  if (o !== null && typeof o === 'object') {
    for (const w of Object.values(o as Record<string, unknown>)) tiefFrieren(w);
    Object.freeze(o);
  }
  return o;
}

export const RECHERCHE_SCHEMA: Readonly<Record<string, unknown>> = tiefFrieren({
  type: 'object',
  properties: { werte: { type: 'array', items: WERT }, saat: { type: 'array', items: SAAT } },
  required: ['werte', 'saat'],
  additionalProperties: false,
});

export const PRUEF_SCHEMA: Readonly<Record<string, unknown>> = tiefFrieren({
  type: 'object',
  properties: {
    pruefungen: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: T, belegt: { type: 'boolean' }, grund: T },
        required: ['id', 'belegt', 'grund'],
        additionalProperties: false,
      },
    },
  },
  required: ['pruefungen'],
  additionalProperties: false,
});

export const RECHERCHE_ANWEISUNG = [
  'Du recherchierst Sollwerte für eine Pflanze in einem Hydroponikregal (DWC, Kratky, Konstantpegel).',
  'Suche nur in hydroponischen Quellen: DWC, Kratky, NFT, Ebbe-Flut oder inertes Substrat (Steinwolle, Blähton).',
  'Angaben für Erde, Freiland oder Topf mit Erde und Angaben von Saattüten gelten nicht; lass sie weg.',
  'Bevorzugt: begutachtete Studien, Universitäten und Beratungsstellen (z. B. Cornell CEA, University of Arizona CEAC, Purdue), danach Hersteller hydroponischer Systeme oder Dünger, zuletzt Praxisquellen mit ausdrücklich hydroponischer Methode.',
  'Gib je Wert die Quelle mit Adresse, die Fundstelle und ein wörtliches Kurzzitat (höchstens 200 Zeichen) an, das den Wert belegt.',
  'Schätze, mittle und runde nichts. Findest du für eine Lücke keinen belegten Wert, lass sie weg.',
  'EC immer mit Einheit und Basis (gesamt, zuwachs oder unbekannt), so wie in der Quelle.',
  'Dauern in Tagen; BBCH als von (wert_min) und bis (wert_max); Wechselmerkmal und Keimart als text_wert.',
  'Saatempfehlung: Samen je Schwamm oder Würfel, Obergrenze und Pflanzen, die stehen bleiben.',
].join('\n');

export const PRUEF_ANWEISUNG = [
  'Du prüfst Quellenangaben für ein Hydroponikregal.',
  'Rufe je Kandidat die Adresse ab und prüfe, ob das Kurzzitat an der Fundstelle steht, den genannten Wert belegt und für Hydroponik (nicht Erde) gilt.',
  'belegt ist nur true, wenn alle drei Bedingungen erfüllt sind; sonst false mit kurzem Grund.',
  'Gib für jede id genau eine Prüfung zurück.',
].join('\n');

export function rechercheAnfrageBauen(
  auftrag: {
    art: { name_de: string; name_wiss: string };
    sorte: { name: string };
    luecken: readonly Luecke[];
    saat: readonly Kulturform[];
  },
  modell: string,
): Record<string, unknown> {
  const lueckenText = auftrag.luecken.map((l) => `- ${l.id}`).join('\n') || '- keine';
  const saatText = auftrag.saat.map((k) => `- saat.${k}`).join('\n') || '- keine';
  const text = [
    `Art: ${auftrag.art.name_de} (${auftrag.art.name_wiss}), Sorte: ${auftrag.sorte.name}.`,
    'Fehlende Werte (id = phase.groesse):',
    lueckenText,
    'Fehlende Saatempfehlungen je Kulturform:',
    saatText,
    'Suche hydroponische Quellen und gib die belegten Werte zurück.',
  ].join('\n');
  return {
    model: modell,
    max_tokens: RECHERCHE_MAX_TOKENS,
    system: RECHERCHE_ANWEISUNG,
    tools: [{ type: werkzeugeFuer(modell).webSearch, name: 'web_search', max_uses: SUCHEN_MAX }],
    output_config: { effort: 'low', format: { type: 'json_schema', schema: RECHERCHE_SCHEMA } },
    messages: [{ role: 'user', content: [{ type: 'text', text }] }],
  };
}

function hostVon(link: string): string | undefined {
  try {
    return new URL(link).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

export function pruefAnfrageBauen(
  kandidaten: readonly { id: string; link: string; fundstelle: string; kurzzitat: string; wert: string }[],
  modell: string,
): Record<string, unknown> {
  const domains = [...new Set(kandidaten.map((k) => hostVon(k.link)).filter((h): h is string => !!h))];
  const liste = kandidaten.map((k) => ({
    id: k.id,
    adresse: k.link,
    fundstelle: k.fundstelle,
    kurzzitat: k.kurzzitat,
    wert: k.wert,
  }));
  return {
    model: modell,
    max_tokens: RECHERCHE_MAX_TOKENS,
    system: PRUEF_ANWEISUNG,
    tools: [
      {
        type: werkzeugeFuer(modell).webFetch,
        name: 'web_fetch',
        max_uses: ABRUFE_MAX,
        allowed_domains: domains,
      },
    ],
    output_config: { effort: 'low', format: { type: 'json_schema', schema: PRUEF_SCHEMA } },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Prüfe diese Kandidaten. Die Adressen sind: ${kandidaten.map((k) => k.link).join(' ')}\n\n${JSON.stringify(liste, null, 1)}`,
          },
        ],
      },
    ],
  };
}

function objekt(x: unknown): Record<string, unknown> | undefined {
  return x !== null && typeof x === 'object' && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : undefined;
}
const text = (x: unknown): string | null => (typeof x === 'string' ? x : null);
const zahl = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null);

function quelleLesen(x: unknown): QuelleKandidat | undefined {
  const q = objekt(x);
  if (!q) return undefined;
  const titel = text(q['titel']);
  const link = text(q['link']);
  const klasse = text(q['klasse']);
  const anbaumethode = text(q['anbaumethode']);
  if (titel === null || link === null || klasse === null || anbaumethode === null) return undefined;
  return { titel, link, klasse, anbaumethode };
}

function wertLesen(x: unknown): WertKandidat | undefined {
  const w = objekt(x);
  if (!w) return undefined;
  const quelle = quelleLesen(w['quelle']);
  const id = text(w['id']);
  const phase = text(w['phase']);
  const groesse = text(w['groesse']);
  const system = text(w['system']);
  if (!quelle || id === null || phase === null || groesse === null || system === null) return undefined;
  return {
    id,
    phase,
    groesse,
    wert_min: zahl(w['wert_min']),
    wert_typ: zahl(w['wert_typ']),
    wert_max: zahl(w['wert_max']),
    text_wert: text(w['text_wert']),
    ec_einheit: text(w['ec_einheit']),
    ec_basis: text(w['ec_basis']),
    system,
    umgebung: text(w['umgebung']),
    quelle,
    fundstelle: text(w['fundstelle']) ?? '',
    kurzzitat: text(w['kurzzitat']) ?? '',
  };
}

function saatLesen(x: unknown): SaatKandidat | undefined {
  const s = objekt(x);
  if (!s) return undefined;
  const quelle = quelleLesen(s['quelle']);
  const id = text(s['id']);
  const kulturform = text(s['kulturform']);
  const system = text(s['system']);
  const samen = zahl(s['samen_je_schwamm']);
  const ober = zahl(s['obergrenze_samen']);
  const stehen = zahl(s['pflanzen_stehen_lassen']);
  if (!quelle || id === null || kulturform === null || system === null) return undefined;
  if (samen === null || ober === null || stehen === null) return undefined;
  return {
    id,
    kulturform,
    samen_je_schwamm: samen,
    obergrenze_samen: ober,
    pflanzen_stehen_lassen: stehen,
    substrat_gleich: s['substrat_gleich'] === true,
    system,
    quelle,
    fundstelle: text(s['fundstelle']) ?? '',
    kurzzitat: text(s['kurzzitat']) ?? '',
  };
}

function jsonLesen(roh: string): unknown {
  try {
    return JSON.parse(roh) as unknown;
  } catch {
    return undefined;
  }
}

/** Antwort gegen das Schema; fremde Felder fallen weg, unvollständige Kandidaten ebenso */
export function rechercheAntwortPruefen(
  roh: string,
): { ok: true; werte: WertKandidat[]; saat: SaatKandidat[] } | { ok: false } {
  const o = objekt(jsonLesen(roh));
  if (!o || !Array.isArray(o['werte']) || !Array.isArray(o['saat'])) return { ok: false };
  const werte = (o['werte'] as unknown[]).map(wertLesen).filter((w): w is WertKandidat => !!w);
  const saat = (o['saat'] as unknown[]).map(saatLesen).filter((s): s is SaatKandidat => !!s);
  return { ok: true, werte, saat };
}

/** Prüfantwort; eine unbekannte id macht die ganze Antwort ungültig */
export function pruefAntwortPruefen(
  roh: string,
  ids: readonly string[],
): { ok: true; belegt: ReadonlySet<string>; gruende: Record<string, string> } | { ok: false } {
  const o = objekt(jsonLesen(roh));
  if (!o || !Array.isArray(o['pruefungen'])) return { ok: false };
  const belegt = new Set<string>();
  const gruende: Record<string, string> = {};
  for (const x of o['pruefungen'] as unknown[]) {
    const p = objekt(x);
    const id = p ? text(p['id']) : null;
    if (!p || id === null || !ids.includes(id) || typeof p['belegt'] !== 'boolean') return { ok: false };
    if (p['belegt'] === true) belegt.add(id);
    gruende[id] = text(p['grund']) ?? '';
  }
  return { ok: true, belegt, gruende };
}

/** Letzter Textblock (nach Werkzeugblöcken) mit Token und stop_reason; undefined ohne Text */
export function letzterTextblock(
  body: unknown,
): { text: string; eingabeTokens: number; ausgabeTokens: number; stopReason: string | null } | undefined {
  const b = objekt(body);
  if (!b || !Array.isArray(b['content'])) return undefined;
  const bloecke = (b['content'] as unknown[])
    .map(objekt)
    .filter(
      (x): x is Record<string, unknown> => !!x && x['type'] === 'text' && typeof x['text'] === 'string',
    );
  const letzter = bloecke[bloecke.length - 1];
  if (!letzter) return undefined;
  const usage = objekt(b['usage']);
  return {
    text: letzter['text'] as string,
    eingabeTokens: Number(usage?.['input_tokens'] ?? 0),
    ausgabeTokens: Number(usage?.['output_tokens'] ?? 0),
    stopReason: text(b['stop_reason']),
  };
}

/** Stabile quelle_id aus der Adresse: Host klein, ohne Fragment und abschliessenden Schrägstrich (A19) */
export function quelleId(link: string): string {
  let norm = link.trim();
  try {
    const u = new URL(norm);
    u.hash = '';
    norm = `${u.protocol}//${u.host.toLowerCase()}${u.pathname.replace(/\/+$/, '')}${u.search}`;
  } catch {
    norm = norm.toLowerCase();
  }
  let h = 0x811c9dc5;
  for (const zeichen of new TextEncoder().encode(norm)) {
    h ^= zeichen;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `recherche-${h.toString(16).padStart(8, '0')}`;
}

export type RechercheAbbruch = 'nicht_eingerichtet' | 'grenze' | 'zeit' | 'fehler' | 'ungueltig';

export type RechercheErgebnis =
  | {
      ergebnis: 'ok';
      werte: number;
      saat: number;
      offen: Luecke[];
      offenSaat: Kulturform[];
      verworfen: { id: string; grund: string }[];
      dauerMs: number;
    }
  | { ergebnis: 'abgebrochen'; grund: RechercheAbbruch; hinweis: string; dauerMs: number };

const HINWEIS_RECHERCHE: Record<RechercheAbbruch, string> = {
  nicht_eingerichtet: 'Die Recherche ist noch nicht eingerichtet. Lege die Saatempfehlung von Hand an.',
  grenze: 'Das Tageslimit ist erreicht. Starte die Recherche morgen in der Sorte neu.',
  zeit: 'Die Recherche hat zu lange gedauert. Starte sie später in der Sorte neu.',
  fehler: 'Die Recherche ist gerade nicht möglich. Starte sie später in der Sorte neu.',
  ungueltig: 'Die Antwort der Recherche war nicht lesbar. Starte sie später in der Sorte neu.',
};

export function hinweisRecherche(grund: RechercheAbbruch): string {
  return HINWEIS_RECHERCHE[grund];
}
