// Maske «Gefäss» (UC1 Ablauf Maske «Gefäss», 05_masken.md 3.3; Plan 20): liest Kopf, Zustand, Hauptknopf und
// Verlauf aus dem Bündel, ohne neu zu rechnen (R2.5, Plan 20 A3, A4). Rein: jetzt und Zeitzone als Parameter.
import { laufendeAnsaetze } from '../abhakliste/folgen.ts';
import type { SchrittZeile } from '../abhakliste/stand.ts';
import type { AnsatzZeile } from '../bewertung/verlauf.ts';
import { deckelBelegung, type DeckelLoch } from '../pflanzung/topf.ts';
import { messFaelligkeit } from '../messung/faelligkeit.ts';
import { ortAufloesen } from '../ort.ts';
import { pruefStand } from '../etikett/pruefung.ts';
import { kalendertag, tagKurz, tageZwischen, uhrzeit, type Zeitzone } from '../zeit.ts';
import { keimungOffen } from '../pflanzung/keimung.ts';
import { wiederherstellbar } from './entfernen.ts';
import { anzuchtortAm, ereignisseAm, gefaessAm, gefaessStatus, ms, zeilen, type Teile } from './teile.ts';
import { fuellText, statusBadge } from './uebersicht.ts';

export type Ton = 'ok' | 'warn' | 'danger';

export interface Gefaessansicht {
  code: string;
  kennung: string;
  kuerzel: string;
  rolle: 'gefaess' | 'anzuchtort' | 'messstelle' | 'lager';
  /** «DWC · 9 l» oder «Anzuchtbox hell» */
  merkmale: string;
  pruefstatus?: string;
  loesung?: string;
  zielbereich?: { ph: string; ec: string; temp: string; quelle: 'Ansatz' | 'Messung' };
  letzteMessung?: {
    wann: string;
    werte: string;
    ton?: Ton;
    unsicher: boolean;
    trend?: string;
  };
  /** keimung: Knopf «Keimung prüfen» je Satz in der Anzuchtbox oder im Direktsaat-Gefäss (Plan 24 A12) */
  pflanzen: {
    satzId: string;
    sorte: string;
    anzahl: number;
    phase: string;
    seitTagen: number;
    keimung?: boolean;
    /** Plan 33: Knopf «Umsetzen» je Satzzeile auf einer Station */
    umsetzen?: true;
  }[];
  /** Plan 33: Deckel mit Töpfen, Belegung, fremden und abwesenden Töpfen */
  deckel: DeckelLoch[];
  /** Plan 33 (R2.2): «Zielbereich aus Pflanzen: pH 5.8–6.3 · EC 1.0–1.4 · 2 Pflanzen» aus v_zielbereich */
  zielbereichPflanzen?: string;
  dosis: { komponente: string; mlProL: string }[];
  hauptknopf?: { text: string; code: string };
  /** Plan 21: Nebenknöpfe «Prüfen», «Ändern», «Leeren» (nur bei Lösung), «Wiederherstellen» (bis 7 Tage) */
  nebenknoepfe: {
    art: 'pruefen' | 'aendern' | 'leeren' | 'wiederherstellen' | 'saeen' | 'wechseln';
    text: string;
  }[];
  /** «Gefäss 2.3 entfernt am 10.12.» (R9.2) */
  entfernt?: string;
  verlauf: {
    tag: string;
    zeit: string;
    ph: string;
    ec: string;
    temp: string;
    /** Füllstand bei Kratky («über ⅓», «unter ⅓»), sonst «–» */
    fuellstand: string;
    marker: string[];
  }[];
}

const BETRIEBSART: Record<string, string> = {
  dwc: 'DWC',
  konstantpegel: 'Konstantpegel',
  kratky_belueftet: 'Kratky belüftet',
  kratky: 'Kratky',
};

