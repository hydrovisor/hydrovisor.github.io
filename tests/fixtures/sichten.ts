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
