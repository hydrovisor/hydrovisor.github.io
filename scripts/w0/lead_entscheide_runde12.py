# Lead-Entscheide W0 Runde 12 nach Entscheid 0018 (Issue #250): erste Ernte (ernte_ab_d) und Kulturdauer max. der Kräuter
# und Schnittkulturen für den Erntekalender (UC15, Konzept v1.9 R1.7). Aufruf im Repository-Wurzelordner:
#   W0_HEUTE=2026-11-19 python -X utf8 scripts/w0/lead_entscheide_runde12.py              Trockenlauf mit Protokoll
#   W0_HEUTE=2026-11-19 python -X utf8 scripts/w0/lead_entscheide_runde12.py --schreiben  Status nachführen, Übertrag nach freigegeben/
# Nur geprüfte Kandidaten (Methoden- und Quellenprüfung) werden gewählt oder als eigener Wert (Annahme 5) umgerechnet.
# Klasse D erzeugt keine Zeile (03_import_w0.md Abschnitt 2 Punkt 7): Lücken stehen im Bericht lead_entscheide_runde-12.md.
# ernte_ab_d zählt ab Umsetzen, bei Direktsaat ab Saat (03_import_w0.md 4.3.3). Regel D7 (A): Wert ab Saat ohne Umsetztag
# derselben Quelle minus art.umsetzen_ab_d der Art; fehlt er, minus Keimung typ plus Anzucht typ der freigegebenen
# Phasendauern (Tag, an dem die App das Umsetzen erwartet).
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from w0lib import *  # noqa: F401,F403,E402

b = Bestand()
LOG = []
RN = 'Runde 12 (#250), '


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
    """eigener Wert (Annahme 5) aus einem geprüften Kandidaten derselben zeile_id"""
    if not ok(basis):
        LOG.append(('UEBERSPRUNGEN', zid, f'{basis} nicht geprüft'))
        return
    _, a, kf, feld = zid.split('.')
    neu = eigen(b, zid, basis, dict(art_id=a, kulturform=kf, feld=feld, wert=str(wert), **felder), RN + grund)
    LOG.append(('EIGEN', zid, neu['kandidat_id'], wert))


ak = 'ak.'

# ---------------- Salat ----------------
a = 'lactuca_sativa'
E(f'{ak}{a}.schnitt.ernte_ab_d', f'{ak}{a}.schnitt.ernte_ab_d#1', 23,
  'Regel D4 (A): 5 Wochen = 35 Tage ab Saat (Direktsaat in Floating-Schalen, Klasse A); Regel D7 (A): minus '
  'art.umsetzen_ab_d 12 = 23 Tage ab Umsetzen; passt zu Intervall 7 und Kulturdauer max. 42 (zweiter Schnitt 6 Wochen '
  'ab Saat); #3 (4 Wochen ab Umsetzen, Klasse C) und #2 (21 ab Saat, Klasse B2) nicht gewählt')
W(f'{ak}{a}.babyleaf.ernte_ab_d', f'{ak}{a}.babyleaf.ernte_ab_d#3',
  'Babyleaf-Ernte 21 Tage ab Saat (Indoor-System mit LED, Saatpods im System, Klasse B2); die Babyleaf-Mischung wird '
  'nach Konzept 3.3 direkt im Kratky-Gefäss gesät, der Wert gilt also ab Saat ohne Umrechnung (Befund 1 des Prüfers, '
  'Runde 1; wie Spinat Babyleaf 14); ≤ kulturdauer_max_d 30')
W(f'{ak}{a}.babyleaf.kulturdauer_max_d', f'{ak}{a}.babyleaf.kulturdauer_max_d#1',
  'spätester Babyleaf-Erntetermin 30 Tage ab Saat (Floating, Klasse A); #2 (35, Klasse B2) gilt für Pflücksalat allgemein')
W(f'{ak}{a}.kopf.kulturdauer_max_d', f'{ak}{a}.kopf.kulturdauer_max_d#2',
  'obere Grenze «30–45 days» ab Saat (Indoor-System mit LED, Klasse B2); ≥ kulturdauer_typisch_d 35; #3 (Klasse B1) '
  'wegen verworfener Quellenzeile (Jahr) nicht wählbar; Fachkritik P6: Butterhead und Romana brauchen bis 55 Tage, '
  'die Kulturfrage (R1.7) bietet dann «Verlängern um 14 Tage»; P12: Rise Gardens nennt NFT für seine Systeme, NFT ist '
  'hydroponisch (Konzept 9.1)')

# ---------------- Basilikum (Dauerkultur Blatt) ----------------
a = 'ocimum_basilicum'
W(f'{ak}{a}.dauerkultur_blatt.ernte_ab_d', f'{ak}{a}.dauerkultur_blatt.ernte_ab_d#1',
  'erster Schnitt 18 Tage nach Umsetzen in das Floating-Raft-System (Klasse A, System wie DWC der Anlage); #2 (13, '
  'Tabelle, Text derselben Seite 15 bis 28) nicht gewählt')

# ---------------- Petersilie (Dauerkultur Blatt) ----------------
a = 'petroselinum_crispum'
E(f'{ak}{a}.dauerkultur_blatt.ernte_ab_d', f'{ak}{a}.dauerkultur_blatt.ernte_ab_d#3', 28,
  'Regel D4 (A): «four weeks» nach Umsetzen = 28 Tage (Deep-Flow-Tische = DWC, Klasse A); Fachkritik P9: die erste '
  'Ernte 49 Tage ab Saat aus #1 (Virginia Tech) ergibt ab dem Umsetzen der App (Keimung typ 14 plus Anzucht typ 7 = 21) '
  'ebenfalls 28; passt zu Wachstum min. 28 derselben Quelle; #1 und #2 (21, Umsetzen erst nach 28 bzw. 47 Tagen) '
  'nicht gewählt')

# ---------------- Mangold (Schnitt) ----------------
a = 'beta_vulgaris_cicla'
E(f'{ak}{a}.schnitt.ernte_ab_d', f'{ak}{a}.schnitt.ernte_ab_d#3', 19,
  'Regel D7 (A): «Ready to harvest: Day 39» ab Saat (Indoor-System mit LED, Klasse B2) minus Keimung typ 4 und '
  'Anzucht typ 16 der freigegebenen Phasendauern (art.umsetzen_ab_d fehlt) = 19 Tage ab Umsetzen')

if '--schreiben' in sys.argv:
    uebertrag(b, LOG)
for x in LOG:
    print(*x)
