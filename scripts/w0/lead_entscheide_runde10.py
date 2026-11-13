# Lead-Entscheide W0 Runde 10 nach Entscheid 0018 und 0022 (Issue #202). Aufruf im Repository-Wurzelordner:
#   python -X utf8 scripts/w0/lead_entscheide_runde10.py              Trockenlauf mit Protokoll
#   python -X utf8 scripts/w0/lead_entscheide_runde10.py --schreiben  Status nachführen, V13 nachführen, Übertrag nach freigegeben/
# Bestehende freigegebene Zeilen bleiben im Wert unverändert; ein Ersatz entsteht nur als neuer Kandidat derselben zeile_id
# (der bisherige Kandidat wird verworfen und nennt den Ersatz in notiz_tim). Einmalig für Runde 10 (13.11.2026); Aufruf mit W0_HEUTE=2026-11-13.
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from w0lib import *  # noqa: F401,F403,E402

b = Bestand()
LOG = []
RN = 'Runde 10 (Entscheid 0022), '


def ok(kid):
    try:
        _, _, r = finde(b, kid)
    except KeyError:
        return False
    return r['status'] in OK + ('freigegeben',)


def _ersetzt(zid, neu_kid, vorher):
    if vorher is not None and vorher['kandidat_id'] != neu_kid and vorher['status'] == 'verworfen':
        vorher['notiz_tim'] = vorher['notiz_tim'] + f'; ersetzt in Runde 10 durch {neu_kid} (Issue #202)'


def E(zid, basis, felder, grund):
    """eigener Wert (Annahme 5) aus einem geprüften oder freigegebenen Kandidaten"""
    if not ok(basis):
        LOG.append(('UEBERSPRUNGEN', zid, f'{basis} nicht geprüft'))
        return None
    vorher = frei(b, zid)
    neu = eigen(b, zid, basis, felder, RN + grund)
    _ersetzt(zid, neu['kandidat_id'], vorher)
    LOG.append(('EIGEN', zid, {k: v for k, v in felder.items() if k.startswith('wert')}))
    return neu


def W(zid, kid, grund):
    """Auswahl eines ladbaren Kandidaten der Hauptdatei"""
    if not ok(kid) or finde(b, kid)[1].endswith('_offen'):
        LOG.append(('UEBERSPRUNGEN', zid, f'{kid} nicht geprüft oder offen'))
        return
    vorher = frei(b, zid)
    freigeben(b, zid, kid, RN + grund)
    _ersetzt(zid, kid, vorher)
    LOG.append(('WAHL', zid, kid))


P = 'pw.'

# ---------------- Restlücken nach Entscheid 0022 (Anbauquellen für Dauer und Keimart, Klasse C) ----------------
# Tomate: Blüte bis erste Frucht in typischer Grösse (Wechselmerkmal BBCH 71), Cherry-Genotypen im Gewächshaus
a = 'solanum_lycopersicum'
E(f'{P}{a}.bluete.dauer', f'{P}{a}.bluete.dauer#3', d3(30),
  'Regel D3 (A): «De flor a fruto de tamaño típico» 30 d (BBCH 601 bei 44 ddt bis 701 bei 74 ddt), Bezug genau das '
  'Wechselmerkmal BBCH 71; drei Cherry-Genotypen wie Tims Sorten; einziger geprüfter Kandidat')

# Schnittlauch
a = 'allium_schoenoprasum'
E(f'{P}{a}.keimung.dauer', f'{P}{a}.keimung.dauer#8', d1(7, 14),
  'Regel D1 (A): 7 bis 14 Tage bei 18 bis 21 °C (Raumtemperatur der Anlage); bestätigt durch #10 (7 bis 14), '
  '#4 (8 bis 10, Hydroponik-Seite) und #11 (etwa 7); #6 und #9 (bis 25 bzw. 21 Tage) gelten für kühlere Aussaat')
E(f'{P}{a}.anzucht.dauer', f'{P}{a}.anzucht.dauer#8', {'wert_min': '18', 'wert_typ': '21', 'wert_max': '34'},
  'Regel D2 (A): typ 21 aus #8 (umsetzbereit mit etwa 4 Wochen, Auflaufen nach etwa 7 Tagen: 28 minus 7); '
  'min 18 und max 34 aus #4 (4 bis 6 Wochen ab Saat minus Keimung 8 bis 10 Tage derselben Quelle); '
  '#7 (Ball-Plug-Chart, 28 bis 42 Tage bis zum verkaufsfertigen Jungpflanzenballen) und #5 (Winteranzucht in Erdpresstöpfen) länger, nicht gewählt')

# Nüsslisalat
a = 'valerianella_locusta'
W(f'{P}{a}.keimung.keimart', f'{P}{a}.keimung.keimart#1',
  'einziger geprüfter Kandidat («da Feldsalat ein Dunkelkeimer ist»), Klasse C nach Entscheid 0022')
E(f'{P}{a}.keimung.dauer', f'{P}{a}.keimung.dauer#3', d1(8, 14),
  'Regel D1 (A): 8 bis 14 Tage bei 15 bis 18 °C (ProSpecieRara, Schweiz); übereinstimmend #2 und #6 (je 8 bis 14), '
  '#1 10 bis 14; #5 und #7 (bis 21 bzw. 28, Keimtest bis Endauszählung) nicht gewählt')
E(f'{P}{a}.anzucht.dauer', f'{P}{a}.anzucht.dauer#1', dict(d3(11), evidenzklasse='C'),
  'Regel D3/D5 (A): umgesetzt 22 Tage nach der Saat (Floating, Klasse A) minus Keimdauer typ 11 (keimung.dauer, '
  'Klasse C) = 11 Tage; Klasse C, weil die Aufteilung auf einer Anbauquelle beruht')


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
            n = anlegen(b, g, 'profilwert', neu, f'{RN}Mindestzeile V13 als Kopie von {quelle["kandidat_id"]} ({wie}); ersetzt {alt}')
            _ersetzt(r['zeile_id'], n['kandidat_id'], r)
            LOG.append(('V13_NEU', r['zeile_id'], quelle['kandidat_id']))


v13_nachfuehren()
v13(b, LOG, ersatz={'kraut_einjaehrig': ['lactuca_sativa'], 'kraut_ausdauernd': ['ocimum_basilicum', 'lactuca_sativa']})

if '--schreiben' in sys.argv:
    uebertrag(b, LOG)
for x in LOG:
    print(*x)
