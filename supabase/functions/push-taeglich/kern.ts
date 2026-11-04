// Kern der Edge Function push-taeglich (Plan 13; Konzept 11.3, R5.5, G2, G5; TP1 bis TP4, UC0-AK5, T2).
// Laufzeitneutral: Uhr, Datenzugriff, Sender und Signatur kommen als Abhängigkeiten; die Hülle index.ts verbindet
// sie mit supabase-js, web-push und den Secrets. Die Zeile push_versand entsteht vor dem Senden (einmal je Tag).
import type { Datenart } from '../../../src/domain/kalibrierung/stand.ts';
import { pushText, tagesliste } from '../../../src/domain/push/inhalt.ts';
import { signaturText } from '../../../src/domain/push/signatur.ts';
import { sammelFaellig, wiederholungErlaubt } from '../../../src/domain/push/zeitpunkt.ts';
import { kalendertag } from '../../../src/domain/zeit.ts';

export interface Abo {
  id: string;
  endpoint: string;
  p256dh: string;
  auth_schluessel: string;
  datenart: Datenart;
  aktiv: boolean;
}

export interface PushDaten {
  einstellung(): Promise<{ push_zeit: string; zeitzone: string }>;
  /** ungefiltert; der Kern filtert aktiv und echt */
  aktiveAbos(): Promise<Abo[]>;
  aboZuEndpoint(endpoint: string): Promise<Abo | undefined>;
  /** Teile wie im Offline-Bündel (gleiche Filter) */
  teile(stichtag: Date): Promise<Record<string, unknown[]>>;
  /** Unique-Index push_versand_einmal_push → 'besteht' */
  versandAnlegen(z: {
    abo_id: string;
    art: 'sammel' | 'test';
    datum_lokal: string;
    titel: string;
    anzahl_aufgaben: number;
  }): Promise<{ id: string } | 'besteht'>;
  /** Status fehler → geplant, atomar; undefined, wenn keine solche Zeile besteht */
  fehlerVersandUebernehmen(abo_id: string, datum_lokal: string): Promise<{ id: string } | undefined>;
  versandAbschliessen(
    id: string,
    status: 'gesendet' | 'fehler' | 'abgemeldet',
    gesendetAm?: Date,
  ): Promise<void>;
  aboDeaktivieren(id: string, fehler: string): Promise<void>;
  testsHeute(datum_lokal: string): Promise<number>;
}

export interface Sender {
  senden(abo: Abo, nutzlast: string, optionen: { TTL: 14400; urgency: 'high' }): Promise<{ status: number }>;
}

export type Auftrag =
  { art: 'sammel'; geheimnisOk: boolean } | { art: 'test'; istTim: boolean; endpoint: string };

export interface Ergebnis {
  http: number;
  versandt: number;
  uebersprungen: number;
  abgemeldet: number;
}

export const TESTS_JE_TAG = 10;
const OPTIONEN = { TTL: 14400, urgency: 'high' } as const;
const TEST_TITEL = 'Hydrovisor Test-Push';

interface Abhaengigkeiten {
  jetzt: Date;
  daten: PushDaten;
  sender: Sender;
  signieren: (text: string) => Promise<string>;
}

/** Senden und Ergebnis festhalten: 2xx gesendet; 404 und 410 Abo inaktiv, Versand abgemeldet; sonst fehler */
async function zustellen(
  abh: Abhaengigkeiten,
  abo: Abo,
  versandId: string,
  inhalt: { titel: string; text: string; tag: 'heute' | 'test' },
  ergebnis: Ergebnis,
): Promise<void> {
  const nutzlast = JSON.stringify({
    titel: inhalt.titel,
    text: inhalt.text,
    versand_id: versandId,
    signatur: await abh.signieren(signaturText(versandId)),
    tag: inhalt.tag,
    url: '#/heute',
  });
  let status: number;
  try {
    status = (await abh.sender.senden(abo, nutzlast, OPTIONEN)).status;
  } catch {
    status = 0;
  }
  if (status >= 200 && status < 300) {
    await abh.daten.versandAbschliessen(versandId, 'gesendet', abh.jetzt);
    ergebnis.versandt += 1;
  } else if (status === 404 || status === 410) {
    await abh.daten.aboDeaktivieren(abo.id, status === 410 ? '410 Gone' : '404 Not Found');
    await abh.daten.versandAbschliessen(versandId, 'abgemeldet');
    ergebnis.abgemeldet += 1;
  } else {
    await abh.daten.versandAbschliessen(versandId, 'fehler');
  }
}

export async function pushLauf(auftrag: Auftrag, abh: Abhaengigkeiten): Promise<Ergebnis> {
  const ergebnis: Ergebnis = { http: 200, versandt: 0, uebersprungen: 0, abgemeldet: 0 };
  if (auftrag.art === 'sammel' ? !auftrag.geheimnisOk : !auftrag.istTim) return { ...ergebnis, http: 401 };
  const { push_zeit, zeitzone } = await abh.daten.einstellung();

  if (auftrag.art === 'test') {
    const datum = kalendertag(abh.jetzt, zeitzone);
    if ((await abh.daten.testsHeute(datum)) >= TESTS_JE_TAG) return { ...ergebnis, http: 429 };
    const abo = await abh.daten.aboZuEndpoint(auftrag.endpoint);
    if (!abo || !abo.aktiv) return { ...ergebnis, http: 404 };
    const v = await abh.daten.versandAnlegen({
      abo_id: abo.id,
      art: 'test',
      datum_lokal: datum,
      titel: TEST_TITEL,
      anzahl_aufgaben: 0,
    });
    if (v === 'besteht') return { ...ergebnis, uebersprungen: 1 };
    await zustellen(abh, abo, v.id, { titel: TEST_TITEL, text: 'Push funktioniert.', tag: 'test' }, ergebnis);
    return ergebnis;
  }

  const { faellig, datumLokal } = sammelFaellig(abh.jetzt, zeitzone, push_zeit);
  if (!faellig) return { ...ergebnis, http: 204 };
  const abos = (await abh.daten.aktiveAbos()).filter((a) => a.aktiv && a.datenart === 'echt');
  if (abos.length === 0) return ergebnis;
  const inhalt = pushText(tagesliste(await abh.daten.teile(abh.jetzt), abh.jetzt, zeitzone));
  for (const abo of abos) {
    let v = await abh.daten.versandAnlegen({
      abo_id: abo.id,
      art: 'sammel',
      datum_lokal: datumLokal,
      titel: inhalt.titel,
      anzahl_aufgaben: inhalt.anzahl,
    });
    if (v === 'besteht') {
      const wieder = wiederholungErlaubt(abh.jetzt, zeitzone, push_zeit)
        ? await abh.daten.fehlerVersandUebernehmen(abo.id, datumLokal)
        : undefined;
      if (!wieder) {
        ergebnis.uebersprungen += 1;
        continue;
      }
      v = wieder;
    }
    await zustellen(abh, abo, v.id, { titel: inhalt.titel, text: inhalt.text, tag: 'heute' }, ergebnis);
  }
  return ergebnis;
}
