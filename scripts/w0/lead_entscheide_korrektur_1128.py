# W0-Korrekturen nach dem Belegungsplan-Abgleich vom 28.11.2026 (Issue #277; docs/plaene/belegungsplan_abgleich_2026-11-28.md,
# Abweichungen C und F, Basilikum-Nachkontrolle). Zwei freigegebene Werte zählen anders als die App; die Korrektur ist je
# eine neue W0-Zeile (Konzept v1.11 9.3 und 9.4, Entscheid 0029), der Seed schliesst die alte Fassung (gueltig_bis).
# Aufruf im Repository-Wurzelordner (genau einmal mit --schreiben; danach nie erneut, E() legt sonst doppelt an):
#   W0_HEUTE=2026-11-28 python -X utf8 scripts/w0/lead_entscheide_korrektur_1128.py              Trockenlauf mit Protokoll
#   W0_HEUTE=2026-11-28 python -X utf8 scripts/w0/lead_entscheide_korrektur_1128.py --schreiben  Status nachführen, Übertrag
# Quelle, Kurzzitat und Evidenzklasse bleiben die der alten Zeile (Plan 277 A3); die Ableitung steht in der Fundstelle.
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from w0lib import *  # noqa: F401,F403,E402

b = Bestand()
LOG = []
RN = 'Korrektur 28.11.2026 (#277), '


def korrektur(zid, alt_kid, wert, ableitung, grund):
    """neue Zeile aus der freigegebenen alten Fassung; die alte wird verworfen mit Verweis auf die neue"""
    _, _, alt = finde(b, alt_kid)
    if alt['status'] != 'freigegeben':
        LOG.append(('UEBERSPRUNGEN', zid, f'{alt_kid} ist nicht freigegeben ({alt["status"]})'))
        return
    _, a, kf, feld = zid.split('.')
    fundstelle = f'{alt["fundstelle"]}; Ableitung des Lead 28.11.2026 (#277): {ableitung}'
    neu = eigen(b, zid, alt_kid, dict(art_id=a, kulturform=kf, feld=feld, wert=str(wert), fundstelle=fundstelle),
                RN + grund)
    alt['notiz_tim'] = notiz(RN + f'ersetzt durch {neu["kandidat_id"]} ({wert}); vorher: '
                             + alt['notiz_tim'].removeprefix('Lead nach Entscheid 0018: '))
    LOG.append(('KORREKTUR', zid, f'{alt_kid} {alt["wert"]} -> {neu["kandidat_id"]} {wert}'))


ak = 'ak.'

# ---------------- C: Schnittsalat, Kulturdauer max. (Tims Entscheid) ----------------
# Tim im Chat am 28.11.2026 auf die Empfehlungen des Lead zum Belegungsplan-Abgleich: «Ja, so umsetzen». Entscheid C:
# Die Standzeit von 42 Tagen der Schnittsalate (Lollo Rossa, Eissalat, Eichblatt) gilt ab Umsetzen (Plan, Konzept 14.1);
# der Plantag liegt 14 Tage nach der Saat. Die App rechnet das Ende als Saat + kulturdauer_max_d (03_import_w0.md 4.3.3).
# Die Quelle selbst zählt sechs Wochen ab Saat (Direktsaat in die Schalen); 56 stützt sich auf Tims Entscheid (Befund 1).
korrektur(f'{ak}lactuca_sativa.schnitt.kulturdauer_max_d', f'{ak}lactuca_sativa.schnitt.kulturdauer_max_d#2', 56,
          'Die Quelle zählt sechs Wochen ab Saat (Direktsaat in die Schalen, 42 Tage nach D4); nach Tims Entscheid C vom '
          '28.11.2026 gilt die Standzeit von 42 Tagen ab Umsetzen (Konzept 14.1), also 42 Tage Standzeit + 14 Tage von der '
          'Saat bis zum Plantag = 56 Tage ab Saat; die 56 Tage stützen sich auf Tims Entscheid, nicht auf die Quelle',
          'Tims Entscheid C vom 28.11.2026 im Chat («Ja, so umsetzen», Belegungsplan-Abgleich): Standzeit 42 Tage ab '
          'Umsetzen gilt, Plantag 14 Tage nach der Saat, also 42 + 14 = 56 Tage ab Saat statt 42 (die Quelle belegt sechs '
          'Wochen ab Saat, 56 folgt aus der Zählweise ab Umsetzen nach Tims Entscheid); Quelle, Kurzzitat und Klasse der '
          'alten Zeile bleiben')

