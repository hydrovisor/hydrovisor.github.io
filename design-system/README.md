Hydrovisor ist eine PWA für Android, die Tim beim Betrieb seiner Hydroponikanlage am Hydroponikregal begleitet: Sollwerte je Phase, Messwerte, Nährlösung, Erinnerungen und Hinweise. Das Erscheinungsbild ist ruhig, technisch präzise und freundlich. Die Marke ist eine Messskala, deren Zeiger ein Tropfen und ein Blatt zugleich ist und im grünen Bereich steht. Claim: **Hydroponik mit Weitsicht.**

Dieses System ist die verbindliche Ausgangslage für die App. Werte, Namen und Bausteine werden 1:1 übernommen. Was fehlt, wird hier ergänzt und nicht in der App erfunden.

## Grundsätze

- **Ein Blick genügt.** Am Regal hat man nasse Hände und wenig Zeit. Jeder Screen beantwortet zuerst «Ist alles im grünen Bereich?» und zeigt dann, was zu tun ist.
- **Messwert vor Text.** Zahlen sind gross (`value-xl`, `value`), Einheiten klein daneben (`unit`, `ink-muted`).
- **Hinweis statt Diagnose.** Die App nennt mögliche Ursachen und Massnahmen, sie stellt keine Diagnose.
- **Farbe trägt nie allein Bedeutung.** Jeder Status hat Wort und Symbol (`StatusBadge`).
- **Vertrauen in den Wert zeigen.** Ein Messwert nach Nachfüllen oder Wechsel ist «veraltet», einer mit überfälliger Kalibrierung «unsicher». Diese Kennzeichen stehen neben der Bewertung, neutral und gestrichelt (`StatusBadge` `stale`, `uncertain`).

## Sprache und Ton

- Du-Form, kurze Sätze, aktive Verben: «Miss den pH-Wert nach dem Mischen noch einmal.»
- Schweizer Rechtschreibung: kein Eszett, immer «ss» (Massnahmen, ausserhalb, Grösse). Anführungszeichen « ».
- Zahlen nach de-CH: Dezimalpunkt, Apostroph als Tausendertrennzeichen (`Intl.NumberFormat('de-CH')`): pH 6.1, EC 1.4 mS/cm, 1’000 ml. Zwischen Zahl und Einheit ein Leerschlag (22 °C); Bereiche mit Halbgeviertstrich ohne Leerschlag (5.5–6.5).
- Sollwerte sind Werte der eigenen Anlage: «Sollwert deiner Anlage», nie «Herstellerwert» oder Shop-Angaben.
- Statuswörter sind fix: «Im grünen Bereich», «Knapp daneben», «Ausserhalb»; ebenso die Kennzeichen «veraltet» und «unsicher».
- Buttons beginnen mit dem Verb: «Messwert speichern», «Nährlösung ansetzen». Kein Ausrufezeichen, keine Emojis.
- Der Claim «Hydroponik mit Weitsicht.» steht auf Splash, Anmeldung und Info-Seite, nicht in jedem Screen. Immer mit Punkt.

## Logo

- Das Logo besteht aus Bildmarke (Messskala mit Tropfen-Blatt-Zeiger) und Wortmarke «Hydrovisor» in Manrope 700. «Hydro» in `tiefwasser`, «visor» in `teal`; auf dunklem Grund weiss und `aqua`.
- Dateien in **Logos**: `logo-*` (horizontal), `logo-claim-*` (mit Claim), `bildmarke-*`, `wortmarke-*`, je `farbig`, `negativ` (für dunklen Grund und `surface-brand`) und `mono` (einfarbig `ink`, für Druck und Gravur). Die Schrift ist in Pfade umgewandelt; die Dateien brauchen keine Schrift.
- In der App den Baustein `Logo` verwenden. Er wählt im hellen Thema `farbig` und im dunklen `negativ`.
- **Schutzzone:** rundum mindestens die Versalhöhe des «H» der Wortmarke. Bei der Bildmarke allein ein Viertel ihrer Breite.
- **Mindestgrösse:** Logo horizontal 24px hoch (etwa 140px breit), Logo mit Claim 48px hoch, Bildmarke 20px hoch. Darunter das App-Icon verwenden.
- **Nicht erlaubt:** Farben tauschen oder neu einfärben, die Bögen schliessen oder den Zeiger drehen (nur die Messanzeige dreht den Zeiger), Schatten oder Verläufe, Wortmarke in einer anderen Schrift setzen, Logo auf unruhigen Fotos ohne Fläche.

## App-Icons und PWA

