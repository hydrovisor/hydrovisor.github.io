// Validator V1 bis V13 mit Gegenprobe (03_import_w0.md Abschnitt 7, Konzept 9.4). Läuft vor jedem Laden und
// ohne Datenbank (npm run w0:pruefen). Formatfehler sind V1 (A11); Verweise gelten gegen die Dateien desselben
// Laufs, fehlt die Zieldatei eines Verweises, bricht V2 ab (A11). Fehlt profilwert.csv, entfällt V13 (A12).
import { artGruppe, artKulturformen, artMerkmale, datei, wert, zeilen } from './bestand.ts';
import { gegenprobe } from './gegenprobe.ts';
import {
  ART_FELDER,
  AUFZAEHLUNG,
  DATEI,
  DATEI_NAMEN,
  KULTURFORM_FELDER,
  PHASEN,
  PRUEFSPALTEN,
  SPALTEN,
  STADIUM,
  STAMMFELDER,
  type DateiName,
  type FeldFormat,
} from './schema.ts';
import type { Konflikt, Regel, Verstoss, W0Dateien, Zeile } from './typen.ts';
import { ecTausendstel, type EcEinheit } from './umrechnung.ts';
import { istDezimal, istGanzzahl, tausendstel } from './zahl.ts';

export type { Konflikt, Regel, Verstoss } from './typen.ts';

export interface Pruefergebnis {
  verstoesse: Verstoss[];
  konflikte: Konflikt[];
}

export interface Pruefoptionen {
  modus: 'freigegeben' | 'kandidaten';
}

const ZEILE_ID = /^[a-z0-9_.-]{1,120}$/;
const DATUM = /^\d{4}-\d{2}-\d{2}$/;
const EC_OBERGRENZE_STANDARD = 2600;

function istDatum(text: string): boolean {
  if (!DATUM.test(text)) return false;
  const d = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(text);
}

class Pruefung {
  readonly verstoesse: Verstoss[] = [];
  private readonly d: W0Dateien;
  private readonly kandidaten: boolean;
  private datei = '';
  private zeileId: string | null = null;

  constructor(d: W0Dateien, optionen: Pruefoptionen) {
    this.d = d;
    this.kandidaten = optionen.modus === 'kandidaten';
  }

  private melde(regel: Regel, wert: string | null, text: string): void {
    this.verstoesse.push({ datei: this.datei, zeileId: this.zeileId, regel, wert, text });
  }

  private vorhanden(name: DateiName): boolean {
    return datei(this.d, name) !== undefined;
  }

  private ids(name: DateiName, spalte = 'zeile_id'): Set<string> {
    return new Set(zeilen(this.d, name).flatMap((z) => (z[spalte] ? [z[spalte]] : [])));
  }

  /** Verweis auf eine Datei desselben Laufs (V2) */
  private verweis(ziel: DateiName, menge: Set<string>, w: string | null, was: string): void {
    if (w === null) return;
    if (!this.vorhanden(ziel)) this.melde('V2', w, `${was} ${w}: ${DATEI[ziel]} nicht geliefert`);
    else if (!menge.has(w)) this.melde('V2', w, `${was} ${w} unbekannt`);
  }

  private pflicht(z: Zeile, spalten: string[], regel: Regel = 'V1'): void {
    for (const s of spalten) if (wert(z, s) === null) this.melde(regel, null, `${s} fehlt`);
  }

  private aufzaehlung(w: string | null, werte: readonly string[], was: string): void {
    if (w !== null && !werte.includes(w)) this.melde('V12', w, `${was} ${w} nicht in ${werte.join(', ')}`);
  }

