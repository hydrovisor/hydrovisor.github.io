// Beschreibung der Teile des Offline-Bündels (04_architektur.md 4.2, Plan 11; Plan 31 Lösungsweg 1): reine Daten,
// gemeinsam für den Client (src/daten/buendel.ts) und die Edge Function push-taeglich, damit Heute und Push dieselben
// Tabellen, Filter und Typen lesen (R5.1, Prüfer #27 H4).

export interface Buendelteil {
  /** Tabelle oder Sicht, zugleich Schlüssel in `teile` */
  name: string;
  /** abweichende Tabelle, wenn zwei Teile dieselbe Tabelle lesen (Plan 21 A13) */
  tabelle?: string;
  spalten: string;
  /** stabile Sortierung für die Seiten */
  ordnung: readonly string[];
  /** Betriebszeilen ohne Storno */
  ohneStorno?: boolean;
  /** Wissen: nur die gültige Fassung */
  gueltig?: boolean;
  /** nur Zeilen mit gilt_ab ab fensterBeginn(jetzt, tage) */
  fensterTage?: number;
  /** nur diese Werte der Spalte typ (Ereignisse) */
  typen?: readonly string[];
}

const tabelle = (
  name: string,
  extra: Omit<Buendelteil, 'name' | 'spalten' | 'ordnung'> = {},
): Buendelteil => ({
  name,
  spalten: '*',
  ordnung: ['id'],
  ...extra,
});
const sicht = (name: string, ordnung: readonly string[]): Buendelteil => ({ name, spalten: '*', ordnung });

