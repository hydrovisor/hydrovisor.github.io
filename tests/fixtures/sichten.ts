// Testhilfe (Plan 21 Testliste): wendet einen Vorgang oder einzelne Zeilen auf die Teile an und rechnet
// v_gefaess_status und v_fuellzustand wie die Sichten in supabase/migrations/20261103140000_datenmodell.sql nach.
// Gemeinsam für Unit (gefaess-*.test.ts) und E2E (gefaess.spec.ts). Rein, ohne Personendaten.
import type { Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import type { Teile } from './regal.ts';

type Zeile = Record<string, unknown>;

const ms = (w: unknown) => (typeof w === 'string' ? Date.parse(w) : Number.NaN);
const offen = (z: Zeile) => z['storniert_am'] === null || z['storniert_am'] === undefined;
const max = (l: number[]) => (l.length > 0 ? Math.max(...l) : undefined);
const min = (l: number[]) => (l.length > 0 ? Math.min(...l) : undefined);

/** neue Zeile wie die Datenbank sie ablegt (Standardwerte der Spalten) */
export function zeileAufnehmen(teile: Teile, tabelle: string, zeile: Zeile, jetzt: Date): void {
  const iso = jetzt.toISOString();
  const z: Zeile = { ...zeile };
  z['storniert_am'] ??= null;
  if (tabelle === 'platz' || tabelle === 'netztopf' || tabelle === 'anlage') z['aktiv'] ??= true;
  if (tabelle === 'gefaess') {
    z['gueltig_von'] ??= iso;
    z['gueltig_bis'] ??= null;
  }
  if (tabelle === 'ereignis') {
    z['gilt_ab'] ??= iso;
    z['daten'] ??= {};
  }
  if (tabelle === 'etikett') z['gedruckt_am'] ??= null;
  (teile[tabelle] ??= []).push(z);
}

/** Storno: setzt storniert_am an der Zeile mit dieser client_id */
export function stornoAufnehmen(teile: Teile, tabelle: string, clientId: string, jetzt: Date): void {
  for (const z of teile[tabelle] ?? [])
    if (z['client_id'] === clientId && offen(z)) z['storniert_am'] = jetzt.toISOString();
}

/** Vorgang auf eine Kopie der Teile anwenden und die Sichten nachrechnen */
export function vorgangAnwenden(teile: Teile, vorgang: Vorgang, jetzt: Date): Teile {
  const t = structuredClone(teile);
  for (const s of vorgang)
    if (s.art === 'neu') zeileAufnehmen(t, s.tabelle, { ...s.felder }, jetzt);
    else stornoAufnehmen(t, s.tabelle, s.clientId, jetzt);
  return sichtenNachrechnen(t);
}

/** v_gefaess_status und v_fuellzustand aus Gefässen, Ereignissen und Ansätzen (wie die SQL-Sichten) */
export function sichtenNachrechnen(t: Teile): Teile {
  const ereignisse = (t['ereignis'] ?? []).filter(offen);
  const amPlatz = (platz: unknown, typ: string) =>
    ereignisse.filter((e) => e['platz_id'] === platz && e['typ'] === typ);
  const gefaesse = (t['gefaess'] ?? []).filter(offen);

  t['v_gefaess_status'] = gefaesse
    .filter((g) => g['gueltig_bis'] === null || g['gueltig_bis'] === undefined)
    .map((g) => {
      const platz = g['platz_id'];
      const ge = max(amPlatz(platz, 'gefaess_erfasst').map((e) => ms(e['gilt_ab'])));
      const le = max(amPlatz(platz, 'entfernt').map((e) => ms(e['gilt_ab'])));
      const erfasst =
        ge !== undefined && (le === undefined || ge >= le)
          ? ge
          : min(
              gefaesse
                .filter((g2) => g2['platz_id'] === platz)
                .map((g2) => ms(g2['gueltig_von']))
                .filter((v) => !Number.isNaN(v) && (le === undefined || v > le)),
            );
      const ab = (e: Zeile) => erfasst === undefined || ms(e['gilt_ab']) >= erfasst;
      const tausch = max(
        amPlatz(platz, 'box_deckel_tausch')
          .filter(ab)
          .map((e) => ms(e['gilt_ab'])),
      );
      const anker = Math.max(erfasst ?? -Infinity, tausch ?? -Infinity);
      const entfernt = amPlatz(platz, 'entfernt').filter(ab);
      const ruhe = amPlatz(platz, 'ruhe')
        .filter(ab)
        .sort((a, b) => ms(b['gilt_ab']) - ms(a['gilt_ab']))[0];
      const pruef = amPlatz(platz, 'gefaesspruefung').filter((e) => ms(e['gilt_ab']) >= anker);
      const daten = (e: Zeile) => (e['daten'] ?? {}) as { schritt?: number; ok?: boolean };
      const schritte = new Set(
        pruef
          .filter((e) => (daten(e).schritt ?? 0) >= 1 && (daten(e).schritt ?? 0) <= 3 && daten(e).ok === true)
          .map((e) => daten(e).schritt),
      ).size;
      const schritt4 = pruef.some((e) => daten(e).schritt === 4 && daten(e).ok === true);
      const status =
        entfernt.length > 0
          ? 'entfernt'
          : (ruhe?.['daten'] as { gesetzt?: boolean } | undefined)?.gesetzt === true
            ? 'ruht'
            : schritte === 3 && schritt4
              ? 'in_betrieb'
              : schritte === 3
                ? 'in_betrieb_volumen_offen'
                : 'in_pruefung';
      return { gefaess_id: g['id'], status };
    });

  t['v_fuellzustand'] = (t['platz'] ?? [])
    .filter((p) => p['rolle'] === 'gefaess')
    .map((p) => {
      const letzter = max(
        (t['naehrloesungsansatz'] ?? [])
          .filter(
            (a) =>
              offen(a) &&
              a['platz_id'] === p['id'] &&
              a['typ'] === 'neuansatz' &&
              a['status'] !== 'abgebrochen',
          )
          .map((a) => ms(a['begonnen_am'])),
      );
      const leerEv = max(
        ereignisse
          .filter(
            (e) =>
              e['platz_id'] === p['id'] &&
              ['geleert', 'gefaess_erfasst', 'entfernt'].includes(String(e['typ'])),
          )
          .map((e) => ms(e['gilt_ab'])),
      );
      const entferntAm = max(amPlatz(p['id'], 'entfernt').map((e) => ms(e['gilt_ab'])));
      const ersteBelegung = min(
        gefaesse
          .filter((g) => g['platz_id'] === p['id'])
          .map((g) => ms(g['gueltig_von']))
          .filter((v) => !Number.isNaN(v) && (entferntAm === undefined || v > entferntAm)),
      );
      const kandidaten = [leerEv, ersteBelegung].filter((v): v is number => v !== undefined);
      const leerSeit = kandidaten.length > 0 ? Math.max(...kandidaten) : undefined;
      const loesung = letzter !== undefined && (leerSeit === undefined || letzter > leerSeit);
      return {
        platz_id: p['id'],
        fuellzustand: loesung ? 'loesung' : 'leer',
        letzter_ansatz: letzter === undefined ? null : new Date(letzter).toISOString(),
      };
    });
  return t;
}

// Plan 24 (Keimung prüfen): v_reservierung_aktiv, v_pflanzung_zustand (Status, Ort), v_keimrate und der Bündelteil
// ereignis_pflanzung wie die Sichten in supabase/migrations/20261103140000_datenmodell.sql. Zusätzlich zu
// sichtenNachrechnen(), damit bestehende Fixtures ohne Tabelle reservierung unverändert bleiben.

const EREIGNIS_PFLANZUNG = new Set(['keimung', 'abschluss', 'wiederherstellen']);
const ORTSEREIGNIS = new Set(['verschieben', 'umsetzen', 'tausch']);
const datenVon = (e: Zeile) => (e['daten'] ?? {}) as Record<string, unknown>;
const juengstes = (l: Zeile[]) => [...l].sort((a, b) => ms(b['gilt_ab']) - ms(a['gilt_ab']))[0];

/**
 * Rechnet die Sichten der Pflanzungen nach (verändert `t` und gibt es zurück):
 * - v_reservierung_aktiv aus der Tabelle reservierung (nur wenn vorhanden): Ende bei umsetzen oder abschluss
 *   keimt_nicht/ausfall ab gilt_ab der Reservierung, ausser ein wiederherstellen zeigt auf dieses Ereignis;
 * - v_pflanzung_zustand je nicht stornierter Pflanzung: Status aus dem jüngsten Abschluss (oder ernte ab) ohne
 *   Wiederherstellen, Ort aus dem jüngsten verschieben/umsetzen/tausch; ohne solche Ereignisse bleiben Status und
 *   Ort einer schon vorhandenen Zeile (Fixtures wie aufStation()), die Phase bleibt immer (Start keimung);
 * - v_keimrate je Packung: je Pflanzung die jüngste Keimung, nur mit keimtemp_eingehalten und nur in Anlagen mit
 *   Datenart echt; rate_geglaettet ab 10 Samen (gekeimt + 10 · Basis) / (gesät + 10), sonst Basis = Packung,
 *   sonst Standard der Art (ohne Begrenzung, die wendet src/domain an);
 * - ereignis_pflanzung: nicht stornierte Ereignisse keimung, abschluss, wiederherstellen (Bündelteil, Plan 24).
 */
export function pflanzSichtenNachrechnen(t: Teile): Teile {
  const ereignisse = (t['ereignis'] ?? []).filter(offen);
  const wieder = new Set(
    ereignisse.filter((e) => e['typ'] === 'wiederherstellen').map((e) => datenVon(e)['ereignis_id']),
  );
  const an = (pflanzungId: unknown) => ereignisse.filter((e) => e['pflanzung_id'] === pflanzungId);

  if (t['reservierung'])
    t['v_reservierung_aktiv'] = t['reservierung']
      .filter(offen)
      .filter(
        (r) =>
          !an(r['pflanzung_id']).some(
            (e) =>
              ms(e['gilt_ab']) >= ms(r['gilt_ab']) &&
              (e['typ'] === 'umsetzen' ||
                (e['typ'] === 'abschluss' &&
                  ['keimt_nicht', 'ausfall'].includes(String(datenVon(e)['grund'])))) &&
              !wieder.has(e['id']),
          ),
      )
      .map((r) => ({ ...r }));

  const alt = new Map((t['v_pflanzung_zustand'] ?? []).map((z) => [z['pflanzung_id'], z]));
  t['v_pflanzung_zustand'] = (t['pflanzung'] ?? []).filter(offen).map((pf) => {
    const vorher = alt.get(pf['id']);
    const eigene = an(pf['id']);
    const enden = eigene.filter(
      (e) => e['typ'] === 'abschluss' || (e['typ'] === 'ernte' && datenVon(e)['art'] === 'ab'),
    );
    const ab = juengstes(enden.filter((e) => !wieder.has(e['id'])));
    const ort = juengstes(eigene.filter((e) => ORTSEREIGNIS.has(String(e['typ']))));
    const status = ab
      ? ab['typ'] === 'ernte'
        ? 'geerntet'
        : String(datenVon(ab)['grund'])
      : enden.length > 0
        ? 'aktiv'
        : ((vorher?.['status'] as string | undefined) ?? 'aktiv');
    return {
      pflanzung_id: pf['id'],
      satz_id: pf['satz_id'],
      phase: vorher?.['phase'] ?? 'keimung',
      phase_seit: vorher?.['phase_seit'] ?? null,
      status,
      netztopf_id: ort ? (ort['netztopf_id'] ?? null) : (vorher?.['netztopf_id'] ?? null),
      platz_id: ort ? (datenVon(ort)['nach_platz_id'] ?? null) : (vorher?.['platz_id'] ?? null),
      loch_nr: ort ? (datenVon(ort)['nach_loch_nr'] ?? null) : (vorher?.['loch_nr'] ?? null),
    };
  });

  const pflanzungen = new Map((t['pflanzung'] ?? []).map((p) => [p['id'], p]));
  const saetze = new Map((t['satz'] ?? []).map((s) => [s['id'], s]));
  const plaetze = new Map((t['platz'] ?? []).map((p) => [p['id'], p]));
  const anlagen = new Map((t['anlage'] ?? []).map((a) => [a['id'], a]));
  const keimungen = ereignisse.filter((e) => e['typ'] === 'keimung');
  const gezaehlt = keimungen
    .filter((e) => datenVon(e)['keimtemp_eingehalten'] === true)
    .filter(
      (e) =>
        !keimungen.some(
          (n) => n['pflanzung_id'] === e['pflanzung_id'] && ms(n['gilt_ab']) > ms(e['gilt_ab']),
        ),
    )
    .flatMap((e) => {
      const satz = saetze.get(pflanzungen.get(e['pflanzung_id'])?.['satz_id']);
      const platz = plaetze.get(satz?.['anzuchtort_platz_id'] ?? satz?.['direktsaat_platz_id']);
      const anlage = anlagen.get(platz?.['anlage_id']);
      if (!satz || anlage?.['datenart'] !== 'echt') return [];
      return [
        {
          saatgut_id: satz['saatgut_id'],
          gesaet: Number(datenVon(e)['samen_gesaet']),
          gekeimt: Number(datenVon(e)['samen_gekeimt']),
        },
      ];
    });
  if (t['saatgut'])
    t['v_keimrate'] = t['saatgut'].filter(offen).flatMap((sg) => {
      const sorte = (t['sorte'] ?? []).find(
        (s) => s['sorte_id'] === sg['sorte_id'] && (s['gueltig_bis'] ?? null) === null,
      );
      if (!sorte) return [];
      const art = (t['art'] ?? []).find(
        (a) => a['art_id'] === sorte['art_id'] && (a['gueltig_bis'] ?? null) === null,
      );
      const basisRoh = sg['keimfaehigkeit_packung'] ?? art?.['standard_keimfaehigkeit'] ?? null;
      const basis = basisRoh === null ? null : Number(basisRoh);
      const eigene = gezaehlt.filter((k) => k.saatgut_id === sg['id']);
      const gesaet = eigene.reduce((a, k) => a + k.gesaet, 0);
      const gekeimt = eigene.reduce((a, k) => a + k.gekeimt, 0);
      const rate = gesaet >= 10 ? (basis === null ? null : (gekeimt + 10 * basis) / (gesaet + 10)) : basis;
      return [{ saatgut_id: sg['id'], gesaet, gekeimt, rate_geglaettet: rate }];
    });

  t['ereignis_pflanzung'] = ereignisse
    .filter((e) => EREIGNIS_PFLANZUNG.has(String(e['typ'])) && e['pflanzung_id'])
    .map((e) => ({ ...e }));
  return t;
}

/** Vorgang anwenden wie vorgangAnwenden() und zusätzlich die Sichten der Pflanzungen nachrechnen (Plan 24) */
export function pflanzVorgangAnwenden(teile: Teile, vorgang: Vorgang, jetzt: Date): Teile {
  return pflanzSichtenNachrechnen(vorgangAnwenden(teile, vorgang, jetzt));
}

// Plan 35 (Phasen nachführen und Phasenfragen): Phase der Pflanzungen und Bündelteil ereignis_satz wie die Sicht
// v_pflanzung_zustand in supabase/migrations/20261103140000_datenmodell.sql. Zusätzlich zu pflanzSichtenNachrechnen(),
// das die Phase einer vorhandenen Zeile stehen lässt; bestehende Fixtures bleiben unverändert.

/**
 * Rechnet nach (verändert `t` und gibt es zurück):
 * - v_pflanzung_zustand.phase und phase_seit je Zeile: daten.phase und gilt_ab der jüngsten nicht stornierten
 *   phase_antwort mit antwort ja am Satz der Pflanzung (nach gilt_ab), sonst keimung und null;
 * - ereignis_satz: nicht stornierte Ereignisse phase_antwort (Bündelteil, Plan 35).
 */
export function phaseNachrechnen(t: Teile): Teile {
  const antworten = (t['ereignis'] ?? []).filter(offen).filter((e) => e['typ'] === 'phase_antwort');
  for (const z of t['v_pflanzung_zustand'] ?? []) {
    const ja = juengstes(
      antworten.filter((e) => e['satz_id'] === z['satz_id'] && datenVon(e)['antwort'] === 'ja'),
    );
    z['phase'] = ja ? String(datenVon(ja)['phase']) : 'keimung';
    z['phase_seit'] = ja ? ja['gilt_ab'] : null;
  }
  t['ereignis_satz'] = antworten.map((e) => ({ ...e }));
  return t;
}

/**
 * Vorgang anwenden wie pflanzVorgangAnwenden() und zusätzlich die Phase nachrechnen (Plan 35). Neue Zeilen erhalten
 * client_zeit = jetzt (wie zeileVorbereiten() in schreiben()) und erfasst_am = jetzt (Standardwert der Datenbank).
 */
export function phasenVorgangAnwenden(teile: Teile, vorgang: Vorgang, jetzt: Date): Teile {
  const iso = jetzt.toISOString();
  const mitZeit: Vorgang = vorgang.map((s) =>
    s.art === 'neu' ? { ...s, felder: { client_zeit: iso, erfasst_am: iso, ...s.felder } } : s,
  );
  return phaseNachrechnen(pflanzVorgangAnwenden(teile, mitZeit, jetzt));
}
