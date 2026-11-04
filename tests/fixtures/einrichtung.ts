// Teile des Bündels (Form von PostgREST) für die Einrichtungs-Checkliste (Plan 18): Stand nach Punkt n der
// Inbetriebnahme. Ohne Personendaten; Anlage «R» mit festen IDs. Gemeinsam für Unit und E2E.

export const ID = {
  anlage: '1a000000-0000-4000-8000-000000000001',
  platzGefaess: '1a000000-0000-4000-8000-000000000011',
  platzAnzucht: '1a000000-0000-4000-8000-000000000012',
  platzW: '1a000000-0000-4000-8000-000000000013',
  gefaess: '1a000000-0000-4000-8000-000000000021',
  anzuchtort: '1a000000-0000-4000-8000-000000000031',
  messgeraet: '1a000000-0000-4000-8000-000000000041',
} as const;

type Teile = Record<string, unknown[]>;

const ohneStorno = { storniert_am: null };

/**
 * Datenstand nach den Punkten 1 bis `stufe` (0 = nichts erfasst). Punkt 2 (Einweichen) hat keine Daten;
 * die Kalibrierung aus Punkt 3 hakt ihn mit ab.
 */
export function einrichtungsTeile(stufe: number, datenart: 'echt' | 'demo' | 'test' = 'echt'): Teile {
  const t: Teile = {};
  const ab = (n: number) => stufe >= n;
  t['messgeraet'] = [{ id: ID.messgeraet, name: 'Messstift', u_ec: 0.05, u_ph: 0.05 }];
  if (ab(1))
    t['anlage'] = [{ id: ID.anlage, kuerzel: 'R', name: 'Regal', datenart, aktiv: true, ...ohneStorno }];
  if (ab(3))
    t['kalibrierung'] = [
      {
        id: '1a000000-0000-4000-8000-000000000051',
        messgeraet_id: ID.messgeraet,
        datenart,
        gegenprobe_ec: 1.41,
        nach_reinigung: false,
        gilt_ab: '2026-12-01T08:00:00Z',
        ...ohneStorno,
      },
    ];
  // Punkt 4 braucht die Messstelle; sie entsteht hier schon als Platz (Inbetriebnahme: W am Schreibtisch, UC0)
  const platzW = {
    id: ID.platzW,
    anlage_id: ID.anlage,
    bereich_id: null,
    kennung: 'W',
    rolle: 'messstelle',
    aktiv: true,
    ...ohneStorno,
  };
  if (ab(4)) {
    t['platz'] = [platzW];
    t['v_ec_wasser'] = [
      { anlage_id: ID.anlage, ec: 0.42, gemessen_am: '2026-12-01T09:00:00Z', herkunft: 'messung' },
    ];
  } else if (ab(1)) {
    t['v_ec_wasser'] = [{ anlage_id: ID.anlage, ec: 0.5, gemessen_am: null, herkunft: 'annahme' }];
  }
  if (ab(5)) {
    t['gefaessmodell'] = [{ id: '1a000000-0000-4000-8000-000000000061', name: 'Box 20 l', ...ohneStorno }];
    t['deckeltyp'] = [{ id: '1a000000-0000-4000-8000-000000000062', name: 'D2', ...ohneStorno }];
  }
  if (ab(6)) {
    t['platz'] = [
      platzW,
      {
        id: ID.platzGefaess,
        anlage_id: ID.anlage,
        bereich_id: null,
        kennung: '2.3',
        rolle: 'gefaess',
        aktiv: true,
        ...ohneStorno,
      },
      {
        id: ID.platzAnzucht,
        anlage_id: ID.anlage,
        bereich_id: null,
        kennung: 'A1',
        rolle: 'anzuchtort',
        aktiv: true,
        ...ohneStorno,
      },
    ];
    t['gefaess'] = [
      {
        id: ID.gefaess,
        platz_id: ID.platzGefaess,
        betriebsart: 'dwc',
        intervall_messen_d: 2,
        gueltig_bis: null,
        ...ohneStorno,
      },
    ];
    t['anzuchtort'] = [{ id: ID.anzuchtort, platz_id: ID.platzAnzucht, typ: 'box_licht', ...ohneStorno }];
    t['v_gefaess_status'] = [{ gefaess_id: ID.gefaess, status: 'in_pruefung' }];
  }
  if (ab(7))
    t['etikett'] = [ID.platzGefaess, ID.platzAnzucht, ID.platzW].map((platzId, i) => ({
      id: `1a000000-0000-4000-8000-00000000007${i}`,
      code: `R-${i}`,
      platz_id: platzId,
      gedruckt_am: '2026-12-02T10:00:00Z',
      ...ohneStorno,
    }));
  if (ab(8)) t['v_gefaess_status'] = [{ gefaess_id: ID.gefaess, status: 'in_betrieb_volumen_offen' }];
  if (ab(9))
    t['satz'] = [
      {
        id: '1a000000-0000-4000-8000-000000000081',
        anzuchtort_platz_id: ID.platzAnzucht,
        direktsaat_platz_id: null,
        saatdatum: '2026-12-03',
        ...ohneStorno,
      },
    ];
  return t;
}
