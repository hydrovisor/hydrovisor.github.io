// Hinweis zum Ergebnis von rechercheStarten() (Plan 37, Plan 211 A10): läuft, ergänzt oder Hinweis der Recherche.
import type { RechercheErgebnis } from '../domain/ki/recherche.ts';
import { Notice } from './bausteine/Notice.tsx';

export function RechercheHinweis({ recherche }: { recherche: RechercheErgebnis | 'laeuft' | undefined }) {
  if (recherche === undefined) return null;
  if (recherche === 'laeuft')
    return <Notice tone="info">Recherche läuft. Du kannst die Seite verlassen.</Notice>;
  if (recherche.ergebnis === 'ok') {
    const offen = recherche.offen.length + recherche.offenSaat.length;
    return (
      <Notice tone="info">
        {`Ergänzt: ${recherche.werte} ${recherche.werte === 1 ? 'Wert' : 'Werte'} und ${recherche.saat} ${recherche.saat === 1 ? 'Saatempfehlung' : 'Saatempfehlungen'}. Offen: ${offen} ${offen === 1 ? 'Prüfauftrag' : 'Prüfaufträge'}.`}
      </Notice>
    );
  }
  return <Notice tone="warn">{recherche.hinweis}</Notice>;
}
