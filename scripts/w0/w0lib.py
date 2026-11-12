# Hilfsfunktionen für den Lead-Entscheid W0 (Entscheid 0018, Issue #188). Arbeitet auf teile/<gruppe>/*.csv.
import csv, io, os, glob, collections

K = 'data/wissensbasis/kandidaten'
GRUPPEN = ['blattsalat', 'fruchtgemuese', 'kohl', 'kraut_einjaehrig', 'kraut_ausdauernd', 'fuchsschwanz']
DATEIEN = ['quelle', 'art', 'profilwert', 'profilwert_offen', 'saatempfehlung', 'saatempfehlung_offen']
OK = ('geprueft', 'vorgeschlagen')
KLASSE = {'A': 4, 'B1': 3, 'B2': 2, 'C': 1, 'B': 3, 'D': 0}
HEUTE = '2026-11-12'


def lesen(pfad):
    if not os.path.exists(pfad):
        return [], None
    with open(pfad, encoding='utf-8', newline='') as f:
        r = csv.DictReader(f)
        rows = list(r)
    # Zeilen mit unquotiertem Komma im letzten Feld (notiz_tim) wieder zusammenfügen (Issue #190)
    for row in rows:
        rest = row.pop(None, None)
        if rest:
            row[r.fieldnames[-1]] = ','.join([row[r.fieldnames[-1]]] + rest)
    return rows, r.fieldnames


def schreiben(pfad, zeilen, kopf):
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=kopf, lineterminator='\n', extrasaction='ignore')
    w.writeheader()
    w.writerows(zeilen)
    with open(pfad, 'w', encoding='utf-8', newline='') as f:
        f.write(buf.getvalue())


class Bestand:
    def __init__(self):
        self.d = {}  # (gruppe, datei) -> [rows]
        self.kopf = {}
        for g in GRUPPEN:
            for n in DATEIEN:
                rows, kopf = lesen(f'{K}/teile/{g}/{n}.csv')
                if kopf:
                    self.d[(g, n)] = rows
                    self.kopf[(g, n)] = kopf
        # Koepfe fuer fehlende Dateien von anderer Gruppe uebernehmen
        for n in DATEIEN:
            k = next((self.kopf[(g, n)] for g in GRUPPEN if (g, n) in self.kopf), None)
            for g in GRUPPEN:
                if (g, n) not in self.kopf and k:
                    self.kopf[(g, n)] = k
                    self.d[(g, n)] = []

    def alle(self, n):
        return [r for g in GRUPPEN for r in self.d.get((g, n), [])]

    def gruppe_von(self, row, n):
        for g in GRUPPEN:
            if any(r is row for r in self.d.get((g, n), [])):
                return g

    def speichern(self):
        for (g, n), rows in self.d.items():
            p = f'{K}/teile/{g}/{n}.csv'
            if rows or os.path.exists(p):
                schreiben(p, rows, self.kopf[(g, n)])

    def naechste(self, n_basis, zid):
        nums = [int(r['kandidat_id'].split('#')[1]) for n in (n_basis, n_basis + '_offen') for r in self.alle(n)
                if r.get('zeile_id') == zid and '#' in r.get('kandidat_id', '')]
        return max(nums + [0]) + 1


# ---------------- Entscheid ----------------
LEITKULTUR = {'fruchtgemuese': 'solanum_lycopersicum', 'blattsalat': 'lactuca_sativa', 'kohl': 'brassica_rapa_chinensis',
              'kraut_einjaehrig': 'ocimum_basilicum', 'kraut_ausdauernd': 'petroselinum_crispum', 'fuchsschwanz': 'spinacia_oleracea'}
ART_GRUPPE = {'solanum_lycopersicum': 'fruchtgemuese', 'capsicum_annuum': 'fruchtgemuese', 'lactuca_sativa': 'blattsalat',
              'valerianella_locusta': 'blattsalat', 'brassica_rapa_chinensis': 'kohl', 'ocimum_basilicum': 'kraut_einjaehrig',
              'petroselinum_crispum': 'kraut_ausdauernd', 'allium_schoenoprasum': 'kraut_ausdauernd',
              'spinacia_oleracea': 'fuchsschwanz', 'beta_vulgaris_cicla': 'fuchsschwanz', 'beta_vulgaris_conditiva': 'fuchsschwanz'}