  private format(w: string | null, f: FeldFormat, was: string, gruppen: Set<string>): void {
    if (w === null) return;
    switch (f.typ) {
      case 'text':
        return;
      case 'ganzzahl':
        if (!istGanzzahl(w)) this.melde('V1', w, `${was} ist keine Ganzzahl`);
        return;
      case 'zahl':
        if (!istDezimal(w)) this.melde('V1', w, `${was} ist keine Zahl`);
        else if (
          (f.min !== undefined && tausendstel(w) < tausendstel(f.min)) ||
          (f.max !== undefined && tausendstel(w) > tausendstel(f.max))
        )
          this.melde('V1', w, `${was} ausserhalb ${f.min ?? '…'} bis ${f.max ?? '…'}`);
        return;
      case 'janein':
        if (w !== 'ja' && w !== 'nein') this.melde('V1', w, `${was} nicht ja oder nein`);
        return;
      case 'monate': {
        const m = /^(\d{1,2})-(\d{1,2})$/.exec(w);
        if (!m || [m[1], m[2]].some((x) => Number(x) < 1 || Number(x) > 12))
          this.melde('V1', w, `${was} nicht im Format von-bis (Monate 1 bis 12)`);
        return;
      }
      case 'liste':
        for (const teil of w.split(';')) this.aufzaehlung(teil, AUFZAEHLUNG.kulturform, was);
        return;
      case 'aufzaehlung':
        this.aufzaehlung(w, f.werte, was);
        return;
      case 'kulturgruppe':
        this.verweis('kulturgruppe', gruppen, w, 'kulturgruppe_id');
        return;
    }
  }

  private zahl(z: Zeile, spalte: string, ganz = false): void {
    const w = wert(z, spalte);
    if (w !== null && !(ganz ? istGanzzahl(w) : istDezimal(w)))
      this.melde('V1', w, `${spalte} ist keine ${ganz ? 'Ganzzahl' : 'Zahl'}`);
  }

  private datum(z: Zeile, spalte: string, pflicht: boolean): void {
    const w = wert(z, spalte);
    if (w === null) {
      if (pflicht && !this.kandidaten) this.melde('V1', null, `${spalte} fehlt`);
    } else if (!istDatum(w)) this.melde('V1', w, `${spalte} ist kein Datum JJJJ-MM-TT`);
  }

  /** V9: Herkunft je Zeile; keine Evidenzklasse D */
  private herkunft(z: Zeile, mitKlasse = true): void {
    for (const s of ['quelle_id', 'fundstelle', 'kurzzitat', ...(mitKlasse ? ['evidenzklasse'] : [])]) {
      if (wert(z, s) === null) this.melde('V9', null, `${s} fehlt`);
    }
    const kurz = wert(z, 'kurzzitat');
    if (kurz !== null && kurz.length > 200)
      this.melde('V9', String(kurz.length), 'kurzzitat über 200 Zeichen');
    const klasse = wert(z, 'evidenzklasse');
    if (klasse === 'D') this.melde('V9', klasse, 'Evidenzklasse D erzeugt keine Zeile');
    else if (mitKlasse) this.aufzaehlung(klasse, AUFZAEHLUNG.evidenzklasse, 'evidenzklasse');
    this.verweis('quelle', this.ids('quelle', 'quelle_id'), wert(z, 'quelle_id'), 'quelle_id');
  }

  /** V1: Spalten nach Abschnitt 4; V1/V2: zeile_id */
  private spalten(name: DateiName): void {
    const t = datei(this.d, name);
    if (!t) return;
    this.datei = t.datei;
    this.zeileId = null;
    const schema = SPALTEN[name];
    for (const s of t.spalten) {
      if (s in schema) continue;
      if (PRUEFSPALTEN.includes(s) || s === 'kandidat_id') {
        if (!this.kandidaten) this.melde('V1', s, `Prüfspalte ${s} in freigegeben/ nicht erlaubt`);
      } else this.melde('V1', s, `unbekannte Spalte ${s}`);
    }
    for (const [s, pflicht] of Object.entries(schema)) {
      if (pflicht && !t.spalten.includes(s)) this.melde('V1', s, `Pflichtspalte ${s} fehlt`);
    }
    const gesehen = new Set<string>();
    const freigegeben = new Set<string>();
    for (const z of t.zeilen) {
      const id = wert(z, 'zeile_id');
      this.zeileId = id;
      if (id === null) this.melde('V1', null, 'zeile_id fehlt');
      else if (!ZEILE_ID.test(id))
        this.melde('V1', id, 'zeile_id nur a-z, 0-9, _, -, . und höchstens 120 Zeichen');
      const schluessel = this.kandidaten ? wert(z, 'kandidat_id') : id;
      if (schluessel !== null && gesehen.has(schluessel))
        this.melde('V2', schluessel, `${this.kandidaten ? 'kandidat_id' : 'zeile_id'} doppelt`);
      if (schluessel !== null) gesehen.add(schluessel);
      if (this.kandidaten && id !== null && wert(z, 'status') === 'freigegeben') {
        if (freigegeben.has(id)) this.melde('V2', id, 'mehr als ein freigegebener Kandidat je zeile_id');
        freigegeben.add(id);
      }
    }
  }

