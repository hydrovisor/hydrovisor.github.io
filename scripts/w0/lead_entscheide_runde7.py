# Lead-Entscheide W0 Runde 7 nach Entscheid 0018 (Issue #190). Aufruf im Repository-Wurzelordner:
#   python -X utf8 scripts/w0/lead_entscheide_runde7.py              Trockenlauf mit Protokoll
#   python -X utf8 scripts/w0/lead_entscheide_runde7.py --schreiben  Status nachführen, V13 nachführen, Übertrag nach freigegeben/
# Bestehende freigegebene Zeilen bleiben im Wert unverändert; ein Ersatz entsteht nur als neuer Kandidat derselben zeile_id
# (der bisherige Kandidat wird verworfen und nennt den Ersatz in notiz_tim). Einmalig für Runde 7 (12.11.2026).
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from w0lib import *  # noqa: F401,F403,E402

b = Bestand()
LOG = []
R7 = 'Runde 7, '


def ok(kid):
    try:
        _, _, r = finde(b, kid)
    except KeyError:
        return False
    return r['status'] in OK + ('freigegeben',)


def _ersetzt(zid, neu_kid, vorher):
    if vorher is not None and vorher['kandidat_id'] != neu_kid and vorher['status'] == 'verworfen':
        vorher['notiz_tim'] = vorher['notiz_tim'] + f'; ersetzt in Runde 7 durch {neu_kid} (Issue #190)'


def E(zid, basis, felder, grund):
    """eigener Wert (Annahme 5) aus einem geprüften oder freigegebenen Kandidaten"""
    if not ok(basis):
        LOG.append(('UEBERSPRUNGEN', zid, f'{basis} nicht geprüft'))
        return None
    vorher = frei(b, zid)
    neu = eigen(b, zid, basis, felder, R7 + grund)
    _ersetzt(zid, neu['kandidat_id'], vorher)
    LOG.append(('EIGEN', zid, {k: v for k, v in felder.items() if k.startswith('wert')}))
    return neu


def zitat(*kids):
    rows = [finde(b, k)[2] for k in kids]
    return ' … '.join(r['kurzzitat'] for r in rows)


P = 'pw.'

# ---------------- Befund 1 aus PR #189: Anzucht-EC frankiesgarten als Band aus Anzucht- und Jungpflanzenstufe ----------------
for a in ('petroselinum_crispum', 'allium_schoenoprasum'):
    z = f'{P}{a}.anzucht.ec'
    E(z, f'{z}#1', {'wert_min': '0.4', 'wert_typ': '', 'wert_max': '0.8', 'kurzzitat': zitat(f'{z}#1', f'{z}#2'),
                    'fundstelle': 'Abschnitt «Nach der Keimung: Der erste Dünger», Tabelle der Düngestufen, Zeilen «erste Blätter» (0,5 ml/l, EC 0,4 bis 0,6) und «Jungpflanze» (1 ml/l, EC 0,6 bis 0,8)'},
      '(A) Band aus den beiden Stufen derselben Tabelle (erste Blätter 0.4 bis 0.6 #1, Jungpflanze 0.6 bis 0.8 #2) wie bei Basilikum und Chili; Befund 1 aus PR #189')
z = f'{P}beta_vulgaris_conditiva.anzucht.ec'
E(z, f'{z}#2', {'wert_min': '0.5', 'wert_typ': '', 'wert_max': '1.2', 'kurzzitat': zitat(f'{z}#3', f'{z}#2'),
                'fundstelle': 'Abschnitt «Anzuchtkarte: Dünger, EC und pH», Spalte «EC (mS/cm)», erste Zeile (Keimling, erste Blätter, 0,5) und Zeile Jungpflanze (0,8 bis 1,2), vor dem Umsetzen'},
  '(A) Band aus den beiden Stufen derselben Anzuchtkarte (Keimling 0.5 #3, Jungpflanze 0.8 bis 1.2 #2) wie bei Basilikum und Chili; Befund 1 aus PR #189')

# ---------------- Lücken der sieben Arten (nach Methoden- und Quellenprüfung Runde 7) ----------------
# Basilikum: #8 (A, Schwammwürfel 2.3 cm unter LED wie die Anlage) 20 Tage ab Saat bis Umsetzen minus Keimung 48 h = 18 Tage;
# #5, #6 (B2, Rise Gardens, DWC) je 7 Tage; #7 (B2) 7 bis 10 Tage ab Keimung.
a = 'ocimum_basilicum'
E(f'{P}{a}.anzucht.dauer', f'{P}{a}.anzucht.dauer#8', {'wert_min': '7', 'wert_typ': '18', 'wert_max': '23'},
  'Regel D2/D3 (A): typ 18 aus #8 (A, 20 Tage ab Saat minus Keimung 2 Tage, Schwammwürfel unter LED wie die Anlage, Regel 1 und 2), '
  'min 7 aus #5, #6 und #7 (B2, Rise Gardens), max 1.25·18 wie bei der Keimdauer Petersilie (#8 ist der grösste Quellenwert)')

