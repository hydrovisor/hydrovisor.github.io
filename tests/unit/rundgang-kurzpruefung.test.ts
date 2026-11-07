// Kurzprüfung im Rundgang (Plan 30 Testliste; Rundgang-AK5; R5.2, R10.5, E6; A4): Sammel-Tipp je Ebene als
// Ereignisse kurzpruefung am Bereich (licht, luefter) und am Platz; «Pumpe sprudelt nicht» und «keine Luftzone»
// markieren die Gefässe derselben Luftpumpe mit. Die Vorgänge gehen als Ereignisse in die Fixture, danach rechnet
// faelligeAufgaben(). Uhr Di 12.1.2027 09:00 Zürich; Fixture tests/unit/rundgang-fixture.ts.
//
// Abweichung von der Testliste des Plans: 3.1 ist Kratky belüftet und hat in der Kurzprüfung den Punkt «Luftzone»,
// nicht «Pumpe» (Plan 30 Abschnitt Kurzprüfung, Konzept 5.7); «Pumpe sprudelt nicht» wird darum in 4.5
// (Konstantpegel an P3) geprüft. 3.3 hängt laut Fixture des Plans an keiner Luftpumpe und wird nicht mitmarkiert.
import { describe, expect, it } from 'vitest';
import { einstellungenAus, faelligeAufgaben, type Aufgabe } from '../../src/domain/aufgaben.ts';
import { vorgangPruefen } from '../../src/domain/datenpfad/erfassung.ts';
import { kurzpruefungVorgang } from '../../src/domain/rundgang/kurzpruefung.ts';
import { rundgangPlan, type RundgangEbene } from '../../src/domain/rundgang/plan.ts';
import {
  ANLAGE,
  HEUTE,
  JETZT,
  ZONE,
  bereichId,
  jetztAm,
  platzId,
  regal,
  schluessel,
  uid,
  vorgangDazu,
  type Teile,
} from './rundgang-fixture.ts';

const faellig = (t: Teile, jetzt = JETZT) => faelligeAufgaben(t, einstellungenAus(t), jetzt, ZONE);
const ebene = (t: Teile, name: string, jetzt = JETZT): RundgangEbene => {
  const e = rundgangPlan(t, faellig(t, jetzt), ANLAGE.R, jetzt, ZONE).ebenen.find((x) => x.name === name);
  if (!e) throw new Error(`${name} fehlt im Plan`);
  return e;
};
function idGeber(praefix: string): () => string {
  let n = 0;
  return () => uid('f4', `${praefix}#${(n += 1)}`);
}
const belueftung = (l: readonly Aufgabe[]) =>
  l
    .filter((a) => a.typ === 'belueftung_pruefen')
    .map((a) => `${a.ort?.code}${a.hinweis === 'mitmarkiert' ? ' mitmarkiert' : ''}`)
    .sort();

type Felder = Record<string, unknown> & { daten: { punkt: string; ok: boolean; ausnahmen?: unknown } };
const felderVon = (v: readonly unknown[]) => v.map((s) => (s as { felder: Felder }).felder);