/** Name der Betriebsart wie im Kopf der Maske «Gefäss» (auch auf dem Etikett, Plan 22) */
export const betriebsartName = (betriebsart: string): string => BETRIEBSART[betriebsart] ?? betriebsart;
const PHASE: Record<string, string> = {
  keimung: 'Keimung',
  anzucht: 'Anzucht',
  wachstum: 'Wachstum',
  bluete: 'Blüte',
  fruchtbildung_reife: 'Fruchtbildung und Reife',
};
const TON: Record<string, Ton> = { gruen: 'ok', knapp: 'warn', ausserhalb: 'danger' };
const RANG: Record<Ton, number> = { ok: 0, warn: 1, danger: 2 };
const WOCHENTAG = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

const zahl = (w: unknown, stellen: number) =>
  w === null || w === undefined || w === '' ? '–' : Number(w).toFixed(stellen);
const band = (min: unknown, max: unknown, stellen: number) =>
  min === undefined || max === undefined ? '–' : `${zahl(min, stellen)}–${zahl(max, stellen)}`;

interface Messzeile {
  id: string;
  platz_id: string | null;
  ph: number | string | null;
  ec: number | string | null;
  temperatur: number | string | null;
  fuellstand: string | null;
  bewertung_ph: string | null;
  bewertung_ec: string | null;
  bewertung_temp: string | null;
  schnappschuss?: { zielbereich?: Record<string, number> };
  gilt_ab: string;
  storniert_am: string | null;
}
interface Ansatzzeile {
  id: string;
  platz_id: string;
  begonnen_am: string;
  typ: string;
  status?: string;
  schnappschuss?: { zielbereich?: Record<string, number> };
  storniert_am: string | null;
}

const BASIS_TYPEN = new Set(['neuansatz', 'teilwechsel']);
const FUELLSTAND: Record<string, string> = { ueber_drittel: 'über ⅓', unter_drittel: 'unter ⅓' };
const ANSATZ_MARKER: Record<string, string> = {
  neuansatz: 'Ansatz',
  teilwechsel: 'Teilwechsel',
  nachfuellen: 'nachgefüllt',
  ph_korrektur: 'pH-Korrektur',
};

interface OrtsEreignis {
  id: string;
  typ: string;
  netztopf_id: string | null;
  pflanzung_id: string | null;
  daten?: Record<string, unknown> | null;
  gilt_ab: string;
  storniert_am: string | null;
}

/** Plan 33: Marker «Tausch 2.3.1 ↔ 2.3.4», «Umgesetzt aus 4.4: 5», «Verschoben 2.3.1 auf 2.1.5» am Platz */
function ortsMarker(teile: Teile, platzId: string): { zeit: Date; marker: string[] }[] {
  const kennung = new Map(
    zeilen<{ id: string; kennung: string }>(teile, 'platz').map((p) => [p.id, p.kennung]),
  );
  const topf = new Map(
    zeilen<{ id: string; kennung: string }>(teile, 'netztopf').map((n) => [n.id, n.kennung]),
  );
  const gesehen = new Set<string>();
  const ereignisse = [
    ...zeilen<OrtsEreignis>(teile, 'ereignis_pflanzung'),
    ...zeilen<OrtsEreignis>(teile, 'ereignis'),
  ].filter((e) => {
    if (e.storniert_am !== null || gesehen.has(e.id)) return false;
    gesehen.add(e.id);
    return e.typ === 'tausch' || e.typ === 'umsetzen' || e.typ === 'verschieben';
  });
  const d = (e: OrtsEreignis) => e.daten ?? {};
  const ergebnis: { zeit: Date; marker: string[] }[] = [];
  // Tausch: je vorgang_id ein Marker, wenn ein Topf hier stand
  const tausch = new Map<string, OrtsEreignis[]>();
  for (const e of ereignisse.filter((x) => x.typ === 'tausch')) {
    const k = String(d(e)['vorgang_id'] ?? e.id);
    tausch.set(k, [...(tausch.get(k) ?? []), e]);
  }
  for (const gruppe of tausch.values()) {
    if (!gruppe.some((e) => d(e)['von_platz_id'] === platzId || d(e)['nach_platz_id'] === platzId)) continue;
    const namen = gruppe.map((e) => topf.get(e.netztopf_id ?? '') ?? '?');
    ergebnis.push({ zeit: new Date(gruppe[0]?.gilt_ab ?? 0), marker: [`Tausch ${namen.join(' ↔ ')}`] });
  }
  // Umsetzen hierher: je Herkunft und Zeitpunkt die Zahl der Sämlinge
  const umsetzen = new Map<string, OrtsEreignis[]>();
  for (const e of ereignisse.filter((x) => x.typ === 'umsetzen' && d(x)['nach_platz_id'] === platzId)) {
    const k = `${String(d(e)['von_platz_id'])}|${e.gilt_ab}`;
    umsetzen.set(k, [...(umsetzen.get(k) ?? []), e]);
  }
  for (const gruppe of umsetzen.values()) {
    const erstes = gruppe[0];
    if (!erstes) continue;
    ergebnis.push({
      zeit: new Date(erstes.gilt_ab),
      marker: [`Umgesetzt aus ${kennung.get(String(d(erstes)['von_platz_id'])) ?? '?'}: ${gruppe.length}`],
    });
  }
  // Verschieben eines Topfs mit Pflanzung von hier weg
  for (const e of ereignisse.filter(
    (x) => x.typ === 'verschieben' && x.netztopf_id && x.pflanzung_id && d(x)['von_platz_id'] === platzId,
  ))
    ergebnis.push({
      zeit: new Date(e.gilt_ab),
      marker: [
        `Verschoben ${topf.get(e.netztopf_id ?? '') ?? '?'} auf ${kennung.get(String(d(e)['nach_platz_id'])) ?? '?'}.${String(d(e)['nach_loch_nr'])}`,
      ],
    });
  return ergebnis;
}

