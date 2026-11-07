// Nachfüllen im Rundgang (Plan 30; R4.9 DWC, Konstantpegel, Station; R4.10 Kratky belüftet; A13): Eingaben für
// nachfuellen() bzw. kratkyNachfuellen() aus rechnungEingaben() und der eben gespeicherten Rundgang-Messung, dazu der
// Vorgang «Nachgefüllt». Einheiten wie rechner.ts: EC in Hundertsteln, Volumen in Hundertsteln l, Mengen in Zehnteln
// ml. Rein; jetzt und Zeitzone als Parameter.
import { gefaessAm, gefaessmodell, zeilen } from '../anlage/teile.ts';
import type { Teile } from '../teile.ts';
import { rechnungEingaben } from '../abhakliste/rechnung.ts';
import type { AnsatzZeile } from '../bewertung/verlauf.ts';
import { bewertungsband } from '../bewertung/sollband.ts';
import type { Schritt, Vorgang } from '../datenpfad/erfassung.ts';
import type { Aufgabe } from '../aufgaben.ts';
import { KOMPONENTEN } from '../einstellungen/einstellungen.ts';
import {
  dosisSumme,
  gerundet,
  HERSTELLERDOSIS,
  mengenRoh,
  messmittelJe,
  neuansatz,
  type Dosis,
} from '../rechner.ts';
import { bruch } from '../rechner-zahlen.ts';
import {
  kratkyNachfuellen,
  messungFuerRechner,
  nachfuellen,
  type Fuellstand,
  type NachfuellErgebnis,
} from '../rechner-nachfuellen.ts';
import { ZEITZONE, type Zeitzone } from '../zeit.ts';

export interface MessungZeile {
  id: string;
  platz_id: string | null;
  gilt_ab: string;
  ansatz_id?: string | null;
  ec?: number | string | null;
  fuellstand?: string | null;
}

const hundertstel = (x: number | string | null | undefined) =>
  x === null || x === undefined || x === '' ? undefined : Math.round(Number(x) * 100);

/** Wahl «Wie viele Kannen?»: [1 … ⌈Betriebsvolumen / Kanne⌉], mindestens 1 (A13) */
export function kannenWahl(betriebsvolumenL: number, kannengroesseL: number): number[] {
  const n = Math.max(1, Math.ceil(Math.round(betriebsvolumenL * 100) / Math.round(kannengroesseL * 100)));
  return Array.from({ length: n }, (_, i) => i + 1);
}

/** Dosis und D_Ansatz der laufenden Belegung aus der Rechnung des Ansatzes (A) */
function dosisVon(teile: Teile, platzId: string, jetzt: Date, zeitzone: Zeitzone) {
  const r = rechnungEingaben(teile, platzId, jetzt, zeitzone);
  const ergebnis = neuansatz(r.eingabe);
  const dosis: Dosis = ergebnis.art === 'ergebnis' ? ergebnis.dosisHersteller : HERSTELLERDOSIS.wachstum;
  const dAnsatz = dosisSumme(ergebnis.art === 'ergebnis' ? ergebnis.dosisVerwendet : dosis);
  return { r, dosis, dAnsatz };
}

/** Nachfüllen DWC, Konstantpegel, Station mit `liter` Nachfüllwasser; EC1 aus der Messung desselben Tages (R4.9) */
export function nachfuellSchritt(
  teile: Teile,
  platzId: string,
  messung: MessungZeile,
  liter: number,
  jetzt: Date,
  zeitzone: Zeitzone,
): NachfuellErgebnis | { art: 'neue_messung_noetig' } {
  const ansaetze = zeilen<AnsatzZeile>(teile, 'naehrloesungsansatz');
  const m = messungFuerRechner(
    { platzId, messungen: [{ ...messung, ansatz_id: messung.ansatz_id ?? null }], ansaetze },
    jetzt,
    zeitzone,
  );
  const ec1 = hundertstel(messung.ec);
  if (m.art !== 'messung' || ec1 === undefined) return { art: 'neue_messung_noetig' };
  const { r, dosis, dAnsatz } = dosisVon(teile, platzId, jetzt, zeitzone);
  const band = r.eingabe.zielbereich ?? bewertungsband(teile, platzId, jetzt)?.ec;
  return nachfuellen({
    volumen: r.volumen,
    nachgefuellt: Math.round(liter * 100),
    ec1,
    ecWasser: r.eingabe.ecWasser,
    zielbereich: band ? { min: band.min, max: band.max } : { min: ec1, max: ec1 },
    k: r.eingabe.k,
    dosis,
    dAnsatz,
    istStation: r.eingabe.istStation,
    ueberHerstellerdosisBestaetigt: false,
  });
}