  private zeilenVon(name: DateiName, f: (z: Zeile) => void): void {
    const t = datei(this.d, name);
    if (!t) return;
    this.datei = t.datei;
    for (const z of t.zeilen) {
      this.zeileId = wert(z, 'zeile_id');
      f(z);
    }
    this.zeileId = null;
  }

  quelle(): void {
    this.zeilenVon('quelle', (z) => {
      this.pflicht(z, ['quelle_id', 'titel', 'link']);
      if (wert(z, 'quelle_id') !== this.zeileId)
        this.melde('V1', wert(z, 'quelle_id'), 'zeile_id ungleich quelle_id');
      const jahr = wert(z, 'jahr');
      if (jahr !== null && !/^\d{4}$/.test(jahr)) this.melde('V1', jahr, 'jahr nicht vierstellig');
      this.aufzaehlung(wert(z, 'klasse'), AUFZAEHLUNG.quelle_klasse, 'klasse');
      this.aufzaehlung(wert(z, 'anbaumethode'), AUFZAEHLUNG.system, 'anbaumethode');
      this.pflicht(z, ['klasse', 'anbaumethode']);
      this.datum(z, 'abgerufen_am', true);
      this.datum(z, 'freigegeben_am', true);
    });
  }

  kulturgruppe(): void {
    const arten = this.ids('art', 'art_id');
    this.zeilenVon('kulturgruppe', (z) => {
      this.pflicht(z, ['kulturgruppe_id', 'name', 'leitkultur_art_id', 'ec_obergrenze_validator']);
      if (wert(z, 'kulturgruppe_id') !== this.zeileId)
        this.melde('V1', wert(z, 'kulturgruppe_id'), 'zeile_id ungleich kulturgruppe_id');
      const grenze = wert(z, 'ec_obergrenze_validator');
      if (grenze !== null && !(istDezimal(grenze) && [2000, 2600].includes(tausendstel(grenze))))
        this.melde('V1', grenze, 'ec_obergrenze_validator nur 2.0 oder 2.6');
      this.verweis('art', arten, wert(z, 'leitkultur_art_id'), 'leitkultur_art_id');
      this.datum(z, 'freigegeben_am', true);
    });
  }

