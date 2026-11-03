// Baustein StatusBadge (design-system/components/StatusBadge.md): Symbol und festes Wort, nie Farbe allein
import type { ReactNode } from 'react';
import { StatusIcon, type Ton } from './StatusIcon.tsx';

const WORT = {
  ok: 'Im grünen Bereich',
  warn: 'Knapp daneben',
  danger: 'Ausserhalb',
  stale: 'veraltet',
  uncertain: 'unsicher',
} as const;

type Badgeton = Ton | 'neutral';

/** `children` ersetzt das Wort nur bei `info` und `neutral` */
export function StatusBadge({ tone, children }: { tone: Badgeton; children?: ReactNode }) {
  const wort = tone === 'info' || tone === 'neutral' ? children : WORT[tone];
  return (
    <span className={`hv-badge hv-badge-${tone}`}>
      {tone === 'neutral' ? null : <StatusIcon ton={tone} />}
      {wort}
    </span>
  );
}
