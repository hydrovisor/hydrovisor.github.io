// Auflösung eines Etikett-Codes (R9.2, UC14-AK2, Plan 22): rein aus dem Bündel, ohne Netz (TO1). Aktiver Platz der
// Anlage mit der Kennung, sonst «entfernt am …», sonst «Etikett nicht bekannt». Jeder Aufruf schreibt eine Zeile
// etikett_aufruf (A3).
import { ereignisseAm, gefaessAm, gefaessStatus, ms, type Teile } from '../anlage/teile.ts';
import type { Vorgang } from '../datenpfad/erfassung.ts';
import { ortAufloesen } from '../ort.ts';
import { kalendertag, tagKurz, type Zeitzone } from '../zeit.ts';
import { codeZerlegen } from './etikett.ts';

export type Aufrufergebnis = 'gefunden' | 'entfernt' | 'unbekannt';

export type Aufloesung =
  | { ergebnis: 'gefunden'; ziel: { art: 'gefaess' | 'pruefen' | 'saeen' | 'messen'; code: string } }
  | { ergebnis: 'entfernt'; text: string; kuerzel: string }
  | { ergebnis: 'unbekannt'; text: 'Etikett nicht bekannt' };

const UNBEKANNT: Aufloesung = { ergebnis: 'unbekannt', text: 'Etikett nicht bekannt' };

export function etikettAufloesen(code: string, teile: Teile, zeitzone: Zeitzone): Aufloesung {
  const teil = codeZerlegen(code);
  if (!teil) return UNBEKANNT;
  const ort = ortAufloesen(code, (teile ?? {}) as Record<string, readonly unknown[]>);
  if (!ort) return UNBEKANNT;
  if (ort.rolle === 'anzuchtort') return { ergebnis: 'gefunden', ziel: { art: 'saeen', code } };
  if (ort.rolle === 'messstelle') return { ergebnis: 'gefunden', ziel: { art: 'messen', code } };
  const g = gefaessAm(teile, ort.platzId);
  const status = g ? gefaessStatus(teile, g.id) : undefined;
  if (status === 'entfernt') {
    const am = ereignisseAm(teile, ort.platzId, 'entfernt').sort((a, b) => ms(b.gilt_ab) - ms(a.gilt_ab))[0];
    const tag = am ? ` am ${tagKurz(kalendertag(new Date(am.gilt_ab), zeitzone))}` : '';
    return { ergebnis: 'entfernt', text: `Gefäss ${ort.kennung} entfernt${tag}`, kuerzel: teil.kuerzel };
  }
  // offene Gefässprüfung (Schritt 1 bis 3) → Prüfschritt 2 nach dem Scan (R9.3, A4)
  if (status === 'in_pruefung') return { ergebnis: 'gefunden', ziel: { art: 'pruefen', code } };
  return { ergebnis: 'gefunden', ziel: { art: 'gefaess', code } };
}

/** eine Zeile etikett_aufruf; id je Aufruf einmal erzeugt (Upsert auf client_id, TO2) */
export function aufrufVorgang(code: string, ergebnis: Aufrufergebnis, id: string, jetzt: Date): Vorgang {
  return [
    {
      art: 'neu',
      tabelle: 'etikett_aufruf',
      felder: { client_id: id, code, aufgerufen_am: jetzt.toISOString(), ergebnis },
    },
  ];
}
