# Plan 11: I0-04 Datenpfad `schreiben()` mit Offline-Bündel

Stand 3.11.2026 · Paket I0-04 · Klasse Kern · Plan B im Vergleich nach Konzept 12.7 a (Verfasser verdeckt) · Planfreigabe nötig (Label `plan-frei`) · Migration nein

## Ziel

Jede Erfassung der App läuft über ein einziges Modul `schreiben()`: Client-UUID, Upsert auf `client_id`, `app_version`, `client_zeit` und `gilt_ab` gesetzt, Fehler sichtbar und wiederholbar, nie still verloren. Heute zeigt den Datenstand des Offline-Bündels («Stand: hh:mm») auch ohne Netz. Als erste echte Erfassung über diesen Weg dient die pH-Kontrolle am Messgerät (`#/messen/geraet`, ein Feld), damit TO2 und TO8 am Gerät prüfbar sind, bevor I0-07 die einfache Messung baut.

## Ausgangslage

- Vorhanden: Supabase-Client ohne Typbindung (`src/daten/supabase.ts`), IndexedDB `hydrovisor` Version 1 mit Speicher `ablaeufe` (`src/daten/lokal.ts`), Sitzung ohne erneute Anmeldung (I0-06), Service Worker mit Precache ohne Laufzeit-Cache für API-Aufrufe (`src/sw/sw.ts`), Typen `src/daten/datenbank.types.ts` aus I0-03, Seed mit `messgeraet` und `einstellung` (I0-05).
- Datenmodell (Migration `20261103140000_datenmodell.sql`): Erfassungstabellen mit `client_id uuid not null unique`, `gilt_ab`, `client_zeit`, `nacherfasst` (generiert), `erfasst_am default now()`, `storniert_am`, `storno_grund`, `ersetzt_id`; Stammdaten des Clients (`anlage`, `bereich`, `platz`, `gefaess`, …) mit `client_id uuid unique` nullable; RLS je Tabelle mit `tim_lesen`, `tim_einfuegen`, `tim_aendern`, kein Löschen; `messung` mit `messart = 'ph_kontrolle'` verlangt `platz_id is null` und `datenart not null`.
- Offen aus Plan 9 (F5, von Tim bejaht): Die erlaubten `daten`-Schlüssel je Ereignistyp prüft `schreiben()` in diesem Paket mit Unit-Tests.
- E2E laufen im Prüftor gegen `vite build` + `vite preview`; die Auth-Schnittstelle wird mit `page.route` nachgebildet (`tests/e2e/hilfen.ts`); ein Konto in der lokalen Datenbank gibt es im E2E-Job nicht.
- Die Warteschlange (TO1, TO3 bis TO5) entscheidet Q14 nach dem Gerätetest; bis dahin blockiert ein Fehler sichtbar (Konzept 11.1, 11.4; 04 Abschnitt 4.1).

## Entscheide (je mit verworfener Alternative)

| Nr. | Entscheid | Verworfen |
|---|---|---|
| E1 | Upsert mit `onConflict: 'client_id'` und `ignoreDuplicates: true` (`on conflict do nothing`): Die erste gespeicherte Zeile gewinnt; eine Wiederholung ändert nichts und liefert eine leere Antwort, worauf `schreiben()` die Zeile über `client_id` nachliest und `wiederholt: true` meldet. | `merge-duplicates` (Update bei Konflikt): würde bei einer späten Wiederholung ein inzwischen gesetztes `storniert_am` oder einen Serverstand überschreiben können. |
| E2 | Die Client-UUID entsteht in der Maske beim ersten Tipp auf «Speichern» und bleibt an diesen Eingabe-Schnappschuss gebunden; «Erneut senden» verwendet dieselbe UUID, jede Änderung einer Eingabe erzeugt eine neue. | UUID je Sendeversuch: bräche die Idempotenz (TO2); UUID beim Öffnen der Maske: eine korrigierte Eingabe nach gescheitertem Versuch würde vom Server als Duplikat ignoriert. |
| E3 | `jetzt` ist Parameter von `schreiben()`, `buendelLaden()` und aller Funktionen in `src/domain/`; `new Date()` nur in den Masken und Hooks. | `Date.now()` im Datenpfad: nicht testbar mit injizierter Uhr, widerspricht `CLAUDE.md`. |
| E4 | Fehler werden eingeordnet, nicht vorab geprüft: `kein_netz` (Fetch-Fehler, Abbruch nach Zeitlimit 15 s, Status 0), `abgelehnt` (4xx: RLS, Check, Enum, Format; bleibt mit «Als Text kopieren»), `fehler` (5xx, Unbekanntes; «erneut senden»). | `navigator.onLine` vor dem Senden: meldet in Chrome bei totem WLAN «online» und verhindert keinen Fehler. |
| E5 | Erste Erfassung über den neuen Weg ist die pH-Kontrolle am Messgerät (`messung`, `messart = 'ph_kontrolle'`, nur `ph`, Messgerät aus dem Bündel, `#/messen/geraet` aus der Routentabelle in 04 Abschnitt 3). Sie braucht keine Anlage und keinen Platz; der Seed liefert das Messgerät. | Beobachtung als Ereignis an der Anlage: in `hydrovisor-dev` gibt es bis I0-10 keine Anlage, Abnahme 1 wäre nicht möglich. Verdeckter Testhaken an `window`: keine echte Nutzung, keine Abnahme. Einfache Messung pH, EC, °C: gehört zu I0-07. |
| E6 | Das Bündel ist ein Datensatz im IndexedDB-Speicher `buendel` (Schlüssel `aktuell`), der bei jedem erfolgreichen Laden als Ganzes ersetzt wird; `lokal.ts` steigt auf Version 2 und legt den Speicher additiv an. | Ein Speicher je Tabelle: mehr Transaktionen, Teilstände bei Abbruch, kein eindeutiger «Stand». Cache im Service Worker: API-Antworten sind sitzungsgebunden, und der Service Worker bleibt nach 04 Abschnitt 7 ohne Laufzeit-Cache. |
| E7 | Der Bündel-Typ wird vollständig nach 04 Abschnitt 4.2 definiert und geladen (auch wenn die meisten Quellen heute leer sind); fehlende Schlüssel lesen spätere Pakete als leere Listen. | Nur `messgeraet` und `einstellung` laden: jedes spätere Paket müsste den Lader umbauen, und der Stand wäre nicht aussagekräftig. |
| E8 | Server und Client bleiben bei den Serverfeldern getrennt: `schreiben()` sendet nie `erfasst_am`, `nacherfasst`, `storniert_am`, `storno_grund`, `id`; `stornieren()` setzt `storniert_am = jetzt` und `storno_grund` per Update über `id`. | `id` im Client setzen (für Vorgänge mit mehreren Zeilen): zwei Schlüssel mit derselben Rolle; die `id` einer Vorzeile holt `schreiben()` aus der Antwort oder dem Nachlesen. |
| E9 | Die `daten`-Schlüssel je Ereignistyp prüft `src/domain/ereignis.ts` aus einer Tabelle (Pflicht und erlaubt je Typ nach dem Tabellenkommentar von `ereignis`); unbekannte oder fehlende Schlüssel verhindern das Senden (`ungueltig`). | Check in der Datenbank: Paket ohne Migration, von Tim bei Plan 9 F5 so entschieden. |
| E10 | TO2 und TO8 laufen im E2E gegen eine nachgebildete REST-Schnittstelle (`page.route` auf `/rest/v1/**`, Speicher je `client_id` im Test), die Serverseite der Idempotenz prüft pgTAP gegen die lokale Datenbank (`on conflict do nothing` als `authenticated`). | E2E gegen die echte lokale Datenbank: braucht ein Konto und den Service-Schlüssel im Test; die Auth ist in den E2E bereits nachgebildet. |
| E11 | Stryker bleibt auf `rechner`, `zielbereich`, `aufgaben` (Vertrag in `CLAUDE.md` und `06_tests.md`); für die neuen Domänenmodule läuft der Lead Stryker einmal lokal mit `--mutate` und legt den Wert im Pull Request ab (Ziel 80 %, nicht blockierend). | `stryker.config.json` erweitern: ändert den Prüftor-Vertrag für Module ohne Rechnung und verlängert jeden Lauf. |
| E12 | `einstellung.min_client_version` wird beim Laden des Bündels mitgelesen; ist die App älter, zeigt Heute «Aktualisieren» und die Erfassung ist gesperrt (04 Abschnitt 8). | Erst mit der Warteschlange: Die Prüfung gehört zum Datenpfad und kostet wenig; ohne sie schreibt eine alte App nach einer Migration ein altes Format. |

