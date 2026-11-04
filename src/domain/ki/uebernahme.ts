// Ergebnis des KI-Aufrufs, Übernahme ins Formular und Feldstatus (UC4-AK2, Varianten; Konzept 8.2, 11.3; Plan 14).
// Die Maske folgt mit I2-05; hier nur reine Funktionen. Getippte Eingaben bleiben immer stehen.
import { KI_FELDER, feldTexte, type KiFeld, type TuetenFelder } from './schema.ts';

export type VonHandGrund = 'zeit' | 'fehler' | 'ungueltig' | 'grenze' | 'nicht_eingerichtet';

export type KiErgebnis =
  | {
      ergebnis: 'ok';
      modell: string;
      felder: TuetenFelder;
      verworfen: readonly string[];
      dauerMs: number;
      ausweichmodell: boolean;
    }
  | { ergebnis: 'von_hand'; grund: VonHandGrund; hinweis: string; dauerMs: number };

const HINWEIS: Record<VonHandGrund, string> = {
  zeit: 'Die Tüte konnte nicht innert 30 Sekunden gelesen werden. Trag die Werte von Hand ein.',
  fehler: 'Das Lesen der Tüte ist gerade nicht möglich. Trag die Werte von Hand ein.',
  ungueltig: 'Die Antwort zur Tüte war nicht lesbar. Trag die Werte von Hand ein.',
  grenze: 'Heute sind schon 30 Tüten gelesen worden. Trag die Werte von Hand ein.',
  nicht_eingerichtet: 'Das Lesen der Tüte ist noch nicht eingerichtet. Trag die Werte von Hand ein.',
};

export function hinweisVonHand(grund: VonHandGrund): string {
  return HINWEIS[grund];
}

const istLeer = (w: string | undefined) => w === undefined || w.trim() === '';

/** KI-Werte als Vorschlag nur für leere Eingaben; bei «von Hand» bleibt alles, mit Hinweis */
export function kiUebernehmen(
  eingaben: Readonly<Partial<Record<KiFeld, string>>>,
  ergebnis: KiErgebnis,
): {
  eingaben: Partial<Record<KiFeld, string>>;
  vorschlag: Partial<Record<KiFeld, string>>;
  hinweis?: string;
} {
  const kopie = { ...eingaben };
  if (ergebnis.ergebnis === 'von_hand') return { eingaben: kopie, vorschlag: {}, hinweis: ergebnis.hinweis };
  const texte = feldTexte(ergebnis.felder);
  const vorschlag: Partial<Record<KiFeld, string>> = {};
  for (const feld of KI_FELDER) {
    const ki = texte[feld];
    if (ki !== null && istLeer(eingaben[feld])) vorschlag[feld] = ki;
  }
  return { eingaben: kopie, vorschlag };
}

const vergleich = (w: string) => w.trim().replace(/\s+/g, ' ').toLowerCase();

/** Status für ki_feldprotokoll: KI null → leer, gleich → uebernommen, sonst geaendert */
export function feldStatus(
  wertKi: string | null,
  wertFinal: string | null,
): 'uebernommen' | 'geaendert' | 'leer' {
  if (wertKi === null) return 'leer';
  if (wertFinal !== null && vergleich(wertKi) === vergleich(wertFinal)) return 'uebernommen';
  return 'geaendert';
}