/** Teile nach 04 4.2; spätere Pakete ergänzen hier, ohne Aufrufer zu ändern */
export const BUENDEL_TEILE: readonly Buendelteil[] = [
  // Anlage
  ...[
    'anlage',
    'bereich',
    'platz',
    'etikett',
    'gefaess',
    'gefaessmodell',
    'deckeltyp',
    'anzuchtort',
    'netztopf',
  ].map((n) => tabelle(n, { ohneStorno: true })),
  sicht('v_gefaess_status', ['gefaess_id']),
  sicht('v_fuellzustand', ['platz_id']),
  // Plan 27: Nachfüllwasser seit dem letzten Neuansatz für «Lösung wechseln» (R5.2)
  sicht('v_nachfuellsumme', ['platz_id']),
  // Leitungswasser-EC je Anlage für Punkt 4 der Einrichtung, unabhängig vom 14-Tage-Fenster (Plan 18)
  sicht('v_ec_wasser', ['anlage_id']),
  sicht('v_zielbereich', ['platz_id']),
  // Wissen (gültige Fassung)
  ...['sorte', 'art', 'art_kulturform', 'saatempfehlung', 'duengerschema', 'wissenseintrag'].map((n) =>
    tabelle(n, { gueltig: true }),
  ),
  tabelle('kulturgruppe'),
  tabelle('produkt'),
  // k je Komponente für die Einstellungen (Plan 32); gültig ist je Produkt die jüngste Zeile
  tabelle('k_faktor', { ohneStorno: true }),
  sicht('v_sollwert', ['sorte_id', 'phase', 'groesse']),
  // Plan 37: Maske Sorten (Vollständigkeit je Sorte, Quellen der Werte mit Herkunft)
  sicht('v_vollstaendigkeit', ['sorte_id']),
  tabelle('quelle'),
  // Plan 207: Tütenfotos je Sorte und Seite (Anzeige über signierte Links)
  tabelle('tuetenfoto', { ohneStorno: true }),
  // Plan 215: Vorrat-Ereignisse (Kein Saatgut mehr, Wieder vorrätig); stornierte Zeilen braucht der Stand nicht
  tabelle('vorrat_ereignis', { ohneStorno: true }),
  // Betrieb
  tabelle('satz', { ohneStorno: true }),
  tabelle('pflanzung', { ohneStorno: true }),
  sicht('v_pflanzung_zustand', ['pflanzung_id']),
  tabelle('v_reservierung_aktiv', { ohneStorno: true }),
  // Keimung prüfen (Plan 24): frühere Reservierungen (auch beendete) für Schwammfolge und Wiederherstellen
  tabelle('reservierung', { ohneStorno: true }),
  // Ereignisse an den Pflanzungen für Keimprüfung, «keimt nicht» und Wiederherstellen
  {
    name: 'ereignis_pflanzung',
    tabelle: 'ereignis',
    spalten: '*',
    ordnung: ['id'],
    ohneStorno: true,
    // Plan 33: Umsetzen, Verschieben, Tausch, Umsetzdatum und Ernte für Sämlinge, Deckel und Verlauf
    typen: [
      'keimung',
      'abschluss',
      'wiederherstellen',
      'verschieben',
      'umsetzen',
      'tausch',
      'umsetzdatum_geaendert',
      'ernte',
      // Plan 38: Schossen an der Pflanzung, Kulturentscheid am Satz (ereignis_satz bleibt phase_antwort)
      'schossen_handlung',
      'beobachtung',
      'kultur_entscheid',
      // Plan 27: Abdeckung entfernen am Direktsaat-Satz (Aufgaben-Rechnung)
      'abdeckung_entfernt',
    ],
  },
  // Säen (Plan 23): Packungen, Keimrate je Packung (nur echt, G5), aktueller Platz je Topf
  tabelle('saatgut', { ohneStorno: true }),
  sicht('v_keimrate', ['saatgut_id']),
  sicht('v_netztopf_platz', ['netztopf_id']),
  tabelle('messung', { ohneStorno: true, fensterTage: 14 }),
  sicht('v_messung_unsicher', ['messung_id']),
  tabelle('naehrloesungsansatz', { ohneStorno: true }),
  // Dosis je Komponente in der Maske «Gefäss»; nach dem Laden auf die letzten Ansätze gekürzt (Plan 20)
  tabelle('ansatz_position', { ohneStorno: true }),
  // Plan 29: Schritte der Abhakliste (nach dem Laden nur laufende Neuansätze) und die Wirkung von pH-Minus (R4.14)
  tabelle('ansatz_schritt', { ohneStorno: true }),
  sicht('v_ph_wirkung', ['wirkung_ml_je_l_je_0_1']),
  tabelle('kalibrierung', { ohneStorno: true }),
  sicht('v_kalibrierung_faellig', ['messgeraet_id', 'datenart']),
  tabelle('messgeraet'),
  // Plan 35: Phasenantworten am Satz für Phasenstand, Phasenfragen und Verlauf
  {
    name: 'ereignis_satz',
    tabelle: 'ereignis',
    spalten: '*',
    ordnung: ['id'],
    ohneStorno: true,
    typen: ['phase_antwort'],
  },
  tabelle('aufschub', { ohneStorno: true }),
  // Geräte-Ereignisse für Kalibrierstand und «unsicher» ohne Netz (R10.3, R5.2; Plan 12)
  tabelle('ereignis', { ohneStorno: true, typen: ['sonde_gereinigt', 'als_unsicher_markiert'] }),
  // Ereignisse am Platz für Prüfstatus, Prüfprotokoll, «entfernt am» und Wiederherstellen (Plan 21 A13)
  {
    name: 'ereignis_platz',
    tabelle: 'ereignis',
    spalten: '*',
    ordnung: ['id'],
    ohneStorno: true,
    typen: [
      'gefaess_erfasst',
      'gefaesspruefung',
      'box_deckel_tausch',
      'entfernt',
      'geleert',
      'ruhe',
      // Plan 33 (R8.4): Abweichung der Kurzprüfung sperrt das Verschieben in ein anderes Gefäss
      'kurzpruefung',
      // Plan 27: Aufgaben-Rechnung (Würfel feucht, Reinigen, Deckel öffnen)
      'aufgabe_erledigt',
      'gereinigt',
      'deckel_geoeffnet',
      // Plan 34 (R2.3 Stufe 4): Tims Wahl der Leitkultur wirkt offline sofort (A9)
      'leitkultur_gewaehlt',
      // Plan 30 (A9): «Nach Stromausfall» an der Anlage, Teil filtert nur nach Typ
      'stromausfall',
    ],
  },
  // Push (Plan 13): Abos ohne Schlüssel, Versände für «Letzte Erinnerung» und #/push
  {
    name: 'push_abo',
    spalten: 'id,geraet,endpoint,datenart,aktiv,letzter_fehler,erfasst_am',
    ordnung: ['id'],
  },
  tabelle('push_versand'),
  // ohne telefon_vertretung: keine Personendaten im Gerätespeicher, die keine Maske braucht (Ü3); email_rueckfall ist
  // ein Schalter ohne Personendaten (Plan 31 Lösungsweg 9)
  {
    name: 'einstellung',
    spalten:
      'id,push_zeit,vorlauf_n,kannengroesse_l,messmittel_ml,messbecher,thema,pflegebudget_min_werktag,' +
      'pflegebudget_h_woche,zeitzone,min_client_version,feste_kalibriertermine,stationsgrenze_ab,email_rueckfall',
    ordnung: ['id'],
  },
];

/** max_rows in supabase/config.toml */
export const SEITE = 1000;