## Betroffene Dateien

| Datei | neu / geändert | Inhalt |
|---|---|---|
| `src/domain/zeit.ts` | neu | `kalendertag()`, `uhrzeit()`, `standText()` mit `Intl.DateTimeFormat` (kein Browser- oder Node-Bezug) |
| `src/domain/erfassung.ts` | neu | Tabellenliste, Feldregeln, `erfassungVorbereiten()`: setzt `client_id`, `app_version`, `client_zeit`, `gilt_ab`; prüft Plausibilität; typisiert gegen `datenbank.types.ts` |
| `src/domain/ereignis.ts` | neu | `EREIGNIS_DATEN` (Pflicht und erlaubt je Typ), `ereignisDatenPruefen()` (Plan 9 F5) |
| `src/domain/buendel.ts` | neu | Typ `Buendel`, `buendelLeer()`, `versionReicht()` (Semver-Vergleich für `min_client_version`) |
| `src/daten/supabase.ts` | geändert | `createClient<Database>(…)` (Typbindung, Plan 9 Nicht-Ziel) |
| `src/daten/schreibfehler.ts` | neu | `fehlerEinordnen()` (reine Einordnung von Fetch- und PostgREST-Fehlern) |
| `src/daten/schreiben.ts` | neu | `schreiben()`, `stornieren()`, `schreibenFolge()` (mehrere Zeilen in Fremdschlüssel-Reihenfolge, jede idempotent) |
| `src/daten/lokal.ts` | geändert | `LOKAL_VERSION = 2`, Speicher `buendel` (keyPath `schluessel`), additiv in `onupgradeneeded`; `onblocked` wird gemeldet |
| `src/daten/buendel.ts` | neu | `buendelLaden()` (Quellen nach 04 Abschnitt 4.2), `buendelLesen()`, `buendelSpeichern()` |
| `src/ui/buendel.tsx` | neu | Anbieter und Hook `useBuendel()`: zuerst IndexedDB, dann Netz; `nachSchreiben()` lädt neu |
| `src/ui/erfassungZustand.ts` | neu | reiner Zustandsautomat der Maske (Eingabe, Client-UUID, Ergebnis) nach E2 |
| `src/ui/masken/MessenGeraet.tsx` | neu | pH-Kontrolle: Kopf, ein Feld pH, «Speichern», Hinweise nach Ergebnis, «Erneut senden», «Als Text kopieren» |
| `src/ui/bausteine/Notice.tsx` | geändert nur falls nötig | Hinweis mit Aktion (`action`) nach `Notice.md` |
| `src/ui/masken/Heute.tsx` | geändert | Zeile «Stand: hh:mm», Hinweise «Kein Netz, noch keine Daten» und «Aktualisieren», Link «pH-Kontrolle erfassen» (Übergang bis I1b-05) |
| `src/ui/router.ts`, `src/ui/App.tsx` | geändert | Route `#/messen/:code` (nur `geraet` in diesem Paket), Bündel-Anbieter |
| `src/ui/masken/Info.tsx` | geändert | Zeile «Datenstand» (05 Abschnitt 4, Maske Info) |
| `tests/unit/zeit.test.ts`, `erfassung.test.ts`, `ereignis.test.ts`, `buendel.test.ts`, `schreibfehler.test.ts`, `schreiben.test.ts`, `erfassungZustand.test.ts`, `router.test.ts` | neu / geändert | Testliste unten |
| `supabase/tests/database/09_schreibweg_client.test.sql` | neu | pgTAP: Idempotenz, Storno, anon |
| `tests/e2e/hilfen.ts`, `tests/e2e/datenpfad.spec.ts` | geändert / neu | `restNachbilden()` mit Speicher je `client_id`; TO2, TO6, TO8, Ablehnung |
| `tests/testentwickler.txt` | geändert | neue Testdateien eintragen |
| `docs/spec/glossar.md` | geändert | `stornieren()`, `buendelLaden()`, `standText()` |

Nicht geändert: `supabase/migrations/`, `src/daten/datenbank.types.ts` (keine Migration, Typen-Abgleich bleibt grün), `src/sw/sw.ts`, `stryker.config.json`, `.github/workflows/*`.

