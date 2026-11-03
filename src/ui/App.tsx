import { DienstAnbieter, useNeueVersion } from './dienst.tsx';
import { Anmeldung } from './masken/Anmeldung.tsx';
import { Heute } from './masken/Heute.tsx';
import { Info } from './masken/Info.tsx';
import { Muster } from './masken/Muster.tsx';
import { Schreibprobe } from './masken/Schreibprobe.tsx';
import { BuendelAnbieter } from './buendel.tsx';
import { maskeFuer, useRoute } from './router.ts';
import { SitzungAnbieter, useSitzung } from './sitzung.tsx';

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
          <Masken />
        </BuendelAnbieter>
      </SitzungAnbieter>
    </DienstAnbieter>
  );
}
