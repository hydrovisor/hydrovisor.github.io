// Abbildung der W0-Dateien auf Zielzeilen der Datenbank (03_import_w0.md Abschnitt 4, 8; Plan 10 A1 bis A10).
// Zielzeilen tragen die Spaltennamen der Datenbank; Zahlen bleiben Dezimaltext (exakt), Verweise auf Sorten
// laufen über sorte_key (= zeile_id der Sorte), den das Ladeskript in sorte_id auflöst.
import type { Auswahl } from './auswahl.ts';
import { KEIMUNG_VORAB } from './auswahl.ts';
import { artKulturformen, artMerkmale, artNachName, datei, wert, zeilen } from './bestand.ts';
import { gegenprobe } from './gegenprobe.ts';
import type { SeedKonstanten } from './konstanten.ts';
import { ART_FELDER, DATEI, DATEI_NAMEN, STADIUM, type DateiName } from './schema.ts';
import type { Konflikt, W0Dateien, Zeile } from './typen.ts';
import { ecTausendstel, type EcEinheit } from './umrechnung.ts';
import { ausTausendstel } from './zahl.ts';

export type Zieltabelle =
  | 'quelle'
  | 'kulturgruppe'
  | 'art'
  | 'art_kulturform'
  | 'herkunft'
  | 'sorte'
  | 'saatgut'
  | 'profilwert'
  | 'saatempfehlung'
  | 'duengerschema'
  | 'wissenseintrag';

export type Zielwert = string | number | boolean | string[] | null;
export type Zielzeile = Record<string, Zielwert>;

/** Gruppe von Zielzeilen aus einer Datei für eine Tabelle (ein Ladeschritt) */
export interface Schritt {
  datei: string;
  tabelle: Zieltabelle;
  zeilen: Zielzeile[];
}

export interface Ladeplan {
  tabellen: Record<Zieltabelle, Zielzeile[]>;
  schritte: Schritt[];
  /** Zähltest (8.6): Zeilen je Datei und Zieltabelle nach Teilfreigabe */
  erwartet: { datei: string; tabelle: string; anzahl: number }[];
  geliefert: string[];
  fehlendeDateien: string[];
  nichtGeladen: { artId: string; grund: string }[];
  hinweise: string[];
  gegenprobe: Konflikt[];
  konstanten: SeedKonstanten;
}

