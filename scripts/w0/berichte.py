# Berichte des Lead-Entscheids W0 (Entscheid 0018) aus den Kandidatendateien, ohne gekürzte Zellen (Issue #190, Befund 6 aus PR #189).
# Aufruf im Repository-Wurzelordner:
#   python -X utf8 scripts/w0/berichte.py runde-2
#       erzeugt pruefliste_9-4_runde-2.md neu mit denselben zeile_id wie die bestehende Datei (Teil A und Teil B)
#   python -X utf8 scripts/w0/berichte.py runde-<n> --basis <git-ref> [--issue <nr>]
#       Prüfliste und Lead-Entscheide für alle freigegebenen Zeilen, die gegenüber <git-ref> neu sind oder sich geändert haben
import os
import re
import subprocess
import sys
import csv
import datetime
import io

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from w0lib import Bestand, frei, REGELN, lesen  # noqa: E402

B = 'data/wissensbasis/kandidaten/berichte'
PREFIX = 'Lead nach Entscheid 0018: '


def zelle(s):
    return (s or '').replace('|', '\\|').replace('\n', ' ').strip()


def quellen(b):
    q = {}
    for r in b.alle('quelle'):
        if r['quelle_id'] not in q or r['status'] == 'freigegeben':
            q[r['quelle_id']] = r
    return q


def wert(r):
    if 'samen_je_schwamm' in r:
        return f"{r['samen_je_schwamm']}/{r['obergrenze_samen']}/{r['pflanzen_stehen_lassen']} (Klasse {r['klasse_saatmenge']})"
    if 'groesse' in r:
        if r.get('text_wert'):
            return r['text_wert']
        teile = [x for x in (r['wert_min'], r['wert_typ'], r['wert_max']) if x]
        return ('/'.join(teile) + (' ' + r['einheit_quelle'] if r.get('einheit_quelle') else '')).strip()
    return r.get('wert', '')


def lead(r):
    n = r.get('notiz_tim', '')
    return n[len(PREFIX):] if n.startswith(PREFIX) else n


def zeile(r, q):
    quelle = q.get(r.get('quelle_id', ''), {})
    klasse = r.get('evidenzklasse') or r.get('klasse_saatmenge', '')
    qtext = f"{r['quelle_id']} ({klasse})" if r.get('quelle_id') else f'keine Quelle ({klasse})'
    return '| ' + ' | '.join(zelle(x) for x in (f"`{r['zeile_id']}`", wert(r), qtext, r.get('fundstelle', ''), r.get('kurzzitat', ''),
                                                  quelle.get('link', ''), lead(r))) + ' |'


KOPF = ['| zeile_id | Wert | Quelle (Klasse) | Fundstelle | Kurzzitat | Link | Lead |', '|---|---|---|---|---|---|---|']


def freigegebene(b):
    out = {}
    for n in ('art', 'profilwert', 'saatempfehlung'):
        for r in b.alle(n):
            if r['status'] == 'freigegeben':
                out[r['zeile_id']] = r
    return out


def runde2(b):
    pfad = f'{B}/pruefliste_9-4_runde-2.md'
    with open(pfad, encoding='utf-8') as f:
        alt = f.read().split('\n')
    q = quellen(b)
    fr = freigegebene(b)
    neu = []
    for z in alt:
        m = re.match(r'^\| `([^`]+)` \|', z)
        if m:
            neu.append(zeile(fr[m.group(1)], q))
        else:
            neu.append(z)
    with open(pfad, 'w', encoding='utf-8', newline='') as f:
        f.write('\n'.join(neu))
    print(f'{pfad}: {sum(1 for z in neu if z.startswith("| `"))} Zeilen neu erzeugt')


def basis_frei(ref):
    rows = set()
    for n in ('art', 'profilwert', 'saatempfehlung'):
        txt = subprocess.run(['git', 'show', f'{ref}:data/wissensbasis/freigegeben/{n}.csv'], capture_output=True, text=True,
                             encoding='utf-8').stdout
        for r in csv.DictReader(io.StringIO(txt)):
            rows.add((r['zeile_id'], tuple(sorted(r.items()))))
    return rows


def aktuell_frei(n):
    rows, _ = lesen(f'data/wissensbasis/freigegeben/{n}.csv')
    return rows