/** Kratky belüftet unter ⅓ (R4.10): «nur Wasser» oder halbe Konzentration, höchstens 2.5 cm */
export function kratkySchritt(
  teile: Teile,
  platzId: string,
  messung: MessungZeile,
  zeitzone: Zeitzone = ZEITZONE,
): ReturnType<typeof kratkyNachfuellen> {
  const g = gefaessAm(teile, platzId);
  const modell = g ? gefaessmodell(teile, g.gefaessmodell_id) : undefined;
  const band = bewertungsband(teile, platzId, new Date(messung.gilt_ab))?.ec;
  const fuellstand: Fuellstand = messung.fuellstand === 'unter_drittel' ? 'unter_drittel' : 'ueber_drittel';
  const { dAnsatz } = dosisVon(teile, platzId, new Date(messung.gilt_ab), zeitzone);
  return kratkyNachfuellen({
    fuellstand,
    ecIst: hundertstel(messung.ec) ?? 0,
    zielbereich: band ? { min: band.min, max: band.max } : { min: 0, max: Number.MAX_SAFE_INTEGER },
    dAnsatz,
    innenLMm: Number(modell?.innen_l_mm ?? 0),
    innenBMm: Number(modell?.innen_b_mm ?? 0),
  });
}

/**
 * Kratky mit halber Konzentration (R4.10): Mengen für `liter` Nachfüllwasser aus d = D_Ansatz / 2 und der Dosis der
 * Belegung, damit die Positionen den gegebenen Dünger tragen (Prüfer Runde 1 Befund 3); «nur Wasser» ohne Mengen.
 */
export function kratkyErgebnis(
  teile: Teile,
  platzId: string,
  messung: MessungZeile,
  liter: number,
  zeitzone: Zeitzone = ZEITZONE,
): NachfuellErgebnis | undefined {
  const k = kratkySchritt(teile, platzId, messung, zeitzone);
  if (k.art !== 'halbe_konzentration' || !(liter > 0)) return undefined;
  const { dosis } = dosisVon(teile, platzId, new Date(messung.gilt_ab), zeitzone);
  const mengen = gerundet(mengenRoh(bruch(k.dMlL), dosis, Math.round(liter * 100)));
  return {
    dMlL: k.dMlL,
    mengen,
    messmittel: messmittelJe(mengen),
    nurWasser: false,
    kontrolleFolgetag: false,
    hinweise: [],
  };
}

/**
 * «Nachgefüllt»: Ansatz `nachfuellen` mit nachgefuellt_l, volumen_l, war_faellig_am und aufgabe_schluessel, danach je
 * Komponente mit Menge eine Position (bezugsvolumen_l = nachgefüllte Liter). «Nur Wasser» ohne Positionen.
 */
export function nachfuellVorgang(
  e: { platzId: string; liter: number; ergebnis?: NachfuellErgebnis; aufgabe?: Aufgabe; volumenL: number },
  ids: () => string,
  jetzt: Date,
): Vorgang {
  if (!(e.liter > 0)) return [];
  const id = ids();
  const beginn = jetzt.toISOString();
  const kopf: Schritt = {
    art: 'neu',
    tabelle: 'naehrloesungsansatz',
    felder: {
      id,
      client_id: id,
      platz_id: e.platzId,
      typ: 'nachfuellen',
      begonnen_am: beginn,
      gilt_ab: beginn,
      nachgefuellt_l: e.liter,
      volumen_l: e.volumenL,
      ...(e.aufgabe ? { war_faellig_am: e.aufgabe.faelligAm, aufgabe_schluessel: e.aufgabe.schluessel } : {}),
    },
  };
  const positionen: Schritt[] =
    !e.ergebnis || e.ergebnis.nurWasser
      ? []
      : KOMPONENTEN.filter((c) => (e.ergebnis?.mengen[c] ?? 0) > 0).map((c) => {
          const pos = ids();
          const ml = (e.ergebnis?.mengen[c] ?? 0) / 10;
          return {
            art: 'neu',
            tabelle: 'ansatz_position',
            felder: {
              id: pos,
              client_id: pos,
              ansatz_id: id,
              produkt_id: c,
              soll_ml: ml,
              ist_ml: ml,
              bezugsvolumen_l: e.liter,
            },
          };
        });
  return [kopf, ...positionen];
}