/** Spalten je versionierter Tabelle, die der Seed setzt (ohne id, gueltig_*, erfasst_am, commit, app_version) */
export const ZIELSPALTEN: Record<Exclude<Zieltabelle, 'saatgut' | 'quelle' | 'kulturgruppe'>, string[]> = {
  art: [
    'art_id',
    'name_de',
    'name_wiss',
    'gbif_key',
    'kulturgruppe_id',
    'samentyp',
    'keimlinge_je_knaeuel',
    'standard_keimfaehigkeit',
    'systemeignung',
    'liter_je_pflanze',
    'wasserbedarf_je_pflanze_l',
    'pflanzen_je_m2',
    'wuchshoehe_max_mm',
    'wuchsform',
    'photoperiode',
    'kritische_tageslaenge_h',
    'bestaeubung_noetig',
    'pythium',
    'schossen_handlung',
    'aussaatfenster_von_monat',
    'aussaatfenster_bis_monat',
    'umsetzen_ab_d',
    'umsetzen_bis_d',
    'kulturformen_erlaubt',
    'kulturform_vorgabe',
  ],
  art_kulturform: [
    'art_id',
    'kulturform',
    'ernte_ab_d',
    'ernteart',
    'ernteintervall_d',
    'schnitte_max',
    'kulturdauer_max_d',
    'kulturdauer_typisch_d',
    'entspitzen',
  ],
  herkunft: [
    'tabelle',
    'zeile_id',
    'feld',
    'quelle_id',
    'fundstelle',
    'kurzzitat',
    'evidenzklasse',
    'vermerk',
  ],
  sorte: [
    'sorte_id',
    'name',
    'art_id',
    'kulturtyp',
    'wuchshoehe_max_mm',
    'wuchsform',
    'fruehzeitigkeit_relativ_d',
    'shop_link',
  ],
  profilwert: [
    'ebene',
    'sorte_id',
    'art_id',
    'kulturgruppe_id',
    'phase',
    'groesse',
    'wert_min',
    'wert_typ',
    'wert_max',
    'text_wert',
    'ec_min_quelle',
    'ec_max_quelle',
    'ec_einheit_quelle',
    'ec_basis_quelle',
    'bezugstemperatur_c',
    'bezugs_dli',
    'system_quelle',
    'umgebung_quelle',
    'quelle_id',
    'fundstelle',
    'kurzzitat',
    'evidenzklasse',
    'vermerk',
  ],
  saatempfehlung: [
    'ebene',
    'art_id',
    'sorte_id',
    'kulturform',
    'samen_je_schwamm',
    'obergrenze_samen',
    'pflanzen_stehen_lassen',
    'klasse_saatmenge',
    'substrat_passung',
    'begruendung',
    'quelle_id',
    'fundstelle',
    'kurzzitat',
  ],
  duengerschema: [
    'stadium',
    'grow_ml_l',
    'micro_ml_l',
    'bloom_ml_l',
    'summe_ml_l',
    'ec_richtwert_min',
    'ec_richtwert_max',
    'ec_basis',
    'herkunft',
    'quelle_id',
    'fundstelle',
    'kurzzitat',
    'evidenzklasse',
    'mischregeln',
  ],
  wissenseintrag: [
    'ebene',
    'art_id',
    'kulturgruppe_id',
    'phase',
    'typ',
    'text',
    'quelle_id',
    'fundstelle',
    'kurzzitat',
    'evidenzklasse',
  ],
};

export const QUELLE_SPALTEN = [
  'quelle_id',
  'titel',
  'autoren',
  'jahr',
  'link',
  'klasse',
  'anbaumethode',
  'abgerufen_am',
  'freigegeben_am',
];
export const KULTURGRUPPE_SPALTEN = [
  'kulturgruppe_id',
  'name',
  'leitkultur_art_id',
  'ec_obergrenze_validator',
  'freigegeben_am',
];

const janein = (w: string | null): boolean | null => (w === null ? null : w === 'ja');

function spaetestes(daten: (string | null)[]): string | null {
  const vorhanden = daten.filter((x): x is string => x !== null).sort();
  return vorhanden[vorhanden.length - 1] ?? null;
}

function herkunftZeile(tabelle: string, zeileId: string, feld: string, z: Zeile): Zielzeile {
  return {
    tabelle,
    zeile_id: zeileId,
    feld,
    quelle_id: wert(z, 'quelle_id'),
    fundstelle: wert(z, 'fundstelle'),
    kurzzitat: wert(z, 'kurzzitat'),
    evidenzklasse: wert(z, 'evidenzklasse'),
    vermerk: wert(z, 'vermerk'),
  };
}

function artZeilen(d: W0Dateien): { art: Zielzeile[]; herkunft: Zielzeile[] } {
  const art: Zielzeile[] = [];
  const herkunft: Zielzeile[] = [];
  for (const [artId, felder] of artMerkmale(d)) {
    const zeileId = `art.${artId}`;
    const z: Zielzeile = Object.fromEntries(ZIELSPALTEN.art.map((s) => [s, null]));
    z['art_id'] = artId;
    z['kulturformen_erlaubt'] = [];
    for (const [feld, quelle] of felder) {
      const w = wert(quelle, 'wert');
      herkunft.push(herkunftZeile('art', zeileId, feld, quelle));
      if (w === null) continue;
      if (feld === 'aussaatfenster_outdoor') {
        const [von, bis] = w.split('-');
        z['aussaatfenster_von_monat'] = von ?? null;
        z['aussaatfenster_bis_monat'] = bis ?? null;
      } else if (feld === 'kulturformen_erlaubt') z[feld] = w.split(';');
      else if (ART_FELDER[feld]?.typ === 'janein') z[feld] = janein(w);
      else z[feld] = w;
    }
    z['quelldatei'] = DATEI.art;
    z['zeile_id'] = zeileId;
    z['freigegeben_am'] = spaetestes([...felder.values()].map((x) => wert(x, 'freigegeben_am')));
    art.push(z);
  }
  return { art, herkunft };
}

