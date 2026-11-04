// Kern der Edge Function push-quittung (Plan 13; Konzept 11.3; 04_architektur.md 5): Quittung ohne Sitzung, die
// Signatur über die versand_id genügt. «angezeigt» setzt angezeigt_am, «geoeffnet» geoeffnet_am und ein leeres
// angezeigt_am; setzen() schreibt nur in leere Felder, deshalb ist jede Quittung idempotent.
import { signaturText } from '../../../src/domain/push/signatur.ts';

export type QuittungsFeld = 'angezeigt_am' | 'geoeffnet_am';

export async function quittieren(
  anfrage: { versand_id: string; signatur: string; ereignis: 'angezeigt' | 'geoeffnet' },
  abh: {
    jetzt: Date;
    pruefen: (text: string, sig: string) => Promise<boolean>;
    setzen: (id: string, feld: QuittungsFeld, zeit: Date) => Promise<void>;
  },
): Promise<{ http: 204 | 400 | 401 }> {
  const a = (anfrage ?? {}) as Record<string, unknown>;
  const id = a['versand_id'];
  const sig = a['signatur'];
  const ereignis = a['ereignis'];
  if (typeof id !== 'string' || id === '' || typeof sig !== 'string' || sig === '') return { http: 400 };
  if (ereignis !== 'angezeigt' && ereignis !== 'geoeffnet') return { http: 400 };
  if (!(await abh.pruefen(signaturText(id), sig))) return { http: 401 };
  if (ereignis === 'geoeffnet') await abh.setzen(id, 'geoeffnet_am', abh.jetzt);
  await abh.setzen(id, 'angezeigt_am', abh.jetzt);
  return { http: 204 };
}
