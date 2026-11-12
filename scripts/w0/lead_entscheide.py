# Lead-Entscheide W0 nach Entscheid 0018 (Issue #188). Aufruf im Repository-Wurzelordner:
#   python -X utf8 scripts/w0/lead_entscheide.py            Trockenlauf mit Protokoll
#   python -X utf8 scripts/w0/lead_entscheide.py --schreiben  Status nachführen, V13, Übertrag nach freigegeben/
# Einmalig für Runde 2 (12.11.2026); ein zweiter Lauf auf denselben Dateien legt keine doppelten Zeilen an, weil
# entschiedene zeile_id übersprungen werden, ist aber nicht dafür gedacht.
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from w0lib import *

b = Bestand()
LOG = []
ENTSCHIEDEN = set()


def ok(kid):
    try:
        _, _, r = finde(b, kid)
    except KeyError:
        return False
    return r['status'] in OK + ('freigegeben',)


def E(zid, basis, felder, grund, pflicht=True):
    """eigener Wert; nur wenn der Basiskandidat geprüft ist"""
    if not ok(basis):
        LOG.append(('UEBERSPRUNGEN', zid, f'{basis} nicht geprüft'))
        return
    eigen(b, zid, basis, felder, grund)
    ENTSCHIEDEN.add(zid)
    LOG.append(('EIGEN', zid, felder))


def W(zid, kid, grund):
    """Auswahl eines ladbaren Kandidaten"""
    if not ok(kid):
        LOG.append(('UEBERSPRUNGEN', zid, f'{kid} nicht geprüft'))
        return
    freigeben(b, zid, kid, grund)
    ENTSCHIEDEN.add(zid)
    LOG.append(('WAHL', zid, kid))


def WEG(zid, grund):
    """keine Zeile: alle Kandidaten verwerfen (Kulturform entfällt o. ä.)"""
    for g, n, r in kandidaten(b, zid):
        if r['status'] != 'verworfen':
            r['status'] = 'verworfen'
            r['notiz_tim'] = notiz(grund)
    ENTSCHIEDEN.add(zid)
    LOG.append(('WEG', zid, grund))


P = 'pw.'
# ---------------- Pak Choi ----------------
a = 'brassica_rapa_chinensis'
E(f'{P}{a}.keimung.dauer', f'{P}{a}.keimung.dauer#2', d1(4, 7), 'Regel D1 (A)')
E(f'{P}{a}.keimung.keimtemp', f'{P}{a}.keimung.keimtemp#2', d1(20, 25), 'Regel D1 (A)')
E(f'{P}{a}.anzucht.dauer', f'{P}{a}.anzucht.dauer#4', d3(14), 'Regel D3 (A); passt zum Umsetzfenster 14 bis 16 Tage ab Saat (sfa)')
E(f'{P}{a}.anzucht.ec', f'{P}{a}.anzucht.ec#1', band(1.2), 'Regel E1 (A), Klasse A vor C; Gegenprobe 1.0 eingehalten')
E(f'{P}{a}.wachstum.dauer', f'{P}{a}.wachstum.dauer#2',
  {'wert_min': '14', 'wert_typ': '21', 'wert_max': '35'},
  'Regel D2 (A): typ 21 aus #2 (A, Indoor-LED, Regel 2) und #1 (B1), min 14 aus #4 (C), max 35 aus #3 (A, Gewächshaus)')
E(f'art.{a}.systemeignung', f'art.{a}.systemeignung#2', {'wert': 'beide'},
  '(A) DWC belegt durch #1 (Cornell GPN), Kratky durch #2 (CTAHR VC-1); beide B1, also «beide»')
WEG(f'se.{a}.babyleaf', 'Kulturform babyleaf ohne Beleg in kulturformen_erlaubt, entfällt nach Entscheid 0018')

# ---------------- Chili ----------------
a = 'capsicum_annuum'
E(f'{P}{a}.keimung.dauer', f'{P}{a}.keimung.dauer#1', d1(7, 10), 'Regel D1 (A), B1 artspezifisch vor Wochenraster #4 und C #5')
E(f'{P}{a}.anzucht.ec', f'{P}{a}.anzucht.ec#4', {'wert_min': '0.5', 'wert_typ': '', 'wert_max': '1.0'},
  '(A) Band aus den beiden Stufen derselben Quelle (Anzucht 0.5, Jungpflanze 1.0); #1 und #3 (2.5, 2.3) beschreiben das Tränken der Steinwollblöcke, kein Sollband (Fachkritik P4, P5); Gegenprobe 1.1 eingehalten')
