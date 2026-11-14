# 0020 Demo-Szenarien auf echten Sorten: S6 mit Salat, S8 sät vor 7 Tagen

Datum: 13.11.2026 · Entschieden von Tim (im Chat der Lead-Sitzung, Antwort «Ja, umsetzen» auf «Gibst du die zwei Szenario-Änderungen aus Plan 199 frei?») · Issue #199, Plan `docs/plaene/199.md` (Commit 1ddec63) · Abweichung von Konzept 8.5 und `docs/spec/06_tests.md` Abschnitt 10

## Ausgangslage

Die Demo-Szenarien S1 bis S9 nutzten die vier Test-Sorten aus `tests/fixtures/wissen`. Seit W0 in der Produktion geladen ist und in `hydrovisor-dev` scharf geladen werden soll, bricht die Demo dort ab (Risiko RR15). Die Szenarien sollen auf echte, voll geladene Sorten wechseln. Nüsslisalat und Tomate sind in W0 nur mit Artmerkmalen geladen (keine Keim- und Anzuchtdauer bzw. keine Blütedauer), Chili keimt langsamer als die Test-Sorte.

## Entscheid

- **S6 (Konflikt):** Die Belegung von 3.1 nutzt Salat «Lattughino Verde» (Kopf) statt Nüsslisalat. Die Aussage des Szenarios (Belegungsende überlappt das Umsetzen von Spinat, Konflikt nach UC5-AK2) bleibt. Rückkehr zu Nüsslisalat, sobald die Art voll geladen ist (eigenes Issue).
- **S8 (Keimung):** Die Saat liegt 7 statt 5 Tage zurück. Mit Chili (Keimdauer 7/8/10 Tage) ist so «Deckel öffnen» heute fällig und «Keimung prüfen» morgen; mit 5 Tagen wäre nichts fällig.
- Übrige Szenarien behalten Aussage und Daten bis auf die Anpassungen aus Plan 199 (Sorten, Saatdaten nach der echten Keimdauer, Messwerte im echten Band).

## Folgen

- `docs/spec/06_tests.md` Abschnitt 10 nennt die neuen Sorten und Daten; das Konzept 8.5 wird bei der nächsten Fassung nachgeführt (Eintrag in Anhang B.2), bis dahin gilt dieser Entscheid.
- `npm run demo -- --laden` lädt bei leerem Wissen lokal das echte W0; in `hydrovisor-dev` braucht die Demo den scharfen W0-Seed (`dev-seed.yml` mit `trockenlauf=false`).

**Nachtrag 14.11.2026:** In Konzept v1.7 nachgeführt (Erratum E14, Anhang B.2), von Tim am 14.11.2026 bestätigt.
