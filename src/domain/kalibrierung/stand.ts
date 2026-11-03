// Kalibrierstand und «unsicher» (R5.2, R10.3, R4.7, G2, G5; Plan 12): dieselben Regeln wie die Sichten
// v_kalibrierung_faellig und v_messung_unsicher in 02_datenmodell.sql, damit Heute ohne Netz gleich rechnet.
import { kalendertag, tagKurz, tagPlus, tageZwischen, type Zeitzone } from '../zeit.ts';

export type Datenart = 'echt' | 'demo' | 'test';

export interface KalibrierZeile {
  messgeraet_id: string;
  datenart: Datenart;
  gilt_ab: string;
  storniert_am: string | null;
  id: string;
}

export interface GeraeteEreignis {
  typ: 'sonde_gereinigt' | 'als_unsicher_markiert';
  messgeraet_id: string | null;
  gilt_ab: string;
  storniert_am: string | null;
  daten: { datenart: Datenart; seit_kalibrierung_id?: string };
}

export interface Kalibrierdaten {
  kalibrierungen: readonly KalibrierZeile[];
  ereignisse: readonly GeraeteEreignis[];
  /** 'JJJJ-MM-TT' (einstellung.feste_kalibriertermine) */
  festeTermine: readonly string[];
}

export type Kalibrierstand =
  | { art: 'erstkalibrierung' }
  | { art: 'gueltig' | 'faellig'; letzte: string; faelligAm: string }
  | { art: 'ueberfaellig'; letzte: string; faelligAm: string; tageUeberfaellig: number };

const ms = (iso: string) => Date.parse(iso);

/** Kalibrierungen desselben Geräts und derselben Datenart ohne Storno, älteste zuerst */
function kalibrierungenVon(
  daten: Kalibrierdaten,
  messgeraetId: string,
  datenart: Datenart,
): KalibrierZeile[] {
  return daten.kalibrierungen
    .filter((k) => k.messgeraet_id === messgeraetId && k.datenart === datenart && k.storniert_am === null)
    .sort((a, b) => ms(a.gilt_ab) - ms(b.gilt_ab));
}

function ereignisseVon(
  daten: Kalibrierdaten,
  typ: GeraeteEreignis['typ'],
  messgeraetId: string,
  datenart: Datenart,
): GeraeteEreignis[] {
  return daten.ereignisse.filter(
    (e) =>
      e.typ === typ &&
      e.storniert_am === null &&
      e.daten.datenart === datenart &&
      (typ !== 'sonde_gereinigt' || e.messgeraet_id === messgeraetId),
  );
}

/** erster fester Termin nach dem Kalendertag der letzten Kalibrierung */
function naechsterTermin(termine: readonly string[], nach: string): string | undefined {
  return [...termine].filter((t) => t > nach).sort()[0];
}

const kleinster = (...tage: (string | undefined)[]) =>
  tage.filter((t): t is string => t !== undefined).sort()[0] as string;

export function kalibrierStand(
  daten: Kalibrierdaten,
  geraet: { messgeraetId: string; datenart: Datenart },
  stichtag: Date,
  zeitzone: Zeitzone,
): Kalibrierstand {
  const letzte = kalibrierungenVon(daten, geraet.messgeraetId, geraet.datenart).at(-1);
  if (!letzte) return { art: 'erstkalibrierung' };
  const tagLetzte = kalendertag(new Date(letzte.gilt_ab), zeitzone);
  const gereinigt = ereignisseVon(daten, 'sonde_gereinigt', geraet.messgeraetId, geraet.datenart)
    .filter((e) => ms(e.gilt_ab) > ms(letzte.gilt_ab))
    .map((e) => kalendertag(new Date(e.gilt_ab), zeitzone))
    .sort()[0];
  const faelligAm = kleinster(
    tagPlus(tagLetzte, 30),
    naechsterTermin(daten.festeTermine, tagLetzte),
    gereinigt,
  );
  const heute = kalendertag(stichtag, zeitzone);
  if (heute < faelligAm) return { art: 'gueltig', letzte: letzte.gilt_ab, faelligAm };
  if (heute === faelligAm) return { art: 'faellig', letzte: letzte.gilt_ab, faelligAm };
  return {
    art: 'ueberfaellig',
    letzte: letzte.gilt_ab,
    faelligAm,
    tageUeberfaellig: tageZwischen(faelligAm, heute),
  };
}

/** wie v_messung_unsicher: fehlende oder überfällige Kalibrierung, Sonde gereinigt, als unsicher markiert */
export function istUnsicher(
  messung: { messgeraetId: string; datenart: Datenart; giltAb: Date },
  daten: Kalibrierdaten,
  zeitzone: Zeitzone,
): boolean {
  const zeit = messung.giltAb.getTime();
  const alle = kalibrierungenVon(daten, messung.messgeraetId, messung.datenart);
  const letzte = alle.filter((k) => ms(k.gilt_ab) <= zeit).at(-1);
  if (!letzte) return true;
  const tagLetzte = kalendertag(new Date(letzte.gilt_ab), zeitzone);
  const grenze = kleinster(tagPlus(tagLetzte, 30), naechsterTermin(daten.festeTermine, tagLetzte));
  if (kalendertag(messung.giltAb, zeitzone) > grenze) return true;
  const gereinigt = ereignisseVon(daten, 'sonde_gereinigt', messung.messgeraetId, messung.datenart).some(
    (e) => ms(e.gilt_ab) > ms(letzte.gilt_ab) && ms(e.gilt_ab) < zeit,
  );
  if (gereinigt) return true;
  return ereignisseVon(daten, 'als_unsicher_markiert', messung.messgeraetId, messung.datenart).some((e) => {
    const x = alle.find((k) => k.id === e.daten.seit_kalibrierung_id);
    if (!x || zeit < ms(x.gilt_ab)) return false;
    // bis zur nächsten Kalibrierung nach X, ohne sie bis zum Ereignis selbst (coalesce in der Sicht)
    const naechste = alle.find((k) => ms(k.gilt_ab) > ms(x.gilt_ab));
    return zeit < (naechste ? ms(naechste.gilt_ab) : ms(e.gilt_ab));
  });
}

export function kalibrierText(stand: Kalibrierstand): string {
  switch (stand.art) {
    case 'erstkalibrierung':
      return 'Erstkalibrierung';
    case 'gueltig':
      return `Kalibrierung gültig bis ${tagKurz(stand.faelligAm)}`;
    case 'faellig':
      return 'Messgerät kalibrieren';
    case 'ueberfaellig':
      return `seit ${stand.tageUeberfaellig} ${stand.tageUeberfaellig === 1 ? 'Tag' : 'Tagen'} überfällig`;
  }
}
