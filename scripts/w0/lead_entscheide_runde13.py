# Lead-Entscheide W0 Runde 13 nach Entscheid 0018 (Issue #258): Umsetztag der Kräuter, Randen und Mangold (Bezug des
# Erntekalenders vor dem Umsetzen, Konzept v1.10 UC15, und der Passung R3.1) und restliche Erntewerte; dazu die in
# Runde 12 wegen Verlagssperre verworfenen Kandidaten, neu geprüft über Lesekopien aus dem eingebauten Browser.
# Aufruf im Repository-Wurzelordner:
#   W0_HEUTE=2026-11-21 python -X utf8 scripts/w0/lead_entscheide_runde13.py              Trockenlauf mit Protokoll
#   W0_HEUTE=2026-11-21 python -X utf8 scripts/w0/lead_entscheide_runde13.py --schreiben  Status nachführen, Übertrag nach freigegeben/
# Nur geprüfte Kandidaten (Methoden- und Quellenprüfung) werden gewählt oder als eigener Wert (Annahme 5) umgerechnet.
# Klasse D erzeugt keine Zeile (03_import_w0.md Abschnitt 2 Punkt 7): Lücken stehen im Bericht lead_entscheide_runde-13.md.
# Konflikte mit freigegebenen Werten: Mangold ernte_ab_d 19 → 28 (Konzept 9.3 Regel 1, Korrektur als neue Zeile nach
# 9.4), Spinat schnitte_max 3 bleibt. Regel D8 (A, neu) für den Umsetztag steht in w0lib.REGELN.
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from w0lib import *  # noqa: F401,F403,E402

b = Bestand()
LOG = []
RN = 'Runde 13 (#258), '


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


def E(zid, basis, wert, grund):
    """eigener Wert (Annahme 5) aus einem geprüften Kandidaten derselben Art; zid ak.<art>.<kf>.<feld> oder art.<art>.<feld>"""
    if not ok(basis):
        LOG.append(('UEBERSPRUNGEN', zid, f'{basis} nicht geprüft'))
        return
    teile = zid.split('.')
    if teile[0] == 'ak':
        _, a, kf, feld = teile
    else:
        _, a, feld = teile
        kf = ''
    neu = eigen(b, zid, basis, dict(art_id=a, kulturform=kf, feld=feld, wert=str(wert)), RN + grund)
    LOG.append(('EIGEN', zid, neu['kandidat_id'], wert))


def V(kid, grund):
    """Lead verwirft einen geprüften Kandidaten ohne Wahl (freigegebener Wert bleibt bzw. Klasse D)"""
    if not ok(kid):
        LOG.append(('UEBERSPRUNGEN', kid, 'nicht geprüft'))
        return
    _, _, r = finde(b, kid)
    r['status'] = 'verworfen'
    r['notiz_tim'] = notiz(RN + grund)
    LOG.append(('VERWORFEN', kid, r['wert']))


ak = 'ak.'
art = 'art.'

# ---------------- Basilikum ----------------
a = 'ocimum_basilicum'
E(f'{art}{a}.umsetzen_ab_d', f'{art}{a}.umsetzen_ab_d#3', 14,
  'Regel D4 (A): «Two weeks after sowing» = 14 Tage ab Saat (Steinwollwürfel 2.5 cm unter LED, danach Hydroponik, '
  'Klasse A; am nächsten an der Anlage, Regel D8); bestätigt von #4, #5 und #6 (je 14 Tage, Iowa State, Klasse B1, '
  'Fachkritik P4: nur bedingt unabhängig); K-basilikum-14: #1 (15) und #2 (18, Floating Raft, Klasse A) und #8 (21, '
  'Klasse C) nicht gewählt; mit dem freigegebenen ernte_ab_d 18 erste Ernte 32 Tage ab Saat (#1 derselben Quelle 33, P2)')
# umsetzen_bis_d bleibt Klasse D (Regel D8): grösster Wert der Klasse A oder B1 ist 18 (#2), unter Keimung typ 9 plus
# Anzucht typ 18 = 27; «Umsetzen überfällig» (bis + 7 = 25) käme vor dem Ende der Anzucht nach Phasen.