function kulturformZeilen(d: W0Dateien, auswahl: Auswahl): { ak: Zielzeile[]; herkunft: Zielzeile[] } {
  const ak: Zielzeile[] = [];
  const herkunft: Zielzeile[] = [];
  for (const [artId, formen] of artKulturformen(d)) {
    if (!auswahl.voll.has(artId)) continue;
    for (const [kf, felder] of formen) {
      const zeileId = `ak.${artId}.${kf}`;
      const z: Zielzeile = Object.fromEntries(ZIELSPALTEN.art_kulturform.map((s) => [s, null]));
      z['art_id'] = artId;
      z['kulturform'] = kf;
      z['entspitzen'] = false;
      for (const [feld, quelle] of felder) {
        herkunft.push(herkunftZeile('art_kulturform', zeileId, feld, quelle));
        const w = wert(quelle, 'wert');
        z[feld] = feld === 'entspitzen' ? janein(w) : w;
      }
      z['quelldatei'] = DATEI.art;
      z['zeile_id'] = zeileId;
      z['freigegeben_am'] = spaetestes([...felder.values()].map((x) => wert(x, 'freigegeben_am')));
      ak.push(z);
    }
  }
  return { ak, herkunft };
}

function leer(tabelle: keyof typeof ZIELSPALTEN): Zielzeile {
  return Object.fromEntries(ZIELSPALTEN[tabelle].map((s) => [s, null]));
}

function profilwertZeile(z: Zeile): Zielzeile {
  const p = leer('profilwert');
  const ebene = wert(z, 'ebene');
  const bezug = wert(z, 'bezug');
  Object.assign(p, {
    ebene,
    art_id: ebene === 'art' ? bezug : null,
    kulturgruppe_id: ebene === 'kulturgruppe' ? bezug : null,
    phase: wert(z, 'phase'),
    groesse: wert(z, 'groesse'),
    wert_min: wert(z, 'wert_min'),
    wert_typ: wert(z, 'wert_typ'),
    wert_max: wert(z, 'wert_max'),
    text_wert: wert(z, 'text_wert'),
    bezugstemperatur_c: wert(z, 'bezugstemperatur_c'),
    bezugs_dli: wert(z, 'bezugs_dli'),
    system_quelle: wert(z, 'system_quelle'),
    umgebung_quelle: wert(z, 'umgebung_quelle'),
    quelle_id: wert(z, 'quelle_id'),
    fundstelle: wert(z, 'fundstelle'),
    kurzzitat: wert(z, 'kurzzitat'),
    evidenzklasse: wert(z, 'evidenzklasse'),
    vermerk: wert(z, 'vermerk'),
  });
  if (wert(z, 'groesse') === 'ec') {
    // Rohwert unverändert, daneben in mS/cm (Abschnitt 6)
    const einheit = wert(z, 'einheit_quelle') as EcEinheit;
    const um = (w: string | null) => (w === null ? null : ausTausendstel(ecTausendstel(w, einheit)));
    Object.assign(p, {
      ec_min_quelle: wert(z, 'wert_min'),
      ec_max_quelle: wert(z, 'wert_max'),
      ec_einheit_quelle: einheit,
      ec_basis_quelle: wert(z, 'ec_basis'),
      wert_min: um(wert(z, 'wert_min')),
      wert_typ: um(wert(z, 'wert_typ')),
      wert_max: um(wert(z, 'wert_max')),
    });
  }
  p['quelldatei'] = DATEI.profilwert;
  p['zeile_id'] = wert(z, 'zeile_id');
  p['freigegeben_am'] = wert(z, 'freigegeben_am');
  return p;
}

