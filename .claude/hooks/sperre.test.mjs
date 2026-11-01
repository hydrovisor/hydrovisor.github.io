// Tests des PreToolUse-Hooks: node --test .claude/hooks/ (läuft im Prüftor, Job regeln)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pruefeBefehl, pruefeEingabe } from './sperre.mjs';

const FREMD = 'abcdefghijabcdefghij';
const DEV = 'jalvmzgvxvidgmoxuglp';

const gesperrt = [
  'git push origin main',
  'git push origin HEAD:main',
  'git push origin refs/heads/main',
  'cd x && git push origin main',
  'git -C /c/dev/hydrovisor push origin main',
  'git push -f origin paket/12-messung',
  'git push --force origin paket/12-messung',
  'git push --force-with-lease origin paket/12-messung',
  'git push origin +paket/12-messung',
  'git push --delete origin paket/12-messung',
  'supabase db push',
  'npx supabase db push --db-url x',
  'supabase link --project-ref ' + DEV,
  `psql "postgresql://postgres.${FREMD}:pw@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"`,
  `curl https://${FREMD}.supabase.co/rest/v1/messung`,
  `supabase functions deploy --project-ref ${FREMD}`,
  // Befunde E2, E3 aus der Prüfung von Auftrag 3
  'git.exe push origin main',
  'git push origin "main"',
  "git push origin 'main'",
  'git push origin HEAD:"main"',
  'git --no-pager push origin main',
  'git -C "C:/Program Files/x" push origin main',
  'bash -c "git push origin main"',
  "powershell -Command 'git push origin main'",
  'cmd /c "git push origin main"',
  'git push --all origin',
  `supabase functions deploy --project-ref "${FREMD}"`,
  `supabase secrets list --project-ref '${FREMD}'`,
  'supabase db reset --linked',
  'supabase migration up --linked',
  'supabase --debug db push',
  'npx supabase@latest link',
];
const erlaubt = [
  'git push -u origin paket/12-messung',
  'git push origin auftrag-3-arbeitsweise',
  'git push origin maintenance',
  'git log main..HEAD',
  'git diff origin/main...HEAD',
  'gh pr merge 5 --squash',
  // Entscheid 0005: Workflows startet der Lead selbst
  'gh workflow run deploy.yml --ref main -f rueckfall_probe=true',
  `curl https://${DEV}.supabase.co/rest/v1/messung`,
  `supabase functions deploy --project-ref ${DEV}`,
  'npm run lint',
  // Fehlalarme aus E22
  'git commit -m "Hinweis: supabase link und git push origin main sind gesperrt"',
  'grep -n "supabase db push" CLAUDE.md',
  'git push origin paket/12-messung\necho main',
  'supabase db reset',
  'supabase start',
];

for (const befehl of gesperrt) {
  test(`gesperrt: ${befehl}`, () => assert.ok(pruefeBefehl(befehl, 'paket/12-messung')));
}
for (const befehl of erlaubt) {
  test(`erlaubt: ${befehl}`, () => assert.equal(pruefeBefehl(befehl, 'paket/12-messung'), null));
}
test('Push ohne Ziel vom Zweig main gesperrt', () => assert.ok(pruefeBefehl('git push', 'main')));
test('Push HEAD vom Zweig main gesperrt', () => assert.ok(pruefeBefehl('git push -u origin HEAD', 'main')));
test('Push @ vom Zweig main gesperrt', () => assert.ok(pruefeBefehl('git push origin @', 'main')));
test('Push HEAD vom Paketzweig erlaubt', () => assert.equal(pruefeBefehl('git push -u origin HEAD', 'paket/12-messung'), null));
test('Push ohne Ziel vom Paketzweig erlaubt', () => assert.equal(pruefeBefehl('git push', 'paket/12-messung'), null));
test('PowerShell wird gleich geprüft', () =>
  assert.ok(pruefeEingabe({ tool_name: 'PowerShell', tool_input: { command: 'git push origin main' } }, 'x')));
test('MCP mit fremder project_id gesperrt', () =>
  assert.ok(pruefeEingabe({ tool_name: 'mcp__6031f023__execute_sql', tool_input: { project_id: FREMD, query: 'select 1' } }, 'x')));
test('MCP mit hydrovisor-dev erlaubt', () =>
  assert.equal(pruefeEingabe({ tool_name: 'mcp__supabase__execute_sql', tool_input: { project_id: DEV, query: 'select 1' } }, 'x'), null));
test('MCP create_project gesperrt', () =>
  assert.ok(pruefeEingabe({ tool_name: 'mcp__supabase__create_project', tool_input: { name: 'x' } }, 'x')));
test('andere Werkzeuge unberührt', () =>
  assert.equal(pruefeEingabe({ tool_name: 'Read', tool_input: { file_path: 'x' } }, 'x'), null));
