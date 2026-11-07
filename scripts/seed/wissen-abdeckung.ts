// Abdeckung der Wissenskarten (UC12-AK1, R7.2): Jede Kombination aus Art und Phase der Startbelegung braucht
// mindestens eine gültige Karte auf Ebene Art oder ihrer Kulturgruppe (Plan 40 A1, A2).
// Startbelegung (A1): Arten mit einer gültigen Sorte und einer nicht stornierten Packung (Sortenstamm, Konzept 5.5).
// Phasen der Art (A2): Phasen, die nach der Vererbung von v_sollwert (Sorte → Art → Kulturgruppe → Standard, R1.3)
// für mindestens eine Sorte der Startbelegung «anwendbar = ja» sind.
// Länge, Quelle sowie KCl und Lagerlösung sichern Check und Fremdschlüssel von `wissenseintrag` (UC12-AK4).

/** Abfrage mit den Spalten art_id und phase je fehlender Kombination, sortiert */
export const WISSEN_LUECKEN_SQL = `select st.art_id, st.phase::text as phase
  from (select distinct a.art_id, a.kulturgruppe_id, v.phase
          from public.art a
          join public.sorte s on s.art_id = a.art_id and s.gueltig_bis is null
          join public.saatgut g on g.sorte_id = s.sorte_id and g.storniert_am is null
          join public.v_sollwert v on v.sorte_id = s.sorte_id and v.groesse = 'anwendbar' and v.text_wert = 'ja'
         where a.gueltig_bis is null) st
 where not exists (
         select 1 from public.wissenseintrag w
          where w.gueltig_bis is null and w.phase = st.phase
            and ((w.ebene = 'art' and w.art_id = st.art_id)
              or (w.ebene = 'kulturgruppe' and w.kulturgruppe_id = st.kulturgruppe_id)))
 order by st.art_id, st.phase`;

/** Meldung der Gesamtfreigabe bei Lücken, gefolgt von «art/phase, …» */
export const WISSEN_LUECKEN_MELDUNG = 'Seed: Gesamtfreigabe, Wissenskarten fehlen:';

/** Block der Gesamtfreigabe (8.7, R7.2): bricht ab, wenn eine Kombination ohne Karte ist */
export const WISSEN_PRUEFUNG_SQL = `do $$ declare k text; begin
  select string_agg(l.art_id || '/' || l.phase, ', ' order by l.art_id, l.phase) into k
    from (${WISSEN_LUECKEN_SQL}) l;
  if k is not null then raise exception '${WISSEN_LUECKEN_MELDUNG} %', k; end if;
end $$;`;