  art(): void {
    const gruppen = this.ids('kulturgruppe', 'kulturgruppe_id');
    this.zeilenVon('art', (z) => {
      const artId = wert(z, 'art_id');
      const kf = wert(z, 'kulturform');
      const feld = wert(z, 'feld');
      this.pflicht(z, ['art_id', 'feld', 'wert', 'vermerk']);
      if (artId !== null && feld !== null) {
        const soll = kf === null ? `art.${artId}.${feld}` : `ak.${artId}.${kf}.${feld}`;
        if (this.zeileId !== soll) this.melde('V1', this.zeileId, `zeile_id nicht ${soll}`);
      }
      this.aufzaehlung(kf, AUFZAEHLUNG.kulturform, 'kulturform');
      const format = feld === null ? undefined : (kf === null ? ART_FELDER : KULTURFORM_FELDER)[feld];
      if (feld !== null && !format) this.melde('V1', feld, `unbekanntes Feld ${feld}`);
      if (format) this.format(wert(z, 'wert'), format, feld ?? '', gruppen);
      this.aufzaehlung(wert(z, 'vermerk'), AUFZAEHLUNG.vermerk, 'vermerk');
      this.herkunft(z);
      this.datum(z, 'freigegeben_am', true);
    });
    const t = datei(this.d, 'art');
    if (!t) return;
    this.datei = t.datei;
    for (const [artId, felder] of artMerkmale(this.d)) {
      for (const s of STAMMFELDER) {
        if (!felder.has(s)) {
          this.zeileId = `art.${artId}.${s}`;
          this.melde('V1', artId, `Stammfeld ${s} fehlt`);
        }
      }
      // V11: Vorgabe liegt in kulturformen_erlaubt
      const vorgabe = felder.get('kulturform_vorgabe');
      const erlaubt = (felder.get('kulturformen_erlaubt')?.['wert'] ?? '').split(';');
      if (vorgabe?.['wert'] && !erlaubt.includes(vorgabe['wert'])) {
        this.zeileId = wert(vorgabe, 'zeile_id');
        this.melde(
          'V11',
          vorgabe['wert'],
          `kulturform_vorgabe nicht in kulturformen_erlaubt (${erlaubt.join(';')})`,
        );
      }
    }
    for (const formen of artKulturformen(this.d).values()) {
      for (const [kf, felder] of formen) {
        const ernteart = felder.get('ernteart');
        if (!ernteart) {
          this.zeileId = null;
          this.melde('V1', kf, `ernteart fehlt für Kulturform ${kf}`);
        }
        if (ernteart?.['wert'] === 'mehrfach') continue;
        for (const s of ['ernteintervall_d', 'schnitte_max']) {
          const z = felder.get(s);
          if (!z) continue;
          this.zeileId = wert(z, 'zeile_id');
          this.melde('V11', wert(z, 'wert'), `${s} nur bei ernteart mehrfach`);
        }
      }
    }
    this.zeileId = null;
  }