def runde_n(b, ref, nr, issue):
    alt = basis_frei(ref)
    neu_ids = set()
    for n in ('art', 'profilwert', 'saatempfehlung'):
        for r in aktuell_frei(n):
            if (r['zeile_id'], tuple(sorted(r.items()))) not in alt:
                neu_ids.add(r['zeile_id'])
    q = quellen(b)
    fr = freigegebene(b)
    rows = [fr[z] for z in sorted(neu_ids) if z in fr]
    art_rows = [r for r in rows if r['zeile_id'].startswith('pw.') and r.get('ebene') == 'art']
    teil_a = [r for r in art_rows if r['phase'] in ('anzucht', 'wachstum') and r['groesse'] in ('ph', 'ec')]
    teil_b = [r for r in rows if r not in teil_a]
    txt = [f'# Prüfliste nach Konzept 9.4, Runde {nr} (Entscheid 0018, Issue #{issue})',
           f'Alle freigegebenen Zeilen, die gegenüber `{ref}` neu sind oder sich geändert haben (100 %, keine Stichprobe). '
           'Teil A: pH und EC der Phasen Anzucht und Wachstum auf Ebene Art. Teil B: übrige Zeilen (Dauern, Kulturgruppen-Mindestzeilen). '
           'Je Zeile Link öffnen, Fundstelle suchen, Kurzzitat und Wert vergleichen; bei eigenem Wert des Lead den Ausgangswert im Kurzzitat '
           'und die Regel in der Spalte Lead prüfen.', '', f'## Teil A ({len(teil_a)})', ''] + KOPF + [zeile(r, q) for r in teil_a]
    txt += ['', f'## Teil B ({len(teil_b)})', ''] + KOPF + [zeile(r, q) for r in teil_b] + ['']
    with open(f'{B}/pruefliste_9-4_runde-{nr}.md', 'w', encoding='utf-8', newline='') as f:
        f.write('\n'.join(txt))
    le = [f'# Lead-Entscheide W0 Runde {nr} (Entscheid 0018, Issue #{issue})',
          f'Stand {datetime.date.today():%d.%m.%Y}. Erzeugt aus den Kandidatendateien (Spalte `notiz_tim` der freigegebenen Zeilen). '
          f'Werkzeug: `scripts/w0/lead_entscheide_runde{nr}.py` mit `scripts/w0/w0lib.py`, Bericht `scripts/w0/berichte.py`.', '',
          '## Fachregeln für offene Werte (A)', '| Regel | Inhalt |', '|---|---|']
    le += [f'| {k} | {v} |' for k, v in REGELN.items()]
    le += ['', '## Neue oder geänderte freigegebene Zeilen auf Ebene Art', '', '| zeile_id | Wert | Quelle (Klasse) | Entscheid |', '|---|---|---|---|']
    for r in rows:
        if r.get('ebene', 'art') == 'art' or r['zeile_id'].startswith(('art.', 'ak.', 'se.')):
            le.append('| ' + ' | '.join(zelle(x) for x in (f"`{r['zeile_id']}`", wert(r),
                                                          f"{r.get('quelle_id', '')} ({r.get('evidenzklasse') or r.get('klasse_saatmenge', '')})",
                                                          lead(r))) + ' |')
    kg = [r for r in rows if r.get('ebene') == 'kulturgruppe']
    le += ['', f'Dazu {len(kg)} Kulturgruppen-Mindestzeilen (V13) als Kopie der neuen Art-Zeilen der Leitkultur bzw. mit «(A) andere Art».', '']
    with open(f'{B}/lead_entscheide_runde-{nr}.md', 'w', encoding='utf-8', newline='') as f:
        f.write('\n'.join(le))
    print(f'Prüfliste Runde {nr}: Teil A {len(teil_a)}, Teil B {len(teil_b)}')


if __name__ == '__main__':
    b = Bestand()
    if sys.argv[1] == 'runde-2':
        runde2(b)
    elif sys.argv[1].startswith('runde-'):
        issue = sys.argv[sys.argv.index('--issue') + 1] if '--issue' in sys.argv else '190'
        runde_n(b, sys.argv[sys.argv.index('--basis') + 1], sys.argv[1].split('-')[1], issue)