- **Plattform:** Hydrovisor wird nur für Android umgesetzt. Die PWA wird über Chrome auf dem Android-Smartphone installiert; Push-Nachrichten laufen über Web-Push in Chrome. Für iOS gibt es keine eigenen Icons, Meta-Tags oder Sonderregeln.
- **App-Icons**: `app-icon.svg` (Grund `tiefwasser`, Radius 22 %), `app-icon-hell.svg`, PNG in 192 und 512 px, `app-icon-maskable-512.png` (Bildmarke in der Sicherheitszone, damit Android das Icon in jede Form schneiden kann), `favicon.svg` und `favicon-32.png`.
- Manifest: `"theme_color": "#0F3D4C"`, `"background_color": "#F2F5F4"`, `"display": "standalone"`, Icons 192 und 512 mit `"purpose": "any"`, das maskable Icon mit `"purpose": "maskable"`.
- Splash und Statusleiste: `surface-brand` mit Logo `negativ`.

## Farbe

- Die sechs Markenfarben `tiefwasser`, `teal`, `aqua`, `blattgruen`, `dunkelgruen` und `signalrot` sind fix. In der Oberfläche nur die semantischen Tokens verwenden, nie die Markenfarben direkt.
- Seitengrund `surface`; Karten und Felder `surface-raised`; vertiefte Bereiche `surface-sunken`; Markenflächen `surface-brand` mit `ink-on-brand` und `ink-on-brand-muted`.
- Text `ink`, Sekundärtext `ink-muted`. Beide erreichen mindestens 4.5:1 auf allen Flächen ihrer Notiz, in beiden Themen.
- Hauptaktion `brand` mit Beschriftung `on-brand`; Hover `brand-strong`. Höchstens ein Hauptbutton pro Screen.
- Status: `status-ok`, `status-warn`, `status-danger` für Text, Symbol und Zeiger, jeweils auf der passenden `*-soft`-Fläche. `signalrot` und `status-danger` nur für Zustände und Fehler.
- Grün und Rot unterscheiden sich kaum in der Helligkeit. Deshalb hat jeder Status ein eigenes Symbol (Kreis mit Haken, Dreieck mit Ausrufezeichen, Quadrat mit Kreuz) und sein Wort.
- `blattgruen` erreicht auf hellem Grund nur 2.5:1 und ist deshalb Fläche oder Grafik, nie Text. Für den Sollbereich der Skala gilt `gauge-target`.
- Diagramme: `chart-ph`, `chart-ec`, `chart-temp` für die Linien, `chart-target` als Band des Sollbereichs.
- Etiketten: `label-ink` auf `label-paper`, in beiden Themen schwarz auf weiss, weil sie auf Papier stehen.
- Dunkles Thema: Die App setzt `data-theme` auf `<html>` nach der Einstellung «Thema» (Hell, Dunkel, wie System; Standard «Hell», W7). Nur «wie System» folgt `prefers-color-scheme`.

## Schrift

- Eine Schrift: **Manrope** (variabel, 200–800, SIL Open Font License), Datei in `fonts/`. Kein Laden von Google Fonts in der App.
- Stile: `display` (einmal pro Screen), `title` (Screen-Titel), `heading` (Abschnitte, Kartentitel), `body` und `body-strong`, `label` (Buttons, Felder, Navigation), `small` (Hilfetexte, Quellen), `caption` (Zeitstempel, Badges).
- Messwerte: `value-xl` in der Messanzeige, `value` in Karten, `unit` daneben. Zahlen immer mit `font-variant-numeric: tabular-nums` (Klasse `hv-num`).
- Fliesstext und Eingaben nie unter 16px, damit sie am Regal auf Armlänge gut lesbar bleiben.

## Abstand, Raster, Form

- 4px-Raster: `space-1` bis `space-12`. Seitlicher Rand `space-4` am Handy, `space-6` am Tablet; Inhalt höchstens `size-content` breit.
- Tippflächen mindestens `size-touch` (48px), kompakt `size-touch-compact` (40px), nie kleiner.
- **Dichte «regal»:** Regal-Masken (Heute, Rundgang, Gefäss, Messen, Ansatz, Säen, Keimung, Umsetzen, Pflanze, Gefäss prüfen) tragen `data-density="regal"`. Dort gilt für jede Tippfläche `size-touch-regal` (68px), Text `text-regal` (21px), Messwerte `value-regal` (40px), Statuswort und Kennung in Kacheln `status-regal` (28px), Statussymbol `icon-status-regal` (32px). Keine Systemtastatur, keine Wischgesten. Schreibtisch-Masken (Anmeldung, Vorlagen, Etiketten, Einstellungen, Info) bleiben in der Standarddichte mit 48px.
- Radien: `radius-md` für Buttons und Felder, `radius-lg` für Karten und Hinweise, `radius-xl` für grosse Flächen, `radius-full` für Pillen. Die weichen Ecken nehmen die runden Enden der Skalenbögen auf.
- Schatten sparsam: `shadow-sm` für Karten, `shadow-lg` nur für schwebende Elemente. Karten haben zusätzlich einen Rand in `line`.
- Fokus: `focus-ring`, 2px Abstand im Seitengrund und 2px `focus`, mindestens 3:1 auf allen Flächen.
- Bewegung: kurz und ruhig, 150–300 ms, `ease-out`, kein Federn. Bei `prefers-reduced-motion` keine Animation.

