#!/usr/bin/env node
// PreToolUse-Hook (Konzept 12.4): lehnt Befehle ab, die main als Push-Ziel haben, Force-Push,
// supabase db push / link / --linked, das Starten von Workflows und jede Supabase-Projekt-Referenz
// ausser hydrovisor-dev. Die Deny-Regeln in settings.json sind musterbasiert; dieser Hook prüft den
// ganzen Befehl, auch in Anführungszeichen und in verschachtelten Shell-Aufrufen (bash -c, pwsh -Command).
// Ablehnung: Exit-Code 2 mit Begründung auf stderr. Tests: node --test .claude/hooks/sperre.test.mjs
import { execSync } from 'node:child_process';

const DEV_REF = 'jalvmzgvxvidgmoxuglp';
const MCP_GESPERRT = /(create_project|pause_project|restore_project)$/;
const SHELL_AUFRUF = /^(-c|-lc|-ic|-command|\/c|\/k)$/i;
const GIT = /^(.*[\\/])?git(\.exe)?$/i;
const SUPABASE = /^(.*[\\/])?supabase(\.exe|\.cmd|@\S*)?$/i;
const GIT_OPTION_MIT_WERT = /^(-C|-c|--git-dir|--work-tree|--namespace|--exec-path|--config-env)$/;

function ablehnen(grund) {
  process.stderr.write(`Gesperrt durch .claude/hooks/sperre.mjs: ${grund}\n`);
  process.exit(2);
}

function aktuellerZweig() {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

// Zerlegt einen Teilbefehl in Wörter; Anführungszeichen umschliessen ein Wort und werden entfernt.
function woerter(teil) {
  const liste = [];
  for (const m of teil.matchAll(/"((?:[^"\\]|\\.)*)"|'([^']*)'|`([^`]*)`|(\S+)/g)) {
    // ungeschützte Wörter können Anführungszeichen mitten im Wort tragen (HEAD:"main")
    liste.push(m[1] ?? m[2] ?? m[3] ?? m[4].replace(/["'`]/g, ''));
  }
  return liste;
}

function pruefePush(args, zweig) {
  if (args.some((a) => /^(--force|--force-with-lease|--force-if-includes|-f|--mirror|--all|--delete|-d|--prune)(=.*)?$/.test(a) || /^\+/.test(a))) {
    return 'Force-Push, --all, Mirror oder Löschen per Push';
  }
  const refs = args.filter((a) => !a.startsWith('-')).slice(1);
  for (const r of refs) {
    const ziel = r.includes(':') ? r.slice(r.lastIndexOf(':') + 1) : r;
    if (/^(refs\/heads\/)?main$/.test(ziel)) return 'main als Push-Ziel';
    if (zweig === 'main' && !r.includes(':') && /^(HEAD|@)$/.test(r)) return 'Push vom Zweig main';
  }
  if (refs.length === 0 && zweig === 'main') return 'Push vom Zweig main';
  return null;
}

function pruefeTeil(teil, zweig) {
  const w = woerter(teil);
  for (let i = 0; i < w.length; i++) {
    // verschachtelte Shell-Aufrufe (bash -c "…", pwsh -Command "…", cmd /c "…") selbst prüfen
    if (i > 0 && SHELL_AUFRUF.test(w[i - 1]) && /\s/.test(w[i])) {
      const innen = pruefeBefehl(w[i], zweig);
      if (innen) return innen;
    }
    if (GIT.test(w[i])) {
      let j = i + 1;
      while (j < w.length && w[j].startsWith('-')) j += GIT_OPTION_MIT_WERT.test(w[j]) ? 2 : 1;
      if (w[j] === 'push') {
        const grund = pruefePush(w.slice(j + 1), zweig);
        if (grund) return grund;
      }
    }
    if (SUPABASE.test(w[i])) {
      const rest = w.slice(i + 1).filter((a) => !a.startsWith('-') || a === '--linked');
      if ((rest[0] === 'db' && rest[1] === 'push') || rest[0] === 'link' || rest.includes('--linked')) {
        return 'supabase db push, link oder --linked (Produktion nur über deploy.yml)';
      }
    }
    if (/^(.*[\\/])?gh(\.exe)?$/i.test(w[i]) && w[i + 1] === 'workflow' && w[i + 2] === 'run') {
      return 'gh workflow run (Workflows starten nur über Merge oder durch Tim)';
    }
  }
  return null;
}

export function pruefeBefehl(befehl, zweig = aktuellerZweig()) {
  for (const zeile of befehl.split(/\r?\n/)) {
    for (const teil of zeile.split(/;|&&|\|\||\|/)) {
      const grund = pruefeTeil(teil, zweig);
      if (grund) return grund;
    }
  }
  const refs = [
    ...befehl.matchAll(/\b([a-z]{20})\.(?:supabase\.(?:co|com|in)|pooler\.supabase)/g),
    ...befehl.matchAll(/\b(?:db|postgres)\.([a-z]{20})\b/g),
    ...befehl.matchAll(/project[-_]ref(?:=|\s+|"?:\s*")\\?["']?([a-z]{20})\b/gi),
    ...befehl.matchAll(/supabase\.com\/dashboard\/project\/([a-z]{20})\b/g),
  ].map((m) => m[1]);
  const fremd = refs.find((r) => r !== DEV_REF);
  if (fremd) {
    return `Supabase-Projekt-Referenz ${fremd} ist nicht hydrovisor-dev`;
  }
  return null;
}

export function pruefeEingabe(eingabe, zweig) {
  const name = eingabe.tool_name ?? '';
  const ti = eingabe.tool_input ?? {};
  if (name === 'Bash' || name === 'PowerShell') {
    return pruefeBefehl(String(ti.command ?? ''), zweig);
  }
  if (name.startsWith('mcp__')) {
    // Der Supabase-MCP-Server kann unter einem beliebigen Namen eingebunden sein; geprüft wird die Eingabe.
    if (MCP_GESPERRT.test(name)) {
      return `MCP-Werkzeug ${name} betrifft andere Projekte`;
    }
    if (typeof ti.project_id === 'string' && /^[a-z]{20}$/.test(ti.project_id) && ti.project_id !== DEV_REF) {
      return `MCP-Aufruf auf Projekt ${ti.project_id} statt hydrovisor-dev`;
    }
    return pruefeBefehl(JSON.stringify(ti), zweig);
  }
  return null;
}

if (process.argv[1]?.endsWith('sperre.mjs')) {
  let roh = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => (roh += d));
  process.stdin.on('end', () => {
    let eingabe;
    try {
      eingabe = JSON.parse(roh || '{}');
    } catch {
      ablehnen('Hook-Eingabe ist kein JSON');
    }
    const grund = pruefeEingabe(eingabe);
    if (grund) ablehnen(grund);
    process.exit(0);
  });
}
