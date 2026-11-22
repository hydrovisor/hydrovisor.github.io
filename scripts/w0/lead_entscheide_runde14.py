# Lead-Entscheide W0 Runde 14 nach Entscheid 0018 (Issue #266): «Ernte ab» für Schnittlauch und Spinat Schnitt (damit der
# Erntekalender dort nicht mehr «Termine noch offen» zeigt), Schnittlauch-Intervall, Randen «Umsetzen bis» und Mangold
# Schnitte max.; Grundlage Fachkritik berichte/fachkritik_runde-14.md (P1 bis P17, K-schnittlauch-08 und -09).
# Aufruf im Repository-Wurzelordner:
#   W0_HEUTE=2026-11-22 python -X utf8 scripts/w0/lead_entscheide_runde14.py              Trockenlauf mit Protokoll
#   W0_HEUTE=2026-11-22 python -X utf8 scripts/w0/lead_entscheide_runde14.py --schreiben  Status nachführen, Übertrag nach freigegeben/
# Nur geprüfte Kandidaten (Methoden- und Quellenprüfung) werden gewählt oder als eigener Wert (Annahme 5) umgerechnet.
# Klasse D erzeugt keine Zeile (03_import_w0.md Abschnitt 2 Punkt 7): Lücken stehen im Bericht lead_entscheide_runde-14.md.
# Bereiche der Quelle (Auftrag Runde 14, Plan 266 A3) stehen als Rohgrenze im Kandidaten; den Wert leitet der Lead als
# eigenen Wert mit Begründung ab, keine neue Regel. Keine bestehende freigegebene Zeile wird geändert.
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from w0lib import *  # noqa: F401,F403,E402

b = Bestand()
LOG = []
RN = 'Runde 14 (#266), '


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


ak = 'ak.'
art = 'art.'

# ---------------- Schnittlauch ----------------
a = 'allium_schoenoprasum'
# K-schnittlauch-08 und -09 (gleicher Befund für beide Kulturformen, P6): #4 bzw. #3 (agrowtronics, Klasse C, Anzucht rund
# vier Wochen und danach Umsetzen wie die Anlage, P8) vor #3 bzw. #2 (CRC, Klasse C, Direktsaat in Perlit-Türme, nach D7
# 47 bis 57 Tage ab Umsetzen, obere Grenze über Wachstum max 50, P1): gleiche Klasse, Konzept 9.3 Regel 2 (näher an der
# Anlage). Aus «at least another three or four weeks» die obere Grenze 4 Wochen (D4: 28 Tage): «at least» macht den
# Bereich zur Mindestangabe; erste Ernte so 28 + 28 = 56 Tage ab Saat, nahe der kleinsten Phasensumme 57, 21 läge elf
# Tage unter Wachstum min 32 (P2).
for kf, basis in (('dauerkultur_blatt', '#4'), ('schnitt', '#3')):
    E(f'{ak}{a}.{kf}.ernte_ab_d', f'{ak}{a}.{kf}.ernte_ab_d{basis}', 28,
      f'K-schnittlauch-{"08" if kf == "dauerkultur_blatt" else "09"}, Konzept 9.3 Regel 2 (gleiche Klasse C, näher an der '
      'Anlage: Anzucht rund vier Wochen, dann Umsetzen; Fachkritik P8) vor CRC (Direktsaat in Perlit-Türme, 75 bis 85 Tage '
      'ab Saat, nach D7 47 bis 57 ab Umsetzen, über Wachstum max 50, P1); Regel D4 (A): «at least another three or four '
      'weeks» nach dem Umsetzen, obere Grenze 4 Wochen = 28 Tage, weil «at least» den Bereich zur Mindestangabe macht; '
      'erste Ernte 28 + 28 = 56 Tage ab Saat, nahe der kleinsten Phasensumme 57 (P2); beide Quellen trennen Dauerkultur '
      'und Schnitt nicht (P6)')
    # Intervall: «within two to three weeks» / «Harvest every 2-3 weeks»; untere Grenze 2 Wochen = 14 Tage (D4): «within»
    # nennt die Zeit, nach der der Horst frühestens wieder schnittreif ist; gleich dem freigegebenen Mangold-Intervall 14,
    # die Aufgabe erinnert damit nie zu spät (P7).
    E(f'{ak}{a}.{kf}.ernteintervall_d', f'{ak}{a}.{kf}.ernteintervall_d#1', 14,
      'Regel D4 (A): «Chives grow back to be harvested again within two to three weeks» (Klasse C, einzige geprüfte '
      'Quelle), untere Grenze 2 Wochen = 14 Tage: frühester Tag, an dem der Horst wieder schnittreif ist, die '
      'Ernteaufgabe kommt so nie zu spät; doppelt so lang wie Petersilie 7 derselben Kulturgruppe, stimmig mit «regeneration '
      'time is several weeks» (Fachkritik P7)')

