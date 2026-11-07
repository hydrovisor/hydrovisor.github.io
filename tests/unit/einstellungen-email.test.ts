// Schalter «E-Mail, wenn Push fehlt» in den Einstellungen (Plan 31 Lösungsweg 9, Annahme 14, Testliste «Vitest»;
// R5.5, R13, 11.1; 06_tests.md 8 TP6). Die Maske hat keine eigene reine Funktion für den Schalter; der Test prüft
// deshalb die Quelle der Maske (Wahl «Aus | Ein» im Abschnitt Erinnerung, Update nur von email_rueckfall über
// einstellungSchreiben) und die Spaltenliste des Bündels (email_rueckfall ja, telefon_vertretung weiterhin nein, Ü3).
// Vorausgesetzt (Plan 31 Lösungsweg 9): Die Wahl ruft aendern(<abschnitt>, 'einstellung', id, { email_rueckfall: … })
// wie die Wahl «Thema» und nennt «E-Mail, wenn Push fehlt» mit den Optionen «Aus» und «Ein».
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BUENDEL_TEILE } from '../../src/domain/datenpfad/buendel-teile.ts';

const MASKE = readFileSync(new URL('../../src/ui/masken/Einstellungen.tsx', import.meta.url), 'utf8');

describe('E-Mail-Rückfall in den Einstellungen (I1b-06)', () => {
  it('TP6 Schalter «E-Mail, wenn Push fehlt» schreibt nur email_rueckfall', () => {
    expect(MASKE).toContain('E-Mail, wenn Push fehlt');
    // Aufrufe von aendern(…, 'einstellung', id, { … }) mit email_rueckfall
    const aufrufe = [...MASKE.matchAll(/aendern\(\s*'[^']+',\s*'einstellung',\s*id,\s*\{([^}]*)\}\s*\)/g)]
      .map((t) => t[1] ?? '')
      .filter((felder) => felder.includes('email_rueckfall'));
    expect(aufrufe).toHaveLength(1);
    const felder = (aufrufe[0] ?? '')
      .split(',')
      .map((f) => f.split(':')[0]?.trim())
      .filter(Boolean);
    expect(felder).toEqual(['email_rueckfall']);
  });

  it('TP6 Wahl mit den Optionen «Aus» und «Ein»', () => {
    const ab = MASKE.indexOf('E-Mail, wenn Push fehlt');
    expect(ab).toBeGreaterThanOrEqual(0);
    const umfeld = MASKE.slice(Math.max(0, ab - 400), ab + 800);
    expect(umfeld).toMatch(/titel:\s*'Aus'/);
    expect(umfeld).toMatch(/titel:\s*'Ein'/);
  });

  it('TP6 Bündel lädt email_rueckfall, aber weiterhin nicht telefon_vertretung (Ü3)', () => {
    const spalten = BUENDEL_TEILE.find((t) => t.name === 'einstellung')?.spalten.split(',') ?? [];
    expect(spalten).toContain('email_rueckfall');
    expect(spalten).not.toContain('telefon_vertretung');
    expect(spalten).not.toContain('*');
  });
});
