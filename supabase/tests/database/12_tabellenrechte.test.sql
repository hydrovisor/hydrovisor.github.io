-- 12_tabellenrechte.test.sql · Fehler #65 Tabellenrechte der Data API (Plan 65; Konzept 8.1 Regel 3 und 6, 11.3, 11.6)
-- authenticated (App) hat auf jeder Tabelle und Sicht in public genau SELECT, INSERT, UPDATE, DELETE;
-- service_role (Edge Functions, BYPASSRLS) genau SELECT, INSERT, UPDATE (Runde 1, Befund Sicherheit 2: DELETE wird
-- nirgends gebraucht, datenart_loeschen ist security definer). TRUNCATE, REFERENCES, TRIGGER und MAINTAIN
-- (PostgreSQL 17) sind entzogen. Welche Zeilen sichtbar sind, regelt RLS (00_zugriff); keine Policy erlaubt
-- DELETE (Runde 1, Befund Sicherheit 1: «App löscht nie»). Die Schleifen laufen über pg_class (relkind r, p, v, m),
-- damit jede künftige Tabelle ohne Teständerung mitgeprüft wird. Geprüft wird mit has_table_privilege;
-- nur der Test der Standardrechte liest den Text aus pg_default_acl. Alles in einer Transaktion mit rollback.
begin;
create extension if not exists pgtap with schema extensions;

-- ---------------------------------------------------------------------
-- Hilfsfunktionen (nur in dieser Sitzung)
-- ---------------------------------------------------------------------

-- Tatsächliche Rechte einer Rolle auf einer Relation als Liste in fester Reihenfolge, zum Beispiel
-- «SELECT,INSERT,UPDATE,DELETE»; so zeigt ein roter Test, welches Recht fehlt oder zu viel ist.
create function pg_temp.rechte(rolle text, relation oid) returns text language sql stable as $$
  select coalesce(string_agg(r.recht, ',' order by r.nr), '(keine)')
    from unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'])
         with ordinality as r(recht, nr)
   where has_table_privilege(rolle, relation, r.recht)
$$;

create temp view relationen as
  select c.oid, c.relname::text as name, c.relkind::text as art
    from pg_class c
   where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'p', 'v', 'm');

select plan(2 * (select count(*)::int from relationen) + 7);

-- ---------------------------------------------------------------------
-- F65-AK1 authenticated: genau SELECT, INSERT, UPDATE, DELETE je Tabelle und Sicht
-- ---------------------------------------------------------------------

select is(pg_temp.rechte('authenticated', oid), 'SELECT,INSERT,UPDATE,DELETE',
          format('F65-AK1 authenticated hat auf %s (%s) genau SELECT, INSERT, UPDATE, DELETE', name, art))
  from relationen order by name;

-- ---------------------------------------------------------------------
-- F65-AK1 keine Policy in public erlaubt DELETE (cmd DELETE oder ALL)
-- ---------------------------------------------------------------------

select is(
  (select coalesce(string_agg(tablename || '.' || policyname || ' (' || cmd || ')', ', ' order by tablename, policyname),
                   '(keine)')
     from pg_policies where schemaname = 'public' and cmd in ('DELETE', 'ALL')),
  '(keine)',
  'F65-AK1 keine Policy in public mit cmd DELETE oder ALL (App löscht nie)');

-- ---------------------------------------------------------------------
-- F65-AK2 service_role: genau SELECT, INSERT, UPDATE je Tabelle und Sicht (kein DELETE)
-- ---------------------------------------------------------------------

select is(pg_temp.rechte('service_role', oid), 'SELECT,INSERT,UPDATE',
          format('F65-AK2 service_role hat auf %s (%s) genau SELECT, INSERT, UPDATE', name, art))
  from relationen order by name;

-- ---------------------------------------------------------------------
-- F65-AK3 künftige Tabellen der Rolle postgres erhalten dieselben Rechte
-- ---------------------------------------------------------------------

set local role postgres;
create table public.pgtap_rechte_probe (id int primary key);
reset role;

select is(pg_temp.rechte('authenticated', 'public.pgtap_rechte_probe'::regclass), 'SELECT,INSERT,UPDATE,DELETE',
          'F65-AK3 neue Tabelle von postgres: authenticated hat genau SELECT, INSERT, UPDATE, DELETE');
select is(pg_temp.rechte('service_role', 'public.pgtap_rechte_probe'::regclass), 'SELECT,INSERT,UPDATE',
          'F65-AK3 neue Tabelle von postgres: service_role hat genau SELECT, INSERT, UPDATE');

select ok(exists(
    select 1 from pg_default_acl d, unnest(d.defaclacl) e
     where d.defaclrole = 'postgres'::regrole and d.defaclnamespace = 'public'::regnamespace
       and d.defaclobjtype = 'r' and e::text = 'authenticated=arwd/postgres'),
  'F65-AK3 pg_default_acl für postgres in public (Tabellen) enthält authenticated=arwd/postgres');
select ok(exists(
    select 1 from pg_default_acl d, unnest(d.defaclacl) e
     where d.defaclrole = 'postgres'::regrole and d.defaclnamespace = 'public'::regnamespace
       and d.defaclobjtype = 'r' and e::text = 'service_role=arw/postgres'),
  'F65-AK3 pg_default_acl für postgres in public (Tabellen) enthält service_role=arw/postgres');
select ok(exists(
    select 1 from pg_default_acl d, unnest(d.defaclacl) e
     where d.defaclrole = 'postgres'::regrole and d.defaclnamespace = 'public'::regnamespace
       and d.defaclobjtype = 'S' and e::text = 'authenticated=rU/postgres'),
  'F65-AK3 pg_default_acl für postgres in public (Sequenzen) enthält authenticated=rU/postgres');
select ok(exists(
    select 1 from pg_default_acl d, unnest(d.defaclacl) e
     where d.defaclrole = 'postgres'::regrole and d.defaclnamespace = 'public'::regnamespace
       and d.defaclobjtype = 'S' and e::text = 'service_role=rU/postgres'),
  'F65-AK3 pg_default_acl für postgres in public (Sequenzen) enthält service_role=rU/postgres');

select * from finish();
rollback;