# Petersilie: #4 und #5 (B2, Rise Gardens, DWC) je 15 minus 8 = 7 Tage, gleicher Wert
a = 'petroselinum_crispum'
E(f'{P}{a}.anzucht.dauer', f'{P}{a}.anzucht.dauer#4', d3(7),
  'Regel D3 (A): 7 Tage ab Keimung bis Umsetzen (Stufen «Germination» und «Move to Garden» derselben Seite), bestätigt durch #5 (Rise Gardens, andere Sorte)')

# Mangold: #1 (A, Steinwolle, danach stehende Nährlösung wie Kratky) 21 minus 5 = 16; #4 (A, Steinwolle, Ebbe-Flut, HPS) 10
a = 'beta_vulgaris_cicla'
E(f'{P}{a}.anzucht.dauer', f'{P}{a}.anzucht.dauer#1', {'wert_min': '10', 'wert_typ': '16', 'wert_max': '20'},
  'Regel D2/D3 (A): typ 16 aus #1 (A, stehende Nährlösung wie Kratky, Regel 2), min 10 aus #4 (A, Ebbe-Flut), max 1.25·16 (#1 ist der grösste Quellenwert)')

# Randen (Blattnutzung): Anzucht #1 (A) 14 minus 4 = 10; Wachstum #1 (A, Floss wie DWC) 17, #3 (A, NFT) 21
a = 'beta_vulgaris_conditiva'
E(f'{P}{a}.anzucht.dauer', f'{P}{a}.anzucht.dauer#1', d3(10), 'Regel D3 (A): 14 Tage ab Saat bis Umsetzen minus Keimkammer 4 Tage derselben Quelle')
E(f'{P}{a}.wachstum.dauer', f'{P}{a}.wachstum.dauer#1', {'wert_min': '14', 'wert_typ': '17', 'wert_max': '21'},
  'Regel D2/D3 (A): typ 17 aus #1 (A, Floating wie DWC der Anlage, Regel 2), max 21 aus #3 (A, NFT, Ernte 30 minus Umsetzen 9 Tage ab Saat), '
  'min 0.8·17 (#1 ist der kleinste Quellenwert); #2 (frankiesgarten, 8 bis 10 Wochen) gilt der Knollenernte, nicht der Blattnutzung')

# Tomate: nur Wachstum (Blüte und Fruchtbildung ohne Kandidaten mit Bezug ab Fruchtansatz, Klasse D)
a = 'solanum_lycopersicum'
E(f'{P}{a}.wachstum.dauer', f'{P}{a}.wachstum.dauer#3', {'wert_min': '16', 'wert_typ': '28', 'wert_max': '35'},
  'Regel D2/D3 (A): typ 28 aus #3 (A, NFT als Wasserkultur am nächsten an DWC und Kratky, Regel 2), min 16 aus #5 (A, Kokos, 15.87 gerundet), '
  '#4 (A, Steinwolle, 21.4 bis 22.6) liegt dazwischen; max 1.25·28 (#3 ist der grösste Quellenwert)')


# ---------------- Kulturgruppen-Mindestzeilen (V13) nachführen ----------------
def v13_nachfuehren():
    for g, leit in LEITKULTUR.items():
        for r in list(b.d[(g, 'profilwert')]):
            if r['status'] != 'freigegeben' or r.get('ebene') != 'kulturgruppe':
                continue
            m = re.search(r'Kopie von (\S+)', r.get('notiz_tim', ''))
            if not m:
                continue
            _, _, src = finde(b, m.group(1))
            _, _, phase, groesse = r['zeile_id'].split('.')
            leit_row = frei(b, f'pw.{leit}.{phase}.{groesse}')
            if leit_row is not None and (src['status'] != 'freigegeben' or src['bezug'] != leit):
                quelle, wie = leit_row, 'Leitkultur'
            elif src['status'] != 'freigegeben' and frei(b, src['zeile_id']) is not None:
                quelle, wie = frei(b, src['zeile_id']), '(A) andere Art, Leitkultur ohne Wert'
            else:
                continue
            neu = {k: quelle.get(k, '') for k in b.kopf[(g, 'profilwert')]}
            neu.update(zeile_id=r['zeile_id'], ebene='kulturgruppe', bezug=g, konflikt_id='',
                       methodenpruefung=quelle.get('methodenpruefung', ''), quellenpruefung=quelle.get('quellenpruefung', ''),
                       freigegeben_am='', notiz_tim='')
            alt = r['kandidat_id']
            n = anlegen(b, g, 'profilwert', neu, f'{R7}Mindestzeile V13 als Kopie von {quelle["kandidat_id"]} ({wie}); ersetzt {alt}')
            _ersetzt(r['zeile_id'], n['kandidat_id'], r)
            LOG.append(('V13_NEU', r['zeile_id'], quelle['kandidat_id']))


v13_nachfuehren()
v13(b, LOG, ersatz={'kraut_einjaehrig': ['lactuca_sativa'], 'kraut_ausdauernd': ['ocimum_basilicum', 'lactuca_sativa']})

if '--schreiben' in sys.argv:
    uebertrag(b, LOG)
for x in LOG:
    print(*x)