describe('Kurzprüfung im Rundgang', () => {
  it('Rundgang-AK5 «Pumpe sprudelt nicht» in 4.5 (P3) erzeugt «Belüftung prüfen» und markiert 3.1 und 3.2 (P3) mit, 3.3 ohne Pumpe und 2.1 nicht', () => {
    const t = regal();
    const v = kurzpruefungVorgang(
      ebene(t, 'Ebene 4'),
      new Set([`${platzId('R-4.5')}|pumpe`]),
      idGeber('pumpe'),
      JETZT,
    );
    const f = felderVon(v);
    expect(f.find((x) => x['platz_id'] === platzId('R-4.5') && x.daten.punkt === 'pumpe')?.daten.ok).toBe(
      false,
    );
    expect(f.find((x) => x['platz_id'] === platzId('R-4.4') && x.daten.punkt === 'pumpe')?.daten.ok).toBe(
      true,
    );
    // am Bereich die Kennung der Ausnahme (A4)
    const licht = f.find((x) => x['bereich_id'] === bereichId(4) && x.daten.punkt === 'licht');
    expect(JSON.stringify(licht?.daten.ausnahmen ?? [])).toContain('4.5');

    vorgangDazu(t, v);
    const l = faellig(t);
    expect(belueftung(l)).toEqual(['R-3.1 mitmarkiert', 'R-3.2 mitmarkiert', 'R-4.5']);
    for (const a of l.filter((x) => x.typ === 'belueftung_pruefen')) {
      expect(a.gewicht).toBe('ausserhalb');
      expect(a.faelligAm).toBe(HEUTE);
    }
  });

  it('Rundgang-AK5 «keine Luftzone» in 3.2 (Kratky belüftet, P3) markiert 3.1 und 4.5 mit', () => {
    const t = regal();
    const v = kurzpruefungVorgang(
      ebene(t, 'Ebene 3'),
      new Set([`${platzId('R-3.2')}|luftzone`]),
      idGeber('luftzone'),
      JETZT,
    );
    expect(
      felderVon(v).find((x) => x['platz_id'] === platzId('R-3.2') && x.daten.punkt === 'luftzone')?.daten.ok,
    ).toBe(false);
    vorgangDazu(t, v);
    expect(belueftung(faellig(t))).toEqual(['R-3.1 mitmarkiert', 'R-3.2', 'R-4.5 mitmarkiert']);
  });

  it('Rundgang-AK5 «keine Luftzone» in 3.3 (Kratky ohne Luftpumpe) markiert nur 3.3', () => {
    const t = regal();
    const v = kurzpruefungVorgang(
      ebene(t, 'Ebene 3'),
      new Set([`${platzId('R-3.3')}|luftzone`]),
      idGeber('ohne'),
      JETZT,
    );
    vorgangDazu(t, v);
    expect(belueftung(faellig(t))).toEqual(['R-3.3']);
  });

  it('Rundgang-AK5 Sammel-Tipp «Alles ok» am Folgetag erledigt «Belüftung prüfen» für alle mitmarkierten Gefässe', () => {
    const t = regal();
    vorgangDazu(
      t,
      kurzpruefungVorgang(
        ebene(t, 'Ebene 3'),
        new Set([`${platzId('R-3.2')}|luftzone`]),
        idGeber('tag1'),
        JETZT,
      ),
    );
    const morgen = jetztAm('2027-01-13', '09:00');
    expect(belueftung(faellig(t, morgen))).toEqual(['R-3.1 mitmarkiert', 'R-3.2', 'R-4.5 mitmarkiert']);

    // die Karte am Folgetag trägt den Vermerk
    const e3 = ebene(t, 'Ebene 3', morgen);
    const vermerk = new Map(e3.kurzpruefung.map((z) => [z.code, z.vermerk]));
    expect(vermerk.get('R-3.2')).toBe('belueftung');
    expect(vermerk.get('R-3.1')).toBe('mitmarkiert');
    expect(vermerk.get('R-3.3')).toBeUndefined();
    const e4 = ebene(t, 'Ebene 4', morgen);
    expect(e4.kurzpruefung.find((z) => z.code === 'R-4.5' && z.punkt === 'pumpe')?.vermerk).toBe(
      'mitmarkiert',
    );

    vorgangDazu(t, kurzpruefungVorgang(e3, new Set(), idGeber('tag2'), morgen));
    expect(belueftung(faellig(t, morgen))).toEqual([]);
  });

  it('R5.2 kurzpruefungVorgang «Alles ok»: licht und luefter am Bereich, je Ort ein Punkt mit ok, client_id = id, war_faellig_am und aufgabe_schluessel', () => {
    const t = regal();
    const ids: string[] = [];
    const geber = idGeber('allesok');
    const v = kurzpruefungVorgang(
      ebene(t, 'Ebene 4'),
      new Set(),
      () => {
        const id = geber();
        ids.push(id);
        return id;
      },
      JETZT,
    );
    expect(v.every((s) => s.art === 'neu' && s.tabelle === 'ereignis')).toBe(true);
    expect(vorgangPruefen(v)).toEqual([]);
    const f = felderVon(v);
    for (const x of f) {
      expect(x['typ']).toBe('kurzpruefung');
      expect(x.daten.ok).toBe(true);
      expect(Date.parse(String(x['gilt_ab']))).toBe(JETZT.getTime());
    }
    // client_id je Zeile aus ids(), alle verschieden
    const clientIds = f.map((x) => x['client_id']);
    expect(new Set(clientIds).size).toBe(f.length);
    expect([...clientIds].sort()).toEqual([...ids].sort());

    // am Bereich: licht und luefter ohne Platz
    const bereich = f.filter((x) => (x['platz_id'] ?? null) === null);
    expect(bereich.map((x) => x.daten.punkt).sort()).toEqual(['licht', 'luefter']);
    for (const x of bereich) {
      expect(x['bereich_id']).toBe(bereichId(4));
      expect(x.daten.ausnahmen ?? []).toEqual([]);
    }
    // am Platz: je Zeile der Karte ein Punkt mit der Aufgabe, die er erledigt
    const amPlatz = f.filter((x) => (x['platz_id'] ?? null) !== null);
    expect(amPlatz.map((x) => `${x['platz_id']}|${x.daten.punkt}`).sort()).toEqual(
      [
        `${platzId('R-A1')}|wuerfel_feucht`,
        `${platzId('R-4.4')}|pumpe`,
        `${platzId('R-4.5')}|pumpe`,
        `${platzId('R-4.5')}|wurzeln`,
      ].sort(),
    );
    const zu = (code: string, punkt: string) =>
      amPlatz.find((x) => x['platz_id'] === platzId(code) && x.daten.punkt === punkt);
    expect(zu('R-4.4', 'pumpe')).toMatchObject({
      war_faellig_am: HEUTE,
      aufgabe_schluessel: schluessel('kurzpruefung', platzId('R-4.4'), HEUTE),
    });
    expect(zu('R-4.5', 'wurzeln')).toMatchObject({
      war_faellig_am: HEUTE,
      aufgabe_schluessel: schluessel('wurzeln_pruefen', platzId('R-4.5'), HEUTE),
    });
    expect(zu('R-A1', 'wuerfel_feucht')).toMatchObject({
      war_faellig_am: HEUTE,
      aufgabe_schluessel: schluessel('wuerfel_feucht', platzId('R-A1'), HEUTE),
    });
  });

  it('R5.2 Kurzprüfung im Rundgang erledigt die Aufgaben kurzpruefung, wurzeln_pruefen und wuerfel_feucht der Ebene', () => {
    const t = regal();
    const vorher = faellig(t).filter((a) => a.anlageId === ANLAGE.R);
    const typen = (l: readonly Aufgabe[], codes: readonly string[]) =>
      l
        .filter((a) => codes.includes(a.ort?.code ?? ''))
        .filter((a) => ['kurzpruefung', 'wurzeln_pruefen', 'wuerfel_feucht'].includes(a.typ))
        .map((a) => `${a.typ} ${a.ort?.code}`)
        .sort();
    const vierer = ['R-A1', 'R-4.4', 'R-4.5'];
    expect(typen(vorher, vierer)).toEqual(
      ['kurzpruefung R-4.4', 'kurzpruefung R-4.5', 'wuerfel_feucht R-A1', 'wurzeln_pruefen R-4.5'].sort(),
    );

    vorgangDazu(t, kurzpruefungVorgang(ebene(t, 'Ebene 4'), new Set(), idGeber('e4'), JETZT));
    const nachher = faellig(t, jetztAm(HEUTE, '09:05'));
    expect(typen(nachher, vierer)).toEqual([]);
    // andere Ebenen bleiben offen, Messungen bleiben fällig
    expect(typen(nachher, ['R-3.1', 'R-3.2', 'R-3.3'])).toEqual([
      'kurzpruefung R-3.1',
      'kurzpruefung R-3.2',
      'kurzpruefung R-3.3',
    ]);
    expect(nachher.some((a) => a.typ === 'messen_nachfuellen' && a.ort?.code === 'R-4.4')).toBe(true);
    // wurzeln_pruefen 4.5 erst wieder in 7 Tagen
    expect(
      nachher.some((a) => a.typ === 'wurzeln_pruefen' && a.ort?.code === 'R-4.5'),
      'Wurzeln 4.5',
    ).toBe(false);
  });
});