W(f'{P}{a}.wachstum.dauer', f'{P}{a}.wachstum.dauer#3', 'Regel 1: Klasse A (Chapingo 2011, Hydroponik), einziger ladbarer Kandidat; #2 (29, Einzelwert) liegt im Band')
E(f'{P}{a}.bluete.dauer', f'{P}{a}.bluete.dauer#3', d3(11), 'Regel D3 (A), 44 minus 33 Tage (Chapingo); #2 (rmca 2022) nennt ebenfalls 11 Tage')
E(f'{P}{a}.fruchtbildung_reife.dauer', f'{P}{a}.fruchtbildung_reife.dauer#7', d3(58), 'Regel D3 (A), Erntebeginn 102 minus Fruchtansatz 44 Tage (Chapingo)')

# ---------------- Tomate ----------------
a = 'solanum_lycopersicum'
E(f'{P}{a}.keimung.dauer', f'{P}{a}.keimung.dauer#3', d1(6, 10),
  'Regel D1 (A); artspezifische Angabe 6 bis 10 Tage vor dem Wochenraster #2 (B1, «Woche 2», gleicher Wert für Chili), Abweichung von Regel 1')
E(f'{P}{a}.anzucht.dauer', f'{P}{a}.anzucht.dauer#2', d3(21), 'Regel D3 (A)')

# ---------------- Salat ----------------
a = 'lactuca_sativa'
if ok(f'{P}{a}.keimung.dauer#6'):
    E(f'{P}{a}.keimung.dauer', f'{P}{a}.keimung.dauer#6', {'wert_min': '3', 'wert_typ': '3', 'wert_max': '4'},
      'Regel D1 (A), typ 3 bestätigt durch #3 und #5 (frankiesgarten, «etwa 3 Tage»)')
else:
    E(f'{P}{a}.keimung.dauer', f'{P}{a}.keimung.dauer#3', d3(3), 'Regel D3 (A)')
E(f'{P}{a}.anzucht.dauer', f'{P}{a}.anzucht.dauer#4', {'wert_min': '8', 'wert_typ': '9', 'wert_max': '15'},
  'Regel D5 (A): 11 Tage ab Saat (#4) minus Keimung 3 = 8; typ 9 und max 15 aus dem Umsetzfenster 12 bis 18 Tage ab Saat (art.umsetzen_ab_d/bis_d, utk) minus Keimung 3')
E(f'{P}{a}.wachstum.dauer', f'{P}{a}.wachstum.dauer#6', {'wert_min': '24', 'wert_typ': '28', 'wert_max': '42'},
  'Regel D2 und D4 (A): 4 bis 6 Wochen nach dem Umsetzen (#6, CTAHR, Kratky wie die Anlage, Regel 2) = 28 bis 42 Tage, typ 28; min 24 aus #1 und #3 (Cornell, DLI 17)')
E(f'art.{a}.systemeignung', f'art.{a}.systemeignung#1', {'wert': 'beide'},
  '(A) Kratky belegt durch #1, DWC durch #2; beide B1, also «beide»')

# ---------------- Nüsslisalat ----------------
a = 'valerianella_locusta'
E(f'{P}{a}.keimung.keimtemp', f'{P}{a}.keimung.keimtemp#1', d1(15, 20), '(A) Optimum «c. 15-20 °C» derselben Fundstelle, Regel D1; B1 vor C (#2 15 bis 18)')
E(f'{P}{a}.wachstum.ph', f'{P}{a}.wachstum.ph#1', {'wert_min': '5.6', 'wert_typ': '', 'wert_max': '6.0'} if ok(f'{P}{a}.wachstum.ph#2') else band(5.6),
  'Regel D2 für pH (A): Band zwischen #1 (5.6) und #2 (6) bzw. E1')
