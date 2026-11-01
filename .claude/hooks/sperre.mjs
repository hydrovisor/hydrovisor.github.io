#!/usr/bin/env node
// PreToolUse-Hook (Konzept 12.4): lehnt Befehle ab, die main als Push-Ziel haben, Force-Push,
// supabase db push / link und jede Supabase-Projekt-Referenz ausser hydrovisor-dev.
// Die Deny-Regeln in settings.json sind musterbasiert; dieser Hook prüft den ganzen Befehl.
// Ablehnung: Exit-Code 2 mit Begründung auf stderr. Aufruf von Hand zum Testen:
//   echo '{"tool_name":"Bash","tool_input":{"command":"git push origin main"}}' | node .claude/hooks/sperre.mjs
import { execSync } from 'node:child_process';

const DEV_REF = 'jalvmzgvxvidgmoxuglp';
const MCP_GESPERRT = /(create_project|pause_project|restore_project)$/;

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

export function pruefeBefehl(befehl, zweig = aktuellerZweig()) {
  const text = befehl.replace(/\s+/g, ' ');
  // Einzelbefehle getrennt prüfen (;, &&, ||, |, Zeilenumbruch)
  for (const teil of text.split(/;|&&|\|\||\||\n/)) {
    const push = teil.match(/\bgit\b(?:\s+-[cC]\s+\S+)*\s+push\b(.*)$/);
    if (push) {
      const args = push[1].trim().split(' ').filter(Boolean);
      if (args.some((a) => /^(--force|--force-with-lease|--force-if-includes|-f|--mirror|--delete|-d)(=.*)?$/.test(a) || /^\+/.test(a))) {
        return 'Force-Push, Mirror oder Löschen per Push';
      }
      const refs = args.filter((a) => !a.startsWith('-')).slice(1);
      if (refs.some((r) => /(^|:)(refs\/heads\/)?main$/.test(r))) {
        return 'main als Push-Ziel';
      }
      if (refs.length === 0 && zweig === 'main') {
        return 'Push vom Zweig main';
      }
    }
    if (/\bsupabase\b.*\b(db\s+push|link)\b/.test(teil)) {
      return 'supabase db push oder supabase link (Produktion nur über deploy.yml)';
    }
  }
  const refs = [
    ...text.matchAll(/\b([a-z]{20})\.(?:supabase\.(?:co|com|in)|pooler\.supabase)/g),
    ...text.matchAll(/\b(?:db|postgres)\.([a-z]{20})\b/g),
    ...text.matchAll(/project[-_]ref(?:=|\s+|":\s*")([a-z]{20})\b/gi),
    ...text.matchAll(/supabase\.com\/dashboard\/project\/([a-z]{20})\b/g),
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

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('sperre.mjs')) {
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
