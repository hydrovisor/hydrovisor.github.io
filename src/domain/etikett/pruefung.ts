// Gefässprüfung (R9.3, UC3 Prüfablauf, 05_masken.md 3.8; Plan 21): Stand aus den Ereignissen seit dem Anker,
// Vorgänge je Prüfschritt, Volumenvorschlag in Schritt 4 und die Aufgabe «Gefäss prüfen» (A7). Rein.
import { aenderungVorgang } from '../anlage/aendern.ts';
import {
  anlagenAus,
  ereignisseAm,
  gefaessAm,
  gefaessStatus,
  ms,
  nachKennung,
  plaetzeAus,
  zeilen,
  type Teile,
} from '../anlage/teile.ts';
import type { Schritt, Vorgang } from '../datenpfad/erfassung.ts';

export interface Pruefeintrag {
  schritt: number;
  ok: boolean;
  giltAb: string;
  volumenGezaehltL?: number;
}

export interface Pruefstand {
  naechsterSchritt: 1 | 2 | 3 | 4 | null;
  protokoll: Pruefeintrag[];
  geprueftAm?: string;
}

const maxVon = (l: number[]) => (l.length > 0 ? Math.max(...l) : undefined);

/** Anker wie v_gefaess_status: letztes gefaess_erfasst (sonst erste Belegung nach dem Entfernen), später Tausch */
function anker(teile: Teile, platzId: string): number {
  const ge = maxVon(ereignisseAm(teile, platzId, 'gefaess_erfasst').map((e) => ms(e.gilt_ab)));
  const le = maxVon(ereignisseAm(teile, platzId, 'entfernt').map((e) => ms(e.gilt_ab)));
  let erfasst = ge !== undefined && (le === undefined || ge >= le) ? ge : undefined;
  if (erfasst === undefined) {
    const von = zeilen<{ platz_id: string; gueltig_von?: string; storniert_am: string | null }>(
      teile,
      'gefaess',
    )
      .filter((g) => g.platz_id === platzId && g.storniert_am === null)
      .map((g) => ms(g.gueltig_von))
      .filter((v) => !Number.isNaN(v) && (le === undefined || v > le));
    erfasst = von.length > 0 ? Math.min(...von) : undefined;
  }
  const tausch = maxVon(
    ereignisseAm(teile, platzId, 'box_deckel_tausch')
      .map((e) => ms(e.gilt_ab))
      .filter((v) => erfasst === undefined || v >= erfasst),
  );
  return Math.max(erfasst ?? -Infinity, tausch ?? -Infinity);
}

export function pruefStand(teile: Teile, platzId: string): Pruefstand {
  const ab = anker(teile, platzId);
  const ereignisse = ereignisseAm(teile, platzId, 'gefaesspruefung').sort(
    (a, b) => ms(a.gilt_ab) - ms(b.gilt_ab),
  );
  const protokoll: Pruefeintrag[] = ereignisse.map((e) => {
    const d = (e.daten ?? {}) as { schritt?: number; ok?: boolean; volumen_gezaehlt_l?: number };
    const eintrag: Pruefeintrag = { schritt: Number(d.schritt), ok: d.ok === true, giltAb: e.gilt_ab };
    if (d.volumen_gezaehlt_l !== undefined) eintrag.volumenGezaehltL = Number(d.volumen_gezaehlt_l);
    return eintrag;
  });
  const seither = protokoll.filter((p) => ms(p.giltAb) >= ab && p.ok);
  const offen = ([1, 2, 3] as const).find((s) => !seither.some((p) => p.schritt === s));
  const schritt4 = seither.filter((p) => p.schritt === 4).at(-1);
  const stand: Pruefstand = { naechsterSchritt: offen ?? (schritt4 ? null : 4), protokoll };
  if (schritt4) stand.geprueftAm = schritt4.giltAb;
  return stand;
}

/** Schritt 1: getippte Kennung gegen die erwartete */
export function kennungPruefen(getippt: string, erwartet: string): { ok: boolean; text: string } {
  const ok = getippt.trim() === erwartet;
  return {
    ok,
    text: ok ? `Richtiges Gefäss: ${erwartet}` : `Etikett zeigt ${getippt.trim()}, erwartet ${erwartet}`,
  };
}

const ereignis = (id: string, platzId: string, daten: Record<string, unknown>, jetzt: Date): Schritt => ({
  art: 'neu',
  tabelle: 'ereignis',
  felder: {
    client_id: id,
    id,
    typ: 'gefaesspruefung',
    platz_id: platzId,
    gilt_ab: jetzt.toISOString(),
    daten,
  },
});

export function pruefschrittVorgang(
  platzId: string,
  schritt: 1 | 2 | 3,
  ok: boolean,
  id: string,
  jetzt: Date,
): Vorgang {
  return [ereignis(id, platzId, { schritt, ok }, jetzt)];
}

/** Vorschlag nur bei mehr als 10 % Abweichung, ganzzahlig in ml gerechnet (R9.3, G3) */
export function volumenVorschlag(
  gezaehltL: number,
  betriebsvolumenL: number,
): { volumenL: number; text: string } | undefined {
  const g = Math.round(gezaehltL * 1000);
  const b = Math.round(betriebsvolumenL * 1000);
  if (Math.abs(g - b) * 10 <= b) return undefined;
  return { volumenL: g / 1000, text: `Betriebsvolumen auf ${(g / 1000).toFixed(1)} l ändern` };
}

/** Schritt 4 (Kannenzählung beim ersten Neuansatz, A2): Ereignis und bei Übernahme eine neue Belegung */
export function pruefschritt4Vorgang(
  teile: Teile,
  platzId: string,
  gezaehltL: number,
  uebernehmen: boolean,
  ids: () => string,
  jetzt: Date,
): Vorgang {
  const schritte: Schritt[] = uebernehmen
    ? [...aenderungVorgang(teile, platzId, { betriebsvolumenL: gezaehltL }, ids, jetzt)]
    : [];
  schritte.push(ereignis(ids(), platzId, { schritt: 4, ok: true, volumen_gezaehlt_l: gezaehltL }, jetzt));
  return schritte;
}

export interface Pruefaufgabe {
  platzId: string;
  code: string;
  kennung: string;
  titel: 'Gefäss prüfen';
}

/** Gefässe «in Prüfung» echter Anlagen und der gewählten Anlagen (Datenart, 8.1 Regel 7), nach Code sortiert */
export function pruefAufgaben(teile: Teile, anlageIds: readonly string[] = []): Pruefaufgabe[] {
  const aufgaben: Pruefaufgabe[] = [];
  for (const anlage of anlagenAus(teile)) {
    if (anlage.datenart !== 'echt' && !anlageIds.includes(anlage.id)) continue;
    for (const p of plaetzeAus(teile, anlage.id).sort(nachKennung)) {
      if (p.rolle !== 'gefaess') continue;
      const g = gefaessAm(teile, p.id);
      if (g && gefaessStatus(teile, g.id) === 'in_pruefung')
        aufgaben.push({
          platzId: p.id,
          code: `${anlage.kuerzel}-${p.kennung}`,
          kennung: p.kennung,
          titel: 'Gefäss prüfen',
        });
    }
  }
  return aufgaben.sort((a, b) => a.code.localeCompare(b.code, 'de', { numeric: true }));
}