  profilwert(): void {
    const arten = this.ids('art', 'art_id');
    const gruppen = this.ids('kulturgruppe', 'kulturgruppe_id');
    const artGr = artGruppe(this.d);
    const obergrenze = new Map(
      zeilen(this.d, 'kulturgruppe').map((z) => [
        wert(z, 'kulturgruppe_id') ?? '',
        istDezimal(z['ec_obergrenze_validator'] ?? '') ? tausendstel(z['ec_obergrenze_validator'] ?? '') : 0,
      ]),
    );
    this.zeilenVon('profilwert', (z) => {
      const ebene = wert(z, 'ebene');
      const bezug = wert(z, 'bezug');
      const phase = wert(z, 'phase');
      const groesse = wert(z, 'groesse');
      this.pflicht(z, ['ebene', 'bezug', 'phase', 'groesse', 'system_quelle', 'umgebung_quelle', 'vermerk']);
      this.aufzaehlung(ebene, AUFZAEHLUNG.profil_ebene, 'ebene');
      this.aufzaehlung(phase, AUFZAEHLUNG.phase, 'phase');
      this.aufzaehlung(groesse, AUFZAEHLUNG.groesse, 'groesse');
      this.aufzaehlung(wert(z, 'system_quelle'), AUFZAEHLUNG.system, 'system_quelle');
      this.aufzaehlung(wert(z, 'umgebung_quelle'), AUFZAEHLUNG.umgebung, 'umgebung_quelle');
      this.aufzaehlung(wert(z, 'vermerk'), AUFZAEHLUNG.vermerk, 'vermerk');
      if (
        bezug !== null &&
        phase !== null &&
        groesse !== null &&
        this.zeileId !== `pw.${bezug}.${phase}.${groesse}`
      )
        this.melde('V1', this.zeileId, `zeile_id nicht pw.${bezug}.${phase}.${groesse}`);
      if (ebene === 'art') this.verweis('art', arten, bezug, 'art_id');
      if (ebene === 'kulturgruppe') this.verweis('kulturgruppe', gruppen, bezug, 'kulturgruppe_id');
      if (ebene === 'standard' && bezug !== 'standard')
        this.melde('V1', bezug, 'bezug bei Ebene standard ist standard');
      for (const s of ['wert_min', 'wert_typ', 'wert_max', 'bezugstemperatur_c', 'bezugs_dli'])
        this.zahl(z, s);
      this.herkunft(z);
      this.datum(z, 'freigegeben_am', true);

      // V8
      if (ebene === 'standard' && groesse !== null && !['ph', 'wassertemp', 'licht_h'].includes(groesse))
        this.melde('V8', groesse, 'Ebene standard nur ph, wassertemp, licht_h');
      if ((groesse === 'keimart' || groesse === 'keimtemp') && phase !== 'keimung')
        this.melde('V8', phase, `${groesse} nur in Phase keimung`);
      const einheit = wert(z, 'einheit_quelle');
      const basis = wert(z, 'ec_basis');
      if (groesse === 'ec' && (einheit === null || basis === null))
        this.melde('V8', null, 'einheit_quelle und ec_basis bei ec Pflicht');
      if (groesse !== 'ec' && (einheit !== null || basis !== null))
        this.melde('V8', einheit ?? basis, 'einheit_quelle und ec_basis nur bei ec');
      this.aufzaehlung(einheit, AUFZAEHLUNG.ec_einheit, 'einheit_quelle');
      this.aufzaehlung(basis, AUFZAEHLUNG.ec_basis, 'ec_basis');
      // V13: keine pH- und EC-Werte der Kulturgruppe in der Keimung
      if (ebene === 'kulturgruppe' && phase === 'keimung' && (groesse === 'ph' || groesse === 'ec'))
        this.melde('V13', groesse, `${groesse} der Kulturgruppe in Phase keimung`);

      const min = wert(z, 'wert_min');
      const typ = wert(z, 'wert_typ');
      const max = wert(z, 'wert_max');
      const zahlen = [min, max].every((x) => x !== null && istDezimal(x));
      const t = (x: string | null) => tausendstel(x ?? '0');
      const text = wert(z, 'text_wert');
      switch (groesse) {
        case 'anwendbar':
          if (text === null) this.melde('V1', null, 'text_wert fehlt');
          this.aufzaehlung(text, AUFZAEHLUNG.anwendbar, 'anwendbar');
          break;
        case 'keimart':
          if (text === null) this.melde('V1', null, 'text_wert fehlt');
          this.aufzaehlung(text, AUFZAEHLUNG.keimart, 'keimart');
          break;
        case 'wechselmerkmal':
          if (text === null) this.melde('V1', null, 'text_wert fehlt');
          else if (text.length > 120)
            this.melde('V10', String(text.length), 'wechselmerkmal über 120 Zeichen');
          break;
        case 'dauer': {
          const ok = [min, typ, max].every((x) => x !== null && istGanzzahl(x));
          if (!ok || t(min) <= 0 || t(min) > t(typ) || t(typ) > t(max))
            this.melde('V6', `${min}/${typ}/${max}`, 'Dauer min ≤ typ ≤ max, alle über 0, ganze Tage');
          break;
        }
        case 'bbch':
          if (!zahlen || t(min) < 0 || t(max) > 99000 || t(min) > t(max))
            this.melde('V1', `${min}-${max}`, 'BBCH von bis 0 bis 99');
          break;
        case 'ph':
          if (!zahlen) this.melde('V1', `${min}-${max}`, 'wert_min und wert_max Pflicht');
          else {
            if (t(min) < 5200 || t(max) > 7000)
              this.melde('V3', `${min}-${max}`, 'pH ausserhalb 5.2 bis 7.0');
            const band = t(max) - t(min);
            if (band < 200 || band > 1200)
              this.melde('V5', `${min}-${max}`, 'pH-Bandbreite nicht 0.2 bis 1.2');
          }
          break;
        case 'ec':
          if (!zahlen) this.melde('V1', `${min}-${max}`, 'wert_min und wert_max Pflicht');
          else if (einheit !== null && (AUFZAEHLUNG.ec_einheit as readonly string[]).includes(einheit)) {
            const e = einheit as EcEinheit;
            const lo = ecTausendstel(min ?? '0', e);
            const hi = ecTausendstel(max ?? '0', e);
            const gruppe = ebene === 'kulturgruppe' ? bezug : artGr.get(bezug ?? '');
            const grenze = obergrenze.get(gruppe ?? '') || EC_OBERGRENZE_STANDARD;
            if (lo < 400 || hi > grenze)
              this.melde('V4', `${min}-${max} ${einheit}`, `EC ausserhalb 0.4 bis ${grenze / 1000} mS/cm`);
            if (hi - lo < 200 || hi - lo > 1200)
              this.melde('V5', `${min}-${max} ${einheit}`, 'EC-Bandbreite nicht 0.2 bis 1.2 mS/cm');
          }
          break;
        case 'wassertemp':
          if (!zahlen || t(min) < 10000 || t(max) > 28000)
            this.melde('V7', `${min}-${max}`, 'Wassertemperatur 10 bis 28 °C');
          break;
        case 'licht_h':
          if (!zahlen || t(min) < 0 || t(max) > 24000)
            this.melde('V7', `${min}-${max}`, 'Lichtstunden 0 bis 24');
          break;
        case 'keimtemp':
          if (!zahlen || t(min) > t(max)) this.melde('V1', `${min}-${max}`, 'Keimtemperatur von bis in °C');
          break;
      }
    });
  }

