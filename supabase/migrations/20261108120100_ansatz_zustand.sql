-- 20261108120100_ansatz_zustand.sql · Zustand des Nährlösungsansatzes aus Schritten und Messungen (Issue #29, Plan 29
-- Migration Punkt 2; Konzept 8.1 Regel 2, 6.2, R4.6, R4.14, U7, TP5; Annahmen A21 bis A25).
--
-- Additiv, keine neue Tabelle, keine Spalte, kein Check:
--   - Triggerfunktion ansatz_zustand_nachrechnen() mit den Triggern ansatz_schritt_zustand (ansatz_schritt) und
--     messung_ansatz_zustand (messung, nur mit ansatz_id): Sie rechnet status, abgeschlossen_am, timer_ende, dauer_s,
--     kontrollmessung_id und endmessung_id genau eines Ansatzes nach (Insert und Storno als Auslöser).
--   - Schutz ansatz_zustand_geschuetzt() vor update auf naehrloesungsansatz (Muster cache_geschuetzt()).
--   - v_ph_wirkung mit gleichen Spalten; pH nachher auch aus der Messung nachmessen (A23).
-- Die App schreibt nie ein Zustandsfeld (Plan 29 A5); die übrigen Spalten bleiben änderbar (setzen für
-- ec_erwartet_final und k_vorschlag, storniert_am).
-- Bestand: kein Nachrechnen bestehender Zeilen; Ansätze ohne Schritte bleiben unverändert (A22).
-- Der Enum-Wert abbruch entsteht in 20261108120000_ansatz_schritt_abbruch.sql (A20).
-- Rückweg: drop trigger ansatz_schritt_zustand, messung_ansatz_zustand, naehrloesungsansatz_zustand_geschuetzt;
-- drop function ansatz_zustand_nachrechnen(), ansatz_zustand_geschuetzt(); v_ph_wirkung mit der Fassung aus
-- 20261103140000_datenmodell.sql neu anlegen. Die berechneten Werte bleiben als letzter Stand in den Spalten.

-- ---------------------------------------------------------------------
-- 1 Nachrechnen aus Schritten und Messungen (8.1 Regel 2)
-- ---------------------------------------------------------------------

-- Rechte des Aufrufers wie cache_aus_ereignis() ohne security definer: Die Funktion läuft mit Tims Rechten und RLS
-- (ist_tim()); die Service-Rolle des Seeds umgeht RLS wie bisher. Das Update läuft in Trigger-Tiefe 2 und geht durch
-- den Schutz in Abschnitt 2.
--
-- Neuansatz mit mindestens einem Schritt (gültig oder storniert); sonst gehören die Werte dem Insert (A22):
--   status            abgebrochen bei einer gültigen Zeile abbruch, sonst abgeschlossen bei einer gültigen Zeile
--                     endmessung (Zeile 17), sonst laufend.
--   abgeschlossen_am  erledigt_am der Zeile abbruch bzw. endmessung, sonst null; ohne erledigt_am deren erfasst_am (A).
--   dauer_s           abgeschlossen_am − begonnen_am in Sekunden nur bei status abgeschlossen, sonst null (A).
--   timer_ende        höchste Timerzeile t aus 11, 13, 16, deren Vorgänger t − 1 (10, 12, 15) gültig erledigt ist:
--                     erledigt_am(t − 1) + 15 min (R4.6, Konstante, A21); eine Abbruchzeile auf 10, 12 oder 15 zählt
--                     nicht; ohne solche Zeile null. Jeder neue Timer erhält ein neues timer_ende (TP5).
--   kontrollmessung_id, endmessung_id
--                     jüngste gültige Messung kontrolle_ansatz bzw. end_ansatz mit dieser ansatz_id, sonst null.
-- pH-Korrektur: status abgeschlossen und abgeschlossen_am = gilt_ab der jüngsten gültigen Messung nachmessen mit
--   dieser ansatz_id, ohne sie laufend und null; timer_ende setzt die App beim Insert, die Funktion lässt ihn stehen.
-- Nachfüllen und Teilwechsel berührt die Funktion nicht (ihre Pakete erweitern sie).
create or replace function public.ansatz_zustand_nachrechnen()
returns trigger language plpgsql set search_path = '' as $$
declare
  timer_dauer constant interval := interval '15 minutes';
  ids uuid[];
  aid uuid;
  a record;
  abbruch_am timestamptz;
  hat_abbruch boolean;
  ende_am timestamptz;
  hat_ende boolean;
  n_status public.ansatz_status;
  n_abgeschlossen timestamptz;
  n_dauer integer;
  n_timer timestamptz;
  n_kontrolle uuid;
  n_end uuid;
