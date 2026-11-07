// Aufgaben-Rechnung in Deno (Plan 27 Lösungsweg 6, Testliste «Deno»; R5.1, UC8-AK10; 06_tests.md 8). Läuft mit
// `deno test --allow-read --allow-env supabase/functions` ohne Netz: importiert nur src/domain/aufgaben.ts und die
// gemeinsame Fixture tests/unit/aufgaben-fixture.ts relativ (wie kern.test.ts die Push-Fixture), nie index.ts.
// Dieselbe Fixture prüft tests/unit/aufgaben-schluessel.test.ts in Vitest; beide erwarten ERWARTETE_SCHLUESSEL.
//
// Vorbereitung I1b-06 (TP): Fehlt der Fixture ein Teil und ändert sich dadurch die Aufgabenliste, muss dieser Teil in
// AUFGABEN_TEILE stehen; nur so kann daten.ts der Edge Function später gegen AUFGABEN_TEILE geprüft werden.
import {
  AUFGABEN_TEILE,
  alleAufgaben,
  einstellungenAus,
  faelligeAufgaben,
  fehlendeTeile,
} from '../../../src/domain/aufgaben.ts';
import {
  ERWARTETE_SCHLUESSEL,
  FIXTURE_TEILE,
  HEUTE,
  JETZT,
  ZONE,
  aufschubDazu,
  fertig,
  grundstand,
  jetztAm,
  ohne,
  platzId,
  schluessel,
  type Teile,
} from '../../../tests/unit/aufgaben-fixture.ts';

// Prüfhilfen ohne externe Module (pr.yml ohne Netz, keine Import-Map)
function gleich(ist: unknown, soll: unknown, was: string): void {
  const a = JSON.stringify(ist);
  const b = JSON.stringify(soll);
  if (a !== b) throw new Error(`${was}: erwartet ${b}, erhalten ${a}`);
}

function wahr(bedingung: boolean, was: string): void {
  if (!bedingung) throw new Error(was);
}

const faellig = (t: Teile, jetzt = JETZT) => faelligeAufgaben(t, einstellungenAus(t), jetzt, ZONE);
/** alle Aufgaben mit Fälligkeit und Anzeige; Einstellungen aus dem vollständigen Grundstand */
const alle = (t: Teile, jetzt = JETZT) =>
  alleAufgaben(t, einstellungenAus(grundstand()), jetzt, ZONE).map((a) => `${a.schluessel}@${a.anzeigeAb}`);

Deno.test('UC8-AK10 dieselbe Fixture in Deno liefert genau ERWARTETE_SCHLUESSEL', () => {
  gleich(
    faellig(grundstand()).map((a) => a.schluessel),
    ERWARTETE_SCHLUESSEL,
    'Schlüssel und Reihenfolge',
  );
  // vollständige Aufgaben gleich bei zweimaligem Rechnen (keine Laufzeit- oder Zufallsabhängigkeit)
  gleich(faellig(grundstand()), faellig(grundstand()), 'zweimal gerechnet');
});

Deno.test('UC8-AK10 Deno rechnet Kalendertage in Zürich unabhängig von der Zeitzone des Rechners', () => {
  // 12.1. 00:01 Zürich = 11.1. 23:01 UTC: Liste des 12.1.; 11.1. 23:59 Zürich: Liste des 11.1.
  const t = grundstand();
  const nachMitternacht = faellig(t, new Date('2027-01-11T23:01:00.000Z'));
  wahr(
    nachMitternacht.some((a) => a.schluessel === schluessel('kurzpruefung', platzId('R-1.1'), HEUTE)),
    'Kurzprüfung 1.1 des 12.1. nach Mitternacht Zürich',
  );
  const vorMitternacht = faellig(t, jetztAm('2027-01-11', '23:59'));
  wahr(
    vorMitternacht.some((a) => a.schluessel === schluessel('kurzpruefung', platzId('R-1.1'), '2027-01-11')),
    'Kurzprüfung 1.1 des 11.1. vor Mitternacht Zürich',
  );
});

Deno.test('UC8-AK10 fehlendeTeile(Fixture) ist leer und AUFGABEN_TEILE ⊆ Teile der Fixture', () => {
  gleich(fehlendeTeile(grundstand()), [], 'fehlendeTeile');
  gleich(
    AUFGABEN_TEILE.filter((n) => !FIXTURE_TEILE.includes(n)),
    [],
    'AUFGABEN_TEILE ausserhalb der Fixture',
  );
});

Deno.test(
  'TP Vorbereitung I1b-06: AUFGABEN_TEILE nennt jeden Teil, den die Regeln lesen (Fixture ohne diesen Teil ändert die Liste → Teil muss in AUFGABEN_TEILE stehen)',
  () => {
    // Grundstand mit einem Aufschub, damit auch der Teil aufschub die Liste ändert
    const t = grundstand();
    aufschubDazu(t, {
      schluessel: schluessel('wurzeln_pruefen', platzId('R-2.1'), '2027-01-09'),
      art: 'morgen',
      gesetztAm: HEUTE,
    });
    fertig(t);
    const voll = alle(t);
    wahr(voll.length >= ERWARTETE_SCHLUESSEL.length, 'Grundstand liefert Aufgaben');
    const gelesen = Object.keys(t).filter(
      (name) => JSON.stringify(alle(ohne(t, name))) !== JSON.stringify(voll),
    );
    const fehlend = gelesen.filter((name) => !AUFGABEN_TEILE.includes(name));
    gleich(fehlend, [], 'gelesene Teile, die in AUFGABEN_TEILE fehlen');
    // die Teile, ohne die es keine Aufgabe gibt, gehören sicher dazu
    for (const name of ['anlage', 'platz', 'aufschub'])
      wahr(gelesen.includes(name), `${name} ändert die Liste`);
  },
);