/** Profilwerte nach Teilfreigabe: Kulturgruppe und Standard immer, Art nur voll oder Keimung vorab */
function profilwerte(d: W0Dateien, auswahl: Auswahl): Zielzeile[] {
  return zeilen(d, 'profilwert')
    .filter((z) => {
      if (wert(z, 'ebene') !== 'art') return true;
      const artId = wert(z, 'bezug') ?? '';
      if (auswahl.voll.has(artId)) return true;
      return (
        auswahl.keimungVorab.has(artId) &&
        wert(z, 'phase') === 'keimung' &&
        KEIMUNG_VORAB.includes(wert(z, 'groesse') ?? '')
      );
    })
    .map(profilwertZeile);
}

interface SortenTeil {
  sorte: Zielzeile[];
  saatgut: Zielzeile[];
  profilwert: Zielzeile[];
  herkunft: Zielzeile[];
  quelle: Zielzeile[];
}

function sorten(d: W0Dateien): SortenTeil {
  const teil: SortenTeil = { sorte: [], saatgut: [], profilwert: [], herkunft: [], quelle: [] };
  const nachName = artNachName(d);
  for (const s of zeilen(d, 'sorten')) {
    const key = wert(s, 'zeile_id') ?? '';
    const katalog = wert(s, 'katalog_quelle');
    teil.sorte.push({
      sorte_key: key,
      name: wert(s, 'name'),
      art_id: nachName.get(wert(s, 'art') ?? '') ?? null,
      kulturtyp: wert(s, 'kulturtyp'),
      wuchshoehe_max_mm: wert(s, 'wuchshoehe_max_mm'),
      wuchsform: wert(s, 'wuchsform'),
      fruehzeitigkeit_relativ_d: wert(s, 'fruehzeitigkeit_relativ'),
      shop_link: wert(s, 'shop_link'),
      quelldatei: DATEI.sorten,
      zeile_id: key,
      freigegeben_am: null,
    });
    teil.saatgut.push({
      sorte_key: key,
      kaufdatum: wert(s, 'kaufdatum'),
      keimfaehigkeit_packung: wert(s, 'keimfaehigkeit_packung'),
      bestand_korn: wert(s, 'bestand_korn'),
    });
    // Katalogwerte: Herkunft katalog_quelle, Klasse C, Vermerk katalog (A10)
    for (const [spalte, feld] of [
      ['wuchshoehe_max_mm', 'wuchshoehe_max_mm'],
      ['wuchsform', 'wuchsform'],
      ['fruehzeitigkeit_relativ', 'fruehzeitigkeit_relativ_d'],
    ] as const) {
      if (wert(s, spalte) === null || katalog === null) continue;
      teil.herkunft.push({
        tabelle: 'sorte',
        zeile_id: key,
        feld,
        quelle_id: katalog,
        fundstelle: 'Katalog',
        kurzzitat: 'Katalog',
        evidenzklasse: 'C',
        vermerk: 'katalog',
      });
    }
    // Tütenwerte: profilwert Ebene sorte, Quelle tuete-<sorte_key> wie wissen_app_schreiben()
    const tuete = `tuete-${key}`;
    const keimart = wert(s, 'keimart_tuete');
    const keimtemp = wert(s, 'keimtemperatur_tuete');
    const tueteZeile = (groesse: string, werte: Zielzeile): Zielzeile => ({
      ...leer('profilwert'),
      ebene: 'sorte',
      sorte_key: key,
      phase: 'keimung',
      groesse,
      ...werte,
      quelle_id: tuete,
      fundstelle: 'Tüte',
      kurzzitat: 'Tüte',
      evidenzklasse: 'C',
      vermerk: 'tuete',
      quelldatei: DATEI.sorten,
      zeile_id: `pw.${key}.keimung.${groesse}`,
      freigegeben_am: null,
    });
    if (keimart !== null) teil.profilwert.push(tueteZeile('keimart', { text_wert: keimart }));
    if (keimtemp !== null) {
      const [min, max] = keimtemp.split('-');
      teil.profilwert.push(tueteZeile('keimtemp', { wert_min: min ?? null, wert_max: max ?? null }));
    }
    if (keimart !== null || keimtemp !== null) {
      teil.quelle.push({
        quelle_id: tuete,
        titel: `Saattüte ${key}`,
        autoren: null,
        jahr: null,
        link: 'app',
        klasse: 'tuete',
        anbaumethode: 'keine',
        abgerufen_am: null,
        freigegeben_am: null,
      });
    }
  }
  return teil;
}