begin
  ids := array[new.ansatz_id];
  if tg_op = 'UPDATE' and old.ansatz_id is distinct from new.ansatz_id then
    ids := ids || old.ansatz_id;
  end if;

  foreach aid in array ids loop
    continue when aid is null;
    select na.id, na.typ, na.begonnen_am into a from public.naehrloesungsansatz na where na.id = aid;
    continue when not found;

    if a.typ = 'neuansatz' then
      continue when not exists (select 1 from public.ansatz_schritt st where st.ansatz_id = aid);

      select true, coalesce(st.erledigt_am, st.erfasst_am) into hat_abbruch, abbruch_am
        from public.ansatz_schritt st
       where st.ansatz_id = aid and st.schritt = 'abbruch' and st.storniert_am is null
       order by coalesce(st.erledigt_am, st.erfasst_am) desc limit 1;
      select true, coalesce(st.erledigt_am, st.erfasst_am) into hat_ende, ende_am
        from public.ansatz_schritt st
       where st.ansatz_id = aid and st.schritt = 'endmessung' and st.storniert_am is null
       order by coalesce(st.erledigt_am, st.erfasst_am) desc limit 1;

      if coalesce(hat_abbruch, false) then
        n_status := 'abgebrochen';
        n_abgeschlossen := abbruch_am;
        n_dauer := null;
      elsif coalesce(hat_ende, false) then
        n_status := 'abgeschlossen';
        n_abgeschlossen := ende_am;
        n_dauer := extract(epoch from ende_am - a.begonnen_am)::integer;
      else
        n_status := 'laufend';
        n_abgeschlossen := null;
        n_dauer := null;
      end if;

      select st.erledigt_am + timer_dauer into n_timer
        from public.ansatz_schritt st
       where st.ansatz_id = aid and st.nr in (10, 12, 15) and st.schritt <> 'abbruch'
         and st.storniert_am is null and st.erledigt_am is not null
       order by st.nr desc limit 1;

      select m.id into n_kontrolle
        from public.messung m
       where m.ansatz_id = aid and m.messart = 'kontrolle_ansatz' and m.storniert_am is null
       order by m.gilt_ab desc, m.erfasst_am desc limit 1;
      select m.id into n_end
        from public.messung m
       where m.ansatz_id = aid and m.messart = 'end_ansatz' and m.storniert_am is null
       order by m.gilt_ab desc, m.erfasst_am desc limit 1;

      update public.naehrloesungsansatz na
         set status = n_status, abgeschlossen_am = n_abgeschlossen, dauer_s = n_dauer, timer_ende = n_timer,
             kontrollmessung_id = n_kontrolle, endmessung_id = n_end
       where na.id = aid
         and (na.status, na.abgeschlossen_am, na.dauer_s, na.timer_ende, na.kontrollmessung_id, na.endmessung_id)
             is distinct from (n_status, n_abgeschlossen, n_dauer, n_timer, n_kontrolle, n_end);

    elsif a.typ = 'ph_korrektur' then
      select m.gilt_ab into n_abgeschlossen
        from public.messung m
       where m.ansatz_id = aid and m.messart = 'nachmessen' and m.storniert_am is null
       order by m.gilt_ab desc, m.erfasst_am desc limit 1;
      n_status := case when n_abgeschlossen is null then 'laufend' else 'abgeschlossen' end;

      update public.naehrloesungsansatz na
         set status = n_status, abgeschlossen_am = n_abgeschlossen
       where na.id = aid
         and (na.status, na.abgeschlossen_am) is distinct from (n_status, n_abgeschlossen);
    end if;
  end loop;
  return null;
end $$;
comment on function public.ansatz_zustand_nachrechnen() is
  'Rechnet status, abgeschlossen_am, timer_ende, dauer_s, kontrollmessung_id und endmessung_id eines Ansatzes aus ansatz_schritt und messung nach (8.1 Regel 2, R4.6, R4.14; Plan 29). Neuansatz nur mit mindestens einem Schritt (A22), pH-Korrektur aus der Messung nachmessen; Timer 15 min (A21).';

