// Honor-Simulation (Issue #120, T-01): die Abläufe der App der Reihe nach im Honor-Bildschirm. Jeder Ablauf nutzt
// die Daten und die Klickfolge des zugehörigen E2E-Tests (Verweis im Titel) und prüft an jeder Maske die
// Bedienregeln. Ersetzt keine [Gerät]-AK (Konzept 12.5); Push, Wake Lock, Ton, Druck und echte Zeiten bleiben am Honor.
import type { Locator, Page } from '@playwright/test';
import { ansatzTeile, laufenderWechsel, um } from '../fixtures/ansatz.ts';
import {
  duplizierTeile,
  JETZT_W4,
  kulturformSetzen,
  pflanzungAnlegen,
  satzAnlegen,
} from '../fixtures/duplizieren.ts';
import { KEIM_JETZT, keimTeile } from '../fixtures/keimung.ts';
import { JETZT as MESS_JETZT, messTeile } from '../fixtures/messen.ts';
import { buendelTeile, phasenNachrechnen } from '../fixtures/phasen.ts';
import { leeresRegal, regalTeile, uid, type Teile } from '../fixtures/regal.ts';
import { JETZT as RUNDGANG_JETZT, rundgangTeile } from '../fixtures/rundgang.ts';
import { saatTeile, SORTE } from '../fixtures/saeen.ts';
import {
  pflanzSichtenNachrechnen,
  sichtenNachrechnen,
  umsetzSichtenNachrechnen,
} from '../fixtures/sichten.ts';
import { UMSETZ_FAELLIG, UMSETZ_JETZT, umsetzTeile, verschiebTeile } from '../fixtures/umsetzen.ts';
import { expect, test } from './vorfuehrung.ts';

const knopf = (ort: Page | Locator, name: string) =>
  ort
    .getByRole('link', { name, exact: true })
    .or(ort.getByRole('button', { name, exact: true }))
    .first();
const knopfMit = (ort: Page | Locator, name: RegExp) =>
  ort.getByRole('link', { name }).or(ort.getByRole('button', { name })).first();
