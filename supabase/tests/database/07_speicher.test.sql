-- 07_speicher.test.sql · UC4-AK6 privater Bucket saattueten (Konzept 11.3, 11.6 Punkt 3; 04 Abschnitt 11; Plan 9 Ä5, A5, A11)
-- Objektzeilen legt postgres direkt in storage.objects an (A5); EXIF prüft der [E2E]-Teil mit UC4 in I2.
-- Pfad saattueten/{sorte_id}/{uuid}.jpg (Entwurf Abschnitt 9).
begin;
create extension if not exists pgtap with schema extensions;
-- Die Datenbank läuft in UTC wie in Supabase.
set local timezone to 'UTC';
select plan(7);

-- ---------------------------------------------------------------------
-- Hilfsfunktionen
-- ---------------------------------------------------------------------

create function pg_temp.als(rolle text, sub uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub', sub, 'role', rolle)::text, true);
  execute format('set local role %I', rolle);
end $$;

-- Anweisung als Rolle; Ergebnis «ok <Zeilen>» oder der SQLSTATE des Fehlers
create function pg_temp.ausfuehren_als(rolle text, sub uuid, anweisung text) returns text language plpgsql as $$
declare
  ergebnis text;
  n bigint;
begin
  perform pg_temp.als(rolle, sub);
  begin
    execute anweisung;
    get diagnostics n = row_count;
    ergebnis := 'ok ' || n;
  exception when others then
    ergebnis := sqlstate;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return ergebnis;
end $$;

-- Abfrage (ein Wert) als Rolle; Fehler ergeben «Fehler <SQLSTATE>»
create function pg_temp.zaehle_als(rolle text, sub uuid, abfrage text) returns text language plpgsql as $$
declare
  ergebnis text;
begin
  perform pg_temp.als(rolle, sub);
  begin
    execute abfrage into ergebnis;
  exception when others then
    ergebnis := 'Fehler ' || sqlstate;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return ergebnis;
end $$;

-- Anweisung als Rolle, danach Abfrage als postgres (feste Reihenfolge)
create function pg_temp.ausfuehren_dann(rolle text, sub uuid, anweisung text, abfrage text) returns text language plpgsql as $$
declare
  ergebnis text;
  danach text;
begin
  ergebnis := pg_temp.ausfuehren_als(rolle, sub, anweisung);
  execute abfrage into danach;
  return ergebnis || ', ' || coalesce(danach, '(leer)');
end $$;

-- ---------------------------------------------------------------------
-- Fixtures als postgres
-- ---------------------------------------------------------------------

insert into auth.users (id) values
  ('00000000-0000-4000-8000-00000000000a'), ('00000000-0000-4000-8000-00000000000b')
  on conflict (id) do nothing;
insert into public.zugang (user_id, app_version) values ('00000000-0000-4000-8000-00000000000a', 'pgtap');
-- Ein Tütenfoto, nur wenn der Bucket besteht (sonst bleiben die Tests unten rot statt die Datei abzubrechen)
do $$
begin
  insert into storage.objects (id, bucket_id, name)
    values ('f7000000-0000-4000-8000-000000000001', 'saattueten',
            'f7000000-0000-4000-8000-000000000101/f7000000-0000-4000-8000-000000000201.jpg');
exception when others then
  raise notice 'Fixture-Objekt nicht angelegt: %', sqlerrm;
end $$;

-- ---------------------------------------------------------------------
-- Bucket
-- ---------------------------------------------------------------------

select is((select public::text from storage.buckets where id = 'saattueten'), 'false',
          'UC4-AK6 Bucket saattueten ist privat');
select is(
  (select allowed_mime_types::text || ', ' || (file_size_limit between 2000000 and 2097152)::text
     from storage.buckets where id = 'saattueten'),
  '{image/jpeg}, true', 'UC4-AK6 nur JPEG, höchstens 2 MB (A11)');

-- ---------------------------------------------------------------------
-- Objekte
-- ---------------------------------------------------------------------

select is(
  format('postgres %s, anon %s',
         (select count(*) from storage.objects where bucket_id = 'saattueten'),
         pg_temp.zaehle_als('anon', null, $$select count(*) from storage.objects where bucket_id = 'saattueten'$$)),
  'postgres 1, anon 0', 'UC4-AK6 anon liest kein Objekt');

select is(
  format('liest %s, schreibt %s',
         pg_temp.zaehle_als('authenticated', '00000000-0000-4000-8000-00000000000b',
                            $$select count(*) from storage.objects where bucket_id = 'saattueten'$$),
         pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000b',
                                $$insert into storage.objects (bucket_id, name)
                                  values ('saattueten', 'f7000000-0000-4000-8000-000000000101/fremd.jpg')$$)),
  'liest 0, schreibt 42501', 'UC4-AK6 fremdes Konto liest und schreibt kein Objekt');

create function pg_temp.tim_schreibt_und_liest() returns text language plpgsql as $$
declare
  schreibt text;
  liest text;
begin
  schreibt := pg_temp.ausfuehren_als('authenticated', '00000000-0000-4000-8000-00000000000a',
                $q$insert into storage.objects (bucket_id, name)
                   values ('saattueten', 'f7000000-0000-4000-8000-000000000101/f7000000-0000-4000-8000-000000000202.jpg')$q$);
  liest := pg_temp.zaehle_als('authenticated', '00000000-0000-4000-8000-00000000000a',
                $q$select count(*) from storage.objects where bucket_id = 'saattueten'$q$);
  return format('schreibt %s, liest %s', schreibt, liest);
end $$;
select is(pg_temp.tim_schreibt_und_liest(), 'schreibt ok 1, liest 2', 'UC4-AK6 Tim legt ein Objekt an und liest es');

select is(
  pg_temp.ausfuehren_dann('authenticated', '00000000-0000-4000-8000-00000000000a',
                          $$update storage.buckets set public = true where id = 'saattueten'$$,
                          $$select 'public ' || public from storage.buckets where id = 'saattueten'$$),
  'ok 0, public false', 'UC4-AK6 Tim kann den Bucket nicht öffentlich schalten');

-- Ä5: je eine Policy für select, insert, update an authenticated über ist_tim(), keine für delete
select is(
  (select coalesce(string_agg(cmd || ' ' || roles::text || ' ' || (concat(qual, ' ', with_check) ~ 'ist_tim\(\)')::text,
                              ', ' order by cmd), 'keine')
     from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and concat(qual, ' ', with_check) ~ 'saattueten'),
  'INSERT {authenticated} true, SELECT {authenticated} true, UPDATE {authenticated} true',
  'UC4-AK6 Policies select, insert, update nur für Tim, keine Delete-Policy');

select * from finish();
rollback;
