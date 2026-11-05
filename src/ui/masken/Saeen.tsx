// Säen #/saeen?box=<code> (04_architektur.md 3; Plan 22 A5): Platzhalter bis I1a-06 mit der vorgewählten
// Anzuchtbox; I1a-06 ersetzt die Maske und behält Route und Parameter. Kontext Regal.
import { anzuchtortAm } from '../../domain/anlage/teile.ts';
import { ortAufloesen } from '../../domain/ort.ts';
import { useBuendel } from '../buendel.tsx';
import { hashZu } from '../router.ts';

export function Saeen({ box }: { box?: string }) {
  const { buendel } = useBuendel();
  const teile = buendel?.teile;
  const ort = box && teile ? ortAufloesen(box, teile) : undefined;
  const typ = ort ? anzuchtortAm(teile, ort.platzId)?.typ : undefined;
  return (
    <main className="hv-seite hv-saeen" data-density="regal">
      <header className="hv-seite-kopf">
        <h1 className="hv-seite-titel">Säen</h1>
        <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'heute' })}>
          Zu Heute
        </a>
      </header>
      {ort && ort.rolle === 'anzuchtort' ? (
        <p>
          Anzuchtbox {ort.kennung} · {typ === 'box_dunkel' ? 'Dunkelkeimer' : 'Lichtkeimer'}
        </p>
      ) : null}
      <p>Säen folgt mit einer der nächsten Versionen</p>
    </main>
  );
}
