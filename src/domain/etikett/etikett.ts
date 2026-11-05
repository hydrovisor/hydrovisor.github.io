// Etiketten (R9.1, UC14, Plan 22): Link und Code, Inhalt je Etikett (Kennung, Zusatzzeilen, Format), Liste je
// Anlage mit Stand und der Vorgang «gedruckt» (Schritt setzen, A2). Rein; Zeitzone als Parameter.
import { BASIS_URL } from '../../adressen.ts';
import { betriebsartName } from '../anlage/gefaess.ts';
import {
  anzuchtortAm,
  deckeltyp,
  gefaessAm,
  gefaessStatus,
  nachKennung,
  zeilen,
  type AnlageZeile,
  type PlatzZeile,
  type Teile,
} from '../anlage/teile.ts';
import type { Schritt, Vorgang } from '../datenpfad/erfassung.ts';
import { kalendertag, tagKurz, type Zeitzone } from '../zeit.ts';

/** Zeile aus dem Teil «etikett» (platz_id, format, storniert_am wie PostgREST sie liefert) */
export type EtikettZeile = Readonly<Record<string, unknown>> & {
  code: string;
  gedruckt_am: string | null;
  client_id?: string | null;
};

export interface Etiketteninhalt {
  code: string;
  link: string;
  kennung: string;
  /** zwei Zusatzzeilen (A8) */
  zeilen: string[];
  /** Anzuchtbox 55 × 25 mm */
  klein: boolean;
}

export interface Etikettzeile {
  code: string;
  kennung: string;
  /** «Gefäss», «Anzuchtbox», «Messstelle» */
  art: string;
  /** «nicht gedruckt» oder «gedruckt am 14.12.» */
  stand: string;
  gedruckt: boolean;
  etikett: EtikettZeile;
}

const CODE = /^([A-Z]{1,3})-(\S+)$/;

export function etikettLink(code: string): string {
  return `${BASIS_URL}#/e/${code}`;
}

export function etikettCode(kuerzel: string, kennung: string): string {
  return `${kuerzel}-${kennung}`;
}

/** Kürzel 1 bis 3 Grossbuchstaben, «-», Kennung (A12); sonst undefined */
export function codeZerlegen(code: string): { kuerzel: string; kennung: string } | undefined {
  const m = CODE.exec(code);
  return m ? { kuerzel: m[1] as string, kennung: m[2] as string } : undefined;
}

const platzVon = (teile: Teile, id: string) => zeilen<PlatzZeile>(teile, 'platz').find((p) => p.id === id);
const anlageVon = (teile: Teile, id: string | undefined) =>
  zeilen<AnlageZeile>(teile, 'anlage').find((a) => a.id === id);
const liter = (w: number | string) => String(Math.round(Number(w) * 100) / 100);

export function etikettInhalt(teile: Teile, etikett: EtikettZeile, zeitzone: Zeitzone): Etiketteninhalt {
  void zeitzone;
  const platz = platzVon(teile, String(etikett['platz_id']));
  const anlage = anlageVon(teile, platz?.anlage_id)?.name ?? '';
  const kennung = platz?.kennung ?? codeZerlegen(etikett.code)?.kennung ?? etikett.code;
  const inhalt: Etiketteninhalt = {
    code: etikett.code,
    link: etikettLink(etikett.code),
    kennung,
    zeilen: [],
    klein: etikett['format'] === '55x25',
  };
  const box = platz ? anzuchtortAm(teile, platz.id) : undefined;
  const g = platz ? gefaessAm(teile, platz.id) : undefined;
  if (box)
    inhalt.zeilen =
      box.typ === 'box_dunkel' ? ['Dunkelkeimer', 'Deckel zu'] : ['Lichtkeimer', 'Deckel offen'];
  else if (platz?.rolle === 'messstelle') inhalt.zeilen = [`${anlage} · Messstelle`, 'Leitungswasser'];
  else if (g) {
    const d = g.deckeltyp_id ? deckeltyp(teile, g.deckeltyp_id) : undefined;
    const zweite = [`${liter(g.betriebsvolumen_l)} l`];
    if (d) {
      const loecher = d.loecher_je_reihe.reduce((s, n) => s + n, 0);
      zweite.push(d.name, `${loecher} × ${d.topfdurchmesser_mm / 10} cm`);
    }
    inhalt.zeilen = [`${anlage} · ${betriebsartName(g.betriebsart)}`, zweite.join(' · ')];
  }
  return inhalt;
}

const RANG: Record<PlatzZeile['rolle'], number> = { gefaess: 0, lager: 1, anzuchtort: 2, messstelle: 3 };

/** Etiketten aktiver Plätze der Anlage ohne entfernte Orte; Gefässe nach Kennung, dann A1 bis A4, dann W (A11) */
export function etikettListe(teile: Teile, anlageId: string, zeitzone: Zeitzone): Etikettzeile[] {
  const plaetze = new Map(
    zeilen<PlatzZeile>(teile, 'platz')
      .filter((p) => p.anlage_id === anlageId && p.aktiv && p.storniert_am === null)
      .map((p) => [p.id, p]),
  );
  const liste: (Etikettzeile & { platz: PlatzZeile })[] = [];
  for (const e of zeilen<EtikettZeile>(teile, 'etikett')) {
    const platz = plaetze.get(String(e['platz_id']));
    if (!platz || (e['storniert_am'] ?? null) !== null) continue;
    const g = gefaessAm(teile, platz.id);
    if (g && gefaessStatus(teile, g.id) === 'entfernt') continue;
    liste.push({
      code: e.code,
      kennung: platz.kennung,
      art:
        platz.rolle === 'anzuchtort' ? 'Anzuchtbox' : platz.rolle === 'messstelle' ? 'Messstelle' : 'Gefäss',
      stand: e.gedruckt_am
        ? `gedruckt am ${tagKurz(kalendertag(new Date(e.gedruckt_am), zeitzone))}`
        : 'nicht gedruckt',
      gedruckt: Boolean(e.gedruckt_am),
      etikett: e,
      platz,
    });
  }
  return liste
    .sort((a, b) => RANG[a.platz.rolle] - RANG[b.platz.rolle] || nachKennung(a, b))
    .map(({ platz, ...z }) => {
      void platz;
      return z;
    });
}

/** Bestätigung «gedruckt»: je Etikett ohne gedruckt_am ein Schritt setzen (A2); gleiche Eingabe, gleiche Schritte */
export function gedrucktVorgang(etiketten: readonly EtikettZeile[], jetzt: Date): Vorgang {
  return etiketten
    .filter((e) => !e.gedruckt_am && e.client_id)
    .map((e): Schritt => ({
      art: 'setzen',
      tabelle: 'etikett',
      clientId: e.client_id as string,
      felder: { gedruckt_am: jetzt.toISOString() },
    }));
}
