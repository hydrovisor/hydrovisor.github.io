// Dateien, Spalten und Aufzählungen des W0-Imports (03_import_w0.md Abschnitte 3 bis 5).

export const DATEI = {
  quelle: 'data/wissensbasis/freigegeben/quelle.csv',
  kulturgruppe: 'data/wissensbasis/freigegeben/kulturgruppe.csv',
  art: 'data/wissensbasis/freigegeben/art.csv',
  profilwert: 'data/wissensbasis/freigegeben/profilwert.csv',
  saatempfehlung: 'data/wissensbasis/freigegeben/saatempfehlung.csv',
  sorten: 'data/stammdaten/sorten.csv',
  duengerschema: 'data/stammdaten/duengerschema.csv',
  wissenseintrag: 'data/wissen/wissenseintrag.csv',
} as const;

export type DateiName = keyof typeof DATEI;
export const DATEI_NAMEN = Object.keys(DATEI) as DateiName[];
export const KANDIDATEN_ORDNER = 'data/wissensbasis/kandidaten/';

/** Spalten je Datei: true = Pflichtspalte (fehlt sie, bricht V1 ab), false = optional */
export const SPALTEN: Record<DateiName, Record<string, boolean>> = {
  quelle: {
    zeile_id: true,
    quelle_id: true,
    titel: true,
    autoren: true,
    jahr: true,
    link: true,
    klasse: true,
    anbaumethode: true,
    abgerufen_am: true,
    freigegeben_am: true,
  },
  kulturgruppe: {
    zeile_id: true,
    kulturgruppe_id: true,
    name: true,
    leitkultur_art_id: true,
    ec_obergrenze_validator: true,
    freigegeben_am: true,
  },
  art: {
    zeile_id: true,
    art_id: true,
    kulturform: true,
    feld: true,
    wert: true,
    quelle_id: true,
    fundstelle: true,
    kurzzitat: true,
    evidenzklasse: true,
    vermerk: true,
    freigegeben_am: true,
  },
  profilwert: {
    zeile_id: true,
    ebene: true,
    bezug: true,
    phase: true,
    groesse: true,
    wert_min: true,
    wert_typ: true,
    wert_max: true,
    text_wert: true,
    einheit_quelle: true,
    ec_basis: true,
    bezugstemperatur_c: false,
    bezugs_dli: false,
    system_quelle: true,
    umgebung_quelle: true,
    quelle_id: true,
    fundstelle: true,
    kurzzitat: true,
    evidenzklasse: true,
    vermerk: true,
    freigegeben_am: true,
  },
  saatempfehlung: {
    zeile_id: true,
    ebene: true,
    bezug: true,
    kulturform: true,
    samen_je_schwamm: true,
    obergrenze_samen: true,
    pflanzen_stehen_lassen: true,
    klasse_saatmenge: true,
    substrat_passung: true,
    quelle_id: true,
    fundstelle: true,
    kurzzitat: true,
    begruendung: true,
    freigegeben_am: true,
  },
  sorten: {
    zeile_id: true,
    name: true,
    art: true,
    kulturtyp: true,
    shop_link: true,
    keimart_tuete: true,
    keimtemperatur_tuete: true,
    wuchshoehe_max_mm: true,
    wuchsform: true,
    fruehzeitigkeit_relativ: true,
    katalog_quelle: true,
    kaufdatum: true,
    keimfaehigkeit_packung: true,
    bestand_korn: true,
  },
  duengerschema: {
    zeile_id: true,
    stadium: true,
    grow_ml_l: true,
    micro_ml_l: true,
    bloom_ml_l: true,
    summe_ml_l: true,
    ec_richtwert_min_ms_cm: true,
    ec_richtwert_max_ms_cm: true,
    ec_basis: true,
    herkunft: true,
    quelle_id: true,
    fundstelle: true,
    kurzzitat: true,
    evidenzklasse: true,
    mischregeln: false,
    freigegeben_am: false,
  },
  wissenseintrag: {
    zeile_id: true,
    ebene: true,
    bezug: true,
    phase: true,
    typ: true,
    text: true,
    quelle_id: true,
    fundstelle: true,
    kurzzitat: true,
    evidenzklasse: true,
    freigegeben_am: false,
  },
};

/** Prüfspalten der Kandidatendateien (Abschnitt 3); in freigegeben/ nicht erlaubt */
export const PRUEFSPALTEN = [
  'kandidat_id',
  'methodenpruefung',
  'quellenpruefung',
  'abgerufen_am',
  'konflikt_id',
  'status',
  'freigegeben_am',
  'notiz_tim',
];

export const PHASEN = ['keimung', 'anzucht', 'wachstum', 'bluete', 'fruchtbildung_reife'] as const;
export type Phase = (typeof PHASEN)[number];