create trigger ansatz_schritt_zustand after insert or update of storniert_am on public.ansatz_schritt
  for each row execute function public.ansatz_zustand_nachrechnen();
create trigger messung_ansatz_zustand after insert or update of storniert_am on public.messung
  for each row when (new.ansatz_id is not null) execute function public.ansatz_zustand_nachrechnen();

-- Triggerfunktion ohne eigene Prüfung und über PostgREST nicht aufrufbar; EXECUTE trotzdem ausdrücklich entzogen
-- (Default-Privileges von Supabase). Trigger feuern ohne EXECUTE des auslösenden Nutzers.
revoke execute on function public.ansatz_zustand_nachrechnen() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 2 Schutz der Zustandsfelder (Muster cache_geschuetzt(), A25)
-- ---------------------------------------------------------------------

-- Ein direktes Update (Trigger-Tiefe 1) eines Zustandsfelds scheitert mit einer Ausnahme, damit ein Fehler im Client
-- sofort auffällt. Das Update aus ansatz_zustand_nachrechnen() und ein «on delete set null» der Fremdschlüssel auf
-- messung laufen in Tiefe 2 und gehen durch. Andere Spalten bleiben änderbar.
create or replace function public.ansatz_zustand_geschuetzt()
returns trigger language plpgsql set search_path = '' as $$
begin
  if pg_trigger_depth() < 2
     and (new.status is distinct from old.status
          or new.abgeschlossen_am is distinct from old.abgeschlossen_am
          or new.timer_ende is distinct from old.timer_ende
          or new.dauer_s is distinct from old.dauer_s
          or new.kontrollmessung_id is distinct from old.kontrollmessung_id
          or new.endmessung_id is distinct from old.endmessung_id) then
    raise exception 'Zustandsfeld wird nur aus Schritten und Messungen nachgeführt (8.1 Regel 2)';
  end if;
  return new;
end $$;
comment on function public.ansatz_zustand_geschuetzt() is
  'Lehnt ein direktes Update von status, abgeschlossen_am, timer_ende, dauer_s, kontrollmessung_id und endmessung_id ab; nur ansatz_zustand_nachrechnen() führt sie nach (8.1 Regel 2, Plan 29 A25).';

create trigger naehrloesungsansatz_zustand_geschuetzt before update on public.naehrloesungsansatz
  for each row execute function public.ansatz_zustand_geschuetzt();

revoke execute on function public.ansatz_zustand_geschuetzt() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 3 v_ph_wirkung: pH nachher auch aus der Messung nachmessen (A23)
-- ---------------------------------------------------------------------

-- Gleiche Spalte wie in 20261103140000_datenmodell.sql. pH nachher = coalesce(ph_nachher, pH der jüngsten gültigen
-- Messung nachmessen mit pH und dieser ansatz_id); die pH-Korrektur braucht so kein Update von ph_nachher.
create or replace view public.v_ph_wirkung with (security_invoker = true) as
select avg(w) as wirkung_ml_je_l_je_0_1
  from (select pos.ist_ml / (a.volumen_l * (a.ph_vorher - n.ph_nachher) / 0.1) as w
          from public.naehrloesungsansatz a
          cross join lateral (
            select coalesce(a.ph_nachher,
                            (select m.ph from public.messung m
                              where m.ansatz_id = a.id and m.messart = 'nachmessen' and m.storniert_am is null
                                and m.ph is not null
                              order by m.gilt_ab desc, m.erfasst_am desc limit 1)) as ph_nachher) n
          join public.ansatz_position pos on pos.ansatz_id = a.id and pos.produkt_id = 'ph_minus' and pos.storniert_am is null
          join public.platz p on p.id = a.platz_id join public.anlage an on an.id = p.anlage_id and an.datenart = 'echt'
         where a.typ = 'ph_korrektur' and a.storniert_am is null and a.ph_vorher > n.ph_nachher
         order by a.begonnen_am desc limit 5) x;
comment on view public.v_ph_wirkung is
  'Mittel der letzten fünf protokollierten pH-Korrekturen (R4.14); pH nachher aus ph_nachher, sonst aus der jüngsten gültigen Messung nachmessen des Ansatzes (Plan 29 A23); nur echt; ohne Daten null, dann Startwert 0.1 in src/domain.';
