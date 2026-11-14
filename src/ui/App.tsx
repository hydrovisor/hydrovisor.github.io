import { useEffect } from 'react';
import { DienstAnbieter, useNeueVersion } from './dienst.tsx';
import { Anmeldung } from './masken/Anmeldung.tsx';
import { Heute } from './masken/Heute.tsx';
import { Info } from './masken/Info.tsx';
import { Muster } from './masken/Muster.tsx';
import { Schreibprobe } from './masken/Schreibprobe.tsx';
import { Messen } from './masken/Messen.tsx';
import { Ansatz } from './masken/Ansatz.tsx';
import { Kalibrieren } from './masken/Kalibrieren.tsx';
import { Push } from './masken/Push.tsx';
import { Anlage } from './masken/Anlage.tsx';
import { AnlageNeu } from './masken/AnlageNeu.tsx';
import { Gefaess } from './masken/Gefaess.tsx';
import { GefaessAendern } from './masken/GefaessAendern.tsx';
import { GefaessNeu } from './masken/GefaessNeu.tsx';
import { GefaessPruefen } from './masken/GefaessPruefen.tsx';
import { Vorlagen } from './masken/Vorlagen.tsx';
import { DruckEtiketten } from './masken/DruckEtiketten.tsx';
import { EtikettAufloesen } from './masken/EtikettAufloesen.tsx';
import { Etiketten } from './masken/Etiketten.tsx';
import { Saeen } from './masken/Saeen.tsx';
import { Keimung } from './masken/Keimung.tsx';
import { Pflanze } from './masken/Pflanze.tsx';
import { Umsetzen } from './masken/Umsetzen.tsx';
import { Verschieben } from './masken/Verschieben.tsx';
import { Einstellungen } from './masken/Einstellungen.tsx';
import { Sorte } from './masken/Sorte.tsx';
import { SorteNeu } from './masken/SorteNeu.tsx';
import { Sorten } from './masken/Sorten.tsx';
import { Notfallblatt } from './masken/Notfallblatt.tsx';
import { Rundgang } from './masken/Rundgang.tsx';
import { KurzpruefungOrt } from './masken/Kurzpruefung.tsx';
import { NachfuellenOrt } from './masken/NachfuellenKratky.tsx';
import { Stromausfall } from './masken/Stromausfall.tsx';
import { Anlagen } from './masken/Anlagen.tsx';
import { Mehr } from './masken/Mehr.tsx';
import { Tabbar } from './bausteine/Tabbar.tsx';
import { Erntekalender } from './masken/Erntekalender.tsx';
import { BuendelAnbieter } from './buendel.tsx';
import { LEISTE, leisteZiel } from './leiste.ts';
import { LeisteAnbieter } from './leisteKontext.tsx';
import { MeldungAnbieter, MeldungZeile, useMeldungSteht } from './meldung.tsx';
import { hashZu, maskeFuer, useRoute, weiterleiten } from './router.ts';
import { SitzungAnbieter, useSitzung } from './sitzung.tsx';
import { Thema } from './thema.tsx';

/** Leiste unten aus den Zielen (Entscheid 0025) */
const LEISTE_ZIELE = LEISTE.map((z) => ({
  schluessel: z.ziel,
  text: z.text,
  href: hashZu(z.route),
  symbol: z.ziel,
}));