/** Aufzählungen (Abschnitt 5 und Datenmodell) */
export const AUFZAEHLUNG = {
  phase: [...PHASEN],
  groesse: [
    'anwendbar',
    'dauer',
    'bbch',
    'wechselmerkmal',
    'ph',
    'ec',
    'licht_h',
    'wassertemp',
    'keimart',
    'keimtemp',
  ],
  kulturform: ['keimling', 'babyleaf', 'schnitt', 'kopf', 'dauerkultur_blatt', 'dauerkultur_frucht'],
  system: ['dwc', 'kratky', 'nft', 'ebbe_flut', 'substrat_inert', 'keine'],
  quelle_klasse: ['peer_review', 'universitaet_beratung', 'hersteller', 'praxis', 'katalog', 'tuete', 'app'],
  wissenseintrag_typ: [
    'naehrstoffe',
    'duengerkomponenten',
    'typischer_fehler',
    'mangelbild',
    'warnregel',
    'ernte',
    'sondenpflege',
    'kratky_pegel',
    'wurzelfarbe',
    'topf_umsetzen',
    'boxen_einzeln',
    'stromausfall',
    'schossen',
    'entspitzen',
    'bestaeubung',
    'wochenfahrplan',
  ],
  profil_ebene: ['art', 'kulturgruppe', 'standard'],
  saat_ebene: ['art', 'sorte'],
  wissen_ebene: ['art', 'kulturgruppe', 'allgemein'],
  evidenzklasse: ['A', 'B1', 'B2', 'C'],
  vermerk: ['keine', 'katalog', 'tuete', 'testbetrieb'],
  ec_einheit: ['mS/cm', 'µS/cm', 'ppm500', 'ppm700', 'cf'],
  ec_basis: ['gesamt', 'zuwachs', 'unbekannt'],
  umgebung: ['indoor_led', 'gewaechshaus', 'andere'],
  klasse_saatmenge: ['A', 'B', 'C', 'D'],
  herkunft_duenger: ['hersteller', 'abgeleitet'],
  kulturtyp: ['blatt', 'knolle', 'frucht'],
  keimart: ['licht', 'dunkel', 'indifferent'],
  anwendbar: ['ja', 'entfaellt'],
  wuchsform: ['aufrecht', 'buschig', 'haengend', 'rosette'],
  systemeignung: ['dwc', 'kratky', 'beide'],
  photoperiode: ['langtag', 'kurztag', 'tagneutral'],
  pythium: ['hoch', 'mittel', 'gering'],
  schossen_handlung: ['auskneifen', 'ernten_beenden', 'bluete_nutzen'],
  ernteart: ['einmalig', 'mehrfach'],
} as const;

/** Zuordnung der Spalte stadium (4.7) */
export const STADIUM: Record<string, string> = {
  '1. Wurzeln / Keimung': 'wurzeln_keimung',
  '1. echte Blätter': 'echte_blaetter',
  Wachstum: 'wachstum',
  Vorblüte: 'vorbluete',
  'Blüte / Frucht': 'bluete_frucht',
  Reife: 'reife',
};

/** Format eines Felds in art.csv (4.3.2, 4.3.3) */
export type FeldFormat =
  | { typ: 'text' }
  | { typ: 'ganzzahl' }
  | { typ: 'zahl'; min?: number; max?: number }
  | { typ: 'janein' }
  | { typ: 'monate' }
  | { typ: 'liste' }
  | { typ: 'aufzaehlung'; werte: readonly string[] }
  | { typ: 'kulturgruppe' };

export const ART_FELDER: Record<string, FeldFormat> = {
  name_de: { typ: 'text' },
  name_wiss: { typ: 'text' },
  gbif_key: { typ: 'ganzzahl' },
  kulturgruppe_id: { typ: 'kulturgruppe' },
  samentyp: { typ: 'text' },
  keimlinge_je_knaeuel: { typ: 'zahl' },
  standard_keimfaehigkeit: { typ: 'zahl', min: 0.3, max: 0.98 },
  systemeignung: { typ: 'aufzaehlung', werte: AUFZAEHLUNG.systemeignung },
  liter_je_pflanze: { typ: 'zahl' },
  wasserbedarf_je_pflanze_l: { typ: 'zahl' },
  pflanzen_je_m2: { typ: 'zahl' },
  wuchshoehe_max_mm: { typ: 'ganzzahl' },
  wuchsform: { typ: 'aufzaehlung', werte: AUFZAEHLUNG.wuchsform },
  photoperiode: { typ: 'aufzaehlung', werte: AUFZAEHLUNG.photoperiode },
  kritische_tageslaenge_h: { typ: 'zahl', min: 0, max: 24 },
  bestaeubung_noetig: { typ: 'janein' },
  pythium: { typ: 'aufzaehlung', werte: AUFZAEHLUNG.pythium },
  schossen_handlung: { typ: 'aufzaehlung', werte: AUFZAEHLUNG.schossen_handlung },
  aussaatfenster_outdoor: { typ: 'monate' },
  umsetzen_ab_d: { typ: 'ganzzahl' },
  umsetzen_bis_d: { typ: 'ganzzahl' },
  kulturformen_erlaubt: { typ: 'liste' },
  kulturform_vorgabe: { typ: 'aufzaehlung', werte: AUFZAEHLUNG.kulturform },
};

export const KULTURFORM_FELDER: Record<string, FeldFormat> = {
  ernte_ab_d: { typ: 'ganzzahl' },
  ernteart: { typ: 'aufzaehlung', werte: AUFZAEHLUNG.ernteart },
  ernteintervall_d: { typ: 'ganzzahl' },
  schnitte_max: { typ: 'ganzzahl' },
  kulturdauer_max_d: { typ: 'ganzzahl' },
  kulturdauer_typisch_d: { typ: 'ganzzahl' },
  entspitzen: { typ: 'janein' },
};

export const STAMMFELDER = ['name_de', 'name_wiss', 'gbif_key', 'kulturgruppe_id'];