## Migration

Nein. Alle gebrauchten Spalten, Checks und Policies bestehen seit I0-03. Kein `db-lock`.

## Schnittstellen

```ts
// src/domain/zeit.ts
export const ZEITZONE = 'Europe/Zurich';
export function kalendertag(jetzt: Date, zeitzone: string): string;          // 'JJJJ-MM-TT' in der Zeitzone
export function uhrzeit(jetzt: Date, zeitzone: string): string;              // 'hh:mm'
export function standText(stand: Date, jetzt: Date, zeitzone: string): string;
// gleicher Kalendertag → «Stand: 14:05»; sonst «Stand: 2.11. 18:30» (A1)

// src/domain/erfassung.ts
export type Schreibtabelle = 'messung' | 'kalibrierung' | 'ereignis' | 'aufschub' | 'satz' | 'pflanzung'
  | 'pflanzvorgang' | 'reservierung' | 'naehrloesungsansatz' | 'ansatz_position' | 'ansatz_schritt'
  | 'saatgut' | 'ki_feldprotokoll' | 'eigene_aufgabe' | 'anlage' | 'bereich' | 'platz' | 'etikett'
  | 'gefaessmodell' | 'deckeltyp' | 'gefaess' | 'anzuchtort' | 'netztopf' | 'k_faktor' | 'etikett_aufruf';
export type Serverfeld = 'id' | 'client_id' | 'app_version' | 'client_zeit' | 'erfasst_am' | 'nacherfasst'
  | 'storniert_am' | 'storno_grund';
export type Eingabe<T extends Schreibtabelle> = Omit<TablesInsert<T>, Serverfeld> & { gilt_ab?: string };
export interface Erfassungskontext { jetzt: Date; zeitzone: string; appVersion: string; clientId: string }
export type Vorbereitung<T extends Schreibtabelle> =
  | { ok: true; zeile: TablesInsert<T> }
  | { ok: false; grund: 'gilt_ab_zukunft' | 'ereignis_daten' | 'leer'; einzelheiten?: string[] };
export function erfassungVorbereiten<T extends Schreibtabelle>(
  tabelle: T, eingabe: Eingabe<T>, kontext: Erfassungskontext): Vorbereitung<T>;
// setzt client_id, app_version; bei Tabellen mit Zeitachse client_zeit = jetzt (ISO) und gilt_ab = eingabe.gilt_ab ?? jetzt;
// gilt_ab später als jetzt + 5 min → gilt_ab_zukunft (A2); bei ereignis zusätzlich ereignisDatenPruefen()

// src/domain/ereignis.ts
export type EreignisTyp = Database['public']['Enums']['ereignis_typ'];
export const EREIGNIS_DATEN: Record<EreignisTyp, { pflicht: readonly string[]; erlaubt: readonly string[] }>;
export function ereignisDatenPruefen(typ: EreignisTyp, daten: Record<string, unknown>):
  { ok: true } | { ok: false; fehlend: string[]; unbekannt: string[] };

// src/domain/buendel.ts
export interface Buendel {
  anlagen: Tables<'anlage'>[]; bereiche: Tables<'bereich'>[]; plaetze: Tables<'platz'>[];
  gefaesse: Tables<'gefaess'>[]; deckeltypen: Tables<'deckeltyp'>[]; sorten: Tables<'sorte'>[];
  sollwerte: Tables<'v_sollwert'>[]; artKulturformen: Tables<'art_kulturform'>[];
  saatempfehlungen: Tables<'saatempfehlung'>[]; duengerschemata: Tables<'duengerschema'>[];
  saetze: Tables<'satz'>[]; pflanzungen: Tables<'v_pflanzung_zustand'>[];
  reservierungen: Tables<'v_reservierung_aktiv'>[]; messungen: Tables<'messung'>[];   // 14 Tage
  ansaetze: Tables<'naehrloesungsansatz'>[];                                          // letzter je Ort
  kalibrierungen: Tables<'kalibrierung'>[]; kalibrierungFaellig: Tables<'v_kalibrierung_faellig'>[];
  aufschuebe: Tables<'aufschub'>[]; einstellung: Tables<'einstellung'> | null;
  messgeraete: Tables<'messgeraet'>[]; wissenseintraege: Tables<'wissenseintrag'>[];
}
export function buendelLeer(): Buendel;
export function versionReicht(appVersion: string, minClientVersion: string): boolean; // Semver ohne Build-Teil

// src/daten/schreibfehler.ts
export type Fehlerart = 'kein_netz' | 'abgelehnt' | 'fehler';
export function fehlerEinordnen(fehler: unknown): { art: Fehlerart; code: string; meldung: string };

// src/daten/schreiben.ts
export type SchreibErgebnis =
  | { stand: 'gespeichert'; id: string; wiederholt: boolean }
  | { stand: 'ungueltig'; grund: string; einzelheiten?: string[] }
  | { stand: 'kein_netz' }
  | { stand: 'abgelehnt'; code: string; meldung: string }
  | { stand: 'fehler'; code: string; meldung: string };
export interface Schreibkontext extends Erfassungskontext {
  client?: SupabaseClient<Database>;   // Standard: der Client aus supabase.ts; Tests geben einen mit Fake-fetch
  zeitlimitMs?: number;                // Standard 15 000 (A3)
}
export function schreiben<T extends Schreibtabelle>(tabelle: T, eingabe: Eingabe<T>, kontext: Schreibkontext): Promise<SchreibErgebnis>;
export function stornieren(tabelle: Schreibtabelle, id: string, grund: Database['public']['Enums']['storno_grund'],
  kontext: Omit<Schreibkontext, 'clientId'>): Promise<SchreibErgebnis>;
export function schreibenFolge(schritte: Array<(vorherige: string[]) => [Schreibtabelle, Eingabe<Schreibtabelle>]>,
  kontext: Omit<Schreibkontext, 'clientId'> & { clientIds: string[] }): Promise<SchreibErgebnis[]>;
// bricht beim ersten Nicht-Erfolg ab; eine Wiederholung schreibt die fertigen Zeilen idempotent erneut (E1, E8)

// src/daten/buendel.ts
export type BuendelErgebnis =
  | { stand: 'geladen'; buendel: Buendel; standZeit: Date }
  | { stand: 'kein_netz' } | { stand: 'fehler'; meldung: string };
export function buendelLaden(kontext: { jetzt: Date; appVersion: string; client?: SupabaseClient<Database> }): Promise<BuendelErgebnis>;
export function buendelLesen(): Promise<{ buendel: Buendel; standZeit: Date; appVersion: string } | undefined>;
export function buendelSpeichern(buendel: Buendel, standZeit: Date, appVersion: string): Promise<void>;

// src/ui/erfassungZustand.ts (reiner Automat, E2)
export type ErfassungsZustand<E> = { eingabe: E; clientId: string | undefined; ergebnis: SchreibErgebnis | undefined; sendet: boolean };
export type ErfassungsAktion<E> = { art: 'eingabe'; eingabe: E } | { art: 'senden'; clientId: string }
  | { art: 'ergebnis'; ergebnis: SchreibErgebnis } | { art: 'neu' };
export function erfassungsZustand<E>(z: ErfassungsZustand<E>, a: ErfassungsAktion<E>): ErfassungsZustand<E>;
// 'eingabe' löscht clientId und ergebnis; 'senden' setzt clientId nur, wenn keine da ist
```