BASIS = {'profilwert': 'profilwert', 'profilwert_offen': 'profilwert', 'art': 'art', 'saatempfehlung': 'saatempfehlung',
         'saatempfehlung_offen': 'saatempfehlung'}


def notiz(grund):
    return f'Lead nach Entscheid 0018: {grund}'


def finde(b, kid):
    for (g, n), rows in b.d.items():
        for r in rows:
            if r.get('kandidat_id') == kid:
                return g, n, r
    raise KeyError(kid)


def kandidaten(b, zid):
    """alle Kandidaten einer zeile_id in Haupt- und Offen-Datei: [(g, n, row)]"""
    out = []
    for (g, n), rows in b.d.items():
        if n == 'quelle':
            continue
        for r in rows:
            if r.get('zeile_id') == zid:
                out.append((g, n, r))
    return out


def freigeben(b, zid, kid, grund):
    for g, n, r in kandidaten(b, zid):
        if r['kandidat_id'] == kid:
            assert not n.endswith('_offen'), f'{kid} steht in {n}'
            r['status'] = 'freigegeben'
            r['freigegeben_am'] = HEUTE
            r['notiz_tim'] = notiz(grund)
        elif r['status'] != 'verworfen':
            r['status'] = 'verworfen'
            if not r.get('notiz_tim'):
                r['notiz_tim'] = notiz(f'nicht gewählt, freigegeben ist {kid}')


def eigen(b, zid, basis_kid, felder, grund):
    """eigener Wert nach Annahme 5: neue Zeile in der Hauptdatei aus einem (offenen) Kandidaten"""
    g, n, r = finde(b, basis_kid)
    hn = BASIS[n]
    neu = {k: r.get(k, '') for k in b.kopf[(g, hn)]}
    if neu.get('groesse') and neu['groesse'] != 'ec':
        neu['einheit_quelle'] = ''
        neu['ec_basis'] = ''
    if neu.get('groesse') in ('dauer', 'ph', 'ec', 'licht_h', 'wassertemp', 'keimtemp', 'bbch'):
        neu['text_wert'] = ''
    neu.update(felder)
    nr = b.naechste(hn, zid)
    neu['kandidat_id'] = f'{zid}#{nr}'
    neu['zeile_id'] = zid
    if 'vermerk' in neu and hn != 'saatempfehlung':
        neu['vermerk'] = neu.get('vermerk') or 'keine'
    neu['konflikt_id'] = r.get('konflikt_id', '')
    b.d[(g, hn)].append(neu)
    freigeben(b, zid, neu['kandidat_id'], f'eigener Wert aus {basis_kid}: {grund}')
    return neu


def anlegen(b, g, n, felder, grund):
    """neue Zeile ohne Kandidatenbasis (Klasse-D-Saatempfehlung, Stammfeld nach Spezifikation)"""
    neu = {k: '' for k in b.kopf[(g, n)]}
    neu.update(felder)
    zid = neu['zeile_id']
    neu['kandidat_id'] = f'{zid}#{b.naechste(n, zid)}'
    b.d[(g, n)].append(neu)
    freigeben(b, zid, neu['kandidat_id'], grund)
    return neu


def ladbar(r):
    return r['status'] in OK


def auto(b, zids_entschieden):
    """mechanisch: je zeile_id ohne Lead-Entscheid den Vorschlag oder den einzigen/höchsten ladbaren Kandidaten"""
    log = []
    alle = collections.defaultdict(list)
    for (g, n), rows in b.d.items():
        if n == 'quelle':
            continue
        for r in rows:
            alle[r['zeile_id']].append((g, n, r))
    for zid, ks in alle.items():
        if zid in zids_entschieden or any(r['status'] == 'freigegeben' for _, _, r in ks):
            continue
        haupt = [(g, n, r) for g, n, r in ks if not n.endswith('_offen') and ladbar(r)]
        if not haupt:
            if any(ladbar(r) for _, _, r in ks):
                log.append(('OFFEN', zid))
            continue
        vor = [x for x in haupt if x[2]['status'] == 'vorgeschlagen']
        werte = {wertschluessel(r) for _, _, r in haupt}
        if len(vor) == 1:
            freigeben(b, zid, vor[0][2]['kandidat_id'], 'Vorschlag übernommen (Regel 9.3 bzw. einziger geprüfter Kandidat)')
        elif len(werte) == 1:
            best = max(haupt, key=lambda x: KLASSE.get(x[2].get('evidenzklasse') or x[2].get('klasse_saatmenge', 'C'), 0))
            freigeben(b, zid, best[2]['kandidat_id'], 'einziger Wert, höchste Klasse (Annahme 8)')
        else:
            log.append(('KONFLIKT', zid))
    return log


