// Kurzprüfung und Wurzeln in Heute und im Gefäss (Issue #225, Plan 225 Entscheide 1 und 2, Testliste; UX3-AK1,
// UX3-AK2; R5.1, R5.2, R5.3, R8.4, R10.5, G1, G2; A1, A2, A3, A4). «Alles ok» an einer Ortskarte schreibt dieselben
// Ereignisse wie die Kurzprüfung des Rundgangs für diesen einen Ort (kurzpruefungVorgang() mit der Ebene aus
// ortKurzpruefung()), Licht und Lüfter einmal je Ebene und Zürcher Kalendertag; «Wurzeln ok» bzw. «Auffällig» genau ein
// Ereignis kurzpruefung mit Punkt wurzeln. Injizierte Uhr Di 12.1.2027 09:00 Zürich (bzw. die Uhr des Falls), Zeitzone
// Europe/Zurich, keine Systemzeit. Datenstände: regal() aus tests/unit/rundgang-fixture.ts (Ebene 1: R-1.1 DWC P1;
// Ebene 3: R-3.1, R-3.2 Kratky belüftet, R-3.3 Kratky; Ebene 4: R-4.4, R-4.5 mit «Wurzeln prüfen» fällig 12.1.);
// verschiebTeile() aus tests/fixtures/umsetzen.ts für die Verschiebe-Sperre (R8.4). Keine Personendaten.
//
// Vertrag (Plan 225 Entscheid 1, vom Testentwickler präzisiert, wo der Plan offen ist):
//   src/domain/rundgang/kurzpruefung.ts
//     ortKurzpruefung(teile, faellig, platzId, jetzt, zeitzone, punkte?): RundgangEbene | undefined
//     lichtLuefterHeute(teile, bereichId, jetzt, zeitzone): boolean
//     pruefVorgang(teile, faellig, aufgabe, 'ok' | 'auffaellig', ids, jetzt, zeitzone): Vorgang
//     pruefFragen(ebene): string, Fragen der Punkte mit « · » getrennt, Licht und Lüfter zuletzt, z. B.
//       «Pumpe sprudelt? · Licht an? · Lüfter läuft?» (A3; Texte aus PUNKT_TEXT bzw. «Licht an?», «Lüfter läuft?»)
//     befundZeilen(ebene, abweichungen): Zeilen mit dem Text der Abweichung und der Massnahme aus KURZ_ABWEICHUNG;
//       die Tests prüfen nur, dass Text und Massnahme darin vorkommen, nicht die Form.
import { describe, expect, it, vi } from 'vitest';
import { erstelleSchreiben, type Schreibadapter } from '../../src/daten/schreiben.ts';
import {
  einstellungenAus,
  faelligeAufgaben,
  type Aufgabe,
  type AufgabenArt,
} from '../../src/domain/aufgaben.ts';
import {
  rueckgaengigVorgang,
  vorgangPruefen,
  type Schritt,
  type Vorgang,
} from '../../src/domain/datenpfad/erfassung.ts';
import { verschiebenPruefen } from '../../src/domain/pflanzung/verschieben.ts';
import {
  befundZeilen,
  kurzpruefungVorgang,
  lichtLuefterHeute,
  ortKurzpruefung,
  pruefFragen,
  pruefVorgang,
} from '../../src/domain/rundgang/kurzpruefung.ts';
import { rundgangPlan, type RundgangEbene } from '../../src/domain/rundgang/plan.ts';
import { netztopfId as topfId, platzId as platzIdUmsetzen } from '../fixtures/regal.ts';
import { umsetzVorgangAnwenden } from '../fixtures/sichten.ts';
import { UMSETZ_JETZT, verschiebTeile } from '../fixtures/umsetzen.ts';
import { fertig, kurzpruefungDazu, satzDazu } from './aufgaben-fixture.ts';
import {
  ANLAGE,
  HEUTE,
  JETZT,
  ZONE,
  aufgabe as handAufgabe,
  bereichEreignisDazu,
  bereichId,
  jetztAm,
  platzId,
  regal,
  schluessel,
  uid,
  vorgangDazu,
  zh,
  type Teile,
} from './rundgang-fixture.ts';

// ohne echten Supabase-Client: schreiben() läuft mit einer Adapter-Attrappe (wie datenpfad-runde1.test.ts)
vi.mock('../../src/daten/supabase.ts', () => ({
  supabase: {},
  SUPABASE_URL: 'http://127.0.0.1:54321',
}));

type Neu = Extract<Schritt, { art: 'neu' }>;
type Felder = Record<string, unknown> & { daten?: { punkt?: string; ok?: boolean } };