Die Masken rufen `schreiben(tabelle, eingabe, { jetzt: new Date(), zeitzone: ZEITZONE, appVersion: APP_VERSION, clientId })` auf; `clientId` kommt aus `crypto.randomUUID()` im Automaten (`senden`).

## Datenfluss

**Schreiben online.** Maske → `erfassungsZustand('senden')` (UUID) → `schreiben()`: `erfassungVorbereiten()` → `client.from(tabelle).upsert(zeile, { onConflict: 'client_id', ignoreDuplicates: true }).select('id').abortSignal(…)` → Antwort mit Zeile: `gespeichert, wiederholt: false`; leere Antwort: `select('id').eq('client_id', …)` → `gespeichert, wiederholt: true` → Maske zeigt «Gespeichert» (mit `wiederholt`: «Gespeichert, war schon da») → `useBuendel().nachSchreiben()` lädt das Bündel neu (04 Abschnitt 4.2: nach jedem erfolgreichen Schreiben).

**Schreiben ohne Netz oder mit verlorener Antwort (TO8, TO2).** Fetch wirft oder das Zeitlimit greift → `kein_netz` → Hinweis «Kein Netz, nicht gespeichert, erneut senden» (`Notice` `danger`, `role="alert"`, Wortlaut aus 05 Abschnitt 5) mit Knopf «Erneut senden»; die Eingaben und die UUID bleiben. Wiederholung sendet dieselbe `client_id`; hatte der Server beim ersten Mal gespeichert, ignoriert er das Duplikat (E1), und die Maske meldet «Gespeichert».

**Abgelehnt (4xx).** Hinweis «Nicht gespeichert: <Meldung>» mit «Als Text kopieren» (Tabelle, Felder, Zeitpunkt als Text über `navigator.clipboard.writeText`, zusätzlich sichtbar in einem schreibgeschützten Feld); kein stilles Verwerfen (Konzept 11.4). Der Eintrag bleibt in der Maske stehen; die Ablage «in Heute» aus 11.4 kommt mit der Warteschlange (Nicht-Ziel).

**Lesen beim Start.** `useBuendel()`: 1. `buendelLesen()` aus IndexedDB → Heute zeigt sofort «Stand: hh:mm» (`standText(standZeit, jetzt, zeitzone)`); 2. `buendelLaden({ jetzt })` parallel über `Promise.all` der Quellen (RLS filtert, `messung` mit `gilt_ab >= jetzt − 14 Tage`, `storniert_am is null` überall); Erfolg → `buendelSpeichern()` und neuer Stand; `kein_netz` → alter Stand bleibt, dazu Hinweis «Kein Netz, Stand hh:mm» nur, wenn kein Bündel besteht («Kein Netz, noch keine Daten»). 3. `versionReicht(APP_VERSION, einstellung.min_client_version)` falsch → Hinweis «Aktualisieren», Erfassung gesperrt (E12).

**Lesen ohne Netz (TO6).** Service Worker liefert die App-Shell aus dem Precache, `useBuendel()` liest das Bündel aus IndexedDB; der Ladeversuch scheitert still und lässt den Stand stehen. Keine API-Antwort liegt je im Service-Worker-Cache.

## Bündel: Speicherort und Format

- IndexedDB `hydrovisor`, Version 2, Speicher `buendel` (keyPath `schluessel`), genau ein Datensatz:
  `{ schluessel: 'aktuell', standZeit: '<ISO UTC>', appVersion: '<APP_VERSION>', inhalt: Buendel }`.
- `standZeit` ist die Gerätezeit beim erfolgreichen Laden; die Anzeige rechnet mit `standText()` in `Europe/Zurich`.
- Der Datensatz wird in einer Transaktion ersetzt (`put`); Teilstände gibt es nicht. Unbekannte Schlüssel in `inhalt` werden beim Lesen durch `buendelLeer()` ergänzt (additiv für spätere Pakete).
- Version 2 legt nur den neuen Speicher an; `ablaeufe` bleibt unberührt. `onblocked` (zweiter Tab mit alter Version) meldet «Schliesse die andere Hydrovisor-Ansicht» (A4).
- `datenart_loeschen()` betrifft das Bündel nicht; nach einem Demo-Löschen lädt der nächste Start neu.

## Idempotenz, Fehler und Konflikte

- Idempotenz: `client_id` ist in jeder Erfassungstabelle `unique`; `on conflict (client_id) do nothing` (E1). Ein Vorgang mit mehreren Zeilen (`schreibenFolge`) ist je Zeile idempotent; nach einem Abbruch wiederholt die Maske den ganzen Vorgang mit denselben UUIDs, fertige Zeilen werden ignoriert, die `id` der Vorzeile kommt aus dem Nachlesen (E8). Diese Funktion braucht in diesem Paket nur Unit-Tests; der erste Aufrufer ist I1a-04 (Belegung und `gefaess_erfasst`).
- Konflikte zwischen Geräten gibt es nicht (ein Nutzer, ein Gerät); ein Konflikt zwischen Client und Server ist nur die Wiederholung, und die ist durch E1 entschieden: der Server behält die erste Fassung. Eine inhaltliche Korrektur ist Storno plus neue Zeile mit `ersetzt_id` (Konzept 8.1 Regel 2 und 3), nie ein Update fachlicher Felder.
- Zeitlimit: `AbortController` 15 s je Aufruf (A3) → `kein_netz`; der Server kann in diesem Fall gespeichert haben, genau dafür gilt TO2.
- `erfasst_am` setzt die Datenbank; `client_zeit` ist die Gerätezeit; `gilt_ab` ist der fachliche Zeitpunkt (Standard `jetzt`, Rückdatierung erlaubt, Zukunft über 5 min nicht, A2). `nacherfasst` rechnet die Datenbank.
- Format der Vorversion (04 Abschnitt 8): `schreiben()` sendet nur Felder, die der Typ `TablesInsert<T>` kennt; eine ältere App sendet also nie unbekannte Spalten, und neue Spalten sind nullable. Zusätzlich `min_client_version` (E12).

