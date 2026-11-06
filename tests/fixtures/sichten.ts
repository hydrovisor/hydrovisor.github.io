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

// Plan 33 (Umsetzen einfach): zusätzlich v_netztopf_platz, v_zielbereich, die Phase aus phase_antwort am Satz, der Cache
// reservierung.umsetzen_geplant_am (wie cache_aus_ereignis()), die neuen Typen im Bündelteil ereignis_pflanzung und der
// Bündelteil ereignis_platz mit kurzpruefung. Additiv: pflanzSichtenNachrechnen() bleibt unverändert.

const EREIGNIS_PFLANZUNG_UMSETZEN = new Set([
  ...EREIGNIS_PFLANZUNG,
  'verschieben',
  'umsetzen',
  'tausch',
  'umsetzdatum_geaendert',
  'ernte',
]);
const EREIGNIS_PLATZ = new Set([
  'gefaess_erfasst',
  'gefaesspruefung',
  'box_deckel_tausch',
  'entfernt',
  'geleert',
  'ruhe',
  'kurzpruefung',
]);
const zahlOderNull = (w: unknown) => (w === null || w === undefined || w === '' ? null : Number(w));
/** jüngstes nach gilt_ab; bei gleichem gilt_ab das zuletzt erfasste (Reihenfolge im Teil) */
const letztes = (l: Zeile[]) =>
  l.reduce<Zeile | undefined>((a, e) => (!a || ms(e['gilt_ab']) >= ms(a['gilt_ab']) ? e : a), undefined);
const maxVon = (l: (number | null)[]) => {
  const w = l.filter((x): x is number => x !== null);
  return w.length > 0 ? Math.max(...w) : null;
};
const minVon = (l: (number | null)[]) => {
  const w = l.filter((x): x is number => x !== null);
  return w.length > 0 ? Math.min(...w) : null;
};

/**
 * Rechnet nach pflanzSichtenNachrechnen() die Sichten für Umsetzen, Verschieben und Tausch nach (verändert `t`):
 * - reservierung.umsetzen_geplant_am je aktiver Reservierung aus dem letzten umsetzdatum_geaendert der Pflanzung
 *   oder ihres Satzes (daten.nach), sonst umsetzen_vorgabe_am; fehlt der Wert in einer neuen Zeile, gilt die Vorgabe;
 * - v_pflanzung_zustand.phase und phase_seit aus der letzten phase_antwort {antwort: ja} am Satz (sonst wie bisher);
 * - v_netztopf_platz je aktivem Topf: letztes verschieben/umsetzen/tausch mit netztopf_id, sonst Heimplatz;
 *   ausser_heim, wenn Platz oder Loch vom Heim abweichen;
 * - v_zielbereich je Gefäss (rolle gefaess): aktive Pflanzungen mit aktuellem Platz (sonst Direktsaat-Gefäss), je
 *   Phase pH, EC (Basis zuwachs + ECWasser der Anlage) und Wassertemperatur aus v_sollwert; max der Minima, min der
 *   Maxima, zaehlende_pflanzungen;
 * - ereignis_pflanzung: zusätzlich verschieben, umsetzen, tausch, umsetzdatum_geaendert, ernte;
 * - ereignis_platz: nicht stornierte Platz-Ereignisse des Bündelteils, dazu kurzpruefung.
 */