  saatempfehlung(): void {
    const arten = this.ids('art', 'art_id');
    const sorten = this.ids('sorten');
    this.zeilenVon('saatempfehlung', (z) => {
      const ebene = wert(z, 'ebene');
      const bezug = wert(z, 'bezug');
      const kf = wert(z, 'kulturform');
      this.pflicht(z, [
        'ebene',
        'bezug',
        'kulturform',
        'samen_je_schwamm',
        'obergrenze_samen',
        'pflanzen_stehen_lassen',
        'klasse_saatmenge',
        'substrat_passung',
        'begruendung',
      ]);
      this.aufzaehlung(ebene, AUFZAEHLUNG.saat_ebene, 'ebene');
      this.aufzaehlung(kf, AUFZAEHLUNG.kulturform, 'kulturform');
      this.aufzaehlung(wert(z, 'klasse_saatmenge'), AUFZAEHLUNG.klasse_saatmenge, 'klasse_saatmenge');
      if (bezug !== null && kf !== null && this.zeileId !== `se.${bezug}.${kf}`)
        this.melde('V1', this.zeileId, `zeile_id nicht se.${bezug}.${kf}`);
      if (ebene === 'art') this.verweis('art', arten, bezug, 'art_id');
      if (ebene === 'sorte') this.verweis('sorten', sorten, bezug, 'Sorte');
      for (const s of ['samen_je_schwamm', 'obergrenze_samen', 'pflanzen_stehen_lassen'])
        this.zahl(z, s, true);
      const samen = Number(wert(z, 'samen_je_schwamm'));
      if (
        samen < 1 ||
        Number(wert(z, 'obergrenze_samen')) < samen ||
        Number(wert(z, 'pflanzen_stehen_lassen')) < 1
      )
        this.melde(
          'V1',
          `${samen}`,
          'samen_je_schwamm ≥ 1, obergrenze_samen ≥ samen_je_schwamm, pflanzen ≥ 1',
        );
      if (wert(z, 'klasse_saatmenge') !== 'D') this.herkunft(z, false);
      else this.verweis('quelle', this.ids('quelle', 'quelle_id'), wert(z, 'quelle_id'), 'quelle_id');
      this.datum(z, 'freigegeben_am', true);
    });
  }

