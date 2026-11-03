-- 08_zugang_migration.test.sql · UC0-AK2 Zugang für das einzige Konto (Konzept 11.6; Migration 20261103160000)
-- Die Anweisungen der Migration stehen in supabase_migrations.schema_migrations (keine Kopie im Test) und
-- werden je Fall erneut ausgeführt. Testkonten nur als UUID ohne E-Mail (CLAUDE.md Regel 6).
-- Jeder Fall läuft in einem eigenen Savepoint (Ausnahmeblock in PL/pgSQL), der am Ende zurückgerollt wird:
-- zugang und auth.users sind danach wie vor dem Fall, die Fälle sind unabhängig. Ein Rollback auf einen
-- Savepoint auf oberster Ebene würde auch die Ergebnisse von pgTAP verwerfen, deshalb der Ausnahmeblock.
begin;
create extension if not exists pgtap with schema extensions;
set local timezone to 'UTC';
select plan(4);

-- ---------------------------------------------------------------------
-- Hilfsfunktionen
-- ---------------------------------------------------------------------

-- Führt die gespeicherten Anweisungen der Migration aus; Ergebnis = Anzahl Anweisungen
create function pg_temp.migration_ausfuehren() returns integer language plpgsql as $$
declare
  anweisung text;
  n integer := 0;
begin
  for anweisung in
    select s from supabase_migrations.schema_migrations m, unnest(m.statements) s
     where m.version = '20261103160000'
  loop
    execute anweisung;
    n := n + 1;
  end loop;
  return n;
end $$;

-- ist_tim() als angemeldetes Konto
create function pg_temp.ist_tim_als(sub uuid) returns text language plpgsql as $$
declare
  ergebnis text;
begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub', sub, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    select public.ist_tim()::text into ergebnis;
  exception when others then
    ergebnis := 'Fehler ' || sqlstate;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return ergebnis;
end $$;

-- Ein Fall: zugang und auth.users leeren, Konten anlegen, Migration «laeufe»-mal ausführen, Ergebnis
-- festhalten; danach Rollback des Savepoints über eine eigene Ausnahme (SQLSTATE HV901).
create function pg_temp.fall(konten uuid[], laeufe integer) returns text language plpgsql as $$
declare
  ergebnis text;
  anweisungen integer := 0;
  i integer;
begin
  begin
    delete from public.zugang;
    delete from auth.users;
    insert into auth.users (id) select unnest(konten);
    for i in 1 .. laeufe loop
      anweisungen := pg_temp.migration_ausfuehren();
    end loop;
    select format('Anweisungen %s, Zeilen %s, %s',
                  anweisungen,
                  (select count(*) from public.zugang),
                  coalesce((select string_agg(z.app_version || ' ' || pg_temp.ist_tim_als(z.user_id), ', '
                                              order by z.user_id)
                              from public.zugang z), 'keine'))
      into ergebnis;
    raise exception using errcode = 'HV901', message = 'Fall zurückrollen';
  exception
    when sqlstate 'HV901' then null;
    when others then ergebnis := 'Fehler ' || sqlstate || ': ' || sqlerrm;
  end;
  return ergebnis;
end $$;

-- ---------------------------------------------------------------------
-- Fälle
-- ---------------------------------------------------------------------

select is(pg_temp.fall(array[]::uuid[], 1),
          'Anweisungen 1, Zeilen 0, keine',
          'UC0-AK2 Zugangs-Migration ohne Konto legt keine Zeile an');

select is(pg_temp.fall(array['00000000-0000-4000-8000-0000000008a1']::uuid[], 1),
          'Anweisungen 1, Zeilen 1, migration true',
          'UC0-AK2 Zugangs-Migration mit genau einem Konto legt dessen Zeile an');

select is(pg_temp.fall(array['00000000-0000-4000-8000-0000000008a1']::uuid[], 2),
          'Anweisungen 1, Zeilen 1, migration true',
          'UC0-AK2 Zugangs-Migration ist wiederholbar');

select is(pg_temp.fall(array['00000000-0000-4000-8000-0000000008a1',
                             '00000000-0000-4000-8000-0000000008b2']::uuid[], 1),
          'Anweisungen 1, Zeilen 0, keine',
          'UC0-AK2 Zugangs-Migration mit zwei Konten legt keine Zeile an');

select * from finish();
rollback;
