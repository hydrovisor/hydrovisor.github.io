import { DienstAnbieter, useNeueVersion } from './dienst.tsx';
import { Anmeldung } from './masken/Anmeldung.tsx';
import { Heute } from './masken/Heute.tsx';
import { Info } from './masken/Info.tsx';
import { Muster } from './masken/Muster.tsx';
import { Schreibprobe } from './masken/Schreibprobe.tsx';
import { Messen } from './masken/Messen.tsx';
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
import { BuendelAnbieter } from './buendel.tsx';
import { maskeFuer, useRoute } from './router.ts';
import { SitzungAnbieter, useSitzung } from './sitzung.tsx';
import { Thema } from './thema.tsx';

function Masken() {
  const route = useRoute();
  const { zustand } = useSitzung();
  const { wartet } = useNeueVersion();
  const maske = maskeFuer(route, zustand);
  // data-neue-version macht den Zustand für die E2E-Tests sichtbar (TO7), ohne ihn anzuzeigen
  return (
    <div data-neue-version={wartet ? 'wartet' : 'keine'} data-sitzung={zustand}>
      {maske.name === 'info' ? (
        <Info />
      ) : maske.name === 'muster' ? (
        <Muster />
      ) : maske.name === 'messen' ? (
        <Messen code={maske.code} />
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
        <Saeen {...(maske.box ? { box: maske.box } : {})} />
      ) : maske.name === 'gefaess' ? (
        <Gefaess code={maske.code} />
      ) : maske.name === 'anlage' ? (
        <Anlage {...(maske.kuerzel ? { kuerzel: maske.kuerzel } : {})} />
      ) : maske.name === 'anlage-neu' ? (
        <AnlageNeu />
      ) : maske.name === 'vorlagen' ? (
        <Vorlagen />
      ) : maske.name === 'push' ? (
        <Push />
      ) : maske.name === 'schreibprobe' ? (
        <Schreibprobe />
      ) : maske.name === 'anmelden' ? (
        <Anmeldung />
      ) : (
        <Heute />
      )}
    </div>
  );
}

export function App() {
  return (
    <DienstAnbieter>
      <SitzungAnbieter>
        <BuendelAnbieter>
          <Thema />
          <Masken />
        </BuendelAnbieter>
      </SitzungAnbieter>
    </DienstAnbieter>
  );
}