  sorten(): void {
    const quellen = this.ids('quelle', 'quelle_id');
    const namen = new Set([...artMerkmale(this.d).values()].map((f) => f.get('name_de')?.['wert'] ?? ''));
    const mitArten = this.vorhanden('art');
    this.zeilenVon('sorten', (z) => {
      this.pflicht(z, ['name', 'art', 'kulturtyp']);
      const art = wert(z, 'art');
      if (mitArten && art !== null && !namen.has(art))
        this.melde('V2', art, `Art ${art} nicht in art.csv (name_de)`);
      this.aufzaehlung(wert(z, 'kulturtyp'), AUFZAEHLUNG.kulturtyp, 'kulturtyp');
      this.aufzaehlung(wert(z, 'keimart_tuete'), AUFZAEHLUNG.keimart, 'keimart_tuete');
      this.aufzaehlung(wert(z, 'wuchsform'), AUFZAEHLUNG.wuchsform, 'wuchsform');
      const keimtemp = wert(z, 'keimtemperatur_tuete');
      const m = keimtemp === null ? null : /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/.exec(keimtemp);
      if (keimtemp !== null && (!m || tausendstel(m[1] ?? '0') > tausendstel(m[2] ?? '0')))
        this.melde('V1', keimtemp, 'keimtemperatur_tuete nicht min-max in °C');
      this.zahl(z, 'wuchshoehe_max_mm', true);
      this.zahl(z, 'fruehzeitigkeit_relativ', true);
      this.zahl(z, 'bestand_korn', true);
      const bestand = wert(z, 'bestand_korn');
      if (bestand !== null && Number(bestand) < 0) this.melde('V1', bestand, 'bestand_korn unter 0');
      this.format(
        wert(z, 'keimfaehigkeit_packung'),
        { typ: 'zahl', min: 0, max: 1 },
        'keimfaehigkeit_packung',
        new Set(),
      );
      this.datum(z, 'kaufdatum', false);
      const katalog = wert(z, 'katalog_quelle');
      this.verweis('quelle', quellen, katalog, 'katalog_quelle');
      const katalogwert = ['wuchshoehe_max_mm', 'wuchsform', 'fruehzeitigkeit_relativ'].find(
        (s) => wert(z, s) !== null,
      );
      if (katalogwert && katalog === null)
        this.melde('V9', katalogwert, `${katalogwert} ohne katalog_quelle`);
    });
  }

  duengerschema(): void {
    this.zeilenVon('duengerschema', (z) => {
      const stadium = wert(z, 'stadium');
      this.pflicht(z, ['stadium', 'grow_ml_l', 'micro_ml_l', 'bloom_ml_l', 'summe_ml_l', 'herkunft']);
      if (stadium !== null && !(stadium in STADIUM))
        this.melde('V12', stadium, `stadium nicht in ${Object.keys(STADIUM).join(', ')}`);
      const dosen = ['grow_ml_l', 'micro_ml_l', 'bloom_ml_l', 'summe_ml_l'];
      for (const s of [...dosen, 'ec_richtwert_min_ms_cm', 'ec_richtwert_max_ms_cm']) this.zahl(z, s);
      if (dosen.every((s) => istDezimal(wert(z, s) ?? ''))) {
        const [g, m, b, summe] = dosen.map((s) => tausendstel(wert(z, s) ?? '0'));
        if (Math.abs((g ?? 0) + (m ?? 0) + (b ?? 0) - (summe ?? 0)) > 10)
          this.melde('V1', wert(z, 'summe_ml_l'), 'summe_ml_l ungleich Summe der drei Dosen (±0.01)');
      }
      this.aufzaehlung(wert(z, 'ec_basis'), AUFZAEHLUNG.ec_basis, 'ec_basis');
      this.aufzaehlung(wert(z, 'herkunft'), AUFZAEHLUNG.herkunft_duenger, 'herkunft');
      this.herkunft(z);
      this.datum(z, 'freigegeben_am', false);
    });
  }

