# Lead-Entscheide W0 Runde 8 nach Entscheid 0018 (Issue #193). Aufruf im Repository-Wurzelordner:
#   python -X utf8 scripts/w0/lead_entscheide_runde8.py              Trockenlauf mit Protokoll
#   python -X utf8 scripts/w0/lead_entscheide_runde8.py --schreiben  Status nachführen, V13 nachführen, Übertrag nach freigegeben/
# Bestehende freigegebene Zeilen bleiben im Wert unverändert; ein Ersatz entsteht nur als neuer Kandidat derselben zeile_id
# (der bisherige Kandidat wird verworfen und nennt den Ersatz in notiz_tim). Einmalig für Runde 8 (13.11.2026).
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from w0lib import *  # noqa: F401,F403,E402

b = Bestand()
LOG = []
RN = 'Runde 8, '


def ok(kid):
    try:
        _, _, r = finde(b, kid)
    except KeyError:
        return False
    return r['status'] in OK + ('freigegeben',)


def _ersetzt(zid, neu_kid, vorher):
    if vorher is not None and vorher['kandidat_id'] != neu_kid and vorher['status'] == 'verworfen':
        vorher['notiz_tim'] = vorher['notiz_tim'] + f'; ersetzt in Runde 8 durch {neu_kid} (Issue #193)'


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

# ---------------- Restlücken (nach Methoden- und Quellenprüfung Runde 8) ----------------
# Schnittlauch: Salve Regina (B1, Turmsystem) «Days Dark: 8 / Days under Light: 7 / Transferred to Grow System on day 15»
a = 'allium_schoenoprasum'
E(f'{P}{a}.keimung.dauer', f'{P}{a}.keimung.dauer#3', d3(8), 'Regel D3 (A): Dunkelkeimung 8 Tage bis zum Auflaufen, danach unter Licht (Salve Regina)')
E(f'{P}{a}.anzucht.dauer', f'{P}{a}.anzucht.dauer#3', d3(7),
  'Regel D3/D5 (A): 7 Tage unter Licht bis zum Umsetzen am Tag 15 (15 minus Dunkelkeimung 8 derselben Quelle)')

# Nüsslisalat: Anzucht ab Keimung (Keimdauer bleibt Klasse D)
a = 'valerianella_locusta'
E(f'{P}{a}.anzucht.dauer', f'{P}{a}.anzucht.dauer#3', d3(14), 'Regel D3 (A): umgesetzt 14 Tage nach der Keimung (Vertical Farm, LED)')

# Tomate: Blüte und Fruchtbildung aus derselben Arbeit (Mittel der Behandlungen wie ein Einzelwert, wie Chili Chapingo 2011)
a = 'solanum_lycopersicum'
E(f'{P}{a}.bluete.dauer', f'{P}{a}.bluete.dauer#2', d3(14),
  'Regel D3 (A): Fruchtansatz 28.00 bis 28.67 minus Blüte 14.00 Tage nach dem Umsetzen = 14.0 bis 14.7, gerundet 14; '
  'Spannweite der Behandlungen einer Quelle wie ein Einzelwert behandelt (wie Chili bluete.dauer, Chapingo 2011)')
E(f'{P}{a}.fruchtbildung_reife.dauer', f'{P}{a}.fruchtbildung_reife.dauer#5', d3(59),
  'Regel D3 (A): erste Ernte minus Fruchtansatz derselben Arbeit = 58.5 bis 59.1, gerundet 59 (wie Chili fruchtbildung_reife.dauer 58)')

# Mangold: Anzucht-pH (einziger Kandidat in Validatorform) und Anzucht-EC
a = 'beta_vulgaris_cicla'
W(f'{P}{a}.anzucht.ph', f'{P}{a}.anzucht.ph#3', 'einziger geprüfter Kandidat in Validatorform (frankiesgarten, Zeile Mangold mit Stufe Anzucht); bestätigt durch #4 (Plants 2021, Klasse A, pH 6.5 der Sämlingslösung, im Band), kein Konflikt nach Regel 1')
E(f'{P}{a}.anzucht.ec', f'{P}{a}.anzucht.ec#5', band(0.68),
  'Regel E1 (A): Einzelwert 0.68 mS/cm der Sämlingslösung (Klasse A, Indoor-LED) vor #3 und #4 (frankiesgarten, Klasse C, Regel 1)')


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
