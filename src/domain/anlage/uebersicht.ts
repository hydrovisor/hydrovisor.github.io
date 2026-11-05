// Übersicht einer Anlage als Regalbild (UC1, E-F4-1, 05_masken.md 4 «Anlage»; Plan 20): Bereiche von oben nach
// unten, der Bereich mit Anzuchtorten in drei Gruppen. Rein: jetzt und Zeitzone als Parameter.
import { kalendertag, tageZwischen, type Zeitzone } from '../zeit.ts';
import {
  anzuchtortAm,
  bereicheAus,
  gefaessAm,
  gefaessStatus,
  nachKennung,
  plaetzeAus,
  zeilen,
  type PlatzZeile,
  type Teile,
} from './teile.ts';

export interface OrtKachelDaten {
  code: string;
  kennung: string;
  rolle: PlatzZeile['rolle'];
  /** Ziel beim Antippen: W öffnet die Messmaske, sonst die Maske «Gefäss» (Plan 20 A6) */
  ziel: 'gefaess' | 'messen';
  zeilen: string[];
  /** neutraler Badge mit Wort, nie nur Farbe */
  badge?: string;
}

export interface Regalzeile {
  /** «Ebene 3», «Keimung», «Jungpflanzen», «Halbbox», «ohne Ebene» */
  titel: string;
  /** Ebene der Zeile, bei den drei Gruppen die Ebene der Anzucht */
  ebene?: number;
  orte: OrtKachelDaten[];
}

/** Text des Füllzustands (R5.4): «leer · bereit», «Lösung 12/14 Tage», bei Kratky ohne Wechsel «Lösung 12 Tage» */
export function fuellText(
  fuell: { fuellzustand: string; letzter_ansatz: string | null } | undefined,
  wechselTage: number | null,
  jetzt: Date,
  zeitzone: Zeitzone,
): string {
  if (!fuell || fuell.fuellzustand !== 'loesung') return 'leer · bereit';
  if (!fuell.letzter_ansatz) return 'Lösung';
  const alter = tageZwischen(
    kalendertag(new Date(fuell.letzter_ansatz), zeitzone),
    kalendertag(jetzt, zeitzone),
  );
  return wechselTage
    ? `Lösung ${alter}/${wechselTage} Tage`
    : `Lösung ${alter} ${alter === 1 ? 'Tag' : 'Tage'}`;
}

/** Badge des Prüfstatus: «nicht geprüft» solange in Prüfung, «ruht» (UC1 Ablauf Übersicht) */
export function statusBadge(status: string | undefined): string | undefined {
  if (status === 'in_pruefung') return 'nicht geprüft';
  if (status === 'in_betrieb_volumen_offen') return 'Volumen offen';
  if (status === 'ruht') return 'ruht';
  if (status === 'entfernt') return 'entfernt';
  return undefined;
}

function kachel(
  teile: Teile,
  kuerzel: string,
  p: PlatzZeile,
  jetzt: Date,
  zeitzone: Zeitzone,
): OrtKachelDaten {
  const code = `${kuerzel}-${p.kennung}`;
  if (p.rolle === 'messstelle')
    return { code, kennung: p.kennung, rolle: p.rolle, ziel: 'messen', zeilen: ['Leitungswasser'] };
  if (p.rolle === 'anzuchtort') {
    const box = anzuchtortAm(teile, p.id);
    return {
      code,
      kennung: p.kennung,
      rolle: p.rolle,
      ziel: 'gefaess',
      zeilen: [box?.typ === 'box_dunkel' ? 'Anzucht dunkel' : 'Anzucht hell'],
    };
  }
  const g = gefaessAm(teile, p.id);
  if (!g) return { code, kennung: p.kennung, rolle: p.rolle, ziel: 'gefaess', zeilen: ['kein Gefäss'] };
  const fuell = zeilen<{ platz_id: string; fuellzustand: string; letzter_ansatz: string | null }>(
    teile,
    'v_fuellzustand',
  ).find((f) => f.platz_id === p.id);
  const badge = statusBadge(gefaessStatus(teile, g.id));
  return {
    code,
    kennung: p.kennung,
    rolle: p.rolle,
    ziel: 'gefaess',
    zeilen: [fuellText(fuell, g.intervall_wechseln_d, jetzt, zeitzone)],
    ...(badge ? { badge } : {}),
  };
}

/** Regalbild einer Anlage: Zeilen von oben nach unten */
export function regalbild(teile: Teile, anlageId: string, jetzt: Date, zeitzone: Zeitzone): Regalzeile[] {
  const anlage = zeilen<{ id: string; kuerzel: string }>(teile, 'anlage').find((a) => a.id === anlageId);
  if (!anlage) return [];
  const plaetze = plaetzeAus(teile, anlageId).sort(nachKennung);
  const k = (p: PlatzZeile) => kachel(teile, anlage.kuerzel, p, jetzt, zeitzone);
  const modelle = new Map(
    zeilen<{ id: string; form: string }>(teile, 'gefaessmodell').map((m) => [m.id, m.form]),
  );
  const w = plaetze.filter((p) => p.rolle === 'messstelle').map(k);
  const ergebnis: Regalzeile[] = [];
  for (const b of bereicheAus(teile, anlageId).sort((x, y) => y.nummer - x.nummer)) {
    const hier = plaetze.filter((p) => p.bereich_id === b.id && p.rolle !== 'messstelle');
    const boxen = hier.filter((p) => p.rolle === 'anzuchtort');
    if (boxen.length === 0) {
      if (hier.length > 0) ergebnis.push({ titel: b.name, ebene: b.nummer, orte: hier.map(k) });
      continue;
    }
    // Bereich mit Anzuchtorten in drei Gruppen (E-F4-1, Plan 20 A1): hell vor dunkel, oval, übrige
    const typ = (p: PlatzZeile) => (anzuchtortAm(teile, p.id)?.typ === 'box_dunkel' ? 1 : 0);
    const oval = (p: PlatzZeile) => {
      const g = gefaessAm(teile, p.id);
      return g !== undefined && modelle.get(g.gefaessmodell_id) === 'oval';
    };
    const gefaesse = hier.filter((p) => p.rolle !== 'anzuchtort');
    ergebnis.push({
      titel: 'Keimung',
      ebene: b.nummer,
      orte: [...boxen].sort((x, y) => typ(x) - typ(y) || nachKennung(x, y)).map(k),
    });
    const jung = gefaesse.filter(oval);
    if (jung.length > 0) ergebnis.push({ titel: 'Jungpflanzen', ebene: b.nummer, orte: jung.map(k) });
    // W rechts in der Zeile «Halbbox» (Plan 20 A2)
    const halb = [...gefaesse.filter((p) => !oval(p)).map(k), ...w.splice(0)];
    if (halb.length > 0) ergebnis.push({ titel: 'Halbbox', ebene: b.nummer, orte: halb });
  }
  const ohne = plaetze.filter((p) => p.bereich_id === null && p.rolle !== 'messstelle');
  if (ohne.length > 0 || w.length > 0) ergebnis.push({ titel: 'ohne Ebene', orte: [...ohne.map(k), ...w] });
  return ergebnis;
}
