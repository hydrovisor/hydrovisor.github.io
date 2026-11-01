// Baustein Logo (design-system/components/Logo.md): Originaldateien als Inline-SVG, hell farbig, dunkel negativ
import logoFarbig from '../../../design-system/assets/Logos/logo-farbig.svg?raw';
import logoNegativ from '../../../design-system/assets/Logos/logo-negativ.svg?raw';
import claimFarbig from '../../../design-system/assets/Logos/logo-claim-farbig.svg?raw';
import claimNegativ from '../../../design-system/assets/Logos/logo-claim-negativ.svg?raw';

const LOGOS = {
  logo: { farbig: logoFarbig, negativ: logoNegativ },
  claim: { farbig: claimFarbig, negativ: claimNegativ },
} as const;

interface LogoProps {
  kind?: keyof typeof LOGOS;
  variant?: 'auto' | 'farbig' | 'negativ';
  /** Höhe in px; Mindesthöhen logo 24, claim 48 */
  height?: number;
}

export function Logo({ kind = 'logo', variant = 'auto', height = 40 }: LogoProps) {
  const eines = (v: 'farbig' | 'negativ', extra?: string) => (
    <span
      key={v}
      className={extra ? `hv-logo ${extra}` : 'hv-logo'}
      style={{ height: `${height}px` }}
      dangerouslySetInnerHTML={{ __html: LOGOS[kind][v] }}
    />
  );
  if (variant === 'auto') return [eines('farbig', 'hv-logo-on-light'), eines('negativ', 'hv-logo-on-dark')];
  return eines(variant);
}