## Bausteine

- `Logo`, `Button`, `Card`, `StatusBadge`, `Notice`, `Gauge` (Messanzeige), `TextField`, `Label` (Etikett) und `LabelSheet` (A4-Bogen), `Notfallblatt` (Stand je Gefäss, Vertretungsblatt), `NumPad` (Ziffernblock mit Prellfilter), `Tile` (Kachel für Messwert und Ort), `Checklist` (Abhakliste mit Timer), `Deckel` (Deckelgrafik mit Löchern, Malmodus), `Choice` (Wahlliste), `Stepper` (− Wert +), `Drehrad` (Zahl mit durchdrehendem Rad wählen, nur Schreibtisch) und `Zeitwahl` (zwei Drehräder für Stunde und Minute, nur Schreibtisch). Jede Komponente hat Richtlinien; die Musterseite `#/muster` der App zeigt alle in beiden Themen (Choice, Stepper, Drehrad und Zeitwahl folgen dort mit einer späteren Version).
- Das **Etikett** (`Label`, 70 × 42.3 mm) trägt den QR-Code (30 mm mit Ruhezone), die Kennung in Manrope 700 auf 32 mm Breite (Schriftgrösse aus der Breite, höchstens 20 mm) und ein bis zwei kleine Zeilen. Es ist schwarz auf weiss und zeigt die Kennung gleich geschrieben wie die Maske «Gefäss».
- Die Bausteine sind zuerst CSS-Klassen (`hv-btn`, `hv-card` usw. in `components/bundle.css`) und deshalb für jeden Technik-Stack nutzbar. `components/bundle.js` liefert dazu React-Komponenten unter `window.Hydrovisor`. Wird die App nicht mit React gebaut, werden sie mit denselben Klassen nachgebaut.
- Die **Messanzeige** ist das Herzstück: dieselbe Skala wie die Bildmarke, der Sollbereich ist der grüne Bereich, der Tropfen-Blatt-Zeiger zeigt auf den Messwert und nimmt die Statusfarbe an.

## Symbole

- Symbole: Lucide (Outline, Strichstärke 2, 24px, `currentColor`), damit sie zu den runden Strichenden der Bildmarke passen. Die drei Statussymbole sind im Baustein `StatusBadge` gezeichnet.
- Keine Emojis als Symbole.

## Einbau in die App

1. `tokens.css` dieses Systems und `fonts/manrope-latin-wght-normal.woff2` übernehmen, danach `components/bundle.css`.
2. `data-theme` auf `<html>` setzen (`light` oder `dark`).
3. Logo und Icons aus den Gruppen **Logos** und **App-Icons** übernehmen, nicht nachzeichnen.
4. Neue Bausteine zuerst hier ergänzen und erst dann in der App verwenden.

## Export ins Repository

- Quelle: claude.ai-Artefakt «Hydrovisor – CI» (Typ Design System), letzte Änderung 23.10.2026; exportiert am 31.10.2026 für Auftrag 1, weil der Coding-Agent im Terminal keine claude.ai-Artefakte liest (Konzept Kapitel 10).
- `tokens.css` ist aus `tokens.json` generiert (helles Thema in `:root`, dunkles Thema unter `[data-theme="dark"]`, Dichte unter `[data-density="regal"]`); seit DS-01 mit `npm run tokens` (`scripts/tokens.ts`), ein Unit-Test prüft im Prüftor, dass beide übereinstimmen. `components/bundle.css` und die Baustein-Beschreibungen `components/*.md` sind beim Export unverändert übernommen und seit DS-01 im Repository ergänzt.
- Die Dateien der Gruppen **Logos** und **App-Icons** (SVG und PNG) liegen unverändert in `assets/Logos/` und `assets/App-Icons/`, je mit `README.md`; exportiert am 1.11.2026 mit I0-01 (Manifest und Logo). Die App liefert die Icons unter `/icons/` aus, ohne Kopie im Repository.
- `components/bundle.js` (React-Bausteine unter `window.Hydrovisor`, Stand 23.10.2026) ist mit I0-01 unverändert übernommen, als Quelle für die Nachbauten in `src/ui/bausteine/` (Markup, Klassen, Statussymbole). Die App lädt die Datei nicht.
- Seit Entscheid R11 (1.11.2026) ist `design-system/` im Repository die Quelle; das claude.ai-Artefakt wird nicht mehr nachgeführt. Paket DS-01 (#17) hat die Ergänzungen aus Konzept Kapitel 10 nachgetragen: Dichte «regal», Druckmasse (Gruppe `print`), LabelSheet 70 × 42.3 mm, Notfallblatt, NumPad, Checklist, Tile, Deckel, `Label` und `StatusBadge` nachgeführt (W11).
