// Ausführer des Ladeskripts je Ziel (Plan 10, Lösungsweg 3; A16). lokal: direkte Verbindung als postgres nur
// auf 127.0.0.1 oder localhost; dev: Management-API, Ziel fest hydrovisor-dev (Entscheid 0006); produktion: nur
// in GitHub Actions mit SEED_DB_URL (deploy.yml, Tims Freigabe in der Umgebung production).
import postgres from 'postgres';
import { artAuswahl } from '../../src/domain/w0/auswahl.ts';
import { ladeplan } from '../../src/domain/w0/abbildung.ts';
import { seedKonstanten } from '../../src/domain/w0/konstanten.ts';
import { verstossText, type W0Dateien } from '../../src/domain/w0/typen.ts';
import { pruefen } from '../../src/domain/w0/validator.ts';
import { alsBericht, type SeedBericht } from './bericht.ts';
import { ladeskript, TROCKENLAUF, type Lauf } from './ladeskript.ts';

export const DEV_PROJEKT = 'jalvmzgvxvidgmoxuglp';

export interface Ausfuehrer {
  ausfuehren(skript: string): Promise<SeedBericht>;
  schliessen(): Promise<void>;
}

/** Bericht aus dem Fehler eines Trockenlaufs; andere Fehler unverändert weiter */
function trockenlauf(meldung: string): SeedBericht | null {
  const i = meldung.indexOf(`${TROCKENLAUF} `);
  if (i < 0) return null;
  const rest = meldung.slice(i + TROCKENLAUF.length + 1);
  return alsBericht(rest.slice(0, rest.lastIndexOf('}') + 1));
}

/** letzte Zeile mit der Spalte bericht aus einem oder mehreren Ergebnissen */
function berichtAus(ergebnis: unknown): SeedBericht {
  const listen: unknown[] = Array.isArray(ergebnis) && ergebnis.some(Array.isArray) ? ergebnis : [ergebnis];
  for (const liste of [...listen].reverse()) {
    if (!Array.isArray(liste)) continue;
    const zeile = liste.find((z: unknown) => typeof z === 'object' && z !== null && 'bericht' in z) as
      { bericht: unknown } | undefined;
    if (zeile) return alsBericht(zeile.bericht);
  }
  throw new Error('Seed: Antwort ohne Bericht');
}

function ausfuehrerPostgres(url: string, optionen: postgres.Options<Record<string, never>>): Ausfuehrer {
  const sql = postgres(url, { max: 1, onnotice: () => undefined, ...optionen });
  return {
    async ausfuehren(skript) {
      try {
        return berichtAus(await sql.unsafe(skript));
      } catch (e) {
        await sql.unsafe('rollback').catch(() => undefined);
        const bericht = trockenlauf(e instanceof Error ? e.message : String(e));
        if (bericht) return bericht;
        throw e;
      }
    },
    schliessen: () => sql.end(),
  };
}

export function ausfuehrerLokal(url: string): Ausfuehrer {
  const host = new URL(url).hostname;
  if (host !== '127.0.0.1' && host !== 'localhost')
    throw new Error(`Ziel lokal nur 127.0.0.1 oder localhost, nicht ${host}`);
  return ausfuehrerPostgres(url, {});
}

export function ausfuehrerProduktion(url: string): Ausfuehrer {
  if (process.env['GITHUB_ACTIONS'] !== 'true')
    throw new Error('Ziel produktion nur in GitHub Actions (deploy.yml)');
  return ausfuehrerPostgres(url, { ssl: 'require', prepare: false });
}

export function ausfuehrerDev(token: string): Ausfuehrer {
  if (process.env['DEV_PROJEKT'] !== DEV_PROJEKT)
    throw new Error(`Ziel dev nur hydrovisor-dev (DEV_PROJEKT = ${DEV_PROJEKT})`);
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN fehlt');
  return {
    async ausfuehren(skript) {
      const antwort = await fetch(`https://api.supabase.com/v1/projects/${DEV_PROJEKT}/database/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: skript }),
      });
      const text = await antwort.text();
      if (!antwort.ok) {
        let meldung = text;
        try {
          meldung = String((JSON.parse(text) as { message?: unknown }).message ?? text);
        } catch {
          // Antwort ohne JSON: Rohtext
        }
        const bericht = trockenlauf(meldung);
        if (bericht) return bericht;
        throw new Error(`Management-API ${antwort.status}: ${meldung}`);
      }
      return berichtAus(text ? JSON.parse(text) : []);
    },
    schliessen: async () => undefined,
  };
}

/** Prüfen, planen, Skript erzeugen und ausführen; ein Verstoss bricht ab, bevor SQL gesendet wird (Abschnitt 7) */
export async function seedLauf(dateien: W0Dateien, ausfuehrer: Ausfuehrer, lauf: Lauf): Promise<SeedBericht> {
  const { verstoesse } = pruefen(dateien, { modus: 'freigegeben' });
  if (verstoesse.length > 0) {
    throw new Error(
      `Seed abgebrochen, ${verstoesse.length} Verstösse:\n${verstoesse.map(verstossText).join('\n')}`,
    );
  }
  const plan = ladeplan(dateien, artAuswahl(dateien, seedKonstanten.pflichtgroessen), seedKonstanten);
  return ausfuehrer.ausfuehren(ladeskript(plan, lauf).vollstaendig);
}