E(f'{P}{a}.wachstum.ec', f'{P}{a}.wachstum.ec#2', band(1.4), 'Regel E1 (A); #1 (2.47) liegt über der Validatorgrenze 2.0; Gegenprobe 1.0 gerade eingehalten')
E(f'{P}{a}.wachstum.dauer', f'{P}{a}.wachstum.dauer#1', d3(29), 'Regel D3 (A)')
for ph in ('anzucht',):
    E(f'{P}{a}.{ph}.ph', f'{P}{a}.{ph}.ph#1', band(6.0), 'Regel E1 (A), Direktsaat-Quelle ohne getrennte Anzucht')
    E(f'{P}{a}.{ph}.ec', f'{P}{a}.{ph}.ec#1', band(1.4), 'Regel E1 (A), Direktsaat-Quelle ohne getrennte Anzucht')

# ---------------- Standardprofil ----------------
E('pw.standard.wachstum.wassertemp', 'pw.standard.wachstum.wassertemp#2', {'wert_min': '22', 'wert_typ': '', 'wert_max': '24'},
  '(A) 72 bis 75 °F umgerechnet und auf ganze °C gerundet (22.2 bis 23.9 °C)')

# ---------------- Basilikum ----------------
a = 'ocimum_basilicum'
E(f'{P}{a}.keimung.dauer', f'{P}{a}.keimung.dauer#2', d1(5, 14), 'Regel D1 (A)')
E(f'{P}{a}.keimung.keimtemp', f'{P}{a}.keimung.keimtemp#1', d1(20, 25), 'Regel D1 (A), B1 vor C')
E(f'{P}{a}.anzucht.ec', f'{P}{a}.anzucht.ec#3', {'wert_min': '0.4', 'wert_typ': '', 'wert_max': '0.8'},
  '(A) Band aus den beiden Stufen derselben Quelle (Anzucht 0.4, Jungpflanze 0.8, #3 und #4); Gegenprobe 1.0 um 0.4 (Grenze)')

E(f'{P}{a}.wachstum.dauer', f'{P}{a}.wachstum.dauer#4', {'wert_min': '18', 'wert_typ': '23', 'wert_max': '50'},
  'Regel D2/D3 (A): typ 23 aus #4 (A, Floating Raft wie DWC der Anlage, Regel 2), min 0.8·23, max 50 aus #3 (A, NFT Gewächshaus, Herbst-Winter)')

# Salat: Kulturformen und Vorgabe, Babyleaf-Saatmenge
a = 'lactuca_sativa'
W(f'art.{a}.kulturformen_erlaubt', f'art.{a}.kulturformen_erlaubt#1', 'Kandidat deckt alle drei Formen aus Entscheid 0018 (B1, UF HS1258); #2 nennt nur kopf;babyleaf')
E(f'art.{a}.kulturform_vorgabe', f'art.{a}.kulturformen_erlaubt#1', {'feld': 'kulturform_vorgabe', 'wert': 'schnitt'},
  '(A) Vorgabe schnitt nach Entscheid 0018 (Sorten Roxette als Schnittsalat, Lollo, Lattughino Pflücksalat, R12.3); Quelle belegt die Form schnitt')
E(f'se.{a}.babyleaf', f'se.{a}.babyleaf#1', {'samen_je_schwamm': '6', 'obergrenze_samen': '12', 'pflanzen_stehen_lassen': '6'},
  '(A) Bereich 6 bis 12 Samen je Zelle der Quelle; Babyleaf wird als Büschel geerntet, alle Keimlinge bleiben stehen')

# ---------------- Petersilie ----------------
a = 'petroselinum_crispum'
E(f'{P}{a}.keimung.dauer', f'{P}{a}.keimung.dauer#3', {'wert_min': '7', 'wert_typ': '14', 'wert_max': '18'},
  'Regel D2/D3 (A): typ 14 aus #3 (B1, Regel 1), min 7 aus #1 (C), max 1.25·14')
E(f'{P}{a}.keimung.keimtemp', f'{P}{a}.keimung.keimtemp#1', d1(15, 20), 'Regel D1 (A)')
E(f'{P}{a}.wachstum.dauer', f'{P}{a}.wachstum.dauer#2', {'wert_min': '28', 'wert_typ': '28', 'wert_max': '42'},
  'Regel D2/D4 (A): typ und min 4 Wochen aus #2 (A), max 6 Wochen aus #1 (B2, 5 bis 6 Wochen nach dem Umsetzen)')