export function umsetzSichtenNachrechnen(t: Teile): Teile {
  pflanzSichtenNachrechnen(t);
  const ereignisse = (t['ereignis'] ?? []).filter(offen);
  const pflanzungen = new Map((t['pflanzung'] ?? []).map((p) => [p['id'], p]));

  if (t['reservierung']) {
    for (const r of t['reservierung']) r['umsetzen_geplant_am'] ??= r['umsetzen_vorgabe_am'];
    const aktiv = new Set((t['v_reservierung_aktiv'] ?? []).map((r) => r['id']));
    for (const r of t['reservierung']) {
      if (!offen(r) || !aktiv.has(r['id'])) continue;
      const satzId = pflanzungen.get(r['pflanzung_id'])?.['satz_id'];
      const e = letztes(
        ereignisse.filter(
          (x) =>
            x['typ'] === 'umsetzdatum_geaendert' &&
            (x['pflanzung_id'] === r['pflanzung_id'] ||
              ((x['pflanzung_id'] ?? null) === null && satzId !== undefined && x['satz_id'] === satzId)),
        ),
      );
      r['umsetzen_geplant_am'] = e ? String(datenVon(e)['nach']) : r['umsetzen_vorgabe_am'];
    }
    pflanzSichtenNachrechnen(t);
  }

  const alle = t['ereignis'] ?? [];
  for (const z of t['v_pflanzung_zustand'] ?? []) {
    // nach einem Storno (Rückgängig) wie die Sicht: ohne gültiges Ende aktiv, ohne gültiges Ortsereignis ohne Ort
    const eigene = alle.filter((e) => e['pflanzung_id'] === z['pflanzung_id']);
    const enden = eigene.filter(
      (e) => e['typ'] === 'abschluss' || (e['typ'] === 'ernte' && datenVon(e)['art'] === 'ab'),
    );
    if (enden.length > 0 && !enden.some(offen)) z['status'] = 'aktiv';
    const orte = eigene.filter((e) => ORTSEREIGNIS.has(String(e['typ'])));
    if (orte.length > 0 && !orte.some(offen)) {
      z['platz_id'] = null;
      z['loch_nr'] = null;
      z['netztopf_id'] = null;
    }
    const ph = letztes(
      ereignisse.filter(
        (e) =>
          e['typ'] === 'phase_antwort' && e['satz_id'] === z['satz_id'] && datenVon(e)['antwort'] === 'ja',
      ),
    );
    if (ph) {
      z['phase'] = datenVon(ph)['phase'];
      z['phase_seit'] = ph['gilt_ab'];
    }
  }

  t['v_netztopf_platz'] = (t['netztopf'] ?? [])
    .filter((n) => offen(n) && n['aktiv'] !== false)
    .map((n) => {
      const o = letztes(
        ereignisse.filter((e) => e['netztopf_id'] === n['id'] && ORTSEREIGNIS.has(String(e['typ']))),
      );
      const platz = o ? (datenVon(o)['nach_platz_id'] ?? n['heim_platz_id']) : n['heim_platz_id'];
      const loch = o ? (zahlOderNull(datenVon(o)['nach_loch_nr']) ?? n['heim_loch_nr']) : n['heim_loch_nr'];
      return {
        netztopf_id: n['id'],
        kennung: n['kennung'],
        platz_id: platz,
        loch_nr: loch,
        ausser_heim: platz !== n['heim_platz_id'] || Number(loch) !== Number(n['heim_loch_nr']),
      };
    });

  const saetze = new Map((t['satz'] ?? []).map((s) => [s['id'], s]));
  const plaetze = new Map((t['platz'] ?? []).map((p) => [p['id'], p]));
  const anlagen = new Map((t['anlage'] ?? []).map((a) => [a['id'], a]));
  const sollwert = (sorteId: unknown, phase: unknown, groesse: string) =>
    (t['v_sollwert'] ?? []).find(
      (s) => s['sorte_id'] === sorteId && s['phase'] === phase && s['groesse'] === groesse,
    );
  const gruppen = new Map<unknown, Zeile[]>();
  for (const z of t['v_pflanzung_zustand'] ?? []) {
    if (z['status'] !== 'aktiv') continue;
    const satz = saetze.get(z['satz_id']);
    const platzId = z['platz_id'] ?? satz?.['direktsaat_platz_id'] ?? null;
    const platz = plaetze.get(platzId);
    if (!satz || !platz || platz['rolle'] !== 'gefaess') continue;
    gruppen.set(platzId, [...(gruppen.get(platzId) ?? []), { ...z, sorte_id: satz['sorte_id'] }]);
  }
  t['v_zielbereich'] = [...gruppen.entries()].map(([platzId, zz]) => {
    const anlage = anlagen.get(plaetze.get(platzId)?.['anlage_id']);
    const ecWasser = Number(anlage?.['ec_wasser_annahme'] ?? 0.5);
    const werte = (groesse: string, feld: 'wert_min' | 'wert_max') =>
      zz.map((z) => {
        const s = sollwert(z['sorte_id'], z['phase'], groesse);
        const w = zahlOderNull(s?.[feld]);
        return w !== null && groesse === 'ec' && s?.['ec_basis_quelle'] === 'zuwachs' ? w + ecWasser : w;
      });
    return {
      platz_id: platzId,
      ph_min: maxVon(werte('ph', 'wert_min')),
      ph_max: minVon(werte('ph', 'wert_max')),
      ec_min: maxVon(werte('ec', 'wert_min')),
      ec_max: minVon(werte('ec', 'wert_max')),
      temp_min: maxVon(werte('wassertemp', 'wert_min')),
      temp_max: minVon(werte('wassertemp', 'wert_max')),
      zaehlende_pflanzungen: zz.length,
    };
  });

  t['ereignis_pflanzung'] = ereignisse
    .filter((e) => EREIGNIS_PFLANZUNG_UMSETZEN.has(String(e['typ'])) && e['pflanzung_id'])
    .map((e) => ({ ...e }));
  t['ereignis_platz'] = ereignisse
    .filter((e) => EREIGNIS_PLATZ.has(String(e['typ'])) && e['platz_id'])
    .map((e) => ({ ...e }));
  return t;
}

/** Vorgang anwenden wie vorgangAnwenden() und die Sichten für Umsetzen und Verschieben nachrechnen (Plan 33) */
export function umsetzVorgangAnwenden(teile: Teile, vorgang: Vorgang, jetzt: Date): Teile {
  return umsetzSichtenNachrechnen(vorgangAnwenden(teile, vorgang, jetzt));
}