const faellig = (t: Teile, jetzt = JETZT) => faelligeAufgaben(t, einstellungenAus(t), jetzt, ZONE);

function finde(l: readonly Aufgabe[], typ: AufgabenArt, code: string): Aufgabe {
  const a = l.find((x) => x.typ === typ && x.ort?.code === code);
  if (!a) throw new Error(`Vorbedingung: ${typ} ${code} fällig`);
  return a;
}
const hat = (l: readonly Aufgabe[], typ: AufgabenArt, code: string) =>
  l.some((x) => x.typ === typ && x.ort?.code === code);

function idGeber(praefix: string): () => string {
  let n = 0;
  return () => uid('f6', `${praefix}#${(n += 1)}`);
}

const neue = (v: Vorgang): Felder[] =>
  v.filter((s): s is Neu => s.art === 'neu').map((s) => s.felder as Felder);
const amPlatz = (v: Vorgang) => neue(v).filter((f) => (f['platz_id'] ?? null) !== null);
const amBereich = (v: Vorgang) => neue(v).filter((f) => (f['platz_id'] ?? null) === null);
const punkte = (l: readonly Felder[]) => l.map((f) => f.daten?.punkt).sort();

/** fachlicher Inhalt einer Zeile ohne id, client_id und gilt_ab */
const FACH = ['typ', 'platz_id', 'bereich_id', 'daten', 'aufgabe_schluessel', 'war_faellig_am'] as const;
const fachlich = (f: Record<string, unknown>) =>
  Object.fromEntries(FACH.filter((k) => f[k] !== undefined).map((k) => [k, f[k]]));
const ordnen = (l: readonly Record<string, unknown>[]) =>
  [...l].sort((a, b) =>
    `${String(a['platz_id'] ?? '')}|${JSON.stringify(a['daten'])}`.localeCompare(
      `${String(b['platz_id'] ?? '')}|${JSON.stringify(b['daten'])}`,
    ),
  );

function ebeneVon(t: Teile, name: string, jetzt = JETZT): RundgangEbene {
  const e = rundgangPlan(t, faellig(t, jetzt), ANLAGE.R, jetzt, ZONE).ebenen.find((x) => x.name === name);
  if (!e) throw new Error(`${name} fehlt im Plan`);
  return e;
}

/** «Alles ok» an der Ortskarte: Vorgang der fälligen Kurzprüfung des Orts */
function allesOk(t: Teile, code: string, jetzt = JETZT, praefix = code): Vorgang {
  const l = faellig(t, jetzt);
  return pruefVorgang(t, l, finde(l, 'kurzpruefung', code), 'ok', idGeber(praefix), jetzt, ZONE);
}