WEG(f'se.{a}.schnitt', 'Kulturform schnitt ohne Beleg in kulturformen_erlaubt, entfällt nach Entscheid 0018')

# ---------------- Schnittlauch ----------------
a = 'allium_schoenoprasum'
E(f'{P}{a}.wachstum.dauer', f'{P}{a}.wachstum.dauer#1', d3(40), 'Regel D3 (A)')
for kf in ('dauerkultur_blatt', 'schnitt'):
    basis = f'se.{a}.{kf}#2' if kf == 'dauerkultur_blatt' else f'se.{a}.{kf}#1'
    E(f'se.{a}.{kf}', basis, {'samen_je_schwamm': '4', 'obergrenze_samen': '5', 'pflanzen_stehen_lassen': '4'},
      '(A) 3 bis 5 Samen je Würfel (frankiesgarten, Klasse B), typ 4 wie Fork Farms (B); Schnittlauch wächst als Büschel, alle Keimlinge bleiben stehen')

# ---------------- Spinat ----------------
a = 'spinacia_oleracea'
E(f'{P}{a}.keimung.dauer', f'{P}{a}.keimung.dauer#2', d1(5, 10), 'Regel D1 (A)')
E(f'{P}{a}.keimung.keimtemp', f'{P}{a}.keimung.keimtemp#1', {'wert_min': '25', 'wert_typ': '25', 'wert_max': '26'},
  'Regel D2 (A): Einzelwerte 25 (#1) und 26 (#2) derselben B1-Quelle (Cornell), Regel 1 vor B2 und C')
E(f'{P}{a}.anzucht.dauer', f'{P}{a}.anzucht.dauer#2', {'wert_min': '7', 'wert_typ': '10', 'wert_max': '14'},
  'Regel D4/D5/D1 (A): 2 bis 3 Wochen ab Saat = 14 bis 21 Tage minus Keimung typ 7 = 7 bis 14')
E(f'{P}{a}.wachstum.dauer', f'{P}{a}.wachstum.dauer#2', {'wert_min': '21', 'wert_typ': '24', 'wert_max': '28'},
  'Regel D4/D1 (A): 3 bis 4 Wochen (UGA, B1) bis zur Ernte nach dem Umsetzen')

# ---------------- Mangold ----------------
a = 'beta_vulgaris_cicla'
E(f'{P}{a}.keimung.dauer', f'{P}{a}.keimung.dauer#2', {'wert_min': '1', 'wert_typ': '4', 'wert_max': '7'},
  'Regel D1 (A); Untergrenze 0 der Quelle auf 1 Tag gesetzt (Validator: über 0)')
E(f'{P}{a}.keimung.keimtemp', f'{P}{a}.keimung.keimtemp#2', d1(15, 20), 'Regel D1 (A)')
E(f'se.{a}.schnitt', f'se.{a}.schnitt#1', {'samen_je_schwamm': '1', 'obergrenze_samen': '2', 'pflanzen_stehen_lassen': '1'},
  '(A) Quelle lässt eine Pflanze stehen; ein Knäuel je Würfel (Beta-Knäuel mit 2 bis 4 Keimlingen), Obergrenze 2 bei schwacher Keimung')

# ---------------- Randen ----------------
a = 'beta_vulgaris_conditiva'
E(f'{P}{a}.keimung.dauer', f'{P}{a}.keimung.dauer#1', d3(3), 'Regel D3 (A)')
E(f'{P}{a}.keimung.keimtemp', f'{P}{a}.keimung.keimtemp#1', {'wert_min': '20', 'wert_typ': '20', 'wert_max': '21'}, 'Regel D1 (A), Band 1 °C der Quelle')
E(f'{P}{a}.wachstum.ec', f'{P}{a}.wachstum.ec#4', band(1.8, hi=2.0), 'Regel E1/E2 (A), Obergrenze 2.0')

# ---------------- Runde 6: Anzucht Basilikum und Petersilie (Tage ab Saat minus Keimdauer typ der Art) ----------------
E(f'{P}ocimum_basilicum.anzucht.dauer', f'{P}ocimum_basilicum.anzucht.dauer#4', d3(14 - 9),
  'Regel D4/D5/D3 (A): umgesetzt zwei Wochen nach der Saat (14 Tage) minus Keimdauer typ 9 = 5 Tage')