function saatempfehlungen(d: W0Dateien, auswahl: Auswahl): Zielzeile[] {
  const artDerSorte = new Map<string, string>();
  const nachName = artNachName(d);
  for (const s of zeilen(d, 'sorten')) {
    const artId = nachName.get(wert(s, 'art') ?? '');
    if (artId) artDerSorte.set(wert(s, 'zeile_id') ?? '', artId);
  }
  return zeilen(d, 'saatempfehlung')
    .filter((z) => {
      const bezug = wert(z, 'bezug') ?? '';
      return auswahl.voll.has(wert(z, 'ebene') === 'sorte' ? (artDerSorte.get(bezug) ?? '') : bezug);
    })
    .map((z) => {
      const sorte = wert(z, 'ebene') === 'sorte';
      const zeile: Zielzeile = { ...leer('saatempfehlung') };
      for (const s of ZIELSPALTEN.saatempfehlung) if (s in z) zeile[s] = wert(z, s);
      delete zeile['sorte_id'];
      Object.assign(zeile, {
        art_id: sorte ? null : wert(z, 'bezug'),
        ...(sorte ? { sorte_key: wert(z, 'bezug') } : { sorte_id: null }),
        bestaetigt_am: wert(z, 'freigegeben_am'),
        quelldatei: DATEI.saatempfehlung,
        zeile_id: wert(z, 'zeile_id'),
        freigegeben_am: wert(z, 'freigegeben_am'),
      });
      return zeile;
    });
}

function duenger(d: W0Dateien): Zielzeile[] {
  return zeilen(d, 'duengerschema').map((z) => ({
    stadium: STADIUM[wert(z, 'stadium') ?? ''] ?? null,
    grow_ml_l: wert(z, 'grow_ml_l'),
    micro_ml_l: wert(z, 'micro_ml_l'),
    bloom_ml_l: wert(z, 'bloom_ml_l'),
    summe_ml_l: wert(z, 'summe_ml_l'),
    ec_richtwert_min: wert(z, 'ec_richtwert_min_ms_cm'),
    ec_richtwert_max: wert(z, 'ec_richtwert_max_ms_cm'),
    ec_basis: wert(z, 'ec_basis') ?? 'unbekannt',
    herkunft: wert(z, 'herkunft'),
    quelle_id: wert(z, 'quelle_id'),
    fundstelle: wert(z, 'fundstelle'),
    kurzzitat: wert(z, 'kurzzitat'),
    evidenzklasse: wert(z, 'evidenzklasse'),
    mischregeln: wert(z, 'mischregeln'),
    quelldatei: DATEI.duengerschema,
    zeile_id: wert(z, 'zeile_id'),
    freigegeben_am: wert(z, 'freigegeben_am'),
  }));
}

function wissen(d: W0Dateien): Zielzeile[] {
  return zeilen(d, 'wissenseintrag').map((z) => {
    const ebene = wert(z, 'ebene');
    return {
      ebene,
      art_id: ebene === 'art' ? wert(z, 'bezug') : null,
      kulturgruppe_id: ebene === 'kulturgruppe' ? wert(z, 'bezug') : null,
      phase: wert(z, 'phase'),
      typ: wert(z, 'typ'),
      text: wert(z, 'text'),
      quelle_id: wert(z, 'quelle_id'),
      fundstelle: wert(z, 'fundstelle'),
      kurzzitat: wert(z, 'kurzzitat'),
      evidenzklasse: wert(z, 'evidenzklasse'),
      quelldatei: DATEI.wissenseintrag,
      zeile_id: wert(z, 'zeile_id'),
      freigegeben_am: wert(z, 'freigegeben_am'),
    };
  });
}