## RLS und Sicherheit

- Alle Aufrufe laufen mit dem Publishable Key und Tims Token als `authenticated`; `tim_einfuegen` (`with check (ist_tim())`) prüft jede neue Zeile, `tim_aendern` den Storno. `on conflict do nothing` prüft das Duplikat über den Unique-Index, ohne eine fremde Zeile zu lesen; die Nachlese über `client_id` sieht nur Tims Zeilen.
- Keine neue Datenbankfunktion, kein `security definer`, keine Policy-Änderung, kein neuer Grant. Die Regel «`security definer` ohne eigene Prüfung entzieht `EXECUTE`» ist nicht berührt; pgTAP `00_zugriff` bleibt die Schleife über alle Tabellen.
- `messgeraet` hat keine `tim_einfuegen`-Policy (nur ändern); der Datenpfad legt kein Messgerät an, die pH-Kontrolle nimmt das Gerät aus dem Bündel.
- Datenart (8.1 Regel 7): Die pH-Kontrolle ohne Platz trägt `messung.datenart`; in diesem Paket ohne Anlagenauswahl `echt` als Standard, sobald das Bündel eine aktive Anlage der Datenart `demo` oder `test` als einzige Anlage enthält, deren Datenart (A5, Frage F2). Kalibrier-Fälligkeit und Auswertungen filtern serverseitig weiter nach `echt`.
- Der Bündel-Inhalt liegt unverschlüsselt in IndexedDB des Chrome-Profils, wie die Sitzung selbst (Konzept 11.1 «Chrome-Daten nie löschen»); keine Personendaten darin (`telefon_vertretung` aus `einstellung` wird nicht ins Bündel übernommen, A6).

## AK

| AK | Prüfart | Fundstelle | Test (Name beginnt mit der AK-Nummer) |
|---|---|---|---|
| UC9-AK8 | E2E | Use Cases F4 UC9 (8); Konzept 11.4; 06 Abschnitt 7 | `UC9-AK8 TO2 Server speichert, Antwort verworfen, Wiederholung → genau 1 Datensatz (client_id)`; `UC9-AK8 TO8 Speichern ohne Netz → «Kein Netz, nicht gespeichert, erneut senden», Eingaben bleiben` |
| TO2 | E2E | 06 Abschnitt 7, Konzept 11.4 | wie oben; dazu [SQL] `TO2 zweimal derselbe client_id → genau 1 Zeile` (Serverseite) |
| TO6 | E2E | 06 Abschnitt 7, 04 Abschnitt 4.2 | `TO6 Heute online laden, offline neu laden → sichtbar mit «Stand: hh:mm»` |
| TO8 | E2E | 06 Abschnitt 7, 05 Abschnitt 5 | wie UC9-AK8 (zweiter Test) |

## Testliste

Injizierte Uhr überall, wo Zeit vorkommt (`jetzt` als `Date`-Parameter, Zeitzone `Europe/Zurich`); im E2E die Browserzeit mit `timezoneId: 'Europe/Zurich'` aus `playwright.config.ts`.

**Unit (Vitest, `tests/unit/`)**

- `zeit.test.ts`: `kalendertag` 2027-01-05T23:30Z → `2027-01-06`; 2027-03-28T00:30Z (Sommerzeitwechsel) → `2027-03-28`; `uhrzeit` 2027-01-05T23:30Z → `00:30`; `standText` gleicher Tag → «Stand: 00:30», Vortag → «Stand: 5.1. 23:30»; Gegenprobe mit Zeitzone `UTC` liefert andere Werte.
- `erfassung.test.ts`: `messung` erhält `client_id`, `app_version`, `client_zeit = jetzt`, `gilt_ab = jetzt`; vorgegebenes `gilt_ab` (Rückdatierung) bleibt; `gilt_ab` = jetzt + 6 min → `gilt_ab_zukunft`, jetzt + 4 min erlaubt; `anlage` erhält nur `client_id` und `app_version` (keine Zeitachse); nie `erfasst_am`, `nacherfasst`, `storniert_am`, `id` in der Zeile; `ereignis` mit falschen `daten` → `ereignis_daten`; leere Eingabe → `leer`; Typprobe `satisfies TablesInsert<'messung'>` (Compile-Zeit).
- `ereignis.test.ts` (F5): je Typ aus `EREIGNIS_DATEN` ein Fall mit vollständigen Daten → ok; `keimung` ohne `samen_gesaet` → `fehlend`; `beobachtung` mit Schlüssel `foto` → `unbekannt`; `beobachtung.text` über 200 Zeichen → fehlend/ungültig (A7); `sonde_gereinigt` ohne `datenart` → fehlend; `gefaess_erfasst` mit `{}` → ok; `phase_antwort.antwort` ausserhalb `ja|noch_nicht|problem` → ungültig; die Tabelle deckt jeden Wert des Enums `ereignis_typ` (Typprobe `Record<EreignisTyp, …>`).
- `buendel.test.ts`: `versionReicht('0.1.0+abc1234', '0.1.0')` wahr, `('0.1.0+x', '0.2.0')` falsch, `('0.10.0', '0.9.0')` wahr (numerisch, nicht lexikalisch); `buendelLeer()` hat jeden Schlüssel des Typs; `buendelLaden` mit Fake-`fetch`: fragt `messung` mit `gilt_ab=gte.<jetzt − 14 d>` und `storniert_am=is.null` ab, lässt `telefon_vertretung` weg (A6), liefert `kein_netz` bei Fetch-Fehler und `fehler` bei 500, ohne zu speichern.
- `schreibfehler.test.ts`: `TypeError('Failed to fetch')` → `kein_netz`; `DOMException` `AbortError` → `kein_netz`; PostgrestError `42501` (RLS) → `abgelehnt`; `23514` (Check) → `abgelehnt`; `22P02` (Enum) → `abgelehnt`; `23505` (Unique ausser `client_id`) → `abgelehnt`; Status 503 → `fehler`; Status 401 → `fehler` (Token erneuert supabase-js); Unbekanntes → `fehler` mit Meldung.
- `schreiben.test.ts` (Client mit Fake-`fetch` über `createClient(url, key, { global: { fetch } })`): Anfrage ist `POST /rest/v1/messung` mit Header `Prefer` ∋ `resolution=ignore-duplicates` und `return=representation`, Body enthält `client_id`, `app_version`, `client_zeit`, `gilt_ab`, nie `erfasst_am`; Antwort `[{id}]` → `gespeichert, wiederholt: false`; Antwort `[]` → zweite Anfrage `GET …?client_id=eq.…` → `gespeichert, wiederholt: true`; Fetch wirft → `kein_netz`, kein zweiter Versuch von selbst; 400 → `abgelehnt` mit Code; `ungueltig` sendet nichts; Zeitlimit 10 ms mit hängendem Fetch → `kein_netz`; `stornieren` sendet `PATCH …?id=eq.…` mit `storniert_am = jetzt` und `storno_grund`, sonst nichts; `schreibenFolge` schreibt in Reihenfolge, gibt die `id` der Vorzeile weiter, bricht nach `kein_netz` ab und wiederholt mit denselben `clientIds`.
- `erfassungZustand.test.ts`: `senden` ohne UUID setzt sie; `senden` mit UUID behält sie; `eingabe` löscht UUID und Ergebnis; `ergebnis gespeichert` hebt `sendet` auf; `neu` setzt alles zurück.
- `router.test.ts`: `#/messen/geraet` → `{ name: 'messen', code: 'geraet' }`; unbekannter Code → Heute (A8); ohne Sitzung → Anmeldung.

