# Lead-Entscheide W0 Runde 11 nach Entscheid 0018 (Issue #242): Kulturform-Felder für den Erntekalender (UC15) und die
# Kulturfrage (R1.7). Aufruf im Repository-Wurzelordner:
#   W0_HEUTE=2026-11-18 python -X utf8 scripts/w0/lead_entscheide_runde11.py              Trockenlauf mit Protokoll
#   W0_HEUTE=2026-11-18 python -X utf8 scripts/w0/lead_entscheide_runde11.py --schreiben  Status nachführen, Übertrag nach freigegeben/
# Nur geprüfte Kandidaten (Methoden- und Quellenprüfung) werden gewählt oder als eigener Wert (Annahme 5) umgerechnet.
# Klasse D erzeugt keine Zeile (03_import_w0.md Abschnitt 2 Punkt 7): Lücken stehen im Bericht lead_entscheide_runde-11.md.
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from w0lib import *  # noqa: F401,F403,E402

b = Bestand()
LOG = []
RN = 'Runde 11 (#242), '


def ok(kid):
    try:
        _, _, r = finde(b, kid)
    except KeyError:
        return False
    return r['status'] in OK + ('freigegeben',)


def W(zid, kid, grund):
    """Auswahl eines geprüften Kandidaten"""
    if not ok(kid):
        LOG.append(('UEBERSPRUNGEN', zid, f'{kid} nicht geprüft'))
        return
    freigeben(b, zid, kid, RN + grund)
    LOG.append(('WAHL', zid, kid, finde(b, kid)[2]['wert']))


def E(zid, basis, wert, grund, **felder):
    """eigener Wert (Annahme 5) aus einem geprüften Kandidaten; bei anderer zeile_id mit Kulturform und Feld der Ziel-Zeile"""
    if not ok(basis):
        LOG.append(('UEBERSPRUNGEN', zid, f'{basis} nicht geprüft'))
        return
    _, a, kf, feld = zid.split('.')
    neu = eigen(b, zid, basis, dict(art_id=a, kulturform=kf, feld=feld, wert=str(wert), **felder), RN + grund)
    LOG.append(('EIGEN', zid, neu['kandidat_id'], wert))


ak = 'ak.'

# ---------------- Salat (Schnitt, mehrfach) ----------------
a = 'lactuca_sativa'
E(f'{ak}{a}.schnitt.ernteintervall_d', f'{ak}{a}.schnitt.ernteintervall_d#1', 7,
  'Regel D4 (A): 1 Woche = 7 Tage («weekly harvests», Floating-Schalen, Klasse A)')
W(f'{ak}{a}.schnitt.schnitte_max', f'{ak}{a}.schnitt.schnitte_max#1',
  'Empfehlung der Quelle: nach zwei Schnitten neu säen (Klasse A); im Versuch mehr Schnitte bei sinkendem Ertrag')
E(f'{ak}{a}.schnitt.kulturdauer_max_d', f'{ak}{a}.schnitt.kulturdauer_max_d#1', 42,
  'Regel D4 (A): 6 Wochen ab Saat = 42 Tage, bis zum zweiten Schnitt (passt zu schnitte_max 2 und Intervall 7)')

# ---------------- Nüsslisalat (Kopf) ----------------
a = 'valerianella_locusta'
W(f'{ak}{a}.kopf.kulturdauer_max_d', f'{ak}{a}.kopf.kulturdauer_max_d#2',
  'letzter Erntetermin bei Marktreife 66 Tage ab Saat (Topfkultur mit Nährlösung, Klasse A); ≥ kulturdauer_typisch_d 51')

# ---------------- Tomate und Chili (Dauerkultur Frucht) ----------------
a = 'solanum_lycopersicum'
W(f'{ak}{a}.dauerkultur_frucht.kulturdauer_max_d', f'{ak}{a}.dauerkultur_frucht.kulturdauer_max_d#1',
  'Jahresplan Gewächshaus-Hydroponik «Day 364 Remove Plants» (Klasse B1)')
