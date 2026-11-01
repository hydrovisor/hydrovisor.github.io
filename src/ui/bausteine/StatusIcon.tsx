// Statussymbole aus dem Design System (components/bundle.js, StatusIcon); Kreis, Dreieck und Quadrat je Ton
export type Ton = 'ok' | 'warn' | 'danger' | 'info';

export function StatusIcon({ ton }: { ton: Ton }) {
  const strich = { stroke: 'currentColor', strokeLinecap: 'round' as const };
  const form =
    ton === 'warn' ? (
      <path
        d="M8 1.6l6.6 12H1.4z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    ) : ton === 'danger' ? (
      <rect
        x={1.2}
        y={1.2}
        width={13.6}
        height={13.6}
        rx={3}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
      />
    ) : (
      <circle cx={8} cy={8} r={6.8} fill="none" stroke="currentColor" strokeWidth={1.4} />
    );
  const zeichen =
    ton === 'ok' ? (
      <path d="M4.5 8.5l2.2 2.2 4.8-5" fill="none" {...strich} strokeWidth={2} strokeLinejoin="round" />
    ) : ton === 'warn' ? (
      <>
        <path d="M8 6.2v3.6" {...strich} strokeWidth={1.8} />
        <circle cx={8} cy={11.7} r={1} fill="currentColor" />
      </>
    ) : ton === 'danger' ? (
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" {...strich} strokeWidth={2} />
    ) : (
      <>
        <path d="M8 7.5v4" {...strich} strokeWidth={2} />
        <circle cx={8} cy={4.8} r={1.1} fill="currentColor" />
      </>
    );
  return (
    <svg className="hv-status-icon" viewBox="0 0 16 16" width={16} height={16} aria-hidden="true">
      {form}
      {zeichen}
    </svg>
  );
}
