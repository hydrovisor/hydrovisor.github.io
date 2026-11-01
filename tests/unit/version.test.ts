import { describe, expect, it } from 'vitest';
import { SCOPE_PFAD, START_PFAD } from '../../src/adressen.ts';
import { appVersion, commitBestimmen, COMMIT_UNBEKANNT, kurzhash } from '../../src/version.ts';

const A = 'a'.repeat(40);
const B = 'b'.repeat(40);
const C = 'c'.repeat(40);

describe('Version und Commit', () => {
  it('nimmt den Commit in der Reihenfolge VITE_COMMIT, Cloudflare, git', () => {
    expect(commitBestimmen({ viteCommit: A, cfPagesCommit: B, gitHead: C })).toBe(A);
    expect(commitBestimmen({ cfPagesCommit: B, gitHead: C })).toBe(B);
    expect(commitBestimmen({ gitHead: `${C}\n` })).toBe(C);
  });

  it('übergeht leere und ungültige Werte und meldet sonst «unbekannt»', () => {
    expect(commitBestimmen({ viteCommit: '', cfPagesCommit: 'kein-hash', gitHead: C })).toBe(C);
    expect(commitBestimmen({})).toBe(COMMIT_UNBEKANNT);
  });

  it('setzt APP_VERSION aus Version und Kurzhash zusammen', () => {
    expect(appVersion('0.1.0', '05c4bd908a5c4436a7a3c47fd746a6d4fd86d570')).toBe('0.1.0+05c4bd9');
    expect(appVersion('0.1.0', COMMIT_UNBEKANNT)).toBe('0.1.0+unbekannt');
    expect(kurzhash(COMMIT_UNBEKANNT)).toBe(COMMIT_UNBEKANNT);
  });

  it('leitet Scope und Start für das Manifest aus den Adressen ab', () => {
    expect(SCOPE_PFAD).toBe('/');
    expect(START_PFAD).toBe('/#/heute');
  });
});