describe('UX3-AK1 «Alles ok» an der Ortskarte wie die Kurzprüfung im Rundgang', () => {
  it('UX3-AK1 «Alles ok» an R-1.1 schreibt über schreiben() dieselben Zeilen wie kurzpruefungVorgang() des Rundgangs für diesen Ort ohne Befund (Typ, platz_id, bereich_id, daten, aufgabe_schluessel, war_faellig_am; ohne id und gilt_ab)', async () => {
    const t = regal();
    const v = allesOk(t, 'R-1.1');
    expect(v.length, 'Licht, Lüfter und Pumpe').toBe(3);
    expect(v.every((s) => s.art === 'neu' && s.tabelle === 'ereignis')).toBe(true);
    expect(vorgangPruefen(v)).toEqual([]);
    for (const f of neue(v)) {
      expect(f['client_id']).toBe(f['id']);
      expect(Date.parse(String(f['gilt_ab']))).toBe(JETZT.getTime());
    }

    // Rundgang: Ebene 1 mit dem Ort R-1.1, Sammel-Tipp ohne Abweichung
    const e1 = ebeneVon(t, 'Ebene 1');
    const rundgang = kurzpruefungVorgang(
      { ...e1, kurzpruefung: e1.kurzpruefung.filter((z) => z.code === 'R-1.1') },
      new Set(),
      idGeber('rundgang'),
      JETZT,
    );
    expect(ordnen(neue(v).map(fachlich))).toEqual(ordnen(neue(rundgang).map(fachlich)));
    expect(amPlatz(v)[0]).toMatchObject({
      typ: 'kurzpruefung',
      platz_id: platzId('R-1.1'),
      bereich_id: bereichId(1),
      daten: { punkt: 'pumpe', ok: true },
      war_faellig_am: HEUTE,
      aufgabe_schluessel: schluessel('kurzpruefung', platzId('R-1.1'), HEUTE),
    });

    // über schreiben() mit der Adapter-Attrappe: genau diese Zeilen gehen hinaus
    const einfuegen = vi.fn(async (_tabelle: string, zeile: Record<string, unknown>) => ({
      data: [{ ...zeile }],
      error: null,
    }));
    const adapter = {
      einfuegen,
      lesen: vi.fn(async () => ({ data: [], error: null })),
      stornieren: vi.fn(async (_t: string, clientId: string) => ({
        data: [{ client_id: clientId }],
        error: null,
      })),
    } as unknown as Schreibadapter;
    const schreiben = erstelleSchreiben(adapter, { appVersion: '0.1.0+e2e', nachErfolg: () => {} });
    const r = await schreiben(v, { jetzt: JETZT, zeitzone: ZONE });
    expect(r.status).toBe('gespeichert');
    const gesendet = einfuegen.mock.calls.map(([tabelle, zeile]) => ({ tabelle, zeile }));
    expect(gesendet.every((g) => g.tabelle === 'ereignis')).toBe(true);
    expect(ordnen(gesendet.map((g) => fachlich(g.zeile)))).toEqual(ordnen(neue(rundgang).map(fachlich)));
  });

  it('UX3-AK1 ortKurzpruefung() nimmt die Ebene des Orts aus rundgangPlan() und behält nur diesen Ort (optional nur die genannten Punkte)', () => {
    const t = regal();
    const l = faellig(t);
    const e = ortKurzpruefung(t, l, platzId('R-4.5'), JETZT, ZONE);
    expect(e).toBeDefined();
    expect(e?.bereichId).toBe(bereichId(4));
    expect(e?.mitLichtLuefter).toBe(true);
    expect(e?.orte.map((o) => o.code)).toEqual(['R-4.5']);
    expect(e?.kurzpruefung.map((z) => `${z.code}|${z.punkt}`).sort()).toEqual([
      'R-4.5|pumpe',
      'R-4.5|wurzeln',
    ]);
    // jede Zeile trägt die Aufgabe, die sie erledigt, wie im Rundgang
    const zu = (punkt: string) => e?.kurzpruefung.find((z) => z.punkt === punkt)?.aufgabe.schluessel;
    expect(zu('pumpe')).toBe(finde(l, 'kurzpruefung', 'R-4.5').schluessel);
    expect(zu('wurzeln')).toBe(finde(l, 'wurzeln_pruefen', 'R-4.5').schluessel);

    // nur der Hauptpunkt
    const haupt = ortKurzpruefung(t, l, platzId('R-4.5'), JETZT, ZONE, ['pumpe']);
    expect(haupt?.kurzpruefung.map((z) => z.punkt)).toEqual(['pumpe']);
    // R-4.4 auf derselben Ebene steht nicht darin
    expect(JSON.stringify(haupt)).not.toContain(platzId('R-4.4'));
    // ohne fällige Kurzprüfung am Ort (2.2 ohne Lösung) keine Ebene oder eine leere
    const leer = ortKurzpruefung(t, l, platzId('R-2.2'), JETZT, ZONE);
    expect(leer === undefined || leer.kurzpruefung.length === 0).toBe(true);
  });

  it('UX3-AK1 die erste Ortskarte einer Ebene schreibt Licht und Lüfter am Bereich, die zweite derselben Ebene am selben Tag nicht mehr', () => {
    const t = regal();
    expect(lichtLuefterHeute(t, bereichId(3), JETZT, ZONE)).toBe(false);
    const erste = allesOk(t, 'R-3.1');
    expect(punkte(amBereich(erste))).toEqual(['licht', 'luefter']);
    for (const f of amBereich(erste)) {
      expect(f['bereich_id']).toBe(bereichId(3));
      expect(f.daten?.ok).toBe(true);
      expect(f['aufgabe_schluessel']).toBeUndefined();
    }
    expect(punkte(amPlatz(erste))).toEqual(['luftzone']);
    vorgangDazu(t, erste);
    expect(lichtLuefterHeute(t, bereichId(3), jetztAm(HEUTE, '09:05'), ZONE)).toBe(true);

    const zweite = allesOk(t, 'R-3.2', jetztAm(HEUTE, '09:05'));
    expect(amBereich(zweite)).toEqual([]);
    expect(punkte(amPlatz(zweite))).toEqual(['luftzone']);
    expect(amPlatz(zweite)[0]?.['platz_id']).toBe(platzId('R-3.2'));

    // eine andere Ebene am selben Tag bekommt ihr eigenes Licht und ihren Lüfter
    const andere = allesOk(t, 'R-4.4', jetztAm(HEUTE, '09:06'));
    expect(punkte(amBereich(andere))).toEqual(['licht', 'luefter']);
    expect(amBereich(andere).every((f) => f['bereich_id'] === bereichId(4))).toBe(true);

    // am Folgetag wieder mit Licht und Lüfter
    const morgen = jetztAm('2027-01-13', '09:00');
    expect(lichtLuefterHeute(t, bereichId(3), morgen, ZONE)).toBe(false);
    expect(punkte(amBereich(allesOk(t, 'R-3.2', morgen)))).toEqual(['licht', 'luefter']);
  });

  it('UX3-AK1 TZ lichtLuefterHeute() zählt nach dem Kalendertag in Zürich, ohne stornierte Zeilen und ohne Zeilen am Platz', () => {
    // 11.1. 23:30 Zürich (22:30Z): Vortag
    const vortag = regal();
    bereichEreignisDazu(vortag, 1, 'licht', '2027-01-11T22:30:00.000Z');
    expect(lichtLuefterHeute(vortag, bereichId(1), JETZT, ZONE)).toBe(false);
    // 12.1. 00:30 Zürich (11.1. 23:30Z): heute
    const frueh = regal();
    bereichEreignisDazu(frueh, 1, 'licht', '2027-01-11T23:30:00.000Z');
    expect(lichtLuefterHeute(frueh, bereichId(1), JETZT, ZONE)).toBe(true);
    // eine andere Ebene zählt nicht
    expect(lichtLuefterHeute(frueh, bereichId(3), JETZT, ZONE)).toBe(false);
    // storniert zählt nicht
    const storniert = regal();
    const id = bereichEreignisDazu(storniert, 1, 'licht', zh(HEUTE, '08:00'));
    for (const z of storniert['ereignis_platz'] ?? [])
      if (z['id'] === id) z['storniert_am'] = zh(HEUTE, '08:01');
    expect(lichtLuefterHeute(storniert, bereichId(1), JETZT, ZONE)).toBe(false);
    // Punkt licht am Platz (nicht am Bereich) zählt nicht
    const platz = regal();
    kurzpruefungDazu(platz, 'R-1.1', zh(HEUTE, '08:00'), 'licht');
    fertig(platz);
    expect(lichtLuefterHeute(platz, bereichId(1), JETZT, ZONE)).toBe(false);
  });

  it('UX3-AK1 nach «Alles ok» ist «Kurzprüfung» R-1.1 für den Kalendertag in Zürich nicht mehr fällig, am Folgetag wieder', () => {
    const t = regal();
    expect(hat(faellig(t), 'kurzpruefung', 'R-1.1')).toBe(true);
    vorgangDazu(t, allesOk(t, 'R-1.1'));
    const danach = faellig(t, jetztAm(HEUTE, '09:05'));
    expect(hat(danach, 'kurzpruefung', 'R-1.1')).toBe(false);
    expect(hat(faellig(t, jetztAm(HEUTE, '23:59')), 'kurzpruefung', 'R-1.1')).toBe(false);
    // die übrigen Orte und die Messung bleiben offen
    expect(hat(danach, 'kurzpruefung', 'R-2.1')).toBe(true);
    expect(hat(danach, 'messen_nachfuellen', 'R-1.1')).toBe(true);
    const morgen = faellig(t, jetztAm('2027-01-13', '09:00'));
    expect(finde(morgen, 'kurzpruefung', 'R-1.1').faelligAm).toBe('2027-01-13');
  });

  it('UX3-AK1 TZ «Alles ok» um 23:59 Zürich (22:59Z) erledigt den Zürcher Tag; um 00:01 ist die Kurzprüfung wieder fällig', () => {
    const t = regal();
    const spaet = new Date('2027-01-12T22:59:00.000Z'); // Di 12.1. 23:59 Zürich
    const v = allesOk(t, 'R-1.1', spaet);
    expect(amPlatz(v)[0]).toMatchObject({
      war_faellig_am: HEUTE,
      aufgabe_schluessel: schluessel('kurzpruefung', platzId('R-1.1'), HEUTE),
    });
    expect(Date.parse(String(amPlatz(v)[0]?.['gilt_ab']))).toBe(spaet.getTime());
    expect(punkte(amBereich(v))).toEqual(['licht', 'luefter']);
    vorgangDazu(t, v);
    expect(hat(faellig(t, new Date('2027-01-12T22:59:30.000Z')), 'kurzpruefung', 'R-1.1')).toBe(false);
    expect(lichtLuefterHeute(t, bereichId(1), new Date('2027-01-12T22:59:30.000Z'), ZONE)).toBe(true);
    const nachMitternacht = new Date('2027-01-12T23:01:00.000Z'); // Mi 13.1. 00:01 Zürich
    expect(finde(faellig(t, nachMitternacht), 'kurzpruefung', 'R-1.1').faelligAm).toBe('2027-01-13');
    expect(lichtLuefterHeute(t, bereichId(1), nachMitternacht, ZONE)).toBe(false);
  });

  it('UX3-AK1 «Alles ok» bestätigt nur den Hauptpunkt (Pumpe bzw. Luftzone bzw. Lösung berührt Topfboden), nicht die fälligen Wurzeln', () => {
    const t = regal();
    const l = faellig(t);
    expect(hat(l, 'wurzeln_pruefen', 'R-4.5'), 'Vorbedingung: Wurzeln 4.5 fällig').toBe(true);
    const v = allesOk(t, 'R-4.5');
    expect(punkte(amPlatz(v))).toEqual(['pumpe']);
    expect(amPlatz(v)[0]?.['aufgabe_schluessel']).toBe(finde(l, 'kurzpruefung', 'R-4.5').schluessel);
    expect(neue(v).some((f) => f.daten?.punkt === 'wurzeln')).toBe(false);
    vorgangDazu(t, v);
    const danach = faellig(t, jetztAm(HEUTE, '09:05'));
    expect(hat(danach, 'kurzpruefung', 'R-4.5')).toBe(false);
    expect(hat(danach, 'wurzeln_pruefen', 'R-4.5')).toBe(true);
    // Würfel feucht in R-A1 derselben Ebene bleibt eigene Zeile
    expect(hat(danach, 'wuerfel_feucht', 'R-A1')).toBe(true);
  });

  it('UX3-AK1 Kratky-Direktsaat unter 14 Tagen: Punkt loesung_topfboden wie im Rundgang', () => {
    const t = regal();
    // Direktsaat in 3.3 (Kratky ohne Pumpe) am 5.1.: Satzalter 7 Tage
    satzDazu(t, { nr: 9, sorte: 'lollo', direktsaat: 'R-3.3', saat: '2027-01-05' });
    fertig(t);
    const v = allesOk(t, 'R-3.3');
    expect(punkte(amPlatz(v))).toEqual(['loesung_topfboden']);
    // gleich wie der Punkt im Rundgang-Plan
    const rundgangPunkt = ebeneVon(t, 'Ebene 3').kurzpruefung.find((z) => z.code === 'R-3.3')?.punkt;
    expect(rundgangPunkt).toBe('loesung_topfboden');
    // 3.2 ohne Direktsaat: Luftzone; 1.1 DWC: Pumpe
    expect(punkte(amPlatz(allesOk(t, 'R-3.2')))).toEqual(['luftzone']);
    expect(punkte(amPlatz(allesOk(t, 'R-1.1')))).toEqual(['pumpe']);
    // ab 14 Tagen Luftzone (19.1.: Tag 14)
    const spaeter = jetztAm('2027-01-19', '09:00');
    expect(punkte(amPlatz(allesOk(t, 'R-3.3', spaeter)))).toEqual(['luftzone']);
  });

  it('UX3-AK1 mit fälliger «Belüftung prüfen» an R-1.1: «Alles ok» schreibt pumpe ok und erledigt die Belüftung', () => {
    const t = regal();
    // gestern «Pumpe sprudelt nicht» in 1.1 (P1, allein an der Pumpe)
    kurzpruefungDazu(t, 'R-1.1', zh('2027-01-11'), 'pumpe', false);
    fertig(t);
    const l = faellig(t);
    const belueftung = finde(l, 'belueftung_pruefen', 'R-1.1');
    const kurz = finde(l, 'kurzpruefung', 'R-1.1');
    const v = pruefVorgang(t, l, kurz, 'ok', idGeber('belueftung'), JETZT, ZONE);
    expect(amPlatz(v)).toHaveLength(1);
    expect(amPlatz(v)[0]).toMatchObject({
      platz_id: platzId('R-1.1'),
      daten: { punkt: 'pumpe', ok: true },
      aufgabe_schluessel: kurz.schluessel,
    });
    vorgangDazu(t, v);
    const danach = faellig(t, jetztAm(HEUTE, '09:05'));
    expect(hat(danach, 'belueftung_pruefen', 'R-1.1')).toBe(false);
    expect(hat(danach, 'kurzpruefung', 'R-1.1')).toBe(false);
    // «Belüftung prüfen» selbst schreibt nicht (Taste «Prüfen» führt in die Kurzprüfung des Orts, A8)
    expect(pruefVorgang(t, l, belueftung, 'ok', idGeber('b2'), JETZT, ZONE)).toEqual([]);
  });

  it('UX3-AK1 Rückgängig storniert alle Zeilen des Vorgangs, danach ist die Kurzprüfung wieder fällig', () => {
    const t = regal();
    const v = allesOk(t, 'R-1.1');
    vorgangDazu(t, v);
    expect(hat(faellig(t, jetztAm(HEUTE, '09:05')), 'kurzpruefung', 'R-1.1')).toBe(false);
    const storno = rueckgaengigVorgang(v);
    expect(storno).toHaveLength(neue(v).length);
    expect(storno.every((s) => s.art === 'storno' && s.grund === 'rueckgaengig')).toBe(true);
    expect(storno.map((s) => (s as { clientId: string }).clientId).sort()).toEqual(
      neue(v)
        .map((f) => f['client_id'])
        .sort(),
    );
    vorgangDazu(t, storno);
    expect(hat(faellig(t, jetztAm(HEUTE, '09:06')), 'kurzpruefung', 'R-1.1')).toBe(true);
    // Licht und Lüfter gelten wieder als offen
    expect(lichtLuefterHeute(t, bereichId(1), jetztAm(HEUTE, '09:06'), ZONE)).toBe(false);
    expect(punkte(amBereich(allesOk(t, 'R-1.1', jetztAm(HEUTE, '09:07'), 'zwei')))).toEqual([
      'licht',
      'luefter',
    ]);
  });

  it('UX3-AK1 pruefFragen() nennt die Fragen der Punkte, Licht und Lüfter nur, solange sie heute offen sind (A3)', () => {
    const t = regal();
    const l = faellig(t);
    const e11 = ortKurzpruefung(t, l, platzId('R-1.1'), JETZT, ZONE, ['pumpe']);
    expect(e11 && pruefFragen(e11)).toBe('Pumpe sprudelt? · Licht an? · Lüfter läuft?');
    const e31 = ortKurzpruefung(t, l, platzId('R-3.1'), JETZT, ZONE, ['luftzone']);
    expect(e31 && pruefFragen(e31)).toBe('Luftzone vorhanden? · Licht an? · Lüfter läuft?');
    // Licht der Ebene 1 heute schon erfasst
    bereichEreignisDazu(t, 1, 'licht', zh(HEUTE, '08:00'));
    bereichEreignisDazu(t, 1, 'luefter', zh(HEUTE, '08:00'));
    const nachher = ortKurzpruefung(t, faellig(t), platzId('R-1.1'), JETZT, ZONE, ['pumpe']);
    expect(nachher?.mitLichtLuefter).toBe(false);
    expect(nachher && pruefFragen(nachher)).toBe('Pumpe sprudelt?');
  });

  it('UX3-AK1 befundZeilen() zeigt je Abweichung Text und Massnahme wie die Abschlussliste des Rundgangs', () => {
    const t = regal();
    const e = ortKurzpruefung(t, faellig(t), platzId('R-4.5'), JETZT, ZONE);
    if (!e) throw new Error('Ebene R-4.5 fehlt');
    expect(befundZeilen(e, new Set())).toEqual([]);
    const pumpe = JSON.stringify(befundZeilen(e, new Set([`${platzId('R-4.5')}|pumpe`])));
    expect(pumpe).toContain('Pumpe sprudelt nicht');
    expect(pumpe).toContain('Pumpe, Schlauch und Luftstein prüfen');
    const wurzeln = JSON.stringify(befundZeilen(e, new Set([`${platzId('R-4.5')}|wurzeln`])));
    expect(wurzeln).toContain('Wurzeln nicht weiss');
    expect(wurzeln).toContain('Wurzeln und Geruch prüfen');
    const licht = JSON.stringify(befundZeilen(e, new Set([`${bereichId(4)}|licht`])));
    expect(licht).toContain('Licht aus');
  });
});

