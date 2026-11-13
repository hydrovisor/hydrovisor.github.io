// Tütenfotos und KI-Aufrufe der Maske «Neue Sorte» (Konzept 11.3, 11.6; Plan 37). Fotos privat im Bucket
// saattueten unter <sorte_id>/<uuid>.jpg; ki-tuete liest die Tüte, ki-recherche ergänzt danach fehlende Werte.
import { hinweisRecherche, type RechercheErgebnis } from '../domain/ki/recherche.ts';
import { hinweisVonHand, type KiErgebnis } from '../domain/ki/uebernahme.ts';
import { APP_VERSION } from '../konstanten.ts';
import { erfolgMelden, neueClientId } from './schreiben.ts';
import { supabase } from './supabase.ts';

const BUCKET = 'saattueten';
/** über der Gesamtfrist der Function (30 s), danach «von Hand» */
const FRIST_TUETE_MS = 35_000;
/** Gesamtfrist der Recherche (120 s) plus Reserve */
const FRIST_RECHERCHE_MS = 130_000;

export async function fotoHochladen(
  sorteId: string,
  bild: Blob,
): Promise<{ pfad: string } | { fehler: string }> {
  const pfad = `${sorteId}/${neueClientId()}.jpg`;
  try {
    const { error } = await supabase.storage.from(BUCKET).upload(pfad, bild, { contentType: 'image/jpeg' });
    return error ? { fehler: error.message } : { pfad };
  } catch (e) {
    return { fehler: e instanceof Error ? e.message : String(e) };
  }
}

/** Gültigkeit eines signierten Links für die Anzeige eines Tütenfotos (Konzept 11.3, Plan 207) */
export const FOTO_LINK_SEKUNDEN = 60;
/** Frist für das Signieren; danach gilt «Foto nur mit Verbindung» (Plan 207 A7, schwaches WLAN am Regal) */
const FRIST_FOTO_LINK_MS = 8_000;

/**
 * signierter Link (60 s) auf ein Tütenfoto im privaten Bucket; ohne Verbindung, nach der Frist oder bei Fehler
 * undefined (A7)
 */
export async function fotoLink(pfad: string): Promise<string | undefined> {
  try {
    const r = await mitFrist(FRIST_FOTO_LINK_MS, () =>
      supabase.storage.from(BUCKET).createSignedUrl(pfad, FOTO_LINK_SEKUNDEN),
    );
    if (r === 'zeit') return undefined;
    return r.error || !r.data?.signedUrl ? undefined : r.data.signedUrl;
  } catch {
    return undefined;
  }
}

async function mitFrist<T>(ms: number, lauf: (signal: AbortSignal) => Promise<T>): Promise<T | 'zeit'> {
  const steuerung = new AbortController();
  let uhr: ReturnType<typeof setTimeout> | undefined;
  const zeit = new Promise<'zeit'>((resolve) => {
    uhr = setTimeout(() => {
      steuerung.abort();
      resolve('zeit');
    }, ms);
  });
  try {
    return await Promise.race([lauf(steuerung.signal), zeit]);
  } finally {
    clearTimeout(uhr);
  }
}

export async function tueteLesen(anfrage: { fotopfade: string[] } | { text: string }): Promise<KiErgebnis> {
  const start = Date.now();
  const vonHand = (grund: 'zeit' | 'fehler'): KiErgebnis => ({
    ergebnis: 'von_hand',
    grund,
    hinweis: hinweisVonHand(grund),
    dauerMs: Date.now() - start,
  });
  try {
    const r = await mitFrist(FRIST_TUETE_MS, (signal) =>
      supabase.functions.invoke<KiErgebnis>('ki-tuete', {
        body: { ...anfrage, app_version: APP_VERSION },
        signal,
      }),
    );
    if (r === 'zeit') return vonHand('zeit');
    if (r.error || !r.data) return vonHand('fehler');
    return r.data;
  } catch {
    return vonHand('fehler');
  }
}

export async function rechercheStarten(sorteId: string): Promise<RechercheErgebnis> {
  const start = Date.now();
  const abbruch = (grund: 'zeit' | 'fehler'): RechercheErgebnis => ({
    ergebnis: 'abgebrochen',
    grund,
    hinweis: hinweisRecherche(grund),
    dauerMs: Date.now() - start,
  });
  try {
    const r = await mitFrist(FRIST_RECHERCHE_MS, (signal) =>
      supabase.functions.invoke<RechercheErgebnis>('ki-recherche', {
        body: { sorte_id: sorteId, app_version: APP_VERSION },
        signal,
      }),
    );
    if (r === 'zeit') return abbruch('zeit');
    if (r.error || !r.data) return abbruch('fehler');
    if (r.data.ergebnis === 'ok' && r.data.werte + r.data.saat > 0) erfolgMelden();
    return r.data;
  } catch {
    return abbruch('fehler');
  }
}