export function ladeplan(dateien: W0Dateien, auswahl: Auswahl, konstanten: SeedKonstanten): Ladeplan {
  const hat = (n: DateiName) => datei(dateien, n) !== undefined;
  const geliefert = DATEI_NAMEN.filter(hat).map((n) => DATEI[n]);
  const fehlendeDateien = DATEI_NAMEN.filter((n) => !hat(n)).map((n) => DATEI[n]);
  const hinweise: string[] = [];

  const arten = hat('art') ? artZeilen(dateien) : { art: [], herkunft: [] };
  const formen = hat('art') ? kulturformZeilen(dateien, auswahl) : { ak: [], herkunft: [] };
  // Sortenstamm wartet auf art.csv (A2)
  const mitSorten = hat('sorten') && hat('art');
  if (hat('sorten') && !hat('art')) hinweise.push('Sortenstamm wartet auf art.csv');
  const s = mitSorten
    ? sorten(dateien)
    : { sorte: [], saatgut: [], profilwert: [], herkunft: [], quelle: [] };
  const quellen: Zielzeile[] = [
    ...zeilen(dateien, 'quelle').map((z) => Object.fromEntries(QUELLE_SPALTEN.map((c) => [c, wert(z, c)]))),
    ...s.quelle,
  ];
  const gruppen = zeilen(dateien, 'kulturgruppe').map((z) =>
    Object.fromEntries(KULTURGRUPPE_SPALTEN.map((c) => [c, wert(z, c)])),
  );
  const pw = hat('profilwert') ? profilwerte(dateien, auswahl) : [];
  const se = hat('saatempfehlung') ? saatempfehlungen(dateien, auswahl) : [];
  const ds = duenger(dateien);
  const we = wissen(dateien);

  const schritte: Schritt[] = [];
  const schritt = (n: DateiName, tabelle: Zieltabelle, z: Zielzeile[], bedingung = hat(n)) => {
    if (bedingung) schritte.push({ datei: DATEI[n], tabelle, zeilen: z });
  };
  schritt('art', 'art', arten.art);
  schritt('art', 'art_kulturform', formen.ak);
  schritt('art', 'herkunft', [...arten.herkunft, ...formen.herkunft]);
  schritt('profilwert', 'profilwert', pw);
  schritt('sorten', 'sorte', s.sorte, mitSorten);
  schritt('sorten', 'herkunft', s.herkunft, mitSorten);
  schritt('sorten', 'profilwert', s.profilwert, mitSorten);
  schritt('saatempfehlung', 'saatempfehlung', se);
  schritt('duengerschema', 'duengerschema', ds);
  schritt('wissenseintrag', 'wissenseintrag', we);

  const erwartet = schritte.map((x) => ({ datei: x.datei, tabelle: x.tabelle, anzahl: x.zeilen.length }));
  if (mitSorten) erwartet.push({ datei: DATEI.sorten, tabelle: 'saatgut', anzahl: s.saatgut.length });

  return {
    tabellen: {
      quelle: quellen,
      kulturgruppe: gruppen,
      art: arten.art,
      art_kulturform: formen.ak,
      herkunft: [...arten.herkunft, ...formen.herkunft, ...s.herkunft],
      sorte: s.sorte,
      saatgut: s.saatgut,
      profilwert: [...pw, ...s.profilwert],
      saatempfehlung: se,
      duengerschema: ds,
      wissenseintrag: we,
    },
    schritte,
    erwartet,
    geliefert,
    fehlendeDateien,
    nichtGeladen: [...auswahl.nurMerkmale].map(([artId, grund]) => ({ artId, grund })),
    hinweise,
    gegenprobe: gegenprobe(dateien),
    konstanten,
  };
}
