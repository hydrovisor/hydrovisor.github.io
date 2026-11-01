// APP_VERSION = Version aus package.json + '+' + Git-Kurzhash (docs/spec/04_architektur.md Abschnitt 2)
export const COMMIT_UNBEKANNT = 'unbekannt';

export interface CommitQuellen {
  /** von deploy.yml gesetzt */
  viteCommit?: string | undefined;
  /** von Cloudflare Pages gesetzt (Vorschau) */
  cfPagesCommit?: string | undefined;
  /** `git rev-parse HEAD`, lokal und in pr.yml */
  gitHead?: string | undefined;
}

export function commitBestimmen(quellen: CommitQuellen): string {
  for (const wert of [quellen.viteCommit, quellen.cfPagesCommit, quellen.gitHead]) {
    const commit = wert?.trim();
    if (commit && /^[0-9a-f]{7,40}$/i.test(commit)) return commit.toLowerCase();
  }
  return COMMIT_UNBEKANNT;
}

export function kurzhash(commit: string): string {
  return commit === COMMIT_UNBEKANNT ? commit : commit.slice(0, 7);
}

export function appVersion(paketVersion: string, commit: string): string {
  return `${paketVersion}+${kurzhash(commit)}`;
}
