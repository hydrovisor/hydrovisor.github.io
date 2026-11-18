-- #249 Eigene wiederkehrende Aufgaben je Anlage (Konzept R5.2 letzte Zeile, R5.3, 8.1 Regel 2; Entscheid 0029).
-- Additiv: neue nullable Spalte, Constraints und Index auf einer bisher leeren Tabelle; keine Daten geändert.
alter table public.eigene_aufgabe
  add constraint eigene_aufgabe_id_anlage_key unique (id, anlage_id);

alter table public.eigene_aufgabe
  add column ersetzt_id uuid,
  add constraint eigene_aufgabe_ersetzt_fk foreign key (ersetzt_id, anlage_id)
    references public.eigene_aufgabe (id, anlage_id) on delete set null (ersetzt_id),
  add constraint eigene_aufgabe_ersetzt_nicht_selbst check (ersetzt_id is distinct from id);

create index eigene_aufgabe_ersetzt_id_idx on public.eigene_aufgabe (ersetzt_id);

comment on table public.eigene_aufgabe is
  'Eigene wiederkehrende Aufgabe je Anlage (R5.2 letzte Zeile, Pool, #249): Name und Intervall. Fälligkeit = letzte '
  'Erledigung (ereignis aufgabe_erledigt) bzw. jüngstes Überspringen (aufschub) über die Kette ersetzt_id + '
  'intervall_d, ohne beides der Tag von erfasst_am der ersten Zeile (A1). Korrektur = Storno plus neue Zeile mit '
  'ersetzt_id (8.1 Regel 2).';
comment on column public.eigene_aufgabe.ersetzt_id is
  'Vorgänger derselben Anlage bei einer Korrektur (zusammengesetzter Fremdschlüssel mit anlage_id); die Fälligkeit '
  'rechnet über die Kette weiter.';
comment on column public.eigene_aufgabe.letzte_erledigung is
  'Ungenutzt und leer (#249 A3, 8.1 Regel 2): die letzte Erledigung kommt aus den Ereignissen aufgabe_erledigt.';