E(f'{P}petroselinum_crispum.anzucht.dauer', f'{P}petroselinum_crispum.anzucht.dauer#3', d3(21 - 14),
  'Regel D5/D3 (A): umgesetzt 21 Tage nach der Saat minus Keimdauer typ 14 = 7 Tage')

a = 'beta_vulgaris_cicla'
E(f'{P}{a}.anzucht.dauer', f'{P}{a}.anzucht.dauer#3', d3(32 - 4),
  'Regel D5/D3 (A): Saat 2.2.2017 bis Umsetzen 6.3.2017 = 32 Tage minus Keimdauer typ 4 = 28 Tage')
E(f'{P}{a}.wachstum.dauer', f'{P}{a}.wachstum.dauer#4', d3(30), 'Regel D3 (A); Ernte 30 Tage nach dem Umsetzen')
for ph in ('anzucht', 'wachstum'):
    E(f'{P}{a}.{ph}.ec', f'{P}{a}.{ph}.ec#' + ('1' if ph == 'anzucht' else '4'),
      dict(band(1.5), einheit_quelle='mS/cm', ec_basis='unbekannt'),
      '(A) Regel E1; Einheit der Quelle «mhos/cm2» als mmho/cm = mS/cm gelesen (Grössenordnung der Kopfsalat-Lösung derselben Quelle)')

# ---------------- Gegenprobe (Entscheid 0018: Vorschlag nur ohne Verfehlung über 0.4, sonst Fachlogik) ----------------
W(f'{P}lactuca_sativa.wachstum.ec', f'{P}lactuca_sativa.wachstum.ec#7',
  '(A) Vorschlag #2 (1.5 bis 2.0) verfehlt die Gegenprobe 1.2 um 0.55; #7 (B1, CTAHR, Kratky wie die Anlage, Regel 2) hält sie ein (Bandmitte 1.35 gesamt)')
for ph in ('bluete', 'fruchtbildung_reife'):
    W(f'{P}solanum_lycopersicum.{ph}.ec', f'{P}solanum_lycopersicum.{ph}.ec#' + ('3' if ph == 'bluete' else '5'),
      '(A) Vorschlag #1 (A, 1.2 bis 1.4, Single-Truss-Kurzkultur) verfehlt die Gegenprobe (1.9 bzw. 2.1) um über 0.4; frankiesgarten 2.0 bis 2.5 (C) hält sie ein und gilt für kompakte Sorten im Tower')
    E(f'{P}capsicum_annuum.{ph}.ec', f'{P}capsicum_annuum.{ph}.ec#4', band(2.0),
      '(A) Regel E1; Vorschlag #1 (0.8 bis 1.8) verfehlt die Gegenprobe (1.9 bzw. 2.1) um über 0.4; Alberta 2.5 bis 3.0 überschreitet die Validatorgrenze 2.6')

# ---------------- Abschluss ----------------
titel_fix(b, {
    'frankiesgarten-salat-hydroponik': 'Salat im Hydro Tower anbauen: vom Samen bis zur Ernte',
    'frankiesgarten-faq': 'Hydroponik FAQ: Häufige Fragen zum Anbau ohne Erde',
    'frankiesgarten-rote-bete-hydroponik': 'Rote Bete im Hydro Tower anbauen: mein Versuch',
    'frankiesgarten-pakchoi-2026': 'Pak Choi im Hydro Tower anbauen: vom Samen bis zur Ernte',
    'frankiesgarten-basilikum': 'Basilikum im Hydro Tower anbauen: vom Samen bis zur Ernte',
    'johnnys-hydro-anzucht': 'How to Grow Healthy Plants in Hydroponic Systems',
}, LOG)
LOG += [('AUTO',) + x for x in auto(b, ENTSCHIEDEN)]
stammfelder(b, LOG)
kulturformen_abschluss(b, LOG)
LOG += [('AUTO2',) + x for x in auto(b, ENTSCHIEDEN)]
v13(b, LOG, ersatz={'kraut_einjaehrig': ['lactuca_sativa'], 'kraut_ausdauernd': ['ocimum_basilicum', 'lactuca_sativa']})

if '--schreiben' in sys.argv:
    uebertrag(b, LOG)
for x in LOG:
    print(*x)