**SQL (pgTAP, `supabase/tests/database/09_schreibweg_client.test.sql`, als `authenticated` mit Tims `sub`)**

- `TO2 zweimal derselbe client_id → genau 1 Zeile` auf `messung` (pH-Kontrolle) und `ereignis` (`sonde_gereinigt`), `insert … on conflict (client_id) do nothing`.
- `TO2 Wiederholung mit anderem Inhalt lässt die erste Zeile unverändert` (do nothing, kein Update).
- `Storno setzt storniert_am und storno_grund als Tim; delete entfernt 0 Zeilen` (keine Delete-Policy).
- `anon: Upsert auf messung scheitert, select liefert 0 Zeilen` (ergänzt `00_zugriff`).
- `nacherfasst ist gesetzt, wenn gilt_ab mehr als 2 h vor erfasst_am liegt` (generierte Spalte, Rückdatierung).

**E2E (Playwright, Chromium, 360 × 640, Produktions-Build; `tests/e2e/datenpfad.spec.ts`)**

Hilfe `restNachbilden(page, lage)` in `hilfen.ts`: `page.route('http://127.0.0.1:54321/rest/v1/**')`; GET auf Bündel-Quellen liefert `[]`, `messgeraet` eine Zeile, `einstellung` eine Zeile mit `min_client_version '0.0.0'`; POST auf `messung` speichert den Body je `client_id` in einer Map und antwortet nach `lage` (`ok`, `antwortVerlieren` = speichern und `route.abort('connectionreset')`, `keinNetz` = `route.abort('internetdisconnected')`, `ablehnen` = 400 mit PostgREST-Fehler); Duplikat → 201 `[]`; GET `messung?client_id=eq.…` liefert die gespeicherte Zeile. Sitzung und Auth wie in `anmeldung.spec.ts`.

- `UC9-AK8 TO2 Server speichert, Antwort verworfen, Wiederholung → genau 1 Datensatz (client_id)`: `#/messen/geraet`, pH `7.02`, «Speichern» → Hinweis «Kein Netz, nicht gespeichert, erneut senden», Feld zeigt `7.02`; «Erneut senden» → «Gespeichert»; Map hat genau 1 Eintrag, beide Anfragen tragen dieselbe `client_id` und `Prefer` mit `resolution=ignore-duplicates`; Body enthält `messart: 'ph_kontrolle'`, `platz_id` null, `app_version` = Wert aus `version.json` (Kurzhash), `client_zeit` und `gilt_ab` innerhalb ±2 min der Testzeit.
- `UC9-AK8 TO8 Speichern ohne Netz → «Kein Netz, nicht gespeichert, erneut senden», Eingaben bleiben`: Lage `keinNetz` → `role="alert"` mit dem Wortlaut, Feld behält `7.02`, kein Eintrag in der Map, Knopf «Erneut senden» sichtbar; danach Lage `ok` → «Gespeichert», Map 1.
- `TO6 Heute online laden, offline neu laden → sichtbar mit «Stand: hh:mm»`: Heute laden, Service Worker steuert (wie in TO7), `getByTestId('buendel-stand')` passt auf `/^Stand: \d{2}:\d{2}$/`, Wert merken; `context.setOffline(true)` und zusätzlich alle `127.0.0.1:54321/**` mit `internetdisconnected` abbrechen; `page.reload()` → Heute sichtbar, derselbe Stand-Text, kein `role="alert"`; IndexedDB `buendel` hat den Schlüssel `aktuell`.
- `Abgelehnte Erfassung bleibt sichtbar mit «Als Text kopieren»`: Lage `ablehnen` (Code `23514`) → Hinweis «Nicht gespeichert», Knopf «Als Text kopieren», schreibgeschütztes Feld enthält `7.02` und `ph_kontrolle`; Eingaben bleiben.
- `Eingabe ändern nach Fehler erzeugt eine neue client_id`: Lage `keinNetz`, Speichern, pH auf `7.05` ändern, Lage `ok`, Speichern → Map 1 Eintrag mit `ph 7.05` und anderer `client_id` als der erste Versuch (aus den aufgezeichneten Anfragen).
- `Alte App: min_client_version grösser → «Aktualisieren», Erfassung gesperrt` (E12).

**Bericht für die AK-Abdeckung.** Vitest `reports/vitest.json`, Playwright `reports/playwright.json`, pgTAP `reports/pgtap.txt`; die Namen tragen `UC9-AK8`, `TO2`, `TO6`, `TO8` als ganze Wörter (Regel `nennt()` in `scripts/ak-abdeckung-regeln.ts`).

