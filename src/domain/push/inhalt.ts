// Inhalt der Sammel-Push (R5.5 Titel, R5.1 gleiche Liste, R5.4, G5; Plan 13): Übergangsliste aus Kalibrierstand
// und Messfälligkeit (Plan 12), nur Datenart echt. I1b-06 ersetzt sie durch faelligeAufgaben() (I1b-02).
import { kalibrierStand } from '../kalibrierung/stand.ts';
import { messFaelligkeit } from '../messung/faelligkeit.ts';
import { messbareOrte } from '../ort.ts';
import { kalibrierdatenAus, messgeraetAus, messungenAus, zustandAus, type Teile } from '../teile.ts';
import { kalendertag, type Zeitzone } from '../zeit.ts';

export interface TagesEintrag {
  typ: 'kalibrieren' | 'messen';
  /** messgeraet.id bzw. platz_id */
  bezug: string;
  faelligAm: string;
  /** Code des Orts bei «messen», z. B. R-2.3 */
  ort?: string;
}

/** Kalibrieren zuerst (Stand fällig, überfällig, Erstkalibrierung), dann Messen nach Code */
export function tagesliste(teile: Teile, stichtag: Date, zeitzone: Zeitzone): TagesEintrag[] {
  const liste: TagesEintrag[] = [];
  const geraet = messgeraetAus(teile);
  if (geraet) {
    const stand = kalibrierStand(
      kalibrierdatenAus(teile),
      { messgeraetId: geraet.id, datenart: 'echt' },
      stichtag,
      zeitzone,
    );
    if (stand.art !== 'gueltig')
      liste.push({
        typ: 'kalibrieren',
        bezug: geraet.id,
        faelligAm: stand.art === 'erstkalibrierung' ? kalendertag(stichtag, zeitzone) : stand.faelligAm,
      });
  }
  const messungen = messungenAus(teile);
  for (const o of messbareOrte(teile)) {
    if (o.datenart !== 'echt') continue;
    const f = messFaelligkeit(
      { platzId: o.platzId, intervallMessenD: o.intervallMessenD ?? null, ...zustandAus(teile, o.platzId) },
      messungen,
      stichtag,
      zeitzone,
    );
    if (f.art === 'offen' && f.faellig)
      liste.push({ typ: 'messen', bezug: o.platzId, faelligAm: f.faelligAm, ort: o.code });
  }
  return liste;
}

/** Titel nach R5.5 (Kalibrieren und Messen gehören zur Gruppe «Routine», A); bei 0 «nichts fällig» (A4) */
export function pushText(eintraege: readonly TagesEintrag[]): {
  titel: string;
  text: string;
  anzahl: number;
} {
  const anzahl = eintraege.length;
  if (anzahl === 0)
    return { titel: 'Hydrovisor heute: nichts fällig', text: 'Heute stehen keine Aufgaben an.', anzahl };
  const teile: string[] = [];
  if (eintraege.some((e) => e.typ === 'kalibrieren')) teile.push('Kalibrieren');
  const orte = eintraege.filter((e) => e.typ === 'messen').map((e) => e.ort ?? e.bezug);
  if (orte.length > 0) teile.push(`Messen ${orte.join(', ')}`);
  return { titel: `Hydrovisor heute: ${anzahl} Routine`, text: teile.join(' · '), anzahl };
}
