// Baustein Button (design-system/components/Button.md)
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'default' | 'compact';
  block?: boolean;
}

export function Button({ variant = 'primary', size = 'default', block, className, ...rest }: ButtonProps) {
  const klassen = [
    'hv-btn',
    `hv-btn-${variant}`,
    size === 'compact' && 'hv-btn-compact',
    block && 'hv-btn-block',
    className,
  ];
  return <button type="button" {...rest} className={klassen.filter(Boolean).join(' ')} />;
}