def wertschluessel(r):
    keys = ['wert', 'wert_min', 'wert_typ', 'wert_max', 'text_wert', 'einheit_quelle', 'samen_je_schwamm', 'obergrenze_samen',
            'pflanzen_stehen_lassen']
    return tuple(r.get(k, '') for k in keys)


# ---------------- Fachregeln des Lead fuer offene Werte (A, Entscheid 0018) ----------------
REGELN = {
    'D1': 'Bereich ohne typischen Wert: typ = abgerundete Mitte',
    'D2': 'mehrere Einzelwerte: min und max = kleinster und grösster Quellenwert, typ = Wert der besten Quelle nach Regel 9.3',
    'D3': 'ein Einzelwert x: min = 0.8·x, max = 1.25·x (gerundet), typ = x',
    'D4': 'Angabe in Wochen: Tage = 7·Wochen',
    'D5': 'Tage ab Saat: minus Keimdauer typ der Art',
    'E1': 'pH- oder EC-Einzelwert: Band ±0.2 um den Wert',
    'E2': 'Band über der Validatorgrenze: auf die Grenze gekürzt',
    'E3': 'EC-Basis nach der Quelle korrigiert (Methodenprüfer)',
}


def r(x):
    return int(float(x) + 0.5)


def d1(mn, mx):
    mn, mx = int(mn), int(mx)
    return {'wert_min': str(mn), 'wert_typ': str((mn + mx) // 2), 'wert_max': str(mx)}


def d3(x):
    x = float(x)
    return {'wert_min': str(max(1, r(0.8 * x))), 'wert_typ': str(r(x)), 'wert_max': str(r(1.25 * x))}


def band(x, breite=0.2, lo=None, hi=None):
    x = float(x)
    a, b = round(x - breite, 2), round(x + breite, 2)
    if lo is not None:
        a = max(a, lo)
    if hi is not None:
        b = min(b, hi)
    return {'wert_min': f'{a:g}', 'wert_typ': '', 'wert_max': f'{b:g}'}


def zahl(s):
    return f'{float(s):g}'


# ---------------- Abschluss (Schritt 8) ----------------
NAME_DE = {'solanum_lycopersicum': 'Tomate', 'capsicum_annuum': 'Chili', 'ocimum_basilicum': 'Basilikum',
           'brassica_rapa_chinensis': 'Pak Choi', 'petroselinum_crispum': 'Petersilie', 'allium_schoenoprasum': 'Schnittlauch',
           'lactuca_sativa': 'Salat', 'valerianella_locusta': 'Nüsslisalat', 'spinacia_oleracea': 'Spinat',
           'beta_vulgaris_cicla': 'Mangold', 'beta_vulgaris_conditiva': 'Randen'}
FRUCHT = {'solanum_lycopersicum', 'capsicum_annuum'}


def frei(b, zid):
    for g, n, r in kandidaten(b, zid):
        if r['status'] == 'freigegeben':
            return r


def titel_fix(b, titel, log):
    for g in GRUPPEN:
        for r in b.d[(g, 'quelle')]:
            if r['quelle_id'] in titel and r['status'] == 'verworfen' and r['quellenpruefung'].startswith('abweichend'):
                r['titel'] = titel[r['quelle_id']]
                r['status'] = 'geprueft'
                r['notiz_tim'] = notiz('Titel nach dem Befund der Quellenprüfung korrigiert (H1 der Seite); Link und Inhalt bestätigt')
                log.append(('TITEL', g, r['quelle_id']))


def stammfelder(b, log):
    for a, g in ART_GRUPPE.items():
        wiss = frei(b, f'art.{a}.name_wiss') or next((r for _, n, r in kandidaten(b, f'art.{a}.name_wiss') if r['status'] in OK), None)
        if wiss and wiss['status'] != 'freigegeben':
            freigeben(b, wiss['zeile_id'], wiss['kandidat_id'], 'Stammfeld aus GBIF')
        for feld, wert in (('name_de', NAME_DE[a]), ('kulturgruppe_id', g)):
            zid = f'art.{a}.{feld}'
            if frei(b, zid):
                continue
            ks = [r for _, n, r in kandidaten(b, zid) if r['status'] in OK and r['wert'] == wert]
            if ks:
                freigeben(b, zid, ks[0]['kandidat_id'], 'Stammfeld')
                continue
            if not wiss:
                log.append(('STAMM_FEHLT', zid))
                continue
            neu = {k: wiss.get(k, '') for k in b.kopf[(g, 'art')]}
            neu.update(zeile_id=zid, feld=feld, wert=wert, konflikt_id='', methodenpruefung='', quellenpruefung='',
                       fundstelle=f'{wiss["fundstelle"]}; {feld} nach 03_import_w0.md ' + ('4.3.1 (Entscheid W13, Name aus sorten.csv)' if feld == 'name_de' else '4.2.1 (Kulturgruppe der Startbelegung)'))
            anlegen(b, g, 'art', neu, f'(A) Stammfeld nach Spezifikation; Herkunft GBIF wie name_wiss (03_import_w0.md 4.3), der Wert selbst steht nicht in GBIF')
            log.append(('STAMM', zid, wert))
        for feld in ('gbif_key',):
            zid = f'art.{a}.{feld}'
            if not frei(b, zid):
                ks = [r for _, n, r in kandidaten(b, zid) if r['status'] in OK]
                if ks:
                    freigeben(b, zid, ks[0]['kandidat_id'], 'Stammfeld aus GBIF')
                else:
                    log.append(('STAMM_FEHLT', zid))


def v13(b, log, ersatz=None):
    """Mindestzeilen je Kulturgruppe als Kopie freigegebener Art-Zeilen (Leitkultur zuerst)"""
    ersatz = ersatz or {}
    for g, leit in LEITKULTUR.items():
        arten = [leit] + [a for a, gg in ART_GRUPPE.items() if gg == g and a != leit] + ersatz.get(g, [])
        frucht = leit in FRUCHT
        phasen = ['keimung', 'anzucht', 'wachstum', 'bluete', 'fruchtbildung_reife']
        anw = [p for p in phasen if frucht or p in ('keimung', 'anzucht', 'wachstum')]
        soll = []
        for p in phasen:
            soll.append((p, 'anwendbar'))
            if p in anw:
                soll += [(p, 'dauer'), (p, 'bbch')]
                if p != anw[-1]:
                    soll.append((p, 'wechselmerkmal'))
                if p != 'keimung':
                    soll += [(p, 'ph'), (p, 'ec')]
        for p, gr in soll:
            zid = f'pw.{g}.{p}.{gr}'
            if frei(b, zid):
                continue
            quelle = next((frei(b, f'pw.{a}.{p}.{gr}') for a in arten if frei(b, f'pw.{a}.{p}.{gr}')), None)
            if not quelle:
                log.append(('V13_FEHLT', zid))
                continue
            neu = {k: quelle.get(k, '') for k in b.kopf[(g, 'profilwert')]}
            neu.update(zeile_id=zid, ebene='kulturgruppe', bezug=g, konflikt_id='', methodenpruefung=quelle.get('methodenpruefung', ''),
                       quellenpruefung=quelle.get('quellenpruefung', ''))
            herkunft = quelle['bezug']
            anlegen(b, g, 'profilwert', neu, f'Mindestzeile V13 als Kopie von {quelle["kandidat_id"]} ({"Leitkultur" if herkunft == leit else "(A) andere Art, Leitkultur ohne Wert"})')
        for r in b.d[(g, 'kulturgruppe')] if (g, 'kulturgruppe') in b.d else []:
            pass


def saat_d(b, a, kf, s, o, p, passung, grund, log):
    g = ART_GRUPPE[a]
    zid = f'se.{a}.{kf}'
    neu = {'zeile_id': zid, 'ebene': 'art', 'bezug': a, 'kulturform': kf, 'samen_je_schwamm': str(s), 'obergrenze_samen': str(o),
           'pflanzen_stehen_lassen': str(p), 'klasse_saatmenge': 'D', 'substrat_passung': passung,
           'begruendung': f'Lead nach Entscheid 0018, (A): {grund}'}
    anlegen(b, g, 'saatempfehlung', neu, f'Saatempfehlung Klasse D (Entscheid 0018 Punkt 4): {grund}')
    log.append(('SAAT_D', zid, f'{s}/{o}/{p}'))


MATRIX = {'solanum_lycopersicum': ['dauerkultur_frucht'], 'capsicum_annuum': ['dauerkultur_frucht'],
          'lactuca_sativa': ['schnitt', 'kopf', 'babyleaf'], 'valerianella_locusta': ['kopf', 'babyleaf'],
          'brassica_rapa_chinensis': ['kopf', 'babyleaf'], 'ocimum_basilicum': ['dauerkultur_blatt', 'schnitt'],
          'petroselinum_crispum': ['dauerkultur_blatt', 'schnitt'], 'allium_schoenoprasum': ['dauerkultur_blatt', 'schnitt'],
          'spinacia_oleracea': ['babyleaf', 'kopf', 'schnitt'], 'beta_vulgaris_cicla': ['schnitt', 'babyleaf'],
          'beta_vulgaris_conditiva': ['babyleaf', 'schnitt']}
WUERFEL = 'Steinwoll- bzw. Schaumwürfel 2.2 cm der Anlage; keine Quelle der Skala A bis C'
SAAT_D = {
    ('petroselinum_crispum', 'dauerkultur_blatt'): (15, 15, 15, 'entschieden von Tim, Konzept R12.3 (Petersilie 15 Samen je Schwamm, Büschel); Obergrenze und Pflanzen stehen lassen nach Entscheid 0018; Quellen der Klasse B nennen 3 bis 6 Samen (offen)'),
    ('valerianella_locusta', 'kopf'): (3, 4, 3, 'Feldsalat wird als Rosettenbüschel geerntet; mehrere Pflanzen je Würfel wie bei Kräutern'),
    ('valerianella_locusta', 'babyleaf'): (5, 8, 5, 'Babyleaf als Büschel, alle Keimlinge bleiben stehen; kleiner als Salat-Babyleaf (6 bis 12, Cornell) wegen des kleinen Würfels'),
    ('spinacia_oleracea', 'schnitt'): (2, 3, 1, 'Schnittkultur mit einer kräftigen Pflanze je Würfel; 2 Samen wegen mässiger Keimfähigkeit'),
    ('beta_vulgaris_conditiva', 'schnitt'): (1, 2, 1, 'ein Knäuel je Würfel (2 bis 4 Keimlinge), stärkste Pflanze stehen lassen wie bei Mangold (Rise)'),
    ('beta_vulgaris_conditiva', 'babyleaf'): (2, 3, 4, 'zwei Knäuel je Würfel, Babyleaf als Büschel'),
    ('beta_vulgaris_cicla', 'babyleaf'): (2, 3, 4, 'zwei Knäuel je Würfel, Babyleaf als Büschel'),
}


def kulturformen_abschluss(b, log):
    for a, g in ART_GRUPPE.items():
        zid = f'art.{a}.kulturformen_erlaubt'
        r0 = frei(b, zid)
        ks = [r for _, n, r in kandidaten(b, zid) if r['status'] in OK]
        if r0:
            L = r0['wert'].split(';')
        elif ks:
            menge = set(f for r in ks for f in r['wert'].split(';'))
            L = [f for f in MATRIX[a] if f in menge] or sorted(menge)
            wert = ';'.join(L)
            gleich = [r for r in ks if set(r['wert'].split(';')) == set(L)]
            if gleich:
                best = max(gleich, key=lambda r: KLASSE.get(r['evidenzklasse'], 0))
                freigeben(b, zid, best['kandidat_id'], 'Kandidat deckt alle belegten Kulturformen')
            else:
                best = max(ks, key=lambda r: KLASSE.get(r['evidenzklasse'], 0))
                andere = ', '.join(r['kandidat_id'] for r in ks if r is not best)
                eigen(b, zid, best['kandidat_id'], {'wert': wert},
                      f'(A) Vereinigung der einzeln belegten Kulturformen ({andere} belegen die übrigen Formen)')
            log.append(('KULTURFORMEN', a, wert))
        else:
            log.append(('KULTURFORMEN_FEHLEN', a))
            continue
        # Vorgabe
        vz = f'art.{a}.kulturform_vorgabe'
        vorgabe = next(f for f in MATRIX[a] + L if f in L)
        if not frei(b, vz):
            vk = [r for _, n, r in kandidaten(b, vz) if r['status'] in OK and r['wert'] == vorgabe]
            if vk:
                freigeben(b, vz, vk[0]['kandidat_id'], 'Vorgabe nach Entscheid 0018')
            else:
                eigen(b, vz, frei(b, zid)['kandidat_id'], {'feld': 'kulturform_vorgabe', 'wert': vorgabe},
                      f'(A) Vorgabe {vorgabe} nach Entscheid 0018 (erste erlaubte Form der Matrix); Quelle belegt die Form')
        elif frei(b, vz)['wert'] not in L:
            log.append(('V11', a, frei(b, vz)['wert'], L))
        # nicht erlaubte Formen verwerfen
        for (gg, n), rows in b.d.items():
            for r in rows:
                kf = r.get('kulturform', '')
                if r.get('bezug', r.get('art_id')) == a or r.get('art_id') == a:
                    if kf and kf not in L and r['status'] != 'verworfen' and (n.startswith('saat') or r['zeile_id'].startswith('ak.')):
                        r['status'] = 'verworfen'
                        r['notiz_tim'] = notiz(f'Kulturform {kf} nicht erlaubt (kulturformen_erlaubt = {";".join(L)})')
        # ernteart je erlaubter Form nach R1.2
        for kf in L:
            ez = f'ak.{a}.{kf}.ernteart'
            if frei(b, ez) or any(n == 'art' and r['status'] in OK for _, n, r in kandidaten(b, ez)):
                continue
            wert = 'einmalig' if kf in ('keimling', 'babyleaf', 'kopf') else 'mehrfach'
            eigen(b, ez, frei(b, zid)['kandidat_id'], {'kulturform': kf, 'feld': 'ernteart', 'wert': wert},
                  f'(A) Ernteart {wert} folgt aus der Kulturform {kf} (Konzept R1.2); Quelle belegt die Kulturform')
            log.append(('ERNTEART', ez, wert))
        # Saatempfehlung je erlaubter Form
        for kf in L:
            sz = f'se.{a}.{kf}'
            if frei(b, sz):
                continue
            haupt = [r for _, n, r in kandidaten(b, sz) if n == 'saatempfehlung' and r['status'] in OK]
            if haupt:
                vor = [r for r in haupt if r['status'] == 'vorgeschlagen'] or sorted(haupt, key=lambda r: -KLASSE.get(r['klasse_saatmenge'], 0))
                freigeben(b, sz, vor[0]['kandidat_id'], 'Vorschlag bzw. höchste Saatmengen-Klasse')
                continue
            s, o, p, grund = SAAT_D.get((a, kf), (1, 2, 1, 'eine Pflanze je Würfel, zweiter Samen nur bei schwacher Keimung'))
            saat_d(b, a, kf, s, o, p, WUERFEL, grund, log)


SPALTEN_FREI = {
    'quelle': ['zeile_id', 'quelle_id', 'titel', 'autoren', 'jahr', 'link', 'klasse', 'anbaumethode', 'abgerufen_am', 'freigegeben_am'],
    'kulturgruppe': ['zeile_id', 'kulturgruppe_id', 'name', 'leitkultur_art_id', 'ec_obergrenze_validator', 'freigegeben_am'],
    'art': ['zeile_id', 'art_id', 'kulturform', 'feld', 'wert', 'quelle_id', 'fundstelle', 'kurzzitat', 'evidenzklasse', 'vermerk', 'freigegeben_am'],
    'profilwert': ['zeile_id', 'ebene', 'bezug', 'phase', 'groesse', 'wert_min', 'wert_typ', 'wert_max', 'text_wert', 'einheit_quelle',
                   'ec_basis', 'bezugstemperatur_c', 'bezugs_dli', 'system_quelle', 'umgebung_quelle', 'quelle_id', 'fundstelle',
                   'kurzzitat', 'evidenzklasse', 'vermerk', 'freigegeben_am'],
    'saatempfehlung': ['zeile_id', 'ebene', 'bezug', 'kulturform', 'samen_je_schwamm', 'obergrenze_samen', 'pflanzen_stehen_lassen',
                       'klasse_saatmenge', 'substrat_passung', 'quelle_id', 'fundstelle', 'kurzzitat', 'begruendung', 'freigegeben_am'],
}


def uebertrag(b, log):
    # Quellen freigeben, auf die freigegebene Zeilen verweisen
    benutzt = set()
    for n in ('art', 'profilwert', 'saatempfehlung'):
        for r in b.alle(n):
            if r['status'] == 'freigegeben' and r.get('quelle_id'):
                benutzt.add(r['quelle_id'])
    gesetzt = {r['quelle_id'] for r in b.alle('quelle') if r['status'] == 'freigegeben'}
    for g in GRUPPEN:
        for r in b.d[(g, 'quelle')]:
            if r['status'] == 'entwurf' and r['methodenpruefung'] == 'zugelassen' and r['quellenpruefung'] == 'bestaetigt':
                r['status'] = 'geprueft'
    for g in GRUPPEN:
        for r in b.d[(g, 'quelle')]:
            q = r['quelle_id']
            if q in benutzt and r['status'] in OK and q not in gesetzt:
                r['status'] = 'freigegeben'
                r['freigegeben_am'] = HEUTE
                r['notiz_tim'] = r.get('notiz_tim') or notiz('Quelle freigegebener Zeilen')
                gesetzt.add(q)
    fehlt = benutzt - gesetzt
    for q in sorted(fehlt):
        log.append(('QUELLE_FEHLT', q))
    # Kulturgruppen
    kg, kgkopf = lesen(f'{K}/kulturgruppe.csv')
    for r in kg:
        r['status'] = 'freigegeben'
        r['freigegeben_am'] = HEUTE
        r['notiz_tim'] = notiz('Kulturgruppe nach 03_import_w0.md 4.2.1 mit Mindestzeilen V13')
    schreiben(f'{K}/kulturgruppe.csv', kg, kgkopf)
    b.speichern()
    # Zusammenführen (ablauf.md Abschnitt 5; Quelle: freigegebene bzw. beste Zeile je kandidat_id)
    for n in ['art', 'profilwert', 'profilwert_offen', 'saatempfehlung', 'saatempfehlung_offen']:
        rows = b.alle(n)
        kopf = next(b.kopf[(g, n)] for g in GRUPPEN if (g, n) in b.kopf)
        schreiben(f'{K}/{n}.csv', rows, kopf)
    rang = {'freigegeben': 5, 'vorgeschlagen': 4, 'geprueft': 3, 'entwurf': 2, 'verworfen': 1}
    beste = {}
    for r in b.alle('quelle'):
        k = r['kandidat_id']
        if k not in beste or rang.get(r['status'], 0) > rang.get(beste[k]['status'], 0):
            beste[k] = r
    schreiben(f'{K}/quelle.csv', list(beste.values()), b.kopf[('kohl', 'quelle')])
    # freigegeben/
    os.makedirs('data/wissensbasis/freigegeben', exist_ok=True)
    quellen = {'quelle': list(beste.values()), 'kulturgruppe': kg, 'art': b.alle('art'), 'profilwert': b.alle('profilwert'),
               'saatempfehlung': b.alle('saatempfehlung')}
    for n, rows in quellen.items():
        frei_rows = [r for r in rows if r['status'] == 'freigegeben']
        schreiben(f'data/wissensbasis/freigegeben/{n}.csv', frei_rows, SPALTEN_FREI[n])
        log.append(('FREIGEGEBEN', n, len(frei_rows)))
