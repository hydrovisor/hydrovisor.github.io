// Ablauf des Rundgangs als Zustandsautomat (Plan 30 Testliste; Rundgang-AK4; R5.2, R10.5, G2; Konzept 6.2, 11.4;
// A5, A6): Kurzprüfung je Ebene, Kennung 1 s, Messung, Nachfüllen bzw. Nachfüllen Kratky, Halt, Abschluss. Pläne
// von Hand (rundgang-fixture.ts planVon()), damit der Ablauf nicht von der Plan-Rechnung abhängt. Werte in
// Hundertsteln (G3). Uhr Di 12.1.2027 09:00 Zürich.
//
// Annahme des Testentwicklers: naechsterSchritt(stand, jetzt) führt aus der Kennung (1 s, ohne Tipp) in den
// Schritt des Orts (Plan 30 «Betroffene Dateien»; die Signatur fehlt im Abschnitt «Schnittstellen»). Ob nach der
// Kurzprüfung zuerst die Kennung des ersten Orts steht, lassen die Tests offen (weiter() überspringt sie).
import { describe, expect, it } from 'vitest';
import { einstellungenAus, faelligeAufgaben } from '../../src/domain/aufgaben.ts';
import type { Bewertung } from '../../src/domain/bewertung/bewertung.ts';
import type { Groesse, Messeingabe } from '../../src/domain/messung/eingabe.ts';
import { messungVorgang } from '../../src/domain/messung/erfassung.ts';
import {
  amEnde,
  nachKurzpruefung,
  nachMessung,
  nachNachfuellen,
  naechsterSchritt,
  rundgangBeenden,
  rundgangStart,
  standGueltig,
  type RundgangStand,
} from '../../src/domain/rundgang/ablauf.ts';
import { nachfuellVorgang } from '../../src/domain/rundgang/nachfuellen.ts';
import type { RundgangPlan } from '../../src/domain/rundgang/plan.ts';
import {
  HEUTE,
  JETZT,
  MESSGERAET,
  ZONE,
  jetztAm,
  kurzpruefungErgebnis,
  ortVon,
  planVon,
  platzId,
  regal,
  schluessel,
  uid,
  vorgangDazu,
  zh,
  type Teile,
} from './rundgang-fixture.ts';
import { fertig, messungDazu } from './aufgaben-fixture.ts';

const GRUEN: Partial<Record<Groesse, Bewertung>> = { ph: 'gruen', ec: 'gruen', temperatur: 'gruen' };
const WERTE: Partial<Record<Groesse, number>> = { ph: 620, ec: 120, temperatur: 2000 };

/** Kennung (1 s, ohne Tipp) überspringen */
function weiter(s: RundgangStand): RundgangStand {
  let x = s;
  for (let i = 0; i < 5 && x.schritt.art === 'kennung'; i += 1) x = naechsterSchritt(x, JETZT);
  return x;
}

function messung(
  s: RundgangStand,
  e: {
    nr: number;
    bewertungen?: Partial<Record<Groesse, Bewertung>>;
    fuellstand?: 'ueber_drittel' | 'unter_drittel';
    nachfuellen?: boolean;
  },
): RundgangStand {
  return nachMessung(
    s,
    {
      messungId: uid('e9', `messung#${e.nr}`),
      werte: WERTE,
      bewertungen: e.bewertungen ?? GRUEN,
      ...(e.fuellstand ? { fuellstand: e.fuellstand } : {}),
      nachfuellen: e.nachfuellen ?? false,
    },
    JETZT,
  );
}

/** Start und Kurzprüfung der ersten Ebene (alles ok) bis zum ersten Schritt nach der Kennung */
function bisErsterOrt(plan: RundgangPlan): RundgangStand {
  const s = rundgangStart(plan, JETZT);
  expect(s.schritt).toEqual({ art: 'kurzpruefung', ebene: 0 });
  return weiter(nachKurzpruefung(s, kurzpruefungErgebnis(plan, 0), JETZT));
}

const faellig = (t: Teile, jetzt = JETZT) => faelligeAufgaben(t, einstellungenAus(t), jetzt, ZONE);

