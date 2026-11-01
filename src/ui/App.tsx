import { DienstAnbieter, useNeueVersion } from './dienst.tsx';
import { Heute } from './masken/Heute.tsx';
import { Info } from './masken/Info.tsx';
import { useRoute } from './router.ts';

function Masken() {
  const route = useRoute();
  const { wartet } = useNeueVersion();
  // data-neue-version macht den Zustand für die E2E-Tests sichtbar (TO7), ohne ihn anzuzeigen
  return (
    <div data-neue-version={wartet ? 'wartet' : 'keine'}>{route.name === 'info' ? <Info /> : <Heute />}</div>
  );
}

export function App() {
  return (
    <DienstAnbieter>
      <Masken />
    </DienstAnbieter>
  );
}
