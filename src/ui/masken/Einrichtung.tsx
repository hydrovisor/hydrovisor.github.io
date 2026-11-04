// Einrichtungs-Checkliste in Heute (UC0, K29, B-04, 05_masken.md 3.1; Plan 18): neun Punkte in fester Reihenfolge,
// jeder hakt sich durch die Erfassung selbst ab; sind alle erfüllt, verschwindet die Liste.
import { useEffect, useState } from 'react';
import {
  checklisteZeigen,
  einrichtungsStand,
  EINWEICHEN_MS,
  type Punkt,
} from '../../domain/einrichtung/checkliste.ts';
import { Button } from '../bausteine/Button.tsx';
import { Checklist } from '../bausteine/Checklist.tsx';
import { useBuendel } from '../buendel.tsx';
import { abschlussGemerkt, abschlussMerken, einweichenEndeLesen, einweichenStarten } from '../einweichen.ts';
import { hashZu } from '../router.ts';

function Aktion({ punkt, starten }: { punkt: Punkt; starten: () => void }) {
  const z = punkt.ziel;
  if (z.art === 'einweichen')
    return punkt.timerEnde === undefined ? (
      <Button variant="secondary" onClick={starten}>
        {punkt.knopf}
      </Button>
    ) : (
      <span className="hv-check-menge">Läuft, hakt sich nach 12 Stunden selbst ab</span>
    );
  if (z.art === 'anlage-neu')
    return (
      <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'anlage-neu' })}>
        {punkt.knopf}
      </a>
    );
  if (z.art === 'vorlagen')
    return (
      <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'vorlagen' })}>
        {punkt.knopf}
      </a>
    );
  if (z.art === 'kalibrieren')
    return (
      <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'kalibrieren' })}>
        {punkt.knopf}
      </a>
    );
  if (z.art === 'messen')
    return (
      <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'messen', code: z.code })}>
        {punkt.knopf}
      </a>
    );
  return <span className="hv-check-menge">Ablauf folgt mit einer der nächsten Versionen</span>;
}

export function Einrichtung() {
  const { buendel } = useBuendel();
  const [jetzt, setJetzt] = useState(() => Date.now());
  const [ende, setEnde] = useState(() => einweichenEndeLesen());
  const [gemerkt] = useState(() => abschlussGemerkt());
  const stand = einrichtungsStand(buendel?.teile, new Date(jetzt), ende);
  const timerLaeuft = stand.punkte.some((p) => p.timerEnde !== undefined);

  // Countdown nur, solange der Timer läuft
  useEffect(() => {
    if (!timerLaeuft) return undefined;
    const uhr = window.setInterval(() => setJetzt(Date.now()), 1000);
    return () => window.clearInterval(uhr);
  }, [timerLaeuft]);

  useEffect(() => {
    if (stand.vollstaendig) abschlussMerken();
  }, [stand.vollstaendig]);

  if (!checklisteZeigen(stand, gemerkt)) return null;
  const starten = () => {
    const neu = Date.now() + EINWEICHEN_MS;
    einweichenStarten(neu);
    setEnde(neu);
    setJetzt(Date.now());
  };
  const erledigt = stand.punkte.filter((p) => p.erledigt).length;
  return (
    <section className="hv-einrichtung" aria-labelledby="einrichtung-titel">
      <h2 id="einrichtung-titel" className="hv-einrichtung-titel">
        Einrichtung · {erledigt} von 9 erledigt
      </h2>
      <Checklist
        variante="selbst"
        label="Einrichtung"
        jetzt={jetzt}
        zeilen={stand.punkte.map((p) => ({
          nr: p.nr,
          titel: p.titel,
          zustand: p.zustand,
          ...(p.timerEnde !== undefined ? { timerEnde: p.timerEnde } : {}),
          ...(p.zustand === 'aktiv' ? { aktion: <Aktion punkt={p} starten={starten} /> } : {}),
        }))}
      />
    </section>
  );
}