## Mutationsziel

- `stryker.config.json` und `scripts/mutation.mjs` bleiben; `rechner`, `zielbereich`, `aufgaben` entstehen in I1b-02 und I1b-03, dort gilt 80 % im Prüftor. Dieses Paket legt kein Modul in diesem Geltungsbereich an; `npm run test:mutation` endet weiterhin mit der Warnung.
- Für `src/domain/zeit.ts`, `erfassung.ts`, `ereignis.ts`, `buendel.ts` und `src/daten/schreibfehler.ts` läuft der Lead einmal `npx stryker run --mutate "src/domain/{zeit,erfassung,ereignis,buendel}.ts,src/daten/schreibfehler.ts"` und schreibt den Wert in den Pull Request; Ziel 80 %, unter 80 % ergänzt der Testentwickler Gegenproben vor der Prüferrunde (E11). Die Unit-Tests oben sind so gewählt, dass jeder Zweig (Grenze 5 min, 14 Tage, 200 Zeichen, Semver-Vergleich, jede Fehlerklasse) eine Gegenprobe hat.

## Ablauf und Rollen

1. Planfreigabe (Label `plan-frei`), Fragen F1 und F2 beantwortet.
2. Risikotest des Leads vor dem Code (10 Minuten, lokal): `supabase start`, als `authenticated` ein Upsert mit `Prefer: resolution=ignore-duplicates,return=representation` zweimal gegen `messung` → zweite Antwort `201 []`. Scheitert das (zum Beispiel 409), entsteht kein Code; zuerst Frage an Tim, ob der Rückfall `merge-duplicates` mit den Feldern `client_id` und `app_version` als einzigen Update-Spalten gelten soll.
3. Testentwickler: rote Tests im eigenen Commit `Tests: I0-04 Datenpfad (#11)`, Dateien in `tests/testentwickler.txt`; die Fixtures der REST-Nachbildung orientieren sich an `datenbank.types.ts`.
4. Lead in dieser Reihenfolge: `zeit.ts`, `erfassung.ts`, `ereignis.ts`, `buendel.ts` (Domäne) → `lokal.ts` Version 2, `buendel.ts` (Daten) → `schreibfehler.ts`, `schreiben.ts` → `useBuendel()`, Automat, Maske, Heute, Info, Router → E2E grün → pgTAP grün → lokaler Stryker-Lauf (E11).
5. Zwei Prüfer parallel als Team (Kern-Paket, Konzept 12.1): Plan-Code-Abgleich, besonders E1, E2, E8 und der RLS-Abschnitt; höchstens zwei Runden.
6. Vorschau: Lead startet `dev-seed.yml` (Entscheid 0005, 0007), falls `messgeraet` in `hydrovisor-dev` fehlt; Pull Request mit Label `abnahme-wartet`.

## Tims Handgriffe und Abnahme

- Kein Secret, keine Migration, kein Schlüssel.
- Abnahme 1 (Vorschau, Honor, rund 10 Minuten): Heute zeigt «Stand: hh:mm»; Flugmodus ein, Heute neu laden → Stand sichtbar; `#/messen/geraet`, pH `7.00`, Speichern im Flugmodus → Hinweis, Eingabe bleibt; Flugmodus aus, «Erneut senden» → «Gespeichert»; in Supabase `hydrovisor-dev` genau eine Zeile mit dieser `client_id` (Lead liest sie über MCP und nennt sie im Kommentar).
- Abnahme 2 (installierte App): Info zeigt Version und Datenstand; Flugmodus und Heute mit Stand. Eine pH-Kontrolle in der Produktion ist eine echte Erfassung (Datenart `echt`); Tim entscheidet, ob er sie am Gerät ausführt oder nur Heute prüft (Frage F2).

## Produktion und Kurzzusammenfassung (Vorlage für den Merge)

Der Merge löst `deploy.yml` aus: keine neue Migration (Job `migration` findet keine Datei nach dem Tag `letzte-migration`), Seed als Trockenlauf, Pages-Deploy, Rauchtest mit Rückfall. Wirkung auf Supabase: keine. Vorschau: Cloudflare baut den Zweig mit dem Dev-Projekt. Andere Zweige: `pr.yml` unverändert; I0-07 baut auf `schreiben()`, `useBuendel()` und der Maske auf; die Testhilfe `restNachbilden()` steht allen E2E zur Verfügung.

## Risiken

| Risiko | Folge | Gegenmassnahme |
|---|---|---|
| PostgREST antwortet beim ignorierten Duplikat anders als erwartet (nicht `201 []`) | `schreiben()` meldet Fehler statt «Gespeichert» | Risikotest in Schritt 2 vor dem Code; Nachlese über `client_id` ist unabhängig vom Statuscode; pgTAP prüft die Datenbankseite |
| Chrome lässt einen Fetch bei totem WLAN minutenlang hängen | Maske wirkt eingefroren | Zeitlimit 15 s mit `AbortController` → `kein_netz`; Knopf gesperrt mit `aria-busy` während des Sendens |
| `context.setOffline(true)` und Service Worker im E2E flackern | TO6 rot ohne Fehler im Code | Vorgehen aus TO7 (Service Worker steuert, Warten auf Zustände statt Zeiten); zusätzlich `route.abort` auf die API; Tests seriell |
| IndexedDB-Versionswechsel blockiert durch zweiten Tab | Bündel nicht lesbar | `onblocked` → Hinweis; Fallback: Heute ohne Stand mit Hinweis «Daten nicht lesbar»; ein Nutzer, ein Gerät |
| Typbindung `createClient<Database>` macht bestehende Aufrufe rot | `typecheck` scheitert | nur `auth` ist bisher in Gebrauch; Typen stammen aus I0-03 und bleiben unverändert |
| `hydrovisor-dev` ohne Messgerät | Abnahme 1 ohne Erfassung | `dev-seed.yml` vor der Abnahme; Maske zeigt «Messgerät fehlt» statt zu scheitern |
| Bündel wächst mit dem Testbetrieb (Messungen 14 Tage, Wissenseinträge) | langsamer Start, UC8-AK9 (2 s) gefährdet | Quellen parallel, Filter serverseitig; Messgrösse im Pull Request (Byte des Datensatzes mit Demo-Daten) als Ausgangswert für I1b |
| Ein zweiter Planer entscheidet E1 anders (merge statt do nothing) | spätere Pakete bauen auf unterschiedlichen Annahmen | Entscheid steht mit Begründung in diesem Plan; der gewählte Plan wird `docs/plaene/11.md` |