function Masken({ imAblauf }: { imAblauf: boolean }) {
  const route = useRoute();
  const { zustand } = useSitzung();
  const { wartet } = useNeueVersion();
  const maske = maskeFuer(route, zustand);
  const ziel = leisteZiel(maske, zustand, imAblauf);
  const meldung = useMeldungSteht();
  // #/sorten heisst seit Entscheid 0025 #/saatgut (Plan 212 A6)
  useEffect(() => weiterleiten());
  // data-neue-version macht den Zustand für die E2E-Tests sichtbar (TO7), ohne ihn anzuzeigen; data-leiste nennt das
  // aktive Ziel der Leiste oder «keine»
  return (
    <div
      data-neue-version={wartet ? 'wartet' : 'keine'}
      data-sitzung={zustand}
      data-leiste={ziel ?? 'keine'}
      data-meldung={meldung ? 'sichtbar' : 'keine'}
      className={ziel ? 'hv-rahmen hv-rahmen-leiste' : 'hv-rahmen'}
    >
      {maske.name === 'info' ? (
        <Info />
      ) : maske.name === 'muster' ? (
        <Muster />
      ) : maske.name === 'messen' ? (
        <Messen
          code={maske.code}
          {...(maske.zeile ? { zeile: maske.zeile } : {})}
          {...(maske.nachmessen ? { nachmessen: maske.nachmessen } : {})}
        />
      ) : maske.name === 'ansatz' ? (
        <Ansatz code={maske.code} />
      ) : maske.name === 'kalibrieren' ? (
        <Kalibrieren {...(maske.datenart ? { datenart: maske.datenart } : {})} />
      ) : maske.name === 'gefaess-aendern' ? (
        <GefaessAendern code={maske.code} {...(maske.teil ? { teil: maske.teil } : {})} />
      ) : maske.name === 'gefaess-neu' ? (
        <GefaessNeu
          {...(maske.kuerzel ? { kuerzel: maske.kuerzel } : {})}
          {...(maske.rolle ? { rolle: maske.rolle } : {})}
        />
      ) : maske.name === 'pruefen' ? (
        <GefaessPruefen code={maske.code} {...(maske.scan ? { scan: true } : {})} />
      ) : maske.name === 'etikett' ? (
        <EtikettAufloesen code={maske.code} />
      ) : maske.name === 'etiketten' ? (
        <Etiketten
          {...(maske.kuerzel ? { kuerzel: maske.kuerzel } : {})}
          {...(maske.codes ? { codes: maske.codes } : {})}
        />
      ) : maske.name === 'druck-etiketten' ? (
        <DruckEtiketten route={maske} />
      ) : maske.name === 'saeen' ? (
        <Saeen
          {...(maske.box ? { box: maske.box } : {})}
          {...(maske.ziel ? { ziel: maske.ziel } : {})}
          {...(maske.von ? { von: maske.von } : {})}
        />
      ) : maske.name === 'pflanze' ? (
        <Pflanze pflanzung={maske.pflanzung} {...(maske.von ? { von: maske.von } : {})} />
      ) : maske.name === 'ernte' ? (
        <Erntekalender {...(maske.satz ? { satz: maske.satz } : {})} />
      ) : maske.name === 'umsetzen' ? (
        <Umsetzen key={maske.satz} satz={maske.satz} {...(maske.wie ? { wie: maske.wie } : {})} />
      ) : maske.name === 'verschieben' ? (
        <Verschieben topf={maske.topf} />
      ) : maske.name === 'keimung' ? (
        // je Satz neu eingehängt: «Nächste Aufgabe» wechselt von Satz zu Satz (Plan 224 Entscheid 9)
        <Keimung key={maske.satz} satz={maske.satz} />
      ) : maske.name === 'gefaess' ? (
        <Gefaess code={maske.code} />
      ) : maske.name === 'anlage' ? (
        <Anlage {...(maske.kuerzel ? { kuerzel: maske.kuerzel } : {})} />
      ) : maske.name === 'anlage-neu' ? (
        <AnlageNeu />
      ) : maske.name === 'anlagen' ? (
        <Anlagen {...(maske.standort ? { standort: maske.standort } : {})} />
      ) : maske.name === 'mehr' ? (
        <Mehr />
      ) : maske.name === 'vorlagen' ? (
        <Vorlagen />
      ) : maske.name === 'einstellungen' ? (
        <Einstellungen />
      ) : maske.name === 'sorten' ? (
        <Sorten />
      ) : maske.name === 'sorte-neu' ? (
        <SorteNeu />
      ) : maske.name === 'sorte' ? (
        <Sorte sorte={maske.sorte} />
      ) : maske.name === 'notfallblatt' ? (
        <Notfallblatt {...(maske.kuerzel ? { kuerzel: maske.kuerzel } : {})} />
      ) : maske.name === 'rundgang' ? (
        <Rundgang kuerzel={maske.kuerzel} />
      ) : maske.name === 'kurzpruefung' ? (
        <KurzpruefungOrt key={maske.code} code={maske.code} {...(maske.von ? { von: maske.von } : {})} />
      ) : maske.name === 'nachfuellen' ? (
        <NachfuellenOrt key={maske.code} code={maske.code} {...(maske.von ? { von: maske.von } : {})} />
      ) : maske.name === 'stromausfall' ? (
        <Stromausfall />
      ) : maske.name === 'push' ? (
        <Push />
      ) : maske.name === 'schreibprobe' ? (
        <Schreibprobe />
      ) : maske.name === 'anmelden' ? (
        <Anmeldung />
      ) : (
        <Heute />
      )}
      {/* Meldezeile fest über Leiste und festem Fuss (Meldezeile.md) */}
      <MeldungZeile />
      {ziel ? <Tabbar ziele={LEISTE_ZIELE} aktiv={ziel} /> : null}
    </div>
  );
}

export function App() {
  return (
    <DienstAnbieter>
      <SitzungAnbieter>
        <BuendelAnbieter>
          <Thema />
          <MeldungAnbieter>
            <LeisteAnbieter>{(imAblauf) => <Masken imAblauf={imAblauf} />}</LeisteAnbieter>
          </MeldungAnbieter>
        </BuendelAnbieter>
      </SitzungAnbieter>
    </DienstAnbieter>
  );
}
