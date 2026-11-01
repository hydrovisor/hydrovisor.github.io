// AK-Abdeckung im Prüftor (pr.yml, Job ak-abdeckung; docs/spec/06_tests.md Abschnitt 2, docs/plaene/7.md).
// node scripts/ak-abdeckung.ts --issue <nr> [--pr <nr>] --berichte reports
// Liest die AK aus dem Issue und die Testnamen aus allen Berichten; Exit 1, wenn ein AK fehlt.
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { abgleichen, akListe, berichtLesen, tabelle, type Testfall } from './ak-abdeckung-regeln.ts';

interface Kommentare {
  body: string;
  comments: { body: string }[];
  labels: { name: string }[];
}

function gh(art: 'issue' | 'pr', nr: string): Kommentare {
  const repo = process.env['GITHUB_REPOSITORY'];
  const argumente = [art, 'view', nr, '--json', 'body,comments,labels', ...(repo ? ['--repo', repo] : [])];
  return JSON.parse(execFileSync('gh', argumente, { encoding: 'utf8' })) as Kommentare;
}

function berichte(ordner: string): Testfall[] {
  if (!existsSync(ordner)) return [];
  return readdirSync(ordner, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .flatMap((e) => {
      const pfad = join(e.parentPath, e.name);
      try {
        return berichtLesen(e.name, readFileSync(pfad, 'utf8'));
      } catch (fehler) {
        console.warn(`::warning::Bericht ${pfad} nicht lesbar: ${String(fehler)}`);
        return [];
      }
    });
}

const { values } = parseArgs({
  options: {
    issue: { type: 'string' },
    pr: { type: 'string' },
    berichte: { type: 'string', default: 'reports' },
  },
});
if (!values.issue) {
  console.error('Aufruf: node scripts/ak-abdeckung.ts --issue <nr> [--pr <nr>] --berichte reports');
  process.exit(2);
}

const issue = gh('issue', values.issue);
const pr = values.pr ? gh('pr', values.pr) : undefined;
const aks = akListe(issue.body);
if (aks.length === 0) {
  console.error(`::error::Issue #${values.issue} hat keinen Abschnitt «AK mit Prüfart» mit Einträgen`);
  process.exit(1);
}

const tests = berichte(values.berichte);
const abnahme = (k: { body: string }) => k.body.trimStart().startsWith('# Abnahme');
const befunde = abgleichen(aks, {
  tests,
  abnahmeKommentare: [...(pr?.comments ?? []), ...issue.comments].filter(abnahme).map((k) => k.body),
  issueKommentare: issue.comments.map((k) => k.body),
  abnahmeWartet: !pr || pr.labels.some((l) => l.name === 'abnahme-wartet'),
});

const ausgabe = [
  `### AK-Abdeckung Issue #${values.issue}`,
  '',
  `${tests.length} Testergebnisse aus ${values.berichte}${pr ? `, Pull Request #${values.pr}` : ', ohne Pull Request'}`,
  '',
  tabelle(befunde),
].join('\n');
console.log(ausgabe);
const zusammenfassung = process.env['GITHUB_STEP_SUMMARY'];
if (zusammenfassung) appendFileSync(zusammenfassung, ausgabe + '\n');

for (const b of befunde) {
  if (b.ergebnis === 'warnung') console.log(`::warning::${b.ak.text}: ${b.beleg}`);
}
const fehlend = befunde.filter((b) => b.ergebnis === 'fehlt');
if (fehlend.length > 0) {
  console.error(`::error::AK ohne Deckung: ${fehlend.map((b) => b.ak.text).join(', ')}`);
  process.exit(1);
}
