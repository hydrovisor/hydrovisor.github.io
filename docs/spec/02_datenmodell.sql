-- =====================================================================
-- 02_datenmodell.sql · Migrationsentwurf Datenmodell (Konzept v1.2, Kapitel 8)
-- Stand 1.11.2026 · Auftrag 2 «Spezifikation»
--
-- Entwurf, kein lauffähiger Migrationsstand: Die erste echte Migration
-- entsteht im Kern-Paket «Datenmodell mit Zugriffsregeln» (I0) aus diesem
-- Entwurf. Der Entwurf ist gegen PostgreSQL 17 mit Stubs für auth.users und
-- auth.uid() syntaktisch geprüft (siehe 06_tests.md, Abschnitt Datenmodell).
--
-- Grundregeln (Konzept 8.1):
--   1 id uuid als Primärschlüssel; fachliche Kennungen sind Attribute,
--     eindeutig nur unter aktiven Zeilen (Teilindex).
--   2 Ereignisse führen; Zustände sind Sichten oder ein Cache, den nur eine
--     Datenbankfunktion schreibt.
--   3 Zwei Zeitachsen: erfasst_am (Server) und gilt_ab (fachlich); Storno statt
--     Löschen; client_id für idempotente Upserts.
--   4 Wissen wird versioniert (gueltig_ab, gueltig_bis), nie überschrieben.
--   5 Einheiten: pH numeric(4,2), EC numeric(5,3) mS/cm, °C numeric(3,1),
--     Längen smallint in mm, Volumen numeric(5,2) in l, Mengen numeric(6,2) ml.
--   6 RLS auf jeder Tabelle über public.ist_tim().
--
-- Abweichungen vom Konzept-Schema, als Annahme (A) markiert:
--   (A1) art und sorte sind versioniert; damit andere Tabellen stabil auf sie
--        verweisen können, gibt es je einen Ankereintrag art_schluessel und
--        sorte_schluessel (eine Zeile je Art bzw. Sorte, nie versioniert).
--   (A2) netztopf verweist auf den Heim-Platz (heim_platz_id) statt auf die
--        Belegung gefaess, weil gefaess bei jeder Änderung von Betriebsart
--        oder Volumen eine neue Zeile erhält (8.2 gefaess).
--   (A3) art erhält name_de (Entscheid W13) und kulturform_vorgabe (R1.2).
--   (A4) Ereignis-spezifische Felder stehen in ereignis.daten (jsonb); die
--        erlaubten Schlüssel je Typ stehen im Kommentar und werden per pgTAP
--        geprüft.
--   (A5) v_zielbereich liefert nur den Zweck «Bewertung heute»; die übrigen
--        Zwecke aus R2.2 rechnet src/domain (reine Funktionen, Konzept 7).
--   (A6) Statt v_leitkultur(gefaess_id) gibt es v_leitkultur_gewaehlt (Tims
--        Wahl bei Gleichstand); die Leitkultur selbst rechnet src/domain (R2.3).
--   (A7) Caches (8.1 Regel 2): gefaess.status und messung.unsicher entfallen,
--        die Sichten v_gefaess_status und v_messung_unsicher genügen bei einem
--        Nutzer. satz.saatdatum und reservierung.umsetzen_geplant_am bleiben
--        Cache und werden nach dem Einfügen nur von cache_aus_ereignis()
--        geändert (Trigger cache_geschuetzt verhindert direkte Änderungen).
--   (A8) Backup über die Rolle backup_leser mit BYPASSRLS und nur SELECT;
--        backup_status schreibt sie über backup_status_melden() (11.7).
--        Erlaubt Supabase BYPASSRLS für eigene Rollen nicht, gilt der
--        Rückfall in 04_architektur.md Abschnitt 9 (Risikotest I0): Lese-
--        Policies backup_lesen für backup_leser, Dump mit Zeilensicherheit.
--   (A9) Ein Tausch zweier Töpfe sind zwei Ereignisse typ tausch, je eines
--        je Topf, mit gemeinsamer daten.vorgang_id.
--   (A10) Demo- und Testdaten löscht datenart_loeschen() mit der Service-Rolle
--        (8.5): Anlage mit Kaskaden, dazu Kalibrierungen, Push-Abos,
--        Ereignisse mit daten.datenart und Etikett-Scans derselben Datenart.
--   (A11) art_neu (UC4) übernimmt Kulturformen, Umsetzfenster, Systemeignung
--        und Keimfähigkeit von der Leitkultur der Kulturgruppe; die Herkunft
--        trägt den Vermerk leitkultur und zeigt «Prüfauftrag» (R1.3).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0 Hilfsfunktionen
-- ---------------------------------------------------------------------

create or replace function public.kalendertag(ts timestamptz)
returns date language sql stable parallel safe
as $$ select (ts at time zone 'Europe/Zurich')::date $$;
comment on function public.kalendertag(timestamptz) is
  'Kalendertag in Europe/Zurich für alle Fälligkeiten (R5.1); die Datenbank läuft in UTC.';

-- ---------------------------------------------------------------------
-- 1 Aufzählungen
-- ---------------------------------------------------------------------

create type public.datenart as enum ('echt', 'demo', 'test');
create type public.standort as enum ('indoor', 'outdoor');
create type public.platz_rolle as enum ('gefaess', 'anzuchtort', 'messstelle', 'lager');
create type public.betriebsart as enum ('dwc', 'konstantpegel', 'kratky_belueftet', 'kratky');
create type public.gefaess_status as enum ('in_pruefung', 'in_betrieb_volumen_offen', 'in_betrieb', 'ruht', 'entfernt');
create type public.luftpumpe as enum ('P1', 'P2', 'P3', 'P4');
create type public.gefaess_form as enum ('rechteckig', 'oval');
create type public.anzuchtort_typ as enum ('box_licht', 'box_dunkel');
create type public.position_vh as enum ('vorne', 'hinten');
create type public.etikett_format as enum ('70x42_3', '55x25');
create type public.thema as enum ('hell', 'dunkel', 'system');
create type public.k_quelle as enum ('startwert', 'becherversuch', 'vorschlag_uebernommen', 'zurueckgesetzt');
create type public.storno_grund as enum ('rueckgaengig', 'korrektur', 'fehleingabe');

create type public.quelle_klasse as enum ('peer_review', 'universitaet_beratung', 'hersteller', 'praxis', 'katalog', 'tuete', 'app');
create type public.system as enum ('dwc', 'kratky', 'nft', 'ebbe_flut', 'substrat_inert', 'keine');
create type public.umgebung as enum ('indoor_led', 'gewaechshaus', 'andere');
create type public.evidenzklasse as enum ('A', 'B1', 'B2', 'C');
create type public.vermerk as enum ('keine', 'katalog', 'tuete', 'testbetrieb', 'leitkultur');
create type public.klasse_saatmenge as enum ('A', 'B', 'C', 'D');
create type public.systemeignung as enum ('dwc', 'kratky', 'beide');
create type public.liter_status as enum ('belegt', 'testbetrieb_offen');
create type public.wuchsform as enum ('aufrecht', 'buschig', 'haengend', 'rosette');
create type public.photoperiode as enum ('langtag', 'kurztag', 'tagneutral');
create type public.pythium as enum ('hoch', 'mittel', 'gering');
create type public.schossen_handlung as enum ('auskneifen', 'ernten_beenden', 'bluete_nutzen');
create type public.kulturform as enum ('keimling', 'babyleaf', 'schnitt', 'kopf', 'dauerkultur_blatt', 'dauerkultur_frucht');
create type public.ernteart as enum ('einmalig', 'mehrfach');
create type public.kulturtyp as enum ('blatt', 'knolle', 'frucht');
create type public.phase as enum ('keimung', 'anzucht', 'wachstum', 'bluete', 'fruchtbildung_reife');
create type public.groesse as enum ('anwendbar', 'dauer', 'bbch', 'wechselmerkmal', 'ph', 'ec', 'licht_h', 'wassertemp', 'keimart', 'keimtemp');
create type public.profil_ebene as enum ('sorte', 'art', 'kulturgruppe', 'standard');
create type public.ec_einheit as enum ('mS/cm', 'µS/cm', 'ppm500', 'ppm700', 'cf');
create type public.ec_basis as enum ('gesamt', 'zuwachs', 'unbekannt');
create type public.wissen_ebene as enum ('art', 'kulturgruppe', 'allgemein');
create type public.wissenseintrag_typ as enum (
  'naehrstoffe', 'duengerkomponenten', 'typischer_fehler', 'mangelbild', 'warnregel', 'ernte',
  'sondenpflege', 'kratky_pegel', 'wurzelfarbe', 'topf_umsetzen', 'boxen_einzeln', 'stromausfall',
  'schossen', 'entspitzen', 'bestaeubung', 'wochenfahrplan');
create type public.stadium as enum ('wurzeln_keimung', 'echte_blaetter', 'wachstum', 'vorbluete', 'bluete_frucht', 'reife');
create type public.herkunft_duenger as enum ('hersteller', 'abgeleitet');

create type public.pflanzvorgang_einstieg as enum ('heute', 'gefaess', 'scan', 'duplizieren', 'nacherfassung');
create type public.einstufung as enum ('empfohlen', 'moeglich', 'nicht_empfohlen');
create type public.messart as enum ('rundgang', 'aufgabe', 'kontrolle_ansatz', 'end_ansatz', 'nachmessen', 'kontrolle_folgetag', 'w', 'frischwasser', 'ph_kontrolle');
create type public.fuellstand as enum ('ueber_drittel', 'unter_drittel');
create type public.bewertung as enum ('gruen', 'knapp', 'ausserhalb');
create type public.ansatz_typ as enum ('neuansatz', 'nachfuellen', 'ph_korrektur', 'teilwechsel');
create type public.ansatz_status as enum ('laufend', 'abgeschlossen', 'abgebrochen');
create type public.mischentscheid as enum ('keiner', 'leitkultur', 'andere_phase', 'kompromiss');
create type public.ansatz_schritt_typ as enum (
  'kalibrierung_pruefen', 'absaugen', 'frischwasser', 'frischwasser_messen', 'gerechnet_fuer',
  'micro', 'spuelen', 'grow', 'bloom', 'umruehren', 'timer', 'ph_einstellen', 'kontrollmessung',
  'restdosis', 'endmessung');
create type public.ereignis_typ as enum (
  'aussaat', 'deckel_geoeffnet', 'abdeckung_entfernt', 'keimung', 'phase_antwort', 'verschieben',
  'umsetzdatum_geaendert', 'umsetzen', 'tausch', 'neu_beschriften', 'ernte', 'kultur_entscheid',
  'schossen_handlung', 'abschluss', 'wiederherstellen', 'kurzpruefung', 'gefaess_erfasst',
  'gefaesspruefung', 'box_deckel_tausch', 'ruhe', 'entfernt', 'geleert', 'gereinigt', 'bestaeubung',
  'leitkultur_gewaehlt', 'sonde_gereinigt', 'als_unsicher_markiert', 'stromausfall', 'aufgabe_erledigt',
  'messung_umgehaengt', 'sollwert_geaendert', 'beobachtung');
create type public.aufschub_art as enum ('morgen', 'ueberspringen', 'pegel_ok');
create type public.push_kanal as enum ('push', 'email');
create type public.push_art as enum ('sammel', 'kurzpruefung_20', 'timer', 'test');
create type public.push_status as enum ('geplant', 'gesendet', 'fehler', 'abgemeldet');
create type public.etikett_ergebnis as enum ('gefunden', 'unbekannt', 'entfernt');
create type public.ki_feld as enum ('name', 'art', 'keimart', 'keimtemperatur', 'keimdauer', 'kulturdauer', 'aussaatfenster', 'hersteller');
create type public.ki_status as enum ('uebernommen', 'geaendert', 'leer');
create type public.ki_bewertung as enum ('richtig', 'falsch', 'fehlend', 'erfunden');

-- ---------------------------------------------------------------------
-- 2 Zugriff (Konzept 11.6)
-- ---------------------------------------------------------------------

create table public.zugang (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  erfasst_am timestamptz not null default now(),
  app_version text not null default 'manuell'
);
comment on table public.zugang is 'Erlaubnistabelle: genau eine Zeile mit Tims Nutzer-ID, von Hand angelegt (11.6).';

create or replace function public.ist_tim()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.zugang z where z.user_id = (select auth.uid())) $$;
comment on function public.ist_tim() is 'true, wenn der angemeldete Nutzer in zugang steht; Grundlage aller Policies (8.1 Regel 6).';

-- ---------------------------------------------------------------------
-- 3 Bereich Anlage
-- ---------------------------------------------------------------------

create table public.anlage (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  name text not null,
  kuerzel text not null check (kuerzel ~ '^[A-Z]{1,3}$'),
  standort public.standort not null default 'indoor',
  datenart public.datenart not null default 'echt',
  aktiv boolean not null default true,
  ec_wasser_annahme numeric(5,3) not null default 0.5 check (ec_wasser_annahme between 0 and 10),
  karbonathaerte_dh numeric(4,1),
  laufweg text[] not null default '{}',
  luefter_einstellung text,
  licht_von time,
  licht_bis time,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz
);
create unique index anlage_kuerzel_aktiv on public.anlage (kuerzel) where storniert_am is null;
comment on table public.anlage is
  'Oberste Ebene (5.1): R (echt), T (später), X (demo), Y (test). Leitungswasser-Annahme gilt bis zur ersten W-Messung; Laufweg als Liste der Kennungen; Kürzel nach dem ersten Etikettendruck fest (Trigger anlage_kuerzel_fest).';

create table public.bereich (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  anlage_id uuid not null references public.anlage (id) on delete cascade,
  nummer smallint not null,
  name text not null,
  standard_betriebsart public.betriebsart,
  lichtleisten smallint,
  lichtstunden numeric(3,1) check (lichtstunden between 0 and 24),
  nutzbare_hoehe_mm smallint check (nutzbare_hoehe_mm > 0),
  gemessen_am date,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz
);
create unique index bereich_nummer_aktiv on public.bereich (anlage_id, nummer) where storniert_am is null;
comment on table public.bereich is
  'Ebene oder Zone (5.1, 5.2). Lichtstunden = Zeitplan der AC10, vorbelegt aus anlage.licht_von/bis; nutzbare Höhe in mm (Startwerte 450, 200, 150, 150), in der Messwoche ersetzt.';

create table public.platz (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  anlage_id uuid not null references public.anlage (id) on delete cascade,
  bereich_id uuid references public.bereich (id) on delete cascade,
  kennung text not null,
  rolle public.platz_rolle not null,
  position smallint,
  aktiv boolean not null default true,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz
);
create unique index platz_kennung_aktiv on public.platz (anlage_id, kennung) where aktiv and storniert_am is null;
comment on table public.platz is
  'Ort mit Kennung (2.3, 4.4, A1 bis A4, W) und Rolle; Aufgaben, Messungen und Ansätze hängen am Platz (Ort). Die Kennung ist an den Platz gebunden (5.4).';

create table public.etikett (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  code text not null unique,
  platz_id uuid not null references public.platz (id) on delete cascade,
  format public.etikett_format not null default '70x42_3',
  gedruckt_am timestamptz,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz
);
comment on table public.etikett is
  'Etikett-Code R-2.3, unveränderlich; die Kennung gehört zum Platz, das Etikett sitzt physisch am Gefäss und wandert beim Boxtausch mit (5.4, R9.1). Stand nur gedruckt_am.';