describe('Rundgang-Ablauf', () => {
  it('Rundgang-AK4 Kratky mit Füllstand über einem Drittel: kein Schritt und keine Aufgabe «Nachfüllen Kratky»', () => {
    const plan = planVon([
      { nr: 3, orte: [ortVon('R-3.1')] },
      { nr: 1, orte: [ortVon('R-1.1')] },
    ]);
    const s = bisErsterOrt(plan);
    expect(s.schritt).toEqual({ art: 'messen', ort: 0, ebene: 0 });
    const nach = weiter(messung(s, { nr: 1, fuellstand: 'ueber_drittel' }));
    expect(nach.schritt.art).not.toBe('nachfuellen_kratky');
    expect(nach.schritt).toEqual({ art: 'kurzpruefung', ebene: 1 });
    expect(nach.orte.find((o) => o.platzId === platzId('R-3.1'))).toMatchObject({
      fuellstand: 'ueber_drittel',
      fertig: true,
    });

    // die Aufgaben-Rechnung nach der Messung: kein «Nachfüllen Kratky», Messen erledigt
    const t = regal();
    messungDazu(t, 'R-3.1', { gilt: JETZT.toISOString(), temperatur: 19.0, fuellstand: 'ueber_drittel' });
    const l = faellig(fertig(t), jetztAm(HEUTE, '09:05')).filter((a) => a.ort?.code === 'R-3.1');
    expect(l.map((a) => a.typ)).not.toContain('nachfuellen_kratky');
    expect(l.map((a) => a.typ)).not.toContain('messen');
  });

  it('Rundgang-AK4 Gegenprobe unter einem Drittel: Schritt «Nachfüllen Kratky» folgt auf die Messung, nach «Nachgefüllt» keine Aufgabe mehr', () => {
    const plan = planVon([{ nr: 3, orte: [ortVon('R-3.1')] }]);
    const s = messung(bisErsterOrt(plan), { nr: 2, fuellstand: 'unter_drittel' });
    expect(s.schritt).toEqual({ art: 'nachfuellen_kratky', ort: 0, ebene: 0 });
    const fertigStand = weiter(nachNachfuellen(s, 2, JETZT));
    expect(fertigStand.schritt).toEqual({ art: 'abschluss' });
    expect(fertigStand.orte.find((o) => o.platzId === platzId('R-3.1'))).toMatchObject({
      fuellstand: 'unter_drittel',
      nachgefuelltL: 2,
      fertig: true,
    });

    const t = regal();
    messungDazu(t, 'R-3.1', { gilt: JETZT.toISOString(), temperatur: 19.0, fuellstand: 'unter_drittel' });
    fertig(t);
    const aufgabe = faellig(t, jetztAm(HEUTE, '09:02')).find(
      (a) => a.typ === 'nachfuellen_kratky' && a.ort?.code === 'R-3.1',
    );
    expect(aufgabe?.schluessel).toBe(schluessel('nachfuellen_kratky', platzId('R-3.1'), HEUTE));
    let n = 0;
    const v = nachfuellVorgang(
      { platzId: platzId('R-3.1'), liter: 2, ...(aufgabe ? { aufgabe } : {}), volumenL: 9 },
      () => uid('f5', `kratky#${(n += 1)}`),
      jetztAm(HEUTE, '09:05'),
    );
    vorgangDazu(t, v);
    const nachher = faellig(t, jetztAm(HEUTE, '09:10'));
    expect(nachher.some((a) => a.typ === 'nachfuellen_kratky' && a.ort?.code === 'R-3.1')).toBe(false);
  });

  it('R5.2 Rundgang grün ohne Nachfüllen: nach der Messung Kennung des nächsten Orts, dann sein Schritt', () => {
    const plan = planVon([
      { nr: 3, orte: [ortVon('R-3.1'), ortVon('R-3.2')] },
      { nr: 1, orte: [ortVon('R-1.1')] },
    ]);
    const s = bisErsterOrt(plan);
    expect(s.schritt).toEqual({ art: 'messen', ort: 0, ebene: 0 });
    const kennung = messung(s, { nr: 3, fuellstand: 'ueber_drittel' });
    expect(kennung.schritt).toEqual({ art: 'kennung', ort: 1, ebene: 0 });
    expect(kennung.orte.find((o) => o.platzId === platzId('R-3.1'))).toMatchObject({
      messungId: uid('e9', 'messung#3'),
      werte: WERTE,
      bewertungen: GRUEN,
      fertig: true,
    });
    const zweiter = naechsterSchritt(kennung, JETZT);
    expect(zweiter.schritt).toEqual({ art: 'messen', ort: 1, ebene: 0 });

    // letzter Ort der Ebene → Kurzprüfung der nächsten Ebene
    const naechsteEbene = weiter(messung(zweiter, { nr: 4, fuellstand: 'ueber_drittel' }));
    expect(naechsteEbene.schritt).toEqual({ art: 'kurzpruefung', ebene: 1 });
    // der Stand ist serialisierbar (Ablaufspeicher)
    expect(JSON.parse(JSON.stringify(naechsteEbene))).toEqual(naechsteEbene);
    expect(naechsteEbene.art).toBe('rundgang');
    expect(naechsteEbene.tag).toBe(HEUTE);
  });

  it('R5.2 Rundgang «Nachfüllen» bei messen_nachfuellen: Schritt nachfuellen, danach nächster Ort', () => {
    const plan = planVon([
      { nr: 2, orte: [ortVon('R-2.1')] },
      { nr: 1, orte: [ortVon('R-1.1')] },
    ]);
    const s = bisErsterOrt(plan);
    const nf = messung(s, { nr: 5, nachfuellen: true });
    expect(nf.schritt).toEqual({ art: 'nachfuellen', ort: 0, ebene: 0 });
    const danach = weiter(nachNachfuellen(nf, 20, JETZT));
    expect(danach.schritt).toEqual({ art: 'kurzpruefung', ebene: 1 });
    expect(danach.orte.find((o) => o.platzId === platzId('R-2.1'))).toMatchObject({
      nachgefuelltL: 20,
      fertig: true,
    });

    // «Speichern» (Pegel auf der Marke): kein Nachfüllen-Schritt
    const ohne = weiter(messung(bisErsterOrt(plan), { nr: 6, nachfuellen: false }));
    expect(ohne.schritt).toEqual({ art: 'kurzpruefung', ebene: 1 });
    expect(ohne.orte.find((o) => o.platzId === platzId('R-2.1'))?.nachgefuelltL).toBeUndefined();
  });

  it('R10.5 Rundgang Abweichung: Halt; «Am Ende» führt zum nächsten Ort', () => {
    const plan = planVon([
      { nr: 3, orte: [ortVon('R-3.1'), ortVon('R-3.2')] },
      { nr: 2, orte: [ortVon('R-2.1')] },
    ]);
    for (const b of ['knapp', 'ausserhalb'] as const) {
      const halt = messung(bisErsterOrt(plan), {
        nr: 7,
        fuellstand: 'ueber_drittel',
        bewertungen: { ...GRUEN, ph: b },
      });
      expect(halt.schritt, b).toEqual({ art: 'halt', ort: 0, ebene: 0 });
      const weiterStand = weiter(amEnde(halt, JETZT));
      expect(weiterStand.schritt, b).toEqual({ art: 'messen', ort: 1, ebene: 0 });
      expect(weiterStand.orte.find((o) => o.platzId === platzId('R-3.1'))?.bewertungen?.ph, b).toBe(b);
    }

    // Abweichung und Nachfüllen: der Halt kommt nach dem Nachfüllen (A5)
    const s = weiter(nachKurzpruefung(rundgangStart(plan, JETZT), kurzpruefungErgebnis(plan, 0), JETZT));
    const ebene2 = weiter(
      messung(weiter(messung(s, { nr: 8, fuellstand: 'ueber_drittel' })), {
        nr: 9,
        fuellstand: 'ueber_drittel',
      }),
    );
    expect(ebene2.schritt).toEqual({ art: 'kurzpruefung', ebene: 1 });
    const r21 = weiter(nachKurzpruefung(ebene2, kurzpruefungErgebnis(plan, 1), JETZT));
    const nf = messung(r21, { nr: 10, bewertungen: { ...GRUEN, ec: 'knapp' }, nachfuellen: true });
    expect(nf.schritt).toEqual({ art: 'nachfuellen', ort: 0, ebene: 1 });
    const halt = nachNachfuellen(nf, 10, JETZT);
    expect(halt.schritt).toEqual({ art: 'halt', ort: 0, ebene: 1 });
    expect(weiter(amEnde(halt, JETZT)).schritt).toEqual({ art: 'abschluss' });
  });

  it('R5.2 Rundgang letzter Ort → Abschluss; rundgangBeenden jederzeit → Abschluss', () => {
    const plan = planVon([{ nr: 1, orte: [ortVon('R-1.1')] }]);
    const letzter = weiter(messung(bisErsterOrt(plan), { nr: 11 }));
    expect(letzter.schritt).toEqual({ art: 'abschluss' });
    expect(letzter.orte.find((o) => o.platzId === platzId('R-1.1'))?.fertig).toBe(true);

    const zwei = planVon([
      { nr: 3, orte: [ortVon('R-3.1')] },
      { nr: 1, orte: [ortVon('R-1.1')] },
    ]);
    const start = rundgangStart(zwei, JETZT);
    expect(rundgangBeenden(start, JETZT).schritt).toEqual({ art: 'abschluss' });
    const mitten = bisErsterOrt(zwei);
    const beendet = rundgangBeenden(mitten, jetztAm(HEUTE, '09:20'));
    expect(beendet.schritt).toEqual({ art: 'abschluss' });
    expect(beendet.letzteAktionAm).toBe(jetztAm(HEUTE, '09:20').toISOString());
    // nichts als fertig markiert, was nicht gemessen wurde
    expect(beendet.orte.filter((o) => o.fertig).map((o) => o.platzId)).not.toContain(platzId('R-1.1'));
  });

  it('G2 Rundgang-Stand von gestern ist nicht gültig, von heute 00:30 gültig', () => {
    const gestern = rundgangStart(
      planVon([{ nr: 1, orte: [ortVon('R-1.1')] }], '2027-01-11'),
      jetztAm('2027-01-11', '23:50'),
    );
    expect(gestern.tag).toBe('2027-01-11');
    expect(standGueltig(gestern, jetztAm(HEUTE, '00:30'), ZONE)).toBe(false);
    expect(standGueltig(gestern, jetztAm('2027-01-11', '23:59'), ZONE)).toBe(true);

    const frueh = rundgangStart(
      planVon([{ nr: 1, orte: [ortVon('R-1.1')] }], HEUTE),
      jetztAm(HEUTE, '00:30'),
    );
    expect(standGueltig(frueh, jetztAm(HEUTE, '00:30'), ZONE)).toBe(true);
    expect(standGueltig(frueh, jetztAm(HEUTE, '23:59'), ZONE)).toBe(true);
    expect(standGueltig(frueh, jetztAm('2027-01-13', '00:00'), ZONE)).toBe(false);
  });

  it('R5.2 messungVorgang mit messart rundgang trägt aufgabe_schluessel und war_faellig_am', () => {
    const eingabe: Messeingabe = {
      felder: ['ph', 'ec', 'temperatur'],
      aktiv: 'temperatur',
      text: { ph: '6.2', ec: '1.20', temperatur: '20.0' },
    };
    const key = schluessel('messen_nachfuellen', platzId('R-1.1'), HEUTE);
    const bindung = { schluessel: 'rundgang', clientId: uid('f6', 'messung'), giltAb: JETZT.toISOString() };
    const kontext = {
      platzId: platzId('R-1.1'),
      messgeraetId: MESSGERAET,
      messart: 'rundgang' as const,
      betriebsart: 'dwc' as const,
      uEc: 0.1,
      uPh: 0.1,
      warFaelligAm: HEUTE,
      aufgabeSchluessel: key,
    };
    const s = messungVorgang(eingabe, kontext, bindung);
    expect(s).toMatchObject({
      art: 'neu',
      tabelle: 'messung',
      felder: {
        client_id: uid('f6', 'messung'),
        messart: 'rundgang',
        war_faellig_am: HEUTE,
        aufgabe_schluessel: key,
        ph: 6.2,
        ec: 1.2,
        temperatur: 20,
      },
    });
    // ohne Aufgabe kein Schlüssel
    const ohne = messungVorgang(eingabe, { ...kontext, aufgabeSchluessel: undefined }, bindung);
    expect((ohne as { felder: Record<string, unknown> }).felder['aufgabe_schluessel'] ?? null).toBeNull();
    // Kratky im Rundgang verlangt den Füllstand (R4.10)
    expect(() =>
      messungVorgang(eingabe, { ...kontext, betriebsart: 'kratky_belueftet' as const }, bindung),
    ).toThrow();
    // die Messung erledigt in der Aufgaben-Rechnung «Messen und nachfüllen» 1.1
    const t = regal();
    messungDazu(t, 'R-1.1', { gilt: zh(HEUTE, '09:00') });
    expect(
      faellig(fertig(t), jetztAm(HEUTE, '09:05')).some(
        (a) => a.typ === 'messen_nachfuellen' && a.ort?.code === 'R-1.1',
      ),
    ).toBe(false);
  });
});