  wissenseintrag(): void {
    const arten = this.ids('art', 'art_id');
    const gruppen = this.ids('kulturgruppe', 'kulturgruppe_id');
    this.zeilenVon('wissenseintrag', (z) => {
      const ebene = wert(z, 'ebene');
      const bezug = wert(z, 'bezug');
      this.pflicht(z, ['ebene', 'bezug', 'typ', 'text']);
      this.aufzaehlung(ebene, AUFZAEHLUNG.wissen_ebene, 'ebene');
      this.aufzaehlung(wert(z, 'phase'), AUFZAEHLUNG.phase, 'phase');
      this.aufzaehlung(wert(z, 'typ'), AUFZAEHLUNG.wissenseintrag_typ, 'typ');
      if (bezug !== null && !(this.zeileId ?? '').startsWith(`we.${bezug}.`))
        this.melde('V1', this.zeileId, `zeile_id beginnt nicht mit we.${bezug}.`);
      if (ebene === 'art') this.verweis('art', arten, bezug, 'art_id');
      if (ebene === 'kulturgruppe') this.verweis('kulturgruppe', gruppen, bezug, 'kulturgruppe_id');
      if (ebene === 'allgemein' && bezug !== 'allgemein')
        this.melde('V1', bezug, 'bezug bei Ebene allgemein ist allgemein');
      const text = wert(z, 'text');
      if (text !== null && text.length > 600) this.melde('V10', String(text.length), 'text über 600 Zeichen');
      if (text !== null && /kcl|lagerlösung/i.test(text))
        this.melde('V10', text, 'text erwähnt KCl oder Lagerlösung');
      this.herkunft(z);
      this.datum(z, 'freigegeben_am', false);
    });
  }

  /** V13: Mindestzeilen je Kulturgruppe nach 4.4.2 */
  mindestzeilen(): void {
    if (this.kandidaten || !this.vorhanden('profilwert') || !this.vorhanden('kulturgruppe')) return;
    const pw = zeilen(this.d, 'profilwert').filter((z) => wert(z, 'ebene') === 'kulturgruppe');
    this.datei = DATEI.profilwert;
    this.zeileId = null;
    for (const gruppe of this.ids('kulturgruppe', 'kulturgruppe_id')) {
      const hat = (phase: string, groesse: string) =>
        pw.find(
          (z) => wert(z, 'bezug') === gruppe && wert(z, 'phase') === phase && wert(z, 'groesse') === groesse,
        );
      const anwendbar = PHASEN.filter((p) => {
        const z = hat(p, 'anwendbar');
        if (!z) this.melde('V13', gruppe, `Kulturgruppe ${gruppe}: anwendbar fehlt in Phase ${p}`);
        return z?.['text_wert'] === 'ja';
      });
      const letzte = anwendbar[anwendbar.length - 1];
      for (const p of anwendbar) {
        const noetig = [
          'dauer',
          'bbch',
          ...(p === letzte ? [] : ['wechselmerkmal']),
          ...(p === 'keimung' ? [] : ['ph', 'ec']),
        ];
        for (const g of noetig) {
          if (!hat(p, g)) this.melde('V13', gruppe, `Kulturgruppe ${gruppe}: ${g} fehlt in Phase ${p}`);
        }
      }
    }
  }

  alle(): void {
    for (const name of DATEI_NAMEN) this.spalten(name);
    this.quelle();
    this.kulturgruppe();
    this.art();
    this.profilwert();
    this.saatempfehlung();
    this.sorten();
    this.duengerschema();
    this.wissenseintrag();
    this.mindestzeilen();
  }
}

export function pruefen(dateien: W0Dateien, optionen: Pruefoptionen): Pruefergebnis {
  const p = new Pruefung(dateien, optionen);
  p.alle();
  return { verstoesse: p.verstoesse, konflikte: optionen.modus === 'kandidaten' ? [] : gegenprobe(dateien) };
}