create table public.gefaessmodell (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  name text not null,
  form public.gefaess_form not null,
  innen_l_mm smallint not null check (innen_l_mm > 0),
  innen_b_mm smallint not null check (innen_b_mm > 0),
  innen_h_mm smallint not null check (innen_h_mm > 0),
  nennvolumen_l numeric(5,2),
  betriebsvolumen_l numeric(5,2) not null check (betriebsvolumen_l > 0),
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz,
  check (betriebsvolumen_l < innen_l_mm::numeric * innen_b_mm * innen_h_mm / 1000000)
);
comment on table public.gefaessmodell is 'Vorlage Behälter (UC2): Rako-Box oder ovale Wanne; Betriebsvolumen kleiner als L × B × H (R9.3).';

create table public.deckeltyp (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  name text not null,
  topfdurchmesser_mm smallint not null check (topfdurchmesser_mm in (50, 80)),
  loecher_je_reihe smallint[] not null check (array_length(loecher_je_reihe, 1) between 1 and 20 and 0 < all (loecher_je_reihe)),
  service_oeffnung boolean not null default true,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz
);
comment on table public.deckeltyp is
  'Vorlage Deckel oder Pflanzplatte: Löcher je Reihe von vorne nach hinten; Loch 1 vorne links, zeilenweise nummeriert; Randlöcher abgeleitet (8.1 Regel 9). D1, D2, D3, D4, D6, S8, S5.';

create table public.gefaess (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  platz_id uuid not null references public.platz (id) on delete cascade,
  gefaessmodell_id uuid not null references public.gefaessmodell (id),
  deckeltyp_id uuid not null references public.deckeltyp (id),
  betriebsart public.betriebsart not null,
  feste_dosis boolean not null default false,
  luftpumpe public.luftpumpe,
  betriebsvolumen_l numeric(5,2) not null check (betriebsvolumen_l > 0),
  intervall_messen_d smallint not null check (intervall_messen_d between 1 and 60),
  intervall_nachfuellen_d smallint check (intervall_nachfuellen_d between 1 and 60),
  intervall_wechseln_d smallint check (intervall_wechseln_d between 1 and 60),
  naechster_wechsel_am date,
  gueltig_von timestamptz not null default now(),
  gueltig_bis timestamptz,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz,
  check (not feste_dosis or betriebsart = 'konstantpegel'),
  check (betriebsart in ('kratky', 'kratky_belueftet') or intervall_wechseln_d is not null)
);
create unique index gefaess_aktiv_je_platz on public.gefaess (platz_id) where gueltig_bis is null and storniert_am is null;
comment on table public.gefaess is
  'Belegung eines Platzes (8.2). Änderungen an Betriebsart oder Volumen schliessen die Zeile (gueltig_bis) und legen eine neue an, ohne den Prüfstatus zurückzusetzen. Der Prüfstatus ist v_gefaess_status (A7). Stationen = feste_dosis (8.1 Regel 10). Luftpumpe für das Mitmarkieren bei Kurzprüfung-Abweichung (5.3, E6).';

create table public.anzuchtort (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  platz_id uuid not null unique references public.platz (id) on delete cascade,
  typ public.anzuchtort_typ not null,
  platzzahl smallint not null default 25 check (platzzahl between 1 and 100),
  position public.position_vh not null,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz
);
comment on table public.anzuchtort is 'Anzuchtboxen A1 bis A4 (5.8): A1, A2 Lichtkeimer; A3, A4 Dunkelkeimer; je 25 Würfel; ohne Lösung.';

create table public.netztopf (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  anlage_id uuid not null references public.anlage (id) on delete cascade,
  kennung text not null,
  groesse_mm smallint not null check (groesse_mm in (50, 80)),
  heim_platz_id uuid not null references public.platz (id) on delete cascade,
  heim_loch_nr smallint not null check (heim_loch_nr > 0),
  aktiv boolean not null default true,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz,
  constraint netztopf_kennung_aktiv exclude using btree (anlage_id with =, kennung with =)
    where (aktiv and storniert_am is null) deferrable initially deferred
);
comment on table public.netztopf is
  'Topf mit Kennung des Heimplatzes (2.3.4); aktueller Platz ist v_netztopf_platz. Ausschlussregel aufschiebbar für topf_neu_beschriften() (8.2). (A2) Heim über heim_platz_id.';

create table public.messgeraet (
  id uuid primary key default gen_random_uuid(),
  modell text not null,
  einheit text not null default 'mS/cm' check (einheit = 'mS/cm'),
  dezimalen smallint not null default 2,
  u_ec numeric(4,3) not null default 0.10 check (u_ec between 0 and 1),
  u_ph numeric(3,2) not null default 0.10 check (u_ph between 0 and 1),
  messbereich text,
  erfasst_am timestamptz not null default now(),
  app_version text not null
);
comment on table public.messgeraet is 'Aquamaster P160 Pro2, fest mS/cm mit zwei Dezimalen (Q12); u_ec und u_ph aus der Geräteprüfung, Default 0.10 (Kapitel 17).';

create table public.einstellung (
  id uuid primary key default gen_random_uuid(),
  push_zeit time not null default '07:00' check (push_zeit between '05:00' and '22:00'),
  vorlauf_n smallint not null default 2 check (vorlauf_n between 0 and 14),
  kannengroesse_l numeric(4,1) not null default 10 check (kannengroesse_l between 1 and 12),
  messmittel_ml numeric(5,1)[] not null default '{1,5,20,60}',
  messbecher boolean not null default true,
  thema public.thema not null default 'hell',
  pflegebudget_min_werktag smallint not null default 20,
  pflegebudget_h_woche numeric(4,1) not null default 4,
  zeitzone text not null default 'Europe/Zurich',
  min_client_version text not null default '0.0.0',
  feste_kalibriertermine date[] not null default '{2027-01-01,2027-01-31,2027-02-24,2027-03-24}',
  stationsgrenze_ab date not null default '2027-02-04',
  email_rueckfall boolean not null default false,
  telefon_vertretung text,
  erfasst_am timestamptz not null default now(),
  app_version text not null
);
create unique index einstellung_einzeilig on public.einstellung ((true));
comment on table public.einstellung is
  'Genau eine Zeile (UC0 Einstellungen). Thema gilt für die ganze App (E6). telefon_vertretung nur hier, nie im Repository (Annahme 12).';

-- ---------------------------------------------------------------------
-- 4 Bereich Wissen
-- ---------------------------------------------------------------------

create table public.quelle (
  id uuid primary key default gen_random_uuid(),
  quelle_id text not null unique,
  titel text not null,
  autoren text,
  jahr smallint,
  link text not null,
  klasse public.quelle_klasse not null,
  anbaumethode public.system not null,
  abgerufen_am date,
  freigegeben_am date,
  erfasst_am timestamptz not null default now(),
  app_version text not null
);
comment on table public.quelle is 'Quellen aus quelle.csv (03_import_w0.md 4.1); Tüten-Quellen tuete-<sorte> legt der Seed an.';

create table public.art_schluessel (
  id uuid primary key default gen_random_uuid(),
  art_id text not null unique,
  erfasst_am timestamptz not null default now()
);
comment on table public.art_schluessel is '(A1) Anker je Art; art ist versioniert, Verweise zeigen hierher.';

create table public.kulturgruppe (
  id uuid primary key default gen_random_uuid(),
  kulturgruppe_id text not null unique,
  name text not null,
  leitkultur_art_id text not null references public.art_schluessel (art_id) deferrable initially deferred,
  ec_obergrenze_validator numeric(3,1) not null check (ec_obergrenze_validator in (2.0, 2.6)),
  freigegeben_am date,
  erfasst_am timestamptz not null default now(),
  app_version text not null
);
comment on table public.kulturgruppe is 'Sechs Gruppen mit Leitkultur (R1.3; Vorschlag in 03_import_w0.md 4.2.1).';

-- Versionsspalten der sieben Wissenstabellen (8.1 Regel 4): quelldatei, zeile_id,
-- commit, freigegeben_am, gueltig_ab, gueltig_bis; profilwert, saatempfehlung,
-- duengerschema und wissenseintrag tragen die Herkunft in der Zeile, art,
-- art_kulturform und die Katalogwerte der sorte je Feld in herkunft.

create table public.art (
  id uuid primary key default gen_random_uuid(),
  art_id text not null references public.art_schluessel (art_id),
  name_de text not null,
  name_wiss text not null,
  gbif_key bigint,
  kulturgruppe_id text not null references public.kulturgruppe (kulturgruppe_id),
  samentyp text,
  keimlinge_je_knaeuel numeric(3,1),
  standard_keimfaehigkeit numeric(3,2) check (standard_keimfaehigkeit between 0 and 1),
  systemeignung public.systemeignung,
  liter_je_pflanze numeric(5,2),
  liter_status public.liter_status not null default 'testbetrieb_offen',
  wasserbedarf_je_pflanze_l numeric(5,2),
  pflanzen_je_m2 numeric(5,1),
  wuchshoehe_max_mm smallint,
  wuchsform public.wuchsform,
  photoperiode public.photoperiode,
  kritische_tageslaenge_h numeric(3,1),
  bestaeubung_noetig boolean,
  pythium public.pythium,
  schossen_handlung public.schossen_handlung,
  aussaatfenster_von_monat smallint check (aussaatfenster_von_monat between 1 and 12),
  aussaatfenster_bis_monat smallint check (aussaatfenster_bis_monat between 1 and 12),
  umsetzen_ab_d smallint,
  umsetzen_bis_d smallint,
  kulturformen_erlaubt public.kulturform[] not null default '{}',
  kulturform_vorgabe public.kulturform,
  quelldatei text not null,
  zeile_id text not null,
  commit text not null,
  freigegeben_am date,
  gueltig_ab timestamptz not null default now(),
  gueltig_bis timestamptz,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  check (umsetzen_ab_d is null or umsetzen_bis_d is null or umsetzen_ab_d <= umsetzen_bis_d),
  check (kulturform_vorgabe is null or kulturform_vorgabe = any (kulturformen_erlaubt))
);
create unique index art_gueltig on public.art (art_id) where gueltig_bis is null;
comment on table public.art is
  'Artmerkmale (8.2), versioniert; Herkunft je Feld in herkunft. Keimart, Keimtemperatur und Keimdauer stehen als profilwert der Phase keimung. (A3) name_de, kulturform_vorgabe.';

create table public.art_kulturform (
  id uuid primary key default gen_random_uuid(),
  art_id text not null references public.art_schluessel (art_id),
  kulturform public.kulturform not null,
  ernte_ab_d smallint,
  ernteart public.ernteart not null,
  ernteintervall_d smallint,
  schnitte_max smallint,
  kulturdauer_max_d smallint,
  kulturdauer_typisch_d smallint,
  entspitzen boolean not null default false,
  quelldatei text not null,
  zeile_id text not null,
  commit text not null,
  freigegeben_am date,
  gueltig_ab timestamptz not null default now(),
  gueltig_bis timestamptz,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  check (ernteart = 'mehrfach' or (ernteintervall_d is null and schnitte_max is null)),
  check (kulturdauer_typisch_d is null or kulturdauer_max_d is null or kulturdauer_typisch_d <= kulturdauer_max_d)
);
create unique index art_kulturform_gueltig on public.art_kulturform (art_id, kulturform) where gueltig_bis is null;
comment on table public.art_kulturform is 'Je Art und Kulturform: Ernte, Kulturdauer, Entspitzen (R1.2). ernte_ab_d ab Umsetzen, bei Direktsaat ab Saat.';

create table public.kulturform_profilende (
  id uuid primary key default gen_random_uuid(),
  kulturform public.kulturform not null unique,
  profil_ende public.phase not null,
  erfasst_am timestamptz not null default now(),
  app_version text not null
);
comment on table public.kulturform_profilende is 'Seed-Konstante R1.2: keimling → anzucht; babyleaf, kopf, schnitt, dauerkultur_blatt → wachstum; dauerkultur_frucht → fruchtbildung_reife.';

create table public.herkunft (
  id uuid primary key default gen_random_uuid(),
  tabelle text not null check (tabelle in ('art', 'art_kulturform', 'sorte')),
  zeile_id text not null,
  feld text not null,
  quelle_id text not null references public.quelle (quelle_id),
  fundstelle text not null,
  kurzzitat text not null check (length(kurzzitat) <= 200),
  evidenzklasse public.evidenzklasse not null,
  vermerk public.vermerk not null default 'keine',
  gueltig_ab timestamptz not null default now(),
  gueltig_bis timestamptz,
  erfasst_am timestamptz not null default now(),
  app_version text not null
);
create unique index herkunft_gueltig on public.herkunft (tabelle, zeile_id, feld) where gueltig_bis is null;
comment on table public.herkunft is 'Herkunft je Feld für art, art_kulturform und Katalogwerte der Sorte (8.1 Regel 4).';

create table public.sorte_schluessel (
  id uuid primary key default gen_random_uuid(),
  sorte_key text not null unique,
  erfasst_am timestamptz not null default now()
);
comment on table public.sorte_schluessel is '(A1) Anker je Sorte: sorte_key = zeile_id aus sorten.csv oder app-<uuid> für Sorten aus UC4.';

create table public.sorte (
  id uuid primary key default gen_random_uuid(),
  sorte_id uuid not null references public.sorte_schluessel (id),
  name text not null,
  art_id text not null references public.art_schluessel (art_id),
  kulturtyp public.kulturtyp not null,
  wuchshoehe_max_mm smallint,
  wuchsform public.wuchsform,
  fruehzeitigkeit_relativ_d smallint,
  shop_link text,
  quelldatei text not null,
  zeile_id text not null,
  commit text not null,
  freigegeben_am date,
  gueltig_ab timestamptz not null default now(),
  gueltig_bis timestamptz,
  erfasst_am timestamptz not null default now(),
  app_version text not null
);
create unique index sorte_gueltig on public.sorte (sorte_id) where gueltig_bis is null;
comment on table public.sorte is
  'Sorte (8.2), versioniert; Quelle sorten.csv oder UC4. Katalogwerte dürfen leer sein (Entscheid R9), Herkunft in herkunft. Tütenwerte als profilwert Ebene sorte.';

create table public.profilwert (
  id uuid primary key default gen_random_uuid(),
  ebene public.profil_ebene not null,
  sorte_id uuid references public.sorte_schluessel (id),
  art_id text references public.art_schluessel (art_id),
  kulturgruppe_id text references public.kulturgruppe (kulturgruppe_id),
  phase public.phase not null,
  groesse public.groesse not null,
  wert_min numeric(7,3),
  wert_typ numeric(7,3),
  wert_max numeric(7,3),
  text_wert text,
  ec_min_quelle numeric(8,3),
  ec_max_quelle numeric(8,3),
  ec_einheit_quelle public.ec_einheit,
  ec_basis_quelle public.ec_basis,
  bezugstemperatur_c numeric(3,1),
  bezugs_dli numeric(4,1),
  system_quelle public.system,
  umgebung_quelle public.umgebung,
  quelle_id text not null references public.quelle (quelle_id),
  fundstelle text not null,
  kurzzitat text not null check (length(kurzzitat) <= 200),
  evidenzklasse public.evidenzklasse not null,
  vermerk public.vermerk not null default 'keine',
  quelldatei text not null,
  zeile_id text not null,
  commit text not null,
  freigegeben_am date,
  gueltig_ab timestamptz not null default now(),
  gueltig_bis timestamptz,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  check ((ebene = 'sorte') = (sorte_id is not null)),
  check ((ebene = 'art') = (art_id is not null)),
  check ((ebene = 'kulturgruppe') = (kulturgruppe_id is not null)),
  check (ebene <> 'standard' or groesse in ('ph', 'wassertemp', 'licht_h')),
  check (ebene <> 'sorte' or groesse in ('keimart', 'keimtemp')),
  check (groesse not in ('keimart', 'keimtemp') or phase = 'keimung'),
  check ((groesse = 'ec') = (ec_einheit_quelle is not null and ec_basis_quelle is not null)),
  check (groesse <> 'anwendbar' or text_wert in ('ja', 'entfaellt')),
  check (groesse <> 'keimart' or text_wert in ('licht', 'dunkel', 'indifferent')),
  check (groesse <> 'wechselmerkmal' or length(text_wert) <= 120),
  check (groesse <> 'dauer' or (wert_min > 0 and wert_min <= wert_typ and wert_typ <= wert_max)),
  check (groesse <> 'ph' or (wert_min >= 5.2 and wert_max <= 7.0 and wert_max - wert_min between 0.2 and 1.2)),
  check (groesse <> 'ec' or (wert_min >= 0.4 and wert_max <= 2.6 and wert_max - wert_min between 0.2 and 1.2)),
  check (groesse <> 'wassertemp' or (wert_min >= 10 and wert_max <= 28)),
  check (groesse <> 'licht_h' or (wert_min >= 0 and wert_max <= 24))
);
create unique index profilwert_gueltig on public.profilwert
  (ebene, coalesce(sorte_id::text, art_id, kulturgruppe_id, 'standard'), phase, groesse)
  where gueltig_bis is null;
