// Seed-Konstanten (03_import_w0.md 4.7, 8.2, 9; R1.2, R1.4; Q12; 06_tests.md Abschnitt 9).

export interface Pflichtgroesse {
  phase: string;
  groesse: string;
  mindestensArt: boolean;
}

export interface SeedKonstanten {
  pflichtgroessen: Pflichtgroesse[];
  profilenden: { kulturform: string; profilEnde: string }[];
  produkte: {
    produktId: string;
    name: string;
    variante: string | null;
    gehalt: string | null;
    konzentration: string | null;
  }[];
  kStartwerte: { produktId: string; wert: number }[];
  messgeraet: { modell: string; dezimalen: number; uEc: number; uPh: number };
  einstellung: { festeKalibriertermine: string[]; stationsgrenzeAb: string };
  auswertungFenster: { name: string; von: Date; bis: Date };
}

const SOLLPHASEN = ['anzucht', 'wachstum', 'bluete', 'fruchtbildung_reife'];

/** Abschnitt 9 (A): Pflichtgrössen je Phase, mindestens auf Ebene Art dauer, ausser in keimung auch ph und ec */
const pflichtgroessen: Pflichtgroesse[] = [
  ...['anwendbar', 'dauer', 'bbch', 'keimart', 'keimtemp', 'wechselmerkmal'].map((groesse) => ({
    phase: 'keimung',
    groesse,
    mindestensArt: groesse === 'dauer',
  })),
  ...SOLLPHASEN.flatMap((phase) =>
    ['anwendbar', 'dauer', 'bbch', 'ph', 'ec', 'wechselmerkmal'].map((groesse) => ({
      phase,
      groesse,
      mindestensArt: ['dauer', 'ph', 'ec'].includes(groesse),
    })),
  ),
];

export const seedKonstanten: SeedKonstanten = {
  pflichtgroessen,
  // R1.2: Ende des Phasenprofils je Kulturform
  profilenden: [
    { kulturform: 'keimling', profilEnde: 'anzucht' },
    { kulturform: 'babyleaf', profilEnde: 'wachstum' },
    { kulturform: 'schnitt', profilEnde: 'wachstum' },
    { kulturform: 'kopf', profilEnde: 'wachstum' },
    { kulturform: 'dauerkultur_blatt', profilEnde: 'wachstum' },
    { kulturform: 'dauerkultur_frucht', profilEnde: 'fruchtbildung_reife' },
  ],
  // 4.7: Grow 3-1-6, Micro Hard Water 5-0-1, Bloom 0-5-4, pH-Minus TA pH Down mit Konzentration leer
  produkte: [
    { produktId: 'grow', name: 'TriPart Grow', variante: null, gehalt: '3-1-6', konzentration: null },
    {
      produktId: 'micro_hard_water',
      name: 'TriPart Micro',
      variante: 'Hard Water',
      gehalt: '5-0-1',
      konzentration: null,
    },
    { produktId: 'bloom', name: 'TriPart Bloom', variante: null, gehalt: '0-5-4', konzentration: null },
    { produktId: 'ph_minus', name: 'pH-Minus', variante: 'TA pH Down', gehalt: null, konzentration: null },
  ],
  // R4.1, G6: Startwert k = 0.3 mS/cm je ml/L für die drei Komponenten
  kStartwerte: [
    { produktId: 'grow', wert: 0.3 },
    { produktId: 'micro_hard_water', wert: 0.3 },
    { produktId: 'bloom', wert: 0.3 },
  ],
  // Q12: fest mS/cm, zwei Dezimalen; Unsicherheit bis zur Geräteprüfung 0.10 (Kapitel 17)
  messgeraet: { modell: 'Aquamaster P160 Pro2', dezimalen: 2, uEc: 0.1, uPh: 0.1 },
  // UC0, 7.1: feste Kalibriertermine und Grenze der Stationen; legt der Seed nur an, wenn einstellung leer ist (A7)
  einstellung: {
    festeKalibriertermine: ['2027-01-01', '2027-01-31', '2027-02-24', '2027-03-24'],
    stationsgrenzeAb: '2027-02-04',
  },
  // 14.4: 7.1.2027 00:00 bis 1.4.2027 00:00 Europe/Zurich, halboffen (MEZ bzw. MESZ ab 28.3.2027)
  auswertungFenster: {
    name: 'testbetrieb',
    von: new Date('2027-01-07T00:00:00+01:00'),
    bis: new Date('2027-04-01T00:00:00+02:00'),
  },
};
