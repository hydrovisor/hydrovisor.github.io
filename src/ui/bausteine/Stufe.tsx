// Baustein Stufe (design-system/components/Stufe.md): Einstufung der Passung mit Symbol und Wort, nie Farbe allein
import { EINSTUFUNG_NAME, type Einstufung } from '../../domain/passung/passung.ts';
import { StatusIcon } from './StatusIcon.tsx';

const TON: Readonly<Record<Einstufung, 'ok' | 'warn' | 'danger'>> = {
  empfohlen: 'ok',
  moeglich: 'warn',
  nicht_empfohlen: 'danger',
};

export function Stufe({ einstufung }: { einstufung: Einstufung }) {
  const ton = TON[einstufung];
  return (
    <span className={`hv-badge hv-badge-${ton}`}>
      <StatusIcon ton={ton} />
      {EINSTUFUNG_NAME[einstufung]}
    </span>
  );
}