comment on table public.profilwert is
  'Sollwerte im Langformat (8.2): eine Grösse je Zeile mit Herkunft. EC: Rohwert der Quelle (ec_*_quelle) und umgerechnet in mS/cm (wert_min, wert_max), Basis unverändert; Gesamt-EC zur Laufzeit über ec_gesamt(). Klasse D entsteht nie als Zeile. Validator 9.4 als Check (EC-Obergrenze 2.0 für Blatt prüft der Seed je Kulturgruppe).';

create table public.pflichtgroesse (
  id uuid primary key default gen_random_uuid(),
  phase public.phase not null,
  groesse public.groesse not null,
  mindestens_art boolean not null default false,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  unique (phase, groesse)
);
comment on table public.pflichtgroesse is 'Seed-Konstante für R1.4 (Inhalt nach 03_import_w0.md Abschnitt 9).';

create table public.saatempfehlung (
  id uuid primary key default gen_random_uuid(),
  ebene public.profil_ebene not null check (ebene in ('art', 'sorte')),
  art_id text references public.art_schluessel (art_id),
  sorte_id uuid references public.sorte_schluessel (id),
  kulturform public.kulturform not null,
  samen_je_schwamm smallint not null check (samen_je_schwamm >= 1),
  obergrenze_samen smallint not null,
  pflanzen_stehen_lassen smallint not null default 1 check (pflanzen_stehen_lassen >= 1),
  klasse_saatmenge public.klasse_saatmenge not null,
  substrat_passung text,
  begruendung text not null,
  bestaetigt_am date,
  quelle_id text references public.quelle (quelle_id),
  fundstelle text,
  kurzzitat text,
  quelldatei text not null,
  zeile_id text not null,
  commit text not null,
  freigegeben_am date,
  gueltig_ab timestamptz not null default now(),
  gueltig_bis timestamptz,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  check ((ebene = 'art') = (art_id is not null) and (ebene = 'sorte') = (sorte_id is not null)),
  check (obergrenze_samen >= samen_je_schwamm),
  check (klasse_saatmenge = 'D' or quelle_id is not null)
);
create unique index saatempfehlung_gueltig on public.saatempfehlung
  (ebene, coalesce(sorte_id::text, art_id), kulturform) where gueltig_bis is null;
comment on table public.saatempfehlung is 'Saatmenge je Art oder Sorte und Kulturform mit Saatmengen-Skala A bis D (R12.3). Aus der Datei: bestaetigt_am = freigegeben_am (03_import_w0.md 4.5).';

create table public.produkt (
  id uuid primary key default gen_random_uuid(),
  produkt_id text not null unique check (produkt_id in ('grow', 'micro_hard_water', 'bloom', 'ph_minus')),
  name text not null,
  variante text,
  gehalt text,
  konzentration text,
  erfasst_am timestamptz not null default now(),
  app_version text not null
);
comment on table public.produkt is 'Grow 3-1-6, Micro Hard Water 5-0-1, Bloom 0-5-4, pH-Minus (5.6); Seed-Konstante.';

create table public.duengerschema (
  id uuid primary key default gen_random_uuid(),
  stadium public.stadium not null,
  grow_ml_l numeric(4,2) not null,
  micro_ml_l numeric(4,2) not null,
  bloom_ml_l numeric(4,2) not null,
  summe_ml_l numeric(4,2) not null,
  ec_richtwert_min numeric(4,2),
  ec_richtwert_max numeric(4,2),
  ec_basis public.ec_basis not null default 'unbekannt',
  herkunft public.herkunft_duenger not null,
  quelle_id text not null references public.quelle (quelle_id),
  fundstelle text not null,
  kurzzitat text not null check (length(kurzzitat) <= 200),
  evidenzklasse public.evidenzklasse not null default 'B2',
  mischregeln text,
  quelldatei text not null,
  zeile_id text not null,
  commit text not null,
  freigegeben_am date,
  gueltig_ab timestamptz not null default now(),
  gueltig_bis timestamptz,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  check (abs(grow_ml_l + micro_ml_l + bloom_ml_l - summe_ml_l) <= 0.01)
);
create unique index duengerschema_gueltig on public.duengerschema (stadium) where gueltig_bis is null;
comment on table public.duengerschema is
  'Herstellertabelle Hydro/Coco je Stadium (R4.2, R4.3). EC-Richtwert nur Anzeige, nie gerechnet (5.6). Stadium reife mit Herkunft abgeleitet, nicht verwendet.';

create table public.wissenseintrag (
  id uuid primary key default gen_random_uuid(),
  ebene public.wissen_ebene not null,
  art_id text references public.art_schluessel (art_id),
  kulturgruppe_id text references public.kulturgruppe (kulturgruppe_id),
  phase public.phase,
  typ public.wissenseintrag_typ not null,
  text text not null check (length(text) <= 600 and text !~* '(kcl|lagerlösung)'),
  quelle_id text not null references public.quelle (quelle_id),
  fundstelle text not null,
  kurzzitat text not null check (length(kurzzitat) <= 200),
  evidenzklasse public.evidenzklasse not null,
  quelldatei text not null,
  zeile_id text not null,
  commit text not null,
  freigegeben_am date,
  gueltig_ab timestamptz not null default now(),
  gueltig_bis timestamptz,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  check ((ebene = 'art') = (art_id is not null) and (ebene = 'kulturgruppe') = (kulturgruppe_id is not null))
);
create unique index wissenseintrag_gueltig on public.wissenseintrag (zeile_id) where gueltig_bis is null;
comment on table public.wissenseintrag is 'Wissenskarten (UC12, R7.2), höchstens 600 Zeichen, ohne KCl und Lagerlösung.';

create table public.k_faktor (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  produkt_id text not null references public.produkt (produkt_id),
  wert numeric(4,3) not null check (wert > 0 and wert < 1),
  gilt_ab timestamptz not null,
  quelle public.k_quelle not null,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz,
  check (produkt_id <> 'ph_minus')
);
comment on table public.k_faktor is 'k je Komponente in mS/cm je ml/L (R4.1); gültig ist je Produkt die jüngste Zeile; Startwert 0.3. Die Grenze 0.2 bis 0.45 für k_wirksam prüft src/domain beim Übernehmen.';

-- ---------------------------------------------------------------------
-- 5 Bereich Betrieb
-- Erfassungstabellen: client_id, erfasst_am, app_version, storniert_am,
-- storno_grund, ersetzt_id, gilt_ab, client_zeit, nacherfasst (8.1 Regel 3).
-- ---------------------------------------------------------------------

create table public.saatgut (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  sorte_id uuid not null references public.sorte_schluessel (id),
  kaufdatum date,
  bestand_korn integer check (bestand_korn >= 0),
  keimfaehigkeit_packung numeric(3,2) check (keimfaehigkeit_packung between 0 and 1),
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz
);
comment on table public.saatgut is 'Packung (8.2); beobachtete Keimrate ist v_keimrate (nur Datenart echt).';

create table public.pflanzvorgang (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  begonnen_am timestamptz not null,
  gespeichert_am timestamptz not null,
  dauer_s integer generated always as (greatest(0, extract(epoch from gespeichert_am - begonnen_am))::integer) stored,
  einstieg public.pflanzvorgang_einstieg not null,
  anzahl_pflanzungen smallint not null check (anzahl_pflanzungen >= 1),
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz
);
comment on table public.pflanzvorgang is 'Messung EK2: Dauer von «Säen» bis Speichern; Nacherfassungen zählen nicht (Einstieg nacherfassung).';

create table public.satz (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  sorte_id uuid not null references public.sorte_schluessel (id),
  saatgut_id uuid references public.saatgut (id),
  kulturform public.kulturform not null,
  anzuchtort_platz_id uuid references public.platz (id) on delete cascade,
  direktsaat_platz_id uuid references public.platz (id) on delete cascade,
  anzahl_schwaemme smallint not null check (anzahl_schwaemme between 1 and 100),
  samen_je_schwamm smallint not null check (samen_je_schwamm >= 1),
  schwaemme_vorschlag smallint,
  samen_vorschlag smallint,
  kopiert_von uuid references public.satz (id) on delete set null,
  saatdatum date not null,
  gilt_ab timestamptz not null,
  client_zeit timestamptz,
  nacherfasst boolean generated always as (erfasst_am - gilt_ab > interval '2 hours') stored,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz,
  storno_grund public.storno_grund,
  ersetzt_id uuid references public.satz (id) on delete set null,
  check ((anzuchtort_platz_id is null) <> (direktsaat_platz_id is null))
);
comment on table public.satz is
  'Alle Pflanzungen einer Sorte mit gleichem Saatdatum, Anzuchtort und Kulturform (R8.1). saatdatum ist Cache des letzten Ereignisses aussaat {saatdatum}; ohne solches gilt der Kalendertag von gilt_ab (A: gilt_ab des Satzes ist der Saatzeitpunkt). Zielgefäss ergibt sich aus den Reservierungen; Folgesatz ist v_folgesatz.';

create table public.pflanzung (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  satz_id uuid not null references public.satz (id) on delete cascade,
  pflanzvorgang_id uuid references public.pflanzvorgang (id) on delete set null,
  rang smallint,
  einstufung public.einstufung,
  gruende text[] not null default '{}',
  gilt_ab timestamptz not null,
  client_zeit timestamptz,
  nacherfasst boolean generated always as (erfasst_am - gilt_ab > interval '2 hours') stored,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz,
  storno_grund public.storno_grund,
  ersetzt_id uuid references public.pflanzung (id) on delete set null
);
comment on table public.pflanzung is
  'Ein Schwamm vom Säen bis zum Endzustand (R8.1). Einstufung, Rang und Gründe-Codes aus R3.2 beim Setzen (leer bis I2-4). Netztopf, Platz, Phase und Status sind v_pflanzung_zustand.';

create table public.reservierung (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  pflanzung_id uuid not null references public.pflanzung (id) on delete cascade,
  netztopf_id uuid not null references public.netztopf (id) on delete cascade,
  umsetzen_vorgabe_am date not null,
  umsetzen_geplant_am date not null,
  gilt_ab timestamptz not null,
  client_zeit timestamptz,
  nacherfasst boolean generated always as (erfasst_am - gilt_ab > interval '2 hours') stored,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz,
  storno_grund public.storno_grund,
  ersetzt_id uuid references public.reservierung (id) on delete set null
);
comment on table public.reservierung is
  'Einzige Stelle, an der ein Ziel gespeichert ist (8.2). umsetzen_vorgabe_am ist die unveränderliche Vorgabe beim Anlegen (Saat + Umsetzen ab; Direktsaat Saattag); umsetzen_geplant_am ist Cache des letzten Ereignisses umsetzdatum_geaendert der Pflanzung oder ihres Satzes, ohne solches die Vorgabe; auch beim Einfügen (Korrektur, neuer Zieltopf) rechnet reservierung_vorbelegen() bestehende Ereignisse ein. Ende über v_reservierung_aktiv; höchstens eine Nachfolge-Reservierung je Netztopf (R11.2, geprüft in src/domain und pgTAP).';

create table public.messung (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  platz_id uuid references public.platz (id) on delete cascade,
  messgeraet_id uuid not null references public.messgeraet (id),
  messart public.messart not null,
  ph numeric(4,2) check (ph between 0 and 14),
  ec numeric(5,3) check (ec between 0 and 10),
  ec_eingabe text,
  ec_dezimalen smallint,
  temperatur numeric(3,1) check (temperatur between 0 and 50),
  fuellstand public.fuellstand,
  fuellhoehe_mm smallint,
  bewertung_ph public.bewertung,
  bewertung_ec public.bewertung,
  bewertung_temp public.bewertung,
  schnappschuss jsonb not null default '{}',
  ansatz_id uuid,
  war_faellig_am date,
  aufgabe_schluessel text,
  erfassungsdauer_s integer check (erfassungsdauer_s >= 0),
  gilt_ab timestamptz not null,
  client_zeit timestamptz,
  nacherfasst boolean generated always as (erfasst_am - gilt_ab > interval '2 hours') stored,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz,
  storno_grund public.storno_grund,
  ersetzt_id uuid references public.messung (id) on delete set null,
  datenart public.datenart,
  check ((messart = 'ph_kontrolle') = (platz_id is null)),
  check ((messart = 'ph_kontrolle') = (datenart is not null)),
  check (ph is not null or ec is not null or temperatur is not null),
  check (messart not in ('rundgang', 'aufgabe', 'kontrolle_folgetag', 'nachmessen')
         or coalesce(schnappschuss ->> 'betriebsart', '') not in ('kratky', 'kratky_belueftet')
         or fuellstand is not null)
);
comment on table public.messung is
  'Messung am Ort (UC9). schnappschuss = {zielbereich: {ph_min, ph_max, ec_min, ec_max, temp_min, temp_max}, betriebsart, u_ec, u_ph} zum Zeitpunkt der Bewertung (R2.5). «unsicher» ist v_messung_unsicher (A7). datenart nur bei der pH-Kontrolle ohne Platz (Datenart der gewählten Anlage, 8.1 Regel 7); sonst folgt sie aus dem Platz. Die Fälligkeit «Kalibrierung oder Kontrolle + 7» (R5.2) zählt nur echte Kontrollen. Füllstand Pflicht bei Kratky für alle Messarten am Gefäss ausser Kontroll- und Endmessung im Ansatz (R4.10).';

create table public.kalibrierung (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  messgeraet_id uuid not null references public.messgeraet (id),
  loesungen text[] not null default '{ph7.00,ph4.01,ec1413}',
  gegenprobe_ec numeric(5,3),
  loesung_geoeffnet_am date,
  nach_reinigung boolean not null default false,
  datenart public.datenart not null default 'echt',
  dauer_s integer,
  war_faellig_am date,
  aufgabe_schluessel text,
  gilt_ab timestamptz not null,
  client_zeit timestamptz,
  nacherfasst boolean generated always as (erfasst_am - gilt_ab > interval '2 hours') stored,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz,
  storno_grund public.storno_grund,
  ersetzt_id uuid references public.kalibrierung (id) on delete set null
);
comment on table public.kalibrierung is 'Zweipunkt pH und EC 1413 mit Gegenprobe (5.6); Fälligkeit in v_kalibrierung_faellig.';