a = 'capsicum_annuum'
E(f'{ak}{a}.dauerkultur_frucht.ernteintervall_d', f'{ak}{a}.dauerkultur_frucht.ernteintervall_d#1', 7,
  'Regel D4 (A): «once a week» = 7 Tage (Gewächshaus-Hydroponik, Klasse B1); dieselbe Stelle nennt zweimal je Woche als '
  'üblich, die Anlage erntet für den Eigenbedarf wöchentlich',
  fundstelle='Kapitel 8, S. 8-4 (Abschnitt «HARVESTING» beginnt auf S. 8-3), Unterabschnitt «Pepper» '
             '(Gewächshaus-Hydroponik); Seite nach der Quellenprüfung')
# Chili kulturdauer_max_d: zuerst als eigener Wert von der Tomate (364) freigegeben, nach Befund 1 des Prüfers
# zurückgenommen (Quelle belegt die Tomate, nicht Chili; Konzept 9.3 Regel 4). Lücke im Bericht.

# ---------------- Pak Choi (Kopf) ----------------
a = 'brassica_rapa_chinensis'
W(f'{ak}{a}.kopf.kulturdauer_max_d', f'{ak}{a}.kopf.kulturdauer_max_d#1',
  'obere Grenze für grosse Sorten, Zählung ab Saat (Quellenprüfung), Klasse B2; ≥ kulturdauer_typisch_d 32')

# ---------------- Basilikum ----------------
a = 'ocimum_basilicum'
# zuerst die Dauerkultur: der Basiskandidat ist danach als «nicht gewählt» verworfen
E(f'{ak}{a}.dauerkultur_blatt.ernteintervall_d', f'{ak}{a}.schnitt.ernteintervall_d#2', 21,
  'Regel D4 (A): «roughly 3 week intervals» = 21 Tage; die Quelle nennt das Schnittintervall des Basilikums ohne '
  'Bezug auf eine Kulturform, gilt also auch für die Dauerkultur (Vorgabe der Art)')
E(f'{ak}{a}.schnitt.ernteintervall_d', f'{ak}{a}.schnitt.ernteintervall_d#2', 21,
  'Regel D4 (A): «roughly 3 week intervals» = 21 Tage (Klasse B1)')

# ---------------- Petersilie (Dauerkultur Blatt) ----------------
a = 'petroselinum_crispum'
E(f'{ak}{a}.dauerkultur_blatt.ernteintervall_d', f'{ak}{a}.dauerkultur_blatt.ernteintervall_d#2', 7,
  'Regel D4 (A): wöchentliche Ernte = 7 Tage (Perlit-Türme, Klasse A); bestätigt durch #1 (NFT, Klasse B1)')

# ---------------- Schnittlauch (Dauerkultur Blatt) ----------------
a = 'allium_schoenoprasum'
E(f'{ak}{a}.dauerkultur_blatt.kulturdauer_max_d', f'{ak}{a}.dauerkultur_blatt.kulturdauer_max_d#1', 730,
  'Regel D4 sinngemäss (A): «replacing plants every two years» = 2 × 365 Tage (Hydroponik-Praxis, Klasse C)')

# ---------------- Spinat (Schnitt) ----------------
a = 'spinacia_oleracea'
E(f'{ak}{a}.schnitt.ernteintervall_d', f'{ak}{a}.schnitt.ernteintervall_d#1', 7,
  'Regel D4 (A): 1 Woche = 7 Tage (Cornell CEA, Klasse B1)')
W(f'{ak}{a}.schnitt.schnitte_max', f'{ak}{a}.schnitt.schnitte_max#2',
  'drei Schnitte je Pflanze (Cornell CEA, Klasse B1); #3 (5 Schnitte, Klasse A) wegen gesperrter Quelle nicht geprüft')

if '--schreiben' in sys.argv:
    uebertrag(b, LOG)
for x in LOG:
    print(*x)