function tagText(zeitpunkt: Date, zeitzone: Zeitzone): string {
  const tag = kalendertag(zeitpunkt, zeitzone);
  const [j, m, d] = tag.split('-').map(Number) as [number, number, number];
  return `${WOCHENTAG[new Date(Date.UTC(j, m - 1, d)).getUTCDay()]} ${d}.${m}.`;
}

export function gefaessAnsicht(
  teile: Teile,
  code: string,
  jetzt: Date,
  zeitzone: Zeitzone,
): Gefaessansicht | undefined {
  const ort = ortAufloesen(code, (teile ?? {}) as Record<string, readonly unknown[]>);
  if (!ort) return undefined;
  const kuerzel = code.slice(0, code.length - ort.kennung.length - 1);
  const g = gefaessAm(teile, ort.platzId);
  const box = anzuchtortAm(teile, ort.platzId);

  const messungen = zeilen<Messzeile>(teile, 'messung')
    .filter((m) => m.platz_id === ort.platzId && m.storniert_am === null)
    .sort((a, b) => Date.parse(b.gilt_ab) - Date.parse(a.gilt_ab));
  const unsicher = new Set(
    zeilen<{ messung_id: string }>(teile, 'v_messung_unsicher').map((u) => u.messung_id),
  );
  const ansaetze = zeilen<Ansatzzeile>(teile, 'naehrloesungsansatz')
    .filter((a) => a.platz_id === ort.platzId && a.storniert_am === null)
    .sort((a, b) => Date.parse(b.begonnen_am) - Date.parse(a.begonnen_am));
  // letzter Ansatz für den Verlauf; Zielbereich und Dosis aus dem letzten nicht abgebrochenen Neuansatz oder
  // Teilwechsel, wie v_fuellzustand (Runde 1, Befund 4)
  const ansatz = ansaetze[0];
  // Basis nur abgeschlossene Ansätze: ein laufender Wechsel ist noch nicht die Lösung im Gefäss (Plan 29 Risiko 6)
  const basis = ansaetze.find((a) => BASIS_TYPEN.has(a.typ) && a.status === 'abgeschlossen');

  const ansicht: Gefaessansicht = {
    code,
    kennung: ort.kennung,
    kuerzel,
    rolle: ort.rolle,
    merkmale: g
      ? `${BETRIEBSART[g.betriebsart] ?? g.betriebsart} · ${zahl(g.betriebsvolumen_l, 1).replace(/\.0$/, '')} l`
      : box
        ? box.typ === 'box_dunkel'
          ? 'Anzuchtbox dunkel'
          : 'Anzuchtbox hell'
        : ort.rolle === 'messstelle'
          ? 'Messstelle Leitungswasser'
          : 'kein Gefäss',
    pflanzen: [],
    deckel: g ? deckelBelegung(teile, ort.platzId) : [],
    dosis: [],
    verlauf: [],
    nebenknoepfe: [],
  };

  if (g) {
    const roh = gefaessStatus(teile, g.id);
    const status = statusBadge(roh);
    if (status) ansicht.pruefstatus = status;
    // in Betrieb: Tag von Prüfschritt 4 (Plan 21)
    const geprueft = roh === 'in_betrieb' ? pruefStand(teile, ort.platzId).geprueftAm : undefined;
    if (geprueft)
      ansicht.pruefstatus = `in Betrieb, geprüft am ${tagKurz(kalendertag(new Date(geprueft), zeitzone))}`;
    const fuellNeben = zeilen<{ platz_id: string; fuellzustand: string }>(teile, 'v_fuellzustand').find(
      (f) => f.platz_id === ort.platzId,
    )?.fuellzustand;
    if (roh === 'entfernt') {
      const am = ereignisseAm(teile, ort.platzId, 'entfernt').sort(
        (a, b) => ms(b.gilt_ab) - ms(a.gilt_ab),
      )[0];
      if (am) {
        ansicht.entfernt = `Gefäss ${ort.kennung} entfernt am ${tagKurz(kalendertag(new Date(am.gilt_ab), zeitzone))}`;
        if (wiederherstellbar(am.gilt_ab, jetzt, zeitzone))
          ansicht.nebenknoepfe.push({ art: 'wiederherstellen', text: 'Wiederherstellen' });
      }
    } else {
      if (roh === 'in_pruefung') ansicht.nebenknoepfe.push({ art: 'pruefen', text: 'Prüfen' });
      // Plan 29: Lösungswechsel mit der Abhakliste, auch an Stationen (R4.5); bei laufendem Wechsel «Wechsel fortsetzen»
      if (roh === 'in_betrieb' || roh === 'in_betrieb_volumen_offen') {
        const laufend = laufendeAnsaetze(
          zeilen<AnsatzZeile>(teile, 'naehrloesungsansatz'),
          zeilen<SchrittZeile & { ansatz_id: string }>(teile, 'ansatz_schritt'),
        ).some((l) => l.platzId === ort.platzId);
        ansicht.nebenknoepfe.push({
          art: 'wechseln',
          text: laufend ? 'Wechsel fortsetzen' : 'Lösung wechseln',
        });
      }
      ansicht.nebenknoepfe.push({ art: 'aendern', text: 'Ändern' });
      if (fuellNeben === 'loesung') ansicht.nebenknoepfe.push({ art: 'leeren', text: 'Leeren' });
      // Plan 23: Säen in Gefässe ohne feste Dosis (UC5 Auslöser)
      if (!g.feste_dosis) ansicht.nebenknoepfe.push({ art: 'saeen', text: 'Säen' });
    }
    const fuell = zeilen<{ platz_id: string; fuellzustand: string; letzter_ansatz: string | null }>(
      teile,
      'v_fuellzustand',
    ).find((f) => f.platz_id === ort.platzId);
    ansicht.loesung = fuellText(fuell, g.intervall_wechseln_d, jetzt, zeitzone);
  }

  // Plan 23: eine Anzuchtbox zeigt «Säen» (05 Abschnitt 2)
  if (box) ansicht.nebenknoepfe.push({ art: 'saeen', text: 'Säen' });

  // Zielbereich aus dem Schnappschuss des letzten Ansatzes, sonst der letzten Messung (R2.5, A3)
  const zAnsatz = basis?.schnappschuss?.zielbereich;
  const zMessung = messungen.find((m) => m.schnappschuss?.zielbereich)?.schnappschuss?.zielbereich;
  const z = zAnsatz ?? zMessung;
  if (z)
    ansicht.zielbereich = {
      ph: band(z['ph_min'], z['ph_max'], 1),
      ec: band(z['ec_min'], z['ec_max'], 1),
      temp: band(z['temp_min'], z['temp_max'], 0),
      quelle: zAnsatz ? 'Ansatz' : 'Messung',
    };

  // Zielbereich aus den Pflanzen (R2.2) neben dem Schnappschuss (R2.5)
  const zp = zeilen<{
    platz_id: string;
    ph_min: unknown;
    ph_max: unknown;
    ec_min: unknown;
    ec_max: unknown;
    zaehlende_pflanzungen: number | string;
  }>(teile, 'v_zielbereich').find((r) => r.platz_id === ort.platzId);
  const zaehlend = Number(zp?.zaehlende_pflanzungen ?? 0);
  if (zp && zaehlend > 0)
    ansicht.zielbereichPflanzen = `Zielbereich aus Pflanzen: pH ${band(zp.ph_min, zp.ph_max, 1)} · EC ${band(zp.ec_min, zp.ec_max, 1)} · ${zaehlend} ${zaehlend === 1 ? 'Pflanze' : 'Pflanzen'}`;

  const letzte = messungen[0];
  if (letzte) {
    const toene = [letzte.bewertung_ph, letzte.bewertung_ec, letzte.bewertung_temp]
      .map((b) => (b ? TON[b] : undefined))
      .filter((t): t is Ton => t !== undefined);
    const ton = toene.sort((a, b) => RANG[b] - RANG[a])[0];
    const vorher = messungen[1];
    const zeit = new Date(letzte.gilt_ab);
    ansicht.letzteMessung = {
      wann: `${tagText(zeit, zeitzone)} ${uhrzeit(zeit, zeitzone)}`,
      werte: `pH ${zahl(letzte.ph, 2)} · EC ${zahl(letzte.ec, 2)} · ${zahl(letzte.temperatur, 1)} °C`,
      unsicher: unsicher.has(letzte.id),
      ...(ton ? { ton } : {}),
      ...(vorher ? { trend: `vorher pH ${zahl(vorher.ph, 2)} · EC ${zahl(vorher.ec, 2)}` } : {}),
    };
  }

  // Pflanzen am Platz: je Satz Anzahl, Phase und Tage seit der Saat (Pflanzdauer, A3). Ohne Ortsereignis ist
  // platz_id leer, die Pflanzung steht dann am Anzuchtort oder im Direktsaat-Gefäss des Satzes (Runde 1, Befund 3)
  const saetze = zeilen<{
    id: string;
    sorte_id: string;
    saatdatum: string;
    anzuchtort_platz_id: string | null;
    direktsaat_platz_id: string | null;
    storniert_am: string | null;
  }>(teile, 'satz');
  const satzOrt = new Map(saetze.map((s) => [s.id, s.anzuchtort_platz_id ?? s.direktsaat_platz_id]));
  const zustaende = zeilen<{
    pflanzung_id: string;
    satz_id: string;
    phase: string;
    status: string;
    platz_id: string | null;
  }>(teile, 'v_pflanzung_zustand').filter(
    (p) => p.status === 'aktiv' && (p.platz_id ?? satzOrt.get(p.satz_id)) === ort.platzId,
  );
  const sorten = zeilen<{ sorte_id: string; name: string }>(teile, 'sorte');
  const heute = kalendertag(jetzt, zeitzone);
  for (const satzId of [...new Set(zustaende.map((p) => p.satz_id))]) {
    const satz = saetze.find((s) => s.id === satzId && s.storniert_am === null);
    if (!satz) continue;
    const hier = zustaende.filter((p) => p.satz_id === satzId);
    ansicht.pflanzen.push({
      satzId,
      sorte: sorten.find((s) => s.sorte_id === satz.sorte_id)?.name ?? 'Sorte',
      anzahl: hier.length,
      phase: PHASE[hier[0]?.phase ?? ''] ?? hier[0]?.phase ?? '',
      seitTagen: tageZwischen(satz.saatdatum, heute),
      // nur gesetzt, wenn wahr (Vergleiche bestehender Tests auf die ganze Zeile)
      ...(satzOrt.get(satzId) === ort.platzId && keimungOffen(teile, satzId, jetzt, zeitzone)
        ? { keimung: true }
        : {}),
      ...(g?.feste_dosis ? { umsetzen: true as const } : {}),
    });
  }

  // Dosis je Komponente aus den Positionen des letzten Neuansatzes oder Teilwechsels (EK3, A3)
  if (basis) {
    const produkte = new Map(
      zeilen<{ produkt_id: string; name: string }>(teile, 'produkt').map((p) => [p.produkt_id, p.name]),
    );
    const summe = new Map<string, number>();
    for (const pos of zeilen<{
      ansatz_id: string;
      produkt_id: string;
      soll_ml: number | string;
      ist_ml: number | string | null;
      bezugsvolumen_l: number | string;
      storniert_am: string | null;
    }>(teile, 'ansatz_position')) {
      if (pos.ansatz_id !== basis.id || pos.storniert_am !== null || pos.produkt_id === 'ph_minus') continue;
      // Summe je Produkt: die Restdosis ergibt eine zweite Position (Plan 29 A10, Risiko 6)
      const ml = Number(pos.ist_ml ?? pos.soll_ml) / Number(pos.bezugsvolumen_l);
      summe.set(pos.produkt_id, (summe.get(pos.produkt_id) ?? 0) + ml);
    }
    for (const [produkt, ml] of summe)
      ansicht.dosis.push({ komponente: produkte.get(produkt) ?? produkt, mlProL: ml.toFixed(2) });
  }

  // Hauptknopf: bis zur Aufgaben-Rechnung die Messfälligkeit (A4); Anzuchtbox ohne Knopf (A6)
  if (ort.rolle === 'messstelle') ansicht.hauptknopf = { text: 'Messen', code };
  else if (g) {
    const fuell = zeilen<{ platz_id: string; fuellzustand: 'leer' | 'loesung' }>(
      teile,
      'v_fuellzustand',
    ).find((f) => f.platz_id === ort.platzId)?.fuellzustand;
    const status = gefaessStatus(teile, g.id);
    const f = messFaelligkeit(
      {
        platzId: ort.platzId,
        intervallMessenD: g.intervall_messen_d,
        ...(fuell ? { fuellzustand: fuell } : {}),
        ...(status ? { status } : {}),
      },
      messungen,
      jetzt,
      zeitzone,
    );
    ansicht.hauptknopf = { text: f.art === 'offen' && f.faellig ? 'Jetzt: Messen' : 'Messen', code };
  }

  // Verlauf als Zahlenreihe, neueste zuerst, mit Ereignismarkern «Ansatz» oder «nachgefüllt» und «unsicher»
  const eintraege = messungen.map((m) => ({
    zeit: new Date(m.gilt_ab),
    ph: zahl(m.ph, 2),
    ec: zahl(m.ec, 2),
    temp: zahl(m.temperatur, 1),
    fuellstand: m.fuellstand ? (FUELLSTAND[m.fuellstand] ?? m.fuellstand) : '–',
    marker: unsicher.has(m.id) ? ['unsicher'] : [],
  }));
  for (const a of [ansatz, basis].filter(
    (x, k, l): x is Ansatzzeile => x !== undefined && l.indexOf(x) === k,
  ))
    eintraege.push({
      zeit: new Date(a.begonnen_am),
      ph: '–',
      ec: '–',
      temp: '–',
      fuellstand: '–',
      marker: [ANSATZ_MARKER[a.typ] ?? 'Ansatz'],
    });
  for (const m of ortsMarker(teile, ort.platzId))
    eintraege.push({ ...m, ph: '–', ec: '–', temp: '–', fuellstand: '–' });
  ansicht.verlauf = eintraege
    .sort((a, b) => b.zeit.getTime() - a.zeit.getTime())
    .map(({ zeit, ...rest }) => ({ tag: tagText(zeit, zeitzone), zeit: uhrzeit(zeit, zeitzone), ...rest }));
  return ansicht;
}