create table public.naehrloesungsansatz (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  platz_id uuid not null references public.platz (id) on delete cascade,
  typ public.ansatz_typ not null,
  status public.ansatz_status not null default 'laufend',
  begonnen_am timestamptz not null,
  abgeschlossen_am timestamptz,
  timer_ende timestamptz,
  stadium_vorschlag public.stadium,
  stadium_gewaehlt public.stadium,
  leitkultur_art_id text references public.art_schluessel (art_id),
  mischentscheid public.mischentscheid not null default 'keiner',
  gerechnet_fuer uuid[] not null default '{}',
  schnappschuss jsonb not null default '{}',
  ziel_ec_vorschlag numeric(5,3),
  ziel_ec_gewaehlt numeric(5,3),
  ec_wasser numeric(5,3),
  dosis_hersteller_ml_l numeric(5,2),
  dosis_verwendet_ml_l numeric(5,2),
  skaliert boolean,
  teil_dosis numeric(3,2) check (teil_dosis in (0.75, 0.85, 1.00)),
  ec_erwartet_teildosis numeric(5,3),
  ec_erwartet_final numeric(5,3),
  k_vorschlag numeric(4,3),
  k_uebernommen boolean,
  volumen_l numeric(5,2) not null check (volumen_l > 0),
  nachgefuellt_l numeric(5,2),
  ph_vorher numeric(4,2),
  ph_nachher numeric(4,2),
  ist_ersteinstellung boolean not null default false,
  ueber_herstellerdosis_bestaetigt boolean not null default false,
  kontrollmessung_id uuid references public.messung (id) on delete set null,
  endmessung_id uuid references public.messung (id) on delete set null,
  war_faellig_am date,
  aufgabe_schluessel text,
  dauer_s integer,
  gilt_ab timestamptz not null,
  client_zeit timestamptz,
  nacherfasst boolean generated always as (erfasst_am - gilt_ab > interval '2 hours') stored,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz,
  storno_grund public.storno_grund,
  ersetzt_id uuid references public.naehrloesungsansatz (id) on delete set null,
  check (typ <> 'nachfuellen' or nachgefuellt_l > 0)
);
alter table public.messung add constraint messung_ansatz_fk foreign key (ansatz_id) references public.naehrloesungsansatz (id) on delete set null;
comment on table public.naehrloesungsansatz is
  'Neuansatz, Nachfüllen, pH-Korrektur, Teilwechsel (R4). Speichert Zielbereich als Schnappschuss, Leitkultur, Mischentscheid und gerechnet_fuer (Pflanzungen) (R2.4). Nachfüllsumme ist v_nachfuellsumme.';

create table public.ansatz_position (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  ansatz_id uuid not null references public.naehrloesungsansatz (id) on delete cascade,
  produkt_id text not null references public.produkt (produkt_id),
  soll_ml numeric(6,2) not null check (soll_ml >= 0),
  ist_ml numeric(6,2) check (ist_ml >= 0),
  bezugsvolumen_l numeric(5,2) not null check (bezugsvolumen_l > 0),
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz
);
comment on table public.ansatz_position is 'Dünger und pH-Minus je Ansatz mit Soll- und Ist-Menge (UC7 «Nach dem Ansatz»).';

create table public.ansatz_schritt (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  ansatz_id uuid not null references public.naehrloesungsansatz (id) on delete cascade,
  nr smallint not null check (nr between 0 and 17),
  schritt public.ansatz_schritt_typ not null,
  erledigt_am timestamptz,
  soll_ml numeric(6,2),
  ist_ml numeric(6,2),
  ph_minus_ml numeric(6,2),
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz
);
create unique index ansatz_schritt_nr on public.ansatz_schritt (ansatz_id, nr) where storniert_am is null;
comment on table public.ansatz_schritt is 'Abhakliste Zeilen 0 bis 17 (R4.6); Haken zuerst lokal (IndexedDB), dann idempotent hier.';

create table public.ereignis (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  typ public.ereignis_typ not null,
  anlage_id uuid references public.anlage (id) on delete cascade,
  bereich_id uuid references public.bereich (id) on delete cascade,
  platz_id uuid references public.platz (id) on delete cascade,
  satz_id uuid references public.satz (id) on delete cascade,
  pflanzung_id uuid references public.pflanzung (id) on delete cascade,
  netztopf_id uuid references public.netztopf (id) on delete cascade,
  messgeraet_id uuid references public.messgeraet (id),
  art_id text references public.art_schluessel (art_id),
  sorte_id uuid references public.sorte_schluessel (id),
  daten jsonb not null default '{}',
  war_faellig_am date,
  aufgabe_schluessel text,
  dauer_s integer,
  gilt_ab timestamptz not null,
  client_zeit timestamptz,
  nacherfasst boolean generated always as (erfasst_am - gilt_ab > interval '2 hours') stored,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz,
  storno_grund public.storno_grund,
  ersetzt_id uuid references public.ereignis (id) on delete set null,
  check (num_nonnulls(anlage_id, bereich_id, platz_id, satz_id, pflanzung_id, netztopf_id, messgeraet_id, art_id, sorte_id) >= 1),
  check (typ not in ('sonde_gereinigt', 'als_unsicher_markiert') or coalesce(daten ->> 'datenart', '') in ('echt', 'demo', 'test')),
  check (typ <> 'phase_antwort' or (satz_id is not null and pflanzung_id is null))
);
create index ereignis_typ_gilt on public.ereignis (typ, gilt_ab) where storniert_am is null;
comment on table public.ereignis is
  'Genau ein Typ je Handlung (8.1 Regel 2). (A4) daten je Typ: aussaat {saatdatum} (Korrektur des Saatdatums); keimung {samen_gesaet, samen_gekeimt, keimtemp_eingehalten, vorherige_pruefung_am}; phase_antwort {phase, antwort: ja|noch_nicht|problem, erwartet_am, nachgefuehrt, ausloesende_pflanzung_id}; verschieben, umsetzen {von_platz_id, von_loch_nr, nach_platz_id, nach_loch_nr}; tausch dasselbe plus vorgang_id, je Topf ein Ereignis (A9); phase_antwort nur am Satz (Check) und gilt für alle Pflanzungen des Satzes; eine Ausnahme in der gebündelten Karte ist eine eigene Antwort für diesen Satz, bei Fruchtgemüse mit ausloesende_pflanzung_id (R1.5); umsetzdatum_geaendert {von, nach, grund: morgen|in_station_lassen|ziel_spaeter} an der Pflanzung oder am Satz (dann für alle Pflanzungen des Satzes); neu_beschriften {von_kennung, nach_kennung}; ernte {art: teil|ab} (ab schliesst die Pflanzung mit Grund geerntet ab); kultur_entscheid {entscheid: beenden|verlaengern, tage}; abschluss {grund: geerntet|ausfall|keimt_nicht|ueberzaehlig, text}; wiederherstellen {ereignis_id}; kurzpruefung {punkt: pumpe|luftzone|loesung_topfboden|wurzeln|licht|luefter|wuerfel_feucht, ok, ausnahmen}; gefaesspruefung {schritt: 1..4, ok, volumen_gezaehlt_l}; ruhe {gesetzt}; gefaess_erfasst {} beim Speichern im Assistenten «Gefäss erfassen» (R9.3); sonde_gereinigt {datenart}; als_unsicher_markiert {seit_kalibrierung_id, datenart} (Datenart der gewählten Anlage, Check); stromausfall {beginn, ende}; aufgabe_erledigt {aufgabe_schluessel}; messung_umgehaengt {messung_id, nach_platz_id}; sollwert_geaendert {profilwert_zeile_id}; beobachtung {kategorie: tipburn|mehltau|schossen|wurzeln|sonstiges, text ≤ 200}; leitkultur_gewaehlt {art_id}.';

create table public.aufschub (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  aufgabe_schluessel text not null,
  art public.aufschub_art not null,
  datenart public.datenart not null default 'echt',
  gesetzt_am date not null,
  gilt_ab timestamptz not null,
  client_zeit timestamptz,
  nacherfasst boolean generated always as (erfasst_am - gilt_ab > interval '2 hours') stored,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz,
  storno_grund public.storno_grund,
  ersetzt_id uuid references public.aufschub (id) on delete set null
);
comment on table public.aufschub is 'Morgen, Überspringen, Pegel ok (gilt einen Tag, keine Erledigung) je Aufgabenschlüssel typ|bezug|fällig am (R5.1, R5.3). datenart = Datenart der gewählten Anlage (8.1 Regel 7, datenart_loeschen).';

create table public.aufgabe_tagesliste (
  id uuid primary key default gen_random_uuid(),
  tag date not null,
  aufgabe_schluessel text not null,
  typ text not null,
  platz_id uuid references public.platz (id) on delete cascade,
  faellig_am date not null,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  unique (tag, aufgabe_schluessel)
);
comment on table public.aufgabe_tagesliste is 'Protokoll der Push-Funktion, Nenner der Termintreue; die App liest sie nie (R5.1).';

create table public.push_abo (
  id uuid primary key default gen_random_uuid(),
  geraet text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth_schluessel text not null,
  datenart public.datenart not null default 'echt',
  aktiv boolean not null default true,
  letzter_fehler text,
  erfasst_am timestamptz not null default now(),
  app_version text not null
);
comment on table public.push_abo is 'Web-Push-Abo je Gerät; 404 oder 410 → aktiv = false, Protokoll abgemeldet (11.3).';

create table public.push_versand (
  id uuid primary key default gen_random_uuid(),
  abo_id uuid references public.push_abo (id) on delete cascade,
  kanal public.push_kanal not null,
  art public.push_art not null,
  datum_lokal date not null,
  bezug_id uuid,
  timer_ende timestamptz,
  gesendet_am timestamptz,
  status public.push_status not null default 'geplant',
  anzahl_aufgaben smallint,
  titel text,
  angezeigt_am timestamptz,
  geoeffnet_am timestamptz,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  check ((kanal = 'push') = (abo_id is not null)),
  check ((art = 'timer') = (bezug_id is not null and timer_ende is not null))
);
create unique index push_versand_einmal_timer on public.push_versand (abo_id, bezug_id, timer_ende)
  where art = 'timer';
create unique index push_versand_einmal_push on public.push_versand (abo_id, datum_lokal, art)
  where kanal = 'push' and art in ('sammel', 'kurzpruefung_20');
create unique index push_versand_einmal_email on public.push_versand (datum_lokal, art)
  where kanal = 'email' and art in ('sammel', 'kurzpruefung_20');
comment on table public.push_versand is 'Versandprotokoll; Unique je Abo, Tag und Art verhindert Doppelversand (TP1); Timer-Push je Abo, Ansatz (bezug_id) und Timerende genau einmal (TP5). E-Mail nur ohne gültiges Abo (E6).';

create table public.ki_aufruf (
  id uuid primary key default gen_random_uuid(),
  modell text not null,
  status text not null check (status in ('gestartet', 'ok', 'ausweichmodell', 'fehler', 'zeitueberschreitung')),
  dauer_ms integer,
  erfasst_am timestamptz not null default now(),
  app_version text not null
);
comment on table public.ki_aufruf is 'Jeder Aufruf von ki-tuete, geschrieben vor dem API-Request; Grundlage der Grenze 30 Aufrufe je Tag (11.1).';

create table public.etikett_aufruf (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  aufgerufen_am timestamptz not null default now(),
  ergebnis public.etikett_ergebnis not null,
  erfasst_am timestamptz not null default now(),
  app_version text not null
);
comment on table public.etikett_aufruf is 'Scan-Protokoll für die Kennzahl Etiketten (14.5).';

create table public.ki_feldprotokoll (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  sorte_id uuid references public.sorte_schluessel (id),
  saatgut_id uuid references public.saatgut (id),
  feld public.ki_feld not null,
  wert_ki text,
  wert_final text,
  status public.ki_status not null,
  bewertung_eval public.ki_bewertung,
  modell text not null,
  dauer_ms integer,
  fotopfad text,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz
);
comment on table public.ki_feldprotokoll is 'Je KI-Feld der Saattüte (UC4); Keimdauer, Kulturdauer und Aussaatfenster nur hier. bewertung_eval aus dem Vergleich mit data/eval/tueten_referenz.csv.';

create table public.eigene_aufgabe (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  anlage_id uuid not null references public.anlage (id) on delete cascade,
  name text not null,
  intervall_d smallint not null check (intervall_d between 1 and 365),
  letzte_erledigung date,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  storniert_am timestamptz
);
comment on table public.eigene_aufgabe is 'Leere Hülle für den Pool-Posten «eigene wiederkehrende Aufgaben» (B.4).';

create table public.auswertung_fenster (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  von timestamptz not null,
  bis timestamptz not null,
  erfasst_am timestamptz not null default now(),
  app_version text not null,
  check (von < bis)
);
comment on table public.auswertung_fenster is 'Seed: testbetrieb 2027-01-07 00:00 bis 2027-03-31 24:00 Europe/Zurich (14.4).';

create table public.backup_status (
  id uuid primary key default gen_random_uuid(),
  letztes_backup_am timestamptz,
  groesse_bytes bigint,
  letzte_wiederherstellungsprobe_am timestamptz,
  erfasst_am timestamptz not null default now(),
  app_version text not null
);
comment on table public.backup_status is 'Geschrieben von backup.yml; Heute warnt ab 8 Tagen (11.7).';

-- ---------------------------------------------------------------------
-- 6 Trigger und Funktionen
-- ---------------------------------------------------------------------

