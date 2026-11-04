-- 10_push_cron_rechte.test.sql · Echter Aufruf der Cron-Funktionen als anon und authenticated scheitert
-- (Plan 13 Nachbesserung Runde 1; Konzept 11.6 Punkt 4). Ergänzt die Rechteprüfung in 09_push_cron.test.sql
-- um einen tatsächlichen Aufruf. Kein Geheimnis: Testwert 'x' ohne Bedeutung. Alles in einer Transaktion.
-- Vorausgesetzt: Die Migration entzieht EXECUTE auf beiden Funktionen für anon und authenticated; der Aufruf
-- scheitert daher mit SQLSTATE 42501 (insufficient_privilege), bevor der Funktionskörper läuft.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

set local role anon;
select throws_ok(
  $q$select public.push_cron_pruefen('x')$q$,
  '42501',
  null,
  '11.6 anon: Aufruf von push_cron_pruefen scheitert mit 42501'
);
select throws_ok(
  $q$select public.push_cron_ausloesen()$q$,
  '42501',
  null,
  '11.6 anon: Aufruf von push_cron_ausloesen scheitert mit 42501'
);
reset role;

set local role authenticated;
select throws_ok(
  $q$select public.push_cron_pruefen('x')$q$,
  '42501',
  null,
  '11.6 authenticated: Aufruf von push_cron_pruefen scheitert mit 42501'
);
select throws_ok(
  $q$select public.push_cron_ausloesen()$q$,
  '42501',
  null,
  '11.6 authenticated: Aufruf von push_cron_ausloesen scheitert mit 42501'
);
reset role;

select * from finish();
rollback;
