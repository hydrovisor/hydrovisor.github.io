// Push-Zustand für Heute und #/push (Plan 13 «Client»): Browser-Fähigkeit, Berechtigung und Endpoint dieses Geräts
// mit den Teilen push_abo und push_versand des Bündels zu pushStand() verbinden; beim ersten Laden mit Abo den
// Abgleich mit push_abo anstossen (11.3).
import { useEffect, useState } from 'react';
import type { Datenart } from '../domain/kalibrierung/stand.ts';
import { pushStand, type PushStand } from '../domain/push/stand.ts';
import { ZEITZONE } from '../domain/zeit.ts';
import { aboAbgleichen, eigenerEndpoint, geraetBeschreibung, pushUnterstuetzt } from '../daten/push.ts';
import { aboSchreiben } from '../daten/schreiben.ts';
import { jetzt } from './bundeldaten.ts';
import { useBuendel } from './buendel.tsx';

export interface Versandzeile {
  id: string;
  abo_id: string | null;
  art: string;
  datum_lokal: string;
  status: string;
  titel: string | null;
  gesendet_am: string | null;
  angezeigt_am: string | null;
  geoeffnet_am: string | null;
}

interface Abozeile {
  id: string;
  erfasst_am: string;
  endpoint: string;
  aktiv: boolean;
  datenart: Datenart;
}

let abgeglichen = false;

function berechtigung(): 'granted' | 'denied' | 'default' {
  return typeof Notification === 'undefined' ? 'default' : Notification.permission;
}

/** Stand der Push oder undefined, solange der Endpoint des Browsers noch nicht gelesen ist */
export function usePushStand(): {
  stand: PushStand | undefined;
  versande: readonly Versandzeile[];
  neu: () => void;
} {
  const { buendel } = useBuendel();
  const [endpoint, setEndpoint] = useState<string | null | undefined>(undefined);
  const [runde, setRunde] = useState(0);
  const abos = (buendel?.teile['push_abo'] ?? []) as readonly Abozeile[];
  const versande = (buendel?.teile['push_versand'] ?? []) as readonly Versandzeile[];

  useEffect(() => {
    let aktiv = true;
    eigenerEndpoint().then(
      (e) => aktiv && setEndpoint(e),
      () => aktiv && setEndpoint(null),
    );
    return () => {
      aktiv = false;
    };
  }, [runde]);

  useEffect(() => {
    if (abgeglichen || !buendel || berechtigung() !== 'granted' || !pushUnterstuetzt()) return;
    abgeglichen = true;
    void navigator.serviceWorker.getRegistration().then((r) =>
      r
        ? aboAbgleichen({
            pushManager: r.pushManager,
            abos: (buendel.teile['push_abo'] ?? []) as readonly Abozeile[],
            aboSchreiben,
            geraet: geraetBeschreibung(navigator.userAgent),
          })
        : undefined,
    );
  }, [buendel]);

  const stand =
    endpoint === undefined
      ? undefined
      : pushStand(
          { unterstuetzt: pushUnterstuetzt(), berechtigung: berechtigung(), endpoint },
          abos,
          versande,
          jetzt(),
          ZEITZONE,
        );
  return { stand, versande, neu: () => setRunde((r) => r + 1) };
}