# ---------------- F: Nüsslisalat, Ernte ab (Lead, (A)) ----------------
# Die Quelle (Floating, Klasse A) zählt die 29 Tage ab dem Umsetzen nach 22 Tagen Anzucht in Steinwolle (dieselbe Quelle
# trägt art.valerianella_locusta.umsetzen_ab_d 22). Die Anlage sät Nüsslisalat direkt (3.1, Kratky, Konzept 3.3 und 14.1).
# Regel D7 Satz 1 und 03_import_w0.md 4.3.3: ernte_ab_d zählt bei Direktsaat ab Saat; die App rechnet einmalige Ernte bei
# Direktsaat als Saat + ernte_ab_d (voraussichtlichesEnde(), ernteStand().moeglichAb). Die Quelle liefert beide Teile;
# dieselbe Summe trägt schon ak.valerianella_locusta.kopf.kulturdauer_typisch_d 51 (12.11.2026).
korrektur(f'{ak}valerianella_locusta.kopf.ernte_ab_d', f'{ak}valerianella_locusta.kopf.ernte_ab_d#2', 51,
          '29 Tage ab Umsetzen + 22 Tage Anzucht derselben Quelle (Abschnitt 4.1, art.valerianella_locusta.umsetzen_ab_d) '
          '= 51 Tage ab Saat; Regel D7 Satz 1 und 03_import_w0.md 4.3.3: «Ernte ab» zählt bei Direktsaat ab Saat, die '
          'Anlage sät Nüsslisalat direkt (3.1, Kratky), die Quelle liefert beide Teile; gleich '
          'ak.valerianella_locusta.kopf.kulturdauer_typisch_d 51 derselben Quelle',
          'Abweichung F des Belegungsplan-Abgleichs, Regel D7 Satz 1 (A): «Ernte ab» zählt bei Direktsaat ab Saat '
          '(03_import_w0.md 4.3.3); die Quelle zählt 29 Tage ab Umsetzen nach 22 Tagen Anzucht, die Anlage sät direkt '
          '(3.1, Kratky), also 29 + 22 = 51 Tage ab Saat statt 29 (gleich kulturdauer_typisch_d 51 derselben Quelle); '
          'mit Saat 7.1.2027 erste Ernte 27.2.2027 wie im Plan (26.2. bis 8.3.), unter kulturdauer_max_d 66')

# ---------------- Nachkontrolle Basilikum Schnitt, Ernte ab ----------------
# ak.ocimum_basilicum.schnitt.ernte_ab_d 50 (Adv. Hort. Sci. 27(4), vor D7 freigegeben): Quellenprüfer am 28.11.2026
# gegen die Lesekopie vom 21.11.2026 «bestaetigt», Zählbeginn ab Umsetzen in das NFT-System («sample 5 (first harvest
# and 50 days after transplant)», «green genotype, 50 DAT»). D7 erfüllt, keine neue Zeile.
_, _, bas = finde(b, f'{ak}ocimum_basilicum.schnitt.ernte_ab_d#1')
assert bas['status'] == 'freigegeben' and bas['wert'] == '50', bas
LOG.append(('BLEIBT', f'{ak}ocimum_basilicum.schnitt.ernte_ab_d', '50 ab Umsetzen (Quellenprüfer 28.11.2026)'))

if '--schreiben' in sys.argv:
    uebertrag(b, LOG)
for x in LOG:
    print(*x)