# ---------------- Petersilie ----------------
a = 'petroselinum_crispum'
# zuerst bis (Basis #1 wird beim Entscheid von umsetzen_ab_d verworfen)
E(f'{art}{a}.umsetzen_bis_d', f'{art}{a}.umsetzen_ab_d#1', 35,
  'Regel D4 (A): «five weeks after sowing» = 35 Tage ab Saat (Deep-Flow-Tische, Klasse A; dieselbe Quelle wie das '
  'freigegebene ernte_ab_d 28); Regel D8 (A): grösster Wert der Klasse A, über Keimung typ 14 plus Anzucht typ 7 = 21; '
  'Fachkritik P7: als frühester Tag zu spät, als spätester Tag stimmig')
W(f'{art}{a}.umsetzen_ab_d', f'{art}{a}.umsetzen_ab_d#7',
  '21 Tage ab Saat (Phenolschaumwürfel 2.2 cm, danach DWC-Flösse, Klasse A; Lesekopie der Artikelseite, Regel D8: am '
  'nächsten an der Anlage); bestätigt von #2, #3 (je 3 Wochen, Iowa State, Klasse B1) und #6 (3 Wochen, NFT, Klasse A); '
  'gleich Keimung typ 14 plus Anzucht typ 7 (Fachkritik P6), die erste Ernte bleibt 49 Tage ab Saat wie in Runde 12 (P9); '
  'K-petersilie-15: #1 (35) als umsetzen_bis_d verwendet')

# ---------------- Schnittlauch ----------------
a = 'allium_schoenoprasum'
E(f'{art}{a}.umsetzen_bis_d', f'{art}{a}.umsetzen_bis_d#1', 42,
  'Regel D4 (A): «After four to six weeks» obere Grenze 6 Wochen = 42 Tage ab Saat (NFT, Klasse C); Regel D8: die '
  'Quelle nennt selbst einen Bereich; einzige geprüfte Quelle; Fachkritik P9: Bezug ab Saat aus dem Zusammenhang '
  '(Satz nach der Keimung), 28 bis 42 umfasst Keimung typ 10 plus Anzucht typ 21 = 31')
E(f'{art}{a}.umsetzen_ab_d', f'{art}{a}.umsetzen_ab_d#2', 28,
  'Regel D4 (A): «After four to six weeks» untere Grenze 4 Wochen = 28 Tage ab Saat (NFT, Klasse C); Regel D8: Bereich '
  'derselben Quelle; #1 (Salve Regina, 15) und #3 (zugekaufte Setzlinge) in der Methodenprüfung verworfen')

# ---------------- Mangold ----------------
a = 'beta_vulgaris_cicla'
W(f'{art}{a}.umsetzen_ab_d', f'{art}{a}.umsetzen_ab_d#2',
  '21 Tage ab Saat (Steinwollstopfen, danach Floating, Klasse A; Lesekopie der Artikelseite, Runde 12 wegen '
  'Verlagssperre verworfen); einen Tag über Keimung typ 4 plus Anzucht typ 16 = 20 (Fachkritik P10)')
W(f'{art}{a}.umsetzen_bis_d', f'{art}{a}.umsetzen_bis_d#1',
  'Regel D8 (A): 28 Tage ab Saat (Oasis-Würfel, danach NFT, Klasse A; Saat 31.10., Umsetzen 28.11.2023; Lesekopie der '
  'Artikelseite), grösster Wert der Klasse A und über 20; Fachkritik P11: einzelner Versuchstag, als spätester Tag '
  'der Spanne 21 bis 28 aus zwei Quellen verwendet')
W(f'{ak}{a}.schnitt.ernteintervall_d', f'{ak}{a}.schnitt.ernteintervall_d#3',
  '14 Tage zwischen den Schnitten (Floating, Klasse A; Lesekopie der Artikelseite, Runde 12 wegen Verlagssperre '
  'verworfen); Schnitte 28, 42, 56 Tage nach dem Umsetzen (Fachkritik P15)')
