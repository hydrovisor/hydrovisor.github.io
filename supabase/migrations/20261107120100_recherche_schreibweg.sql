-- 20261107120100_recherche_schreibweg.sql · Recherche im Schreibweg der App (Issue #37, Plan 37 Migration Punkt 2;
-- Konzept 8.1 Regel 6, 11.3, R1.3, R1.4, R12.3, Erratum E8; Annahmen A1, A3, A4, A5, A11, A12, A13).
--
-- Additiv:
--   - ki_aufruf.zweck (nullable, Check tuete, recherche, quellenpruefer); Zeilen aus ki-tuete bleiben leer (A11).
--   - wissen_app_schreiben(text, jsonb) mit gleicher Signatur, Ausgangsfassung 20261103140000_datenmodell.sql.
--     Neu: recherche_wert, recherche_saatempfehlung; sorte_neu legt mit katalog_link die Quelle katalog-<sorte_key>
--     an (A12). Alle übrigen Aktionen wörtlich unverändert.
-- Kein neues Recht, keine neue Tabelle, keine Sicht. Der Enum-Wert recherche entsteht in 20261107120000 (A1).
-- Rückweg: create or replace function mit der Fassung aus 20261103140000_datenmodell.sql; die Spalte zweck bleibt.

-- ---------------------------------------------------------------------
-- ki_aufruf.zweck
-- ---------------------------------------------------------------------

alter table public.ki_aufruf
  add column if not exists zweck text check (zweck in ('tuete', 'recherche', 'quellenpruefer'));
comment on column public.ki_aufruf.zweck is
  'Zweck des Aufrufs: tuete (ki-tuete), recherche und quellenpruefer (ki-recherche); leer bei Zeilen aus ki-tuete (Plan 37 A11).';
comment on table public.ki_aufruf is
  'Jeder Aufruf von ki-tuete und ki-recherche, geschrieben vor dem API-Request; Grundlage der gemeinsamen Grenze 30 Aufrufe je Tag über alle Zeilen (11.1, 11.3).';

-- ---------------------------------------------------------------------
-- wissen_app_schreiben
-- ---------------------------------------------------------------------

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
  -- sorte_neu mit katalog_link (A12)
  kq text;
  -- Recherche (E8)
  rq jsonb;
  rq_id text;
  rq_klasse public.quelle_klasse;
  rq_methode public.system;
  ev public.evidenzklasse;
  rw_phase public.phase;
  rw_groesse public.groesse;
  se_art text;
  se_kf public.kulturform;
  se_samen smallint;
  se_ober smallint;
  se_stehen smallint;