describe('UX3-AK2 «Wurzeln ok» und «Auffällig» in Heute und im Gefäss', () => {
  it('UX3-AK2 «Wurzeln ok» schreibt genau ein kurzpruefung mit punkt wurzeln, ok true, Schlüssel und Fälligkeit von wurzeln_pruefen, ohne Licht und Lüfter', () => {
    const t = regal();
    const l = faellig(t);
    const a = finde(l, 'wurzeln_pruefen', 'R-4.5');
    const v = pruefVorgang(t, l, a, 'ok', idGeber('wurzeln'), JETZT, ZONE);
    expect(v).toHaveLength(1);
    expect(vorgangPruefen(v)).toEqual([]);
    const [s] = v;
    expect(s).toMatchObject({ art: 'neu', tabelle: 'ereignis' });
    const f = neue(v)[0] as Felder;
    expect(f).toMatchObject({
      typ: 'kurzpruefung',
      platz_id: platzId('R-4.5'),
      daten: { punkt: 'wurzeln', ok: true },
      aufgabe_schluessel: a.schluessel,
      war_faellig_am: a.faelligAm,
    });
    expect(f['client_id']).toBe(f['id']);
    expect(Date.parse(String(f['gilt_ab']))).toBe(JETZT.getTime());
    expect(amBereich(v)).toEqual([]);
    // auch wenn Licht und Lüfter der Ebene heute noch offen sind
    expect(lichtLuefterHeute(t, bereichId(4), JETZT, ZONE)).toBe(false);
  });

  it('UX3-AK2 nach «Wurzeln ok» ist «Wurzeln prüfen» an Tag +6 nicht fällig, an Tag +7 wieder fällig', () => {
    const t = regal();
    const l = faellig(t);
    vorgangDazu(
      t,
      pruefVorgang(t, l, finde(l, 'wurzeln_pruefen', 'R-4.5'), 'ok', idGeber('w7'), JETZT, ZONE),
    );
    expect(hat(faellig(t, jetztAm(HEUTE, '09:05')), 'wurzeln_pruefen', 'R-4.5')).toBe(false);
    expect(hat(faellig(t, jetztAm('2027-01-18', '09:00')), 'wurzeln_pruefen', 'R-4.5')).toBe(false);
    const tag7 = faellig(t, jetztAm('2027-01-19', '09:00'));
    expect(finde(tag7, 'wurzeln_pruefen', 'R-4.5').faelligAm).toBe('2027-01-19');
    // die Kurzprüfung des Orts bleibt offen (eigene Zeile)
    expect(hat(faellig(t, jetztAm(HEUTE, '09:05')), 'kurzpruefung', 'R-4.5')).toBe(true);
  });

  it('UX3-AK2 «Auffällig» schreibt ok false; nächste Fälligkeit ebenfalls +7; die Verschiebe-Sperre (R8.4) sieht die Abweichung', () => {
    const t = regal();
    const l = faellig(t);
    const a = finde(l, 'wurzeln_pruefen', 'R-4.5');
    const v = pruefVorgang(t, l, a, 'auffaellig', idGeber('auff'), JETZT, ZONE);
    expect(v).toHaveLength(1);
    expect(neue(v)[0]).toMatchObject({
      typ: 'kurzpruefung',
      platz_id: platzId('R-4.5'),
      daten: { punkt: 'wurzeln', ok: false },
      aufgabe_schluessel: a.schluessel,
      war_faellig_am: a.faelligAm,
    });
    vorgangDazu(t, v);
    expect(hat(faellig(t, jetztAm('2027-01-18', '09:00')), 'wurzeln_pruefen', 'R-4.5')).toBe(false);
    expect(hat(faellig(t, jetztAm('2027-01-19', '09:00')), 'wurzeln_pruefen', 'R-4.5')).toBe(true);

    // Massnahme aus der Abschlussliste des Rundgangs
    const e = ortKurzpruefung(regal(), l, platzId('R-4.5'), JETZT, ZONE);
    if (!e) throw new Error('Ebene R-4.5 fehlt');
    expect(JSON.stringify(befundZeilen(e, new Set([`${platzId('R-4.5')}|wurzeln`])))).toContain(
      'Wurzeln und Geruch prüfen',
    );

    // R8.4: Topf 2.3.1 darf nach «Auffällig» in 2.3 nicht in ein anderes Gefäss, nach «Wurzeln ok» schon
    const ziel = {
      netztopfId: topfId('2.3.1'),
      zielPlatzId: platzIdUmsetzen('2.1'),
      zielLochNr: 5,
    };
    const gruende = (x: Teile) => verschiebenPruefen(x, ziel, UMSETZ_JETZT, ZONE).map((g) => g.feld);
    const start = verschiebTeile();
    const fv = faelligeAufgaben(start, einstellungenAus(start), UMSETZ_JETZT, ZONE);
    const w23 = finde(fv, 'wurzeln_pruefen', 'R-2.3');
    expect(gruende(start), 'Vorbedingung').not.toContain('gesperrt');
    const auffaellig = umsetzVorgangAnwenden(
      start,
      pruefVorgang(start, fv, w23, 'auffaellig', idGeber('r84a'), UMSETZ_JETZT, ZONE),
      UMSETZ_JETZT,
    );
    expect(gruende(auffaellig)).toContain('gesperrt');
    const ok = umsetzVorgangAnwenden(
      start,
      pruefVorgang(start, fv, w23, 'ok', idGeber('r84o'), UMSETZ_JETZT, ZONE),
      UMSETZ_JETZT,
    );
    expect(gruende(ok)).not.toContain('gesperrt');
  });

  it('UX3-AK2 TZ «Wurzeln ok» um 23:30 Zürich zählt für den Zürcher Tag (Basis +7 ab diesem Tag)', () => {
    // Di 12.1. 23:30 Zürich (22:30Z): nächste Fälligkeit Di 19.1.
    const t = regal();
    const spaet = new Date('2027-01-12T22:30:00.000Z');
    const l = faellig(t, spaet);
    const v = pruefVorgang(t, l, finde(l, 'wurzeln_pruefen', 'R-4.5'), 'ok', idGeber('tz1'), spaet, ZONE);
    expect(Date.parse(String(neue(v)[0]?.['gilt_ab']))).toBe(spaet.getTime());
    vorgangDazu(t, v);
    expect(hat(faellig(t, new Date('2027-01-18T22:59:00.000Z')), 'wurzeln_pruefen', 'R-4.5')).toBe(false);
    expect(hat(faellig(t, new Date('2027-01-18T23:01:00.000Z')), 'wurzeln_pruefen', 'R-4.5')).toBe(true);

    // Mi 13.1. 00:30 Zürich (12.1. 23:30Z, in UTC noch der 12.1.): nächste Fälligkeit Mi 20.1.
    const u = regal();
    const nachMitternacht = new Date('2027-01-12T23:30:00.000Z');
    const m = faellig(u, nachMitternacht);
    const a = finde(m, 'wurzeln_pruefen', 'R-4.5');
    const w = pruefVorgang(u, m, a, 'ok', idGeber('tz2'), nachMitternacht, ZONE);
    // der Schlüssel bleibt der der fälligen Aufgabe (fällig 12.1., einen Tag überfällig)
    expect(neue(w)[0]).toMatchObject({ aufgabe_schluessel: a.schluessel, war_faellig_am: a.faelligAm });
    vorgangDazu(u, w);
    expect(hat(faellig(u, new Date('2027-01-19T22:59:00.000Z')), 'wurzeln_pruefen', 'R-4.5')).toBe(false);
    expect(hat(faellig(u, new Date('2027-01-19T23:01:00.000Z')), 'wurzeln_pruefen', 'R-4.5')).toBe(true);
  });

  it('UX3-AK2 pruefVorgang() ist für andere Typen leer', () => {
    const t = regal();
    const l = faellig(t);
    const ids = idGeber('leer');
    const andere: Aufgabe[] = [
      finde(l, 'messen_nachfuellen', 'R-1.1'),
      finde(l, 'messen', 'R-3.1'),
      finde(l, 'wuerfel_feucht', 'R-A1'),
      handAufgabe('nachfuellen_kratky', 'R-3.1'),
      handAufgabe('belueftung_pruefen', 'R-1.1'),
      handAufgabe('reinigen', 'R-2.2'),
    ];
    for (const a of andere) {
      expect(pruefVorgang(t, l, a, 'ok', ids, JETZT, ZONE), `${a.typ} ok`).toEqual([]);
      expect(pruefVorgang(t, l, a, 'auffaellig', ids, JETZT, ZONE), `${a.typ} auffällig`).toEqual([]);
    }
    // Kurzprüfung kennt kein «Auffällig» (die Oberfläche führt in die Kurzprüfung des Orts)
    expect(pruefVorgang(t, l, finde(l, 'kurzpruefung', 'R-1.1'), 'auffaellig', ids, JETZT, ZONE)).toEqual([]);
    // eine Aufgabe, die nicht (mehr) in der Liste steht, schreibt nichts
    const erledigt = regal();
    vorgangDazu(erledigt, allesOk(erledigt, 'R-1.1'));
    const nachher = faellig(erledigt, jetztAm(HEUTE, '09:05'));
    expect(
      pruefVorgang(
        erledigt,
        nachher,
        finde(l, 'kurzpruefung', 'R-1.1'),
        'ok',
        ids,
        jetztAm(HEUTE, '09:05'),
        ZONE,
      ),
    ).toEqual([]);
  });
});