-- Wissen wird nie überschrieben: nur gueltig_bis darf sich ändern (8.1 Regel 4).
create or replace function public.wissen_nur_schliessen()
returns trigger language plpgsql as $$
begin
  if (to_jsonb(new) - 'gueltig_bis') is distinct from (to_jsonb(old) - 'gueltig_bis') then
    raise exception 'Wissenszeile % darf nicht überschrieben werden; neue Version anlegen', old.id;
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['art', 'art_kulturform', 'herkunft', 'sorte', 'profilwert', 'saatempfehlung', 'duengerschema', 'wissenseintrag'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.wissen_nur_schliessen()', t || '_nur_schliessen', t);
  end loop;
end $$;

-- Kürzel einer Anlage nach dem ersten Druck fest (R9.1, UC1-AK6).
create or replace function public.anlage_kuerzel_fest()
returns trigger language plpgsql as $$
begin
  if new.kuerzel is distinct from old.kuerzel and exists (
       select 1 from public.etikett e join public.platz p on p.id = e.platz_id
       where p.anlage_id = old.id and e.gedruckt_am is not null) then
    raise exception 'Kürzel % ist nach dem ersten Etikettendruck fest', old.kuerzel;
  end if;
  return new;
end $$;
create trigger anlage_kuerzel_fest before update on public.anlage
  for each row execute function public.anlage_kuerzel_fest();

-- Zwei Topfkennungen in einer Transaktion tauschen (R8.3).
create or replace function public.topf_neu_beschriften(a uuid, b uuid)
returns void language plpgsql security invoker as $$
declare ka text; kb text; pa uuid; pb uuid; la smallint; lb smallint;
begin
  select kennung, heim_platz_id, heim_loch_nr into ka, pa, la from public.netztopf where id = a for update;
  select kennung, heim_platz_id, heim_loch_nr into kb, pb, lb from public.netztopf where id = b for update;
  update public.netztopf set kennung = kb, heim_platz_id = pb, heim_loch_nr = lb where id = a;
  update public.netztopf set kennung = ka, heim_platz_id = pa, heim_loch_nr = la where id = b;
end $$;

-- Caches satz.saatdatum und reservierung.umsetzen_geplant_am (8.1 Regel 2, A7):
-- genau diese Funktion rechnet sie aus den Ereignissen nach. Ohne gültiges
-- Ereignis gilt der Rückfall (Kalendertag von satz.gilt_ab bzw.
-- reservierung.umsetzen_vorgabe_am), damit ein Storno den alten Wert nicht
-- stehen lässt. Ereignisse am Satz (pflanzung_id leer) gelten für alle
-- Pflanzungen des Satzes; geändert werden nur aktive Reservierungen.
create or replace function public.cache_aus_ereignis()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.typ = 'aussaat' and new.satz_id is not null then
    update public.satz s
       set saatdatum = coalesce((select coalesce((e.daten ->> 'saatdatum')::date, public.kalendertag(e.gilt_ab))
                                   from public.ereignis e
                                  where e.satz_id = new.satz_id and e.typ = 'aussaat' and e.storniert_am is null
                                  order by e.gilt_ab desc, e.erfasst_am desc limit 1), public.kalendertag(s.gilt_ab))
     where s.id = new.satz_id;
  elsif new.typ = 'umsetzdatum_geaendert' and (new.pflanzung_id is not null or new.satz_id is not null) then
    update public.reservierung r
       set umsetzen_geplant_am = coalesce((select (e.daten ->> 'nach')::date
                                             from public.ereignis e
                                            where e.typ = 'umsetzdatum_geaendert' and e.storniert_am is null
                                              and (e.pflanzung_id = r.pflanzung_id
                                                   or (e.pflanzung_id is null and e.satz_id = pf.satz_id))
                                            order by e.gilt_ab desc, e.erfasst_am desc limit 1), r.umsetzen_vorgabe_am)
      from public.pflanzung pf
     where pf.id = r.pflanzung_id
       and (r.pflanzung_id = new.pflanzung_id or (new.pflanzung_id is null and pf.satz_id = new.satz_id))
       and r.id in (select ra.id from public.v_reservierung_aktiv ra);
  end if;
  return null;
end $$;
create trigger ereignis_cache after insert or update of storniert_am on public.ereignis
  for each row execute function public.cache_aus_ereignis();

create or replace function public.cache_geschuetzt()
returns trigger language plpgsql as $$
begin
  if tg_table_name = 'reservierung' then
    if new.umsetzen_vorgabe_am is distinct from old.umsetzen_vorgabe_am then
      raise exception 'Vorgabe des Umsetzdatums ist unveränderlich';
    end if;
  end if;
  if pg_trigger_depth() < 2 then
    if tg_table_name = 'satz' then
      if new.saatdatum is distinct from old.saatdatum then
        raise exception 'Cache-Feld wird nur aus Ereignissen nachgeführt (8.1 Regel 2)';
      end if;
    elsif new.umsetzen_geplant_am is distinct from old.umsetzen_geplant_am then
      raise exception 'Cache-Feld wird nur aus Ereignissen nachgeführt (8.1 Regel 2)';
    end if;
  end if;
  return new;
end $$;
create trigger satz_cache_geschuetzt before update on public.satz
  for each row execute function public.cache_geschuetzt();
create trigger reservierung_cache_geschuetzt before update on public.reservierung
  for each row execute function public.cache_geschuetzt();

-- Neue Reservierung (auch Korrektur oder neuer Zieltopf): Cache aus dem letzten gültigen Ereignis
-- der Pflanzung oder ihres Satzes, sonst die Vorgabe; ein Wert des Clients wird überschrieben (D2).
create or replace function public.reservierung_vorbelegen()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.umsetzen_geplant_am := coalesce((select (e.daten ->> 'nach')::date
                                         from public.ereignis e
                                         join public.pflanzung pf on pf.id = new.pflanzung_id
                                        where e.typ = 'umsetzdatum_geaendert' and e.storniert_am is null
                                          and (e.pflanzung_id = new.pflanzung_id
                                               or (e.pflanzung_id is null and e.satz_id = pf.satz_id))
                                        order by e.gilt_ab desc, e.erfasst_am desc limit 1), new.umsetzen_vorgabe_am);
  return new;
end $$;
create trigger reservierung_vorbelegen before insert on public.reservierung
  for each row execute function public.reservierung_vorbelegen();

-- Pflanzvorgänge ohne Pflanzung (nach dem Löschen von Demo- oder Testdaten) mitlöschen (8.5).
create or replace function public.pflanzvorgang_aufraeumen()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.pflanzvorgang pv
   where pv.id in (select o.pflanzvorgang_id from alte o where o.pflanzvorgang_id is not null)
     and not exists (select 1 from public.pflanzung pf where pf.pflanzvorgang_id = pv.id);
  return null;
end $$;
create trigger pflanzung_geloescht after delete on public.pflanzung
  referencing old table as alte for each statement execute function public.pflanzvorgang_aufraeumen();

-- Demo- und Testdaten löschen (8.5, A10); nur Service-Rolle (scripts/demo-laden.ts --loeschen).
create or replace function public.datenart_loeschen(art public.datenart)
returns void language plpgsql security definer set search_path = '' as $$
begin
  -- Rolle prüfen (D1): PostgREST setzt role = service_role; direkte Verbindung als postgres (lokal, Seed)
  if not (current_setting('role') = 'service_role'
          or (current_setting('role') = 'none' and session_user in ('postgres', 'supabase_admin'))) then
    raise exception 'nur mit der Service-Rolle';
  end if;
  if datenart_loeschen.art = 'echt' then
    raise exception 'echte Daten werden nie gelöscht';
  end if;
  delete from public.etikett_aufruf ea
   where split_part(ea.code, '-', 1) in (select a.kuerzel from public.anlage a where a.datenart = datenart_loeschen.art);
  delete from public.ereignis e where e.daten ->> 'datenart' = datenart_loeschen.art::text;
  delete from public.kalibrierung k where k.datenart = datenart_loeschen.art;
  delete from public.messung m where m.datenart = datenart_loeschen.art;
  delete from public.aufschub au where au.datenart = datenart_loeschen.art;
  delete from public.push_abo pa where pa.datenart = datenart_loeschen.art;
  delete from public.anlage a where a.datenart = datenart_loeschen.art;
end $$;
revoke all on function public.datenart_loeschen(public.datenart) from public, anon, authenticated;
grant execute on function public.datenart_loeschen(public.datenart) to service_role;
comment on function public.datenart_loeschen(public.datenart) is
  'Löscht alle Zeilen der Datenart demo oder test: Anlage mit Kaskaden (Plätze, Gefässe, Sätze, Pflanzungen, Messungen, Ansätze, Ereignisse), Pflanzvorgänge über pflanzung_geloescht, Kalibrierungen, pH-Kontrollen ohne Platz und Aufschübe derselben Datenart, Push-Abos mit Versand, Ereignisse mit daten.datenart, Etikett-Scans des Kürzels. Nur Service-Rolle (Rechte und Rollenprüfung).';

-- Backup (11.7, A8). Umgesetzt in I0-11: Die Migration 20261104150000_backup_rollen.sql legt die Rolle ohne
-- Anmeldung an (mit Rückfall E7); Tim setzt Anmeldung und Passwort mit scripts/backup-einrichten.mjs. Das Passwort
-- steht nur im Secret SUPABASE_DB_URL_BACKUP. Ursprünglicher Entwurf:
--   create role backup_leser login bypassrls password '…';
--   grant usage on schema public to backup_leser;
--   grant select on all tables in schema public to backup_leser;
--   grant execute on function public.backup_status_melden(bigint) to backup_leser;
-- Rückfall, wenn Supabase BYPASSRLS für eigene Rollen nicht zulässt (Risikotest I0,
-- 04_architektur.md Abschnitt 9): Rolle ohne bypassrls, je Tabelle eine Lese-Policy,
-- Dump mit pg_dump --enable-row-security. Benannte Ausnahme im Prüftor-Test (06 Abschnitt 9):
-- nur Policies namens backup_lesen, nur for select, nur to backup_leser.
--   do $b$ declare t text; begin
--     for t in select tablename from pg_tables where schemaname = 'public' loop
--       execute format('create policy backup_lesen on public.%I for select to backup_leser using (true)', t);
--     end loop; end $b$;
create or replace function public.backup_status_melden(groesse bigint)
returns void language sql security definer set search_path = '' as $$
  insert into public.backup_status (letztes_backup_am, groesse_bytes, app_version)
  values (now(), groesse, 'backup.yml')
$$;
-- Supabase vergibt EXECUTE auf neue Funktionen über Default-Privileges direkt an anon,
-- authenticated und service_role; deshalb ausdrücklich entziehen (D1).
revoke all on function public.backup_status_melden(bigint) from public, anon, authenticated, service_role;

-- Gesamt-EC zur Laufzeit (8.3, DM-04).
create or replace function public.ec_gesamt(wert numeric, basis public.ec_basis, ec_wasser numeric)
returns numeric language sql immutable parallel safe as $$
  select case basis when 'zuwachs' then wert + ec_wasser else wert end
$$;
comment on function public.ec_gesamt(numeric, public.ec_basis, numeric) is
  'Basis zuwachs addiert ECWasser; unbekannt rechnet als gesamt, die App zeigt «EC-Basis unklar».';

-- Wissenszeilen aus der App (UC4, 8.1 Regel 6), nur für Tim.
create or replace function public.wissen_app_schreiben(aktion text, daten jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  neue_id uuid;
  version text := coalesce(daten ->> 'app_version', 'app');
  ebene_se public.profil_ebene := coalesce(daten ->> 'ebene', 'sorte')::public.profil_ebene;
  sk_key text;
  lk text;
  bezug text;
  klasse public.klasse_saatmenge;
begin
  if not public.ist_tim() then
    raise exception 'nicht erlaubt';
  end if;
  case aktion
  when 'sorte_neu' then
    -- Die sorte_id erzeugt der Client vor dem Foto-Upload (04 Abschnitt 6); ein zweiter Aufruf
    -- mit derselben sorte_id (Warteschlange) ändert nichts.
    neue_id := (daten ->> 'sorte_id')::uuid;
    if neue_id is null then
      raise exception 'sorte_id fehlt';
    end if;
    if exists (select 1 from public.sorte_schluessel sk where sk.id = neue_id) then
      return neue_id;
    end if;
    sk_key := 'app-' || neue_id;
    insert into public.sorte_schluessel (id, sorte_key) values (neue_id, sk_key);
    insert into public.sorte (sorte_id, name, art_id, kulturtyp, wuchshoehe_max_mm, wuchsform,
                              fruehzeitigkeit_relativ_d, shop_link, quelldatei, zeile_id, commit, app_version)
    values (neue_id, daten ->> 'name', daten ->> 'art_id', (daten ->> 'kulturtyp')::public.kulturtyp,
            (daten ->> 'wuchshoehe_max_mm')::smallint, (daten ->> 'wuchsform')::public.wuchsform,
            (daten ->> 'fruehzeitigkeit_relativ_d')::smallint,
            daten ->> 'shop_link', 'app', sk_key, version, version);
    -- Katalogwerte mit Herkunft (Klasse C, Vermerk katalog), nur wenn eine Katalogquelle angegeben ist
    insert into public.herkunft (tabelle, zeile_id, feld, quelle_id, fundstelle, kurzzitat, evidenzklasse, vermerk, app_version)
    select 'sorte', sk_key, f.feld, daten ->> 'katalog_quelle_id', coalesce(daten ->> 'katalog_fundstelle', 'Katalog'),
           coalesce(daten ->> 'katalog_kurzzitat', 'Katalog'), 'C', 'katalog', version
      from (values ('wuchshoehe_max_mm'), ('wuchsform'), ('fruehzeitigkeit_relativ_d')) f(feld)
     where daten ->> 'katalog_quelle_id' is not null and daten ->> f.feld is not null;
  when 'tuetenwert' then
    select sk.sorte_key into sk_key from public.sorte_schluessel sk where sk.id = (daten ->> 'sorte_id')::uuid;
    if sk_key is null then
      raise exception 'unbekannte Sorte';
    end if;
    insert into public.quelle (quelle_id, titel, link, klasse, anbaumethode, app_version)
    values ('tuete-' || sk_key, 'Saattüte ' || sk_key, 'app', 'tuete', 'keine', version)
    on conflict (quelle_id) do nothing;
    -- gültige Fassung derselben Grösse zuerst schliessen (8.1 Regel 4, Teilindex profilwert_gueltig)
    update public.profilwert set gueltig_bis = now()
     where ebene = 'sorte' and sorte_id = (daten ->> 'sorte_id')::uuid and phase = 'keimung'
       and groesse = (daten ->> 'groesse')::public.groesse and gueltig_bis is null;
    insert into public.profilwert (ebene, sorte_id, phase, groesse, wert_min, wert_typ, wert_max, text_wert,
                                   quelle_id, fundstelle, kurzzitat, evidenzklasse, vermerk,
                                   quelldatei, zeile_id, commit, app_version)
    values ('sorte', (daten ->> 'sorte_id')::uuid, 'keimung', (daten ->> 'groesse')::public.groesse,
            (daten ->> 'wert_min')::numeric, (daten ->> 'wert_typ')::numeric, (daten ->> 'wert_max')::numeric,
            daten ->> 'text_wert', 'tuete-' || sk_key, 'Tüte', coalesce(daten ->> 'kurzzitat', 'Tüte'),
            'C', 'tuete', 'app', 'pw.' || sk_key || '.keimung.' || (daten ->> 'groesse'), version, version)
    returning id into neue_id;
  when 'saatempfehlung_neu' then
    -- Neue Saatempfehlung aus UC4 (R12.3): Klasse C aus der Tüte (Quelle tuete-<sorte_key>, nur Ebene sorte)
    -- oder D ohne Quelle. Klasse A und B kommen nur aus W0.
    klasse := (daten ->> 'klasse_saatmenge')::public.klasse_saatmenge;
    if klasse not in ('C', 'D') then
      raise exception 'aus der App nur Klasse C (Tüte) oder D';
    end if;
    if ebene_se = 'sorte' then
      select sk.sorte_key into sk_key from public.sorte_schluessel sk where sk.id = (daten ->> 'sorte_id')::uuid;
      if sk_key is null then
        raise exception 'unbekannte Sorte';
      end if;
      bezug := sk_key;
    elsif klasse = 'C' then
      raise exception 'Tütenangaben gelten nur für die Sorte';
    else
      bezug := daten ->> 'art_id';
    end if;
    if klasse = 'C' then
      insert into public.quelle (quelle_id, titel, link, klasse, anbaumethode, app_version)
      values ('tuete-' || sk_key, 'Saattüte ' || sk_key, 'app', 'tuete', 'keine', version)
      on conflict (quelle_id) do nothing;
    end if;
    update public.saatempfehlung se set gueltig_bis = now()
     where se.gueltig_bis is null and se.ebene = ebene_se
       and se.kulturform = (daten ->> 'kulturform')::public.kulturform
       and coalesce(se.sorte_id::text, se.art_id) = case when ebene_se = 'sorte' then daten ->> 'sorte_id' else daten ->> 'art_id' end;
    insert into public.saatempfehlung (ebene, art_id, sorte_id, kulturform, samen_je_schwamm, obergrenze_samen,
                                       pflanzen_stehen_lassen, klasse_saatmenge, substrat_passung, begruendung,
                                       bestaetigt_am, quelle_id, fundstelle, kurzzitat, quelldatei, zeile_id, commit, app_version)
    values (ebene_se,
            case when ebene_se = 'art' then daten ->> 'art_id' end,
            case when ebene_se = 'sorte' then (daten ->> 'sorte_id')::uuid end,
            (daten ->> 'kulturform')::public.kulturform, (daten ->> 'samen_je_schwamm')::smallint,
            coalesce((daten ->> 'obergrenze_samen')::smallint, (daten ->> 'samen_je_schwamm')::smallint),
            coalesce((daten ->> 'pflanzen_stehen_lassen')::smallint, 1), klasse, daten ->> 'substrat_passung',
            coalesce(daten ->> 'begruendung', case klasse when 'C' then 'Angabe der Saattüte' else 'Standard, nicht belegt' end),
            case when coalesce((daten ->> 'bestaetigt')::boolean, false) then public.kalendertag(now()) end,
            case when klasse = 'C' then 'tuete-' || sk_key end,
            case when klasse = 'C' then 'Tüte' end,
            case when klasse = 'C' then coalesce(daten ->> 'kurzzitat', 'Tüte') end,
            'app', 'se.' || bezug || '.' || (daten ->> 'kulturform'), version, version)
    returning id into neue_id;
  when 'saatempfehlung_bestaetigen' then
    update public.saatempfehlung set gueltig_bis = now()
     where id = (daten ->> 'saatempfehlung_id')::uuid and gueltig_bis is null;
    insert into public.saatempfehlung (ebene, art_id, sorte_id, kulturform, samen_je_schwamm, obergrenze_samen,
                                       pflanzen_stehen_lassen, klasse_saatmenge, substrat_passung, begruendung,
                                       bestaetigt_am, quelle_id, fundstelle, kurzzitat, quelldatei, zeile_id, commit, app_version)
    select ebene, art_id, sorte_id, kulturform, samen_je_schwamm, obergrenze_samen, pflanzen_stehen_lassen,
           klasse_saatmenge, substrat_passung, begruendung, public.kalendertag(now()), quelle_id, fundstelle, kurzzitat,
           'app', zeile_id, version, version
      from public.saatempfehlung where id = (daten ->> 'saatempfehlung_id')::uuid
    returning id into neue_id;
  when 'art_neu' then
    -- Artmerkmale und Kulturformen von der Leitkultur der Kulturgruppe (A11); Sollwerte vererbt als Klasse D.
    select kg.leitkultur_art_id into lk from public.kulturgruppe kg where kg.kulturgruppe_id = daten ->> 'kulturgruppe_id';
    if lk is null then
      raise exception 'unbekannte Kulturgruppe';
    end if;
    insert into public.art_schluessel (art_id) values (daten ->> 'art_id');
    insert into public.art (art_id, name_de, name_wiss, kulturgruppe_id, standard_keimfaehigkeit, systemeignung,
                            umsetzen_ab_d, umsetzen_bis_d, kulturformen_erlaubt, kulturform_vorgabe,
                            quelldatei, zeile_id, commit, app_version)
    select daten ->> 'art_id', daten ->> 'name_de', daten ->> 'name_wiss', daten ->> 'kulturgruppe_id',
           l.standard_keimfaehigkeit, l.systemeignung, l.umsetzen_ab_d, l.umsetzen_bis_d,
           l.kulturformen_erlaubt, l.kulturform_vorgabe, 'app', 'art.' || (daten ->> 'art_id'), version, version
      from public.art l where l.art_id = lk and l.gueltig_bis is null
    returning id into neue_id;
    if neue_id is null then
      raise exception 'Leitkultur % ohne gültige Artmerkmale', lk;
    end if;
    insert into public.herkunft (tabelle, zeile_id, feld, quelle_id, fundstelle, kurzzitat, evidenzklasse, vermerk, app_version)
    select 'art', 'art.' || (daten ->> 'art_id'), h.feld, h.quelle_id, 'Leitkultur ' || lk || ': ' || h.fundstelle,
           h.kurzzitat, h.evidenzklasse, 'leitkultur', version
      from public.herkunft h join public.art l on l.art_id = lk and l.gueltig_bis is null
     where h.tabelle = 'art' and h.zeile_id = l.zeile_id and h.gueltig_bis is null
       and h.feld in ('standard_keimfaehigkeit', 'systemeignung', 'umsetzen_ab_d', 'umsetzen_bis_d',
                      'kulturformen_erlaubt', 'kulturform_vorgabe');
    insert into public.art_kulturform (art_id, kulturform, ernte_ab_d, ernteart, ernteintervall_d, schnitte_max,
                                       kulturdauer_max_d, kulturdauer_typisch_d, entspitzen,
                                       quelldatei, zeile_id, commit, app_version)
    select daten ->> 'art_id', ak.kulturform, ak.ernte_ab_d, ak.ernteart, ak.ernteintervall_d, ak.schnitte_max,
           ak.kulturdauer_max_d, ak.kulturdauer_typisch_d, ak.entspitzen,
           'app', 'ak.' || (daten ->> 'art_id') || '.' || ak.kulturform, version, version
      from public.art_kulturform ak where ak.art_id = lk and ak.gueltig_bis is null;
    insert into public.herkunft (tabelle, zeile_id, feld, quelle_id, fundstelle, kurzzitat, evidenzklasse, vermerk, app_version)
    select 'art_kulturform', 'ak.' || (daten ->> 'art_id') || '.' || ak.kulturform, h.feld, h.quelle_id,
           'Leitkultur ' || lk || ': ' || h.fundstelle, h.kurzzitat, h.evidenzklasse, 'leitkultur', version
      from public.art_kulturform ak
      join public.herkunft h on h.tabelle = 'art_kulturform' and h.zeile_id = ak.zeile_id and h.gueltig_bis is null
     where ak.art_id = lk and ak.gueltig_bis is null;
  else
    raise exception 'unbekannte Aktion %', aktion;
  end case;
  return neue_id;
end $$;
comment on function public.wissen_app_schreiben(text, jsonb) is
  'Einziger Schreibweg der App in Wissenstabellen (UC4): sorte_neu (sorte_id vom Client, sorte_key = zeile_id = app-<sorte_id>, idempotent), tuetenwert (Klasse C, Vermerk tuete; schliesst die gültige Fassung), saatempfehlung_neu (Klasse C aus der Tüte oder D ohne Quelle; daten.bestaetigt setzt bestaetigt_am), saatempfehlung_bestaetigen (neue Version mit bestaetigt_am), art_neu (Artmerkmale und Kulturformen von der Leitkultur mit Vermerk leitkultur, A11; Sollwerte vererbt als Klasse D). Herkunft «App», quelldatei app.';

-- ---------------------------------------------------------------------
-- 7 Sichten (alle security_invoker, damit RLS greift)
-- ---------------------------------------------------------------------

create view public.v_ec_wasser with (security_invoker = true) as
select a.id as anlage_id,
       coalesce(w.ec, a.ec_wasser_annahme) as ec,
       w.gilt_ab as gemessen_am,
       case when w.ec is null then 'annahme' else 'messung' end as herkunft
  from public.anlage a
  left join lateral (
       select m.ec, m.gilt_ab
         from public.messung m join public.platz p on p.id = m.platz_id
        where p.anlage_id = a.id and m.messart = 'w' and m.ec is not null and m.storniert_am is null
        order by m.gilt_ab desc limit 1) w on true
 where a.storniert_am is null;

create view public.v_sollwert with (security_invoker = true) as
with s as (
  select so.sorte_id, so.art_id, ar.kulturgruppe_id
    from public.sorte so
    join public.art ar on ar.art_id = so.art_id and ar.gueltig_bis is null
   where so.gueltig_bis is null),
k as (
  select s.sorte_id, pw.ebene, pw.phase, pw.groesse, pw.wert_min, pw.wert_typ, pw.wert_max, pw.text_wert,
         pw.ec_basis_quelle, pw.quelle_id, pw.evidenzklasse, pw.vermerk,
         case pw.ebene when 'sorte' then 1 when 'art' then 2 when 'kulturgruppe' then 3 else 4 end as rang
    from s join public.profilwert pw on pw.gueltig_bis is null and (
         (pw.ebene = 'sorte' and pw.sorte_id = s.sorte_id) or
         (pw.ebene = 'art' and pw.art_id = s.art_id) or
         (pw.ebene = 'kulturgruppe' and pw.kulturgruppe_id = s.kulturgruppe_id) or
         pw.ebene = 'standard'))
select distinct on (sorte_id, phase, groesse)
       sorte_id, phase, groesse, wert_min, wert_typ, wert_max, text_wert, ec_basis_quelle,
       ebene as herkunft_ebene, quelle_id,
       case when ebene in ('kulturgruppe', 'standard') then 'D' else evidenzklasse::text end as evidenzklasse,
       vermerk
  from k
 order by sorte_id, phase, groesse, rang;
comment on view public.v_sollwert is 'Vererbung Sorte → Art → Kulturgruppe → Standard je Phase und Grösse (R1.3); Herkunft Kulturgruppe oder Standard gilt als Klasse D.';

create view public.v_vollstaendigkeit with (security_invoker = true) as
with anw as (
  select v.sorte_id, v.phase from public.v_sollwert v
   where v.groesse = 'anwendbar' and v.text_wert = 'ja'),
letzte as (
  select sorte_id, max(phase) as letzte_phase from anw group by sorte_id),
pflicht as (
  select a.sorte_id, a.phase, pg.groesse, pg.mindestens_art
    from anw a join public.pflichtgroesse pg on pg.phase = a.phase
    join letzte l on l.sorte_id = a.sorte_id
   where not (pg.groesse = 'wechselmerkmal' and a.phase = l.letzte_phase)),
pruef as (
  select p.sorte_id,
         count(*) filter (where v.sorte_id is null
                             or (p.mindestens_art and v.herkunft_ebene not in ('sorte', 'art'))) as fehlend,
         count(*) filter (where v.evidenzklasse = 'D') as pruefauftraege_pflicht
    from pflicht p
    left join public.v_sollwert v on v.sorte_id = p.sorte_id and v.phase = p.phase and v.groesse = p.groesse
   group by p.sorte_id),
zusatz as (
  select a.sorte_id, count(*) as pruefauftraege_zusatz
    from anw a join public.v_sollwert v on v.sorte_id = a.sorte_id and v.phase = a.phase
   where v.groesse in ('wassertemp', 'licht_h') and v.evidenzklasse = 'D'
   group by a.sorte_id),
saat as (
  select so.sorte_id,
         bool_or(se.bestaetigt_am is not null) as saatempfehlung_bestaetigt
    from public.sorte so
    left join public.saatempfehlung se on se.gueltig_bis is null and (
         (se.ebene = 'sorte' and se.sorte_id = so.sorte_id) or (se.ebene = 'art' and se.art_id = so.art_id))
   where so.gueltig_bis is null
   group by so.sorte_id)
select s.sorte_id,
       coalesce(p.fehlend, 0) as fehlende_groessen,
       coalesce(p.pruefauftraege_pflicht, 0) + coalesce(z.pruefauftraege_zusatz, 0) as pruefauftraege,
       (p.sorte_id is not null and p.fehlend = 0 and coalesce(s.saatempfehlung_bestaetigt, false)) as vollstaendig
  from saat s
  left join pruef p on p.sorte_id = s.sorte_id
  left join zusatz z on z.sorte_id = s.sorte_id;
comment on view public.v_vollstaendigkeit is 'R1.4 und EK1: Pflichtgrössen je anwendbarer Phase, Dauer, pH, EC mindestens auf Art, bestätigte Saatempfehlung.';

create view public.v_fuellzustand with (security_invoker = true) as
select p.id as platz_id,
       case when n.letzter_ansatz is not null and (g.leer_seit is null or n.letzter_ansatz > g.leer_seit)
            then 'loesung' else 'leer' end as fuellzustand,
       n.letzter_ansatz
  from public.platz p
  left join lateral (select max(a.begonnen_am) as letzter_ansatz from public.naehrloesungsansatz a
                      where a.platz_id = p.id and a.typ = 'neuansatz' and a.storniert_am is null
                        and a.status <> 'abgebrochen') n on true
  left join lateral (select max(e.gilt_ab) filter (where e.typ in ('geleert', 'gefaess_erfasst', 'entfernt')) as leer_ev,
                            max(e.gilt_ab) filter (where e.typ = 'entfernt') as entfernt_am
                       from public.ereignis e
                      where e.platz_id = p.id and e.storniert_am is null
                        and e.typ in ('geleert', 'gefaess_erfasst', 'entfernt')) ev on true
  left join lateral (select greatest(ev.leer_ev,
                                     (select min(g2.gueltig_von) from public.gefaess g2
                                       where g2.platz_id = p.id and g2.storniert_am is null
                                         and (ev.entfernt_am is null or g2.gueltig_von > ev.entfernt_am))) as leer_seit) g on true
 where p.rolle = 'gefaess';
comment on view public.v_fuellzustand is 'leer oder loesung: leer seit dem letzten Ereignis geleert, gefaess_erfasst oder entfernt bzw. seit der ersten Belegung nach dem letzten «entfernt» (Rückfall wie v_gefaess_status), Lösung nach einem späteren Neuansatz (R5.4).';

create view public.v_nachfuellsumme with (security_invoker = true) as
select p.id as platz_id, coalesce(sum(a.nachgefuellt_l), 0) as liter
  from public.platz p
  left join lateral (select max(begonnen_am) as seit from public.naehrloesungsansatz
                      where platz_id = p.id and typ = 'neuansatz' and storniert_am is null and status <> 'abgebrochen') n on true
  left join public.naehrloesungsansatz a on a.platz_id = p.id and a.typ = 'nachfuellen'
       and a.storniert_am is null and n.seit is not null and a.begonnen_am > n.seit
 where p.rolle = 'gefaess'
 group by p.id;
comment on view public.v_nachfuellsumme is 'Nachfüllwasser seit dem letzten Neuansatz; erreicht es das Betriebsvolumen, ist der Wechsel fällig (R5.2).';

create view public.v_gefaess_status with (security_invoker = true) as
with roh as (
  select g.id as gefaess_id, g.platz_id,
         (select max(e.gilt_ab) from public.ereignis e where e.platz_id = g.platz_id and e.storniert_am is null
            and e.typ = 'gefaess_erfasst') as ge,
         (select max(e.gilt_ab) from public.ereignis e where e.platz_id = g.platz_id and e.storniert_am is null
            and e.typ = 'entfernt') as le
    from public.gefaess g
   where g.storniert_am is null and g.gueltig_bis is null),
basis as (
  select r.gefaess_id, r.platz_id,
         case when r.ge is not null and (r.le is null or r.ge >= r.le) then r.ge
              else (select min(g2.gueltig_von) from public.gefaess g2
                     where g2.platz_id = r.platz_id and g2.storniert_am is null
                       and (r.le is null or g2.gueltig_von > r.le)) end as erfasst_am
    from roh r),
ev as (
  select b.gefaess_id, b.platz_id,
         greatest(b.erfasst_am,
                  (select max(e.gilt_ab) from public.ereignis e where e.platz_id = b.platz_id and e.storniert_am is null
                     and e.typ = 'box_deckel_tausch' and e.gilt_ab >= b.erfasst_am)) as anker,
         (select e.gilt_ab from public.ereignis e where e.platz_id = b.platz_id and e.storniert_am is null
            and e.typ = 'entfernt' and e.gilt_ab >= b.erfasst_am order by e.gilt_ab desc limit 1) as entfernt_am,
         (select (e.daten ->> 'gesetzt')::boolean from public.ereignis e where e.platz_id = b.platz_id
            and e.storniert_am is null and e.typ = 'ruhe' and e.gilt_ab >= b.erfasst_am
          order by e.gilt_ab desc limit 1) as ruht
    from basis b),
pr as (
  select ev.gefaess_id,
         count(distinct (e.daten ->> 'schritt')) filter (where (e.daten ->> 'schritt')::int between 1 and 3
                                                           and (e.daten ->> 'ok')::boolean) as schritte_1_3,
         bool_or((e.daten ->> 'schritt')::int = 4 and (e.daten ->> 'ok')::boolean) as schritt_4
    from ev left join public.ereignis e on e.platz_id = ev.platz_id and e.typ = 'gefaesspruefung'
         and e.storniert_am is null and e.gilt_ab >= ev.anker
   group by ev.gefaess_id)
select ev.gefaess_id,
       case when ev.entfernt_am is not null then 'entfernt'
            when coalesce(ev.ruht, false) then 'ruht'
            when pr.schritte_1_3 = 3 and coalesce(pr.schritt_4, false) then 'in_betrieb'
            when pr.schritte_1_3 = 3 then 'in_betrieb_volumen_offen'
            else 'in_pruefung' end::public.gefaess_status as status
  from ev join pr on pr.gefaess_id = ev.gefaess_id;
comment on view public.v_gefaess_status is 'Prüfstatus aus Ereignissen (R5.4, R9.3). Anker ist das letzte Ereignis gefaess_erfasst am Platz (geschrieben beim Speichern im Assistenten, R9.3), ohne solches nach dem letzten «entfernt» das früheste gueltig_von der Belegungen danach (Rückfall), bzw. ein späterer Box- oder Deckeltausch; neue Belegungen bei Volumen- oder Betriebsartänderung setzen nicht zurück, ein entferntes Vorgängergefäss zählt nicht (A7).';

create view public.v_kalibrierung_faellig with (security_invoker = true) as
select mg.id as messgeraet_id, d.datenart, k.letzte,
       least(public.kalendertag(k.letzte) + 30,
             (select min(t) from public.einstellung es, unnest(es.feste_kalibriertermine) t
               where t > public.kalendertag(k.letzte)),
             (select min(public.kalendertag(e.gilt_ab)) from public.ereignis e
               where e.typ = 'sonde_gereinigt' and e.messgeraet_id = mg.id and e.storniert_am is null
                 and (e.daten ->> 'datenart')::public.datenart = d.datenart
                 and e.gilt_ab > k.letzte)) as faellig_am
  from public.messgeraet mg
  cross join unnest(enum_range(null::public.datenart)) d(datenart)
  left join lateral (select max(gilt_ab) as letzte from public.kalibrierung kb
                      where kb.messgeraet_id = mg.id and kb.storniert_am is null and kb.datenart = d.datenart) k on true;
comment on view public.v_kalibrierung_faellig is 'Fälligkeit je Datenart (8.1 Regel 7): +30 Tage, feste Termine (einstellung), sofort nach Sonde gereinigt derselben Datenart (R5.2). faellig_am null = noch nie kalibriert (Erstkalibrierung). Aufgabe und Push nutzen nur echt.';

create view public.v_messung_unsicher with (security_invoker = true) as
with m as (
  select m.id, m.messgeraet_id, m.gilt_ab, coalesce(a.datenart, m.datenart, 'echt') as datenart
    from public.messung m
    left join public.platz p on p.id = m.platz_id
    left join public.anlage a on a.id = p.anlage_id
   where m.storniert_am is null)
select m.id as messung_id,
       (k.letzte is null
        or public.kalendertag(m.gilt_ab) > least(
             public.kalendertag(k.letzte) + 30,
             (select min(t) from public.einstellung es, unnest(es.feste_kalibriertermine) t
               where t > public.kalendertag(k.letzte)))
        or exists (select 1 from public.ereignis e where e.typ = 'sonde_gereinigt' and e.messgeraet_id = m.messgeraet_id
                     and (e.daten ->> 'datenart')::public.datenart = m.datenart
                     and e.storniert_am is null and e.gilt_ab > k.letzte and e.gilt_ab < m.gilt_ab)
        or exists (select 1 from public.ereignis e
                     join public.kalibrierung x on x.id = (e.daten ->> 'seit_kalibrierung_id')::uuid
                    where e.typ = 'als_unsicher_markiert' and e.storniert_am is null
                      and (e.daten ->> 'datenart')::public.datenart = m.datenart
                      and x.messgeraet_id = m.messgeraet_id and x.datenart = m.datenart and x.storniert_am is null
                      and m.gilt_ab >= x.gilt_ab
                      and m.gilt_ab < coalesce((select min(n.gilt_ab) from public.kalibrierung n
                                                 where n.messgeraet_id = x.messgeraet_id and n.datenart = x.datenart
                                                   and n.storniert_am is null and n.gilt_ab > x.gilt_ab), e.gilt_ab))
       ) as unsicher
  from m
  left join lateral (select max(kb.gilt_ab) as letzte from public.kalibrierung kb
                      where kb.messgeraet_id = m.messgeraet_id and kb.storniert_am is null
                        and kb.datenart = m.datenart and kb.gilt_ab <= m.gilt_ab) k on true;
comment on view public.v_messung_unsicher is 'unsicher: fehlende oder überfällige Kalibrierung derselben Datenart (Tag 31 nach 30-Tage-Regel, TZ1 bis TZ4), Sonde gereinigt ohne neue Kalibrierung, oder Ereignis als_unsicher_markiert für Messungen zwischen Kalibrierung X und der nächsten Kalibrierung; Ereignisse und Kalibrierung X zählen nur für Messungen desselben Messgeräts und derselben Datenart (R10.3, R4.7, 8.1 Regel 7). Messungen ohne Platz (pH-Kontrolle) tragen ihre Datenart selbst.';

create view public.v_reservierung_aktiv with (security_invoker = true) as
select r.*
  from public.reservierung r
 where r.storniert_am is null
   and not exists (
       select 1 from public.ereignis e
        where e.pflanzung_id = r.pflanzung_id and e.storniert_am is null and e.gilt_ab >= r.gilt_ab
          and (e.typ = 'umsetzen' or (e.typ = 'abschluss' and e.daten ->> 'grund' in ('keimt_nicht', 'ausfall')))
          and not exists (select 1 from public.ereignis w where w.typ = 'wiederherstellen' and w.storniert_am is null
                            and (w.daten ->> 'ereignis_id')::uuid = e.id));
comment on view public.v_reservierung_aktiv is 'Reservierung bis Umsetzen, keimt nicht oder Ausfall; Wiederherstellen öffnet sie wieder (R8.2, UC6-AK9).';

create view public.v_netztopf_platz with (security_invoker = true) as
select t.id as netztopf_id, t.kennung,
       coalesce((o.daten ->> 'nach_platz_id')::uuid, t.heim_platz_id) as platz_id,
       coalesce((o.daten ->> 'nach_loch_nr')::smallint, t.heim_loch_nr) as loch_nr,
       coalesce((o.daten ->> 'nach_platz_id')::uuid, t.heim_platz_id) <> t.heim_platz_id
         or coalesce((o.daten ->> 'nach_loch_nr')::smallint, t.heim_loch_nr) <> t.heim_loch_nr as ausser_heim
  from public.netztopf t
  left join lateral (select e.daten from public.ereignis e
                      where e.netztopf_id = t.id and e.typ in ('verschieben', 'umsetzen', 'tausch')
                        and e.storniert_am is null order by e.gilt_ab desc limit 1) o on true
 where t.aktiv and t.storniert_am is null;
comment on view public.v_netztopf_platz is 'Aktueller Platz eines Topfs aus dem letzten Ortsereignis, sonst Heimplatz (R8.3).';

create view public.v_pflanzung_zustand with (security_invoker = true) as
select pf.id as pflanzung_id, pf.satz_id,
       coalesce((ph.daten ->> 'phase')::public.phase, 'keimung') as phase,
       ph.gilt_ab as phase_seit,
       coalesce(ab.daten ->> 'grund', 'aktiv') as status,
       ort.netztopf_id, ort.platz_id, ort.loch_nr
  from public.pflanzung pf
  left join lateral (select e.daten, e.gilt_ab from public.ereignis e
                      where e.satz_id = pf.satz_id
                        and e.typ = 'phase_antwort' and e.daten ->> 'antwort' = 'ja'
                        and e.storniert_am is null order by e.gilt_ab desc limit 1) ph on true
  left join lateral (select case when e.typ = 'ernte' then jsonb_build_object('grund', 'geerntet') else e.daten end as daten
                       from public.ereignis e
                      where e.pflanzung_id = pf.id and e.storniert_am is null
                        and (e.typ = 'abschluss' or (e.typ = 'ernte' and e.daten ->> 'art' = 'ab'))
                        and not exists (select 1 from public.ereignis w where w.typ = 'wiederherstellen'
                                          and w.storniert_am is null and (w.daten ->> 'ereignis_id')::uuid = e.id)
                      order by e.gilt_ab desc limit 1) ab on true
  left join lateral (select e.netztopf_id, (e.daten ->> 'nach_platz_id')::uuid as platz_id,
                            (e.daten ->> 'nach_loch_nr')::smallint as loch_nr
                       from public.ereignis e
                      where e.pflanzung_id = pf.id and e.typ in ('verschieben', 'umsetzen', 'tausch')
                        and e.storniert_am is null order by e.gilt_ab desc limit 1) ort on true
 where pf.storniert_am is null;
comment on view public.v_pflanzung_zustand is 'Phase aus der letzten bestätigten Phasenantwort ihres Satzes (Antworten stehen nur am Satz und gelten für alle Pflanzungen; Ausnahme je Satz; Start keimung). Status aus Abschluss oder Ernte {art: ab} (= geerntet) ohne Wiederherstellen. Ort aus Ortsereignissen; ohne Ortsereignis steht die Pflanzung am Anzuchtort bzw. im Direktsaat-Gefäss.';

create view public.v_keimrate with (security_invoker = true) as
with k as (
  select pf.id as pflanzung_id, s.saatgut_id,
         (e.daten ->> 'samen_gesaet')::int as gesaet, (e.daten ->> 'samen_gekeimt')::int as gekeimt
    from public.ereignis e
    join public.pflanzung pf on pf.id = e.pflanzung_id
    join public.satz s on s.id = pf.satz_id
    join public.platz p on p.id = coalesce(s.anzuchtort_platz_id, s.direktsaat_platz_id)
    join public.anlage a on a.id = p.anlage_id and a.datenart = 'echt'
   where e.typ = 'keimung' and e.storniert_am is null and (e.daten ->> 'keimtemp_eingehalten')::boolean
     and not exists (select 1 from public.ereignis n where n.pflanzung_id = e.pflanzung_id and n.typ = 'keimung'
                       and n.storniert_am is null and n.gilt_ab > e.gilt_ab))
select sg.id as saatgut_id,
       coalesce(sum(k.gesaet), 0) as gesaet,
       coalesce(sum(k.gekeimt), 0) as gekeimt,
       case when coalesce(sum(k.gesaet), 0) >= 10
            then (sum(k.gekeimt) + 10 * coalesce(sg.keimfaehigkeit_packung, ar.standard_keimfaehigkeit))
                 / (sum(k.gesaet) + 10)
            else coalesce(sg.keimfaehigkeit_packung, ar.standard_keimfaehigkeit) end as rate_geglaettet
  from public.saatgut sg
  join public.sorte so on so.sorte_id = sg.sorte_id and so.gueltig_bis is null
  left join public.art ar on ar.art_id = so.art_id and ar.gueltig_bis is null
  left join k on k.saatgut_id = sg.id
 where sg.storniert_am is null
 group by sg.id, sg.keimfaehigkeit_packung, ar.standard_keimfaehigkeit;
comment on view public.v_keimrate is 'Geglättete Keimrate ab 10 Samen derselben Packung, nur bei eingehaltener Keimtemperatur und Datenart echt (R12.2); die Begrenzung 0.3 bis 0.98 wendet src/domain an. Je Pflanzung zählt die letzte Keimprüfung.';

create view public.v_leitkultur_gewaehlt with (security_invoker = true) as
select distinct on (e.platz_id) e.platz_id, e.daten ->> 'art_id' as art_id, e.gilt_ab
  from public.ereignis e
 where e.typ = 'leitkultur_gewaehlt' and e.storniert_am is null
 order by e.platz_id, e.gilt_ab desc;
comment on view public.v_leitkultur_gewaehlt is 'Tims Wahl bei Gleichstand (R2.3). Die Leitkultur selbst rechnet src/domain (Kulturdauer, Wasserverbrauch, Topfzahl, dann diese Wahl); 8.3 nennt sie v_leitkultur.';

create view public.v_folgesatz with (security_invoker = true) as
select s.id as satz_id,
       (select v.id from public.satz v
         where v.sorte_id = s.sorte_id and v.storniert_am is null and v.saatdatum < s.saatdatum
           and exists (select 1 from public.reservierung rv join public.pflanzung pv on pv.id = rv.pflanzung_id
                         join public.netztopf tv on tv.id = rv.netztopf_id
                        where pv.satz_id = v.id and rv.storniert_am is null
                          and tv.heim_platz_id in (select t.heim_platz_id from public.reservierung r
                                                    join public.pflanzung p on p.id = r.pflanzung_id
                                                    join public.netztopf t on t.id = r.netztopf_id
                                                   where p.satz_id = s.id and r.storniert_am is null))
         order by v.saatdatum desc limit 1) as vorsatz_id
  from public.satz s
 where s.storniert_am is null;
comment on view public.v_folgesatz is 'Folgesatz = früherer Satz derselben Sorte mit demselben Zielgefäss (Glossar); vorsatz_id null = kein Folgesatz.';

create view public.v_ph_wirkung with (security_invoker = true) as
select avg(w) as wirkung_ml_je_l_je_0_1
  from (select pos.ist_ml / (a.volumen_l * (a.ph_vorher - a.ph_nachher) / 0.1) as w
          from public.naehrloesungsansatz a
          join public.ansatz_position pos on pos.ansatz_id = a.id and pos.produkt_id = 'ph_minus' and pos.storniert_am is null
          join public.platz p on p.id = a.platz_id join public.anlage an on an.id = p.anlage_id and an.datenart = 'echt'
         where a.typ = 'ph_korrektur' and a.storniert_am is null and a.ph_vorher > a.ph_nachher
         order by a.begonnen_am desc limit 5) x;
comment on view public.v_ph_wirkung is 'Mittel der letzten fünf protokollierten pH-Korrekturen (R4.14); ohne Daten null, dann Startwert 0.1 in src/domain.';

create view public.v_saeurebedarf with (security_invoker = true) as
select an.id as anlage_id,
       (select avg(x.s) from (
          select st.ph_minus_ml / a.volumen_l as s
            from public.naehrloesungsansatz a
            join public.ansatz_schritt st on st.ansatz_id = a.id and st.schritt = 'ph_einstellen' and st.storniert_am is null
            join public.platz p on p.id = a.platz_id
           where p.anlage_id = an.id and a.typ = 'neuansatz' and a.storniert_am is null and st.ph_minus_ml is not null
           order by a.begonnen_am desc limit 5) x) as ml_je_l
  from public.anlage an
 where an.datenart = 'echt' and an.storniert_am is null;
comment on view public.v_saeurebedarf is 'Mittel der ml pH-Minus je Liter Frischwasser aus den letzten fünf Ersteinstellungen (R4.13); null = «Nachfüllwasser noch nicht ansäuern».';

create view public.v_zielbereich with (security_invoker = true) as
select p.id as platz_id,
       max(v_ph.wert_min) as ph_min, min(v_ph.wert_max) as ph_max,
       max(public.ec_gesamt(v_ec.wert_min, v_ec.ec_basis_quelle, w.ec)) as ec_min,
       min(public.ec_gesamt(v_ec.wert_max, v_ec.ec_basis_quelle, w.ec)) as ec_max,
       max(v_t.wert_min) as temp_min, min(v_t.wert_max) as temp_max,
       count(*) as zaehlende_pflanzungen
  from public.v_pflanzung_zustand z
  join public.pflanzung pf on pf.id = z.pflanzung_id
  join public.satz s on s.id = pf.satz_id
  join public.platz p on p.id = coalesce(z.platz_id, s.direktsaat_platz_id)
  join public.v_ec_wasser w on w.anlage_id = p.anlage_id
  left join public.v_sollwert v_ph on v_ph.sorte_id = s.sorte_id and v_ph.phase = z.phase and v_ph.groesse = 'ph'
  left join public.v_sollwert v_ec on v_ec.sorte_id = s.sorte_id and v_ec.phase = z.phase and v_ec.groesse = 'ec'
  left join public.v_sollwert v_t on v_t.sorte_id = s.sorte_id and v_t.phase = z.phase and v_t.groesse = 'wassertemp'
 where z.status = 'aktiv' and p.rolle = 'gefaess'
 group by p.id;
comment on view public.v_zielbereich is '(A5) Zweck «Bewertung heute» aus R2.2: Schnittmenge der Pflanzungen mit aktuellem Platz in ihrer bestätigten Phase. Leere Schnittmenge erkennbar an min > max; Mischentscheid, Stationen und die übrigen Zwecke in src/domain.';

create view public.v_station_frei with (security_invoker = true) as
select g.platz_id, d.topfdurchmesser_mm as groesse_mm,
       (select sum(x) from unnest(d.loecher_je_reihe) x) as loecher,
       (select sum(x) from unnest(d.loecher_je_reihe) x)
         - (select count(*) from public.v_pflanzung_zustand z where z.platz_id = g.platz_id and z.status = 'aktiv') as frei_heute
  from public.gefaess g join public.deckeltyp d on d.id = g.deckeltyp_id
 where g.feste_dosis and g.gueltig_bis is null and g.storniert_am is null;
comment on view public.v_station_frei is 'Freie Stationsplätze heute; die Vorschau «frei am TT.MM.» rechnet src/domain aus Keimdauer und geplanten Umsetzdaten (R6.1).';

-- Auswertungssichten (8.3, 8.6): nur Datenart echt im Fenster testbetrieb, halboffen
-- [von, bis): bis = 1.4.2027 00:00 gehört nicht mehr dazu, bei Tagen t.tag < kalendertag(bis).
create view public.v_auswertung_platz with (security_invoker = true) as
select p.id as platz_id from public.platz p join public.anlage a on a.id = p.anlage_id where a.datenart = 'echt';

create view public.v_termintreue with (security_invoker = true) as
select t.tag, count(*) as faellig,
       count(*) filter (where exists (
         select 1 from public.ereignis e where e.aufgabe_schluessel = t.aufgabe_schluessel and e.storniert_am is null
            and not e.nacherfasst and public.kalendertag(e.gilt_ab) <= t.faellig_am + 1
         union all
         select 1 from public.messung m where m.aufgabe_schluessel = t.aufgabe_schluessel and m.storniert_am is null
            and not m.nacherfasst and public.kalendertag(m.gilt_ab) <= t.faellig_am + 1
         union all
         select 1 from public.naehrloesungsansatz a where a.aufgabe_schluessel = t.aufgabe_schluessel and a.storniert_am is null
            and not a.nacherfasst and public.kalendertag(a.gilt_ab) <= t.faellig_am + 1
         union all
         select 1 from public.kalibrierung k where k.aufgabe_schluessel = t.aufgabe_schluessel and k.storniert_am is null
            and not k.nacherfasst and public.kalendertag(k.gilt_ab) <= t.faellig_am + 1)) as erledigt_bis_folgetag
  from public.aufgabe_tagesliste t
  join public.auswertung_fenster f on f.name = 'testbetrieb' and t.tag >= public.kalendertag(f.von) and t.tag < public.kalendertag(f.bis)
  left join public.v_auswertung_platz ap on ap.platz_id = t.platz_id
 where t.platz_id is null or ap.platz_id is not null
 group by t.tag;

create view public.v_ek6_messdauer with (security_invoker = true) as
select date_trunc('week', public.kalendertag(m.gilt_ab)) as woche,
       percentile_cont(0.5) within group (order by m.erfassungsdauer_s) as median_s,
       percentile_cont(0.9) within group (order by m.erfassungsdauer_s) as p90_s,
       count(*) as anzahl
  from public.messung m
  join public.v_auswertung_platz ap on ap.platz_id = m.platz_id
  join public.auswertung_fenster f on f.name = 'testbetrieb' and m.gilt_ab >= f.von and m.gilt_ab < f.bis
 where m.storniert_am is null and m.messart in ('rundgang', 'aufgabe') and m.erfassungsdauer_s is not null
 group by 1;

create view public.v_sollbereichsquote with (security_invoker = true) as
select m.schnappschuss ->> 'betriebsart' as betriebsart, b.wert as messgroesse, b.bewertung,
       coalesce(u.unsicher, false) as unsicher, count(*) as anzahl
  from public.messung m
  join public.v_auswertung_platz ap on ap.platz_id = m.platz_id
  join public.auswertung_fenster f on f.name = 'testbetrieb' and m.gilt_ab >= f.von and m.gilt_ab < f.bis
  left join public.v_messung_unsicher u on u.messung_id = m.id
  cross join lateral (values ('ph', m.bewertung_ph), ('ec', m.bewertung_ec), ('temp', m.bewertung_temp)) b(wert, bewertung)
 where m.storniert_am is null and b.bewertung is not null
 group by 1, 2, 3, 4;

create view public.v_rechnerguete with (security_invoker = true) as
select coalesce(a.stadium_gewaehlt, a.stadium_vorschlag) as stadium, a.skaliert,
       count(*) as ansaetze,
       avg(e.ec - a.ec_erwartet_final) as mittel_abweichung,
       count(*) filter (where a.k_vorschlag is not null) as k_vorschlaege
  from public.naehrloesungsansatz a
  join public.messung e on e.id = a.endmessung_id
  join public.v_auswertung_platz ap on ap.platz_id = a.platz_id
  join public.auswertung_fenster f on f.name = 'testbetrieb' and a.gilt_ab >= f.von and a.gilt_ab < f.bis
 where a.typ = 'neuansatz' and a.storniert_am is null
 group by 1, 2;

create view public.v_phasenprognose with (security_invoker = true) as
select s.sorte_id, s.kulturform, e.daten ->> 'phase' as phase,
       public.kalendertag(e.gilt_ab) - (e.daten ->> 'erwartet_am')::date as abweichung_tage
  from public.ereignis e
  join public.satz s on s.id = coalesce(e.satz_id, (select pf.satz_id from public.pflanzung pf where pf.id = e.pflanzung_id))
  join public.v_auswertung_platz ap on ap.platz_id = coalesce(s.anzuchtort_platz_id, s.direktsaat_platz_id)
  join public.auswertung_fenster f on f.name = 'testbetrieb' and e.gilt_ab >= f.von and e.gilt_ab < f.bis
 where e.typ = 'phase_antwort' and e.daten ->> 'antwort' = 'ja' and e.storniert_am is null
   and not coalesce((e.daten ->> 'nachgefuehrt')::boolean, false);

create view public.v_keimdauer with (security_invoker = true) as
select s.sorte_id, s.saatdatum,
       coalesce((e.daten ->> 'vorherige_pruefung_am')::date, s.saatdatum) - s.saatdatum as keimdauer_von_d,
       public.kalendertag(e.gilt_ab) - s.saatdatum as keimdauer_bis_d
  from public.ereignis e
  join public.pflanzung pf on pf.id = e.pflanzung_id
  join public.satz s on s.id = pf.satz_id
  join public.v_auswertung_platz ap on ap.platz_id = coalesce(s.anzuchtort_platz_id, s.direktsaat_platz_id)
  join public.auswertung_fenster f on f.name = 'testbetrieb' and e.gilt_ab >= f.von and e.gilt_ab < f.bis
 where e.typ = 'keimung' and e.storniert_am is null and (e.daten ->> 'samen_gekeimt')::int > 0;

create view public.v_ki_guete with (security_invoker = true) as
select k.feld, k.bewertung_eval, count(*) as anzahl
  from public.ki_feldprotokoll k
  join public.auswertung_fenster f on f.name = 'testbetrieb' and k.erfasst_am >= f.von and k.erfasst_am < f.bis
 where k.storniert_am is null and k.bewertung_eval is not null
 group by 1, 2;
comment on view public.v_ki_guete is 'KI-Felder der Saattüten (UC4); KI-Erfassungen gibt es nur in der echten Anlage, deshalb nur das Fenster als Filter (A).';

create view public.v_uebersteuerungen with (security_invoker = true) as
with f as (select von, bis from public.auswertung_fenster where name = 'testbetrieb'),
an as (select a.* from public.naehrloesungsansatz a join public.v_auswertung_platz ap on ap.platz_id = a.platz_id, f
        where a.storniert_am is null and a.gilt_ab >= f.von and a.gilt_ab < f.bis),
sz as (select s.* from public.satz s join public.v_auswertung_platz ap on ap.platz_id = coalesce(s.anzuchtort_platz_id, s.direktsaat_platz_id), f
        where s.storniert_am is null and s.gilt_ab >= f.von and s.gilt_ab < f.bis)
select 'stadium' as art, count(*) as anzahl from an where stadium_gewaehlt is distinct from stadium_vorschlag and stadium_gewaehlt is not null
union all select 'ziel_ec', count(*) from an where ziel_ec_gewaehlt is distinct from ziel_ec_vorschlag and ziel_ec_gewaehlt is not null
union all select 'mischentscheid', count(*) from an where mischentscheid <> 'keiner'
union all select 'k_uebernommen', count(*) from an where k_uebernommen
union all select 'schwaemme_oder_samen', count(*) from sz where anzahl_schwaemme <> schwaemme_vorschlag or samen_je_schwamm <> samen_vorschlag
union all select 'nicht_empfohlen_gewaehlt', count(*) from public.pflanzung pf join sz on sz.id = pf.satz_id
          where pf.einstufung = 'nicht_empfohlen' and pf.storniert_am is null
union all select 'ki_feld_korrigiert', count(*) from public.ki_feldprotokoll k, f
          where k.status = 'geaendert' and k.storniert_am is null and k.erfasst_am >= f.von and k.erfasst_am < f.bis;
comment on view public.v_uebersteuerungen is 'Übersteuerungen (14.5), nur Datenart echt im Fenster testbetrieb (C4-AK3).';

create view public.v_etikett_scans with (security_invoker = true) as
select date_trunc('week', public.kalendertag(ea.aufgerufen_am)) as woche, ea.ergebnis, count(*) as anzahl
  from public.etikett_aufruf ea
  join public.anlage a on a.kuerzel = split_part(ea.code, '-', 1) and a.datenart = 'echt' and a.storniert_am is null
  join public.auswertung_fenster f on f.name = 'testbetrieb' and ea.aufgerufen_am >= f.von and ea.aufgerufen_am < f.bis
 group by 1, 2;

create view public.v_klima with (security_invoker = true) as
select distinct on (m.platz_id, public.kalendertag(m.gilt_ab))
       m.platz_id, public.kalendertag(m.gilt_ab) as tag, m.temperatur
  from public.messung m
  join public.v_auswertung_platz ap on ap.platz_id = m.platz_id
  join public.auswertung_fenster f on f.name = 'testbetrieb' and m.gilt_ab >= f.von and m.gilt_ab < f.bis
 where m.storniert_am is null and m.temperatur is not null
   and (m.gilt_ab at time zone 'Europe/Zurich')::time between '18:00' and '21:30'
 order by m.platz_id, public.kalendertag(m.gilt_ab), m.gilt_ab desc;
comment on view public.v_klima is 'Wassertemperatur am Ende der Lichtphase: letzte Messung 18:00 bis 21:30 Ortszeit je Gefäss und Tag (E6, Entscheid R12); nur echt im Fenster.';

create view public.v_pflegezeit with (security_invoker = true) as
with f as (select von, bis from public.auswertung_fenster where name = 'testbetrieb')
select date_trunc('week', public.kalendertag(x.zeit)) as woche, sum(x.sekunden) / 3600.0 as stunden
  from (select m.gilt_ab as zeit, m.erfassungsdauer_s as sekunden from public.messung m
          join public.v_auswertung_platz ap on ap.platz_id = m.platz_id where m.storniert_am is null
        union all
        select a.gilt_ab, a.dauer_s from public.naehrloesungsansatz a
          join public.v_auswertung_platz ap on ap.platz_id = a.platz_id where a.storniert_am is null
        union all
        select e.gilt_ab, e.dauer_s from public.ereignis e
          left join public.platz p on p.id = e.platz_id
          left join public.bereich b on b.id = e.bereich_id
          left join public.netztopf t on t.id = e.netztopf_id
          left join public.satz s on s.id = coalesce(e.satz_id, (select pf.satz_id from public.pflanzung pf where pf.id = e.pflanzung_id))
          left join public.platz sp on sp.id = coalesce(s.anzuchtort_platz_id, s.direktsaat_platz_id)
          left join public.anlage an on an.id = coalesce(e.anlage_id, p.anlage_id, b.anlage_id, t.anlage_id, sp.anlage_id)
         where e.storniert_am is null and coalesce(an.datenart::text, e.daten ->> 'datenart') = 'echt'
        union all
        select k.gilt_ab, k.dauer_s from public.kalibrierung k where k.storniert_am is null and k.datenart = 'echt'
        union all
        select pv.gespeichert_am, pv.dauer_s from public.pflanzvorgang pv
         where pv.storniert_am is null and exists (
               select 1 from public.pflanzung pf join public.satz s on s.id = pf.satz_id
                 join public.v_auswertung_platz ap on ap.platz_id = coalesce(s.anzuchtort_platz_id, s.direktsaat_platz_id)
                where pf.pflanzvorgang_id = pv.id)) x, f
 where x.sekunden is not null and x.zeit >= f.von and x.zeit < f.bis
 group by 1;
comment on view public.v_pflegezeit is 'Ist-Stunden am Regal je Woche aus Erfassungs- und Arbeitsdauern (14.5); nur echt im Fenster. Die Anlage eines Ereignisses folgt aus Anlage, Platz, Bereich, Netztopf oder Satz (auch über die Pflanzung), sonst aus daten.datenart (Messgerät-Ereignisse); Ereignisse nur mit Art oder Sorte zählen nicht (A).';

-- ---------------------------------------------------------------------
-- 8 Zugriff: RLS auf jeder Tabelle (8.1 Regel 6, 11.6)
-- Tabellenrechte (Fehler #65, Migration 20261104170000_tabellenrechte.sql): Gehostete Supabase-Projekte geben
-- Tabellen in public nicht mehr automatisch für die Data API frei. Die Migration setzt deshalb ausdrücklich
-- select, insert, update, delete für authenticated und service_role, auch als Standardrecht für künftige
-- Tabellen der Rolle postgres; kein truncate. RLS entscheidet weiter über die Zeilen.
-- Wissen: nur lesen (Schreiben über Seed mit Service-Rolle oder
-- wissen_app_schreiben). Übrige: lesen, einfügen, ändern; kein Löschen
-- durch die App (Storno), Demo- und Testdaten löscht die Service-Rolle.
-- ---------------------------------------------------------------------

do $$
declare
  t text;
  wissen text[] := array['quelle', 'art_schluessel', 'kulturgruppe', 'art', 'art_kulturform', 'kulturform_profilende',
                         'herkunft', 'sorte_schluessel', 'sorte', 'profilwert', 'pflichtgroesse', 'saatempfehlung',
                         'produkt', 'duengerschema', 'wissenseintrag', 'auswertung_fenster',
                         'aufgabe_tagesliste', 'backup_status', 'zugang', 'ki_aufruf'];
  nur_aendern text[] := array['messgeraet'];
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy tim_lesen on public.%I for select to authenticated using (public.ist_tim())', t);
    if not t = any (wissen) and not t = any (nur_aendern) then
      execute format('create policy tim_einfuegen on public.%I for insert to authenticated with check (public.ist_tim())', t);
    end if;
    if not t = any (wissen) then
      execute format('create policy tim_aendern on public.%I for update to authenticated using (public.ist_tim()) with check (public.ist_tim())', t);
    end if;
  end loop;
end $$;
-- messgeraet: Tim ändert u_ec und u_ph aus der Geräteprüfung (UC0 Einstellungen), legt aber keine Geräte an.

-- ---------------------------------------------------------------------
-- 9 Storage (nur in Supabase; Konzept 11.6 Punkt 3)
-- insert into storage.buckets (id, name, public) values ('saattueten', 'saattueten', false);
-- create policy saattueten_tim on storage.objects for all to authenticated
--   using (bucket_id = 'saattueten' and public.ist_tim())
--   with check (bucket_id = 'saattueten' and public.ist_tim());
-- Pfad saattueten/{sorte_id}/{uuid}.jpg; Anzeige über signierte Links (60 s).
-- ---------------------------------------------------------------------