# K-mangold-02 (Konflikt mit dem freigegebenen Wert 19 aus Runde 12; Befund 2 des Prüfers, Runde 1): Konzept 9.3
# Regel 1 (höhere Klasse vor tieferer) gibt #5 (28 ab Umsetzen, Floating, Klasse A, gemessen) den Vorrang vor dem
# eigenen Wert 19 (Klasse B2, nach D7 aus «Day 39» ab Saat). 28 liegt im Wachstum 24 bis 38 (19 lag unter min 24,
# Fachkritik P14) und passt zum Umsetztag 21 derselben Quelle: erste Ernte 21 + 28 = 49 Tage ab Saat wie in der Quelle.
# Korrektur nach Konzept 9.4 als neue W0-Zeile; der Seed schliesst die alte Fassung (gueltig_bis).
W(f'{ak}{a}.schnitt.ernte_ab_d', f'{ak}{a}.schnitt.ernte_ab_d#5',
  'K-mangold-02, Konzept 9.3 Regel 1 (höhere Klasse vor tieferer): 28 Tage ab Umsetzen bis zum ersten Schnitt '
  '(Floating, Klasse A, gemessen; Lesekopie der Artikelseite, Runde 12 wegen Verlagssperre verworfen) statt 19 aus '
  'Runde 12 (Klasse B2, eigener Wert nach D7); im Wachstum 24 bis 38 (Fachkritik P14) und mit dem Umsetztag 21 '
  'derselben Quelle erste Ernte 49 Tage ab Saat wie in der Quelle; die festen Schnitttermine 28, 42, 56 Tage nach dem '
  'Umsetzen tragen ernte_ab_d und Intervall gleichermassen')
_, _, alt = finde(b, f'{ak}{a}.schnitt.ernte_ab_d#4')
alt['notiz_tim'] = notiz(RN + 'ersetzt durch ak.beta_vulgaris_cicla.schnitt.ernte_ab_d#5 (K-mangold-02, Konzept 9.3 '
                         'Regel 1: Klasse A vor B2); vorher: ' + alt['notiz_tim'].removeprefix('Lead nach Entscheid 0018: '))

# ---------------- Randen ----------------
a = 'beta_vulgaris_conditiva'
W(f'{art}{a}.umsetzen_ab_d', f'{art}{a}.umsetzen_ab_d#2',
  '9 Tage ab Saat (Kokosfaser-Platten ohne Nährlösung, danach NFT, Klasse A; frei auf SciELO); einzige geprüfte '
  'Quelle, die MDPI-Arbeit (14 Tage) liegt nur als PDF vor; Fachkritik P12: unter Keimung min 2 plus Anzucht min 8 = 10 '
  'und unter dem Phasenwert 13, Babyleaf-Versuch; die App setzt die Reservierung damit früh, die Phasen bleiben')

# ---------------- Spinat ----------------
a = 'spinacia_oleracea'
W(f'{ak}{a}.babyleaf.kulturdauer_max_d', f'{ak}{a}.babyleaf.kulturdauer_max_d#3',
  'spätester Babyleaf-Erntetermin 46 Tage ab Saat (längster von drei gemessenen Zyklen 46, 43, 28 im Floating-System, '
  'einmalige Ernte und Ersatz, Klasse A; Lesekopie der Artikelseite, Runde 12 wegen Verlagssperre verworfen); '
  'Fachkritik P19: fast das Dreifache von typisch 16, als Höchstwert stimmig (V11 typ ≤ max)')
# Spinat Schnitt ernte_ab_d bleibt Klasse D: #2 (34 ab Umsetzen) stammt aus einem Winterversuch mit Wassertemperatur 6
# bis 15 °C und liegt über Wachstum max 28 (Fachkritik P16); erste Ernte 43 Tage ab Saat passt nicht zur Anlage (LED,
# warmes Wasser). K-spinat-09: schnitte_max bleibt 3; #4 (5) ist der Versuchsplan bis Versuchsende (P18).
V(f'{ak}{a}.schnitt.ernte_ab_d#2', 'Winterversuch mit Wassertemperatur 6 bis 15 °C, über Wachstum max 28 (Fachkritik P16); erste Ernte 43 Tage ab Saat '
  'passt nicht zur Anlage mit LED und warmem Wasser; Spinat Schnitt ernte_ab_d bleibt Klasse D')
V(f'{ak}{a}.schnitt.schnitte_max#4', 'K-spinat-09: freigegeben bleibt 3 (Cornell); 5 ist der Versuchsplan bis zum Versuchsende, keine Aussage zur '
  'Kultur (Fachkritik P18)')

# ---------------- Tomate ----------------
a = 'solanum_lycopersicum'
W(f'{ak}{a}.dauerkultur_frucht.ernteintervall_d', f'{ak}{a}.dauerkultur_frucht.ernteintervall_d#1',
  'Ernte alle 7 Tage («Every-seven days», Perlit-Hydroponik im Gewächshaus, Klasse A); gleich dem Chili-Intervall 7 '
  '(Fachkritik P20)')

if '--schreiben' in sys.argv:
    uebertrag(b, LOG)
for x in LOG:
    print(*x)