## Nicht-Ziele

- Warteschlange, Zustände `wartet`/`gesendet`/`fehlgeschlagen`, TO1, TO3, TO4, TO5, Anzahl wartender Einträge in Heute, Ablage abgelehnter Einträge in Heute (Q14 nach dem Gerätetest).
- Messmaske mit Kacheln, Ziffernblock, Bewertung, Trend, Füllstand (I0-07, DS-01, I1b-01); Kalibrierung und Fälligkeiten (I0-07, I1b-02); Aufgaben aus dem Bündel (`faelligeAufgaben()`, I1b-02).
- Rückgängig-Knopf in der Oberfläche (U4) und Verlauf; `stornieren()` entsteht als Funktion mit Unit- und pgTAP-Test, die Oberfläche folgt mit I0-07.
- Anlagenauswahl, Thema aus `einstellung.thema`, Einrichtungs-Checkliste (I1a-01).
- Fortsetzen von Abläufen im Router (04 Abschnitt 4.3), Wake Lock, Push.
- Änderungen an `supabase/migrations`, am Service Worker, an `stryker.config.json` und an den Workflows.

## Annahmen (A)

1. `standText()`: gleicher Kalendertag in Zürich → «Stand: hh:mm» (Wortlaut TO6); anderer Tag → «Stand: T.M. hh:mm», damit ein alter Stand nicht wie heute aussieht. Fundstelle: 06 Abschnitt 7 nennt nur «hh:mm».
2. `gilt_ab` höchstens 5 Minuten nach `jetzt` (Uhrabweichung); Rückdatierung unbegrenzt (Nacherfassung nach Konzept 11.7 «Aussaat auch ohne App»).
3. Zeitlimit 15 s je Schreibaufruf; die KI-Regel in 11.3 kennt 20 s für einen Aufruf, für eine Erfassung am Regal ist 15 s die obere Grenze, bevor Tim «erneut senden» tippt.
4. Hinweistext bei `onblocked`: «Schliesse die andere Hydrovisor-Ansicht und lade neu» (eigener Text nach 05 Abschnitt 5, Du-Form).
5. Datenart der pH-Kontrolle ohne Anlagenauswahl: `echt`, ausser das Bündel enthält genau eine aktive Anlage und sie ist `demo` oder `test` (Vorschau mit Demo-Daten). Fundstelle: R10.3 «Datenart der gewählten Anlage»; die Auswahl selbst fehlt bis I1a. Frage F2.
6. `einstellung.telefon_vertretung` gehört nicht ins Bündel (Annahme 12 in `00_rueckfragen.md`: keine Personendaten ausserhalb der Datenbank); das Vertretungsblatt (I1b-07) liest das Feld direkt.
7. `beobachtung.text` höchstens 200 Zeichen nach dem Tabellenkommentar von `ereignis`; die übrigen Schlüssel je Typ wörtlich aus demselben Kommentar (A4 der Migration).
8. Route `#/messen/:code` nimmt in diesem Paket nur `geraet`; andere Codes führen nach Heute, bis I0-07 die Messung am Platz baut.
9. Das Feld pH ist bis I0-07 ein `TextField` mit `inputmode="decimal"` (Systemtastatur) auf einer Maske mit `data-density="regal"`; Abweichung von «keine Systemtastatur» (CLAUDE.md, Oberfläche) nur für diese Übergangsmaske, weil der Ziffernblock-Baustein erst mit DS-01/I0-07 im Code entsteht. Frage F1.
10. Der Link «pH-Kontrolle erfassen» in Heute ist ein Übergang bis I1b-05 (Heute mit Karten); dann hängt die pH-Kontrolle an der Aufgabe (R5.2).

## Fragen an Tim (zur Planfreigabe)

- F1 Erste Erfassung = pH-Kontrolle am Messgerät als Übergangsmaske mit Systemtastatur bis I0-07 (E5, A9), einverstanden? Alternative: Paket ohne Maske, TO2 und TO8 erst mit I0-07 prüfbar (verschiebt zwei AK dieses Pakets).
- F2 Datenart der pH-Kontrolle ohne Anlagenauswahl `echt` (A5), einverstanden? Alternative: Maske in der Produktion gesperrt, bis eine Anlage besteht (I1a-02); in der Vorschau mit Demo-Anlage nutzbar.

## Prüfung gegen `CLAUDE.md`

| Regel | Einhaltung |
|---|---|
| Ereignisse führen | `schreiben()` fügt nur ein; kein Update fachlicher Felder; Storno = `storniert_am` plus neue Zeile mit `ersetzt_id`; `cache_geschuetzt` bleibt unberührt |
| `jetzt` als Parameter | E3; `new Date()` nur in `MessenGeraet.tsx`, `Heute.tsx`, `buendel.tsx` |
| `src/domain/` rein | `zeit.ts` nutzt `Intl` (in Browser und Deno vorhanden), keine Importe ausserhalb `src/domain/`, Endung `.ts` |
| Ein Schreibweg | alle Erfassungen über `schreiben()` mit Client-UUID und Upsert; die Maske ist der erste Aufrufer |
| Additive Migrationen | keine Migration; IndexedDB-Version 2 nur mit neuem Speicher |
| RLS, `security definer` | keine neue Funktion, keine Policy-Änderung; pgTAP ergänzt Upsert und Storno als Tim und anon |
| Datenart echt | pH-Kontrolle mit `datenart`; Sichten filtern serverseitig; A5 offen (F2) |
| Zahlen | pH als `numeric(4,2)` gesendet (String mit zwei Dezimalen); EC-Hundertstel betreffen dieses Paket nicht |
| Oberfläche | Regal-Maske `data-density="regal"`, Texte Du-Form, Buttons mit Verb («Speichern», «Erneut senden», «Als Text kopieren»), kein Ausrufezeichen, Wortlaut «Kein Netz, nicht gespeichert, erneut senden» aus 05 Abschnitt 5; Systemtastatur als Übergang (A9) |
| Namen | `schreiben`, `stornieren`, `buendelLaden`, `standText`, `erfassungVorbereiten`, `ereignisDatenPruefen` (deutsch, camelCase, ohne Umlaute) |
| Sperren | keine Workflows, keine Secrets, Supabase nur lokal und `hydrovisor-dev` über MCP (lesend für die Abnahme) |