const loch = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^Loch ${n},`) });
const ueberschrift = (page: Page, name: string | RegExp) => page.getByRole('heading', { name, level: 1 });

test('01 Heute nach dem Öffnen (Startzeit, Vorprobe zu Issue 112)', async ({ page, sim }) => {
  await sim.start(rundgangTeile({ orte: ['1.1', '2.1'] }), '/#/heute', RUNDGANG_JETZT);
  await expect(ueberschrift(page, 'Heute')).toBeVisible({ timeout: 15_000 });
  await sim.zeige('Heute: Aufgaben des Tages als Ortskarten');
  await sim.regeln('Heute');
  await sim.messeZeit(
    'Heute nach Neuladen',
    async () => {
      await page.reload();
    },
    ueberschrift(page, 'Heute'),
    2000,
  );
});

test('02 Gefäss öffnen in höchstens 1 s (Vorprobe)', async ({ page, sim }) => {
  await sim.start(rundgangTeile({ orte: ['1.1', '2.1'] }), '/#/heute', RUNDGANG_JETZT);
  await expect(ueberschrift(page, 'Heute')).toBeVisible({ timeout: 15_000 });
  await sim.zeige('Von Heute zum Gefäss 1.1 (wie nach einem Scan)');
  await sim.messeZeit(
    'Gefäss 1.1 anzeigen',
    async () => {
      await page.evaluate(() => {
        window.location.hash = '#/gefaess/R-1.1';
      });
    },
    ueberschrift(page, /1\.1/),
    1000,
  );
  await sim.regeln('Gefäss 1.1');
});

test('03 Säen mit zwei Sorten im Malmodus (wie saeen.spec.ts)', async ({ page, sim }) => {
  const jetzt = new Date('2027-01-07T08:00:00Z');
  await sim.start(saatTeile(jetzt, { ohneSatzIn23: true }), '/#/saeen?box=R-A1', jetzt);
  await expect(ueberschrift(page, 'Säen')).toBeVisible();
  await sim.zeige('Schritt 1: Sorten wählen');
  await sim.regeln('Säen Schritt 1');
  await sim.tippe(page.getByRole('button', { name: /^Lollo Rossa/ }).first(), 'Lollo Rossa');
  await sim.tippe(page.getByRole('button', { name: /^Eichblatt/ }).first(), 'Eichblatt');
  await sim.tippe(knopf(page, 'Weiter'), 'Weiter');
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  await sim.tippe(page.getByRole('button', { name: /^2\.3(?![.\d])/ }).first(), 'Zielgefäss 2.3');
  await sim.zeige('Malmodus: Sorte in der Leiste wählen, dann Reihen oder Löcher antippen');
  await sim.tippe(page.getByRole('button', { name: /^(?!Loch ).*Lollo Rossa/ }).first(), 'Lollo Rossa malen');
  // D2 «3, 3» spaltenweise (#136): Reihe 1 = Loch 1, 3, 5 für Lollo Rossa, Eichblatt einzeln in Loch 2, 4, 6
  await sim.tippe(page.getByRole('button', { name: 'Reihe 1 wählen' }), 'Reihe 1');
  await sim.tippe(page.getByRole('button', { name: /^(?!Loch ).*Eichblatt/ }).first(), 'Eichblatt malen');
  await sim.tippe(loch(page, 2), 'Loch 2');
  await sim.tippe(loch(page, 4), 'Loch 4');
  await sim.tippe(loch(page, 6), 'Loch 6');
  await sim.regeln('Säen Schritt 2 (Deckel)');
  await sim.tippe(knopf(page, 'Weiter'), 'Weiter');
  await expect(page.getByText('Schritt 3 von 3')).toBeVisible();
  await sim.regeln('Säen Schritt 3');
  await sim.tippe(knopf(page, 'Säen speichern'), 'Säen speichern');
  await expect(page.getByText(/Gespeichert: 2 Sätze/)).toBeVisible();
  await sim.zeige('Gespeichert, mit «Rückgängig machen»');
  await sim.foto('Säen gespeichert');
});

function duplizierRegal(): Teile {
  // wie saeen-duplizieren.spec.ts regal(56, true)
  const t = duplizierTeile(JETZT_W4);
  kulturformSetzen(t, 'lactuca_sativa', 'schnitt', { kulturdauer_max_d: 56 });
  satzAnlegen(t, {
    nr: 70,
    sorteId: SORTE.lollo,
    kulturform: 'schnitt',
    saatdatum: '2027-01-07',
    box: 'A1',
    samen: 3,
    schwaemme: 4,
  });
  pflanzungAnlegen(t, 70, 1, { topf: '2.3.1' });
  pflanzungAnlegen(t, 70, 2, { topf: '2.3.2' });
  for (const k of [3, 4]) pflanzungAnlegen(t, 70, k, { status: 'ueberzaehlig' });
  satzAnlegen(t, {
    nr: 71,
    sorteId: SORTE.eichblatt,
    kulturform: 'schnitt',
    saatdatum: '2027-01-07',
    schwaemme: 1,
  });
  pflanzungAnlegen(t, 71, 1, { topf: '2.3.3' });
  return t;
}

test('04 Satz duplizieren in drei Berührungen (wie saeen-duplizieren.spec.ts)', async ({ page, sim }) => {
  await sim.start(duplizierRegal(), '/#/saeen', JETZT_W4);
  await expect(page.getByText('Schritt 1 von 3')).toBeVisible();
  await sim.zeige('Schritt 1: Abschnitt «Satz duplizieren» unter den Sorten');
  await sim.tippe(knopf(page, 'Lollo Rossa vom 7.1. duplizieren'), 'Duplizieren (Lollo Rossa vom 7.1.)');
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  await sim.regeln('Duplizieren Schritt 2');
  await sim.tippe(knopf(page, 'Weiter'), 'Weiter');
  await sim.tippe(knopf(page, 'Säen speichern'), 'Säen speichern');
  await expect(page.getByText('Gespeichert: 1 Satz, 4 Schwämme')).toBeVisible();
  await sim.foto('Duplizieren gespeichert');
});

test('05 Keimung prüfen von Heute aus (wie keimung.spec.ts)', async ({ page, sim }) => {
  await sim.start(keimTeile(), '/#/heute', KEIM_JETZT, {
    nachrechnen: (t) => pflanzSichtenNachrechnen(sichtenNachrechnen(t)),
  });
  await expect(ueberschrift(page, 'Heute')).toBeVisible({ timeout: 15_000 });
  const eintrag = page
    .getByRole('listitem')
    .filter({ hasText: 'Keimung prüfen' })
    .filter({ hasText: 'R-A1' })
    .first();
  await sim.tippe(knopf(eintrag, 'Prüfen'), 'Prüfen (Keimung prüfen · R-A1)');
  await expect(ueberschrift(page, 'Keimung prüfen')).toBeVisible();
  await sim.regeln('Keimung prüfen');
  const weniger = page.getByRole('button', { name: /^Schwamm 4(?!\d).* weniger$/ });
  await sim.tippe(weniger, 'Schwamm 4 −');
  await sim.tippe(weniger, 'Schwamm 4 −');
  await sim.zeige('Hinweis: Schwamm 4 keimt nicht, Zieltopf 2.3.4 wird frei');
  await sim.tippe(knopf(page, 'Ja'), 'Ja (Keimtemperatur eingehalten)');
  await sim.tippe(knopf(page, 'Weiter'), 'Weiter');
  await sim.regeln('Keimung Station');
  await sim.tippe(knopf(page, 'Keimung speichern'), 'Keimung speichern');
  await expect(page.getByText(/Gespeichert: /)).toBeVisible();
  await sim.foto('Keimung gespeichert');
});

test('06 Messmaske 2.3 mit Ergebniszone und Rückfrage (wie messen-maske.spec.ts)', async ({ page, sim }) => {
  await sim.start(messTeile(), '/#/messen/R-2.3', MESS_JETZT);
  await expect(page.getByRole('button', { name: /^EC( |$)/ })).toBeVisible({ timeout: 15_000 });
  await sim.zeige('Messmaske: pH, EC und °C über den Ziffernblock, ohne Komma');
  await sim.regeln('Messmaske Eingabe', { ohneScrollen: true });
  await sim.ziffern('68', 'pH 6.8');
  await sim.ziffern('160', 'EC 1.60');
  await sim.ziffern('245', '°C 24.5');
  await expect(page.locator('.hv-ergebniszone')).toBeVisible();
  await sim.zeige('Ergebniszone: Bewertung und höchstens zwei Hinweise');
  await sim.regeln('Messmaske Ergebnis', { ohneScrollen: true });
  await sim.tippe(page.getByRole('button', { name: /^Speichern/ }), 'Speichern');
  await expect(knopf(page, 'Ja, speichern')).toBeVisible();
  await sim.zeige('Rückfrage nach einem Sprung: «Richtiges Gefäss?»');
  await sim.regeln('Messmaske Rückfrage', { ohneScrollen: true });
  await page.waitForTimeout(450);
  await sim.tippe(knopf(page, 'Ja, speichern'), 'Ja, speichern');
  await expect(page.getByText(/Gespeichert/).first()).toBeVisible();
  await sim.foto('Messung gespeichert');
});

test('07 Messmaske bei Systemschrift 130 % auf 780 und 640 dp (Vorprobe zu Issue 94)', async ({
  page,
  sim,
}) => {
  await sim.start(messTeile(), '/#/messen/R-2.3', MESS_JETZT);
  await expect(page.getByRole('button', { name: /^EC( |$)/ })).toBeVisible({ timeout: 15_000 });
  await sim.schrift(1.3);
  await sim.regeln('Messmaske 130 % Eingabe', { ohneScrollen: true });
  await sim.ziffern('62', 'pH 6.2');
  await sim.ziffern('125', 'EC 1.25');
  await sim.ziffern('205', '°C 20.5');
  await expect(page.locator('.hv-ergebniszone')).toBeVisible();
  await sim.regeln('Messmaske 130 % Ergebnis', { ohneScrollen: true });
  // kleinster Viewport der E2E (360 × 640) mit derselben Schrift
  await page.setViewportSize({ width: 360, height: 640 });
  await sim.zeige('Dasselbe auf 360 × 640 dp');
  await sim.regeln('Messmaske 130 % auf 640 dp (Vorprobe)', { ohneScrollen: true, vorprobe: true });
});

test('08 Abhakliste Lösungswechsel: Zeilen abhaken (wie abhakliste.spec.ts)', async ({ page, sim }) => {
  await sim.start(ansatzTeile(), '/#/ansatz/R-2.3', um('18:30'));
  await expect(page.locator('ol.hv-checklist li.hv-check-row')).toHaveCount(18, { timeout: 15_000 });
  await sim.zeige('Abhakliste 2.3: nur die nächste offene Zeile ist abhakbar');
  await sim.regeln('Abhakliste');
  for (const [nr, uhr] of [
    [0, '18:30'],
    [1, '18:31'],
    [2, '18:33'],
  ] as const) {
    await page.clock.setFixedTime(um(uhr));
    await sim.tippe(
      page.getByRole('button', { name: `Zeile ${nr} abhaken`, exact: true }),
      `Haken Zeile ${nr}`,
    );
  }
  await sim.foto('Abhakliste nach Zeile 2');
});

test('09 Abhakliste mit laufendem Timer (Bildschirm an, Ton und Vibration bleiben am Honor)', async ({
  page,
  sim,
}) => {
  await sim.start(laufenderWechsel(ansatzTeile(), 10), '/#/ansatz/R-2.3', um('18:48'));
  await expect(page.getByRole('timer').first()).toBeVisible({ timeout: 15_000 });
  await sim.zeige('Zeile 11 «15 min warten»: Restzeit, Haken bis zum Ablauf gesperrt');
  await sim.regeln('Abhakliste Timer');
  await sim.zeige('Am Honor prüfen: Bildschirm bleibt an, Ton und Vibration am Ende (nicht simulierbar)');
});

test('10 Wie geplant umsetzen von Heute aus (wie umsetzen.spec.ts)', async ({ page, sim }) => {
  await sim.start(umsetzTeile({ jetzt: UMSETZ_FAELLIG, reserve: false }), '/#/heute', UMSETZ_FAELLIG, {
    nachrechnen: (t) => umsetzSichtenNachrechnen(sichtenNachrechnen(t)),
  });
  await expect(ueberschrift(page, 'Heute')).toBeVisible({ timeout: 15_000 });
  const eintrag = page
    .getByRole('listitem')
    .filter({ hasText: 'Umsetzen' })
    .filter({ hasText: 'Lollo Rossa' });
  await sim.tippe(knopf(eintrag, 'Wie geplant umsetzen'), 'Wie geplant umsetzen');
  await expect(ueberschrift(page, 'Umsetzen')).toBeVisible();
  await sim.regeln('Umsetzen Bestätigung');
  await sim.tippe(knopf(page, 'Umsetzen bestätigen'), 'Umsetzen bestätigen');
  await expect(page.getByText(/Umgesetzt: \d+ Sämlinge/)).toBeVisible();
  await sim.foto('Umgesetzt');
});

test('11 Topf verschieben im Deckel (wie verschieben.spec.ts)', async ({ page, sim }) => {
  await sim.start(verschiebTeile(UMSETZ_JETZT), '/#/gefaess/R-2.3', UMSETZ_JETZT, {
    nachrechnen: (t) => umsetzSichtenNachrechnen(sichtenNachrechnen(t)),
  });
  await expect(ueberschrift(page, /2\.3/)).toBeVisible({ timeout: 15_000 });
  await sim.zeige('Gefäss 2.3: Deckel mit allen Töpfen');
  await sim.regeln('Gefäss 2.3 Deckel');
  await sim.tippe(loch(page, 1), 'Topf in Loch 1');
  await sim.tippe(knopf(page, 'Verschieben'), 'Verschieben');
  await expect(ueberschrift(page, 'Verschieben')).toBeVisible();
  await sim.regeln('Verschieben');
  await sim.tippe(loch(page, 4), 'Ziel Loch 4 (Tausch)');
  await expect(page.getByText(/Getauscht: 2\.3\.1 ↔ 2\.3\.4/)).toBeVisible();
  await sim.foto('Getauscht');
});

test('12 Phasenkarte auf Heute und Pflanzenansicht (wie phasen.spec.ts)', async ({ page, sim }) => {
  const jetzt = new Date('2027-01-23T08:00:00Z');
  await sim.start(buendelTeile(jetzt, { ohneSpaete: true }), '/#/heute', jetzt, {
    nachrechnen: phasenNachrechnen,
  });
  await expect(ueberschrift(page, 'Heute')).toBeVisible({ timeout: 15_000 });
  const karte = page
    .getByRole('heading', { name: 'Salat · 4.4 · gesät 7.1.', exact: true })
    .locator('xpath=ancestor::section[1]');
  await sim.zeige('Phasenkarte: je Sorte «Ja» vorgewählt, Ausnahmen antippen');
  // U-04 (B7): Antworten als Segmente mit rundem Punkt; Prüfer Runde 1 verlangt die Karte im Bilderbogen
  await sim.regeln('Phasenkarte');
  await sim.tippe(
    karte.getByRole('group', { name: /^Eichblatt/ }).getByRole('button', { name: 'Noch nicht', exact: true }),
    'Noch nicht (Eichblatt)',
  );
  await sim.tippe(knopf(karte, 'Alle Ja'), 'Alle Ja');
  await expect(page.getByText(/Gespeichert/).first()).toBeVisible();
  await page.goto('/#/gefaess/R-4.4');
  await expect(ueberschrift(page, /4\.4/)).toBeVisible({ timeout: 15_000 });
  const zeile = page
    .getByRole('list', { name: 'Pflanzen' })
    .getByRole('listitem')
    .filter({ hasText: 'Eichblatt' });
  await sim.tippe(knopf(zeile, 'Phase'), 'Phase (Eichblatt)');
  await expect(ueberschrift(page, 'Pflanze')).toBeVisible();
  await sim.zeige('Pflanzenansicht: Tag seit Saat, Phase, nächste Phase mit Datum');
  await sim.regeln('Pflanze');
});

test('13 Rundgang über zwei Orte bis zur Abschlussliste (wie rundgang.spec.ts)', async ({ page, sim }) => {
  await sim.start(rundgangTeile({ orte: ['1.1', '2.1'] }), '/#/heute', RUNDGANG_JETZT);
  await expect(ueberschrift(page, 'Heute')).toBeVisible({ timeout: 15_000 });
  await sim.tippe(knopfMit(page, /^Rundgang starten \(2 Orte\)/), 'Rundgang starten (2 Orte)');
  for (const [ebene, ort] of [
    [1, '1.1'],
    [2, '2.1'],
  ] as const) {
    await expect(page.getByText(`Ebene ${ebene} · Pumpen laufen, Licht an, Lüfter läuft`)).toBeVisible({
      timeout: 10_000,
    });
    await sim.regeln(`Rundgang Kurzprüfung Ebene ${ebene}`);
    await sim.tippe(knopf(page, 'Alles ok'), `Alles ok (Ebene ${ebene})`);
    await expect(page.getByRole('button', { name: /^EC( |$)/ })).toBeVisible({ timeout: 10_000 });
    await sim.zeige(`Messung ${ort}`);
    await sim.ziffern('62', 'pH 6.2');
    await sim.ziffern('120', 'EC 1.20');
    await sim.ziffern('200', '°C 20.0');
    await sim.regeln(`Rundgang Messung ${ort}`, { ohneScrollen: true });
    await sim.tippe(page.getByRole('button', { name: /^Speichern/ }), 'Speichern');
  }
  await expect(page.getByText(/^Fertig: \d+ von \d+/)).toBeVisible({ timeout: 15_000 });
  await sim.zeige('Abschlussliste');
  await sim.regeln('Rundgang Abschluss');
});

test('14 Etiketten für 2.3 und Druckansicht (wie etikett-druck.spec.ts)', async ({ page, sim }) => {
  const jetzt = new Date('2026-12-14T08:00:00Z');
  await sim.start(regalTeile(jetzt), '/#/etiketten?a=R', jetzt, { ohneDruckdialog: true });
  await expect(ueberschrift(page, 'Etiketten')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('checkbox', { name: /^2\.3(\s|$)/ })).toBeVisible();
  await sim.regeln('Etiketten');
  await sim.zeige('Nur Etikett 2.3 wählen, Startfeld 1');
  const wahl = page.getByRole('checkbox', { name: /^\d|^A\d|^W/ });
  for (const feld of await wahl.all()) if (await feld.isChecked()) await feld.uncheck();
  await sim.waehle(page.getByRole('checkbox', { name: /^2\.3(\s|$)/ }), '2.3');
  await sim.fuelle(page.getByLabel(/^Startfeld/), '1', 'Startfeld');
  await sim.tippe(knopf(page, 'Druckansicht öffnen'), 'Druckansicht öffnen');
  await expect(page.locator('.hv-sheet').first()).toBeVisible();
  await sim.zeige('Druckansicht; am Honor: Drucken über WLAN (Mopria) oder als PDF');
  await sim.foto('Druckansicht');
});

test('15 Gefäss erfassen in vier Schritten (wie gefaess.spec.ts)', async ({ page, sim }) => {
  await sim.start(leeresRegal(), '/#/gefaess-neu?a=R', new Date('2026-12-01T08:00:00Z'));
  await expect(ueberschrift(page, 'Gefäss erfassen')).toBeVisible({ timeout: 15_000 });
  const gruppe = (name: string) => page.getByRole('group', { name, exact: true });
  await sim.regeln('Gefäss erfassen Schritt 1');
  await sim.waehle(gruppe('Bereich').getByRole('radio', { name: 'Ebene 2', exact: true }), 'Ebene 2');
  await sim.waehle(gruppe('Position').getByRole('radio', { name: '3', exact: true }), 'Position 3');
  await sim.waehle(gruppe('Luftpumpe').getByRole('radio', { name: 'P2', exact: true }), 'Luftpumpe P2');
  await sim.tippe(knopf(page, 'Weiter'), 'Weiter');
  await sim.waehle(gruppe('Box').getByRole('radio', { name: /^Rako 40 × 30 × 22/ }), 'Box Rako 40 × 30 × 22');
  await sim.regeln('Gefäss erfassen Schritt 2');
  await sim.tippe(knopf(page, 'Weiter'), 'Weiter');
  await sim.waehle(gruppe('Deckel oder Platte').getByRole('radio', { name: 'D2', exact: true }), 'Deckel D2');
  await sim.regeln('Gefäss erfassen Schritt 3');
  await sim.tippe(knopf(page, 'Weiter'), 'Weiter');
  await expect(page.getByText(/2\.3\.1 bis 2\.3\.6/)).toBeVisible();
  await sim.regeln('Gefäss erfassen Zusammenfassung');
  await sim.tippe(knopf(page, 'Speichern'), 'Speichern');
  await sim.foto('Gefäss gespeichert');
});

test('16 Einstellungen und Notfallblatt (wie einstellungen.spec.ts)', async ({ page, sim }) => {
  const jetzt = new Date('2026-12-10T08:00:00Z');
  const t = regalTeile(jetzt);
  t['messgeraet'] = [{ id: uid('23', 1), modell: 'Aquamaster P160 Pro2', u_ec: 0.1, u_ph: 0.1 }];
  t['einstellung'] = [
    {
      id: uid('31', 1),
      push_zeit: '07:00:00',
      vorlauf_n: 2,
      kannengroesse_l: 10,
      messmittel_ml: [1, 5, 20, 60],
      messbecher: true,
      thema: 'hell',
      pflegebudget_min_werktag: 20,
      pflegebudget_h_woche: 4,
      zeitzone: 'Europe/Zurich',
      telefon_vertretung: 'Platzhalter',
    },
  ];
  await sim.start(t, '/#/einstellungen', jetzt);
  await expect(ueberschrift(page, 'Einstellungen')).toBeVisible({ timeout: 15_000 });
  await sim.zeige('Einstellungen: Erinnerung, Kanne, Messmittel, Thema, Pflege');
  await sim.regeln('Einstellungen');
  await sim.tippe(knopf(page, 'Notfallblatt drucken'), 'Notfallblatt drucken');
  await expect(page).toHaveURL(/#\/notfallblatt/);
  await sim.zeige('Notfallblatt: Stand je Gefäss und Vertretung');
  await sim.regeln('Notfallblatt', { druckseite: true });
});

test('17 Info und Push-Seite (Commit, Push einrichten)', async ({ page, sim }) => {
  await sim.start({}, '/#/info', new Date('2026-12-10T08:00:00Z'));
  await expect(ueberschrift(page, 'Info')).toBeVisible({ timeout: 15_000 });
  await sim.zeige('Info: Version, Commit, Installiert, Start bis Heute');
  await sim.regeln('Info');
  await page.goto('/#/push');
  await expect(ueberschrift(page, 'Push')).toBeVisible({ timeout: 15_000 });
  await sim.zeige('Push: «Push einrichten», «Test-Push senden»; Zustellung nur am Honor prüfbar');
  await sim.regeln('Push');
});