begin
  if not public.ist_tim() then
    raise exception 'nicht erlaubt';
  end if;

  -- Gemeinsame Prüfung der Recherche (8.1 Regel 6, 9.1, E8): Quelle als Unterobjekt daten.quelle, nur
  -- hydroponische Quellen der Klassen peer_review, universitaet_beratung, hersteller oder praxis; Fundstelle und
  -- Kurzzitat Pflicht. Die Quelle selbst entsteht erst, wenn tatsächlich eine Zeile geschrieben wird.
  if aktion in ('recherche_wert', 'recherche_saatempfehlung') then
    rq := daten -> 'quelle';
    if rq is null or jsonb_typeof(rq) <> 'object' then
      raise exception 'quelle fehlt';
    end if;
    rq_id := rq ->> 'quelle_id';
    -- (A) Recherche-Quellen tragen die quelle_id recherche-<hash> (Plan 37 A19), damit sie nie eine W0-Quelle treffen
    if rq_id is null or rq_id not like 'recherche-%' then
      raise exception 'quelle_id der Recherche muss mit recherche- beginnen';
    end if;
    rq_klasse := (rq ->> 'klasse')::public.quelle_klasse;
    if rq_klasse is null or rq_klasse not in ('peer_review', 'universitaet_beratung', 'hersteller', 'praxis') then
      raise exception 'Quellenklasse % ist für die Recherche nicht erlaubt', coalesce(rq_klasse::text, 'leer');
    end if;
    rq_methode := (rq ->> 'anbaumethode')::public.system;
    if rq_methode is null or rq_methode = 'keine' then
      raise exception 'Quelle der Recherche ohne hydroponische Anbaumethode';
    end if;
    -- (A) Adresse https wie im Validator (Plan 37, Grundregel für Recherche-Werte)
    if coalesce(rq ->> 'link', '') not like 'https://%' then
      raise exception 'Adresse der Quelle muss mit https:// beginnen';
    end if;
    if coalesce(btrim(daten ->> 'fundstelle'), '') = '' or coalesce(btrim(daten ->> 'kurzzitat'), '') = '' then
      raise exception 'Fundstelle oder Kurzzitat fehlt';
    end if;
    if length(daten ->> 'kurzzitat') > 200 then
      raise exception 'Kurzzitat länger als 200 Zeichen';
    end if;
    -- (A) Eine schon vorhandene Quelle derselben quelle_id muss die Bedingungen ebenfalls erfüllen
    if exists (select 1 from public.quelle q
                where q.quelle_id = rq_id
                  and (q.klasse not in ('peer_review', 'universitaet_beratung', 'hersteller', 'praxis')
                       or q.anbaumethode = 'keine')) then
      raise exception 'vorhandene Quelle % ist für die Recherche nicht erlaubt', rq_id;
    end if;
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
    -- Katalogquelle aus katalog_link (A12): eine Quelle katalog-<sorte_key> je Sorte, Klasse katalog,
    -- Anbaumethode keine. Eine ausdrücklich genannte katalog_quelle_id hat Vorrang (A).
    kq := daten ->> 'katalog_quelle_id';
    if kq is null and nullif(btrim(daten ->> 'katalog_link'), '') is not null then
      kq := 'katalog-' || sk_key;
      insert into public.quelle (quelle_id, titel, link, klasse, anbaumethode, app_version)
      values (kq, 'Katalog ' || (daten ->> 'name'), btrim(daten ->> 'katalog_link'), 'katalog', 'keine', version)
      on conflict (quelle_id) do nothing;
    end if;
    -- Katalogwerte mit Herkunft (Klasse C, Vermerk katalog), nur wenn eine Katalogquelle angegeben ist
    insert into public.herkunft (tabelle, zeile_id, feld, quelle_id, fundstelle, kurzzitat, evidenzklasse, vermerk, app_version)
    select 'sorte', sk_key, f.feld, kq, coalesce(daten ->> 'katalog_fundstelle', 'Katalog'),
           coalesce(daten ->> 'katalog_kurzzitat', 'Katalog'), 'C', 'katalog', version
      from (values ('wuchshoehe_max_mm'), ('wuchsform'), ('fruehzeitigkeit_relativ_d')) f(feld)
     where kq is not null and daten ->> f.feld is not null;
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
  when 'recherche_wert' then
    -- Ein Sollwert aus der Recherche (8.1 Regel 6, 11.3, E8): Ebene Art (A3), Vermerk recherche, nicht freigegeben.
    -- Überschreibt nie eine gültige Zeile (W0 oder frühere Recherche); dann null ohne Wirkung.
    ev := (daten ->> 'evidenzklasse')::public.evidenzklasse;
    if ev is null or ev not in ('B1', 'B2', 'C') then
      raise exception 'Recherche-Werte nur mit Evidenz B1, B2 oder C';
    end if;
    bezug := daten ->> 'art_id';
    rw_phase := (daten ->> 'phase')::public.phase;
    rw_groesse := (daten ->> 'groesse')::public.groesse;
    if bezug is null or rw_phase is null or rw_groesse is null then
      raise exception 'art_id, phase oder groesse fehlt';
    end if;
    -- (A) Kein vorgängiger exists-Test: PostgreSQL prüft die Checks von profilwert (Validator 9.4) vor dem Teilindex
    -- profilwert_gueltig. So scheitert ein ungültiger Wert immer am Check, und eine schon gültige Zeile (W0, frühere
    -- Recherche oder gleichzeitiger Lauf, A13) führt zu unique_violation → null. Die Quelle steht im selben Block und
    -- verschwindet dann mit dem Rücksprung des Blocks.
    begin
      insert into public.quelle (quelle_id, titel, link, klasse, anbaumethode, abgerufen_am, app_version)
      values (rq_id, coalesce(nullif(btrim(rq ->> 'titel'), ''), rq ->> 'link'), rq ->> 'link', rq_klasse, rq_methode,
              coalesce((rq ->> 'abgerufen_am')::date, public.kalendertag(now())), version)
      on conflict (quelle_id) do nothing;
      insert into public.profilwert (ebene, art_id, phase, groesse, wert_min, wert_typ, wert_max, text_wert,
                                     ec_min_quelle, ec_max_quelle, ec_einheit_quelle, ec_basis_quelle,
                                     system_quelle, umgebung_quelle, quelle_id, fundstelle, kurzzitat,
                                     evidenzklasse, vermerk, quelldatei, zeile_id, commit, freigegeben_am, app_version)
      values ('art', bezug, rw_phase, rw_groesse,
              (daten ->> 'wert_min')::numeric, (daten ->> 'wert_typ')::numeric, (daten ->> 'wert_max')::numeric,
              daten ->> 'text_wert',
              (daten ->> 'ec_min_quelle')::numeric, (daten ->> 'ec_max_quelle')::numeric,
              (daten ->> 'ec_einheit_quelle')::public.ec_einheit, (daten ->> 'ec_basis_quelle')::public.ec_basis,
              (daten ->> 'system_quelle')::public.system, (daten ->> 'umgebung_quelle')::public.umgebung,
              rq_id, btrim(daten ->> 'fundstelle'), daten ->> 'kurzzitat', ev, 'recherche', 'app',
              'pw.recherche.' || bezug || '.' || rw_phase || '.' || rw_groesse, version, null, version)
      returning id into neue_id;
    exception when unique_violation then
      -- für (Art, Phase, Grösse) gilt schon eine Zeile (profilwert_gueltig, 11.3, A13): ohne Wirkung
      return null;
    end;
  when 'recherche_saatempfehlung' then
    -- Saatempfehlung aus der Recherche (R12.3, E8): nur Klasse B oder C (A4), gilt als bestätigt.
    -- Ebene Art, wenn für (Art, Kulturform) nichts gilt; sonst Sorte, wenn dort nichts gilt; sonst null (A5).
    klasse := (daten ->> 'klasse_saatmenge')::public.klasse_saatmenge;
    if klasse is null or klasse not in ('B', 'C') then
      raise exception 'aus der Recherche nur Klasse B oder C';
    end if;
    select sk.sorte_key, so.art_id into sk_key, se_art
      from public.sorte_schluessel sk
      join public.sorte so on so.sorte_id = sk.id and so.gueltig_bis is null
     where sk.id = (daten ->> 'sorte_id')::uuid;
    if sk_key is null then
      raise exception 'unbekannte Sorte';
    end if;
    se_kf := (daten ->> 'kulturform')::public.kulturform;
    if se_kf is null then
      raise exception 'kulturform fehlt';
    end if;
    se_samen := (daten ->> 'samen_je_schwamm')::smallint;
    se_ober := coalesce((daten ->> 'obergrenze_samen')::smallint, se_samen);
    se_stehen := coalesce((daten ->> 'pflanzen_stehen_lassen')::smallint, 1);
    -- (A) Grenzen wie im Validator (Plan 37 A9): Obergrenze höchstens 25, Pflanzen stehen lassen höchstens Samen
    if se_samen is null or se_samen < 1 or se_ober < se_samen or se_ober > 25
       or se_stehen < 1 or se_stehen > se_samen then
      raise exception 'Saatmenge ausserhalb der Grenzen';
    end if;
    if not exists (select 1 from public.saatempfehlung se
                    where se.ebene = 'art' and se.art_id = se_art and se.kulturform = se_kf and se.gueltig_bis is null) then
      ebene_se := 'art';
      bezug := se_art;
    elsif not exists (select 1 from public.saatempfehlung se
                       where se.ebene = 'sorte' and se.sorte_id = (daten ->> 'sorte_id')::uuid
                         and se.kulturform = se_kf and se.gueltig_bis is null) then
      ebene_se := 'sorte';
      bezug := sk_key;
    else
      return null;
    end if;
    insert into public.quelle (quelle_id, titel, link, klasse, anbaumethode, abgerufen_am, app_version)
    values (rq_id, coalesce(nullif(btrim(rq ->> 'titel'), ''), rq ->> 'link'), rq ->> 'link', rq_klasse, rq_methode,
            coalesce((rq ->> 'abgerufen_am')::date, public.kalendertag(now())), version)
    on conflict (quelle_id) do nothing;
    begin
      insert into public.saatempfehlung (ebene, art_id, sorte_id, kulturform, samen_je_schwamm, obergrenze_samen,
                                         pflanzen_stehen_lassen, klasse_saatmenge, substrat_passung, begruendung,
                                         bestaetigt_am, quelle_id, fundstelle, kurzzitat, quelldatei, zeile_id, commit,
                                         freigegeben_am, app_version)
      values (ebene_se,
              case when ebene_se = 'art' then se_art end,
              case when ebene_se = 'sorte' then (daten ->> 'sorte_id')::uuid end,
              se_kf, se_samen, se_ober, se_stehen, klasse, daten ->> 'substrat_passung',
              coalesce(nullif(btrim(daten ->> 'begruendung'), ''), 'Recherche'),
              public.kalendertag(now()), rq_id, btrim(daten ->> 'fundstelle'), daten ->> 'kurzzitat',
              'app', 'se.' || bezug || '.' || se_kf, version, null, version)
      returning id into neue_id;
    exception when unique_violation then
      -- gleichzeitiger Lauf hat die Zeile schon geschrieben (saatempfehlung_gueltig, A13)
      return null;
    end;
  else
    raise exception 'unbekannte Aktion %', aktion;
  end case;
  return neue_id;
