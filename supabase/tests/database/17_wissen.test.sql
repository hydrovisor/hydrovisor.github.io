-- 17_wissen.test.sql · Wissenskarten (UC12-AK1 Länge und Quelle, UC12-AK4; Konzept R7.2; Plan 40 Testliste)
-- Der Check und der Fremdschlüssel von public.wissenseintrag sichern: höchstens 600 Zeichen, eine Quelle, kein
-- «KCl» und keine «Lagerlösung» (Grossschreibung egal).
begin;
create extension if not exists pgtap with schema extensions;
set local timezone to 'UTC';
select plan(8);

insert into public.quelle (quelle_id, titel, link, klasse, anbaumethode, app_version)
  values ('pgtap-q17', 'Testquelle', 'https://example.invalid/q17', 'peer_review', 'dwc', 'pgtap');

create function pg_temp.karte(t text, quelle text default 'pgtap-q17', nr text default '1') returns void
language sql as $$
  insert into public.wissenseintrag (ebene, typ, text, quelle_id, fundstelle, kurzzitat, evidenzklasse, quelldatei,
                                     zeile_id, commit, app_version)
    values ('allgemein', 'sondenpflege', t, quelle, 'S. 1', 'Zitat', 'C', 'wissenseintrag.csv', 'we.pgtap17.' || nr,
            'pgtap', 'pgtap');
$$;

select throws_ok($$select pg_temp.karte('Die Sonde in KCl lagern.', nr => '2')$$, '23514', null,
  'UC12-AK4 keine Karte erwähnt KCl');
select throws_ok($$select pg_temp.karte('Etwas kcl-Lösung hilft.', nr => '3')$$, '23514', null,
  'UC12-AK4 keine Karte erwähnt kcl, auch klein geschrieben');
select throws_ok($$select pg_temp.karte('Die Kappe mit Lagerlösung füllen.', nr => '4')$$, '23514', null,
  'UC12-AK4 keine Karte erwähnt Lagerlösung für das Messgerät');
select throws_ok($$select pg_temp.karte('LAGERLÖSUNG nachfüllen.', nr => '5')$$, '23514', null,
  'UC12-AK4 keine Karte erwähnt LAGERLÖSUNG in Grossbuchstaben');
select lives_ok($$select pg_temp.karte('Sonde nach jeder Messung spülen, Kappe auf, trocken lagern.', nr => '6')$$,
  'UC12-AK4 eine Karte zur Sondenpflege ohne KCl und Lagerlösung geht');
select lives_ok($$select pg_temp.karte(repeat('a', 600), nr => '7')$$,
  'UC12-AK1 eine Karte mit 600 Zeichen geht');
select throws_ok($$select pg_temp.karte(repeat('a', 601), nr => '8')$$, '23514', null,
  'UC12-AK1 eine Karte mit 601 Zeichen scheitert');
select throws_ok($$select pg_temp.karte('Testtext', 'unbekannte-quelle', '9')$$, '23503', null,
  'UC12-AK1 eine Karte ohne bekannte Quelle scheitert');

select * from finish();
rollback;
