// Nachfüllen Kratky ausserhalb des Rundgangs (Issue #225, Plan 225 Entscheide 4 und 7, Variante A, Testliste; UX3-AK5;
// R4.10, R5.1, R5.2, G1, G2; A6, A10). Die Aufgabe «Nachfüllen Kratky» führt über die Route nachfuellen in den Schritt
// des Rundgangs; Grundlage ist die Auslöser-Messung «unter ⅓» aus dem Bündel. «Nächste Aufgabe» nach der Kratky-Messung
// ist das Nachfüllen desselben Gefässes. Datenstand rundgangTeile() aus tests/fixtures/rundgang.ts (3.1 Kratky
// belüftet, EC 0.8–1.2, Innenmass 365 × 265 mm, Betriebsvolumen 9 l); injizierte Uhr Di 12.1.2027 09:00 Zürich,
// Zeitzone Europe/Zurich. Keine Personendaten.
//
// Vertrag (Plan 225 Entscheid 4):
//   src/domain/rundgang/nachfuellen.ts
//     kratkyNachfuellAufgabe(teile, faellig, platzId): { aufgabe: Aufgabe; messung: MessungZeile } | undefined
//       aufgabe = die fällige Aufgabe nachfuellen_kratky des Platzes, messung = ihre Auslöser-Messung (letzte gültige
//       Messung des Platzes mit Füllstand «unter ⅓», ec und fuellstand wie gespeichert); ohne fällige Aufgabe undefined.
//   src/domain/aufgaben-folge.ts: aufgabeZiel(nachfuellen_kratky) = { name: 'nachfuellen', code } und nachfuellen ist eine
//     Erfassungsmaske (EIGENE_MASKE).
import { describe, expect, it } from 'vitest';
import { folgeAufgabe, heuteFolge, type AufgabenZiel } from '../../src/domain/aufgaben-folge.ts';
import { einstellungenAus, faelligeAufgaben, type Aufgabe } from '../../src/domain/aufgaben.ts';
import { verteilteAufgaben } from '../../src/domain/aufgaben-verteilung.ts';
import { vorgangPruefen } from '../../src/domain/datenpfad/erfassung.ts';
import {
  kratkyErgebnis,
  kratkyNachfuellAufgabe,
  kratkySchritt,
  nachfuellVorgang,
} from '../../src/domain/rundgang/nachfuellen.ts';
import type { Teile } from '../../src/domain/anlage/teile.ts';
import { platzId, uid } from '../fixtures/regal.ts';
import { JETZT, rundgangMessungDazu, rundgangTeile } from '../fixtures/rundgang.ts';
import { sichtenNachrechnen, vorgangAnwenden } from '../fixtures/sichten.ts';

const Z = 'Europe/Zurich';
const P31 = platzId('3.1');
const VOLUMEN_31_L = 9;

const faellig = (t: Teile, jetzt = JETZT): Aufgabe[] => faelligeAufgaben(t, einstellungenAus(t), jetzt, Z);
const verteilt = (t: Teile, jetzt = JETZT): Aufgabe[] => verteilteAufgaben(t, einstellungenAus(t), jetzt, Z);
const messen = (code: string): AufgabenZiel => ({ name: 'messen', code }) as AufgabenZiel;

/** Rundgang-Stand mit einer Kratky-Messung «unter ⅓» in 3.1 heute; gibt Teile und Messzeile zurück */
function unterDrittel(ec = 1.0) {
  const t = rundgangTeile();
  const m = rundgangMessungDazu(t, { kennung: '3.1', ec, fuellstand: 'unter_drittel', nr: 71 });
  sichtenNachrechnen(t);
  return { t, m };
}