# ---------------- Spinat ----------------
a = 'spinacia_oleracea'
# Spinat wird in der Anlage direkt gesät (Kratky belüftet 3.2, Konzept 5 und Q5), wie in der Quelle (Kokosfaser im
# Netztopf im Kratky-Gefäss): ernte_ab_d zählt dann ab Saat (03_import_w0.md 4.3.3), D7 greift nicht (gleich wie Spinat
# Kopf 64 und Babyleaf 14, beide Direktsaat ab Saat).
W(f'{ak}{a}.schnitt.ernte_ab_d', f'{ak}{a}.schnitt.ernte_ab_d#4',
  'erste Ernte 30 Tage ab Saat (Direktsaat in Kokosfaser im Kratky-Gefäss wie die Anlage in 3.2, Klasse C, einzige '
  'geprüfte Quelle; D7 greift bei Direktsaat nicht, Fachkritik P9); Reihenfolge Babyleaf 14 vor Schnitt 30 vor Kopf 64 '
  'stimmig (P10); dieselbe Quelle nennt danach zwei Schnitte im Abstand 7 bis 10 Tage, stimmig mit den freigegebenen '
  'schnitte_max 3 und ernteintervall_d 7 (P11)')

# ---------------- Randen ----------------
a = 'beta_vulgaris_conditiva'
W(f'{art}{a}.umsetzen_bis_d', f'{art}{a}.umsetzen_bis_d#1',
  'Regel D8 (A): 25 Tage ab Saat («transplante, realizado aos 25 DAS», Anzucht im Floating mit Nährlösung, Klasse A), '
  'grösster Wert der Klasse A oder B1 und über Keimung typ 3 plus Anzucht typ 10 = 13 (Fachkritik P12); Fenster 9 bis 25 '
  'mit dem freigegebenen umsetzen_ab_d; P13: einzelner Versuchstag für Feldsetzlinge und acht Tage über der Summe der '
  'Maxima, als spätester Tag dennoch stimmig (Mangold 28 derselben Kulturgruppe, P14)')

# ---------------- Mangold ----------------
a = 'beta_vulgaris_cicla'
W(f'{ak}{a}.schnitt.schnitte_max', f'{ak}{a}.schnitt.schnitte_max#2',
  'Ersatzregel des Herstellers «ready to remove when you have gotten 5-10 harvests» (Indoor mit LED, Klasse B2, einzige '
  'geprüfte Quelle), obere Grenze 10 als Höchstzahl der Schnitte (Feldbedeutung «max.»); kein Versuchsplan (P17); mit '
  'umsetzen_ab_d 21, ernte_ab_d 28 und Intervall 14 fiele der 10. Schnitt auf 175 Tage ab Saat (P15, zwei Quellen); '
  'kulturdauer_max_d bleibt Klasse D')

if '--schreiben' in sys.argv:
    uebertrag(b, LOG)
for x in LOG:
    print(*x)