end $$;
comment on function public.wissen_app_schreiben(text, jsonb) is
  'Einziger Schreibweg der App in Wissenstabellen (UC4): sorte_neu (sorte_id vom Client, sorte_key = zeile_id = app-<sorte_id>, idempotent; mit katalog_link Quelle katalog-<sorte_key> und Herkunft Klasse C, Vermerk katalog), tuetenwert (Klasse C, Vermerk tuete; schliesst die gültige Fassung), saatempfehlung_neu (Klasse C aus der Tüte oder D ohne Quelle; daten.bestaetigt setzt bestaetigt_am), saatempfehlung_bestaetigen (neue Version mit bestaetigt_am), art_neu (Artmerkmale und Kulturformen von der Leitkultur mit Vermerk leitkultur, A11; Sollwerte vererbt als Klasse D), recherche_wert (profilwert Ebene Art, Vermerk recherche, Evidenz B1 bis C, Quelle aus daten.quelle; null, wenn schon eine gültige Zeile besteht), recherche_saatempfehlung (Klasse B oder C, bestätigt; Ebene Art, sonst Sorte, sonst null). Herkunft «App», quelldatei app.';
-- Ä2: eigene Prüfung über ist_tim(); anon ausgeschlossen.
revoke execute on function public.wissen_app_schreiben(text, jsonb) from public, anon;
grant execute on function public.wissen_app_schreiben(text, jsonb) to authenticated;