describe('UX3-AK5 Nachfüllen Kratky ausserhalb des Rundgangs (Variante A)', () => {
  it('UX3-AK5 kratkyNachfuellAufgabe() liefert die Aufgabe und die Auslöser-Messung «unter ⅓»; ohne fällige Aufgabe undefined; nachfuellVorgang() mit aufgabe_schluessel wie im Rundgang', () => {
    const { t, m } = unterDrittel();
    const l = faellig(t);
    const r = kratkyNachfuellAufgabe(t, l, P31);
    expect(r).toBeDefined();
    if (!r) return;
    expect(r.aufgabe.typ).toBe('nachfuellen_kratky');
    expect(r.aufgabe.schluessel).toBe(
      l.find((a) => a.typ === 'nachfuellen_kratky' && a.ort?.platzId === P31)?.schluessel,
    );
    expect(r.aufgabe.schluessel).toBe(`nachfuellen_kratky|${P31}|2027-01-12`);
    expect(r.messung.id).toBe(m['id']);
    expect(r.messung.platz_id).toBe(P31);
    expect(r.messung.fuellstand).toBe('unter_drittel');
    expect(Number(r.messung.ec)).toBeCloseTo(1.0, 5);
    expect(r.messung.gilt_ab).toBe(JETZT.toISOString());

    // dieselbe Rechnung wie im Rundgang: EC im Band → halbe Konzentration, höchstens 2.4 l
    const k = kratkySchritt(t, P31, r.messung, Z);
    expect(k.art).toBe('halbe_konzentration');
    expect('hoechstensLiter' in k ? k.hoechstensLiter : undefined).toBe(24);

    // «Nachgefüllt» 1.5 l: Ansatz nachfuellen mit Schlüssel und Fälligkeit der Aufgabe, Positionen bezugsvolumen 1.5
    const ergebnis = kratkyErgebnis(t, P31, r.messung, 1.5, Z);
    expect(ergebnis?.nurWasser).toBe(false);
    let n = 0;
    // fünf Minuten nach der Messung (R4.10: Nachfüllen nach der Auslöser-Messung)
    const danach = new Date('2027-01-12T08:05:00.000Z');
    const v = nachfuellVorgang(
      {
        platzId: P31,
        liter: 1.5,
        ...(ergebnis ? { ergebnis } : {}),
        aufgabe: r.aufgabe,
        volumenL: VOLUMEN_31_L,
      },
      () => uid('5e', (n += 1)),
      danach,
    );
    expect(vorgangPruefen(v)).toEqual([]);
    const kopf = v.find((s) => s.art === 'neu' && s.tabelle === 'naehrloesungsansatz');
    expect(kopf).toMatchObject({
      felder: {
        platz_id: P31,
        typ: 'nachfuellen',
        nachgefuellt_l: 1.5,
        war_faellig_am: r.aufgabe.faelligAm,
        aufgabe_schluessel: r.aufgabe.schluessel,
      },
    });
    const positionen = v.filter((s) => s.art === 'neu' && s.tabelle === 'ansatz_position');
    expect(positionen.length).toBeGreaterThan(0);

    // danach ist nichts mehr fällig: undefined
    const nachher = vorgangAnwenden(t, v, danach);
    expect(kratkyNachfuellAufgabe(nachher, faellig(nachher, danach), P31)).toBeUndefined();

    // ohne Messung «unter ⅓» (nur «über ⅓» vom 5.1.) keine Aufgabe
    const ohne = rundgangTeile();
    expect(kratkyNachfuellAufgabe(ohne, faellig(ohne), P31)).toBeUndefined();
    // ein anderes Gefäss (1.1 DWC) hat kein Nachfüllen Kratky
    expect(kratkyNachfuellAufgabe(t, l, platzId('1.1'))).toBeUndefined();
    // die fällige Aufgabe fehlt in der übergebenen Liste: undefined
    expect(kratkyNachfuellAufgabe(t, [], P31)).toBeUndefined();
  });

  it('UX3-AK5 kratkyNachfuellAufgabe(): Auslöser ist die letzte gültige Messung «unter ⅓»; eine spätere Messung «über ⅓» erledigt die Aufgabe', () => {
    const t = rundgangTeile();
    rundgangMessungDazu(t, {
      kennung: '3.1',
      ec: 1.3,
      fuellstand: 'unter_drittel',
      giltAb: '2027-01-12T06:00:00.000Z',
      nr: 72,
    });
    const spaeter = rundgangMessungDazu(t, {
      kennung: '3.1',
      ec: 1.0,
      fuellstand: 'unter_drittel',
      giltAb: '2027-01-12T07:00:00.000Z',
      nr: 73,
    });
    sichtenNachrechnen(t);
    const r = kratkyNachfuellAufgabe(t, faellig(t), P31);
    expect(r?.messung.id).toBe(spaeter['id']);
    expect(Number(r?.messung.ec)).toBeCloseTo(1.0, 5);

    // stornierte Auslöser-Messung zählt nicht: die frühere bleibt Grundlage
    spaeter['storniert_am'] = '2027-01-12T07:30:00.000Z';
    sichtenNachrechnen(t);
    const ohneSpaetere = kratkyNachfuellAufgabe(t, faellig(t), P31);
    expect(ohneSpaetere?.messung.id).not.toBe(spaeter['id']);
    expect(Number(ohneSpaetere?.messung.ec)).toBeCloseTo(1.3, 5);

    // danach «über ⅓»: nichts mehr fällig
    const u = rundgangTeile();
    rundgangMessungDazu(u, {
      kennung: '3.1',
      ec: 1.0,
      fuellstand: 'unter_drittel',
      giltAb: '2027-01-12T06:00:00.000Z',
      nr: 74,
    });
    rundgangMessungDazu(u, {
      kennung: '3.1',
      ec: 1.0,
      fuellstand: 'ueber_drittel',
      giltAb: '2027-01-12T07:00:00.000Z',
      nr: 75,
    });
    sichtenNachrechnen(u);
    expect(kratkyNachfuellAufgabe(u, faellig(u), P31)).toBeUndefined();
  });

  it('UX3-AK5 nach einer Kratky-Messung «unter ⅓» in R-3.1 ist «Nachfüllen Kratky» R-3.1 die nächste Aufgabe', () => {
    // Schlüsselfolge von Heute beim Öffnen der Messmaske R-3.1 (noch ohne Nachfüllen)
    const start = rundgangTeile();
    const vorher = heuteFolge(start, verteilt(start), JETZT, Z).map((e) => e.schluessel);
    expect(
      vorher.some((s) => s.startsWith('nachfuellen_kratky|')),
      'Vorbedingung',
    ).toBe(false);

    // Messung «unter ⅓» gespeichert, Bündel nachgeladen
    const { t } = unterDrittel();
    const folge = heuteFolge(t, verteilt(t), JETZT, Z);
    const eintrag = folge.find((e) => e.schluessel.startsWith('nachfuellen_kratky|'));
    expect(eintrag?.ziel).toEqual({ name: 'nachfuellen', code: 'R-3.1' });

    const f = folgeAufgabe(t, JETZT, Z, { ziel: messen('R-3.1'), vorher });
    expect(f).toBeDefined();
    expect(f?.titel).toBe('Nachfüllen Kratky');
    expect(f?.ort).toMatch(/3\.1$/);
    expect(f?.ziel).toEqual({ name: 'nachfuellen', code: 'R-3.1' });
    expect(f?.schluessel).toBe(`nachfuellen_kratky|${P31}|2027-01-12`);

    // nach dem Nachfüllen selbst ist es nicht mehr die Folgeaufgabe
    const nach = folgeAufgabe(t, JETZT, Z, {
      ziel: { name: 'nachfuellen', code: 'R-3.1' } as unknown as AufgabenZiel,
      vorher: folge.map((e) => e.schluessel),
    });
    expect(nach?.ziel).not.toEqual({ name: 'nachfuellen', code: 'R-3.1' });
  });
});
